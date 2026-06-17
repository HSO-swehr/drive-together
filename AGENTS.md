# AGENTS.md — drive-together

drive-together ist eine kleine Webanwendung zum Organisieren von
Mitfahrgelegenheiten. Diese Datei ist der verbindliche technische Rahmen für
Coding-Agenten. Fachliche Anforderungen stehen in `USER_STORIES.md`.

## Tech-Stack

- Sprache: TypeScript, strikt (`strict: true`, kein `any`)
- Backend: Node.js + Fastify, HTTP-API mit JSON
- Datenbank: SQLite über `better-sqlite3` (eine Datei, kein DB-Server)
- Frontend: React + Bootstrap, Build mit Vite
- Tests: Vitest
- Paketmanager: npm

**Voraussetzungen:** Node.js ≥ 22.9 und npm ≥ 10 (im Devcontainer bereits vorhanden)

## Projektstruktur

```
backend/    Fastify-API + Datenzugriff (better-sqlite3)
frontend/   React-App (Vite), spricht das Backend über HTTP+JSON an
```

## Befehle (je Teilprojekt)

- Installieren: `npm install`
- Entwicklung: `npm run dev`
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Lint: `npm run lint` (ESLint)
- Tests: `npm test` (Vitest)

## Konventionen

- ESM-Module, `async/await`
- Eingaben am API-Rand validieren (Fastify JSON-Schema)
- Konfiguration über Umgebungsvariablen, keine Geheimnisse im Code
- Keine automatischen Commits, die Commits werden manuell erstellt.

## Ports & Deployment

### Single-Port Architecture: 8080

Die gesamte Anwendung ist über einen einzigen Port 8080 erreichbar. Dies gilt für Entwicklung
und Produktion.

#### Backend

- Fastify-Server lauscht auf `0.0.0.0:8080`
- Liefert zwei Arten von Content aus:
  1. API-Endpoints unter `/api/*` (JSON)
  2. Statische Frontend-Dateien auf `/` (HTML, CSS, JavaScript)

#### Frontend (Keine separaten Ports)

- **Produktion**: Das gebaute Frontend (`frontend/dist/`) wird vom Backend als statische Dateien serviert
  - `npm run build -w frontend` erzeugt optimierte Bundles
  - Backend lädt diese beim Start und serviert sie auf `/`
- **Entwicklung**: Vite Dev-Server läuft als Middleware im Backend
  - Hot Module Replacement funktioniert unter Port 8080 (nicht 5173)
  - Keine separaten Prozesse, alles in einem Server

#### CORS & API-Calls

- Frontend und API laufen auf dem gleichen Origin (`localhost:8080`)
- API-Calls von Frontend zu Backend funktionieren ohne CORS-Probleme
- Beispiel: `fetch('/api/rides')` geht zu `http://localhost:8080/api/rides`

#### Devcontainer

- Nur Port 8080 wird geforwardet
- User öffnet Browser auf `http://localhost:8080` und erhält direkt das vollständige Frontend

## Definition of Done

Eine Änderung ist fertig, wenn das Skript `./check.sh` ohne Fehler und Warnungen durchläuft.

## Nicht-Ziele (bewusst out of scope)

- Echtzeit: Kein WebSocket, keine Live-Updates
- Deployment & Infrastructure: Kein Docker-Setup, kein Cloud-Hosting, keine CI/CD
- Authentifizierung: Bewusst minimal (E-Mail + Passwort), kein externer Identity-Provider (OAuth, SAML, etc.)
- Bezahlung: Keine Payment-Integration
- Fachliche Vereinfachungen: Keine Kartenfunktion, kein intelligentes Matching (siehe `USER_STORIES.md`)
