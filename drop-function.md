## Drop Function – Clarification Questions

This document collects all open questions and decisions needed before implementing the **“drop function”** (content drip) in the platform.

### 1. Scope of the drop logic

- **Q1.1**: Should the drop schedule be **per user for the whole platform** or **per user per course**?
  - Example: If a user starts **Course A** today and **Course B** in 10 days, should Course B:
    - A) follow its **own** schedule starting from when the user first opens Course B, or  
    - B) follow the **same global schedule** that started at the user’s very first login?

### 2. Definition of “first login”

- **Q2.1**: What exactly counts as **“first login”** for starting the timer?
  - Option A: Use `auth.users.created_at` (Supabase sign‑up time).
  - Option B: Add and use a field like `profiles.first_login_at` that we set on the first successful login.
- **Q2.2**: For **existing users** (who already used the app before we introduce the drop function), what should we use as their starting point?
  - Option A: Backfill from `created_at`.
  - Option B: Use the time when the drop function goes live (“now”).

### 3. Unlock schedule and rules

- **Q3.1**: Current high‑level description:
  - First **chapter** and **first video** are available immediately.
  - The **second video** is unlocked **2 days after first login**, regardless of whether the first video has been finished earlier.
  - Is this understanding correct?
- **Q3.2**: Does the “every 2 days” logic continue for **all further content**, or only for the second video?
  - For example, should:
    - Video 3 unlock 4 days after first login,
    - Video 4 unlock 6 days after first login, etc.?
  - Or do you want a different pattern (e.g. per chapter, weekly, custom per video, etc.)?
- **Q3.3**: Should the schedule be based on:
  - **Exact elapsed time** (e.g. exactly 48 hours after first login), or
  - **Calendar days** (e.g. first login on Monday → unlock on Wednesday at 00:00 local time)?

### 4. Per‑video vs per‑chapter control

- **Q4.1**: Should the drop logic apply to **individual videos** or to **whole chapters**?
  - Option A (per video): each video has its own unlock time / offset.
  - Option B (per chapter): unlocking a chapter unlocks all its videos at once.
- **Q4.2**: Your description mentions “first video and first chapter”:
  - Does that mean:
    - Chapter 1, Video 1 unlocked immediately,
    - Chapter 1, Video 2 locked for 2 days,
    - Chapter 2 completely locked until some later time?
  - Please describe one **concrete example** course with chapters and videos and when each item should unlock.

### 5. UI / UX for locked content

- **Q5.1**: For a **locked video**, what should the user see?
  - Option A: Show the item in the list but **grayed out**, non‑clickable, with a **lock icon** and a timer text.
  - Option B: Completely **hide** locked items until they are available.
- **Q5.2**: How should the **timer text** look?
  - Examples:
    - “Verfügbar in 2 Tagen 5 Stunden”
    - “Verfügbar ab 25.11.2025”
  - Which wording and style do you prefer?
- **Q5.3**: Where exactly should this information be visible?
  - On each **locked video row**?
  - Also on the **course overview cards**?
  - Also in the **video detail / player view** (if the user somehow navigates there early)?

### 6. Admin / therapist / test accounts

- **Q6.1**: Should **admins** (e.g. `info@oag-media.com`) and possibly **therapists**:
  - Bypass the drop logic completely (always see all content unlocked), or
  - Follow the same drop schedule as normal clients?
- **Q6.2**: Do you want a separate “test user” role that also bypasses the drop logic for easier QA?

### 7. Time zones and cheating prevention

- **Q7.1**: We can compute unlock times on the **server in UTC** and then display them in the user’s local time.
  - This avoids users “cheating” by changing their device clock.
  - Are you okay with this approach?

### 8. Existing progress and migration

- **Q8.1**: For users who have **already watched** certain videos before we enable the drop function:
  - Should those already‑watched videos stay **permanently unlocked**, ignoring the new schedule?
  - Or should the drop rules still apply retroactively (which could suddenly hide content they previously saw)?
- **Q8.2**: Do we need a one‑time **migration rule** like:
  - “All videos that were watched at least once remain unlocked; only future videos are controlled by the drop function”?

### 9. Technical direction (to confirm later)

This section is not final implementation, only a proposal to confirm later:

- Add a `first_login_at` / `drip_start_at` timestamp to `profiles` (if not already present) and set it on first login.
- Add either:
  - a **global schedule** (e.g. video index → offset in days), or
  - per‑video or per‑chapter `unlock_offset_days` to make the drip highly configurable.
- In the **user course/video queries**, compute for each item:
  - `is_locked` (true/false),
  - `unlock_at` (Date),
  - `time_remaining` (derived on the client for display).
- Block access to locked videos in the `/video/[id]` route on the server and show a friendly message + remaining time.

We can refine this once all questions above are answered.








