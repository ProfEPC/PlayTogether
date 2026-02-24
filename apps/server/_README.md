# Server - Architecture & Development

**TLDR:** Node.js + Express server overview. How to start it (port 3001). File structure breakdown. Key components explained (HTTP setup, 4 handler modules with all 21 events, room state management, state mutations, game phase logic, role powers, input validation). Common coding patterns. Step-by-step guide to add new handlers. Debugging strategies. Performance considerations. Testing checklist and troubleshooting solutions.

## Overview

The PlayTogether server is a Node.js + Express application that manages real-time multiplayer game sessions using WebSocket (Socket.io).

**Key Responsibility:** Hold transient in-memory room state and coordinate game phases and player actions.

## Starting the Server

```bash
cd apps/server
pnpm install
pnpm dev
```

Server runs on `http://localhost:3001` by default.

## File Structure

```
apps/server/src/
├── index.ts                     # Entry point: HTTP server + Socket.io setup
│
├── api/                         # REST API endpoints
│   └── characters.ts            # Character CRUD (file-based persistence)
│
├── constants/                   # Constants
│   ├── roles.ts                 # Role constants
│   └── socketEvents.ts          # Socket event names
│
├── socket/                      # Socket event handling
│   ├── registerHandlers.ts      # Orchestrator
│   ├── handlers/                # Handler modules
│   │   ├── roomHandlers.ts      # Room management (8 handlers)
│   │   ├── gameHandlers.ts      # Game + submissions (14 handlers)
│   │   └── lifecycleHandlers.ts # Connection lifecycle (1 handler)
│   ├── roomActions.ts           # State mutations + emitters
│   ├── gamePhaseHandlers.ts     # Phase logic (reveal, mayhem, voting)
│   ├── powerLogic.ts            # Role ability execution
│   └── validation.ts            # Input validation utilities
│
├── state/                       # Application state
│   ├── rooms.ts                 # Room creation + defaults
│   ├── types.ts                 # TypeScript interfaces
│   └── gameRules.ts             # Game configuration
│
├── utils/                       # Utilities
│   ├── logger.ts                # Logging
│   ├── roomCode.ts              # Room code normalization
│   └── time.ts                  # Time utilities
│
└── data/                        # Persisted data files
    └── characters.json          # Saved character database
```

## Key Components

### 1. HTTP Server Setup (index.ts)

**Responsibilities:**

- Create Express server
- Setup Socket.io
- Configure CORS
- Define root routes
- Start listening

**Key Code:**

```typescript
const app = express();
const io = new Server(app, {
  cors: { origin: "http://localhost:5173" },
});

io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
```

### 2. Socket Handlers (socket/handlers/)

The socket handlers are organized into 4 focused modules by domain. The main `registerHandlers.ts` acts as an orchestrator that imports and calls all handler registration functions on socket connection.

#### Handler Organization

**registerHandlers.ts (30 lines) - Orchestrator:**

```typescript
export function registerSocketHandlers(io: Server, socket: Socket) {
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerPlayerHandlers(io, socket);
  registerSubmissionHandlers(io, socket);
  registerLifecycleHandlers(io, socket);
}
```

#### Room Handlers (roomHandlers.ts - 264 lines)

**Purpose:** Room lifecycle and management operations.

**8 Handlers:**

- `room:host` - Host creates a new room
- `room:close` - Host closes the room
- `room:join` - Player joins an existing room
- `room:kick` - Host kicks a player from the room
- `room:approveJoin` - Host approves a pending join request
- `room:setRequireApproval` - Host toggles approval requirement
- `room:leave` - Player leaves the room
- `room:setLocked` - Host locks/unlocks the room

**Example:**

```typescript
export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on("room:host", (data) => {
    const code = data.gameKey;
    const room = createRoom(code, socket.id, data.settings);
    emitRoomState(io, code);
  });

  socket.on("room:join", (data) => {
    const room = rooms.get(data.roomCode);
    // Validate and add player
    emitRoomState(io, data.roomCode);
  });

  // ... 6 more handlers
}
```

#### Game Handlers (gameHandlers.ts - 432 lines)

**Purpose:** Game control, player actions, and submissions. Organized into 3 registration functions.

**Game Control (7 handlers):**

- `game:start` - Host starts the game (validates players ready)
- `game:reset` - Host resets the game to lobby phase
- `game:select` - Host selects the game type
- `game:setDuration` - Host sets phase duration in seconds
- `game:setMaxPlayers` - Host sets max player limit
- `game:setInfiltrationOptions` - Host sets infiltration game roles
- `game:nextRound` - Host advances to next round

**Player Actions (4 handlers):**

- `game:setReady` - Player toggles ready status
- `game:ackRole` - Player acknowledges their role (after reveal phase)
- `game:usePower` - Player uses a special role power
- `game:ackMayhem` - Player acknowledges mayhem phase

**Submissions (1 handler):**

- `game:submit` - Player submits a vote during voting phase

**Example:**

```typescript
export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("game:start", (data) => {
    const room = rooms.get(data.roomCode);
    if (!room.hostSocketId === socket.id) return; // Auth check

    // Assign roles, emit state
    emitRoomState(io, data.roomCode);
  });
  // ... 6 more game control handlers
}

export function registerPlayerHandlers(io: Server, socket: Socket) {
  socket.on("game:setReady", (data) => {
    // Update player ready status
    emitRoomState(io, roomCode);
  });
  // ... 3 more player handlers
}

export function registerSubmissionHandlers(io: Server, socket: Socket) {
  socket.on("game:submit", (data) => {
    // Record vote
    emitRoomState(io, roomCode);
  });
}
```

#### Lifecycle Handlers (lifecycleHandlers.ts - ~35 lines)

**Purpose:** Socket connection lifecycle management.

**1 Handler:**

- `disconnect` - Handles socket disconnection
  - Removes player from room
  - Cleans up room state if empty
  - Transfers host if needed
  - Emits updated room state

**Example:**

```typescript
export function registerLifecycleHandlers(io: Server, socket: Socket) {
  socket.on("disconnect", () => {
    // Find room with this player
    const room = findRoomWithPlayer(socket.id);
    if (!room) return;

    // Remove player
    room.players = room.players.filter((p) => p.socketId !== socket.id);

    // If host disconnected, transfer
    if (room.hostSocketId === socket.id && room.players.length > 0) {
      room.hostSocketId = room.players[0].socketId;
    }

    // Clean up or emit
    if (room.players.length === 0) {
      rooms.delete(room.roomCode);
    } else {
      emitRoomState(io, room.roomCode);
    }
  });
}
```

#### Handler Dependencies

All handlers import from:

- **`../roomActions`** - State mutations & broadcasting
  - `emitRoomState()` - Broadcasts updated room to all players
  - `startPhaseTimer()` - Initiates phase timers
  - `clearPhaseTimer()` - Stops phase timers
  - `cleanupRoom()` - Deletes room from state

- **`../gamePhaseHandlers`** - Game phase logic
  - `beginRoleReveal()` - Starts reveal phase
  - `beginMayhem()` - Starts mayhem phase
  - `beginVoting()` - Starts voting phase
  - `endVoting()` - Processes votes and shows results

- **`./powerLogic`** - Role power execution
  - `executePower()` - Handles role-specific abilities

- **`./validation`** - Input validation
  - `validateRoomCode()` - Room code format checks
  - `validateJoinData()` - Join request validation
  - `validateGameSettings()` - Game settings validation

- **`../state/rooms`** - Room storage
  - `rooms` Map - In-memory room storage

- **`../state/types`** - TypeScript interfaces
  - `RoomState`, `Player`, etc.

- **`../state/gameRules`** - Game configuration
  - `GAME_RULES` - Rules per game type
  - `GAME_WINNERS` - Outcome constants

### 3. Room State Management (state/rooms.ts)

**In-Memory Storage:**

```typescript
const rooms = new Map<string, RoomState>();

export function createRoom(
  code: string,
  hostSocketId: string,
  settings: RoomSettings,
): RoomState {
  const room: RoomState = {
    roomCode: code,
    hostSocketId,
    players: [],
    pending: [],
    phase: "lobby",
    currentRound: 0,
    // ... defaults
  };
  rooms.set(code, room);
  return room;
}
```

**No Database:**

- Rooms exist only in memory
- Server restart = all rooms disappear
- Scaling requires Redis/external state

### 4. Room Actions (socket/roomActions.ts)

**State Mutation Functions:**

```typescript
export function emitRoomState(io: Server, roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Send to all clients in room
  io.to(roomCode).emit("room:state", room);
}

export function startPhaseTimer(
  io: Server,
  roomCode: string,
  phaseName: string,
  delayMs: number,
  callback: () => void,
) {
  const room = rooms.get(roomCode);
  const roundId = room.currentRound;

  setTimeout(() => {
    const updated = rooms.get(roomCode);
    if (!updated || updated.currentRound !== roundId) return;
    callback();
  }, delayMs);
}

export function clearPhaseTimer(roomCode: string) {
  // Clear pending timers for this room
}
```

### 5. Game Phase Logic (socket/gamePhaseHandlers.ts)

**Phase Transitions:**

```typescript
export function beginRoleReveal(io: Server, roomCode: string) {
  const room = rooms.get(roomCode);
  room.phase = "reveal";
  emitRoomState(io, roomCode);

  startPhaseTimer(io, roomCode, "reveal", 3000, () => {
    beginMayhem(io, roomCode);
  });
}

export function beginMayhem(io: Server, roomCode: string) {
  const room = rooms.get(roomCode);
  room.phase = "mayhem";
  emitRoomState(io, roomCode);

  const duration = room.settings.phaseDuration * 1000;
  startPhaseTimer(io, roomCode, "mayhem", duration, () => {
    beginVoting(io, roomCode);
  });
}

export function beginVoting(io: Server, roomCode: string) {
  const room = rooms.get(roomCode);
  room.phase = "voting";
  emitRoomState(io, roomCode);

  const duration = room.settings.phaseDuration * 1000;
  startPhaseTimer(io, roomCode, "voting", duration, () => {
    endVoting(io, roomCode);
  });
}

export function endVoting(io: Server, roomCode: string) {
  const room = rooms.get(roomCode);

  // Count votes
  const voteCounts = new Map<string, number>();
  room.players.forEach((p) => {
    if (p.submission?.value) {
      voteCounts.set(
        p.submission.value,
        (voteCounts.get(p.submission.value) || 0) + 1,
      );
    }
  });

  // Determine eliminated player
  const eliminated = [...voteCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  // Store results
  room.results = {
    winner,
    votes: [
      /* ... */
    ],
    eliminated,
  };
  room.phase = "results";
  emitRoomState(io, roomCode);
}
```

### 6. Role Powers (socket/powerLogic.ts)

**Power Execution:**

```typescript
export function executePower(
  room: RoomState,
  sourcePlayer: Player,
  power: PowerType,
  target: Player,
): PowerResult {
  switch (power) {
    case "spy":
      return { revealed: target.role };
    case "engineer":
      return { protected: target.socketId };
    case "hacker":
      return { blocked: target.powerUsed };
    case "thief":
      return { stolen: target.role };
  }
}
```

### 7. Input Validation (socket/validation.ts)

```typescript
export function validateRoomCode(code: string): boolean {
  return /^[A-Z]{4,6}$/.test(code);
}

export function validateNickname(nickname: string): boolean {
  return nickname.length > 0 && nickname.length <= 50;
}

export function validateGameSettings(settings: RoomSettings): boolean {
  // Validate all settings
}
```

## Common Patterns

### Authorization Check (Host-Only)

```typescript
if (room.hostSocketId !== socket.id) {
  socket.emit("error:forbidden", { message: "Only host can do this" });
  return;
}
```

### Type Safety for Array Operations

```typescript
// ✅ Always type callback parameters
const player = room.players.find((p: any) => p.socketId === socket.id);

// ✅ Avoid implicit any
room.players.some((p: any) => !p.ready);
```

### Emitting State After Mutation

```typescript
// After ANY change to room state:
emitRoomState(io, roomCode);
```

### Guard Against Stale Timers

```typescript
const roundId = room.currentRound;

setTimeout(() => {
  const updated = rooms.get(roomCode);
  if (!updated || updated.currentRound !== roundId) return; // Guard

  // Safe to execute
}, delayMs);
```

## Adding a New Handler

### Step 1: Determine Category

Choose which handler file based on the event's purpose:

| Category        | File                                           | When to Use                                       |
| --------------- | ---------------------------------------------- | ------------------------------------------------- |
| Room Management | `roomHandlers.ts`                              | Creating, joining, closing rooms; player approval |
| Game Control    | `gameHandlers.ts` (registerGameHandlers)       | Starting, resetting, configuring game             |
| Player Actions  | `gameHandlers.ts` (registerPlayerHandlers)     | Ready status, role acknowledgment, powers, voting |
| Submissions     | `gameHandlers.ts` (registerSubmissionHandlers) | Vote/action submissions during game               |
| Lifecycle       | `lifecycleHandlers.ts`                         | Socket disconnect, connection cleanup             |

### Step 2: Implement Handler

**Example: Add a new room setting event**

```typescript
// In roomHandlers.ts
export function registerRoomHandlers(io: Server, socket: Socket) {
  // ... existing handlers ...

  socket.on("room:setDescription", (data: { description: string }) => {
    const roomCode = data.roomCode.trim().toUpperCase();
    const room = rooms.get(roomCode);

    // Validate
    if (!room) {
      socket.emit("error:invalid", { message: "Room not found" });
      return;
    }

    if (room.hostSocketId !== socket.id) {
      socket.emit("error:forbidden", { message: "Only host can do this" });
      return;
    }

    // Mutate state
    room.description = data.description;

    // Broadcast
    emitRoomState(io, roomCode);
  });
}
```

### Step 3: Follow the Pattern

Every handler should follow this structure:

1. **Normalize inputs** (trim room codes, validate format)
2. **Find resource** (look up room from code/socketId)
3. **Validate existence** (return error if not found)
4. **Check authorization** (host-only? player in room?)
5. **Validate inputs** (use validation functions)
6. **Mutate state** (modify room/player data)
7. **Emit state** (broadcast via `emitRoomState()`)
8. **Handle errors** (emit appropriate error event)

### Step 4: Update Client

Mirror the event on the web client in a React component:

```typescript
// In a React component
socket.emit("room:setDescription", {
  description: "New description",
});
```

### Step 5: Update Documentation

Update [\_API_REFERENCE.md](../../_API_REFERENCE.md) with the new socket event details.

### Step 6: Test Locally

- Host connects and creates room
- Emit new event from client
- Verify state broadcasts correctly
- Check error handling (invalid inputs, non-host access)

## Finding a Specific Handler

**To locate a handler quickly:**

1. Check the event name prefix:
   - `room:*` → [roomHandlers.ts](./handlers/roomHandlers.ts)
   - `game:*` → [gameHandlers.ts](./handlers/gameHandlers.ts)
   - `disconnect` → [lifecycleHandlers.ts](./handlers/lifecycleHandlers.ts)

2. Search that file for `socket.on("event:name"`

3. Example: Find `game:setReady` handler
   - It's a `game:*` event → look in gameHandlers.ts
   - Inside `registerPlayerHandlers` function
   - Contains `socket.on("game:setReady", (data) => { ... })`

## Common Patterns

### Authorization Check (Host-Only)

### Enable Detailed Logging

Add `console.log()` in handlers:

```typescript
socket.on("game:start", (data) => {
  console.log(`[game:start] ${socket.id} in room ${data.roomCode}`);
  // ...
});
```

### Inspect Room State

```typescript
const room = rooms.get(roomCode);
console.log("Current room state:", room);
```

### Monitor Socket Events

```typescript
// In index.ts after io setup:
io.use((socket, next) => {
  const origEmit = socket.emit;
  socket.emit = function (...args) {
    if (args[0].startsWith("room:") || args[0].startsWith("game:")) {
      console.log(`[EMIT] ${args[0]}`, args[1]);
    }
    return origEmit.apply(socket, args);
  };
  next();
});
```

## Performance Considerations

### In-Memory Limitations

- Each room ≈ 1KB overhead (players, state, timers)
- 1000 rooms ≈ 1MB RAM
- No database queries (instant)
- Linear search through room list is fast for MVP

### Optimization Points (If Needed)

1. **Room Expiration:** Auto-delete empty rooms after X minutes
2. **Event Debouncing:** Limit rapid room:state broadcasts
3. **Caching:** Cache frequently accessed game rules
4. **Worker Threads:** Move heavy computation to workers (if added later)

## Testing Checklist

- [ ] Can host create room
- [ ] Can players join with valid code
- [ ] Can host approve pending players
- [ ] Can start game with all ready
- [ ] Roles assigned randomly
- [ ] Phase transitions on timer
- [ ] Powers can be used in mayhem
- [ ] Votes counted correctly
- [ ] Results shown accurately
- [ ] Can reset and play again
- [ ] Disconnected player removed
- [ ] Host transfer works
- [ ] Empty room deleted

## Build & Deploy

### Build

```bash
pnpm build
# Compiles TypeScript to lib/ directory
```

### Run Production

```bash
node lib/index.js
```

### Environment Variables

```
PORT=3001              # Server port
CORS_ORIGIN=http://localhost:5173  # Client URL
NODE_ENV=production    # Optionally set for optimization
```

## Troubleshooting

**Socket connections failing?**

- Check CORS_ORIGIN in index.ts matches client URL
- Verify port 3001 is available
- Check browser console for errors

**Room not found after join?**

- Verify room code is being normalized (uppercase, trimmed)
- Check room exists in `rooms` Map
- Log room.get(code) to debug

**State not broadcasting?**

- Ensure emitRoomState() called after mutations
- Verify socket joined room with socket.join(roomCode)
- Check io.to(roomCode).emit() syntax

**Timers not firing?**

- Verify roundId matches (not a stale timer)
- Check callback actually executes
- Log setTimeout calls if needed

---

For socket event details, see [\_API_REFERENCE.md](../_API_REFERENCE.md).
