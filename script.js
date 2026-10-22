'use strict';

const $ = (selector) => document.querySelector(selector);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const timeLabel = (seconds) => `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, '0')}`;
$('#year').textContent = new Date().getFullYear();

// The logo is an ordinary, high-priority image: no load event gates its animation.
let scrollPending = false;
function updateScroll() {
  document.documentElement.style.setProperty('--scroll', Math.min(1, window.scrollY / 340));
  scrollPending = false;
}
addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
updateScroll();

// Fade the coyote only once its pixels are ready, including cached-image loads.
const coyote = $('.coyote');
const revealCoyote = () => {
  if (coyote.naturalWidth) $('.coyote-layer').classList.add('is-ready');
};
coyote.addEventListener('load', revealCoyote, { once: true });
if (coyote.complete) revealCoyote();

// Enumerate random lyrics from our songs to use as callout flavortext lol
const lyricShout = [
  "I'm a mass of skin and bone",
  "Taking a still of an object in motion",
  "Let the blood spill! Let the darkness come!",
  "Make your hands into my own little home",
  "Like some cryptid born, of the leyline"
];

let shoutAnimation;
function updateLyricShout(animate = false) {
  const stamp = $('.stamp');
  if (!stamp || !lyricShout.length) return;
  const choices = lyricShout.filter((lyric) => `"${lyric}"` !== stamp.textContent);
  const pool = choices.length ? choices : lyricShout;
  stamp.textContent = `"${pool[Math.floor(Math.random() * pool.length)]}"`;
  shoutAnimation?.cancel();
  if (animate && !motionPreference.matches) {
    shoutAnimation = stamp.animate([
      { transform: 'translateY(0) rotate(7deg)' },
      { transform: 'translateY(-8px) rotate(2deg)', offset: .3 },
      { transform: 'translateY(-4px) rotate(11deg)', offset: .55 },
      { transform: 'translateY(1px) rotate(5deg)', offset: .8 },
      { transform: 'translateY(0) rotate(7deg)' },
    ], { duration: 340, easing: 'ease-out' });
  }
}
updateLyricShout();
motionPreference.addEventListener('change', (event) => {
  if (event.matches) shoutAnimation?.cancel();
});

function setupBackground() {
  const videos = [...document.querySelectorAll('.background-video')];
  const portrait = matchMedia('(orientation: portrait)');
  let active = null;
  let generation = 0;
  let resizeTimer;
  let paused = motionPreference.matches || Boolean(navigator.connection?.saveData);
  const button = $('#motion-toggle');
  const label = () => {
    button.textContent = paused ? 'Play background' : 'Pause background';
    button.setAttribute('aria-pressed', String(paused));
  };
  async function swap() {
    const version = ++generation;
    if (paused || document.hidden) return;
    const source = `videobg/${portrait.matches ? 'portrait' : 'landscape'}.mp4`;
    if (active?.getAttribute('src') === source) {
      await active.play().catch(() => {});
      return;
    }
    const incoming = videos.find((video) => video !== active);
    incoming.muted = true;
    incoming.src = source;
    incoming.load();
    try {
      // Keep the previous orientation on screen until the replacement is playable.
      await new Promise((resolve, reject) => {
        incoming.addEventListener('loadeddata', resolve, { once: true });
        incoming.addEventListener('error', reject, { once: true });
      });
      if (version !== generation || paused || document.hidden) return;
      if (active && Number.isFinite(incoming.duration)) incoming.currentTime = active.currentTime % incoming.duration;
      await incoming.play();
      if (version !== generation || paused || document.hidden) { incoming.pause(); return; }
      const outgoing = active;
      incoming.classList.add('is-visible');
      outgoing?.classList.remove('is-visible');
      active = incoming;
      if (outgoing) setTimeout(() => { if (active !== outgoing) outgoing.pause(); }, 1300);
    } catch { /* The poster remains visible if autoplay or the connection fails. */ }
  }
  button.addEventListener('click', () => {
    paused = !paused;
    label();
    if (paused) { generation++; videos.forEach((video) => video.pause()); }
    else swap();
  });
  motionPreference.addEventListener('change', (event) => {
    paused = event.matches;
    label();
    if (paused) { generation++; videos.forEach((video) => video.pause()); } else swap();
  });
  portrait.addEventListener('change', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(swap, 300); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { generation++; videos.forEach((video) => video.pause()); }
    else swap();
  });
  label();
  // Give the initial logo request a head start without waiting for it to finish.
  setTimeout(swap, 180);
}
setupBackground();

async function setupPlayer() {
  const audio = $('#audio');
  const status = $('#player-status');
  let tracks;
  try {
    const response = await fetch('./music/playlist.json');
    if (!response.ok) throw new Error('Playlist unavailable');
    tracks = await response.json();
    if (!Array.isArray(tracks) || !tracks.length) throw new Error('No tracks');
  } catch {
    $('#track-title').textContent = 'The tape is taking a break';
    status.textContent = 'Music could not be loaded. Please try again when you’re connected.';
    return;
  }
  let current = 0;
  const controls = ['#play', '#stop', '#next', '#previous'];
  controls.forEach((selector) => { $(selector).disabled = false; });
  const seek = $('#seek');
  function updatePosition() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : tracks[current].duration;
    $('#elapsed').textContent = timeLabel(audio.currentTime);
    $('#duration').textContent = timeLabel(duration);
    seek.disabled = !Number.isFinite(audio.duration);
    seek.value = duration ? Math.round(audio.currentTime / duration * 1000) : 0;
    seek.setAttribute('aria-valuetext', `${timeLabel(audio.currentTime)} of ${timeLabel(duration)}`);
    if ('mediaSession' in navigator && Number.isFinite(audio.duration) && audio.duration > 0) {
      try { navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, audio.duration) }); } catch { /* Optional browser feature. */ }
    }
  }
  async function play() {
    updateLyricShout(true);
    status.textContent = '';
    try { await audio.play(); }
    catch (error) {
      // A quick stop or track change intentionally aborts an outstanding play().
      if (error.name !== 'AbortError') status.textContent = 'Playback couldn’t start. Tap play to try again.';
    }
  }
  function select(index, autoplay = false) {
    const previousTrack = current;
    current = (index + tracks.length) % tracks.length;
    const track = tracks[current];
    audio.src = track.src;
    $('#track-title').textContent = track.title;
    $('#track-credit').textContent = [track.artist, track.album].filter(Boolean).join(' / ');
    $('#track-tags').textContent = [track.year, track.genre, track.composer && `Written by ${track.composer}`].filter(Boolean).join(' · ');
    $('#track-counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    $('#download').href = track.src;
    $('#download').download = track.file;
    $('#download').hidden = false;
    $('#download').setAttribute('aria-label', `Download ${track.title} as MP3`);
    document.querySelectorAll('.track-button').forEach((button, index) => button.setAttribute('aria-current', String(index === current)));
    status.textContent = '';
    setPlaying(false);
    updatePosition();
    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist || 'Carrion Queen', album: track.album || 'Bootlegs' });
    }
    if (autoplay) play();
    else if (current !== previousTrack) updateLyricShout(true);
  }
  function setPlaying(playing) {
    $('#player').classList.toggle('is-playing', playing);
    $('#play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $('#play-icon').setAttribute('d', playing ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'm8 5 12 7-12 7z');
    $('#playback-state').textContent = playing ? 'Now playing' : 'Press play';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }
  function stop() { audio.pause(); audio.currentTime = 0; updatePosition(); $('#playback-state').textContent = 'Tape stopped / back to the start'; }
  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'track-button';
    const number = document.createElement('span');
    number.className = 'track-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('span');
    title.textContent = track.title;
    const length = document.createElement('span');
    length.className = 'track-length';
    length.textContent = timeLabel(track.duration);
    button.append(number, title, length);
    button.addEventListener('click', () => select(index, true));
    li.append(button);
    $('#playlist').append(li);
  });
  $('#play').addEventListener('click', () => {
    if (audio.paused) {
      play();
    } else audio.pause();
  });
  $('#stop').addEventListener('click', stop);
  $('#next').addEventListener('click', () => select(current + 1, !audio.paused));
  $('#previous').addEventListener('click', () => select(current - 1, !audio.paused));
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) { audio.currentTime = Number(seek.value) / 1000 * audio.duration; updatePosition(); } });
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => select(current + 1, true));
  audio.addEventListener('timeupdate', updatePosition);
  audio.addEventListener('loadedmetadata', updatePosition);
  audio.addEventListener('error', () => { setPlaying(false); status.textContent = 'This track couldn’t load. Try another track or check your connection.'; });
  audio.addEventListener('waiting', () => { status.textContent = 'Winding the tape…'; });
  audio.addEventListener('playing', () => { status.textContent = ''; });
  if ('mediaSession' in navigator) {
    const handlers = { play, pause: () => audio.pause(), stop, previoustrack: () => select(current - 1, true), nexttrack: () => select(current + 1, true), seekto: (details) => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, Math.min(audio.duration, details.seekTime)); }, seekbackward: (details) => { audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10)); }, seekforward: (details) => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset || 10)); } };
    Object.entries(handlers).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Not every platform supports every action. */ } });
  }
  select(0);
}
setupPlayer();

const svgNamespace = 'http://www.w3.org/2000/svg';
function svgElement(tag, attributes, text) {
  const element = document.createElementNS(svgNamespace, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (text !== undefined) element.textContent = text;
  return element;
}
function localDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function coordinates(location) {
  const values = typeof location === 'string' ? location.split(',').map((part) => Number(part.trim())) : [];
  return values.length === 2 && values.every(Number.isFinite) && Math.abs(values[0]) <= 90 && Math.abs(values[1]) <= 180 ? values : null;
}
function detailValue(value) { return typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value); }

async function setupCalendar() {
  try {
    const response = await fetch('./calendar.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Calendar unavailable');
    const data = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = (Array.isArray(data) ? data : data.events || [])
      .filter((event) => event && localDate(event.date) >= today && localDate(event.date) !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!events.length) return;
    const months = Map.groupBy ? Map.groupBy(events, (event) => event.date.slice(0, 7)) : events.reduce((map, event) => { const key = event.date.slice(0, 7); map.set(key, [...(map.get(key) || []), event]); return map; }, new Map());
    let selectedDate;
    let cleanupMap = () => {};
    function showMap(event) {
      cleanupMap();
      const container = $('#show-map');
      container.replaceChildren();
      const point = coordinates(event.location);
      if (!point) return;
      const [lat, lon] = point;
      const frame = document.createElement('div');
      frame.className = 'gig-map';
      frame.setAttribute('role', 'region');
      frame.setAttribute('aria-label', `Map: ${event.title || 'Show location'}`);
      const attribution = document.createElement('p');
      attribution.className = 'map-attribution';
      attribution.innerHTML = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>';
      const link = document.createElement('a');
      link.className = 'map-link';
      link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open location in OpenStreetMap ↗';
      container.append(frame, attribution, link);
      let dispose = () => {};
      let observer;
      const load = async () => {
        observer?.disconnect();
        try {
          const { createGigMap } = await import('./gig-map.js');
          if (!frame.isConnected) return;
          dispose = await createGigMap(frame, point, event.title || 'Show location');
          if (!frame.isConnected) dispose();
        } catch {
          if (frame.isConnected) frame.textContent = 'Map unavailable. Use the OpenStreetMap link below.';
        }
      };
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) load();
        });
        observer.observe(frame);
      } else load();
      cleanupMap = () => { observer?.disconnect(); dispose(); };
    }
    function selectDate(date) {
      if (date === selectedDate) return;
      selectedDate = date;
      document.querySelectorAll('.calendar-event').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.date === date)));
      const details = $('#show-details');
      details.replaceChildren();
      const onDate = events.filter((event) => event.date === date);
      onDate.forEach((event) => {
        const card = document.createElement('article');
        card.className = 'show-card';
        const when = document.createElement('p');
        when.className = 'show-date';
        when.textContent = [localDate(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), event.time].filter(Boolean).join(' / ');
        const title = document.createElement('h3');
        title.textContent = event.title || 'Carrion Queen live';
        const list = document.createElement('dl');
        Object.entries(event).forEach(([key, value]) => {
          if (['title', 'date', 'time'].includes(key) || (key === 'location' && coordinates(value)) || value == null || value === '') return;
          const term = document.createElement('dt');
          term.textContent = key.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
          const description = document.createElement('dd');
          if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
            const link = document.createElement('a');
            link.href = value; link.textContent = value; link.target = '_blank'; link.rel = 'noopener noreferrer';
            description.append(link);
          } else description.textContent = detailValue(value);
          list.append(term, description);
        });
        card.append(when, title, list);
        details.append(card);
      });
      const mapped = onDate.filter((event) => coordinates(event.location));
      if (mapped.length > 1) {
        const switcher = document.createElement('div');
        switcher.className = 'map-switcher';
        mapped.forEach((event, index) => {
          const button = document.createElement('button');
          button.textContent = event.title || `Location ${index + 1}`;
          button.setAttribute('aria-pressed', String(index === 0));
          button.addEventListener('click', () => { switcher.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); showMap(event); });
          switcher.append(button);
        });
        details.append(switcher);
      }
      if (mapped.length) showMap(mapped[0]); else { cleanupMap(); $('#show-map').replaceChildren(); }
    }
    months.forEach((monthEvents, month) => {
      const first = localDate(`${month}-01`);
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const rows = Math.ceil((first.getDay() + days) / 7);
      const wrapper = document.createElement('div');
      wrapper.className = 'month';
      const heading = document.createElement('h3');
      heading.textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const svg = svgElement('svg', { viewBox: `0 0 280 ${rows * 37 + 28}`, role: 'group', 'aria-label': `${heading.textContent} show calendar` });
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((label, index) => svg.append(svgElement('text', { x: index * 40 + 20, y: 12, 'text-anchor': 'middle', class: 'weekday' }, label)));
      for (let day = 1; day <= days; day++) {
        const index = first.getDay() + day - 1;
        const x = (index % 7) * 40 + 20;
        const y = Math.floor(index / 7) * 37 + 40;
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const shows = monthEvents.filter((event) => event.date === date);
        if (shows.length) {
          const label = `${localDate(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${shows.map((event) => event.title).join('; ')}`;
          const group = svgElement('g', { class: 'calendar-event', role: 'button', tabindex: '0', 'aria-label': label, 'aria-pressed': 'false', 'data-date': date });
          group.append(svgElement('title', {}, label), svgElement('rect', { x: x - 19, y: y - 18, width: 38, height: 37, class: 'event-ring', rx: 2 }), svgElement('text', { x, y, 'text-anchor': 'middle' }, day), svgElement('circle', { cx: x, cy: y + 9, r: 3, class: 'event-dot' }));
          group.addEventListener('click', () => selectDate(date));
          group.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') selectDate(date); });
          group.addEventListener('focus', () => selectDate(date));
          group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectDate(date); } });
          svg.append(group);
        } else svg.append(svgElement('text', { x, y, 'text-anchor': 'middle', class: localDate(date) < today ? 'day-past' : '' }, day));
      }
      wrapper.append(heading, svg);
      $('#calendars').append(wrapper);
    });
    $('#shows').hidden = false;
    selectDate(events[0].date);
  } catch (error) { console.warn('Show calendar could not be loaded:', error); }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { setupCalendar(); observer.disconnect(); }
  }, { rootMargin: '400px' });
  observer.observe($('#bootlegs'));
} else setupCalendar();

let installPrompt;
// Load profile data and card images only as the members section approaches.
const loadMembers = () => import('./members.js').then(({ setupMembers }) => setupMembers()).catch(() => {
  $('#member-status').textContent = 'Member profiles are unavailable. Please try again later.';
});
if ('IntersectionObserver' in window) {
  const memberObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { memberObserver.disconnect(); loadMembers(); }
  }, { rootMargin: '300px' });
  memberObserver.observe($('#members'));
} else loadMembers();

addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); installPrompt = event; $('#install').hidden = false;
});
$('#install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null; $('#install').hidden = true;
});
addEventListener('appinstalled', () => { $('#install').hidden = true; installPrompt = null; });
if ('serviceWorker' in navigator) addEventListener('load', () => {
  navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Offline support unavailable:', error));
});
