/**
 * Pose classifier based on the trained logistic regression weights.
 *
 * Logistic regression is softmax(coef @ features + intercept): a plain matrix
 * multiplication, so neither WASM nor ONNX is needed. The weights (14 KB JSON)
 * are loaded once and kept in memory.
 */

/** Shape of classifier.json (exported by tools/convert_model.py). */
interface ClassifierWeights {
  coef:      number[][]  // Form: [n_classes][n_features] = [7][99]
  intercept: number[]    // Form: [n_classes] = [7]
  classes:   string[]    // Klassen-Namen in der Reihenfolge der Wahrscheinlichkeiten
}

/** Result of one classification. */
export interface ClassificationResult {
  /** Class name with the highest probability. */
  className: string
  /** Probability of each class (sums to 1). */
  probabilities: number[]
  /** Class names in the same order as probabilities. */
  classes: string[]
}

/**
 * Compute a numerically stable softmax that avoids overflow for large logits.
 *
 * @param logits Raw model outputs before normalization.
 * @returns      Probabilities that sum to 1.
 */
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits)
  const exps = logits.map(l => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

/** Classifies normalized pose vectors into the trained ballet poses. */
export class PoseClassifier {
  private weights: ClassifierWeights | null = null

  /** Load the model weights from /models/classifier.json; call once before classify(). */
  async init(): Promise<void> {
    const response = await fetch('/models/classifier.json')
    if (!response.ok) throw new Error('Classifier-Gewichte konnten nicht geladen werden')
    this.weights = await response.json() as ClassifierWeights
  }

  /**
   * Classify a normalized pose vector.
   *
   * @param features 99 normalized values (output of embedPose).
   * @returns        Best class name and the full probability distribution.
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

  /** Look up the probability of one class in a classification result (0 if unknown). */
  getProbability(result: ClassificationResult, className: string): number {
    const idx = result.classes.indexOf(className)
    return idx >= 0 ? result.probabilities[idx] : 0
  }
}
