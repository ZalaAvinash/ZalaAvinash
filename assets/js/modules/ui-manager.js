/**
 * UI MANAGER — HTML labels, info panel, progress dots, cursor, loading screen.
 */
import * as THREE from 'three';

export class UIManager {
  constructor() {
    this.labelsContainer = document.getElementById('labels');
    this.labelData = [];
  }

  setupUI(closeInfoCallback) {
    const info = document.getElementById('info');
    const closeBtn = document.getElementById('info-close');
    if (closeBtn) closeBtn.addEventListener('click', closeInfoCallback);
    info.addEventListener('click', (e) => { if (e.target === info) closeInfoCallback(); });
  }

  createProgressDots(flyToCallback) {
    const c = document.getElementById('progress-dots');
    if (!c) return;
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.addEventListener('click', () => flyToCallback(i));
      c.appendChild(d);
    }
  }

  updateProgressDots(progress, sectionProgress, sectionNames) {
    const dots = document.getElementById('progress-dots');
    if (!dots) return;
    const ch = dots.children;
    let current = 0;
    for (let i = 0; i < sectionProgress.length; i++) {
      if (progress >= sectionProgress[i]) current = i;
    }
    const stationEl = document.getElementById('current-station');
    if (stationEl) stationEl.textContent = sectionNames[current] || '';
    document.querySelectorAll('.nav a[data-i]').forEach((a, i) => a.classList.toggle('active', i === current));
    for (let i = 0; i < ch.length; i++) {
      const d = ch[i];
      const act = Math.abs(progress - sectionProgress[i]) < 0.075;
      d.style.background = act ? '#3b82f6' : '#334155';
      d.style.width = act ? '18px' : '3px';
      d.style.borderRadius = act ? '3px' : '50%';
    }
  }

  showInfo(title, body, action = null) {
    const p = document.getElementById('info'), t = document.getElementById('info-title'), b = document.getElementById('info-body');
    t.innerHTML = title;
    b.innerHTML = body;
    if (action === 'download') b.innerHTML += '<br><br><a href="Resume/Resume.docx" download style="color:#3b82f6">DOWNLOAD RESUME \u2192</a>';
    else if (action && action.startsWith('mailto')) b.innerHTML += '<br><br><a href="' + action + '" style="color:#3b82f6">OPEN MAIL \u2192</a>';
    else if (action && action.startsWith('tel')) b.innerHTML += '<br><br><a href="' + action + '" style="color:#3b82f6">CALL NOW \u2192</a>';
    p.classList.add('active');
  }

  closeInfo() {
    document.getElementById('info').classList.remove('active');
  }

  setupLabels(groups) {
    if (!this.labelsContainer) return;
    this.labelsContainer.innerHTML = '';
    this.labelData = [];
    const addLabel = (obj, text, offsetY = 1.8) => {
      if (!obj) return;
      const el = document.createElement('div');
      el.className = 'label-3d';
      el.textContent = text;
      this.labelsContainer.appendChild(el);
      this.labelData.push({ obj, el, offsetY });
    };

    const hero = groups.hero;
    hero.children.forEach(c => {
      if (c.userData?.type === 'core') addLabel(c, 'CORE', 3.2);
      if (c.userData?.type === 'layer') addLabel(c, c.userData.title.replace(' LAYER', ''), 1.6);
      if (c.userData?.type === 'profile') addLabel(c, 'AVINASH', 4.2);
      if (c.userData?.type === 'stat') addLabel(c, c.userData.title, 1.1);
    });
    let skillCount = 0;
    groups.skills.children.forEach(c => { if (c.userData?.type === 'skill' && skillCount < 5) { addLabel(c, c.userData.title, 1.4); skillCount++; } });
    groups.projects.children.forEach(c => { if (c.userData?.type === 'project') addLabel(c, c.userData.title, 3.4); });
    groups.experience.children.forEach(c => {
      if (c.userData?.type === 'experience') addLabel(c, c.userData.title.split(' @ ')[0], 1.6);
      if (c.userData?.type === 'testimonial') addLabel(c, c.userData.title, 2.0);
      if (c.userData?.type === 'process') addLabel(c, c.userData.title, 1.8);
    });
    const lab = groups.lab;
    lab.children.forEach(c => { if (c.userData?.type === 'nucleus') addLabel(c, 'LIVE SYSTEMS', 2.6); });
    groups.contact.children.forEach(c => { if (c.userData?.type === 'contact' || c.userData?.type === 'nexus') addLabel(c, c.userData.title, 2.2); });
  }

  syncLabels(camera, canvas) {
    if (!this.labelsContainer || !this.labelData.length) return;
    const rect = canvas.getBoundingClientRect();
    this.labelData.forEach(item => {
      const { obj, el, offsetY } = item;
      if (!obj || !obj.parent) { el.classList.add('hidden'); return; }
      const worldPos = obj.getWorldPosition(new THREE.Vector3());
      worldPos.y += offsetY || 1.6;
      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;
      const visible = projected.z < 1.0 && x > -50 && x < rect.width + 50 && y > -30 && y < rect.height + 30;
      if (visible) {
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.style.opacity = (0.55 + (1 - projected.z) * 0.45).toFixed(2);
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });
  }

  hideLoading() {
    const el = document.getElementById('loading');
    if (el) { el.style.transition = 'opacity 420ms'; el.style.opacity = '0'; setTimeout(() => el.remove(), 480); }
  }

  initCursor() {
    const cur = document.createElement('div');
    cur.className = 'cursor';
    document.body.appendChild(cur);
    document.addEventListener('mousemove', e => { cur.style.left = (e.clientX - 9) + 'px'; cur.style.top = (e.clientY - 9) + 'px'; });
    const act = () => cur.classList.add('active'), norm = () => cur.classList.remove('active');
    document.querySelector('canvas').addEventListener('mouseenter', act);
    document.querySelector('canvas').addEventListener('mouseleave', norm);
    document.querySelectorAll('a,button').forEach(el => { el.addEventListener('mouseenter', act); el.addEventListener('mouseleave', norm); });
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) cur.style.display = 'none';
  }

  removeCursor() {
    const cursor = document.querySelector('.cursor');
    if (cursor) cursor.remove();
  }

  clearLabels() {
    if (this.labelsContainer) this.labelsContainer.innerHTML = '';
    this.labelData = [];
  }
}