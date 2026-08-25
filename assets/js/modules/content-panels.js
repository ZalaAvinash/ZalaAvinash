/**
 * CONTENT PANELS — Option A: 3D stays as atmosphere, this is the clean 2D content layer.
 * Each section renders a readable, designed panel that fades in when you arrive.
 */
import { portfolioData, SECTION_PROGRESS, SECTION_NAMES } from '../data.js';

const CAT_LABEL = { frontend: 'Frontend', backend: 'Backend', cloud: 'Cloud / DevOps', data: 'Data' };

export class ContentPanels {
  constructor() {
    this.root = document.getElementById('content-panels');
    this.panels = [];
  }

  init() {
    if (!this.root) return;
    this.root.innerHTML = '';
    SECTION_NAMES.forEach((name, i) => {
      const el = document.createElement('div');
      el.className = 'cp';
      el.dataset.section = i;
      el.innerHTML = this._render(name, i);
      this.root.appendChild(el);
      this.panels.push(el);
    });
  }

  _render(name, i) {
    switch (name) {
      case 'ABOUT': return this._about();
      case 'SKILLS': return this._skills();
      case 'PROJECTS': return this._projects();
      case 'EXPERIENCE': return this._experience();
      case 'LAB': return this._lab();
      case 'CONTACT': return this._contact();
      default: return '';
    }
  }

  _about() {
    return `
      <div class="cp-eyebrow">About</div>
      <h2>Senior Full-Stack<br>Systems Engineer</h2>
      <p class="cp-lead">I architect and ship high-scale, cloud-native platforms — from .NET backends and Angular/React frontends to Kubernetes delivery. 8+ years turning legacy monoliths into resilient, observable systems.</p>
      <div class="cp-section-title">What I do</div>
      <div class="cp-tagrow">
        <span>Architecture</span><span>Cloud-Native</span><span>Real-time Systems</span>
        <span>API Design</span><span>Team Leadership</span><span>Performance</span>
      </div>`;
  }

  _skills() {
    const cats = ['frontend', 'backend', 'cloud', 'data'];
    const blocks = cats.map(cat => {
      const items = portfolioData.skills.filter(s => s.cat === cat);
      if (!items.length) return '';
      const bars = items.map(s => `
        <div class="cp-skill">
          <div class="row"><span>${s.name}</span><span class="pct">${Math.round(s.level * 100)}%</span></div>
          <div class="track"><div class="fill" style="width:${Math.round(s.level * 100)}%"></div></div>
        </div>`).join('');
      return `<div class="cp-section-title">${CAT_LABEL[cat]}</div>${bars}`;
    }).join('');
    return `
      <div class="cp-eyebrow">Skills</div>
      <h2>Engineering Toolkit</h2>
      <p class="cp-lead">Depth across the full stack, with a bias toward backend architecture and cloud delivery.</p>
      ${blocks}`;
  }

  _projects() {
    const cards = portfolioData.projects.map(p => `
      <div class="cp-proj">
        <h3>${p.title}</h3>
        <div class="client">${p.client}</div>
        <div class="impact">${p.impact}</div>
        <div class="stack">${p.tech.split('•').map(t => `<span>${t.trim()}</span>`).join('')}</div>
      </div>`).join('');
    return `
      <div class="cp-eyebrow">Selected Work</div>
      <h2>Projects</h2>
      <p class="cp-lead">Enterprise platforms built for scale, speed, and reliability.</p>
      ${cards}`;
  }

  _experience() {
    const items = portfolioData.experience.map(e => `
      <div class="cp-exp">
        <div class="yr">${e.year}</div>
        <h3>${e.role}</h3>
        <div class="co">${e.company}</div>
        <div class="fo">${e.focus}</div>
      </div>`).join('');
    return `
      <div class="cp-eyebrow">Career</div>
      <h2>Experience</h2>
      <p class="cp-lead">A track record of modernizing critical systems and leading delivery.</p>
      ${items}`;
  }

  _lab() {
    const steps = portfolioData.process.map(p => `
      <div class="cp-exp">
        <div class="yr">${p.step}</div>
        <h3>${p.title}</h3>
        <div class="fo">${p.desc}</div>
      </div>`).join('');
    const quotes = portfolioData.testimonials.map(t => `
      <div class="cp-proj">
        <div class="impact" style="font-style:italic;color:#e2e8f0;">"${t.quote}"</div>
        <div class="client">${t.author} — ${t.company}</div>
      </div>`).join('');
    return `
      <div class="cp-eyebrow">Lab</div>
      <h2>How I Work</h2>
      <p class="cp-lead">A repeatable process, and what clients say about it.</p>
      <div class="cp-section-title">Process</div>${steps}
      <div class="cp-section-title">In their words</div>${quotes}`;
  }

  _contact() {
    const c = portfolioData.contact;
    return `
      <div class="cp-eyebrow">Contact</div>
      <h2>Let's Build</h2>
      <p class="cp-lead">Available for senior engineering and architecture work. Reach out directly.</p>
      <div class="cp-contact">
        <a href="mailto:${c.email}"><span class="ic">✉</span> ${c.email}</a>
        <a href="${c.phoneHref}"><span class="ic">☏</span> ${c.phone}</a>
        <a href="${c.linkedin}" target="_blank" rel="noopener"><span class="ic">in</span> LinkedIn</a>
        <a href="${c.resume}" download><span class="ic">↓</span> Download CV</a>
      </div>
      <div class="cp-tagrow">
        <span>Open to remote</span><span>Contract / FTE</span><span>Architecture reviews</span>
      </div>`;
  }

  // Show only the panel for the active section index; hide the rest.
  showSection(index) {
    this.panels.forEach((el, i) => el.classList.toggle('show', i === index));
  }

  hideAll() {
    this.panels.forEach(el => el.classList.remove('show'));
  }
}
