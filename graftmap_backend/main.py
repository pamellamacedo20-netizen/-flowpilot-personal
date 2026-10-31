from __future__ import annotations

import json
import math
import os
import uuid
from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from scipy.spatial import ConvexHull, cKDTree

APP_NAME = "GraftMap Photo SfM Backend"
APP_VERSION = "0.10.4-render"
API_TOKEN = os.environ.get("GRAFTMAP_API_TOKEN", "")

app = FastAPI(title=APP_NAME, version=APP_VERSION)


def auth(authorization: str | None):
    if not API_TOKEN:
        raise HTTPException(status_code=503, detail="Server token not configured")
    if not authorization or authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def parse_manifest(manifest: str):
    try:
        raw = json.loads(manifest)
        case_id = str(raw["case_id"])
        shots = raw["shots"]
        if not isinstance(shots, list) or len(shots) < 8:
            raise ValueError("mínimo de 8 fotos")
        expected = [str(s["filename"]) for s in shots]
        if len(expected) != len(set(expected)):
            raise ValueError("nomes de arquivo duplicados")
        return case_id, shots, expected
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Manifest inválido: {e}")


async def read_images(images: List[UploadFile], expected: list[str]):
    by_name = {f.filename: f for f in images}
    missing = [name for name in expected if name not in by_name]
    if missing:
        raise HTTPException(status_code=422, detail=f"Faltam arquivos: {missing}")

    decoded: dict[str, np.ndarray] = {}
    total = 0
    for name in expected:
        data = await by_name[name].read()
        if not data:
            raise HTTPException(status_code=422, detail=f"Arquivo vazio: {name}")
        if len(data) > 20_000_000:
            raise HTTPException(status_code=413, detail=f"Imagem muito grande: {name}")
        image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        if image is None or min(image.shape[:2]) < 320:
            raise HTTPException(status_code=422, detail=f"JPEG inválido ou resolução insuficiente: {name}")
        decoded[name] = image
        total += len(data)
    return decoded, total


def resize_for_sfm(gray: np.ndarray, max_side: int = 1400):
    h, w = gray.shape[:2]
    scale = min(1.0, max_side / float(max(h, w)))
    if scale < 1.0:
        gray = cv2.resize(gray, (int(round(w * scale)), int(round(h * scale))), interpolation=cv2.INTER_AREA)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def approximate_K(image: np.ndarray):
    h, w = image.shape[:2]
    f = 1.15 * max(w, h)
    return np.array([[f, 0.0, w / 2.0], [0.0, f, h / 2.0], [0.0, 0.0, 1.0]], dtype=np.float64)


def match_pair(kp1, d1, kp2, d2):
    if d1 is None or d2 is None or len(kp1) < 80 or len(kp2) < 80:
        return None
    matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
    raw = matcher.knnMatch(d1, d2, k=2)
    good = []
    for pair in raw:
        if len(pair) != 2:
            continue
        m, n = pair
        if m.distance < 0.72 * n.distance:
            good.append(m)
    if len(good) < 45:
        return None
    pts1 = np.float64([kp1[m.queryIdx].pt for m in good])
    pts2 = np.float64([kp2[m.trainIdx].pt for m in good])
    return pts1, pts2


def estimate_relative_pose(pts1, pts2, K):
    E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.6)
    if E is None or mask is None:
        return None
    _, R, t, pose_mask = cv2.recoverPose(E, pts1, pts2, K, mask=mask)
    inliers = pose_mask.ravel() > 0
    if int(inliers.sum()) < 28:
        return None
    t = t.reshape(3)
    n = np.linalg.norm(t)
    if n < 1e-8:
        return None
    return R, t / n, inliers


def project(P, X):
    x = P @ np.append(X, 1.0)
    if abs(x[2]) < 1e-9:
        return None
    return x[:2] / x[2]


def reconstruct_sfm(ordered_names: list[str], images_by_name: dict[str, np.ndarray]):
    images = [resize_for_sfm(images_by_name[name]) for name in ordered_names]
    K = approximate_K(images[0])
    sift = cv2.SIFT_create(nfeatures=6500, contrastThreshold=0.012, edgeThreshold=14)
    features = [sift.detectAndCompute(img, None) for img in images]
    poses = [(np.eye(3), np.zeros(3))]
    points_world = []
    reprojection_errors = []
    used_pairs = 0

    for i in range(len(images) - 1):
        kp1, d1 = features[i]
        kp2, d2 = features[i + 1]
        matched = match_pair(kp1, d1, kp2, d2)
        if matched is None:
            if used_pairs < 3:
                raise HTTPException(status_code=422, detail=f"Poucas correspondências entre as fotos {i+1} e {i+2}; refaça com maior sobreposição e iluminação constante")
            break
        pts1, pts2 = matched
        rel = estimate_relative_pose(pts1, pts2, K)
        if rel is None:
            if used_pairs < 3:
                raise HTTPException(status_code=422, detail=f"Não foi possível estimar movimento entre as fotos {i+1} e {i+2}")
            break
        Rrel, trel, inliers = rel
        pts1 = pts1[inliers]
        pts2 = pts2[inliers]
        Ri, ti = poses[i]
        Rj = Rrel @ Ri
        tj = Rrel @ ti + trel
        poses.append((Rj, tj))
        P1 = K @ np.hstack([Ri, ti.reshape(3, 1)])
        P2 = K @ np.hstack([Rj, tj.reshape(3, 1)])
        Xh = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
        Xs = (Xh[:3] / Xh[3:4]).T
        accepted = 0
        for X, uv1, uv2 in zip(Xs, pts1, pts2):
            if not np.isfinite(X).all():
                continue
            z1 = (Ri @ X + ti)[2]
            z2 = (Rj @ X + tj)[2]
            if z1 <= 0.02 or z2 <= 0.02:
                continue
            p1 = project(P1, X)
            p2 = project(P2, X)
            if p1 is None or p2 is None:
                continue
            e = 0.5 * (np.linalg.norm(p1 - uv1) + np.linalg.norm(p2 - uv2))
            if e > 3.0 or np.linalg.norm(X) > 80.0:
                continue
            points_world.append(X)
            reprojection_errors.append(float(e))
            accepted += 1
        if accepted >= 20:
            used_pairs += 1

    if used_pairs < 3 or len(points_world) < 180:
        raise HTTPException(status_code=422, detail=f"Reconstrução insuficiente: {len(points_world)} pontos válidos em {used_pairs} pares. Refaça as fotos com maior sobreposição, cabeça imóvel e iluminação difusa.")

    pts = np.asarray(points_world, dtype=np.float64)
    pts = pts - np.median(pts, axis=0)
    radii = np.linalg.norm(pts, axis=1)
    pts = pts[radii <= float(np.percentile(radii, 92))]
    if len(pts) >= 60:
        tree = cKDTree(pts)
        k = min(10, len(pts))
        dist, _ = tree.query(pts, k=k)
        local = dist[:, -1]
        pts = pts[local <= np.percentile(local, 90)]
    if len(pts) < 100:
        raise HTTPException(status_code=422, detail="Poucos pontos permaneceram após a filtragem SfM")

    ext = np.ptp(pts, axis=0)
    max_extent = float(np.max(ext))
    if not np.isfinite(max_extent) or max_extent < 1e-6:
        raise HTTPException(status_code=422, detail="Nuvem 3D degenerada")
    pts = pts * (0.20 / max_extent)

    voxel = 0.0018
    keys = np.floor(pts / voxel).astype(np.int64)
    buckets = {}
    for key, p in zip(map(tuple, keys), pts):
        buckets.setdefault(key, []).append(p)
    pts = np.asarray([np.median(np.asarray(v), axis=0) for v in buckets.values()])
    if len(pts) > 3500:
        idx = np.linspace(0, len(pts) - 1, 3500, dtype=int)
        pts = pts[idx]

    try:
        hull = ConvexHull(pts, qhull_options="QJ")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Não foi possível gerar superfície 3D: {e}")

    used = np.unique(hull.simplices.reshape(-1))
    remap = {int(old): new for new, old in enumerate(used.tolist())}
    vertices = pts[used]
    faces = [[remap[int(a)], remap[int(b)], remap[int(c)]] for a, b, c in hull.simplices]
    return {
        "vertices": vertices,
        "faces": faces,
        "raw_points": len(points_world),
        "used_pairs": used_pairs,
        "median_reprojection_error_px": float(np.median(reprojection_errors)) if reprojection_errors else None,
    }


def demo_mesh(nu: int = 36, nv: int = 20):
    vertices, faces = [], []
    for j in range(nv + 1):
        phi = -math.pi / 2 + math.pi * j / nv
        for i in range(nu):
            theta = 2 * math.pi * i / nu
            vertices.append([0.085 * math.cos(phi) * math.cos(theta), 0.115 * math.sin(phi), 0.10 * math.cos(phi) * math.sin(theta)])
    for j in range(nv):
        for i in range(nu):
            a = j * nu + i
            b = j * nu + (i + 1) % nu
            c = (j + 1) * nu + i
            d = (j + 1) * nu + (i + 1) % nu
            faces.extend([[a, c, b], [b, c, d]])
    return vertices, faces


@app.get("/health")
def health():
    return {"ok": True, "service": APP_NAME, "version": APP_VERSION, "mode": "photo-sfm-relative-scale"}


@app.get("/v1/demo-mesh")
def get_demo_mesh():
    vertices, faces = demo_mesh()
    return {
        "version": 1,
        "case_id": "demo",
        "mesh_kind": "integration_demo",
        "unit": "meter",
        "vertices": vertices,
        "faces": faces,
        "metrics": {
            "input_images": 0,
            "received_bytes": 0,
            "vertex_count": len(vertices),
            "triangle_count": len(faces),
            "scale_source": "fixed demo geometry",
            "validated_for_clinical_measurement": False,
        },
    }


@app.post("/v1/uploads")
async def validate_upload(manifest: str = Form(...), images: List[UploadFile] = File(...), authorization: str | None = Header(default=None)):
    auth(authorization)
    case_id, _, expected = parse_manifest(manifest)
    decoded, total = await read_images(images, expected)
    count = len(decoded)
    decoded.clear()
    return {"upload_id": uuid.uuid4().hex, "status": "received", "received_images": count, "received_bytes": total, "case_id": case_id, "retained": False}


@app.post("/v1/reconstruct")
@app.post("/v1/reconstruct-sfm")
async def reconstruct_sfm_endpoint(manifest: str = Form(...), images: List[UploadFile] = File(...), authorization: str | None = Header(default=None)):
    auth(authorization)
    case_id, _, expected = parse_manifest(manifest)
    decoded, total = await read_images(images, expected)
    try:
        result = reconstruct_sfm(expected, decoded)
    finally:
        decoded.clear()

    vertices = result["vertices"]
    faces = result["faces"]
    return {
        "version": 3,
        "case_id": case_id,
        "mesh_kind": "photo_sfm_sparse_hull",
        "unit": "relative",
        "vertices": np.round(vertices, 6).tolist(),
        "faces": faces,
        "metrics": {
            "input_images": len(expected),
            "received_bytes": total,
            "vertex_count": int(len(vertices)),
            "triangle_count": int(len(faces)),
            "scale_source": "relative SfM normalized for visualization; not metric",
            "validated_for_clinical_measurement": False,
        },
    }
