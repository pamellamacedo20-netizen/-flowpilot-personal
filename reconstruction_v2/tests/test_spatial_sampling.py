import numpy as np
import pytest
from scipy.spatial import cKDTree
from backend.spatial_sampling import spatial_sample_indices
from backend.reconstruct import create_sparse_surface


def cloud():
    rng=np.random.default_rng(71)
    dense=rng.uniform(0,.08,(900,2))
    spread=rng.uniform(-1,1,(100,2))
    return np.unique(np.column_stack([np.vstack([dense,spread]),np.zeros(1000)]),axis=0)


def test_balanced_sample_reduces_worst_covered_distance():
    points=cloud();original=points.copy()
    legacy=np.linspace(0,len(points)-1,100).astype(int)
    sampled=spatial_sample_indices(points,100)
    assert len(sampled)==100 and len(set(sampled))==100
    old_distance=cKDTree(points[legacy]).query(points)[0].max()
    new_distance=cKDTree(points[sampled]).query(points)[0].max()
    assert new_distance < .5*old_distance
    assert np.array_equal(points,original)
    assert np.array_equal(sampled,spatial_sample_indices(points,100))


def test_small_cloud_preserves_all_samples():
    points=cloud()[:30]
    assert np.array_equal(spatial_sample_indices(points,50),np.arange(30))


def test_sampling_tracks_rigid_transform_and_scale_without_prebinning():
    points=cloud()
    theta=.71
    rotation=np.array([[np.cos(theta),0,np.sin(theta)],[0,1,0],[-np.sin(theta),0,np.cos(theta)]])
    expected=spatial_sample_indices(points,400)
    moved=points@rotation.T*7.3+[10,-3,2]
    assert np.array_equal(expected,spatial_sample_indices(moved,400))


def test_large_cloud_prebinning_is_bounded_and_uses_original_indices():
    points=np.random.default_rng(12).normal(size=(25000,3))
    indexes=spatial_sample_indices(points,180)
    assert len(indexes)==180 and len(np.unique(indexes))==180
    assert indexes.min()>=0 and indexes.max()<len(points)


@pytest.mark.parametrize('points,limit',[(np.zeros((10,2)),5),(np.full((10,3),np.nan),5),(np.zeros((10,3)),0)])
def test_bad_inputs_refused(points,limit):
    with pytest.raises(ValueError):spatial_sample_indices(points,limit)


def test_resampling_keeps_rgb_bound_to_original_coordinates():
    x,y=np.meshgrid(np.linspace(-1,1,50),np.linspace(-1,1,50))
    points=np.column_stack([x.ravel(),y.ravel(),.1*x.ravel()**2])
    colors=np.column_stack([(points[:,0]+1)*100,(points[:,1]+1)*100,np.full(len(points),50)])
    mesh=create_sparse_surface(points,12,max_vertices=500,colors=colors)
    assert mesh.point_sampling=='spatial_farthest_point_representatives'
    for point,color in zip(mesh.vertices,mesh.vertex_colors):
        assert color[0]*255==pytest.approx((point[0]+1)*100)
        assert color[1]*255==pytest.approx((point[1]+1)*100)
        assert color[2]*255==pytest.approx(50)


def test_legacy_sampling_remains_available_for_regression_comparison(monkeypatch):
    monkeypatch.setenv('GRAFTMAP_POINT_SAMPLING','legacy')
    x,y=np.meshgrid(np.linspace(-1,1,50),np.linspace(-1,1,50))
    points=np.column_stack([x.ravel(),y.ravel(),.1*x.ravel()**2])
    mesh=create_sparse_surface(points,12,max_vertices=500)
    assert mesh.point_sampling=='legacy_order_representatives'
    original=np.unique(points,axis=0)
    expected=original[np.linspace(0,len(original)-1,500).astype(int)]
    assert all(tuple(p) in set(map(tuple,expected)) for p in mesh.vertices)
