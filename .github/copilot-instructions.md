# Copilot / AI Coding Instructions — PlayTogether

Quick reference to help AI agents be productive in this repo.

1. Big picture

- Two main apps: `apps/server` (Node + Express + Socket.IO) and `apps/web` (React + Vite). The server holds transient in-memory room state; there is no DB.
- Shared types are intended under `packages/shared/src/types.ts` but many types are simple/duplicated in each app. Socket events are the primary integration surface between server and web.

2. Where to look first (fast onboarding)

- Server entry: `apps/server/src/index.ts` — creates HTTP server, Socket.IO instance, and calls `registerSocketHandlers`.
- Socket handlers: `apps/server/src/socket/registerHandlers.ts` — authoritative list of server-side socket events (room:host, room:join, room:state, game:start, game:submit, etc.).
- Room lifecycle helpers: `apps/server/src/socket/roomActions.ts` — timers, emits, and shutdown logic (clear timers on close).
- Room model/state: `apps/server/src/state/rooms.ts` and `apps/server/src/state/types.ts` (settings, defaults, `createRoom` behavior).
- Client socket: `apps/web/src/lib/socket.ts` — client connects to `http://localhost:3001` with `autoConnect: false`.

3. Important conventions & patterns (project-specific)

- Room codes are normalized to upper-case and trimmed everywhere: use `roomCode.trim().toUpperCase()`.
- Host-only operations always check `room.hostSocketId === socket.id` and emit `error:forbidden` on violation.
- Game timers are per-room and guarded by `roundId` to ignore stale timers — see `startPhaseTimer` and checks in handlers.
- Room state is emitted via `emitRoomState(io, code)` after every mutation; prefer that pattern instead of ad-hoc emits.
- In-memory single-process design: rooms stored in `Map<string, RoomState>`; scaling would require moving state/out-of-process.

4. Developer workflows (how to run locally)

- Server development:
  - cd into `apps/server`
  - install: `pnpm install` (or `npm install` if not using pnpm)
  - run in dev: `pnpm dev` — starts `ts-node-dev` with `src/index.ts` and live-reload.
  - server default port: `3001` (see `PORT` env in `index.ts`).
- Web development:
  - cd into `apps/web`
  - install: `pnpm install`
  - run dev: `pnpm dev` (Vite on `5173` by default)
  - build: `pnpm build` (runs `tsc -b && vite build`).
- Notes: CORS in `index.ts` explicitly allows `http://localhost:5173` — change that if serving web from another origin.

5. Key socket events and where they're handled/consumed

- Server-side: see `registerSocketHandlers.ts` for handlers and `roomActions.ts` for side-effects.
  - examples: `room:host`, `room:join`, `room:joinDenied`, `room:state`, `room:closed`, `game:start`, `game:submit`, `game:reset`, `room:kick`.
- Client-side: inspect `apps/web/src/features/*` and `apps/web/src/hooks/useSocketConnection.ts` for which events the UI listens to and how it maps server payloads to UI actions.

6. Files that explain game rules / config

- Game rules / limits: `apps/server/src/state/gameRules.ts` and `apps/web/src/constants/gameRules.ts` (client-side copy of constraints).
- Default room settings and behavior are defined in `createRoom` inside `apps/server/src/state/rooms.ts`.

7. Common pitfalls to avoid (discovered patterns)

- Do not rely on persistent state — restarts wipe all rooms.
- Always clear phase timers when ending/closing a room (`clearPhaseTimer` in `roomActions.ts`).
- When adding new socket events, follow existing naming and emit `room:state` after any state change.

8. Useful examples (copy-paste when implementing handlers)

- Normalizing room codes:
  ```ts
  const code = roomCode.trim().toUpperCase();
  ```
- Emitting room state after change:
  ```ts
  import { emitRoomState } from "./roomActions";
  emitRoomState(io, code);
  ```

9. When to read more

- For protocol details, read `apps/server/src/socket/registerHandlers.ts` and mirror events in `apps/web/src/features/*`.
- For timing and concurrency rules, read `apps/server/src/socket/roomActions.ts` and `startPhaseTimer` usage.

If anything here is unclear or you'd like me to expand a specific section (examples for a handler, a checklist for a PR, or a developer onboarding script), tell me which part to iterate on.
