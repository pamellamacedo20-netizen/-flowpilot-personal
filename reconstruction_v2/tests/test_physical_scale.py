import json

import numpy as np
import pytest

from backend.physical_scale import estimate_scale, parse_reference
from backend.photo_texture import project


def fixture(stretch=1):
    square = np.array([[-.1,-.1,0],[.1,-.1,0],[.1,.1*stretch,0],[-.1,.1*stretch,0]])
    centers = [(-.4, 0), (.4, 0), (0, .35), (0, -.35)]
    matrices = np.array([[[1,0,0,-x],[0,1,0,-y],[0,0,1,3]] for x,y in centers], dtype=float)
    params = np.array([[1000, 500, 500, .02]] * 4)
    model = {'camera_indices': np.arange(4), 'camera_matrices': matrices,
             'camera_params': params, 'camera_sizes': np.array([[1000,1000]] * 4)}
    observations = [{'image_index': i, 'corners': (project(square, matrix, param)[0] / 1000).tolist()}
                    for i, (matrix, param) in enumerate(zip(matrices, params))]
    reference = {'marker_side_mm': 20, 'observations': observations}
    return parse_reference(json.dumps(reference), 12), model


def test_known_scale_recovered_with_radial_distortion():
    reference, model = fixture()
    result = estimate_scale(reference, model)
    assert result['units_per_cm'] == pytest.approx(.1, rel=1e-6)
    assert result['views'] == 4
    assert result['max_reprojection_px'] < .001
    # A square of model-side .2 corresponds to four square centimeters.
    assert (.2 / result['units_per_cm']) ** 2 == pytest.approx(4, rel=1e-6)


def test_corrupted_confirmation_view_refuses_scale():
    reference, model = fixture()
    reference['observations'][3]['corners'][0][0] += .02
    with pytest.raises(ValueError):
        estimate_scale(reference, model)


def test_unregistered_marker_views_refuse_scale():
    reference, model = fixture()
    model['camera_indices'] = np.array([1,2,3,4])
    with pytest.raises(ValueError):
        estimate_scale(reference, model)


def test_nonsquare_reference_refused():
    reference, model = fixture(stretch=2)
    with pytest.raises(ValueError):
        estimate_scale(reference, model)


def test_identical_camera_poses_refuse_scale():
    reference, model = fixture()
    model['camera_matrices'][:] = model['camera_matrices'][0]
    for i in range(4):
        reference['observations'][i]['corners'] = reference['observations'][0]['corners']
    with pytest.raises(ValueError):
        estimate_scale(reference, model)


@pytest.mark.parametrize('raw', ['[]', '{}', '{"marker_side_mm":true,"observations":[]}', 'not json'])
def test_malformed_reference_rejected(raw):
    with pytest.raises((ValueError, TypeError)):
        parse_reference(raw, 12)


def test_duplicate_observations_refused():
    reference, _ = fixture()
    reference['observations'][3]['image_index'] = 0
    with pytest.raises(ValueError):
        parse_reference(json.dumps(reference), 12)


def test_reference_http_validation_and_staging(tmp_path, monkeypatch):
    import io
    from PIL import Image
    from fastapi.testclient import TestClient
    from backend import app as api
    monkeypatch.setenv('GRAFTMAP_API_TOKEN', 'test-reference-token-1234567890')
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    class PauseExecutor:
        def submit(self, *args):
            return None
    monkeypatch.setattr(api, 'executor', PauseExecutor())
    files = []
    for index in range(12):
        data = io.BytesIO()
        Image.new('RGB', (900,700), (index*15,70,80)).save(data,'JPEG')
        files.append(('images',(f'{index}.jpg',data.getvalue(),'image/jpeg')))
    reference, _ = fixture()
    client = TestClient(api.app)
    headers = {'Authorization': 'Bearer test-reference-token-1234567890'}
    result = client.post('/v1/jobs', data={'case_id':'72bbd754-c826-46e6-b756-0b20ad5506ed',
                                         'scale_reference':'[]'}, files=files, headers=headers)
    assert result.status_code == 422
    assert not (tmp_path/'jobs').exists()
    result = client.post('/v1/jobs', data={'case_id':'72bbd754-c826-46e6-b756-0b20ad5506ed',
                                         'scale_reference':json.dumps(reference)}, files=files, headers=headers)
    assert result.status_code == 202, result.text
    folder = tmp_path/'jobs'/result.json()['job_id']
    assert json.loads((folder/'scale-reference.json').read_text()) == reference


def test_reference_removed_on_processing_failure(tmp_path, monkeypatch):
    from backend import app as api
    from backend.reconstruct import ReconstructionError
    folder = tmp_path/'workspace'
    (folder/'images').mkdir(parents=True)
    (folder/'scale-reference.json').write_text('{}')
    monkeypatch.setattr(api,'run_colmap',lambda *_: (_ for _ in ()).throw(ReconstructionError('failure')))
    with pytest.raises(ReconstructionError):
        api.reconstruct_job('test-reference-cleanup',folder,'case',100)
    assert not (folder/'scale-reference.json').exists()


@pytest.mark.parametrize('corrupted', [False, True])
def test_scale_result_integrates_without_changing_geometry(tmp_path, monkeypatch, corrupted):
    from types import SimpleNamespace
    from backend import reconstruct as engine
    from backend import photo_texture
    reference, calibration = fixture()
    if corrupted:
        reference['observations'][3]['corners'][0][0] += .02
    (tmp_path/'scale-reference.json').write_text(json.dumps(reference))
    images = tmp_path/'images'
    images.mkdir()
    for index in range(12):
        (images/f'angle_{index:03}.jpg').touch()
    x,y = np.meshgrid(np.linspace(-1,1,25),np.linspace(-1,1,25))
    points = np.column_stack([x.ravel(), y.ravel(), .1*x.ravel()**2])
    monkeypatch.setattr(engine.importlib.util,'find_spec',lambda *_: True)
    monkeypatch.setattr(photo_texture,'create_photo_atlas',lambda *_: {})
    def run(*args, **kwargs):
        data = {key: np.concatenate([value]*3) for key,value in calibration.items() if key != 'camera_indices'}
        data['camera_indices'] = np.arange(12)
        np.savez(tmp_path/'sparse'/'points.npz',points=points,registered=12,
                 registered_indices=np.arange(12),independent=False,**data)
        return SimpleNamespace(returncode=0,stdout='')
    monkeypatch.setattr(engine.subprocess,'run',run)
    result = engine.run_colmap(images,tmp_path,'case',100)
    original = engine.create_sparse_surface(points,12)
    assert result['vertices'] == original.vertices
    assert result['faces'] == original.faces
    if corrupted:
        assert result['quality']['scale_reference_status'] == 'rejected'
        assert 'units_per_cm' not in result['metrics']
    else:
        assert result['metrics']['scale_source'] == 'qr_multiview_experimental'
        assert result['metrics']['units_per_cm'] == pytest.approx(.1,rel=1e-6)
        assert result['quality']['scale_reference_status'] == 'estimated'
