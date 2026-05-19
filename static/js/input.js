const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd']);

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, down: false };
    this.touch = {
      active: false,
      joystickId: null,
      fireId: null,
      moveX: 0,
      moveY: 0,
      fireDown: false
    };
    this.pausePressed = false;

    this.bindKeyboard();
    this.bindPointer();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.add(key);
      if (MOVE_KEYS.has(key) || key === ' ' || key === 'Spacebar') {
        e.preventDefault();
      }
      if (key === 'p' || key === 'Escape') {
        this.pausePressed = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.delete(key);
    });
  }

  bindPointer() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - rect.left;
      this.pointer.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', () => {
      this.pointer.down = true;
    });

    window.addEventListener('mouseup', () => {
      this.pointer.down = false;
    });
  }

  bindTouch() {
    const joystick = document.getElementById('joystickArea');
    const stick = document.getElementById('joystickStick');
    const fireButton = document.getElementById('fireButton');

    if (!joystick || !stick || !fireButton) return;

    this.touch.active = true;

    const resetStick = () => {
      this.touch.moveX = 0;
      this.touch.moveY = 0;
      stick.style.transform = 'translate(-50%, -50%)';
    };

    const updateStick = (touch) => {
      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const max = rect.width * 0.36;
      const len = Math.hypot(dx, dy) || 1;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      this.touch.moveX = dx / max;
      this.touch.moveY = dy / max;
      stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.touch.joystickId = t.identifier;
      updateStick(t);
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.joystickId) {
          updateStick(t);
        }
      }
    }, { passive: false });

    joystick.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.joystickId) {
          this.touch.joystickId = null;
          resetStick();
        }
      }
    }, { passive: false });

    fireButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.touch.fireId = t.identifier;
      this.touch.fireDown = true;
      this.pointer.down = true;
    }, { passive: false });

    fireButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.fireId) {
          this.touch.fireId = null;
          this.touch.fireDown = false;
          this.pointer.down = false;
        }
      }
    }, { passive: false });
  }

  consumePausePressed() {
    const value = this.pausePressed;
    this.pausePressed = false;
    return value;
  }

  getMoveVector() {
    let x = 0;
    let y = 0;

    if (this.keys.has('a') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) y += 1;

    if (this.touch.active) {
      x += this.touch.moveX;
      y += this.touch.moveY;
    }

    const len = Math.hypot(x, y) || 1;
    if (len > 1) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  isFiring() {
    return this.pointer.down || this.keys.has(' ') || this.keys.has('Spacebar') || this.keys.has('space');
  }
}
