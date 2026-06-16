/**
 * CONFIG — Single source of truth for the hybrid cinematic space portfolio.
 * Easy to extend sectors, remap videos, tweak visuals.
 * From-scratch clean architecture.
 */

window.PORTFOLIO_CONFIG = {
  // ========== SECTORS / PLANETS (6 total) ==========
  sectors: [
    {
      id: 0,
      name: 'LAUNCH',
      key: 'launch',
      videoRole: 'background-default',
      description: 'Launch sector — home base',
      // No planet in launch view (pure cockpit + ambient)
    },
    {
      id: 1,
      name: 'ABOUT',
      key: 'about',
      videoRole: 'background-nebula',
      planet: {
        type: 'rocky',
        color: 0x4a9eff,
        size: 0.65,
        position: [-3.2, 0.2, -2.1],
        hasRing: false,
        hasMoon: true,
        ringColor: null,
        label: 'CYAN-7'
      },
      panel: {
        title: 'ABOUT ME',
        subtitle: 'Senior Full Stack Developer',
        body: `<p>I'm <strong>Avinash Zala</strong>, Senior Full Stack Developer with <strong>7+ years</strong> building enterprise apps.</p>
               <p>Specializing in <strong>.NET Core, Angular, React.js</strong>, cloud-native. Currently at <strong>Aether Industries</strong>.</p>
               <div style="margin-top:12px"><span class="tag">7+ Years</span><span class="tag">15+ Projects</span><span class="tag">Available</span></div>`
      }
    },
    {
      id: 2,
      name: 'SKILLS',
      key: 'skills',
      videoRole: 'planet-generic',
      planet: {
        type: 'gas',
        color: 0xff6b35,
        size: 0.95,
        position: [3.1, 1.1, -4.2],
        hasRing: true,
        hasMoon: true,
        ringColor: 0xffd0a0,
        label: 'ORION-GAS'
      },
      panel: {
        title: 'TECH STACK',
        subtitle: 'Languages & Frameworks',
        body: `<div class="skills-grid">
                 <div class="sg"><h4>LANGUAGES</h4><p><span class="tag">C#</span><span class="tag">TypeScript</span><span class="tag">JavaScript</span><span class="tag">SQL</span></p></div>
                 <div class="sg"><h4>BACKEND</h4><p><span class="tag">.NET Core</span><span class="tag">ASP.NET</span><span class="tag">SignalR</span></p></div>
                 <div class="sg"><h4>FRONTEND</h4><p><span class="tag">React</span><span class="tag">Angular</span><span class="tag">Bootstrap</span></p></div>
               </div>`
      }
    },
    {
      id: 3,
      name: 'PROJECTS',
      key: 'projects',
      videoRole: 'planet-generic',
      planet: {
        type: 'rocky',
        color: 0x6c63ff,
        size: 0.72,
        position: [-4.1, 0.9, -7.3],
        hasRing: false,
        hasMoon: false,
        ringColor: null,
        label: 'PURPLE-NEXUS'
      },
      panel: {
        title: 'PROJECTS',
        subtitle: 'Selected Work',
        body: `<div class="pcard"><h3>AIRIS — Enterprise ERP</h3><p>.NET 4.5 to .NET Core. PRM module, Docker & K8s.</p><div><span class="tag">.NET Core</span><span class="tag">Angular</span><span class="tag">Docker</span></div></div>
               <div class="pcard"><h3>Insurance Portal</h3><p>ASP.NET + MSSQL. HelloSign, Stripe. 100% test coverage.</p><div><span class="tag">ASP.NET</span><span class="tag">MSSQL</span><span class="tag">Stripe</span></div></div>
               <div class="pcard"><h3>Twitter Intelligence</h3><p>Chrome extension + .NET Core. ChatGPT trends, real-time dashboards.</p><div><span class="tag">.NET Core</span><span class="tag">ChatGPT</span><span class="tag">React</span></div></div>`
      }
    },
    {
      id: 4,
      name: 'EXPERIENCE',
      key: 'experience',
      videoRole: 'arrival',
      planet: {
        type: 'ice',
        color: 0xe040fb,
        size: 0.52,
        position: [4.0, -0.9, -8.1],
        hasRing: false,
        hasMoon: true,
        ringColor: null,
        label: 'ICE-9'
      },
      panel: {
        title: 'EXPERIENCE',
        subtitle: 'Career Path',
        body: `<div class="titem"><span class="tyear">2025 — PRESENT</span><h3>Senior Developer</h3><h4>Aether Industries</h4></div>
               <div class="titem"><span class="tyear">2019 — 2024</span><h3>Senior Developer</h3><h4>Engross Infotech</h4></div>
               <div class="titem"><span class="tyear">2017 — 2019</span><h3>Jr. Engineer</h3><h4>Skyzone Software</h4></div>`
      }
    },
    {
      id: 5,
      name: 'CONTACT',
      key: 'contact',
      videoRole: 'background-nebula',
      planet: {
        type: 'lava',
        color: 0x00e676,
        size: 0.82,
        position: [0.1, 2.0, -10.2],
        hasRing: false,
        hasMoon: false,
        ringColor: null,
        label: 'LAVA-3'
      },
      panel: {
        title: 'CONTACT',
        subtitle: "Let's Connect",
        body: `<p>Ready to build something amazing?</p>
               <div style="margin:13px 0">
                 <a href="mailto:avinashzala@outlook.com" class="cblock">📧 avinashzala@outlook.com</a>
                 <a href="tel:+917405120804" class="cblock">📱 +91 74051 20804</a>
               </div>
               <a href="Resume/Resume.docx" download class="cv-btn">⬇ DOWNLOAD CV</a>`
      }
    }
  ],

  // ========== VIDEO ROLES (heavy use of user's provided files) ==========
  // playMode: 'once' | 'loop' | 'once-then-loop'
  videoRoles: {
    'loading': {
      file: 'ROCKET - SPACESHIP VIDEOS.mp4',
      playMode: 'once',
      description: 'Rocket launch cinematic for initial loading'
    },
    'warp': {
      file: 'WORMHOLE ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Core wormhole travel — plays during every sector transition'
    },
    'arrival': {
      file: 'SECTOR ARRIVAL ANIMATIONS.mp4',
      playMode: 'once',
      description: 'Approach / atmospheric entry for planet sectors'
    },
    'background-default': {
      file: 'STARFIELD ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Default deep space ambient'
    },
    'background-nebula': {
      file: 'NEBULA - GAS CLOUD.mp4',
      playMode: 'loop',
      description: 'Volumetric nebula ambience (used for several sectors)'
    },
    'planet-generic': {
      file: 'PLANET ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Planet surface / rotation footage for arrivals and backgrounds'
    },
    'station': {
      file: 'SPACESHIP - STATION ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Detailed station footage (used near LAUNCH / CONTACT)'
    },
    'sun': {
      file: 'SUN - STAR ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Solar / star close-up (occasional use)'
    },
    // Remaining videos now actively used (all 11 integrated)
    'moon': {
      file: 'MOON ANIMATIONS.mp4',
      playMode: 'loop',
      description: 'Moon orbital / surface footage — used for moon-heavy sectors and special moments'
    },
    'particle': {
      file: 'PARTICLE EFFECTS.mp4',
      playMode: 'loop',
      description: 'High-energy particle effects — layered during warp and intense sequences for extra cinematic punch'
    },
    'post': {
      file: 'POST-PROCESSING EFFECTS.mp4',
      playMode: 'once',
      description: 'Post-processing / lens effects demo — used during boot calibration and as subtle visual flair'
    }
  },

  // ========== VISUAL / TIMING TUNING ==========
  visuals: {
    starCount: [3200, 2400, 4200],   // 3 parallax layers
    asteroidCount: 340,
    cometMax: 2,
    warpDurationMs: 2350,
    arrivalDollyMs: 880,
    cameraShakeOnArrival: 620
  },

  // Fallbacks if a video fails to load (graceful degradation to pure 3D/CSS)
  fallbacks: {
    usePure3DWormhole: true,
    useCSSTransitions: true
  }
};

// Convenience getters
window.getSector = (id) => window.PORTFOLIO_CONFIG.sectors.find(s => s.id === id);
window.getVideoRole = (role) => window.PORTFOLIO_CONFIG.videoRoles[role];