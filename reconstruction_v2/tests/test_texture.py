import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image

from backend.photo_texture import create_photo_atlas, depth_buffer, project
from backend.reconstruct import Geometry


def scene(tmp_path, masked=False):
    images = tmp_path / 'images'
    images.mkdir()
    pixels = np.zeros((100, 100, 3), dtype=np.uint8)
    pixels[:, :, 0] = np.arange(100)[None, :] * 2
    pixels[:, :, 1] = np.arange(100)[:, None] * 2
    pixels[:, :, 2] = 30
    Image.fromarray(pixels).save(images / 'angle_000.jpg', quality=100)
    if masked:
        (tmp_path / 'masks').mkdir()
        Image.new('L', (100, 100), 0).save(tmp_path / 'masks' / 'angle_000.jpg.png')
    model = {
        'camera_indices': np.array([0]),
        'camera_matrices': np.array([[[1,0,0,0],[0,1,0,0],[0,0,1,3]]], dtype=float),
        'camera_params': np.array([[100,50,50,0]], dtype=float),
        'camera_sizes': np.array([[100,100]])}
    geometry = Geometry([[-.5,-.5,0],[.5,-.5,0],[-.5,.5,0]], [[0,1,2]], 12, 120)
    return images, model, geometry


def test_photo_pixels_and_uv_coordinates_are_exported(tmp_path):
    images, model, geometry = scene(tmp_path)
    original = geometry.vertices.copy()
    atlas = create_photo_atlas(geometry, model, images)
    assert atlas['texture_info']['textured_faces'] == 1
    assert atlas['face_view_support'] == [1]
    coordinates = np.asarray(atlas['face_texture_coordinates'])
    assert coordinates.shape == (1,3,2)
    assert ((coordinates >= 0) & (coordinates <= 1)).all()
    with Image.open(io.BytesIO(base64.b64decode(atlas['texture_jpeg_base64']))) as image:
        center = np.asarray(image)[8,8].astype(float)
        assert 60 < center[0] < 110 and 60 < center[1] < 110
        assert abs(center[2] - 30) < 12
    assert geometry.vertices == original


def test_occluded_triangle_uses_fallback(tmp_path):
    images, model, front = scene(tmp_path)
    vertices = front.vertices + [[x,y,1] for x,y,_ in front.vertices]
    geometry = Geometry(vertices, [[0,1,2],[3,4,5]], 12, 120)
    atlas = create_photo_atlas(geometry, model, images)
    assert atlas['texture_info']['textured_faces'] == 1
    assert len(atlas['face_texture_coordinates']) == 2
    assert atlas['face_view_support'] == [1,0]


def test_excluded_photo_pixels_are_not_used(tmp_path):
    images, model, geometry = scene(tmp_path, masked=True)
    assert create_photo_atlas(geometry, model, images) == {'face_view_support':[0]}


def test_old_model_without_cameras_keeps_original_behavior(tmp_path):
    _, _, geometry = scene(tmp_path)
    assert create_photo_atlas(geometry, {}, tmp_path / 'images') == {}


def test_two_views_counted_without_changing_source_geometry(tmp_path):
    images,model,mesh=scene(tmp_path)
    (images/'angle_001.jpg').write_bytes((images/'angle_000.jpg').read_bytes())
    for key in ('camera_matrices','camera_params','camera_sizes'):
        model[key]=np.concatenate([model[key],model[key]])
    model['camera_indices']=np.array([0,1])
    model['camera_matrices'][1,0,3]=.1
    atlas=create_photo_atlas(mesh,model,images)
    assert atlas['face_view_support']==[2]
    assert mesh.faces==[[0,1,2]]


def test_mask_rejects_face_with_center_outside_selection(tmp_path):
    images,model,mesh=scene(tmp_path,masked=True)
    pixels=np.full((100,100),255,dtype='uint8')
    pixels[40:50,40:50]=0
    Image.fromarray(pixels).save(tmp_path/'masks/angle_000.jpg.png')
    atlas=create_photo_atlas(mesh,model,images)
    assert atlas['face_view_support']==[0]
    assert 'texture_jpeg_base64' not in atlas
