<template>
  <!--
    Onboarding-Overlay: erklärt Plié AI in einem einzigen scrollbaren Screen.

    Wird beim allerersten Start automatisch gezeigt (Flag in localStorage)
    und kann über das ?-Icon im Header jederzeit wieder geöffnet werden.

    Vollbild-Overlay mit Verlauf-Hintergrund, scrollt auf kleinen Geräten.
  -->
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    style="background: linear-gradient(135deg, #fef8f5 0%, #f0a868 100%)"
  >
    <div class="min-h-svh flex flex-col items-center px-5 py-8 max-w-lg mx-auto">

      <!-- Logo -->
      <img src="/logo.png" alt="Sinica Wingen Ballett" class="h-16 w-auto mb-3" />

      <!-- Begrüßung -->
      <h1 class="text-3xl font-bold text-plie-dark text-center">🩰 Willkommen!</h1>
      <p class="text-base text-plie-dark/80 text-center mt-2 mb-6 leading-relaxed">
        Plié AI hilft dir, deine Ballett-Posen zu Hause zu üben —
        die Kamera schaut zu und du bekommst sofort Rückmeldung.
      </p>

      <!-- ─── Inhalts-Karten (auf weißen Boxen für Lesbarkeit) ─── -->
      <div class="w-full space-y-3">

        <!-- DSGVO-Hinweis: Wichtigster Punkt für Eltern-Vertrauen -->
        <section class="bg-white rounded-2xl p-4 shadow-md border-2 border-plie-rose/40">
          <div class="flex items-start gap-3">
            <div class="text-3xl">🔒</div>
            <div>
              <h2 class="font-bold text-plie-dark text-sm">Dein Video bleibt bei dir</h2>
              <p class="text-xs text-plie-dark/70 mt-1 leading-relaxed">
                Kein Bild und kein Video verlässt jemals dein Gerät.
                Die Pose-Erkennung läuft komplett im Browser.
              </p>
            </div>
          </div>
        </section>

        <!-- Kurzanleitung in 3 Schritten -->
        <section class="bg-white rounded-2xl p-4 shadow-md">
          <h2 class="font-bold text-plie-dark text-sm mb-3 flex items-center gap-2">
            <span class="text-xl">✨</span>
            <span>So funktioniert's</span>
          </h2>
          <ol class="space-y-2 text-xs text-plie-dark/80">
            <li class="flex gap-2">
              <span class="font-bold text-plie-apricot shrink-0">1.</span>
              <span>Wähle eine Pose aus dem Bilder-Raster.</span>
            </li>
            <li class="flex gap-2">
              <span class="font-bold text-plie-apricot shrink-0">2.</span>
              <span>Stell dich vor die Kamera, sodass dein ganzer Körper sichtbar ist.</span>
            </li>
            <li class="flex gap-2">
              <span class="font-bold text-plie-apricot shrink-0">3.</span>
              <span>
                Halte die Pose <strong>3 Sekunden</strong> lang —
                der orange Ring zeigt deinen Fortschritt.
              </span>
            </li>
            <li class="flex gap-2">
              <span class="font-bold text-plie-apricot shrink-0">4.</span>
              <span>Nach 5 erfolgreichen Wiederholungen gibt's eine kleine Überraschung 🎉</span>
            </li>
          </ol>
        </section>

        <!-- Lehrerin-Bericht -->
        <section class="bg-white rounded-2xl p-4 shadow-md">
          <div class="flex items-start gap-3">
            <div class="text-3xl">📧</div>
            <div>
              <h2 class="font-bold text-plie-dark text-sm">Bericht an die Lehrerin</h2>
              <p class="text-xs text-plie-dark/70 mt-1 leading-relaxed">
                Eltern können den Übungs-Fortschritt jederzeit per E-Mail
                an die Ballettlehrerin senden — der Button erscheint sobald
                eine Pose geübt wurde.
              </p>
            </div>
          </div>
        </section>

      </div>

      <!-- "Los geht's"-Button: ruft die Komponente zu schließen + Flag setzen -->
      <button
        class="mt-6 w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
        style="background: linear-gradient(135deg, #f0a868, #e8829e)"
        @click="$emit('done')"
      >
        Los geht's ▶
      </button>

      <p class="text-xs text-plie-dark/60 text-center mt-4">
        Diesen Bildschirm findest du jederzeit über das ?-Symbol oben rechts.
      </p>

    </div>
  </div>
</template>


<script setup lang="ts">
// Reine Anzeige-Komponente — kein lokaler Zustand nötig.
// Der Parent (App.vue) entscheidet wann sie gezeigt wird und reagiert auf 'done'.

defineEmits<{
  /** Nutzer hat "Los geht's" gedrückt — Parent soll Overlay schließen und Flag setzen. */
  done: []
}>()
</script>
