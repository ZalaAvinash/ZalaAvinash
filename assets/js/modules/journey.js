/**
 * JOURNEY TRAIL — Faint path rail, progress head, trailing particles.
 */
import * as THREE from 'three';

export function createJourneyTrail(cameraPath, isMobile = false) {
  const group = new THREE.Group();
  if (!cameraPath) return { group, journeyData: null };

  const divisions = 180;
  const points = cameraPath.getPoints(divisions);

  // Rail
  const railPositions = [];
  points.forEach(p => railPositions.push(p.x, p.y, p.z));
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(railPositions), 3));
  const rail = new THREE.Line(railGeo, new THREE.LineBasicMaterial({ color: 0x1a2a4a, transparent: true, opacity: 0.15 }));
  group.add(rail);

  // Trail head
  const headGroup = new THREE.Group();
  const hCore = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), new THREE.MeshPhongMaterial({ color: 0x22c55e, emissive: 0x0a3d1a, emissiveIntensity: 0.9, shininess: 60 })); headGroup.add(hCore);
  const hRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.1, 8, 24), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 })); hRing.rotation.x = Math.PI / 2; headGroup.add(hRing);
  headGroup.userData = { ring: hRing };
  group.add(headGroup);

  // Trail particles — lighter on mobile
  const trailCount = isMobile ? 25 : 65;
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(trailCount * 3);
  const trailSizes = new Float32Array(trailCount);
  for (let i = 0; i < trailCount; i++) trailSizes[i] = 0.6 + Math.random() * 0.8;
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
  const trailParticles = new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.7, size: 1.1, depthWrite: false }));
  group.add(trailParticles);

  const journeyData = {
    curve: cameraPath,
    points,
    divisions,
    head: headGroup,
    particlePositions: trailPos,
    trailParticles,
    explorerTrailFlows: [],
    explorerTargets: []
  };

  return { group, journeyData };
}

export function updateJourneyTrail(journeyData, progress, time, delta) {
  if (!journeyData || !journeyData.curve) return;

  const p = Math.max(0, Math.min(0.999, progress));
  const headPos = journeyData.curve.getPointAt(p);
  journeyData.head.position.copy(headPos);
  journeyData.head.position.y += 1.2;
  journeyData.head.scale.setScalar(0.7 + Math.sin(time * 3) * 0.15);
  if (journeyData.head.userData && journeyData.head.userData.ring) {
    journeyData.head.userData.ring.rotation.z = time * 2;
  }

  // Update trailing particles
  if (journeyData.particlePositions && journeyData.points) {
    for (let i = 0; i < 65; i++) {
      const sampleT = Math.max(0, p - (i / 65) * 0.09);
      const pt = journeyData.curve.getPointAt(sampleT);
      const i3 = i * 3;
      journeyData.particlePositions[i3] = pt.x;
      journeyData.particlePositions[i3 + 1] = pt.y + 1.1 + Math.sin(time * 4 + i) * 0.4;
      journeyData.particlePositions[i3 + 2] = pt.z;
    }
    journeyData.trailParticles.geometry.attributes.position.needsUpdate = true;
  }
}