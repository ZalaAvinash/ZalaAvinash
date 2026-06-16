/**
 * EXPERIENCE SECTION — Path with milestones, testimonials, process steps.
 */
import * as THREE from 'three';

export function createExperienceSection({ portfolioData, interactiveObjects, addPathParticles, isMobile = false }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -84);
  const exp = portfolioData.experience;

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6, 0, 0), new THREE.Vector3(-2, 2.5, -6),
    new THREE.Vector3(3, -1.2, -13), new THREE.Vector3(7, 3.8, -19)
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.09, 7, false), new THREE.MeshPhongMaterial({ color: 0x1e3a5f, emissive: 0x112233, shininess: 20 })));

  exp.forEach((e, i) => {
    const t = i / (exp.length - 1);
    const pt = curve.getPointAt(t);
    const pt2 = curve.getPointAt(Math.min(0.99, t + 0.03));

    const node = new THREE.Mesh(new THREE.SphereGeometry(0.85, 22, 22), new THREE.MeshPhongMaterial({ color: i === 0 ? 0x22c55e : 0x3b82f6, emissive: 0x112233, shininess: 55 }));
    node.position.copy(pt);
    node.userData = { type: 'experience', title: e.role + ' @ ' + e.company, body: e.year + '<br>' + e.focus };
    group.add(node); interactiveObjects.push(node);

    const cardBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 1.3), new THREE.MeshPhongMaterial({ color: 0x1e3a5f, emissive: 0x112233, shininess: 25 }));
    cardBase.position.copy(pt); cardBase.position.y += 1.6; cardBase.position.x += (i % 2 === 0 ? 1.2 : -1.2);
    cardBase.rotation.y = (i - 1.5) * 0.3;
    cardBase.userData = { type: 'experience', title: e.role + ' @ ' + e.company, body: e.year + '<br>' + e.focus, _baseY: cardBase.position.y };
    group.add(cardBase); interactiveObjects.push(cardBase);

    const monolith = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), new THREE.MeshPhongMaterial({ color: i === 0 ? 0x22c55e : 0x3b82f6, emissive: 0x0a1628, shininess: 40 }));
    monolith.position.copy(cardBase.position); monolith.position.y += 1.1;
    monolith.userData = { type: 'experience', title: e.role + ' @ ' + e.company, body: e.year + '<br>' + e.focus };
    group.add(monolith); interactiveObjects.push(monolith);

    for (let di = 0; di < 3; di++) {
      const dn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.8), new THREE.MeshPhongMaterial({ color: 0x64748b, emissive: 0x1e2937 }));
      dn.position.copy(monolith.position); dn.position.y += (di - 1) * 0.55; group.add(dn);
    }

    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.9), new THREE.MeshBasicMaterial({ color: 0x0a0c12, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    lbl.position.copy(pt); lbl.position.y += 3.1; lbl.lookAt(pt2); group.add(lbl);
  });

  // Testimonials
  portfolioData.testimonials.forEach((t, i) => {
    const baseZ = -95 - i * 6;
    const posX = (i % 2 === 0 ? -4 : 5);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 20), new THREE.MeshPhongMaterial({ color: 0x3b82f6, emissive: 0x1e3a5f, emissiveIntensity: 0.5, shininess: 40 }));
    orb.position.set(posX, 4 + i * 0.5, baseZ);
    orb.userData = { type: 'testimonial', title: `\u201c${t.author}\u201d \u2014 ${t.company}`, body: t.quote };
    group.add(orb); interactiveObjects.push(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.04, 8, 48), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.3 }));
    ring.position.copy(orb.position); ring.rotation.x = Math.PI / 2; group.add(ring);
  });

  // Process steps
  portfolioData.process.forEach((s, i) => {
    const posX = -8 + i * 4;
    const baseZ = -115;
    const block = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.6), new THREE.MeshPhongMaterial({ color: 0x1e3a5f, emissive: 0x112233, emissiveIntensity: 0.6, shininess: 50 }));
    block.position.set(posX, 2.5 + Math.sin(i) * 0.3, baseZ);
    block.rotation.y = (i - 1.5) * 0.25;
    block.userData = { type: 'process', title: `${s.step} \u2022 ${s.title}`, body: s.desc };
    group.add(block); interactiveObjects.push(block);
    const indicator = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 6), new THREE.MeshPhongMaterial({ color: 0x22c55e, emissive: 0x052e16, emissiveIntensity: 0.8 }));
    indicator.position.set(posX, 3.6, baseZ); indicator.rotation.x = Math.PI;
    indicator.userData = { orbit: i, parent: block, r: 0.8, speed: 1.2 }; group.add(indicator);
  });

  const expPathParticles = isMobile ? 50 : 140;
  addPathParticles(group, curve, expPathParticles);
  return { group, curve };
}