# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**The ИХС panel** (working repo name `ss-panel`, github.com/garunovm/ss-panel, private): a Laravel
back office, the **main panel of the FD / ИХС / RUSFAS ecosystem** (facts 2026-11-17). It is the
source of truth for specialists, courses and their runs, clinics and appointment slots, and later
for listeners, documents and certificates. The three Bitrix sites (surgeryschool.ru, footdoctor.ru,
rusfas.org) are showcases that read from it and send visitors' actions to it through the API.

**State as of 2026-11-23: plans and a demo-pilot of mockups (`mockups/index.html`), no code.** No build, lint or test commands yet. Add them here
when the Laravel app appears. The code layout and tooling follow FD's Task CRM
(`../../../footdoctor/crm/repo`, Laravel 13, PHP 8.5, Docker + Traefik); read its `CLAUDE.md` before
creating the app.

## Folders

This repo is `surgeryschool\panel\repo\` (sessions open here). Next to it, **never in git**:

- `../private/`: `.env` files, dumps, KeePass, exports with personal data. Never open or print secrets.
- `../archive/`: old material, if any appears.

The ИХС site repo is `../../repo` (garunovm/surgeryschool). Its `plans/site.plans.md` and the cabinet
mockups (`mockups/pages/personal*.html`, `appointment.html`) show what the site expects from the panel.
The ecosystem strategy is in `C:\Users\gmr\Desktop\web dev\Main Platform\workspace\facts.md`: read
the lines tagged ИХС before planning. Later lines override earlier ones.

## Architecture decisions (details in `plans/`)

- **One Laravel app, one database, sections on subdomains** (2026-11-19): `admin.*` (staff),
  `doctor.*` (doctors and assistants), `api.*` (exchange with the sites); later `clinic.*` (clinics'
  own cabinet). Traefik routes all hosts to the same container; each host has its own routes
  (`Route::domain`), guard and session cookie, and its own access rules in Traefik (e.g. `admin.*`
  only from allowed IPs, rate limits on `api.*`). See `plans/panel.plans.md`.
- **One repo, sections as inner folders** (2026-11-19): `app/Admin`, `app/Doctor`, `app/Api`, later
  `app/Clinic`; shared models and logic in `app/Domain`. A section never reaches into another
  section's folder, only into `Domain`. To scale, the same code runs as a separate container per
  section on the server (e.g. several `api` replicas); no separate repos.
- **Specialist card ≠ user account.** The card (common ID, published per site) may exist without an
  account; the admin creates accounts and links them. Doctors edit their own card; assistants are
  linked to doctors and keep their slots. Edits to published data go through a confirmation queue
  for the manager. See `plans/specialists.plans.md`.
- **Access rules are mandatory and tested** (2026-11-19, `plans/access.plans.md`): a doctor reads and
  edits only their own card and only the fields the admin allowed; no access to the technical part.
  The admin manages both the technical side and the card schema (adds card properties). Checks live
  on the server (Laravel policies, per action and per field) and `app/Doctor` reaches data only
  through `app/Domain` services; tests cover «no other card, no forbidden field, no cross-section code».
- **The API sees only exchange data**: the `api` container uses its own MySQL user with grants only on
  the `exchange_*` tables/views and inserting appointment requests. Participant lists, documents,
  accounts and everything else are invisible to it. Plus per-site keys with scopes and the network
  rules above.
- **WebSocket only in `admin.*`**: several staff work at once (ФИС ФРДО lists, programmes, specialist
  cards) — presence, live updates, protection from overwriting each other's edits.
- **Clinics directory is one for the whole ecosystem**, kept by the manager; slots are per doctor per
  clinic and are set by the assistant directly. See `plans/clinics.plans.md`.
- **The call centre is not changed**: an appointment request from the site still goes to the call
  centre's e-mail; the panel stores the same request and the slot in parallel.
- **API**: the panel is the source of truth, sites are showcases; the site-side client is the Bitrix
  module `gmr.ecosystem`. See `plans/api.plans.md`.
- **No medical data** anywhere: only contacts and time (facts 2026-11-03).
- Personal data: the panel works on behalf of each operator (FD, RUSFAS, ИХС) under commissioning
  agreements, which the user handles with the lawyer (facts 2026-11-17).

## Workflow

- **Agree each stage before acting**: describe what it does and wait for the answer.
- **Edit a decision where it is written** (facts 2026-11-23): a decision lives in its topic plan
  (`plans/panel.plans.md`, `students`, `courses`, `specialists`, `clinics`, `access`, `api`); change it there in the same commit, striking the old wording through with the date:
  `~~old~~ → new (YYYY-MM-DD)`. There is no overview file. Next steps live only in `next.plans.md`.
  Plans are in Russian.
- **Meetings** (facts 2026-11-23): one protocol per meeting in `meetings/` (`ГГГГ-ММ-ДД-кто.md`, template
  `meetings/_шаблон.md`); open it before the meeting with questions from the plans; afterwards move the
  decisions into the topic plans in the same commit. The protocol is history, not a source of decisions.
- **Tasks and edits come on the form** from `Main Platform\workspace\forms.md` (facts 2026-11-21); an
  incomplete form is returned with the empty fields marked.
- **On «сегодня всё»** run the session-close check (facts 2026-11-23).
- **Commit and push only when the user asks.**
- **The user runs every server command.** Never ask for or print passwords or keys.
- Personal data (dumps, exports, lists, logs) never goes into git.
- When a decision here fits other projects (e.g. «one app, sections on subdomains» for the RF panel),
  suggest moving it to the platform docs, with the date and this project as the source.
- Answer the user in Russian.
