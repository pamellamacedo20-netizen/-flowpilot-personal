"""Run COLMAP on CPU in an isolated process and export the best component."""
import sys
import os
import json
from pathlib import Path

import numpy as np
import pycolmap


def reconstruct(image_dir: Path, output: Path, independent: bool = False, hybrid: bool = False) -> None:
    database = output / "database.db"
    from PIL import Image

    sizes = set()
    for path in image_dir.glob("*.jpg"):
        with Image.open(path) as image:
            sizes.add(image.size)
    original_image_dir = image_dir
    original_names = [p.name for p in sorted(original_image_dir.glob("*.jpg"))]
    masks = output.parent / "masks"
    if hybrid:
        composition = json.loads((output.parent/"hybrid-inputs.json").read_text())
        grouped = output/"grouped-images"
        grouped_masks = output/"grouped-masks"
        for index, name in enumerate(original_names):
            group = "photos" if index < composition["photos"] else "video"
            destination = grouped/group/name
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists(): os.link(image_dir/name, destination)
            if masks.is_dir():
                target = grouped_masks/group/(name+".png")
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists(): os.link(masks/(name+".png"), target)
        image_dir = grouped
        masks = grouped_masks
    camera_mode = pycolmap.CameraMode.SINGLE if len(sizes) == 1 and not independent else pycolmap.CameraMode.PER_IMAGE
    if hybrid: camera_mode = pycolmap.CameraMode.PER_FOLDER
    reader = pycolmap.ImageReaderOptions(camera_model="SIMPLE_RADIAL")
    if masks.is_dir():
        reader.mask_path = masks
    pycolmap.extract_features(
        database, image_dir, camera_mode=camera_mode,
        reader_options=reader,
        extraction_options=pycolmap.FeatureExtractionOptions(max_image_size=1800, num_threads=2),
        device=pycolmap.Device.cpu,
    )
    pycolmap.match_exhaustive(
        database, matching_options=pycolmap.FeatureMatchingOptions(num_threads=2),
        device=pycolmap.Device.cpu,
    )
    models = pycolmap.incremental_mapping(
        database, image_dir, output,
        options=pycolmap.IncrementalPipelineOptions(num_threads=2, random_seed=0, extract_colors=True, max_runtime_seconds=600),
    )
    if not models:
        print("no_model")
        return
    model = max(models.values(), key=lambda candidate: (candidate.num_reg_images(), candidate.num_points3D()))
    samples = [point for point in model.points3D.values()
               if point.track.length() >= 3 and 0 <= point.error <= 2.5]
    from triangulation_quality import supported_samples, MIN_TRIANGULATION_DEGREES
    centers_by_image = {}
    for image_id in model.reg_image_ids():
        transform = model.images[image_id].cam_from_world().matrix()
        centers_by_image[image_id] = -transform[:, :3].T @ transform[:, 3]
    candidate_count = len(samples)
    samples, angles = supported_samples(samples, centers_by_image)
    print(f"triangulation: {len(samples)}/{candidate_count} points accepted", flush=True)
    points = np.asarray([point.xyz for point in samples], dtype=np.float64).reshape(-1, 3)
    colors = np.asarray([point.color for point in samples], dtype=np.uint8).reshape(-1, 3)
    registered_images = sorted((model.images[image_id] for image_id in model.reg_image_ids()), key=lambda image: image.name)
    registered_names = {Path(image.name).name for image in registered_images}
    input_names = original_names
    camera_indices = np.asarray([input_names.index(Path(image.name).name) for image in registered_images], dtype=np.int64)
    camera_matrices = np.stack([image.cam_from_world().matrix() for image in registered_images])
    camera_params = np.stack([model.cameras[image.camera_id].params for image in registered_images])
    camera_sizes = np.asarray([[model.cameras[image.camera_id].width, model.cameras[image.camera_id].height]
                               for image in registered_images], dtype=np.int64)
    registered_indices = [index for index, path in enumerate(sorted(original_image_dir.glob("*.jpg")))
                          if path.name in registered_names]
    np.savez(output / "points.npz", points=points, colors=colors, registered=model.num_reg_images(),
             registered_indices=np.asarray(registered_indices, dtype=np.int64),
             independent=camera_mode == pycolmap.CameraMode.PER_IMAGE, grouped=hybrid,
             triangulation_candidates=candidate_count, triangulation_accepted=len(samples),
             triangulation_minimum=MIN_TRIANGULATION_DEGREES,
             triangulation_angles=angles,
             camera_indices=camera_indices, camera_matrices=camera_matrices,
             camera_params=camera_params, camera_sizes=camera_sizes)


if __name__ == "__main__":
    reconstruct(Path(sys.argv[1]), Path(sys.argv[2]), len(sys.argv) > 3 and sys.argv[3] == "independent",
                hybrid=len(sys.argv) > 3 and sys.argv[3] == "hybrid")
