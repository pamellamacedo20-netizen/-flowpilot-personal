"""Compare reconstructed surfaces against a reference point cloud in millimeters."""
import argparse
import json
from pathlib import Path
from uuid import UUID

import numpy as np
from scipy.spatial import cKDTree

from backend.reconstruct import ReconstructionError, read_ply_points

FIT_POINTS = 4
LANDMARKS = 6


def xyz(data, label: str, minimum: int) -> np.ndarray:
    points = np.asarray(data, dtype=float)
    if points.ndim != 2 or points.shape[1] != 3 or len(points) < minimum or not np.isfinite(points).all():
        raise ValueError(f"Coordenadas XYZ inválidas em {label}.")
    return points


def similarity(source: np.ndarray, target: np.ndarray):
    """Fit translation, proper rotation and a single positive scale."""
    source_mean, target_mean = source.mean(axis=0), target.mean(axis=0)
    a, b = source - source_mean, target - target_mean
    for centered in (a, b):
        singular = np.linalg.svd(centered, compute_uv=False)
        if singular[0] <= 0 or singular[-1] < singular[0] * 0.02:
            raise ValueError("Distribua os quatro marcos de alinhamento em profundidade, largura e altura.")
    u, singular, vt = np.linalg.svd(a.T @ b)
    correction = np.ones(3)
    if np.linalg.det(u @ vt) < 0:
        correction[-1] = -1
    rotation = (u * correction) @ vt
    scale = float((singular @ correction) / np.square(a).sum())
    if not np.isfinite(scale) or scale <= 0:
        raise ValueError("Não foi possível obter escala positiva.")
    return scale, rotation, target_mean - scale * (source_mean @ rotation)


def surface_samples(vertices: np.ndarray, faces: np.ndarray, count: int) -> np.ndarray:
    if faces.ndim != 2 or faces.shape[1] != 3 or not len(faces) or faces.dtype.kind not in "iu":
        raise ValueError("A malha precisa de faces triangulares.")
    if faces.min() < 0 or faces.max() >= len(vertices):
        raise ValueError("A malha contém índices de vértice inválidos.")
    triangles = vertices[faces]
    areas = np.linalg.norm(np.cross(triangles[:, 1] - triangles[:, 0],
                                    triangles[:, 2] - triangles[:, 0]), axis=1)
    area_sum = areas.sum()
    if not np.isfinite(area_sum) or area_sum <= 0:
        raise ValueError("A malha não tem superfície válida.")
    rng = np.random.default_rng(2026)
    sampled = triangles[rng.choice(len(triangles), count, p=areas / area_sum)]
    weights = rng.uniform(size=(count, 2))
    reflected = weights.sum(axis=1) > 1
    weights[reflected] = 1 - weights[reflected]
    return (sampled[:, 0] + weights[:, :1] * (sampled[:, 1] - sampled[:, 0])
            + weights[:, 1:] * (sampled[:, 2] - sampled[:, 0]))


def landmark_points(data, label: str) -> np.ndarray:
    points = xyz(data, label, LANDMARKS)
    if len(points) != LANDMARKS or len(np.unique(points, axis=0)) != LANDMARKS:
        raise ValueError(f"Marque exatamente seis pontos distintos em {label}.")
    return points


def summarize(distances: np.ndarray, threshold: float) -> dict:
    return {
        "mediana_mm": float(np.median(distances)),
        "p95_mm": float(np.percentile(distances, 95)),
        "percentual_no_limiar": float(100 * np.mean(distances <= threshold)),
    }


def evaluate(mesh: dict, landmarks: np.ndarray, reference_landmarks: np.ndarray, reference_tree: cKDTree,
             threshold: float, limit: float, count: int) -> dict:
    scale, rotation, offset = similarity(landmarks[:FIT_POINTS], reference_landmarks[:FIT_POINTS])
    errors = np.linalg.norm(scale * landmarks @ rotation + offset - reference_landmarks, axis=1)
    fit_errors, control_errors = errors[:FIT_POINTS], errors[FIT_POINTS:]
    output = {
        "escala_mm_por_unidade": scale,
        "erros_ajuste_mm": fit_errors.tolist(),
        "erros_controle_mm": control_errors.tolist(),
        "alinhamento_aceito": bool(errors.max() <= limit),
    }
    if not output["alinhamento_aceito"]:
        return output
    vertices = xyz(mesh["vertices"], "malha", 3)
    samples = surface_samples(scale * vertices @ rotation + offset, np.asarray(mesh["faces"]), count)
    output["malha_para_referencia"] = summarize(reference_tree.query(samples)[0], threshold)
    output["referencia_para_malha"] = summarize(cKDTree(samples).query(reference_tree.data)[0], threshold)
    return output


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def comparison_inputs(args: argparse.Namespace) -> tuple[dict, dict, dict]:
    separate = (args.fotos, args.video, args.marcos)
    if args.pacote:
        if any(separate):
            raise ValueError("Use --pacote ou os três arquivos separados.")
        bundle = read_json(args.pacote)
        if not isinstance(bundle, dict) or type(bundle.get("schema_version")) is not int or bundle["schema_version"] != 1:
            raise ValueError("Versão de pacote de comparação incompatível.")
        return bundle["photos"], bundle["video"], bundle["landmarks"]
    if not all(separate):
        raise ValueError("Informe --pacote ou --fotos, --video e --marcos juntos.")
    return read_json(args.fotos), read_json(args.video), read_json(args.marcos)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pacote", type=Path, help="JSON da comparação completa exportada pelo GraftMap")
    parser.add_argument("--fotos", type=Path)
    parser.add_argument("--video", type=Path)
    parser.add_argument("--marcos", type=Path, help="JSON de marcos exportado pelo GraftMap")
    parser.add_argument("--referencia-ply", type=Path, required=True, help="nuvem da região de interesse em mm")
    parser.add_argument("--referencia-marcos", type=Path, required=True, help='JSON com "points_mm"')
    parser.add_argument("--limiar-mm", type=float, required=True)
    parser.add_argument("--max-erro-marcos-mm", type=float, required=True)
    parser.add_argument("--amostras", type=int, default=100_000)
    parser.add_argument("--saida", type=Path, required=True)
    args = parser.parse_args()
    if not all(np.isfinite(v) and v > 0 for v in (args.limiar_mm, args.max_erro_marcos_mm)):
        parser.error("Informe limiares positivos e finitos em mm.")
    if not 10_000 <= args.amostras <= 1_000_000:
        parser.error("Use de 10.000 a 1.000.000 amostras.")
    try:
        photos, video, landmarks = comparison_inputs(args)
        case_id = UUID(landmarks["case_id"])
        if any(UUID(mesh["case_id"]) != case_id or mesh["unit"] != "relative" for mesh in (photos, video)):
            raise ValueError("As duas malhas relativas e os marcos devem pertencer à mesma sessão.")
        if photos.get("capture_source", "photos") != "photos" or video.get("capture_source") != "video":
            raise ValueError("Confira a origem dos JSONs de fotos e vídeo.")
        reference = xyz(read_ply_points(args.referencia_ply), "referência", 1000)
        reference = np.unique(reference, axis=0)
        if len(reference) < 1000:
            raise ValueError("A referência precisa de ao menos 1.000 pontos distintos.")
        ref_landmarks = landmark_points(read_json(args.referencia_marcos)["points_mm"], "referência")
        tree = cKDTree(reference)
        result = {"case_id": str(case_id), "limiar_mm": args.limiar_mm,
                  "max_erro_marcos_mm": args.max_erro_marcos_mm, "amostras_por_malha": args.amostras,
                  "pontos_da_referencia": len(reference),
                  "espacamento_mediano_referencia_mm": float(np.median(tree.query(reference, k=2)[0][:, 1])),
                  "metodos": {}}
        for name, mesh in (("photos", photos), ("video", video)):
            points = landmark_points(landmarks[name], name)
            result["metodos"][name] = evaluate(mesh, points, ref_landmarks, tree,
                                               args.limiar_mm, args.max_erro_marcos_mm, args.amostras)
        result["comparavel"] = all(method["alinhamento_aceito"] for method in result["metodos"].values())
        with args.saida.open("x", encoding="utf-8") as output:
            json.dump(result, output, indent=2, allow_nan=False)
        print(f"Relatório salvo em {args.saida}")
        if not result["comparavel"]:
            print("Comparação inconclusiva. Revise os erros dos marcos no relatório.")
    except (OSError, ValueError, KeyError, TypeError, IndexError, ReconstructionError) as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
