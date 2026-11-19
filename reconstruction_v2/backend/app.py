"""Authenticated GraftMap photogrammetry service (experimental, no clinical use)."""
from __future__ import annotations

import hmac
import importlib.util
import io
import hashlib
import json
import os
import shutil
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from PIL import Image, ImageOps, UnidentifiedImageError

from .physical_scale import parse_reference
from .reconstruct import ReconstructionError, colmap_available, run_colmap

app = FastAPI(title="GraftMap Reconstruction", version="0.10.58", docs_url=None, redoc_url=None)
DATA_DIR = Path(os.getenv("GRAFTMAP_DATA", "/tmp/graftmap-reconstruction"))
MAX_FILES = min(48, int(os.getenv("GRAFTMAP_MAX_FILES", "48")))
MAX_FILE = 8 * 1024 * 1024
MAX_TOTAL = 96 * 1024 * 1024
MAX_PIXELS = 28_000_000
executor = ThreadPoolExecutor(max_workers=1)
lock = threading.RLock()
jobs: dict[str, dict] = {}


def save_job(job_id: str, value: dict) -> None:
    """Call under lock. Keep terminal status readable after a service restart."""
    root = DATA_DIR / "jobs" / job_id
    root.mkdir(parents=True, exist_ok=True)
    temporary = root / "status.json.tmp"
    temporary.write_text(json.dumps(value, allow_nan=False))
    temporary.replace(root / "status.json")
    jobs[job_id] = value



def authorize(auth: str | None) -> None:
    secret = os.getenv("GRAFTMAP_API_TOKEN", "")
    if len(secret) < 24:
        raise HTTPException(503, "Autenticação ainda não configurada no servidor")
    if not auth or not auth.startswith("Bearer ") or not hmac.compare_digest(auth[7:].encode(), secret.encode()):
        raise HTTPException(401, "Token inválido")


def image_to_jpeg(raw: bytes) -> bytes:
    try:
        Image.MAX_IMAGE_PIXELS = MAX_PIXELS
        with Image.open(io.BytesIO(raw)) as image:
            image.verify()
        with Image.open(io.BytesIO(raw)) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            if max(image.size) < 640 or min(image.size) < 480:
                raise ValueError("Fotografia menor que 640×480 pixels")
            buffer = io.BytesIO()
            image.save(buffer, "JPEG", quality=88, optimize=True)
            return buffer.getvalue()  # EXIF, GPS and original filename are discarded
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(422, "Fotografia inválida ou resolução insuficiente") from exc


def normalized_mask(raw: bytes, size: tuple[int, int]) -> bytes:
    """Mask coordinates refer to the EXIF-normalized photograph."""
    try:
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "PNG" or image.size != size:
                raise ValueError("Mask format or dimensions")
            if image.mode in {"RGBA", "LA"}:
                if image.getchannel("A").getextrema() != (255, 255):
                    raise ValueError("Mask must be opaque")
            elif image.mode not in {"1", "L", "RGB"}:
                raise ValueError("Mask mode not supported")
            gray = image.convert("L")
            extrema = gray.getextrema()
            if extrema[1] == 0:
                raise ValueError("Empty foreground")
            binary = gray.point(lambda value: 255 if value > 0 else 0)
            buffer = io.BytesIO()
            binary.save(buffer, "PNG")
            return buffer.getvalue()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise HTTPException(422, "Máscara inválida. Use PNG opaco, alinhado à foto normalizada, com preto no fundo e branco na área preservada.") from exc


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "0.10.58", "engine": "colmap_sparse", "clinical_validated": False,
            "colmap_installed": colmap_available()}


async def stage_uploads(images: list[UploadFile], case_id: str, job_id: str,
                        masks: list[UploadFile] | None = None) -> tuple[Path, int]:
    if not 12 <= len(images) <= MAX_FILES:
        raise HTTPException(422, f"São necessárias 12 a {MAX_FILES} fotografias")
    if masks and len(masks) != len(images):
        raise HTTPException(422, "Envie uma máscara para cada fotografia, na mesma ordem")
    workspace = DATA_DIR / "jobs" / job_id
    input_path = workspace / "images"
    input_path.mkdir(parents=True, exist_ok=False)
    total = 0
    fingerprints = set()
    try:
        for i, uploaded in enumerate(images):
            raw = await uploaded.read(MAX_FILE + 1)
            if len(raw) > MAX_FILE:
                raise HTTPException(413, "Uma fotografia excedeu 8 MB")
            total += len(raw)
            if total > MAX_TOTAL:
                raise HTTPException(413, "O lote excedeu 96 MB")
            clean = await run_in_threadpool(image_to_jpeg, raw)
            fingerprint = hashlib.sha256(clean).digest()
            if fingerprint in fingerprints:
                raise HTTPException(422, "Há fotografias repetidas. Use uma imagem distinta por ângulo.")
            fingerprints.add(fingerprint)
            (input_path / f"angle_{i:03}.jpg").write_bytes(clean)
            if masks:
                mask_raw = await masks[i].read(MAX_FILE + 1)
                total += len(mask_raw)
                if len(mask_raw) > MAX_FILE or total > MAX_TOTAL:
                    raise HTTPException(413, "Máscaras e fotos excedem o limite de envio")
                with Image.open(io.BytesIO(clean)) as normalized:
                    mask_bytes = normalized_mask(mask_raw, normalized.size)
                mask_dir = workspace / "masks"
                mask_dir.mkdir(exist_ok=True)
                (mask_dir / f"angle_{i:03}.jpg.png").write_bytes(mask_bytes)
        (workspace / "case_id.txt").write_text(case_id)
        return workspace, total
    except Exception:
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    finally:
        for img in [*images, *(masks or [])]:
            await img.close()


def reconstruct_job(job_id: str, workspace: Path, case_id: str, total: int) -> dict:
    try:
        result = run_colmap(workspace / "images", workspace, case_id, total)
        result_path = workspace / "mesh.json"
        temporary = workspace / "mesh.json.tmp"
        temporary.write_text(json.dumps(result, separators=(",", ":"), allow_nan=False))
        temporary.replace(result_path)
        with lock:
            save_job(job_id, {"status": "completed", "case_id": case_id, "path": str(result_path)})
        return result
    except Exception as exc:
        # Do not leak internal process details or personal information through the API.
        safe_error = str(exc) if isinstance(exc, ReconstructionError) else "Falha interna do processamento"
        with lock:
            save_job(job_id, {"status": "failed", "case_id": case_id, "message": safe_error})
        raise ReconstructionError(safe_error) from exc
    finally:
        for p in (workspace / "images", workspace / "masks", workspace / "database.db", workspace / "sparse", workspace / "sparse-independent", workspace / "text", workspace / "sparse.ply"):
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
            else:
                p.unlink(missing_ok=True)
        (workspace / "case_id.txt").unlink(missing_ok=True)
        (workspace / "scale-reference.json").unlink(missing_ok=True)
        (workspace / "hybrid-inputs.json").unlink(missing_ok=True)
        for name in ("stereo-request.json", "stereo-input.npz", "stereo-output.npz", "stereo-output.json"):
            (workspace / name).unlink(missing_ok=True)


@app.post("/v1/jobs", status_code=202)
async def start_job(images: list[UploadFile] = File(...), case_id: str = Form(...),
                    authorization: str | None = Header(None),
                    masks: list[UploadFile] | None = File(None),
                    scale_reference: str | None = Form(None),
                    stereo_refine: bool = Form(False),
                    photo_count: int | None = Form(None)) -> dict:
    authorize(authorization)
    try:
        case = str(uuid.UUID(case_id))
    except ValueError as exc:
        raise HTTPException(422, "case_id deve ser UUID") from exc
    if photo_count is not None and not (1 <= photo_count <= len(images)-12 and len(images) <= 48):
        raise HTTPException(422, "Lote híbrido exige fotos seguidas de pelo menos 12 quadros, até 48 imagens no total.")
    if stereo_refine and not masks:
        raise HTTPException(422, "Refinamento estéreo exige as seleções de todas as fotos.")
    if stereo_refine and importlib.util.find_spec("cv2") is None:
        raise HTTPException(503, "Atualize o servidor para instalar o refinamento estéreo.")
    job_id = uuid.uuid4().hex
    reference = None
    if scale_reference is not None:
        try:
            reference = parse_reference(scale_reference, len(images))
        except (ValueError, TypeError) as exc:
            raise HTTPException(422, str(exc)) from exc
    workspace, total = await stage_uploads(images, case, job_id, masks)
    if reference is not None or stereo_refine or photo_count is not None:
        try:
            if reference is not None:
                (workspace / "scale-reference.json").write_text(json.dumps(reference, allow_nan=False))
            if stereo_refine:
                (workspace / "stereo-request.json").write_text("{}")
            if photo_count is not None:
                (workspace / "hybrid-inputs.json").write_text(json.dumps({"photos": photo_count, "video_frames": len(images)-photo_count}))
        except Exception:
            shutil.rmtree(workspace, ignore_errors=True)
            raise
    with lock:
        save_job(job_id, {"status": "processing", "case_id": case})
    executor.submit(_safe_job, job_id, workspace, case, total)
    return {"job_id": job_id, "status": "processing", "poll": f"/v1/jobs/{job_id}"}


def _safe_job(job_id: str, workspace: Path, case: str, total: int) -> None:
    try:
        reconstruct_job(job_id, workspace, case, total)
    except ReconstructionError:
        pass


def get_job(job_id: str) -> dict | None:
    # Recover completed meshes after service restart, using only safe server-generated IDs.
    if len(job_id) != 32 or any(c not in "0123456789abcdef" for c in job_id):
        return None
    cached = jobs.get(job_id)
    if cached:
        return cached
    root = DATA_DIR / "jobs" / job_id
    mesh = root / "mesh.json"
    if mesh.is_file():
        return {"status": "completed", "path": str(mesh)}
    state = root / "status.json"
    if state.is_file():
        try:
            value = json.loads(state.read_text())
            if value.get("status") == "failed":
                return value
            if value.get("status") == "processing":
                value = {"status": "failed", "message": "O servidor reiniciou durante a reconstrução. Envie novamente as fotografias preservadas no iPad."}
                # Interrupted source images are not retained indefinitely.
                for name in ("images", "masks", "sparse", "sparse-independent"):
                    shutil.rmtree(root / name, ignore_errors=True)
                save_job(job_id, value)
                return value
        except (OSError, ValueError, TypeError, AttributeError):
            return None
    return None


@app.delete("/v1/jobs/{job_id}")
def delete_job(job_id: str, authorization: str | None = Header(None)) -> dict:
    authorize(authorization)
    with lock:
        job = get_job(job_id)
        if not job:
            raise HTTPException(404, "Job não encontrado")
        if job["status"] == "processing":
            raise HTTPException(409, "O processamento ainda está ativo")
        jobs.pop(job_id, None)
        shutil.rmtree(DATA_DIR / "jobs" / job_id, ignore_errors=True)
    return {"status": "deleted"}


@app.get("/v1/jobs/{job_id}")
def job_status(job_id: str, authorization: str | None = Header(None)) -> dict:
    authorize(authorization)
    with lock:
        job = get_job(job_id)
    if job is None:
        raise HTTPException(404, "Job não encontrado (pode ter sido reiniciado)")
    if job["status"] == "completed":
        return {"job_id": job_id, "status": "completed", "mesh_url": f"/v1/jobs/{job_id}/mesh"}
    return {"job_id": job_id, "status": job["status"], **({"message": job["message"]} if "message" in job else {})}


@app.get("/v1/jobs/{job_id}/mesh")
def job_mesh(job_id: str, authorization: str | None = Header(None)) -> dict:
    authorize(authorization)
    with lock:
        job = get_job(job_id)
    if not job or job["status"] != "completed":
        raise HTTPException(404, "Malha ainda indisponível")
    path = Path(job["path"])
    if not path.is_file():
        raise HTTPException(404, "Malha não encontrada em disco")
    return json.loads(path.read_text())


@app.post("/reconstruct")
@app.post("/api/reconstruct")
async def reconstruct_legacy(images: list[UploadFile] = File(...), case_id: str = Form(...),
                             authorization: str | None = Header(None),
                             masks: list[UploadFile] | None = File(None),
                    scale_reference: str | None = Form(None),
                    stereo_refine: bool = Form(False),
                    photo_count: int | None = Form(None)) -> dict:
    """Synchronous compatibility route. Prefer jobs to avoid HTTP timeouts."""
    authorize(authorization)
    try:
        case = str(uuid.UUID(case_id))
    except ValueError as exc:
        raise HTTPException(422, "case_id deve ser UUID") from exc
    if photo_count is not None and not (1 <= photo_count <= len(images)-12 and len(images) <= 48):
        raise HTTPException(422, "Lote híbrido exige fotos seguidas de pelo menos 12 quadros, até 48 imagens no total.")
    if stereo_refine and not masks:
        raise HTTPException(422, "Refinamento estéreo exige as seleções de todas as fotos.")
    if stereo_refine and importlib.util.find_spec("cv2") is None:
        raise HTTPException(503, "Atualize o servidor para instalar o refinamento estéreo.")
    job_id = uuid.uuid4().hex
    reference = None
    if scale_reference is not None:
        try:
            reference = parse_reference(scale_reference, len(images))
        except (ValueError, TypeError) as exc:
            raise HTTPException(422, str(exc)) from exc
    workspace, total = await stage_uploads(images, case, job_id, masks)
    if reference is not None or stereo_refine or photo_count is not None:
        try:
            if reference is not None:
                (workspace / "scale-reference.json").write_text(json.dumps(reference, allow_nan=False))
            if stereo_refine:
                (workspace / "stereo-request.json").write_text("{}")
            if photo_count is not None:
                (workspace / "hybrid-inputs.json").write_text(json.dumps({"photos": photo_count, "video_frames": len(images)-photo_count}))
        except Exception:
            shutil.rmtree(workspace, ignore_errors=True)
            raise
    with lock:
        save_job(job_id, {"status": "processing", "case_id": case})
    try:
        result = await run_in_threadpool(reconstruct_job, job_id, workspace, case, total)
        return result
    except ReconstructionError as exc:
        raise HTTPException(422, str(exc)) from exc
