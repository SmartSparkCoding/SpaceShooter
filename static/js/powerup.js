const KINDS = ['rapid', 'triple', 'shield', 'bomb', 'health'];

export class PowerUp {
  constructor(x, y, kind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.vy = 55;
    this.radius = 11;
    this.spin = 0;
    this.dead = false;
  }

  update(dt, height) {
    this.y += this.vy * dt;
    this.spin += dt * 3;
    if (this.y > height + 20) this.dead = true;
  }
}

export function maybeDropPowerup(enemy) {
  const chance = enemy.type === 'boss' ? 1 : 0.16;
  if (Math.random() > chance) return null;
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
  return new PowerUp(enemy.x, enemy.y, kind);
}
