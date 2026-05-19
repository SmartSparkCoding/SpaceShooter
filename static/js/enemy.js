export class Enemy {
  constructor(type, x, y, wave) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.wave = wave;
    this.dead = false;
    this.shootCd = 0;
    this.angle = 0;

    const scale = 1 + wave * 0.08;
    if (type === 'grunt') {
      this.hp = Math.floor(2 * scale);
      this.radius = 15;
      this.speed = 60 + wave * 3;
      this.score = 80;
    } else if (type === 'kamikaze') {
      this.hp = Math.floor(1.5 * scale);
      this.radius = 14;
      this.speed = 95 + wave * 4;
      this.score = 110;
    } else if (type === 'sniper') {
      this.hp = Math.floor(2.5 * scale);
      this.radius = 16;
      this.speed = 35 + wave * 1.5;
      this.score = 140;
      this.shootCd = 1.2;
    } else {
      this.hp = Math.floor(35 * (1 + wave * 0.16));
      this.radius = 34;
      this.speed = 26 + wave * 0.7;
      this.score = 2000;
      this.shootCd = 0.9;
    }
    this.maxHp = this.hp;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  update(dt, player, bullets) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    this.angle = Math.atan2(uy, ux);

    if (this.type === 'grunt') {
      this.x += ux * this.speed * dt;
      this.y += uy * this.speed * dt;
    } else if (this.type === 'kamikaze') {
      this.x += ux * this.speed * dt;
      this.y += uy * this.speed * dt;
    } else if (this.type === 'sniper') {
      const desired = 230;
      const diff = dist - desired;
      this.x += ux * diff * dt * 1.2;
      this.y += uy * diff * dt * 1.2;
      this.shootCd -= dt;
      if (this.shootCd <= 0) {
        this.shootCd = Math.max(0.5, 1.25 - this.wave * 0.02);
        bullets.push({
          x: this.x,
          y: this.y,
          vx: ux * 240,
          vy: uy * 240,
          fromPlayer: false,
          damage: 14,
          radius: 4,
          life: 3
        });
      }
    } else {
      this.x += ux * this.speed * dt;
      this.y += uy * this.speed * dt;
      this.shootCd -= dt;
      if (this.shootCd <= 0) {
        this.shootCd = 0.58;
        const spread = 0.45;
        for (let i = -2; i <= 2; i += 1) {
          const a = this.angle + i * spread * 0.25;
          bullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(a) * 250,
            vy: Math.sin(a) * 250,
            fromPlayer: false,
            damage: 11,
            radius: 5,
            life: 2.5
          });
        }
      }
    }
  }
}

export function spawnWaveEnemies(wave, width) {
  const enemies = [];
  const isBossWave = wave % 5 === 0;

  if (isBossWave) {
    enemies.push(new Enemy('boss', width / 2, -80, wave));
    return enemies;
  }

  const total = 5 + wave * 2;
  for (let i = 0; i < total; i += 1) {
    const roll = Math.random();
    let type = 'grunt';
    if (roll > 0.72) type = 'kamikaze';
    if (roll > 0.88 && wave > 2) type = 'sniper';
    enemies.push(new Enemy(type, 60 + Math.random() * (width - 120), -30 - i * 45, wave));
  }
  return enemies;
}
