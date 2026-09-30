const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// The accessibility panel can pause motion at runtime, so loops ask on every tick.
const motionOff = () => reduceMotion || document.documentElement.classList.contains('a11y-motion');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ── HAMBURGER ── */
const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
// Everything behind the open menu is made inert so focus cannot leak out of it.
const behindMenu = ['#conteudo', '#siteFooter', '#a11y', '.nav-logo']
  .map(sel => document.querySelector(sel)).filter(Boolean);

function setMenu(open, { returnFocus = true } = {}) {
  ham.classList.toggle('open', open);
  mob.classList.toggle('open', open);
  ham.setAttribute('aria-expanded', String(open));
  ham.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  behindMenu.forEach(el => { el.inert = open; });
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) mob.querySelector('a').focus();
  else if (returnFocus) ham.focus();
}

ham.addEventListener('click', () => setMenu(!ham.classList.contains('open')));

document.querySelectorAll('.mob-link').forEach(a => {
  a.addEventListener('click', () => setMenu(false, { returnFocus: false }));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ham.classList.contains('open')) setMenu(false);
});

// Leaving the mobile breakpoint with the menu open would strand the inert page.
window.matchMedia('(min-width: 601px)').addEventListener('change', (e) => {
  if (e.matches && ham.classList.contains('open')) setMenu(false, { returnFocus: false });
});

/* ── SCROLL REVEAL ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal, .process-steps, .footer-line').forEach(el => observer.observe(el));

/* ── NAV: SCROLL STATE + ACTIVE LINK ── */
(() => {
  const nav = document.getElementById('siteNav');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 24);

    const y = window.scrollY + 140;
    let current = null;
    sections.forEach(s => {
      const top = s.getBoundingClientRect().top + window.scrollY;
      if (y >= top && y < top + s.offsetHeight) current = s.id;
    });
    navLinks.forEach(a => {
      const on = a.getAttribute('href') === `#${current}`;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ── HERO STACK: sections rise over the hero ── */
(() => {
  const hero = document.getElementById('inicio');
  const content = document.getElementById('heroContent');
  if (!hero || !content) return;

  // A hero taller than the viewport sticks by its bottom edge instead of its top.
  function fit() {
    hero.style.top = Math.min(0, window.innerHeight - hero.offsetHeight) + 'px';
  }

  let ticking = false;
  function paint() {
    ticking = false;
    const p = clamp(window.scrollY / window.innerHeight, 0, 1);
    content.style.transform = `translate3d(0, ${(-p * 70).toFixed(1)}px, 0) scale(${(1 - p * 0.05).toFixed(4)})`;
    content.style.opacity = String(Math.round((1 - p * 0.75) * 100) / 100);
    hero.style.setProperty('--dim', (p * 0.6).toFixed(3));
  }

  fit();
  paint();
  window.addEventListener('resize', () => { fit(); paint(); });
  if (reduceMotion) return;
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }, { passive: true });
})();

/* ── HERO SCRAMBLE TEXT ── */
(() => {
  const el = document.getElementById('scramble');
  if (!el) return;

  const WORDS = [
    'Sites institucionais',
    'Landing pages',
    'E-commerce',
    'Sistemas web',
    'Aplicativos',
    'Identidade digital',
  ];
  const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~░▒▓█▀▄■□▪▫●○◆◇';

  const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

  function scrambleWord(target, progress) {
    const reveal = Math.floor(progress * target.length);
    return target
      .split('')
      .map((ch, i) => (i < reveal || ch === ' ' ? ch : randomChar()))
      .join('');
  }

  let index = 0;
  let frame = 0;

  function play(target) {
    cancelAnimationFrame(frame);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 600;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      el.textContent = progress >= 1 ? target : scrambleWord(target, progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  setInterval(() => {
    if (motionOff() || document.hidden) return;
    index = (index + 1) % WORDS.length;
    play(WORDS[index]);
  }, 2000);
})();

/* ── HERO VISUAL: CÓDIGO VIRA SITE ── */
(() => {
  const codeEl = document.getElementById('hvCode');
  const stage = document.getElementById('hvStage');
  const visual = document.getElementById('heroVisual');
  const hero = document.getElementById('inicio');
  if (!codeEl || !stage) return;

  const blocks = Array.from(stage.querySelectorAll('.hb'));
  const chips = Array.from(stage.querySelectorAll('.hv-chip'));

  // Each step types its lines, then builds the matching block in the browser.
  const STEPS = [
    ['<header class="topo">', '  <img src="marca.svg" alt="Sua marca">', '</header>'],
    ['<section class="hero">', '  <h1>Sua marca, no topo.</h1>'],
    ['  <p>Rápido, bonito e encontrável.</p>'],
    ['  <a class="cta" href="#contato">', '    Fale conosco</a>', '</section>'],
    ['<div class="servicos">', '  <article data-card="3"></article>', '</div>'],
  ];

  const TOKEN = /(<\/?[\w-]+)|(\s[\w-]+(?==))|(=)|("[^"]*")|(\/?>)|([^<>"=]+)/g;
  const CLASSES = ['tk-tag', 'tk-attr', 'tk-p', 'tk-str', 'tk-tag', 'tk-txt'];

  function tokenize(line) {
    const out = [];
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line))) {
      const g = m.slice(1).findIndex(Boolean);
      out.push([CLASSES[g], m[0]]);
    }
    return out;
  }

  const caret = document.createElement('span');
  caret.className = 'hv-caret';

  let active = true;
  const heroObserver = new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { threshold: 0.05 });
  heroObserver.observe(hero);

  async function gate() {
    while (!active || motionOff()) await sleep(300);
  }

  function renderLine(text, instant) {
    const ln = document.createElement('span');
    ln.className = 'ln';
    codeEl.appendChild(ln);
    const spans = tokenize(text).map(([cls, str]) => {
      const sp = document.createElement('span');
      sp.className = cls;
      if (instant) sp.textContent = str;
      ln.appendChild(sp);
      return [sp, str];
    });
    return { ln, spans };
  }

  async function typeLine(text) {
    await gate();
    codeEl.querySelectorAll('.ln.current').forEach(l => l.classList.remove('current'));
    const { ln, spans } = renderLine(text, false);
    ln.classList.add('current');
    ln.appendChild(caret);
    for (const [sp, str] of spans) {
      for (const ch of str) {
        sp.textContent += ch;
        await sleep(ch === ' ' ? 10 : 18 + Math.random() * 34);
      }
    }
  }

  function reset() {
    codeEl.textContent = '';
    blocks.forEach(b => b.classList.remove('built'));
    chips.forEach(c => c.classList.remove('show'));
  }

  if (reduceMotion) {
    STEPS.flat().forEach(line => renderLine(line, true));
    blocks.forEach(b => b.classList.add('built'));
    chips.forEach(c => c.classList.add('show'));
    return;
  }

  (async function run() {
    await sleep(900);
    for (;;) {
      reset();
      stage.classList.remove('resetting');
      await sleep(350);
      for (let i = 0; i < STEPS.length; i++) {
        for (const line of STEPS[i]) {
          await typeLine(line);
          await sleep(90);
        }
        blocks[i].classList.add('built');
        await sleep(320);
      }
      for (const chip of chips) {
        chip.classList.add('show');
        await sleep(380);
      }
      await sleep(4200);
      await gate();
      stage.classList.add('resetting');
      await sleep(650);
    }
  })();

  /* Mouse tilt */
  const BASE_Y = -7, BASE_X = 4;
  let tx = BASE_Y, ty = BASE_X, cx = BASE_Y, cy = BASE_X, raf = null;

  function loop() {
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;
    stage.style.transform = `rotateY(${cx.toFixed(2)}deg) rotateX(${cy.toFixed(2)}deg)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.02 ? requestAnimationFrame(loop) : null;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || motionOff()) return;
    const r = visual.getBoundingClientRect();
    const nx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
    const ny = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
    tx = BASE_Y + nx * 7;
    ty = BASE_X - ny * 6;
    kick();
  });
  hero.addEventListener('pointerleave', () => { tx = BASE_Y; ty = BASE_X; kick(); });
  kick();
})();

/* ── ABOUT CODE PARTICLES ── */
(() => {
  const canvas = document.getElementById('aboutCanvas');
  const section = document.getElementById('sobre');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');

  const GLYPHS = ['</>', '{ }', '01', ';', '#', '( )', '[ ]', '/>'];
  const COUNT = 22;
  const INFLUENCE_RADIUS = 160;
  const BASE = { r: 10, g: 22, b: 40, a: .09 };
  const ACTIVE = { r: 201, g: 146, b: 42, a: .85 };

  let size = { w: 0, h: 0 };
  const mouse = { x: -9999, y: -9999 };
  let particles = [];

  function lerpN(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(base, active, t) {
    const r = Math.round(lerpN(base.r, active.r, t));
    const g = Math.round(lerpN(base.g, active.g, t));
    const b = Math.round(lerpN(base.b, active.b, t));
    const a = lerpN(base.a, active.a, t);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  function makeParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * size.w,
        y: Math.random() * size.h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        size: 13 + Math.random() * 11,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function setSize() {
    size = { w: section.clientWidth, h: section.clientHeight };
    canvas.width = size.w;
    canvas.height = size.h;
    makeParticles();
  }

  function draw(now) {
    const W = size.w, H = size.h;
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'middle';

    for (const p of particles) {
      if (!motionOff()) {
        p.x += p.vx;
        p.y += p.vy + Math.sin(now / 2000 + p.phase) * 0.03;
        if (p.x < -20) p.x = W + 20;
        else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        else if (p.y > H + 20) p.y = -20;
      }

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
      const t = proximity * proximity * (3 - 2 * proximity);

      let drawX = p.x, drawY = p.y;
      if (dist < INFLUENCE_RADIUS && dist > 0) {
        const push = (1 - dist / INFLUENCE_RADIUS) * 18;
        const angle = Math.atan2(dy, dx);
        drawX += Math.cos(angle) * push;
        drawY += Math.sin(angle) * push;
      }

      ctx.font = `500 ${lerpN(p.size, p.size * 1.25, t)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = lerpColor(BASE, ACTIVE, t);
      ctx.fillText(p.glyph, drawX, drawY);
    }
  }

  function animate(now) {
    draw(now);
    requestAnimationFrame(animate);
  }

  setSize();
  window.addEventListener('resize', setSize);

  if (!reduceMotion) {
    window.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    requestAnimationFrame(animate);
  } else {
    draw(0);
  }
})();

/* ── SERVICES CAROUSEL (port of ServiceCarousel / embla loop) ── */
(() => {
  const root = document.getElementById('svcCarousel');
  const track = document.getElementById('svcTrack');
  if (!root || !track) return;
  const viewport = root.querySelector('.svc-viewport');

  const originals = Array.from(track.children);
  const n = originals.length;
  originals.forEach((item, i) => item.querySelector('.svc-card').style.setProperty('--i', i));

  // Clone a full set on each side so the loop never shows an edge.
  const clone = (item) => {
    const c = item.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.removeAttribute('aria-label');
    return c;
  };
  originals.slice().reverse().forEach(item => track.insertBefore(clone(item), track.firstChild));
  originals.forEach(item => track.appendChild(clone(item)));

  let index = n;
  let w = 0;
  let dragDx = 0;

  function set(animate) {
    track.classList.toggle('animate', animate);
    track.style.transform = `translate3d(${-index * w + dragDx}px, 0, 0)`;
  }

  function normalize() {
    if (index >= 2 * n) index -= n;
    else if (index < n) index += n;
    else return;
    set(false);
    void track.offsetWidth;
  }

  function go(to) {
    index = to;
    set(true);
  }

  const nudge = (by) => { normalize(); go(index + by); };

  track.addEventListener('transitionend', (e) => {
    if (e.target === track) normalize();
  });

  function measure() {
    w = track.children[0].getBoundingClientRect().width;
    set(false);
  }
  new ResizeObserver(measure).observe(viewport);
  measure();

  root.querySelector('.svc-next').addEventListener('click', () => nudge(1));
  root.querySelector('.svc-prev').addEventListener('click', () => nudge(-1));

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
  });

  /* Drag / swipe */
  let drag = null;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    normalize();
    drag = { id: e.pointerId, x: e.clientX };
    viewport.setPointerCapture(e.pointerId);
    viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    dragDx = e.clientX - drag.x;
    set(false);
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    viewport.classList.remove('dragging');
    const moved = -dragDx / w;
    dragDx = 0;
    const by = Math.abs(moved) > 0.15 ? clamp(Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved))), -2, 2) : 0;
    go(index + by);
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* Staggered entrance (useInView once, amount .2) */
  let inView = false;
  new IntersectionObserver(([e], obs) => {
    inView = e.isIntersecting;
    if (inView && !root.classList.contains('in')) {
      root.classList.add('in');
      setTimeout(() => track.querySelectorAll('.svc-card').forEach(c => c.classList.add('settled')), 1300);
    }
  }, { threshold: 0.2 }).observe(root);

  /* Gentle autoplay, paused on hover / focus / drag */
  if (reduceMotion) return;
  let hold = false;
  root.addEventListener('pointerenter', () => { hold = true; });
  root.addEventListener('pointerleave', () => { hold = false; });
  root.addEventListener('focusin', () => { hold = true; });
  root.addEventListener('focusout', () => { hold = false; });
  setInterval(() => {
    if (inView && !hold && !drag && !document.hidden && !motionOff()) nudge(1);
  }, 5000);
})();

/* ── PORTFOLIO MARQUEE + SHINE ── */
(() => {
  const marquee = document.getElementById('workMarquee');
  const track = document.getElementById('workTrack');
  if (!marquee || !track) return;

  const originals = Array.from(track.children);
  let setW = 0;
  let cards = [];
  let imgs = [];

  function build() {
    track.querySelectorAll('[data-clone]').forEach(c => c.remove());
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const last = originals[originals.length - 1];
    setW = last.offsetLeft + last.offsetWidth + gap - originals[0].offsetLeft;
    const sets = Math.ceil(marquee.clientWidth / setW) + 1;
    for (let s = 0; s < sets; s++) {
      originals.forEach(card => {
        const c = card.cloneNode(true);
        c.setAttribute('data-clone', '');
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('tabindex', '-1');
        track.appendChild(c);
      });
    }
    cards = Array.from(track.children);
    imgs = cards.map(c => c.querySelector('.work-img'));
  }

  build();
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(build, 150);
  });

  const BASE_SPEED = 55; // px per second
  let x = 0;
  let speed = motionOff() ? 0 : BASE_SPEED;
  let hovering = false;
  let userPaused = false;
  let focusHold = false;
  let visible = true;
  let last = performance.now();

  const targetSpeed = () => (hovering || userPaused || focusHold || motionOff() ? 0 : BASE_SPEED);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(marquee);

  marquee.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  marquee.addEventListener('pointerleave', () => { hovering = false; });

  /* Pause / play button (WCAG 2.2.2: moving content must be pausable) */
  const toggle = document.getElementById('workToggle');
  const toggleLabel = toggle && toggle.querySelector('.work-toggle-label');
  function syncToggle() {
    if (!toggle) return;
    toggle.hidden = reduceMotion; // the OS setting keeps the strip still for good
    const paused = userPaused || motionOff();
    toggle.setAttribute('aria-pressed', String(paused));
    toggleLabel.textContent = paused ? 'Retomar' : 'Pausar';
    toggle.setAttribute('aria-label', paused ? 'Retomar movimento dos projetos' : 'Pausar movimento dos projetos');
  }
  if (toggle) {
    toggle.addEventListener('click', () => {
      if (motionOff() && !userPaused) {
        // Motion is paused globally; the button then only reflects that state.
        document.dispatchEvent(new CustomEvent('np:request-motion'));
      } else {
        userPaused = !userPaused;
      }
      syncToggle();
    });
    document.addEventListener('np:prefs', syncToggle);
    syncToggle();
  }

  /* Keyboard: freeze the strip and bring the focused card into view.
     While focused the strip does not wrap, so the real card (not a clone) stays on screen. */
  marquee.addEventListener('focusin', (e) => {
    const card = e.target.closest('.work-card');
    if (!card) return;
    focusHold = true;
    speed = 0;
    marquee.scrollLeft = 0;
    const vr = marquee.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    const pad = vr.width * 0.08;
    if (r.left < vr.left + pad || r.right > vr.right - pad) {
      x += (vr.left + vr.width / 2) - (r.left + r.width / 2);
      const min = -(track.scrollWidth - marquee.clientWidth);
      x = clamp(x, min, 0);
    }
  });
  marquee.addEventListener('focusout', (e) => {
    if (!marquee.contains(e.relatedTarget)) focusHold = false;
  });

  /* Drag */
  let down = null;
  let suppressClick = false;
  marquee.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, start: x, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!down.moved && Math.abs(dx) > 6) {
      down.moved = true;
      marquee.classList.add('dragging');
    }
    if (down.moved) x = down.start + dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    suppressClick = down.moved;
    down = null;
    marquee.classList.remove('dragging');
  });
  marquee.addEventListener('click', (e) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }
  }, true);

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible) {
      speed += (targetSpeed() - speed) * 0.06;
      if (!down) x -= speed * dt;
      if (setW && !focusHold) {
        while (x <= -setW) { x += setW; if (down) down.start += setW; }
        while (x > 0) { x -= setW; if (down) down.start -= setW; }
      }
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

      // The light sits at the viewport centre; each image catches it as it passes.
      const vr = marquee.getBoundingClientRect();
      const centre = vr.left + vr.width / 2;
      for (let i = 0; i < cards.length; i++) {
        const r = cards[i].getBoundingClientRect();
        if (r.right < vr.left - 50 || r.left > vr.right + 50) continue;
        const s = ((centre - r.left) / r.width) * 100;
        const glow = Math.max(0, 1 - Math.abs(r.left + r.width / 2 - centre) / (r.width * 0.9));
        imgs[i].style.setProperty('--s', s.toFixed(1) + '%');
        cards[i].style.setProperty('--glow', glow.toFixed(3));
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* Each card crossfades between its two screenshots */
  let flip = false;
  setInterval(() => {
    if (!visible || document.hidden || motionOff() || userPaused) return;
    flip = !flip;
    originals.forEach((_, i) => {
      setTimeout(() => {
        cards.forEach((c, j) => {
          if (j % originals.length === i) imgs[j].classList.toggle('alt', flip);
        });
      }, i * 280);
    });
  }, 4200);
})();

/* ── BACK TO TOP ──
   The hero is sticky, so a plain #inicio anchor is already "in view" and never
   scrolls. Animate to 0 instead, passing through every section on the way up. */
(() => {
  const links = document.querySelectorAll('a[href="#inicio"]');
  let raf = null;

  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    document.documentElement.classList.remove('to-top-running');
  }

  function scrollToTop() {
    stop();
    const from = window.scrollY;
    if (from <= 0) return;
    if (motionOff()) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }

    // Longer pages get a longer ride, within a range that still feels snappy.
    const duration = clamp(from * 0.35, 900, 2200);
    const start = performance.now();
    document.documentElement.classList.add('to-top-running');

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo({ top: from * (1 - easeInOutCubic(t)), behavior: 'instant' });
      if (t < 1) raf = requestAnimationFrame(step);
      else stop();
    };
    raf = requestAnimationFrame(step);
  }

  links.forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTop();
    history.replaceState(null, '', location.pathname + location.search);
  }));

  // Hand control back if the user scrolls during the animation.
  ['wheel', 'touchstart', 'keydown'].forEach(evt =>
    window.addEventListener(evt, () => { if (raf) stop(); }, { passive: true }));
})();

/* ── HOVER SPOTLIGHT ── */
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest && e.target.closest('.spot');
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

/* ── MAGNETIC BUTTONS ── */
if (!reduceMotion) {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || motionOff()) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.32}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ── FOOTER WORDMARK GLOW ── */
(() => {
  const footer = document.getElementById('siteFooter');
  const mark = document.getElementById('footerWordmark');
  if (!footer || !mark) return;
  footer.addEventListener('pointermove', (e) => {
    const r = mark.getBoundingClientRect();
    mark.style.setProperty('--mx', `${e.clientX - r.left}px`);
    mark.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
})();

/* ── LEGAL DIALOGS (Política de Privacidade / Termos de Uso) ──
   Native <dialog>: focus is trapped and Esc closes it for free.
   Focus returns to whatever opened the first dialog in the chain. */
(() => {
  const HASHES = { dlgPrivacy: '#politica-de-privacidade', dlgTerms: '#termos-de-uso' };
  let opener = null;

  function open(id, trigger) {
    const dlg = document.getElementById(id);
    if (!dlg || typeof dlg.showModal !== 'function') return false;
    const current = document.querySelector('dialog.legal[open]');
    if (current === dlg) return true;
    if (current) current.close();
    else opener = trigger || document.activeElement;
    dlg.showModal();
    const body = dlg.querySelector('.legal-body');
    if (body) body.scrollTop = 0;
    dlg.querySelector('.legal-close').focus();
    return true;
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-dialog]');
    if (trigger && open(trigger.dataset.openDialog, trigger)) {
      e.preventDefault();
      return;
    }
    const closer = e.target.closest('[data-close-dialog]');
    if (closer) closer.closest('dialog').close();
  });

  document.querySelectorAll('dialog.legal').forEach(dlg => {
    // A click on the backdrop lands on the <dialog> itself.
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => {
      if (document.querySelector('dialog.legal[open]')) return;
      if (location.hash === HASHES[dlg.id]) history.replaceState(null, '', location.pathname + location.search);
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });
  });

  // Deep links such as /#politica-de-privacidade open the matching document.
  function fromHash() {
    const id = Object.keys(HASHES).find(k => HASHES[k] === location.hash);
    if (id) open(id, document.getElementById('conteudo'));
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();

/* ── ACCESSIBILITY PANEL ──
   Preferences live only in this browser (localStorage) and are applied
   before first paint by the inline script in <head>. */
(() => {
  const root = document.documentElement;
  const wrap = document.getElementById('a11y');
  const btn = document.getElementById('a11yToggle');
  const panel = document.getElementById('a11yPanel');
  if (!wrap || !btn || !panel) return;

  const KEY = 'np-a11y';
  const SCALES = [100, 112.5, 125, 137.5, 150];
  const TOGGLES = ['contrast', 'motion', 'links', 'readable'];
  const out = document.getElementById('a11yScaleValue');
  const down = panel.querySelector('[data-a11y-scale="-1"]');
  const up = panel.querySelector('[data-a11y-scale="1"]');

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode: session only */ }
  }

  let prefs = load();

  function apply() {
    const scale = SCALES.includes(prefs.scale) ? prefs.scale : 100;
    root.style.fontSize = scale === 100 ? '' : scale + '%';
    out.textContent = String(scale).replace('.', ',') + '%';
    down.disabled = scale === SCALES[0];
    up.disabled = scale === SCALES[SCALES.length - 1];
    TOGGLES.forEach(k => {
      root.classList.toggle('a11y-' + k, !!prefs[k]);
      const b = panel.querySelector(`[data-a11y-toggle="${k}"]`);
      if (b) b.setAttribute('aria-pressed', String(!!prefs[k]));
    });
    document.dispatchEvent(new CustomEvent('np:prefs'));
    // Layout-dependent pieces (sticky hero, marquee, carousel) re-measure on resize.
    window.dispatchEvent(new Event('resize'));
  }

  function update(patch) {
    prefs = { ...prefs, ...patch };
    save(prefs);
    apply();
  }

  function setOpen(open, focusBack = true) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('button').focus();
    else if (focusBack) btn.focus();
  }

  btn.addEventListener('click', () => setOpen(panel.hidden));
  document.getElementById('a11yClose').addEventListener('click', () => setOpen(false));
  document.querySelectorAll('[data-open-a11y]').forEach(b => b.addEventListener('click', () => setOpen(true)));

  panel.addEventListener('click', (e) => {
    const s = e.target.closest('[data-a11y-scale]');
    if (s) {
      const i = SCALES.indexOf(SCALES.includes(prefs.scale) ? prefs.scale : 100);
      const next = SCALES[clamp(i + Number(s.dataset.a11yScale), 0, SCALES.length - 1)];
      update({ scale: next });
      return;
    }
    const t = e.target.closest('[data-a11y-toggle]');
    if (t) update({ [t.dataset.a11yToggle]: !prefs[t.dataset.a11yToggle] });
  });

  document.getElementById('a11yReset').addEventListener('click', () => {
    prefs = {};
    try { localStorage.removeItem(KEY); } catch (e) {}
    apply();
  });

  // The portfolio "Retomar" button asks to lift the global pause.
  document.addEventListener('np:request-motion', () => update({ motion: false }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !wrap.contains(e.target)) setOpen(false, false);
  });

  apply();
})();

/* ── CONTACT FORM: validation, consent and async submit (Web3Forms) ── */
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const ENDPOINT = 'https://api.web3forms.com/submit';
  const POLICY_VERSION = '30/09/2026';
  const TIMEOUT_MS = 15000;
  const WHATSAPP = '5521974845065';
  const MAILTO = 'contato@npcodesolutions.com.br';
  const status = document.getElementById('formStatus');
  const submit = document.getElementById('formSubmit');
  const submitLabel = submit.querySelector('.submit-label');
  const message = document.getElementById('mensagem');
  const counter = document.getElementById('mensagem-contador');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const RULES = {
    nome: (v) => {
      if (!v) return 'Informe seu nome.';
      if (v.length < 2) return 'O nome precisa ter pelo menos 2 caracteres.';
      return '';
    },
    email: (v) => {
      if (!v) return 'Informe seu e-mail para podermos responder.';
      if (!EMAIL_RE.test(v)) return 'Digite um e-mail válido, por exemplo: nome@empresa.com.br.';
      return '';
    },
    mensagem: (v) => {
      if (!v) return 'Conte um pouco sobre o seu projeto.';
      if (v.length < 10) return `Escreva pelo menos 10 caracteres (faltam ${10 - v.length}).`;
      return '';
    },
    consentimento: (_, el) => (el.checked ? '' : 'Para enviar, é preciso concordar com a Política de Privacidade e os Termos de Uso.'),
  };

  const fields = Object.keys(RULES).map(id => document.getElementById(id));
  const touched = new Set();

  function check(el) {
    const msg = RULES[el.id](el.value.trim(), el);
    const err = document.getElementById(`${el.id}-erro`);
    // Only rewrite the message when it changes, so screen readers are not spammed.
    if (err.textContent !== msg) err.textContent = msg;
    el.setAttribute('aria-invalid', String(!!msg));
    el.classList.toggle('is-valid', !msg && el.type !== 'checkbox');
    return !msg;
  }

  fields.forEach(el => {
    // Validate after the user leaves a field, then live while they fix it.
    el.addEventListener('blur', () => { if (el.value.trim() || touched.has(el.id)) { touched.add(el.id); check(el); } });
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => { if (touched.has(el.id)) check(el); });
  });

  function updateCounter() {
    const max = Number(message.getAttribute('maxlength'));
    const n = message.value.length;
    counter.textContent = `${n} / ${max}`;
    counter.classList.toggle('near', n > max * 0.9);
  }
  message.addEventListener('input', updateCounter);
  updateCounter();

  function setStatus(kind, html) {
    status.className = `form-status ${kind}`;
    status.innerHTML = html;
  }

  function setBusy(busy) {
    submit.disabled = busy;
    submit.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? 'Enviando…' : 'Enviar mensagem';
  }

  /* Without JavaScript the form still posts to Web3Forms, which sends the visitor
     back here via "redirect" (free plan: must be this same domain). */
  const SENT_FLAG = 'enviado';
  const redirect = document.getElementById('formRedirect');
  if (redirect) {
    if (/^https?:$/.test(location.protocol)) {
      redirect.value = `${location.origin}${location.pathname}?${SENT_FLAG}=1#contato`;
    } else {
      redirect.remove(); // only http(s) URLs are valid redirects (e.g. not file://)
    }
  }

  const params = new URLSearchParams(location.search);
  if (params.has(SENT_FLAG)) {
    params.delete(SENT_FLAG);
    const qs = params.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}#contato`);
    setStatus('ok', '<strong>Mensagem enviada!</strong> Obrigado pelo contato. Vamos responder em até 24 horas úteis no e-mail informado.');
    requestAnimationFrame(() => {
      document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'start' });
      status.focus({ preventScroll: true });
    });
  }

  const accessKey = document.getElementById('formAccessKey');
  const keyMissing = () => !accessKey || !accessKey.value || accessKey.value === 'SUA_ACCESS_KEY_AQUI';
  if (keyMissing()) {
    console.error('[Formulário] Configure a access key do Web3Forms no campo #formAccessKey do index.html (gere em https://web3forms.com).');
  }

  /* If sending fails, the visitor can send the very same message through
     WhatsApp or their own e-mail app — nothing typed is lost. */
  function showFallback(data) {
    const lines = [
      `Olá! Sou ${String(data.name).trim()}${data.company ? `, da ${String(data.company).trim()}` : ''}.`,
      data.service ? `Serviço de interesse: ${data.service}` : '',
      '',
      String(data.message).trim(),
      '',
      `Meu e-mail: ${String(data.email).trim()}`,
    ].filter((l, i, arr) => l || (i > 0 && arr[i - 1]));
    const text = lines.join('\n');
    const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
    const mail = `mailto:${MAILTO}?subject=${encodeURIComponent('Contato pelo site NP Code')}&body=${encodeURIComponent(text)}`;
    setStatus('err', `<strong>Não conseguimos enviar sua mensagem agora.</strong> Seus dados continuam no formulário: tente de novo em instantes ou envie a mesma mensagem, já preenchida, por
      <a href="${wa}" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (abre em nova aba)</span></a> ou
      <a href="${mail}">e-mail</a>.`);
    status.focus();
  }

  // Coming back with the browser Back button restores the page from cache,
  // possibly mid-submit; never leave the button stuck in "Enviando…".
  window.addEventListener('pageshow', (e) => { if (e.persisted) setBusy(false); });

  const escapeHtml = (str) => str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    fields.forEach(el => touched.add(el.id));
    const invalid = fields.filter(el => !check(el));
    if (invalid.length) {
      setStatus('err', invalid.length === 1
        ? 'Revise o campo destacado para enviar sua mensagem.'
        : `Revise os ${invalid.length} campos destacados para enviar sua mensagem.`);
      invalid[0].focus();
      return;
    }

    const body = new FormData(form);
    const data = Object.fromEntries(body);
    const firstName = escapeHtml(String(data.name).trim().split(/\s+/)[0]);
    const email = escapeHtml(String(data.email).trim());

    // Bots tick the hidden checkbox; pretend success and drop the message.
    if (data.botcheck) {
      setStatus('ok', 'Mensagem enviada! Obrigado pelo contato.');
      form.reset();
      return;
    }
    if (keyMissing()) {
      showFallback(data);
      return;
    }

    body.delete('botcheck');
    body.delete('redirect'); // JSON reply instead of a redirect
    body.set('consentimento_lgpd', `Sim. Aceite da Política de Privacidade e dos Termos de Uso (versão ${POLICY_VERSION}) em ${new Date().toLocaleString('pt-BR')}`);

    setBusy(true);
    setStatus('', '');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const slowHint = setTimeout(() => setStatus('', 'Enviando sua mensagem…'), 3000);

    try {
      // FormData (multipart) with only an Accept header is a "simple" CORS request: no preflight.
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success !== true) throw new Error(json.message || `HTTP ${res.status}`);

      setStatus('ok', `<strong>Mensagem enviada!</strong> Obrigado, ${firstName}. Vamos responder em até 24 horas úteis no e-mail <strong>${email}</strong>.`);
      form.reset();
      touched.clear();
      fields.forEach(el => { el.removeAttribute('aria-invalid'); el.classList.remove('is-valid'); });
      updateCounter();
    } catch (err) {
      console.error('[Formulário] Falha no envio:', err.message);
      showFallback(data);
    } finally {
      clearTimeout(timer);
      clearTimeout(slowHint);
      setBusy(false);
    }
  });
})();
