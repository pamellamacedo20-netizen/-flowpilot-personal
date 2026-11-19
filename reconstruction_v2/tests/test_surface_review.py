from dataclasses import replace
from types import SimpleNamespace

import numpy as np
import pytest
from PIL import Image

from backend.reconstruct import Geometry, mesh_payload
from backend.surface_review import clip_to_selections, topology_report


def grid():
    x, y = np.meshgrid(np.linspace(-.8, .8, 21), np.linspace(-.8, .8, 21))
    vertices = np.column_stack([x.ravel(), y.ravel(), np.full(x.size, 4.)])
    faces = []
    for j in range(20):
        for i in range(20):
            a = j * 21 + i
            faces.extend([[a, a+1, a+21], [a+1, a+22, a+21]])
    return Geometry(vertices.tolist(), faces, 12, len(vertices), np.full_like(vertices, .5).tolist())


def scene(tmp_path, masks=True):
    images = tmp_path / 'images'
    images.mkdir()
    for i in range(2):
        (images / f'{i}.jpg').touch()
    if masks:
        (tmp_path / 'masks').mkdir()
        for i in range(2):
            pixels = np.zeros((100, 100), dtype=np.uint8)
            pixels[:, :50] = 255
            Image.fromarray(pixels).save(tmp_path / 'masks' / f'{i}.jpg.png')
    matrices = np.repeat(np.eye(3, 4)[None], 2, axis=0)
    matrices[1, 0, 3] = .08
    return images, dict(camera_indices=np.arange(2), camera_matrices=matrices,
                        camera_params=np.array([[100., 50, 50, 0]] * 2), camera_sizes=np.array([[100, 100]] * 2))


def test_no_masks_preserves_geometry_object(tmp_path):
    images, _ = scene(tmp_path, False)
    original = grid()
    result, stats = clip_to_selections(original, {}, images)
    assert result is original and stats is None


def test_multiview_clips_right_half_and_preserves_originals(tmp_path):
    images, model = scene(tmp_path)
    originals = {p: p.read_bytes() for p in (tmp_path / 'masks').iterdir()}
    original = grid()
    snapshot = repr(original)
    result, stats = clip_to_selections(original, model, images)
    assert 300 < len(result.faces) < len(original.faces)
    assert np.max(np.asarray(result.vertices)[:, 0]) <= .08 + 1e-10
    assert stats['removed_faces'] == len(original.faces) - len(result.faces)
    assert stats['registered_views'] == 2
    assert len(stats['conflicts_per_image']) == 2
    assert all(n > 0 for n in stats['conflicts_per_image'])
    assert np.asarray(result.faces).max() < len(result.vertices)
    assert len(result.vertex_colors) == len(result.vertices)
    assert np.allclose(result.vertex_colors, .5)
    assert repr(original) == snapshot
    assert originals == {p: p.read_bytes() for p in originals}


def test_one_supporting_view_is_insufficient(tmp_path):
    images, model = scene(tmp_path)
    model['camera_matrices'][1, 2, 3] = -10
    with pytest.raises(ValueError, match='não sustentam'):
        clip_to_selections(grid(), model, images)


def test_contradictory_selection_rejects_surface(tmp_path):
    images, model = scene(tmp_path)
    pixels = np.zeros((100, 100), dtype=np.uint8)
    pixels[:, 60:] = 255
    Image.fromarray(pixels).save(tmp_path / 'masks/1.jpg.png')
    with pytest.raises(ValueError, match='não sustentam'):
        clip_to_selections(grid(), model, images)


def test_missing_camera_or_mask_rejected(tmp_path):
    images, model = scene(tmp_path)
    with pytest.raises(ValueError, match='câmeras'):
        clip_to_selections(grid(), {}, images)
    (tmp_path / 'masks/1.jpg.png').unlink()
    with pytest.raises(ValueError, match='ausente'):
        clip_to_selections(grid(), model, images)


def test_triangle_center_is_checked_not_only_vertices(tmp_path):
    images, model = scene(tmp_path)
    for p in (tmp_path / 'masks').iterdir():
        pixels = np.full((100, 100), 255, dtype=np.uint8)
        pixels[44:57, 44:57] = 0
        Image.fromarray(pixels).save(p)
    original = grid()
    n = len(original.vertices)
    triangle = [[-.75, -.6, 4], [.75, -.6, 4], [0, .75, 4]]
    original = replace(original, vertices=original.vertices + triangle,
                       faces=original.faces + [[n, n+1, n+2]], vertex_colors=None)
    result, _ = clip_to_selections(original, model, images)
    # Added triangle's vertices are outside the hole but its interior crosses it.
    assert not any(np.array_equal(point, triangle[2]) for point in result.vertices)


def test_topology_closed_open_disconnected_and_nonmanifold():
    tetra = [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]]
    assert topology_report(tetra) == dict(components=1, largest_component_faces=4, boundary_edges=0, nonmanifold_edges=0)
    assert topology_report(tetra[:3])['boundary_edges'] == 3
    disconnected = tetra + (np.asarray(tetra) + 4).tolist()
    assert topology_report(disconnected)['components'] == 2
    # Vertex-only contact does not join two surface patches.
    assert topology_report([[0, 1, 2], [0, 3, 4]])['components'] == 2
    assert topology_report([[0, 1, 2], [1, 0, 3], [0, 1, 4]])['nonmanifold_edges'] == 1
    assert topology_report([])['components'] == 0


def test_payload_reports_fragmentation_without_claiming_coverage():
    result = mesh_payload('test', grid(), 12, 12)
    assert result['quality']['surface_topology']['boundary_edges'] == 80
    assert 'não demonstra cobertura completa' in result['quality']['surface_review']


def test_pipeline_filters_before_texture_projection(tmp_path, monkeypatch):
    from backend import reconstruct as engine
    from backend import photo_texture
    images, model = scene(tmp_path)
    original = grid()
    monkeypatch.setattr(engine.importlib.util, 'find_spec', lambda *_: True)
    def run(arguments, **kwargs):
        output = __import__('pathlib').Path(arguments[3])
        np.savez(output / 'points.npz', points=np.asarray(original.vertices), registered=12, **model)
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(engine.subprocess, 'run', run)
    monkeypatch.setattr(engine, 'create_sparse_surface', lambda *a, **kw: original)
    observed = []
    monkeypatch.setattr(photo_texture, 'create_photo_atlas', lambda geometry, *a: observed.append(len(geometry.faces)) or {})
    payload = engine.run_colmap(images, tmp_path, 'test', 12)
    assert payload['quality']['selection_filter']['removed_faces'] > 0
    assert observed == [len(payload['faces'])]
    assert payload['metrics']['triangle_count'] == len(payload['faces'])


def test_sphere_curvature_preserved_and_external_patch_removed(tmp_path):
    from scipy.spatial import ConvexHull
    images = tmp_path / 'images'
    images.mkdir()
    masks = tmp_path / 'masks'
    masks.mkdir()
    t = np.arange(400) + .5
    z = 1 - 2*t/400
    phi = np.pi * (3 - np.sqrt(5)) * t
    sphere = np.column_stack([np.sqrt(1-z*z)*np.cos(phi), np.sqrt(1-z*z)*np.sin(phi), z])
    faces = ConvexHull(sphere).simplices.tolist()
    vertices = np.vstack([sphere, [[1.8, 0, 0], [1.9, .1, 0], [1.9, 0, .1]]])
    geometry = Geometry(vertices.tolist(), faces + [[400, 401, 402]], 8, 403)
    matrices = []
    yy, xx = np.mgrid[:100, :100]
    radius = 100 / np.sqrt(4**2 - 1)
    mask = (((xx+.5-50)**2 + (yy+.5-50)**2) <= radius**2).astype('uint8') * 255
    for i in range(8):
        eye = 4 * np.array([np.cos(i*np.pi/4), 0, np.sin(i*np.pi/4)])
        forward = -eye / np.linalg.norm(eye)
        right = np.cross(forward, [0, 1, 0])
        up = np.cross(right, forward)
        rotation = np.stack([right, up, forward])
        matrices.append(np.column_stack([rotation, -rotation @ eye]))
        (images / f'{i}.jpg').touch()
        Image.fromarray(mask).save(masks / f'{i}.jpg.png')
    model = dict(camera_indices=np.arange(8), camera_matrices=np.asarray(matrices),
                 camera_params=np.array([[100., 50, 50, 0]]*8), camera_sizes=np.array([[100, 100]]*8))
    result, stats = clip_to_selections(geometry, model, images)
    assert len(result.faces) == len(faces)
    assert stats['removed_faces'] == 1
    assert np.allclose(np.linalg.norm(result.vertices, axis=1), 1)
    assert topology_report(result.faces)['boundary_edges'] == 0
