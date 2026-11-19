import subprocess
from types import SimpleNamespace

import numpy as np
import pytest

from backend import reconstruct as engine


def points():
    x, y = np.meshgrid(np.linspace(-1, 1, 25), np.linspace(-1, 1, 25))
    return np.column_stack([x.ravel(), y.ravel(), 0.1 * (x.ravel() ** 2 + y.ravel() ** 2)])


def stage(tmp_path, monkeypatch, registrations, fail_retry=False):
    images = tmp_path / 'images'
    images.mkdir()
    for i in range(12):
        (images / f'angle_{i:03}.jpg').touch()
    calls = []
    monkeypatch.setattr(engine.importlib.util, 'find_spec', lambda *_: True)

    def run(arguments, **_):
        calls.append(arguments)
        if len(calls) == 2 and fail_retry:
            raise subprocess.TimeoutExpired(arguments, 900)
        output = tmp_path / ('sparse-independent' if len(calls) == 2 else 'sparse')
        registered = registrations[len(calls) - 1]
        np.savez(output / 'points.npz', points=points(), registered=registered,
                 registered_indices=np.arange(registered), independent=len(calls) == 2,
                 triangulation_candidates=800, triangulation_accepted=len(points()),
                 triangulation_minimum=1.0)
        return SimpleNamespace(returncode=0, stdout='')
    monkeypatch.setattr(engine.subprocess, 'run', run)
    return images, calls


def test_partial_model_retried_and_better_result_selected(tmp_path, monkeypatch):
    images, calls = stage(tmp_path, monkeypatch, [8, 12])
    result = engine.run_colmap(images, tmp_path, 'case', 100)
    assert len(calls) == 2
    assert calls[1][-1] == 'independent'
    assert result['quality']['registered_images'] == 12
    assert result['quality']['camera_calibration'] == 'per_image'
    assert result['quality']['unregistered_image_indices'] == []
    assert '625/800' in result['quality']['triangulation_review']


@pytest.mark.parametrize('fail_retry', [False, True])
def test_recovery_preserves_better_first_result(tmp_path, monkeypatch, fail_retry):
    images, calls = stage(tmp_path, monkeypatch, [10, 8], fail_retry=fail_retry)
    result = engine.run_colmap(images, tmp_path, 'case', 100)
    assert len(calls) == 2
    assert result['quality']['registered_images'] == 10
    assert result['quality']['unregistered_image_indices'] == [10, 11]


def test_complete_valid_model_skips_second_attempt(tmp_path, monkeypatch):
    images, calls = stage(tmp_path, monkeypatch, [12])
    result = engine.run_colmap(images, tmp_path, 'case', 100)
    assert len(calls) == 1
    assert result['quality']['registered_images'] == 12


def test_both_attempts_without_enough_images_fail(tmp_path, monkeypatch):
    images, calls = stage(tmp_path, monkeypatch, [5, 7])
    with pytest.raises(engine.ReconstructionError):
        engine.run_colmap(images, tmp_path, 'case', 100)
    assert len(calls) == 2


def test_failed_native_run_does_not_reuse_stale_points(tmp_path, monkeypatch):
    images = tmp_path / 'images'
    images.mkdir()
    for i in range(12):
        (images / f'angle_{i:03}.jpg').touch()
    stale = tmp_path / 'sparse'
    stale.mkdir()
    np.savez(stale / 'points.npz', points=points(), registered=12)
    monkeypatch.setattr(engine.importlib.util, 'find_spec', lambda *_: True)
    monkeypatch.setattr(engine.subprocess, 'run', lambda *_, **__: SimpleNamespace(returncode=0, stdout='no_model'))
    with pytest.raises(engine.ReconstructionError):
        engine.run_colmap(images, tmp_path, 'case', 100)
