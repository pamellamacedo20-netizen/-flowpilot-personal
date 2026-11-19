"""Heuristic camera-trajectory guidance; not anatomical coverage estimation."""
import numpy as np


def capture_guidance(model, geometry):
    matrices = model.get('camera_matrices')
    if matrices is None or len(matrices)<4:
        return 'Poucas câmeras disponíveis para orientar a próxima captura.'
    centers=np.array([-m[:,:3].T@m[:,3] for m in matrices])
    points=np.asarray(geometry.vertices)
    center=np.median(points,axis=0)
    radius=max(float(np.linalg.norm(np.ptp(points,axis=0))/2),1e-12)
    baseline=float(np.linalg.norm(np.ptp(centers,axis=0)))
    if not np.isfinite(centers).all():return 'Trajetória de câmeras indisponível.'
    if baseline < .05*radius:
        return 'Pouca mudança de posição da câmera. Mova-a ao redor do objeto, mantendo-o imóvel; apenas girar a câmera não acrescenta a mesma informação 3D.'
    rays=centers-center
    length=np.linalg.norm(rays,axis=1)
    if (length<1e-12).any():return 'Trajetória de câmeras insuficiente para orientar a captura.'
    rays=rays/length[:,None]
    angle=np.degrees(np.arccos(np.clip((rays@rays.T).min(),-1,1)))
    if angle<35:
        return 'Pouca variação angular entre as vistas registradas. Acrescente uma passagem ao redor de outras faces do objeto.'
    eigenvalues=np.linalg.eigvalsh(np.cov(centers.T))
    if eigenvalues[0] < .08*max(eigenvalues[-1],1e-20):
        return 'Vistas concentradas em uma faixa quase plana. Acrescente uma segunda passagem fora dessa faixa, em outro nível e ângulo, com sobreposição.'
    return 'Câmeras distribuídas em três dimensões. Isso não comprova cobertura completa: confira regiões ausentes e bordas abertas.'
