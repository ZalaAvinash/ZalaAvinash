/**
 * AVINASH ZALA — PORTFOLIO ORCHESTRATOR
 * Coordinates all modules: scene setup, sections, interactions, audio, UI.
 */
import * as THREE from 'three';
import { portfolioData, SECTION_PROGRESS, SECTION_NAMES } from './data.js';
import { createScene, loadTextures, disposeObject } from './scene.js';
import { createHeroSection } from './modules/hero.js';
import { createSkillsSection } from './modules/skills.js';
import { createProjectsSection } from './modules/projects.js';
import { createExperienceSection } from './modules/experience.js';
import { createLabSection } from './modules/lab.js';
import { createContactSection } from './modules/contact.js';
import { createEnvironmentSection, updateEnvironment } from './modules/environment.js';
import { createJourneyTrail, updateJourneyTrail } from './modules/journey.js';
import { AudioEngine } from './modules/audio-engine.js';
import { InteractionHandler } from './modules/interaction-handler.js';
import { UIManager } from './modules/ui-manager.js';
import { ReelPlayer } from './modules/reel-player.js';

export class PortfolioExperience {
  constructor() {
    this.canvas = document.getElementById('three-canvas');

    // Simple mobile / low-power detection for quality + responsive tweaks
    this.isMobile = /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent) ||
                    (window.innerWidth < 768) ||
                    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

    const { scene, camera, renderer } = createScene(this.canvas, this.isMobile);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.clock = new THREE.Clock();
    this.progress = 0;
    this.targetProgress = 0;
    this.orbitOffset = { x: 0, y: 0 };
    this.targetOrbit = { x: 0, y: 0 };
    this.paused = false;

    this.textures = [];
    this.profileTexture = null;
    this.groups = { hero: null, skills: null, projects: null, experience: null, lab: null, contact: null, environment: null, journeyTrail: null };
    this.interactiveObjects = [];
    this.particleSystems = [];
    this.labConnections = [];
    this.labParticles = null;
    this.connectionLines = [];
    this.constellationLines = [];
    this.pathParticles = [];
    this.pathCurves = [];
    this.focusedPlane = null;
    this.focusTargetRot = null;
    this.focusDetailsGroup = null;
    this.envData = null;
    this.journeyData = null;
    this.cameraPath = null;
    this.isMobile = this.isMobile; // expose for other modules

    this.audio = new AudioEngine();
    this.ui = new UIManager();
    this.interactions = new InteractionHandler(this);
    this.reelPlayer = new ReelPlayer(this);

    this.init();

    // Hard safety: if anything (texture load, a create*Section, or user change) causes
    // the async init to never reach hideLoading, force the screen away after a few seconds.
    setTimeout(() => {
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        console.warn('[3D Portfolio] Loader still visible after timeout — forcing removal. Check console for errors.');
        if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      }
    }, 4500);
  }

  async init() {
    try {
      const { textures, profileTexture } = await loadTextures();
      this.textures = textures;
      this.profileTexture = profileTexture;
      const bar = document.getElementById('load-bar');
      if (bar) bar.style.width = '100%';

      this.createCameraPath();

      // Shared helpers passed to section builders
      const ctx = {
        portfolioData,
        textures: this.textures,
        profileTexture: this.profileTexture,
        interactiveObjects: this.interactiveObjects,
        isMobile: this.isMobile,
        addParticleSystem: (parent, count, opts, tag) => this.addParticleSystem(parent, count, opts, tag),
        addInteractiveParticleSystem: (parent, count) => this.addInteractiveParticleSystem(parent, count),
        createAnimatedConnections: (parent, positions) => this.createAnimatedConnections(parent, positions),
        addConstellationLines: (parent, n, r) => this.addConstellationLines(parent, n, r),
        addPathParticles: (parent, curve, count) => this.addPathParticles(parent, curve, count)
      };

      this.groups.hero = createHeroSection(ctx);
      this.groups.skills = createSkillsSection(ctx);
      this.groups.projects = createProjectsSection(ctx);
      const expResult = createExperienceSection(ctx);
      this.groups.experience = expResult.group;
      this.pathCurves.push(expResult.curve);
      const labResult = createLabSection(ctx);
      this.groups.lab = labResult.group;
      this.labParticles = labResult.labParticles;
      this.groups.contact = createContactSection(ctx);
      const envResult = createEnvironmentSection(this.isMobile);
      this.groups.environment = envResult.group;
      this.envData = envResult.envData;
      const trailResult = createJourneyTrail(this.cameraPath, this.isMobile);
      this.groups.journeyTrail = trailResult.group;
      this.journeyData = trailResult.journeyData;

      Object.values(this.groups).forEach(g => { if (g) this.scene.add(g); });

      this.ui.setupLabels(this.groups);
      this.ui.setupUI(() => this.closeInfo());
      this.interactions.setupEvents();
      this.ui.createProgressDots((i) => this.flyTo(i));
      this.ui.initCursor();
      this.ui.hideLoading();

      // Button listeners
      const reelBtn = document.getElementById('reel-btn');
      if (reelBtn) reelBtn.addEventListener('click', () => this.playReel());
      const homeBtn = document.getElementById('home-btn');
      if (homeBtn) homeBtn.addEventListener('click', () => this.flyTo(0));
      const captureBtn = document.getElementById('capture-btn');
      if (captureBtn) captureBtn.addEventListener('click', () => this.captureView());
      const copyBtn = document.getElementById('copy-link-btn');
      if (copyBtn) copyBtn.addEventListener('click', () => this.copyViewLink());

      this.applyDeepLink();
      this.animate();

      setTimeout(() => {
        this.audio.init();
        if (this.audio.audioEnabled) this.audio.startAmbientCore();
      }, 650);
      setTimeout(() => { this.targetProgress = 0.02; }, 420);
      console.log('%c[3D Portfolio] Ready.', 'color:#3b82f6');
    } catch (err) {
      console.error('[3D Portfolio] Initialization failed — forcing loader removal. Error:', err);
      // Always remove the loading screen even if a section or setup threw (e.g. due to user edits or missing DOM)
      const bar = document.getElementById('load-bar');
      if (bar) bar.style.width = '100%';
      try {
        this.ui.hideLoading();
      } catch (e) {
        // last resort: hard remove
        const loadingEl = document.getElementById('loading');
        if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      }
      // Try to at least render what we have so far + start the loop (partial scene is better than stuck loader)
      try { this.animate(); } catch (e) {}
      // Show a non-blocking hint in case of serious breakage
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.innerHTML = '<div style="color:#e2e8f0;opacity:0.6;font-size:12px;">Something went wrong building the 3D world.<br>Open DevTools console (F12) for details and reload.</div>';
        setTimeout(() => { if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl); }, 4200);
      }
    }
  }

  createCameraPath() {
    const pts = [
      new THREE.Vector3(0, 4.2, 17), new THREE.Vector3(-2, 7.5, -8),
      new THREE.Vector3(1.5, 5.5, -42), new THREE.Vector3(4, 2.8, -74),
      new THREE.Vector3(-2.5, 8.2, -100), new THREE.Vector3(0, 3.5, -128)
    ];
    this.cameraPath = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.68);
  }

  getCameraTransformAt(p) {
    const pos = this.cameraPath.getPointAt(Math.min(0.999, Math.max(0, p)));
    const look = this.cameraPath.getPointAt(Math.min(0.999, Math.max(0, p + 0.018)));
    return { pos, look };
  }

  flyTo(i) {
    this.targetProgress = SECTION_PROGRESS[Math.min(5, Math.max(0, i))] || 0;
    document.querySelectorAll('.nav a').forEach((a, idx) => a.classList.toggle('active', idx === i));
    setTimeout(() => document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active')), 900);
  }

  showInfo(title, body, action = null) { this.ui.showInfo(title, body, action); }
  closeInfo() { this.ui.closeInfo(); }
  playReel() { this.reelPlayer.play(); }

  focusCameraOn(worldPos, dist = 3.5) {
    const dir = this.camera.position.clone().sub(worldPos).normalize();
    const tgt = worldPos.clone().add(dir.multiplyScalar(dist));
    const start = this.camera.position.clone();
    let t = 0;
    const iv = setInterval(() => {
      t += 0.028;
      if (t >= 1) { clearInterval(iv); return; }
      this.camera.position.lerpVectors(start, tgt, t * t * (3 - 2 * t));
      this.camera.lookAt(worldPos);
    }, 16);
    this.audio.init();
    this.audio.playInspectSound();
  }

  captureView() {
    const link = document.createElement('a');
    link.download = `avinash-zala-3d-${Date.now()}.png`;
    link.href = this.renderer.domElement.toDataURL('image/png');
    link.click();
  }

  copyViewLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('p', this.progress.toFixed(3));
    navigator.clipboard.writeText(url.toString()).then(() => {
      const btn = document.getElementById('copy-link-btn');
      if (btn) { btn.textContent = 'COPIED!'; setTimeout(() => { btn.textContent = 'COPY LINK'; }, 1400); }
    }).catch(() => { prompt('Copy this link:', url.toString()); });
  }

  applyDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    const at = params.get('at');
    if (p) { const val = parseFloat(p); if (!isNaN(val)) { this.progress = Math.max(0, Math.min(1, val)); this.targetProgress = this.progress; } }
    else if (at) { const map = { about: 0, skills: 0.175, projects: 0.36, experience: 0.55, lab: 0.76, contact: 0.95 }; const target = map[at.toLowerCase()]; if (target !== undefined) { this.progress = target; this.targetProgress = target; } }
  }

  spawnProjectDetails(plane) {
    this.clearProjectDetails(); if (!plane) return;
    const group = new THREE.Group(); group.userData._isDetail = true;
    for (let i = 0; i < 5; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22 + Math.random() * 0.12, 10, 10), new THREE.MeshPhongMaterial({ color: i % 2 === 0 ? 0x22c55e : 0x3b82f6, emissive: 0x112233, emissiveIntensity: 0.5, shininess: 30 }));
      orb.userData = { angle: (i / 5) * Math.PI * 2, radius: 4.8 + (i % 3) * 0.4, speed: 0.8 + i * 0.15, height: (i - 2) * 0.7 }; group.add(orb);
    }
    this.focusedPlane.add(group); this.focusDetailsGroup = group;
  }

  clearProjectDetails() {
    if (this.focusDetailsGroup) {
      if (this.focusedPlane) this.focusedPlane.remove(this.focusDetailsGroup);
      this.focusDetailsGroup.children.forEach(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }); this.focusDetailsGroup = null;
    }
  }

  createLabConnection() {
    const lab = this.groups.lab;
    if (!this.labParticles || !lab) return;
    const nucleus = lab.children.find(c => c.userData && c.userData.type === 'nucleus');
    if (!nucleus) return;
    const arr = this.labParticles.pts.geometry.attributes.position.array;
    const pIdx = Math.floor(Math.random() * this.labParticles.count) * 3;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([nucleus.position.clone(), new THREE.Vector3(arr[pIdx], arr[pIdx + 1], arr[pIdx + 2])]), new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.7 }));
    line.userData = { life: 1.0, fadeSpeed: 0.018 + Math.random() * 0.012 }; lab.add(line); this.labConnections.push(line);
    if (this.labConnections.length > 12) { const old = this.labConnections.shift(); lab.remove(old); old.geometry.dispose(); old.material.dispose(); }
  }

  // Particle helpers
  addParticleSystem(parent, count, opts, tag) {
    const pos = new Float32Array(count * 3), vel = [], col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * (opts.spread || 18); pos[i3 + 1] = (Math.random() - 0.5) * (opts.spread || 18) * 0.6; pos[i3 + 2] = (Math.random() - 0.5) * (opts.spread || 18) * 0.7;
      vel.push({ x: (Math.random() - 0.5) * (opts.speed || 0.016), y: (Math.random() - 0.5) * (opts.speed || 0.016), z: (Math.random() - 0.5) * (opts.speed || 0.016) });
      const c = opts.color || 0x3b82f6; col[i3] = ((c >> 16) & 255) / 255; col[i3 + 1] = ((c >> 8) & 255) / 255; col[i3 + 2] = (c & 255) / 255;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: tag === 'data-flow' ? 0.028 : 0.032, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false }));
    parent.add(pts); this.particleSystems.push({ pts, velocities: vel, opts, tag, count, parent });
  }

  addInteractiveParticleSystem(parent, count) {
    const pos = new Float32Array(count * 3), vel = [], sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3; pos[i3] = (Math.random() - 0.5) * 22; pos[i3 + 1] = (Math.random() - 0.5) * 14; pos[i3 + 2] = (Math.random() - 0.5) * 18;
      vel.push({ x: (Math.random() - 0.5) * 0.03, y: (Math.random() - 0.5) * 0.03, z: (Math.random() - 0.5) * 0.03 }); sz[i] = 0.7 + Math.random() * 1.6;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.055, color: 0x3b82f6, transparent: true, opacity: 0.85, depthWrite: false }));
    parent.add(pts); return { pts, velocities: vel, count, geo, parent };
  }

  addConstellationLines(parent, n, r) {
    const lines = [];
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j += 2) {
      const a = (i / n) * Math.PI * 2, b = (j / n) * Math.PI * 2;
      const p1 = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r * 0.6), p2 = new THREE.Vector3(Math.cos(b) * r, 0, Math.sin(b) * r * 0.6);
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.18 }));
      parent.add(ln); lines.push({ line: ln, baseOpacity: 0.18 });
    }
    this.constellationLines = lines;
  }

  createAnimatedConnections(parent, positions) {
    const lines = [];
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...positions[i]), new THREE.Vector3(...positions[j])]), new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.22 }));
      parent.add(ln); lines.push({ line: ln });
    }
    this.connectionLines = lines;
  }

  addPathParticles(parent, curve, count) {
    const pos = new Float32Array(count * 3), data = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random(); const pt = curve.getPointAt(t); const i3 = i * 3;
      pos[i3] = pt.x; pos[i3 + 1] = pt.y; pos[i3 + 2] = pt.z; data.push({ t, speed: 0.0006 + Math.random() * 0.0012 });
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.065, color: 0x22c55e, transparent: true, opacity: 0.7 })); parent.add(pts);
    this.pathParticles.push({ pts, data, curve, count });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.paused) return;
    const delta = this.clock.getDelta(), time = this.clock.elapsedTime;
    this.progress += (this.targetProgress - this.progress) * 0.065;

    // Camera
    const camT = this.getCameraTransformAt(this.progress);
    let pos = camT.pos.clone();
    const look = camT.look.clone();
    const ox = this.orbitOffset.x + (this.targetOrbit.x - this.orbitOffset.x) * 0.08;
    const oy = this.orbitOffset.y + (this.targetOrbit.y - this.orbitOffset.y) * 0.08;
    this.orbitOffset.x = ox; this.orbitOffset.y = oy;
    pos.add(new THREE.Vector3(Math.sin(oy) * 6.5, ox * 5.5, Math.cos(oy) * 6.5));
    this.camera.position.lerp(pos, 0.11);
    this.camera.lookAt(look.x + ox * 0.3, look.y + oy * 0.3, look.z + Math.cos(oy) * 0.3);

    // Idle sway
    const idleMs = Date.now() - this.interactions.lastInteraction;
    if (!this.interactions.isDragging && !this.reelPlayer.reelPlaying && idleMs > 6500 && this.progress < 0.97) {
      const idlePhase = (time * 0.4) % (Math.PI * 2);
      this.targetOrbit.y = Math.sin(idlePhase) * 0.06;
      this.targetOrbit.x = Math.cos(idlePhase * 0.6) * 0.035;
      if (Math.random() < 0.08) this.targetProgress = Math.min(0.97, this.targetProgress + 0.00015);
    }

    // Updates
    this.ui.updateProgressDots(this.progress, SECTION_PROGRESS, SECTION_NAMES);
    this.updateAllAnimations(time, delta);
    this.updateAllParticles(delta);
    if (this.labParticles) this.updateLabParticles();
    this.updateLabConnections();
    this.interactions.updateGraphLines(time);
    this.interactions.updateExplorerLines(time);
    this.interactions.updateHover();
    this.ui.syncLabels(this.camera, this.canvas);
    updateEnvironment(this.envData, this.progress, time);
    updateJourneyTrail(this.journeyData, this.progress, time, delta);

    // Audio
    if (Math.abs(this.progress - (this._lastProgress || 0)) > 0.012) {
      this.audio.init();
      if (Math.random() < 0.32) this.audio.playDataFlow(0.26);
      this._lastProgress = this.progress;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateAllAnimations(time, delta) {
    const hero = this.groups.hero;
    hero.children.forEach((c, i) => {
      if (c.userData?.type === 'core') { const s = 1 + Math.sin(time * 0.7) * 0.012; c.scale.setScalar(s); c.rotation.y = time * 0.035; c.rotation.x = Math.sin(time * 0.2) * 0.04; if (c.material && c.material.uniforms && c.material.uniforms.time) c.material.uniforms.time.value = time; }
      if (c.userData?.type === 'layer') { c.scale.setScalar(1 + Math.sin(time * 1.6 + i) * 0.018); }
      if (c.userData?.type === 'module') { c.rotation.y = time * (0.2 + (i % 3) * 0.05); c.position.y += Math.sin(time * 1.1 + i) * 0.001; }
      if (c.userData?.type === 'stat') { c.scale.setScalar(1 + Math.sin(time * 2.8 + i) * 0.08); c.rotation.y = time * 0.6; }
    });
    // Skills
    this.groups.skills.children.forEach((c, i) => { if (c.userData?.type === 'skill') c.scale.setScalar(1 + Math.sin(time * 2.1 + i * 0.6) * 0.035); if (c.userData?.ringSpeed) c.rotation.z = time * c.userData.ringSpeed; });
    // Projects
    this.groups.projects.children.forEach((c, i) => {
      if (c.userData?.type === 'project') {
        const baseRot = (c.userData.index - 2) * 0.09 + Math.sin(time * 0.2 + i) * 0.025;
        if (this.focusedPlane === c && this.focusTargetRot !== null) { let diff = this.focusTargetRot - c.rotation.y; diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI; c.rotation.y += diff * 0.08; }
        else c.rotation.y = baseRot;
        c.position.y = 1.5 + Math.sin(time * 0.6 + i) * 0.6;
      }
      if (c.userData?.orbit !== undefined) { const o = c.userData; const p = this.groups.projects.children.find(ch => ch.userData && ch.userData.index === o.orbit); if (p) { const ang = time * o.speed; c.position.x = p.position.x + Math.cos(ang) * o.radius; c.position.y = p.position.y + Math.sin(ang * 1.4) * 1.6; c.position.z = p.position.z + Math.sin(ang) * 1.2; c.scale.setScalar(1 + Math.sin(time * 4 + o.orbit) * 0.12); if (c.children && c.children.length > 1) c.children[1].rotation.z = ang * 2; c.rotation.x = ang * 0.8; c.rotation.y = ang * 1.3; } }
      if (c.userData && c.userData.packetIndex !== undefined) {
        const parentFace = c.userData.parentFace; if (!parentFace) return; const nodes = []; this.groups.projects.children.forEach(ch => { if (ch.userData && ch.userData.orbit !== undefined && ch.userData.parent === parentFace) nodes.push(ch); }); if (nodes.length === 0) return; const target = nodes[c.userData.targetNodeIndex % nodes.length]; c.userData.progress = (c.userData.progress + c.userData.speed * 0.016) % 1; c.position.lerpVectors(parentFace.position, target.position, c.userData.progress); c.scale.setScalar(Math.sin(c.userData.progress * Math.PI) * 0.4 + 0.8);
      }
    });
    if (this.focusDetailsGroup) { this.focusDetailsGroup.children.forEach((orb, i) => { if (!orb.userData) return; const d = orb.userData; const ang = time * d.speed + d.angle; if (this.focusedPlane) { orb.position.x = Math.cos(ang) * d.radius; orb.position.z = Math.sin(ang) * d.radius * 0.6; orb.position.y = d.height + Math.sin(ang * 1.3) * 0.4; } orb.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.15); }); }
    // Experience
    this.groups.experience.children.forEach((c, i) => {
      if (c.userData?.type === 'experience') { c.scale.setScalar(1 + Math.sin(time * 1.8 + i) * 0.04); if (c.position.y > 1) c.position.y = (c.userData._baseY || c.position.y) + Math.sin(time * 1.2 + i) * 0.08; }
      if (c.userData?.type === 'testimonial') { c.scale.setScalar(1 + Math.sin(time * 1.3 + i) * 0.03); c.rotation.y = time * 0.15 + i; c.position.y = 4 + i * 0.5 + Math.sin(time * 0.9 + i) * 0.4; }
      if (c.userData?.type === 'process') { c.scale.setScalar(1 + Math.sin(time * 2.1 + i) * 0.025); c.rotation.y = (i - 1.5) * 0.25 + Math.sin(time * 0.4) * 0.08; }
    });
    this.groups.experience.children.forEach((c, i) => {
      if (c.userData?.orbit !== undefined && c.userData.parent && c.userData.parent.userData?.type === 'process') { const o = c.userData; const ang = time * o.speed; c.position.x = o.parent.position.x + Math.cos(ang) * o.r; c.position.z = o.parent.position.z + Math.sin(ang) * o.r * 0.3; c.position.y = o.parent.position.y + 1.1 + Math.sin(ang * 2) * 0.15; c.rotation.y = ang * 2.5; c.rotation.x = Math.sin(ang * 1.5) * 0.3; }
    });
    // Lab
    this.groups.lab.children.forEach(c => { if (c.userData?.type === 'nucleus') { c.rotation.y = time * 0.4; c.scale.setScalar(1 + Math.sin(time * 2.3) * 0.03); } if (c.userData?.orbit !== undefined) { const o = c.userData; const ang = time * o.speed; c.position.x = Math.cos(ang) * o.r; c.position.z = Math.sin(ang) * o.r * 0.7 + 2; c.rotation.y = ang * 1.6; } });
    // Contact
    this.groups.contact.children.forEach((c, i) => { if (c.userData?.type === 'contact') c.rotation.y = (i - 1) * -0.35 + Math.sin(time * 0.8 + i) * 0.03; });

    // Environment pillars
    this.groups.environment.children.forEach((child, i) => { if (child.geometry && child.geometry.type === 'CylinderGeometry') { child.rotation.y = time * 0.002 + i * 0.1; child.position.y = 10 + Math.sin(time * 0.01 + i) * 3; } });

    // Explorer trail flows
    const jd = this.journeyData;
    if (jd && jd.explorerTargets && jd.explorerTargets.length > 0) {
      jd.explorerTargets.forEach((target, i) => {
        target.life -= delta * 0.5;
        if (target.life <= 0) { if (target.highlight) { this.groups.journeyTrail.remove(target.highlight); target.highlight = null; } return; }
        const pos = this.cameraPath.getPointAt(target.t);
        if (!target.highlight) { target.highlight = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 6, 24), new THREE.MeshPhongMaterial({ color: 0x22c55e, emissive: 0x052e16, emissiveIntensity: 0.8, transparent: true })); this.groups.journeyTrail.add(target.highlight); }
        target.highlight.position.copy(pos); target.highlight.position.y += 2.5; target.highlight.rotation.x = Math.PI / 2;
        target.highlight.material.opacity = Math.max(0.1, target.life / 3);
        target.highlight.scale.setScalar(0.7 + Math.sin(time * 5 + i) * 0.25);
      });
      jd.explorerTargets = jd.explorerTargets.filter(t => t.life > 0);
      if (this.interactions) this.interactions.explorerTargets = jd.explorerTargets;
    }
    if (jd && jd.explorerTargets && jd.explorerTargets.length > 0) {
      jd.explorerTargets.forEach((target) => {
        if (Math.random() < 0.15) {
          const flowOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshPhongMaterial({ color: 0x3b82f6, emissive: 0x0a1628, transparent: true, opacity: 0.7 }));
          flowOrb.userData = { t: target.t, speed: 0.012 + Math.random() * 0.006, life: 2.0 }; this.groups.journeyTrail.add(flowOrb); jd.explorerTrailFlows.push(flowOrb);
        }
      });
    }
    if (jd && jd.explorerTrailFlows && jd.explorerTrailFlows.length > 0) {
      jd.explorerTrailFlows.forEach((orb, ii) => {
        if (!orb.userData) return; orb.userData.t += orb.userData.speed; if (orb.userData.t > 0.99) orb.userData.t = 0.99;
        orb.userData.life -= delta * 0.6; const pt = this.cameraPath.getPointAt(orb.userData.t);
        orb.position.copy(pt); orb.position.y += 1.4 + Math.sin(time * 7 + ii) * 0.15;
        orb.material.opacity = Math.max(0.05, orb.userData.life / 2);
        if (orb.userData.life <= 0) this.groups.journeyTrail.remove(orb);
      });
      jd.explorerTrailFlows = jd.explorerTrailFlows.filter(o => o.userData && o.userData.life > 0);
      if (this.interactions) this.interactions.explorerTrailFlows = jd.explorerTrailFlows;
    }

    // Connection/constellation animation
    if (this.connectionLines) this.connectionLines.forEach((ln, i) => { if (ln.line && ln.line.material) ln.line.material.opacity = 0.15 + Math.sin(time * 2.4 + i) * 0.13; });
    if (this.constellationLines) this.constellationLines.forEach((ln, i) => { if (ln.line && ln.line.material) ln.line.material.opacity = ln.baseOpacity + Math.sin(time * 1.7 + i) * 0.11; });
  }

  updateAllParticles(delta) {
    this.particleSystems.forEach(sys => {
      const pos = sys.pts.geometry.attributes.position; const arr = pos.array;
      for (let i = 0; i < sys.count; i++) {
        const i3 = i * 3; arr[i3] += sys.velocities[i].x; arr[i3 + 1] += sys.velocities[i].y; arr[i3 + 2] += sys.velocities[i].z;
        const s = sys.opts.spread || 18; if (Math.abs(arr[i3]) > s) sys.velocities[i].x *= -1; if (Math.abs(arr[i3 + 1]) > s * 0.7) sys.velocities[i].y *= -1; if (Math.abs(arr[i3 + 2]) > s * 0.8) sys.velocities[i].z *= -1;
        if (sys.tag === 'data-flow') { sys.velocities[i].x += (0 - arr[i3]) * 0.000012; sys.velocities[i].y += (0 - arr[i3 + 1]) * 0.000012; }
      } pos.needsUpdate = true;
    });
    this.pathParticles.forEach(pp => {
      const pos = pp.pts.geometry.attributes.position; const arr = pos.array;
      pp.data.forEach((d, i) => { d.t += d.speed; if (d.t > 1) d.t = 0; const pt = pp.curve.getPointAt(d.t); const i3 = i * 3; arr[i3] = pt.x; arr[i3 + 1] = pt.y; arr[i3 + 2] = pt.z; }); pos.needsUpdate = true;
    });
  }

  updateLabParticles() {
    if (!this.labParticles) return;
    const pos = this.labParticles.pts.geometry.attributes.position; const arr = pos.array; const mx = this.interactions.ndcMouse.x * 11, my = this.interactions.ndcMouse.y * 7;
    for (let i = 0; i < this.labParticles.count; i++) {
      const i3 = i * 3; const vx = this.labParticles.velocities[i]; const dx = mx - arr[i3], dy = my - arr[i3 + 1], dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      if (dist < 7) { vx.x += dx / dist * 0.0028; vx.y += dy / dist * 0.0028; }
      arr[i3] += vx.x; arr[i3 + 1] += vx.y; arr[i3 + 2] += vx.z;
      if (Math.abs(arr[i3]) > 13) { arr[i3] = -arr[i3] * 0.6; vx.x *= -0.6; } if (Math.abs(arr[i3 + 1]) > 9) { arr[i3 + 1] = -arr[i3 + 1] * 0.6; vx.y *= -0.6; }
    } pos.needsUpdate = true;
  }

  updateLabConnections() {
    if (!this.labConnections || this.labConnections.length === 0) return;
    const lab = this.groups.lab;
    for (let i = this.labConnections.length - 1; i >= 0; i--) {
      const line = this.labConnections[i]; if (!line.userData) continue;
      line.userData.life -= line.userData.fadeSpeed || 0.02; if (line.material) line.material.opacity = Math.max(0.1, line.userData.life * 0.7);
      if (line.userData.life <= 0.05) { lab.remove(line); line.geometry.dispose(); if (line.material) line.material.dispose(); this.labConnections.splice(i, 1); }
    }
  }

  dispose() {
    if (this.audio) this.audio.stop();
    const allGroups = {};
    Object.assign(allGroups, this.groups);
    Object.values(allGroups).forEach(g => { if (g) { disposeObject(g); this.scene.remove(g); } });
    this.interactiveObjects = []; this.particleSystems = []; this.labConnections = [];
    this.ui.clearLabels();
    this.ui.removeCursor();
    if (this.renderer) this.renderer.dispose();
    console.log('[3D Portfolio] Disposed.');
  }
}

export function initPortfolio() {
  const exp = new PortfolioExperience();
  window.flyTo = (i) => exp.flyTo(i);
  window.playReel = () => exp.playReel();
  window.closeInfo = () => exp.closeInfo();
  window.captureView = () => exp.captureView();
  window.copyViewLink = () => exp.copyViewLink();
  window.disposePortfolio = () => exp.dispose();
  return exp;
}