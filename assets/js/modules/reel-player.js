/**
 * REEL PLAYER — Scripted cinematic auto-tour through all sections.
 */

export class ReelPlayer {
  constructor(experience) {
    this.exp = experience;
    this.reelPlaying = false;
  }

  play() {
    if (this.reelPlaying) return;
    this.reelPlaying = true;
    this.exp.focusedPlane = null;
    this.exp.focusTargetRot = null;
    this.exp.interactions.clearGraphLines();
    this.exp.interactions.clearExplorer();

    const btn = document.getElementById('reel-btn');
    if (btn) btn.textContent = 'PLAYING REEL...';

    this.exp.audio.init();
    this.exp.audio.playDataFlow(0.4);
    setTimeout(() => this.exp.audio.playSoftTone(165, 0.5, 'sine', 0.5), 180);

    const tour = [
      { p: 0.00, dur: 1200, action: 'idle' },
      { p: 0.175, dur: 1600, action: 'orbitSkills' },
      { p: 0.36, dur: 1800, action: 'lookProjects' },
      { p: 0.55, dur: 1400, action: 'followExp' },
      { p: 0.76, dur: 1600, action: 'orbitLab' },
      { p: 0.95, dur: 1400, action: 'finalNexus' },
    ];

    const startTime = performance.now();
    let idx = 0;

    const step = (now) => {
      if (!this.reelPlaying) return;
      const elapsed = now - startTime;
      let current = tour[idx];
      let segStart = 0;
      for (let i = 0; i < idx; i++) segStart += tour[i].dur;
      if (elapsed - segStart > current.dur && idx < tour.length - 1) {
        idx++;
        current = tour[idx];
        segStart += tour[idx - 1].dur;
      }
      const localT = Math.min(1, Math.max(0, (elapsed - segStart) / current.dur));
      const easedLocal = localT < 0.5 ? 2 * localT * localT : -1 + (4 - 2 * localT) * localT;
      const prevP = idx > 0 ? tour[idx - 1].p : 0;
      this.exp.targetProgress = prevP + (current.p - prevP) * easedLocal;

      if (current.action === 'orbitSkills' && idx === 1) {
        const ang = localT * Math.PI * 1.6;
        this.exp.targetOrbit.y = Math.sin(ang) * 0.25;
        this.exp.targetOrbit.x = Math.cos(ang * 0.7) * 0.12;
      } else if (current.action === 'lookProjects' && idx === 2) {
        this.exp.targetOrbit.y = (localT - 0.5) * 0.4;
      } else if (current.action === 'orbitLab' && idx === 4) {
        const ang = localT * Math.PI * 2.2;
        this.exp.targetOrbit.y = Math.sin(ang) * 0.35;
        this.exp.targetOrbit.x = Math.cos(ang * 0.5) * 0.15;
      } else {
        this.exp.targetOrbit.y *= 0.96;
        this.exp.targetOrbit.x *= 0.96;
      }

      if (elapsed < segStart + current.dur + 50 || idx < tour.length - 1) {
        requestAnimationFrame(step);
      } else {
        this.reelPlaying = false;
        if (btn) btn.textContent = 'PLAY REEL';
        this.exp.targetOrbit.y = 0;
        this.exp.targetOrbit.x = 0;
        setTimeout(() => { if (!this.reelPlaying) this.exp.targetProgress = 0.96; }, 1400);
      }
    };
    requestAnimationFrame(step);
  }

  stop() {
    this.reelPlaying = false;
  }
}