# Abschlussbericht – Golf in Hude Wochenplan-Plattform

## 1. Überblick

Eine vollständige, produktionsnahe Webanwendung, die aus den Turnier-/Veranstaltungs-
daten des Golfclubs Hude wöchentliche **Wochenpläne** erzeugt, als **PDF** bereitstellt
und – **erst nach manueller Freigabe** – öffentlich anzeigt. Öffentlicher Bereich ohne
Login; geschützter Admin-Bereich für den Betreiber.

## 2. Implementierte Funktionen

**Öffentlich (ohne Login)**
- Startseite mit aktueller veröffentlichter Kalenderwoche (oder professionellem Leerzustand)
- Übersicht aller veröffentlichten Wochen + Kalenderwochen-Auswahl
- Detailansicht je Woche (responsive Tabelle Mo–So)
- PDF öffnen / herunterladen / drucken
- Nur `PUBLISHED`-Pläne sichtbar; Entwürfe liefern 404

**Administration (geschützt)**
- Sichere Ersteinrichtung genau eines Admins über Setup-Key, danach dauerhaft gesperrt
- Login/Logout, serverseitige Sessions, Login-Rate-Limiting
- Dashboard: Statuszähler, aktuelle KW, letzte Importläufe/Fehler, Quellenstatus
- „Wochenplan jetzt erstellen" (Jahr/KW) – erzeugt Entwurf aus PC-CADDIE
- Wochenplanverwaltung: Filter (Status), öffnen, Vorschau, neu generieren, PDF neu erzeugen
- Termine hinzufügen/bearbeiten/löschen (mit Unterscheidung importiert/bearbeitet)
- Statusfluss `DRAFT → REVIEW → PUBLISHED → ARCHIVED` mit Bestätigungsdialog
- Veröffentlichen / Veröffentlichung zurücknehmen / archivieren / löschen

**Datenquellen & Logik**
- Austauschbare Provider-Architektur (`GolfDataProvider`)
- PC-CADDIE HTML-Parser (Titel, Platz, echte Startzeit, Löcher, Teilnehmer max.,
  freie Online-Plätze, Handicap-Relevanz, stabile IDs) + ICS-Fallback
- Manueller Import als vollwertiger Fallback; Campo als vorbereiteter Platzhalter
- ISO-Kalenderwochen (Mo–So, Europe/Berlin) inkl. Jahreswechsel/53-Wochen-Jahre
- Duplikaterkennung, Idempotenz (mehrfacher Import → keine Duplikate)
- Validierung mit verständlichen Warnungen (fehlende TN/Spielart, Überschneidungen)
- Reproduzierbare A4-PDF im Vorlagen-Design (Logo, Legende, „Änderungen vorbehalten!")
- Automatische Generierung nur als **Entwurf** (nie automatische Veröffentlichung)

## 3. Architektur / Tech-Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · PostgreSQL + Prisma ·
Zod · Argon2id · @react-pdf/renderer · cheerio · node-ical · Netlify (Runtime +
Scheduled Functions + Blobs). Saubere Trennung: öffentliches Frontend, Admin, Auth,
DB, Datenimport, Validierung, Wochenplanlogik, PDF, Storage, Scheduler, Logging.

## 4. Datenquellen-Status

- **PC-CADDIE HTML**: aktiv, live verifiziert (echte KW aus dem Clubkalender importiert).
- **PC-CADDIE ICS**: aktiv als Fallback/Cross-Check.
- **Manuell**: aktiv.
- **Campo**: bewusst nicht angebunden (keine zulässige öffentliche Schnittstelle) –
  dokumentierte Einschränkung, App voll funktionsfähig ohne.

## 5. Test- & Build-Status

- **Unit/Integration (Vitest): 40/40 grün** (ISO-Wochen, HTML-/ICS-Parser, Dedupe,
  Status/Validierung, Generierung inkl. Idempotenz & Edit-Schutz, Auth/Setup/Rate-Limit,
  PDF-Rendering inkl. Grenzfälle, Storage).
- **E2E (Playwright, Desktop + Mobile): 18/18 grün** (öffentlicher Zugang, Leerzustand,
  Entwürfe unsichtbar/404, Admin-Schutz per Redirect, Login gut/schlecht, Setup-Sperre,
  Veröffentlichen → öffentlich sichtbar → PDF abrufbar → Rücknahme → verborgen, Mobile).
- **Produktions-Build (`next build`): erfolgreich**, Typprüfung fehlerfrei.
- Manuell end-to-end im Browser verifiziert (Setup → Login → Live-Import → Veröffentlichen
  → öffentliche Ansicht → PDF).

## 6. Sicherheitsstatus

Argon2id-Passwörter; serverseitige, widerrufbare Sessions; HttpOnly/Secure/SameSite-
Cookies; DB-basiertes Login-Rate-Limiting; alle Admin-Routen serverseitig geschützt;
Entwürfe/Entwurf-PDFs nur mit Session; Zod-Validierung; Prisma (SQL-Injection-Schutz);
React-Escaping (XSS); Server Actions (CSRF); Path-Traversal-Schutz im Storage; keine
Secrets im Client; `.env.example` ohne echte Werte.

## 7. Erforderliche Umgebungsvariablen

`DATABASE_URL`, `ADMIN_SETUP_KEY`, `SESSION_SECRET`, `APP_TIMEZONE`, `STORAGE_DRIVER`,
`LOCAL_STORAGE_DIR`, `PCCADDIE_CALENDAR_URL`, `PCCADDIE_ICS_URL`, `CRON_SECRET`,
`NEXT_PUBLIC_SITE_URL` (Details in `.env.example`).

## 8. Start- & Deployment-Anleitung

Siehe [README.md](../README.md): lokale Einrichtung, DB/Migrationen, Ersteinrichtung,
Tests, Netlify-Deployment (Neon-DB, Netlify Blobs, Scheduled Function), Backup/Restore.

## 9. Offene Einschränkungen / manuelle Schritte

- Campo nicht angebunden (s. o.).
- PC-CADDIE liefert v. a. den aktuellen Zeitraum; sehr weit in der Zukunft liegende
  Wochen ggf. manuell erfassen.
- PDFs nutzen Standard-Schriften (Helvetica) für maximale Portabilität.
- **Manuelle Schritte beim Go-Live:** Neon-DB anlegen + `prisma migrate deploy`,
  Umgebungsvariablen/Secrets in Netlify setzen, einmalig `/admin/setup` durchführen.
- Hinweis: Das Projektverzeichnis liegt in iCloud Drive; für zügige Builds/Tests wird
  ein Verzeichnis außerhalb von iCloud empfohlen.
