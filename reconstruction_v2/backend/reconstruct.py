"""Sparse photogrammetry via COLMAP; *not* a clinical head-surface measurement."""
from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.spatial import Delaunay, QhullError, cKDTree


class ReconstructionError(RuntimeError):
    pass


@dataclass(frozen=True)
class Geometry:
    vertices: list[list[float]]
    faces: list[list[int]]
    registered_images: int
    source_points: int
    vertex_colors: list[list[float]] | None = None
    point_sampling: str = "all_observed_points"


def read_ascii_ply(path: Path) -> np.ndarray:
    """Read COLMAP's ASCII PLY XYZ vertex table. Reject binary/unexpected PLY."""
    with path.open("rb") as file:
        if file.readline().strip() != b"ply":
            raise ReconstructionError("PLY ausente ou inválido")
        if file.readline().strip() != b"format ascii 1.0":
            raise ReconstructionError("A saída deve ser PLY ASCII")
        count = 0
        in_vertex = False
        props: list[str] = []
        while True:
            line = file.readline()
            if not line:
                raise ReconstructionError("Cabeçalho PLY incompleto")
            value = line.decode("utf-8").strip()
            if value == "end_header":
                break
            if value.startswith("element "):
                in_vertex = value.startswith("element vertex ")
                if in_vertex:
                    count = int(value.split()[-1])
            elif in_vertex and value.startswith("property "):
                props.append(value.split()[-1])
        if count > 1_000_000:
            raise ReconstructionError("Nuvem de pontos excessiva")
        try:
            coords = [props.index(k) for k in ("x", "y", "z")]
        except ValueError as exc:
            raise ReconstructionError("PLY não contém XYZ") from exc
        points = []
        for _ in range(count):
            data = file.readline().split()
            if len(data) <= max(coords):
                raise ReconstructionError("Vértices PLY incompletos")
            points.append([float(data[c]) for c in coords])
    array = np.asarray(points, dtype=np.float64).reshape(-1, 3)
    return array[np.isfinite(array).all(axis=1)]


def registered_image_count(path: Path) -> int:
    # COLMAP text model: one metadata line (image_id qw qx qy qz tx ty tz camera_id name),
    # followed by the optional image-point observation line.
    rows = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    count = 0
    for row in rows:
        if not row or row.startswith("#"):
            continue
        items = row.split()
        # Metadata rows have exactly 10 fields; observation rows have
        # alternating x y point3D_id values (or are empty).
        if len(items) == 10 and items[0].isdigit() and items[8].isdigit():
            count += 1
    return count


def create_sparse_surface(points: np.ndarray, registered: int, max_vertices: int = 5000,
                          colors: np.ndarray | None = None) -> Geometry:
    if registered < 8:
        raise ReconstructionError("Menos de oito fotografias foram registradas pelo COLMAP")
    if colors is not None and (colors.shape != points.shape or not np.isfinite(colors).all()
                               or np.any(colors < 0) or np.any(colors > 255)):
        raise ReconstructionError("Cores incompatíveis com a nuvem de pontos")
    finite = np.isfinite(points).all(axis=1)
    points, unique = np.unique(points[finite], axis=0, return_index=True)
    if colors is not None:
        colors = colors[finite][unique]
    source_points = len(points)
    if len(points) < 120:
        raise ReconstructionError("Pontos 3D insuficientes para uma malha exploratória")
    sampling = "all_observed_points"
    if len(points) > max_vertices:
        if os.getenv("GRAFTMAP_POINT_SAMPLING", "spatial") == "legacy":
            indexes = np.linspace(0, len(points)-1, max_vertices).astype(int)
            sampling = "legacy_order_representatives"
        else:
            from .spatial_sampling import spatial_sample_indices
            indexes = spatial_sample_indices(points, max_vertices)
            sampling = "spatial_farthest_point_representatives"
        points = points[indexes]
        if colors is not None:
            colors = colors[indexes]
    triangles = local_surface_triangles(points)
    if len(triangles) < 50:
        raise ReconstructionError("Malha descontínua: fotografe com maior sobreposição")
    used = np.unique(triangles.ravel())
    index_map = np.full(len(points), -1, dtype=np.int64)
    index_map[used] = np.arange(len(used))
    return Geometry(vertices=points[used].tolist(), faces=index_map[triangles].tolist(),
                    registered_images=registered, source_points=source_points,
                    vertex_colors=(colors[used] / 255.0).tolist() if colors is not None else None,
                    point_sampling=sampling)


def local_surface_triangles(points: np.ndarray) -> np.ndarray:
    """Join nearby samples supported by several overlapping tangent planes."""
    distances, neighbors = cKDTree(points).query(points, k=min(17, len(points)))
    spacing = np.median(distances[:, 1:5], axis=1)
    offsets = points[neighbors] - points[:, None, :]
    centered = offsets - offsets.mean(axis=1, keepdims=True)
    _, spread, axes = np.linalg.svd(centered, full_matrices=False)
    usable = (spread[:, 1] > 1e-4 * spread[:, 0]) & (spread[:, 2] < 0.5 * spread[:, 1])

    votes: dict[tuple[int, int, int], int] = {}
    for center in np.flatnonzero(usable):
        nearby = neighbors[center]
        try:
            local_faces = Delaunay(offsets[center] @ axes[center, :2].T).simplices
        except QhullError:
            continue
        for face in local_faces[(local_faces == 0).any(axis=1)]:
            key = tuple(sorted(nearby[face]))
            votes[key] = votes.get(key, 0) + 1

    candidates = np.asarray([face for face, count in votes.items() if count >= 2],
                            dtype=np.int64).reshape(-1, 3)
    vertices = points[candidates]
    edges = vertices - np.roll(vertices, -1, axis=1)
    lengths = np.linalg.norm(edges, axis=2)
    face_spacing = spacing[candidates]
    edge_limits = 2.6 * np.minimum(face_spacing, np.roll(face_spacing, -1, axis=1))
    cross = np.cross(edges[:, 0], edges[:, 1])
    double_area = np.linalg.norm(cross, axis=1)
    normals = axes[candidates, 2]
    alignment = np.abs(np.einsum("fi,fji->fj", cross, normals))
    supported = ((lengths <= edge_limits).all(axis=1)
                 & (double_area > 0)
                 & (lengths.prod(axis=1) <= 4.0 * double_area * face_spacing.min(axis=1))
                 & (alignment >= 0.8 * double_area[:, None]).all(axis=1)
                 & usable[candidates].all(axis=1))

    # Prefer consensus, then smaller faces. An edge can bound at most two faces.
    edge_faces: dict[tuple[int, int], list[tuple[int, int, np.ndarray]]] = {}
    kept = []
    adjacency: list[list[tuple[int, bool]]] = []
    ranked = sorted(np.flatnonzero(supported),
                    key=lambda i: (-votes[tuple(candidates[i])], lengths[i].max()))
    for i in ranked:
        a, b, c = candidates[i]
        sides = (((a, b), 1, cross[i]), ((b, c), 1, cross[i]), ((a, c), -1, -cross[i]))
        if any(len(edge_faces.get(edge, ())) == 2
               or any(side @ previous_side >= 0
                      for _, _, previous_side in edge_faces.get(edge, ()))
               for edge, _, side in sides):
            continue
        face_index = len(kept)
        kept.append(candidates[i].copy())
        adjacency.append([])
        for edge, direction, side in sides:
            neighbors_on_edge = edge_faces.setdefault(edge, [])
            for neighbor, previous_direction, _ in neighbors_on_edge:
                flip_relative = direction == previous_direction
                adjacency[face_index].append((neighbor, flip_relative))
                adjacency[neighbor].append((face_index, flip_relative))
            neighbors_on_edge.append((face_index, direction, side))

    # Adjacent faces traverse their shared edge in opposite directions.
    flipped: dict[int, bool] = {}
    for start in range(len(kept)):
        if start in flipped:
            continue
        flipped[start] = False
        stack = [start]
        while stack:
            current = stack.pop()
            for neighbor, flip_relative in adjacency[current]:
                if neighbor in flipped:
                    continue
                flipped[neighbor] = flipped[current] ^ flip_relative
                stack.append(neighbor)
    for face_index, flip in flipped.items():
        if flip:
            kept[face_index][[1, 2]] = kept[face_index][[2, 1]]
    return np.asarray(kept, dtype=np.int64).reshape(-1, 3)


def mesh_payload(case_id: str, geometry: Geometry, uploaded_bytes: int, input_images: int) -> dict:
    from .surface_review import topology_report, review_message
    report = topology_report(geometry.faces)
    return {
        "version": 1,
        "case_id": case_id,
        "mesh_kind": "colmap_sparse_exploratory_not_clinical",
        "unit": "relative",
        "vertices": geometry.vertices,
        **({"vertex_colors": geometry.vertex_colors} if geometry.vertex_colors is not None else {}),
        "faces": geometry.faces,
        "metrics": {
            "input_images": input_images,
            "received_bytes": uploaded_bytes,
            "vertex_count": len(geometry.vertices),
            "triangle_count": len(geometry.faces),
            "scale_source": "uncalibrated_sfm_relative",
            "validated_for_clinical_measurement": False,
        },
        "quality": {
            "registered_images": geometry.registered_images,
            "source_points": geometry.source_points,
            "point_sampling": geometry.point_sampling,
            "surface_topology": report,
            "surface_review": review_message(report, None),
            "limitations": ["sparse reconstruction", "unscaled", "not validated for surgery"],
        },
    }


def colmap_available() -> bool:
    return importlib.util.find_spec("pycolmap") is not None or shutil.which("colmap") is not None


def surface_area(geometry: Geometry) -> float:
    vertices = np.asarray(geometry.vertices)[np.asarray(geometry.faces)]
    return float(np.linalg.norm(np.cross(vertices[:, 1]-vertices[:, 0], vertices[:, 2]-vertices[:, 0]), axis=1).sum()/2)


def refine_surface(surface: Geometry, model: dict, image_dir: Path, workspace: Path):
    """Bound work; retain the first surface when stereo has no consistent gain."""
    from .surface_review import clip_to_selections, topology_report
    source = workspace / "stereo-input.npz"
    output = workspace / "stereo-output.npz"
    metadata = output.with_suffix('.json')
    fallback = "Refinamento estéreo sem ganho consistente; malha inicial mantida."
    try:
        output.unlink(missing_ok=True)
        metadata.unlink(missing_ok=True)
        np.savez(source, **model)
        result = subprocess.run([sys.executable, str(Path(__file__).with_name("stereo_worker.py").resolve()),
                                 str(source.resolve()), str(image_dir.resolve()), str(output.resolve())],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120,
                                env={**os.environ, "OMP_NUM_THREADS": "1", "OPENBLAS_NUM_THREADS": "1"})
        if result.returncode != 0 or not output.is_file() or not metadata.is_file():
            return surface, None, fallback
        with np.load(output, allow_pickle=False) as archive:
            points, colors = archive['points'], archive['colors']
        if len(points) > 30000:
            return surface, None, fallback
        refined = create_sparse_surface(points, registered=surface.registered_images,
                                        max_vertices=7000, colors=colors)
        refined, selection = clip_to_selections(refined, model, image_dir)
        before, after = topology_report(surface.faces), topology_report(refined.faces)
        area_ratio = surface_area(refined)/max(surface_area(surface), 1e-30)
        # Extra triangles alone do not establish improvement: bound area changes
        # and require the largest connected patch to occupy at least as much of
        # the result as before. No hole filling or anatomy is inferred.
        if (len(refined.faces) <= 1.15*len(surface.faces) or len(refined.faces) > 16384
                or not .7 <= area_ratio <= 2.0 or after['nonmanifold_edges'] > 0
                or after['largest_component_faces']/len(refined.faces)
                   < before['largest_component_faces']/len(surface.faces)-.05):
            return surface, None, fallback
        stats = json.loads(metadata.read_text())
        message = (f"Refinamento estéreo experimental: {stats['pairs_accepted']} pares, "
                   f"{len(surface.faces)} → {len(refined.faces)} faces. "
                   f"{len(stats.get('working_sizes', [1]))} formato(s) de trabalho aceito(s). "
                   "Novos pontos conferidos em terceira vista, com rejeição de contradições da profundidade esparsa. "
                   "Maior densidade não comprova maior precisão.")
        return refined, selection, message
    except (subprocess.TimeoutExpired, ValueError, KeyError, OSError, ReconstructionError):
        return surface, None, fallback
    finally:
        for file in (source, output, metadata):
            file.unlink(missing_ok=True)


def run_colmap(image_dir: Path, workspace: Path, case_id: str, total_bytes: int) -> dict:
    if importlib.util.find_spec("pycolmap") is None:
        if (workspace / "hybrid-inputs.json").is_file():
            raise ReconstructionError("Reconstrução híbrida exige PyCOLMAP no servidor.")
        payload = run_colmap_cli(image_dir, workspace, case_id, total_bytes)
        if (workspace / "stereo-request.json").is_file():
            payload["quality"]["stereo_refinement"] = "Refinamento estéreo não executado: exige o fluxo PyCOLMAP."
        if (workspace / "masks").is_dir():
            payload["quality"]["surface_review"] += " A conferência 3D das seleções exige PyCOLMAP; no fluxo CLI elas restringiram apenas os pontos das fotos."
        if (workspace / "scale-reference.json").is_file():
            payload["quality"]["scale_reference_status"] = "rejected"
            payload["quality"]["scale_reference_message"] = "A escala por QR exige o fluxo PyCOLMAP."
        return payload

    count = len(list(image_dir.glob("*.jpg")))
    candidates = []
    hybrid_file = workspace / "hybrid-inputs.json"
    for strategy in (("hybrid", True) if hybrid_file.is_file() else (False, True)):
        independent = strategy is True
        if independent and candidates:
            best = candidates[0]
            if bool(best.get("independent", False)):
                break
            if int(best["registered"].item()) == count:
                try:
                    probe = create_sparse_surface(best["points"], registered=count, colors=best.get("colors"))
                    from .surface_review import clip_to_selections
                    clip_to_selections(probe, best, image_dir)
                    break
                except (ReconstructionError, ValueError):
                    pass
        output = workspace / ("sparse-independent" if independent else "sparse")
        output.mkdir(exist_ok=True)
        (output / "points.npz").unlink(missing_ok=True)
        arguments = [sys.executable, str(Path(__file__).with_name("colmap_worker.py").resolve()),
                     str(image_dir.resolve()), str(output.resolve())]
        if independent:
            arguments.append("independent")
        elif strategy == "hybrid":
            arguments.append("hybrid")
        try:
            result = subprocess.run(
                arguments, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=900,
                env={**os.environ, "OMP_NUM_THREADS": "2", "OPENBLAS_NUM_THREADS": "1"})
        except subprocess.TimeoutExpired:
            continue
        if result.returncode != 0 or not (output / "points.npz").is_file():
            continue
        with np.load(output / "points.npz", allow_pickle=False) as model:
            candidates.append({key: model[key] for key in model.files})
    candidates.sort(key=lambda candidate: (int(candidate["registered"].item()), len(candidate["points"])),
                    reverse=True)
    selection_error = None
    for model in candidates:
        try:
            surface = create_sparse_surface(model["points"], registered=int(model["registered"].item()),
                                            colors=model.get("colors"))
        except ReconstructionError:
            continue
        from .surface_review import clip_to_selections, topology_report, review_message
        try:
            surface, selection = clip_to_selections(surface, model, image_dir)
        except ValueError as exc:
            selection_error = str(exc)
            continue
        from .continuity import improve_continuity
        initial_continuity_surface = surface
        surface, continuity_selection, continuity_message = improve_continuity(surface, model, image_dir)
        continuity_accepted = surface is not initial_continuity_surface
        if continuity_selection is not None:
            selection = continuity_selection
        stereo_message = None
        stereo_accepted = False
        if (workspace / "stereo-request.json").is_file():
            initial = surface
            surface, refined_selection, stereo_message = refine_surface(surface, model, image_dir, workspace)
            stereo_accepted = surface is not initial
            if refined_selection is not None:
                selection = refined_selection
        payload = mesh_payload(case_id, surface, uploaded_bytes=total_bytes, input_images=count)
        from .capture_guidance import capture_guidance
        payload["quality"]["capture_guidance"] = capture_guidance(model, surface)
        if "triangulation_candidates" in model:
            candidates_count = int(model["triangulation_candidates"].item())
            accepted_count = int(model["triangulation_accepted"].item())
            minimum_angle = float(model["triangulation_minimum"].item())
            payload["quality"]["triangulation_review"] = (
                f"Triangulação esparsa: {accepted_count}/{candidates_count} pontos com separação angular "
                f"de pelo menos {minimum_angle:g}°. "
                "O filtro reduz pontos pouco condicionados; não comprova precisão física nem preenche regiões ausentes.")
        payload["quality"]["surface_refinement"] = continuity_message
        if continuity_accepted:
            payload["mesh_kind"] = "colmap_ball_pivoting_exploratory_not_clinical"
        if stereo_message is not None:
            payload["quality"]["stereo_refinement"] = stereo_message
        if stereo_accepted:
            payload["mesh_kind"] = "colmap_stereo_refined_exploratory_not_clinical"
            payload["quality"]["limitations"][0] = "experimental stereo refinement"
        if hybrid_file.is_file():
            composition = json.loads(hybrid_file.read_text())
            payload["capture_source"] = "hybrid"
            calibration = "por origem" if bool(model.get("grouped", False)) else "individualmente"
            payload["quality"]["input_composition"] = f"{composition['photos']} fotos + {composition['video_frames']} quadros de vídeo. Câmeras calibradas {calibration}."
        if selection is not None:
            payload["quality"]["selection_filter"] = selection
            payload["quality"]["mask_conflicts"] = selection.get("conflicts_per_image")
            payload["quality"]["surface_review"] = review_message(topology_report(surface.faces), selection)
        payload["quality"]["camera_calibration"] = ("grouped_photos_video" if bool(model.get("grouped", False)) else
                                                     ("per_image" if bool(model.get("independent", False)) else "shared"))
        if "registered_indices" in model:
            registered = sorted(set(int(value) for value in model["registered_indices"]))
            if (len(registered) == surface.registered_images
                    and all(0 <= value < count for value in registered)):
                payload["quality"]["registered_image_indices"] = registered
                payload["quality"]["unregistered_image_indices"] = [i for i in range(count) if i not in registered]
        from .photo_texture import create_photo_atlas
        payload.update(create_photo_atlas(surface, model, image_dir))
        reference_file = workspace / "scale-reference.json"
        if reference_file.is_file():
            from .physical_scale import estimate_scale
            try:
                scale = estimate_scale(json.loads(reference_file.read_text()), model)
                payload["metrics"]["units_per_cm"] = scale["units_per_cm"]
                payload["metrics"]["scale_source"] = "qr_multiview_experimental"
                payload["quality"]["scale_reference_status"] = "estimated"
                payload["quality"]["scale_reference_message"] = (
                    f"QR em {scale['views']} vistas. Erro máximo de reprojeção {scale['max_reprojection_px']:.2f} px. Escala experimental.")
            except ValueError as exc:
                payload["quality"]["scale_reference_status"] = "rejected"
                payload["quality"]["scale_reference_message"] = str(exc)
        return payload
    if selection_error is not None:
        raise ReconstructionError(selection_error)
    raise ReconstructionError("Nenhuma tentativa gerou malha suficiente. Revise foco, sobreposição e área preservada nas fotos.")


def run_colmap_cli(image_dir: Path, workspace: Path, case_id: str, total_bytes: int) -> dict:
    if shutil.which("colmap") is None:
        raise ReconstructionError("COLMAP não instalado no servidor")
    db = workspace / "database.db"
    sparse = workspace / "sparse"
    sparse.mkdir(exist_ok=True)

    def command(*args: str, seconds: int = 600) -> None:
        try:
            result = subprocess.run(["colmap", *args], check=False, timeout=seconds,
                                    cwd=workspace, capture_output=True, text=True,
                                    env={**os.environ, "QT_QPA_PLATFORM": "offscreen"})
        except subprocess.TimeoutExpired as exc:
            raise ReconstructionError("Tempo limite da fotogrametria excedido") from exc
        if result.returncode:
            raise ReconstructionError("COLMAP falhou na fase " + args[0])

    mask_options = (["--ImageReader.mask_path", str(workspace / "masks")]
                    if (workspace / "masks").is_dir() else [])
    command("feature_extractor", "--database_path", str(db), "--image_path", str(image_dir),
            "--ImageReader.camera_model", "SIMPLE_RADIAL", "--ImageReader.single_camera", "1",
            "--SiftExtraction.use_gpu", "0", *mask_options, seconds=400)
    command("exhaustive_matcher", "--database_path", str(db),
            "--SiftMatching.use_gpu", "0", seconds=600)
    command("mapper", "--database_path", str(db), "--image_path", str(image_dir),
            "--output_path", str(sparse), seconds=1200)
    candidate_dirs = [p for p in sparse.iterdir() if p.is_dir()]
    if not candidate_dirs:
        raise ReconstructionError("Nenhum modelo 3D foi obtido das fotografias")
    candidate = max(candidate_dirs, key=lambda p: (p / "points3D.bin").stat().st_size
                    if (p / "points3D.bin").exists() else 0)
    text_dir = workspace / "text"
    text_dir.mkdir(exist_ok=True)
    command("model_converter", "--input_path", str(candidate), "--output_path", str(text_dir),
            "--output_type", "TXT", seconds=120)
    ply = workspace / "sparse.ply"
    command("model_converter", "--input_path", str(candidate), "--output_path", str(ply),
            "--output_type", "PLY", seconds=120)
    # COLMAP usually writes binary PLY; convert using a lightweight parser without dependencies.
    points = read_ply_points(ply)
    registered = registered_image_count(text_dir / "images.txt")
    surface = create_sparse_surface(points, registered=registered)
    return mesh_payload(case_id, surface, uploaded_bytes=total_bytes,
                        input_images=len(list(image_dir.glob("*.jpg"))))


def read_ply_points(path: Path) -> np.ndarray:
    """Read XYZ from little-endian binary or ASCII COLMAP PLY, ignoring RGB."""
    with path.open("rb") as f:
        if f.readline().strip() != b"ply":
            raise ReconstructionError("PLY inválido")
        mode = f.readline().decode().strip()
        num = 0
        current = ""
        fields = []
        while True:
            raw = f.readline()
            if not raw:
                raise ReconstructionError("Cabeçalho PLY incompleto")
            line = raw.decode().strip()
            if line == "end_header":
                break
            if line.startswith("element "):
                tokens = line.split()
                current = tokens[1]
                if current == "vertex":
                    num = int(tokens[2])
            if line.startswith("property ") and current == "vertex":
                t = line.split()
                if t[1] == "list":
                    raise ReconstructionError("Propriedade de vértice não suportada")
                fields.append((t[2], t[1]))
        if num > 1_000_000:
            raise ReconstructionError("Nuvem de pontos excessiva")
        if mode == "format ascii 1.0":
            offsets = [next((i for i, v in enumerate(fields) if v[0] == axis), None) for axis in ("x","y","z")]
            if None in offsets:
                raise ReconstructionError("Sem coordenadas XYZ")
            data = [[float(parts[i]) for i in offsets] for parts in
                    (f.readline().split() for _ in range(num))]
            arr = np.asarray(data, dtype=np.float64)
        elif mode == "format binary_little_endian 1.0":
            kinds = {"float":"<f4", "float32":"<f4", "double":"<f8", "float64":"<f8",
                     "uchar":"u1", "uint8":"u1", "char":"i1", "int8":"i1", "short":"<i2",
                     "ushort":"<u2", "int":"<i4", "uint":"<u4"}
            try:
                dtype = np.dtype([(name, kinds[typ]) for name, typ in fields])
                data = np.frombuffer(f.read(num * dtype.itemsize), dtype=dtype, count=num)
                arr = np.column_stack([data[n].astype(np.float64) for n in ("x","y","z")])
            except (KeyError, ValueError, TypeError) as exc:
                raise ReconstructionError("PLY binário inválido") from exc
        else:
            raise ReconstructionError("Formato PLY não suportado")
    return arr[np.isfinite(arr).all(axis=1)]
