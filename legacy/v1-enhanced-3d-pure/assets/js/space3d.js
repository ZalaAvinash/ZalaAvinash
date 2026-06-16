/* ===================================================================
   SPACE3D.JS — Real-Time WebGL 3D Engine for Space Portfolio
   Implements 60+ 3D effects replacing all video files
   =================================================================== */

const Space3D = (() => {
    'use strict';

    // ============== SHARED STATE ==============
    const state = {
        renderer: null,
        mainScene: null,
        mainCamera: null,
        clock: new THREE.Clock(),
        mouse: { x: 0, y: 0, tx: 0, ty: 0 },
        time: 0,
        delta: 0,
        layers: {},      // named effect layers
        planets: [],
        moons: [],
        station: null,
        sun: null,
        nebula: null,
        starfields: [],
        comets: [],
        particleSystems: [],
        wormhole: null,
        asteroids: [],
        flyers: [],
        active: true,
        warpIntensity: 0,
        arrivalDolly: false,
        postProcessors: []
    };

    // ============== UTILS ==============
    const rand = (a, b) => a + Math.random() * (b - a);
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // ============== 1. STARFIELDS (3 parallax layers) ==============
    function createStarfield(count, opts = {}) {
        const {
            size = 1, distance = 100, color = 0xffffff,
            twinkle = true, brightness = 1, distribution = 'sphere'
        } = opts;

        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);
        const baseSizes = new Float32Array(count);

        const colorPalette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xbfd6ff),
            new THREE.Color(0xfff4bf),
            new THREE.Color(0xffd0a0),
            new THREE.Color(0xffa0a0)
        ];

        for (let i = 0; i < count; i++) {
            let x, y, z;
            if (distribution === 'sphere') {
                const r = distance * (0.6 + Math.random() * 0.4);
                const t = Math.random() * Math.PI * 2;
                const p = Math.acos(2 * Math.random() - 1);
                x = r * Math.sin(p) * Math.cos(t);
                y = r * Math.sin(p) * Math.sin(t);
                z = r * Math.cos(p);
            } else {
                x = (Math.random() - 0.5) * distance * 2;
                y = (Math.random() - 0.5) * distance * 2;
                z = -Math.random() * distance;
            }
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = c.r * brightness;
            colors[i * 3 + 1] = c.g * brightness;
            colors[i * 3 + 2] = c.b * brightness;

            baseSizes[i] = size * (0.5 + Math.random() * 1.5);
            sizes[i] = baseSizes[i];
            phases[i] = Math.random() * Math.PI * 2;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geom.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        // Build point sprite
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.3, 'rgba(255,255,255,0.5)');
        g.addColorStop(0.7, 'rgba(255,255,255,0.1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const sprite = new THREE.CanvasTexture(canvas);

        const mat = new THREE.PointsMaterial({
            size: size * 1.5,
            map: sprite,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geom, mat);
        points.userData = { baseSizes, phases, twinkle, count, distance, layer: opts.layer || 0 };

        return points;
    }

    function updateStarfields(t) {
        state.starfields.forEach((sf, i) => {
            const layerFactor = (i + 1);
            // Parallax rotation per layer
            sf.rotation.y = t * 0.005 * layerFactor * 0.3;
            sf.rotation.x = Math.sin(t * 0.0003 * layerFactor) * 0.02;

            // On warp: radial streak effect (stars fly past)
            const w = state.warpIntensity;
            if (w > 0.05) {
                const pos = sf.geometry.attributes.position.array;
                const dist = sf.userData.distance || 100;
                const speed = 0.8 * w * (3 - i) * 18;
                for (let k = 0; k < sf.userData.count; k++) {
                    // move toward camera (negative z) and slightly out
                    pos[k*3 + 2] += speed * 0.6;
                    if (pos[k*3 + 2] > 4) {
                        // respawn far back with radial spread
                        const rr = dist * (0.55 + Math.random() * 0.45);
                        const th = Math.random() * Math.PI * 2;
                        const ph = Math.acos(2 * Math.random() - 1);
                        pos[k*3] = rr * Math.sin(ph) * Math.cos(th);
                        pos[k*3+1] = rr * Math.sin(ph) * Math.sin(th);
                        pos[k*3+2] = -rr * 1.1;
                    }
                }
                sf.geometry.attributes.position.needsUpdate = true;
            }

            if (sf.userData.twinkle) {
                const sizes = sf.geometry.attributes.size.array;
                const phases = sf.userData.phases;
                const bases = sf.userData.baseSizes;
                for (let k = 0; k < sf.userData.count; k++) {
                    const tw = 0.65 + 0.35 * Math.sin(t * 2.1 + phases[k]);
                    sizes[k] = bases[k] * tw * (1 + w * 0.55);
                }
                sf.geometry.attributes.size.needsUpdate = true;
            }
        });
    }

    // ============== 2. COMETS / SHOOTING STARS ==============
    function createComet() {
        const trailLength = 30;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        const colors = new Float32Array(trailLength * 3);
        const sizes = new Float32Array(trailLength);

        for (let i = 0; i < trailLength; i++) {
            sizes[i] = 2 - (i / trailLength) * 1.8;
            colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.4, vertexColors: true, transparent: true, depthWrite: false,
            blending: THREE.AdditiveBlending, sizeAttenuation: true
        });
        const comet = new THREE.Points(geom, mat);
        comet.userData = {
            trailLength,
            speed: rand(0.5, 1.5),
            direction: new THREE.Vector3(rand(-1, 1), rand(-0.5, 0.5), rand(-1, 0)).normalize(),
            head: 0,
            lifetime: 0,
            maxLife: rand(2, 4)
        };
        return comet;
    }

    function updateComets(dt) {
        if (state.comets.length < 2 && Math.random() < dt * 0.2) {
            const c = createComet();
            c.userData.head.set(rand(-30, 30), rand(15, 25), rand(-20, -10));
            state.mainScene.add(c);
            state.comets.push(c);
        }
        for (let i = state.comets.length - 1; i >= 0; i--) {
            const c = state.comets[i];
            c.userData.lifetime += dt;
            if (c.userData.lifetime > c.userData.maxLife) {
                state.mainScene.remove(c);
                c.geometry.dispose();
                c.material.dispose();
                state.comets.splice(i, 1);
                continue;
            }
            c.userData.head.add(c.userData.direction.clone().multiplyScalar(c.userData.speed * 20 * dt));
            const positions = c.geometry.attributes.position.array;
            for (let k = 0; k < c.userData.trailLength; k++) {
                const off = k / c.userData.trailLength;
                positions[k * 3] = c.userData.head.x - c.userData.direction.x * off * 4;
                positions[k * 3 + 1] = c.userData.head.y - c.userData.direction.y * off * 4;
                positions[k * 3 + 2] = c.userData.head.z - c.userData.direction.z * off * 4;
                const a = 1 - off;
                c.geometry.attributes.color.array[k * 3] = a;
                c.geometry.attributes.color.array[k * 3 + 1] = a;
                c.geometry.attributes.color.array[k * 3 + 2] = a;
            }
            c.geometry.attributes.position.needsUpdate = true;
            c.geometry.attributes.color.needsUpdate = true;
        }
    }

    // ============== 3. NEBULA (volumetric layers) ==============
    function createNebula() {
        const group = new THREE.Group();
        const colors = [0x6c63ff, 0x4a9eff, 0xe040fb, 0x00e676];
        const nebulaData = [];

        for (let i = 0; i < 4; i++) {
            // Create a procedural cloud texture
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');
            for (let j = 0; j < 30; j++) {
                const x = Math.random() * 512, y = Math.random() * 512;
                const r = 60 + Math.random() * 120;
                const c = new THREE.Color(colors[i]);
                const g = ctx.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, `rgba(${Math.floor(c.r*255)},${Math.floor(c.g*255)},${Math.floor(c.b*255)},0.4)`);
                g.addColorStop(0.5, `rgba(${Math.floor(c.r*255)},${Math.floor(c.g*255)},${Math.floor(c.b*255)},0.1)`);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 512, 512);
            }
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.SpriteMaterial({
                map: tex, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            const scale = 60 + i * 15;
            sprite.scale.set(scale, scale, 1);
            sprite.position.set(rand(-25, 25), rand(-15, 15), -40 - i * 8);
            sprite.userData = {
                rotSpeed: rand(0.001, 0.005) * (i % 2 === 0 ? 1 : -1),
                origPos: sprite.position.clone(),
                phase: i * 0.5,
                hueBase: i / 4
            };
            group.add(sprite);
            nebulaData.push(sprite);
        }
        state.nebula = { group, data: nebulaData };
        return group;
    }

    function updateNebula(t) {
        if (!state.nebula) return;
        state.nebula.data.forEach((s, i) => {
            s.material.rotation += s.userData.rotSpeed;
            s.position.y = s.userData.origPos.y + Math.sin(t * 0.2 + s.userData.phase) * 0.8;
            s.position.x = s.userData.origPos.x + Math.cos(t * 0.15 + s.userData.phase) * 1.2;
            // Hue rotation
            const hue = (s.userData.hueBase + t * 0.01) % 1;
            s.material.color.setHSL(hue, 0.6, 0.5);
        });
    }

    // ============== 4. SUN (multi-layer) ==============
    function createSun() {
        const group = new THREE.Group();

        // Core sphere with procedural texture
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = 512; sunCanvas.height = 512;
        const ctx = sunCanvas.getContext('2d');
        const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        grad.addColorStop(0, '#ffeb3b');
        grad.addColorStop(0.4, '#ff9800');
        grad.addColorStop(0.7, '#ff5722');
        grad.addColorStop(1, '#bf360c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        // Add surface noise
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512, y = Math.random() * 512;
            const r = Math.random() * 30;
            ctx.fillStyle = `rgba(255,${150+Math.random()*100},0,${Math.random()*0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        const sunTex = new THREE.CanvasTexture(sunCanvas);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 64, 64),
            new THREE.MeshBasicMaterial({ map: sunTex })
        );
        group.add(core);

        // 3 corona layers
        const coronaColors = [0xffeb3b, 0xff9800, 0xff5722];
        for (let i = 0; i < 3; i++) {
            const corona = new THREE.Mesh(
                new THREE.SphereGeometry(1.5 + (i + 1) * 0.4, 32, 32),
                new THREE.MeshBasicMaterial({
                    color: coronaColors[i], transparent: true, opacity: 0.3 - i * 0.08,
                    side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
                })
            );
            group.add(corona);
        }

        // Solar flares (particle ring)
        const flareGeom = new THREE.BufferGeometry();
        const flareCount = 200;
        const flarePos = new Float32Array(flareCount * 3);
        const flareData = [];
        for (let i = 0; i < flareCount; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = 1.8 + Math.random() * 0.5;
            flarePos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
            flarePos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            flarePos[i * 3 + 2] = r * Math.cos(theta);
            flareData.push({ phi, theta, r, speed: rand(0.1, 0.5) });
        }
        flareGeom.setAttribute('position', new THREE.BufferAttribute(flarePos, 3));
        const flareMat = new THREE.PointsMaterial({
            color: 0xffcc00, size: 0.15, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const flares = new THREE.Points(flareGeom, flareMat);
        group.add(flares);
        group.userData = { core, flares, flareData };

        group.position.set(20, 8, -40);
        state.sun = group;
        return group;
    }

    function updateSun(t, dt) {
        if (!state.sun) return;
        const u = state.sun.userData;
        // Pulsing
        const scale = 1 + Math.sin(t * 2) * 0.05;
        u.core.scale.setScalar(scale);

        // Rotation
        u.core.rotation.y = t * 0.2;
        u.flares.rotation.y = t * 0.3;
        u.flares.rotation.x = t * 0.15;

        // Animate flares
        const pos = u.flares.geometry.attributes.position.array;
        for (let i = 0; i < u.flareData.length; i++) {
            const f = u.flareData[i];
            f.phi += f.speed * dt * 0.5;
            pos[i * 3] = f.r * Math.sin(f.theta) * Math.cos(f.phi);
            pos[i * 3 + 1] = f.r * Math.sin(f.theta) * Math.sin(f.phi);
            pos[i * 3 + 2] = f.r * Math.cos(f.theta);
        }
        u.flares.geometry.attributes.position.needsUpdate = true;
    }

    // ============== 5. PLANETS (5 unique types) ==============
    function createPlanetTexture(type, baseColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const c = new THREE.Color(baseColor);

        if (type === 'rocky') {
            // Earth-like with continents
            ctx.fillStyle = '#' + c.getHexString();
            ctx.fillRect(0, 0, 512, 256);
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(${rand(40, 100)|0},${rand(80, 140)|0},${rand(40, 80)|0},0.8)`;
                ctx.beginPath();
                ctx.ellipse(rand(0, 512), rand(0, 256), rand(20, 60), rand(15, 40), 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'gas') {
            // Jupiter-like bands
            for (let i = 0; i < 256; i += 8) {
                const hue = (i / 256 + Math.random() * 0.1) % 1;
                ctx.fillStyle = `hsl(${hue * 40 + 20}, 60%, ${30 + Math.random() * 30}%)`;
                ctx.fillRect(0, i, 512, 6 + Math.random() * 4);
            }
            // Storm spot
            const g = ctx.createRadialGradient(rand(200, 300), rand(100, 150), 0, rand(200, 300), rand(100, 150), 30);
            g.addColorStop(0, '#ff5722');
            g.addColorStop(1, 'rgba(255,87,34,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 512, 256);
        } else if (type === 'ice') {
            // Ice planet
            ctx.fillStyle = '#b3e5fc';
            ctx.fillRect(0, 0, 512, 256);
            for (let i = 0; i < 100; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(rand(0, 512), rand(0, 256), rand(2, 15), 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'lava') {
            // Lava planet
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(0, 0, 512, 256);
            for (let i = 0; i < 80; i++) {
                const x = rand(0, 512), y = rand(0, 256);
                const g = ctx.createRadialGradient(x, y, 0, x, y, 25);
                g.addColorStop(0, '#ff5722');
                g.addColorStop(0.5, '#ff9800');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, 512, 256);
            }
        } else {
            // Generic
            ctx.fillStyle = '#' + c.getHexString();
            ctx.fillRect(0, 0, 512, 256);
            for (let i = 0; i < 50; i++) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
                ctx.fillRect(rand(0, 512), rand(0, 256), rand(10, 40), rand(5, 20));
            }
        }
        return new THREE.CanvasTexture(canvas);
    }

    function createPlanet(opts) {
        const { type = 'rocky', color = 0x4a9eff, size = 1, position, ringColor = null, hasMoon = false } = opts;
        const group = new THREE.Group();

        const tex = createPlanetTexture(type, color);
        const mat = new THREE.MeshPhongMaterial({
            map: tex, color: 0xffffff,
            emissive: color, emissiveIntensity: 0.15,
            shininess: 80, specular: 0x444444
        });
        const planet = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 48), mat);
        group.add(planet);

        // Atmospheric glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(size * 1.18, 32, 32),
            new THREE.MeshBasicMaterial({
                color: color, transparent: true, opacity: 0.15,
                side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
            })
        );
        group.add(glow);

        // Cloud layer (semi-transparent)
        let clouds = null;
        if (type === 'rocky' || type === 'gas') {
            const cloudTex = createPlanetTexture('gas', 0xffffff);
            cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
            const cloudMat = new THREE.MeshPhongMaterial({
                map: cloudTex, transparent: true, opacity: 0.4, depthWrite: false
            });
            clouds = new THREE.Mesh(new THREE.SphereGeometry(size * 1.02, 32, 32), cloudMat);
            group.add(clouds);
        }

        // Ring system (Saturn-like)
        if (ringColor) {
            const ringGeom = new THREE.RingGeometry(size * 1.4, size * 2.2, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: ringColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.5;
            group.add(ring);

            // Ring particles for detail
            const ringPartGeom = new THREE.BufferGeometry();
            const partCount = 500;
            const partPos = new Float32Array(partCount * 3);
            for (let i = 0; i < partCount; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = size * (1.4 + Math.random() * 0.8);
                partPos[i * 3] = Math.cos(a) * r;
                partPos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
                partPos[i * 3 + 2] = Math.sin(a) * r;
            }
            ringPartGeom.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
            const ringPart = new THREE.Points(ringPartGeom, new THREE.PointsMaterial({
                color: ringColor, size: 0.05, transparent: true, opacity: 0.8
            }));
            ringPart.rotation.x = Math.PI / 2.5;
            group.add(ringPart);
        }

        if (position) {
            group.position.copy(position);
            group.userData.baseY = position.y || 0;
        }
        group.userData = { type, color, size, hasMoon, planet, glow, clouds, tex, cloudTex: clouds ? clouds.material.map : null };
        return group;
    }

    function createMoon(planet, size) {
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(size, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x222222 })
        );
        moon.userData = {
            orbitRadius: size * 5,
            orbitSpeed: rand(0.3, 0.7),
            orbitTilt: rand(-0.3, 0.3),
            orbitPhase: Math.random() * Math.PI * 2,
            parent: planet
        };
        return moon;
    }

    // ============== 6. SPACE STATION ==============
    function createSpaceStation() {
        const group = new THREE.Group();
        // Central body
        const core = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16),
            new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 })
        );
        group.add(core);
        // Ring around station
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.08, 8, 32),
            new THREE.MeshPhongMaterial({ color: 0x4a9eff, emissive: 0x4a9eff, emissiveIntensity: 0.5 })
        );
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        // Solar panels
        for (let i = 0; i < 2; i++) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 1, 0.6),
                new THREE.MeshPhongMaterial({ color: 0x1a237e, emissive: 0x1a237e, emissiveIntensity: 0.3 })
            );
            panel.position.x = (i === 0 ? 1 : -1);
            group.add(panel);
            panel.userData.isPanel = true;
            panel.userData.angle = i * Math.PI;
        }
        // Antenna with blinking light
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        antenna.position.y = 1;
        group.add(antenna);
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        light.position.y = 1.3;
        group.add(light);

        // Window lights
        for (let i = 0; i < 6; i++) {
            const win = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xffeb3b })
            );
            const angle = (i / 6) * Math.PI * 2;
            win.position.set(Math.cos(angle) * 0.3, Math.sin(i * 0.5) * 0.3, 0.75);
            group.add(win);
        }

        group.position.set(12, 3, -18);
        group.userData = { ring, light, panels: group.children.filter(c => c.userData.isPanel) };
        state.station = group;
        return group;
    }

    function updateStation(t, dt) {
        if (!state.station) return;
        const u = state.station.userData;
        u.ring.rotation.z = t * 0.5;
        // Blink antenna light
        u.light.material.color.setHex(Math.sin(t * 4) > 0 ? 0xff0000 : 0x660000);
        // Panels face the sun direction (approximate)
        u.panels.forEach(p => {
            p.rotation.y = Math.atan2(state.sun.position.x - state.station.position.x, 0.1);
        });
    }

    // ============== 7. WORMHOLE TUNNEL ==============
    function createWormhole() {
        const group = new THREE.Group();
        group.visible = false;

        // Main tunnel cylinder for immersive hyperspace (spec: camera tunnel)
        const tunnel = new THREE.Mesh(
            new THREE.CylinderGeometry(2.8, 3.2, 70, 32, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0x3366ff, transparent: true, opacity: 0.08,
                side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
            })
        );
        tunnel.rotation.x = Math.PI / 2;
        tunnel.position.z = -25;
        group.add(tunnel);
        // Inner energy shell
        const tunnel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 2.1, 70, 32, 1, true),
            new THREE.MeshBasicMaterial({
                color: 0x88aaff, transparent: true, opacity: 0.05,
                side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
            })
        );
        tunnel2.rotation.x = Math.PI / 2;
        tunnel2.position.z = -25;
        group.add(tunnel2);

        // Tunnel of energy rings (expanding)
        const ringCount = 42;
        const rings = [];
        for (let i = 0; i < ringCount; i++) {
            const t = i / ringCount;
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(3.1 - t * 0.6, 0.035 + t * 0.01, 6, 28),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.58 + t * 0.25, 0.95, 0.6),
                    transparent: true, opacity: 0.75 - t * 0.55,
                    blending: THREE.AdditiveBlending, depthWrite: false
                })
            );
            ring.position.z = -i * 1.55 - 1;
            ring.userData = { baseZ: -i * 1.55 - 1, idx: i };
            group.add(ring);
            rings.push(ring);
        }

        // Hyperspace grid lines (Star Wars style + radial streaks)
        const lineCount = 720;
        const lineGeom = new THREE.BufferGeometry();
        const linePos = new Float32Array(lineCount * 6);
        for (let i = 0; i < lineCount; i++) {
            const angle = (i % 36) * (Math.PI * 2 / 36) + (Math.floor(i / 36) % 5) * 0.07;
            const r = 0.6 + (i % 7) * 0.55 + Math.random() * 0.4;
            const z = -Math.random() * 68;
            linePos[i * 6] = Math.cos(angle) * r;
            linePos[i * 6 + 1] = Math.sin(angle) * r;
            linePos[i * 6 + 2] = z;
            linePos[i * 6 + 3] = Math.cos(angle) * (r + 0.1);
            linePos[i * 6 + 4] = Math.sin(angle) * (r + 0.1);
            linePos[i * 6 + 5] = z - (2.5 + Math.random() * 1.5);
        }
        lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lines = new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({
            color: 0x66ccff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending
        }));
        group.add(lines);

        // Lightning / electric arcs (animated)
        const arcs = [];
        for (let i = 0; i < 9; i++) {
            const arcGeom = new THREE.BufferGeometry();
            const arcPoints = [];
            const arcCount = 18;
            for (let j = 0; j < arcCount; j++) {
                arcPoints.push(new THREE.Vector3(
                    rand(-2.6, 2.6), rand(-2.6, 2.6), -i * 7.2 + rand(-1.2, 1.2)
                ));
            }
            arcGeom.setFromPoints(arcPoints);
            const arc = new THREE.Line(arcGeom, new THREE.LineBasicMaterial({
                color: 0xaaddff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending
            }));
            arc.userData = { phase: i * 0.7, speed: 0.8 + Math.random() * 1.4, baseZ: -i * 7.2 };
            group.add(arc);
            arcs.push(arc);
        }

        group.userData = { rings, lines, arcs, tunnel, tunnel2 };
        state.wormhole = group;
        return group;
    }

    function updateWormhole(t, dt) {
        if (!state.wormhole || !state.wormhole.visible) return;
        const u = state.wormhole.userData;
        const warpBoost = 1 + state.warpIntensity * 2.2;
        // Move rings toward camera (faster in warp)
        u.rings.forEach(r => {
            r.position.z += (28 + state.warpIntensity * 18) * dt;
            if (r.position.z > 6) r.position.z = r.userData.baseZ;
            r.rotation.z = t * (2.2 + state.warpIntensity);
        });
        // Hyperspace grid + speed lines (faster on warp)
        const pos = u.lines.geometry.attributes.position.array;
        const lineSpeed = 52 * warpBoost;
        for (let i = 0; i < pos.length; i += 6) {
            pos[i + 2] += lineSpeed * dt;
            pos[i + 5] += lineSpeed * dt;
            if (pos[i + 2] > 6) pos[i + 2] -= 70;
            if (pos[i + 5] > 6) pos[i + 5] -= 70;
        }
        u.lines.geometry.attributes.position.needsUpdate = true;
        u.lines.rotation.z = t * (0.35 + state.warpIntensity * 0.6);
        // Move tunnel with slight spin
        if (u.tunnel) {
            u.tunnel.position.z = -26 + Math.sin(t * 0.8) * 0.4;
            u.tunnel.rotation.z = t * 0.6;
        }
        if (u.tunnel2) u.tunnel2.rotation.z = -t * 0.9;
        // Animate lightning arcs: jitter points + flicker
        u.arcs.forEach((arc, idx) => {
            const ap = arc.geometry.attributes.position;
            if (!ap) return;
            const arr = ap.array;
            const ud = arc.userData;
            const jitter = 0.035 + state.warpIntensity * 0.09;
            for (let j = 0; j < arr.length; j += 3) {
                arr[j] += (Math.random() - 0.5) * jitter;
                arr[j + 1] += (Math.random() - 0.5) * jitter * 0.7;
                // gentle z drift
                arr[j + 2] += (Math.sin(t * 3 + ud.phase + j) * 0.01);
            }
            ap.needsUpdate = true;
            // flicker opacity
            const flick = 0.35 + 0.5 * Math.sin(t * 6 * ud.speed + ud.phase);
            arc.material.opacity = Math.max(0.15, flick) * (0.6 + state.warpIntensity * 0.4);
            // slowly advance arcs
            arc.position.z = Math.sin(t * 0.3 + idx) * 0.6;
        });
    }

    // ============== 8. DISTANT GALAXIES & BLACK HOLE ==============
    function createGalaxies() {
        const group = new THREE.Group();
        // Spiral galaxy
        const galGeom = new THREE.BufferGeometry();
        const galCount = 2000;
        const galPos = new Float32Array(galCount * 3);
        for (let i = 0; i < galCount; i++) {
            const arm = i % 4;
            const t = i / galCount * 4;
            const a = arm * (Math.PI * 2 / 4) + t * 2;
            const r = t * 8;
            galPos[i * 3] = Math.cos(a) * r + (Math.random() - 0.5) * 0.5;
            galPos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
            galPos[i * 3 + 2] = Math.sin(a) * r + (Math.random() - 0.5) * 0.5;
        }
        galGeom.setAttribute('position', new THREE.BufferAttribute(galPos, 3));
        const galaxy = new THREE.Points(galGeom, new THREE.PointsMaterial({
            color: 0xddccff, size: 0.08, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, sizeAttenuation: true
        }));
        galaxy.position.set(-40, 15, -60);
        galaxy.rotation.x = Math.PI / 4;
        group.add(galaxy);

        // Black hole with accretion disk
        const bh = new THREE.Group();
        const eventHorizon = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        bh.add(eventHorizon);
        // Accretion disk
        const diskGeom = new THREE.RingGeometry(0.5, 2, 64);
        const diskMat = new THREE.MeshBasicMaterial({
            color: 0xff8800, transparent: true, opacity: 0.7,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending
        });
        const disk = new THREE.Mesh(diskGeom, diskMat);
        disk.rotation.x = Math.PI / 2;
        bh.add(disk);
        bh.position.set(30, -10, -50);
        bh.userData = { disk };
        group.add(bh);
        group.userData = { galaxy, bh };
        return group;
    }

    function updateGalaxies(t) {
        const g = state.galaxies;
        if (!g) return;
        g.userData.galaxy.rotation.y = t * 0.02;
        g.userData.galaxy.rotation.z = t * 0.01;
        g.userData.bh.userData.disk.rotation.z = t * 0.5;
    }

    // ============== ASTEROID BELT + DISTANT FLYING SHIPS (ambient life) ==============
    function createAsteroidBelt() {
        const group = new THREE.Group();
        const count = 380;
        const geom = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const rot = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const speeds = new Float32Array(count);
        const radii = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 11 + Math.random() * 6.5; // belt radius
            const y = (Math.random() - 0.5) * 2.8;
            pos[i*3] = Math.cos(a) * r;
            pos[i*3+1] = y;
            pos[i*3+2] = Math.sin(a) * r * 0.92;
            rot[i*3] = Math.random() * Math.PI * 2;
            rot[i*3+1] = Math.random() * Math.PI * 2;
            rot[i*3+2] = Math.random() * Math.PI * 2;
            sizes[i] = 0.04 + Math.random() * 0.18;
            speeds[i] = 0.02 + Math.random() * 0.07;
            radii[i] = r;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        // Simple instanced look via points + some variation
        const mat = new THREE.PointsMaterial({ color: 0x888899, size: 0.09, transparent: true, opacity: 0.85 });
        const belt = new THREE.Points(geom, mat);
        belt.userData = { pos, rot, sizes, speeds, radii, count };
        group.add(belt);
        // Add a few larger rock meshes for realism
        for (let k = 0; k < 14; k++) {
            const rock = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.22 + Math.random()*0.18, 0),
                new THREE.MeshPhongMaterial({ color: 0x666677, shininess: 10, flatShading: true })
            );
            const aa = Math.random() * Math.PI * 2;
            const rr = 12 + Math.random() * 5;
            rock.position.set(Math.cos(aa)*rr, (Math.random()-0.5)*2.5, Math.sin(aa)*rr*0.9);
            rock.userData = { spin: 0.4 + Math.random(), orbitR: rr, phase: aa, speed: 0.018 + Math.random()*0.012 };
            group.add(rock);
        }
        group.position.set(1, 0.5, -5.5);
        state.asteroids = group;
        return group;
    }

    function updateAsteroids(t, dt) {
        const belt = state.asteroids;
        if (!belt) return;
        const ud = belt.children[0] && belt.children[0].userData;
        if (ud && ud.pos) {
            const p = ud.pos;
            for (let i = 0; i < ud.count; i++) {
                const sp = ud.speeds[i];
                const aa = Math.atan2(p[i*3+2], p[i*3]) + sp * dt * 0.6;
                const rr = ud.radii[i];
                p[i*3] = Math.cos(aa) * rr;
                p[i*3+2] = Math.sin(aa) * rr * 0.92;
            }
            belt.children[0].geometry.attributes.position.needsUpdate = true;
            belt.children[0].rotation.z = t * 0.003;
        }
        // Update rock meshes
        for (let i = 1; i < belt.children.length; i++) {
            const r = belt.children[i];
            if (!r.userData.orbitR) continue;
            const u = r.userData;
            const aa = u.phase + t * u.speed;
            r.position.x = Math.cos(aa) * u.orbitR;
            r.position.z = Math.sin(aa) * u.orbitR * 0.9;
            r.rotation.x = t * u.spin * 0.6;
            r.rotation.y = t * u.spin * 1.1;
        }
    }

    function createFlyers() {
        const group = new THREE.Group();
        const flyers = [];
        // 3-4 small distant ships/cargo
        for (let f = 0; f < 4; f++) {
            const ship = new THREE.Group();
            // simple fuselage
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.03, 0.6, 5),
                new THREE.MeshPhongMaterial({ color: 0x445566, emissive: 0x112233 })
            );
            body.rotation.z = Math.PI / 2;
            ship.add(body);
            // wings / panels
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(0.01, 0.32, 0.08),
                new THREE.MeshPhongMaterial({ color: 0x223344 })
            );
            ship.add(wing);
            // engine glow
            const eng = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
            );
            eng.position.x = -0.32;
            ship.add(eng);
            ship.userData = {
                speed: 0.6 + Math.random() * 1.1,
                pathR: 18 + Math.random() * 22,
                phase: Math.random() * Math.PI * 2,
                y: -2 + Math.random() * 9,
                eng
            };
            group.add(ship);
            flyers.push(ship);
        }
        state.flyers = flyers;
        return group;
    }

    function updateFlyers(t, dt) {
        if (!state.flyers || !state.flyers.length) return;
        state.flyers.forEach((ship, idx) => {
            const u = ship.userData;
            u.phase += u.speed * dt * 0.018;
            const x = Math.cos(u.phase) * u.pathR;
            const z = Math.sin(u.phase) * u.pathR * 0.7 - 12;
            ship.position.set(x, u.y + Math.sin(t + idx) * 0.8, z);
            ship.lookAt(x * 0.6, u.y, z - 6); // face direction of motion
            // engine pulse
            if (u.eng) u.eng.scale.setScalar(0.7 + Math.sin(t * 12 + idx) * 0.4);
            // faint trail by scaling or we can add particle later
        });
    }

    // ============== 9. AMBIENT PARTICLES (space dust, ice, gas, solar wind) ==============
    function createAmbientParticles(count, opts = {}) {
        const { color = 0xffffff, size = 0.05, distance = 60, spread = 1 } = opts;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * distance * spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * distance * spread;
            positions[i * 3 + 2] = (Math.random() - 0.5) * distance;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color, size, transparent: true, opacity: 0.6,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        return new THREE.Points(geom, mat);
    }

    function createSolarWind() {
        const count = 300;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 2.5 + Math.random() * 0.5;
            positions[i * 3] = Math.cos(a) * r;
            positions[i * 3 + 1] = Math.sin(a) * r;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            speeds[i] = rand(2, 5);
            phases[i] = Math.random();
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffaa, size: 0.1, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const wind = new THREE.Points(geom, mat);
        wind.userData = { speeds, phases, initialCount: count };
        return wind;
    }

    function updateSolarWind(dt) {
        if (!state.sun) return;
        const wind = state.sun.userData.wind;
        if (!wind) return;
        const pos = wind.geometry.attributes.position.array;
        const u = wind.userData;
        for (let i = 0; i < u.initialCount; i++) {
            const speed = u.speeds[i] * dt * 0.5;
            const len = Math.sqrt(pos[i*3]*pos[i*3] + pos[i*3+1]*pos[i*3+1]);
            if (len > 0) {
                pos[i*3] += (pos[i*3]/len) * speed;
                pos[i*3+1] += (pos[i*3+1]/len) * speed;
            }
            if (len > 15) {
                const a = Math.random() * Math.PI * 2;
                pos[i*3] = Math.cos(a) * 2.5;
                pos[i*3+1] = Math.sin(a) * 2.5;
            }
        }
        wind.geometry.attributes.position.needsUpdate = true;
    }

    // ============== PLANET-SPECIFIC PARTICLES (ice crystals, lava embers, gas emissions) ==============
    function createPlanetParticles(planet, type, size) {
        let ps;
        if (type === 'ice') {
            // Ice crystals - bright small points orbiting slightly
            const count = 80;
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const vel = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = size * (1.2 + Math.random() * 0.6);
                const a = Math.random() * Math.PI * 2;
                const b = (Math.random() - 0.5) * 0.6;
                pos[i*3] = Math.cos(a) * r;
                pos[i*3+1] = b * size;
                pos[i*3+2] = Math.sin(a) * r;
                vel[i*3] = (Math.random()-0.5)*0.002;
                vel[i*3+1] = (Math.random()-0.5)*0.001;
                vel[i*3+2] = (Math.random()-0.5)*0.002;
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            ps = new THREE.Points(geom, new THREE.PointsMaterial({
                color: 0x99ddff, size: 0.06, transparent: true, opacity: 0.85,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            ps.userData = { vel, count, type: 'ice' };
        } else if (type === 'lava') {
            // Lava embers - orange rising particles
            const count = 60;
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            const life = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                const r = size * (0.95 + Math.random() * 0.15);
                const a = Math.random() * Math.PI * 2;
                pos[i*3] = Math.cos(a) * r;
                pos[i*3+1] = (Math.random() - 0.5) * size * 0.3;
                pos[i*3+2] = Math.sin(a) * r;
                life[i] = Math.random();
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            ps = new THREE.Points(geom, new THREE.PointsMaterial({
                color: 0xff6600, size: 0.08, transparent: true, opacity: 0.9,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            ps.userData = { life, count, type: 'lava', baseR: size };
        } else if (type === 'gas') {
            // Gas wisps - faint larger points
            const count = 40;
            const geom = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = size * (1.1 + Math.random());
                const a = Math.random() * Math.PI * 2;
                pos[i*3] = Math.cos(a) * r * 0.7;
                pos[i*3+1] = (Math.random()-0.5) * size * 1.2;
                pos[i*3+2] = Math.sin(a) * r * 0.7;
            }
            geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            ps = new THREE.Points(geom, new THREE.PointsMaterial({
                color: 0xffaa66, size: 0.2, transparent: true, opacity: 0.25,
                blending: THREE.AdditiveBlending, depthWrite: false
            }));
            ps.userData = { count, type: 'gas' };
        }
        if (ps) {
            planet.add(ps);
            planet.userData.particles = ps;
        }
    }

    // ============== 10. PLANET HOVER HALO (3D UI) ==============
    function createPlanetHalo(planet) {
        const halo = new THREE.Mesh(
            new THREE.RingGeometry(planet.userData.size * 1.3, planet.userData.size * 1.5, 64),
            new THREE.MeshBasicMaterial({
                color: 0x4a9eff, transparent: true, opacity: 0,
                side: THREE.DoubleSide, blending: THREE.AdditiveBlending
            })
        );
        halo.rotation.x = Math.PI / 2;
        planet.add(halo);
        return halo;
    }

    // ============== 11. POST-PROCESSING (simulated with overlays) ==============
    function applyChromaticAberration() {
        // CSS-driven chromatic aberration is in style.css
        // We can also add a CSS overlay for glitch
    }

    // ============== 12. MAIN INITIALIZATION ==============
    function init(canvas) {
        state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        state.renderer.setSize(window.innerWidth, window.innerHeight);
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        state.renderer.setClearColor(0x000005);

        state.mainScene = new THREE.Scene();
        state.mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 1000);
        state.mainCamera.position.set(0, 1, 8);
        state.mainCamera.lookAt(0, 0, -5);

        // Lighting
        const ambient = new THREE.AmbientLight(0x334466, 0.5);
        state.mainScene.add(ambient);
        const sun = new THREE.DirectionalLight(0xfff0c0, 1.2);
        sun.position.set(20, 8, -40);
        state.mainScene.add(sun);
        const fill = new THREE.PointLight(0x4a9eff, 0.8, 50);
        fill.position.set(0, 0, 0);
        state.mainScene.add(fill);

        // 3-LAYER PARALLAX STARFIELD
        const layerConfigs = [
            { count: 4000, size: 1.5, distance: 80, layer: 0, brightness: 1.0 },
            { count: 3000, size: 1.0, distance: 110, layer: 1, brightness: 0.7 },
            { count: 5000, size: 0.6, distance: 150, layer: 2, brightness: 0.5 }
        ];
        layerConfigs.forEach(cfg => {
            const sf = createStarfield(cfg.count, cfg);
            state.mainScene.add(sf);
            state.starfields.push(sf);
        });

        // NEBULA
        state.mainScene.add(createNebula());

        // SUN
        const sunGroup = createSun();
        const wind = createSolarWind();
        sunGroup.add(wind);
        sunGroup.userData.wind = wind;
        state.mainScene.add(sunGroup);

        // 5 UNIQUE PLANETS
        const planetConfigs = [
            { type: 'rocky', color: 0x4a9eff, size: 0.6, pos: [-3, 0, -2], name: 'ABOUT' },       // Cyan
            { type: 'gas',   color: 0xff6b35, size: 0.9, pos: [3, 1, -4], name: 'SKILLS' },      // Orange (Jupiter-like)
            { type: 'rocky', color: 0x6c63ff, size: 0.7, pos: [-4, 1, -7], name: 'PROJECTS' },    // Purple
            { type: 'ice',   color: 0xe040fb, size: 0.5, pos: [4, -1, -8], name: 'EXPERIENCE' },  // Magenta
            { type: 'lava',  color: 0x00e676, size: 0.8, pos: [0, 2, -10], name: 'CONTACT' }      // Green
        ];
        const sectorNames = ['LAUNCH', 'ABOUT', 'SKILLS', 'PROJECTS', 'EXPERIENCE', 'CONTACT'];
        planetConfigs.forEach((cfg, i) => {
            const p = createPlanet({
                type: cfg.type, color: cfg.color, size: cfg.size,
                position: new THREE.Vector3(...cfg.pos),
                ringColor: i === 1 ? 0xffd0a0 : null, // Saturn-like ring on the gas giant
                hasMoon: i % 2 === 0
            });
            p.userData.name = cfg.name;
            p.userData.idx = i + 1;
            p.userData.halo = createPlanetHalo(p);
            state.mainScene.add(p);
            state.planets.push(p);

            // Attach specialized particle effects for immersion
            if (['ice','lava','gas'].includes(cfg.type)) {
                createPlanetParticles(p, cfg.type, cfg.size);
            }

            // Add a moon to planets that need one
            if (p.userData.hasMoon) {
                const moon = createMoon(p, cfg.size * 0.25);
                state.mainScene.add(moon);
                state.moons.push(moon);
            }
        });

        // SPACE STATION
        state.mainScene.add(createSpaceStation());

        // GALAXIES & BLACK HOLE
        const galaxies = createGalaxies();
        state.galaxies = galaxies;
        state.mainScene.add(galaxies);

        // ASTEROID BELT (between mid planets)
        const belt = createAsteroidBelt();
        state.mainScene.add(belt);

        // DISTANT FLYING SHIPS
        const flyersGroup = createFlyers();
        state.mainScene.add(flyersGroup);

        // AMBIENT PARTICLES (space dust)
        const dust = createAmbientParticles(1500, { color: 0xaaccff, size: 0.04, distance: 60 });
        state.mainScene.add(dust);
        state.dust = dust;

        // WORMHOLE (initially hidden)
        state.mainScene.add(createWormhole());

        // EVENT LISTENERS
        window.addEventListener('resize', () => {
            if (!state.mainCamera || !state.renderer) return;
            state.mainCamera.aspect = window.innerWidth / window.innerHeight;
            state.mainCamera.updateProjectionMatrix();
            state.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        window.addEventListener('mousemove', e => {
            state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    // ============== 13. ANIMATION LOOP ==============
    function animate() {
        requestAnimationFrame(animate);
        state.delta = state.clock.getDelta();
        state.time = state.clock.getElapsedTime();
        const t = state.time;
        const dt = Math.min(state.delta, 0.05);

        // Update all subsystems
        updateStarfields(t);
        updateComets(dt);
        updateNebula(t);
        updateSun(t, dt);
        updateStation(t, dt);
        updateWormhole(t, dt);
        updateGalaxies(t);
        updateAsteroids(t, dt);
        updateFlyers(t, dt);
        updateSolarWind(dt);

        // Animate planets (rotation + float)
        state.planets.forEach((p, i) => {
            const ud = p.userData;
            ud.planet.rotation.y = t * (0.2 + i * 0.05);
            ud.glow.rotation.y = -t * 0.3;
            p.position.y = ud.baseY !== undefined ? ud.baseY + Math.sin(t * 0.5 + i) * 0.015 : p.position.y;
            // Cloud layer flow + rotation (gas/rocky)
            if (ud.clouds) {
                ud.clouds.rotation.y = t * (0.08 + (ud.type === 'gas' ? 0.12 : 0));
                if (ud.cloudTex) {
                    ud.cloudTex.offset.x = (t * 0.02) % 1;
                    ud.cloudTex.offset.y = Math.sin(t * 0.01) * 0.1;
                }
            }
            // Planet surface flow for lava/gas (scroll main tex)
            if (ud.tex) {
                if (ud.type === 'lava') {
                    ud.tex.offset.x = (t * 0.04) % 1;
                    ud.tex.offset.y = Math.sin(t * 0.015) * 0.05;
                } else if (ud.type === 'gas') {
                    ud.tex.offset.x = (t * 0.015) % 1;
                }
            }
        });

        // Animate planet-specific particles
        state.planets.forEach(p => {
            const ps = p.userData.particles;
            if (!ps || !ps.userData) return;
            const ud = ps.userData;
            const pos = ps.geometry.attributes.position.array;
            if (ud.type === 'ice') {
                for (let k = 0; k < ud.count; k++) {
                    pos[k*3] += ud.vel[k*3];
                    pos[k*3+1] += ud.vel[k*3+1];
                    pos[k*3+2] += ud.vel[k*3+2];
                    // wrap around planet
                    const r = Math.sqrt(pos[k*3]*pos[k*3] + pos[k*3+2]*pos[k*3+2]);
                    if (r > p.userData.size * 1.9 || r < p.userData.size * 1.1) {
                        const aa = Math.random()*Math.PI*2;
                        const rr = p.userData.size * (1.2 + Math.random()*0.6);
                        pos[k*3] = Math.cos(aa)*rr; pos[k*3+2] = Math.sin(aa)*rr;
                        pos[k*3+1] = (Math.random()-0.5)*p.userData.size*0.6;
                    }
                }
                ps.geometry.attributes.position.needsUpdate = true;
                ps.rotation.y = t * 0.3;
            } else if (ud.type === 'lava') {
                for (let k = 0; k < ud.count; k++) {
                    ud.life[k] += 0.016;
                    if (ud.life[k] > 1) {
                        const r = ud.baseR * (0.95 + Math.random() * 0.15);
                        const a = Math.random() * Math.PI * 2;
                        pos[k*3] = Math.cos(a) * r;
                        pos[k*3+1] = (Math.random() - 0.5) * ud.baseR * 0.3;
                        pos[k*3+2] = Math.sin(a) * r;
                        ud.life[k] = 0;
                    } else {
                        pos[k*3+1] += 0.008; // rise
                    }
                }
                ps.geometry.attributes.position.needsUpdate = true;
            }
        });

        // Animate moons (orbital motion)
        state.moons.forEach(moon => {
            const u = moon.userData;
            u.orbitPhase += u.orbitSpeed * dt;
            const a = u.orbitPhase;
            moon.position.set(
                u.parent.position.x + Math.cos(a) * u.orbitRadius,
                u.parent.position.y + Math.sin(a * 0.7) * u.orbitTilt * 3,
                u.parent.position.z + Math.sin(a) * u.orbitRadius
            );
            moon.rotation.y = t;
        });

        // Animate dust drift
        if (state.dust) {
            state.dust.rotation.y = t * 0.01;
        }

        // Camera follows mouse (parallax) when not warping + not in arrival dolly
        if (state.warpIntensity < 0.5 && !state.arrivalDolly) {
            const targetX = state.mouse.x * 1.5;
            const targetY = 1 + state.mouse.y * 0.8;
            state.mainCamera.position.x += (targetX - state.mainCamera.position.x) * 0.04;
            state.mainCamera.position.y += (targetY - state.mainCamera.position.y) * 0.04;
            if (state.cameraTarget) {
                state.mainCamera.lookAt(state.cameraTarget);
            } else {
                state.mainCamera.lookAt(0, 0, -5);
            }
        }

        // Subtle scene-level FOV breathing
        state.mainCamera.fov = 75 + Math.sin(t * 0.3) * 0.5;
        state.mainCamera.updateProjectionMatrix();

        // Render
        state.renderer.render(state.mainScene, state.mainCamera);
    }

    // ============== 14. PUBLIC API ==============
    return {
        init,
        start() {
            if (!state.renderer) {
                init(document.getElementById('space') || document.createElement('canvas'));
            }
            animate();
        },
        getState() { return state; },
        setCameraTarget(v) { state.cameraTarget = v; },
        clearCameraTarget() { state.cameraTarget = null; },
        // Warp transition: smoothly transition warpIntensity and show/hide wormhole
        triggerWarp(onMidPoint) {
            state.warpIntensity = 1;
            if (state.wormhole) state.wormhole.visible = true;
            // Increase FOV for warp feel
            const startFOV = 75, endFOV = 110;
            const duration = 1200;
            const start = performance.now();
            function step() {
                const elapsed = performance.now() - start;
                const k = Math.min(elapsed / duration, 1);
                state.mainCamera.fov = startFOV + (endFOV - startFOV) * k;
                state.mainCamera.updateProjectionMatrix();
                if (k < 1) requestAnimationFrame(step);
                else if (onMidPoint) onMidPoint();
            }
            step();
        },
        endWarp() {
            state.warpIntensity = 0;
            if (state.wormhole) state.wormhole.visible = false;
            const startFOV = state.mainCamera.fov, endFOV = 75;
            const duration = 800;
            const start = performance.now();
            function step() {
                const elapsed = performance.now() - start;
                const k = Math.min(elapsed / duration, 1);
                state.mainCamera.fov = startFOV + (endFOV - startFOV) * k;
                state.mainCamera.updateProjectionMatrix();
                if (k < 1) requestAnimationFrame(step);
            }
            step();
        },
        getPlanets() { return state.planets; },
        setPlanetHover(planet, hovered) {
            if (planet && planet.userData.halo) {
                planet.userData.halo.material.opacity = hovered ? 0.6 : 0;
            }
        }
    };
})();
