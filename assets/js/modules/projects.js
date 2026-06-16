/**
 * PROJECTS SECTION — 3D holographic cards with textures, frames, orbiting nodes.
 */
import * as THREE from 'three';

export function createProjectsSection({ portfolioData, textures, interactiveObjects, addParticleSystem, isMobile = false }) {
  const group = new THREE.Group();
  group.position.set(0, 0, -58);

  portfolioData.projects.forEach((p, i) => {
    const x = (i - 2) * 11.5, y = Math.sin(i * 1.7) * 1.8, z = Math.cos(i) * 3.5;
    const tex = textures[p.texture] || textures[0];

    const face = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    face.position.set(x, y + 1.5, z - i * 1.1);
    face.rotation.y = (i - 2) * 0.09;
    face.userData = { type: 'project', index: i, title: p.title, body: `<strong>${p.client}</strong><br>${p.impact}<br><br>${p.desc}<br><br><span style="opacity:0.6">${p.tech}</span>` };
    group.add(face); interactiveObjects.push(face);

    const frameMat = new THREE.MeshPhongMaterial({ color: 0x1f2937, emissive: 0x0f1624, shininess: 20, side: THREE.DoubleSide });
    const frontFrame = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 5.6), frameMat);
    frontFrame.position.copy(face.position); frontFrame.position.z -= 0.08; frontFrame.rotation.copy(face.rotation); group.add(frontFrame);

    const backFrame = frontFrame.clone(); backFrame.position.z -= 0.35; group.add(backFrame);

    const thick = 0.35;
    const sideMat = new THREE.MeshPhongMaterial({ color: 0x334155, emissive: 0x0a0f1a, shininess: 15 });
    const sides = [
      new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.25, thick), sideMat),
      new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.25, thick), sideMat),
      new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.6, thick), sideMat),
      new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.6, thick), sideMat),
    ];
    sides.forEach((s, si) => {
      s.position.copy(face.position); s.position.z -= thick / 2; s.rotation.copy(face.rotation);
      if (si === 0) s.position.y += 2.9; if (si === 1) s.position.y -= 2.9;
      if (si === 2) s.position.x -= 4.4; if (si === 3) s.position.x += 4.4; group.add(s);
    });

    for (let d = 0; d < 4; d++) {
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshPhongMaterial({ color: d % 2 ? 0x3b82f6 : 0x22c55e, emissive: 0x0a1628, shininess: 30 }));
      node.position.copy(face.position); node.position.z -= 0.6;
      const a = (d / 4) * Math.PI * 2 + (i * 0.3);
      node.position.x += Math.cos(a) * 4.6; node.position.y += Math.sin(a) * 2.8 + (d - 1.5) * 0.3;
      node.userData = { orbit: d + i * 10, radius: 0.4, speed: 1.8 + d * 0.2, parent: face }; group.add(node);
    }

    const dot = new THREE.Group();
    const dCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshPhongMaterial({ color: 0x22c55e, emissive: 0x052e16, emissiveIntensity: 0.8 })); dot.add(dCore);
    const dRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 16), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.65 })); dRing.rotation.x = Math.PI / 2; dot.add(dRing);
    dot.userData = { orbit: i, radius: 5.2, speed: 0.6 + i * 0.1, parent: face, ring: dRing }; group.add(dot);

    for (let pk = 0; pk < 2; pk++) {
      const pkt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshPhongMaterial({ color: 0x60a5fa, emissive: 0x1e3a5f, emissiveIntensity: 0.6 }));
      pkt.userData = { packetIndex: pk, targetNodeIndex: pk % 3, progress: pk * 0.5, speed: 0.9 + pk * 0.2, parentFace: face }; group.add(pkt);
    }
  });

  const extra = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4), new THREE.MeshBasicMaterial({ map: textures[3] || textures[0], transparent: true, opacity: 0.75 }));
  extra.position.set(14, -2, -8); extra.rotation.y = -0.6; group.add(extra);
  const extraFrame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.3, 0.4), new THREE.MeshPhongMaterial({ color: 0x1f2937, emissive: 0x0f1624 }));
  extraFrame.position.copy(extra.position); extraFrame.position.z -= 0.2; extraFrame.rotation.copy(extra.rotation); group.add(extraFrame);

  const projParticles = isMobile ? 70 : 190;
  addParticleSystem(group, projParticles, { spread: 32, speed: 0.015, color: 0x3b82f6 }, 'project-data');
  return group;
}