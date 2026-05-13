/**
 * Exakt-Port des Python PoseEmbedder (modules/embedder.py).
 *
 * Normalisiert 33 MediaPipe-Landmarks so, dass Translation und Skalierung
 * des Körpers keinen Einfluss auf die Klassifizierung haben:
 *   1. Hüftmittelpunkt als Ursprung (0, 0, 0)
 *   2. Skalierung durch Posengröße (Torso-Größe × 2.5, mind. max. Landmark-Abstand)
 *   3. Runden auf 6 Nachkommastellen
 *
 * Ausgabe-Vektor (99 Werte) muss mit den Trainings-Features des Classifiers übereinstimmen.
 */

/** Landmark-Indizes aus MediaPipe Pose */
const IDX = {
  leftShoulder:  11,
  rightShoulder: 12,
  leftHip:       23,
  rightHip:      24,
} as const

const TORSO_SIZE_MULTIPLIER = 2.5

/** Ein MediaPipe-Landmark mit normalisierten Koordinaten [0..1] */
export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

/** Rückgabe des Embedders: flacher Vektor für Classifier + 2D-Array für Visualisierung */
export interface EmbedderResult {
  /** 99 normalisierte Werte (33 × xyz), direkt in den Classifier eingespeist */
  flat: Float32Array
  /** (33, 3) – normalisierte Koordinaten, für Abweichungs-Pfeile benötigt */
  matrix: number[][]
}

/**
 * Mittelpunkt zwischen zwei Landmarks (beliebige Dimension).
 */
function midpoint(a: number[], b: number[]): number[] {
  return a.map((v, i) => (v + b[i]) * 0.5)
}

/**
 * Euklidische Norm eines Vektors.
 */
function norm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0))
}

/**
 * Normalisiert 33 Pose-Landmarks auf einen einheitlichen Raum.
 *
 * Reihenfolge entspricht exakt der Python-Implementierung:
 *   - Pixel-Koordinaten (x·w, y·h, z) berechnen
 *   - Hüfte als Ursprung setzen
 *   - Durch Posengröße dividieren (2D, wie in Python)
 *   - Auf 6 Dezimalstellen runden
 *
 * @param landmarks   33 MediaPipe-Landmarks mit x,y,z in [0..1]
 * @param imageWidth  Breite des Kamera-Frames in Pixeln
 * @param imageHeight Höhe des Kamera-Frames in Pixeln
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
