#!/usr/bin/env python3
"""Build a static playlist from every MP3 in music/, including its ID3 metadata.

Requires ffprobe (part of FFmpeg). Run before publishing; GitHub Actions does this
automatically. Album artwork is deliberately omitted.
"""

import json
from pathlib import Path
import subprocess
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent


def generate():
    tracks = []
    for path in sorted((ROOT / "music").rglob("*"), key=lambda p: str(p).casefold()):
        if path.suffix.lower() != ".mp3":
            continue
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_format", "-of", "json", str(path)],
            capture_output=True, text=True, check=True,
        )
        info = json.loads(result.stdout)["format"]
        tags = {key.lower(): value for key, value in info.get("tags", {}).items()}
        tracks.append({
            "src": "./" + quote(path.relative_to(ROOT).as_posix()),
            "file": path.name,
            "title": tags.get("title", path.stem),
            "artist": tags.get("artist", "Carrion Queen"),
            "album": tags.get("album", ""),
            "year": tags.get("date", tags.get("year", "")),
            "genre": tags.get("genre", ""),
            "composer": tags.get("composer", ""),
            "duration": round(float(info.get("duration", 0)), 3),
            "tags": {key: value for key, value in tags.items()
                     if key not in ("itunnorm", "itunsmpb", "encoder")},
        })
    target = ROOT / "music" / "playlist.json"
    target.write_text(json.dumps(tracks, indent=2, ensure_ascii=False) + "\n")
    print(f"Generated {target.relative_to(ROOT)}: {len(tracks)} tracks")


if __name__ == "__main__":
    generate()
