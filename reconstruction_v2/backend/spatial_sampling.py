"""Spatially balanced representatives; original coordinates remain unchanged."""
import numpy as np


def spatial_sample_indices(points, limit):
    points=np.asarray(points,dtype=np.float64)
    if (points.ndim!=2 or points.shape[1]!=3 or not np.isfinite(points).all()
            or not isinstance(limit,int) or limit<1):
        raise ValueError('Invalid sample parameters')
    if len(points)<=limit:return np.arange(len(points),dtype=np.int64)
    capacity=min(20000,max(3*limit,512))
    if limit>capacity:raise ValueError('Sample limit exceeds supported capacity')
    pool=np.arange(len(points),dtype=np.int64)
    if len(pool)>capacity:
        origin=points.min(axis=0)
        span=float(np.linalg.norm(np.ptp(points,axis=0)))
        if span<=0:return pool[:limit]
        low,high=span*1e-12,span
        # Bound preselection cost before O(pool*limit) farthest-point traversal.
        for _ in range(18):
            width=(low+high)/2
            cells=np.floor((points-origin)/width).astype(np.int64)
            count=len(np.unique(cells,axis=0))
            if count>capacity:low=width
            else:high=width
        cells=np.floor((points-origin)/high).astype(np.int64)
        _,inverse=np.unique(cells,axis=0,return_inverse=True)
        centers=origin+(cells+.5)*high
        error=np.sum((points-centers)**2,axis=1)
        ranked=np.lexsort((np.arange(len(points)),error,inverse))
        starts=np.r_[True,inverse[ranked][1:]!=inverse[ranked][:-1]]
        pool=ranked[starts]
        if len(pool)<limit:
            extras=np.setdiff1d(np.arange(len(points)),pool,assume_unique=True)
            # This rare fallback preserves the requested size for very uneven cells.
            pool=np.r_[pool,extras[np.linspace(0,len(extras)-1,limit-len(pool)).astype(int)]]
    samples=points[pool]
    delta=samples-samples.mean(axis=0)
    current=int(np.argmax(np.einsum('ij,ij->i',delta,delta)))
    minimum=np.full(len(samples),np.inf)
    chosen=[]
    for _ in range(limit):
        chosen.append(current)
        delta=samples-samples[current]
        np.minimum(minimum,np.einsum('ij,ij->i',delta,delta),out=minimum)
        minimum[chosen]=-1
        current=int(np.argmax(minimum))
    return np.sort(pool[np.asarray(chosen,dtype=np.int64)])
