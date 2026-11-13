# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [Unreleased]

### Hinzugefügt

- Impressum (`impressum.html`) und Datenschutzerklärung (`datenschutz.html`) als eigene
  statische Seiten, verlinkt in Fußzeile (auf allen Ansichten), Onboarding und
  Einstellungs-Menü
- Einstellung „Alle Daten löschen“: entfernt Fortschritt, Lehrerin-Adresse und
  Onboarding-Status vom Gerät (`src/core/storage.ts`, `clearAllData`)
- Lizenzhinweise der mitgelieferten Open-Source-Komponenten
  (`public/third-party-licenses.txt`) und `LICENSE` (alle Rechte vorbehalten)
- Tests in `tools/tests/` prüfen JSDoc-Blöcke, das Fehlen externer Ressourcen und die
  Verlinkung der Rechtsseiten; sie laufen vor jedem Deployment
- `.gitattributes` (LF, CRLF für Windows-Skripte), ruff-Konfiguration für `tools/`

### Geändert

- MediaPipe-WASM wird nicht mehr von `cdn.jsdelivr.net` geladen, sondern bei
  `npm install` aus `node_modules` nach `public/mediapipe/` kopiert und vom eigenen
  Server ausgeliefert: keine IP-Übermittlung an Dritte mehr, und die WASM-Version passt
  immer zur installierten Bibliothek
- JSDoc-Blöcke und Python-Docstrings auf Englisch, Log-Meldungen auf Englisch
- README auf Deutsch mit Projektbeschreibung und Entwicklungsanleitung

### Entfernt

- Ungenutzte Abhängigkeit `onnxruntime-web`

## [0.1.0] - 2026-05-13

### Hinzugefügt

- Browser-App mit Echtzeit-Pose-Erkennung, Rep-Zähler, Fortschritt, Onboarding und
  Einstellungen; Deployment über GitHub Pages
