// Canvas: 1120 × 630
// slingshot.x/y = ball rest position (center of fork)
export const LEVELS = [
  // ── 1: LAUNCH PAD ────────────────────────────────────────────────────────
  {
    title: 'LAUNCH PAD',
    hint: 'Drag the ball back and release',
    slingshot: { x: 200, y: 450 },
    platforms: [
      { x: 0,   y: 450, w: 170, h: 180 },  // left base
      { x: 0,   y: 548, w: 1120, h: 82 },  // floor
      { x: 790, y: 438, w: 330, h: 110 },  // right landing
    ],
    portal:   { x: 965, y: 406 },
    hazards:  [],
  },

  // ── 2: OVER THE WALL ─────────────────────────────────────────────────────
  {
    title: 'OVER THE WALL',
    hint: 'Arc over the wall',
    slingshot: { x: 200, y: 450 },
    platforms: [
      { x: 0,   y: 450, w: 170, h: 180 },  // left base
      { x: 0,   y: 548, w: 1120, h: 82 },  // floor
      { x: 455, y: 218, w: 55,  h: 330 },  // blocking wall
      { x: 730, y: 418, w: 390, h: 130 },  // right landing
    ],
    portal:   { x: 945, y: 386 },
    hazards:  [],
  },

  // ── 3: THE NOTCH ─────────────────────────────────────────────────────────
  {
    title: 'THE NOTCH',
    hint: 'Thread the gap',
    slingshot: { x: 200, y: 450 },
    platforms: [
      { x: 0,    y: 450, w: 170, h: 180 },  // left base
      { x: 0,    y: 548, w: 1120, h: 82 },  // floor
      { x: 390,  y: 0,   w: 280, h: 230 },  // upper blocker
      { x: 390,  y: 340, w: 280, h: 210 },  // lower blocker  (gap: y 230→340 = 110px)
      { x: 820,  y: 390, w: 300, h: 160 },  // right landing
    ],
    portal:   { x: 970, y: 358 },
    hazards:  [],
  },

  // ── 4: THE ISLAND ────────────────────────────────────────────────────────
  {
    title: 'THE ISLAND',
    hint: 'Land on the island — spikes below',
    slingshot: { x: 200, y: 470 },
    platforms: [
      { x: 0,   y: 470, w: 170, h: 160 },  // left base
      { x: 0,   y: 558, w: 1120, h: 72 },  // floor
      { x: 520, y: 330, w: 200, h: 22 },   // floating island
      { x: 830, y: 440, w: 290, h: 118 },  // far right safe zone
    ],
    portal:   { x: 620, y: 298 },
    hazards:  [
      { x: 170, y: 542, w: 660, h: 16 },   // spike strip across floor
    ],
  },

  // ── 5: GAUNTLET ──────────────────────────────────────────────────────────
  {
    title: 'GAUNTLET',
    hint: 'Three walls stand between you and freedom',
    slingshot: { x: 160, y: 468 },
    platforms: [
      { x: 0,   y: 468, w: 130, h: 162 },  // left base
      { x: 0,   y: 548, w: 1120, h: 82 },  // floor
      { x: 295, y: 268, w: 48,  h: 280 },  // wall 1
      { x: 565, y: 148, w: 48,  h: 320 },  // wall 2 (taller)
      { x: 815, y: 268, w: 48,  h: 280 },  // wall 3
      { x: 940, y: 428, w: 180, h: 120 },  // exit platform
    ],
    portal:   { x: 1038, y: 396 },
    hazards:  [],
  },
];
