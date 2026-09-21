# Deployment-Anleitung: Golf in Hude Wochenplan (Netlify + Neon)

Diese Anleitung bringt die Website live. Reihenfolge einhalten. Alles, was du
brauchst, sind ein **GitHub-**, ein **Neon-** und ein **Netlify-Konto** (alle kostenlos).

> Die drei Produktions-Secrets (`ADMIN_SETUP_KEY`, `SESSION_SECRET`, `CRON_SECRET`)
> habe ich dir bereits erzeugt – du findest sie in unserem Chat. Du kannst sie auch
> jederzeit selbst neu erzeugen mit: `openssl rand -hex 32`.

---

## Schritt 1 – Datenbank bei Neon anlegen

1. Auf <https://neon.tech> registrieren, neues Projekt erstellen (Region **EU**, z. B. Frankfurt).
2. In den Projekt-Einstellungen den **Connection String** kopieren (Format:
   `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/dbname?sslmode=require`).
3. Diesen String für später als `DATABASE_URL` merken.

---

## Schritt 2 – Code zu GitHub

Das Git-Repository ist bereits initialisiert und committet. Jetzt zu GitHub schieben:

1. Auf <https://github.com/new> ein **leeres** Repository anlegen (z. B. `golf-in-hude-wochenplan`),
   **ohne** README/Lizenz.
2. Im Projektordner die Remote hinzufügen und pushen (URL anpassen):
   ```bash
   git remote add origin https://github.com/<DEIN-NAME>/golf-in-hude-wochenplan.git
   git push -u origin main
   ```

---

## Schritt 3 – Netlify-Projekt erstellen

1. Auf <https://app.netlify.com> → **Add new site → Import an existing project** → GitHub → dein Repo.
2. Build-Einstellungen werden aus `netlify.toml` übernommen (Build `npm run build`, Publish `.next`,
   Next.js-Plugin). Nichts ändern.
3. **Noch nicht deployen** – zuerst die Umgebungsvariablen setzen (Schritt 4).

---

## Schritt 4 – Umgebungsvariablen in Netlify

**Site configuration → Environment variables** → folgende Werte anlegen:

| Variable | Wert |
|---|---|
| `DATABASE_URL` | Neon-Connection-String aus Schritt 1 |
| `ADMIN_SETUP_KEY` | (aus dem Chat) |
| `SESSION_SECRET` | (aus dem Chat) |
| `CRON_SECRET` | (aus dem Chat) |
| `STORAGE_DRIVER` | `netlify-blobs` |
| `APP_TIMEZONE` | `Europe/Berlin` |
| `NEXT_PUBLIC_SITE_URL` | deine Netlify-URL, z. B. `https://golf-in-hude.netlify.app` |
| `PCCADDIE_CALENDAR_URL` | `https://www.pccaddie.net/clubs/0493369/app.php?cat=ts_calendar` |
| `PCCADDIE_ICS_URL` | `https://www.golfcloud.com/clubs/0493369/app.php?cat=ts_calendar&sub=ics&openext=yes` |

> `NEXT_PUBLIC_SITE_URL` nach dem ersten Deploy ggf. auf die endgültige Domain anpassen
> (z. B. wenn du eine eigene Domain wie `wochenplan.golfinhude.de` verbindest).

Danach **Deploy** starten.

---

## Schritt 5 – Datenbank migrieren

**Automatisch:** Die Tabellen werden bei jedem Netlify-Deploy angelegt/aktualisiert
(`prisma migrate deploy` ist Teil des Build-Commands). Es ist **kein** manueller
Schritt nötig – vorausgesetzt `DATABASE_URL` ist in Netlify gesetzt (Schritt 4).

> Falls du es doch einmal manuell (z. B. vom PC) machen willst:
> `DATABASE_URL="<NEON-STRING>" npx prisma migrate deploy`

---

## Schritt 6 – Administrator einrichten

1. `https://<deine-domain>/admin/setup` öffnen.
2. Deine E-Mail, ein sicheres Passwort und den **`ADMIN_SETUP_KEY`** eingeben.
3. Nach dem Anlegen ist die Setup-Seite dauerhaft gesperrt.

---

## Schritt 7 – Ersten Wochenplan veröffentlichen

1. Unter `/admin/dashboard` **„Wochenplan jetzt erstellen"** (Jahr/KW wählen).
2. Termine prüfen/korrigieren (v. a. **TN** und **Spielart**).
3. **Veröffentlichen** → der Plan erscheint öffentlich auf der Startseite und als PDF.

---

## Automatische Generierung (Scheduler)

Die Netlify Scheduled Function `scheduled-generate` läuft täglich **05:00 UTC** und
legt die aktuelle + nächsten Wochen als **Entwurf** an (nie automatisch veröffentlicht).
Sichtbar unter Netlify → **Functions**. Manuell testen:

```bash
curl -X POST -H "x-cron-secret: <CRON_SECRET>" https://<deine-domain>/api/cron/generate
```

---

## Eigene Domain (optional)

Netlify → **Domain management** → Domain hinzufügen (z. B. Subdomain
`wochenplan.golfinhude.de` per CNAME auf Netlify zeigen). Danach `NEXT_PUBLIC_SITE_URL`
auf die neue Domain setzen und neu deployen.

---

## Updates ausrollen

Jede Änderung nach `git push` auf `main` löst automatisch ein neues Netlify-Deploy aus.
Bei Schema-Änderungen zusätzlich `npx prisma migrate deploy` gegen die Neon-DB ausführen.

---

## Backup

- **Datenbank**: Neon bietet automatische Backups/Branching; zusätzlich regelmäßig
  `pg_dump "<NEON-STRING>" > backup.sql`.
- **PDFs**: liegen in Netlify Blobs und sind jederzeit über „PDF neu erzeugen"
  reproduzierbar.
