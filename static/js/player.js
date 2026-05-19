export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 260;
    this.radius = 14;
    this.health = 100;
    this.maxHealth = 100;
    this.lives = 3;
    this.angle = -Math.PI / 2;
    this.fireCooldown = 0;

    this.powerups = {
      rapid: 0,
      triple: 0,
      shield: 0
    };
  }

  update(dt, input, width, height) {
    const mv = input.getMoveVector();
    this.x += mv.x * this.speed * dt;
    this.y += mv.y * this.speed * dt;

    this.x = Math.max(20, Math.min(width - 20, this.x));
    this.y = Math.max(20, Math.min(height - 20, this.y));

    this.fireCooldown -= dt;
    this.powerups.rapid = Math.max(0, this.powerups.rapid - dt);
    this.powerups.triple = Math.max(0, this.powerups.triple - dt);
    this.powerups.shield = Math.max(0, this.powerups.shield - dt);

    const dx = input.pointer.x - this.x;
    const dy = input.pointer.y - this.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.1) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  canShoot(input) {
    return input.isFiring() && this.fireCooldown <= 0;
  }

  getShotConfig() {
    const baseInterval = this.powerups.rapid > 0 ? 0.085 : 0.18;
    this.fireCooldown = baseInterval;

    const configs = [{ angle: this.angle, speed: 460 }];
    if (this.powerups.triple > 0) {
      configs.push({ angle: this.angle - 0.18, speed: 440 });
      configs.push({ angle: this.angle + 0.18, speed: 440 });
    }
    return configs;
  }

  takeDamage(amount) {
    if (this.powerups.shield > 0) {
      return false;
    }
    this.health -= amount;
    if (this.health <= 0) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.health = 0;
        return true;
      }
      this.health = this.maxHealth;
      this.powerups.shield = 2;
    }
    return false;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
}
