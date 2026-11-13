# Plié AI 🩰

Browser-App, mit der Kinder zu Hause Ballett-Posen üben können: Die Kamera filmt das Kind,
die Pose-Erkennung läuft komplett im Browser und Pfeile zeigen, wie die Haltung korrigiert
werden muss.

Live: <https://plieai.pingel-ai-solutions.de>

## Datenschutz auf einen Blick

- Kamerabilder werden nur lokal im Browser ausgewertet und nie übertragen.
- Alle Dateien (App, MediaPipe-WASM, Modelle) kommen vom eigenen Server, kein CDN.
- Fortschritt und Lehrerin-Adresse liegen nur im `localStorage` des Geräts.
- Impressum und Datenschutzerklärung: `impressum.html`, `datenschutz.html`.
  Bei Änderungen an Datenverarbeitung, Hosting oder Kontaktdaten beide Seiten anpassen.

## Technik

- Vite, Vue 3, TypeScript, Tailwind CSS v4
- MediaPipe Tasks Vision (Pose Landmarker) als WebAssembly
- Logistische Regression als reines TypeScript (`src/core/poseClassifier.ts`)
- Deployment über GitHub Actions auf GitHub Pages (`.github/workflows/deploy.yml`)

## Entwicklung

```powershell
npm.cmd install        # kopiert per postinstall auch die MediaPipe-WASM nach public/mediapipe/
npm.cmd run dev        # http://localhost:5173
npm.cmd run build      # Typprüfung und Build nach dist/
```

`public/mediapipe/` ist nicht im Repository, sondern wird bei jedem `npm install` aus
`node_modules/@mediapipe/tasks-vision/wasm` erzeugt.

## Tests und Konvertierungs-Skripte

Die Python-Werkzeuge in `tools/` konvertieren das trainierte Modell und die Referenz-Posen.
Die Tests prüfen das Frontend (JSDoc-Blöcke, keine Fremd-Ressourcen, Rechtsseiten verlinkt):

```powershell
cd tools
uv sync
uv run ruff check .
uv run python -m pytest tests/ -v
```

## Lizenz

Alle Rechte vorbehalten, siehe [LICENSE](LICENSE). Mitgelieferte Open-Source-Komponenten
stehen unter ihren eigenen Lizenzen (`public/third-party-licenses.txt`).
