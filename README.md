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
become links). `location` is an optional `latitude,longitude` pair used only by
the map; coordinates are omitted from visible event details. Text locations
still appear as details. Multiple shows on one date are supported.

Maps use lazy-loaded Leaflet 1.9.4 with standard OpenStreetMap tiles. A CSS
filter on `.leaflet-tile-pane` provides the dark, monochrome treatment without
affecting the high-contrast pin or controls. Attribution stays visible in a
compact strip below the map instead of covering its contents. Leaflet loads
from unpkg with integrity checks; if unavailable, the direct OSM link remains.
Only visible maps request tiles; browser caching is preserved and tiles are
not downloaded for offline use. See the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Member profiles

The **Members** carousel sits between Bootlegs and Upcoming shows. Edit
`members.json` to update names, instruments, pronouns, species, hometowns,
biographies, `Phrases`, social links, and card image paths. `*Emphasis*` in a bio
is supported as text formatting; HTML is not interpreted.

The selected member uses `card_front` (a static JPEG); neighboring cards show
looping `card_back` WebPs. Every selection draws a random speech-bubble phrase,
avoiding the last phrase used for that member when there are alternatives.
Navigate with the angular arrows, side cards, numbered selectors, or keyboard
left/right arrows. Social links use labeled SVG icon buttons; current data uses
Instagram, Bluesky, and Website. YouTube, TikTok, Bandcamp, and Spotify icons
are also available in `members.js`; unknown platforms use a website icon.

`members.css` controls the carousel styling and speech-bubble shape. Data and
media load near the section. Reduced-motion, data-saving, hidden-tab, and
offscreen states use `card_back_still` fallbacks instead of animated backs.

The website and Pages deployment use **only checked-in JPEG/WebP assets**.
Raw movies are disposable, optional inputs to a manual one-off utility. No
deployment step converts member movies or requires them to exist. Keep the
generated `.webp` and `-still.webp` files and reference them in `members.json`.

To convert one movie into one looping WebP, run locally:

```sh
python3 scripts/encode-member-cards.py "/path/to/Nikki.mov" images/members/backs/Nikki.webp
```

This requires FFmpeg and Pillow and writes only the named output: 480 × 480,
12fps, infinitely looping WebP. To create one still fallback, invoke separately:

```sh
python3 scripts/encode-member-cards.py "/path/to/Nikki.mov" images/members/backs/Nikki-still.webp --still
```

There are no hardcoded member names or source folders in the converter. It
is never called by GitHub Actions. Archive/delete the input movie whenever
you like; add the finished WebP files to version control. The Pages workflow
validates all JSON-referenced assets and rejects published raw movies with
`scripts/check-member-assets.py _site` (validation only, no generation).

If a back image cannot load, the carousel falls back to its still image and
then the front portrait. Pronouns, species, and place use labeled icon fields;
their editable vector icons are in `assets/member-fields/`.

## Background assets

### Editing the cassette

Every visual cassette part is a discrete SVG in [`assets/cassette/`](assets/cassette/).
Open these files directly in Affinity Designer or Inkscape. See the
[artwork editing guide](assets/cassette/README.md) for layer dimensions,
reel pivots, text-to-path export, and placement. `cassette.css` assembles the
layers and rotates the reels in sync with playback.

To reuse the inline therian symbol in any paragraph, insert:

```html
<svg class="inline-symbol" role="img" aria-label="Therian" focusable="false"><use href="#therian-symbol"/></svg>
```

It inherits the surrounding text color and font size. Add an ordinary space
after it when placing it before a word.

The scenery fades in independently of the logo. In `style.css`, adjust
`--coyote-right-inset` to move the coyote's right edge farther inside the screen,
`--coyote-bottom-inset` for its bottom clearance, and `--scenery-fade-duration`
for the entrance timing. Its size is constrained to fit the viewport initially;
scrolling still sends it off to the left. Reduced-motion preferences disable
the scenery entrance fades.

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

### Social link previews

Social crawlers read metadata directly from `index.html` without running
JavaScript. The Pages workflow must publish `images/` alongside the page:

- `images/og-image.jpg`: 1120 × 630 JPEG for Open Graph clients, including
  Facebook, Bluesky, LinkedIn, Discord, Slack, and messaging link previews.
- `images/twitter-image.jpg`: 1200 × 675 JPEG for X/Twitter's large image card.

Both images are below 1 MB and use absolute HTTPS URLs. Alt text, Open Graph
dimensions/type, and the canonical URL are declared in the document head.
Platforms control the final crop/layout; some clients may choose a small card.

The workflow checks metadata and image files in the actual `_site` artifact
before publishing. Run the same check locally:

```sh
python3 scripts/check-social-previews.py
```

After deployment, verify actual HTTP responses, MIME types, and image content:

```sh
python3 scripts/check-social-previews.py https://queen.carri.one/
```

To confirm Bluesky's public card extractor sees the card, open
<https://cardyb.bsky.app/v1/extract?url=https%3A%2F%2Fqueen.carri.one%2F>
and check its `image` URL also returns an image. Then paste the site URL into
a new Bluesky post and wait for the preview before posting. Existing Bluesky
posts contain their original embed and will not be repaired retroactively.

Social platforms cache previous fetches, including missing images. After
deployment, request another scrape with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
For other platforms, compose a new share after their cache refreshes; a fresh
page query such as `?share=2` can help trigger a new page fetch, though image
caching and preview support remain platform-specific. When replacing artwork,
use a new image filename and update the corresponding metadata to invalidate
cached images.

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
shell cache. Completed updates activate immediately. HTML, scripts, styles,
and JSON use network-first fetching with an offline cache fallback so a fresh
page does not keep using obsolete initialization code. Returning visitors
with a pre-fix service worker may need one reload after the update activates.
