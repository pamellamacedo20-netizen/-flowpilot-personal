"""Bounded CPU stereo refinement around observed sparse geometry; experimental."""
from pathlib import Path
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree

from .photo_texture import project
from .sparse_occlusion import depth_evidence, contradicted_depth


def calibration(params, original_size, size):
    sx, sy = np.asarray(size) / original_size
    f, cx, cy, k = params
    return np.array([[f*sx, 0, cx*sx], [0, f*sy, cy*sy], [0, 0, 1.]]), np.array([k, 0., 0., 0., 0.])


def stereo_pair(first, second, mask_first, mask_second, matrix_first, matrix_second,
                params_first, params_second, size_first, size_second, sparse, swapped=False):
    """Left-right consistent SGBM points in the unchanged COLMAP world frame."""
    h, w = first.shape[:2]
    if second.shape[:2] != (h, w):
        raise ValueError('Par estéreo com dimensões de trabalho incompatíveis.')
    k1, d1 = calibration(params_first, size_first, [w, h])
    k2, d2 = calibration(params_second, size_second, [w, h])
    r1, t1 = matrix_first[:, :3], matrix_first[:, 3]
    r2, t2 = matrix_second[:, :3], matrix_second[:, 3]
    rotation = r2 @ r1.T
    translation = t2 - rotation @ t1
    if np.linalg.norm(translation) < 1e-8:
        raise ValueError('Par sem distância entre câmeras.')
    a, b, p1, p2, q, _, _ = cv2.stereoRectify(k1, d1, k2, d2, (w, h), rotation, translation,
                                             flags=cv2.CALIB_ZERO_DISPARITY, alpha=0)
    if abs(p2[1, 3]) > abs(p2[0, 3]):
        raise ValueError('Par com retificação vertical não suportada nesta fase.')
    if p2[0, 3] > 0:
        if swapped:
            raise ValueError('Sinal da retificação inconsistente.')
        return stereo_pair(second, first, mask_second, mask_first, matrix_second, matrix_first,
                           params_second, params_first, size_second, size_first, sparse, True)
    map1 = cv2.initUndistortRectifyMap(k1, d1, a, p1, (w, h), cv2.CV_32FC1)
    map2 = cv2.initUndistortRectifyMap(k2, d2, b, p2, (w, h), cv2.CV_32FC1)
    left = cv2.remap(first, *map1, cv2.INTER_LINEAR)
    right = cv2.remap(second, *map2, cv2.INTER_LINEAR)
    lm = cv2.remap(mask_first, *map1, cv2.INTER_NEAREST) > 0
    rm = cv2.remap(mask_second, *map2, cv2.INTER_NEAREST) > 0
    # Avoid matches whose 5x5 neighborhood crosses a selection boundary.
    lm = cv2.erode(lm.astype('uint8'), np.ones((7, 7), 'uint8')) > 0
    rm = cv2.erode(rm.astype('uint8'), np.ones((7, 7), 'uint8')) > 0
    pc = (sparse @ r1.T + t1) @ a.T
    positive = pc[:, 2] > 0
    pc = pc[positive]
    if len(pc) < 80:
        raise ValueError('Poucos pontos de apoio no par.')
    sparse_disparity = -p2[0, 3] / pc[:, 2]
    lo, hi = np.percentile(sparse_disparity, [2, 98])
    minimum = int(np.floor(lo)) - 8
    disparities = int(np.ceil((hi - minimum + 8) / 16)) * 16
    if not 16 <= disparities <= min(256, w//2) or minimum + disparities >= w:
        raise ValueError('Faixa de disparidade fora do limite de trabalho.')
    options = dict(numDisparities=disparities, blockSize=5, P1=8*25, P2=32*25,
                   disp12MaxDiff=1, uniquenessRatio=12, speckleWindowSize=80,
                   speckleRange=1, mode=cv2.STEREO_SGBM_MODE_SGBM)
    lg = cv2.cvtColor(left, cv2.COLOR_RGB2GRAY)
    rg = cv2.cvtColor(right, cv2.COLOR_RGB2GRAY)
    dl = cv2.StereoSGBM_create(minDisparity=minimum, **options).compute(lg, rg).astype('float32')/16
    right_min = -minimum-disparities+1
    dr = cv2.StereoSGBM_create(minDisparity=right_min, **options).compute(rg, lg).astype('float32')/16
    yy, xx = np.mgrid[:h, :w]
    xr = np.rint(xx-dl).astype(int)
    inside = (xr >= 0) & (xr < w)
    xr = np.clip(xr, 0, w-1)
    gray = lg.astype('float32')
    variance = cv2.boxFilter(gray*gray, -1, (7, 7)) - cv2.boxFilter(gray, -1, (7, 7))**2
    valid = (lm & rm[yy, xr] & inside & (dl > max(0, minimum-.5))
             & (dr[yy, xr] > right_min-.5) & (np.abs(dl+dr[yy, xr]) <= 1.) & (variance > 25)
             & (np.abs(lg.astype(float)-rg[yy, xr].astype(float)) < 35))
    rectified = cv2.reprojectImageTo3D(dl, q)
    valid &= np.isfinite(rectified).all(axis=2)
    low_depth, high_depth = np.percentile(pc[:, 2], [1, 99])
    valid &= (rectified[:, :, 2] > .7*low_depth) & (rectified[:, :, 2] < 1.3*high_depth)
    # Limit cost deterministically to one sample every two pixels.
    valid &= (xx % 2 == 0) & (yy % 2 == 0)
    world = (rectified[valid] @ a - t1) @ r1
    colors = left[valid]
    if not len(world):
        raise ValueError('Par sem correspondências estéreo consistentes.')
    return world, colors


def pair_working_size(first_size, second_size):
    """Use compatible pairs without letting another format block the batch."""
    sizes = np.asarray([first_size, second_size], dtype=float)
    if sizes.shape != (2, 2) or not np.isfinite(sizes).all() or (sizes <= 0).any():
        return None
    ratios = sizes[:, 0] / sizes[:, 1]
    if np.ptp(ratios) > .01:
        return None
    width = min(640, int(sizes[:, 0].min()))
    height = int(round(width / np.median(ratios)))
    if min(width, height) < 160 or max(width, height) > 960:
        return None
    return width, height


def choose_pairs(model, limit=12):
    points = model['points']
    center = np.median(points, axis=0)
    matrices = model['camera_matrices']
    sizes = model['camera_sizes']
    visible, rays = [], []
    for matrix, params, size in zip(matrices, model['camera_params'], sizes):
        uv, depth = project(points, matrix, params)
        visible.append((depth > 0) & (uv[:, 0] >= 0) & (uv[:, 0] < size[0])
                       & (uv[:, 1] >= 0) & (uv[:, 1] < size[1]))
        eye = -matrix[:, :3].T @ matrix[:, 3]
        ray = eye-center
        rays.append(ray/max(np.linalg.norm(ray), 1e-15))
    pairs = []
    for i in range(len(matrices)):
        for j in range(i+1, len(matrices)):
            # Filter before budgeting pairs; incompatible views must not consume
            # the two-pair allowance or the bounded worker time.
            if pair_working_size(sizes[i], sizes[j]) is None:
                continue
            angle = np.degrees(np.arccos(np.clip(rays[i] @ rays[j], -1, 1)))
            common = visible[i] & visible[j]
            if 2 <= angle <= 25 and common.sum() >= 80:
                pairs.append((int(common.sum())/(1+abs(angle-10)), i, j, common))
    pairs.sort(key=lambda item: -item[0])
    # Up to two pairs per camera spreads the work across viewpoints.
    used = np.zeros(len(matrices), dtype=int)
    selected = []
    for _, i, j, common in pairs:
        if used[i] >= 2 or used[j] >= 2:
            continue
        selected.append((i, j, common))
        used[i] += 1; used[j] += 1
        if len(selected) >= limit:
            break
    return selected


def angularly_distinct(points, first, second, third):
    """A different image at the same position supplies no new angular evidence."""
    rays = []
    valid = np.ones(len(points), dtype=bool)
    for eye in (first, second, third):
        ray = eye - points
        length = np.linalg.norm(ray, axis=1)
        valid &= np.isfinite(ray).all(axis=1) & np.isfinite(length) & (length > 1e-12)
        rays.append(ray / np.maximum(length[:, None], 1e-12))
    limit = np.cos(np.radians(1.0))
    return (valid & (np.abs(np.einsum('ij,ij->i', rays[0], rays[2])) <= limit)
            & (np.abs(np.einsum('ij,ij->i', rays[1], rays[2])) <= limit))


def third_view_candidates(points, model, first, second, limit=4):
    """Rank geometric support before spending the bounded image-read budget."""
    if not len(points) or limit < 1:
        return []
    matrices = model['camera_matrices']
    eyes = np.asarray([-m[:, :3].T @ m[:, 3] for m in matrices])
    # Probe at most 512 existing points; no image decoding needed for ranking.
    probes = points[np.linspace(0, len(points)-1, min(512, len(points))).astype(int)]
    mid = (eyes[first] + eyes[second]) / 2
    candidates = []
    for k in range(len(matrices)):
        if k in (first, second) or model['camera_indices'][k] in (
                model['camera_indices'][first], model['camera_indices'][second]):
            continue
        dimensions = pair_working_size(model['camera_sizes'][k], model['camera_sizes'][k])
        if dimensions is None:
            continue
        width, height = dimensions
        uv, depth = project(probes, matrices[k], model['camera_params'][k])
        uv *= np.array([width, height]) / model['camera_sizes'][k]
        coverage = (np.isfinite(uv).all(axis=1) & np.isfinite(depth) & (depth > 0)
                    & angularly_distinct(probes, eyes[first], eyes[second], eyes[k])
                    & (uv[:,0] >= 3) & (uv[:,0] < width-3)
                    & (uv[:,1] >= 3) & (uv[:,1] < height-3))
        if coverage.any():
            candidates.append((k, dimensions, coverage, float(np.linalg.norm(eyes[k]-mid))))
    covered = np.zeros(len(probes), dtype=bool)
    chosen = []
    while candidates and len(chosen) < limit:
        best = max(range(len(candidates)), key=lambda i: (
            int((candidates[i][2] & ~covered).sum()), int(candidates[i][2].sum()),
            -candidates[i][3], -candidates[i][0]))
        k, dimensions, coverage, _ = candidates.pop(best)
        chosen.append((k, dimensions))
        covered |= coverage
    return chosen


def third_view_support(points, colors, model, first, second, photo, limit=4, depth_loader=None, depth_tolerance=None):
    """Bounded photometric corroboration, not a dense occlusion/depth proof."""
    supported = np.zeros(len(points), dtype=bool)
    if not len(points):
        return supported
    matrices = model['camera_matrices']
    eyes = np.asarray([-m[:, :3].T @ m[:, 3] for m in matrices])
    candidates = third_view_candidates(points, model, first, second, limit)
    if depth_tolerance is None:
        sparse = np.asarray(model['points'])
        if len(sparse) < 2:
            depth_tolerance = 0.0
        else:
            depth_tolerance = 3*float(np.median(cKDTree(sparse).query(sparse, k=2)[0][:,1]))
    for k, (width, height) in candidates:
        uv, depth = project(points, matrices[k], model['camera_params'][k])
        uv = uv * (np.array([width, height]) / model['camera_sizes'][k])
        good = (np.isfinite(uv).all(axis=1) & np.isfinite(depth) & (depth > 0)
                & angularly_distinct(points, eyes[first], eyes[second], eyes[k])
                & (uv[:, 0] >= 3) & (uv[:, 0] < width-3)
                & (uv[:, 1] >= 3) & (uv[:, 1] < height-3) & ~supported)
        indices = np.flatnonzero(good)
        if not len(indices):
            continue
        evidence = (depth_loader(k, width, height) if depth_loader is not None else
                    depth_evidence(model, k, (width, height)))
        contradicted = contradicted_depth(uv[indices], depth[indices], evidence, depth_tolerance)
        indices = indices[~contradicted]
        if not len(indices):
            continue
        image, mask = photo(k, width, height)
        mask = cv2.erode((mask > 0).astype('uint8'), np.ones((7, 7), 'uint8')) > 0
        pixels = np.rint(uv[indices]).astype(int)
        x, y = pixels[:, 0], pixels[:, 1]
        agreement = np.abs(image[y, x].astype(float)-colors[indices].astype(float)).mean(axis=1) < 35
        supported[indices] = mask[y, x] & agreement
        if supported.all():
            break
    return supported


def refine_points(model: dict, image_dir: Path):
    cv2.setNumThreads(1)
    required = {'points', 'camera_indices', 'camera_matrices', 'camera_params', 'camera_sizes'}
    if not required.issubset(model) or len(model['points']) < 120:
        raise ValueError('Refinamento exige pontos e câmeras do PyCOLMAP.')
    if not (image_dir.parent/'masks').is_dir():
        raise ValueError('Refinamento exige seleções das fotografias.')
    files = sorted(image_dir.glob('*.jpg'))
    pairs = choose_pairs(model)
    if len(pairs) < 2:
        raise ValueError('Não há dois pares com sobreposição e separação adequadas.')
    @lru_cache(maxsize=4)
    def photo(i, width, height):
        file = files[int(model['camera_indices'][i])]
        with Image.open(file) as im:
            image = np.asarray(im.convert('RGB').resize((width, height), Image.Resampling.LANCZOS))
        with Image.open(image_dir.parent/'masks'/(file.name+'.png')) as im:
            mask = np.asarray(im.convert('L').resize((width, height), Image.Resampling.NEAREST))
        return image, mask

    original = model['points']
    tree = cKDTree(original)
    spacing = float(np.median(tree.query(original, k=2)[0][:, 1]))
    if spacing <= 0:
        raise ValueError('Espaçamento dos pontos de apoio inválido.')
    @lru_cache(maxsize=8)
    def depth_loader(k, width, height):
        return depth_evidence(model, k, (width, height))

    points, colors, accepted = [], [], 0
    accepted_sizes = []
    corroborated_points = 0
    for i, j, common in pairs:
        dimensions = pair_working_size(model['camera_sizes'][i], model['camera_sizes'][j])
        if dimensions is None:
            continue
        width, height = dimensions
        first, mf = photo(i, width, height); second, ms = photo(j, width, height)
        try:
            dense, rgb = stereo_pair(first, second, mf, ms, model['camera_matrices'][i], model['camera_matrices'][j],
                                     model['camera_params'][i], model['camera_params'][j],
                                     model['camera_sizes'][i], model['camera_sizes'][j], original[common])
        except (ValueError, cv2.error):
            continue
        corroborated = third_view_support(dense, rgb, model, i, j, photo,
                                            depth_loader=depth_loader, depth_tolerance=3*spacing)
        nearby = (corroborated & (tree.query(dense)[0] <= 2.5*spacing)
                  & (dense >= original.min(axis=0)-.25*spacing).all(axis=1)
                  & (dense <= original.max(axis=0)+.25*spacing).all(axis=1))
        dense, rgb = dense[nearby], rgb[nearby]
        if len(dense) < 120:
            continue
        take = np.linspace(0, len(dense)-1, min(10000, len(dense))).astype(int)
        points.append(dense[take]); colors.append(rgb[take]); accepted += 1
        accepted_sizes.append([width, height])
        corroborated_points += len(dense)
    if accepted < 2:
        raise ValueError('Menos de dois pares passaram na conferência estéreo.')
    points, colors = np.concatenate(points), np.concatenate(colors)
    # Voxel representatives reduce duplicate samples without smoothing their positions.
    cells = np.floor((points-points.min(axis=0))/(spacing/5)).astype(np.int64)
    _, unique = np.unique(cells, axis=0, return_index=True)
    take = unique[np.linspace(0, len(unique)-1, min(30000, len(unique))).astype(int)]
    if len(take) < 1.2*len(original):
        raise ValueError('Amostras estéreo insuficientes para aumentar a densidade.')
    return points[take], colors[take], {'pairs_attempted': len(pairs), 'pairs_accepted': accepted,
                                       'stereo_points': len(take), 'third_view_checked': True, 'sparse_occlusion_checked': True,
                                       'third_view_selection': 'projected_complementary_support',
                                       'corroborated_pair_samples': corroborated_points, 'working_width': max(size[0] for size in accepted_sizes),
                                       'working_height': max(size[1] for size in accepted_sizes),
                                       'working_sizes': sorted({tuple(size) for size in accepted_sizes})}
