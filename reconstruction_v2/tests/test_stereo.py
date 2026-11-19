from pathlib import Path
import numpy as np
import pytest
from PIL import Image
from backend.stereo import stereo_pair, refine_points, choose_pairs


def plane():
    rng = np.random.default_rng(12)
    left = rng.integers(20, 235, (480, 640, 3), dtype=np.uint8)
    # Project a plane at Z=5 using f=400 and baseline .4: disparity=32.
    right = np.zeros_like(left)
    right[:, :-32] = left[:, 32:]
    mask = np.full((480, 640), 255, dtype=np.uint8)
    x, y = np.meshgrid(np.linspace(-3, 3, 25), np.linspace(-2.5, 2.5, 20))
    sparse = np.column_stack([x.ravel(), y.ravel(), np.full(x.size, 5.)])
    a = np.eye(3, 4); b = a.copy(); b[0, 3] = -.4
    params = np.array([400., 320, 240, 0])
    return left, right, mask, a, b, params, sparse


def test_known_depth_and_world_frame_with_real_sgbm():
    left, right, mask, a, b, params, sparse = plane()
    points, colors = stereo_pair(left, right, mask, mask, a, b, params, params,
                                 [640, 480], [640, 480], sparse)
    assert len(points) > 10000
    assert np.median(np.abs(points[:, 2]-5)) < .01
    assert np.percentile(np.abs(points[:, 2]-5), 95) < .03
    assert colors.shape == points.shape
    # Translate the entire world; camera poses follow the same transformation.
    shift = np.array([3., -1., 2.])
    a2, b2 = a.copy(), b.copy()
    a2[:, 3] -= a2[:, :3] @ shift
    b2[:, 3] -= b2[:, :3] @ shift
    moved, _ = stereo_pair(left, right, mask, mask, a2, b2, params, params,
                           [640, 480], [640, 480], sparse+shift)
    from scipy.spatial import cKDTree
    assert np.percentile(cKDTree(points).query(moved-shift)[0], 95) < .03
    assert np.median(moved[:, 2]) == pytest.approx(7., abs=.01)


def test_flat_texture_and_empty_mask_reject_matches():
    left, right, mask, a, b, params, sparse = plane()
    with pytest.raises(ValueError, match='correspondências'):
        stereo_pair(np.full_like(left, 100), np.full_like(right, 100), mask, mask,
                    a, b, params, params, [640, 480], [640, 480], sparse)
    with pytest.raises(ValueError, match='correspondências'):
        stereo_pair(left, right, np.zeros_like(mask), mask, a, b, params, params,
                    [640, 480], [640, 480], sparse)


def test_identical_poses_rejected():
    left, right, mask, a, b, params, sparse = plane()
    with pytest.raises(ValueError, match='distância'):
        stereo_pair(left, right, mask, mask, a, a, params, params,
                    [640, 480], [640, 480], sparse)


def stage_plane(tmp_path):
    left, _, mask, a, _, params, sparse = plane()
    images = tmp_path/'images'; images.mkdir()
    masks = tmp_path/'masks'; masks.mkdir()
    matrices = []
    for i in range(3):
        view = np.zeros_like(left)
        offset = 32*i
        if offset:
            view[:, :-offset] = left[:, offset:]
        else:
            view = left.copy()
        Image.fromarray(view).save(images/f'{i}.jpg', quality=100, subsampling=0)
        Image.fromarray(mask).save(masks/f'{i}.jpg.png')
        matrix = a.copy(); matrix[0, 3] = -.4*i; matrices.append(matrix)
    model = dict(points=sparse, camera_indices=np.arange(3), camera_matrices=np.asarray(matrices),
                 camera_params=np.array([params]*3), camera_sizes=np.array([[640, 480]]*3))
    return images, model


def test_multiview_refinement_and_input_preservation(tmp_path):
    images, model = stage_plane(tmp_path)
    originals = {p: p.read_bytes() for p in images.iterdir()}
    points, colors, stats = refine_points(model, images)
    assert stats['pairs_accepted'] >= 2
    assert len(points) > 2*len(model['points'])
    assert len(points) <= 30000
    assert np.percentile(np.abs(points[:, 2]-5), 95) < .03
    assert originals == {p: p.read_bytes() for p in originals}
    assert colors.shape == points.shape
    assert len(choose_pairs(model)) <= 12


def test_isolated_worker_returns_refined_surface_and_cleans_temporary_files(tmp_path):
    from backend.reconstruct import create_sparse_surface, refine_surface, surface_area
    images, model = stage_plane(tmp_path)
    original = create_sparse_surface(model['points'], registered=12)
    refined, selection, message = refine_surface(original, model, images, tmp_path)
    assert refined is not original
    assert len(refined.faces) > 1.15*len(original.faces)
    assert selection is not None
    assert 'experimental' in message
    # True plane support spans 6 by 5 world units; unobserved anatomy is absent.
    assert 27 < surface_area(refined) < 33
    assert not list(tmp_path.glob('stereo-*.npz'))
    assert not (tmp_path/'stereo-output.json').exists()


def test_timeout_preserves_exact_original_surface(tmp_path, monkeypatch):
    import subprocess
    from backend import reconstruct as engine
    images, model = stage_plane(tmp_path)
    original = engine.create_sparse_surface(model['points'], registered=12)
    def timeout(*a, **kw):
        raise subprocess.TimeoutExpired('test', 120)
    monkeypatch.setattr(engine.subprocess, 'run', timeout)
    refined, selection, message = engine.refine_surface(original, model, images, tmp_path)
    assert refined is original and selection is None
    assert 'malha inicial mantida' in message
    assert not list(tmp_path.glob('stereo-*.npz'))


def test_stereo_option_http_requires_masks_stages_request_and_cleans(tmp_path, monkeypatch):
    import io
    from fastapi.testclient import TestClient
    from backend import app as api
    from backend.reconstruct import ReconstructionError
    monkeypatch.setenv('GRAFTMAP_API_TOKEN', 'test-stereo-token-123456789000')
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    class Pause:
        def submit(self, *args): pass
    monkeypatch.setattr(api, 'executor', Pause())
    photos, masks = [], []
    for index in range(12):
        data = io.BytesIO(); Image.new('RGB', (900, 700), (index*15, 80, 70)).save(data, 'JPEG')
        photos.append(('images', (f'{index}.jpg', data.getvalue(), 'image/jpeg')))
        data = io.BytesIO(); Image.new('L', (900, 700), 255).save(data, 'PNG')
        masks.append(('masks', (f'{index}.png', data.getvalue(), 'image/png')))
    client = TestClient(api.app)
    headers = {'Authorization': 'Bearer test-stereo-token-123456789000'}
    form = {'case_id': '72bbd754-c826-46e6-b756-0b20ad5506ed', 'stereo_refine': 'true'}
    res = client.post('/v1/jobs', data=form, files=photos, headers=headers)
    assert res.status_code == 422
    assert not (tmp_path/'jobs').exists()
    res = client.post('/v1/jobs', data=form, files=photos+masks, headers=headers)
    assert res.status_code == 202, res.text
    folder = tmp_path/'jobs'/res.json()['job_id']
    assert (folder/'stereo-request.json').is_file()
    for name in ['stereo-input.npz', 'stereo-output.npz', 'stereo-output.json']:
        (folder/name).write_bytes(b'test')
    monkeypatch.setattr(api, 'run_colmap', lambda *_: (_ for _ in ()).throw(ReconstructionError('test')))
    with pytest.raises(ReconstructionError):
        api.reconstruct_job('stereo-test', folder, form['case_id'], 100)
    assert not list(folder.glob('stereo-*'))
    assert not (folder/'images').exists() and not (folder/'masks').exists()


def test_more_faces_with_fragmentation_do_not_replace_initial_surface(tmp_path, monkeypatch):
    from dataclasses import replace
    from types import SimpleNamespace
    from backend import reconstruct as engine
    from backend import surface_review
    images, model = stage_plane(tmp_path)
    tetra = engine.Geometry([[0,0,0],[1,0,0],[0,1,0],[0,0,1]],
                            [[0,1,2],[0,3,1],[0,2,3],[1,3,2]],12,4)
    fragmented = replace(tetra, vertices=tetra.vertices+tetra.vertices,
                          faces=tetra.faces+(np.asarray(tetra.faces)+4).tolist())
    def run(*a, **kw):
        np.savez(tmp_path/'stereo-output.npz', points=np.zeros((120,3)), colors=np.zeros((120,3)))
        (tmp_path/'stereo-output.json').write_text('{"pairs_accepted":2}')
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(engine.subprocess, 'run', run)
    monkeypatch.setattr(engine, 'create_sparse_surface', lambda *a, **kw: fragmented)
    monkeypatch.setattr(surface_review, 'clip_to_selections', lambda mesh, *a: (mesh, None))
    result, _, message = engine.refine_surface(tetra, model, images, tmp_path)
    assert result is tetra
    assert 'malha inicial mantida' in message
