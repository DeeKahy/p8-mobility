# Modifying this file wil NOT modify anything on the server unless you manually move it over.
import os
import json
import shutil
import re

from flask import Flask, request, jsonify

app = Flask(__name__)
DATA_DIR = "data"

os.makedirs(DATA_DIR, exist_ok=True)


def safe_name(name):
    """Prevent path traversal and invalid characters."""
    if not name or len(name) > 64:
        raise ValueError("Invalid name")
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', name)
    if not sanitized:
        raise ValueError("Invalid name")
    return sanitized


def user_path(username):
    return os.path.join(DATA_DIR, username)


@app.route('/api/saveData/<username>/<filename>', methods=['POST'])
def save_data(username, filename):
    try:
        username = safe_name(username)
        filename = safe_name(filename)
    except ValueError:
        return jsonify({"error": "invalid name"}), 400

    user_dir = user_path(username)

    try:
        os.makedirs(user_dir, exist_ok=True)

        with open(os.path.join(user_dir, f"{filename}.json"), 'w') as f:
            json.dump(request.get_json(), f)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid JSON"}), 400
    except OSError as e:
        return jsonify({"error": f"write failed: {str(e)}"}), 500

    return jsonify({"status": "saved"})


@app.route('/api/getData/<username>/<filename>')
def get_data(username, filename):
    try:
        username = safe_name(username)
        filename = safe_name(filename)
    except ValueError:
        return jsonify({"error": "invalid name"}), 400

    filepath = os.path.join(user_path(username), f"{filename}.json")

    try:
        with open(filepath) as f:
            data = json.load(f)
    except FileNotFoundError:
        return jsonify({"error": "file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "corrupted file"}), 500

    return jsonify(data)


@app.route('/api/listData/<username>')
def list_data(username):
    try:
        username = safe_name(username)
    except ValueError:
        return jsonify({"error": "invalid name"}), 400

    user_dir = user_path(username)

    if not os.path.exists(user_dir):
        return jsonify({"files": []})

    try:
        files = [f.replace('.json', '') for f in os.listdir(user_dir) if f.endswith('.json')]
        return jsonify({"files": files})
    except OSError as e:
        return jsonify({"error": f"read failed: {str(e)}"}), 500


@app.route('/api/resetUser/<username>', methods=['DELETE'])
def reset_user(username):
    try:
        username = safe_name(username)
    except ValueError:
        return jsonify({"error": "invalid name"}), 400

    user_dir = user_path(username)

    try:
        if os.path.exists(user_dir):
            shutil.rmtree(user_dir)
    except OSError as e:
        return jsonify({"error": f"delete failed: {str(e)}"}), 500

    return jsonify({"status": "deleted"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
