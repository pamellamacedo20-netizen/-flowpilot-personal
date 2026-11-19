import numpy as np
import pytest
from PIL import Image
from backend.stereo import choose_pairs, pair_working_size, refine_points
from test_stereo import stage_plane


def mixed_plane(tmp_path):
    images, model = stage_plane(tmp_path)
    # A second calibrated group uses a 16:9 central crop of the same 4:3 scene.
    # Cropping changes cy from 240 to 180; the world and focal length stay fixed.
    for i in range(3):
        with Image.open(images/f'{i}.jpg') as image:
            image.crop((0, 60, 640, 420)).save(images/f'{i+3}.jpg', quality=100, subsampling=0)
        with Image.open(tmp_path/'masks'/f'{i}.jpg.png') as image:
            image.crop((0, 60, 640, 420)).save(tmp_path/'masks'/f'{i+3}.jpg.png')
    params = model['camera_params'].copy(); params[:, 2] -= 60
    model['camera_params'] = np.concatenate([model['camera_params'], params])
    model['camera_matrices'] = np.concatenate([model['camera_matrices']]*2)
    model['camera_sizes'] = np.array([[640, 480]]*3+[[640, 360]]*3)
    model['camera_indices'] = np.arange(6)
    return images, model


def test_pair_resolution_uses_calibrated_group_and_limits():
    assert pair_working_size([1280, 960], [640, 480]) == (640, 480)
    assert pair_working_size([1920, 1080], [1280, 720]) == (640, 360)
    assert pair_working_size([480, 640], [600, 800]) == (480, 640)
    for first, second in [([640,480],[640,360]), ([0, 480],[640,480]),
                          ([np.nan, 480],[640,480]), ([640,10000],[640,10000]),
                          ([120,90],[120,90])]:
        assert pair_working_size(first, second) is None


def test_budget_selects_both_compatible_groups(tmp_path):
    _, model = mixed_plane(tmp_path)
    pairs = choose_pairs(model)
    assert len(pairs) >= 4
    assert any(i < 3 and j < 3 for i,j,_ in pairs)
    assert any(i >= 3 and j >= 3 for i,j,_ in pairs)
    assert all((i < 3) == (j < 3) for i,j,_ in pairs)
    counts = np.bincount([k for i,j,_ in pairs for k in (i,j)], minlength=6)
    assert counts.max() <= 2 and len(pairs) <= 12


def test_real_sgbm_mixed_formats_preserves_depth_and_source_files(tmp_path):
    images, model = mixed_plane(tmp_path)
    original_files = {p: p.read_bytes() for p in images.iterdir()}
    original_files.update({p: p.read_bytes() for p in (tmp_path/'masks').iterdir()})
    original_cameras = model['camera_params'].copy()
    points, colors, stats = refine_points(model, images)
    assert stats['pairs_accepted'] >= 4
    assert set(stats['working_sizes']) == {(640, 480), (640, 360)}
    assert np.percentile(np.abs(points[:, 2]-5), 95) < .03
    assert np.median(points[:, 2]) == pytest.approx(5, abs=.01)
    assert colors.shape == points.shape and len(points) <= 30000
    assert np.array_equal(original_cameras, model['camera_params'])
    assert original_files == {p:p.read_bytes() for p in original_files}


def test_one_unpaired_format_does_not_block_valid_pairs(tmp_path):
    images, model = mixed_plane(tmp_path)
    model['camera_matrices'] = model['camera_matrices'][:4]
    model['camera_params'] = model['camera_params'][:4]
    model['camera_sizes'] = model['camera_sizes'][:4]
    model['camera_indices'] = np.arange(4)
    points, _, stats = refine_points(model, images)
    assert stats['pairs_accepted'] >= 2 and len(points) > len(model['points'])
    assert stats['working_sizes'] == [(640,480)]


def test_mixed_formats_pass_through_isolated_worker(tmp_path):
    from backend.reconstruct import create_sparse_surface, refine_surface
    images, model = mixed_plane(tmp_path)
    original = create_sparse_surface(model['points'], registered=12)
    refined, selection, message = refine_surface(original, model, images, tmp_path)
    assert refined is not original
    assert selection is not None
    assert '2 formato(s)' in message
    assert len(refined.faces) > 1.15*len(original.faces)
    assert not list(tmp_path.glob('stereo-*.npz'))
    assert not (tmp_path/'stereo-output.json').exists()
