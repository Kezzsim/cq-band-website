#!/usr/bin/env python3
"""One-off movie → WebP conversion. Never run by deployment.

python3 scripts/encode-member-cards.py input.mov output.webp
python3 scripts/encode-member-cards.py input.mov still.webp --still
Requires FFmpeg and Pillow. Writes only the explicitly named output file.
"""
import argparse
from pathlib import Path
import subprocess
from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--still", action="store_true", help="Export just the first frame")
    args = parser.parse_args()
    if not args.input.is_file():
        parser.error(f"Input does not exist: {args.input}")
    if args.output.suffix.lower() != ".webp":
        parser.error("Output must be a .webp file")
    if not args.output.parent.is_dir():
        parser.error("Output directory must already exist")
    if args.input.resolve() == args.output.resolve():
        parser.error("Input and output must be different files")

    size, fps = 480, 12
    filters = f"scale={size}:{size}" if args.still else f"fps={fps},scale={size}:{size}"
    command = ["ffmpeg", "-v", "error", "-i", str(args.input), "-an", "-vf", filters]
    if args.still:
        command += ["-frames:v", "1"]
    command += ["-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"]
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    frames = []
    try:
        while True:
            data = process.stdout.read(size * size * 3)
            if not data:
                break
            if len(data) != size * size * 3:
                raise RuntimeError("Incomplete decoded frame")
            frames.append(Image.frombytes("RGB", (size, size), data))
        if process.wait() or not frames:
            raise RuntimeError(f"Could not decode {args.input}")
    finally:
        process.stdout.close()
        if process.poll() is None:
            process.kill()
            process.wait()

    if args.still:
        frames[0].save(args.output, quality=80, method=6)
    else:
        durations = [round((i + 1) * 1000 / fps) - round(i * 1000 / fps)
                     for i in range(len(frames))]
        frames[0].save(args.output, save_all=True, append_images=frames[1:],
                       duration=durations, loop=0, quality=65, method=4,
                       minimize_size=True)
    print(f"Created {args.output}: {len(frames)} frames, {args.output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
