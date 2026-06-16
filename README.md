# Avinash Zala — 3D Systems Architect Portfolio

**Pure Three.js 3D immersive portfolio** built from scratch. Camera travels a spline journey through your work as you scroll. Drag to orbit, click objects to inspect with real data.

## What It Is

A single-page 3D experience with:
- **6 sections**: About, Skills, Projects, Experience, Lab, Contact
- **3D hero architecture** with animated layers (UI, API, Domain, Data, Cloud)
- **Skills constellation** with layered glowing orbs and data links
- **Project gallery** with HD texture planes, 3D frames, orbiting tech nodes
- **Experience path** with 3D monolith milestones and floating testimonials
- **Interactive lab** with mouse-driven particle system
- **Bidirectional knowledge graph**: hover a skill → highlights related projects (and vice versa)
- **Architecture Explorer**: click hero layers to see cross-world connections
- **Subtle ambient audio**: data flows, inspect tones, soft drone
- **Deep linking**: `?p=0.42` or `?at=projects`
- **"Play Reel"** cinematic auto-tour
- **View capture** and **copy link** for sharing

## Tech Stack

- **Three.js r162** — WebGL 3D rendering
- **Vanilla JS** — no frameworks, no build tools, no dependencies
- **CSS** minimal — only what the 3D overlay needs (~100 lines)

## Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge recommended)
2. Scroll or swipe to journey through the 3D world
3. Click any object to inspect details
4. Use the top nav or bottom progress dots to jump between sections
5. Press `R` for the auto-reel tour

## Project Structure

```
index.html                    — Single HTML file with inline CSS
assets/
  css/style.css               — Minimal overlay CSS (~100 lines)
  js/
    config.js                 — Empty placeholder (data lives in app.js)
    app.js                    — Entire 3D experience (~2200 lines)
  images/
    1.jpg .. 4.jpg            — HD project texture renders
    profile/Profile.jpg       — Profile photo (or fallback)
  videos/                     — Legacy video assets (not used)
  textures/                   — Placeholder for future texture maps
  models/                     — Placeholder for future 3D models
Resume/
  Resume.docx                 — Downloadable CV
legacy/                       — Previous cinematic/video versions (for reference)
  v1-enhanced-3d-pure/
  v2-hybrid-too-many-animations/
```

## Controls

| Action | Input |
|--------|-------|
| Navigate | Scroll / arrow keys / swipe |
| Orbit | Drag canvas |
| Inspect | Click object |
| Jump to section | Top nav / bottom dots |
| Play auto-reel | `R` key or PLAY REEL button |
| Close info panel | Click panel / `Escape` |
| Capture screenshot | CAPTURE button |
| Copy deep link | COPY LINK button |
| Dispose resources | `window.disposePortfolio()` |

## Key Improvements Made

- **Removed** dead code in `config.js` (orphaned video/sector config)
- **Stripped** CSS from 756 to ~100 lines (removed 60% unused legacy styles)
- **Updated** Three.js from r128 (2021) to r162 (2025)
- **Added** texture load error handling with canvas fallbacks
- **Added** `dispose()` method for Three.js resource cleanup
- **Added** `window.disposePortfolio()` for manual cleanup

## Development Notes

- The entire 3D experience is in `assets/js/app.js` as a single `PortfolioExperience` class
- To customize data (skills, projects, experience), edit the `portfolioData` object at the top of `app.js`
- For deeper architectural changes, consider splitting `app.js` into modules (scene, sections, audio, interactions, particles)
- The legacy `assets/videos/` folder contains 11 original MP4 clips from a previous cinematic version (not used)

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome/Edge recommended for best performance
- Touch devices supported with optimized controls