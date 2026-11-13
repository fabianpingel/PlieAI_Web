/**
 * Wrapper around the MediaPipe PoseLandmarker (tasks-vision).
 *
 * Loads the model on the first call to init() and then detects 33 body
 * landmarks in each video frame.
 *
 * All files are served from the app's own origin: the WASM runtime is copied
 * from node_modules to public/mediapipe/ on npm install (postinstall script),
 * the model lives in public/models/. No request goes to a third-party server.
 */

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision'

// Re-Export für Komponenten, die das Ergebnisformat brauchen
export type { PoseLandmarkerResult }

/** Local path to the MediaPipe WASM files (copied by the postinstall script). */
const MEDIAPIPE_WASM_PATH = '/mediapipe'

/** Local path to the pose model (stored in public/models/). */
const MODEL_PATH = '/models/pose_landmarker_full.task'

/** Detects body landmarks in video frames with MediaPipe. */
export class PoseDetector {
  private landmarker: PoseLandmarker | null = null

  /**
   * Initialize the PoseLandmarker; must be called once before detect().
   *
   * Tries GPU acceleration first and falls back to the CPU on failure.
   */
  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)

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
      // Fallback auf CPU, wenn GPU nicht verfügbar
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'CPU' },
      })
    }
  }

  /**
   * Detect pose landmarks in one video frame.
   *
   * @param video     The <video> element showing the camera feed.
   * @param timestamp Current timestamp (performance.now()); must increase monotonically.
   * @returns         Detected landmarks, or null if init() has not completed.
   */
  detect(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult | null {
    if (!this.landmarker) return null
    return this.landmarker.detectForVideo(video, timestamp)
  }

  /** Release the landmarker's resources (call when the component unmounts). */
  close(): void {
    this.landmarker?.close()
    this.landmarker = null
  }
}
