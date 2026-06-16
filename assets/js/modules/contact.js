/**
 * CONTACT SECTION — Nexus sphere, action planes, particles.
 */
import * as THREE from 'three';

export function createContactSection({ interactiveObjects, addParticleSystem, isMobile = false }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -130);

  const nexus = new THREE.Mesh(new THREE.SphereGeometry(2.4, 36, 36), new THREE.MeshPhongMaterial({ color: 0x0f1624, emissive: 0x1e3a5f, emissiveIntensity: 0.8, shininess: 100 }));
  nexus.userData = { type: 'nexus', title: "LET'S BUILD", body: 'Ready for ambitious enterprise systems. Reach out.' };
  group.add(nexus); interactiveObjects.push(nexus);

  const actions = [
    { label: 'EMAIL', action: 'mailto:avinashzala@outlook.com', desc: 'avinashzala@outlook.com' },
    { label: 'DOWNLOAD CV', action: 'download', desc: 'Resume.docx' },
    { label: 'CALL', action: 'tel:+917405120804', desc: '+91 74051 20804' }
  ];
  actions.forEach((a, i) => {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.1), new THREE.MeshPhongMaterial({ color: 0x111827, emissive: 0x1e3a5f, shininess: 40, side: THREE.DoubleSide }));
    pl.position.set((i - 1) * 7.8, 1.5 + Math.sin(i) * 0.8, -4 + i * 0.6);
    pl.rotation.y = (i - 1) * -0.35;
    pl.userData = { type: 'contact', title: a.label, body: a.desc, action: a.action };
    group.add(pl); interactiveObjects.push(pl);
  });

  const contactParticles = isMobile ? 100 : 280;
  addParticleSystem(group, contactParticles, { spread: 26, speed: 0.009, color: 0x60a5fa }, 'contact');
  return group;
}