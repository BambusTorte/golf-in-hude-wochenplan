# Golf in Hude – Wochenplan-Plattform

Eine moderne Website, die aus den Turnier-/Veranstaltungsdaten des Golfclubs Hude
einen wöchentlichen **Wochenplan** erzeugt, ihn als **PDF** bereitstellt und ihn –
**erst nach manueller Prüfung und Freigabe** – öffentlich anzeigt.

- **Öffentlicher Bereich** (ohne Login): aktuelle veröffentlichte Woche, Wochenübersicht, Detailansicht, PDF öffnen/herunterladen.
- **Admin-Bereich** (geschützt): Wochenpläne erstellen, Termine bearbeiten, prüfen, veröffentlichen und zurücknehmen.
- Design im Stil von **„Golf. In Hude!"** (Waldgrün `#094D3B`, Plus Jakarta Sans).

---

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS (eigenes Designsystem) |
| Datenbank | PostgreSQL + Prisma ORM |
| Auth | Eigene serverseitige Sessions, Argon2id (`@node-rs/argon2`) |
| Validierung | Zod |
| PDF | `@react-pdf/renderer` (reproduzierbar aus Daten, A4) |
| Datenquellen | PC-CADDIE (HTML via `cheerio`, ICS via `node-ical`), manueller Import |
| Speicher | Lokales Dateisystem (Dev) / Netlify Blobs (Prod) |
| Tests | Vitest (Unit/Integration), Playwright (E2E) |
| Hosting | Netlify (Next.js Runtime, Scheduled Functions) |

---

## Voraussetzungen

- Node.js ≥ 20 (getestet mit 22/26)
- PostgreSQL ≥ 14 (lokal oder Neon)

---

## Lokale Einrichtung

```bash
# 1. Abhängigkeiten installieren
npm install
# Falls Installskripte blockiert werden (Prisma/esbuild):
npm approve-scripts @prisma/client prisma @prisma/engines esbuild unrs-resolver

# 2. Umgebungsvariablen
cp .env.example .env
# .env anpassen; Secrets erzeugen z. B. mit: openssl rand -hex 32

# 3. Datenbank anlegen und migrieren
createdb golf_in_hude
npm run prisma:migrate     # entwickelt & wendet Migrationen an
npm run prisma:generate

# 4. (Optional) Beispieldaten
npm run db:seed            # legt einen ENTWURF KW40/2026 an

# 5. Entwicklungsserver
npm run dev                # http://localhost:3000
```

### Ersteinrichtung des Administrators

Es gibt **genau einen** Administrator. Nach dem Start:

1. `http://localhost:3000/admin/setup` öffnen.
2. E-Mail, Passwort und den **`ADMIN_SETUP_KEY`** aus der `.env` eingeben.
3. Nach dem Anlegen wird die Setup-Seite **dauerhaft gesperrt** und leitet zum Login um.

---

## Umgebungsvariablen

Siehe [`.env.example`](.env.example). Wichtigste Werte:

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindung |
| `ADMIN_SETUP_KEY` | Einmaliger Schlüssel für die Ersteinrichtung |
| `SESSION_SECRET` | Session-Secret |
| `APP_TIMEZONE` | `Europe/Berlin` |
| `STORAGE_DRIVER` | `local` oder `netlify-blobs` |
| `LOCAL_STORAGE_DIR` | Pfad für PDFs im lokalen Modus |
| `PCCADDIE_CALENDAR_URL` / `PCCADDIE_ICS_URL` | Datenquellen |
| `CRON_SECRET` | Schutz des Generierungs-Endpoints |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche Basis-URL |
| `SESSION_COOKIE_SECURE` | Nur für lokale E2E-Tests (`0`); in Produktion leer lassen |

---

## Nützliche Befehle

```bash
npm run dev            # Entwicklungsserver
npm run build          # Produktions-Build (inkl. prisma generate + Typecheck)
npm run start          # Produktionsserver
npm run typecheck      # TypeScript prüfen
npm run lint           # ESLint
npm run test           # Unit- & Integrationstests (Vitest)
npm run test:e2e       # End-to-End-Tests (Playwright)
npm run db:seed        # Beispieldaten
npm run prisma:studio  # DB-Browser
npm run generate:week  # (falls Skript vorhanden) manuelle Generierung
```

### Tests

- **Unit/Integration** (Vitest) nutzen eine Testdatenbank `golf_in_hude_test`:
  ```bash
  createdb golf_in_hude_test
  DATABASE_URL=postgresql://localhost:5432/golf_in_hude_test npx prisma migrate deploy
  npm run test
  ```
- **E2E** (Playwright) nutzen `golf_in_hude_e2e` und bauen/starten die App automatisch:
  ```bash
  npx playwright install chromium
  npm run test:e2e
  ```

---

## Datenquellen (PC-CADDIE)

Primärquelle ist der öffentliche PC-CADDIE-Turnierkalender:

- **HTML** (reichste Daten): Titel, Platz, echte Startzeit, Löcher, Teilnehmer max.,
  freie Online-Plätze, Handicap-Relevanz, stabile Turnier-IDs.
- **ICS-Export** (offiziell): robuster Fallback für Datum/Zeit.

Die Architektur ist über das Interface `GolfDataProvider` **erweiterbar**
(`src/lib/providers/`): `PccaddieHtmlProvider`, `PccaddieIcsProvider`,
`ManualImportProvider`, `CampoProvider` (Platzhalter). Wenn keine automatische
Quelle verfügbar ist, funktioniert der **manuelle Import** vollständig.

> Wichtig: „TN" (Teilnehmerschätzung) ist **keine** exakte Quellangabe, sondern ein
> Vorschlag `max − frei online`, klar als „ca. N" markiert. Der Betreiber prüft und
> korrigiert vor der Veröffentlichung.

Automatische Läufe erzeugen **immer nur Entwürfe** (`DRAFT`) und veröffentlichen nie
selbstständig.

---

## Statusmodell

```
DRAFT → REVIEW → PUBLISHED → ARCHIVED
```
- Veröffentlichung nur durch bewusste Admin-Aktion (Bestätigungsdialog).
- Rücknahme: `PUBLISHED → REVIEW`. Öffentlich sichtbar sind ausschließlich `PUBLISHED`.

---

## Deployment auf Netlify

1. Repository mit Netlify verbinden (Build-Command/Publish stehen in `netlify.toml`).
2. PostgreSQL bereitstellen (z. B. **Neon**) und `DATABASE_URL` setzen.
3. Umgebungsvariablen in Netlify setzen (siehe `.env.example`), zusätzlich:
   - `STORAGE_DRIVER=netlify-blobs`
   - Alle Secrets (`ADMIN_SETUP_KEY`, `SESSION_SECRET`, `CRON_SECRET`).
4. Erstes Deploy. Danach **Migrationen** gegen die Produktions-DB ausführen:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```
5. `/admin/setup` einmalig aufrufen und Admin anlegen.

### Scheduler

Die geplante Funktion `netlify/functions/scheduled-generate.ts` läuft täglich
(`0 5 * * *` UTC) und ruft den geschützten Endpoint `POST /api/cron/generate`
(Header `x-cron-secret: $CRON_SECRET`). Sie erzeugt die aktuelle und die nächsten
Wochen als **Entwurf**.

Manuell/extern auslösbar:
```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" https://<domain>/api/cron/generate
```

Ohne Cron-Unterstützung: einen externen Cron-Dienst (z. B. cron-job.org) den obigen
Endpoint aufrufen lassen.

---

## Speicher & Backup

- **PDFs**: `local` (Ordner `LOCAL_STORAGE_DIR`) oder `netlify-blobs`. Storage-Keys sind
  gegen Path-Traversal abgesichert.
- **Backup**: regelmäßiges `pg_dump` der Datenbank; PDFs sind reproduzierbar aus den
  Daten (Button „PDF neu erzeugen").
- **Wiederherstellung**: DB aus `pg_dump` einspielen, danach ggf. PDFs neu erzeugen.

---

## Sicherheit (Kurzüberblick)

- Argon2id-Passwörter, serverseitige Sessions, HttpOnly/Secure/SameSite-Cookies.
- Login-Rate-Limiting (DB-basiert), generische Fehlermeldungen.
- Alle Admin-Routen serverseitig geschützt; Entwürfe/PDFs von Entwürfen nur mit Session.
- Zod-Validierung, Prisma (SQL-Injection-Schutz), React (XSS), Server Actions (CSRF).
- Keine Secrets im Client; `.env` niemals committen.

---

## Projektstruktur (Auszug)

```
src/
  app/(public)/        Öffentliche Seiten
  app/admin/           Login, Setup, geschützter Adminbereich, Server Actions
  app/api/pdf|cron/    PDF-Auslieferung, geschützter Generierungs-Endpoint
  components/          UI-, Brand-, Plan- und Admin-Komponenten
  lib/auth/            Passwort, Sessions, Rate-Limit, Setup, Guard
  lib/providers/       PC-CADDIE (HTML/ICS), manuell, Campo, Registry
  lib/plan/            Generierung, Status, Validierung, Service, Labels
  lib/pdf/             Wochenplan-Dokument (React-PDF), Rendering, Storage
  lib/week/            ISO-Kalenderwochen (Europe/Berlin)
prisma/                Schema, Migrationen, Seed
tests/                 unit/, integration/, e2e/
netlify/functions/     Scheduled Function
```

---

## Bekannte Einschränkungen

- **Campo** ist als Provider vorbereitet, aber nicht angebunden (keine dokumentierte
  zulässige öffentliche Schnittstelle). Die App funktioniert vollständig mit
  PC-CADDIE bzw. manuellem Import.
- Der PC-CADDIE-HTML-Kalender liefert standardmäßig den aktuellen Zeitraum. Weit in
  der Zukunft liegende Wochen ggf. manuell erfassen.
- PDFs verwenden Standard-Schriften (Helvetica) für maximale Portabilität; das
  Layout entspricht der Vorlage.
