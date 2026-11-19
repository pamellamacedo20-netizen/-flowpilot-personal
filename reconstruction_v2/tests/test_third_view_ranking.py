import numpy as np
from backend.stereo import third_view_candidates, third_view_support
from test_stereo_third_view import fixture


def distracted_fixture(tmp_path):
    model, points, colors, photo = fixture(tmp_path)
    original_third = model['camera_matrices'][2].copy()
    matrices = list(model['camera_matrices'][:2])
    for x in [.15, .2, .25, .3]:
        matrix = np.eye(3,4)
        matrix[:,:3] = np.diag([-1., 1., -1.])
        eye = np.array([x,0,0])
        matrix[:,3] = -matrix[:,:3] @ eye
        matrices.append(matrix)
    matrices.append(original_third)
    model['camera_matrices'] = np.array(matrices)
    model['camera_params'] = np.repeat(model['camera_params'][:1],7,axis=0)
    model['camera_sizes'] = np.repeat(model['camera_sizes'][:1],7,axis=0)
    model['camera_indices'] = np.arange(7)
    reads = []
    def loader(k,w,h):
        reads.append(k)
        return photo(2,w,h)
    return model, points, colors, loader, reads


def test_farther_useful_view_survives_four_nearer_backwards_views(tmp_path):
    model, points, colors, loader, reads = distracted_fixture(tmp_path)
    chosen = third_view_candidates(points,model,0,1)
    assert [k for k,_ in chosen] == [6]
    supported = third_view_support(points,colors,model,0,1,loader)
    assert supported.sum() > 250
    assert reads == [6]


def test_ranking_requires_no_image_decoding_and_is_deterministic(tmp_path):
    model, points, _, _, reads = distracted_fixture(tmp_path)
    result = third_view_candidates(points,model,0,1)
    assert result == third_view_candidates(points,model,0,1) and not reads
    assert third_view_candidates(points,model,0,1,limit=0) == []
    assert third_view_candidates(points[:0],model,0,1) == []


def test_out_of_frame_candidate_does_not_consume_budget(tmp_path):
    model, points, colors, loader, reads = distracted_fixture(tmp_path)
    # One distracting camera now faces forward but its principal point puts
    # all projections far outside the calibrated image.
    model['camera_matrices'][2] = model['camera_matrices'][6]
    model['camera_params'][2,1] = 1e6
    assert [k for k,_ in third_view_candidates(points,model,0,1)] == [6]
    assert third_view_support(points,colors,model,0,1,loader).sum() > 250
    assert reads == [6]


def test_ranked_candidates_respect_requested_budget(tmp_path):
    model, points, _, _, _ = distracted_fixture(tmp_path)
    for i in range(2,6):
        model['camera_matrices'][i] = model['camera_matrices'][6]
        model['camera_matrices'][i,0,3] -= .1*i
    selected = third_view_candidates(points,model,0,1,limit=2)
    assert len(selected) == 2 and len({k for k,_ in selected}) == 2


def test_second_candidate_prioritizes_a_complementary_region(tmp_path):
    model, points, _, _, _ = distracted_fixture(tmp_path)
    for i,x in enumerate([.8,.9,1.,1.1,1.2],start=2):
        model['camera_matrices'][i] = np.eye(3,4)
        model['camera_matrices'][i,0,3] = -x
        model['camera_params'][i,1] = 600 if i<6 else 60
    chosen = third_view_candidates(points,model,0,1,limit=2)
    assert len(chosen) == 2
    assert chosen[0][0] in (2,3,4,5) and chosen[1][0] == 6
