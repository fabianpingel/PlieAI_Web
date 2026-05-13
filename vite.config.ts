import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],

  // Verhindert, dass Vite diese Pakete umbaut —
  // beide enthalten WebAssembly-Code, der direkte Dateipfade benötigt
  optimizeDeps: {
    exclude: ['onnxruntime-web', '@mediapipe/tasks-vision'],
  },

  server: {
    // Unterdrückt die "Failed to load source map"-Warnung für node_modules —
    // diese Pakete liefern keine Source-Maps mit, das ist kein Fehler
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
  },
})
