"""Per-triangle photo atlas with approximate visibility checks on the sparse mesh."""
import base64
import io
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image


def project(vertices, matrix, params):
    camera = vertices @ matrix[:, :3].T + matrix[:, 3]
    z = camera[:, 2]
    safe = np.where(z > 0, z, 1)
    xy = camera[:, :2] / safe[:, None]
    radial = 1 + params[3] * np.sum(xy * xy, axis=1)
    uv = params[0] * xy * radial[:, None] + params[1:3]
    return uv, z


def depth_buffer(uv, z, faces, size, resolution=128):
    width, height = size
    scale = np.array([resolution / width, resolution / height])
    projected = uv * scale
    depth = np.full((resolution, resolution), np.inf)
    for face in faces:
        if np.any(z[face] <= 0):
            continue
        triangle = projected[face]
        if not np.isfinite(triangle).all():
            continue
        lower = np.clip(np.floor(triangle.min(axis=0)), 0, resolution - 1).astype(int)
        upper = np.clip(np.ceil(triangle.max(axis=0)), 0, resolution - 1).astype(int)
        if np.any(upper < lower):
            continue
        a, b, c = triangle
        denominator = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        if abs(denominator) < 1e-10:
            continue
        xx, yy = np.meshgrid(np.arange(lower[0], upper[0] + 1) + .5,
                             np.arange(lower[1], upper[1] + 1) + .5)
        w1 = ((xx - a[0]) * (c[1] - a[1]) - (yy - a[1]) * (c[0] - a[0])) / denominator
        w2 = ((b[0] - a[0]) * (yy - a[1]) - (b[1] - a[1]) * (xx - a[0])) / denominator
        w0 = 1 - w1 - w2
        inside = (np.minimum(np.minimum(w0, w1), w2) >= -1e-6)
        inverse_depth = w0 / z[face[0]] + w1 / z[face[1]] + w2 / z[face[2]]
        candidate = np.where(inside & (inverse_depth > 0), 1 / np.maximum(inverse_depth, 1e-30), np.inf)
        patch = depth[lower[1]:upper[1] + 1, lower[0]:upper[0] + 1]
        np.minimum(patch, candidate, out=patch)
    return depth


def create_photo_atlas(geometry, model: dict, image_dir: Path) -> dict:
    required = {"camera_indices", "camera_matrices", "camera_params", "camera_sizes"}
    if not required.issubset(model):
        return {}
    vertices = np.asarray(geometry.vertices)
    faces = np.asarray(geometry.faces)
    if not 1 <= len(faces) <= 16384:
        return {}
    files = sorted(image_dir.glob("*.jpg"))
    triangles = vertices[faces]
    centers = triangles.mean(axis=1)
    normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
    normal_length = np.linalg.norm(normals, axis=1)
    winners = np.full(len(faces), -1, dtype=int)
    scores = np.zeros(len(faces))
    chosen_uv = np.zeros((len(faces), 3, 2))
    support = np.zeros(len(faces), dtype=np.int32)
    samples = np.concatenate([triangles, (triangles + np.roll(triangles, -1, axis=1))/2, centers[:, None]], axis=1)
    matrices = model["camera_matrices"]
    sizes = model["camera_sizes"]
    params = model["camera_params"]

    for camera_index, (matrix, camera_params, size) in enumerate(zip(matrices, params, sizes)):
        uv, z = project(vertices, matrix, camera_params)
        center_uv, center_z = project(centers, matrix, camera_params)
        depth = depth_buffer(uv, z, faces, size)
        width, height = size
        finite = np.isfinite(uv).all(axis=1) & (z > 0)
        in_frame = finite & (uv[:, 0] >= 1) & (uv[:, 0] < width - 1) & (uv[:, 1] >= 1) & (uv[:, 1] < height - 1)
        valid = in_frame[faces].all(axis=1) & np.isfinite(center_uv).all(axis=1)
        safe_center = np.nan_to_num(center_uv, nan=-1, posinf=-1, neginf=-1)
        pixel = np.clip((safe_center * [128 / width, 128 / height]).astype(int), 0, 127)
        visible_depth = depth[pixel[:, 1], pixel[:, 0]]
        valid &= np.isfinite(visible_depth) & (np.abs(center_z - visible_depth) <= .02 * np.maximum(center_z, 1e-12))
        eye = -matrix[:, :3].T @ matrix[:, 3]
        direction = eye - centers
        distance = np.linalg.norm(direction, axis=1)
        cosine = np.abs(np.sum(normals * direction, axis=1)) / np.maximum(normal_length * distance, 1e-20)
        score = cosine / np.maximum(distance * distance, 1e-20)
        mask_file = image_dir.parent / "masks" / (files[int(model["camera_indices"][camera_index])].name + ".png")
        if mask_file.is_file():
            with Image.open(mask_file) as image:
                selection = np.asarray(image.convert("L")) > 0
            sample_uv, _ = project(samples.reshape(-1, 3), matrix, camera_params)
            sample_uv = sample_uv.reshape(-1, 7, 2)
            scaled = np.nan_to_num(sample_uv, nan=-1, posinf=-1, neginf=-1) * [selection.shape[1]/width, selection.shape[0]/height]
            px = np.clip(np.floor(scaled[:, :, 0]), 0, selection.shape[1]-1).astype(int)
            py = np.clip(np.floor(scaled[:, :, 1]), 0, selection.shape[0]-1).astype(int)
            valid &= selection[py, px].all(axis=1)
        supported = valid & (cosine > .25)
        support += supported
        update = supported & (score > scores)
        winners[update] = camera_index
        scores[update] = score[update]
        chosen_uv[update] = uv[faces[update]]

    @lru_cache(maxsize=4)
    def photograph(index):
        file = files[int(model["camera_indices"][index])]
        with Image.open(file) as image:
            rgb = image.convert("RGB")
            rgb.thumbnail((1800, 1800))
            pixels = np.asarray(rgb)
        mask_file = image_dir.parent / "masks" / (file.name + ".png")
        mask = None
        if mask_file.is_file():
            with Image.open(mask_file) as image:
                mask = np.asarray(image.convert("L").resize((pixels.shape[1], pixels.shape[0]), Image.Resampling.NEAREST))
        return pixels, mask

    tile = 32
    columns = int(np.ceil(np.sqrt(len(faces))))
    rows = int(np.ceil(len(faces) / columns))
    atlas = np.zeros((rows * tile, columns * tile, 3), dtype=np.uint8)
    coordinates = []
    textured = 0
    yy, xx = np.mgrid[0:tile, 0:tile]
    b1 = np.clip((xx - 2) / (tile - 5), 0, 1)
    b2 = np.clip((yy - 2) / (tile - 5), 0, 1)
    # Extend samples to the hypotenuse to avoid dark seams at texture filtering boundaries.
    total = np.maximum(b1 + b2, 1)
    b1, b2 = b1 / total, b2 / total
    b0 = 1 - b1 - b2
    colors = np.asarray(geometry.vertex_colors) if geometry.vertex_colors is not None else None
    for index, face in enumerate(faces):
        row, column = divmod(index, columns)
        fallback = (np.mean(colors[face], axis=0) * 255).astype(np.uint8) if colors is not None else np.array([166, 120, 87], dtype=np.uint8)
        patch = np.broadcast_to(fallback, (tile, tile, 3)).copy()
        winner = winners[index]
        if winner >= 0:
            pixels, mask = photograph(int(winner))
            triangle = chosen_uv[index] * np.array([pixels.shape[1], pixels.shape[0]]) / sizes[winner]
            sample = b0[..., None] * triangle[0] + b1[..., None] * triangle[1] + b2[..., None] * triangle[2]
            sx = np.clip(np.rint(sample[..., 0]).astype(int), 0, pixels.shape[1] - 1)
            sy = np.clip(np.rint(sample[..., 1]).astype(int), 0, pixels.shape[0] - 1)
            allowed = np.ones(sx.shape, dtype=bool) if mask is None else mask[sy, sx] > 0
            patch[allowed] = pixels[sy[allowed], sx[allowed]]
            if allowed.any():
                textured += 1
        x, y = column * tile, row * tile
        atlas[y:y + tile, x:x + tile] = patch
        coordinates.append([[ (x + tx + .5) / atlas.shape[1], 1 - (y + ty + .5) / atlas.shape[0]]
                            for tx, ty in [(2, 2), (tile - 3, 2), (2, tile - 3)]])
    if textured == 0:
        return {"face_view_support": support.tolist()}
    buffer = io.BytesIO()
    Image.fromarray(atlas).save(buffer, "JPEG", quality=90)
    if len(buffer.getvalue()) > 8 * 1024 * 1024:
        return {}
    return {"face_view_support": support.tolist(), "texture_jpeg_base64": base64.b64encode(buffer.getvalue()).decode("ascii"),
            "face_texture_coordinates": coordinates,
            "texture_info": {"method": "sparse_mesh_photo_projection", "textured_faces": textured,
                             "total_faces": len(faces), "tile_pixels": tile}}
