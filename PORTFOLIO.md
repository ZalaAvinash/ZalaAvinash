# Portfolio — 3D Systems Architect

**Pure Three.js 3D immersive portfolio** built from scratch. Camera travels a spline journey through your work as you scroll. Drag to orbit, click objects to inspect with real data.

---

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

---

## Tech Stack

- **Three.js** — WebGL 3D rendering
- **Vanilla JS** — no frameworks, no build tools, no dependencies
- **CSS** minimal — only what the 3D overlay needs

---

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

---

## Project Structure

```
index.html                    — Single HTML file with inline CSS
assets/
  css/style.css               — Overlay CSS
  js/
    main.js                   — Entry point
    app.js                    — Portfolio orchestrator
    data.js                   — Skills, projects, experience data
    scene.js                  — Three.js renderer, camera, lights
    modules/
      hero.js                 — Hero section (architecture layers)
      skills.js               — Skills constellation
      projects.js             — Project gallery
      experience.js           — Experience path
      lab.js                  — Interactive lab particles
      contact.js              — Contact section
      environment.js          — Ambient environment
      journey.js              — Journey trail
      audio-engine.js         — Subtle ambient audio
      interaction-handler.js  — Mouse/touch interactions
      ui-manager.js           — UI labels, progress dots, info panels
      reel-player.js          — Cinematic auto-tour
  images/                     — HD textures + profile photo
Resume/Resume.docx            — Downloadable CV
```

---

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome/Edge recommended for best performance
- Touch devices supported with optimized controls