# Avinash Zala — Space Portfolio (Cinematic Hybrid)

**Ultra-realistic space portfolio** built from scratch as a hybrid of:
- Your provided high-quality video clips (heavy use for backgrounds, loading, warp, arrivals)
- Powerful real-time Three.js 3D (interactive clickable planets, station, asteroids, particles, camera work)
- Cinematic glassmorphism HUD + post effects

This directly implements the detailed 16-section animation spec you provided, with special emphasis on the "SPECIFIC VIDEOS NEEDED" list.

## Architecture (Hybrid)
- **Video layers** (bottom): Your 11 MP4s used as first-class cinematic elements (rocket launch, wormhole travel, planet arrivals, nebula/starfield ambience, etc.).
- **Three.js canvas** (above videos): Real 3D interactive objects — 5 unique planets you can aim at and fly to, asteroid belt, flying ships, station details, dynamic particles, wormhole energy that layers on top of video.
- **Always-present**: Film-grade HUD, crosshair, glass content panels, ripples, camera shakes, procedural audio.

## Quick Start
1. Open `index.html` in a modern browser (Chrome/Edge recommended).
2. The experience starts with the rocket launch video (one of your clips) during loading.
3. Click planets (raycast) or use the right-side nav dots / arrow keys.
4. Every sector transition features your wormhole/arrival videos + 3D effects.

## Important: Video Size & Compression
Your original videos total ~280 MB. For a real public portfolio this is heavy.

**Strongly recommended before publishing:**
```bash
# Example for the most important clips (install ffmpeg)
ffmpeg -i "assets/videos/ROCKET - SPACESHIP VIDEOS.mp4" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 48k -vf "scale=1280:-1" assets/videos/rocket.webm

ffmpeg -i "assets/videos/WORMHOLE ANIMATIONS.mp4" -c:v libvpx-vp9 -crf 31 -b:v 0 -vf "scale=1280:-1" assets/videos/wormhole.webm
```

Then update `assets/js/config.js` videoRoles to point to the smaller .webm versions.

Target: Bring the actively used clips under 15-25 MB combined.

A "lite mode" (more 3D, fewer videos) is always possible by modifying VideoManager calls.

## Project Structure
```
index.html
assets/
  css/style.css
  js/{config.js, video-manager.js, three-engine.js, audio.js, app.js}
  images/profile/Profile.jpg
  videos/          # your 11 original clips + compression notes
  textures/        # for future high-res planet maps
  models/          # for future GLB ships/station
Resume/
legacy/            # previous pure-3D enhanced version (for reference)
```

## Key Features from Your Spec
- Starfield (3 parallax layers + comets)
- Nebula / gas clouds (video + 3D layers)
- Sun with flares
- 5 distinct planets with atmospheres, rings, moons, flowing surfaces, ice crystals, lava embers
- Space station with details
- Full wormhole sequence (your video + 3D energy rings/lines on top)
- Rocket launch loading (your video)
- Sector arrival videos + 3D camera approach + shake
- Asteroids, flying ships, ambient particles
- Mouse warp cursor, click ripples, 3D hover/click planets
- Glassmorphism panels with 3D press effects
- Procedural audio (drone + whooshes)

## Development Notes
- **All 11 of your videos are now actively used** (not just references). See `assets/videos/README.md` for the exact mapping:
  - Main ones: Rocket (loading), Wormhole (transitions + 3D overlays), Arrivals, Planet/Starfield/Nebula (backgrounds), Station, Sun.
  - Overlays: MOON ANIMATIONS (for moon sectors), PARTICLE EFFECTS (layered on warps), POST-PROCESSING (loading calibration + flair).
- All video roles are configured in `assets/js/config.js` — easy to remap which of your clips is used where.
- ThreeEngine reduces particle/star density when a rich video background is active.
- The system gracefully falls back if a video fails to play.
- **Cinematic / Performance toggle**: Click the "MODE" item in the top HUD.
  - CINEMATIC (default): Uses your videos heavily for backgrounds and sequences (as requested).
  - PERFORMANCE: Disables videos, runs full real-time 3D + the built-in CSS cinematic overlays for warp/arrival. Much lighter on bandwidth/GPU. Preference is saved in localStorage.
- You can also call `window.toggleCinematicMode()` from the console.

Built to feel like a real sci-fi cockpit UI with your collected cinematic footage as the soul.

Enjoy the launch. 🚀
