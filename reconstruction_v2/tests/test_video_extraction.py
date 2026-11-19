from pathlib import Path
import shutil
import subprocess
import pytest
import numpy as np
from PIL import Image
from video_frames import extract_video_frames


def test_real_video_extraction_keeps_native_size_and_original(tmp_path):
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        pytest.skip('FFmpeg não instalado')
    source=tmp_path/'source';source.mkdir()
    rng=np.random.default_rng(27)
    texture=rng.integers(0,255,(480,900,3),dtype='uint8')
    for i in range(16):
        Image.fromarray(texture[:,i*10:i*10+640]).save(source/f'{i:03}.png')
    video=tmp_path/'video.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-framerate','4','-i',str(source/'%03d.png'),
                    '-c:v','libx264','-pix_fmt','yuv420p',str(video)],check=True)
    original=video.read_bytes()
    frames=tmp_path/'frames';frames.mkdir()
    selected=extract_video_frames(video,frames,12)
    assert len(selected)==12
    for file in selected:
        with Image.open(file) as image: assert image.size==(640,480)
    assert video.read_bytes()==original
