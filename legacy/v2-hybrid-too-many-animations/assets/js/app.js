/**
 * APP — Main orchestrator for the hybrid cinematic space portfolio.
 * State machine + wiring between VideoManager, ThreeEngine, and UI.
 * Clean from-scratch structure.
 */

let currentSector = 0;
let isWarping = false;
let isArriving = false;

// Cinematic mode (heavy video use) vs Performance (pure 3D + CSS fallbacks)
// Default true because user requested heavy use of the videos.
// Can be toggled at runtime and is persisted.
let cinematicMode = true;

let sectors = []; // populated after config is guaranteed
const planets3D = []; // populated after Three init

// Convenience
const $ = id => document.getElementById(id);

// === INITIALIZATION ===
window.addEventListener('load', async () => {
  // Restore mode preference
  const saved = localStorage.getItem('cinematicMode');
  if (saved !== null) cinematicMode = saved === 'true';

  // Initial defensive clean of any CSS overlay animations that could overwrite videos
  ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('active');
  });

  // Ensure sectors from config (safe after all scripts loaded)
  sectors = window.PORTFOLIO_CONFIG?.sectors || [];

  // 1. Init 3D
  const canvas = $('space');
  const three = new window.ThreeEngine();
  three.init(canvas);
  three.start();

  // Expose for debug / other modules
  window.THREE_ENGINE = three;

  // Apply initial mode to 3D engine (before any video starts)
  if (window.THREE_ENGINE && !cinematicMode) {
    window.THREE_ENGINE.setBackgroundVideoActive(false);
  }

  // 2. Populate interactive planets
  three.state.planets.forEach(p => {
    if (p.userData.sectorId !== undefined) {
      planets3D.push(p);
    }
  });

  // 3. Boot sequence (pure UI)
  bootSequence();

  // 4. Wire interactions (raycast, hover, nav, keyboard)
  wireInteractions(three);

  // 5. Initial sector UI + audio (will resume on gesture)
  updateNav(0);
  updateModeUI();
  if (window.initAudio) window.initAudio();
});

// === BOOT + LOADING (now video-driven) ===
function bootSequence() {
  const lines = [
    '> INITIALIZING QUANTUM DRIVE...',
    '> CALIBRATING WORMHOLE ENGINE...',
    '> LOADING CINEMATIC ARCHIVES...',
    '> 11 REFERENCE SEQUENCES MOUNTED',
    '> 5 INTERACTIVE SECTOR PLANETS',
    '> HYBRID RENDER PIPELINE READY',
    '> PILOT PROFILE: AVINASH ZALA',
    '> ALL SYSTEMS NOMINAL',
    '> READY FOR LAUNCH'
  ];
  const el = $('bootLines');
  let i = 0;

  const iv = setInterval(() => {
    if (i < lines.length) {
      const p = document.createElement('p');
      p.textContent = lines[i++];
      el.appendChild(p);
    } else {
      clearInterval(iv);
      setTimeout(() => {
        $('boot').classList.remove('active');
        $('loading').classList.add('active');
        startCinematicLoading();
      }, 520);
    }
  }, 175);
}

async function startCinematicLoading() {
  const fill = document.querySelector('.load-fill');
  const status = $('loadStatus');

  // Play the rocket launch video if cinematic mode (heavy video use!)
  status.textContent = cinematicMode ? 'Playing launch sequence...' : 'Loading systems...';

  const canvasEl = $('space');
  if (cinematicMode) {
    // For pure cinematic loading video, dim the 3D canvas so it doesn't overwrite the rocket footage
    if (canvasEl) canvasEl.style.transition = 'opacity .3s';
    if (canvasEl) canvasEl.style.opacity = '0.15';
  }

  if (cinematicMode && window.VideoManager) {
    try {
      await window.VideoManager.play('loading', {
        fadeDuration: 280,
        onProgress: (pct) => {
          fill.style.width = pct + '%';
        }
      });
    } catch (e) {
      console.warn('Rocket video unavailable, using procedural loading');
      await fakeProgress(fill);
    }
  } else {
    await fakeProgress(fill);
  }

  // Restore canvas after loading video
  if (canvasEl) {
    canvasEl.style.opacity = '1';
  }

  // Small settle
  await new Promise(r => setTimeout(r, 380));

  $('loading').classList.remove('active');
  $('cockpit').classList.add('active');

  // Play a short post-processing calibration overlay (uses POST-PROCESSING video)
  if (cinematicMode && window.VideoManager) {
    window.VideoManager.playOverlay('post', { opacity: 0.18, fadeDuration: 400 }).catch(() => {});
  }

  // Enter main cockpit with default background video
  enterCockpit(0);
}

async function fakeProgress(fill) {
  return new Promise(resolve => {
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 6 + 3.5;
      if (p > 100) p = 100;
      fill.style.width = p + '%';
      if (p >= 100) {
        clearInterval(iv);
        resolve();
      }
    }, 48);
  });
}

// === CINEMATIC / PERFORMANCE MODE (lite mode per plan) ===
function updateModeUI() {
  const toggle = $('modeToggle');
  const valueEl = $('modeValue');
  if (!toggle || !valueEl) return;

  if (cinematicMode) {
    toggle.classList.remove('perf');
    valueEl.textContent = 'CINEMATIC';
    toggle.title = 'Cinematic mode: Using your video clips for ultra-realistic backgrounds and sequences. Click to switch to Performance (lighter, 3D only).';
  } else {
    toggle.classList.add('perf');
    valueEl.textContent = 'PERFORMANCE';
    toggle.title = 'Performance mode: Videos disabled, full real-time 3D + CSS effects. Click to enable Cinematic (uses large video files).';
  }
}

function setCinematicMode(enabled) {
  cinematicMode = !!enabled;
  localStorage.setItem('cinematicMode', cinematicMode);

  const three = window.THREE_ENGINE;

  if (cinematicMode) {
    // Enable videos
    // Make sure no stray CSS overlay animations are active
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = $(id);
      if (el) el.classList.remove('active');
    });
    if (three) three.setBackgroundVideoActive(true);
    // Re-apply current sector background video
    const sector = window.getSector(currentSector);
    const role = sector?.videoRole || 'background-default';
    if (window.VideoManager) {
      window.VideoManager.play(role, { fadeDuration: 400 }).catch(() => {});
    }
  } else {
    // Disable videos - go pure 3D + CSS fallbacks
    if (window.VideoManager) window.VideoManager.stopAll();
    if (three) {
      three.setBackgroundVideoActive(false);
      three.setWarpIntensity(0);
    }
    // Hide any active video overlays (perf uses the CSS ones instead)
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = $(id);
      if (el) el.classList.remove('active');
    });
    // Also clean up any dynamic overlay videos (moon, particle, post)
    ['video-overlay-moon', 'video-overlay-particle', 'video-overlay-post'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = '0';
        try { el.pause(); } catch (_) {}
      }
    });
  }

  updateModeUI();
}

function cleanupAllOverlays() {
  // Helper to stop all possible overlay videos
  ['video-overlay-moon', 'video-overlay-particle', 'video-overlay-post'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.transition = 'opacity .3s';
      el.style.opacity = '0';
      setTimeout(() => { try { el.pause(); } catch (_) {} }, 400);
    }
  });
}

function toggleCinematicMode() {
  setCinematicMode(!cinematicMode);
}

// === MAIN COCKPIT ENTRY ===
async function enterCockpit(sectorId = 0) {
  currentSector = sectorId;
  updateNav(sectorId);

  const sector = window.getSector(sectorId);
  $('sectorName').textContent = sector?.name || 'LAUNCH';

  // Set ambient background: video if cinematic, otherwise pure 3D
  const role = sector?.videoRole || 'background-default';
  if (cinematicMode && window.VideoManager) {
    await window.VideoManager.play(role, { fadeDuration: 650 }).catch(() => {});
    if (window.THREE_ENGINE) window.THREE_ENGINE.setBackgroundVideoActive(true);
  } else {
    if (window.VideoManager) window.VideoManager.stopAll();
    if (window.THREE_ENGINE) window.THREE_ENGINE.setBackgroundVideoActive(false);
  }

  if (window.THREE_ENGINE) {
    if (sectorId > 0 && sector?.planet) {
      window.THREE_ENGINE.focusPlanet(sector.planet);
    } else {
      window.THREE_ENGINE.clearCameraTarget();
    }
  }
}

// === SECTOR NAVIGATION (the heart of the experience) ===
async function gotoSector(targetId) {
  if (isWarping || isArriving || targetId === currentSector) return;

  isWarping = true;

  const sector = window.getSector(targetId);
  if (!sector) { isWarping = false; return; }

  // Hide panel
  $('contentPanel').classList.remove('active');

  // Clean previous overlays before new transition
  if (cinematicMode) cleanupAllOverlays();

  // HUD ramp
  const speedFill = $('speedFill');
  const speedTxt = $('warpSpeed');
  if (speedFill) speedFill.style.width = '99%';
  if (speedTxt) speedTxt.textContent = '9.8';

  $('sectorName').textContent = sector.name + ' • INCOMING';

  // 1. Start warp: video (if cinematic) + always 3D warp effects (hybrid power)
  let warpPromise = Promise.resolve();
  const canvasEl = $('space');
  if (cinematicMode && window.VideoManager) {
    warpPromise = window.VideoManager.play('warp', { fadeDuration: 180 });
    // Layer particle effects on top of the wormhole video (uses PARTICLE EFFECTS video)
    window.VideoManager.playOverlay('particle', { opacity: 0.22, fadeDuration: 250 }).catch(() => {});

    // Dim the canvas more during wormhole video travel so the actual video isn't overwritten by 3D rings/streaks/stars
    if (canvasEl) {
      canvasEl.style.transition = 'opacity .25s ease';
      canvasEl.style.opacity = '0.42';
    }
  } else {
    // Pure CSS/3D fallback for warp (the whVideoOverlay is already in HTML/CSS)
    const wo = $('whVideoOverlay');
    if (wo) wo.classList.add('active');
    setTimeout(() => { if (wo) wo.classList.remove('active'); }, 2400);
  }
  if (window.playWarpWhoosh) window.playWarpWhoosh();
  if (window.THREE_ENGINE) {
    window.THREE_ENGINE.triggerWarp();
    window.THREE_ENGINE.setWarpIntensity(1);
  }

  // 2. Mid-warp: update 3D focus + sector state
  setTimeout(() => {
    currentSector = targetId;
    updateNav(targetId);

    if (window.THREE_ENGINE && sector.planet) {
      window.THREE_ENGINE.focusPlanet(sector.planet);
    }
  }, 980);

  // 3. After warp moment → arrival
  await warpPromise;

  isWarping = false;
  isArriving = true;

  // Arrival sequence (video if cinematic + 3D camera work)
  await playArrivalSequence(targetId, sector);

  isArriving = false;

  // Settle
  if (speedFill) speedFill.style.width = '38%';
  if (speedTxt) speedTxt.textContent = '1.0';

  $('cockpit').classList.add('active');

  // Restore full canvas after video warp moment (for hybrid 3D visibility)
  const canvasEl2 = $('space');
  if (canvasEl2) {
    canvasEl2.style.transition = 'opacity .3s';
    canvasEl2.style.opacity = '1';
  }

  // Stop particle overlay after warp + restore canvas
  if (cinematicMode) {
    const particleOverlay = document.getElementById('video-overlay-particle');
    if (particleOverlay) {
      particleOverlay.style.transition = 'opacity .35s';
      particleOverlay.style.opacity = '0';
      setTimeout(() => {
        try { particleOverlay.pause(); } catch (_) {}
      }, 400);
    }
  }

  // Ensure canvas is fully visible after the wormhole video moment
  const canvasEl3 = $('space');
  if (canvasEl3) {
    canvasEl3.style.transition = 'opacity .4s ease';
    canvasEl3.style.opacity = '1';
  }

  // Show panel for non-launch sectors
  if (targetId > 0) {
    if (window.playUIBlip) window.playUIBlip(true);
    showPanel(targetId);
  }

  // Restore ambient background for the new sector (video or pure 3D depending on mode)
  if (cinematicMode && window.VideoManager) {
    const ambientRole = sector.videoRole || 'background-default';
    window.VideoManager.crossfade(ambientRole, 720).catch(() => {});
    if (window.THREE_ENGINE) window.THREE_ENGINE.setBackgroundVideoActive(true);
  } else {
    if (window.VideoManager) window.VideoManager.stopAll();
    if (window.THREE_ENGINE) window.THREE_ENGINE.setBackgroundVideoActive(false);
  }

  if (window.THREE_ENGINE) {
    window.THREE_ENGINE.setWarpIntensity(0);
    window.THREE_ENGINE.endWarp();
  }
}

async function playArrivalSequence(sectorId, sector) {
  const canvasEl = $('space');
  let arrivalP = Promise.resolve();

  if (cinematicMode && window.VideoManager) {
    // Dim canvas a bit during arrival video so the realistic footage isn't completely overwritten by 3D
    if (canvasEl) {
      canvasEl.style.transition = 'opacity .25s';
      canvasEl.style.opacity = '0.7';
    }
    arrivalP = window.VideoManager.play('arrival', { fadeDuration: 260 });
  } else {
    // Pure CSS arrival flash fallback (already styled in CSS)
    const ao = $('sectorArrivalVideo');
    if (ao) ao.classList.add('active');
    setTimeout(() => { if (ao) ao.classList.remove('active'); }, 2100);
  }

  // 3D camera approach + shake (always, for power)
  if (window.THREE_ENGINE && sector.planet) {
    const three = window.THREE_ENGINE;
    three.state.arrivalDolly = true;

    const cam = three.state.camera;
    const orig = cam.position.clone();
    const tgt = new THREE.Vector3(...sector.planet.position)
      .multiplyScalar(0.58)
      .add(new THREE.Vector3(0.1, 0.7, 2.2));

    const start = performance.now();
    const dur = 860;

    const step = () => {
      const k = Math.min((performance.now() - start) / dur, 1);
      cam.position.lerpVectors(orig, tgt, k * 0.62);
      cam.lookAt(...sector.planet.position);
      if (k < 1) requestAnimationFrame(step);
      else {
        three.state.arrivalDolly = false;
        setTimeout(() => three.focusPlanet(sector.planet), 280);
      }
    };
    step();

    // Light camera shake
    setTimeout(() => triggerCameraShake(0.7, 580, three), 420);
  }

  await arrivalP;

  // If cinematic, fade the arrival video and restore canvas
  if (cinematicMode && window.VideoManager) {
    await window.VideoManager.fadeOutCurrent(480);
    if (canvasEl) canvasEl.style.opacity = '1';
  } else if (canvasEl) {
    canvasEl.style.opacity = '1';
  }

  // For sectors with moons, play moon footage as a nice overlay (uses MOON ANIMATIONS video)
  if (cinematicMode && window.VideoManager && sector.planet && sector.planet.hasMoon) {
    setTimeout(() => {
      window.VideoManager.playOverlay('moon', { opacity: 0.22, fadeDuration: 600 }).catch(() => {});
      // Auto-hide the moon overlay after some time so it doesn't stay forever
      setTimeout(() => {
        const moonOverlay = document.getElementById('video-overlay-moon');
        if (moonOverlay) {
          moonOverlay.style.transition = 'opacity .6s';
          moonOverlay.style.opacity = '0';
          setTimeout(() => { try { moonOverlay.pause(); } catch (_) {} }, 700);
        }
      }, 6500);
    }, 1200);
  }
}

// === UI HELPERS ===
function updateNav(activeId) {
  document.querySelectorAll('.pnav-btn').forEach(b => {
    const idx = parseInt(b.dataset.idx);
    b.classList.toggle('active', idx === activeId);
  });
}

function showPanel(sectorId) {
  const sector = window.getSector(sectorId);
  if (!sector || !sector.panel) return;

  const p = sector.panel;
  $('panelContent').innerHTML = `<h1>${p.title}</h1><h2>${p.subtitle}</h2>${p.body}`;
  $('contentPanel').classList.add('active');
}

function triggerCameraShake(intensity = 0.7, duration = 520, three = window.THREE_ENGINE) {
  if (!three || !three.state.camera) return;
  const cam = three.state.camera;
  const bx = cam.position.x, by = cam.position.y;
  const t0 = performance.now();

  const tick = () => {
    const k = Math.min((performance.now() - t0) / duration, 1);
    if (k >= 1) { cam.position.x = bx; cam.position.y = by; return; }
    const amp = intensity * (1 - k) * 0.2;
    cam.position.x = bx + (Math.random() - 0.5) * amp;
    cam.position.y = by + (Math.random() - 0.5) * amp * 0.65;
    requestAnimationFrame(tick);
  };
  tick();
}

// === INTERACTIONS ===
function wireInteractions(three) {
  // Raycast click on planets
  document.addEventListener('click', e => {
    if (isWarping || isArriving) return;

    const rect = $('space').getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const hit = three.getIntersectedPlanet(ndc);
    if (hit && hit.userData?.sectorId !== undefined) {
      // Nice press feedback
      const ch = document.querySelector('.crosshair');
      if (ch) ch.style.transform = 'translate(-50%,-50%) scale(0.58)';
      setTimeout(() => { if (ch) ch.style.transform = 'translate(-50%,-50%) scale(1)'; }, 160);

      spawnClickRipple(e.clientX, e.clientY);
      gotoSector(hit.userData.sectorId);
    }
  });

  // Hover
  document.addEventListener('mousemove', e => {
    if (isWarping || isArriving) return;
    const rect = $('space').getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const hit = three.getIntersectedPlanet(ndc);
    const hovered = hit || null;

    planets3D.forEach(p => three.setPlanetHover(p, p === hovered));

    const cp = $('cockpit');
    if (cp) cp.classList.toggle('planet-hover', !!hovered);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
  });

  // Mousedown warp-cursor feel
  document.addEventListener('mousedown', e => {
    if (isWarping || isArriving) return;
    const ch = document.querySelector('.crosshair');
    if (ch && (e.target.id === 'space' || e.target.closest('#cockpit'))) {
      ch.style.transform = 'translate(-50%,-50%) scale(1.36)';
    }
  });
  document.addEventListener('mouseup', () => {
    const ch = document.querySelector('.crosshair');
    if (ch) ch.style.transform = 'translate(-50%,-50%) scale(1)';
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (isWarping || isArriving) return;
    if (e.key === 'ArrowRight') gotoSector(Math.min(currentSector + 1, 5));
    if (e.key === 'ArrowLeft') gotoSector(Math.max(currentSector - 1, 0));
    if (e.key === 'Escape') {
      $('contentPanel').classList.remove('active');
      if (currentSector !== 0) gotoSector(0);
    }
  });

  // Nav dots
  const nav = $('planetNav');
  nav.innerHTML = sectors.map(s => 
    `<div class="pnav-btn${s.id === 0 ? ' active' : ''}" data-idx="${s.id}" data-name="${s.name}"></div>`
  ).join('');

  nav.querySelectorAll('.pnav-btn').forEach(btn => {
    btn.addEventListener('click', () => gotoSector(parseInt(btn.dataset.idx)));
  });

  // Panel close
  $('panelClose')?.addEventListener('click', () => $('contentPanel').classList.remove('active'));

  // Mode toggle
  const modeToggle = $('modeToggle');
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      toggleCinematicMode();
      // If currently in a transition, it will take effect on next action
    });
  }
}

function spawnClickRipple(x, y) {
  const r = document.createElement('div');
  r.className = 'click-ripple';
  r.style.left = x + 'px';
  r.style.top = y + 'px';
  r.style.width = r.style.height = '26px';
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 620);
}

// Optional: expose goto for console / future buttons
window.gotoSector = gotoSector;
window.toggleCinematicMode = toggleCinematicMode;
window.setCinematicMode = setCinematicMode;