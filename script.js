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

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── FORM SUBMIT ── */
function submitForm() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!nome || !email) {
    alert('Por favor, preencha nome e e-mail.');
    return;
  }
  document.getElementById('formFields').style.display = 'none';
  document.getElementById('formSuccess').classList.add('show');
}

/* ── NAV ACTIVE ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  const y = window.scrollY + 120;
  sections.forEach(s => {
    if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${s.id}"]`);
      if (active && !active.classList.contains('nav-cta')) {
        active.style.color = 'var(--gold-hi)';
      }
    }
  });
}, { passive: true });

/* ── SLIDER ── */
document.querySelectorAll(".slider").forEach((slider) => {
    const slides = slider.querySelector(".slides");
    const images = slider.querySelectorAll("img");
    let index = 0;
    setInterval(() => {
        index++;
        if (index >= images.length) {
            index = 0;
        }
        slides.style.transform = `translateX(-${index * 100}%)`;
    }, 3500);
});

/* ── HERO KINETIC GRID ── */
(() => {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('inicio');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');

  const CELL_SIZE = 55;
  const INFLUENCE_RADIUS = 260;
  const MAX_WARP = 24;
  const DOT_SPACING = 28;
  const LERP_SPEED = 0.08;

  const LINE_BASE = { r: 255, g: 255, b: 255, a: 0.13 };
  const NODE_BASE_RADIUS = 1.8;
  const NODE_ACTIVE_RADIUS = 3.2;

  const LINE_ACTIVE = { r: 240, g: 192, b: 96, a: 0.9 };
  const NODE_ACTIVE = { r: 240, g: 192, b: 96, a: 1 };
  const GLOW = '240,192,96';
  const RIPPLE_COLOR = '240,192,96';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let size = { w: 0, h: 0 };
  const mouse = { x: -9999, y: -9999 };
  const targetMouse = { x: -9999, y: -9999 };
  let ripples = [];

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

  function setSize() {
    size = { w: hero.clientWidth, h: hero.clientHeight };
    canvas.width = size.w;
    canvas.height = size.h;
  }

  function getWarpedPoint(gx, gy, col, row, cols, rows) {
    const edgeMargin = 1.5;
    const colPin = Math.min(col / edgeMargin, (cols - 1 - col) / edgeMargin, 1);
    const rowPin = Math.min(row / edgeMargin, (rows - 1 - row) / edgeMargin, 1);
    const pinFactor = colPin * colPin * rowPin * rowPin;

    const dx = gx - mouse.x;
    const dy = gy - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pinFactor;

    let rx = 0, ry = 0;
    for (const r of ripples) {
      const rdx = gx - r.x;
      const rdy = gy - r.y;
      const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
      const waveWidth = 55;
      const diff = rdist - r.radius;
      if (Math.abs(diff) < waveWidth) {
        const strength = (1 - Math.abs(diff) / waveWidth) * r.opacity * 18 * pinFactor;
        const angle = Math.atan2(rdy, rdx);
        const sign = diff < 0 ? -1 : 1;
        rx += Math.cos(angle) * strength * sign * -1;
        ry += Math.sin(angle) * strength * sign * -1;
      }
    }

    if (dist < INFLUENCE_RADIUS && dist > 0 && pinFactor > 0) {
      const t = dist / INFLUENCE_RADIUS;
      const eased = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
      const warpAmt = eased * MAX_WARP * pinFactor;
      const angle = Math.atan2(dy, dx);
      return {
        pt: { x: gx - Math.cos(angle) * warpAmt + rx, y: gy - Math.sin(angle) * warpAmt + ry },
        proximity,
      };
    }

    return { pt: { x: gx + rx, y: gy + ry }, proximity };
  }

  function draw(now) {
    const W = size.w, H = size.h;
    if (!W || !H) return;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING) {
      for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
        ctx.beginPath();
        ctx.arc(x, y, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      const age = (now - r.born) / 1000;
      r.radius = Math.max(0, age * 400);
      r.opacity = Math.max(0, 1 - age * 1.2);
      if (r.opacity <= 0) ripples.splice(i, 1);
    }

    const cols = Math.max(2, Math.ceil(W / CELL_SIZE)) + 1;
    const rows = Math.max(2, Math.ceil(H / CELL_SIZE)) + 1;
    const cellW = W / (cols - 1);
    const cellH = H / (rows - 1);

    const pts = [];
    const prox = [];
    for (let row = 0; row < rows; row++) {
      pts[row] = [];
      prox[row] = [];
      for (let col = 0; col < cols; col++) {
        const { pt, proximity } = getWarpedPoint(col * cellW, row * cellH, col, row, cols, rows);
        pts[row][col] = pt;
        prox[row][col] = proximity;
      }
    }

    function drawSeg(p1, p2, pr1, pr2) {
      const avg = (pr1 + pr2) / 2;
      const t = avg * avg * (3 - 2 * avg);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = lerpColor(LINE_BASE, LINE_ACTIVE, t);
      ctx.lineWidth = lerpN(0.8, 1.5, t);
      ctx.stroke();
    }

    ctx.lineCap = 'butt';
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols - 1; col++)
        drawSeg(pts[row][col], pts[row][col + 1], prox[row][col], prox[row][col + 1]);
    for (let col = 0; col < cols; col++)
      for (let row = 0; row < rows - 1; row++)
        drawSeg(pts[row][col], pts[row + 1][col], prox[row][col], prox[row + 1][col]);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const p = pts[row][col];
        const pr = prox[row][col];
        const t = pr * pr * (3 - 2 * pr);
        const r = lerpN(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);

        if (t > 0.3) {
          const glowR = r + lerpN(0, 6, (t - 0.3) / 0.7);
          const grd = ctx.createRadialGradient(p.x, p.y, r * 0.5, p.x, p.y, glowR);
          grd.addColorStop(0, `rgba(${GLOW},${(t * 0.3).toFixed(3)})`);
          grd.addColorStop(1, `rgba(${GLOW},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = lerpColor({ r: 255, g: 255, b: 255, a: 0.2 }, NODE_ACTIVE, t);
        ctx.fill();
      }
    }

    for (const r of ripples) {
      const safeRadius = Math.max(0, r.radius);
      ctx.beginPath();
      ctx.arc(r.x, r.y, safeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${RIPPLE_COLOR},${(r.opacity * 0.28).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function animate(now) {
    mouse.x = lerpN(mouse.x, targetMouse.x, LERP_SPEED);
    mouse.y = lerpN(mouse.y, targetMouse.y, LERP_SPEED);
    draw(now);
    requestAnimationFrame(animate);
  }

  setSize();
  window.addEventListener('resize', setSize);

  if (!reduceMotion) {
    window.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetMouse.x = e.clientX - rect.left;
      targetMouse.y = e.clientY - rect.top;
    });

    window.addEventListener('click', (e) => {
      const rect = hero.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        opacity: 1,
        born: performance.now(),
      });
    });

    requestAnimationFrame(animate);
  } else {
    draw(0);
  }
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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

      ctx.font = `600 ${lerpN(p.size, p.size * 1.25, t)}px 'Inter', monospace`;
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

/* ── SERVICES COVERFLOW ── */
(() => {
  const frame = document.getElementById('coverflowFrame');
  const track = document.getElementById('coverflowTrack');
  if (!frame || !track) return;

  const cards = Array.from(track.querySelectorAll('.coverflow-card'));
  const count = cards.length;
  if (!count) return;

  const ROTATE = 40, DEPTH = 0.6, FALLOFF = 0.56, FADE = 0.14, GAP = 0.08;
  let width = 0, pos = 0, target = 0, raf = null, drag = null;

  function paint() {
    if (!width) return;
    const pitch = width * (1 + GAP);
    cards.forEach((card, index) => {
      let offset = index - pos;
      offset = ((offset % count) + count) % count;
      if (offset > count / 2) offset -= count;
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, FALLOFF);
      const tilt = Math.min(ROTATE * ramp, 82) * Math.sign(offset);
      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) translateZ(${-DEPTH * width * ramp}px) rotateY(${-tilt}deg)`;
      const edge = Math.min(1, Math.max(0, count / 2 - distance));
      card.style.opacity = String(Math.max(0, 1 - FADE * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
      card.style.pointerEvents = distance < 0.5 ? 'auto' : 'none';
    });
  }

  function settle(to) {
    if (raf) cancelAnimationFrame(raf);
    target = to;
    const step = () => {
      const remaining = target - pos;
      if (Math.abs(remaining) < 0.0004) {
        pos = target;
        paint();
        raf = null;
        return;
      }
      pos += remaining * 0.16;
      paint();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const nudge = (by) => settle(Math.round(target) + by);

  function measure() {
    width = cards[0].offsetWidth;
    paint();
  }
  new ResizeObserver(measure).observe(frame);
  measure();

  frame.addEventListener('pointerdown', (e) => {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    frame.setPointerCapture(e.pointerId);
    target = pos;
    drag = { id: e.pointerId, x: e.clientX, startPos: pos };
  });

  frame.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const pitch = width * (1 + GAP);
    if (!pitch) return;
    pos = drag.startPos - (e.clientX - drag.x) / pitch;
    paint();
  });

  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag = null;
    settle(Math.round(pos));
  }
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  frame.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
  });

  const prevBtn = document.querySelector('.coverflow-prev');
  const nextBtn = document.querySelector('.coverflow-next');
  if (prevBtn) prevBtn.addEventListener('click', () => nudge(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => nudge(1));
})();