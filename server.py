from __future__ import annotations

import sqlite3
import threading
import time
from pathlib import Path
from typing import Any

from flask import Flask, g, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "space_shooter.db"
RATE_LIMIT_MAX_REQUESTS = 15
RATE_LIMIT_WINDOW_SECONDS = 60

app = Flask(__name__, static_folder="static", static_url_path="/static")
_db_init_lock = threading.Lock()
_rate_limit_lock = threading.Lock()
_rate_limit_state: dict[str, list[float]] = {}


def get_db() -> sqlite3.Connection:
    db = getattr(g, "db", None)
    if db is None:
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        g.db = db
    return db


def init_db() -> None:
    with _db_init_lock:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    score INTEGER NOT NULL CHECK(score >= 0),
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()
        finally:
            conn.close()


def is_rate_limited(ip_address: str) -> bool:
    now = time.time()
    with _rate_limit_lock:
        hits = _rate_limit_state.setdefault(ip_address, [])
        hits[:] = [ts for ts in hits if now - ts < RATE_LIMIT_WINDOW_SECONDS]
        if len(hits) >= RATE_LIMIT_MAX_REQUESTS:
            return True
        hits.append(now)
    return False


def normalize_name(raw_name: Any) -> str | None:
    if not isinstance(raw_name, str):
        return None
    name = raw_name.strip()
    if 1 <= len(name) <= 12:
        return name
    return None


def normalize_score(raw_score: Any) -> int | None:
    if isinstance(raw_score, bool):
        return None
    if isinstance(raw_score, int) and raw_score >= 0:
        return raw_score
    return None


@app.route("/")
def root() -> Any:
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/scores", methods=["GET", "POST"])
def scores() -> Any:
    if request.method == "GET":
        rows = get_db().execute(
            """
            SELECT name, score, created_at
            FROM scores
            ORDER BY score DESC, created_at ASC
            LIMIT 10
            """
        ).fetchall()
        return jsonify([dict(row) for row in rows])

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
    if is_rate_limited(client_ip):
        return jsonify({"error": "Rate limit exceeded. Try again soon."}), 429

    payload = request.get_json(silent=True) or {}
    name = normalize_name(payload.get("name"))
    score = normalize_score(payload.get("score"))

    if name is None:
        return jsonify({"error": "Invalid name. Must be 1..12 characters."}), 400
    if score is None:
        return jsonify({"error": "Invalid score. Must be an integer >= 0."}), 400

    db = get_db()
    db.execute("INSERT INTO scores (name, score) VALUES (?, ?)", (name, score))
    db.commit()
    return jsonify({"ok": True}), 201


@app.teardown_appcontext
def close_db(_: Any) -> None:
    db = getattr(g, "db", None)
    if db is not None:
        db.close()


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
