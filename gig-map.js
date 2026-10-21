// Loaded only when a show map enters the viewport. Leaflet is pinned with SRI.
let leafletReady;
function loadLeaflet() {
  if (!leafletReady) {
    leafletReady = Promise.all([
      new Promise((resolve, reject) => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        css.crossOrigin = '';
        css.onload = resolve;
        css.onerror = () => { css.remove(); reject(new Error('Map stylesheet unavailable')); };
        document.head.append(css);
      }),
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = resolve;
        script.onerror = () => { script.remove(); reject(new Error('Map controls unavailable')); };
        document.head.append(script);
      }),
    ]).catch((error) => { leafletReady = null; throw error; });
  }
  return leafletReady;
}

export async function createGigMap(element, point, title) {
  await loadLeaflet();
  if (!element.isConnected) return () => {};
  const L = window.L;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map(element, {
    attributionControl: false, scrollWheelZoom: false,
    zoomAnimation: !reducedMotion, fadeAnimation: !reducedMotion,
    markerZoomAnimation: !reducedMotion,
  }).setView(point, 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, keepBuffer: 0, referrerPolicy: 'strict-origin-when-cross-origin',
  }).addTo(map);
  const pin = L.divIcon({
    className: 'gig-map-pin',
    html: '<svg viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C8 1 2 7 2 15c0 11 14 25 14 25s14-14 14-25C30 7 24 1 16 1Z"/><circle cx="16" cy="15" r="5"/></svg>',
    iconSize: [32, 42], iconAnchor: [16, 40],
  });
  L.marker(point, { icon: pin, title, alt: title, keyboard: true }).addTo(map);
  const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
  resize.observe(element);
  return () => { resize.disconnect(); map.remove(); };
}
