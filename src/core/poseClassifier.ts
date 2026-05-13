/**
 * Pose-Klassifizierer auf Basis der Logistic-Regression-Gewichte aus dem Modell.
 *
 * Logistic Regression ist: softmax(coef @ features + intercept)
 * Das ist eine einfache Matrix-Multiplikation — kein WASM, kein ONNX nötig.
 * Die Gewichte (14 KB JSON) werden einmalig geladen und gecacht.
 */

/** Format der classifier.json-Datei (exportiert von tools/convert_model.py) */
interface ClassifierWeights {
  coef:      number[][]  // Form: [n_classes][n_features] = [7][99]
  intercept: number[]    // Form: [n_classes] = [7]
  classes:   string[]    // Klassen-Namen in der Reihenfolge der Wahrscheinlichkeiten
}

/** Ergebnis einer Klassifizierung */
export interface ClassificationResult {
  /** Klassen-Name mit der höchsten Wahrscheinlichkeit */
  className: string
  /** Wahrscheinlichkeit für jede Klasse (Summe = 1) */
  probabilities: number[]
  /** Klassen-Namen in derselben Reihenfolge wie probabilities */
  classes: string[]
}

/**
 * Numerisch stabiler Softmax: verhindert Overflow bei großen Logit-Werten.
 *
 * @param logits Rohe Modell-Ausgaben vor Normalisierung
 */
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits)
  const exps = logits.map(l => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

export class PoseClassifier {
  private weights: ClassifierWeights | null = null

  /**
   * Lädt die Modell-Gewichte aus /public/models/classifier.json.
   * Muss einmal vor classify() aufgerufen werden.
   */
  async init(): Promise<void> {
    const response = await fetch('/models/classifier.json')
    if (!response.ok) throw new Error('Classifier-Gewichte konnten nicht geladen werden')
    this.weights = await response.json() as ClassifierWeights
  }

  /**
   * Klassifiziert einen normalisierten Pose-Vektor.
   *
   * @param features Float32Array mit 99 normalisierten Werten (Ausgabe des PoseEmbedders)
   * @returns        Klassen-Name und Wahrscheinlichkeits-Verteilung
   */
  classify(features: Float32Array): ClassificationResult {
    if (!this.weights) throw new Error('Classifier nicht initialisiert')
    const { coef, intercept, classes } = this.weights

    // Logits: coef @ features + intercept  (für jede der 7 Klassen)
    const logits = coef.map((row, i) =>
      row.reduce((sum, w, j) => sum + w * features[j], 0) + intercept[i]
    )

    const probabilities = softmax(logits)
    const maxIdx = probabilities.indexOf(Math.max(...probabilities))

    return { className: classes[maxIdx], probabilities, classes }
  }

  /** Gibt die Wahrscheinlichkeit für eine bestimmte Klasse zurück. */
  getProbability(result: ClassificationResult, className: string): number {
    const idx = result.classes.indexOf(className)
    return idx >= 0 ? result.probabilities[idx] : 0
  }
}
