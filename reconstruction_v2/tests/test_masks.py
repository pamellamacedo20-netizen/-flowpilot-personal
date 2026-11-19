from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageDraw

from preparar_mascaras import background_mask, prepare


def object_photo():
    image = Image.new("RGB", (640, 480), (40, 90, 160))
    ImageDraw.Draw(image).ellipse((180, 80, 460, 400), fill=(170, 110, 70))
    return image


def test_uniform_background_removed_and_object_retained():
    result = np.asarray(background_mask(object_photo()))
    assert result[240, 320] == 255
    assert (result[0] == 0).all()
    assert (result[:, 0] == 0).all()


def test_uniform_image_and_nonuniform_border_rejected():
    with pytest.raises(ValueError):
        background_mask(Image.new('RGB', (640, 480), 'white'))
    pixels = np.random.default_rng(4).integers(0, 255, (480, 640, 3), dtype=np.uint8)
    with pytest.raises(ValueError):
        background_mask(Image.fromarray(pixels))


def test_batch_preserves_originals_and_produces_review(tmp_path):
    photos = tmp_path / 'photos'
    photos.mkdir()
    for i in range(12):
        object_photo().save(photos / f'{i}.jpg')
    originals = {p.name: p.read_bytes() for p in photos.iterdir()}
    output = tmp_path / 'masks'
    assert prepare(photos, output, 24) == 12
    assert len(list(output.glob('*.jpg.png'))) == 12
    assert (output / 'REVISAO.jpg').exists()
    assert originals == {p.name: p.read_bytes() for p in photos.iterdir()}
    with pytest.raises(ValueError):
        prepare(photos, output, 24)


def test_failed_batch_leaves_no_partial_output(tmp_path):
    photos = tmp_path / 'photos'
    photos.mkdir()
    for i in range(12):
        object_photo().save(photos / f'{i}.jpg')
    Image.new('RGB', (640, 480), 'white').save(photos / '9.jpg')
    with pytest.raises(ValueError):
        prepare(photos, tmp_path / 'masks', 24)
    assert not (tmp_path / 'masks').exists()
