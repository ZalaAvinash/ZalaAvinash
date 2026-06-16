/**
 * ENVIRONMENT — Distant layer planes, rings, constellation field, pillars.
 */
import * as THREE from 'three';

export function createEnvironmentSection(isMobile = false) {
  const group = new THREE.Group();
  const envData = {};

  // Distant layer planes
  for (let i = 0; i < 5; i++) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(180, 120), new THREE.MeshBasicMaterial({ color: 0x0a1628, transparent: true, opacity: 0.06 + i * 0.01, side: THREE.DoubleSide }));
    plane.position.set(0, 0, -40 - i * 35); plane.rotation.x = Math.PI * 0.5 + (i - 2) * 0.04; group.add(plane);
    const wire = new THREE.Mesh(new THREE.PlaneGeometry(180, 120), new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.025, wireframe: true, side: THREE.DoubleSide }));
    wire.position.copy(plane.position); wire.rotation.copy(plane.rotation); group.add(wire);
  }

  // System rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(95 + i * 12, 0.8, 6, 64), new THREE.MeshBasicMaterial({ color: 0x112244, transparent: true, opacity: 0.08 }));
    ring.position.set(0, 8 - i * 3, -70 - i * 25); ring.rotation.x = Math.PI * 0.4; group.add(ring);
    rings.push(ring);
    if (i < 2) {
      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(85 + i * 10, 0.4, 8, 48), new THREE.MeshBasicMaterial({ color: 0x1a3344, transparent: true, opacity: 0.05, wireframe: true }));
      innerRing.position.copy(ring.position); innerRing.rotation.copy(ring.rotation); group.add(innerRing);
      rings.push(innerRing);
    }
  }

  // Constellation field — lighter on mobile
  const fieldCount = isMobile ? 180 : 520;
  const fieldGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(fieldCount * 3);
  const fieldColors = new Float32Array(fieldCount * 3);
  for (let i = 0; i < fieldCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 340; positions[i + 1] = (Math.random() - 0.5) * 200 + 10; positions[i + 2] = (Math.random() - 0.5) * 240 - 100;
    fieldColors[i] = 0.2; fieldColors[i + 1] = 0.25 + Math.random() * 0.1; fieldColors[i + 2] = 0.4;
  }
  fieldGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  fieldGeo.setAttribute('color', new THREE.BufferAttribute(fieldColors, 3));
  const field = new THREE.Points(fieldGeo, new THREE.PointsMaterial({ size: 0.85, vertexColors: true, transparent: true, opacity: 0.11 }));
  group.add(field);

  envData.field = field;
  envData.fieldBaseColors = fieldColors.slice();
  envData.rings = rings;

  // Pillars
  for (let i = 0; i < 4; i++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(3 + i, 3 + i, 140, 5, 1, true), new THREE.MeshBasicMaterial({ color: 0x0f1f38, transparent: true, opacity: 0.04, side: THREE.DoubleSide }));
    pillar.position.set((i - 1.5) * 45, 10, -120 - i * 15); pillar.rotation.y = i * 0.4; group.add(pillar);
  }

  return { group, envData };
}

export function updateEnvironment(envData, progress, time) {
  const envParallax = (progress - 0.5) * 4;
  if (envData.field) {
    envData.field.rotation.y = time * 0.003;
    envData.field.rotation.x = Math.sin(time * 0.001) * 0.02;
    envData.field.position.z = envParallax * -0.8;

    const colors = envData.field.geometry.attributes.color;
    const base = envData.fieldBaseColors;
    if (colors && base) {
      const arr = colors.array;
      const section = Math.floor(progress * 5);
      for (let i = 0; i < arr.length; i += 3) {
        const idx = i / 3;
        arr[i] = base[i]; arr[i + 1] = base[i + 1]; arr[i + 2] = base[i + 2];
        if ((idx % 5) === section % 5) {
          const boost = 0.15 + Math.sin(time * 1.5 + idx) * 0.08;
          arr[i] += boost * 0.6; arr[i + 1] += boost * 0.8; arr[i + 2] += boost * 1.2;
        }
      }
      colors.needsUpdate = true;
    }
  }

  if (envData.rings) {
    envData.rings.forEach((ring, i) => {
      ring.rotation.z = time * (0.004 + i * 0.001);
      ring.position.y = 8 - i * 3 + Math.sin(time * 0.015 + i) * 1.5;
      ring.position.z = -70 - i * 25 + envParallax * (0.6 + i * 0.3);
    });
  }
}