<template>
  <!--
    Einstellungs-Overlay: erscheint beim Klick auf das Zahnrad im Header.

    Klick auf den dunklen Hintergrund ODER auf das ✕ schließt das Menü.
    Klick auf die Karte selbst nicht (stopPropagation), damit man darin
    bedienen kann ohne dass es zugeht.
  -->
  <div
    class="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
    @click="$emit('close')"
  >
    <!-- Karte: am Boden auf Mobile (Bottom-Sheet), zentriert ab sm-Breakpoint -->
    <div
      class="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-8 sm:pb-5"
      @click.stop
    >

      <!-- Kopfzeile mit Titel und Schließen-Button -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-plie-dark">Einstellungen</h2>
        <button
          aria-label="Schließen"
          class="w-8 h-8 rounded-full bg-plie-cream text-plie-dark/70 text-lg flex items-center justify-center active:scale-95"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- ─── Menü-Einträge ─── -->
      <ul class="space-y-2">

        <!-- Einführung erneut zeigen -->
        <li>
          <button
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-plie-cream active:scale-[0.98] transition-all text-left"
            @click="$emit('showOnboarding')"
          >
            <span class="text-2xl">❓</span>
            <span class="flex-1 font-semibold text-plie-dark text-sm">Einführung anzeigen</span>
            <span class="text-plie-muted">›</span>
          </button>
        </li>

        <!-- Lehrerin-Adresse: zeigt aktuelle E-Mail als Subtext -->
        <li>
          <button
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-plie-cream active:scale-[0.98] transition-all text-left"
            @click="$emit('changeEmail')"
          >
            <span class="text-2xl">📧</span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-plie-dark text-sm">Lehrerin-Adresse</p>
              <p class="text-xs text-plie-muted truncate">
                {{ teacherEmail ?? 'Noch nicht eingetragen' }}
              </p>
            </div>
            <span class="text-plie-muted">›</span>
          </button>
        </li>

        <!-- Fortschritt zurücksetzen: rot getönt als Warnung -->
        <li>
          <button
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all text-left"
            @click="$emit('resetProgress')"
          >
            <span class="text-2xl">🗑️</span>
            <span class="flex-1 font-semibold text-red-600 text-sm">Fortschritt zurücksetzen</span>
            <span class="text-plie-muted">›</span>
          </button>
        </li>
      </ul>

      <!-- Footer: App-Version -->
      <p class="text-center text-xs text-plie-muted mt-5">
        Plié AI v2.0 · © 2025 Fabian Pingel
      </p>

    </div>
  </div>
</template>


<script setup lang="ts">
/**
 * Einstellungs-Menü als Bottom-Sheet (Mobile) / zentriertes Modal (Desktop).
 *
 * Reine Anzeige-Komponente — alle Aktionen werden als Events an den Parent
 * (App.vue) weitergereicht, der die eigentliche Logik (Onboarding zeigen,
 * Adresse ändern, Fortschritt löschen) ausführt.
 */

defineProps<{
  /** Aktuell gespeicherte Lehrerin-E-Mail (null wenn noch nie eingetragen). */
  teacherEmail: string | null
}>()

defineEmits<{
  /** Menü schließen (Klick auf ✕ oder Hintergrund). */
  close: []
  /** Onboarding-Bildschirm öffnen. */
  showOnboarding: []
  /** E-Mail-Adresse der Lehrerin ändern. */
  changeEmail: []
  /** Übungs-Fortschritt zurücksetzen (mit Bestätigung im Parent). */
  resetProgress: []
}>()
</script>
