# Editable cassette artwork

Open any `.svg` here directly in Affinity Designer, Inkscape, or another vector
editor. Save/export back to the same filename to update the website.

## Parts and stacking order

| File | Artwork |
| --- | --- |
| `shell.svg` | Outer plastic shell and inset rim |
| `label.svg` | Paper label silhouette |
| `label-stripes.svg` | Three distressed label stripes |
| `lettering.svg` | Band name, record label, tape specification |
| `side-badge.svg` | Side A box and letter |
| `tape-window.svg` | Dark window and surrounding rim |
| `tape.svg` | Magnetic tape between the reels |
| `reel-left.svg` | Independently editable left reel |
| `reel-right.svg` | Independently editable right reel |
| `lower-panel.svg` | Trapezoid panel along the lower edge |
| `guide-hole.svg` | One guide hole, reused four times |
| `screw.svg` | One screw, reused at all four corners |

All colors, outlines, shapes, and lettering are in these files. There are no
CSS-drawn cassette parts. Artwork uses named SVG groups for easier selection.
The pieces use the existing monochrome light/dark palette; you can change
their fills and strokes in your editor.

## Preserve alignment

Full-cassette layers have a **430 × 270** artboard/viewBox. Keep that artboard
size and export the entire page/artboard, **not just the selection or drawing**.
Transparent space is intentional: it keeps separate layers aligned. You can
import these full-size files onto matching layers in one editor document to
preview your design, then export each layer separately on the same artboard.

Reels use a **64 × 64** artboard with a rotation pivot at **(32, 32)**. Keep your
art centered on that point. Screws and guide holes use **12 × 12** artboards.
The reel SVGs use SVG clones (`<use>`) for the six spokes; unlink clones in
your editor if you want to edit each spoke separately.

`../../cassette.css` controls placement using the 430 × 270 coordinate grid:

- Left reel: upper-left **(76, 113)**; right reel: **(290, 113)**.
- Both reels: **64 × 64**; center pivots **(108, 145)** and **(322, 145)**.
- Screws: **6** units inward from each shell corner.
- Guide holes: x = **119, 174, 244, 299**, y = **247**.

If you reposition a reel window in the artwork, adjust the reel coordinates
in `cassette.css` to match. The page scales every part together responsively.
`index.html` controls stacking order (later images appear on top).

## Lettering / fonts

The lettering remains editable SVG text. Install **UnifrakturCook**,
**Jolly Lodger**, and **Pirata One** locally when editing. SVGs displayed as
images cannot inherit the page's Google Fonts stylesheet, so text can fall
back to system fonts. For consistent lettering on every device, convert text
to curves/paths in your editor before exporting. Keep an editable text copy
in your working design document.

## Animation and publishing

CSS rotates the two reel images around their centers while the music player's
`.is-playing` class is present. Pause/stop freezes their current angle; resume
continues it. Reduced-motion preferences disable rotation. Do not add reel
animation inside the SVG files; the page controls playback synchronization.

The assets are included in GitHub Pages deployment and the offline shell.
After editing files, increment `VERSION` in `../../sw.js` so returning visitors
receive the updated artwork after the service worker updates.
