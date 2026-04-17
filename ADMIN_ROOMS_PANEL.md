# Admin Rooms Panel — PlayTogether

> **Scope**: This document specifies a live debug / monitoring panel for all active rooms on the server. It is intentionally separated from the main Infiltration & Admin prompt because it is **game-agnostic** — it works for any game mode (Infiltration, Odd One Out, Codenames, etc.).

---

## 1. Purpose

The Rooms Panel gives a trusted host or developer a real-time view into every room on the server. It answers:

- What rooms exist right now?
- Who is in each room and what is their connection status?
- What game phase is each room in?
- Can I inspect, export, or force-close a room?

Because PlayTogether stores all state in-memory, there is no database to query — this panel is the only window into live state.

---

## 2. Where It Lives

- Route: `/admin/rooms` — either a standalone page or a tab within the `/admin` layout.
- The main `/admin` route currently has Characters and Themes tabs. The Rooms panel can be added as a third tab later, or kept as a separate route.

---

## 3. Features

### 3.1 Room List View

A table showing all active rooms at a glance:

| Column       | Source                       | Notes                                 |
| ------------ | ---------------------------- | ------------------------------------- |
| Room Code    | `room.code`                  | Uppercased, clickable → detail view   |
| Player Count | `room.players.length`        | e.g. "4 / 8"                          |
| Game         | `room.game.type`             | "infiltration", "odd_one_out", "none" |
| Phase        | `room.game.phase`            | "lobby", "reveal", "mayhem", etc.     |
| Created At   | `room.createdAt`             | Relative time ("2 min ago")           |
| Host         | `room.hostSocketId` → player | Display name of the host              |
| Status       | derived                      | 🟢 active / 🟡 idle / 🔴 closing      |

**Sorting**: Clickable column headers. Default: newest first.
**Filtering**: Text filter on room code, game type dropdown.

### 3.2 Room Detail View

Clicking a room row expands or navigates to a detail panel:

- **Full RoomState JSON** — Pretty-printed, collapsible tree (use a JSON viewer component).
- **Player List** — Table with columns: display name, socket ID, connected (boolean), team, character name, vote target, ready status.
- **Game Data** — Game-specific state: characters, round ID, current phase, timer remaining, power actions log.
- **Timer Info** — Phase timer: total duration, elapsed, remaining. Visual progress bar.

### 3.3 Actions

| Action           | Button / Control       | What It Does                                                                                        |
| ---------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Force Close**  | 🔴 "Close Room"        | Emits `room:closed` to all sockets in the room, clears timers, removes room from the in-memory map. |
| **Export State** | 📥 "Export JSON"       | Downloads the full `RoomState` as a `.json` file (timestamped filename).                            |
| **Kick Player**  | Per-player ❌ button   | Emits `room:kick` for that player, disconnects their socket from the room.                          |
| **Pause Timer**  | ⏸ "Pause" / ▶ "Resume" | Pauses/resumes the current phase timer (dev tool only).                                             |
| **Skip Phase**   | ⏭ "Skip to Next"      | Advances the room to the next game phase immediately.                                               |

### 3.4 Live Updates

The panel must stay in sync with the server's in-memory state. Two options:

**Option A — Socket-based (preferred)**

The admin client joins a special `admin` room on the Socket.IO server. The server broadcasts room state changes to this room.

| Event               | Direction | Payload                              | Description                        |
| ------------------- | --------- | ------------------------------------ | ---------------------------------- |
| `admin:subscribe`   | C → S     | `{}`                                 | Join the admin broadcast room      |
| `admin:rooms`       | S → C     | `RoomSummary[]`                      | Full list on subscribe + on change |
| `admin:roomDetail`  | S → C     | `{ code: string, state: RoomState }` | Pushed when a watched room changes |
| `admin:watchRoom`   | C → S     | `{ roomCode: string }`               | Start watching a specific room     |
| `admin:unwatchRoom` | C → S     | `{ roomCode: string }`               | Stop watching a specific room      |
| `admin:forceClose`  | C → S     | `{ roomCode: string }`               | Force-close a room                 |
| `admin:kickPlayer`  | C → S     | `{ roomCode, socketId }`             | Kick a player from a room          |
| `admin:pauseTimer`  | C → S     | `{ roomCode }`                       | Pause the phase timer              |
| `admin:resumeTimer` | C → S     | `{ roomCode }`                       | Resume the phase timer             |
| `admin:skipPhase`   | C → S     | `{ roomCode }`                       | Skip to the next phase             |

**Option B — REST polling (simpler, fewer features)**

| Method | Endpoint                       | Description                        |
| ------ | ------------------------------ | ---------------------------------- |
| `GET`  | `/api/admin/rooms`             | List all rooms (summary)           |
| `GET`  | `/api/admin/rooms/:code`       | Full room state                    |
| `POST` | `/api/admin/rooms/:code/close` | Force close room                   |
| `POST` | `/api/admin/rooms/:code/kick`  | Kick player (body: `{ socketId }`) |

Poll `GET /api/admin/rooms` every 2 seconds for auto-refresh.

---

## 4. Security

This is a **local dev / trusted-host tool**. No authentication is required by default. Options for production:

- Simple query param guard: `?key=admin` on all admin routes/events.
- Environment variable `ADMIN_KEY` that must match.
- Or simply don't deploy the admin routes in production builds.

---

## 5. Historical / Replay Ideas (Future)

These are stretch goals — not required for the initial implementation:

- **Room History Log**: Keep a circular buffer of the last N closed rooms. Display in a "Recent Rooms" tab.
- **Event Timeline**: Record every socket event for a room in order. Display as a scrollable timeline in the detail view. Useful for debugging game logic.
- **Replay Mode**: Given a recorded event timeline, replay the room state changes step-by-step. Helps reproduce bugs.
- **Aggregate Stats**: Show stats across all rooms — total rooms created, average game duration, most-picked characters, win rates by team.

---

## 6. UI Sketch

```
┌──────────────────────────────────────────────────┐
│  Admin > Rooms                          [Filter▼] │
├────────┬────────┬──────────┬───────┬─────────────┤
│ Code   │ Players│ Game     │ Phase │ Created     │
├────────┼────────┼──────────┼───────┼─────────────┤
│ ABC123 │ 4 / 8  │ infiltr… │ mayhem│ 2 min ago   │
│ XYZ789 │ 2 / 8  │ odd_one… │ lobby │ 5 min ago   │
└────────┴────────┴──────────┴───────┴─────────────┘

Clicking ABC123 expands:
┌──────────────────────────────────────────────────┐
│  Room ABC123                                      │
│  Phase: mayhem  │  Timer: 18s / 30s  [██████░░░] │
│                                                    │
│  Players:                                          │
│  ┌──────────┬───────┬──────────┬──────┐           │
│  │ Name     │ Team  │ Character│ Vote │           │
│  ├──────────┼───────┼──────────┼──────┤           │
│  │ Alice    │ inno… │ Oracle   │  —   │           │
│  │ Bob      │ infi… │ Shadow   │  —   │           │
│  └──────────┴───────┴──────────┴──────┘           │
│                                                    │
│  [Close Room] [Export JSON] [Skip Phase] [Pause]  │
│                                                    │
│  Raw State:  ▶ { code: "ABC123", … }              │
└──────────────────────────────────────────────────┘
```

---

## 7. Implementation Notes

- Server: Register admin socket events in a new file `apps/server/src/socket/adminHandlers.ts`.
- Client: New page/component at `apps/web/src/pages/AdminRoomsPage.tsx` or `apps/web/src/features/admin/rooms/`.
- The admin socket namespace could be a separate Socket.IO namespace (`/admin`) to keep it isolated from game traffic.
- Use the existing `rooms` Map from `apps/server/src/state/rooms.ts` — no new data structures needed for the basic version.
