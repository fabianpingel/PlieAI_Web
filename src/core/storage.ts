/**
 * Type-safe localStorage access for PlieAI.
 *
 * Stores, per pose, the total number of held repetitions and the date of the
 * last exercise, plus the ballet teacher's e-mail address (for the mailto
 * report) and the onboarding flag. Nothing here ever leaves the device.
 *
 * Keys are versioned ('.v1') so future data model changes can be handled
 * cleanly with a migration.
 */

// ── Datenmodell ───────────────────────────────────────────────────────────────

/** Progress of a single pose. */
export interface PoseProgress {
  /** Total number of successfully held repetitions. */
  totalReps: number
  /** ISO date of the last exercise (format YYYY-MM-DD). */
  lastDate: string
}

/** Mapping from pose ID to progress. */
export type ProgressData = Record<string, PoseProgress>

// ── localStorage-Schlüssel ────────────────────────────────────────────────────

const KEY_PROGRESS = 'plieai.progress.v1'
const KEY_TEACHER_EMAIL = 'plieai.teacherEmail.v1'
const KEY_ONBOARDING_SEEN = 'plieai.onboardingSeen.v1'

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/**
 * Return today's date as an ISO string.
 *
 * @returns Date in the format '2026-05-13'.
 */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Read and parse the stored progress.
 *
 * @returns Progress of all poses; empty if nothing is stored or the JSON is broken.
 */
function readProgress(): ProgressData {
  const raw = localStorage.getItem(KEY_PROGRESS)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ProgressData
  } catch {
    // Defekter JSON-Eintrag → frischer Start, damit die App nicht abstürzt
    return {}
  }
}

/**
 * Write the progress back to localStorage.
 *
 * @param data Progress of all poses.
 */
function writeProgress(data: ProgressData): void {
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(data))
}

// ── Öffentliche API ───────────────────────────────────────────────────────────

/**
 * Increase the rep counter of a pose and set its date to today.
 *
 * @param poseId Unique pose ID (matches an entry of `poses` in App.vue).
 * @param count  Number of reps to add.
 */
export function addReps(poseId: string, count: number = 1): void {
  const data = readProgress()
  const existing = data[poseId] ?? { totalReps: 0, lastDate: todayIso() }
  data[poseId] = {
    totalReps: existing.totalReps + count,
    lastDate: todayIso(),
  }
  writeProgress(data)
}

/**
 * Get the progress of a single pose.
 *
 * @param poseId Pose ID.
 * @returns      Its progress, or null if the pose was never practiced.
 */
export function getProgress(poseId: string): PoseProgress | null {
  const data = readProgress()
  return data[poseId] ?? null
}

/**
 * Get the progress of all poses.
 *
 * @returns Progress of every practiced pose.
 */
export function getAllProgress(): ProgressData {
  return readProgress()
}

/**
 * Read the stored teacher e-mail address.
 *
 * @returns The address, or null if none was entered yet.
 */
export function getTeacherEmail(): string | null {
  return localStorage.getItem(KEY_TEACHER_EMAIL)
}

/**
 * Store the teacher e-mail address.
 *
 * @param email The e-mail address.
 */
export function setTeacherEmail(email: string): void {
  localStorage.setItem(KEY_TEACHER_EMAIL, email)
}

/**
 * Format an ISO date (YYYY-MM-DD) as a short German date (DD.MM.YYYY).
 *
 * @param iso Date in ISO format.
 * @returns   Date such as '13.05.2026'.
 */
export function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/**
 * Check whether the user has already confirmed the onboarding screen.
 *
 * @returns true once confirmed, false on the very first start.
 */
export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(KEY_ONBOARDING_SEEN) === 'true'
}

/** Mark the onboarding as seen (called when the user taps "Los geht's"). */
export function markOnboardingSeen(): void {
  localStorage.setItem(KEY_ONBOARDING_SEEN, 'true')
}

/**
 * Delete the stored exercise progress of all poses.
 *
 * Called from the settings menu. The teacher address and the onboarding
 * flag are kept: they are managed separately and are not exercise data.
 */
export function clearProgress(): void {
  localStorage.removeItem(KEY_PROGRESS)
}

/**
 * Delete everything PlieAI stores on this device.
 *
 * Removes progress, teacher address and onboarding flag, so the app behaves
 * as on the very first start.
 */
export function clearAllData(): void {
  localStorage.removeItem(KEY_PROGRESS)
  localStorage.removeItem(KEY_TEACHER_EMAIL)
  localStorage.removeItem(KEY_ONBOARDING_SEEN)
}
