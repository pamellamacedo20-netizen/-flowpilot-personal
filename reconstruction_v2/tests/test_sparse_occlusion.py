import numpy as np
import pytest
from scipy.spatial import cKDTree
from backend.sparse_occlusion import depth_evidence, contradicted_depth
from backend.stereo import third_view_support
from test_stereo_third_view import fixture


def test_nearby_front_point_contradicts_back_point_but_unknown_is_not_filled():
    evidence = cKDTree([[10.,10.],[10.2,10.]]), np.array([5.,8.])
    uv = np.array([[10.,10.],[10.,10.],[100.,100.]])
    result = contradicted_depth(uv,np.array([8.,5.,100.]),evidence,.1)
    assert result.tolist() == [True,False,False]
    assert not contradicted_depth(uv,np.array([8.,5.,100.]),None,.1).any()


def test_relative_depth_and_absolute_tolerance_leave_nearby_surface():
    evidence = cKDTree([[0.,0.]]), np.array([5.])
    assert contradicted_depth(np.zeros((2,2)),np.array([5.19,5.21]),evidence,.1).tolist() == [False,True]


def test_invalid_tolerance_refused():
    for tolerance in [-1.,np.nan,np.inf]:
        with pytest.raises(ValueError): contradicted_depth(np.zeros((1,2)),np.array([5.]),None,tolerance)


def test_projected_depth_index_ignores_points_behind_camera_or_outside_frame(tmp_path):
    model, _, _, _ = fixture(tmp_path)
    model['points'] = np.array([[0.,0.,-5.],[100.,0.,5.]])
    assert depth_evidence(model,0,(640,480)) is None
    model['points'] = np.empty((0,3))
    assert depth_evidence(model,0,(640,480)) is None


def test_same_color_cannot_support_points_behind_observed_surface(tmp_path):
    model, points, _, _ = fixture(tmp_path)
    eye = -model['camera_matrices'][2,:,:3].T@model['camera_matrices'][2,:,3]
    behind = eye+1.5*(points-eye)
    # Both layers are observed somewhere in the sparse reconstruction. The
    # generic distance-to-cloud gate alone cannot distinguish occlusion.
    model['points'] = np.vstack([points,behind])
    white = np.full((len(points),3),255,dtype=np.uint8)
    def photo(k,w,h):
        return np.full((h,w,3),255,dtype=np.uint8),np.full((h,w),255,dtype=np.uint8)
    assert third_view_support(points,white,model,0,1,photo).all()
    assert not third_view_support(behind,white,model,0,1,photo).any()


def test_world_scale_and_translation_preserve_occlusion_decision(tmp_path):
    model, points, _, _ = fixture(tmp_path)
    shift = np.array([3.,-1.,2.]); scale=2.
    eye = -model['camera_matrices'][2,:,:3].T@model['camera_matrices'][2,:,3]
    behind = eye+1.5*(points-eye)
    model['points'] = scale*np.vstack([points,behind])+shift
    for m in model['camera_matrices']:
        m[:,3] = scale*m[:,3]-m[:,:3]@shift
    white = np.full((len(points),3),255,dtype=np.uint8)
    def photo(k,w,h):
        return np.full((h,w,3),255,dtype=np.uint8),np.full((h,w),255,dtype=np.uint8)
    assert third_view_support(scale*points+shift,white,model,0,1,photo).all()
    assert not third_view_support(scale*behind+shift,white,model,0,1,photo).any()
