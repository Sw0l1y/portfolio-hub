// Canvas: 1120 × 630
export const LEVELS = [
  // ── 1: First Swing ────────────────────────────────────────────────────────
  {
    title: 'FIRST SWING',
    hint: 'Click an anchor to tether · click again to release',
    platforms: [
      { x: 0,   y: 510, w: 280, h: 120 },  // left ground
      { x: 820, y: 510, w: 300, h: 120 },  // right ground
    ],
    anchors:  [{ x: 535, y: 155 }],
    ball:     { x: 140, y: 478 },
    portal:   { x: 975, y: 476 },
    hazards:  [],
  },

  // ── 2: Chain ──────────────────────────────────────────────────────────────
  {
    title: 'CHAIN',
    hint: 'Use both anchors in sequence',
    platforms: [
      { x: 0,   y: 530, w: 180, h: 100 },  // left start
      { x: 460, y: 420, w: 140, h: 25 },   // mid shelf
      { x: 880, y: 490, w: 240, h: 140 },  // right end
    ],
    anchors:  [{ x: 275, y: 175 }, { x: 680, y: 190 }],
    ball:     { x: 90,  y: 498 },
    portal:   { x: 1020, y: 457 },
    hazards:  [],
  },

  // ── 3: The Climb ──────────────────────────────────────────────────────────
  {
    title: 'THE CLIMB',
    hint: 'Swing upward using ceiling anchors',
    platforms: [
      { x: 0,    y: 580, w: 1120, h: 50 },  // floor
      { x: 0,    y: 0,   w: 50,  h: 460 },  // left wall
      { x: 1070, y: 0,   w: 50,  h: 480 },  // right wall
      { x: 420,  y: 290, w: 130, h: 20  },  // mid blocker
      { x: 900,  y: 380, w: 170, h: 25  },  // exit ledge
    ],
    anchors:  [{ x: 200, y: 30 }, { x: 560, y: 30 }, { x: 820, y: 30 }],
    ball:     { x: 100, y: 545 },
    portal:   { x: 985, y: 350 },
    hazards:  [],
  },

  // ── 4: Spike Pit ─────────────────────────────────────────────────────────
  {
    title: 'SPIKE PIT',
    hint: 'Don\'t fall into the spikes',
    platforms: [
      { x: 0,   y: 510, w: 200, h: 120 },  // left start
      { x: 900, y: 510, w: 220, h: 120 },  // right end
      { x: 420, y: 380, w: 120, h: 20  },  // floating shelf
    ],
    anchors:  [{ x: 310, y: 140 }, { x: 600, y: 110 }, { x: 820, y: 160 }],
    ball:     { x: 100, y: 478 },
    portal:   { x: 1010, y: 477 },
    hazards:  [{ x: 200, y: 545, w: 700, h: 85 }],
  },

  // ── 5: Grand Finale ───────────────────────────────────────────────────────
  {
    title: 'GRAND FINALE',
    hint: 'Everything you know',
    platforms: [
      { x: 0,   y: 570, w: 140, h: 60 },   // start
      { x: 280, y: 470, w: 100, h: 20 },   // shelf A
      { x: 520, y: 340, w: 100, h: 20 },   // shelf B
      { x: 760, y: 210, w: 100, h: 20 },   // shelf C
      { x: 940, y: 360, w: 180, h: 30 },   // exit
    ],
    anchors:  [{ x: 175, y: 200 }, { x: 400, y: 150 }, { x: 640, y: 90 }, { x: 880, y: 120 }],
    ball:     { x: 70,  y: 538 },
    portal:   { x: 1045, y: 328 },
    hazards:  [{ x: 140, y: 580, w: 840, h: 50 }],
  },
];
