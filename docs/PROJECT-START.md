# Project Start – Wished into Being

> Gründungsdokument nach `Entwicklungsplan/templates/base/PROJECT-START.md`. Discovery (1–6) stammt
> aus dem Konzept „Daily Isle – eine Welt, die jeden Tag wächst" (28.09.2026, @Flo); die drei
> Mechaniken des Konzepts wurden auf drei Repos verteilt – dieses Repo ist die **Community-Mechanik**.

**Aktueller Status:** `foundation-ready`
**Orchestrator / Projektverantwortung:** @Fluory · **Datum gestartet:** 2026-09-28

---

## 1. Problem und Ziel

**Problem:** Community-Kunst auf GitHub ist meist ein Wettrennen (Pixel-Wände, Pull-Request-Spam) oder braucht
Moderation rund um die Uhr. Ein täglicher Commit ist meist bedeutungslos.

**Zielgruppe:** GitHub- und Open-Source-Publikum, Pixel-Art-Fans, alle, die etwas Kleines zu einer gemeinsamen
Welt beitragen wollen – ohne Code zu schreiben.

**Nutzenversprechen:** Eine Insel, auf der alles von jemandem gewünscht wurde. Wünschen per Issue, abstimmen per
👍 – jeden Morgen wird der beliebteste passende Wunsch als Pixel-Sprite Wirklichkeit, mit Namensnennung im
Logbuch und als Co-Autor des Commits. Transparent als „AI-maintained".

**Erster Meilenstein:** Wünsche werden täglich zuverlässig und sicher erfüllt (MVP laut Konzept, Mechanik 2):
Issue-Formular, Wish-Reader, Prüfung in Code, Routine, Website.

**Erfolgskriterien:**
- [ ] 30 Tage in Folge genau ein Commit pro Tag auf `main`, kein Doppel-Commit
- [ ] Jeder erfüllte Wunsch besteht `world:check` und nennt seine Wünschende korrekt
- [ ] Kein Wunsch-Text hat je eine andere Aktion als „erfüllen / ablehnen / warten" ausgelöst (Eval-Set grün)

**Nicht-Ziele (erster Meilenstein):** Tageswelt nach eigenen Regeln (→ `one-tile-a-day`), Wetter (→ `Grow`),
Konten, Kommentare auf der Website, Tracking, Monetarisierung.

## 2. Scope und Nutzerablauf

| Rolle | Darf / braucht |
|---|---|
| Wünschende | Issue mit dem Wunsch-Formular öffnen, 👍 vergeben |
| Besucher | Website ansehen, Karte/Zeitleiste, Galerie, Logbuch |
| Routine (Claude) | Wünsche über den Wish-Reader lesen, genau einen Tag über `npm run day`, ein PR, Kommentare/Labels |
| Maintainer | Code-PRs, Regeln ändern, Review |

**Vertical Slice:** Issue „Wish: …" + 👍 → 08:59 Routine → `status` → Wish-Reader → `wishes` (Code prüft und
sortiert) → Moderation → Zeichnung + `sprite-preview` → `apply` → `verify` → PR (`Closes #n`) → CI grün →
Squash-Merge (1 Commit, Wünschende als Co-Autor) → Vercel-Deploy → Issue geschlossen mit Dank.
Fehlerfall: Regelverstoß = Exit 2/4 + nächster Wunsch/Flaschenpost; CI rot = kein Merge, Tag bleibt leer.

## 3. Reifegrad und Risiko

- **Stufe:** P0 – öffentliches Experiment (keine Konten; personenbezogen nur GitHub-Namen mit Einwilligung)
- **Sichtbarkeit:** `public` – Begründung: bewusst Open Source, die Historie ist das Werk
- **Sprache:** Code, Doku, Commits, Lore, Website englisch; Rechtstexte deutsch

| Frage | Ja/Nein | Konsequenz |
|---|---|---|
| Öffentliche Nutzer? | Ja | Recht-Add-on (Impressum, Datenschutz) |
| Login / Rollen? | Nein | – |
| Personenbezogene Daten? | Ja | GitHub-Namen der Wünschenden, Einwilligung im Formular; Datenschutz-Add-on, Datenschutzerklärung §4 |
| Persistente Datenbank? | Nein | Welt liegt in Git |
| Externe APIs? | Nein | GitHub nur über die Werkzeuge der Routine |
| LLM / Agentenfunktion? | Ja | KI-Add-on: Prompt versioniert (`ROUTINE.md`), Wish-Reader read-only, Prompt-Injection-Evals (`evals/`) |
| Öffentliche Website? | Ja | Impressum/Datenschutz, Daten per Env-Variablen |

**Aktivierte Add-ons:** KI/RAG, Recht, Datenschutz.

## 4. Technikentscheidungen

| Bereich | Entscheidung | Warum | Status |
|---|---|---|---|
| Sprache | TypeScript 6 (Engine, CLI, Website) | eine Sprache für Engine und Website; TS 7 ohne Compiler-API | gesetzt |
| Frontend | Next.js 16 App Router, statisch, MDX-Kapitel | Vorgabe des Orchestrators, statisches Vorrendern | gesetzt |
| 3D / Motion | React Three Fiber (eine persistente Canvas), GSAP + ScrollTrigger + SplitText, Lenis, View Transitions | Vorgabe des Orchestrators | gesetzt |
| Datenbank | keine – `world/world.json` in Git | jeder Commit = eine nachvollziehbare Änderung | gesetzt |
| Hosting | Vercel (Hobby) | Deploy je Merge, keine Server | gesetzt |
| CI | GitHub Actions (systemweit) | SYSTEM.md §11 | gesetzt |
| KI | Claude-Routine (Claude Code in der Cloud) + Subagent `wish-reader` | Wünsche lesen (read-only), beurteilen, zeichnen, Lore | gesetzt |

**Offene Entscheidungen aus dem Konzept – als Default entschieden, änderbar:**
Name englisch („Wished into Being", Repo-Name) · Thema Insel bei Nacht · Stil Pixel-Art 16 × 16 (README) +
Voxel-Figuren in 3D (Website) · Raster 64 × 64, das Meer hebt 2 Felder pro Morgen · Abstimmung per 👍 (mind. 1,
bei Gleichstand der ältere Wunsch) · persönlicher Account `Fluory` · Uhrzeit 08:59.

## 5. Sicherheit, Daten und Betrieb

- Keine Secrets im Repo; Impressumsdaten nur als Vercel-Umgebungsvariablen.
- `.claude/settings.json` mit Read-Sperren, Wächter-Hooks, Auto Memory aus.
- Betrieb: kein Server; Rollback = `git revert` des Tages-Commits (neuer Commit, Historie bleibt).

## 6. Planung und Arbeitsfluss

Board `Inbox → Ready → In Progress → In Review → Done`; Labels aus `.github/labels.json`
(Workflow `Labels`). Merge nach Risikomatrix SYSTEM.md §5; Ausnahme: Tages-PR der Routine (Register).

## 7. Setup-Freigabe

- [x] Problem, Ziel und Nicht-Ziele verstanden – aus dem Konzept
- [x] Vertical Slice festgelegt
- [x] Stufe und Risikoprofil entschieden (P0, KI + Recht + Datenschutz)
- [x] Sichtbarkeit entschieden (public)
- [x] Tech-Stack entschieden (Vorgabe im Auftrag)
- [x] Budget: 0 € (GitHub Free, Vercel Hobby, vorhandenes Claude-Abo)
- [x] Orchestrator gibt Setup frei – Auftrag „Setze die 3 Ideen um" vom 2026-09-28

**Freigabe durch:** @Fluory · **Datum:** 2026-09-28
