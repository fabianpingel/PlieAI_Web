/**
 * Canvas rendering for the pose visualization.
 *
 * Draws the skeleton, colored deviation arrows and the confidence bar
 * directly onto a 2D canvas context.
 *
 * Arrows: green = close to the reference, red = far away (as in visualizer.py).
 */

import type { NormalizedLandmark } from './poseEmbedder'

/** MediaPipe Pose connections as [from, to] landmark index pairs. */
export const POSE_CONNECTIONS: [number, number][] = [
  // Gesicht
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  // Schultern
  [11, 12],
  // Linker Arm
  [11, 13], [13, 15],
  // Rechter Arm
  [12, 14], [14, 16],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Linkes Bein
  [23, 25], [25, 27], [27, 29], [27, 31],
  // Rechtes Bein
  [24, 26], [26, 28], [28, 30], [28, 32],
]

/**
 * Draw the camera image onto the canvas, mirrored for a selfie view.
 *
 * @param ctx     Canvas context.
 * @param video   The <video> element.
 * @param w       Canvas width.
 * @param h       Canvas height.
 * @param mirror  Flip the image horizontally (selfie mode).
 */
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  h: number,
  mirror = true,
): void {
  ctx.save()
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, w, h)
  ctx.restore()
}

/**
 * Draw the pose skeleton as lines and dots between visible landmarks.
 *
 * @param ctx       Canvas context.
 * @param landmarks 33 MediaPipe landmarks with x, y in [0..1].
 * @param w         Canvas width.
 * @param h         Canvas height.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number,
): void {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2

  for (const [from, to] of POSE_CONNECTIONS) {
    const a = landmarks[from]
    const b = landmarks[to]
    if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) continue

    ctx.beginPath()
    ctx.moveTo(a.x * w, a.y * h)
    ctx.lineTo(b.x * w, b.y * h)
    ctx.stroke()
  }

  // Punkte an jedem Landmark
  for (const lm of landmarks) {
    if ((lm.visibility ?? 1) < 0.3) continue
    ctx.beginPath()
    ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()
  }
}

/**
 * Draw deviation arrows between the current pose and the reference pose.
 *
 * Mirrors draw_pose_deviation() in visualizer.py:
 *   - arrow origin: current landmark (pixel position)
 *   - arrow direction: (ref_embedding - current_embedding) × scale
 *   - color: green = small deviation, red = large deviation
 *
 * @param ctx             Canvas context.
 * @param landmarks       Current MediaPipe landmarks in [0..1].
 * @param refMatrix       Reference embedding (33×3) from poses/*.json.
 * @param currentMatrix   Current embedding (33×3) from embedPose.
 * @param w               Canvas width.
 * @param h               Canvas height.
 * @param scale           Amplification factor for the arrow length.
 */
export function drawDeviationArrows(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  refMatrix: number[][],
  currentMatrix: number[][],
  w: number,
  h: number,
  scale = 200,
): void {
  // Abstände berechnen (2D) für Farbgebung
  const distances = refMatrix.map((ref, i) => {
    const cur = currentMatrix[i]
    return Math.sqrt((ref[0] - cur[0]) ** 2 + (ref[1] - cur[1]) ** 2)
  })
  const maxDist = Math.max(...distances, 0.001)  // 0.001 verhindert Division durch 0

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i]
    if ((lm.visibility ?? 1) < 0.3) continue

    const accuracy = 1 - distances[i] / maxDist
    const red   = Math.round(255 * (1 - accuracy))
    const green = Math.round(255 * accuracy)
    const color = `rgb(${red}, ${green}, 0)`

    const x0 = lm.x * w
    const y0 = lm.y * h
    const dx = (refMatrix[i][0] - currentMatrix[i][0]) * scale
    const dy = (refMatrix[i][1] - currentMatrix[i][1]) * scale

    // Kreis am Landmark (Größe proportional zur Abweichung)
    const radius = Math.max(3, Math.round(10 * distances[i] / maxDist))
    ctx.beginPath()
    ctx.arc(x0, y0, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

    // Pfeil zur Referenzposition
    drawArrow(ctx, x0, y0, x0 + dx, y0 + dy, color)
  }
}

/**
 * Draw an arrow from (x0, y0) to (x1, y1).
 *
 * @param ctx   Canvas context.
 * @param x0    Start x.
 * @param y0    Start y.
 * @param x1    End x (arrow head).
 * @param y1    End y (arrow head).
 * @param color CSS color for line and head.
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number,
  x1: number, y1: number,
  color: string,
): void {
  const headLen = 8
  const angle = Math.atan2(y1 - y0, x1 - x0)

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2

  // Pfeil-Linie
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()

  // Pfeil-Spitze
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - headLen * Math.cos(angle - Math.PI / 6), y1 - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x1 - headLen * Math.cos(angle + Math.PI / 6), y1 - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

/**
 * Draw the confidence bar for the target pose.
 *
 * @param ctx        Canvas context.
 * @param poseName   Name of the target pose.
 * @param confidence Probability in [0..1].
 * @param w          Canvas width.
 * @param h          Canvas height.
 */
export function drawConfidenceBar(
  ctx: CanvasRenderingContext2D,
  poseName: string,
  confidence: number,
  w: number,
  h: number,
): void {
  const barH     = 28
  const padding  = 12
  const barY     = h - barH - padding
  const barW     = w - 2 * padding
  const fillW    = Math.max(0, barW * confidence)

  // Hintergrund-Balken
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  ctx.roundRect(padding, barY, barW, barH, 8)
  ctx.fill()

  // Farbiger Fortschritts-Balken (grün bei hoher Konfidenz, rot bei niedriger)
  const hue = confidence * 120  // 0° = rot, 120° = grün
  ctx.fillStyle = `hsl(${hue}, 80%, 45%)`
  ctx.beginPath()
  ctx.roundRect(padding, barY, fillW, barH, 8)
  ctx.fill()

  // Pose-Name und Prozentzahl
  ctx.fillStyle = 'white'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(poseName, padding + 8, barY + barH / 2)

  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(confidence * 100)} %`, padding + barW - 8, barY + barH / 2)
}

/**
 * Draw a hint box when too few landmarks were detected.
 *
 * @param ctx Canvas context.
 * @param w   Canvas width.
 * @param h   Canvas height.
 */
export function drawNotDetected(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  // Nur eine dezente Hinweis-Box oben — Kamerabild bleibt sichtbar
  const boxH = 56
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  ctx.roundRect(12, 12, w - 24, boxH, 12)
  ctx.fill()

  ctx.fillStyle = 'white'
  ctx.font = 'bold 15px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Ganzen Körper in die Kamera stellen', w / 2, 12 + boxH / 2 - 10)

  ctx.font = '13px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText('Mehr Abstand · Gerät tiefer stellen', w / 2, 12 + boxH / 2 + 12)
}
