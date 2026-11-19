"""Reconstrua uma malha de fotos ou vídeo no serviço GraftMap deste computador."""
import argparse
import json
import os
import time
from tempfile import TemporaryDirectory
from contextlib import ExitStack
from pathlib import Path
from uuid import UUID

import httpx

from video_frames import extract_video_frames


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessao", type=UUID, required=True)
    parser.add_argument("--fotos", type=Path)
    parser.add_argument("--video", type=Path)
    parser.add_argument("--quadros", type=int, default=24, metavar="12–48",
                        help="máximo de quadros selecionados do vídeo (padrão 24)")
    parser.add_argument("--mascaras", type=Path,
                        help="pasta de máscaras PNG, nome foto.jpg.png, alinhadas às fotos normalizadas")
    parser.add_argument("--referencia-json", type=Path,
                        help="arquivo de observações do QR nas fotografias enviadas")
    parser.add_argument("--refinar-estereo", action="store_true",
                        help="refinamento experimental em CPU; exige --fotos e --mascaras")
    parser.add_argument("--saida", type=Path, required=True)
    args = parser.parse_args()
    if not args.fotos and not args.video:
        parser.error("Informe --fotos, --video ou ambos para um lote híbrido.")
    if not 12 <= args.quadros <= 48:
        parser.error("--quadros deve estar entre 12 e 48.")
    if args.refinar_estereo and (args.video or not args.mascaras):
        parser.error("--refinar-estereo exige --fotos e --mascaras.")
    if args.referencia_json and args.video:
        parser.error("--referencia-json é usado com --fotos, na ordem de envio.")
    if args.mascaras and args.video:
        parser.error("--mascaras é usado com --fotos. Prepare máscaras para cada fotografia.")
    if args.saida.exists():
        parser.error("O arquivo de saída já existe. Escolha outro nome.")
    token = os.getenv("GRAFTMAP_API_TOKEN", "")
    if len(token) < 24:
        parser.error("Configure GRAFTMAP_API_TOKEN com o mesmo valor usado no serviço local.")

    capture_source = "hybrid" if args.video and args.fotos else ("video" if args.video else "photos")
    with TemporaryDirectory(prefix="graftmap-frames-") as frames, httpx.Client(
        base_url="http://127.0.0.1:8000", trust_env=False, timeout=120,
        headers={"Authorization": f"Bearer {token}"}
    ) as client:
        try:
            stills = (sorted(path for path in args.fotos.iterdir()
                      if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg"}) if args.fotos else [])
            frame_limit = min(args.quadros, 48-len(stills))
            if args.video and frame_limit < 12:
                raise ValueError("Reserve pelo menos 12 posições para quadros; use até 36 fotos.")
            selected_frames = extract_video_frames(args.video, Path(frames), frame_limit) if args.video else []
            photos = stills + selected_frames
        except (OSError, ValueError) as exc:
            parser.error(str(exc))
        if not 12 <= len(photos) <= 48:
            parser.error("A pasta deve conter 12 a 48 fotos JPEG.")
        masks = []
        if args.mascaras:
            masks = [args.mascaras / (photo.name + ".png") for photo in photos]
            if not all(mask.is_file() for mask in masks):
                parser.error("Falta uma máscara PNG. Cada foto exige um arquivo com o nome completo da foto seguido de .png.")
        with ExitStack() as files:
            uploads = [
                ("images", (f"angle_{i}.jpg", files.enter_context(photo.open("rb")), "image/jpeg"))
                for i, photo in enumerate(photos)
            ]
            uploads.extend(("masks", (f"mask_{i}.png", files.enter_context(mask.open("rb")), "image/png"))
                           for i, mask in enumerate(masks))
            form = {"case_id": str(args.sessao)}
            if args.refinar_estereo:
                form["stereo_refine"] = "true"
            if capture_source == "hybrid":
                form["photo_count"] = str(len(stills))
            if args.referencia_json:
                try:
                    from backend.physical_scale import parse_reference
                    raw_reference = args.referencia_json.read_text()
                    parse_reference(raw_reference, len(photos))
                except (OSError, ValueError, TypeError) as exc:
                    parser.error(str(exc))
                form["scale_reference"] = raw_reference
            start = client.post("/v1/jobs", data=form, files=uploads)
        if start.status_code != 202:
            parser.exit(1, f"Envio recusado ({start.status_code}): {start.text}\n")
        job_id = start.json()["job_id"]
        route = f"/v1/jobs/{job_id}"
        print(f"Processamento {job_id}", flush=True)
        for _ in range(910):
            status = client.get(route)
            status.raise_for_status()
            state = status.json()
            if state["status"] == "failed":
                client.delete(route).raise_for_status()
                parser.exit(1, f"{state['message']}\n")
            if state["status"] == "completed":
                response = client.get(route + "/mesh")
                response.raise_for_status()
                mesh = response.json()
                if UUID(mesh["case_id"]) != args.sessao:
                    parser.exit(1, "O resultado pertence a outra sessão.\n")
                mesh["capture_source"] = capture_source
                missing = mesh.get("quality", {}).get("unregistered_image_indices", [])
                if missing:
                    print("Fotos fora do modelo: " + ", ".join(photos[i].name for i in missing if 0 <= i < len(photos)), flush=True)
                with args.saida.open("x", encoding="utf-8") as output:
                    json.dump(mesh, output, separators=(",", ":"), allow_nan=False)
                client.delete(route).raise_for_status()
                print(f"{mesh['quality']['registered_images']}/{len(photos)} fotos registradas. "
                      f"Malha experimental gravada em {args.saida}.")
                return
            time.sleep(2)
        parser.exit(1, f"Tempo de espera excedido. Consulte o serviço local pelo ID {job_id}.\n")


if __name__ == "__main__":
    main()
