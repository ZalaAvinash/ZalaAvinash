/**
 * INTERACTION HANDLER — Raycasting, hover, click, drag, keyboard, touch.
 */
import * as THREE from 'three';
import { portfolioData } from '../data.js';

export class InteractionHandler {
  constructor(experience) {
    this.exp = experience;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.ndcMouse = new THREE.Vector2();
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.hoveredObject = null;
    this.graphLines = [];
    this.explorerLines = [];
    this.explorerTargets = [];
    this.explorerTrailFlows = [];
    this.lastInteraction = Date.now();
  }

  setupEvents() {
    const c = this.exp.canvas;
    window.addEventListener('wheel', e => {
      const reel = this.exp.reelPlayer && this.exp.reelPlayer.reelPlaying;
      if (reel) return;
      this.exp.targetProgress = Math.max(0, Math.min(1, this.exp.targetProgress + e.deltaY * 0.00048));
      this.lastInteraction = Date.now();
      e.preventDefault();
    }, { passive: false });

    c.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.lastInteraction = Date.now();
      this.resetHover();
    });

    window.addEventListener('mouseup', () => { this.isDragging = false; });

    window.addEventListener('mousemove', e => {
      this.ndcMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (this.isDragging) {
        const dx = (e.clientX - this.dragStart.x) * 0.0038;
        const dy = (e.clientY - this.dragStart.y) * 0.0032;
        this.exp.targetOrbit.x = Math.max(-0.7, Math.min(0.7, this.exp.targetOrbit.x + dy));
        this.exp.targetOrbit.y += dx;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
      }
      this.lastInteraction = Date.now();
    });

    c.addEventListener('click', e => {
      const reel = this.exp.reelPlayer && this.exp.reelPlayer.reelPlaying;
      if (!reel) {
        this.raycastAndInspect(e);
        this.lastInteraction = Date.now();
      }
    });

    // Touch
    c.addEventListener('touchstart', e => {
      this.isDragging = true;
      this.dragStart.x = e.touches[0].clientX;
      this.dragStart.y = e.touches[0].clientY;
      this._touchStartX = e.touches[0].clientX;
      this._touchStartY = e.touches[0].clientY;
      this.lastInteraction = Date.now();
      this.resetHover();
    }, { passive: true });

    c.addEventListener('touchend', (e) => {
      this.isDragging = false;
      if (this._touchStartX !== undefined) {
        const dx = Math.abs(e.changedTouches[0].clientX - this._touchStartX);
        const dy = Math.abs(e.changedTouches[0].clientY - this._touchStartY);
        const reel = this.exp.reelPlayer && this.exp.reelPlayer.reelPlaying;
        if (dx < 12 && dy < 12 && !reel) {
          this.raycastAndInspect({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
        }
      }
      delete this._touchStartX;
      delete this._touchStartY;
    });

    c.addEventListener('touchmove', e => {
      if (!this.isDragging || !e.touches[0]) return;
      const touch = e.touches[0];
      this.exp.targetOrbit.y += (touch.clientX - this.dragStart.x) * 0.0035;
      this.exp.targetProgress = Math.max(0, Math.min(1, this.exp.targetProgress - (touch.clientY - this.dragStart.y) * 0.0022));
      this.dragStart.x = touch.clientX;
      this.dragStart.y = touch.clientY;
      this.lastInteraction = Date.now();
      e.preventDefault();
    }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'd') this.exp.targetProgress = Math.min(1, this.exp.targetProgress + 0.035);
      if (e.key === 'ArrowLeft' || e.key === 'a') this.exp.targetProgress = Math.max(0, this.exp.targetProgress - 0.035);
      if (e.key.toLowerCase() === 'r') this.exp.playReel();
      if (e.key === 'Escape') this.exp.closeInfo();
    });

    window.addEventListener('resize', () => {
      this.exp.camera.aspect = window.innerWidth / window.innerHeight;
      this.exp.camera.updateProjectionMatrix();
      this.exp.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('visibilitychange', () => {
      this.exp.paused = document.hidden;
      if (!this.exp.paused) this.exp.animate();
    });

    // Nav clicks
    document.querySelectorAll('.nav a[data-i]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const i = parseInt(a.getAttribute('data-i'), 10);
        this.exp.flyTo(i);
      });
    });
  }

  raycastAndInspect(e) {
    const rect = this.exp.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.exp.camera);
    const hits = this.raycaster.intersectObjects(this.exp.interactiveObjects, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData?.type && o.parent) o = o.parent;
      if (!o || !o.userData) return;
      const ud = o.userData;
      this.exp.showInfo(ud.title, ud.body, ud.action);
      if (['project', 'experience', 'skill', 'contact', 'core', 'layer', 'profile', 'nucleus', 'stat', 'testimonial', 'process'].includes(ud.type)) {
        const wp = new THREE.Vector3();
        o.getWorldPosition(wp);
        this.exp.focusCameraOn(wp, 2.8);
      }
      if (ud.type === 'project' && o.userData && typeof o.userData.index === 'number') {
        const planes = this.exp.groups.projects.children.filter(c => c.userData && c.userData.type === 'project' && c.userData.index === ud.index);
        if (planes.length) {
          this.exp.focusedPlane = planes[0];
          const camDir = this.exp.camera.position.clone().sub(this.exp.focusedPlane.position).normalize();
          this.exp.focusTargetRot = Math.atan2(camDir.x, camDir.z);
          this.exp.spawnProjectDetails(this.exp.focusedPlane);
        }
      } else {
        this.exp.focusedPlane = null;
        this.exp.focusTargetRot = null;
        this.exp.clearProjectDetails();
      }
      if (ud.type === 'nucleus' || (ud.type && this.exp.groups.lab.children.includes(o))) {
        this.exp.createLabConnection();
      }
      if (ud.type === 'layer') {
        this.activateArchitectureExplorer(ud.title, o);
      }
    } else {
      this.exp.closeInfo();
    }
  }

  updateHover() {
    const reel = this.exp.reelPlayer && this.exp.reelPlayer.reelPlaying;
    if (this.isDragging || reel) {
      if (this.hoveredObject) this.resetHover();
      return;
    }
    this.raycaster.setFromCamera(this.ndcMouse, this.exp.camera);
    const intersects = this.raycaster.intersectObjects(this.exp.interactiveObjects, true);
    let newHover = null;
    if (intersects.length > 0) {
      let o = intersects[0].object;
      while (o && !o.userData?.type && o.parent) o = o.parent;
      if (o && o.userData && o.userData.type) newHover = o;
    }
    if (newHover !== this.hoveredObject) {
      this.resetHover();
      this.clearGraphLines();
      this.clearExplorer();
      this.hoveredObject = newHover;
      if (this.hoveredObject) {
        const mat = this.hoveredObject.material;
        if (mat) {
          if (mat.emissiveIntensity !== undefined) {
            this.hoveredObject.userData._origEmissive = mat.emissiveIntensity;
            mat.emissiveIntensity = Math.min(1.2, (mat.emissiveIntensity || 0.3) + 0.8);
          }
          if (this.hoveredObject.scale) {
            this.hoveredObject.userData._origScale = this.hoveredObject.scale.x;
            this.hoveredObject.scale.setScalar(this.hoveredObject.userData._origScale * 1.15);
          }
        }
        if (this.hoveredObject.userData && this.hoveredObject.userData.type === 'skill') {
          this.updateSkillGraph(this.hoveredObject);
          this.exp.audio.init();
          this.exp.audio.playGraphConnection();
        }
        if (this.hoveredObject.userData && this.hoveredObject.userData.type === 'project') {
          this.updateProjectGraph(this.hoveredObject);
          this.exp.audio.init();
          this.exp.audio.playGraphConnection();
        }
        const cur = document.querySelector('.cursor');
        if (cur) cur.classList.add('active');
      }
    }
  }

  resetHover() {
    if (!this.hoveredObject) return;
    const mat = this.hoveredObject.material;
    if (mat && this.hoveredObject.userData._origEmissive !== undefined) mat.emissiveIntensity = this.hoveredObject.userData._origEmissive;
    if (this.hoveredObject.scale && this.hoveredObject.userData._origScale !== undefined) this.hoveredObject.scale.setScalar(this.hoveredObject.userData._origScale);
    delete this.hoveredObject.userData._origEmissive;
    delete this.hoveredObject.userData._origScale;
    const cur = document.querySelector('.cursor');
    if (cur) cur.classList.remove('active');
    this.hoveredObject = null;
  }

  updateSkillGraph(skillObj) {
    this.clearGraphLines();
    if (!skillObj || !skillObj.userData) return;
    const skillName = skillObj.userData.title.toLowerCase();
    const keywords = skillName.split(/[\s/]+/).filter(k => k.length > 2);
    const matchingProjects = this.exp.groups.projects.children.filter(p => {
      if (!p.userData || p.userData.type !== 'project') return false;
      return keywords.some(kw => (p.userData.title + ' ' + p.userData.body + ' ' + (p.userData.tech || '')).toLowerCase().includes(kw));
    });
    if (matchingProjects.length === 0) return;
    const skillWorldPos = skillObj.getWorldPosition(new THREE.Vector3());
    matchingProjects.forEach((proj, i) => {
      const projWorld = proj.getWorldPosition(new THREE.Vector3());
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([skillWorldPos.clone(), projWorld]), new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 + (i % 3) * 0.08 }));
      line.userData = { pulse: Math.random() * Math.PI * 2, projRef: proj };
      this.exp.scene.add(line);
      this.graphLines.push(line);
      if (proj.material && proj.material.emissiveIntensity !== undefined) {
        proj.userData._graphBoost = proj.material.emissiveIntensity;
        proj.material.emissiveIntensity = Math.max(proj.material.emissiveIntensity, 0.9);
      }
    });
  }

  updateProjectGraph(projectObj) {
    this.clearGraphLines();
    if (!projectObj || !projectObj.userData) return;
    const tech = (projectObj.userData.tech || '') + ' ' + (projectObj.userData.body || '');
    const keywords = tech.toLowerCase().split(/[\s•,\/]+/).filter(k => k.length > 2);
    const matchingSkills = this.exp.groups.skills.children.filter(s => {
      if (!s.userData || s.userData.type !== 'skill') return false;
      const st = s.userData.title.toLowerCase();
      return keywords.some(kw => st.includes(kw) || kw.includes(st.split(' ')[0]));
    });
    if (matchingSkills.length === 0) return;
    const projWorldPos = projectObj.getWorldPosition(new THREE.Vector3());
    matchingSkills.forEach((skill, i) => {
      const skillWorld = skill.getWorldPosition(new THREE.Vector3());
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([projWorldPos.clone(), skillWorld]), new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.4 + (i % 3) * 0.1 }));
      line.userData = { pulse: Math.random() * Math.PI * 2, skillRef: skill };
      this.exp.scene.add(line); this.graphLines.push(line);
      if (skill.material && skill.material.emissiveIntensity !== undefined) { skill.userData._graphBoost = skill.material.emissiveIntensity; skill.material.emissiveIntensity = Math.max(skill.material.emissiveIntensity, 0.9); }
      if (skill.scale) { skill.userData._graphScale = skill.scale.x; skill.scale.setScalar(skill.scale.x * 1.1); }
    });
  }

  clearGraphLines() {
    this.graphLines.forEach(line => {
      this.exp.scene.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
      if (line.userData && line.userData.projRef) { const proj = line.userData.projRef; if (proj.material && proj.userData && proj.userData._graphBoost !== undefined) { proj.material.emissiveIntensity = proj.userData._graphBoost; delete proj.userData._graphBoost; } }
      if (line.userData && line.userData.skillRef) { const skill = line.userData.skillRef; if (skill.material && skill.userData && skill.userData._graphBoost !== undefined) { skill.material.emissiveIntensity = skill.userData._graphBoost; delete skill.userData._graphBoost; } if (skill.scale && skill.userData && skill.userData._graphScale !== undefined) { skill.scale.setScalar(skill.userData._graphScale); delete skill.userData._graphScale; } }
    });
    this.graphLines = [];
  }

  clearExplorer() {
    this.explorerLines.forEach(line => {
      this.exp.scene.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
      if (line.userData && line.userData.matchRef) { const match = line.userData.matchRef; if (match.material && match.userData && match.userData._explorerBoost !== undefined) { match.material.emissiveIntensity = match.userData._explorerBoost; delete match.userData._explorerBoost; } if (match.scale && match.userData && match.userData._explorerScale !== undefined) { match.scale.setScalar(match.userData._explorerScale); delete match.userData._explorerScale; } }
    });
    this.explorerLines = [];
    if (this.explorerTargets) { this.explorerTargets.forEach(t => { if (t.highlight) this.exp.groups.journeyTrail.remove(t.highlight); }); this.explorerTargets = []; }
    if (this.explorerTrailFlows) { this.explorerTrailFlows.forEach(o => this.exp.groups.journeyTrail.remove(o)); this.explorerTrailFlows = []; }
    if (this.exp.journeyData) {
      this.exp.journeyData.explorerTargets = [];
      this.exp.journeyData.explorerTrailFlows = [];
    }
  }

  activateArchitectureExplorer(layerTitle, layerObj) {
    this.clearExplorer();
    this.clearGraphLines();
    const title = layerTitle.toLowerCase();
    let keywords = [];
    if (title.includes('angular') || title.includes('ui')) keywords = ['angular', 'ui', 'frontend', 'typescript', 'react'];
    else if (title.includes('.net') || title.includes('api')) keywords = ['.net', 'c#', 'api', 'backend', 'signalr'];
    else if (title.includes('services') || title.includes('domain')) keywords = ['services', 'domain', 'architecture', 'clean'];
    else if (title.includes('data') || title.includes('persistence')) keywords = ['sql', 'data', 'mssql', 'modeling'];
    else if (title.includes('azure') || title.includes('cloud')) keywords = ['azure', 'cloud', 'docker', 'k8s', 'kubernetes'];
    if (keywords.length === 0) return;
    const layerWorld = layerObj.getWorldPosition(new THREE.Vector3());
    const matchingProjects = this.exp.groups.projects.children.filter(p => {
      if (!p.userData || p.userData.type !== 'project') return false;
      return keywords.some(kw => (p.userData.title + ' ' + p.userData.body + ' ' + (p.userData.tech || '')).toLowerCase().includes(kw));
    });
    const matchingSkills = this.exp.groups.skills.children.filter(s => {
      if (!s.userData || s.userData.type !== 'skill') return false;
      return keywords.some(kw => s.userData.title.toLowerCase().includes(kw));
    });
    const allMatches = [...matchingProjects, ...matchingSkills];
    if (allMatches.length === 0) { this.exp.showInfo(layerTitle, 'This foundational layer underpins many of the systems I build.'); return; }
    this.exp.audio.init();
    this.exp.audio.playDataFlow(0.45);
    allMatches.forEach((match, i) => {
      const matchWorld = match.getWorldPosition(new THREE.Vector3());
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([layerWorld.clone(), matchWorld]), new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.25 + (i % 4) * 0.08 }));
      line.userData = { pulse: i * 1.2, matchRef: match };
      this.exp.scene.add(line); this.explorerLines.push(line);
      if (match.material && match.material.emissiveIntensity !== undefined) { match.userData._explorerBoost = match.material.emissiveIntensity; match.material.emissiveIntensity = Math.max(match.material.emissiveIntensity, 1.0); }
      if (match.scale) { match.userData._explorerScale = match.scale.x; match.scale.setScalar(match.scale.x * 1.08); }
    });
    this.exp.showInfo(layerTitle, `This layer powers ${matchingProjects.length} projects and connects to ${matchingSkills.length} core skills in my practice.`);
    this.explorerTargets = [];
    allMatches.forEach(match => {
      const wp = match.getWorldPosition(new THREE.Vector3());
      const t = this.getClosestProgressOnTrail(wp);
      this.explorerTargets.push({ t, life: 3.0, pulse: Math.random() * Math.PI * 2 });
    });
    // Sync to journeyData so the orchestrator's updateAllAnimations can spawn trail highlights + flows
    if (this.exp.journeyData) {
      this.exp.journeyData.explorerTargets = this.explorerTargets;
      if (!this.exp.journeyData.explorerTrailFlows) this.exp.journeyData.explorerTrailFlows = [];
      this.explorerTrailFlows = this.exp.journeyData.explorerTrailFlows;
    }
  }

  getClosestProgressOnTrail(worldPos) {
    const trail = this.exp.journeyData;
    if (!trail || !trail.curve) return 0;
    let bestT = 0, bestD = Infinity;
    for (let i = 0; i <= 80; i++) { const tt = i / 80; const d = trail.curve.getPointAt(tt).distanceTo(worldPos); if (d < bestD) { bestD = d; bestT = tt; } }
    return bestT;
  }

  updateGraphLines(time) {
    if (!this.graphLines || this.graphLines.length === 0) return;
    this.graphLines.forEach((line) => {
      if (!line.material || !line.userData) return;
      line.material.opacity = 0.25 + Math.sin(time * 3.5 + line.userData.pulse) * 0.18;
    });
  }

  updateExplorerLines(time) {
    if (!this.explorerLines || this.explorerLines.length === 0) return;
    this.explorerLines.forEach((line) => {
      if (!line.material || !line.userData) return;
      line.material.opacity = 0.2 + Math.sin(time * 2.8 + line.userData.pulse) * 0.22;
    });
  }
}