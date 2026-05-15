import { Game } from './Game.js';

const canvas  = document.getElementById('c');
canvas.width  = 1120;
canvas.height = 630;
const ctx     = canvas.getContext('2d');

const game = new Game(canvas, ctx);

let last = 0;
function loop(ts) {
  const dt = Math.min((ts - last) / 16.667, 3);
  last = ts;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(ts => { last = ts; requestAnimationFrame(loop); });
