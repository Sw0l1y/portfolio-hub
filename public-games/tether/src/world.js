export function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Ball ──────────────────────────────────────────────────────────────────────

export class Ball {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.r = 14;
    this.angle = 0;
    this.trail = [];
    this.justBounced = false;
    this.onGround = false;
    this.speed = 0;
    this.launched = false;
    this.restTimer = 0;  // frames spent nearly still after launch
  }

  update(dt, platforms) {
    this.justBounced = false;

    if (!this.launched) return;

    this.vy += 0.50 * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.onGround = false;
    for (const p of platforms) this._collidePlatform(p);

    // gentle rolling friction on ground
    if (this.onGround) this.vx *= Math.pow(0.88, dt);

    this.angle += this.vx * 0.045 * dt;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 16) this.trail.shift();

    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    if (this.launched && this.onGround && this.speed < 0.8) {
      this.restTimer += dt;
    } else {
      this.restTimer = 0;
    }
  }

  launch(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.launched = true;
    this.trail = [];
    this.restTimer = 0;
  }

  _collidePlatform(p) {
    const cx = Math.max(p.x, Math.min(this.x, p.x + p.w));
    const cy = Math.max(p.y, Math.min(this.y, p.y + p.h));
    const dx = this.x - cx, dy = this.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= this.r || d === 0) return;

    const nx = dx / d, ny = dy / d;
    this.x += nx * (this.r - d);
    this.y += ny * (this.r - d);

    const dot = this.vx * nx + this.vy * ny;
    if (dot < 0) {
      const bounce = 0.45;
      this.vx -= (1 + bounce) * dot * nx;
      this.vy -= (1 + bounce) * dot * ny;
      if (ny < -0.6) {
        this.vx *= 0.80;
        this.onGround = true;
      }
      if (Math.abs(dot) > 2.5) this.justBounced = true;
    }
  }
}

// ── Level entities ────────────────────────────────────────────────────────────

export class Platform {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
}

export class Slingshot {
  constructor(x, y) {
    this.x = x; this.y = y;
    // prong tips relative to center
    this.leftTip  = { x: x - 24, y: y - 38 };
    this.rightTip = { x: x + 24, y: y - 38 };
  }
}

export class Portal {
  constructor(x, y) {
    this.x = x; this.y = y; this.r = 22;
    this.angle = 0; this.phase = 0;
  }
  update(dt) { this.angle += 0.025 * dt; this.phase += 0.045 * dt; }
}

export class Hazard {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
}

export class Particle {
  constructor(x, y, vx, vy, color, life, r) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life; this.maxLife = life;
    this.r = r;
  }
  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vy += 0.12 * dt;
    this.vx *= Math.pow(0.97, dt);
    this.life -= dt * 0.045;
  }
  get alive() { return this.life > 0; }
}
