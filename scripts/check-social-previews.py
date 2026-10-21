#!/usr/bin/env python3
"""Check static social cards in a Pages artifact or a live deployment.

Usage: python3 scripts/check-social-previews.py [directory | https://site/]
Requires ffprobe (already installed by the Pages workflow).
"""

from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = {}
        self.canonical = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = attrs.get("property", attrs.get("name"))
            if key:
                self.tags.setdefault(key, []).append(attrs.get("content", ""))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")

    def value(self, key):
        values = self.tags.get(key, [])
        assert len(values) == 1 and values[0].strip(), f"Missing/duplicate/empty {key}"
        return values[0]


def check(target):
    live = target.startswith("https://")
    root = Path(target).resolve() if not live else None

    def fetch(url):
        with urlopen(Request(url, headers={"User-Agent": "CarrionQueen-SocialPreviewCheck/1.0"}), timeout=30) as response:
            assert response.status == 200, f"{url}: HTTP {response.status}"
            return response.read(), response.headers.get_content_type()

    html = fetch(target)[0] if live else (root / "index.html").read_bytes()
    metadata = Metadata()
    metadata.feed(html.decode("utf-8"))
    canonical = metadata.value("og:url")
    assert metadata.canonical == canonical, "Canonical and og:url must match"
    assert canonical.startswith("https://"), "Canonical must use HTTPS"
    for key in ["og:title", "og:description", "og:site_name", "og:image:alt",
                "twitter:title", "twitter:description", "twitter:image:alt"]:
        metadata.value(key)
    assert metadata.value("og:type") == "website"
    assert metadata.value("twitter:card") == "summary_large_image"
    assert metadata.value("og:image:type") == "image/jpeg"
    assert metadata.value("og:image:secure_url") == metadata.value("og:image")

    for key in ["og:image", "twitter:image"]:
        url = metadata.value(key)
        parsed = urlsplit(url)
        assert parsed.scheme == "https" and parsed.netloc, f"{key}: absolute HTTPS URL required"
        assert parsed.netloc == urlsplit(canonical).netloc, f"{key}: unexpected image host"
        if live:
            image, mime = fetch(urljoin(target, parsed.path))
            assert mime == "image/jpeg", f"{key}: expected image/jpeg, received {mime}"
        else:
            path = (root / unquote(parsed.path).lstrip("/")).resolve()
            assert path.is_relative_to(root), f"{key}: image outside published directory"
            image = path.read_bytes()
        assert image.startswith(b"\xff\xd8\xff"), f"{key}: not a JPEG"
        # Keep both cards below 1 MB, including Bluesky's external-thumbnail limit.
        assert len(image) < 1_000_000, f"{key}: keep thumbnail below 1 MB"
        probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                                "-show_entries", "stream=width,height", "-of", "json", "pipe:0"],
                               input=image, capture_output=True, check=True)
        dimensions = json.loads(probe.stdout)["streams"][0]
        width, height = dimensions["width"], dimensions["height"]
        assert width >= 600 and height >= 315, f"{key}: image too small"
        assert 1.5 <= width / height <= 2.1, f"{key}: unexpected wide-card aspect ratio"
        if key == "og:image":
            assert width == int(metadata.value("og:image:width"))
            assert height == int(metadata.value("og:image:height"))
        print(f"PASS {key}: {width}×{height}, {len(image):,} bytes — {url}")
    print("PASS static Open Graph / Bluesky and X large-card metadata")


if __name__ == "__main__":
    check(sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent.parent))
