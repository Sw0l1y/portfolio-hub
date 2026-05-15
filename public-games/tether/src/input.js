export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mousePos = { x: 0, y: 0 };
    this._down = false;
    this._justDown = false;
    this._justUp = false;

    const toCanvas = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left) * (canvas.width / r.width),
        y: (clientY - r.top) * (canvas.height / r.height),
      };
    };

    canvas.addEventListener('mousemove', e => {
      Object.assign(this.mousePos, toCanvas(e.clientX, e.clientY));
    });
    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      Object.assign(this.mousePos, toCanvas(e.clientX, e.clientY));
      this._down = true;
      this._justDown = true;
    });
    canvas.addEventListener('mouseup', e => {
      if (e.button !== 0) return;
      this._down = false;
      this._justUp = true;
    });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      Object.assign(this.mousePos, toCanvas(t.clientX, t.clientY));
      this._down = true;
      this._justDown = true;
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      Object.assign(this.mousePos, toCanvas(t.clientX, t.clientY));
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this._down = false;
      this._justUp = true;
    }, { passive: false });
  }

  justDown() { return this._justDown; }
  justUp()   { return this._justUp; }
  isDown()   { return this._down; }

  endFrame() {
    this._justDown = false;
    this._justUp = false;
  }
}
