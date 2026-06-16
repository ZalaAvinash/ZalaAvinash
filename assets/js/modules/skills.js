/**
 * SKILLS SECTION — Layered orbs with rings, shells, inner cores, constellation lines.
 */
import * as THREE from 'three';

export function createSkillsSection({ portfolioData, interactiveObjects, addParticleSystem, addConstellationLines, isMobile = false }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -26);
  const skills = portfolioData.skills;
  const r = 7.5;

  skills.forEach((sk, i) => {
    const ang = (i / skills.length) * Math.PI * 2;
    const h = (sk.level - 0.5) * 5.5;
    const pos = [Math.cos(ang) * r, h + Math.sin(i) * 1.2, Math.sin(ang) * r * 0.6 - 1];
    const sz = 0.55 + sk.level * 0.9;

    const core = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.85, 28, 28), new THREE.MeshPhongMaterial({
      color: sk.cat === 'backend' ? 0x3b82f6 : sk.cat === 'frontend' ? 0x22c55e : 0x64748b,
      emissive: 0x112233, emissiveIntensity: 0.4, shininess: 70
    }));
    core.position.set(...pos);
    core.userData = { type: 'skill', title: sk.name.toUpperCase(), body: Math.round(sk.level * 100) + '% proficiency • ' + sk.cat.toUpperCase() };
    group.add(core); interactiveObjects.push(core);

    const shell = new THREE.Mesh(new THREE.SphereGeometry(sz * 1.25, 24, 24), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.12, wireframe: true }));
    shell.position.copy(core.position); group.add(shell);

    const inner = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.45, 16, 16), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x60a5fa, emissiveIntensity: 0.8 }));
    inner.position.copy(core.position); group.add(inner);

    for (let ri = 0; ri < 2; ri++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(sz * (1.4 + ri * 0.3), 0.035, 8, 48), new THREE.MeshBasicMaterial({
        color: ri === 0 ? 0x22c55e : 0x3b82f6, transparent: true, opacity: 0.25
      }));
      ring.position.copy(core.position); ring.rotation.x = Math.PI / 2 + (ri - 0.5) * 0.4;
      ring.userData = { ringSpeed: 0.8 + ri * 0.4, parent: core }; group.add(ring);
    }
  });

  addConstellationLines(group, skills.length, r);
  const skillParticles = isMobile ? 90 : 260;
  addParticleSystem(group, skillParticles, { spread: 18, speed: 0.011, color: 0x60a5fa }, 'ambient');
  return group;
}