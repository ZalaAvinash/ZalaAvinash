/**
 * AVINASH ZALA — Editorial Portfolio (no 3D).
 * Renders all sections from data.js, handles nav, scroll-reveal, deep-link.
 */
import { portfolioData, SECTION_ORDER } from './data.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function renderHero(d) {
  $('#hero-name').textContent = d.hero.name;
  $('#hero-tagline').textContent = d.hero.tagline;
  $('#hero-stats').innerHTML = d.hero.stats
    .map(s => `<li><span class="v">${esc(s.value)}</span><span class="l">${esc(s.label)}</span></li>`)
    .join('');
}

function renderAbout(d) {
  $('#about-heading').textContent = d.about.heading;
  $('#about-body').innerHTML = d.about.body.map(p => `<p>${esc(p)}</p>`).join('');
  $('#about-tags').innerHTML = d.about.tags.map(t => `<span>${esc(t)}</span>`).join('');
}

function renderSkills(d) {
  const cats = ['frontend', 'backend', 'cloud', 'data'];
  const labels = { frontend: 'Frontend', backend: 'Backend', cloud: 'Cloud / DevOps', data: 'Data' };
  $('#skills-grid').innerHTML = cats.map(cat => {
    const items = d.skills.filter(s => s.cat === cat);
    if (!items.length) return '';
    const bars = items.map(s => `
      <div class="skill">
        <div class="row"><span class="nm">${esc(s.name)}</span><span class="pc">${Math.round(s.level * 100)}%</span></div>
        <div class="track"><div class="fill" data-w="${Math.round(s.level * 100)}"></div></div>
      </div>`).join('');
    return `<div class="skill-group"><h3 class="group-title">${labels[cat]}</h3>${bars}</div>`;
  }).join('');
}

function renderProjects(d) {
  $('#projects-grid').innerHTML = d.projects.map(p => `
    <article class="project-card">
      <div class="project-media"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>
      <div class="project-body">
        <h3>${esc(p.title)}</h3>
        <div class="project-client">${esc(p.client)}</div>
        <div class="project-impact">${esc(p.impact)}</div>
        <div class="project-desc">${esc(p.desc)}</div>
        <div class="project-tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      </div>
    </article>`).join('');
}

function renderExperience(d) {
  $('#timeline').innerHTML = d.experience.map(e => `
    <div class="tl-item">
      <div class="yr">${esc(e.year)}</div>
      <h3>${esc(e.role)}</h3>
      <div class="co">${esc(e.company)}</div>
      <div class="fo">${esc(e.focus)}</div>
    </div>`).join('');
}

function renderLab(d) {
  $('#process-grid').innerHTML = d.process.map(s => `
    <div class="proc-card">
      <div class="step">${esc(s.step)}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.desc)}</p>
    </div>`).join('');
  $('#testimonials').innerHTML = d.testimonials.map(t => `
    <div class="quote">
      <p>${esc(t.quote)}</p>
      <div class="who">${esc(t.author)} — ${esc(t.company)}</div>
    </div>`).join('');
}

function renderContact(d) {
  const c = d.contact;
  const cards = [
    { ic: '✉', lab: 'Email', val: c.email, href: `mailto:${c.email}` },
    { ic: '☏', lab: 'Phone', val: c.phone, href: c.phoneHref },
    { ic: 'in', lab: 'LinkedIn', val: 'Connect', href: c.linkedin },
    { ic: '↓', lab: 'Resume', val: 'Download CV', href: c.resume, dl: true }
  ];
  $('#contact-cards').innerHTML = cards.map(card =>
    `<a class="contact-card" href="${esc(card.href)}"${card.dl ? ' download' : ''} target="${card.href.startsWith('http') ? '_blank' : '_self'}" rel="noopener">
       <span class="ic">${card.ic}</span>
       <span><span class="lab">${esc(card.lab)}</span><br><span class="val">${esc(card.val)}</span></span>
     </a>`).join('');
}

/* ---- Nav: mobile drawer ---- */
function initNav() {
  const toggle = $('#nav-toggle');
  const nav = $('#site-nav');
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
}

/* ---- Scroll reveal + active nav + skill fill ---- */
function initScroll(d) {
  const sections = SECTION_ORDER.map(id => $(`#${id}`)).filter(Boolean);
  const navLinks = $$('#site-nav a[href^="#"]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        // animate skill bars when skills section reveals
        if (e.target.id === 'skills') {
          $$('.fill', e.target).forEach(f => { f.style.width = f.dataset.w + '%'; });
        }
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  // active nav link based on section in view
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));
}

/* ---- Deep link ---- */
function applyDeepLink() {
  const at = new URLSearchParams(location.search).get('at');
  if (at && SECTION_ORDER.includes(at.toLowerCase())) {
    const el = $(`#${at.toLowerCase()}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
  }
}

function init() {
  try {
    renderHero(portfolioData);
    renderAbout(portfolioData);
    renderSkills(portfolioData);
    renderProjects(portfolioData);
    renderExperience(portfolioData);
    renderLab(portfolioData);
    renderContact(portfolioData);
    $('#year').textContent = new Date().getFullYear();
    initNav();
    initScroll(portfolioData);
    applyDeepLink();
  } catch (err) {
    console.error('[Portfolio] render error:', err);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
