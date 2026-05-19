export const COLORS = {
  bgA: '#050a1f',
  bgB: '#09173a',
  cyan: '#38f6ff',
  magenta: '#ff4de3',
  yellow: '#ffd54f',
  red: '#ff4d67',
  green: '#70ff9f',
  white: '#f2fbff'
};

export function createStarLayers(width, height) {
  const makeLayer = (count, speed, size, alpha) => ({
    speed,
    stars: Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: size * (0.5 + Math.random()),
      alpha: alpha * (0.35 + Math.random() * 0.65)
    }))
  });

  return [
    makeLayer(70, 18, 1, 0.35),
    makeLayer(50, 32, 1.5, 0.5),
    makeLayer(30, 54, 2.2, 0.75)
  ];
}

export function drawStarfield(ctx, layers, width, height, dt) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, COLORS.bgA);
  grad.addColorStop(1, COLORS.bgB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  layers.forEach((layer, idx) => {
    layer.stars.forEach((star) => {
      star.y += layer.speed * dt;
      if (star.y > height + 5) {
        star.y = -5;
        star.x = Math.random() * width;
      }
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = idx === 2 ? COLORS.cyan : COLORS.white;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  });
  ctx.globalAlpha = 1;
}

export function drawPlayerShip(ctx, x, y, angle, healthRatio, shielded = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(56,246,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(11, 13);
  ctx.lineTo(0, 8);
  ctx.lineTo(-11, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(-2, 3, 4, 7);

  ctx.strokeStyle = `rgba(255,77,227,${0.4 + 0.6 * healthRatio})`;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(0, -8);
  ctx.lineTo(8, 6);
  ctx.stroke();

  if (shielded) {
    ctx.strokeStyle = 'rgba(112,255,159,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawEnemyShip(ctx, enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle + Math.PI / 2);

  const palettes = {
    grunt: ['#ff5d87', 'rgba(255,93,135,0.28)'],
    kamikaze: ['#ff9d4d', 'rgba(255,157,77,0.22)'],
    sniper: ['#c080ff', 'rgba(192,128,255,0.2)'],
    boss: ['#ff335f', 'rgba(255,51,95,0.3)']
  };
  const [stroke, fill] = palettes[enemy.type] || palettes.grunt;

  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineWidth = enemy.type === 'boss' ? 3 : 2;

  if (enemy.type === 'sniper') {
    ctx.beginPath();
    ctx.rect(-12, -14, 24, 28);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(14, -8);
    ctx.stroke();
  } else {
    const scale = enemy.type === 'boss' ? 1.8 : 1;
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, -2);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 9);
    ctx.lineTo(-10, 15);
    ctx.lineTo(-14, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPowerUp(ctx, powerup) {
  const colors = {
    rapid: COLORS.yellow,
    triple: COLORS.magenta,
    shield: COLORS.green,
    bomb: COLORS.red,
    health: COLORS.cyan
  };
  const c = colors[powerup.kind] || COLORS.white;
  ctx.save();
  ctx.translate(powerup.x, powerup.y);
  ctx.rotate(powerup.spin);
  ctx.strokeStyle = c;
  ctx.fillStyle = c + '33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
