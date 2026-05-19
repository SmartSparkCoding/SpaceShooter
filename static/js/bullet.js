export class Bullet {
  constructor({ x, y, vx, vy, damage = 1, fromPlayer = true, life = 1.6, radius = 3 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.fromPlayer = fromPlayer;
    this.life = life;
    this.radius = radius;
    this.dead = false;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -20 || this.y < -20 || this.x > width + 20 || this.y > height + 20) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.fromPlayer ? '#38f6ff' : '#ff6d7d';
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
