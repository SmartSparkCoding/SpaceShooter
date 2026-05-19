import { COLORS } from './assets.js';

export class UIManager {
  constructor() {
    this.overlay = document.getElementById('overlay');
    this.menuPanel = document.getElementById('menuPanel');
    this.scoresPanel = document.getElementById('scoresPanel');
    this.gameOverPanel = document.getElementById('gameOverPanel');
    this.pauseBadge = document.getElementById('pauseBadge');
    this.hudScore = document.getElementById('hudScore');
    this.hudWave = document.getElementById('hudWave');
    this.hudLives = document.getElementById('hudLives');
    this.healthFill = document.getElementById('healthFill');
    this.powerupTimers = document.getElementById('powerupTimers');
    this.highscoreList = document.getElementById('highscoreList');
    this.finalScore = document.getElementById('finalScore');
    this.nameInput = document.getElementById('nameInput');
    this.saveScoreBtn = document.getElementById('saveScoreBtn');
    this.mobilePause = document.getElementById('mobilePause');

    this.transition = 1;
  }

  setScreen(screen) {
    this.menuPanel.classList.toggle('hidden', screen !== 'menu');
    this.scoresPanel.classList.toggle('hidden', screen !== 'scores');
    this.gameOverPanel.classList.toggle('hidden', screen !== 'gameover');
    this.pauseBadge.classList.toggle('hidden', screen !== 'pause');
    this.overlay.classList.toggle('hidden', screen === 'playing');
  }

  updateHud(game) {
    this.hudScore.textContent = String(game.score);
    this.hudWave.textContent = String(game.wave);
    this.hudLives.textContent = String(game.player.lives);
    this.healthFill.style.width = `${(game.player.health / game.player.maxHealth) * 100}%`;

    const entries = [];
    if (game.player.powerups.rapid > 0) entries.push(`Rapid ${game.player.powerups.rapid.toFixed(1)}s`);
    if (game.player.powerups.triple > 0) entries.push(`Triple ${game.player.powerups.triple.toFixed(1)}s`);
    if (game.player.powerups.shield > 0) entries.push(`Shield ${game.player.powerups.shield.toFixed(1)}s`);
    this.powerupTimers.textContent = entries.join('  •  ');
  }

  drawScreenFx(ctx, width, height, game) {
    if (game.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,77,103,${game.hitFlash * 0.45})`;
      ctx.fillRect(0, 0, width, height);
    }

    this.transition += (game.state === 'playing' ? 0 : 1 - this.transition) * 0.16;
    if (game.state === 'playing' && this.transition > 0.02) {
      this.transition *= 0.86;
    }

    if (this.transition > 0.02 && game.state !== 'playing') {
      ctx.fillStyle = `rgba(5,10,31,${Math.min(0.55, this.transition * 0.5)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  renderLeaderboard(scores) {
    this.highscoreList.innerHTML = '';
    if (!scores.length) {
      const li = document.createElement('li');
      li.textContent = 'No scores yet — be the first ace pilot.';
      this.highscoreList.appendChild(li);
      return;
    }

    scores.forEach((entry, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${i + 1}. ${escapeHtml(entry.name)}</span><span>${entry.score}</span>`;
      this.highscoreList.appendChild(li);
    });
  }

  setFinalScore(value) {
    this.finalScore.textContent = String(value);
  }

  getPlayerName() {
    return this.nameInput.value.trim().slice(0, 12);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function drawHudDecor(ctx, width) {
  ctx.strokeStyle = COLORS.cyan;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(16, 44);
  ctx.lineTo(width - 16, 44);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
