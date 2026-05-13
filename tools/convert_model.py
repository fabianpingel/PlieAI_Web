"""
Konvertiert das trainierte sklearn-Modell (Logistic Regression) von .pkl nach .onnx.

Warum ONNX?
  .pkl (Pickle) kann nur von Python geladen werden und ist ein Sicherheitsrisiko
  (beliebiger Code kann beim Laden ausgeführt werden). ONNX ist ein offenes,
  sicheres Format das auch im Browser läuft (via onnxruntime-web).

Verwendung:
  uv run python convert_model.py
"""
from __future__ import annotations

import pickle
import pathlib
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as rt


# Pfade — relativ zu diesem Script
TOOLS_DIR = pathlib.Path(__file__).parent
PROJECT_DIR = TOOLS_DIR.parent
SOURCE_PKL = pathlib.Path(r"D:\PlieAI_2.0\classifiers\Logistic Regression.pkl")
OUTPUT_ONNX = PROJECT_DIR / "public" / "models" / "logistic_regression.onnx"


def load_and_inspect_model(pkl_path: pathlib.Path) -> object:
    """
    Lädt das sklearn-Modell und gibt Informationen darüber aus.

    Args:
        pkl_path: Pfad zur .pkl-Datei.

    Returns:
        Das geladene sklearn-Modell.
    """
    with open(pkl_path, "rb") as f:
        model = pickle.load(f)

    print(f"Modell-Typ:   {type(model).__name__}")
    print(f"Klassen:      {list(model.classes_)}")
    print(f"Features:     {model.n_features_in_}")
    return model


def convert_to_onnx(model: object, output_path: pathlib.Path) -> None:
    """
    Konvertiert ein sklearn-Modell in das ONNX-Format.

    Der Eingang hat die Form (batch_size, 99):
    - 33 Körperpunkte × 3 Koordinaten (x, y, z) = 99 normalisierte Werte.
    - None als batch_size bedeutet: beliebige Anzahl Eingaben gleichzeitig.

    Args:
        model: Das geladene sklearn-Modell.
        output_path: Ziel-Pfad für die .onnx-Datei.
    """
    # None = flexible Batch-Größe, 99 = Anzahl der Features
    initial_type = [("float_input", FloatTensorType([None, 99]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=17)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"ONNX gespeichert: {output_path}")


def verify_onnx(onnx_path: pathlib.Path, model: object) -> None:
    """
    Verifiziert das ONNX-Modell mit einem Zufalls-Input und vergleicht
    die Ausgabe mit dem Original-sklearn-Modell.

    Args:
        onnx_path: Pfad zur gespeicherten .onnx-Datei.
        model: Das Original-sklearn-Modell zum Vergleich.

    Raises:
        AssertionError: Wenn Vorhersagen abweichen.
    """
    # Zufälligen Input erzeugen (wie ein normalisierter Pose-Vektor)
    rng = np.random.default_rng(42)
    test_input = rng.standard_normal((3, 99)).astype(np.float32)

    # ONNX-Vorhersage
    sess = rt.InferenceSession(str(onnx_path))
    input_name = sess.get_inputs()[0].name
    onnx_pred = sess.run(None, {input_name: test_input})[0]

    # sklearn-Vorhersage
    sklearn_pred = model.predict(test_input)

    assert list(onnx_pred) == list(sklearn_pred), (
        f"Abweichung! ONNX: {onnx_pred}, sklearn: {sklearn_pred}"
    )
    print(f"Verifikation OK - Beispiel-Vorhersagen: {list(onnx_pred)}")


def export_weights_json(model: object, output_path: pathlib.Path) -> None:
    """
    Exportiert die Gewichte der Logistic Regression als JSON.

    Warum JSON statt ONNX?
      Logistic Regression ist f(x) = softmax(coef @ x + intercept).
      Die Gewichte sind 7x99 = 693 Zahlen — ein winziges JSON.
      Kein WASM nötig, kein Browser-Kompatibilitätsproblem.

    JSON-Struktur:
      coef:      [[...], ...] — Form (n_classes, n_features)
      intercept: [...]        — Form (n_classes,)
      classes:   [...]        — Klassen-Namen in Reihenfolge der Wahrscheinlichkeiten

    Args:
        model: Das geladene sklearn-Modell.
        output_path: Ziel-Pfad für die .json-Datei.
    """
    import json
    weights = {
        "coef":      model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "classes":   model.classes_.tolist(),
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(weights, f, separators=(",", ":"))
    size_kb = output_path.stat().st_size / 1024
    print(f"JSON gespeichert: {output_path.name} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    print("=== Modell-Konvertierung ===")
    print(f"Quelle: {SOURCE_PKL}")

    model = load_and_inspect_model(SOURCE_PKL)

    # ONNX (als Backup gespeichert, wird im Browser nicht verwendet)
    convert_to_onnx(model, OUTPUT_ONNX)
    verify_onnx(OUTPUT_ONNX, model)

    # JSON-Gewichte fuer reines JavaScript
    output_json = PROJECT_DIR / "public" / "models" / "classifier.json"
    export_weights_json(model, output_json)

    print("\nFertig!")
