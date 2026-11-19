import io
import json
from types import SimpleNamespace
import numpy as np
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend import app as api
from backend import reconstruct as engine


def uploads(count=13):
    result=[]
    for i in range(count):
        data=io.BytesIO();Image.new('RGB',(900,700),(i*10,80,90)).save(data,'JPEG')
        result.append(('images',(f'{i}.jpg',data.getvalue(),'image/jpeg')))
    return result


def test_hybrid_validated_staged_and_removed(tmp_path,monkeypatch):
    monkeypatch.setenv('GRAFTMAP_API_TOKEN','hybrid-test-token-123456789000')
    monkeypatch.setattr(api,'DATA_DIR',tmp_path)
    class Pause:
        def submit(self,*args):pass
    monkeypatch.setattr(api,'executor',Pause())
    client=TestClient(api.app)
    auth={'Authorization':'Bearer hybrid-test-token-123456789000'}
    form={'case_id':'72bbd754-c826-46e6-b756-0b20ad5506ed','photo_count':'2'}
    result=client.post('/v1/jobs',data=form,files=uploads(),headers=auth)
    assert result.status_code==422
    assert not (tmp_path/'jobs').exists()
    form['photo_count']='1'
    result=client.post('/v1/jobs',data=form,files=uploads(),headers=auth)
    assert result.status_code==202,result.text
    folder=tmp_path/'jobs'/result.json()['job_id']
    assert json.loads((folder/'hybrid-inputs.json').read_text())==dict(photos=1,video_frames=12)
    monkeypatch.setattr(api,'run_colmap',lambda *_: (_ for _ in ()).throw(engine.ReconstructionError('test')))
    with pytest.raises(engine.ReconstructionError):api.reconstruct_job('hybrid-test',folder,form['case_id'],10)
    assert not (folder/'hybrid-inputs.json').exists()


def test_hybrid_grouped_attempt_and_independent_recovery(tmp_path,monkeypatch):
    images=tmp_path/'images';images.mkdir()
    for i in range(13):(images/f'{i:03}.jpg').touch()
    (tmp_path/'hybrid-inputs.json').write_text('{"photos":1,"video_frames":12}')
    x,y=np.meshgrid(np.linspace(-1,1,25),np.linspace(-1,1,25))
    points=np.column_stack([x.ravel(),y.ravel(),.1*x.ravel()**2])
    calls=[]
    monkeypatch.setattr(engine.importlib.util,'find_spec',lambda *_:True)
    def run(args,**kwargs):
        calls.append(args[-1])
        out=__import__('pathlib').Path(args[3])
        registered=10 if args[-1]=='hybrid' else 13
        np.savez(out/'points.npz',points=points,registered=registered,registered_indices=np.arange(registered),
                 independent=args[-1]=='independent',grouped=args[-1]=='hybrid')
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(engine.subprocess,'run',run)
    payload=engine.run_colmap(images,tmp_path,'case',10)
    assert calls==['hybrid','independent']
    assert payload['capture_source']=='hybrid'
    assert payload['quality']['camera_calibration']=='per_image'
    assert payload['quality']['registered_images']==13
    assert '1 fotos + 12 quadros' in payload['quality']['input_composition']


def test_hybrid_requires_pycolmap_not_shared_camera_cli(tmp_path,monkeypatch):
    (tmp_path/'hybrid-inputs.json').write_text('{}')
    monkeypatch.setattr(engine.importlib.util,'find_spec',lambda *_:None)
    with pytest.raises(engine.ReconstructionError,match='PyCOLMAP'):
        engine.run_colmap(tmp_path/'images',tmp_path,'case',0)
