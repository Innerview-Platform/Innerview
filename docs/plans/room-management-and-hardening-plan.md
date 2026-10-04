# Interview rooms: test findings, room management design and roadmap

Status: **implemented** (see "Implementation status" at the end) · Branch: `milestone_4` · Date: 2026-09-29

This plan comes from running the full stack locally (`make dev`) and exercising it with three test
users (host Alice, guest Bob, outsider Carol) through the REST API, STOMP, the Excalidraw server and the
browser. Every finding below lists how it was observed. Test IDs (T1…) refer to the scripted run.

---

## 1. What was tested

| Area | Cases |
|---|---|
| Room access | uninvited user joins by code, full 1:1 room, unknown code, code typed with different letter case, video token for non-members, whiteboard for outsiders |
| Presence | same user in two tabs, closing one tab, browser crash without "leave", reclaiming a crashed user's slot, rejoining |
| Host behaviour | guest arrives before host, host never joins, host leaves while guest stays, host ends from outside, ending a room nobody opened |
| Collaboration | code + notes live sync, leave/rejoin restore, large documents, concurrent Run, role changes |
| Lifecycle | end interview, rejoin after end, scheduled interview before its start time, interview time limit, session length |
| Pages | dashboard, new interview, join, room (desktop + mobile), interview history, feedback, profile |

What already works well: live code/notes/whiteboard sync, rejoin restores content, interactive code
execution, end-interview saves code + notes + participants, 1:1 capacity check, scheduled rooms refuse
early joins, only the host can change roles or end the interview.

---

## 2. Edge-case catalog

Severity: **P0** breaks interviews or leaks access · **P1** wrong behaviour users will hit · **P2** polish / product gaps.

### P0 — fix first

| # | Finding (evidence) | Impact | Handling |
|---|---|---|---|
| 1 | **Sessions die after 15 minutes.** Access tokens live 15 min (T21) and can't be refreshed: `/api/auth/refresh` reads the refresh token from the JSON body, but login stores it only in an httpOnly cookie that JS can't read. Observed: the browser was signed out mid-test. Interviews default to 150 min. | After 15 min REST calls fail, STOMP/whiteboard reconnects are rejected, the user is kicked to login. | Make `/refresh` read the `refresh_token` cookie (keep body support for mobile clients), rotate it in the response cookie. Frontend: single-flight silent refresh on 401 and ~60 s before `exp`; STOMP/Excalidraw/LiveKit reconnect with the fresh token (the whiteboard reconnects with a fresh room ticket). |
| 2 | **Code/notes sync breaks on larger documents.** A `CODE_UPDATE` of ~105 KB (≈400 lines, or far fewer lines after a long editing session because Yjs keeps history) closes the socket with **1009 message too big** (T17). | Sync stops for everyone; every reconnect re-sends the same big state and fails again. | Short term: raise `WebSocketTransportRegistration` limits (message size 1–2 MB, send buffer) and cap document size in the UI. Proper fix: send **incremental Yjs updates** instead of full state, and move code + notes to a dedicated Yjs server (Hocuspocus, in the existing empty `services/nodejs/collaboration-editor`) with incremental sync, awareness (remote cursors/selections with names), server-side merge and persistence. The Excalidraw server separately provides ticket-authenticated, persisted whiteboard scene sync. |
| 3 | **Room codes are case-sensitive in memory but not in MySQL.** Joining `mXgvAZ` and `MXgvAZ` creates **two separate live rooms** for the same interview (T4, T4b). | Participants who type the code differently never meet. | Canonicalize codes: generate lowercase codes (see §5), normalize input (`trim`, lowercase, strip dashes/spaces), key `activeRooms` by the interview's canonical code loaded from the DB, unique index on `room_id`. |
| 4 | **Anyone with a code can get in.** Uninvited users join (T1), get LiveKit tokens for rooms they aren't in (T5) — even for ended interviews (T18) — and can read/write the whiteboard of any room, also after it ended (T19). Codes are 6 chars from `ThreadLocalRandom` with no rate limit. | Interviews can be crashed or snooped on by anyone who learns or guesses a code. | Room management design in §3: invitations, lobby + admission, one `RoomAccessService.assertMember()` used by REST, STOMP CONNECT, LiveKit token, code runner and a **room-scoped ticket** for the Excalidraw server (whiteboard becomes read-only after the interview ends). Rate-limit join/knock attempts. |
| 5 | **The interview time limit never fires.** The timer key is written before the entity is saved (`interview:null`), serialized with JDK serialization (binary key), `RedisExpirationListner` is never registered, and Redis keyspace notifications are off. Scheduled interviews would start the timer at creation, not at the start time. | Interviews never end on their own; rooms live forever. | Drop the Redis-expiry mechanism. A `@Scheduled` job (every minute) queries interviews whose `endTime` passed and ends them through the unified end path (#8), with a warning broadcast 5 min before. The DB is the source of truth, so it survives restarts. |
| 6 | **Presence is wrong.** A crashed browser stays `CONNECTED` forever (T8) and keeps the 1:1 slot, so a replacement can't join (T9). The same user in two tabs is two participants/two video tiles, and closing one tab doesn't change anything (T6, T7). `handleDisconnect` never updates status or counters. | "Room is full" with only one person inside; ghost participants; double video. | Track presence per **socket session**: a participant is `CONNECTED` while ≥1 session is alive (STOMP heartbeats already on), `RECONNECTING` for a 60 s grace window, then `LEFT`. Capacity counts unique users that are connected or in grace. Second tab: show "You're already in this interview in another tab — Join here" (Meet's *Switch here*), which moves the session. LiveKit identity = user id so a duplicate replaces the old connection. |

### P1 — wrong behaviour users will hit

| # | Finding | Handling |
|---|---|---|
| 7 | An interview nobody opens stays `STARTED` forever and can't be ended (T12b: 404). Instant interviews are `STARTED` at creation. | Lifecycle: `SCHEDULED/READY → LIVE (first person admitted) → ENDED`, plus `CANCELLED` and `NO_SHOW`. End works on non-live interviews too (just marks them). The scheduler (#5) closes stale ones. |
| 8 | Three end paths disagree: host end (saves everything, closes room), time-limit end (only status + broadcast), empty-room cleanup (marks `COMPLETED` every 5 min but keeps the room joinable, saves nothing). | One `endInterview(roomId, reason)` used by all: flush docs, save code/notes/whiteboard snapshot, record participation, stop runs, broadcast `/close` with reason, evict room, revoke tickets. Empty room: end after 10 min with nobody connected (Meet/Zoom end empty calls). |
| 9 | Participation is recorded only when the host presses End, so crashed/abandoned interviews never show up in history (T22 path) and feedback checks fail. | Record `user_interview` when a person is first admitted. |
| 10 | Host leaves → room continues with nobody able to admit or end it (T13); host can end from outside only if the room is still in memory (T12). | §3.4: co-hosts, host hand-off, "Leave vs End for everyone" dialog. |
| 11 | Pressing Run while someone else's program runs silently kills it (T16). | Run lock per room: if a run is active, the button shows "Running (started by Bob)" with Stop; starting another asks "Stop Bob's program and run yours?" and the terminal logs who stopped it. Rate-limit runs per room. |
| 12 | Guest tries to promote himself: rejected silently (T15); client only guesses after a 4 s timeout. | Reply on a per-user error queue (`/user/queue/errors`) — needs `enableSimpleBroker("/topic", "/queue")` + user destinations. Reuse for every rejected action. |
| 13 | Feedback can only be *read*; there is no endpoint or UI to give it. | Post-interview scorecard, §4. |
| 14 | LiveKit identity is `name + random`, so each tab is a new person; the key/secret (`devkey`/`secret`) is hardcoded. | Identity = user id, name as display name, grants scoped to the room, keys from env. |
| 15 | Whiteboard rooms are never deleted and stay editable after the interview. | Ticket-scoped access (#4); connect read-only when ended (`isReadonly`); export a PNG/JSON snapshot to the interview on end; retention job. |
| 16 | Unsaved code/notes live only in Redis with a 6 h idle TTL. | Periodic DB snapshot (every few minutes while live) + restore from DB when Redis is empty; with Hocuspocus this is its persistence hook. |
| 17 | `POST /leave` answers 500 when the socket session was never registered (documented in `RoomPage`). | Idempotent leave: 204 whether or not the user is present. |
| 18 | Users without a profile get 404 from history (T22) and other profile-scoped endpoints. | Create the profile at signup (or return empty results), onboarding step for experience level / role. |

### P2 — polish and gaps

| # | Finding | Handling |
|---|---|---|
| 19 | Joining goes straight into the call (camera prompt, no device check). | Pre-join screen (§3.2) with camera/mic preview and device pickers, like Meet's green room. |
| 20 | Scheduled interview: joining early returns a bare 403 (T20); only the creator gets a notification. | Lobby shows "Starts in 12 min", allow joining 10 min early; invite emails with `.ics` + reminders to every invitee. |
| 21 | No timer in the room. | Header timer (elapsed / remaining), 5-min warning, host can extend once. |
| 22 | No awareness in code/notes: you don't see where the other person's cursor is. | Comes with Hocuspocus (#2). |
| 23 | Code runner limits: 64 KB output, 5 min wall time, no EOF, C `printf` prompts buffered. | Document in the terminal UI; "Send EOF" needs a small Piston patch or a stdin-closing wrapper. |
| 24 | No in-room chat. | Lightweight STOMP chat, saved with the interview (links, hints). |
| 25 | Single backend instance only (in-memory rooms, simple broker). | Later: room state in Redis, STOMP broker relay (RabbitMQ) or Redis pub/sub, sticky sessions. |

---

## 3. Room management design

### 3.1 How Google Meet and Zoom do it

| Question | Google Meet | Zoom | InnerView recommendation |
|---|---|---|---|
| Who can join directly? | Invited people (calendar invite) and, depending on the meeting's access setting, people from the same organization. | Anyone with the link + passcode, unless the waiting room is on. | **Invited people** (host, co-interviewers, candidate) join directly. |
| Everyone else? | "Ask to join" → waits until admitted or denied. | Waiting room → admitted by host/co-host. | **Ask to join** → lobby. |
| Who admits? | Host and co-hosts. | Host and co-hosts. | Host and co-hosts (interviewers). Optional setting: any participant may admit (Meet's "host management off"). |
| Host not there yet? | People who may join directly can start; askers wait. | "Waiting for the host to start this meeting" unless *join before host* is allowed. | Invitees can start without the host; askers wait with "Waiting for the host or an interviewer to let you in", host gets a notification. |
| Creator doesn't want to attend? | Adds co-hosts. | Adds *alternative hosts* when scheduling. | Creator invites interviewers **as co-hosts**; co-hosts get admit, end and role controls. Creator never has to join. |
| Host leaves | Call continues. | Host must assign a new host or "End meeting for all". | "Leave" dialog: *Leave (interview continues)* / *End for everyone*. On leave, host rights pass to a co-host automatically; if none, to the longest-present interviewer. |
| Ending | Host: "End call for everyone"; empty calls close. | "End meeting for all"; ends at scheduled time only on some plans. | Host/co-host end; auto-end when empty 10 min, or at end time (+10 min grace, with warnings). |
| Removing people | Remove + they can't rejoin without asking. | Remove, optionally block rejoin. | Remove → ticket revoked, must ask again (or blocked). |
| Codes | `abc-defg-hij`, lowercase, typed in any case. | Numeric ID + passcode. | `abc-defg-hij` lowercase letters (see §5). |

### 3.2 Join flow

```
Open /abc-defg-hij
  └─ GET /api/interviews/by-code/{code}/access
       ├─ ENDED / CANCELLED        → "This interview has ended" (+ link to summary if you took part)
       ├─ NOT_STARTED (scheduled)  → "Starts at 18:00 · in 12 min", enable join 10 min early
       ├─ HOST | INVITED | ADMITTED → pre-join screen → [Join now]
       └─ MUST_ASK                  → pre-join screen → [Ask to join] → lobby
                                          ├─ admitted → join
                                          ├─ denied   → "You can't join this interview" (retry allowed twice)
                                          └─ 10 min no answer → "Nobody let you in" + [Ask again]
```

Pre-join screen: camera/mic preview and device pickers, display name, the interview's title and host,
who is already inside ("Alice is in this interview"), and the button for your access level.

### 3.3 Admission protocol

1. **Knock:** `POST /api/rooms/{code}/knock` → stores `AccessRequest{id, userId, name, requestedAt}` (Redis, 10 min TTL), pushes it to admitters on `/user/queue/lobby` (private per user — not a room topic, so guests never see requests).
2. **Admitters** see a toast "Carol wants to join — Admit / Deny" and a lobby list in the participants panel ("Admit all" when several).
3. **Decision:** `ADMIT {requestId, role}` / `DENY {requestId}` over STOMP → server records it and notifies the knocker on `/user/queue/lobby`.
4. **Ticket:** admission (and direct entry for invitees) returns a short-lived **room ticket** — a JWT signed by the backend with `{sub: userId, room: code, role, exp: 5 min}`.
5. The ticket is the proof of membership everywhere: STOMP CONNECT, LiveKit token endpoint, code runner, and the Excalidraw server (which then no longer accepts plain access tokens). Tickets are re-issued on reconnect while membership lasts.
6. Capacity check happens on admission, not on knock; a 1:1 room shows admitters "Room is full" instead of an Admit button.

### 3.4 Roles and permissions

| Action | Host | Co-host (interviewer) | Candidate | Observer |
|---|:-:|:-:|:-:|:-:|
| Join without asking | ✓ | ✓ | ✓ (if invited) | ✓ (if invited) |
| Admit / deny / remove | ✓ | ✓ | – | – |
| Change roles, make co-host | ✓ | – | – | – |
| End interview for everyone | ✓ | ✓ | – | – |
| Edit code / notes / whiteboard, Run | ✓ | ✓ | ✓ | – (read-only) |
| Private interviewer notes, scorecard | ✓ | ✓ | – | – |

### 3.5 Data model changes

- `interviews`: `title`, `access_policy` (`ASK_TO_JOIN` default, `INVITE_ONLY`, `OPEN`), `status` lifecycle (#7), `room_code` (canonical, unique), `allow_join_before_host`.
- `interview_invites`: `interview_id`, `email`, `user_id` (nullable until they sign up), `role` (`CO_HOST`, `CANDIDATE`, `OBSERVER`), `status` (`PENDING`, `ACCEPTED`, `DECLINED`), `token` for email links.
- `user_interview`: written on first admission (#9); add `left_at`, `removed`.
- Redis: `room:{code}:requests` (lobby), `room:{code}:sessions` (presence), existing document keys.

### 3.6 Implementation notes

- One `RoomAccessService` owning: `resolveAccess(code, user)`, `knock`, `admit`, `deny`, `remove`, `issueTicket`, `assertMember`. Controllers and the signaling handler call it instead of `joinRoom` directly.
- STOMP: `enableSimpleBroker("/topic", "/queue")`, user destinations for lobby/errors; CONNECT requires a valid ticket (not just an access token).
- Frontend: `RoomPage` becomes a small state machine — `resolving → prejoin → knocking → joined → ended` — all at the same URL.

---

## 4. Mock-interview features to add

The backend already has a problem bank, test cases, submissions and a judge (`ProblemController`,
`SubmissionController`, `JudgeService`), but the room UI doesn't use them.

| Feature | Why (what CoderPad / HackerRank Interview / Pramp do) | Plan |
|---|---|---|
| **Problem picker in the room** | Interviewer brings a prepared problem instead of typing it. | Problem tab in the left panel: search the bank, "Present to candidate" pushes statement + starter code (per language) to the room; shared notes stay as a second tab. |
| **Run against tests / Submit** | Candidate sees sample tests pass; interviewer sees hidden tests. | Reuse `/sessions/{id}/submissions` + judge; show per-test results in the terminal panel; hidden tests visible to interviewers only. |
| **Private interviewer notes** | Interviewers take notes the candidate can't see. | Per-user (or per-interviewer-group) Yjs doc, never broadcast to candidates. |
| **Timer & phases** | Keeps the session on track (intro 5 · problem 35 · Q&A 5). | Header timer, optional phase template per interview type, 5-min warning. |
| **Scorecard & feedback** | The point of a mock interview is actionable feedback. | After End: interviewer fills a rubric per type — *problem solving*: communication, approach, correctness, code quality, testing; *system design*: requirements, high-level design, deep dive, trade-offs; *behavioral*: STAR structure, impact — plus a hire-signal scale and free text. Candidate rates the interviewer (peer platforms rate both ways). Route: `/interviews/:id/feedback`. |
| **Interview summary** | Review what happened. | `/interviews/:id`: final code, notes, whiteboard snapshot (Excalidraw export), run history, feedback, and later a **replay** (store the timeline of Yjs updates — CoderPad's playback). |
| **Swap roles (peer practice)** | Pramp-style sessions: both people practice. | "Swap roles" button for the host: switches interviewer/candidate and loads the second problem. |
| **Invites & scheduling** | Candidates need a link, reminders and calendar entries. | Invite by email with role; `.ics` attachment / Google Calendar (the `GoogleApiService` already exists); reminders 24 h and 10 min before. |
| **Recording (optional)** | Watch yourself back. | LiveKit Egress to object storage, opt-in with consent banner for everyone. |
| **AI copilot / CV analyzer** | Placeholders exist in `services/python`. | Later: post-interview AI summary of code + notes to seed the scorecard. |

---

## 5. URL and code scheme

Modern products keep URLs short and stable: Meet uses `meet.google.com/abc-defg-hij` with the app home
at `/`; Zoom uses `/j/{id}`. The call, lobby and "ended" states all live at the same URL.

| Page | Now | Proposed |
|---|---|---|
| Home (signed in) | `/dashboard` | `/` (landing page when signed out) |
| Sign up | `/register` | `/signup` |
| Interviews list | `/interviews` | `/interviews` (tabs: `?view=upcoming` / `?view=past`) |
| New interview | `/interviews/new` | `/interviews/new` |
| Interview summary | — | `/interviews/:id` |
| Give feedback | — | `/interviews/:id/feedback` |
| Enter a code | `/room/join` | `/join` |
| **Interview room** | `/room/join/:roomId` (e.g. `/room/join/mXgvAZ`) | **`/:code`** (e.g. `/kxp-qrsw-mtz`) — pre-join, lobby, call and "ended" states |
| Profile & settings | `/profile` | `/settings/profile`, `/settings/account`, `/settings/languages` |
| Feedback received | `/feedback` | `/feedback` |

- **Code format:** `abc-defg-hij` — 10 lowercase letters from `SecureRandom` (26¹⁰ ≈ 1.4 × 10¹⁴), stored canonical without dashes, accepted in any case with or without dashes, unique index, retry on collision. Lowercase letters only also avoids look-alike characters (`l`/`I`, `0`/`O`) that make mixed-case codes hard to read out loud.
- **Routing:** the `/:code` route matches only `^[a-z]{3}-?[a-z]{4}-?[a-z]{3}$`, so it can't shadow app routes; keep a reserved-word list anyway.
- **Compatibility:** redirect `/dashboard → /`, `/register → /signup`, `/room/join/:code → /:code`, `/profile → /settings/profile`. Update links built by the backend (`InterviewServiceImpl.roomLink`, email templates, `GmailEmailService`) to use a single `frontend.url` + path helper.

---

## 6. Roadmap

| Phase | Scope | Items |
|---|---|---|
| **0 — Stabilize** (≈1 week) | Stop interviews from breaking | #1 session refresh · #2 message size limits (short-term) · #3 code canonicalization · #5 scheduler-based time limit · #6 socket-based presence · #8 unified end path · #9 participation on admission · #14 LiveKit identity/keys · #17 idempotent leave |
| **1 — Room management** (≈2 weeks) | Who gets in, who controls the room | §3 invites, access policy, lobby/knock/admit, room tickets for STOMP/LiveKit/Excalidraw/runner, co-hosts & host hand-off, Leave-vs-End dialog, pre-join screen, #11 run lock, #12 error queue, #20 scheduled lobby, §5 URL + code migration |
| **2 — Mock-interview product** (≈2–3 weeks) | Make practice useful | §4 problem picker + tests, timer, private notes, scorecard & feedback, summary page, swap roles, invites/calendar |
| **3 — Scale & polish** | Robustness and extras | #2 Hocuspocus with awareness, #16 DB snapshots, chat, replay, recording, rate limits, horizontal scaling (#25), observability |

Each phase should ship with the scripted two/three-user tests used for this report (they live in
the session scratchpad today; move them to `tests/e2e/` as the first task of Phase 0).

---

## Implementation status

Everything above is implemented except the items marked *not done*. Tests: `tests/e2e/rooms.e2e.mjs`
(52 checks) and `tests/e2e/code-runner.e2e.mjs`, plus the backend unit tests.

| Area | Status |
|---|---|
| #1 Session refresh | Done — `/api/auth/refresh` reads the httpOnly cookie and rotates it; typed tokens (`typ=access/refresh`); one refresh token per device; silent refresh in the SPA (Web Locks across tabs); Google sign-in now completes in the SPA. |
| #2 Large documents | Done — code, notes and private notes moved to Hocuspocus (incremental Yjs, awareness cursors); STOMP limits raised for everything else. |
| #3 Room codes | Done — `abc-defg-hij`, `SecureRandom`, canonicalized everywhere; old 6-char codes still work. |
| #4 / §3 Access | Done — invites (email + in-app, calendar link, reminders), `ASK_TO_JOIN` / `INVITE_ONLY` / `OPEN`, lobby with admit/deny (toast + panel, "Room full"), room tickets for STOMP, LiveKit, runner, Hocuspocus and Excalidraw; subscriptions limited to the user's room; rate-limited code lookups and knocks. |
| #5 Time limit | Done — DB-driven scheduler: 5-min warning, end at time-up, one +15 min extension, no-show and stale-interview sweep. |
| #6 Presence | Done — per-socket presence, 60 s reconnect grace, "Join here" takeover, LiveKit identity = user id. |
| #7–#9 Lifecycle | Done — `SCHEDULED → STARTED → COMPLETED` (or `CANCELLED` / `GHOSTED`), one end path for host / time-up / empty room / no-show, participation recorded on entry. |
| #10 Host | Done — host = owner while present, hand-off to an interviewer, Leave vs End for everyone, co-hosts via the Interviewer role. |
| #11–#18 | Done — run lock with confirmation, `/user/queue/errors`, feedback scorecards, LiveKit keys from env, whiteboard read-only after end + retention job, DB snapshots of documents, idempotent leave, lists work without a profile. |
| #19–#24 | Done — pre-join screen with device preview, scheduled lobby countdown and 10-min early join, header timer, live cursors, terminal limits documented, chat saved with the interview. *EOF for stdin* is not possible with Piston's WebSocket protocol; the terminal explains it and Stop ends such programs. |
| §4 Product | Done — private notes, timer, scorecards (both directions, hire signal), summary page (final code, replay, notes, whiteboard, chat), swap roles, invites/calendar. The whiteboard is shown read-only on the summary instead of as an exported PNG. |
| §5 URLs | Done — `/`, `/signup`, `/join`, `/interviews` (`?view=past`), `/interviews/:id`, `/interviews/:id/feedback`, `/settings/profile`, `/:code`, with redirects from the old URLs. |
| Observability | Done — actuator metrics with room/participant/lobby gauges; `/health` on both Node services. |
| *Not done (by decision)* | Problem picker / running tests in the room, horizontal scaling (#25), session recording, AI summary. |

## Milestone 4 storage decision

Shared code, notes, private notes and replay are persisted in Redis alongside the
Excalidraw canvas. The Java Redis key/persistence/debounce/expiry classes are
retained; expiry events delegate to the unified lifecycle and database scheduling
remains the authoritative time-limit mechanism. See `docs/MILESTONE_4_BRANCHES.md`
for the reconstructed feature/subfeature merge history.
