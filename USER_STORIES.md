# User Stories — drive-together

## Allgemeine Hinweise

Es gibt **einen** Nutzertyp. „Fahrer" und „Mitfahrer" bezeichnen die jeweilige
Rolle *innerhalb einer Fahrt* — keine getrennten Konten: dieselbe Person kann
Fahrten anbieten und sich auf fremde Fahrten anmelden.

## Stories

### 1. Registrieren

> Als potentieller Nutzer möchte ich mich registrieren können, um die Anwendung
> nutzen zu können.

- Eingabe: E-Mail + Passwort
- Passwort wird **gehasht** nach Industriestandards gespeichert (nie im Klartext)
- Vereinfachung: es gibt keine Verifizierung der E-Mail Adresse
- E-Mail muss eindeutig sein

### 2. Anmelden

> Als Nutzer möchte ich mich anmelden können, um auf meine Fahrten zuzugreifen.

- Login mit E-Mail + Passwort
- Nur registrierte Nutzer können sich anmelden

### 3. Fahrt anbieten

> Als Fahrer möchte ich eine Fahrt mit Start, Ziel und Zeit anbieten, um freie
> Sitzplätze zu teilen.

- Felder: Start, Ziel, Zeit (Datum+Uhrzeit), Anzahl freier Sitzplätze (> 0)
- Die Fahrt gehört dem anbietenden Nutzer
- Vereinfachung: Start und Ziel sind nur Strings, keine Koordinaten o.ä. Es werden
  keine Karten genutzt.

### 4. Fahrten ansehen

> Als Mitfahrer möchte ich angebotene Fahrten ansehen können, um eine passende
> Fahrt zu finden.

- Liste aller angebotener Fahrten mit noch freien Sitzplätzen, deren Zeitpunkt
  in der Zukunft liegt.
- Vereinfachung: kein Filtern, keine Suche

### 5. Für eine Fahrt anmelden

> Als Mitfahrer möchte ich mich für eine Fahrt anmelden, um einen Sitzplatz zu
> reservieren.

- Reservierung nur, solange Sitzplätze frei sind; danach Fehlermeldung
- Eine Reservierung verringert die freien Sitzplätze um 1
- Pro Nutzer max. eine Reservierung je Fahrt

