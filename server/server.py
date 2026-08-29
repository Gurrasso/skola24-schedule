from flask import Flask, jsonify
import subprocess
import threading
import time
import json

app = Flask(__name__)

TIMETABLE_FILE = "timetable.json"
WORKER_FILE = "scripts/timetable.py"


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
def timetable():
    try:
        with open(TIMETABLE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        return jsonify(data)

    except FileNotFoundError:
        return jsonify({"error": "timetable.json not found"}), 404

    except json.JSONDecodeError:
        return jsonify({"error": "timetable.json contains invalid JSON"}), 500


if __name__ == "__main__":
    # Start the hourly worker in the background
    thread = threading.Thread(target=run_worker, daemon=True)
    thread.start()

    # Start the web server
    app.run(host="0.0.0.0", port=5000)
