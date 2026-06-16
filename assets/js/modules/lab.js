/**
 * LAB SECTION — Interactive nucleus with mouse-driven particles.
 */
import * as THREE from 'three';

export function createLabSection({ interactiveObjects, addInteractiveParticleSystem, isMobile = false }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -108);

  const nucCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshPhongMaterial({ color: 0x1e3a5f, emissive: 0x3b82f6, emissiveIntensity: 0.7, shininess: 90 }));
  nucCore.userData = { type: 'nucleus', title: 'LIVE SYSTEM SIM', body: 'Mouse drags particles. Click to spawn new modules.' };
  group.add(nucCore); interactiveObjects.push(nucCore);

  const nucShell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 0), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15, wireframe: true }));
  nucShell.position.copy(nucCore.position); group.add(nucShell);

  const innerCore = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x60a5fa, emissiveIntensity: 0.9 }));
  innerCore.position.copy(nucCore.position); group.add(innerCore);

  const labCount = isMobile ? 220 : 620;
  const labParticles = addInteractiveParticleSystem(group, labCount);

  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshPhongMaterial({ color: 0x22c55e, emissive: 0x052e16 }));
    m.userData = { type: 'module', orbit: i, r: 6 + i * 0.6, speed: 0.4 + i * 0.07 }; group.add(m);
  }

  return { group, labParticles };
}