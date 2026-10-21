'use strict';

const VERSION = 'cq-v9';
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const APP_ROOT = new URL('./', self.location.href);
const SHELL_FILES = [
  './', './index.html', './style.css', './script.js', './Logo.webp', './cq-fg.png',
  './site.webmanifest', './favicon.ico', './favicon-96x96.png',
  './web-app-manifest-192x192.png', './web-app-manifest-512x512.png',
  './videobg/landscape.jpg', './videobg/portrait.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('cq-') && ![SHELL, DATA].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== APP_ROOT.origin || !url.pathname.startsWith(APP_ROOT.pathname)) return;
  // Let the browser handle media range requests natively; never cache partial files
  // or fetch entire videos/MP3s just to populate the offline cache.
  if (request.headers.has('range') || /\.(mp3|mp4)$/i.test(url.pathname)) return;
  if (/\.(json|webmanifest)$/.test(url.pathname) || request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(DATA);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return await caches.match(request) || (request.mode === 'navigate' ? await caches.match(new URL('./index.html', APP_ROOT)) : null) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return fetch(request);
  })());
});
