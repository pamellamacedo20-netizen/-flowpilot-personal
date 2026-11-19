"""Conservative multi-view ROI clipping and topology reporting; no hole filling."""
from dataclasses import replace
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation

from .photo_texture import project


def clip_to_selections(geometry, model: dict, image_dir: Path):
    """Keep original faces only when seven samples fit all observed selections.

    A selection is an object silhouette constraint, including occluded surfaces.
    It is not a visibility test or anatomical segmentation. Two registered views
    must fully support each face. Cameras looking away or outside the image do
    not veto a face. A two-pixel border tolerance handles raster rounding.
    """
    masks = image_dir.parent / 'masks'
    if not masks.is_dir():
        return geometry, None
    required = {'camera_indices', 'camera_matrices', 'camera_params', 'camera_sizes'}
    if not required.issubset(model):
        raise ValueError('Conferência das seleções exige câmeras registradas pelo PyCOLMAP.')
    files = sorted(image_dir.glob('*.jpg'))
    faces = np.asarray(geometry.faces, dtype=np.int64)
    vertices = np.asarray(geometry.vertices, dtype=np.float64)
    triangles = vertices[faces]
    samples = np.concatenate([triangles, (triangles + np.roll(triangles, -1, axis=1)) / 2,
                              triangles.mean(axis=1, keepdims=True)], axis=1)
    support = np.zeros(len(faces), dtype=np.int32)
    veto = np.zeros(len(faces), dtype=bool)
    views = 0
    conflicts = np.zeros(len(files), dtype=np.int64)
    for index, matrix, params, size in zip(model['camera_indices'], model['camera_matrices'],
                                          model['camera_params'], model['camera_sizes']):
        mask_file = masks / (files[int(index)].name + '.png')
        if not mask_file.is_file():
            raise ValueError('Seleção ausente para uma fotografia registrada.')
        with Image.open(mask_file) as image:
            mask = np.asarray(image.convert('L')) > 0
        mask = binary_dilation(mask, iterations=2)
        uv, depth = project(samples.reshape(-1, 3), matrix, params)
        uv, depth = uv.reshape(-1, 7, 2), depth.reshape(-1, 7)
        width, height = size
        in_frame = (np.isfinite(uv).all(axis=2) & (depth > 0)
                    & (uv[:, :, 0] >= 0) & (uv[:, :, 0] < width)
                    & (uv[:, :, 1] >= 0) & (uv[:, :, 1] < height))
        pixel = np.floor(np.nan_to_num(uv, nan=0, posinf=0, neginf=0)
                         * [mask.shape[1] / width, mask.shape[0] / height])
        px = np.clip(pixel[:, :, 0], 0, mask.shape[1] - 1).astype(int)
        py = np.clip(pixel[:, :, 1], 0, mask.shape[0] - 1).astype(int)
        inside = mask[py, px]
        contradicted = (in_frame & ~inside).any(axis=1)
        conflicts[int(index)] = int(contradicted.sum())
        veto |= contradicted
        support += (in_frame & inside).all(axis=1)
        views += 1
    keep = ~veto & (support >= 2)
    remaining = faces[keep]
    if views < 2 or len(remaining) < 50:
        raise ValueError('Seleções entre vistas não sustentam 50 faces. Revise enquadramento e seleções; nenhuma superfície foi inventada.')
    used = np.unique(remaining.ravel())
    mapping = np.full(len(vertices), -1, dtype=np.int64)
    mapping[used] = np.arange(len(used))
    colors = None if geometry.vertex_colors is None else np.asarray(geometry.vertex_colors)[used].tolist()
    clipped = replace(geometry, vertices=vertices[used].tolist(), faces=mapping[remaining].tolist(),
                      vertex_colors=colors)
    return clipped, {'method': 'multiview_selection_samples', 'registered_views': views,
                     'input_faces': len(faces), 'retained_faces': len(remaining),
                     'removed_faces': int((~keep).sum()), 'samples_per_face': 7,
                     'conflicts_per_image': conflicts.tolist()}


def topology_report(faces) -> dict:
    """Components share an edge, not merely a vertex; count open/nonmanifold edges."""
    faces = np.asarray(faces, dtype=np.int64).reshape(-1, 3)
    parents = np.arange(len(faces))
    counts = np.ones(len(faces), dtype=int)

    def find(index):
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    edges = {}
    for i, face in enumerate(faces):
        for a, b in zip(face, np.roll(face, -1)):
            edge = tuple(sorted((int(a), int(b))))
            if edge in edges:
                previous, count = edges[edge]
                left, right = find(i), find(previous)
                if left != right:
                    if counts[left] < counts[right]:
                        left, right = right, left
                    parents[right] = left
                    counts[left] += counts[right]
                edges[edge] = (previous, count + 1)
            else:
                edges[edge] = (i, 1)
    roots = [i for i in range(len(faces)) if find(i) == i]
    return {'components': len(roots), 'largest_component_faces': int(max((counts[i] for i in roots), default=0)),
            'boundary_edges': sum(count == 1 for _, count in edges.values()),
            'nonmanifold_edges': sum(count > 2 for _, count in edges.values())}


def review_message(report: dict, selection: dict | None) -> str:
    result = (f"Superfície: {report['components']} componente(s), {report['boundary_edges']} arestas de borda aberta, "
              f"{report['nonmanifold_edges']} arestas com mais de duas faces. ")
    if selection is not None:
        result += f"Conferência das seleções: {selection['removed_faces']} de {selection['input_faces']} faces removidas. "
    return result + 'Essa conferência não demonstra cobertura completa da cabeça nem precisão física.'
