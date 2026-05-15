export function dist(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Ball ─────────────────────────────────────────────────────────────────────

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
  }

  update(dt, tether, platforms) {
    this.justBounced = false;

    // gravity
    this.vy += 0.48 * dt;

    // integrate
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // tether rope constraint
    if (tether) {
      const dx = this.x - tether.anchor.x;
      const dy = this.y - tether.anchor.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > tether.length && d > 0) {
        const nx = dx / d, ny = dy / d;
        this.x = tether.anchor.x + nx * tether.length;
        this.y = tether.anchor.y + ny * tether.length;
        // remove outward velocity component
        const outward = this.vx * nx + this.vy * ny;
        if (outward > 0) {
          this.vx -= outward * nx;
          this.vy -= outward * ny;
        }
      }
      // gentle air drag while swinging
      const f = Math.pow(0.9985, dt);
      this.vx *= f; this.vy *= f;
    }

    // platform collisions
    this.onGround = false;
    for (const p of platforms) this._collidePlatform(p);

    // spin
    this.angle += this.vx * 0.04 * dt;

    // trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 14) this.trail.shift();

    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  _collidePlatform(p) {
    const cx = Math.max(p.x, Math.min(this.x, p.x + p.w));
    const cy = Math.max(p.y, Math.min(this.y, p.y + p.h));
    const dx = this.x - cx, dy = this.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= this.r || d === 0) return;

    const nx = dx / d, ny = dy / d;
    const overlap = this.r - d;
    this.x += nx * overlap;
    this.y += ny * overlap;

    const dot = this.vx * nx + this.vy * ny;
    if (dot < 0) {
      const bounce = 0.3;
      this.vx -= (1 + bounce) * dot * nx;
      this.vy -= (1 + bounce) * dot * ny;
      if (ny < -0.6) {
        this.vx *= 0.82;
        this.onGround = true;
      }
      if (Math.abs(dot) > 2) this.justBounced = true;
    }
  }
}

// ── Level entities ────────────────────────────────────────────────────────────

export class Platform {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
}

export class Anchor {
  constructor(x, y) {
    this.x = x; this.y = y; this.r = 11;
    this.phase = Math.random() * Math.PI * 2;
    this.hovered = false;
    this.attached = false;
  }
  update(dt) { this.phase += 0.055 * dt; }
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

// ── Particle ──────────────────────────────────────────────────────────────────

export class Particle {
  constructor(x, y, vx, vy, color, life, r) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life; this.maxLife = life;
    this.r = r;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.12 * dt;
    this.vx *= Math.pow(0.97, dt);
    this.life -= dt * 0.045;
  }
  get alive() { return this.life > 0; }
}
