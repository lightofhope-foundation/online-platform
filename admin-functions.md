# Light of Hope — Admin Functions & Roadmap

**Purpose:** Living technical plan for admin/client features. Expand this file whenever new ideas come up.  
**Last updated:** 2026-05-24  
**Scope:** LOH `online-platform` only — **do not** change fa-gretzinger Supabase, repo, or Vercel project.

**Related docs:**
- `instructions.md` — long-term therapy-platform MVP (broader vision)
- `SETUP-STATUS.md` — Git, SSH, Vercel, MCP handoff

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
| **Individual** | `/admin/users/[clientId]/videos` (done in 2b) | One Nutzer-ID; manual rows + „Standard-Zeitplan neu anwenden“ |

- [ ] Tile overview at `/admin/einstellungen`
- [ ] Videokurseinstellungen: edit global `platform_unlock_defaults`
- [ ] Videokurseinstellungen: edit per-level defaults (new table)
- [ ] User detail / users list: assign `access_level` 0–5
- [ ] `seed_user_video_unlocks`: resolve defaults global → level → existing manual rows
- [ ] Nutzereinstellungen: placeholder until registration flow exists
- [ ] Document: default changes apply to **new** registrations unless admin runs re-seed / per-user apply

**Exit:** Admin changes default policy at global, category, and individual level.

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

## 10. Explicit non-goals (this roadmap)

- Changing fa-gretzinger project or shared MCP credentials
- Replacing sequential unlock with schedule-only (schedule **adds** to sequential)
- Rewriting `/admin/videos` upload/editor
- Full chat, therapist CRM, Stripe (see `instructions.md` phases)

---

## 11. Decisions (confirmed 2026-05-24)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Videos 1–3 | **Sequential lock only**; admin may still set optional unlock date/time per video |
| 2 | Timezone | **Always `Europe/Berlin`** (German software) |
| 3 | Admin user URLs | **Nutzer-ID** `client_id` e.g. `/admin/users/01angr001` — unique, scalable |
| 4 | Unlock in the past | Unlock immediately when sequential rule satisfied (**Yes**) |
| 5 | Video order | All published courses, chapter+position (**Yes**) |
| 6 | fa-gretzinger Supabase | **Never touch** — LOH project `tovojkwejkoysgygogfl` only |

---

## 12. Idea backlog

- **Admin Einstellungen tiles:** Videokurseinstellungen + Nutzereinstellungen (see Phase 3) — confirmed 2026-05-25
- **Tiered unlock defaults:** Global + Stufe 0–5 + per-user (§3.7) — confirmed 2026-05-25, implement Phase 3
- **Dynamic video rules:** When admin adds chapters/videos, default unlock rules should stay in sync (e.g. first video per chapter free, or recompute gated positions) — design in Phase 3+
- **Registration fields config:** Admin chooses required profile fields at signup — Phase 3 Nutzereinstellungen

---

## 13. Changelog

| Date | Change |
|------|--------|
| 2026-05-24 | Initial plan: unlock scheduling, user dashboard tiles, settings, defaults |
| 2026-05-24 | Confirmed: videos 1–3 sequential-only + optional admin dates; Europe/Berlin; Nutzer-ID spec `01angr001`; Phase 0 started (Supabase + admin routes) |
| 2026-05-24 | Phase 1 complete: unlock tables, RPCs, triggers, RLS, gretzinger backfill, `videoUnlock.ts` |
| 2026-05-25 | Client course list wired to schedule locks; 10:00 Uhr Berlin; admin Einstellungen tile concept added |
| 2026-05-25 | Phase 2b live: admin per-user unlock editor, calendar picker, Freigeschalten seit |
| 2026-05-25 | Phase 2c: client `/settings`; tiered defaults (global / Stufe 0–5 / user) spec for Phase 3 |
