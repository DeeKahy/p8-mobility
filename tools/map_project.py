import os

OUTPUT_FILE = "project_dump.txt"

# Filtyper vi vil inkludere
INCLUDE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".md", ".env"
}

# Mapper vi vil ignorere
IGNORE_DIRS = {
    "node_modules",
    ".git",
    ".expo",
    "dist",
    "build"
}


def should_include_file(filename):
    _, ext = os.path.splitext(filename)
    return ext in INCLUDE_EXTENSIONS


def dump_project(root_dir, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            rel_root = os.path.relpath(root, root_dir)
            f.write(f"\n{'=' * 80}\n")
            f.write(f"FOLDER: {rel_root}\n")
            f.write(f"{'=' * 80}\n")

            for file in files:
                if should_include_file(file):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, root_dir)

                    f.write(f"\n--- FILE: {rel_path} ---\n")

                    try:
                        with open(file_path, "r", encoding="utf-8") as file_content:
                            f.write(file_content.read())
                    except Exception as e:
                        f.write(f"[ERROR reading file: {e}]\n")


if __name__ == "__main__":
    project_root = os.getcwd()
    dump_project(project_root, OUTPUT_FILE)
    print(f"✅ Project dumped to {OUTPUT_FILE}")