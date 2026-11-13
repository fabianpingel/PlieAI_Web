import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      // Mehrseitiger Build: Impressum und Datenschutz sind eigene statische Seiten,
      // damit sie direkt verlinkbar sind und auch ohne laufende App funktionieren
      input: {
        main: 'index.html',
        impressum: 'impressum.html',
        datenschutz: 'datenschutz.html',
      },
    },
  },

  // Verhindert, dass Vite MediaPipe umbaut: das Paket lädt seine WebAssembly-Dateien
  // über direkte Pfade (siehe src/core/poseDetector.ts)
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },

  server: {
    // Unterdrückt die "Failed to load source map"-Warnung für node_modules —
    // diese Pakete liefern keine Source-Maps mit, das ist kein Fehler
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
  },
})
