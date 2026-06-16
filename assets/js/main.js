/**
 * AVINASH ZALA — PORTFOLIO ENTRY POINT (ES Module)
 * Loaded by Vite via <script type="module" src="assets/js/main.js">
 */

import { initPortfolio } from './app.js';

// Modules with type="module" are deferred and run after full DOM parse.
// Calling init directly here (no DOMContentLoaded) is correct and ensures
// the loading screen is hidden once textures and sections are ready.
try {
  initPortfolio();
} catch (e) {
  console.error('[3D Portfolio] Top-level init error:', e);
  // Last-resort: remove loader if even the constructor blew up
  const l = document.getElementById('loading');
  if (l && l.parentNode) l.parentNode.removeChild(l);
}
