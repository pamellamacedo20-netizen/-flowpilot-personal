"""Gere máscaras revisáveis de objetos fotografados contra fundo uniforme."""
import argparse
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image, ImageOps, ImageDraw
from scipy.ndimage import binary_propagation


def background_mask(image: Image.Image, tolerance: int = 24) -> Image.Image:
    if not 1 <= tolerance <= 80:
        raise ValueError("A tolerância deve estar entre 1 e 80.")
    pixels = np.asarray(image.convert("RGB"), dtype=np.int16)
    border = np.concatenate([pixels[0], pixels[-1], pixels[:, 0], pixels[:, -1]])
    reference = np.median(border, axis=0)
    matching_border = (np.max(np.abs(border - reference), axis=1) <= tolerance).mean()
    if matching_border < 0.7:
        raise ValueError("Fundo não uniforme nas bordas. Prepare uma máscara manual.")
    eligible = np.max(np.abs(pixels - reference), axis=2) <= tolerance
    seeds = np.zeros(eligible.shape, dtype=bool)
    seeds[0] = eligible[0]
    seeds[-1] = eligible[-1]
    seeds[:, 0] = eligible[:, 0]
    seeds[:, -1] = eligible[:, -1]
    foreground = ~binary_propagation(seeds, mask=eligible)
    fraction = foreground.mean()
    if not 0.05 <= fraction <= 0.9:
        raise ValueError("Área preservada insuficiente ou excessiva. Revise o enquadramento e o fundo.")
    return Image.fromarray(foreground.astype(np.uint8) * 255)


def prepare(folder: Path, destination: Path, tolerance: int) -> int:
    if destination.exists():
        raise ValueError("A pasta de saída já existe. Escolha uma pasta nova.")
    photos = sorted(p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg"} and p.is_file())
    if not 12 <= len(photos) <= 48:
        raise ValueError("A pasta deve conter de 12 a 48 fotografias JPEG.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix="graftmap-mask-", dir=destination.parent) as temporary:
        staging = Path(temporary) / "result"
        staging.mkdir()
        preview = Image.new("RGB", (960, ((len(photos) + 3) // 4) * 200), "white")
        for index, path in enumerate(photos):
            with Image.open(path) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")
                try:
                    mask = background_mask(image, tolerance)
                except ValueError as error:
                    raise ValueError(f"{path.name}: {error}") from error
                mask.save(staging / (path.name + ".png"))
                thumbnail = Image.composite(image, Image.new("RGB", image.size, (240, 60, 170)), mask)
                thumbnail.thumbnail((230, 170))
                origin = ((index % 4) * 240, (index // 4) * 200)
                preview.paste(thumbnail, origin)
                ImageDraw.Draw(preview).text((origin[0] + 4, origin[1] + 174), path.name[:30], fill="black")
        preview.save(staging / "REVISAO.jpg", quality=92)
        staging.rename(destination)
    return len(photos)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fotos", type=Path, required=True)
    parser.add_argument("--saida", type=Path, required=True)
    parser.add_argument("--tolerancia", type=int, default=24)
    args = parser.parse_args()
    try:
        count = prepare(args.fotos, args.saida, args.tolerancia)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(f"{count} máscaras geradas. Confira REVISAO.jpg antes de reconstruir. Rosa indica a área excluída.")


if __name__ == "__main__":
    main()
