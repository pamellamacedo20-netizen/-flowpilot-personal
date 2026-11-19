"""Isolated CPU stereo stage with a small, explicit output contract."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import numpy as np
from backend.stereo import refine_points

if __name__ == '__main__':
    source, images, output = map(Path, sys.argv[1:])
    try:
        with np.load(source, allow_pickle=False) as archive:
            model = {key: archive[key] for key in archive.files}
        points, colors, stats = refine_points(model, images)
        np.savez(output, points=points, colors=colors)
        output.with_suffix('.json').write_text(json.dumps(stats))
    except ValueError:
        sys.exit(2)
