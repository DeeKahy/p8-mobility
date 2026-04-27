import json
import os
import shutil

from flask import Flask, jsonify
from utils import (
    add_created_metadata,
    api_error,
    floorplan_file_path,
    floorplan_path,
    json_body,
    marker_coordinates_from_body,
    marker_file_path,
    markers_path,
    read_json_file,
    safe_name,
    user_path,
    write_json_file,
    write_new_json_file,
)

app = Flask(__name__)

@app.route("/api/users/<username>/floorplans", methods=["GET"])
def list_floorplans(username):
    """Return all floorplans for one user."""
    try:
        username = safe_name(username)
    except ValueError:
        return api_error("invalid name", 400)

    user_dir = user_path(username)
    if not os.path.isdir(user_dir):
        return jsonify({"floorplans": []})

    floorplans = []

    try:
        for entry in os.listdir(user_dir):
            floorplan_json_path = floorplan_file_path(username, entry)
            if not os.path.isfile(floorplan_json_path):
                continue

            floorplan_data = read_json_file(floorplan_json_path)
            floorplans.append(floorplan_data)
    except OSError as error:
        return api_error(f"read failed: {error}", 500)
    except json.JSONDecodeError:
        return api_error("corrupted file", 500)

    return jsonify({"floorplans": floorplans})


@app.route("/api/users/<username>/floorplans/<floorplan_name>/markers", methods=["GET"])
def list_markers(username, floorplan_name):
    """Return all markers for one floorplan."""
    try:
        username = safe_name(username)
        floorplan_name = safe_name(floorplan_name)
    except ValueError:
        return api_error("invalid name", 400)

    floorplan_json_path = floorplan_file_path(username, floorplan_name)
    marker_dir = markers_path(username, floorplan_name)

    if not os.path.isfile(floorplan_json_path):
        return api_error("floorplan not found", 404)

    if not os.path.isdir(marker_dir):
        return jsonify({"markers": []})

    markers = []

    try:
        for entry in os.listdir(marker_dir):
            if not entry.endswith(".json"):
                continue

            marker_data = read_json_file(os.path.join(marker_dir, entry))
            markers.append(marker_data)
    except OSError as error:
        return api_error(f"read failed: {error}", 500)
    except json.JSONDecodeError:
        return api_error("corrupted file", 500)

    return jsonify({"markers": markers})


@app.route("/api/users/<username>/floorplans", methods=["POST"])
def create_floorplan(username):
    """Append a new floorplan for one user."""
    try:
        username = safe_name(username)
        body = json_body()
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    floorplan_name = body.get("name")
    try:
        floorplan_name = safe_name(floorplan_name)
    except ValueError:
        return api_error("invalid name", 400)

    floorplan_json_path = floorplan_file_path(username, floorplan_name)
    floorplan_data = add_created_metadata(body)

    try:
        os.makedirs(markers_path(username, floorplan_name), exist_ok=True)
        write_new_json_file(floorplan_json_path, floorplan_data)
    except FileExistsError:
        return api_error("floorplan already exists", 409)
    except OSError as error:
        return api_error(f"write failed: {error}", 500)

    return jsonify({"status": "created", "floorplan": floorplan_data}), 201


@app.route("/api/users/<username>/floorplans/<floorplan_name>/markers", methods=["POST"])
def create_marker(username, floorplan_name):
    """Append a new marker to one floorplan."""
    try:
        username = safe_name(username)
        floorplan_name = safe_name(floorplan_name)
        body = json_body()
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    marker_name = body.get("name") or body.get("id")
    try:
        marker_name = safe_name(marker_name)
    except ValueError:
        return api_error("invalid name", 400)

    if not os.path.isfile(floorplan_file_path(username, floorplan_name)):
        return api_error("floorplan not found", 404)

    marker_json_path = marker_file_path(username, floorplan_name, marker_name)
    marker_data = add_created_metadata(body)

    try:
        write_new_json_file(marker_json_path, marker_data)
    except FileExistsError:
        return api_error("marker already exists", 409)
    except OSError as error:
        return api_error(f"write failed: {error}", 500)

    return jsonify({"status": "created", "marker": marker_data}), 201


@app.route("/api/users/<username>/floorplans/<floorplan_name>", methods=["DELETE"])
def delete_floorplan(username, floorplan_name):
    """Delete one floorplan and all its markers."""
    try:
        username = safe_name(username)
        floorplan_name = safe_name(floorplan_name)
    except ValueError:
        return api_error("invalid name", 400)

    target_dir = floorplan_path(username, floorplan_name)
    if not os.path.isdir(target_dir):
        return api_error("floorplan not found", 404)

    try:
        shutil.rmtree(target_dir)
    except OSError as error:
        return api_error(f"delete failed: {error}", 500)

    return jsonify({"status": "deleted"})


@app.route("/api/users/<username>/floorplans/<floorplan_name>/markers/<marker_name>", methods=["DELETE"])
def delete_marker(username, floorplan_name, marker_name):
    """Delete one marker from one floorplan."""
    try:
        username = safe_name(username)
        floorplan_name = safe_name(floorplan_name)
        marker_name = safe_name(marker_name)
    except ValueError:
        return api_error("invalid name", 400)

    target_file = marker_file_path(username, floorplan_name, marker_name)
    if not os.path.isfile(target_file):
        return api_error("marker not found", 404)

    try:
        os.remove(target_file)
    except OSError as error:
        return api_error(f"delete failed: {error}", 500)

    return jsonify({"status": "deleted"})


@app.route(
    "/api/users/<username>/floorplans/<floorplan_name>/markers/<marker_name>/coordinates",
    methods=["PATCH"],
)
def update_marker_coordinates(username, floorplan_name, marker_name):
    """Overwrite only the coordinates for one marker."""
    try:
        username = safe_name(username)
        floorplan_name = safe_name(floorplan_name)
        marker_name = safe_name(marker_name)
        body = json_body()
        new_coordinates = marker_coordinates_from_body(body)
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    target_file = marker_file_path(username, floorplan_name, marker_name)
    if not os.path.isfile(target_file):
        return api_error("marker not found", 404)

    try:
        marker_data = read_json_file(target_file)
        marker_data.update(new_coordinates)
        write_json_file(target_file, marker_data)
    except OSError as error:
        return api_error(f"write failed: {error}", 500)
    except json.JSONDecodeError:
        return api_error("corrupted file", 500)

    return jsonify({"status": "updated", "marker": marker_data})


@app.route("/api/resetUser/<username>", methods=["DELETE"])
def reset_user(username):
    """Delete all data for one user."""
    try:
        username = safe_name(username)
    except ValueError:
        return api_error("invalid name", 400)

    user_dir = user_path(username)

    try:
        if os.path.exists(user_dir):
            shutil.rmtree(user_dir)
    except OSError as error:
        return api_error(f"delete failed: {error}", 500)

    return jsonify({"status": "deleted"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
