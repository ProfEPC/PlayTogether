# PlayTogether - API Reference

**TLDR:** Complete reference for all 21 socket events organized by category (room management, game control, player actions, submissions, lifecycle). For each event: client payload, server response, broadcast behavior, validation, and error codes. Type definitions for RoomState, Player, and related interfaces. Complete example game flow at the end.

## Socket Events Reference

All socket communication happens through named events. This document catalogs every socket event used in PlayTogether.

### Legend

- **→** Client sends to server
- **←** Server sends to client(s)
- **⇄** Bidirectional (response expected)

---

## Room Management Events

### room:host (→)

**Host creates a new room**

**Client sends:**

```typescript
socket.emit("room:host", {
  gameKey: "infiltration" | "odd_one_out",
  settings: {
    requiresApproval?: boolean,
    maxPlayers?: number,
    phaseDuration?: number,
    infiltrationOptions?: {
      roles: RoleType[]
    }
  }
});
```

**Server responds:**

```typescript
socket.emit("room:state", {
  roomCode: "ABC123",
  hostSocketId: socket.id,
  players: [{ socketId, nickname, ready }],
  phase: "lobby",
  gameKey: "infiltration",
  settings: {
    /* ... */
  },
  // ... full RoomState
});
```

**Broadcast:**

- All clients in room receive `room:state`

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Invalid settings" });
```

---

### room:join (→)

**Player joins an existing room**

**Client sends:**

```typescript
socket.emit("room:join", {
  roomCode: "ABC123",
  nickname: "Alice",
});
```

**Server responds:**

- If `requiresApproval: false`: Player added to room immediately
- If `requiresApproval: true`: Player added to room.pending

```typescript
socket.emit("room:state", {
  // Updated room with player added
  players: [, /* ... */ { socketId, nickname, ready: false }],
  pending: [
    /* if approval needed */
  ],
});
```

**Broadcast:**

- All clients in room receive `room:state`

**Errors:**

```typescript
socket.emit("error:invalid", { message: "Room not found" });
socket.emit("error:bad_request", { message: "Room is full" });
socket.emit("error:bad_request", { message: "Room is locked" });
socket.emit("error:bad_request", { message: "Invalid nickname" });
```

---

### room:leave (→)

**Player leaves the room**

**Client sends:**

```typescript
socket.emit("room:leave");
```

**Server responds:**

- Player removed from room
- If player was host and other players remain: host transferred to another player
- If player was host and only one left: room closed

```typescript
socket.emit("room:state", {
  // Player removed
  players: [
    /* minus leaving player */
  ],
});
```

**Broadcast:**

- All remaining clients receive `room:state`

---

### room:close (→)

**Host closes the room (all players leave)**

**Client sends:**

```typescript
socket.emit("room:close");
```

**Authorization:**

- Only room host can close

**Server response:**

```typescript
socket.emit("room:closed", { roomCode: "ABC123" });
```

**Broadcast:**

- All clients in room receive `room:closed` event
- Room deleted from server

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can close room" });
```

---

### room:kick (→)

**Host removes a player from the room**

**Client sends:**

```typescript
socket.emit("room:kick", {
  socketId: "target-socket-id",
});
```

**Authorization:**

- Only room host can kick

**Server response:**

- Target player's socket emits `room:closed` or removed
- Other players receive `room:state`

```typescript
socket.emit("room:state", {
  players: [
    /* minus kicked player */
  ],
});
```

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can kick" });
socket.emit("error:invalid", { message: "Player not found" });
```

---

### room:approveJoin (→)

**Host approves a pending player (when `requiresApproval: true`)**

**Client sends:**

```typescript
socket.emit("room:approveJoin", {
  socketId: "pending-player-socket-id",
});
```

**Authorization:**

- Only room host can approve

**Server response:**

- Player moves from `room.pending` to `room.players`

```typescript
socket.emit("room:state", {
  players: [
    /* now includes approved player */
  ],
  pending: [
    /* minus approved player */
  ],
});
```

**Broadcast:**

- All clients receive `room:state`

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can approve" });
socket.emit("error:invalid", { message: "Player not pending" });
```

---

### room:setRequireApproval (→)

**Host toggles whether new joins require approval**

**Client sends:**

```typescript
socket.emit("room:setRequireApproval", {
  requiresApproval: true | false,
});
```

**Authorization:**

- Only room host

**Server response:**

```typescript
socket.emit("room:state", {
  settings: {
    requiresApproval: true | false,
  },
});
```

**Broadcast:**

- All clients receive `room:state`

---

### room:setLocked (→)

**Host locks/unlocks the room to new joins**

**Client sends:**

```typescript
socket.emit("room:setLocked", {
  isLocked: true | false,
});
```

**Authorization:**

- Only room host

**Server response:**

```typescript
socket.emit("room:state", {
  settings: {
    isLocked: true | false,
  },
});
```

**Effect:**

- If locked: new `room:join` requests are rejected
- If unlocked: new joins allowed

**Broadcast:**

- All clients receive `room:state`

---

## Game Control Events

### game:select (→)

**Host selects the game type**

**Client sends:**

```typescript
socket.emit("game:select", {
  gameKey: "infiltration" | "odd_one_out",
});
```

**Authorization:**

- Only room host
- Can only change in lobby phase

**Server response:**

```typescript
socket.emit("room:state", {
  gameKey: "infiltration",
  settings: {
    infiltrationOptions: { roles: ["civilian", "infiltrator"] },
  },
});
```

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can select game" });
socket.emit("error:bad_request", { message: "Invalid game type" });
```

---

### game:setMaxPlayers (→)

**Host sets the maximum number of players**

**Client sends:**

```typescript
socket.emit("game:setMaxPlayers", {
  maxPlayers: 6,
});
```

**Validation:**

- Must be between MIN and MAX for selected game type
- Must be >= current player count

**Server response:**

```typescript
socket.emit("room:state", {
  settings: {
    maxPlayers: 6,
  },
});
```

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Invalid max players" });
socket.emit("error:bad_request", { message: "Exceeds game type limit" });
```

---

### game:setDuration (→)

**Host sets the phase duration in seconds**

**Client sends:**

```typescript
socket.emit("game:setDuration", {
  phaseName: "mayhem" | "voting", // reveal is fixed
  durationSeconds: 30,
});
```

**Validation:**

- Duration must be 5-120 seconds

**Server response:**

```typescript
socket.emit("room:state", {
  settings: {
    phaseDuration: 30,
  },
});
```

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Duration out of range" });
```

---

### game:setInfiltrationOptions (→)

**Host configures roles for Infiltration game**

**Client sends:**

```typescript
socket.emit("game:setInfiltrationOptions", {
  roles: ["civilian", "infiltrator", "spy", "engineer"],
});
```

**Validation:**

- Must include at least 1 civilian and 1 infiltrator
- All roles must be valid
- Can only configure in lobby

**Server response:**

```typescript
socket.emit("room:state", {
  settings: {
    infiltrationOptions: {
      roles: ["civilian", "infiltrator", "spy", "engineer"],
    },
  },
});
```

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Invalid role list" });
socket.emit("error:bad_request", {
  message: "Must include infiltrator and civilian",
});
```

---

### game:setReady (→)

**Player marks themselves as ready (or unready)**

**Client sends:**

```typescript
socket.emit("game:setReady", {
  ready: true,
});
```

**Server response:**

```typescript
socket.emit("room:state", {
  players: [
    { socketId: "me", nickname: "Alice", ready: true },
    // ...
  ],
});
```

**Broadcast:**

- All clients in room receive `room:state`

---

### game:start (→)

**Host starts the game**

**Client sends:**

```typescript
socket.emit("game:start");
```

**Authorization:**

- Only room host

**Validation:**

- All players must be ready
- Minimum players met
- In lobby phase

**Server actions:**

1. Assign roles to players
2. Set phase to "reveal"
3. Start reveal timer (3 seconds)
4. Emit room:state

```typescript
socket.emit("room:state", {
  phase: "reveal",
  currentRound: 0,
  players: [
    { socketId, nickname, role: "civilian", roleAcknowledged: false },
    { socketId, nickname, role: "infiltrator", roleAcknowledged: false },
    // ...
  ],
});
```

**Broadcast:**

- All clients receive `room:state` (with roles)
- UI shows role reveal animation
- After 3s: phase changes to "mayhem"

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can start" });
socket.emit("error:bad_request", { message: "Not all players ready" });
socket.emit("error:bad_request", { message: "Not enough players" });
```

---

### game:reset (→)

**Host resets game to lobby**

**Client sends:**

```typescript
socket.emit("game:reset");
```

**Authorization:**

- Only room host

**Server actions:**

1. Clear all player roles, submissions, powers
2. Clear timers
3. Reset to lobby phase
4. Keep players in room

```typescript
socket.emit("room:state", {
  phase: "lobby",
  players: [
    { socketId, nickname, ready: false, role: undefined },
    // ...
  ],
});
```

**Errors:**

```typescript
socket.emit("error:forbidden", { message: "Only host can reset" });
```

---

### game:nextRound (→)

**Host advances to next round (after results)**

**Client sends:**

```typescript
socket.emit("game:nextRound");
```

**Authorization:**

- Only room host
- Only after results phase

**Server actions:**

1. Increment round counter
2. Reset player submissions and powers
3. Return to lobby (or start new round)

```typescript
socket.emit("room:state", {
  phase: "lobby",
  currentRound: 1,
  players: [
    /* cleared submissions */
  ],
});
```

---

## Player Action Events

### game:ackRole (→)

**Player acknowledges their role after reveal**

**Client sends:**

```typescript
socket.emit("game:ackRole", {
  seen: true, // or false
});
```

**Server actions:**

1. Mark player `roleAcknowledged: true`
2. Check if all players acknowledged
3. If all acknowledged: trigger mayhem phase early

```typescript
socket.emit("room:state", {
  phase: "mayhem", // if all acknowledged
  players: [
    { socketId, roleAcknowledged: true },
    // ...
  ],
});
```

**Broadcast:**

- All clients receive `room:state`

---

### game:usePower (→)

**Player uses their role's special power on a target**

**Client sends:**

```typescript
socket.emit("game:usePower", {
  power: "spy" | "engineer" | "hacker" | "thief",
  targetSocketId: "target-socket-id",
});
```

**Validation:**

- Player must have the role
- Target must be valid player
- Can only use once per round
- Only during mayhem phase

**Server actions:**

1. Store power usage: `player.powerUsed = { power, targetSocketId }`
2. Don't resolve yet (collect all powers)
3. At end of mayhem: resolve all powers simultaneously

```typescript
socket.emit("room:state", {
  players: [
    { socketId: "me", powerUsed: { power: "spy", targetSocketId: "target" } },
    // ...
  ],
});
```

**Broadcast:**

- Don't reveal who used power on whom to others (keeps it secret)
- Power user sees confirmation

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Invalid power for your role" });
socket.emit("error:bad_request", { message: "Already used power this round" });
socket.emit("error:bad_request", { message: "Invalid target" });
socket.emit("error:bad_request", { message: "Wrong game phase" });
```

---

### game:ackMayhem (→)

**Player acknowledges the mayhem phase (ready to vote)**

**Client sends:**

```typescript
socket.emit("game:ackMayhem", {
  acknowledged: true,
});
```

**Server actions:**

1. Mark `player.mayhemAcknowledged: true`
2. If all acknowledged: end mayhem early, start voting

```typescript
socket.emit("room:state", {
  phase: "voting", // if all acknowledged
  players: [
    /* updated */
  ],
});
```

---

### game:submit (→)

**Player submits their vote during voting phase**

**Client sends:**

```typescript
socket.emit("game:submit", {
  vote: "target-socket-id" | "none", // socketId of voted player or "none"
});
```

**Validation:**

- Player in voting phase
- Vote target is valid player or "none"
- Only one submission per player per vote

**Server actions:**

1. Store vote: `player.submission = { value: targetSocketId, submittedAt: Date.now() }`
2. Check if all players voted
3. If all voted: end voting early, show results

```typescript
socket.emit("room:state", {
  players: [
    { socketId, submission: { value: "target-id", submittedAt: 123456 } },
    // ...
  ],
});
```

**Broadcast:**

- All clients see vote count (but not who voted for whom) during voting
- After voting ends: full results revealed

**Errors:**

```typescript
socket.emit("error:bad_request", { message: "Invalid vote target" });
socket.emit("error:bad_request", { message: "Wrong game phase" });
socket.emit("error:bad_request", { message: "Already submitted vote" });
```

---

## Server Broadcast Events

### room:state (←)

**Server broadcasts updated room state to all clients in room**

This is the most common event. Emitted after ANY room mutation:

```typescript
socket.emit("room:state", {
  // Room identification
  roomCode: "ABC123",
  hostSocketId: "host-socket-id",
  gameKey: "infiltration",

  // Players
  players: [
    {
      socketId: "player-1",
      nickname: "Alice",
      ready: true,
      role: "civilian", // only if in game
      roleAcknowledged: false,
      mayhemAcknowledged: false,
      submission: {
        value: "player-2-id", // only if voted
        submittedAt: 1234567890,
      },
      powerUsed: {
        // only if used power
        power: "spy",
        targetSocketId: "player-2-id",
      },
    },
    // ... more players
  ],

  // Pending players (if approval required)
  pending: [{ socketId, nickname }],

  // Game state
  phase: "voting",
  currentRound: 0,
  roundStartedAt: 1234567890,

  // Settings
  settings: {
    requiresApproval: false,
    isLocked: false,
    maxPlayers: 6,
    phaseDuration: 60,
    infiltrationOptions: {
      roles: ["civilian", "infiltrator", "spy"],
    },
  },

  // Results (only when phase = "results")
  results: {
    winner: "civilians",
    eliminated: "player-3-id",
    votes: [
      { voterId: "player-1", targetId: "player-3-id" },
      { voterId: "player-2", targetId: "player-3-id" },
      // ...
    ],
  },
});
```

**When emitted:**

- After room:join
- After game:start
- After phase changes
- After vote submission
- After power usage
- After any setting change

---

### room:closed (←)

**Room has been closed by host or became empty**

```typescript
socket.emit("room:closed", {
  roomCode: "ABC123",
  reason: "host_closed" | "empty" | "timeout",
});
```

**When emitted:**

- Host calls room:close
- All players leave
- Room timeout (if implemented)

---

## Error Events

### error:\* (←)

Server sends error events to inform client of problems:

```typescript
// Generic bad request
socket.emit("error:bad_request", {
  message: "Description of what went wrong",
});

// Authorization denied
socket.emit("error:forbidden", {
  message: "Only host can do this",
});

// Resource not found
socket.emit("error:invalid", {
  message: "Room not found",
});

// Authentication failed
socket.emit("error:unauthorized", {
  message: "Not authenticated",
});
```

---

## Socket Connection Lifecycle

### disconnect (built-in)

**Client disconnects or connection lost**

**Server actions:**

1. Remove player from room
2. If player was host and others remain: transfer host
3. If room now empty: delete room
4. Broadcast updated room:state to remaining players

```typescript
socket.on("disconnect", () => {
  // Server-side cleanup happens automatically
  // Remaining players get room:state update
});
```

---

## Type Definitions

### Room State Types

```typescript
interface RoomState {
  roomCode: string;
  hostSocketId: string;
  gameKey: "infiltration" | "odd_one_out";
  players: Player[];
  pending: PendingPlayer[];
  maxPlayers: number;
  phase: "lobby" | "reveal" | "mayhem" | "voting" | "results";
  currentRound: number;
  roundStartedAt: number;
  settings: RoomSettings;
  results?: GameResults;
}

interface Player {
  socketId: string;
  nickname: string;
  role?: RoleType;
  ready: boolean;
  roleAcknowledged: boolean;
  mayhemAcknowledged: boolean;
  submission?: { value: string; submittedAt: number };
  powerUsed?: { power: PowerType; targetSocketId?: string };
}

interface PendingPlayer {
  socketId: string;
  nickname: string;
  requestedAt: number;
}

interface RoomSettings {
  requiresApproval: boolean;
  isLocked: boolean;
  maxPlayers: number;
  phaseDuration: number;
  infiltrationOptions: {
    roles: RoleType[];
  };
}

type RoleType =
  | "civilian"
  | "infiltrator"
  | "spy"
  | "engineer"
  | "hacker"
  | "thief";
type PowerType = "spy" | "engineer" | "hacker" | "thief";
```

---

## Example Flows

### Complete Game Session

```
1. Player 1 (Host): socket.emit("room:host", {...})
   → Gets room:state with roomCode="ABC123"

2. Player 2: socket.emit("room:join", {roomCode: "ABC123", nickname: "Bob"})
   → All get room:state with 2 players

3. Player 1: socket.emit("game:setInfiltrationOptions", {roles: ["civilian", "infiltrator"]})
   → All get room:state with new options

4. Player 1,2: socket.emit("game:setReady", {ready: true})
   → Updates room:state with ready status

5. Player 1: socket.emit("game:start", {})
   → Roles assigned, phase="reveal"
   → All get room:state (with roles)
   → 3s timer automatically advances to mayhem

6. Player 2: socket.emit("game:usePower", {power: "spy", targetSocketId: player1})
   → Records power usage

7. Player 1,2: socket.emit("game:ackMayhem", {acknowledged: true})
   → Phase auto-advances to "voting"

8. Player 1,2: socket.emit("game:submit", {vote: "player2id"})
   → All votes in: phase="results"
   → Broadcast room:state with results

9. Player 1: socket.emit("game:nextRound", {})
   → Phase returns to "lobby", ready statuses reset
```

---

For implementation examples, see handler files in [apps/server/src/socket/handlers/](apps/server/src/socket/handlers/).
