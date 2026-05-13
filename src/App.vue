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

        <!-- App-Name (nur in Auswahl-Ansicht) -->
        <div v-if="view === 'selection'" class="text-right">
          <p class="text-lg font-bold text-plie-dark leading-tight">🩰 Plié AI</p>
          <p class="text-xs text-plie-muted">Dein Ballett-Trainer</p>
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
              'rounded-2xl border-2 p-2 text-center transition-all duration-200 active:scale-95',
              selectedPose === pose.id
                ? 'border-plie-apricot bg-plie-apricot-light shadow-md scale-[1.02]'
                : 'border-plie-apricot-light bg-white hover:border-plie-apricot',
            ]"
            @click="selectedPose = pose.id"
          >
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
    <footer v-if="view === 'selection'" class="text-center text-plie-muted text-xs py-3">
      © 2025 Fabian Pingel · Plié AI v2.0
    </footer>

  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import CameraView from './components/CameraView.vue'

// ── Datenmodell ───────────────────────────────────────────────────────────────

interface Pose {
  id:    string  // Dateiname (ohne Endung) in /pose_images/ und /poses/
  label: string  // Anzeigename
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

// ── Aktionen ──────────────────────────────────────────────────────────────────

function startExercise(): void {
  if (!selectedPose.value) return
  activePose.value = poses.find(p => p.id === selectedPose.value) ?? null
  view.value = 'exercise'
}

function stopExercise(): void {
  view.value   = 'selection'
  activePose.value = null
}
</script>
