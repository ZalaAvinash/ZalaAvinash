/**
 * SCENE SETUP — Three.js renderer, camera, lights, and helpers.
 */
import * as THREE from 'three';

export function createScene(canvas, isMobile = false) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070a, 68, 210);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.5, 420);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile, // save a bit on mobile
    alpha: false,
    powerPreference: 'high-performance'
  });
  // Lower pixel ratio on mobile for performance (still looks good)
  const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const hemi = new THREE.HemisphereLight(0x334455, 0x05070a, 0.65);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0x3b82f6, 1.05);
  key.position.set(12, 28, 16);
  scene.add(key);
  const fill = new THREE.PointLight(0x22c55e, 0.55, 200);
  fill.position.set(-18, -6, -12);
  scene.add(fill);
  const rim = new THREE.PointLight(0x60a5fa, 0.5, 160);
  rim.position.set(-4, 14, -30);
  scene.add(rim);
  const soft = new THREE.PointLight(0xffffff, 0.25, 300);
  soft.position.set(0, 10, -60);
  scene.add(soft);

  return { scene, camera, renderer };
}

/**
 * Generate a fallback canvas texture with a gradient + label.
 */
export function createFallbackTexture(label, color1 = '#1e3a5f', color2 = '#0f1624') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1024, 640);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 640);
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 48px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label || 'PROJECT', 512, 340);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Load all textures with fallback support.
 * Uses new URL(..., import.meta.url) so Vite processes the assets for both
 * dev server and production build (images get emitted to dist/assets/ with
 * correct final URLs). Also works for direct file:// open of index.html.
 */
export async function loadTextures(onProgress) {
  const loader = new THREE.TextureLoader();

  // Robust asset URL resolution:
  // - Preferred: new URL(..., import.meta.url) for Vite dev + production build (correct hashed paths).
  // - Fallback: plain relative strings 'assets/images/...' — this works reliably for
  //   direct file:// open of index.html on Windows (no bundler) and any environment
  //   where import.meta asset resolution is restricted.
  let img1, img2, img3, img4, profileUrl;
  try {
    img1 = new URL('../images/1.jpg', import.meta.url).href;
    img2 = new URL('../images/2.jpg', import.meta.url).href;
    img3 = new URL('../images/3.jpg', import.meta.url).href;
    img4 = new URL('../images/4.jpg', import.meta.url).href;
    profileUrl = new URL('../images/profile/Profile.jpg', import.meta.url).href;
  } catch (e) {
    // Direct file open or restricted environment fallback
    console.warn('[3D] import.meta URL resolution failed, using relative paths for textures');
    img1 = 'assets/images/1.jpg';
    img2 = 'assets/images/2.jpg';
    img3 = 'assets/images/3.jpg';
    img4 = 'assets/images/4.jpg';
    profileUrl = 'assets/images/profile/Profile.jpg';
  }

  const paths = [img1, img2, img3, img4];
  const fallbacks = ['AIRIS ERP', 'INSURANCE', 'TWITTER INTEL', 'TRADING'];

  const load = (p, fb) => new Promise(r => {
    loader.load(
      p,
      t => { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; r(t); },
      undefined,
      () => { console.warn(`[3D] Texture load failed: ${p}`); r(createFallbackTexture(fb)); }
    );
  });

  const textures = await Promise.all(paths.map((p, i) => load(p, fallbacks[i])));
  const profileTexture = await new Promise(r => {
    loader.load(
      profileUrl,
      t => { t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; r(t); },
      undefined,
      () => { console.warn('[3D] Profile load failed'); r(createFallbackTexture('AVINASH', '#0a1628', '#1e3a5f')); }
    );
  });

  return { textures, profileTexture };
}

/**
 * Dispose an object and its children recursively.
 */
export function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
    else obj.material.dispose();
  }
  if (obj.children) {
    while (obj.children.length) {
      disposeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }
  }
}