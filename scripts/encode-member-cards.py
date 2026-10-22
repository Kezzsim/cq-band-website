#!/usr/bin/env python3
"""Create looping member WebPs and still fallbacks from the ProRes masters.

Requires FFmpeg and Pillow. Raw masters are retained locally, not published.
"""
from pathlib import Path
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BACKS = ROOT / "images/members/backs"
SOURCES = {"Carrie": "CarrieRaw.mov", "Nikki": "NikkieRaw.mov",
           "Spike": "SpikeRaw.mov", "Luna": "LunaRaw.mov"}
SIZE, FPS = 480, 12

for name, source in SOURCES.items():
    process = subprocess.Popen([
        "ffmpeg", "-v", "error", "-i", str(BACKS / source), "-an",
        "-vf", f"fps={FPS},scale={SIZE}:{SIZE}",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ], stdout=subprocess.PIPE)
    frames = []
    while True:
        data = process.stdout.read(SIZE * SIZE * 3)
        if not data:
            break
        if len(data) != SIZE * SIZE * 3:
            raise RuntimeError(f"Incomplete frame in {source}")
        frames.append(Image.frombytes("RGB", (SIZE, SIZE), data))
    if process.wait() or not frames:
        raise RuntimeError(f"Could not decode {source}")
    frames[0].save(BACKS / f"{name}-still.webp", quality=80, method=6)
    # Alternating 83/84ms durations preserve the 12fps timeline.
    durations = [round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS)
                 for i in range(len(frames))]
    frames[0].save(BACKS / f"{name}.webp", save_all=True,
                   append_images=frames[1:], duration=durations,
                   loop=0, quality=65, method=4, minimize_size=True)
    print(f"{name}: {len(frames)} frames, {(BACKS / f'{name}.webp').stat().st_size:,} bytes")
