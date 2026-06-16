# AGENTS.md — drive-together

drive-together ist eine kleine Webanwendung zum Organisieren von
Mitfahrgelegenheiten. Diese Datei ist der verbindliche **technische Rahmen** für
Coding-Agenten. Fachliche Anforderungen stehen in `USER_STORIES.md`.

## Tech-Stack

- Sprache: **TypeScript**, strikt (`strict: true`, kein `any`)
- Backend: **Node.js + Fastify**, HTTP-API mit JSON
- Datenbank: **SQLite** über `better-sqlite3` (eine Datei, kein DB-Server)
- Frontend: **React + Bootstrap**, Build mit Vite
- Tests: **Vitest**
- Paketmanager: **npm**

## Projektstruktur

```
backend/    Fastify-API + Datenzugriff (better-sqlite3)
frontend/   React-App (Vite), spricht das Backend über HTTP+JSON an
```

## Befehle (je Teilprojekt)

- Installieren: `npm install`
- Entwicklung: `npm run dev`
- Typecheck: `npm run typecheck`  (`tsc --noEmit`)
- Lint: `npm run lint`  (ESLint)
- Tests: `npm test`  (Vitest)

## Konventionen

- ESM-Module, `async/await`
- Eingaben am API-Rand validieren (Fastify JSON-Schema)
- Konfiguration über Umgebungsvariablen, keine Geheimnisse im Code
- Kleine, fokussierte Commits

## Ports

- Die gesamte Anwendung ist über **einen einzigen Port: 8080** erreichbar
  (nur dieser Port wird im Devcontainer geforwardet).
- Das Fastify-Backend lauscht auf `0.0.0.0:8080`.
- Das React/Vite-Frontend wird **nicht** auf einem eigenen Port (5173) exponiert:
  - In Produktion liefert das Backend das gebaute Frontend (`vite build`) als
    statische Dateien aus.
  - In der Entwicklung läuft Vite hinter dem Backend (z.B. Vite-Middleware oder
    Proxy), sodass alles unter `http://localhost:8080` läuft.

## Definition of Done

Eine Änderung ist fertig, wenn **Typecheck, Lint und Tests grün** sind.

## Nicht-Ziele (bewusst out of scope)

- Keine Echtzeit (kein WebSocket), kein Deployment, keine Bezahlung
- Authentifizierung bewusst minimal (E-Mail + Passwort), kein externer
  Identity-Provider
- Fachliche Vereinfachungen (z.B. Fahrten-Matching) siehe `USER_STORIES.md`
