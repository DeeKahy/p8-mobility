import base64
import io
import json
import os
import shutil

from flask import Flask, jsonify, send_file
from PIL import Image, ImageDraw, ImageFont
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
    """Return all floorplans for the given username."""
    print(f"[route] list_floorplans hit: username={username}")
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


@app.route("/api/users/<username>/floorplans/<floorplan_id>/markers", methods=["GET"])
def list_markers(username, floorplan_id):
    """Return all markers for one floorplan.

    The username input selects the user folder, and floorplan_id selects the
    floorplan folder inside that user. The route checks that the floorplan
    exists, then reads every marker JSON file from markers/ and returns them.
    """
    print(f"[route] list_markers hit: username={username}, floorplan_id={floorplan_id}")
    try:
        username = safe_name(username)
        floorplan_id = safe_name(floorplan_id)
    except ValueError:
        return api_error("invalid name", 400)

    floorplan_json_path = floorplan_file_path(username, floorplan_id)
    marker_dir = markers_path(username, floorplan_id)

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
    """Create one new floorplan for the given user.

    The username path input decides which user folder to write to. The JSON body
    must contain an id field, and that id is used as the floorplan folder name.
    The logic only appends new data: it creates floorplan.json and markers/
    once, adds createdAt metadata, and rejects the request if the floorplan
    already exists.
    """
    print(f"[route] create_floorplan hit: username={username}")
    try:
        username = safe_name(username)
        body = json_body()
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    floorplan_id = body.get("id")
    try:
        floorplan_id = safe_name(floorplan_id)
    except ValueError:
        return api_error("invalid name", 400)

    floorplan_json_path = floorplan_file_path(username, floorplan_id)
    floorplan_data = add_created_metadata(body)

    try:
        os.makedirs(markers_path(username, floorplan_id), exist_ok=True)
        write_new_json_file(floorplan_json_path, floorplan_data)
    except FileExistsError:
        return api_error("floorplan already exists", 409)
    except OSError as error:
        return api_error(f"write failed: {error}", 500)

    return jsonify({"status": "created", "floorplan": floorplan_data}), 201


@app.route("/api/users/<username>/floorplans/<floorplan_id>/markers", methods=["POST"])
def create_marker(username, floorplan_id):
    """Create one new marker inside one floorplan.

    The username and floorplan_id path inputs are used to find the floorplan
    folder. The JSON body must contain an id field, and that id becomes the
    marker file name inside markers/. The logic is append-only: it adds
    createdAt metadata and fails if the marker file already exists.
    """
    print(f"[route] create_marker hit: username={username}, floorplan_id={floorplan_id}")
    try:
        username = safe_name(username)
        floorplan_id = safe_name(floorplan_id)
        body = json_body()
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    marker_id = body.get("id")
    try:
        marker_id = safe_name(marker_id)
    except ValueError:
        return api_error("invalid name", 400)

    if not os.path.isfile(floorplan_file_path(username, floorplan_id)):
        return api_error("floorplan not found", 404)

    marker_json_path = marker_file_path(username, floorplan_id, marker_id)
    marker_data = add_created_metadata(body)

    try:
        write_new_json_file(marker_json_path, marker_data)
    except FileExistsError:
        return api_error("marker already exists", 409)
    except OSError as error:
        return api_error(f"write failed: {error}", 500)

    return jsonify({"status": "created", "marker": marker_data}), 201


@app.route("/api/users/<username>/floorplans/<floorplan_id>", methods=["DELETE"])
def delete_floorplan(username, floorplan_id):
    """Delete one floorplan and everything stored inside it.

    The username input selects the user folder, and floorplan_id selects the
    floorplan folder to remove. The logic deletes the whole floorplan directory,
    which also removes floorplan.json and all marker files in markers/.
    """
    print(f"[route] delete_floorplan hit: username={username}, floorplan_id={floorplan_id}")
    try:
        username = safe_name(username)
        floorplan_id = safe_name(floorplan_id)
    except ValueError:
        return api_error("invalid name", 400)

    target_dir = floorplan_path(username, floorplan_id)
    if not os.path.isdir(target_dir):
        return api_error("floorplan not found", 404)

    try:
        shutil.rmtree(target_dir)
    except OSError as error:
        return api_error(f"delete failed: {error}", 500)

    return jsonify({"status": "deleted"})


@app.route("/api/users/<username>/floorplans/<floorplan_id>/markers/<marker_id>", methods=["DELETE"])
def delete_marker(username, floorplan_id, marker_id):
    """Delete one marker file from one floorplan.

    The username, floorplan_id, and marker_id path inputs are used to build the
    exact marker JSON file path. The logic only removes that single marker file
    and leaves the rest of the floorplan data unchanged.
    """
    print(
        "[route] delete_marker hit: "
        f"username={username}, floorplan_id={floorplan_id}, marker_id={marker_id}"
    )
    try:
        username = safe_name(username)
        floorplan_id = safe_name(floorplan_id)
        marker_id = safe_name(marker_id)
    except ValueError:
        return api_error("invalid name", 400)

    target_file = marker_file_path(username, floorplan_id, marker_id)
    if not os.path.isfile(target_file):
        return api_error("marker not found", 404)

    try:
        os.remove(target_file)
    except OSError as error:
        return api_error(f"delete failed: {error}", 500)

    return jsonify({"status": "deleted"})


@app.route(
    "/api/users/<username>/floorplans/<floorplan_id>/markers/<marker_id>/coordinates",
    methods=["PATCH"],
)
def update_marker_coordinates(username, floorplan_id, marker_id):
    """Update only the coordinates for one existing marker.

    The path inputs identify the exact marker file to update. The JSON body is
    only used for coordinate values, either as a coordinates object or x/y/z
    fields. The logic reads the existing marker, overwrites only the coordinate
    fields, and writes the marker back without replacing the rest of the data.
    """
    print(
        "[route] update_marker_coordinates hit: "
        f"username={username}, floorplan_id={floorplan_id}, marker_id={marker_id}"
    )
    try:
        username = safe_name(username)
        floorplan_id = safe_name(floorplan_id)
        marker_id = safe_name(marker_id)
        body = json_body()
        new_coordinates = marker_coordinates_from_body(body)
    except ValueError as error:
        return api_error(str(error).lower(), 400)

    target_file = marker_file_path(username, floorplan_id, marker_id)
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


_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def decode_data_uri(data_uri):
    """Decode a base64 image string (data URI or raw) and return a PIL Image.

    Tolerates real-world data: a missing 'data:...,' prefix and base64 that is
    not padded to a multiple of 4.
    """
    encoded = data_uri.split(",", 1)[1] if "," in data_uri else data_uri
    encoded = "".join(encoded.split())        # strip whitespace / newlines
    encoded += "=" * (-len(encoded) % 4)      # restore missing padding
    return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")


def add_image_label(image, picture_name, date):
    """Return a new image with a label banner above the given image.

    The banner shows 'Picture name: <name>   Date for upload: <date>' in a
    white bar above the photo so every PDF page is self-describing.
    """
    font_size = max(20, image.width // 40)
    padding = font_size

    try:
        font = ImageFont.truetype(_FONT_BOLD_PATH, font_size)
    except OSError:
        font = ImageFont.load_default()

    label = f"Picture name: {picture_name}     Date for upload: {date}"

    # Measure text height to size the banner correctly
    dummy = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(dummy)
    bbox = draw.textbbox((0, 0), label, font=font)
    text_h = bbox[3] - bbox[1]
    banner_h = text_h + padding * 2

    combined = Image.new("RGB", (image.width, image.height + banner_h), (255, 255, 255))
    combined.paste(image, (0, banner_h))

    draw = ImageDraw.Draw(combined)
    draw.text((padding, padding), label, fill=(30, 30, 30), font=font)

    return combined


@app.route("/api/users/<username>/images/pdf", methods=["GET"])
def images_to_pdf(username):
    """Collect all images for a user and return them as a single PDF.

    Walks every floorplan directory for the user. Picks up the floorplan image
    from imageUri in floorplan.json, then picks up every photo from the photos
    array in each marker JSON. Each image becomes one page in the PDF, which is
    returned directly as an attachment.
    """
    print(f"[route] images_to_pdf hit: username={username}")
    try:
        username = safe_name(username)
    except ValueError:
        return api_error("invalid name", 400)

    user_dir = user_path(username)
    if not os.path.isdir(user_dir):
        return api_error("no data found for user", 404)

    images = []

    def add_labeled_image(data_uri, name, date):
        """Decode one image and add a labeled page; skip if it is not valid.

        Some stored photoUri values are junk (e.g. truncated placeholders from
        failed uploads), so a single bad image must not fail the whole PDF.
        """
        try:
            img = decode_data_uri(data_uri)
        except Exception as error:
            print(f"[images_to_pdf] skipping undecodable image {name!r}: {error}")
            return
        images.append(add_image_label(img, name, date))

    try:
        for floorplan_id in sorted(os.listdir(user_dir)):
            fp_file = floorplan_file_path(username, floorplan_id)
            if not os.path.isfile(fp_file):
                continue

            floorplan_data = read_json_file(fp_file)

            if floorplan_data.get("imageUri"):
                name = floorplan_data.get("imageName", floorplan_id)
                date = floorplan_data.get("createdAt", "unknown")[:10]
                add_labeled_image(floorplan_data["imageUri"], name, date)

            marker_dir = markers_path(username, floorplan_id)
            if not os.path.isdir(marker_dir):
                continue

            for marker_file in sorted(os.listdir(marker_dir)):
                if not marker_file.endswith(".json"):
                    continue

                marker_data = read_json_file(os.path.join(marker_dir, marker_file))

                for photo in marker_data.get("photos", []):
                    if photo.get("photoUri"):
                        name = photo.get("pictureName", "unknown")
                        date = photo.get("dateTaken", "unknown")
                        add_labeled_image(photo["photoUri"], name, date)

    except (OSError, json.JSONDecodeError) as error:
        return api_error(f"failed to read data: {error}", 500)

    if not images:
        return api_error("no images found", 404)

    pdf_bytes = io.BytesIO()
    images[0].save(pdf_bytes, format="PDF", save_all=True, append_images=images[1:])
    pdf_bytes.seek(0)

    return send_file(
        pdf_bytes,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{username}_images.pdf",
    )


@app.route("/api/resetUser/<username>", methods=["DELETE"])
def reset_user(username):
    """Delete all saved data for one user.

    The username path input selects the user folder inside data/. The logic
    removes that whole directory so every floorplan and marker for that user is
    deleted in one operation.
    """
    print(f"[route] reset_user hit: username={username}")
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