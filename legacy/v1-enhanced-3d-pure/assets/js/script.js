// ================================================================
// SPACE PORTFOLIO v9 - THREE.JS 3D ENGINE INTEGRATION
// Uses real-time WebGL rendering (no video files required)
// ================================================================

let _w = false, _a = false, _cs = 0;
const planets3D = [];

window.addEventListener('load', () => {
    // Init the 3D engine on the existing canvas
    Space3D.init(document.getElementById('space'));
    Space3D.start();

    // Expose planets for interaction
    Space3D.getPlanets().forEach((p, i) => {
        p.userData.sectorIdx = i + 1; // 1..5
        planets3D.push(p);
    });

    bootSequence();
    initAudio(); // subtle procedural space audio (no external files)
});

// ============== SECTOR NAVIGATION WITH 3D WARP ==============
function goto(t) {
    if (_w || t === _cs) return;
    _w = true;

    document.getElementById('contentPanel').classList.remove('active');
    document.getElementById('cockpit').classList.remove('active');

    const sectorNames = ['LAUNCH', 'ABOUT', 'SKILLS', 'PROJECTS', 'EXPERIENCE', 'CONTACT'];
    const nm = sectorNames[t];
    const wt = document.getElementById('whText');
    if (wt) wt.textContent = nm + ' INCOMING';

    const wo = document.getElementById('whVideoOverlay');
    if (wo) wo.classList.add('active');

    // Warp speed HUD
    const sf = document.getElementById('speedFill');
    if (sf) sf.style.width = '99%';
    const ws = document.getElementById('warpSpeed');
    if (ws) ws.textContent = '9.9';

    // Trigger 3D wormhole + FOV warp
    Space3D.triggerWarp();

    setTimeout(() => {
        _cs = t;
        document.getElementById('sectorName').textContent = nm;
        document.querySelectorAll('.pnav-btn').forEach((b, i) => b.classList.toggle('active', i === t));

        if (t === 0) {
            Space3D.clearCameraTarget();
        } else {
            const p = planets3D[t - 1];
            if (p) {
                Space3D.setCameraTarget(p.position.clone());
            }
        }
    }, 1200);

    setTimeout(() => {
        if (wo) wo.classList.remove('active');
        const ao = document.getElementById('sectorArrivalVideo');
        if (ao) ao.classList.add('active');
        _a = true;

        // Powerful arrival: camera approach + subtle shake (locks mouse follow)
        setTimeout(() => {
            const st = Space3D.getState();
            const p = (t > 0) ? planets3D[t-1] : null;
            if (p && st.mainCamera) {
                st.arrivalDolly = true;
                const cam = st.mainCamera;
                const origPos = cam.position.clone();
                const targetApproach = p.position.clone().multiplyScalar(0.6).add(new THREE.Vector3(0, 0.6, 1.8));
                // quick dolly toward planet for "orbit insertion"
                const start = performance.now();
                const dur = 920;
                function approachStep() {
                    const k = Math.min((performance.now() - start) / dur, 1);
                    cam.position.lerpVectors(origPos, targetApproach, k * 0.65);
                    cam.lookAt(p.position);
                    if (k < 1) requestAnimationFrame(approachStep);
                    else {
                        st.arrivalDolly = false;
                        // small settle back + target
                        setTimeout(() => {
                            if (Space3D.setCameraTarget) Space3D.setCameraTarget(p.position.clone());
                        }, 380);
                    }
                }
                approachStep();
            }
        }, 420);

        setTimeout(() => {
            if (ao) ao.classList.remove('active');
            Space3D.endWarp();
            _a = false;
            document.getElementById('cockpit').classList.add('active');
            if (sf) sf.style.width = '50%';
            if (ws) ws.textContent = '1.0';
            _w = false;
            if (t > 0) showPanel(t);
            // light camera shake on arrival
            triggerCamShake(0.8, 620);
        }, 2000);
    }, 2400);
}

function triggerCamShake(intensity = 1, duration = 500) {
    const state = Space3D.getState();
    if (!state || !state.mainCamera) return;
    const cam = state.mainCamera;
    const baseX = cam.position.x, baseY = cam.position.y;
    const start = performance.now();
    function shake() {
        const elapsed = performance.now() - start;
        const k = Math.min(elapsed / duration, 1);
        if (k >= 1) {
            cam.position.x = baseX;
            cam.position.y = baseY;
            return;
        }
        const amp = intensity * (1 - k) * 0.22;
        cam.position.x = baseX + (Math.random() - 0.5) * amp;
        cam.position.y = baseY + (Math.random() - 0.5) * amp * 0.7;
        requestAnimationFrame(shake);
    }
    shake();
}

// ============== CONTENT PANEL ==============
function showPanel(t) {
    const data = [
        { t: 'ABOUT ME', s: 'Senior Full Stack Developer',
          b: '<p>I&#39;m <strong>Avinash Zala</strong>, Senior Full Stack Developer with <strong>7+ years</strong> building enterprise apps.</p><p>Specializing in <strong>.NET Core, Angular, React.js</strong>, cloud-native. Currently at <strong>Aether Industries</strong>.</p><div style="margin-top:14px"><span class="tag">7+ Years</span><span class="tag">15+ Projects</span><span class="tag">Available</span></div>' },
        { t: 'TECH STACK', s: 'Languages & Frameworks',
          b: '<div class="skills-grid"><div class="sg"><h4>LANGUAGES</h4><p><span class="tag">C#</span><span class="tag">TypeScript</span><span class="tag">JavaScript</span><span class="tag">SQL</span></p></div><div class="sg"><h4>BACKEND</h4><p><span class="tag">.NET Core</span><span class="tag">ASP.NET</span><span class="tag">SignalR</span></p></div><div class="sg"><h4>FRONTEND</h4><p><span class="tag">React</span><span class="tag">Angular</span><span class="tag">Bootstrap</span></p></div></div>' },
        { t: 'PROJECTS', s: 'Selected Work',
          b: '<div class="pcard"><h3>AIRIS — Enterprise ERP</h3><p>.NET 4.5 to .NET Core. PRM module, Docker & K8s.</p><div><span class="tag">.NET Core</span><span class="tag">Angular</span><span class="tag">Docker</span></div></div><div class="pcard"><h3>Insurance Portal</h3><p>ASP.NET + MSSQL. HelloSign, Stripe. 100% test coverage.</p><div><span class="tag">ASP.NET</span><span class="tag">MSSQL</span><span class="tag">Stripe</span></div></div><div class="pcard"><h3>Twitter Intelligence</h3><p>Chrome extension + .NET Core. ChatGPT trends, real-time dashboards.</p><div><span class="tag">.NET Core</span><span class="tag">ChatGPT</span><span class="tag">React</span></div></div>' },
        { t: 'EXPERIENCE', s: 'Career Path',
          b: '<div class="titem"><span class="tyear">2025 — PRESENT</span><h3>Senior Developer</h3><h4>Aether Industries</h4></div><div class="titem"><span class="tyear">2019 — 2024</span><h3>Senior Developer</h3><h4>Engross Infotech</h4></div><div class="titem"><span class="tyear">2017 — 2019</span><h3>Jr. Engineer</h3><h4>Skyzone Software</h4></div>' },
        { t: 'CONTACT', s: "Let's Connect",
          b: '<p>Ready to build something amazing?</p><div style="margin:14px 0"><a href="mailto:avinashzala@outlook.com" class="cblock">📧 avinashzala@outlook.com</a><a href="tel:+917405120804" class="cblock">📱 +91 74051 20804</a></div><a href="Resume/Resume.docx" download class="cv-btn">⬇ DOWNLOAD CV</a>' }
    ];
    const d = data[t - 1];
    document.getElementById('panelContent').innerHTML = '<h1>' + d.t + '</h1><h2>' + d.s + '</h2>' + d.b;
    document.getElementById('contentPanel').classList.add('active');
}

// ============== CLICK & KEYBOARD INTERACTIONS ==============
document.addEventListener('click', e => {
    if (_w || _a) return;
    // Spawn sci-fi click ripple for 3D press feel (spec)
    spawnRipple(e.clientX, e.clientY);

    // Use mouse position for raycasting
    const rect = document.getElementById('space').getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    const cam = Space3D.getState().mainCamera;
    raycaster.setFromCamera(mouse, cam);
    const hits = raycaster.intersectObjects(planets3D, true);
    if (hits.length > 0) {
        let target = hits[0].object;
        while (target && target.userData.sectorIdx === undefined) target = target.parent;
        if (target && target.userData.sectorIdx !== undefined) {
            // stronger warp "engage" feel
            const cr = document.querySelector('.crosshair');
            if (cr) cr.style.transform = 'translate(-50%,-50%) scale(0.6)';
            setTimeout(() => { if (cr) cr.style.transform = 'translate(-50%,-50%) scale(1)'; }, 180);
            goto(target.userData.sectorIdx);
        }
    }
});

function spawnRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'click-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    r.style.width = '28px';
    r.style.height = '28px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 650);
}

// Mouse warp-space cursor feedback (spec: cursor that warps space)
document.addEventListener('mousedown', e => {
    if (_w || _a) return;
    const ch = document.querySelector('.crosshair');
    if (ch && (e.target.id === 'space' || e.target.closest('#cockpit'))) {
        ch.style.transform = 'translate(-50%,-50%) scale(1.38)';
        ch.style.transition = 'transform .06s linear';
    }
});
document.addEventListener('mouseup', () => {
    const ch = document.querySelector('.crosshair');
    if (ch) {
        ch.style.transform = 'translate(-50%,-50%) scale(1)';
        ch.style.transition = 'transform .2s ease';
    }
});

// ============== PROCEDURAL AUDIO (advanced immersive, no assets) ==============
let audioCtx, masterGain, droneOsc, droneGain, lastBlip = 0;
function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.035; // very subtle
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 920;
        masterGain.connect(filter);
        filter.connect(audioCtx.destination);

        // Low ambient drone (engine hum / space)
        droneOsc = audioCtx.createOscillator();
        droneOsc.type = 'sine';
        droneOsc.frequency.value = 38;
        droneGain = audioCtx.createGain();
        droneGain.gain.value = 0.6;
        const droneLFO = audioCtx.createOscillator();
        droneLFO.type = 'sine';
        droneLFO.frequency.value = 0.07;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 9;
        droneLFO.connect(lfoGain);
        lfoGain.connect(droneOsc.frequency);
        const droneFilt = audioCtx.createBiquadFilter();
        droneFilt.type = 'lowpass';
        droneFilt.frequency.value = 140;
        droneOsc.connect(droneGain);
        droneGain.connect(droneFilt);
        droneFilt.connect(masterGain);
        droneOsc.start();
        droneLFO.start();
    } catch(e){ /* audio blocked or unavailable */ }
}

function playWarpWhoosh() {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.6, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;

        const bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 420;
        bp.Q.value = 2.8;

        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001;
        const endGain = audioCtx.createGain();
        endGain.gain.value = 0.9;

        // pitch sweep
        bp.frequency.setValueAtTime(420, now);
        bp.frequency.linearRampToValueAtTime(1850, now + 0.9);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.06);
        gain.gain.linearRampToValueAtTime(0.0001, now + 1.35);

        const comp = audioCtx.createDynamicsCompressor();
        noise.connect(bp);
        bp.connect(gain);
        gain.connect(endGain);
        endGain.connect(comp);
        comp.connect(masterGain);
        noise.start(now);
        setTimeout(() => { try { noise.stop(); } catch(_) {} }, 1800);
    } catch(_) {}
}

function playUIBlip(success = true) {
    if (!audioCtx || Date.now() - lastBlip < 60) return;
    lastBlip = Date.now();
    try {
        const now = audioCtx.currentTime;
        const o = audioCtx.createOscillator();
        o.type = success ? 'triangle' : 'sawtooth';
        o.frequency.value = success ? 1240 : 420;
        const g = audioCtx.createGain();
        g.gain.value = 0.6;
        const f = audioCtx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 2200;
        o.connect(g); g.connect(f); f.connect(masterGain);
        o.start(now);
        g.gain.linearRampToValueAtTime(0.0001, now + (success ? 0.18 : 0.32));
        setTimeout(() => { try { o.stop(); } catch(_) {} }, 420);
    } catch(_) {}
}

// Hook audio into existing transitions (called from goto / panel)
const _origGoto = goto;
goto = function(t) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    playWarpWhoosh();
    return _origGoto(t);
};
const _origShow = showPanel;
showPanel = function(t) {
    playUIBlip(true);
    return _origShow(t);
};
// Blip on nav clicks too (pnav)
setTimeout(() => {
    document.querySelectorAll('.pnav-btn').forEach(b => {
        b.addEventListener('click', () => playUIBlip(true));
    });
    const close = document.getElementById('panelClose');
    if (close) close.addEventListener('click', () => playUIBlip(false));
}, 1200);

// Hover effect: detect raycast mousemove and toggle halo
document.addEventListener('mousemove', e => {
    if (_w || _a) return;
    const rect = document.getElementById('space').getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    const cam = Space3D.getState().mainCamera;
    raycaster.setFromCamera(mouse, cam);
    const hits = raycaster.intersectObjects(planets3D, true);
    const hovered = hits.length > 0
        ? (hits[0].object.userData.sectorIdx !== undefined ? hits[0].object : findPlanetParent(hits[0].object))
        : null;
    planets3D.forEach(p => Space3D.setPlanetHover(p, p === hovered));
    const cp = document.getElementById('cockpit');
    if (cp) cp.classList.toggle('planet-hover', !!hovered);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
});

function findPlanetParent(obj) {
    let cur = obj;
    while (cur) {
        if (cur.userData && cur.userData.sectorIdx !== undefined) return cur;
        cur = cur.parent;
    }
    return null;
}

document.addEventListener('keydown', e => {
    if (_w || _a) return;
    if (e.key === 'ArrowRight' && _cs < 5) goto(_cs + 1);
    else if (e.key === 'ArrowLeft' && _cs > 0) goto(_cs - 1);
    else if (e.key === 'Escape') {
        document.getElementById('contentPanel').classList.remove('active');
        if (_cs !== 0) goto(0);
    }
});

document.getElementById('panelClose').addEventListener('click', () => {
    document.getElementById('contentPanel').classList.remove('active');
});

// ============== PLANET NAV BUTTONS ==============
const nav = document.getElementById('planetNav');
nav.innerHTML = ['LAUNCH', 'ABOUT', 'SKILLS', 'PROJECTS', 'EXPERIENCE', 'CONTACT']
    .map((n, i) => '<div class="pnav-btn' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" data-name="' + n + '"></div>')
    .join('');
nav.querySelectorAll('.pnav-btn').forEach(b => {
    b.addEventListener('click', () => goto(parseInt(b.dataset.idx)));
});

// ============== BOOT SEQUENCE ==============
function bootSequence() {
    const lines = [
        '> INITIALIZING QUANTUM DRIVE...',
        '> CALIBRATING WORMHOLE ENGINE...',
        '> GENERATING STELLAR CARTOGRAPHY...',
        '> 12,000 STARS LOADED',
        '> 380 ASTEROIDS MAPPED',
        '> 5 SECTOR PLANETS DETECTED',
        '> WORMHOLE SIGNATURE: STABLE',
        '> PILOT PROFILE: AVINASH ZALA',
        '> ALL SYSTEMS NOMINAL',
        '> READY FOR LAUNCH'
    ];
    const el = document.getElementById('bootLines');
    let i = 0;
    const iv = setInterval(() => {
        if (i < lines.length) {
            const p = document.createElement('p');
            p.textContent = lines[i];
            el.appendChild(p);
            i++;
        } else {
            clearInterval(iv);
            setTimeout(() => {
                document.getElementById('boot').classList.remove('active');
                document.getElementById('loading').classList.add('active');
                loadingSequence();
            }, 600);
        }
    }, 200);
}

function loadingSequence() {
    const iv = setInterval(() => {
        const f = document.querySelector('.load-fill');
        let p = parseFloat(f.style.width) || 0;
        p += Math.random() * 5 + 2;
        if (p > 100) p = 100;
        f.style.width = p + '%';
        if (p >= 100) {
            clearInterval(iv);
            setTimeout(() => {
                document.getElementById('loading').classList.remove('active');
                document.getElementById('cockpit').classList.add('active');
            }, 600);
        }
    }, 50);
}
