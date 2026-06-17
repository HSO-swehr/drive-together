# drive-together

drive-together ist eine kleine Webanwendung zum Organisieren von
Mitfahrgelegenheiten. Nutzer können sich registrieren, Fahrten mit Start, Ziel
und Zeit anbieten und sich auf Fahrten anderer für freie Sitzplätze anmelden.
Das Projekt wurde entwickelt, um Studierenden der Hochschule Offenburg die
Entwicklung mit Hilfe von Coding-Agenten beizubringen.

**Tech-Stack und Architektur:** siehe `AGENTS.md`

**Einrichten:**

```bash
npm install            # installiert alle Workspaces auf einmal
cp .env.example .env   # lokale Konfiguration (optional, sinnvolle Defaults sind gesetzt)
```

**Entwicklung:**

```bash
npm run dev:watch    # wie `dev`, startet den Server bei .ts-Änderungen neu
```

## Nützliche Befehle

| Befehl              | Zweck                                                     |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev-Server (Backend + Frontend-HMR) auf Port 8080         |
| `npm run dev:watch` | wie oben, mit Backend-Neustart bei Änderungen             |
| `npm run build`     | Produktions-Build von Backend und Frontend                |
| `npm run typecheck` | TypeScript-Prüfung aller Teilprojekte                     |
| `npm run lint`      | ESLint                                                    |
| `npm run format`    | Prettier (schreibend) / `npm run format:check` zum Prüfen |
| `npm test`          | Tests (Vitest) für Backend und Frontend                   |

Einzelne Workspaces erreicht man mit `-w backend` bzw. `-w frontend`.
