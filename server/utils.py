import json
import os
import re
from datetime import datetime, timezone

from flask import jsonify, request

DATA_DIR = "data"

os.makedirs(DATA_DIR, exist_ok=True)


def safe_name(name):
    """Return a sanitized name that is safe to use in paths."""
    if not isinstance(name, str) or not name or len(name) > 64:
        raise ValueError("Invalid name")

    sanitized = re.sub(r"[^a-zA-Z0-9_-]", "", name)
    if not sanitized:
        raise ValueError("Invalid name")

    return sanitized


def utc_now():
    """Return the current UTC time as an ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def json_body():
    """Return the request JSON body or raise ValueError."""
    data = request.get_json()
    if not isinstance(data, dict):
        raise ValueError("Invalid JSON body")
    return data


def user_path(username):
    """Return the directory path for one user."""
    return os.path.join(DATA_DIR, username)


def floorplan_path(username, floorplan_name):
    """Return the directory path for one floorplan."""
    return os.path.join(user_path(username), floorplan_name)


def floorplan_file_path(username, floorplan_name):
    """Return the JSON file path for one floorplan."""
    return os.path.join(floorplan_path(username, floorplan_name), "floorplan.json")


def markers_path(username, floorplan_name):
    """Return the markers directory path for one floorplan."""
    return os.path.join(floorplan_path(username, floorplan_name), "markers")


def marker_file_path(username, floorplan_name, marker_name):
    """Return the JSON file path for one marker."""
    return os.path.join(markers_path(username, floorplan_name), f"{marker_name}.json")


def ensure_parent_dir(path):
    """Create the parent directory for a file if it does not exist."""
    parent_dir = os.path.dirname(path)
    os.makedirs(parent_dir, exist_ok=True)


def read_json_file(path):
    """Read and return JSON from a file."""
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def write_new_json_file(path, data):
    """Write a new JSON file and fail if it already exists."""
    ensure_parent_dir(path)

    with open(path, "x", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def write_json_file(path, data):
    """Write JSON to an existing file."""
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def add_created_metadata(data):
    """Return a copy of data with creation metadata added."""
    data_with_metadata = dict(data)
    data_with_metadata["createdAt"] = utc_now()
    return data_with_metadata


def marker_coordinates_from_body(data):
    """Extract only the coordinates payload for a marker update."""
    if "coordinates" in data:
        return {"coordinates": data["coordinates"]}

    coordinates = {}

    if "x" in data:
        coordinates["x"] = data["x"]
    if "y" in data:
        coordinates["y"] = data["y"]
    if "z" in data:
        coordinates["z"] = data["z"]

    if not coordinates:
        raise ValueError("Missing coordinates")

    return coordinates


def api_error(message, status_code):
    """Return a JSON error response."""
    return jsonify({"error": message}), status_code
