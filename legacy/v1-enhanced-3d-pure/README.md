# Avinash Zala — Space Portfolio (Ultra Cinematic 3D)

AAA-quality interactive space portfolio built with real-time Three.js (WebGL).

**No video files are used at runtime** — everything is procedural + GPU-animated for perfect loops, zero bandwidth waste, and full interactivity.

## Features Implemented (from detailed 16-section spec)
- **Starfield**: 3 parallax layers (4000/3000/5000), color variants, twinkling, random shooting stars/comets with trails.
- **Nebula**: 4 layered volumetric clouds, slow rotation, color/hue shift, floating.
- **Sun/Star**: Multi-layer (core + 3 coronas), procedural flowing surface, pulsing, solar flare particles, rotation, solar wind.
- **5 Planets** (unique):
  - Cyan rocky (ABOUT) — continents, atmosphere, clouds
  - Orange gas giant w/ rings (SKILLS) — banded, storm, ring particles
  - Purple rocky (PROJECTS)
  - Magenta ice (EXPERIENCE) — crystal particle swarm
  - Green lava (CONTACT) — flowing emissive "lava" texture + ember particles
- **Moons**: 3+ orbiting with tilt + tidal-ish rotation.
- **Space Station**: Rotating core/ring, solar panels tracking sun, blinking antenna, window lights.
- **Wormhole**: Full sequence — cylinder tunnel, 42 energy rings, hyperspace grid lines, 9 animated lightning arcs, star radial streaking on entry, FOV warp.
- **Ambient**: 380+ asteroid belt (points + rocks), 4 flying ships w/ engine glow, space dust, distant spiral galaxy + black hole accretion disk.
- **Particles**: 8+ systems (engine, solar wind, ice, lava, gas wisps, comets, flares...).
- **Post FX**: Additive glows/bloom simulation, CSS chromatic aberration + vignette + scanlines, HDR-ish feel.
- **Interactions**: Raycast planet click = engage warp, hover halos/glows, mouse space parallax, click ripples, crosshair press feedback, camera approach + shake on sector arrival.
- **UI/UX**: Glassmorphism panels (blur + depth), 3D press/hover/lift on all controls, typewriter boot, glitch loading, full HUD radar + nav.
- **Audio**: Procedural Web Audio (low drone + warp whoosh + UI blips) — starts on gesture, no files.
- **Sector system**: 6 sectors (LAUNCH + 5 planets), smooth warp + arrival sequences.

## Tech
- Three.js r128 (no extra libs)
- Pure canvas procedural textures (no external image downloads for planets)
- CSS + WebGL hybrid post effects
- ~ self contained, fast load

## Project Structure (clean)
```
index.html
assets/
  css/style.css
  js/{space3d.js, script.js}
  images/profile/Profile.jpg
  videos/          # reference only (see README.md inside)
Resume/
```

## Development
Open index.html in modern browser (Chrome/Edge/Firefox). 
Click planets or use right-side nav or arrow keys. Escape returns to LAUNCH.

Performance target: 60fps on mid-range GPU (stars/particles optimized, no heavy per-frame canvas redraws except initial).

## Videos folder
Large category videos are **references** (what was prototyped or sourced). Real-time implementation is superior for this use-case (see assets/videos/README.md).

## Future (optional)
- GLTF ship/station models for extra detail (current are procedural meshes)
- Real high-res planet textures (current procedural is intentional)
- More post (custom EffectComposer + UnrealBloom if deps allowed)
- VR/pointer lock mode

Built to feel like a cinematic sci-fi cockpit UI.
```

## Credits / Thanks
- Three.js community
- Orbitron + Inter fonts
- Font Awesome icons
