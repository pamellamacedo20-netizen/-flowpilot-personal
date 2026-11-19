import uuid
import pytest
from backend import app as api


def test_failed_status_survives_restart(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATA_DIR", tmp_path)
    job = uuid.uuid4().hex
    api.save_job(job, {"status": "failed", "message": "Sem correspondências"})
    api.jobs.pop(job)
    assert api.get_job(job)["message"] == "Sem correspondências"


def test_interrupted_status_becomes_actionable_error(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATA_DIR", tmp_path)
    job = uuid.uuid4().hex
    api.save_job(job, {"status": "processing"})
    images = tmp_path / "jobs" / job / "images"
    images.mkdir()
    (images / "sample.jpg").write_bytes(b"private")
    api.jobs.pop(job)
    assert api.get_job(job)["status"] == "failed"
    assert "reiniciou" in api.get_job(job)["message"]
    assert not images.exists()


def test_live_processing_stays_processing(tmp_path, monkeypatch):
    monkeypatch.setattr(api, "DATA_DIR", tmp_path)
    job = uuid.uuid4().hex
    api.save_job(job, {"status": "processing"})
    assert api.get_job(job)["status"] == "processing"
