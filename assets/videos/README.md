# Your Cinematic Video Assets (Heavy Use)

These 11 MP4 files are **first-class citizens** in the current hybrid portfolio.

## Current Mapping (see assets/js/config.js) — ALL 11 VIDEOS ACTIVELY USED
- ROCKET - SPACESHIP VIDEOS.mp4 → Loading cinematic (full screen)
- WORMHOLE ANIMATIONS.mp4 → Every warp transition (main layer; 3D fully suppressed so the video plays clean, then details load)
- SECTOR ARRIVAL ANIMATIONS.mp4 → Planet sector arrivals
- PLANET ANIMATIONS.mp4 → Planet surface / generic background for several sectors
- NEBULA - GAS CLOUD.mp4 → Volumetric nebula background (used for ABOUT / CONTACT etc.)
- STARFIELD ANIMATIONS.mp4 → Default deep space ambient background
- SPACESHIP - STATION ANIMATIONS.mp4 → Station detail background (LAUNCH / CONTACT)
- SUN - STAR ANIMATIONS.mp4 → Solar / star close-up (occasional ambient)
- MOON ANIMATIONS.mp4 → Played as overlay when arriving at moon-equipped sectors (ABOUT, EXPERIENCE)
- PARTICLE EFFECTS.mp4 → Layered on top of wormhole video during every warp for extra energy
- POST-PROCESSING EFFECTS.mp4 → Short "calibration / lens" overlay at end of loading + system flair

All videos from your collection are now integrated into the cinematic experience (not just as references).

**Summary of usage:**
- Every single one of the 11 MP4s has an active role in the running portfolio.

## Compression (do this!)
Raw size is very large (~280 MB total). Run the commands from the root README.md to produce small WebM versions.

After compression, update the `file` names in `config.js` videoRoles.

The experience is designed so that even with heavy video use it remains interactive thanks to the Three.js layer on top.
