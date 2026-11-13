<template>
  <!--
    Kamera-Feed mit Pose-Erkennung und Canvas-Overlay.
    Das <video>-Element ist versteckt; das Kamerabild wird auf den <canvas> gezeichnet.
  -->
  <div class="relative w-full rounded-3xl overflow-hidden bg-gray-900" style="aspect-ratio: 3/4">

    <!--
      Video-Element ist optisch unsichtbar aber NICHT display:none.
      display:none verhindert Frame-Rendering in Chrome → Canvas zeigt nur Schwarz.
      Stattdessen: 1px groß, außerhalb des sichtbaren Bereichs.
    -->
    <video
      ref="videoEl"
      autoplay
      playsinline
      muted
      style="position: absolute; width: 1px; height: 1px; top: 0; left: 0; opacity: 0; pointer-events: none;"
    />

    <!-- Canvas: zeigt Kamerabild + Pose-Overlay übereinander -->
    <canvas ref="canvasEl" class="w-full h-full object-cover" />

    <!-- ── Rep-Zähler oben rechts (immer sichtbar während Übung läuft) ─── -->
    <div
      v-if="status === 'running' && !showSuccess"
      class="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2"
    >
      <span class="text-2xl font-bold text-plie-apricot">{{ reps }}</span>
      <span class="text-sm text-plie-muted">/ {{ TARGET_REPS }}</span>
    </div>

    <!-- ── Halte-Fortschritt (Ring um Rep-Zähler) während Pose gehalten wird ── -->
    <div
      v-if="status === 'running' && !showSuccess && holdProgress > 0"
      class="absolute top-3 right-3 pointer-events-none"
    >
      <!--
        SVG-Kreis als Fortschritts-Ring.
        stroke-dasharray = Umfang, stroke-dashoffset wird animiert (0 = voll).
      -->
      <svg width="64" height="64" viewBox="0 0 64 64" class="-rotate-90">
        <circle
          cx="32" cy="32" r="28"
          fill="none"
          stroke="#f0a868"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="175.93"
          :stroke-dashoffset="175.93 * (1 - holdProgress)"
          style="transition: stroke-dashoffset 0.1s linear"
        />
      </svg>
    </div>

    <!-- ── Konfetti-Burst bei erfolgreichem Rep ────────────────────────── -->
    <Transition name="confetti">
      <div
        v-if="showConfetti"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="text-7xl confetti-bounce">✨</div>
        <span
          v-for="(emoji, i) in confettiEmojis"
          :key="i"
          class="absolute text-4xl confetti-particle"
          :style="{
            left: `${50 + (i - 4) * 8}%`,
            animationDelay: `${i * 0.05}s`,
          }"
        >{{ emoji }}</span>
      </div>
    </Transition>

    <!-- ── Erfolgs-Screen nach 5 Reps ──────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showSuccess"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-plie-apricot/95 to-plie-rose/95"
      >
        <div class="text-7xl">🎉</div>
        <h3 class="text-2xl font-bold text-white text-center px-4">Super gemacht!</h3>
        <p class="text-white text-sm px-6 text-center">{{ TARGET_REPS }} mal geschafft!</p>
        <div class="flex gap-3 mt-2">
          <button
            class="px-5 py-3 rounded-xl bg-white text-plie-apricot font-bold shadow-lg active:scale-95"
            @click="resetReps"
          >
            ↻ Nochmal
          </button>
          <button
            class="px-5 py-3 rounded-xl bg-plie-dark text-white font-bold shadow-lg active:scale-95"
            @click="$emit('back')"
          >
            Andere Pose
          </button>
        </div>
      </div>
    </Transition>

    <!-- Lade-Overlay: wird angezeigt solange Kamera oder Modell noch laden -->
    <Transition name="fade">
      <div
        v-if="status !== 'running'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/90"
      >
        <div class="text-5xl">{{ statusIcon }}</div>
        <p class="text-white text-sm font-medium text-center px-6">{{ statusText }}</p>

        <!-- Lade-Spinner während der Initialisierung -->
        <div
          v-if="status === 'loading'"
          class="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"
        />

        <!-- Fehlermeldung mit Retry-Button -->
        <button
          v-if="status === 'error'"
          class="mt-2 px-5 py-2 rounded-xl text-white text-sm font-semibold"
          style="background: linear-gradient(135deg, #f0a868, #e8829e)"
          @click="$emit('back')"
        >
          Zurück
        </button>
      </div>
    </Transition>

  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { PoseDetector }   from '../core/poseDetector'
import { PoseClassifier } from '../core/poseClassifier'
import { embedPose }      from '../core/poseEmbedder'
import { addReps }        from '../core/storage'
import {
  drawVideoFrame,
  drawSkeleton,
  drawDeviationArrows,
  drawConfidenceBar,
  drawNotDetected,
} from '../core/poseRenderer'

// ── Props & Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Name of the selected target pose (must match a file name in /poses/). */
  targetPose: string
}>()

const emit = defineEmits<{
  /** Emitted when the user ends the exercise. */
  back: []
}>()

// ── Konstanten für den Rep-Zähler ─────────────────────────────────────────────

/** How often the pose must be held to complete the exercise. */
const TARGET_REPS = 5

/** Minimum confidence (0..1) for a pose to count as correct. */
const HOLD_THRESHOLD = 0.70

/** How long the confidence must stay above the threshold without interruption (ms). */
const HOLD_DURATION_MS = 3000

/** Duration of the confetti animation after a successful rep (ms). */
const CONFETTI_DURATION_MS = 1200

/** Emojis rendered in the confetti burst. */
const confettiEmojis: string[] = ['🌟', '⭐', '✨', '🎀', '💫', '🌸', '⭐', '✨', '🌟']

// ── Status der Komponente ─────────────────────────────────────────────────────

type Status = 'loading' | 'running' | 'error'
const status = ref<Status>('loading')

// ── Rep-Zähler Zustand ────────────────────────────────────────────────────────

/** Number of successfully held poses in this exercise session. */
const reps = ref<number>(0)

/** Hold progress 0..1, shown as the ring around the rep counter. */
const holdProgress = ref<number>(0)

/** Whether the confetti burst is visible (briefly after each rep). */
const showConfetti = ref<boolean>(false)

/** Whether the success screen is visible (after TARGET_REPS). */
const showSuccess = ref<boolean>(false)

/**
 * requestAnimationFrame timestamp at which the pose first exceeded the
 * threshold; null while the pose is not being held.
 */
let holdStartTime: number | null = null

/** Status icon for the loading/error overlay. */
const statusIcon = computed(() => ({
  loading: '⏳',
  running: '',
  error:   '⚠️',
}[status.value]))

const statusText = computed(() => ({
  loading: 'Kamera und Modell werden geladen…',
  running: '',
  error:   errorMessage.value,
}[status.value]))

const errorMessage = ref('')

// ── DOM-Referenzen ────────────────────────────────────────────────────────────

const videoEl  = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

// ── Modell-Instanzen ──────────────────────────────────────────────────────────

const detector   = new PoseDetector()
const classifier = new PoseClassifier()

// ── Referenz-Pose (normalisierte Embeddings aus /poses/*.json) ────────────────

// Die Referenz-Pose ist ein (33, 3)-Array – geladen aus /public/poses/{name}.json
let referencePose: number[][] | null = null

/**
 * Load the reference pose of the selected exercise.
 *
 * The JSON files were generated from .npy files by tools/convert_poses.py.
 *
 * @param poseName Pose ID (file name without extension).
 */
async function loadReferencePose(poseName: string): Promise<void> {
  const response = await fetch(`/poses/${encodeURIComponent(poseName)}.json`)
  if (!response.ok) throw new Error(`Referenz-Pose nicht gefunden: ${poseName}`)
  referencePose = await response.json() as number[][]
}

// ── Kamera ────────────────────────────────────────────────────────────────────

let cameraStream: MediaStream | null = null

/**
 * Open the camera with progressively looser constraints.
 *
 * Fallback chain:
 *   1. Front camera (smartphones) with the ideal resolution
 *   2. Any camera with the ideal resolution (desktop webcam)
 *   3. Any available camera without constraints
 *
 * The stream is only drawn onto a local canvas; no frame leaves the device.
 */
async function startCamera(): Promise<void> {
  const attempts = [
    // Versuch 1: Front-Kamera (Smartphone)
    { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
    // Versuch 2: Beliebige Kamera mit Auflösungs-Hinweis (Desktop)
    { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
    // Versuch 3: Einfachste mögliche Anfrage
    { video: true, audio: false },
  ] as const

  let lastError: unknown
  for (const constraints of attempts) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
      break
    } catch (err) {
      lastError = err
    }
  }

  if (!cameraStream) {
    // Diagnose: Welche Geräte sieht der Browser überhaupt?
    let deviceInfo = ''
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(d => d.kind === 'videoinput')
      deviceInfo = cameras.length === 0
        ? ' (Browser sieht keine Kamera-Geräte)'
        : ` (${cameras.length} Kamera(s) gefunden: ${cameras.map(c => c.label || 'ohne Label').join(', ')})`
    } catch { /* enumerateDevices nicht verfügbar */ }

    const err = lastError as DOMException
    if (err?.name === 'NotAllowedError') {
      throw new Error('Kamera-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.')
    } else if (err?.name === 'NotFoundError') {
      throw new Error(
        `Keine Kamera gefunden${deviceInfo}. ` +
        'Prüfe Windows-Einstellungen → Datenschutz & Sicherheit → Kamera ' +
        '→ "Desktop-Apps den Zugriff erlauben" muss Ein sein.'
      )
    } else {
      throw new Error(`Kamera-Fehler: ${err?.name} – ${err?.message ?? 'Unbekannt'}${deviceInfo}`)
    }
  }

  const video = videoEl.value!
  video.srcObject = cameraStream

  // Warten bis das erste Frame verfügbar ist
  await new Promise<void>(resolve => {
    video.onloadeddata = () => resolve()
  })

  // Canvas auf Video-Auflösung setzen
  const canvas = canvasEl.value!
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
}

/** Stop all tracks of the camera stream. */
function stopCamera(): void {
  cameraStream?.getTracks().forEach(t => t.stop())
  cameraStream = null
}

// ── Erkennungs-Schleife ───────────────────────────────────────────────────────

/** Whether the detection loop keeps running; false stops it. */
let loopActive = false

/**
 * Run one step of the main loop, driven by requestAnimationFrame (~60 fps).
 *
 * Per frame:
 *   1. Draw the camera image onto the canvas
 *   2. Detect the pose with MediaPipe
 *   3. Landmarks → embedPose → PoseClassifier
 *   4. Visualize (skeleton, arrows, confidence bar)
 *
 * @param timestamp Frame timestamp from requestAnimationFrame.
 */
function detectionLoop(timestamp: DOMHighResTimeStamp): void {
  if (!loopActive) return

  const video  = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) { requestAnimationFrame(detectionLoop); return }

  const ctx = canvas.getContext('2d')!
  const w   = canvas.width
  const h   = canvas.height

  // Kamerabild zeichnen (gespiegelt für Selfie)
  drawVideoFrame(ctx, video, w, h, true)

  // Pose erkennen
  const result = detector.detect(video, timestamp)

  if (result && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0]

    // Sichtbarkeits-Check: Schlüssel-Körperpunkte müssen ausreichend sichtbar sein.
    // Nur Nase (0), Schultern (11/12) und Hüften (23/24) geprüft —
    // Arme/Beine können außerhalb des Kamerabilds sein (besonders auf Tablets).
    const keyPoints = [0, 11, 12, 23, 24]
    const keyVisibility = keyPoints.reduce((s, i) => s + (landmarks[i]?.visibility ?? 0), 0)
    if (keyVisibility < 1.5) {  // Mindestens 30% Sichtbarkeit an jedem Schlüsselpunkt
      drawNotDetected(ctx, w, h)
      requestAnimationFrame(detectionLoop)
      return
    }

    // Landmarks normalisieren (Port des Python-Embedders)
    const { flat, matrix } = embedPose(landmarks, w, h)

    // Pose klassifizieren
    const classResult = classifier.classify(flat)
    const confidence  = classifier.getProbability(classResult, props.targetPose)

    // Skelett zeichnen
    drawSkeleton(ctx, landmarks, w, h)

    // Abweichungs-Pfeile zeichnen (wenn Referenz-Pose geladen)
    if (referencePose) {
      drawDeviationArrows(ctx, landmarks, referencePose, matrix, w, h)
    }

    // Konfidenz-Balken zeichnen
    drawConfidenceBar(ctx, props.targetPose, confidence, w, h)

    // Rep-Zähler aktualisieren (siehe Funktion unten)
    updateRepCounter(confidence, timestamp)

  } else if (result) {
    // MediaPipe läuft, aber keine Person im Bild
    drawNotDetected(ctx, w, h)
    // Person nicht erkannt → Halte-Timer zurücksetzen
    updateRepCounter(0, timestamp)
  }

  requestAnimationFrame(detectionLoop)
}

// ── Rep-Zähler Logik ──────────────────────────────────────────────────────────

/**
 * Update the rep counter; called once per frame of the detection loop.
 *
 * While the confidence of the target pose is above HOLD_THRESHOLD a timer
 * runs. Once the uninterrupted hold time exceeds HOLD_DURATION_MS, a rep is
 * counted and confetti is shown. Any frame below the threshold resets the timer.
 *
 * @param confidence Current confidence of the target pose (0..1).
 * @param timestamp  requestAnimationFrame timestamp in milliseconds.
 */
function updateRepCounter(confidence: number, timestamp: DOMHighResTimeStamp): void {
  // Wenn Ziel bereits erreicht oder Erfolgs-Screen offen ist → nichts tun
  if (showSuccess.value) return

  if (confidence >= HOLD_THRESHOLD) {
    // Pose wird (weiterhin) korrekt gehalten
    if (holdStartTime === null) {
      holdStartTime = timestamp
    }
    const elapsed = timestamp - holdStartTime
    holdProgress.value = Math.min(elapsed / HOLD_DURATION_MS, 1)

    if (elapsed >= HOLD_DURATION_MS) {
      // ── Rep erfolgreich! ──
      reps.value += 1
      holdStartTime = null
      holdProgress.value = 0
      triggerConfetti()

      // Persistenter Fortschritt: in localStorage hochzählen
      addReps(props.targetPose, 1)

      if (reps.value >= TARGET_REPS) {
        // Kurze Pause damit das Konfetti sichtbar bleibt, dann Erfolgs-Screen
        setTimeout(() => { showSuccess.value = true }, CONFETTI_DURATION_MS)
      }
    }
  } else {
    // Konfidenz zu niedrig → Halte-Timer zurücksetzen
    holdStartTime = null
    holdProgress.value = 0
  }
}

/** Show the confetti burst briefly. */
function triggerConfetti(): void {
  showConfetti.value = true
  setTimeout(() => { showConfetti.value = false }, CONFETTI_DURATION_MS)
}

/** Reset the rep counter completely ("Nochmal" button and pose change). */
function resetReps(): void {
  reps.value = 0
  holdStartTime = null
  holdProgress.value = 0
  showSuccess.value = false
  showConfetti.value = false
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    // Kamera, Modelle und Referenz-Pose parallel laden
    await Promise.all([
      startCamera(),
      detector.init(),
      classifier.init(),
      loadReferencePose(props.targetPose),
    ])
    loopActive = true
    status.value = 'running'
    requestAnimationFrame(detectionLoop)
  } catch (err) {
    console.error('Initialization failed:', err)
    errorMessage.value = err instanceof Error
      ? err.message
      : 'Kamera oder Modell konnte nicht geladen werden.'
    status.value = 'error'
  }
})

onUnmounted(() => {
  loopActive = false
  stopCamera()
  detector.close()
})

// Neue Referenz-Pose laden wenn der Nutzer die Übung wechselt
watch(() => props.targetPose, async (newPose) => {
  referencePose = null
  resetReps()
  await loadReferencePose(newPose)
})
</script>


<style scoped>
/* Sanftes Ein-/Ausblenden des Lade-Overlays */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Konfetti-Animationen ──────────────────────────────────────────────── */

/* Sanftes Ein-/Ausblenden des Konfetti-Containers */
.confetti-enter-active {
  transition: opacity 0.15s ease;
}
.confetti-leave-active {
  transition: opacity 0.4s ease;
}
.confetti-enter-from,
.confetti-leave-to {
  opacity: 0;
}

/* Großes Stern-Emoji in der Mitte: hüpft kurz */
.confetti-bounce {
  animation: bounce-pop 0.8s ease-out;
  filter: drop-shadow(0 4px 12px rgba(240, 168, 104, 0.6));
}
@keyframes bounce-pop {
  0%   { transform: scale(0)   rotate(-30deg); opacity: 0; }
  40%  { transform: scale(1.4) rotate(15deg);  opacity: 1; }
  70%  { transform: scale(0.95) rotate(-5deg); opacity: 1; }
  100% { transform: scale(1.1) rotate(0);     opacity: 0; }
}

/* Einzelne Konfetti-Partikel fliegen hoch und fallen leicht zur Seite */
.confetti-particle {
  top: 50%;
  animation: particle-fly 1.1s ease-out forwards;
  opacity: 0;
}
@keyframes particle-fly {
  0%   { transform: translate(-50%, 0)         rotate(0);    opacity: 1; }
  100% { transform: translate(-50%, -200px)    rotate(360deg); opacity: 0; }
}
</style>
