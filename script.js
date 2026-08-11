/* ── THEME ── */
const logo = document.getElementById('logo');
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const iconSun = document.getElementById('iconSun');
const iconMoon = document.getElementById('iconMoon');
let dark = true;

themeBtn.addEventListener('click', () => {
    dark = !dark;
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    iconSun.style.display = dark ? 'block' : 'none';
    iconMoon.style.display = dark ? 'none' : 'block';
    logo.src = dark ? 'assets/logo branca.png' : 'assets/logodark.png';
});

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