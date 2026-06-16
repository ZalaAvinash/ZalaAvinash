/**
 * THREE ENGINE — Minimal, clean real-time 3D (rebuilt lighter "from scratch" per feedback).
 * Goal: interactive planets + stars + station for the cockpit view.
 * Core interactive 3D (planets, station, stars, sun, wormhole accents, camera) kept minimal.
 * Heavy constant animations (asteroids, flyers, comets, dust) removed per feedback.
 * 3D is heavily suppressed (canvas hidden or 0.04) during video moments so your clips stay dominant.
 * Subtle continuous progress + faint accents enhance the "movie" without overwriting.
 */

class ThreeEngine {
  constructor() {
    this.state = {
      renderer: null,
      scene: null,
      camera: null,
      clock: new THREE.Clock(),
      mouse: { x: 0, y: 0 },
      time: 0,
      delta: 0,
      planets: [],
      moons: [],
      starfields: [],
      station: null,
      sun: null,
      nebula: null,
      wormhole: null,
      warpIntensity: 0,
      backgroundVideoActive: false,
      wormholeVideoMode: false,
      starOpacityMultiplier: 1.0,  // for hiding star animation during video travel
      cameraTarget: null,
      arrivalDolly: false
    };

    this.config = window.PORTFOLIO_CONFIG || {};
    this.planetsById = new Map();
  }

  // Public API
  init(canvas) {
    if (!window.THREE) {
      console.error('Three.js not loaded');
      return;
    }

    this.state.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.state.renderer.setSize(window.innerWidth, window.innerHeight);
    this.state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.state.renderer.setClearColor(0x000008, 0.0); // transparent so video shows through

    this.state.scene = new THREE.Scene();
    this.state.camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.04, 900);
    this.state.camera.position.set(0, 1.1, 7.6);
    this.state.camera.lookAt(0, 0, -4.5);

    this._setupLights();
    this._createStarfields();
    this._createNebula();
    this._createSun();
    this._createPlanets();
    this._createStation();
    this._createWormhole();

    this._bindEvents();
  }

  start() {
    this._animate();
  }

  // Called by App when we enter heavy video moments
  setBackgroundVideoActive(active) {
    this.state.backgroundVideoActive = !!active;
  }

  setWarpIntensity(v) {
    this.state.warpIntensity = Math.max(0, Math.min(1, v || 0));
  }

  // Control for wormhole travel: when true, hide 3D wormhole so the video isn't overwritten by extra 3D animations
  setWormholeVideoMode(active) {
    this.state.wormholeVideoMode = !!active;
    if (this.state.wormhole) {
      this.state.wormhole.visible = !active;
    }
  }

  triggerWarp(onMid) {
    this.setWarpIntensity(1);
    if (this.state.wormhole && !this.state.wormholeVideoMode) {
      this.state.wormhole.visible = true;
    }

    const cam = this.state.camera;
    const startFOV = cam.fov;
    const endFOV = 108;
    const dur = 1050;
    const t0 = performance.now();

    const step = () => {
      const k = Math.min((performance.now() - t0) / dur, 1);
      cam.fov = startFOV + (endFOV - startFOV) * k;
      cam.updateProjectionMatrix();
      if (k < 1) requestAnimationFrame(step);
      else if (onMid) onMid();
    };
    step();
  }

  endWarp() {
    this.setWarpIntensity(0);
    this.setWormholeVideoMode(false); // always reset so 3D is available after
    if (this.state.wormhole) this.state.wormhole.visible = false;

    const cam = this.state.camera;
    const start = cam.fov;
    const end = 74;
    const dur = 720;
    const t0 = performance.now();

    const step = () => {
      const k = Math.min((performance.now() - t0) / dur, 1);
      cam.fov = start + (end - start) * k;
      cam.updateProjectionMatrix();
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  focusPlanet(planetData) {
    if (!planetData || !planetData.position) {
      this.state.cameraTarget = null;
      return;
    }
    const p = new THREE.Vector3(...planetData.position);
    this.state.cameraTarget = p;
  }

  clearCameraTarget() {
    this.state.cameraTarget = null;
  }

  // Control visibility of all planets (for clean travel and sector views)
  setPlanetsVisible(visible) {
    this.state.planets.forEach(p => {
      p.visible = !!visible;
    });
  }

  setStarOpacityMultiplier(mult) {
    this.state.starOpacityMultiplier = Math.max(0, Math.min(1, mult || 1));
  }

  // Show only the planet for the current sector, hide others (for "in planet" view)
  showOnlyPlanet(sectorId) {
    this.state.planets.forEach(p => {
      p.visible = (p.userData.sectorId === sectorId);
    });
  }

  /**
   * Scroll-driven movie mode: progress 0-1 controls the "camera flight" through the story.
   * This makes the whole experience feel like one continuous cinematic movie on scroll.
   * Camera smoothly travels between predefined positions, planets come into focus, etc.
   */
  setScrollProgress(progress) {
    const st = this.state;
    if (!st.camera) return;

    // Simple multi-stage lerp based on progress.
    // 0-0.15: Launch position
    // 0.15-0.3: Travel / wormhole feel (camera pulls back or moves)
    // Then per planet segments for the rest of the scroll.

    const cam = st.camera;

    // Base positions from original + sector data (can be enhanced with config later)
    const launchPos = { x: 0, y: 1.1, z: 7.6 };
    const travelPos = { x: 2, y: 3, z: 20 }; // pulled back for "travel" feel

    // Get planet positions from existing planets
    const planetPositions = st.planets.map(p => ({
      x: p.position.x,
      y: p.position.y,
      z: p.position.z
    }));

    let targetX, targetY, targetZ, lookX = 0, lookY = 0, lookZ = -4;

    if (progress < 0.2) {
      // Launch phase
      const t = progress / 0.2;
      targetX = launchPos.x;
      targetY = launchPos.y + t * 2;
      targetZ = launchPos.z + t * 5;
    } else if (progress < 0.35) {
      // Travel / wormhole phase - camera "flies" (background for movie flow)
      // But animation (warp/stars) will be suppressed by scroll handler during video
      const t = (progress - 0.2) / 0.15;
      targetX = launchPos.x + (travelPos.x - launchPos.x) * t;
      targetY = launchPos.y + (travelPos.y - launchPos.y) * t;
      targetZ = launchPos.z + (travelPos.z - launchPos.z) * t;
      // Do not increase warp here - scroll handler controls to remove travel animation during video
      st.warpIntensity = 0;
    } else {
      // Planet approach phases (divide remaining progress among planets)
      const planetProgress = (progress - 0.35) / 0.65;
      const numPlanets = planetPositions.length || 5;
      const planetIndex = Math.min(Math.floor(planetProgress * numPlanets), numPlanets - 1);
      const planetT = (planetProgress * numPlanets) % 1;

      if (planetPositions[planetIndex]) {
        const p = planetPositions[planetIndex];
        // Lerp from previous to this planet, get closer as t increases
        const prev = planetPositions[planetIndex - 1] || launchPos;
        targetX = prev.x + (p.x - prev.x) * planetT;
        targetY = prev.y + (p.y - prev.y) * planetT + 1; // slight lift
        targetZ = prev.z + (p.z - prev.z) * planetT - 3; // approach closer
        lookX = p.x;
        lookY = p.y;
        lookZ = p.z;
      } else {
        targetX = launchPos.x;
        targetY = launchPos.y;
        targetZ = launchPos.z;
      }

      st.warpIntensity = Math.max(0, 1 - planetT * 1.2); // calm down after travel
    }

    // Smooth lerp camera (feels cinematic, not jumpy)
    let lerpFactor = 0.08;
    const isVideo = this.state.backgroundVideoActive;
    if (isVideo) {
      lerpFactor = 0.035; // much gentler when video is the star of the show
      // Scale down the travel amount so 3D is only faint depth accent
      targetX = (targetX + cam.position.x * 3) / 4;
      targetY = (targetY + cam.position.y * 3) / 4;
      targetZ = (targetZ + cam.position.z * 3) / 4;
    }
    cam.position.x += (targetX - cam.position.x) * lerpFactor;
    cam.position.y += (targetY - cam.position.y) * lerpFactor;
    cam.position.z += (targetZ - cam.position.z) * lerpFactor;

    cam.lookAt(lookX, lookY, lookZ);

    // Expose for other systems (HUD, video sync)
    this.state.scrollProgress = progress;
  }

  getIntersectedPlanet(mouseNDC, camera) {
    if (!camera) camera = this.state.camera;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouseNDC, camera);

    const hits = ray.intersectObjects(this.state.planets, true);
    if (hits.length === 0) return null;

    let obj = hits[0].object;
    while (obj && !obj.userData?.sectorId) obj = obj.parent;
    return obj || null;
  }

  setPlanetHover(planetObj, hovered) {
    if (!planetObj || !planetObj.userData?.halo) return;
    planetObj.userData.halo.material.opacity = hovered ? 0.55 : 0;
  }

  // === INTERNAL CREATION ===

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x334466, 0.48);
    this.state.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xfff0c0, 1.15);
    sunLight.position.set(19, 7, -38);
    this.state.scene.add(sunLight);

    const fill = new THREE.PointLight(0x4a9eff, 0.65, 65);
    fill.position.set(0, 0, 0);
    this.state.scene.add(fill);
  }

  _createStarfields() {
    const layers = [
      { count: 3200, size: 1.4, distance: 78, brightness: 1.0 },
      { count: 2400, size: 0.95, distance: 108, brightness: 0.68 },
      { count: 4200, size: 0.55, distance: 148, brightness: 0.48 }
    ];

    layers.forEach((cfg, i) => {
      const sf = this._makeStarfield(cfg.count, cfg);
      sf.userData.layer = i;
      this.state.scene.add(sf);
      this.state.starfields.push(sf);
    });
  }

  _makeStarfield(count, opts) {
    const { size = 1, distance = 100, brightness = 1 } = opts;

    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const phase = new Float32Array(count);
    const baseSz = new Float32Array(count);

    const palette = [0xffffff, 0xbfd6ff, 0xfff4bf, 0xffd0a0, 0xffa0a0];

    for (let i = 0; i < count; i++) {
      const r = distance * (0.58 + Math.random() * 0.42);
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p);

      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      col[i * 3] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;

      baseSz[i] = size * (0.45 + Math.random() * 1.55);
      sz[i] = baseSz[i];
      phase[i] = Math.random() * Math.PI * 2;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sz, 1));
    geom.setAttribute('phase', new THREE.BufferAttribute(phase, 1));

    // Soft point sprite
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.72, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({
      size: size * 1.6,
      map: tex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geom, mat);
    points.userData = { baseSz, phase, count, distance };
    return points;
  }

  _createNebula() {
    // Lightweight 4-layer sprite nebula (video will often provide richer background)
    const group = new THREE.Group();
    const colors = [0x6c63ff, 0x4a9eff, 0xe040fb, 0x00e676];

    for (let i = 0; i < 4; i++) {
      const c = new THREE.Color(colors[i]);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const ctx = canvas.getContext('2d');

      for (let j = 0; j < 26; j++) {
        const x = Math.random() * 512, y = Math.random() * 512;
        const r = 55 + Math.random() * 115;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0.38)`);
        grad.addColorStop(0.5, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0.09)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
      }

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0.26 + i * 0.03,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const spr = new THREE.Sprite(mat);
      const sc = 58 + i * 14;
      spr.scale.set(sc, sc, 1);
      spr.position.set((Math.random() - 0.5) * 48, (Math.random() - 0.5) * 28, -38 - i * 7);
      spr.userData = { rotSpeed: (0.0012 + Math.random() * 0.003) * (i % 2 ? 1 : -1), phase: i * 0.6 };
      group.add(spr);
    }
    this.state.nebula = group;
    this.state.scene.add(group);
  }

  _createSun() {
    const g = new THREE.Group();

    // Core
    const coreCanvas = document.createElement('canvas');
    coreCanvas.width = coreCanvas.height = 512;
    const ctx = coreCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, '#ffeb3b'); grad.addColorStop(0.38, '#ff9800');
    grad.addColorStop(0.68, '#ff5722'); grad.addColorStop(1, '#bf360c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 850; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = Math.random() * 26;
      ctx.fillStyle = `rgba(255,${160 + Math.random() * 90},0,${Math.random() * 0.28})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(coreCanvas);

    const core = new THREE.Mesh(new THREE.SphereGeometry(1.55, 64, 64), new THREE.MeshBasicMaterial({ map: tex }));
    g.add(core);

    // Coronas
    const coronaCols = [0xffeb3b, 0xff9800, 0xff5722];
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(
        new THREE.SphereGeometry(1.55 + (i + 1) * 0.42, 32, 32),
        new THREE.MeshBasicMaterial({
          color: coronaCols[i], transparent: true, opacity: 0.28 - i * 0.07,
          side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      g.add(c);
    }

    // Flares
    const flareCount = 180;
    const flareGeom = new THREE.BufferGeometry();
    const fPos = new Float32Array(flareCount * 3);
    const flareData = [];
    for (let i = 0; i < flareCount; i++) {
      const phi = Math.random() * Math.PI * 2, theta = Math.random() * Math.PI;
      const r = 1.82 + Math.random() * 0.48;
      fPos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      fPos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      fPos[i * 3 + 2] = r * Math.cos(theta);
      flareData.push({ phi, theta, r, speed: 0.12 + Math.random() * 0.42 });
    }
    flareGeom.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    const flares = new THREE.Points(flareGeom, new THREE.PointsMaterial({
      color: 0xffcc00, size: 0.13, transparent: true, opacity: 0.82,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(flares);
    g.userData = { core, flares, flareData };

    g.position.set(19, 7, -38);
    this.state.sun = g;
    this.state.scene.add(g);
  }

  _createPlanets() {
    const sectors = this.config.sectors || [];
    sectors.forEach(sector => {
      if (!sector.planet) return;

      const pData = sector.planet;
      const group = this._makePlanet(pData);

      group.userData.sectorId = sector.id;
      group.userData.name = sector.name;
      group.userData.planetData = pData;

      // Halo for hover
      const halo = this._makeHalo(pData.size);
      group.add(halo);
      group.userData.halo = halo;

      this.state.scene.add(group);
      this.state.planets.push(group);
      this.planetsById.set(sector.id, group);

      // Moon
      if (pData.hasMoon) {
        const moon = this._makeMoon(pData.size * 0.26);
        moon.userData.parentPlanet = group;
        moon.userData.orbitRadius = pData.size * 5.2;
        moon.userData.orbitSpeed = 0.38 + Math.random() * 0.55;
        moon.userData.phase = Math.random() * Math.PI * 2;
        moon.userData.tilt = (Math.random() - 0.5) * 0.35;
        this.state.scene.add(moon);
        this.state.moons.push(moon);
      }
    });
  }

  _makePlanet(pData) {
    const { type = 'rocky', color = 0x4a9eff, size = 0.7 } = pData;
    const g = new THREE.Group();

    const tex = this._makePlanetTexture(type, color);
    const mat = new THREE.MeshPhongMaterial({
      map: tex, color: 0xffffff, emissive: color, emissiveIntensity: 0.12,
      shininess: 72, specular: 0x333333
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 48), mat);
    g.add(mesh);

    // Atmosphere glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.16, 32, 32),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.13,
        side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    g.add(glow);

    // Clouds for some types
    if (type === 'rocky' || type === 'gas') {
      const cloudTex = this._makePlanetTexture('gas', 0xffffff);
      cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(size * 1.03, 32, 32),
        new THREE.MeshPhongMaterial({ map: cloudTex, transparent: true, opacity: 0.36, depthWrite: false })
      );
      g.add(clouds);
      g.userData.clouds = clouds;
      g.userData.cloudTex = cloudTex;
    }

    // Ring
    if (pData.hasRing && pData.ringColor) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(size * 1.38, size * 2.15, 64),
        new THREE.MeshBasicMaterial({ color: pData.ringColor, transparent: true, opacity: 0.58, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2.4;
      g.add(ring);

      // Ring particles
      const rpCount = 420;
      const rpGeom = new THREE.BufferGeometry();
      const rpPos = new Float32Array(rpCount * 3);
      for (let i = 0; i < rpCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = size * (1.36 + Math.random() * 0.82);
        rpPos[i * 3] = Math.cos(a) * r;
        rpPos[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
        rpPos[i * 3 + 2] = Math.sin(a) * r;
      }
      rpGeom.setAttribute('position', new THREE.BufferAttribute(rpPos, 3));
      const rp = new THREE.Points(rpGeom, new THREE.PointsMaterial({ color: pData.ringColor, size: 0.045, transparent: true, opacity: 0.75 }));
      rp.rotation.x = Math.PI / 2.4;
      g.add(rp);
    }

    if (pData.position) g.position.fromArray(pData.position);
    g.userData.type = type;
    g.userData.size = size;
    g.userData.tex = tex;
    return g;
  }

  _makePlanetTexture(type, baseColor) {
    const c = new THREE.Color(baseColor);
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'rocky') {
      ctx.fillStyle = '#' + c.getHexString();
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${70 + Math.random() * 70 | 0},${30 + Math.random() * 50 | 0},0.75)`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 18 + Math.random() * 48, 12 + Math.random() * 32, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'gas') {
      for (let y = 0; y < 256; y += 7) {
        const hue = (y / 256 + Math.random() * 0.08) % 1;
        ctx.fillStyle = `hsl(${hue * 38 + 18}, 58%, ${28 + Math.random() * 32}%)`;
        ctx.fillRect(0, y, 512, 5 + Math.random() * 5);
      }
      const storm = ctx.createRadialGradient(240, 118, 0, 240, 118, 34);
      storm.addColorStop(0, '#ff5722'); storm.addColorStop(1, 'rgba(255,87,34,0)');
      ctx.fillStyle = storm; ctx.fillRect(0, 0, 512, 256);
    } else if (type === 'ice') {
      ctx.fillStyle = '#b3e5fc'; ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 95; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.65})`;
        ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 13, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'lava') {
      ctx.fillStyle = '#1a0808'; ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 72; i++) {
        const x = Math.random() * 512, y = Math.random() * 256;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 22);
        gr.addColorStop(0, '#ff5722'); gr.addColorStop(0.45, '#ff9800'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, 512, 256);
      }
    } else {
      ctx.fillStyle = '#' + c.getHexString(); ctx.fillRect(0, 0, 512, 256);
    }
    return new THREE.CanvasTexture(canvas);
  }

  _makeHalo(size) {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(size * 1.28, size * 1.48, 64),
      new THREE.MeshBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    halo.rotation.x = Math.PI / 2;
    return halo;
  }

  _makeMoon(size) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x1f1f1f, shininess: 12 })
    );
  }

  _createStation() {
    const g = new THREE.Group();

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 16),
      new THREE.MeshPhongMaterial({ color: 0x777777, emissive: 0x1a1a1a }));
    g.add(core);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 30),
      new THREE.MeshPhongMaterial({ color: 0x4a9eff, emissive: 0x4a9eff, emissiveIntensity: 0.4 }));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);

    // Solar panels
    const panels = [];
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.95, 0.55),
        new THREE.MeshPhongMaterial({ color: 0x1a237e, emissive: 0x1a237e, emissiveIntensity: 0.25 }));
      p.position.x = (i === 0 ? 0.95 : -0.95);
      g.add(p);
      panels.push(p);
    }

    // Antenna + blink light
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6),
      new THREE.MeshBasicMaterial({ color: 0xdddddd }));
    ant.position.y = 0.9;
    g.add(ant);

    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 7),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    blink.position.y = 1.2;
    g.add(blink);

    g.position.set(11.5, 2.8, -17.5);
    g.userData = { ring, blink, panels };
    this.state.station = g;
    this.state.scene.add(g);
  }

  _makePoints(count, opts) {
    const { color = 0xffffff, size = 0.05, spread = 50 } = opts;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 1.1 - 8;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geom, new THREE.PointsMaterial({
      color, size, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false
    }));
  }

  _createAsteroidBelt() {
    // Stripped - too much extra constant animation per user feedback. Can be re-added later if needed.
    this.state.asteroids = null;
  }

  _createFlyers() {
    // Stripped - extra animation removed per feedback for cleaner experience.
    this.state.flyers = [];
  }

  _createWormhole() {
    const g = new THREE.Group();
    g.visible = false;

    // Energy rings
    const rings = [];
    for (let i = 0; i < 38; i++) {
      const t = i / 38;
      const r = new THREE.Mesh(
        new THREE.TorusGeometry(2.9 - t * 0.55, 0.032, 6, 26),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.57 + t * 0.26, 0.92, 0.58),
          transparent: true, opacity: 0.68 - t * 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      r.position.z = -i * 1.48;
      r.userData = { baseZ: -i * 1.48 };
      g.add(r);
      rings.push(r);
    }

    // Lightning arcs (will be animated)
    const arcs = [];
    for (let i = 0; i < 7; i++) {
      const arc = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: 16 }, () => new THREE.Vector3())),
        new THREE.LineBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
      );
      arc.userData = { phase: i * 0.9, speed: 1.1 + Math.random() };
      g.add(arc);
      arcs.push(arc);
    }

    g.userData = { rings, arcs };
    this.state.wormhole = g;
    this.state.scene.add(g);
  }

  // === UPDATE LOOP ===

  _animate() {
    requestAnimationFrame(() => this._animate());

    const st = this.state;
    st.delta = st.clock.getDelta();
    st.time = st.clock.getElapsedTime();
    const t = st.time;
    const dt = Math.min(st.delta, 0.06);

    const density = st.backgroundVideoActive ? 0.55 : 1.0;

    this._updateStarfields(t, density);
    this._updateNebula(t);
    this._updateSun(t, dt);
    this._updatePlanets(t);
    this._updateMoons(dt);
    this._updateStation(t);
    this._updateWormhole(t, dt);

    // Camera behavior
    this._updateCamera(t);

    st.renderer.render(st.scene, st.camera);
  }

  _updateStarfields(t, density = 1) {
    this.state.starfields.forEach((sf, i) => {
      sf.rotation.y = t * 0.0048 * (i + 1) * 0.28;
      sf.rotation.x = Math.sin(t * 0.00028 * (i + 1)) * 0.018;

      const w = this.state.warpIntensity;
      if (w > 0.03) {
        const pos = sf.geometry.attributes.position.array;
        const dist = sf.userData.distance || 100;
        // Reduce star streaking speed when wormhole VIDEO is playing, so the video itself isn't overwritten by 3D streaks
        const videoFactor = this.state.backgroundVideoActive ? 0.38 : 1.0;
        const spd = 0.7 * w * (3.2 - i) * 17 * videoFactor;
        for (let k = 0; k < sf.userData.count; k++) {
          pos[k * 3 + 2] += spd * 0.55;
          if (pos[k * 3 + 2] > 3.5) {
            const rr = dist * (0.52 + Math.random() * 0.48);
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            pos[k * 3] = rr * Math.sin(ph) * Math.cos(th);
            pos[k * 3 + 1] = rr * Math.sin(ph) * Math.sin(th);
            pos[k * 3 + 2] = -rr * 1.05;
          }
        }
        sf.geometry.attributes.position.needsUpdate = true;
      }

      const sizes = sf.geometry.attributes.size.array;
      const phases = sf.userData.phase;
      const bases = sf.userData.baseSz;
      const starMult = this.state.starOpacityMultiplier || 1.0;
      for (let k = 0; k < sf.userData.count; k++) {
        const tw = 0.62 + 0.38 * Math.sin(t * 2.05 + phases[k]);
        sizes[k] = bases[k] * tw * (1 + w * 0.5) * density * starMult;
      }
      sf.geometry.attributes.size.needsUpdate = true;
    });
  }

  // (Other update methods abbreviated for response length — in real implementation they mirror the high-quality previous versions for planets, wormhole, etc.)
  // Comet system stripped - was extra animation. Re-add only if specifically requested.
  _updateComets(dt) {}
  _createComet() { return null; }

  _updateNebula(t) {
    const n = this.state.nebula;
    if (!n) return;
    n.children.forEach((s, i) => {
      if (s.material) s.material.rotation += s.userData.rotSpeed || 0.0018;
      const ud = s.userData;
      if (ud) {
        s.position.y = (ud.origY || s.position.y) + Math.sin(t * 0.17 + ud.phase) * 0.7;
      }
    });
  }

  _updateSun(t, dt) {
    const u = this.state.sun?.userData;
    if (!u) return;
    const scale = 1 + Math.sin(t * 1.8) * 0.048;
    u.core.scale.setScalar(scale);
    u.core.rotation.y = t * 0.17;
    u.flares.rotation.y = t * 0.26;

    const pos = u.flares.geometry.attributes.position.array;
    u.flareData.forEach((f, i) => {
      f.phi += f.speed * dt * 0.55;
      pos[i*3]   = f.r * Math.sin(f.theta) * Math.cos(f.phi);
      pos[i*3+1] = f.r * Math.sin(f.theta) * Math.sin(f.phi);
      pos[i*3+2] = f.r * Math.cos(f.theta);
    });
    u.flares.geometry.attributes.position.needsUpdate = true;
  }

  _updatePlanets(t) {
    this.state.planets.forEach((p, i) => {
      const ud = p.userData;
      if (ud.planet) ud.planet.rotation.y = t * (0.19 + i * 0.048);
      if (ud.glow) ud.glow.rotation.y = -t * 0.26;
      if (ud.clouds) {
        ud.clouds.rotation.y = t * (0.07 + (ud.type === 'gas' ? 0.11 : 0));
        if (ud.cloudTex) ud.cloudTex.offset.x = (t * 0.018) % 1;
      }
      if (ud.tex && ud.type === 'lava') ud.tex.offset.x = (t * 0.035) % 1;
      if (ud.baseY !== undefined) p.position.y = ud.baseY + Math.sin(t * 0.48 + i) * 0.014;
    });
  }

  _updateMoons(dt) {
    this.state.moons.forEach(m => {
      const u = m.userData;
      if (!u.parentPlanet) return;
      u.phase = (u.phase || 0) + (u.orbitSpeed || 0.5) * dt;
      const parentPos = u.parentPlanet.position;
      const r = u.orbitRadius || 3.5;
      m.position.set(
        parentPos.x + Math.cos(u.phase) * r,
        parentPos.y + Math.sin(u.phase * 0.7) * (u.tilt || 0) * 2.8,
        parentPos.z + Math.sin(u.phase) * r * 0.92
      );
      m.rotation.y = this.state.time * 0.6;
    });
  }

  _updateStation(t) {
    const u = this.state.station?.userData;
    if (!u) return;
    if (u.ring) u.ring.rotation.z = t * 0.48;
    if (u.blink) u.blink.material.color.setHex( Math.sin(t * 3.8) > 0 ? 0xff0000 : 0x660000 );
    if (u.panels) u.panels.forEach((p, i) => {
      p.rotation.y = Math.atan2( (this.state.sun?.position.x || 19) - this.state.station.position.x , 0.6) * (i ? -0.6 : 0.6);
    });
  }

  _updateWormhole(t, dt) {
    const w = this.state.wormhole;
    if (!w || !w.visible) return;
    const u = w.userData;
    const boost = 1 + this.state.warpIntensity * 1.8;
    const videoBase = this.state.backgroundVideoActive ? 0.32 : 1.0; // keep the provided wormhole VIDEO prominent; 3D only as subtle accents

    u.rings.forEach((r, idx) => {
      r.position.z += (26 + this.state.warpIntensity * 14) * dt;
      if (r.position.z > 5) r.position.z = r.userData.baseZ;
      r.rotation.z = t * (1.8 + this.state.warpIntensity * 0.8);
      // lower opacity over video so the provided wormhole video clip remains visible underneath the 3D accents
      if (r.material) r.material.opacity = (0.68 - (idx/38)*0.5) * videoBase;
    });

    // Animate arcs (lightning)
    u.arcs.forEach((arc, i) => {
      const arr = arc.geometry.attributes.position?.array;
      if (!arr) return;
      const jitter = 0.028 + this.state.warpIntensity * 0.07;
      for (let j = 0; j < arr.length; j += 3) {
        arr[j]   += (Math.random() - 0.5) * jitter;
        arr[j+1] += (Math.random() - 0.5) * jitter * 0.6;
      }
      arc.geometry.attributes.position.needsUpdate = true;
      arc.material.opacity = (0.28 + 0.45 * Math.sin(t * 5.5 + arc.userData.phase)) * videoBase;
    });
  }

  _updateCamera(t) {
    const st = this.state;
    const cam = st.camera;

    if (st.warpIntensity > 0.45) {
      // During warp we let the timing in app.js + FOV handle most drama
      return;
    }

    if (!st.arrivalDolly && st.warpIntensity < 0.5) {
      const tx = st.mouse.x * 1.35;
      const ty = 1.05 + st.mouse.y * 0.72;
      cam.position.x += (tx - cam.position.x) * 0.038;
      cam.position.y += (ty - cam.position.y) * 0.038;
    }

    if (st.cameraTarget) {
      cam.lookAt(st.cameraTarget);
    } else {
      cam.lookAt(0, 0, -4.2);
    }

    cam.fov = 74 + Math.sin(t * 0.27) * 0.45;
    cam.updateProjectionMatrix();
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      const cam = this.state.camera;
      const rend = this.state.renderer;
      if (!cam || !rend) return;
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
      rend.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousemove', e => {
      this.state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }
}

// Expose
window.ThreeEngine = ThreeEngine;