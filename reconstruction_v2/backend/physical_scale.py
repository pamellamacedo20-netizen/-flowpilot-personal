"""Experimental scale from a rigid square marker observed by reconstructed cameras."""
import json

import numpy as np
from scipy.optimize import least_squares

from .photo_texture import project


def parse_reference(raw: str, image_count: int) -> dict:
    if len(raw.encode("utf-8")) > 100_000:
        raise ValueError("Referência de escala excessiva.")
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise ValueError("Referência de escala inválida.")
    side = value.get("marker_side_mm")
    observations = value.get("observations")
    if not isinstance(side, (int, float)) or isinstance(side, bool) or not np.isfinite(side) or not 2 <= side <= 200:
        raise ValueError("Informe o lado do QR entre 2 e 200 mm.")
    if not isinstance(observations, list) or not 4 <= len(observations) <= image_count:
        raise ValueError("A escala exige QR em pelo menos quatro fotos distintas.")
    indices = []
    for observation in observations:
        if not isinstance(observation, dict):
            raise ValueError("Observação da referência inválida.")
        index = observation.get("image_index")
        corners = np.asarray(observation.get("corners"), dtype=float)
        if (not isinstance(index, int) or isinstance(index, bool) or not 0 <= index < image_count
                or corners.shape != (4, 2) or not np.isfinite(corners).all()
                or np.any(corners < 0) or np.any(corners > 1)):
            raise ValueError("Cantos ou índice da referência inválidos.")
        a, b = corners[1] - corners[0], corners[3] - corners[0]
        if abs(a[0] * b[1] - a[1] * b[0]) < 1e-5:
            raise ValueError("Referência pequena ou degenerada.")
        indices.append(index)
    if len(set(indices)) != len(indices):
        raise ValueError("Fotos repetidas na referência.")
    return value


def estimate_scale(reference: dict, model: dict) -> dict:
    required = {"camera_indices", "camera_matrices", "camera_params", "camera_sizes"}
    if not required.issubset(model):
        raise ValueError("Calibrações das câmeras indisponíveis.")
    positions = {int(index): i for i, index in enumerate(model["camera_indices"])}
    observations = [item for item in reference["observations"] if item["image_index"] in positions]
    if len(observations) < 4:
        raise ValueError("Menos de quatro fotos com QR foram registradas.")
    matrices = np.array([model["camera_matrices"][positions[item["image_index"]]] for item in observations])
    params = np.array([model["camera_params"][positions[item["image_index"]]] for item in observations])
    sizes = np.array([model["camera_sizes"][positions[item["image_index"]]] for item in observations])
    corners = np.array([item["corners"] for item in observations]) * sizes[:, None, :]

    def triangulate(selected):
        result = []
        for corner in range(4):
            origins, directions = [], []
            for index in selected:
                matrix, camera_params = matrices[index], params[index]
                observed = (corners[index, corner] - camera_params[1:3]) / camera_params[0]
                xy = observed.copy()
                for _ in range(12):
                    xy = observed / (1 + camera_params[3] * np.sum(xy * xy))
                ray = matrix[:, :3].T @ np.array([xy[0], xy[1], 1])
                ray /= np.linalg.norm(ray)
                origins.append(-matrix[:, :3].T @ matrix[:, 3])
                directions.append(ray)
            origins, directions = np.asarray(origins), np.asarray(directions)
            cosines = directions @ directions.T
            if np.min(cosines) > np.cos(np.deg2rad(3)):
                raise ValueError("Vistas com paralaxe insuficiente para recuperar escala.")
            planes = np.eye(3)[None] - directions[:, :, None] * directions[:, None, :]
            initial = np.linalg.lstsq(planes.sum(axis=0),
                                     np.einsum("nij,nj->i", planes, origins), rcond=None)[0]

            def residual(point):
                return np.concatenate([project(point[None], matrices[i], params[i])[0][0] - corners[i, corner]
                                       for i in selected])
            fit = least_squares(residual, initial, max_nfev=100)
            if not fit.success or not np.isfinite(fit.x).all():
                raise ValueError("Não foi possível triangular o QR.")
            result.append(fit.x)
        return np.asarray(result)

    # Hold out all views after the first three before using the complete set.
    preview = triangulate(list(range(3)))
    for index in range(3, len(observations)):
        uv, depth = project(preview, matrices[index], params[index])
        if np.any(depth <= 0) or np.max(np.linalg.norm(uv - corners[index], axis=1)) > 3:
            raise ValueError("O QR não foi confirmado pelas vistas independentes.")
    points = triangulate(list(range(len(observations))))
    errors = []
    for index in range(len(observations)):
        uv, depth = project(points, matrices[index], params[index])
        if np.any(depth <= 0):
            raise ValueError("Referência atrás da câmera.")
        errors.extend(np.linalg.norm(uv - corners[index], axis=1))
    if max(errors) > 3:
        raise ValueError("Erro de reprojeção excessivo na referência.")
    edges = np.roll(points, -1, axis=0) - points
    lengths = np.linalg.norm(edges, axis=1)
    if np.min(lengths) <= 1e-12:
        raise ValueError("Referência 3D degenerada.")
    side = float(np.mean(lengths))
    variation = float(np.std(lengths) / side) if side > 0 else np.inf
    diagonals = [np.linalg.norm(points[0] - points[2]), np.linalg.norm(points[1] - points[3])]
    angle_cosines = [abs(np.dot(edges[i], edges[(i + 1) % 4]) / (lengths[i] * lengths[(i + 1) % 4]))
                     for i in range(4)]
    center_error = np.linalg.norm((points[0] + points[2] - points[1] - points[3]) / 2)
    if (variation > .05 or np.max(np.abs(np.asarray(diagonals) / side - np.sqrt(2))) > .08
            or max(angle_cosines) > .1 or center_error > .03 * side):
        raise ValueError("A forma 3D da referência não é consistente com um quadrado rígido.")
    units = side / (reference["marker_side_mm"] / 10)
    if not np.isfinite(units) or units <= 0:
        raise ValueError("Escala degenerada.")
    return {"units_per_cm": float(units), "views": len(observations),
            "max_reprojection_px": float(max(errors)), "side_variation": variation,
            "marker_side_mm": reference["marker_side_mm"]}
