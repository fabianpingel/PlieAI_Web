<template>
  <div class="min-h-svh bg-plie-cream flex flex-col font-sans">

    <!-- ═══════════════════════════ KOPFZEILE ══════════════════════════════ -->
    <header class="bg-plie-white shadow-sm">
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">

        <!-- Zurück-Button (nur im Übungs-Modus sichtbar) -->
        <button
          v-if="view === 'exercise'"
          class="text-plie-apricot font-semibold text-sm flex items-center gap-1"
          @click="stopExercise"
        >
          ← Zurück
        </button>

        <!-- Studio-Logo -->
        <img
          src="/logo.png"
          alt="Sinica Wingen Ballett"
          :class="['h-12 w-auto', view === 'exercise' ? 'mx-auto' : '']"
        />

        <!-- App-Name + Hilfe-Button (nur in Auswahl-Ansicht) -->
        <div v-if="view === 'selection'" class="flex items-center gap-2">
          <div class="text-right">
            <p class="text-lg font-bold text-plie-dark leading-tight">🩰 Plié AI</p>
            <p class="text-xs text-plie-muted">Dein Ballett-Trainer</p>
          </div>
          <!-- Einstellungen: öffnet das Settings-Bottom-Sheet (enthält Hilfe, Adresse, Reset) -->
          <button
            aria-label="Einstellungen"
            class="w-9 h-9 rounded-full bg-plie-apricot-light text-plie-apricot text-xl flex items-center justify-center active:scale-95 transition-transform"
            @click="showSettings = true"
          >
            ⚙
          </button>
        </div>

        <!-- Unsichtbarer Platzhalter (hält Layout im Übungs-Modus symmetrisch) -->
        <div v-if="view === 'exercise'" class="w-16" />
      </div>

      <!-- Marken-Streifen: Apricot → Rosa -->
      <div class="h-1 w-full" style="background: linear-gradient(to right, #f0a868, #e8829e)" />
    </header>


    <!-- ═══════════════════════════ HAUPTBEREICH ═══════════════════════════ -->
    <main class="flex-1 flex flex-col gap-4 p-4 max-w-lg mx-auto w-full">

      <!-- ── ANSICHT 1: Posen-Auswahl ──────────────────────────────────── -->
      <template v-if="view === 'selection'">

        <!-- Begrüßung -->
        <div class="text-center py-2">
          <h2 class="text-xl font-bold text-plie-dark">Welche Pose möchtest du üben?</h2>
          <p class="text-sm text-plie-muted mt-1">Tippe auf ein Bild, dann auf Start</p>
        </div>

        <!-- Posen-Raster -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            v-for="pose in poses"
            :key="pose.id"
            :class="[
              'relative rounded-2xl border-2 p-2 text-center transition-all duration-200 active:scale-95',
              selectedPose === pose.id
                ? 'border-plie-apricot bg-plie-apricot-light shadow-md scale-[1.02]'
                : 'border-plie-apricot-light bg-white hover:border-plie-apricot',
            ]"
            @click="selectedPose = pose.id"
          >
            <!-- Fortschritts-Badge: zeigt geübte Reps oben rechts (nur wenn > 0) -->
            <div
              v-if="progress[pose.id]?.totalReps"
              class="absolute -top-1 -right-1 bg-plie-apricot text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-md flex items-center gap-0.5 z-10"
            >
              <span>✨</span>
              <span>{{ progress[pose.id].totalReps }}</span>
            </div>

            <img
              :src="`/pose_images/${pose.id}.jpg`"
              :alt="pose.label"
              class="w-full rounded-xl aspect-square object-cover mb-2"
            />
            <p class="text-xs font-semibold text-plie-dark leading-tight">{{ pose.label }}</p>
          </button>
        </div>

        <!-- Start-Button -->
        <button
          :disabled="!selectedPose"
          :class="[
            'w-full py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200',
            selectedPose ? 'shadow-lg active:scale-95' : 'opacity-40 cursor-not-allowed',
          ]"
          :style="selectedPose
            ? 'background: linear-gradient(135deg, #f0a868, #e8829e)'
            : 'background: #ccc'"
          @click="startExercise"
        >
          {{ selectedPose ? '▶ Übung starten' : 'Pose auswählen…' }}
        </button>

        <!-- Bericht an Lehrerin (nur sichtbar wenn mindestens eine Pose geübt wurde) -->
        <button
          v-if="hasAnyProgress()"
          class="w-full py-3 rounded-2xl border-2 border-plie-rose text-plie-rose font-semibold text-sm active:scale-95 transition-transform"
          @click="sendReport"
        >
          📧 Bericht an Ballettlehrerin senden
        </button>
      </template>


      <!-- ── ANSICHT 2: Kamera + Pose-Erkennung ────────────────────────── -->
      <template v-if="view === 'exercise' && activePose">

        <!-- Pose-Name als Titel -->
        <div class="text-center">
          <h2 class="text-lg font-bold text-plie-dark">{{ activePose.label }}</h2>
        </div>

        <!-- Kamera-Komponente -->
        <!-- targetPose: Dateiname der gewählten Pose (ohne Endung) -->
        <CameraView
          :target-pose="activePose.id"
          @back="stopExercise"
        />

      </template>
    </main>


    <!-- ═══════════════════════════ FUSSZEILE ══════════════════════════════ -->
    <!-- Immer sichtbar (auch während der Übung): Impressum und Datenschutz
         müssen von jeder Seite aus mit einem Klick erreichbar sein (§ 5 DDG, Art. 13 DSGVO). -->
    <footer class="text-center text-plie-muted text-xs py-3 space-y-1">
      <p v-if="view === 'selection'">
        <span class="inline-block px-2 py-0.5 rounded-full bg-plie-rose/15 text-plie-rose font-semibold">
          Beta · Private Demo
        </span>
      </p>
      <p>
        <a href="/impressum.html" class="underline hover:text-plie-dark">Impressum</a>
        ·
        <a href="/datenschutz.html" class="underline hover:text-plie-dark">Datenschutz</a>
      </p>
      <p>© 2025–2026 Fabian Pingel · PINGEL AI Solutions · Plié AI v2.0</p>
    </footer>

    <!-- ═══════════════════════════ ONBOARDING-OVERLAY ═════════════════════ -->
    <!-- Liegt z-50 über allem; wird beim ersten Start & via Settings-Menü aufgerufen. -->
    <OnboardingScreen v-if="showOnboarding" @done="finishOnboarding" />

    <!-- ═══════════════════════════ EINSTELLUNGEN ══════════════════════════ -->
    <!-- Bottom-Sheet auf Mobile, zentriertes Modal auf Desktop. -->
    <SettingsMenu
      v-if="showSettings"
      :teacher-email="teacherEmail"
      @close="showSettings = false"
      @show-onboarding="openOnboardingFromSettings"
      @change-email="changeTeacherEmail"
      @reset-progress="resetProgressFromSettings"
      @delete-all-data="deleteAllDataFromSettings"
    />

  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import CameraView from './components/CameraView.vue'
import OnboardingScreen from './components/OnboardingScreen.vue'
import SettingsMenu from './components/SettingsMenu.vue'
import {
  getAllProgress,
  getTeacherEmail,
  setTeacherEmail,
  formatGermanDate,
  hasSeenOnboarding,
  markOnboardingSeen,
  clearProgress,
  clearAllData,
  type ProgressData,
} from './core/storage'

// ── Datenmodell ───────────────────────────────────────────────────────────────

/** A selectable ballet pose. */
interface Pose {
  /** File name (without extension) in /pose_images/ and /poses/. */
  id:    string
  /** Display name. */
  label: string
}

const poses: Pose[] = [
  { id: '1.Position - Demi Plie',      label: '1. Position · Demi Plié' },
  { id: '1.Position - Grand Plie',     label: '1. Position · Grand Plié' },
  { id: '1.Position - Arm 3.Position', label: '1. Position · Arm' },
  { id: '5.Position - Releve',         label: '5. Position · Relevé' },
  { id: 'Fussfuehrung',                label: 'Fußführung' },
  { id: 'Passe',                       label: 'Passé' },
  { id: 'Port de Bras',                label: 'Port de Bras' },
]

// ── Zustand ───────────────────────────────────────────────────────────────────

type View = 'selection' | 'exercise'

const view         = ref<View>('selection')
const selectedPose = ref<string | null>(null)
const activePose   = ref<Pose | null>(null)

// ── Fortschritt aus localStorage ──────────────────────────────────────────────

/**
 * Reactive progress of all poses.
 *
 * Loaded on start and refreshed after each exercise so that badges and
 * the report show the current reps.
 */
const progress = ref<ProgressData>(getAllProgress())

// ── Onboarding ────────────────────────────────────────────────────────────────

/**
 * Whether the onboarding screen is visible.
 *
 * True on the very first start; later it is opened from the settings menu.
 */
const showOnboarding = ref<boolean>(!hasSeenOnboarding())

/** Close the onboarding and remember it (user tapped "Los geht's"). */
function finishOnboarding(): void {
  markOnboardingSeen()
  showOnboarding.value = false
}

// ── Einstellungs-Menü (Zahnrad oben rechts) ───────────────────────────────────

/** Whether the settings bottom sheet is visible. */
const showSettings = ref<boolean>(false)

/** Reactive copy of the teacher address for display in the settings menu. */
const teacherEmail = ref<string | null>(getTeacherEmail())

/** Open the onboarding from the settings menu. */
function openOnboardingFromSettings(): void {
  showSettings.value = false
  showOnboarding.value = true
}

/** Ask for the teacher address via prompt(), prefilled with the current one. */
function changeTeacherEmail(): void {
  const current = getTeacherEmail() ?? ''
  const input = window.prompt(
    'E-Mail-Adresse der Ballettlehrerin:\n(wird nur lokal auf diesem Gerät gespeichert)',
    current,
  )
  if (input === null) return  // Nutzer hat Abbrechen gedrückt
  const trimmed = input.trim()
  if (!trimmed.includes('@')) {
    window.alert('Das sieht nicht wie eine gültige E-Mail-Adresse aus.')
    return
  }
  setTeacherEmail(trimmed)
  teacherEmail.value = trimmed
}

/**
 * Delete the stored exercise progress after confirmation.
 *
 * Teacher address and onboarding flag are kept.
 */
function resetProgressFromSettings(): void {
  const ok = window.confirm(
    'Wirklich allen Übungs-Fortschritt löschen?\n\n' +
    'Alle ✨-Sterne verschwinden. Diese Aktion kann nicht rückgängig gemacht werden.',
  )
  if (!ok) return
  clearProgress()
  progress.value = {}
  showSettings.value = false
}

/**
 * Delete all data PlieAI stores on this device after confirmation.
 *
 * Removes progress, teacher address and onboarding flag; the onboarding
 * is shown again as on the very first start.
 */
function deleteAllDataFromSettings(): void {
  const ok = window.confirm(
    'Wirklich alle gespeicherten Daten löschen?\n\n' +
    'Fortschritt und Lehrerin-Adresse werden von diesem Gerät entfernt. ' +
    'Diese Aktion kann nicht rückgängig gemacht werden.',
  )
  if (!ok) return
  clearAllData()
  progress.value = {}
  teacherEmail.value = null
  showSettings.value = false
  showOnboarding.value = true
}

// ── Aktionen ──────────────────────────────────────────────────────────────────

/** Switch to the exercise view for the selected pose. */
function startExercise(): void {
  if (!selectedPose.value) return
  activePose.value = poses.find(p => p.id === selectedPose.value) ?? null
  view.value = 'exercise'
}

/** Return to the pose selection and reload the progress. */
function stopExercise(): void {
  view.value   = 'selection'
  activePose.value = null
  // Fortschritt neu aus localStorage einlesen — der CameraView hat
  // während der Übung addReps() aufgerufen, die Badges müssen die neuen Werte zeigen
  progress.value = getAllProgress()
}

// ── Lehrerin-Bericht ──────────────────────────────────────────────────────────

/**
 * Build a mailto link with the progress report and open the mail program.
 *
 * Uses the stored teacher address; if there is none yet, asks for it via
 * prompt() and remembers it for future reports. The app itself sends
 * nothing: the user's own mail program sends the message.
 */
function sendReport(): void {
  // E-Mail-Adresse der Lehrerin holen oder einmalig abfragen
  let email = getTeacherEmail()
  if (!email) {
    const input = window.prompt(
      'E-Mail-Adresse der Ballettlehrerin eingeben:\n' +
      '(wird nur lokal auf diesem Gerät gespeichert)',
      '',
    )
    if (!input) return  // Nutzer hat abgebrochen
    email = input.trim()
    if (!email.includes('@')) {
      window.alert('Das sieht nicht wie eine gültige E-Mail-Adresse aus.')
      return
    }
    setTeacherEmail(email)
    teacherEmail.value = email  // reaktiven Wert für die Anzeige im Menü mit-aktualisieren
  }

  // Bericht-Text aus aktuellem Fortschritt zusammenbauen
  const lines: string[] = []
  for (const pose of poses) {
    const p = progress.value[pose.id]
    if (!p || p.totalReps === 0) continue
    lines.push(`• ${pose.label}: ${p.totalReps}× (zuletzt ${formatGermanDate(p.lastDate)})`)
  }
  if (lines.length === 0) {
    window.alert('Es wurden noch keine Posen geübt — bitte erst eine Übung machen.')
    return
  }

  const body = [
    'Hallo,',
    '',
    'mein Kind hat mit der Plié AI App geübt:',
    '',
    ...lines,
    '',
    'Viele Grüße',
  ].join('\n')
  const subject = 'Plié AI — Übungsfortschritt'

  // mailto-URI öffnen (encodeURIComponent damit Umlaute & Zeilenumbrüche sauber sind)
  window.location.href =
    `mailto:${encodeURIComponent(email)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
}

/**
 * Check whether at least one pose was practiced (otherwise the report button is hidden).
 *
 * @returns true if any pose has reps.
 */
function hasAnyProgress(): boolean {
  return Object.values(progress.value).some(p => p.totalReps > 0)
}
</script>
