"""
Konvertiert die Referenz-Posen von NumPy (.npy) nach JSON.

Warum JSON?
  .npy ist ein Python-spezifisches Format. JSON kann direkt im Browser
  geladen werden (fetch API) ohne zusätzliche Bibliotheken.

Die .npy-Dateien enthalten normalisierte Pose-Embeddings:
  Shape: (33, 3) — 33 Körperpunkte × 3 Koordinaten (x, y, z)

Verwendung:
  uv run python convert_poses.py
"""
from __future__ import annotations

import json
import pathlib
import numpy as np


POSES_SOURCE_DIR = pathlib.Path(r"D:\PlieAI_2.0\poses")
POSES_OUTPUT_DIR = pathlib.Path(__file__).parent.parent / "public" / "poses"


def convert_pose(npy_path: pathlib.Path, output_dir: pathlib.Path) -> None:
    """
    Lädt eine .npy-Datei und speichert sie als .json.

    Die JSON-Struktur ist ein 2D-Array: [[x, y, z], [x, y, z], ...]
    mit 33 Einträgen (ein Eintrag pro Körperpunkt).

    Args:
        npy_path: Pfad zur .npy-Quelldatei.
        output_dir: Zielverzeichnis für die .json-Datei.
    """
    pose_data: np.ndarray = np.load(npy_path)
    print(f"  {npy_path.name}: Shape {pose_data.shape}, dtype {pose_data.dtype}")

    # .npy → Python-Liste (JSON-serialisierbar)
    pose_list = pose_data.tolist()

    output_path = output_dir / (npy_path.stem + ".json")
    with open(output_path, "w", encoding="utf-8") as f:
        # separators entfernt unnötige Leerzeichen → kleinere Datei
        json.dump(pose_list, f, separators=(",", ":"))

    print(f"  gespeichert: {output_path.name}")


if __name__ == "__main__":
    print("=== Posen-Konvertierung ===")

    POSES_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    npy_files = sorted(POSES_SOURCE_DIR.glob("*.npy"))
    if not npy_files:
        print(f"Keine .npy-Dateien gefunden in {POSES_SOURCE_DIR}")
    else:
        for npy_file in npy_files:
            convert_pose(npy_file, POSES_OUTPUT_DIR)

    print(f"\nFertig! {len(npy_files)} Posen in public/poses/ gespeichert.")
