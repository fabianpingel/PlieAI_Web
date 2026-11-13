"""Convert the reference poses from NumPy (.npy) to JSON.

JSON can be fetched directly in the browser without extra libraries. Each .npy
file holds a normalized pose embedding of shape (33, 3): 33 landmarks x (x, y, z).

Usage:
    uv run python convert_poses.py
"""

from __future__ import annotations

import json
import pathlib

import numpy as np

POSES_SOURCE_DIR = pathlib.Path(r"D:\PlieAI_2.0\poses")
POSES_OUTPUT_DIR = pathlib.Path(__file__).parent.parent / "public" / "poses"


def convert_pose(npy_path: pathlib.Path, output_dir: pathlib.Path) -> None:
    """Load one .npy file and save it as a JSON array of 33 [x, y, z] entries.

    Args:
        npy_path: Path of the source .npy file.
        output_dir: Target directory of the .json file.
    """
    pose_data: np.ndarray = np.load(npy_path)
    print(f"  {npy_path.name}: shape {pose_data.shape}, dtype {pose_data.dtype}")

    output_path = output_dir / (npy_path.stem + ".json")
    with open(output_path, "w", encoding="utf-8") as f:
        # separators ohne Leerzeichen → kleinere Datei
        json.dump(pose_data.tolist(), f, separators=(",", ":"))

    print(f"  saved: {output_path.name}")


if __name__ == "__main__":
    print("=== Pose conversion ===")

    POSES_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    npy_files = sorted(POSES_SOURCE_DIR.glob("*.npy"))
    if not npy_files:
        print(f"No .npy files found in {POSES_SOURCE_DIR}")
    for npy_file in npy_files:
        convert_pose(npy_file, POSES_OUTPUT_DIR)

    print(f"\nDone! {len(npy_files)} poses saved to public/poses/.")
