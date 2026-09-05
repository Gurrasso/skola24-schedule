from flask import Flask, jsonify, request
from functools import wraps
from pathlib import Path

import subprocess
import threading
import time
import json
import hmac
import hashlib


app = Flask(__name__)

TIMETABLE_FILE = "timetable.json"
WORKER_FILE = "scripts/timetable.py"
HASH_FILE = Path("/run/secrets/api_key_hash")

try:
    EXPECTED_HASH = HASH_FILE.read_text().strip()
except FileNotFoundError:
    raise RuntimeError("\nAPI key hash not found at /run/secrets/api_key_hash,\nMount this file with docker when running the server")


def verify_api_key(api_key: str) -> bool:
    actual_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return hmac.compare_digest(actual_hash, EXPECTED_HASH)


def require_api_key(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")

        scheme, _, supplied_key = authorization.partition(" ")

        if (
            scheme.lower() != "bearer"
            or not supplied_key
            or not verify_api_key(supplied_key)
        ):
            response = jsonify({"error": "Invalid or missing API key"})
            response.status_code = 401
            response.headers["WWW-Authenticate"] = "Bearer"
            return response

        return view(*args, **kwargs)

    return wrapped_view


def run_worker():
    """Run timetable.py once every hour."""
    while True:
        try:
            subprocess.run(["python", WORKER_FILE], check=True)
        except subprocess.CalledProcessError as e:
            print(WORKER_FILE, f" failed: {e}")
        except Exception as e:
            print("Error running ", WORKER_FILE, f" {e}")

        time.sleep(60 * 60)


@app.route("/timetable", methods=["GET"])
@require_api_key
def timetable():
    try:
        with open(TIMETABLE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        return jsonify(data)

    except FileNotFoundError:
        return jsonify({"error": "timetable.json not found"}), 404

    except json.JSONDecodeError:
        return jsonify({"error": "timetable.json contains invalid JSON"}), 500

@app.route("/status")
def status():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # Start the hourly worker in the background
    thread = threading.Thread(target=run_worker, daemon=True)
    thread.start()

    # Start the web server
    app.run(host="0.0.0.0", port=5000)
