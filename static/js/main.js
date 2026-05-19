import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
new Game(canvas);

window.addEventListener('touchmove', (e) => {
  if (e.target.closest('#mobileControls')) {
    e.preventDefault();
  }
}, { passive: false });
