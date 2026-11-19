from types import SimpleNamespace as S
import numpy as np
import pytest
from backend.triangulation_quality import triangulation_angle, supported_samples


def test_wide_baseline_is_supported():
    assert triangulation_angle([0, 0, 0], [[1, 0, 2], [-1, 0, 2]]) == pytest.approx(53.130102)


def test_nearly_parallel_and_opposite_rays_rejected():
    assert triangulation_angle([0, 0, 0], [[0, 0, 2], [.001, 0, 2]]) < 1
    assert triangulation_angle([0, 0, 0], [[0, 0, 2], [0, 0, -2]]) == 0


@pytest.mark.parametrize('point,centers', [([0, 0, 0], []), ([0, 0, 0], [[0, 0, 0]]),
    ([np.nan, 0, 0], [[1, 0, 2], [-1, 0, 2]]), ([0, 0, 0], [[np.inf, 0, 2]]),
    ([0, 0, 0], [[1, 2]])])
def test_invalid_evidence_has_no_angle(point, centers):
    assert triangulation_angle(point, centers) == 0


def sample(ids):
    return S(xyz=np.array([0., 0., 0.]), color=np.array([12, 34, 56]),
             track=S(elements=[S(image_id=i) for i in ids]))


def test_filters_tracks_and_preserves_exact_point_objects():
    good, narrow, duplicate, unknown = [sample(ids) for ids in [[1, 2, 3], [1, 3], [1, 1, 1], [1, 999]]]
    accepted, angles = supported_samples([good, narrow, duplicate, unknown],
                                      {1: [0, 0, 2], 2: [1, 0, 2], 3: [.001, 0, 2]})
    assert len(accepted) == 1 and accepted[0] is good
    assert angles.shape == (1,) and angles[0] > 1


@pytest.mark.parametrize('threshold', [0, -1, 90, np.nan])
def test_invalid_threshold_refused(threshold):
    with pytest.raises(ValueError): supported_samples([], {}, threshold)
