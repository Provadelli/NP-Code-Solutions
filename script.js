const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ── HAMBURGER ── */
const ham = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');

ham.addEventListener('click', () => {
  const open = ham.classList.toggle('open');
  mob.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mob-link').forEach(a => {
  a.addEventListener('click', () => {
    ham.classList.remove('open');
    mob.classList.remove('open');
    document.body.style.overflow = '';
  });
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
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
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
    while (!active) await sleep(300);
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
    if (e.pointerType !== 'mouse') return;
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
      if (!reduceMotion) {
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
    if (inView && !hold && !drag && !document.hidden) nudge(1);
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

  const BASE_SPEED = reduceMotion ? 0 : 55; // px per second
  let x = 0;
  let speed = BASE_SPEED;
  let target = BASE_SPEED;
  let visible = true;
  let last = performance.now();

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(marquee);

  marquee.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') target = 0; });
  marquee.addEventListener('pointerleave', () => { target = BASE_SPEED; });

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
      speed += (target - speed) * 0.06;
      if (!down) x -= speed * dt;
      if (setW) {
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
    if (!visible || document.hidden) return;
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
    if (reduceMotion) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }

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
      if (e.pointerType !== 'mouse') return;
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
