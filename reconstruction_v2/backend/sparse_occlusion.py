"""Conservative contradictions against projected sparse points; unknown stays unknown."""
import numpy as np
from scipy.spatial import cKDTree
from .photo_texture import project


def depth_evidence(model, camera, dimensions):
    width, height = dimensions
    points = np.asarray(model['points'])
    if not len(points):
        return None
    uv, depth = project(points, model['camera_matrices'][camera], model['camera_params'][camera])
    uv *= np.array([width, height]) / model['camera_sizes'][camera]
    valid = (np.isfinite(uv).all(axis=1) & np.isfinite(depth) & (depth > 0)
             & (uv[:,0] >= 0) & (uv[:,0] < width)
             & (uv[:,1] >= 0) & (uv[:,1] < height))
    if not valid.any():
        return None
    return cKDTree(uv[valid]), depth[valid]


def contradicted_depth(uv, depth, evidence, tolerance):
    """Reject behind a nearby observed point; absence of evidence is not approval."""
    if not np.isfinite(tolerance) or tolerance < 0:
        raise ValueError('Invalid sparse depth tolerance')
    rejected = np.zeros(len(depth), dtype=bool)
    if evidence is None or not len(depth):
        return rejected
    tree, reference = evidence
    valid = np.isfinite(uv).all(axis=1) & np.isfinite(depth) & (depth > 0)
    rows = np.flatnonzero(valid)
    if not len(rows):
        return rejected
    # At most eight nearby projections within two working pixels. This is not
    # a filled depth map and does not infer an occluder between sparse samples.
    count = min(8, len(reference))
    distance, indices = tree.query(uv[rows], k=count, distance_upper_bound=2.0)
    indices = np.asarray(indices).reshape(len(rows), count)
    distance = np.asarray(distance).reshape(len(rows), count)
    padded = np.r_[reference, np.inf]
    front = np.where(distance <= 2.0, padded[indices], np.inf).min(axis=1)
    rejected[rows] = np.isfinite(front) & (depth[rows] > front + tolerance + .02*front)
    return rejected
