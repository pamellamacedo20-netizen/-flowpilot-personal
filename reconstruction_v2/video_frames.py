"""Extract varied, sharp-enough keyframes without modifying the source video."""
from pathlib import Path
import math
import subprocess

import numpy as np
from PIL import Image


def run_media_tool(*args: str) -> str:
    try:
        return subprocess.run(args, capture_output=True, text=True, check=True, timeout=180).stdout
    except FileNotFoundError as exc:
        raise ValueError("Instale FFmpeg e FFprobe para processar o vídeo.") from exc
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise ValueError("Não foi possível ler o vídeo. Use um arquivo MOV ou MP4 válido.") from exc


def extract_video_frames(video: Path, directory: Path, limit: int) -> list[Path]:
    if not video.is_file() or video.suffix.lower() not in {".mov", ".mp4", ".m4v"}:
        raise ValueError("Selecione um arquivo MOV ou MP4 existente.")
    duration = run_media_tool("ffprobe", "-v", "error", "-protocol_whitelist", "file",
                              "-f", "mov", "-show_entries", "format=duration",
                              "-of", "default=noprint_wrappers=1:nokey=1", str(video.resolve()))
    try:
        seconds = float(duration.strip())
    except ValueError as exc:
        raise ValueError("Não foi possível determinar a duração do vídeo.") from exc
    if not math.isfinite(seconds) or not 3 <= seconds <= 180:
        raise ValueError("Use um vídeo com duração de 3 a 180 segundos.")

    sample_rate = min(12, 144 / seconds)
    run_media_tool("ffmpeg", "-nostdin", "-v", "error", "-threads", "2",
                   "-protocol_whitelist", "file", "-f", "mov", "-i", str(video.resolve()),
                   "-map", "0:v:0", "-filter_threads", "2", "-vf",
                   f"fps={sample_rate:.8f},scale=w='min(1800,iw)':h='min(1800,ih)':force_original_aspect_ratio=decrease",
                   "-frames:v", "144", "-q:v", "3", str(directory / "frame-%03d.jpg"))
    candidates = []
    for frame in sorted(directory.glob("frame-*.jpg")):
        with Image.open(frame) as image:
            gray = image.convert("L")
            preview = gray.copy()
            preview.thumbnail((320, 320))
            pixels = np.asarray(preview, dtype=np.float32)
            center = pixels[1:-1, 1:-1]
            laplacian = (pixels[:-2, 1:-1] + pixels[2:, 1:-1] +
                         pixels[1:-1, :-2] + pixels[1:-1, 2:] - 4 * center)
            signature = np.asarray(gray.resize((48, 48)), dtype=np.float32)
        candidates.append((frame, float(laplacian.var()), signature))

    selected = []
    # Time buckets keep the selection spread across the entire clip.
    for bucket in np.array_split(np.arange(len(candidates)), limit):
        for index in sorted(bucket, key=lambda i: candidates[i][1], reverse=True):
            frame, sharpness, signature = candidates[index]
            if sharpness < 3:
                continue
            if all(float(np.abs(signature - previous).mean()) >= 1.5 for _, previous in selected):
                selected.append((frame, signature))
                break
    if len(selected) < 12:
        raise ValueError(f"Quadros úteis encontrados no vídeo: {len(selected)}. "
                         "Grave com foco estável e mova a câmera entre os ângulos.")
    return [frame for frame, _ in selected]
