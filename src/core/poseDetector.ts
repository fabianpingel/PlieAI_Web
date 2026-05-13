/**
 * Wrapper um MediaPipe PoseLandmarker (tasks-vision).
 *
 * Lädt das Modell beim ersten Aufruf von init() und erkennt danach
 * in jedem Video-Frame 33 Körperpunkte.
 *
 * WASM-Dateien: werden von der MediaPipe-CDN geladen (einmalig, danach gecacht).
 * Modell-Datei:  liegt lokal unter /models/pose_landmarker_full.task
 */

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision'

// Re-Export für Komponenten die das Ergebnisformat brauchen
export type { PoseLandmarkerResult }

/** CDN-Pfad für die MediaPipe WASM-Dateien (wird nach dem ersten Laden gecacht) */
const MEDIAPIPE_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'

/** Lokaler Pfad zum Modell (liegt in /public/models/) */
const MODEL_PATH = '/models/pose_landmarker_full.task'

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null

  /**
   * Initialisiert den PoseLandmarker.
   * Muss einmal vor detect() aufgerufen werden.
   * Versucht zuerst GPU-Beschleunigung, fällt bei Fehler auf CPU zurück.
   */
  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)

    const options = {
      baseOptions: { modelAssetPath: MODEL_PATH },
      runningMode: 'VIDEO' as const,  // VIDEO-Modus für requestAnimationFrame-Loop
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence:     0.5,
    }

    // GPU-Beschleunigung versuchen (schneller auf Smartphones)
    try {
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'GPU' },
      })
    } catch {
      // Fallback auf CPU wenn GPU nicht verfügbar
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'CPU' },
      })
    }
  }

  /**
   * Erkennt Pose-Landmarks in einem Video-Frame.
   *
   * @param video     Das <video>-Element mit dem Kamera-Feed
   * @param timestamp Aktueller Zeitstempel (performance.now()) — muss monoton steigen
   * @returns         Erkannte Landmarks, oder null wenn nicht initialisiert
   */
  detect(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult | null {
    if (!this.landmarker) return null
    return this.landmarker.detectForVideo(video, timestamp)
  }

  /** Gibt Ressourcen frei (beim Beenden der Komponente aufrufen). */
  close(): void {
    this.landmarker?.close()
    this.landmarker = null
  }
}
