"""Accept continuity proposals only after geometric and multi-view checks."""
import importlib.util
import os
import subprocess
import sys
from dataclasses import replace
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np

from .surface_review import clip_to_selections, topology_report


def triangle_area(points, faces):
    tri = np.asarray(points)[np.asarray(faces)]
    return float(np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1).sum()/2)


def admissible(original, candidate):
    """Heuristics reject fragmentation, new nonmanifold edges and large area jumps."""
    before, after = topology_report(original.faces), topology_report(candidate.faces)
    before_area = triangle_area(original.vertices,original.faces)
    after_area = triangle_area(candidate.vertices,candidate.faces)
    return (len(candidate.faces) > len(original.faces) and len(candidate.faces) <= 16384
            and .85 <= after_area/max(before_area,1e-30) <= 1.35
            and after['nonmanifold_edges'] == 0
            and after['boundary_edges'] < .85*before['boundary_edges']
            and after['largest_component_faces']/len(candidate.faces)
                >= before['largest_component_faces']/len(original.faces)
            and after['components'] <= before['components'])


def improve_continuity(surface, model, image_dir: Path):
    fallback = 'Continuidade: malha inicial mantida; proposta sem ganho geométrico consistente.'
    if not (image_dir.parent/'masks').is_dir():
        return surface, None, 'Continuidade: revise e envie seleções das fotos para habilitar a conferência multi-vista.'
    if not {'camera_indices','camera_matrices','camera_params','camera_sizes'}.issubset(model):
        return surface, None, 'Continuidade: câmeras registradas indisponíveis; malha inicial mantida.'
    if importlib.util.find_spec('open3d') is None:
        return surface, None, 'Continuidade indisponível: atualize o backend com Open3D; malha inicial mantida.'
    try:
        with TemporaryDirectory(prefix='graftmap-continuity-') as folder:
            source, output = Path(folder)/'input.npz', Path(folder)/'output.npz'
            np.savez(source, points=np.asarray(surface.vertices))
            result = subprocess.run([sys.executable,str(Path(__file__).with_name('continuity_worker.py').resolve()),
                                     str(source),str(output)], stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
                                    timeout=45,env={**os.environ,'OMP_NUM_THREADS':'1','OPENBLAS_NUM_THREADS':'1'})
            if result.returncode != 0 or not output.is_file(): return surface,None,fallback
            with np.load(output,allow_pickle=False) as data: faces = data['faces']
        if (faces.ndim != 2 or faces.shape[1] != 3 or not 50 <= len(faces) <= 16384
                or not np.issubdtype(faces.dtype,np.integer) or faces.min()<0 or faces.max()>=len(surface.vertices)
                or np.any(np.diff(np.sort(faces,axis=1),axis=1)==0)):
            return surface,None,fallback
        proposal = replace(surface,faces=faces.tolist())
        proposal, selection = clip_to_selections(proposal,model,image_dir)
        if not admissible(surface,proposal): return surface,None,fallback
        before, after = topology_report(surface.faces),topology_report(proposal.faces)
        message = (f"Continuidade experimental por ball pivoting: {len(surface.faces)} → {len(proposal.faces)} faces; "
                   f"{before['boundary_edges']} → {after['boundary_edges']} arestas de borda. "
                   'Coordenadas dos vértices usados preservadas; fechamento e precisão não comprovados.')
        return proposal,selection,message
    except (OSError,ValueError,RuntimeError,KeyError,subprocess.TimeoutExpired):
        return surface,None,fallback
