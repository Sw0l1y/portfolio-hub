const GRAVITY = 0.50;
const MAX_PULL = 110;
const POWER    = 0.21;

export class Renderer {
  constructor(ctx, W, H) {
    this.ctx = ctx;
    this.W = W;
    this.H = H;
  }

  glow(color, blur) { this.ctx.shadowColor = color; this.ctx.shadowBlur = blur; }
  noGlow()          { this.ctx.shadowBlur = 0; }

  // ── Background ─────────────────────────────────────────────────────────────

  clear() {
    const { ctx, W, H } = this;
    ctx.fillStyle = '#06060e';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = 'rgba(28, 28, 65, 0.45)';
    ctx.lineWidth = 1;
    const gs = 55;
    for (let x = gs; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = gs; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  // ── Platforms ──────────────────────────────────────────────────────────────

  drawPlatforms(platforms) {
    const { ctx } = this;
    for (const p of platforms) {
      ctx.fillStyle = '#0b0b1e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#00bfff';
      ctx.lineWidth = 2;
      this.glow('#00bfff', 14);
      ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
      this.noGlow();
    }
  }

  // ── Hazards ────────────────────────────────────────────────────────────────

  drawHazards(hazards) {
    const { ctx } = this;
    for (const h of hazards) {
      ctx.fillStyle = '#1a0008';
      ctx.fillRect(h.x, h.y, h.w, h.h);
      const toothW = 18;
      const count = Math.floor(h.w / toothW);
      ctx.fillStyle = '#ff1050';
      this.glow('#ff1050', 10);
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const tx = h.x + i * toothW;
        ctx.moveTo(tx, h.y + h.h);
        ctx.lineTo(tx + toothW / 2, h.y + 3);
        ctx.lineTo(tx + toothW, h.y + h.h);
      }
      ctx.closePath();
      ctx.fill();
      this.noGlow();
    }
  }

  // ── Portal ─────────────────────────────────────────────────────────────────

  drawPortal(portal) {
    const { ctx } = this;
    const pulse = 0.7 + 0.3 * Math.sin(portal.phase);

    const grad = ctx.createRadialGradient(portal.x, portal.y, 0, portal.x, portal.y, portal.r * 2);
    grad.addColorStop(0, `rgba(0, 255, 170, ${0.28 * pulse})`);
    grad.addColorStop(1, 'rgba(0,255,170,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const a0 = portal.angle + (i / segs) * Math.PI * 2;
      const a1 = a0 + Math.PI * 0.22;
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.r, a0, a1);
      ctx.strokeStyle = `rgba(0, 255, 170, ${0.85 * pulse})`;
      ctx.lineWidth = 3;
      this.glow('#00ffaa', 22);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(portal.x, portal.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffaa';
    this.glow('#00ffaa', 24);
    ctx.fill();
    this.noGlow();
  }

  // ── Pull line ──────────────────────────────────────────────────────────────

  drawPullLine(ox, oy, ballX, ballY) {
    const { ctx } = this;
    const pull = Math.sqrt((ballX - ox) ** 2 + (ballY - oy) ** 2);
    const t = Math.min(pull / MAX_PULL, 1);
    const r = Math.round(t * 255);
    const g = Math.round((1 - t) * 160);
    const b = Math.round((1 - t) * 255);
    const color = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ballX, ballY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    this.glow(color, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    this.noGlow();
  }

  // ── Trajectory preview ─────────────────────────────────────────────────────

  drawTrajectory(ox, oy, ballX, ballY, platforms) {
    const { ctx } = this;
    const dx = ox - ballX;
    const dy = oy - ballY;
    const vx = dx * POWER;
    const vy = dy * POWER;

    const steps = 80;
    const stepDt = 1.4;

    let px = ballX, py = ballY, pvx = vx, pvy = vy;

    for (let i = 1; i <= steps; i++) {
      pvy += GRAVITY * stepDt;
      px += pvx * stepDt;
      py += pvy * stepDt;

      // simple platform bounce in preview
      for (const p of platforms) {
        const cx2 = Math.max(p.x, Math.min(px, p.x + p.w));
        const cy2 = Math.max(p.y, Math.min(py, p.y + p.h));
        const ddx = px - cx2, ddy = py - cy2;
        const dd = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 14 && dd > 0) {
          const nx2 = ddx/dd, ny2 = ddy/dd;
          px = cx2 + nx2 * 14;
          py = cy2 + ny2 * 14;
          const dot = pvx*nx2 + pvy*ny2;
          if (dot < 0) { pvx -= 1.45*dot*nx2; pvy -= 1.45*dot*ny2; }
        }
      }

      if (px < -50 || px > this.W + 50 || py > this.H + 50) break;

      const alpha = (1 - i / steps) * 0.55;
      const r = i / steps;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(r*255)}, ${Math.round((1-r)*200)}, 255, ${alpha})`;
      ctx.fill();
    }
  }

  // ── Particles ──────────────────────────────────────────────────────────────

  drawParticles(particles) {
    const { ctx } = this;
    ctx.save();
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      this.glow(p.color, 8);
      ctx.fill();
    }
    ctx.restore();
    this.noGlow();
  }

  // ── Ball ───────────────────────────────────────────────────────────────────

  drawBall(ball) {
    const { ctx } = this;

    // trail
    for (let i = 0; i < ball.trail.length; i++) {
      const t = ball.trail[i];
      const frac = (i + 1) / ball.trail.length;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.r * 0.5 * frac, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 210, 255, ${frac * 0.16})`;
      ctx.fill();
    }

    // outer glow
    const grad = ctx.createRadialGradient(ball.x, ball.y, ball.r * 0.5, ball.x, ball.y, ball.r * 2.2);
    grad.addColorStop(0, 'rgba(0,229,255,0.18)');
    grad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // sphere
    const sgrad = ctx.createRadialGradient(
      ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, 0,
      ball.x, ball.y, ball.r
    );
    sgrad.addColorStop(0, '#ffffff');
    sgrad.addColorStop(0.6, '#c0f0ff');
    sgrad.addColorStop(1, '#40c8ff');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = sgrad;
    this.glow('#00e5ff', 22);
    ctx.fill();

    // spin line
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);
    ctx.strokeStyle = 'rgba(0,60,100,0.45)';
    ctx.lineWidth = 2;
    this.noGlow();
    ctx.beginPath();
    ctx.moveTo(-ball.r + 4, 0);
    ctx.lineTo(ball.r - 4, 0);
    ctx.stroke();
    ctx.restore();
    this.noGlow();
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  drawHUD(levelNum, total, hint, showHint) {
    const { ctx, W } = this;
    ctx.save();
    ctx.font = '600 15px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(0, 200, 255, 0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL  ${levelNum} / ${total}`, 22, 32);
    if (showHint && hint) {
      ctx.font = '13px "Trebuchet MS", monospace';
      ctx.fillStyle = 'rgba(160, 100, 255, 0.55)';
      ctx.textAlign = 'center';
      ctx.fillText(hint, W / 2, 26);
    }
    ctx.restore();
  }

  drawRetryHint() {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.font = '14px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(180, 140, 255, 0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO RETRY', W / 2, H - 24);
    ctx.restore();
  }

  // ── Overlays ───────────────────────────────────────────────────────────────

  drawMenu() {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 80px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffffff';
    this.glow('#00e5ff', 36);
    ctx.fillText('SLINGSHOT', W / 2, H / 2 - 52);
    ctx.font = '19px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
    this.glow('#00e5ff', 10);
    ctx.fillText('drag the ball back · release to launch', W / 2, H / 2 + 16);
    ctx.font = '14px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(180, 140, 255, 0.55)';
    this.noGlow();
    ctx.fillText('CLICK TO PLAY', W / 2, H / 2 + 68);
    ctx.restore();
  }

  drawWin(levelNum, total) {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(6,6,14,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 58px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#00ffaa';
    this.glow('#00ffaa', 32);
    ctx.fillText(levelNum >= total ? 'YOU WIN!' : 'LEVEL CLEAR', W / 2, H / 2 - 18);
    ctx.font = '17px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(0, 255, 170, 0.65)';
    this.glow('#00ffaa', 10);
    ctx.fillText(levelNum >= total ? 'CLICK TO RESTART' : 'CLICK TO CONTINUE', W / 2, H / 2 + 42);
    ctx.restore();
    this.noGlow();
  }

  drawDeath() {
    const { ctx, W, H } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(6,6,14,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 58px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ff1050';
    this.glow('#ff1050', 32);
    ctx.fillText('MISSED', W / 2, H / 2 - 18);
    ctx.font = '17px "Trebuchet MS", monospace';
    ctx.fillStyle = 'rgba(255, 16, 80, 0.65)';
    this.glow('#ff1050', 10);
    ctx.fillText('CLICK TO RETRY', W / 2, H / 2 + 42);
    ctx.restore();
    this.noGlow();
  }
}
