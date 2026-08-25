/**
 * UI MANAGER — HTML labels, info panel, progress dots, cursor, loading screen.
 */
import * as THREE from 'three';

export class UIManager {
  constructor() {
    this.labelsContainer = document.getElementById('labels');
    this.labelData = [];
    this._lastShownSection = -1;   // forces the first showSection on init
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

  updateProgressDots(progress, sectionProgress, sectionNames, focusMode = false) {
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
    // Drive the 2D content panel for the active section — but NOT while inspecting
    // a 3D object (focusMode), where the panel is intentionally hidden so the
    // inspected object has the stage to itself. Only re-toggle when the active
    // section actually changes to avoid per-frame class thrash (60fps).
    if (this.contentPanels && !focusMode && current !== this._lastShownSection) {
      this.contentPanels.showSection(current);
      this._lastShownSection = current;
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
    // Map each group to its section index (matches SECTION_PROGRESS order).
    const SECTION_OF = { hero: 0, skills: 1, projects: 2, experience: 3, lab: 4, contact: 5 };
    const addLabel = (obj, text, offsetY = 1.8, groupKey = null) => {
      if (!obj) return;
      const el = document.createElement('div');
      el.className = 'label-3d';
      el.textContent = text;
      this.labelsContainer.appendChild(el);
      const section = groupKey != null ? (SECTION_OF[groupKey] ?? -1) : -1;
      this.labelData.push({ obj, el, offsetY, section });
    };

    const hero = groups.hero;
    hero.children.forEach(c => {
      if (c.userData?.type === 'core') addLabel(c, 'CORE', 3.2, 'hero');
      if (c.userData?.type === 'layer') addLabel(c, c.userData.title.replace(' LAYER', ''), 1.6, 'hero');
      if (c.userData?.type === 'profile') addLabel(c, 'AVINASH', 4.2, 'hero');
      if (c.userData?.type === 'stat') addLabel(c, c.userData.title, 1.1, 'hero');
    });
    let skillCount = 0;
    groups.skills.children.forEach(c => { if (c.userData?.type === 'skill' && skillCount < 5) { addLabel(c, c.userData.title, 1.4, 'skills'); skillCount++; } });
    groups.projects.children.forEach(c => { if (c.userData?.type === 'project') addLabel(c, c.userData.title, 3.4, 'projects'); });
    groups.experience.children.forEach(c => {
      if (c.userData?.type === 'experience') addLabel(c, c.userData.title.split(' @ ')[0], 1.6, 'experience');
      if (c.userData?.type === 'testimonial') addLabel(c, c.userData.title, 2.0, 'experience');
      if (c.userData?.type === 'process') addLabel(c, c.userData.title, 1.8, 'experience');
    });
    const lab = groups.lab;
    lab.children.forEach(c => { if (c.userData?.type === 'nucleus') addLabel(c, 'LIVE SYSTEMS', 2.6, 'lab'); });
    groups.contact.children.forEach(c => { if (c.userData?.type === 'contact' || c.userData?.type === 'nexus') addLabel(c, c.userData.title, 2.2, 'contact'); });
  }

  // Returns the index of the section nearest to `progress` (matches animate()'s active section).
  _activeSection(progress) {
    const SP = [0, 0.175, 0.36, 0.55, 0.76, 0.95];
    let current = 0;
    for (let i = 0; i < SP.length; i++) { if (progress >= SP[i]) current = i; }
    return current;
  }

  syncLabels(camera, canvas, progress = 0, showLabels = false) {
    if (!this.labelsContainer || !this.labelData.length) return;
    // Option A: the 3D scene is atmosphere; the content panel is the source of content.
    // Floating labels are shown ONLY while inspecting a specific object (TAP TO INSPECT),
    // never while a section panel is on screen — that keeps the layout clean and editorial.
    if (!showLabels) {
      for (const item of this.labelData) item.el.classList.add('hidden');
      return;
    }
    const rect = canvas.getBoundingClientRect();

    // Build candidate list (project each label; keep on-screen ones in the active section).
    const placed = [];
    const candidates = [];
    const v = new (camera.position.constructor)();
    for (const item of this.labelData) {
      const obj = item.obj;
      obj.getWorldPosition(v);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      if (v.z > 1) { item.el.classList.add('hidden'); continue; } // behind camera
      const x = rect.left + (v.x * 0.5 + 0.5) * rect.width;
      const y = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
      if (x < -120 || x > rect.width + 120 || y < -80 || y > rect.height + 80) {
        item.el.classList.add('hidden'); continue;
      }
      candidates.push({ x, y, depth: Math.min(1, dist / 120), item });
    }

    // Second pass: collision avoidance via vertical distribution. Labels are sorted
    // nearest-first; a label that would overlap an already-placed one is placed in the
    // nearest free slot either ABOVE or BELOW the current cluster, staying on screen.
    // If no clear slot exists (the 3D anchors are too co-located to separate), the
    // farther-from-camera label is hidden so the pile never becomes illegible.
    const MIN_GAP_X = 90;   // label width + margin
    const MIN_GAP_Y = 20;   // label height + margin
    const onScreen = (yy) => yy > 8 && yy < rect.height - 8;
    const clashes = (xx, yy) => placed.some(p => Math.abs(p.x - xx) < MIN_GAP_X && Math.abs(p.y - yy) < MIN_GAP_Y);
    candidates.sort((a, b) => a.depth - b.depth);
    for (const cand of candidates) {
      const { x } = cand;
      let y = cand.y;
      let up = y, down = y, step = 0, placedY = null;
      while (step <= 36) {
        if (onScreen(up) && !clashes(x, up)) { placedY = up; break; }
        if (onScreen(down) && !clashes(x, down)) { placedY = down; break; }
        step++; up -= MIN_GAP_Y; down += MIN_GAP_Y;
      }
      if (placedY == null) { cand.item.el.classList.add('hidden'); continue; }
      const { el } = cand.item;
      el.style.left = x + 'px';
      el.style.top = placedY + 'px';
      el.style.opacity = (0.55 + (1 - cand.depth) * 0.45).toFixed(2);
      el.classList.remove('hidden');
      placed.push({ x, y: placedY });
    }
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