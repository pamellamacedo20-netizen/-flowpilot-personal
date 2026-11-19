import json
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

import numpy as np
import pytest
from scipy.spatial import cKDTree

from comparar_geometria import evaluate, similarity


def cube_fixture():
    vertices = np.array([[0, 0, 0], [80, 0, 0], [80, 80, 0], [0, 80, 0],
                         [0, 0, 80], [80, 0, 80], [80, 80, 80], [0, 80, 80]], dtype=float)
    faces = [[0, 1, 2], [0, 2, 3], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
             [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7], [4, 5, 6], [4, 6, 7]]
    grid = np.linspace(0, 80, 81)
    u, v = np.meshgrid(grid, grid)
    plane = np.column_stack((u.ravel(), v.ravel(), np.zeros(u.size)))
    opposite = plane + [0, 0, 80]
    reference = np.unique(np.vstack([p[:, order] for p in (plane, opposite)
                                     for order in ([0, 1, 2], [0, 2, 1], [2, 0, 1])]), axis=0)
    landmarks = vertices[[0, 1, 3, 4, 2, 5]]
    return vertices, faces, reference, landmarks


def test_similarity_recovers_pose_and_scale():
    _, _, _, target = cube_fixture()
    rotation = np.array([[0, -1, 0], [1, 0, 0], [0, 0, 1]])
    source = (target - [15, 23, -10]) @ rotation.T / 5
    scale, fitted_rotation, offset = similarity(source[:4], target[:4])
    assert scale == pytest.approx(5)
    assert np.allclose(scale * source @ fitted_rotation + offset, target)
    with pytest.raises(ValueError, match="profundidade"):
        similarity(target[[0, 1, 2, 4]], target[[0, 1, 2, 4]])


def test_control_landmark_rejects_misalignment():
    vertices, faces, reference, landmarks = cube_fixture()
    incorrect = landmarks.copy()
    incorrect[5, 2] += 20
    result = evaluate({"vertices": vertices, "faces": faces}, incorrect, landmarks,
                      cKDTree(reference), threshold=2, limit=4, count=20_000)
    assert result["alinhamento_aceito"] is False
    assert result["erros_controle_mm"][1] == pytest.approx(20)
    assert "referencia_para_malha" not in result


@pytest.mark.parametrize("use_bundle", [False, True])
def test_cli_detects_missing_surface_with_shared_reference(tmp_path, use_bundle):
    vertices, faces, reference, landmarks = cube_fixture()
    case_id = str(uuid4())
    photo = {"case_id": case_id, "unit": "relative", "capture_source": "photos",
             "vertices": vertices.tolist(), "faces": faces}
    video = {**photo, "capture_source": "video", "vertices": (vertices / 2).tolist(), "faces": faces[:-2]}
    paths = {}
    for name, obj in (("fotos", photo), ("video", video),
                      ("marcos", {"case_id": case_id, "photos": landmarks.tolist(), "video": (landmarks / 2).tolist()}),
                      ("referencia-marcos", {"points_mm": landmarks.tolist()})):
        paths[name] = tmp_path / f"{name}.json"
        paths[name].write_text(json.dumps(obj))
    ply = tmp_path / "referencia.ply"
    with ply.open("w") as out:
        out.write(f"ply\nformat ascii 1.0\nelement vertex {len(reference)}\n")
        out.write("property float x\nproperty float y\nproperty float z\nend_header\n")
        np.savetxt(out, reference, fmt="%.1f")
    report = tmp_path / "report.json"
    cli = Path(__file__).resolve().parents[1] / "comparar_geometria.py"
    if use_bundle:
        bundle = tmp_path / "comparacao.json"
        bundle.write_text(json.dumps({
            "schema_version": 1, "photos": photo, "video": video,
            "landmarks": json.loads(paths["marcos"].read_text())
        }))
        for name in ("fotos", "video", "marcos"):
            paths.pop(name)
        paths["pacote"] = bundle
    result = subprocess.run([sys.executable, str(cli), "--referencia-ply", str(ply), "--limiar-mm", "2",
                             "--max-erro-marcos-mm", "4", "--saida", str(report),
                             *(item for key, value in paths.items() for item in ("--" + key, str(value)))],
                            capture_output=True, text=True, check=True)
    assert "Relatório salvo" in result.stdout
    output = json.loads(report.read_text())
    assert output["comparavel"] is True
    result_photos = output["metodos"]["photos"]
    result_video = output["metodos"]["video"]
    assert result_photos["referencia_para_malha"]["percentual_no_limiar"] > 99
    assert 83 < result_video["referencia_para_malha"]["percentual_no_limiar"] < 88
    assert result_video["malha_para_referencia"]["percentual_no_limiar"] > 99
