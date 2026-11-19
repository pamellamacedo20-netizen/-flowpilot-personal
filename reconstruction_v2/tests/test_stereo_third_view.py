from pathlib import Path
import numpy as np
from PIL import Image
from backend.stereo import third_view_support, refine_points
from backend.photo_texture import project
from test_stereo import stage_plane


def fixture(tmp_path):
    images, model = stage_plane(tmp_path)
    points = model['points']
    with Image.open(images/'0.jpg') as im:
        first = np.asarray(im.convert('RGB'))
    uv, _ = project(points, model['camera_matrices'][0], model['camera_params'][0])
    pixels = np.rint(uv).astype(int)
    colors = first[pixels[:,1], pixels[:,0]]
    def photo(k, width, height):
        file = images/f'{k}.jpg'
        with Image.open(file) as im:
            image = np.asarray(im.convert('RGB').resize((width, height)))
        with Image.open(tmp_path/'masks'/(file.name+'.png')) as im:
            mask = np.asarray(im.convert('L').resize((width, height)))
        return image, mask
    return model, points, colors, photo


def test_real_calibrated_third_image_corroborates_points(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    supported = third_view_support(points, colors, model, 0, 1, photo)
    assert supported.sum() > 250
    assert supported.dtype == bool and supported.shape == (len(points),)


def test_different_colors_or_missing_selection_refuse_support(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    def black_mask(k, w, h):
        image, mask = photo(k, w, h)
        return image, np.zeros_like(mask)
    assert not third_view_support(points, colors, model, 0, 1, black_mask).any()
    def wrong_image(k, w, h):
        return np.full((h,w,3), 255, dtype=np.uint8), np.full((h,w),255,dtype=np.uint8)
    assert not third_view_support(points, np.zeros_like(colors), model, 0, 1, wrong_image).any()


def test_same_camera_center_is_not_a_third_view(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    model['camera_matrices'][2] = model['camera_matrices'][0]
    assert not third_view_support(points, colors, model, 0, 1, photo).any()


def test_duplicate_input_identity_is_not_a_third_view(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    model['camera_indices'][2] = model['camera_indices'][0]
    assert not third_view_support(points, colors, model, 0, 1, photo).any()


def test_only_two_views_cannot_corroborate(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    model = {key: value[:2] if key.startswith('camera_') else value for key,value in model.items()}
    assert not third_view_support(points, colors, model, 0, 1, photo).any()


def test_verification_has_bounded_image_reads(tmp_path):
    model, points, colors, _ = fixture(tmp_path)
    model['camera_matrices'] = np.repeat(np.eye(3,4)[None,:,:], 10, axis=0)
    model['camera_matrices'][:,0,3] = -.4*np.arange(10)
    model['camera_params'] = np.repeat(model['camera_params'][:1],10,axis=0)
    model['camera_sizes'] = np.repeat(model['camera_sizes'][:1],10,axis=0)
    model['camera_indices'] = np.arange(10)
    reads = []
    def masked_out(k, w, h):
        reads.append(k)
        return np.zeros((h,w,3),dtype=np.uint8), np.zeros((h,w),dtype=np.uint8)
    assert not third_view_support(points, colors, model, 0, 1, masked_out).any()
    assert 1 <= len(reads) <= 4 and len(reads) == len(set(reads))


def test_refinement_records_third_view_confirmation(tmp_path):
    images, model = stage_plane(tmp_path)
    _, _, stats = refine_points(model, images)
    assert stats['third_view_checked'] is True
    assert stats['corroborated_pair_samples'] >= stats['stereo_points']
