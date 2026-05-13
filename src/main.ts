// Einstiegspunkt der Vue-App
// createApp: erzeugt die Vue-Anwendung
// App: die Haupt-Komponente (src/App.vue)
import { createApp } from 'vue'
import App from './App.vue'

// Tailwind CSS laden (globale Styles)
import './style.css'

// Vue-App starten und in das <div id="app"> in index.html einhängen
createApp(App).mount('#app')
