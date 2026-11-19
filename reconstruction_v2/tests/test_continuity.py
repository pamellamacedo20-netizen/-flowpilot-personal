import subprocess
from dataclasses import replace
from types import SimpleNamespace

import numpy as np
import pytest
from backend.continuity_worker import propose
from backend.continuity import improve_continuity,admissible,triangle_area
from backend.reconstruct import Geometry
from backend.surface_review import topology_report


def sphere(n=1200):
    i=np.arange(n)+.5
    z=1-2*i/n
    phi=np.pi*(3-np.sqrt(5))*i
    points=np.column_stack([np.sqrt(1-z*z)*np.cos(phi),np.sqrt(1-z*z)*np.sin(phi),z])
    # Tiny known radial perturbation avoids exact cospherical degeneracy.
    return points*(1+1e-6*np.sin(i))[:,None]


def test_ball_pivoting_joins_known_sphere_without_new_vertices():
    points=sphere()
    original=points.copy()
    faces=propose(points)
    assert np.array_equal(points,original)
    assert faces.min()>=0 and faces.max()<len(points)
    report=topology_report(faces)
    assert report['components']==1 and report['nonmanifold_edges']==0
    assert report['boundary_edges']<20
    assert triangle_area(points,faces)==pytest.approx(4*np.pi,rel=.02)


def test_missing_cap_not_replaced_by_flat_global_closure():
    points=sphere()
    points=points[points[:,2]<.65]
    faces=propose(points)
    tri=points[faces]
    assert np.linalg.norm(tri.mean(axis=1),axis=1).min()>.97
    assert topology_report(faces)['boundary_edges']>=10


def test_separate_surfaces_do_not_get_bridge_triangles():
    a=sphere(600)-[2,0,0];b=sphere(600)+[2,0,0]
    faces=propose(np.vstack([a,b]))
    assert all((face<600).all() or (face>=600).all() for face in faces)


def cube():
    points=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
    faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],
           [1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]]
    return Geometry(points,faces,12,8)


def test_gate_accepts_small_gap_but_rejects_area_explosion():
    closed=cube();opened=replace(closed,faces=closed.faces[:-1])
    assert admissible(opened,closed)
    oversized=replace(closed,vertices=(np.array(closed.vertices)*2).tolist())
    assert not admissible(opened,oversized)


def test_timeout_and_missing_selections_preserve_original(tmp_path,monkeypatch):
    mesh=cube();images=tmp_path/'images';images.mkdir()
    unchanged,_,message=improve_continuity(mesh,{},images)
    assert unchanged is mesh and 'seleções' in message
    (tmp_path/'masks').mkdir()
    metadata={key:np.array([]) for key in ('camera_indices','camera_matrices','camera_params','camera_sizes')}
    def timeout(*a,**kw):raise subprocess.TimeoutExpired('test',45)
    monkeypatch.setattr('backend.continuity.subprocess.run',timeout)
    unchanged,_,message=improve_continuity(mesh,metadata,images)
    assert unchanged is mesh and 'mantida' in message


def test_bad_worker_indices_refused(tmp_path,monkeypatch):
    mesh=cube();images=tmp_path/'images';images.mkdir();(tmp_path/'masks').mkdir()
    metadata={key:np.array([]) for key in ('camera_indices','camera_matrices','camera_params','camera_sizes')}
    def run(args,**kw):
        np.savez(args[3],faces=np.array([[0,1,100]]*50))
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr('backend.continuity.subprocess.run',run)
    unchanged,_,_=improve_continuity(mesh,metadata,images)
    assert unchanged is mesh
