import io
import os
import uuid
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

os.environ['GRAFTMAP_API_TOKEN'] = 'test-token-123456789012345678901234'
from backend import app as api
from backend.reconstruct import (Geometry, ReconstructionError, create_sparse_surface,
                                 mesh_payload, read_ply_points, registered_image_count)

client = TestClient(api.app)
TOKEN = {'Authorization': 'Bearer test-token-123456789012345678901234'}


def test_health_no_auth():
    res = client.get('/health')
    assert res.status_code == 200
    assert res.json()['clinical_validated'] is False


def test_wrong_auth():
    res = client.get('/v1/jobs/a', headers={'Authorization': 'Bearer wrong'})
    assert res.status_code == 401


def test_bad_case():
    res = client.post('/v1/jobs', data={'case_id': 'john-doe'}, headers=TOKEN,
                      files=[('images', ('a.jpg', b'bad', 'image/jpeg'))])
    assert res.status_code == 422


def test_min_images():
    res = client.post('/v1/jobs', data={'case_id': str(uuid.uuid4())}, headers=TOKEN,
                      files=[('images', ('a.jpg', b'bad', 'image/jpeg'))])
    assert res.status_code == 422


def test_camera_exif_stripped_and_image_is_valid():
    im = Image.new('RGB', (900, 700), (70, 80, 90))
    exif = Image.Exif()
    exif[270] = 'PRIVATE TEST DESCRIPTION'
    buff = io.BytesIO()
    im.save(buff, format='JPEG', exif=exif)
    clean = api.image_to_jpeg(buff.getvalue())
    with Image.open(io.BytesIO(clean)) as jpeg:
        assert not jpeg.getexif().get(270)
        assert jpeg.size == (900, 700)


def test_mocked_reconstruction_persists_file_and_deletes_sources(tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    job_id = uuid.uuid4().hex
    case = str(uuid.uuid4())
    folder = tmp_path / 'jobs' / job_id
    (folder / 'images').mkdir(parents=True)
    (folder / 'images' / 'a.jpg').write_bytes(b'dummy')
    (folder / 'case_id.txt').write_text(case)
    payload = {'case_id': case, 'vertices': [[1,2,3]], 'faces': []}
    monkeypatch.setattr(api, 'run_colmap', lambda *_: payload)
    result = api.reconstruct_job(job_id, folder, case, 10)
    assert result == payload
    assert not (folder / 'images').exists()
    assert (folder / 'mesh.json').is_file()
    assert client.get(f'/v1/jobs/{job_id}/mesh', headers=TOKEN).json() == payload


def test_failed_job_keeps_no_photos(tmp_path, monkeypatch):
    job_id = uuid.uuid4().hex
    folder = tmp_path / job_id
    (folder / 'images').mkdir(parents=True)
    (folder / 'images' / 'a.jpg').write_bytes(b'dummy')
    (folder / 'sparse-independent').mkdir()
    monkeypatch.setattr(api, 'run_colmap', lambda *_: (_ for _ in ()).throw(ReconstructionError('Fotos sem correspondência')))
    with pytest.raises(ReconstructionError):
        api.reconstruct_job(job_id, folder, str(uuid.uuid4()), 10)
    assert not (folder / 'images').exists()
    assert not (folder / 'sparse-independent').exists()


def test_valid_sparse_mesh_is_nonclinical():
    xx, yy = np.meshgrid(np.linspace(-1,1,30), np.linspace(-1,1,30))
    zz = 0.1 * (xx**2 + yy**2)
    pts = np.column_stack([xx.ravel(), yy.ravel(), zz.ravel()])
    mesh = create_sparse_surface(pts, 12)
    assert len(mesh.vertices) >= 100
    assert len(mesh.faces) >= 50
    payload = mesh_payload(str(uuid.uuid4()), mesh, 20000, 12)
    assert payload['unit'] == 'relative'
    assert payload['metrics']['validated_for_clinical_measurement'] is False
    assert payload['metrics']['vertex_count'] == len(mesh.vertices)
    assert max(max(f) for f in mesh.faces) < len(mesh.vertices)


def test_sparse_low_overlap_rejected():
    pts = np.random.default_rng(11).random((200,3))
    with pytest.raises(ReconstructionError):
        create_sparse_surface(pts, 5)


def test_ascii_ply(tmp_path):
    ply = tmp_path / 'a.ply'
    ply.write_text('ply\nformat ascii 1.0\nelement vertex 2\nproperty float x\nproperty float y\nproperty float z\nend_header\n1 2 3\n4 5 6\n')
    pts = read_ply_points(ply)
    assert pts.tolist() == [[1.,2.,3.],[4.,5.,6.]]


def test_binary_ply(tmp_path):
    import struct
    ply = tmp_path / 'b.ply'
    header = b'ply\nformat binary_little_endian 1.0\nelement vertex 1\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nend_header\n'
    ply.write_bytes(header + struct.pack('<fffB', 1.,2.,3.,255))
    assert read_ply_points(ply).tolist() == [[1.,2.,3.]]


def test_registered_image_parser(tmp_path):
    p = tmp_path / 'images.txt'
    p.write_text('# registered\n1 1 0 0 0 0 0 0 1 angle1.jpg\n\n2 1 0 0 0 0 0 0 1 angle2.jpg\n\n')
    assert registered_image_count(p) == 2


def test_restart_recovers_mesh_and_explicit_delete(tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    job_id = uuid.uuid4().hex
    output = tmp_path / 'jobs' / job_id / 'mesh.json'
    output.parent.mkdir(parents=True)
    output.write_text('{"version":1}')
    api.jobs.pop(job_id, None)
    assert client.get(f'/v1/jobs/{job_id}', headers=TOKEN).json()['status'] == 'completed'
    assert client.get(f'/v1/jobs/{job_id}/mesh', headers=TOKEN).json() == {'version':1}
    assert client.delete(f'/v1/jobs/{job_id}', headers=TOKEN).json()['status'] == 'deleted'
    assert not output.exists()


def test_job_path_traversal_rejected():
    assert api.get_job('../../etc/passwd') is None


def test_portrait_minimum_resolution_is_accepted():
    with io.BytesIO() as jpeg:
        Image.new("RGB", (480, 640)).save(jpeg, "JPEG")
        with Image.open(io.BytesIO(api.image_to_jpeg(jpeg.getvalue()))) as clean:
            assert clean.size == (480, 640)


def _distinct_jpegs():
    for i in range(12):
        jpeg = io.BytesIO()
        Image.new("RGB", (800, 600), (i * 20, 120, 140)).save(jpeg, "JPEG")
        yield jpeg.getvalue()


def test_duplicate_upload_rejected_and_cleaned(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATA_DIR", tmp_path)
    photo = next(_distinct_jpegs())
    files = [("images", (f"{i}.jpg", photo, "image/jpeg")) for i in range(12)]
    response = client.post("/v1/jobs", data={"case_id": str(uuid.uuid4())}, files=files, headers=TOKEN)
    assert response.status_code == 422
    assert "repetidas" in response.json()["detail"]
    assert not list((tmp_path / "jobs").iterdir())


def test_upload_12_photos_accepted_and_sanitized(tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    class PauseExecutor:
        def submit(self, *args):
            return None
    monkeypatch.setattr(api, 'executor', PauseExecutor())
    inputs = [('images', (f'private_name_{i}.jpg', jpeg, 'image/jpeg'))
              for i, jpeg in enumerate(_distinct_jpegs())]
    response = client.post('/v1/jobs', data={'case_id': str(uuid.uuid4())}, files=inputs, headers=TOKEN)
    assert response.status_code == 202, response.text
    state = response.json()
    assert state['status'] == 'processing'
    stored = list((tmp_path / 'jobs').glob('*/images/*.jpg'))
    assert len(stored) == 12
    assert all(p.name.startswith('angle_') for p in stored)
    assert client.get('/v1/jobs/' + state['job_id'], headers=TOKEN).json()['status'] == 'processing'
    import shutil
    shutil.rmtree(tmp_path / 'jobs', ignore_errors=True)
    api.jobs.pop(state['job_id'], None)


def test_uploaded_job_path_matches_public_job_id_for_restart(tmp_path, monkeypatch):
    """Regression: older code generated different IDs for the job and its workspace."""
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)

    class PauseExecutor:
        def submit(self, *args):
            return None

    monkeypatch.setattr(api, 'executor', PauseExecutor())
    request_files = [('images', (f'angle-{i}.jpg', jpeg, 'image/jpeg'))
                     for i, jpeg in enumerate(_distinct_jpegs())]
    case = str(uuid.uuid4())
    result = client.post('/v1/jobs', headers=TOKEN, data={'case_id': case}, files=request_files)
    assert result.status_code == 202
    job = result.json()['job_id']
    workspace = tmp_path / 'jobs' / job
    assert workspace.is_dir()
    assert len(list((workspace / 'images').glob('*.jpg'))) == 12
    # The same workspace must be used for completed results and restart recovery.
    (workspace / 'mesh.json').write_text('{"version":1,"case_id":"' + case + '"}')
    api.jobs.pop(job, None)
    assert client.get(f'/v1/jobs/{job}', headers=TOKEN).json()['status'] == 'completed'
    assert client.get(f'/v1/jobs/{job}/mesh', headers=TOKEN).json()['case_id'] == case
    client.delete(f'/v1/jobs/{job}', headers=TOKEN)
    assert not workspace.exists()


def test_truncated_ply_header_fails_instead_of_looping(tmp_path):
    ply = tmp_path / 'truncated.ply'
    ply.write_bytes(b'ply\nformat binary_little_endian 1.0\nelement vertex 1\n')
    with pytest.raises(ReconstructionError, match='Cabeçalho PLY incompleto'):
        read_ply_points(ply)


def test_sparse_mesh_follows_curvature_and_keeps_missing_sector_open():
    from collections import Counter

    # Sample beyond the equator so a single projection would superimpose layers.
    elevations = np.linspace(0.12, 2.05, 25)
    points = []
    for elevation in elevations:
        samples = round(84 * np.sin(elevation))
        for azimuth in np.linspace(-np.pi, np.pi, samples, endpoint=False):
            if abs(azimuth) < 0.4 and elevation > 0.65:
                continue
            points.append([np.sin(elevation) * np.cos(azimuth),
                           np.sin(elevation) * np.sin(azimuth), np.cos(elevation)])
    mesh = create_sparse_surface(np.asarray(points), 12)
    vertices = np.asarray(mesh.vertices)
    faces = np.asarray(mesh.faces)
    triangles = vertices[faces]
    centers = triangles.mean(axis=1)
    assert len(vertices) > 0.9 * len(points)
    assert (centers[:, 2] < -0.3).sum() > 100
    assert (np.linalg.norm(centers, axis=1) > 0.99).all()
    azimuths = np.arctan2(centers[:, 1], centers[:, 0])
    assert not ((np.abs(azimuths) < 0.3) & (centers[:, 2] < 0.7)).any()
    edges = Counter(tuple(sorted((face[i], face[(i + 1) % 3])))
                    for face in faces for i in range(3))
    assert max(edges.values()) == 2
    directed = Counter((face[i], face[(i + 1) % 3]) for face in faces for i in range(3))
    assert max(directed.values()) == 1


def test_sparse_mesh_keeps_overlapping_layers_separate():
    x, y = np.meshgrid(np.linspace(-1, 1, 23), np.linspace(-1, 1, 23))
    lower = np.column_stack([x.ravel(), y.ravel(), np.zeros(x.size)])
    points = np.vstack([lower, lower + [0.016, 0.014, 0.21]])
    mesh = create_sparse_surface(points, 12)
    triangles = np.asarray(mesh.vertices)[mesh.faces]
    assert (np.ptp(triangles[:, :, 2], axis=1) == 0).all()
    assert set(triangles[:, 0, 2]) == {0.0, 0.21}


def test_photo_colors_follow_deduplication_and_subsampling():
    xx, yy = np.meshgrid(np.linspace(-1, 1, 30), np.linspace(-1, 1, 30))
    points = np.column_stack([xx.ravel(), yy.ravel(), 0.1 * xx.ravel()**2])
    colors = np.column_stack([(points[:, 0] + 1) * 120,
                              (points[:, 1] + 1) * 120, np.full(len(points), 64)])
    mesh = create_sparse_surface(np.vstack([points, points[:20]]), 12, max_vertices=500,
                                 colors=np.vstack([colors, colors[:20]]))
    vertices = np.asarray(mesh.vertices)
    actual = np.asarray(mesh.vertex_colors) * 255
    assert np.allclose(actual[:, 0], (vertices[:, 0] + 1) * 120)
    assert np.allclose(actual[:, 1], (vertices[:, 1] + 1) * 120)
    assert np.allclose(actual[:, 2], 64)
    assert mesh_payload(str(uuid.uuid4()), mesh, 1000, 12)['vertex_colors'] == mesh.vertex_colors


def test_incompatible_photo_colors_rejected():
    with pytest.raises(ReconstructionError):
        create_sparse_surface(np.ones((200, 3)), 12, colors=np.ones((2, 3)))


def mask_image(size=(900, 700), color=255, mode='L'):
    buffer = io.BytesIO()
    Image.new(mode, size, color).save(buffer, 'PNG')
    return buffer.getvalue()


def test_masks_normalized_without_changing_original_photo():
    photo = Image.new('RGB', (900, 700), (120, 130, 140))
    raw = io.BytesIO()
    photo.save(raw, 'JPEG')
    original = raw.getvalue()
    clean = api.image_to_jpeg(original)
    mask = api.normalized_mask(mask_image(), (900, 700))
    with Image.open(io.BytesIO(mask)) as image:
        assert image.mode == 'L' and image.getextrema() == (255, 255)
    assert original == raw.getvalue()
    with Image.open(io.BytesIO(clean)) as image:
        assert image.size == (900, 700)


@pytest.mark.parametrize('raw', [mask_image(size=(5, 5)), mask_image(color=0),
                                mask_image(mode='RGBA', color=(255, 255, 255, 0)), b'not png'])
def test_invalid_masks_rejected(raw):
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as error:
        api.normalized_mask(raw, (900, 700))
    assert error.value.status_code == 422


def test_masks_written_with_colmap_names_and_erased_after_job(tmp_path, monkeypatch):
    import asyncio
    from starlette.datastructures import UploadFile

    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    case = str(uuid.uuid4())
    job = uuid.uuid4().hex
    photos = []
    masks = []
    for i in range(12):
        buffer = io.BytesIO()
        Image.new('RGB', (900, 700), (i * 15, 70, 80)).save(buffer, 'JPEG')
        photos.append(UploadFile(io.BytesIO(buffer.getvalue()), filename=f'{i}.jpg'))
        masks.append(UploadFile(io.BytesIO(mask_image()), filename=f'{i}.png'))
    folder, total = asyncio.run(api.stage_uploads(photos, case, job, masks))
    assert len(list((folder / 'masks').glob('*.jpg.png'))) == 12
    assert total > 0
    monkeypatch.setattr(api, 'run_colmap', lambda *_: {'case_id': case})
    api.reconstruct_job(job, folder, case, total)
    assert not (folder / 'masks').exists()
    assert not (folder / 'images').exists()
    assert (folder / 'mesh.json').is_file()


def test_wrong_mask_count_refused_before_staging(tmp_path, monkeypatch):
    import asyncio
    from fastapi import HTTPException
    from starlette.datastructures import UploadFile

    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    photos = [UploadFile(io.BytesIO(b'x')) for _ in range(12)]
    masks = [UploadFile(io.BytesIO(mask_image()))]
    with pytest.raises(HTTPException):
        asyncio.run(api.stage_uploads(photos, str(uuid.uuid4()), uuid.uuid4().hex, masks))
    assert not (tmp_path / 'jobs').exists()


@pytest.mark.parametrize('route', ['/reconstruct', '/api/reconstruct'])
def test_legacy_routes_keep_working_without_masks(route, tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    monkeypatch.setattr(api, 'run_colmap', lambda *_: {'version': 1})
    files = [('images', (f'{i}.jpg', jpeg, 'image/jpeg'))
             for i, jpeg in enumerate(_distinct_jpegs())]
    response = client.post(route, headers=TOKEN, data={'case_id': str(uuid.uuid4())}, files=files)
    assert response.status_code == 200
    assert response.json() == {'version': 1}


def test_http_jobs_accept_aligned_masks(tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'DATA_DIR', tmp_path)
    class PauseExecutor:
        def submit(self, *args):
            return None
    monkeypatch.setattr(api, 'executor', PauseExecutor())
    photos = list(_distinct_jpegs())
    with Image.open(io.BytesIO(photos[0])) as photo:
        size = photo.size
    files = [('images', (f'{i}.jpg', jpeg, 'image/jpeg')) for i, jpeg in enumerate(photos)]
    files += [('masks', (f'{i}.png', mask_image(size), 'image/png')) for i in range(len(photos))]
    response = client.post('/v1/jobs', headers=TOKEN, data={'case_id': str(uuid.uuid4())}, files=files)
    assert response.status_code == 202, response.text
    folder = tmp_path / 'jobs' / response.json()['job_id']
    assert len(list((folder / 'masks').glob('*.jpg.png'))) == 12



def test_opaque_rgba_masks_from_ipad_are_accepted():
    raw = mask_image(mode='RGBA', color=(255, 255, 255, 255))
    result = api.normalized_mask(raw, (900, 700))
    with Image.open(io.BytesIO(result)) as mask:
        assert mask.mode == 'L'
        assert mask.getextrema() == (255, 255)
