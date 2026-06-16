/**
 * HERO SECTION — Architecture core, layers, profile, stats, particles.
 */
import * as THREE from 'three';

export function createHeroSection({ textures, profileTexture, interactiveObjects, addParticleSystem, createAnimatedConnections, isMobile = false }) {
  const group = new THREE.Group();

  // Living core with ShaderMaterial
  const coreGeo = new THREE.TorusKnotGeometry(2.6, 0.68, 220, 18, 2, 5);
  const coreMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, baseColor: { value: new THREE.Color(0x0f1624) }, emissiveColor: { value: new THREE.Color(0x1e3a5f) } },
    vertexShader: `
      uniform float time; varying vec3 vNormal; varying vec3 vPos;
      void main() { vNormal = normal; vec3 pos = position;
        float wave = sin(pos.x * 2.5 + time * 1.8) * 0.06 + cos(pos.y * 3.2 + time * 2.2) * 0.04;
        pos += normal * wave; vPos = pos; gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); }
    `,
    fragmentShader: `
      uniform float time; uniform vec3 baseColor; uniform vec3 emissiveColor;
      varying vec3 vNormal; varying vec3 vPos;
      void main() { float pulse = 0.6 + sin(time * 2.4) * 0.35 + cos(time * 1.6 + vPos.x) * 0.2;
        vec3 col = mix(baseColor, emissiveColor, pulse * 0.7);
        float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0,0.0,1.0))), 2.0); col += rim * 0.25;
        gl_FragColor = vec4(col, 1.0); }
    `
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.userData = { type: 'core', title: 'LIVING SYSTEM CORE', body: 'The heart of every production system I build. Clean architecture, observable, evolvable.' };
  group.add(core); interactiveObjects.push(core);

  // Architecture layers
  const layerDefs = [
    { name: 'ANGULAR / UI LAYER', pos: [-4.8, 3.6, 0], color: 0x3b82f6 },
    { name: '.NET API GATEWAY', pos: [0, 5.8, 0], color: 0x60a5fa },
    { name: 'SERVICES / DOMAIN', pos: [5.1, 3.4, 0], color: 0x22c55e },
    { name: 'DATA & PERSISTENCE', pos: [-3.2, -3.8, 0], color: 0x64748b },
    { name: 'AZURE CLOUD', pos: [3.4, -4.1, 0], color: 0x0ea5e9 }
  ];
  layerDefs.forEach((l) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), new THREE.MeshPhongMaterial({ color: l.color, emissive: l.color, emissiveIntensity: 0.25, shininess: 70 }));
    m.position.set(...l.pos);
    m.userData = { type: 'layer', title: l.name, body: 'Production-grade component. Scalable, observable, versioned.' };
    group.add(m); interactiveObjects.push(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.025, 12, 64), new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: 0.25 }));
    ring.position.copy(m.position); ring.rotation.x = Math.PI / 2; group.add(ring);
  });

  // Floating modules
  for (let i = 0; i < 6; i++) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.85), new THREE.MeshPhongMaterial({ color: 0x111827, emissive: i % 2 ? 0x1e3a5f : 0x052e16, side: THREE.DoubleSide }));
    pl.position.set(Math.cos(i * 1.1) * 9.5, Math.sin(i * 1.3) * 4.2 + 1, Math.sin(i * 0.7) * 3.5 - 1);
    pl.rotation.y = i * 0.9;
    pl.userData = { type: 'module', title: 'MICRO-COMPONENT', body: 'Small focused service or UI module. Composable, testable, independently deployable.' };
    group.add(pl); interactiveObjects.push(pl);
  }

  // Profile hologram
  if (profileTexture) {
    const prof = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.8), new THREE.MeshBasicMaterial({ map: profileTexture, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
    prof.position.set(-9.5, 1.8, -4); prof.rotation.y = 0.6;
    prof.userData = { type: 'profile', title: 'AVINASH ZALA', body: 'I design and engineer high-performance digital systems that feel alive. Currently leading initiatives at Aether Industries.' };
    group.add(prof); interactiveObjects.push(prof);
  }

  // Stats orbs
  const stats = [
    { label: '7+ YEARS', pos: [-11, 6.5, 2] },
    { label: '15+ SYSTEMS', pos: [-10, -2, 5] },
    { label: 'AETHER', pos: [8.5, 7, -3] }
  ];
  stats.forEach((st) => {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshPhongMaterial({ color: 0x3b82f6, emissive: 0x1e3a5f, emissiveIntensity: 0.7, shininess: 40 }));
    orb.position.set(...st.pos);
    orb.userData = { type: 'stat', title: st.label, body: 'Key milestone from real enterprise delivery.' };
    group.add(orb); interactiveObjects.push(orb);
  });

  // Particles — reduced on mobile for performance
  const p1 = isMobile ? 140 : 380;
  const p2 = isMobile ? 80 : 220;
  addParticleSystem(group, p1, { spread: 22, speed: 0.018, color: 0x3b82f6 }, 'data-flow');
  addParticleSystem(group, p2, { spread: 14, speed: 0.026, color: 0x22c55e }, 'data-flow');
  createAnimatedConnections(group, layerDefs.map(l => l.pos));

  return group;
}