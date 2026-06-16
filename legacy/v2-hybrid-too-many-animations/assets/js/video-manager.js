/**
 * VIDEO MANAGER — Handles all cinematic video playback for the hybrid portfolio.
 * Supports the user's 11 provided videos as first-class citizens.
 * Play modes: 'once', 'loop', 'once-then-loop'
 * Designed to work alongside the Three.js engine (videos as beautiful bases, 3D on top).
 */

class VideoManager {
  constructor() {
    this.videos = {};           // role -> <video> element
    this.currentRole = null;
    this.isPlaying = false;
    this.config = window.PORTFOLIO_CONFIG || {};
    this.videoBasePath = 'assets/videos/';

    // Pre-create the main elements we declared in HTML
    this._bindExistingVideos();
  }

  _bindExistingVideos() {
    // We expect these IDs in index.html
    const ids = ['cinematic-bg', 'rocket-video', 'wormhole-video', 'arrival-video'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'block';
        // Make sure they're ready for programmatic control
        el.muted = true;
        el.playsInline = true;
      }
    });
  }

  /**
   * Get or create a video element for a role.
   * Reuses the dedicated full-bleed ones when appropriate.
   */
  _getVideoEl(role) {
    const roleCfg = this.config.videoRoles?.[role];
    if (!roleCfg) {
      console.warn(`[VideoManager] Unknown role: ${role}`);
      return null;
    }

    // Reuse dedicated elements for the "big" moments
    let el;
    if (role === 'loading') el = document.getElementById('rocket-video');
    else if (role === 'warp') el = document.getElementById('wormhole-video');
    else if (role === 'arrival') el = document.getElementById('arrival-video');
    else el = document.getElementById('cinematic-bg'); // general background

    if (!el) {
      // Fallback: create a new one (should rarely happen)
      el = document.createElement('video');
      el.className = 'cinematic-video';
      el.muted = true;
      el.playsInline = true;
      document.getElementById('video-layers')?.appendChild(el);
    }

    // Set source if not already correct
    const fullSrc = this.videoBasePath + roleCfg.file;
    if (el.src !== fullSrc && !el.src.endsWith(roleCfg.file)) {
      el.src = fullSrc;
      el.load();
    }

    // Store reference
    this.videos[role] = el;
    return el;
  }

  /**
   * Play a video role.
   * Returns a Promise that resolves when the video is ready to be seen
   * or has finished (depending on mode).
   */
  async play(role, options = {}) {
    const roleCfg = this.config.videoRoles?.[role];
    if (!roleCfg) return Promise.resolve(false);

    const video = this._getVideoEl(role);
    if (!video) return Promise.resolve(false);

    const { fadeDuration = 420, onProgress } = options;

    // Defensive: always kill any lingering pure-CSS overlay animations when starting a real video
    // This prevents "overwriting" CSS keyframe animations (wh-spin, streaks, arrival flash) from covering the video content.
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.style.opacity = '0';
      }
    });

    // Stop any currently prominent full video
    this._hideAllFullVideos();

    video.style.transition = `opacity ${fadeDuration}ms ease`;
    video.style.opacity = '0';
    video.classList.add('active');

    // Make sure it's visible in the stacking context
    if (['loading', 'warp', 'arrival'].includes(role)) {
      video.classList.add('cinematic-full');
    } else {
      video.classList.remove('cinematic-full');
    }

    try {
      // Wait for metadata / canplay
      await this._waitForReady(video);

      // Set looping behavior
      const mode = roleCfg.playMode || 'once';
      video.loop = (mode === 'loop' || mode === 'once-then-loop');

      // Start playback (may require user gesture — we call after interaction)
      await video.play().catch(err => {
        console.warn('[VideoManager] play() blocked or failed:', err);
        // Still resolve so the experience can continue with 3D fallback
      });

      // Fade in
      requestAnimationFrame(() => {
        video.style.opacity = '1';
      });

      this.currentRole = role;
      this.isPlaying = true;

      // Optional progress for loading bar etc.
      if (onProgress) {
        const progressHandler = () => {
          if (video.duration) {
            const pct = Math.min((video.currentTime / video.duration) * 100, 100);
            onProgress(pct);
          }
        };
        video.addEventListener('timeupdate', progressHandler, { once: false });
        // Clean up later
        setTimeout(() => video.removeEventListener('timeupdate', progressHandler), 30000);
      }

      // Return promise that resolves on end (for 'once' modes) or immediately for loops
      return new Promise(resolve => {
        if (mode === 'once' || mode === 'once-then-loop') {
          const onEnded = () => {
            video.removeEventListener('ended', onEnded);
            if (mode === 'once-then-loop') {
              video.loop = true;
              video.play().catch(() => {});
            }
            this.isPlaying = false;
            resolve(true);
          };
          video.addEventListener('ended', onEnded, { once: true });

          // Safety timeout in case 'ended' never fires (corrupt clip etc.)
          setTimeout(() => {
            if (this.currentRole === role) {
              this.isPlaying = false;
              resolve(true);
            }
          }, (video.duration || 12) * 1000 + 1500);
        } else {
          // looping — resolve quickly so caller can proceed
          setTimeout(() => resolve(true), 120);
        }
      });
    } catch (e) {
      console.error('[VideoManager] playback error for role', role, e);
      this._hideVideo(video);
      return false;
    }
  }

  /**
   * Crossfade from current background/role to another.
   */
  async crossfade(toRole, duration = 650) {
    const fromVideo = this.videos[this.currentRole];
    const toVideo = this._getVideoEl(toRole);

    if (!toVideo) return this.play(toRole);

    // Defensive hide of CSS overlays during video crossfade
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    // Start the target at 0
    toVideo.style.transition = 'none';
    toVideo.style.opacity = '0';
    toVideo.classList.add('active');

    // Make the target play
    await this._waitForReady(toVideo);
    try { await toVideo.play(); } catch (_) {}

    // Now crossfade
    requestAnimationFrame(() => {
      if (fromVideo) fromVideo.style.transition = `opacity ${duration}ms ease`;
      toVideo.style.transition = `opacity ${duration}ms ease`;

      if (fromVideo) fromVideo.style.opacity = '0';
      toVideo.style.opacity = '1';
    });

    // After fade, fully deactivate the old one
    setTimeout(() => {
      if (fromVideo && fromVideo !== toVideo) {
        fromVideo.classList.remove('active', 'cinematic-full');
        fromVideo.style.opacity = '0';
        // Pause to save resources
        try { fromVideo.pause(); } catch (_) {}
      }
      this.currentRole = toRole;
    }, duration + 60);

    return true;
  }

  /**
   * Fade out the current prominent video (used when settling back to interactive 3D)
   */
  async fadeOutCurrent(duration = 520) {
    const video = this.videos[this.currentRole];
    if (!video) return;

    // Also ensure CSS overlays are clean when fading video
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    video.style.transition = `opacity ${duration}ms ease`;
    video.style.opacity = '0';

    setTimeout(() => {
      video.classList.remove('active', 'cinematic-full');
      try { video.pause(); } catch (_) {}
      this.isPlaying = false;
    }, duration);
  }

  _hideAllFullVideos() {
    ['rocket-video', 'wormhole-video', 'arrival-video'].forEach(id => {
      const v = document.getElementById(id);
      if (v) {
        v.style.opacity = '0';
        v.classList.remove('active', 'cinematic-full');
        try { v.pause(); } catch (_) {}
      }
    });
  }

  _hideVideo(video) {
    if (!video) return;
    video.style.opacity = '0';
    video.classList.remove('active', 'cinematic-full');
    try { video.pause(); } catch (_) {}
  }

  async _waitForReady(video) {
    if (video.readyState >= 2) return; // HAVE_CURRENT_DATA or better

    return new Promise(resolve => {
      const handler = () => {
        video.removeEventListener('loadeddata', handler);
        video.removeEventListener('canplay', handler);
        resolve();
      };
      video.addEventListener('loadeddata', handler, { once: true });
      video.addEventListener('canplay', handler, { once: true });

      // Fallback timeout
      setTimeout(resolve, 1800);
    });
  }

  // Utility: stop everything (for lite mode or errors)
  stopAll() {
    // Force clean any CSS overlay animations too
    ['whVideoOverlay', 'sectorArrivalVideo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.style.opacity = '0';
      }
    });

    Object.values(this.videos).forEach(v => {
      try { v.pause(); v.style.opacity = '0'; v.classList.remove('active', 'cinematic-full'); } catch (_) {}
    });

    // Also stop dynamic overlays created for moon/particle/post
    ['video-overlay-moon', 'video-overlay-particle', 'video-overlay-post'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        try { el.pause(); el.style.opacity = '0'; } catch (_) {}
      }
    });

    this.currentRole = null;
    this.isPlaying = false;
  }

  /**
   * Play a video as an overlay (e.g. particle effects on top of wormhole).
   * Creates or reuses an overlay video element with lower opacity and screen blend.
   */
  async playOverlay(role, options = {}) {
    const roleCfg = this.config.videoRoles?.[role];
    if (!roleCfg) return Promise.resolve(false);

    const { opacity = 0.35, fadeDuration = 300 } = options;

    // Create a dedicated overlay video if not exists
    let overlayId = `video-overlay-${role}`;
    let overlayVideo = document.getElementById(overlayId);

    if (!overlayVideo) {
      overlayVideo = document.createElement('video');
      overlayVideo.id = overlayId;
      overlayVideo.className = 'cinematic-video';
      overlayVideo.muted = true;
      overlayVideo.playsInline = true;
      overlayVideo.style.mixBlendMode = 'screen';
      overlayVideo.style.zIndex = '2'; // above main bg but below 3D canvas
      document.getElementById('video-layers')?.appendChild(overlayVideo);
    }

    const fullSrc = this.videoBasePath + roleCfg.file;
    if (overlayVideo.src !== fullSrc && !overlayVideo.src.endsWith(roleCfg.file)) {
      overlayVideo.src = fullSrc;
      overlayVideo.load();
    }

    await this._waitForReady(overlayVideo);

    overlayVideo.loop = (roleCfg.playMode === 'loop' || roleCfg.playMode === 'once-then-loop');
    overlayVideo.style.transition = `opacity ${fadeDuration}ms ease`;
    overlayVideo.style.opacity = '0';

    try {
      await overlayVideo.play();
      requestAnimationFrame(() => {
        overlayVideo.style.opacity = String(opacity);
      });

      return true;
    } catch (e) {
      console.warn('[VideoManager] overlay play failed for', role, e);
      return false;
    }
  }
}

// Global singleton
window.VideoManager = new VideoManager();