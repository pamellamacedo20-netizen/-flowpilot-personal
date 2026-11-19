"""Ball-pivoting mesh proposal from observed samples; no vertex displacement."""
import sys
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree


def propose(points):
    import open3d as o3d
    points = np.asarray(points, dtype=np.float64)
    if points.ndim != 2 or points.shape[1] != 3 or not 120 <= len(points) <= 7000 or not np.isfinite(points).all():
        raise ValueError('Invalid point cloud')
    distances = cKDTree(points).query(points, k=5)[0]
    spacing = np.median(distances[:, 1:], axis=1)
    typical = float(np.median(spacing))
    if typical <= 0:
        raise ValueError('Invalid spacing')
    cloud = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(points))
    cloud.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamKNN(knn=24))
    cloud.orient_normals_consistent_tangent_plane(24)
    radii = np.array([1.0, 1.5, 2.0]) * typical
    mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(cloud, o3d.utility.DoubleVector(radii))
    faces = np.asarray(mesh.triangles, dtype=np.int64)
    if not len(faces):
        raise ValueError('No triangles')
    triangles = points[faces]
    lengths = np.linalg.norm(triangles-np.roll(triangles,-1,axis=1),axis=2)
    local = spacing[faces]
    allowed = (lengths <= 3*np.minimum(local,np.roll(local,-1,axis=1))).all(axis=1)
    # The proposal is constrained to the exact input samples; no smoothing,
    # Poisson extrapolation, global convex hull or synthetic cap is generated.
    return faces[allowed]


if __name__ == '__main__':
    try:
        with np.load(sys.argv[1], allow_pickle=False) as data: faces = propose(data['points'])
        np.savez(Path(sys.argv[2]), faces=faces)
    except (ValueError, RuntimeError, OSError, ImportError):
        sys.exit(2)
