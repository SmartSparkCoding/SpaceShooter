import { Bullet } from './bullet.js';
import { Particle, burstParticles } from './particle.js';
import { Enemy, spawnWaveEnemies } from './enemy.js';
import { Player } from './player.js';
import { PowerUp, maybeDropPowerup } from './powerup.js';
import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { UIManager, drawHudDecor } from './ui.js';
import { createStarLayers, drawEnemyShip, drawPlayerShip, drawPowerUp, drawStarfield } from './assets.js';

const LS_KEY = 'space-shooter-local-scores';
const MAX_PARTICLES = 700;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.input = new InputManager(canvas);
    this.audio = new AudioManager();
    this.ui = new UIManager();

    this.state = 'menu';
    this.lastTime = 0;
    this.timeScale = 1;
    this.hitFlash = 0;
    this.shake = 0;

    this.wave = 1;
    this.score = 0;
    this.player = new Player(this.width / 2, this.height * 0.75);
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.enemyBulletQueue = [];

    this.localScores = this.loadLocalScores();
    this.serverScores = [];
    this.starLayers = createStarLayers(this.width, this.height);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindUi();
    this.fetchScores();

    this.ui.setScreen('menu');
    this.ui.renderLeaderboard(this.mergeScores());

    requestAnimationFrame((t) => this.loop(t));
  }

  bindUi() {
    document.getElementById('startBtn').addEventListener('click', () => {
      this.audio.ensureContext();
      this.startGame();
    });
    document.getElementById('viewScoresBtn').addEventListener('click', async () => {
      await this.fetchScores();
      this.ui.renderLeaderboard(this.mergeScores());
      this.state = 'scores';
      this.ui.setScreen('scores');
    });
    document.getElementById('scoresBackBtn').addEventListener('click', () => {
      this.state = 'menu';
      this.ui.setScreen('menu');
    });
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.startGame();
    });
    document.getElementById('saveScoreBtn').addEventListener('click', () => {
      this.submitScore();
    });
    this.ui.mobilePause.addEventListener('click', () => this.togglePause());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.starLayers = createStarLayers(this.width, this.height);
    if (this.player) {
      this.player.x = Math.min(this.width - 20, Math.max(20, this.player.x));
      this.player.y = Math.min(this.height - 20, Math.max(20, this.player.y));
    }
  }

  startGame() {
    this.state = 'playing';
    this.wave = 1;
    this.score = 0;
    this.timeScale = 1;
    this.hitFlash = 0;
    this.shake = 0;
    this.player = new Player(this.width / 2, this.height * 0.75);
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.spawnWave();
    this.ui.setScreen('playing');
  }

  spawnWave() {
    this.enemies = spawnWaveEnemies(this.wave, this.width);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'pause';
      this.ui.setScreen('pause');
    } else if (this.state === 'pause') {
      this.state = 'playing';
      this.ui.setScreen('playing');
    }
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = Math.min(0.033, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === 'playing') {
      dt *= this.timeScale;
      this.update(dt);
    }

    this.draw(dt);
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.input.consumePausePressed()) {
      this.togglePause();
      return;
    }

    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 16);
    this.timeScale += (1 - this.timeScale) * Math.min(1, dt * 4);

    this.player.update(dt, this.input, this.width, this.height);

    if (this.player.canShoot(this.input)) {
      const shots = this.player.getShotConfig();
      shots.forEach((shot) => {
        const vx = Math.cos(shot.angle) * shot.speed;
        const vy = Math.sin(shot.angle) * shot.speed;
        this.bullets.push(new Bullet({ x: this.player.x, y: this.player.y - 8, vx, vy, damage: 1, fromPlayer: true }));
      });
      this.audio.shoot();
      burstParticles(this.particles, this.player.x + Math.cos(this.player.angle) * 14, this.player.y + Math.sin(this.player.angle) * 14, '#38f6ff', 6, 60);
    }

    this.particles.push(new Particle({
      x: this.player.x + (Math.random() - 0.5) * 6,
      y: this.player.y + 15,
      vx: (Math.random() - 0.5) * 20,
      vy: 40 + Math.random() * 45,
      life: 0.22,
      size: 2,
      color: '#ff4de3'
    }));

    this.enemyBulletQueue.length = 0;
    this.enemies.forEach((enemy) => enemy.update(dt, this.player, this.enemyBulletQueue));
    this.enemyBulletQueue.forEach((b) => this.bullets.push(new Bullet(b)));

    this.powerups.forEach((p) => p.update(dt, this.height));
    this.bullets.forEach((b) => b.update(dt, this.width, this.height));
    this.particles.forEach((p) => p.update(dt));

    this.handleCollisions();

    this.cleanupArrays();

    if (this.enemies.length === 0) {
      this.wave += 1;
      this.spawnWave();
    }

    this.ui.updateHud(this);
  }

  handleCollisions() {
    for (const bullet of this.bullets) {
      if (bullet.dead || !bullet.fromPlayer) continue;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (distanceSq(bullet, enemy) < (bullet.radius + enemy.radius) ** 2) {
          bullet.dead = true;
          if (enemy.takeDamage(bullet.damage)) {
            this.score += enemy.score;
            const isBoss = enemy.type === 'boss';
            burstParticles(this.particles, enemy.x, enemy.y, isBoss ? '#ff335f' : '#ff7b6f', isBoss ? 70 : 24, isBoss ? 220 : 130);
            this.audio.explosion(isBoss);
            this.shake = isBoss ? 15 : 6;
            if (isBoss) {
              this.timeScale = 0.45;
            }
            const drop = maybeDropPowerup(enemy);
            if (drop) this.powerups.push(drop);
          } else {
            burstParticles(this.particles, bullet.x, bullet.y, '#ffffff', 8, 45);
          }
          break;
        }
      }
    }

    for (const bullet of this.bullets) {
      if (bullet.dead || bullet.fromPlayer) continue;
      if (distanceSq(bullet, this.player) < (bullet.radius + this.player.radius) ** 2) {
        bullet.dead = true;
        this.audio.hit();
        this.hitFlash = 1;
        this.shake = 7;
        if (this.player.takeDamage(bullet.damage)) {
          this.endGame();
          return;
        }
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (distanceSq(enemy, this.player) < (enemy.radius + this.player.radius) ** 2) {
        enemy.dead = true;
        this.hitFlash = 1;
        this.shake = 10;
        this.audio.hit();
        burstParticles(this.particles, enemy.x, enemy.y, '#ff6d7d', 22, 150);
        if (this.player.takeDamage(enemy.type === 'boss' ? 55 : 24)) {
          this.endGame();
          return;
        }
      }
    }

    for (const powerup of this.powerups) {
      if (powerup.dead) continue;
      if (distanceSq(powerup, this.player) < (powerup.radius + this.player.radius) ** 2) {
        powerup.dead = true;
        this.applyPowerup(powerup.kind);
      }
    }
  }

  applyPowerup(kind) {
    this.audio.powerup();
    burstParticles(this.particles, this.player.x, this.player.y, '#70ff9f', 26, 110);
    if (kind === 'rapid') this.player.powerups.rapid = 8;
    if (kind === 'triple') this.player.powerups.triple = 8;
    if (kind === 'shield') this.player.powerups.shield = 7;
    if (kind === 'health') this.player.heal(30);
    if (kind === 'bomb') {
      this.enemies.forEach((enemy) => {
        enemy.dead = true;
        this.score += Math.floor(enemy.score * 0.6);
        burstParticles(this.particles, enemy.x, enemy.y, '#ffd54f', 14, 130);
      });
      this.shake = 12;
    }
  }

  endGame() {
    this.state = 'gameover';
    this.ui.setFinalScore(this.score);
    this.ui.setScreen('gameover');
    this.saveLocalScore('ACE', this.score);
    this.fetchScores().then(() => this.ui.renderLeaderboard(this.mergeScores()));
  }

  saveLocalScore(name, score) {
    const entry = normalizeScoreEntry({ name, score, created_at: new Date().toISOString() });
    if (entry) this.localScores.push(entry);
    this.localScores.sort(sortScores);
    this.localScores = this.localScores.slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify(this.localScores));
  }

  loadLocalScores() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(normalizeScoreEntry).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  async fetchScores() {
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) throw new Error('scores request failed');
      const scores = await res.json();
      if (Array.isArray(scores)) {
        this.serverScores = scores;
      }
    } catch {
      this.serverScores = [];
    }
  }

  mergeScores() {
    const merged = [...this.localScores, ...this.serverScores]
      .map(normalizeScoreEntry)
      .filter(Boolean);
    merged.sort(sortScores);
    return merged.slice(0, 10);
  }

  async submitScore() {
    const name = this.ui.getPlayerName();
    if (!name) return;
    this.saveLocalScore(name, this.score);

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score: this.score })
      });
      if (!response.ok) {
        throw new Error('Unable to submit score');
      }
      await this.fetchScores();
    } catch {
      // local score persistence still works
    }

    this.ui.renderLeaderboard(this.mergeScores());
  }

  cleanupArrays() {
    this.bullets = this.bullets.filter((x) => !x.dead);
    this.enemies = this.enemies.filter((x) => !x.dead);
    this.particles = this.particles.filter((x) => !x.dead).slice(-MAX_PARTICLES);
    this.powerups = this.powerups.filter((x) => !x.dead);
  }

  draw(dt) {
    const ctx = this.ctx;
    drawStarfield(ctx, this.starLayers, this.width, this.height, dt);

    const shakeX = (Math.random() - 0.5) * this.shake;
    const shakeY = (Math.random() - 0.5) * this.shake;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.powerups.forEach((p) => drawPowerUp(ctx, p));
    this.bullets.forEach((b) => b.draw(ctx));
    this.enemies.forEach((enemy) => {
      drawEnemyShip(ctx, enemy);
      if (enemy.type === 'boss') {
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(enemy.x - 46, enemy.y - 54, 92, 8);
        ctx.fillStyle = '#ff335f';
        ctx.fillRect(enemy.x - 46, enemy.y - 54, 92 * (enemy.hp / enemy.maxHp), 8);
      }
    });

    drawPlayerShip(ctx, this.player.x, this.player.y, this.player.angle, this.player.health / this.player.maxHealth, this.player.powerups.shield > 0);
    this.particles.forEach((p) => p.draw(ctx));

    ctx.restore();

    drawHudDecor(ctx, this.width);
    this.ui.drawScreenFx(ctx, this.width, this.height, this);
  }
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function normalizeScoreEntry(entry) {
  if (typeof entry?.name !== 'string' || !Number.isInteger(entry?.score)) {
    return null;
  }
  const created_at = entry.created_at || new Date().toISOString();
  return {
    name: entry.name.trim().slice(0, 12),
    score: entry.score,
    created_at,
    created_at_ms: Date.parse(created_at) || Date.now()
  };
}

function sortScores(a, b) {
  return (b.score - a.score) || (a.created_at_ms - b.created_at_ms);
}
