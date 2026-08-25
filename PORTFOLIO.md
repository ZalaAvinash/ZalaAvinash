# Portfolio — Avinash Zala

A clean, content-first **editorial / glassmorphism** single-page portfolio for a Senior Full-Stack Systems Architect. Built with vanilla JS (ES modules) + Vite, no framework, no 3D.

---

## What It Is

A fast, accessible, responsive portfolio with:

- **Hero** — name, role, tagline, and key stats
- **About** — narrative + competency tags
- **Skills** — proficiency bars grouped by Frontend / Backend / Cloud / Data
- **Projects** — responsive card grid with real imagery, tech tags, impact
- **Experience** — vertical timeline
- **Lab** — process steps + client testimonials
- **Contact** — email / phone / LinkedIn / CV cards

## Tech Stack

- **Vite** — build & dev tooling
- **Vanilla JS (ES modules)** — no UI framework
- **CSS** — custom design system (light editorial base, glass cards, reveal animations)
- **Google Fonts** — Inter + Space Grotesk

## Project Structure

```
index.html              — Page structure + meta/OG tags
assets/
  css/style.css         — Full design system
  js/
    main.js             — Renders sections from data, nav, scroll-reveal, deep-link
    data.js             — All content (single source of truth)
public/
  images/               — Project + profile imagery (served at /images/*)
Resume/Resume.docx      — Downloadable CV
```

## Features

- **Responsive** — mobile hamburger drawer, fluid type, breakpoints at 768/520px
- **Scroll reveal** — IntersectionObserver fade/slide-ins
- **Active nav** — highlights the section in view
- **Deep link** — `?at=projects` scrolls to a section on load
- **Accessible** — semantic landmarks, aria labels, `prefers-reduced-motion` support

## Browser Support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). No WebGL required.
