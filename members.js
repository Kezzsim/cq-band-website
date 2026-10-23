'use strict';

import { memberSigns } from './assets/buttons/signs.js';

const icons = {
  instagram: '<svg class="social-outline" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  bluesky: '<svg viewBox="0 0 600 530" aria-hidden="true"><path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-.0174-2.9357-1.1937.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z"/></svg>',
  website: '<svg class="social-outline" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M21 5c-2-1-16-1-18 0-2 2-2 12 0 14 2 1 16 1 18 0 2-2 2-12 0-14ZM10 8v8l6-4Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2h3c.3 2 1.7 3.5 4 4v3a9 9 0 0 1-4-1v9a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3Z"/></svg>',
  bandcamp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h15l-7 14H1Z"/></svg>',
  spotify: '<svg class="social-outline" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M5 8c4-2 10-1 14 1M6 12c4-2 8-1 12 1M7 16c3-1 6-1 9 1"/></svg>',
};

export async function setupMembers() {
  const section = document.querySelector('#members');
  const $ = (selector) => section.querySelector(selector);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const signAnimations = new Map();
  const signImages = ['left', 'right'].map((direction) => ({
    direction,
    image: $(`.member-arrow-${direction} img`),
  }));
  function tossSigns() {
    signImages.forEach(({ direction, image }) => {
      const options = memberSigns[direction];
      const file = options[Math.floor(Math.random() * options.length)];
      const start = getComputedStyle(image).transform;
      signAnimations.get(image)?.cancel();
      image.src = `./assets/buttons/${file}`;
      // Independent rolls: repeated signs are intentional, just like dice.
      const angle = (3 + Math.random() * 9) * (Math.random() < .5 ? -1 : 1);
      const landing = `rotate(${angle}deg)`;
      image.style.transform = landing;
      if (!motion.matches) {
        const drift = (Math.random() - .5) * 12;
        const spin = angle + (Math.random() < .5 ? -18 : 18);
        signAnimations.set(image, image.animate([
          { transform: start },
          { transform: `translate(${drift}px, -16px) rotate(${spin}deg) scale(1.08)`, offset: .4 },
          { transform: `translateY(2px) rotate(${angle - 3}deg) scale(.97)`, offset: .78 },
          { transform: landing },
        ], { duration: 390, easing: 'ease-out' }));
      }
    });
  }
  tossSigns();
  let members;
  try {
    const response = await fetch('./members.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Member profiles unavailable');
    members = (await response.json()).filter((member) => member?.Name && member.card_front);
    if (!members.length) { section.hidden = true; return; }
  } catch {
    $('#member-name').textContent = 'The band is out roaming';
    $('#member-status').textContent = 'Profiles couldn’t load. Try again when you’re connected.';
    return;
  }
  let current = 0;
  let animation;
  const phrases = new Map();
  let inView = true;
  const wrap = (index) => (index + members.length) % members.length;
  const asset = (path) => `./${String(path).replace(/^\.?\//, '')}`;
  const previewButtons = [$('#member-previous-card'), $('#member-next-card')];
  const navigators = [$('#member-previous'), $('#member-next'), ...previewButtons];
  const failedImages = new Set();

  function setCardImage(image, sources) {
    const candidates = [...new Set(sources.filter(Boolean).map(asset))];
    const next = () => {
      const source = candidates.find((candidate) => !failedImages.has(candidate));
      if (!source) {
        image.onerror = null;
        image.removeAttribute('src');
        image.classList.add('member-image-unavailable');
        return;
      }
      image.classList.remove('member-image-unavailable');
      image.onerror = () => { failedImages.add(source); next(); };
      if (image.getAttribute('src') !== source) image.src = source;
    };
    next();
  }

  function preview(button, member) {
    const image = button.querySelector('img');
    const still = motion.matches || navigator.connection?.saveData || document.hidden || !inView;
    setCardImage(image, still
      ? [member.card_back_still, member.card_front]
      : [member.card_back, member.card_back_still, member.card_front]);
    button.setAttribute('aria-label', `Select ${member.Name}`);
    button.querySelector('.member-preview-name').textContent = member.Name;
  }
  function refreshPreviews() {
    preview(previewButtons[0], members[wrap(current - 1)]);
    preview(previewButtons[1], members[wrap(current + 1)]);
  }
  function select(index, animate = true) {
    if (animate) tossSigns();
    current = wrap(index);
    const member = members[current];
    setCardImage($('#member-front'), [member.card_front, member.card_back_still]);
    $('#member-front').alt = `${member.Name} — ${member.Species || 'Carrion Queen member'} portrait`;
    $('.member-active').setAttribute('aria-label', `${current + 1} of ${members.length}: ${member.Name}`);
    $('#member-counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(members.length).padStart(2, '0')}`;
    $('#member-name').textContent = member.Name;
    $('#member-instruments').textContent = (member.Instruments || []).join(' / ');
    const identity = $('#member-identity');
    identity.replaceChildren();
    [['Pronouns', 'pronouns'], ['Species', 'species'], ['Place', 'place']].forEach(([field, icon]) => {
      if (!member[field]) return;
      const item = document.createElement('div');
      item.className = 'member-field';
      item.title = field;
      const term = document.createElement('dt');
      const symbol = document.createElement('img');
      symbol.src = `./assets/member-fields/${icon}.svg`;
      symbol.alt = ''; symbol.width = 20; symbol.height = 20;
      const label = document.createElement('span');
      label.className = 'sr-only'; label.textContent = field;
      term.append(symbol, label);
      const value = document.createElement('dd');
      value.textContent = member[field];
      item.append(term, value);
      identity.append(item);
    });
    const bio = $('#member-bio');
    bio.replaceChildren();
    // Support the simple *emphasis* used in the data without interpreting HTML.
    String(member.Bio || '').split(/(\*[^*]+\*)/g).forEach((part) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const emphasis = document.createElement('em'); emphasis.textContent = part.slice(1, -1); bio.append(emphasis);
      } else bio.append(document.createTextNode(part));
    });
    const callout = $('#member-callout');
    const options = (member.Phrases || []).filter((phrase) => typeof phrase === 'string' && phrase.trim());
    const fresh = options.filter((phrase) => phrase !== phrases.get(current));
    const pool = fresh.length ? fresh : options;
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    callout.hidden = !phrase;
    callout.textContent = phrase ? `“${phrase}”` : '';
    phrases.set(current, phrase);
    const socials = $('#member-socials');
    socials.replaceChildren();
    Object.entries(member.Socials || {}).forEach(([platform, href]) => {
      let url;
      try { url = new URL(href); } catch { return; }
      if (!['https:', 'http:'].includes(url.protocol)) return;
      const link = document.createElement('a');
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `${member.Name} on ${platform}`);
      link.title = `${member.Name} — ${platform}`;
      link.innerHTML = icons[platform.toLowerCase()] || icons.website;
      socials.append(link);
    });
    $('#member-socials').setAttribute('aria-label', `${member.Name}’s social links`);
    $('#member-pagination').querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-current', String(index === current)));
    refreshPreviews();
    animation?.cancel();
    if (animate && !motion.matches) {
      animation = $('.member-active').animate([
        { opacity: .4, transform: 'translateY(9px) rotate(2deg) scale(.96)' },
        { opacity: 1, transform: 'translateY(0) rotate(-2deg) scale(1)' },
      ], { duration: 260, easing: 'ease-out' });
    }
  }
  members.forEach((member, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = String(index + 1).padStart(2, '0');
    button.setAttribute('aria-label', `Select ${member.Name}`);
    button.addEventListener('click', () => select(index));
    $('#member-pagination').append(button);
  });
  navigators.forEach((button) => { button.disabled = members.length < 2; });
  $('#member-previous').addEventListener('click', () => select(current - 1));
  $('#member-next').addEventListener('click', () => select(current + 1));
  previewButtons[0].addEventListener('click', () => select(current - 1));
  previewButtons[1].addEventListener('click', () => select(current + 1));
  $('.members-carousel').addEventListener('keydown', (event) => {
    if (event.target.closest('a') || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); select(current + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  motion.addEventListener('change', () => {
    animation?.cancel();
    signAnimations.forEach((animation) => animation.cancel());
    refreshPreviews();
  });
  document.addEventListener('visibilitychange', refreshPreviews);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      refreshPreviews();
    }).observe($('.members-carousel'));
  }
  select(0, false);
}
