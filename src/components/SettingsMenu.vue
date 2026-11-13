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

        <!-- Alle Daten löschen: entfernt auch die Lehrerin-Adresse (Recht auf Löschung) -->
        <li>
          <button
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all text-left"
            @click="$emit('deleteAllData')"
          >
            <span class="text-2xl">🧹</span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-red-600 text-sm">Alle Daten löschen</p>
              <p class="text-xs text-plie-muted">Fortschritt und Lehrerin-Adresse</p>
            </div>
            <span class="text-plie-muted">›</span>
          </button>
        </li>

        <!-- Rechtliches: normale Links auf die statischen Seiten -->
        <li>
          <a
            href="/datenschutz.html"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-plie-cream active:scale-[0.98] transition-all text-left"
          >
            <span class="text-2xl">🔒</span>
            <span class="flex-1 font-semibold text-plie-dark text-sm">Datenschutz</span>
            <span class="text-plie-muted">›</span>
          </a>
        </li>
        <li>
          <a
            href="/impressum.html"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-plie-cream active:scale-[0.98] transition-all text-left"
          >
            <span class="text-2xl">ℹ️</span>
            <span class="flex-1 font-semibold text-plie-dark text-sm">Impressum</span>
            <span class="text-plie-muted">›</span>
          </a>
        </li>
      </ul>

      <!-- Footer: App-Version -->
      <p class="text-center text-xs text-plie-muted mt-5">
        Plié AI v2.0 · © 2025–2026 Fabian Pingel
      </p>

    </div>
  </div>
</template>


<script setup lang="ts">
/**
 * Settings menu as a bottom sheet (mobile) or centered modal (desktop).
 *
 * Pure display component: every action is emitted to the parent (App.vue),
 * which runs the actual logic (show onboarding, change address, delete data).
 */

defineProps<{
  /** Currently stored teacher e-mail (null if never entered). */
  teacherEmail: string | null
}>()

defineEmits<{
  /** Close the menu (click on ✕ or the backdrop). */
  close: []
  /** Open the onboarding screen. */
  showOnboarding: []
  /** Change the teacher's e-mail address. */
  changeEmail: []
  /** Reset the exercise progress (the parent asks for confirmation). */
  resetProgress: []
  /** Delete all locally stored data (the parent asks for confirmation). */
  deleteAllData: []
}>()
</script>
