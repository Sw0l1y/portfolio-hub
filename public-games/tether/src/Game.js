export const VERSION = '2.1.0';

import { LEVELS }                                        from './levels.js';
import { Ball, Platform, Portal, Hazard, Particle, dist } from './world.js';
import { Renderer }                                      from './renderer.js';
import { Input }                                         from './input.js';

const MAX_PULL = 120;
const POWER    = 0.21;

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
    this.dragging   = false;
    this.dragOriginX = 0;
    this.dragOriginY = 0;
    this.showHint   = true;
    this.hintTimer  = 0;

    this._buildLevel(0);
  }

  // ── Level setup ────────────────────────────────────────────────────────────

  _buildLevel(idx) {
    const d        = LEVELS[idx];
    this.ball      = new Ball(d.ball.x, d.ball.y);
    this.platforms = d.platforms.map(p => new Platform(p.x, p.y, p.w, p.h));
    this.portal    = new Portal(d.portal.x, d.portal.y);
    this.hazards   = (d.hazards || []).map(h => new Hazard(h.x, h.y, h.w, h.h));
    this.particles = [];
    this.dragging  = false;
    this.showHint  = true;
    this.hintTimer = 0;
  }

  // ── Update ─────────────────────────────────────────────────────────────────

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
    if (this.hintTimer > 240) this.showHint = false;

    const mp   = inp.mousePos;
    const ball = this.ball;

    // always update physics (even while dragging, ball is pinned by overwrite below)
    ball.update(dt, this.platforms);

    // particles
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => p.alive);
    if (ball.justBounced) this._emitBounce();

    // ── Grab / drag ────────────────────────────────────────────────────────
    if (inp.justDown()) {
      const dToBall = dist(mp.x, mp.y, ball.x, ball.y);
      if (dToBall < 40) {
        this.dragging    = true;
        this.dragOriginX = ball.x;
        this.dragOriginY = ball.y;
        ball.grab();
      }
    }

    if (this.dragging) {
      // clamp drag to MAX_PULL radius around the origin
      const dx = mp.x - this.dragOriginX;
      const dy = mp.y - this.dragOriginY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d <= MAX_PULL) {
        ball.x = mp.x; ball.y = mp.y;
      } else {
        ball.x = this.dragOriginX + (dx / d) * MAX_PULL;
        ball.y = this.dragOriginY + (dy / d) * MAX_PULL;
      }
    }

    if (inp.justUp() && this.dragging) {
      const dx = this.dragOriginX - ball.x;
      const dy = this.dragOriginY - ball.y;
      if (Math.sqrt(dx*dx + dy*dy) > 8) {
        ball.launch(dx * POWER, dy * POWER);
        this._emitLaunch();
      } else {
        ball.release();
      }
      this.dragging = false;
    }

    // ── Win / death checks ─────────────────────────────────────────────────
    if (!this.dragging) {
      if (dist(ball.x, ball.y, this.portal.x, this.portal.y) < this.portal.r + ball.r) {
        this._emitWin();
        this.state = S.WIN;
        inp.endFrame();
        return;
      }

      for (const h of this.hazards) {
        if (ball.x + ball.r > h.x && ball.x - ball.r < h.x + h.w &&
            ball.y + ball.r > h.y && ball.y - ball.r < h.y + h.h) {
          this.state = S.DEATH;
          inp.endFrame();
          return;
        }
      }

      if (ball.y > this.H + 80 || ball.x < -80 || ball.x > this.W + 80) {
        this.state = S.DEATH;
        inp.endFrame();
        return;
      }
    }

    this.portal.update(dt);
    inp.endFrame();
  }

  // ── Draw ───────────────────────────────────────────────────────────────────

  draw() {
    const r    = this.renderer;
    const ball = this.ball;

    r.clear();

    if (this.state === S.MENU) { r.drawMenu(); return; }

    r.drawPlatforms(this.platforms);
    r.drawHazards(this.hazards);
    r.drawPortal(this.portal);

    if (this.dragging) {
      const dx = this.dragOriginX - ball.x;
      const dy = this.dragOriginY - ball.y;
      if (Math.sqrt(dx*dx + dy*dy) > 8) {
        r.drawTrajectory(this.dragOriginX, this.dragOriginY, ball.x, ball.y, this.platforms);
        r.drawPullLine(this.dragOriginX, this.dragOriginY, ball.x, ball.y);
      }
    }

    r.drawParticles(this.particles);
    r.drawBall(ball);
    r.drawHUD(this.levelIndex + 1, LEVELS.length, LEVELS[this.levelIndex].hint, this.showHint);

    if (this.state === S.WIN)   r.drawWin(this.levelIndex + 1, LEVELS.length);
    if (this.state === S.DEATH) r.drawDeath();
  }

  // ── Particles ──────────────────────────────────────────────────────────────

  _emitLaunch() {
    const ball = this.ball;
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5;
      this.particles.push(new Particle(
        ball.x, ball.y,
        Math.cos(angle) * s, Math.sin(angle) * s,
        '#00e5ff', 18, 2 + Math.random() * 2.5
      ));
    }
  }

  _emitBounce() {
    const ball = this.ball;
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push(new Particle(
        ball.x, ball.y,
        Math.cos(angle) * (1 + Math.random() * 2.5),
        Math.sin(angle) * (1.5 + Math.random() * 2) - 1.5,
        '#60b0ff', 12, 1.5 + Math.random() * 1.5
      ));
    }
  }

  _emitWin() {
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const s = 2 + Math.random() * 6;
      this.particles.push(new Particle(
        this.portal.x, this.portal.y,
        Math.cos(angle) * s, Math.sin(angle) * s,
        i % 2 === 0 ? '#00ffaa' : '#00e5ff', 30, 2 + Math.random() * 3
      ));
    }
  }
}
