import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/geist-mono/400.css';
import './styles.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
root.classList.add('js');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';

/* ---------------------------------------------------------------- smooth scroll */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToTarget(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  const offset = el.id === 'top' ? 0 : -24;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(el);
  history.replaceState(null, '', id);
});

/* ---------------------------------------------------------------- config wiring */
$$('[data-email]').forEach((a) => { a.href = `mailto:${CONFIG.email}`; a.textContent = CONFIG.email; });
$$('[data-social]').forEach((a) => {
  const url = CONFIG.social[a.dataset.social];
  if (url) a.href = url; else { a.removeAttribute('target'); a.href = '#contact'; }
});
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------------------------------------------------------------- word split */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = p;
          w.appendChild(i); frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    });
  };
  walk(el);
  return $$('.w > span', el);
}

/* ---------------------------------------------------------------- intro */
function intro() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  tl.from('[data-intro="nav"]', { y: -16, opacity: 0, duration: 1 })
    .from('[data-intro="chip"]', { y: 12, opacity: 0, duration: 1 }, 0.15)
    .from('[data-intro="line"]', { yPercent: 110, duration: 1.4, stagger: 0.1 }, 0.2)
    .from('[data-intro="fade"]', { y: 18, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.55)
    .from('[data-reel]', { y: 80, opacity: 0, rotateX: 18, duration: 1.6, stagger: { each: 0.12, from: 'center' } }, 0.35)
    .from('.hero__glow', { opacity: 0, scale: 0.7, duration: 2.4, ease: 'power2.out' }, 0);
}

/* ---------------------------------------------------------------- hero reels */
function reels() {
  const items = $$('[data-reel]');
  items.forEach((reel, i) => {
    const src = reel.dataset.video;
    if (src) {
      const v = Object.assign(document.createElement('video'), { src, muted: true, loop: true, playsInline: true, autoplay: true, className: 'reel__media' });
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      reel.querySelector('img')?.replaceWith(v);
    }
    const bar = reel.querySelector('[data-progress]');
    if (!reduce && bar) {
      gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 2.2, duration: 9 + i * 2, ease: 'none', repeat: -1, delay: -i * 3 });
    }
  });
  if (reduce) return;
  // gentle idle float
  items.forEach((reel, i) => {
    gsap.to(reel, { y: i === 1 ? -8 : 8, duration: 3.2 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 + i * 0.3 });
  });
  // pointer parallax
  const wrap = $('[data-reels]');
  const panel = $('.hero__panel');
  if (finePointer && wrap) {
    const setters = items.map((r) => ({ rx: gsap.quickTo(r, 'rotationX', { duration: 1, ease: 'power3' }), ry: gsap.quickTo(r, 'rotationY', { duration: 1, ease: 'power3' }), x: gsap.quickTo(r, 'x', { duration: 1.2, ease: 'power3' }) }));
    panel.addEventListener('pointermove', (e) => {
      const b = panel.getBoundingClientRect();
      const nx = (e.clientX - b.left) / b.width - 0.5;
      const ny = (e.clientY - b.top) / b.height - 0.5;
      setters.forEach((s, i) => { const depth = i === 1 ? 1 : 0.65; s.ry(nx * 10 * depth); s.rx(-ny * 8 * depth); s.x(nx * (i - 1) * 14); });
    });
    panel.addEventListener('pointerleave', () => setters.forEach((s) => { s.rx(0); s.ry(0); s.x(0); }));
  }
  // drift glows
  $$('[data-drift]').forEach((g, i) => gsap.to(g, { xPercent: i ? -8 : 6, yPercent: i ? 6 : -10, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  // hero exit parallax
  gsap.to('.reels', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { yPercent: -18, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------------------------------------------------------------- sticky bar */
function stickyBar() {
  const bar = $('[data-bar]');
  const hero = $('.hero');
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    const past = y > hero.offsetHeight - 80;
    const goingUp = y < lastY - 2;
    const goingDown = y > lastY + 2;
    if (!past) bar.classList.remove('is-shown');
    else if (goingUp) bar.classList.add('is-shown');
    else if (goingDown && y > hero.offsetHeight + 400) bar.classList.remove('is-shown');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', update); else window.addEventListener('scroll', update, { passive: true });
}

/* ---------------------------------------------------------------- scroll reveals */
function reveals() {
  $$('[data-split]').forEach((el) => {
    const words = splitWords(el);
    if (reduce) return;
    gsap.from(words, { yPercent: 115, duration: 1.3, ease: EASE, stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  if (reduce) return;

  $$('.index').forEach((el) => gsap.from(el, { opacity: 0, x: -12, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-fade]').forEach((el) => gsap.from(el, { opacity: 0, y: 24, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('[data-stagger]').forEach((el) => gsap.from(el.children, { opacity: 0, y: 40, duration: 1.3, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%' } }));
  // We make: format frames rise one by one, then their labels
  const shelf = $('[data-shelf]');
  if (shelf) {
    const fmts = $$('.fmt', shelf);
    const tl = gsap.timeline({ scrollTrigger: { trigger: shelf, start: 'top 90%' } });
    tl.from(fmts.map((f) => $('.fmt__vis', f)), { y: 48, opacity: 0, rotateX: 25, transformPerspective: 600, duration: 1.2, ease: EASE, stagger: 0.08 })
      .from(fmts.map((f) => [...f.querySelectorAll('b, small')]), { y: 12, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.04 }, 0.25);
    gsap.to($$('.wave i', shelf), { scaleY: () => gsap.utils.random(0.35, 1.25), duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatRefresh: true, stagger: { each: 0.05, from: 'random' } });
  }
  $$('#services .seg, #services .panel__lead').forEach((el) => gsap.from(el, { opacity: 0, y: 20, duration: 1.1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 88%' } }));

  // services demo (first visible panel)
  const demo = $('.panel.is-active .demo');
  if (demo) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: demo, start: 'top 80%' }, defaults: { ease: EASE } });
    tl.from(demo, { opacity: 0, y: 40, duration: 1.3 })
      .add(animatePanel(demo.closest('.panel'), false), 0.25);
  }

  // steps: stagger in, then bars fill one by one
  const steps = $('[data-steps]');
  if (steps) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: steps, start: 'top 82%' } });
    tl.from(steps.children, { opacity: 0, y: 36, duration: 1.2, ease: EASE, stagger: 0.1 })
      .to($$('.step__bar', steps), { scaleX: 1, duration: 0.9, ease: 'power2.inOut', stagger: 0.35 }, 0.5);
  }

  // feature video: scale + parallax + scrubbed progress
  const feature = $('[data-feature]');
  if (feature) {
    gsap.fromTo(feature, { scale: 0.9, borderRadius: 40 }, { scale: 1, borderRadius: 24, ease: 'none', scrollTrigger: { trigger: feature, start: 'top 95%', end: 'top 35%', scrub: true } });
    gsap.fromTo('[data-feature-img]', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: feature, start: 'top bottom', end: 'bottom top', scrub: true } });
    const prog = $('[data-feature-progress]');
    const time = $('[data-feature-time]');
    const total = 42;
    ScrollTrigger.create({
      trigger: feature, start: 'top 70%', end: 'bottom 30%', scrub: true,
      onUpdate: (st) => {
        const p = 0.05 + st.progress * 0.95;
        gsap.set(prog, { scaleX: p });
        const s = Math.round(p * total);
        time.textContent = `00:${String(s).padStart(2, '0')} / 00:${total}`;
      },
    });
  }

  // before / after: lines draw, then text
  $$('.ba__group').forEach((g) => {
    const items = $$('.ba__item', g);
    const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: 'top 85%' } });
    tl.from(g.firstElementChild, { opacity: 0, y: 10, duration: 0.8, ease: EASE })
      .fromTo(items, { '--line': 0 }, { '--line': 1, duration: 1.2, ease: 'power3.inOut', stagger: 0.15 }, 0.1)
      .from(items.map((i) => i.children), { opacity: 0, y: 16, duration: 1, ease: EASE, stagger: 0.05 }, 0.4);
  });

  // closing panel glow brightens as it enters
  gsap.from('.closing__glow', { opacity: 0, scale: 0.8, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: '.closing', start: 'top 75%' } });
}

/* ---------------------------------------------------------------- segmented controls */
function moveThumb(seg, animate = true) {
  const thumb = $('.seg__thumb', seg);
  const active = $('.seg__item.is-active', seg);
  if (!thumb || !active) return;
  if (!animate) thumb.style.transition = 'none';
  thumb.style.width = `${active.offsetWidth}px`;
  thumb.style.transform = `translateX(${active.offsetLeft}px)`;
  if (!animate) { thumb.offsetWidth; thumb.style.transition = ''; }
}
function setupSeg(seg, onChange) {
  const items = $$('.seg__item', seg);
  const select = (item, focus = false) => {
    if (item.classList.contains('is-active')) return;
    items.forEach((b) => {
      const on = b === item;
      b.classList.toggle('is-active', on);
      b.setAttribute(b.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (focus) item.focus();
    moveThumb(seg);
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    onChange(item, items.indexOf(item));
  };
  items.forEach((b) => b.addEventListener('click', () => select(b)));
  seg.addEventListener('keydown', (e) => {
    const i = items.findIndex((b) => b.classList.contains('is-active'));
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(items[(i + 1) % items.length], true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(items[(i - 1 + items.length) % items.length], true); }
  });
  moveThumb(seg, false);
  window.addEventListener('resize', () => moveThumb(seg, false));
  document.fonts?.ready.then(() => moveThumb(seg, false));
}

function animatePanel(panel, withContainer = true) {
  const tl = gsap.timeline({ defaults: { ease: EASE } });
  if (reduce) return tl;
  if (withContainer) tl.from($('.panel__lead', panel), { opacity: 0, y: 12, duration: 0.8 }, 0);
  tl.from($$('.demo__in > *', panel), { opacity: 0, y: 18, duration: 0.9, stagger: 0.06 }, withContainer ? 0.05 : 0)
    .from($$('.brief__line, .clips li', panel), { scaleX: 0, opacity: 0, duration: 0.9, stagger: 0.06, transformOrigin: 'left' }, 0.3)
    .from($('.demo__arrow span', panel), { scale: 0.4, opacity: 0, duration: 0.8 }, 0.25)
    .from($$('.demo__out > *', panel), { opacity: 0, x: 24, duration: 1, stagger: 0.08 }, 0.3)
    .from($$('.plat__row span', panel), { opacity: 0, y: 8, duration: 0.7, stagger: 0.03 }, 0.5)
    .from($('.demo__outcome', panel), { opacity: 0, y: 12, duration: 0.9 }, 0.7);
  return tl;
}

function services() {
  const seg = $('[data-seg="services"]');
  if (!seg) return;
  const panels = $$('[data-panels] .panel');
  setupSeg(seg, (item) => {
    const target = $(`#${item.getAttribute('aria-controls')}`);
    const current = panels.find((p) => p.classList.contains('is-active'));
    if (current === target) return;
    const show = () => {
      current.hidden = true; current.classList.remove('is-active');
      target.hidden = false; target.classList.add('is-active');
      if (!reduce) gsap.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      animatePanel(target);
      ScrollTrigger.refresh();
    };
    if (reduce) show(); else gsap.to(current, { opacity: 0, y: 8, duration: 0.25, ease: 'power2.in', onComplete: () => { gsap.set(current, { clearProps: 'all' }); show(); } });
  });
}

/* ---------------------------------------------------------------- pricing */
function pricing() {
  const seg = $('[data-seg="billing"]');
  if (!seg) return;
  const fmt = (n) => `${CONFIG.currency}${Math.round(n).toLocaleString('en-IN')}`;
  setupSeg(seg, (item) => {
    const mode = item.dataset.billing;
    $$('.price').forEach((el) => {
      if (el.hasAttribute('data-fixed')) return;
      const m = el.dataset.monthly; const qAttr = el.dataset.quarterly;
      const isNum = /^\d+$/.test(m);
      const per = el.parentElement.querySelector('.plan__per');
      if (per && per.dataset.perMonthly) per.textContent = mode === 'monthly' ? per.dataset.perMonthly : per.dataset.perQuarterly;
      if (isNum) {
        const from = parseFloat(el.dataset.current || m);
        const to = mode === 'monthly' ? +m : (/^\d+$/.test(qAttr) ? +qAttr : +m * (1 - CONFIG.quarterlyDiscount / 100));
        const o = { v: from };
        gsap.to(o, { v: to, duration: reduce ? 0 : 0.8, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
        el.dataset.current = to;
      } else {
        const text = `${CONFIG.currency}${mode === 'monthly' ? m : qAttr}`;
        if (reduce) { el.textContent = text; return; }
        gsap.timeline().to(el, { yPercent: -40, opacity: 0, duration: 0.2, ease: 'power2.in' })
          .add(() => (el.textContent = text)).fromTo(el, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: EASE });
      }
    });
  });
  // initial numeric formatting
  $$('.price').forEach((el) => { if (/^\d+$/.test(el.dataset.monthly)) { el.textContent = fmt(+el.dataset.monthly); el.dataset.current = el.dataset.monthly; } });
}

/* ---------------------------------------------------------------- FAQ */
function faq() {
  const list = $('[data-faq]');
  if (!list) return;
  const items = $$('.qa', list);
  const setOpen = (qa, open) => {
    const btn = $('.qa__q', qa); const panel = $('.qa__a', qa);
    if (open === qa.classList.contains('is-open')) return;
    qa.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (reduce) { panel.hidden = !open; return; }
    if (open) {
      panel.hidden = false;
      gsap.fromTo(panel, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.6, ease: EASE, onComplete: () => ScrollTrigger.refresh() });
      gsap.fromTo(panel.firstElementChild, { y: -8 }, { y: 0, duration: 0.6, ease: EASE });
    } else {
      gsap.to(panel, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
    }
  };
  items.forEach((qa) => $('.qa__q', qa).addEventListener('click', () => {
    const willOpen = !qa.classList.contains('is-open');
    items.forEach((o) => o !== qa && setOpen(o, false));
    setOpen(qa, willOpen);
  }));
  if (!reduce) gsap.from(items, { opacity: 0, y: 20, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: list, start: 'top 85%' } });
}

/* ---------------------------------------------------------------- toast */
let toastTimer;
function toast(msg, ms = 3800) {
  const t = $('[data-toast]');
  t.textContent = msg; t.classList.add('is-shown');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-shown'), ms);
}

/* ---------------------------------------------------------------- modals */
function openModal(name) {
  const d = $(`[data-modal="${name}"]`);
  if (!d || d.open) return d;
  d.showModal();
  lenis?.stop();
  if (!reduce) gsap.fromTo(d.firstElementChild, { y: 24, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: EASE });
  return d;
}
function closeModal(d) {
  if (!d?.open) return;
  const done = () => { d.close(); };
  if (reduce) done(); else gsap.to(d.firstElementChild, { y: 16, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done });
}
$$('dialog.modal').forEach((d) => {
  d.addEventListener('close', () => { lenis?.start(); if (d.dataset.modal === 'player') $('[data-player-stage]').innerHTML = ''; gsap.set(d.firstElementChild, { clearProps: 'all' }); });
  d.addEventListener('click', (e) => { if (e.target === d) closeModal(d); });
  d.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(d); });
  $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => closeModal(d)));
});

// Book a call
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-book]');
  if (!b) return;
  e.preventDefault();
  closeMenu();
  if (CONFIG.bookingUrl) { window.open(CONFIG.bookingUrl, '_blank', 'noopener'); return; }
  const d = openModal('book');
  const form = $('form', d);
  if ($('.form-done', d).hidden === false) resetForm(form);
  const svc = b.dataset.service;
  if (svc) { const r = $(`input[name="service"][value="${CSS.escape(svc)}"]`, d); if (r) r.checked = true; }
  setTimeout(() => $('input[name="name"]', d)?.focus(), 60);
});

/* ---------------------------------------------------------------- video player */
function setupMedia() {
  // hover previews when a video file is provided
  $$('[data-play]').forEach((el) => {
    const src = el.dataset.video;
    if (!src || !finePointer) return;
    let v;
    el.addEventListener('pointerenter', () => {
      if (!v) { v = Object.assign(document.createElement('video'), { src, muted: true, loop: true, playsInline: true, preload: 'auto' }); v.setAttribute('muted', ''); el.querySelector('img').after(v); }
      v.currentTime = 0; v.play().catch(() => {});
    });
    el.addEventListener('pointerleave', () => v?.pause());
  });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-play]');
    if (!el) return;
    const stage = $('[data-player-stage]');
    const src = el.dataset.video; const poster = el.dataset.poster;
    const vertical = el.classList.contains('media') && !/landscape/.test(poster) || el.classList.contains('quote');
    stage.classList.toggle('is-vertical', vertical);
    stage.innerHTML = '';
    if (src) {
      const v = Object.assign(document.createElement('video'), { src, poster, controls: true, autoplay: true, playsInline: true });
      stage.appendChild(v);
    } else {
      const img = Object.assign(document.createElement('img'), { src: poster, alt: '' });
      const note = Object.assign(document.createElement('span'), { className: 'player__note', textContent: 'Video coming soon' });
      stage.append(img, note);
    }
    $('[data-player-title]').textContent = el.dataset.title || '';
    openModal('player');
  });
}

/* ---------------------------------------------------------------- forms */
const isPreview = () => import.meta.env.MODE === 'preview' || location.protocol === 'file:' || /localhost|127\.0\.0\.1/.test(location.hostname);
function setError(input, msg) {
  const field = input.closest('.field');
  field.classList.toggle('has-error', !!msg);
  $('.field__err', field).textContent = msg || '';
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
const validators = {
  email: (v) => (!v ? 'Please add your email.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn’t look right.'),
  reel: (v) => {
    if (!v) return 'Please paste a link to your reel.';
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try { const u = new URL(url); return /(instagram\.com|youtube\.com|youtu\.be|tiktok\.com|linkedin\.com|facebook\.com|drive\.google\.com|vimeo\.com)/i.test(u.hostname) ? '' : 'Use an Instagram, YouTube, TikTok, LinkedIn or Drive link.'; } catch { return 'That link doesn’t look right.'; }
  },
  name: (v) => (v.trim().length < 2 ? 'Please add your name.' : ''),
};
function resetForm(form) {
  form.reset(); form.hidden = false;
  const done = form.parentElement.querySelector('.form-done'); if (done) done.hidden = true;
  $$('input', form).forEach((i) => i.closest('.field') && setError(i, ''));
}
function setupForms() {
  $$('form[data-form]').forEach((form) => {
    const kind = form.dataset.form;
    $$('input[required]', form).forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) setError(input, validators[input.name]?.(input.value.trim()) || ''); });
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('has-error')) setError(input, validators[input.name]?.(input.value.trim()) || ''); });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let firstBad = null;
      $$('input[required]', form).forEach((input) => { const msg = validators[input.name]?.(input.value.trim()) || ''; setError(input, msg); if (msg && !firstBad) firstBad = input; });
      if (firstBad) { firstBad.focus(); if (!reduce) gsap.fromTo(firstBad, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.company_website) return; // bot
      const btn = $('button[type="submit"]', form);
      btn.classList.add('is-loading'); btn.disabled = true;
      let ok = false;
      try {
        const res = await fetch(CONFIG.forms[kind], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, page: location.href }) });
        ok = res.ok;
      } catch { ok = false; }
      btn.classList.remove('is-loading'); btn.disabled = false;
      if (!ok && isPreview()) { ok = true; toast('Preview only — form not actually sent.'); }
      if (!ok) { toast(`Couldn’t send just now. Please email ${CONFIG.email}`, 6000); return; }
      const done = form.parentElement.querySelector('.form-done');
      if (reduce) { form.hidden = true; done.hidden = false; return; }
      gsap.to(form, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in', onComplete: () => {
        form.hidden = true; gsap.set(form, { clearProps: 'all' }); done.hidden = false;
        gsap.from(done.children, { opacity: 0, y: 14, duration: 0.8, ease: EASE, stagger: 0.07 });
        gsap.from($('.form-done__icon', done), { scale: 0.4, duration: 0.9, ease: 'back.out(2)' });
        ScrollTrigger.refresh();
      } });
    });
  });
  $$('[data-form-reset]').forEach((b) => b.addEventListener('click', () => resetForm(b.closest('.card-form').querySelector('form'))));
}

/* ---------------------------------------------------------------- mobile menu */
const menu = $('[data-menu]');
function openMenu() {
  menu.hidden = false; lenis?.stop();
  $('[data-menu-open]').setAttribute('aria-expanded', 'true');
  if (!reduce) gsap.from($$('.menu__links a, .menu > .btn', menu), { y: 30, opacity: 0, duration: 0.8, ease: EASE, stagger: 0.05 });
  $('[data-menu-close]').focus();
}
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true; lenis?.start();
  $('[data-menu-open]').setAttribute('aria-expanded', 'false');
}
$('[data-menu-open]').addEventListener('click', openMenu);
$('[data-menu-close]').addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------------------------------------------------------------- go */
intro();
reels();
stickyBar();
reveals();
services();
pricing();
faq();
setupMedia();
setupForms();
window.addEventListener('load', () => ScrollTrigger.refresh());
if (location.hash && $(location.hash)) setTimeout(() => scrollToTarget(location.hash), 300);
