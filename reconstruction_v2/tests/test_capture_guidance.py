import numpy as np
from backend.capture_guidance import capture_guidance
from backend.reconstruct import Geometry


def model(centers):
    return {'camera_matrices':np.array([np.column_stack([np.eye(3),-np.array(c)]) for c in centers])}


def shape():return Geometry([[-1,-1,-1],[1,1,1]],[],12,2)


def test_planar_orbit_requests_second_level():
    theta=np.linspace(0,2*np.pi,12,endpoint=False)
    centers=np.column_stack([3*np.cos(theta),np.zeros(12),3*np.sin(theta)])
    assert 'faixa quase plana' in capture_guidance(model(centers),shape())


def test_small_angular_range_requests_other_faces():
    theta=np.linspace(-.1,.1,12)
    centers=np.column_stack([3*np.sin(theta),np.zeros(12),3*np.cos(theta)])
    assert 'variação angular' in capture_guidance(model(centers),shape())


def test_same_position_requests_translation():
    assert 'mudança de posição' in capture_guidance(model([[0,0,3]]*12),shape())


def test_three_dimensional_views_not_certified_as_complete():
    centers=[[3,0,0],[-3,0,0],[0,3,0],[0,-3,0],[0,0,3],[0,0,-3]]
    result=capture_guidance(model(centers),shape())
    assert 'três dimensões' in result and 'não comprova cobertura' in result


def test_missing_cameras_handled():
    assert 'Poucas câmeras' in capture_guidance({},shape())
