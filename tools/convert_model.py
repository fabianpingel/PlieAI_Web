"""Convert the trained sklearn logistic regression from .pkl to ONNX and JSON weights.

Pickle can only be loaded by Python and may execute arbitrary code on load. ONNX
is an open format kept as a backup; the browser uses the plain JSON weights.

Usage:
    uv run python convert_model.py
"""

from __future__ import annotations

import json
import pathlib
import pickle

import numpy as np
import onnxruntime as rt
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Pfade — relativ zu diesem Skript
TOOLS_DIR = pathlib.Path(__file__).parent
PROJECT_DIR = TOOLS_DIR.parent
SOURCE_PKL = pathlib.Path(r"D:\PlieAI_2.0\classifiers\Logistic Regression.pkl")
OUTPUT_ONNX = PROJECT_DIR / "public" / "models" / "logistic_regression.onnx"


def load_and_inspect_model(pkl_path: pathlib.Path) -> object:
    """Load the sklearn model and print its classes and feature count.

    Args:
        pkl_path: Path to the .pkl file.

    Returns:
        The loaded sklearn model.
    """
    with open(pkl_path, "rb") as f:
        model = pickle.load(f)

    print(f"Model type: {type(model).__name__}")
    print(f"Classes:    {list(model.classes_)}")
    print(f"Features:   {model.n_features_in_}")
    return model


def convert_to_onnx(model: object, output_path: pathlib.Path) -> None:
    """Convert a sklearn model to ONNX.

    The input has shape (batch_size, 99): 33 landmarks x 3 coordinates (x, y, z).
    A batch size of None allows any number of inputs at once.

    Args:
        model: The loaded sklearn model.
        output_path: Target path of the .onnx file.
    """
    # None = flexible Batch-Größe, 99 = Anzahl der Features
    initial_type = [("float_input", FloatTensorType([None, 99]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=17)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"ONNX saved: {output_path}")


def verify_onnx(onnx_path: pathlib.Path, model: object) -> None:
    """Compare ONNX predictions with the original sklearn model on random input.

    Args:
        onnx_path: Path of the saved .onnx file.
        model: The original sklearn model.

    Raises:
        AssertionError: If the predictions differ.
    """
    # Zufälliger Input, ähnlich einem normalisierten Pose-Vektor
    rng = np.random.default_rng(42)
    test_input = rng.standard_normal((3, 99)).astype(np.float32)

    sess = rt.InferenceSession(str(onnx_path))
    input_name = sess.get_inputs()[0].name
    onnx_pred = sess.run(None, {input_name: test_input})[0]

    sklearn_pred = model.predict(test_input)

    assert list(onnx_pred) == list(sklearn_pred), (
        f"Mismatch! ONNX: {onnx_pred}, sklearn: {sklearn_pred}"
    )
    print(f"Verification OK - sample predictions: {list(onnx_pred)}")


def export_weights_json(model: object, output_path: pathlib.Path) -> None:
    """Export the logistic regression weights as compact JSON for the browser.

    Logistic regression is softmax(coef @ x + intercept); the 7x99 weights make a
    tiny JSON file that needs neither WASM nor ONNX in the browser.

    JSON structure:
        coef: shape (n_classes, n_features)
        intercept: shape (n_classes,)
        classes: class names in the order of the probabilities

    Args:
        model: The loaded sklearn model.
        output_path: Target path of the .json file.
    """
    weights = {
        "coef": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes": model.classes_.tolist(),
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(weights, f, separators=(",", ":"))
    size_kb = output_path.stat().st_size / 1024
    print(f"JSON saved: {output_path.name} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    print("=== Model conversion ===")
    print(f"Source: {SOURCE_PKL}")

    model = load_and_inspect_model(SOURCE_PKL)

    # ONNX nur als Backup, im Browser wird es nicht verwendet
    convert_to_onnx(model, OUTPUT_ONNX)
    verify_onnx(OUTPUT_ONNX, model)

    # JSON-Gewichte für reines TypeScript
    export_weights_json(model, PROJECT_DIR / "public" / "models" / "classifier.json")

    print("\nDone!")
