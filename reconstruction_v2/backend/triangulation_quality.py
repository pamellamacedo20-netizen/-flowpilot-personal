"""Reject triangulated points with nearly parallel viewing rays.

A pair near 180 degrees is degenerate too: use the acute angle between
lines. This is a conditioning check, not a physical accuracy estimate.
"""
import numpy as np

MIN_TRIANGULATION_DEGREES = 1.0


def triangulation_angle(point, camera_centers):
    point = np.asarray(point, dtype=np.float64)
    centers = np.asarray(camera_centers, dtype=np.float64)
    if point.shape != (3,) or centers.ndim != 2 or centers.shape[1:] != (3,):
        return 0.0
    if not np.isfinite(point).all() or not np.isfinite(centers).all():
        return 0.0
    rays = centers - point
    lengths = np.linalg.norm(rays, axis=1)
    rays = rays[lengths > 1e-12]
    lengths = lengths[lengths > 1e-12]
    if len(rays) < 2:
        return 0.0
    rays = rays / lengths[:, None]
    cosines = np.clip(np.abs(rays @ rays.T), 0.0, 1.0)
    return float(np.degrees(np.arccos(cosines.min())))


def supported_samples(samples, centers_by_image, minimum=MIN_TRIANGULATION_DEGREES):
    if not np.isfinite(minimum) or not 0 < minimum < 90:
        raise ValueError('invalid triangulation threshold')
    accepted = []
    angles = []
    for point in samples:
        # Deduplicate tracks: repeated observations from the same camera do not
        # provide another viewpoint. Unknown cameras cannot supply evidence.
        image_ids = {element.image_id for element in point.track.elements}
        centers = [centers_by_image[i] for i in image_ids if i in centers_by_image]
        angle = triangulation_angle(point.xyz, centers)
        if angle >= minimum:
            accepted.append(point)
            angles.append(angle)
    return accepted, np.asarray(angles, dtype=np.float64)
