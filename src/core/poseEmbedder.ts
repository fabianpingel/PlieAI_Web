/**
 * Exact port of the Python PoseEmbedder (modules/embedder.py).
 *
 * Normalizes 33 MediaPipe landmarks so that translation and scale of the
 * body do not influence the classification:
 *   1. Hip center becomes the origin (0, 0, 0)
 *   2. Scale by pose size (torso size × 2.5, at least the max landmark distance)
 *   3. Round to 6 decimal places
 *
 * The output vector (99 values) must match the classifier's training features.
 */

/** Landmark indices used from MediaPipe Pose. */
const IDX = {
  leftShoulder:  11,
  rightShoulder: 12,
  leftHip:       23,
  rightHip:      24,
} as const

const TORSO_SIZE_MULTIPLIER = 2.5

/** A MediaPipe landmark with normalized coordinates in [0..1]. */
export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

/** Embedder output: flat vector for the classifier plus a 2D array for visualization. */
export interface EmbedderResult {
  /** 99 normalized values (33 × xyz), fed directly into the classifier. */
  flat: Float32Array
  /** Normalized coordinates of shape (33, 3), used for the deviation arrows. */
  matrix: number[][]
}

/**
 * Compute the midpoint of two points of any dimension.
 *
 * @param a First point.
 * @param b Second point.
 * @returns The midpoint.
 */
function midpoint(a: number[], b: number[]): number[] {
  return a.map((v, i) => (v + b[i]) * 0.5)
}

/**
 * Compute the Euclidean norm of a vector.
 *
 * @param v The vector.
 * @returns Its length.
 */
function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0))
}

/**
 * Normalize 33 pose landmarks into a common coordinate space.
 *
 * The steps follow the Python implementation exactly:
 *   - compute pixel coordinates (x·w, y·h, z)
 *   - move the hip center to the origin
 *   - divide by the pose size (2D, as in Python)
 *   - round to 6 decimal places
 *
 * @param landmarks   33 MediaPipe landmarks with x, y, z in [0..1].
 * @param imageWidth  Width of the camera frame in pixels.
 * @param imageHeight Height of the camera frame in pixels.
 * @returns           Flat feature vector and (33, 3) matrix.
 */
export function embedPose(
  landmarks: NormalizedLandmark[],
  imageWidth: number,
  imageHeight: number,
): EmbedderResult {
  // Schritt 1: Auf Pixel-Koordinaten skalieren (wie in Python: pose *= [width, height, 1])
  const pts: number[][] = landmarks.map(lm => [
    lm.x * imageWidth,
    lm.y * imageHeight,
    lm.z,  // z bleibt unverändert (* 1 in Python)
  ])

  // Schritt 2: Hüftmittelpunkt berechnen und alle Landmarks verschieben
  const hipCenter = midpoint(pts[IDX.leftHip], pts[IDX.rightHip])
  const centered: number[][] = pts.map(p => [
    p[0] - hipCenter[0],
    p[1] - hipCenter[1],
    p[2] - hipCenter[2],
  ])

  // Schritt 3: Posengröße berechnen (nur 2D, genau wie Python)
  // Python: landmarks = landmarks[:, :2]  →  nur x,y verwenden
  const shoulderCenter2D = midpoint(
    [centered[IDX.leftShoulder][0],  centered[IDX.leftShoulder][1]],
    [centered[IDX.rightShoulder][0], centered[IDX.rightShoulder][1]],
  )
  // Hüfte ist bereits bei (0,0) nach Zentrierung – Torsogröße = Abstand Schulter→Hüfte
  const torsoSize = norm(shoulderCenter2D)

  // Maximaler Abstand eines Landmarks vom Ursprung (2D)
  const maxDist = Math.max(...centered.map(p => Math.sqrt(p[0] ** 2 + p[1] ** 2)))

  const poseSize = Math.max(torsoSize * TORSO_SIZE_MULTIPLIER, maxDist)

  // Schritt 4: Normalisieren + auf 6 Dezimalstellen runden
  const R6 = 1e6
  const matrix: number[][] = centered.map(p => [
    Math.round((p[0] / poseSize) * R6) / R6,
    Math.round((p[1] / poseSize) * R6) / R6,
    Math.round((p[2] / poseSize) * R6) / R6,
  ])

  return {
    flat:   new Float32Array(matrix.flat()),
    matrix,
  }
}
