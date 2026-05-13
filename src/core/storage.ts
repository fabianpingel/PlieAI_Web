/**
 * Typsicherer localStorage-Zugriff für PlieAI.
 *
 * Speichert pro Pose die Gesamt-Anzahl gehaltener Wiederholungen und
 * das Datum der letzten Übung. Zusätzlich die E-Mail-Adresse der
 * Ballettlehrerin (für den mailto-Bericht).
 *
 * Versionierte Schlüssel ('.v1'), damit zukünftige Datenmodell-Änderungen
 * über eine Migration sauber abgefangen werden können.
 */

// ── Datenmodell ───────────────────────────────────────────────────────────────

/** Fortschritt einer einzelnen Pose. */
export interface PoseProgress {
  /** Gesamt-Anzahl erfolgreich gehaltener Wiederholungen. */
  totalReps: number
  /** ISO-Datum der letzten Übung (Format YYYY-MM-DD). */
  lastDate: string
}

/** Zuordnung Pose-ID → Fortschritt. */
export type ProgressData = Record<string, PoseProgress>

// ── localStorage-Schlüssel ────────────────────────────────────────────────────

const KEY_PROGRESS = 'plieai.progress.v1'
const KEY_TEACHER_EMAIL = 'plieai.teacherEmail.v1'
const KEY_ONBOARDING_SEEN = 'plieai.onboardingSeen.v1'

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/**
 * Liefert das heutige Datum als ISO-String (YYYY-MM-DD).
 *
 * Returns:
 *     Datum im Format '2026-05-13'.
 */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Liest und parst die ProgressData aus localStorage.
 *
 * Gibt leeres Objekt zurück, falls noch nichts gespeichert oder JSON kaputt.
 *
 * Returns:
 *     ProgressData-Objekt (möglicherweise leer).
 */
function readProgress(): ProgressData {
  const raw = localStorage.getItem(KEY_PROGRESS)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ProgressData
  } catch {
    // Defekter JSON-Eintrag → frischer Start, damit App nicht crasht
    return {}
  }
}

/** Schreibt ProgressData zurück in localStorage. */
function writeProgress(data: ProgressData): void {
  localStorage.setItem(KEY_PROGRESS, JSON.stringify(data))
}

// ── Öffentliche API ───────────────────────────────────────────────────────────

/**
 * Erhöht den Rep-Zähler für eine Pose und aktualisiert das Datum.
 *
 * Args:
 *     poseId: Eindeutige Pose-Kennung (entspricht Eintrag in App.vue::poses).
 *     count:  Anzahl der hinzuzufügenden Reps (Standard: 1).
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
 * Holt den Fortschritt einer einzelnen Pose.
 *
 * Args:
 *     poseId: Pose-Kennung.
 *
 * Returns:
 *     PoseProgress-Objekt, oder null wenn diese Pose noch nie geübt wurde.
 */
export function getProgress(poseId: string): PoseProgress | null {
  const data = readProgress()
  return data[poseId] ?? null
}

/**
 * Liefert den kompletten Fortschritt aller Posen.
 *
 * Returns:
 *     ProgressData-Objekt mit allen geübten Posen.
 */
export function getAllProgress(): ProgressData {
  return readProgress()
}

/**
 * Liest die gespeicherte Lehrerin-E-Mail.
 *
 * Returns:
 *     E-Mail-Adresse oder null wenn noch nicht gespeichert.
 */
export function getTeacherEmail(): string | null {
  return localStorage.getItem(KEY_TEACHER_EMAIL)
}

/**
 * Speichert die Lehrerin-E-Mail.
 *
 * Args:
 *     email: E-Mail-Adresse als String.
 */
export function setTeacherEmail(email: string): void {
  localStorage.setItem(KEY_TEACHER_EMAIL, email)
}

/**
 * Formatiert ein ISO-Datum (YYYY-MM-DD) in deutsche Kurzform (TT.MM.JJJJ).
 *
 * Args:
 *     iso: Datum im ISO-Format.
 *
 * Returns:
 *     Datum als '13.05.2026'.
 */
export function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/**
 * Prüft, ob der Nutzer den Onboarding-Screen schon einmal gesehen
 * (und mit "Los geht's" bestätigt) hat.
 *
 * Returns:
 *     true wenn schon abgeschlossen, false beim allerersten Start.
 */
export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(KEY_ONBOARDING_SEEN) === 'true'
}

/**
 * Markiert das Onboarding als gesehen — Aufruf wenn der Nutzer
 * den "Los geht's"-Button drückt.
 */
export function markOnboardingSeen(): void {
  localStorage.setItem(KEY_ONBOARDING_SEEN, 'true')
}

/**
 * Löscht den gespeicherten Übungs-Fortschritt aller Posen.
 *
 * Wird vom Einstellungs-Menü aufgerufen ("Fortschritt zurücksetzen").
 * Lehrerin-Adresse und Onboarding-Flag bleiben erhalten — die werden
 * separat verwaltet und sind keine Übungs-Daten.
 */
export function clearProgress(): void {
  localStorage.removeItem(KEY_PROGRESS)
}
