# Light of Hope — Admin Functions & Roadmap

**Purpose:** Living technical plan for admin/client features. Expand this file whenever new ideas come up.  
**Last updated:** 2026-05-24  
**Scope:** LOH `online-platform` only — **do not** change fa-gretzinger Supabase, repo, or Vercel project.

**Related docs:**
- `instructions.md` — long-term therapy-platform MVP (broader vision)
- `SETUP-STATUS.md` — Git, SSH, Vercel, MCP handoff

**Dev workflow (local):** After `git push`, restart dev on port 3000 (`npm run dev:clean:win` from `web/`) — do not leave `next dev` running during `npm run build` (corrupts `.next` → localhost 500).

---

## 1. Design principles

| Principle | Detail |
|-----------|--------|
| **Do not break existing flows** | Video upload/edit admin (`/admin/videos`) stays as-is. Sequential unlock (video N+1 after N completed) remains the base rule. |
| **Schedule layers on top** | A video can be *sequentially* eligible but still *time-locked* until `unlock_at`. Show German unlock hint when locked. |
| **Server-side truth** | Unlock decisions must be computed on the server (RPC or shared lib), not only in client React — same result for web, admin, and future apps. |
| **Per-user overrides** | Admin can set exact unlock date/time per user per video; existing users can be adjusted retroactively. |
| **Defaults for new users** | On registration, auto-apply platform default schedule (no manual setup per user). |
| **Scalable admin UX** | User detail = tile dashboard; each tile links to a feature area. More tiles later without restructuring routes. |
| **Locale** | All displayed dates/times: German **24-hour** format, e.g. `30.05.2026 - 12:00` (`de-DE`, `hour: '2-digit', minute: '2-digit'`). |
| **Icons** | Vector icons only (existing `Icons.tsx`), glassmorphic white borders — match current admin UI (see Nutzer screenshot). |
| **Supabase** | LOH project only: `tovojkwejkoysgygogfl` / MCP `loh-onlineplattform`. |

---

## 2. Current state (baseline)

### 2.1 What works today

| Area | Implementation |
|------|----------------|
| Admin users list | `/admin/users` — table with email, role, overall video %, dates |
| User links | Rows link to `/admin/users/[slug]` |
| User detail page | `/admin/users/[slug]/page.tsx` — **basic** profile card; TODO for tiles |
| Sequential unlock | `courses/[slug]/page.tsx` — `getUnlockMap()`: video 0 always open; video i open if `i <= lastCompletedIndex + 1` |
| Video progress | `video_progress` table; `useVideoProgress` hook |
| Admin video CMS | `/admin/videos` — Bunny upload, chapters, positions (unchanged) |
| Client settings nav | **Not wired** — `Einstellungen` → `href: "#"` in `AppShell.tsx` |

### 2.2 Known issues to fix first (Phase 0)

| Issue | Notes |
|-------|--------|
| **User detail 404** | Old slug used last 3 chars of UUID → ambiguous. **Fix:** unique **`client_id`** (Nutzer-ID) per profile. |
| **No scheduled unlock** | Only sequential logic; no DB fields for unlock times. (Phase 1+) |
| **Profile fields missing** | `date_of_birth`, address — Phase 1+. `client_id` added in Phase 0. |
| **Client settings** | `Einstellungen` → `#` — Phase 3; show read-only Nutzer-ID there. |

---

## 3. Feature summary (your ideas → product)

### 3.1 Video unlock scheduling (core)

**Goal:** Admin controls *when* each video becomes available per client, while keeping sequential progression.

**Combined unlock rule (target behaviour):**

```
canWatch(user, video) =
  sequentialEligible(user, video)   // existing: prev video completed (≥95% or completed_at)
  AND scheduleEligible(user, video) // new: now >= unlock_at (or no schedule row = inherit default)
  AND NOT accessRevoked(user)
```

**When locked by schedule**, show (German):

> Freigeschaltet ab **30.05.2026 - 12:00**

(Use `Freigeschaltet ab` consistently; adjust copy if you prefer `Verfügbar ab`.)

**When locked by sequence only** (schedule already passed), keep existing copy:

> Wird freigeschaltet, sobald das vorherige Video abgeschlossen ist.

**Admin can lock a video** with a future `unlock_at` — date/time visible immediately in admin UI after save.

### 3.2 Default platform settings (auto for new users)

| Rule | Value |
|------|--------|
| Videos 1–3 | No extra time lock beyond sequential (or: available from registration — confirm in Phase 1) |
| From video 4 onward | First scheduled unlock = **registration + 7 days** |
| Each further video | **+3 days** after previous video’s scheduled unlock (cumulative calendar) |

*Example:* User registers 01.05.2026 → video 4 unlocks 08.05.2026, video 5 → 11.05.2026, video 6 → 14.05.2026, etc.

Store defaults in DB so admin can change platform policy later without code deploy.

### 3.3 Per-user admin controls

On **Video Progress & Unlocking** (per user):

- List all videos in course order (chapter.position + video.position)
- Per video: **watch %**, **completed_at**, **unlock_at** (editable), **status** (locked / sequential-wait / available / completed)
- Bulk actions later: “Apply defaults”, “Shift all by X days” (backlog)
- Works for **long-existing users** — admin edits override stored schedule

### 3.4 User detail dashboard (tile hub)

**Route:** `/admin/users/[slug]` (fix slug in Phase 0)

**Layout:** Responsive grid of glassmorphic tiles (icon + label + short description), same visual language as sidebar.

#### Initial tiles (Phase 2–3)

| Tile | Icon (vector) | Route / action | Status |
|------|---------------|----------------|--------|
| **Video-Fortschritt & Freischaltung** | Video / play | `/admin/users/[slug]/videos` | Done (2b) |
| **Informationen** | Info + person | `/admin/users/[slug]/info` or inline modal | Planned |
| **Chat / Nachrichten** | Two speech bubbles | Placeholder — disabled or “Coming soon” | Placeholder |

#### Information tile — fields

| Field | Source | Notes |
|-------|--------|-------|
| Last login | `auth.users.last_sign_in_at` | German datetime |
| First / last name | `profiles` | |
| Date of birth | `profiles.date_of_birth` | **New column** |
| Registration date | `profiles.created_at` | |
| Street + house number | `profiles.street`, `profiles.house_number` | **New columns** — optional for now; user said expand later |

**Dependency:** Client **Einstellungen** (`/settings`) must allow patients to edit profile fields so admin tile is populated.

### 3.5 Client settings (patient)

| Item | Detail |
|------|--------|
| Route | `/settings` (new), link from `AppShell` + `FabSettings` |
| Fields | first_name, last_name, date_of_birth, street, house_number (street optional until spec complete) |
| Auth | Logged-in client only; RLS: update own `profiles` row |
| Later | Move into proper registration onboarding |

### 3.6 Tiered unlock defaults (global → category → user)

**Goal:** Admin controls the **default unlock sequence** not only for all new users, but per **client category (Stufe 0–5)** and still per **individual Nutzer-ID** (Phase 2b).

**Client levels**

| Field | Type | Notes |
|-------|------|-------|
| `profiles.access_level` | int 0–5 | Default `0`; admin assigns on user detail or bulk later |
| Label in UI | „Stufe“ / „Zugangsstufe“ | e.g. Stufe 0 = Standard, Stufe 1 = Intensiv, … (admin-defined labels later) |

**Category defaults table (proposed — Phase 3 migration)**

`platform_unlock_defaults_by_level`:

| Column | Type | Notes |
|--------|------|-------|
| `access_level` | int 0–5 | PK (or PK with version id) |
| `first_gated_video_position` | int | Same semantics as global |
| `first_unlock_offset_days` | int | |
| `subsequent_unlock_interval_days` | int | |
| `updated_at` / `updated_by` | timestamptz / uuid | |

**Resolution when seeding** (`seed_user_video_unlocks(user_id)`):

1. Load `profiles.access_level` for user.
2. If row exists in `platform_unlock_defaults_by_level` for that level → use it.
3. Else → use singleton `platform_unlock_defaults` (global).
4. Insert/replace `user_video_unlocks` rows with `source = 'default'`.
5. **Never** delete rows with `source = 'manual'` (admin per-video edits from 2b).

**Admin UI (Phase 3)**

- **Videokurseinstellungen:** tabs „Alle Klienten“ | „Stufe 0“ … „Stufe 5“ — same fields as today’s global defaults.
- **User detail:** dropdown Stufe 0–5; optional „Kategorie-Zeitplan anwenden“ (re-seed from level defaults, keep manual rows).
- **Per-user videos (2b):** unchanged; highest priority for explicit `unlock_at`.

**Not in Phase 2c:** DB column `access_level` and level table — document only; implement in Phase 3.

---

### 3.7 Backlog tiles (not in first build)

- Chat / messages (real implementation)
- Workbooks, sessions, therapist assignment (see `instructions.md` MVP)
- Reports, calendar, Stripe — out of scope here

---

## 4. Data model (proposed)

> All migrations on **LOH Supabase only**. Review RLS before deploy.

### 4.1 `platform_unlock_defaults` (singleton or versioned row)

Global policy for **new** registrations.

| Column | Type | Example |
|--------|------|---------|
| `id` | uuid | PK |
| `first_gated_video_position` | int | `4` (1-based index in global video order) |
| `first_unlock_offset_days` | int | `7` (from registration) |
| `subsequent_unlock_interval_days` | int | `3` |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | admin user_id |

### 4.2 `user_video_unlocks` (per user, per video)

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | FK → profiles |
| `video_id` | uuid | FK → videos |
| `unlock_at` | timestamptz | When schedule allows access |
| `source` | enum | `default` \| `manual` \| `override` |
| `created_at` / `updated_at` | timestamptz | |
| **PK** | | `(user_id, video_id)` |

**Generation:**
- **On registration** (or first login as client): RPC `seed_user_video_unlocks(user_id)` reads defaults + published video list, inserts rows for videos at position ≥ `first_gated_video_position`.
- **Admin edit:** upsert `unlock_at`, set `source = manual`.

### 4.3 `profiles` extensions

| Column | Type | Nullable |
|--------|------|----------|
| `date_of_birth` | date | yes |
| `street` | text | yes |
| `house_number` | text | yes |
| `client_id` | text | unique Nutzer-ID — see §6 |

Optional: `registration_scheduled_at` on `clients` if distinct from profile `created_at`.

### 4.4 `audit_logs` (recommended)

Log admin changes to `unlock_at` and profile fields (aligns with `instructions.md`).

### 4.5 RLS sketch

| Table | Patient | Admin |
|-------|---------|-------|
| `user_video_unlocks` | SELECT own rows only | Full via service role / admin RPC |
| `platform_unlock_defaults` | SELECT (read-only) or none | Admin write |
| `profiles` | UPDATE own non-role fields | Admin read all |

---

## 5. Unlock resolver (shared logic)

**Module:** `src/lib/videoUnlock.ts` (or Supabase RPC `get_user_video_access`)

**Inputs:** `userId`, ordered `videos[]`, `video_progress[]`, `user_video_unlocks[]`

**Output per video:**

```ts
type VideoAccessState =
  | { status: 'available' }
  | { status: 'locked_sequence'; message: string }
  | { status: 'locked_schedule'; unlockAt: string; message: string } // formatted de-DE
  | { status: 'completed' };
```

**Used by:**
- Client course list (`/courses/[slug]`)
- Client video page gate
- Admin user video management screen

**Do not duplicate** unlock logic in `VideoManager.tsx` or only in client hooks.

---

## 6. Nutzer-ID (`client_id`) — confirmed spec

**Label in UI:** Nutzer-ID (German). Stored in `profiles.client_id`, unique, lowercase in URLs.

### 6.1 Format (9 characters)

```
/01angr001
 │││└─── SSS  sequence 001–999 within batch
 ││└──── gr   first two letters of surname (Andreas → an, Gretzinger → gr)
 │└───── an   first two letters of first name
 └────── 01   batch 01–99 (999 users per batch, then 02, …)
```

**Capacity:** 99 batches × 999 users = **98.901** unique IDs.

**Example (first client):** Andreas Gretzinger → `01angr001`  
**Admin URL:** `/admin/users/01angr001`

### 6.2 Generation rules (on registration)

1. Atomically increment `client_id_counter` (`batch_num`, `seq_num`).
2. When `seq_num` reaches 999, next user: `batch_num + 1`, `seq_num = 001`.
3. Build ID from registrant’s `first_name` + `last_name` (if missing at signup, use placeholder `xx` per segment until profile completed — confirm in Phase 1).
4. Store on `profiles.client_id`; never reassign.

### 6.3 Counter table

`client_id_counter` (singleton row `id = 1`):

| Column | Meaning |
|--------|---------|
| `batch_num` | Current batch (1 = `01`) |
| `seq_num` | Last assigned sequence in batch |

**Current production state (2026-05-24):** `batch_num = 1`, `seq_num = 1` after assigning `01angr001` → **next** registration gets `…002` in batch `01`.

### 6.4 Who gets a Nutzer-ID

| Role | `client_id` |
|------|-------------|
| `client` | Required (auto on registration) |
| `admin` | Optional / none (admin rows not linked from user table) |

### 6.5 Client settings (`/settings`, Phase 3)

- Show **Nutzer-ID** read-only (greyed out, not editable).
- Editable: first name, last name, date of birth, address (later).

### 6.6 Backfill

| User | Nutzer-ID | Status |
|------|-----------|--------|
| gretzinger.a@gmail.com (Andreas Gretzinger) | `01angr001` | Done in Supabase |
| info@oag-media.com (admin) | — | No client ID |

---

## 7. Routes & pages (target)

| Route | Role | Phase |
|-------|------|-------|
| `/admin/users` | Admin list (+ Nutzer-ID column) | exists / Phase 0 |
| `/admin/users/[clientId]` | Tile dashboard | Phase 0 shell |
| `/admin/users/[clientId]/videos` | Per-user unlock + progress | Phase 3 |
| `/admin/users/[clientId]/info` | Read-only profile (optional if tile inline) | Phase 3 |
| `/admin/einstellungen` | Platform default unlock policy | Phase 4 |
| `/settings` | Client profile edit | Phase 3 |
| `/admin/videos` | CMS (unchanged) | — |

---

## 8. Implementation phases (build order)

### Phase 0 — Foundation ✅ (in progress / mostly done)

- [x] Nutzer-ID: `profiles.client_id` + `client_id_counter` (LOH Supabase only)
- [x] Backfill gretzinger.a@gmail.com → `01angr001`
- [x] Admin routes: `/admin/users/[clientId]` exact lookup (no UUID suffix guessing)
- [x] `formatGermanDateTime()` + `src/lib/clientId.ts`
- [x] User list: Nutzer-ID column; clients clickable, admins not linked
- [x] Tile dashboard shell (`AdminUserTiles`) — sub-routes disabled until Phase 3
- [ ] Smoke-test `/admin/users/01angr001` locally + after deploy

**Exit:** Clicking client row opens tile dashboard at stable Nutzer-ID URL.

---

### Phase 1 — Unlock scheduling (database) ✅

- [x] Migration: `platform_unlock_defaults`, `user_video_unlocks`, profile `date_of_birth`, `street`, `house_number`
- [x] RPC `allocate_next_client_id(first_name, last_name)` + BEFORE INSERT trigger on `profiles`
- [x] RLS: clients SELECT own `user_video_unlocks`; authenticated SELECT defaults
- [x] RPC `seed_user_video_unlocks(user_id)` + AFTER INSERT trigger for `role = client`
- [x] Backfill: gretzinger → 6 rows (videos 4–9), unlocks from `profiles.created_at`
- [x] `src/lib/videoUnlock.ts` resolver (wired in Phase 2 UI)

**Exit:** DB has schedule rows for test user; no admin/course UI changes yet.

---

### Phase 2a — Client unlock UI (partial — in progress)

- [x] Wire `videoUnlock` into `/courses/[slug]` (schedule + sequential)
- [x] Block direct access on `/video/[id]` when locked
- [x] Unlock times at **10:00 Uhr** Europe/Berlin in DB seed
- [x] Display: `Freigeschaltet ab DD.MM.YYYY - HH:mm Uhr`

**Exit:** `test@web.de` sees video 4 locked with date; videos 5+ show schedule text.

---

### Phase 2b — Admin per-user video management ✅

- [x] Page `/admin/users/[clientId]/videos`
- [x] Table: video title, chapter, watch %, unlock_at (datetime picker), status badge
- [x] Save → update `user_video_unlocks` + `audit_logs`
- [x] Button: Standard-Zeitplan neu anwenden (`seed_user_video_unlocks`)

---

### Phase 2c — Client `/settings` (profile only) ✅

- [x] `/settings` — name, DOB, address; read-only Nutzer-ID
- [x] Linked from `AppShell`, `FabSettings`, home sidebar
- [x] Server action `updateClientProfile` (clients only) + optional `audit_logs`
- [ ] Not: password/email here (later / separate flow)

**Exit:** Client edits profile; admin **Informationen** tile can show populated fields (Phase 3).

---

### Phase 3 — Admin Einstellungen (tile dashboard, not one page)

Split **`/admin/einstellungen`** into **card/tile overview** (same pattern as user detail), **not** the same as client settings.

| Tile | Route (example) | Purpose |
|------|-----------------|--------|
| **Videokurseinstellungen** | `/admin/einstellungen/videos` | **Global** default unlock rules (`platform_unlock_defaults`). **Level 0–5** category defaults (see §3.7). Re-seed / preview. |
| **Nutzereinstellungen** | `/admin/einstellungen/registrierung` | Registration form: required fields, optional fields, validation. **Later:** full signup flow. |
| **Klienten-Stufen** (new) | `/admin/einstellungen/levels` | Define what levels 0–5 mean; assign default unlock policy per level. |

**Client settings (separate):** `/settings` = private data only (name, DOB, address, read-only Nutzer-ID, later email/password change). **Do not** mix with admin platform settings.

**Unlock defaults — three admin layers (see §3.7):**

| Layer | Where admin edits | Applies to |
|-------|-------------------|------------|
| **Global** | Videokurseinstellungen → „Alle Klienten“ | New registrations (unless overridden) |
| **Category (Stufe 0–5)** | Videokurseinstellungen → tab per level | Clients with `profiles.access_level = N` when (re)seeding |
| **Individual** | Videokurseinstellungen → tab **Einzelner Klient** (search) → `/admin/users/[clientId]/videos` (2b) | One Nutzer-ID; manual rows + „Standard-Zeitplan neu anwenden“ |

**Decisions (2026-05-24, Phase 3 kickoff):**

| Topic | Decision |
|-------|----------|
| Individual editor entry | **1.A** — search under Videokurseinstellungen, then open existing per-user videos page |
| Registration fields | Admin-defined fields in DB (not `ALTER TABLE` per click — see §3.8); **+** add, edit label, delete; changes immediate |
| Stufe labels | Numeric „Stufe 0“ … „Stufe 5“ |
| Re-seed | New registrations by default; **bulk** re-seed with explicit confirm; per-user re-seed unchanged (2b) |
| Scope | Full Phase 3, delivered as **3.1–3.7** (testable steps) |

**Exit (full Phase 3):** Admin changes default policy at global, category, and individual level; configures registration fields; assigns Stufe; views client info tile.

---

#### Phase 3.1 — Database (migrations + seed logic) ✅

**Build**

- [x] `profiles.access_level` int 0–5, default `0`
- [x] `platform_unlock_defaults_by_level` (PK `access_level`, same columns as global)
- [x] `registration_field_definitions` + `profile_registration_values` (see §3.8)
- [x] `resolve_unlock_defaults_for_user` + updated `seed_user_video_unlocks` (level → global; keeps `manual`)
- [x] `seed_all_clients_video_unlocks` (for Phase 3.4 bulk UI)
- [x] RLS on new tables; client read own registration values
- [x] `database.types.ts` patched
- [x] Migration file: `web/migrations/phase3_1_admin_settings_schema.sql` (applied to LOH Supabase)

**How to test (no new UI yet)**

1. Supabase → **Table Editor**: confirm new tables/columns exist.
2. SQL (or MCP): `SELECT * FROM platform_unlock_defaults;` and `SELECT * FROM platform_unlock_defaults_by_level;`
3. Pick test client `01tewe002` → run `SELECT seed_user_video_unlocks('<user_uuid>');` (or use **Standard-Zeitplan neu anwenden** on `/admin/users/01tewe002/videos` after deploy).
4. Set `profiles.access_level = 1`, insert a row in `platform_unlock_defaults_by_level` for level 1 with different offsets, re-seed → `user_video_unlocks` dates should follow level row, not global.
5. Confirm rows with `source = manual` are unchanged after re-seed.

---

#### Phase 3.2 — Einstellungen tile hub ✅

**Build**

- [x] `/admin/einstellungen` — tile grid (`AdminSettingsTiles`)
- [x] Tiles: Videokurseinstellungen, Nutzereinstellungen, Klienten-Stufen (all linked)
- [x] Stub sub-routes: `/videos`, `/registrierung`, `/levels` with back link
- [x] Admin nav: **Einstellungen** → `/admin/einstellungen` (unchanged)

**How to test**

1. Log in as admin → `/admin/einstellungen`.
2. See three tiles; each link opens the correct sub-route (stub until 3.3+).
3. On each sub-page: **← Zurück zu Einstellungen** returns to the hub.

---

#### Phase 3.3 — Videokurseinstellungen (global + Stufe 0–5) ✅

**Build**

- [x] `/admin/einstellungen/videos` — tabs: **Alle Klienten** + dynamic Stufen from `platform_access_levels`
- [x] Fields: `first_gated_video_position`, `first_unlock_offset_days`, `subsequent_unlock_interval_days`
- [x] Save global → `platform_unlock_defaults`; per Stufe → `platform_unlock_defaults_by_level` (upsert)
- [x] German help copy + audit log on save

**How to test**

1. Open **Alle Klienten** → change e.g. first gated video to `5`, save → reload → values persist.
2. Open **Stufe 2** → set different interval (e.g. `5` days), save → row in `platform_unlock_defaults_by_level` for `access_level = 2`.
3. Optional: new test user with `access_level = 2` + seed → unlock dates match Stufe 2 row.

---

#### Phase 3.4 — Re-seed actions (bulk + policy copy)

**Build**

- [ ] On Videokurseinstellungen: **„Alle Klienten neu seeden“** — confirm dialog; calls bulk RPC; keeps `manual` rows
- [ ] Help text: defaults apply to **new** users unless bulk or per-user re-seed
- [ ] Audit log entries for bulk + default saves (if not already)

**How to test**

1. Edit a test user’s video unlock manually (`source = manual`) on `/admin/users/…/videos`.
2. Run bulk re-seed → manual row unchanged; `default` rows updated.
3. New registration (or seed new user) → uses latest global/level rules.

---

#### Phase 3.5 — Videokurseinstellungen → Einzelner Klient (search)

**Build**

- [ ] Tab **Einzelner Klient**: search by Nutzer-ID, name, or email
- [ ] Result → link to `/admin/users/[clientId]/videos` (existing 2b editor)

**How to test**

1. Search `01tewe002` → land on correct user’s video/unlock table.
2. Change one `unlock_at`, save → still works as in Phase 2b.

---

#### Phase 3.6 — Nutzereinstellungen + geschlossene Registrierung ✅

**Build**

- [x] `/admin/einstellungen/registrierung` — list required/optional fields
- [x] Built-in rows (name, DOB, address, …) + **+** add custom field (label + key)
- [x] **Edit** label, toggle required, **delete** (soft-delete; system fields protected)
- [x] Persist to `registration_field_definitions` (instant; no deploy for new labels)
- [x] `platform_registration_invite` singleton + rotate RPC (migration `phase3_6_registration_invite`)
- [x] Admin hub `/admin/einstellungen` — **Registrierungscode** panel below tiles (copy + regenerate)
- [x] Public `/registrierung` — Zugangscode gate (2h cookie) + dynamic form + server signup
- [x] Code rotates **after successful signup** (option B); `seed_user_video_unlocks` via profile trigger
- [x] Login link „Registrieren“ + success banner with Nutzer-ID

**How to test**

1. Admin → Einstellungen → copy Registrierungscode.
2. Incognito → `/registrierung` → enter code → fill form → submit → redirect to login with Nutzer-ID.
3. Admin → Einstellungen → code changed; old code rejected.
4. Admin → Nutzereinstellungen → add/rename/delete custom field → appears on `/registrierung`.

*Client `/settings` reading dynamic definitions = optional follow-up.*

---

#### Phase 3.7 — Klienten-Stufen, user Stufe, Informationen tile

**Stufen model (confirmed):** Table `platform_access_levels` — admin can **rename**, **add**, and **soft-delete** levels (not fixed 0–5 only). `profiles.access_level` references `access_level` int. Dropdowns on user detail + bulk edit read from this table.

**Users list prep (shipped early)** ✅

- [x] `/admin/users` — page width **90%** of viewport (table not compressed)
- [x] Search bar (Nutzer-ID, E-Mail, Name, Stufe, Rolle)
- [x] Table grid lines (`border-white/10` / `white/[0.08]`)
- [x] Column **Stufe** (label from `platform_access_levels`)
- [x] **Mehrfache Bearbeitung** → checkboxes → bulk assign Stufe (clients only)
- [x] User detail: **Zugangsstufe** dropdown + save (`/admin/users/[slug]`)

**Build (remaining for 3.7)**

- [ ] `/admin/einstellungen/levels` — CRUD: rename labels, **+** add level, edit/delete (soft-delete if users assigned)
- [ ] Enable tile **Informationen** → `/admin/users/[slug]/info` (read-only profile + registration values)
- [ ] Warn when deleting a Stufe that still has clients assigned

**How to test (users list — now)**

1. `/admin/users` — table uses ~90% width; search filters rows.
2. **Mehrfache Bearbeitung** → select clients → assign Stufe → list updates.
3. Open a client → change **Zugangsstufe** → save → reload.

**How to test (full 3.7)**

1. Einstellungen → Klienten-Stufen: rename „Stufe 1“ → dropdowns show new label.
2. Add Stufe 6 → assign to user → re-seed uses `platform_unlock_defaults_by_level` for 6 if configured.
3. **Informationen** tile shows profile data.

---

### 3.8 Registration fields — data model (confirmed)

**Why not `ALTER TABLE profiles ADD COLUMN` from the admin UI?** PostgreSQL cannot safely add/remove columns on every „+“ click from the browser; migrations would be fragile and break deploys.

**Instead (clean + instant):**

| Table | Purpose |
|-------|---------|
| `registration_field_definitions` | Admin-defined fields: `field_key`, `label`, `required`, `sort_order`, `is_system`, `deleted_at` |
| `profile_registration_values` | Per-user answers: `(user_id, field_id, value)` |

When admin clicks **+** → `INSERT` into definitions (immediate). Edit label → `UPDATE`. Delete → soft-delete definition; optional confirm if values exist.

Built-in profile columns (`first_name`, `last_name`, `date_of_birth`, `street`, `house_number`) stay on `profiles` for Phase 3; custom fields use `profile_registration_values`. Later: signup + `/settings` read definitions dynamically.

---

### Phase 4 — Polish & QA

- [x] Timezone display: `Europe/Berlin` in `formatGermanDateTime`
- [ ] Edge cases: admin user (no schedule?), deleted videos, unpublished courses
- [ ] Regression: Bunny upload, sequential unlock, Vercel env vars
- [ ] Production smoke test on [online-platform-olive.vercel.app](https://online-platform-olive.vercel.app/)

---

## 9. UI copy (German)

| Key | Text |
|-----|------|
| Schedule lock | `Freigeschaltet ab {date} - {time} Uhr` |
| Sequence lock | `Wird freigeschaltet, sobald das vorherige Video abgeschlossen ist.` |
| Admin column | `Freischaltung` |
| Tile: videos | `Video-Fortschritt & Freischaltung` |
| Tile: info | `Informationen` |
| Tile: chat | `Chat / Nachrichten` (Demnächst) |

---

## 10. Vercel / production environment variables (LOH)

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Auth + RLS client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin, settings save, unlock editor |
| `BUNNY_STREAM_LIBRARY_ID` | Server only | Admin video upload |
| `BUNNY_STREAM_API_KEY` | Server only | Admin video upload / Bunny API |
| `NEXT_PUBLIC_BUNNY_STREAM_CDN_HOST` | Client | **Pull-zone hostname only** (e.g. `vz-f7a686f2-d74.b-cdn.net`) — playback + thumbnails |

After adding/changing env vars on Vercel: **redeploy** production (and preview if used). Local: copy same keys to `web/.env.local`.

---

## 11. Explicit non-goals (this roadmap)

- Changing fa-gretzinger project or shared MCP credentials
- Replacing sequential unlock with schedule-only (schedule **adds** to sequential)
- Rewriting `/admin/videos` upload/editor
- Full chat, therapist CRM, Stripe (see `instructions.md` phases)

---

## 12. Decisions (confirmed 2026-05-24)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Videos 1–3 | **Sequential lock only**; admin may still set optional unlock date/time per video |
| 2 | Timezone | **Always `Europe/Berlin`** (German software) |
| 3 | Admin user URLs | **Nutzer-ID** `client_id` e.g. `/admin/users/01angr001` — unique, scalable |
| 4 | Unlock in the past | Unlock immediately when sequential rule satisfied (**Yes**) |
| 5 | Video order | All published courses, chapter+position (**Yes**) |
| 6 | fa-gretzinger Supabase | **Never touch** — LOH project `tovojkwejkoysgygogfl` only |

---

## 13. Idea backlog

- **Admin Einstellungen tiles:** Videokurseinstellungen + Nutzereinstellungen (see Phase 3) — confirmed 2026-05-25
- **Tiered unlock defaults:** Global + Stufe 0–5 + per-user (§3.7) — confirmed 2026-05-25, implement Phase 3
- **Dynamic video rules:** When admin adds chapters/videos, default unlock rules should stay in sync (e.g. first video per chapter free, or recompute gated positions) — design in Phase 3+
- **Registration fields config:** Admin chooses required profile fields at signup — Phase 3 Nutzereinstellungen

### 13.1 Client dashboard — customizable quick tiles (future)

**Status:** Phase 2c+ dashboard rework ships **3 fixed tiles** (Video-Section, Sitzungsaufnahmen, Selbstcheck). Links resolve from DB (`fetchPrimaryPublishedCourse`) so course **renames/slug changes** do not break navigation.

**Future UX (patient home):**

| Feature | Detail |
|---------|--------|
| Add tile | `+` control — pick from available shortcuts (courses, recordings, selbstcheck, …) |
| Remove tile | `-` on each tile when in edit mode |
| Reorder | Pencil → drag-and-drop or move up/down |
| Persist | `profiles.dashboard_tiles` jsonb or `user_dashboard_tiles` table |
| Defaults | New users get Video-Section + placeholders until they customize |
| Max per row | **4** quick tiles — full width aligned with sections above |

**Linking rule (permanent):** Never hardcode course slugs in UI. Always resolve `courses.id` / current `slug` from Supabase at render time; fallback `/courses` list if no published course.

**Optional hardening:** Course detail route redirects to `/courses` when slug unknown (avoid blank/404 after admin slug change).

### 13.3 Admin upload — Bunny thumbnail selection (future)

**Status:** Client dashboard **Weiter schauen** uses Bunny’s current library thumbnail (`thumbnail.jpg` on the Stream CDN hostname). No extra API key on the client.

**Future (admin `/admin/videos` upload flow):**

| Feature | Detail |
|---------|--------|
| Pick thumbnail | Choose from generated stills / timeline frame (as in Bunny dashboard) |
| Custom image | Upload image file as thumbnail |
| Bunny sync | Call Bunny API `POST /library/{id}/videos/{videoId}/thumbnail` so CDN thumbnail matches admin choice |
| DB optional | Store `thumbnail_time_sec` or `bunny_thumbnail_index` on `videos` if needed for re-fetch |

**Env:** `NEXT_PUBLIC_BUNNY_STREAM_CDN_HOST` = **library pull-zone hostname only** (e.g. `vz-f7a686f2-d74.b-cdn.net`), **not** a video ID. Thumbnails: `https://{host}/{bunny_video_id}/thumbnail.jpg` (fallback `thumbnail_1.jpg`, `preview.webp`).

---

### 13.2 Mobile / responsive UX (whole platform)

**Status:** Desktop-first. Client home dashboard and several admin tables need a dedicated **smartphone pass** before public launch.

| Area | Target |
|------|--------|
| Client home | Stack 30/70 progress grid on small screens; quick tiles 1–2 columns; sidebar → existing `MobileNav` |
| Course / video | Player full-width; unlock list readable without horizontal scroll |
| Admin | User tables → cards or horizontal scroll; datetime pickers touch-friendly |
| Breakpoints | Align with Tailwind `sm` / `md` / `lg`; test iPhone + Android viewports |

**Phase:** Polish (Phase 4) or parallel track before marketing the app to patients.

---

## 14. Changelog

| Date | Change |
|------|--------|
| 2026-05-24 | Initial plan: unlock scheduling, user dashboard tiles, settings, defaults |
| 2026-05-24 | Confirmed: videos 1–3 sequential-only + optional admin dates; Europe/Berlin; Nutzer-ID spec `01angr001`; Phase 0 started (Supabase + admin routes) |
| 2026-05-24 | Phase 1 complete: unlock tables, RPCs, triggers, RLS, gretzinger backfill, `videoUnlock.ts` |
| 2026-05-25 | Client course list wired to schedule locks; 10:00 Uhr Berlin; admin Einstellungen tile concept added |
| 2026-05-25 | Phase 2b live: admin per-user unlock editor, calendar picker, Freigeschalten seit |
| 2026-05-25 | Phase 2c: client `/settings`; tiered defaults (global / Stufe 0–5 / user) spec for Phase 3 |
| 2026-05-25 | Client dashboard: Hallo Vorname, 3 quick tiles, neon-green hover, DB-resolved course links |
| 2026-05-25 | Dashboard layout: compact Gesamtfortschritt 30/70 grid; full-width quick tiles; mobile responsive backlog |
| 2026-05-24 | Phase 3.3: Videokurseinstellungen tabs + save global/level defaults |
| 2026-05-24 | Admin Überblick page translated to German |
| 2026-05-24 | Admin users: 90% width, search, Stufe column, bulk Stufe edit, user detail dropdown; `platform_access_levels` |
| 2026-05-24 | Phase 3.2: admin Einstellungen tile hub + stub sub-routes |
| 2026-05-24 | Phase 3.1 live: access_level, level defaults table, registration field definitions, seed RPC level fallback |
| 2026-05-24 | Phase 3 split into 3.1–3.7 with per-step test plan; registration fields via definitions + values tables |
| 2026-05-24 | Phase 3 decisions: individual search under Videokurseinstellungen; bulk + per-user re-seed policy |
