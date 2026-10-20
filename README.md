# Carrion Queen

A static, installable band site for https://queen.carri.one (also https://roadkill.gay).
No application server or JavaScript build step is required.

## Preview locally

From this directory, run `python3 -m http.server 8000`, then open
http://localhost:8000. Use HTTP rather than opening `index.html` directly so that
the playlist, calendar, and service worker can load.
For streaming/seek testing, use a server with HTTP byte-range support (such as
GitHub Pages); Python's simple server does not support media range requests.

## Add music

Drop MP3 files into `music/` (subdirectories work too). Title, artist, album,
year, genre, and composer are read from ID3 tags. Files without tags fall back
to their filename and the band name. Artwork is not displayed.

Run `python3 scripts/generate-playlist.py` after adding or updating tracks.
This requires `ffprobe`, included with FFmpeg (`brew install ffmpeg` on macOS).
The generated `music/playlist.json` is served directly by the static site.
GitHub Pages deployment regenerates it automatically on every push to `main`.

The player supports play, pause, stop, previous/next, seeking, MP3 downloads,
and lock-screen/headset controls through the Media Session API. Audio starts
only after a tap and is never paused when the page is hidden. Background and
lock-screen playback depend on the browser and operating system; verify on
the actual iOS/Android devices you support. Download a song to keep it offline.

## Update shows

Edit `calendar.json`:

```json
{
  "events": [
    {
      "title": "Carrion Queen live",
      "date": "2026-11-25",
      "time": "6:00 PM EST",
      "location": "40.8557006,-73.2022971",
      "venue": "Katie's of Smithtown",
      "doors": "5:30 PM",
      "tickets": "https://example.com/tickets",
      "notes": "Bring your friends."
    }
  ]
}
```

Dates are local `YYYY-MM-DD` values. Only today and future dates appear; only
months with shows are rendered. An empty events array hides the entire shows
section. Hover, tap, or keyboard-focus a marked date to view all its shows.
Additional keys are automatically rendered as detail text (HTTP/HTTPS URLs
become links). `location` is an optional `latitude,longitude` pair for the
lazy-loaded OpenStreetMap embed. Multiple shows on one date are supported.

## Background assets

`Logo.webp` is preloaded and runs independently of all scripts and data.
It is already configured to play once. Keep this file mounted when editing
the page so its animation is not restarted.

The two original 60-second masters remain in `videobg/*_raw.mp4`.
The site serves only `landscape.mp4` (1280×720) or `portrait.mp4` (540×960),
24fps H.264, CRF 32, capped at 1.4 Mbps landscape / 0.8 Mbps portrait,
no audio, with fast-start metadata. Only the required
orientation downloads. A second video element crossfades orientation changes
after the new video is ready, preserving the loop position where possible.
Reduced-motion and data-saving preferences initially use a still image;
the footer button can enable or pause the background. Hidden tabs pause only
the background video, never the music.

To re-encode after replacing the masters:

```sh
ffmpeg -i videobg/cqcom_bgloop_H_raw.mp4 -map 0:v:0 -vf "scale=1280:720,fps=24" -c:v libx264 -preset slow -crf 32 -maxrate 1400k -bufsize 2800k -pix_fmt yuv420p -movflags +faststart -an videobg/landscape.mp4
ffmpeg -i videobg/cqcom_bgloop_V_raw.mp4 -map 0:v:0 -vf "scale=540:960,fps=24" -c:v libx264 -preset slow -crf 32 -maxrate 800k -bufsize 1600k -pix_fmt yuv420p -movflags +faststart -an videobg/portrait.mp4
ffmpeg -i videobg/landscape.mp4 -frames:v 1 -q:v 4 videobg/landscape.jpg
ffmpeg -i videobg/portrait.mp4 -frames:v 1 -q:v 4 videobg/portrait.jpg
```

## Publish / offline behavior

Choose **GitHub Actions** as the Pages source in repository settings. The
included workflow generates the playlist and uploads just the serving assets,
excluding the large video masters. Relative asset paths also support a Pages
project subdirectory. `CNAME` preserves the custom domain.

The manifest and service worker enable installation on supporting browsers
over HTTPS (localhost also works). The app shell and previously fetched show
and playlist data are available offline. Audio/video use native streaming and
range requests rather than being eagerly cached. Maps need a connection.
Fonts fall back to system fonts when Google Fonts is unavailable.

When deploying code changes, increment `VERSION` in `sw.js` to invalidate the
shell cache. An update activates after existing site tabs close.
