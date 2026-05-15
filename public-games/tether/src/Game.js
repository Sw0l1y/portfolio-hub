export const VERSION = '1.0.0';

import { LEVELS }                                    from './levels.js';
import { Ball, Platform, Anchor, Portal, Hazard, Particle, dist } from './world.js';
import { Renderer }                                  from './renderer.js';
import { Input }                                     from './input.js';

const S = { MENU: 0, PLAYING: 1, WIN: 2, DEATH: 3 };

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this.W      = canvas.width;
    this.H      = canvas.height;

    this.renderer   = new Renderer(ctx, this.W, this.H);
    this.input      = new Input(canvas);

    this.state      = S.MENU;
    this.levelIndex = 0;
    this.particles  = [];
    this.showHint   = true;
    this.hintTimer  = 0;

    this._buildLevel(0);
  }

  // ── Level loading ──────────────────────────────────────────────────────────

  _buildLevel(idx) {
    const d        = LEVELS[idx];
    this.ball      = new Ball(d.ball.x, d.ball.y);
    this.platforms = d.platforms.map(p => new Platform(p.x, p.y, p.w, p.h));
    this.anchors   = d.anchors.map(a  => new Anchor(a.x, a.y));
    this.portal    = new Portal(d.portal.x, d.portal.y);
    this.hazards   = (d.hazards || []).map(h => new Hazard(h.x, h.y, h.w, h.h));
    this.tether    = null;
    this.particles = [];
    this.showHint  = true;
    this.hintTimer = 0;
    this._nearestAnchorId = -1;
  }

  // ── Main update ────────────────────────────────────────────────────────────

  update(dt) {
    const inp = this.input;

    // ── Non-playing states ─────────────────────────────────────────────────
    if (this.state !== S.PLAYING) {
      if (inp.justDown()) {
        if (this.state === S.MENU) {
          this.state = S.PLAYING;
        } else if (this.state === S.WIN) {
          const next = this.levelIndex + 1;
          if (next < LEVELS.length) {
            this.levelIndex = next;
            this._buildLevel(next);
            this.state = S.PLAYING;
          } else {
            this.levelIndex = 0;
            this._buildLevel(0);
            this.state = S.MENU;
          }
        } else if (this.state === S.DEATH) {
          this._buildLevel(this.levelIndex);
          this.state = S.PLAYING;
        }
      }
      inp.endFrame();
      return;
    }

    // ── Hint timer ─────────────────────────────────────────────────────────
    this.hintTimer += dt;
    if (this.hintTimer > 200) this.showHint = false;

    // ── Find nearest anchor to mouse ───────────────────────────────────────
    const mp = inp.mousePos;
    this._nearestAnchorId = -1;
    let bestD = 90;
    this.anchors.forEach((a, i) => {
      const d = dist(mp.x, mp.y, a.x, a.y);
      if (d < bestD) { bestD = d; this._nearestAnchorId = i; }
      a.hovered  = false;
      a.attached = this.tether && this.tether.anchorIdx === i;
    });
    if (this._nearestAnchorId >= 0) {
      this.anchors[this._nearestAnchorId].hovered = true;
    }

    // ── Tether input ───────────────────────────────────────────────────────
    if (inp.justDown()) {
      if (this.tether) {
        // release → burst particles
        this._emitRelease();
        this.tether = null;
      } else if (this._nearestAnchorId >= 0) {
        const a = this.anchors[this._nearestAnchorId];
        const len = dist(this.ball.x, this.ball.y, a.x, a.y);
        this.tether = { anchor: a, anchorIdx: this._nearestAnchorId, length: len };
        this._emitAttach(a);
      }
    }

    // ── Physics ────────────────────────────────────────────────────────────
    this.ball.update(dt, this.tether, this.platforms);

    // ── Particles ──────────────────────────────────────────────────────────
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.alive);

    if (this.ball.justBounced) this._emitBounce();

    // ── Anchors & portal ───────────────────────────────────────────────────
    for (const a of this.anchors) a.update(dt);
    this.portal.update(dt);

    // ── Win condition ──────────────────────────────────────────────────────
    if (dist(this.ball.x, this.ball.y, this.portal.x, this.portal.y) < this.portal.r + this.ball.r) {
      this._emitWin();
      this.state = S.WIN;
    }

    // ── Death conditions ───────────────────────────────────────────────────
    for (const h of this.hazards) {
      if (this.ball.x + this.ball.r > h.x && this.ball.x - this.ball.r < h.x + h.w &&
          this.ball.y + this.ball.r > h.y && this.ball.y - this.ball.r < h.y + h.h) {
        this.state = S.DEATH;
      }
    }
    if (this.ball.y > this.H + 120) this.state = S.DEATH;

    inp.endFrame();
  }

  // ── Draw ───────────────────────────────────────────────────────────────────

  draw() {
    const r = this.renderer;
    r.clear();

    if (this.state === S.MENU) {
      r.drawMenu(); return;
    }

    r.drawPlatforms(this.platforms);
    r.drawHazards(this.hazards);
    r.drawPortal(this.portal);
    r.drawAnchors(this.anchors, this._nearestAnchorId);
    if (this.tether) r.drawTether(this.ball, this.tether);
    r.drawParticles(this.particles);
    r.drawBall(this.ball);
    r.drawHUD(this.levelIndex + 1, LEVELS.length, LEVELS[this.levelIndex].hint, this.showHint);

    if (this.state === S.WIN)   r.drawWin(this.levelIndex + 1, LEVELS.length);
    if (this.state === S.DEATH) r.drawDeath();
  }

  // ── Particle helpers ───────────────────────────────────────────────────────

  _emitRelease() {
    const spd = Math.sqrt(this.ball.vx ** 2 + this.ball.vy ** 2);
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = 1.5 + Math.random() * 3 + spd * 0.08;
      this.particles.push(new Particle(
        this.ball.x, this.ball.y,
        Math.cos(angle) * s, Math.sin(angle) * s,
        '#00e5ff', 18, 2.5 + Math.random() * 2
      ));
    }
  }

  _emitAttach(a) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(
        a.x, a.y,
        Math.cos(angle) * (1 + Math.random() * 2), Math.sin(angle) * (1 + Math.random() * 2),
        '#c080ff', 14, 2 + Math.random() * 1.5
      ));
    }
  }

  _emitBounce() {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(
        this.ball.x, this.ball.y,
        Math.cos(angle) * (1 + Math.random() * 2.5), Math.sin(angle) * (1.5 + Math.random() * 2) - 1.5,
        '#60b0ff', 12, 1.5 + Math.random() * 1.5
      ));
    }
  }

  _emitWin() {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      this.particles.push(new Particle(
        this.portal.x, this.portal.y,
        Math.cos(angle) * s, Math.sin(angle) * s,
        i % 2 === 0 ? '#00ffaa' : '#00e5ff', 30, 2 + Math.random() * 3
      ));
    }
  }
}
