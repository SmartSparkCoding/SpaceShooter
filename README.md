# Space Shooter

A polished browser arcade shoot-'em-up built with **HTML5 Canvas + vanilla ES modules** and a **Flask + SQLite** backend for persistent high scores.

> Folder naming in this guide follows `space-shooter` as requested.

## Features

- 60 FPS delta-time game loop
- WASD/Arrow movement + mouse aim + Space/click shooting
- Enemy roster: grunt, kamikaze, sniper, boss (every 5 waves)
- Wave progression with scaling difficulty
- Power-ups: rapid fire, triple shot, shield, bomb, health
- Juicy effects: parallax starfield, particles, shake, hit-flash, slow-mo boss kills
- Procedurally drawn ships and effects (no image dependencies)
- Procedural Web Audio effects (shoot/explosion/powerup)
- Screens: menu, pause, game-over, high-scores
- Local storage + server-synced top-10 leaderboard
- Mobile controls: virtual joystick, fire button, pause button, scroll prevention

## Project structure

```text
space-shooter/
├── server.py
├── requirements.txt
├── README.md
└── static/
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── main.js
    │   ├── game.js
    │   ├── player.js
    │   ├── enemy.js
    │   ├── bullet.js
    │   ├── particle.js
    │   ├── powerup.js
    │   ├── audio.js
    │   ├── input.js
    │   ├── ui.js
    │   └── assets.js
    └── assets/
```

## Setup

```bash
cd space-shooter
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python3 server.py
```

Open: <http://localhost:5000>

## Controls

### Desktop
- **Move:** WASD / Arrow keys
- **Aim:** Mouse
- **Shoot:** Left click / Space
- **Pause:** P / Escape

### Mobile
- **Move:** Virtual joystick (bottom-left)
- **Shoot:** Fire button (bottom-right)
- **Pause:** Pause button (top-right)

## API

### `GET /api/scores`
Returns top 10 scores sorted by score descending, then oldest first on ties.

### `POST /api/scores`
Body:

```json
{ "name": "ACE", "score": 12345 }
```

Validation:
- `name`: string length 1..12
- `score`: integer >= 0

## Troubleshooting

- **Port 5000 in use:** run `lsof -i :5000` and stop conflicting process.
- **No sound:** browsers require user interaction before audio starts — click/tap once.
- **Touch controls not visible:** ensure viewport width is small enough or use device emulation.
- **Scores not saving:** verify write permissions for `space_shooter.db`.
