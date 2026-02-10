# PlayTogether - System Architecture

**TLDR:** High-level system diagram (React ↔ WebSocket ↔ Node). Detailed data flows (room creation, player join, game start, voting). Room state structure and client state management. Socket event categories with examples. Timer management with round guards. Error handling approach. Scaling considerations and limitations. File dependency graph.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React + Vite)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  HomePage → HostPage/PlayerPage → Game UI Components  │  │
│  │                                                         │  │
│  │  Global State (Zustand): roomState, playerState, UI   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    WebSocket (Socket.io)
                            ↕
┌─────────────────────────────────────────────────────────────┐
│            Node.js + Express Server (Port 3001)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Socket.io Handler Layer (21 socket events)           │  │
│  │  - Room Management (8 handlers)                        │  │
│  │  - Game Control (14 handlers)                          │  │
│  │  - Lifecycle (1 handler)                              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Game Logic Layer                                     │  │
│  │  - Phase Management (reveal, mayhem, voting)          │  │
│  │  - Role Powers (spy, engineer, hacker, thief)         │  │
│  │  - Vote Submission & Results                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Room State Management                                │  │
│  │  - In-Memory Map: Map<roomCode, RoomState>            │  │
│  │  - Player Tracking, Role Assignment, Submissions      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    No Database / No Persistence
```

## Data Flow

### Room Creation Flow

```
1. Client: "room:host" event (gameType, settings)
   ↓
2. Server: registerRoomHandlers validates host request
   ↓
3. Server: createRoom(code, hostSocketId, settings)
   ↓
4. Server: Store in rooms Map
   ↓
5. Server: emitRoomState(io, roomCode)
   ↓
6. Client: Receives room:state, updates global store
   ↓
7. UI: Renders HostPage with room controls
```

### Player Join Flow

```
1. Client: "room:join" event (roomCode, nickname)
   ↓
2. Server: normalizeRoomCode, validate room exists
   ↓
3. Server: Check approval requirement
   ├─ No approval needed → add to room.players immediately
   └─ Approval needed → add to room.pending
   ↓
4. Server: emitRoomState(io, roomCode)
   ↓
5. All Clients in room: Receive updated room state
   ↓
6. UI: Show player in lobby or pending list
```

### Game Start Flow

```
1. Host: Clicks "Start Game"
   ↓
2. Client: "game:start" event
   ↓
3. Server: Validate all players ready
   ↓
4. Server: Assign roles based on game type
   ├─ Infiltration: Civilians, Infiltrator, Special roles
   └─ Odd One Out: Standard roles
   ↓
5. Server: Set phase to "reveal"
   ↓
6. Server: startPhaseTimer (delay 3s, then proceed)
   ↓
7. Server: emitRoomState with roles hidden
   ↓
8. All Clients: Receive room:state (role revealed locally)
   ↓
9. Timer fires: beginRoleReveal()
   ↓
10. Server: Change phase to "mayhem"
    ↓
11. Server: emitRoomState with roles visible
    ↓
12. Clients: Show role reveal animation
```

### Game Phase Progression

```
LOBBY
  ↓ (Host clicks "Start Game")
  ├─ All players ready → assign roles
REVEAL
  ↓ (3 second reveal timer)
MAYHEM
  ↓ (Players use powers, 20-30 seconds)
VOTING
  ↓ (Players submit votes, 30-60 seconds)
RESULTS
  ↓ (Show who voted for whom, determine winners)
LOBBY (can reset or end)
```

### Vote Submission Flow

```
1. Player: Selects target and confirms vote
   ↓
2. Client: "game:submit" event (targetSocketId)
   ↓
3. Server: Validate target is valid player
   ↓
4. Server: Store submission: player.submission = {value, submittedAt}
   ↓
5. Server: emitRoomState (other players see vote count update)
   ↓
6. When all players submitted or timer ends: endVoting()
   ↓
7. Server: Process votes, determine results
   ↓
8. Server: Change phase to "results"
   ↓
9. Server: emitRoomState with full vote details
   ↓
10. Clients: Show results (who voted for whom, eliminated player)
```

## State Management

### Room State Structure

```typescript
interface RoomState {
  // Identification
  roomCode: string; // Unique room identifier
  hostSocketId: string; // Who controls the room
  gameKey: "infiltration" | "odd_one_out";

  // Players
  players: Player[]; // Current active players
  pending: PendingPlayer[]; // Awaiting host approval
  maxPlayers: number;

  // Gameplay
  phase: Phase; // "lobby" | "reveal" | "mayhem" | "voting" | "results"
  currentRound: number; // Round counter (for timer guards)
  roundStartedAt: number; // Timestamp

  // Game Settings
  settings: {
    gameKey: string;
    requiresApproval: boolean;
    isLocked: boolean;
    maxPlayers: number;
    phaseDuration: number; // seconds per phase
    infiltrationOptions: {
      roles: RoleType[];
    };
  };

  // Results / Voting
  results?: {
    winner: string; // "infiltrator" | "civilians" | "none"
    votes: VoteRecord[];
    eliminated?: string; // socketId of eliminated
  };
}

interface Player {
  socketId: string;
  nickname: string;
  role?: RoleType;
  ready: boolean;
  roleAcknowledged: boolean;
  mayhemAcknowledged: boolean;
  submission?: {
    value: string; // socketId of vote target
    submittedAt: number;
  };
  powerUsed?: {
    power: PowerType;
    targetSocketId?: string;
  };
}
```

### Client Global State (Zustand)

Located in [apps/web/src/state/useAppStore.ts](apps/web/src/state/useAppStore.ts):

```typescript
interface AppState {
  // Current room (from server)
  room: RoomState | null;
  mySocketId: string | null;

  // Local UI state
  currentPage: PageType;
  nickname: string;
  roomCodeInput: string;

  // Actions
  setRoom: (room: RoomState) => void;
  setPage: (page: PageType) => void;
  // ... etc
}
```

When server emits `room:state`, the client updates the Zustand store, triggering React re-renders.

## Socket Event Categories

### Room Management (8 events)

| Event                     | Direction       | Purpose                       |
| ------------------------- | --------------- | ----------------------------- |
| `room:host`               | Client → Server | Create a new room             |
| `room:join`               | Client → Server | Join existing room            |
| `room:close`              | Client → Server | Host closes room              |
| `room:leave`              | Client → Server | Player leaves room            |
| `room:kick`               | Client → Server | Host removes player           |
| `room:approveJoin`        | Client → Server | Host approves pending join    |
| `room:setLocked`          | Client → Server | Host locks/unlocks room       |
| `room:setRequireApproval` | Client → Server | Host requires approval toggle |

### Game Control (7 events)

| Event                         | Direction       | Purpose                      |
| ----------------------------- | --------------- | ---------------------------- |
| `game:start`                  | Client → Server | Begin game                   |
| `game:reset`                  | Client → Server | Reset to lobby               |
| `game:select`                 | Client → Server | Choose game type             |
| `game:setDuration`            | Client → Server | Set phase duration           |
| `game:setMaxPlayers`          | Client → Server | Set player limit             |
| `game:setInfiltrationOptions` | Client → Server | Configure infiltration roles |
| `game:nextRound`              | Client → Server | Advance to next round        |

### Player Actions (4 events)

| Event            | Direction       | Purpose                       |
| ---------------- | --------------- | ----------------------------- |
| `game:setReady`  | Client → Server | Mark player ready/unready     |
| `game:ackRole`   | Client → Server | Acknowledge role after reveal |
| `game:usePower`  | Client → Server | Use role power on target      |
| `game:ackMayhem` | Client → Server | Acknowledge mayhem phase      |

### Submissions (1 event)

| Event         | Direction       | Purpose                   |
| ------------- | --------------- | ------------------------- |
| `game:submit` | Client → Server | Submit vote during voting |

### Server Broadcasts (Automatic)

| Event        | Direction            | Purpose            |
| ------------ | -------------------- | ------------------ |
| `room:state` | Server → All Clients | Updated room state |
| `error:*`    | Server → Client      | Error response     |

## Timer Management

### Phase Timers

Located in [apps/server/src/socket/roomActions.ts](apps/server/src/socket/roomActions.ts):

```typescript
function startPhaseTimer(
  io: Server,
  roomCode: string,
  phaseName: string,
  delayMs: number,
  callback: () => void
) {
  const room = rooms.get(roomCode);
  const roundId = room.currentRound; // Capture round

  setTimeout(() => {
    const updated = rooms.get(roomCode);

    // Guard: ignore if round changed or room closed
    if (!updated || updated.currentRound !== roundId) return;

    callback(); // Execute phase logic
  }, delayMs);
}

function clearPhaseTimer(roomCode: string) {
  // Clears any pending timers for this room
}
```

**Why Round Guards?**

- Prevents stale timers from old rounds firing
- Example: Host clicks "Reset" → new round starts → old timer fires → wrong logic

### How Phases Progress

1. **Host starts game** → phase = "reveal"
2. **Timer set** for 3000ms to transition to mayhem
3. **During timer:** Server emits room:state with roles
4. **Timer fires** → beginRoleReveal() → phase = "mayhem"
5. **New timer set** for mayhem duration
6. **Timer fires** → beginMayhem() → phase = "voting"
7. **Voting timer set**
8. **When all vote or timer fires** → endVoting() → phase = "results"

## Error Handling

### Server → Client Error Events

```typescript
socket.emit("error:forbidden", { message: "Only host can do this" });
socket.emit("error:invalid", { message: "Room not found" });
socket.emit("error:unauthorized", { message: "Not in room" });
socket.emit("error:bad_request", { message: "Invalid data" });
```

### Common Error Scenarios

| Scenario                     | Error       | Handler Response            |
| ---------------------------- | ----------- | --------------------------- |
| Non-host tries to start game | forbidden   | Reject, show message        |
| Room code doesn't exist      | invalid     | Reject join attempt         |
| Player submits invalid vote  | bad_request | Ignore submission           |
| Player disconnects           | (auto)      | Room cleanup, notify others |

## Scaling Considerations

### Current Limitations (Single Process)

✅ **Works well for:**

- Prototype/MVP (< 100 concurrent games)
- Small game sessions (2-8 players)
- Real-time responsiveness priority over scale

❌ **Doesn't work for:**

- Multiple server instances
- Persistent data needs
- > 1000 concurrent connections
- Load balancing across servers

### To Scale Beyond Single Process

Would need:

1. **Redis/Database:** Move room state out of process memory
2. **Socket.io Adapter:** Use Redis adapter for Socket.io
3. **Load Balancer:** Distribute connections across servers
4. **Session Store:** Track which room each player is in
5. **Event Queue:** If game logic becomes heavy

Current architecture is intentionally simple to keep MVP fast.

## Authentication & Security

### Current Implementation

- **No authentication:** Any client can join
- **Host authority:** Only room host (by socketId) can control game
- **No encryption:** WebSocket (not WSS)

### For Production, Consider:

- User authentication (JWT tokens)
- SSL/TLS (WSS) for WebSocket
- Rate limiting on room:join
- Input validation (all socket events)
- Room code obfuscation (currently plain)

## File Dependencies

### Critical Server Files

```
index.ts
  ↓ imports
registerHandlers.ts (imports all handlers)
  ├─ roomHandlers.ts
  ├─ gameHandlers.ts
  │  ├─ gamePhaseHandlers.ts (reveal, mayhem, voting logic)
  │  ├─ powerLogic.ts (role abilities)
  │  └─ validation.ts (input checks)
  ├─ lifecycleHandlers.ts
  ├─ roomActions.ts (emitRoomState, timers)
  └─ state/
     ├─ rooms.ts (room storage)
     ├─ types.ts (TypeScript types)
     └─ gameRules.ts (configuration)
```

### Critical Client Files

```
main.tsx (React entry)
  ↓ mounts
App.tsx
  ↓ routes to
HomePage.tsx (room selection)
  ├─ HostPage.tsx (host controls)
  └─ PlayerPage.tsx (game play)
    ├─ infiltration/ (game UI)
    └─ oddOneOut/ (game UI)

useAppStore.ts (Zustand store)
  ↑ used by all pages

socket.ts (Socket.io client)
  ← useSocketConnection.ts hook
```

---

For socket event details, see [\_API_REFERENCE.md](_API_REFERENCE.md).
