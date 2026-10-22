#!/usr/bin/env python3
"""Validate a static site artifact's member assets; does not generate media."""
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent).resolve()
for file in ["members.json", "members.js", "members.css"]:
    assert (root / file).is_file(), f"Missing deployed file: {file}"
members = json.loads((root / "members.json").read_text())
assert isinstance(members, list) and members, "No member profiles"
for member in members:
    for key in ["card_front", "card_back", "card_back_still"]:
        url = urlsplit(member[key])
        assert not url.scheme and not url.netloc, f"{key} must be a local static asset"
        file = (root / unquote(url.path).lstrip("/")).resolve()
        assert file.is_relative_to(root), f"Asset outside site: {file}"
        assert file.is_file(), f"{member['Name']}: missing {key}: {file}"
        data = file.read_bytes()
        if key == "card_front":
            assert data.startswith(b"\xff\xd8\xff"), f"Not a JPEG: {file}"
        else:
            assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", f"Not a WebP: {file}"
    print(f"PASS {member['Name']}: ready-to-serve JPEG and WebPs")
assert not list((root / "images/members").rglob("*.[mM][oO][vV]")), "Raw movies must not be published"
print("PASS static members artifact — no raw movies or conversion required")
