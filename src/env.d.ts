/// <reference types="vite/client" />
// Sagt TypeScript, dass .vue-Dateien gültige Module sind
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}
