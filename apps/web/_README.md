# Web Client - Architecture & Development

**TLDR:** React + Vite + Zustand client overview. How to start it (port 5173). File structure breakdown. Key components explained (React entry, Zustand global state, socket connection setup, page components, feature modules, custom hooks, socket client config). Common coding patterns and socket event examples. Building for production. Debugging strategies. Type safety approach. Performance optimization tips. Testing checklist and troubleshooting solutions.

## Overview

The PlayTogether web client is a React + Vite application that provides a real-time UI for multiplayer game sessions.

**Key Responsibility:** Display game state, handle user interactions, and maintain socket connection to server.

## Starting the Client

```bash
cd apps/web
pnpm install
pnpm dev
```

Web UI runs on `http://localhost:5173` by default (Vite dev server).

## File Structure

```
apps/web/src/
├── main.tsx                    # React entry point
├── App.tsx                     # Main router + provider setup
│
├── pages/                      # Page-level components
│   ├── HomePage.tsx            # Room code input, game selection
│   ├── HostPage.tsx            # Host game configuration
│   ├── PlayerPage.tsx          # Active game (shows current phase)
│   └── AdminPage.tsx           # Dev admin panel (testing)
│
├── features/                   # Feature modules (by game)
│   ├── infiltration/           # Infiltration game UI components
│   │   ├── RoleReveal.tsx      # Show role to player
│   │   ├── MayhemPhase.tsx     # Use power interface
│   │   ├── VotingPhase.tsx     # Vote on target
│   │   └── Results.tsx         # Show results
│   └── oddOneOut/              # Odd One Out game UI
│       ├── ItemDisplay.tsx
│       ├── VotingPhase.tsx
│       └── Scoring.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useSocketConnection.ts  # Socket setup, auth, listeners
│   └── useNow.ts              # Real-time clock for UI
│
├── components/                 # Shared UI components
│   └── Panel.tsx              # Reusable panel component
│
├── lib/                        # Utilities
│   ├── socket.ts              # Socket.io client configuration
│   └── characterPersistence.ts # Character save/load API
│
├── state/                      # Global state management
│   └── useAppStore.ts         # Zustand store (room, UI state)
│
├── utils/                      # Utility functions
│   ├── characterCreation/     # Character design utilities
│   │   ├── filters.ts         # Cascading dropdown filters
│   │   ├── validators.ts      # Validation & blocker logic
│   │   ├── helpers.ts         # Slot management
│   │   └── powerCompatibility.ts # Power compatibility checks
│   └── powerSorting.ts        # Power slot sorting
│
├── types/                      # TypeScript definitions
│   ├── characterCreation.ts   # Character types
│   ├── room.ts                # Room, Player, Phase types
│   └── socket.ts              # Socket event payloads
│
├── constants/                  # Static constants
│   ├── infiltrationPowers.ts  # Re-export all powers
│   ├── infiltrationPowers/    # Modular power definitions (46 total)
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── learn.ts (16)
│   │   ├── reveal.ts (4)
│   │   ├── swap.ts (7)
│   │   ├── alter.ts (8)
│   │   ├── tamper.ts (7)
│   │   ├── condition.ts (2)
│   │   └── settingsNone.ts (2)
│   ├── gameRules.ts           # Game rules and limits
│   └── fix_indices.ps1        # [DEPRECATED]
│
├── config/                     # Configuration files (deprecated, now using API)
│
├── constants/                  # Static values
│   └── gameRules.ts           # Game rules (mirrors server)
│
└── assets/                     # Images, static files
```

## Key Components

### 1. React Entry & Routing (main.tsx, App.tsx)

**main.tsx:**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**App.tsx:**

```typescript
import { useEffect } from "react";
import { useAppStore } from "./state/useAppStore";
import { useSocketConnection } from "./hooks/useSocketConnection";

function App() {
  const { currentPage } = useAppStore();

  // Setup socket connection on mount
  useSocketConnection();

  return (
    <div className="app">
      {currentPage === "home" && <HomePage />}
      {currentPage === "host" && <HostPage />}
      {currentPage === "player" && <PlayerPage />}
    </div>
  );
}

export default App;
```

### 2. Global State Management (useAppStore.ts)

**Zustand Store:**

```typescript
import { create } from "zustand";

interface AppState {
  // Room state (from server)
  room: RoomState | null;
  mySocketId: string | null;

  // Local UI state
  currentPage: "home" | "host" | "player" | "admin";
  nickname: string;
  roomCodeInput: string;

  // Actions
  setRoom: (room: RoomState) => void;
  setPage: (page: PageType) => void;
  setNickname: (name: string) => void;

  // ... more actions
}

export const useAppStore = create<AppState>((set) => ({
  room: null,
  mySocketId: null,
  currentPage: "home",
  nickname: "",
  roomCodeInput: "",

  setRoom: (room) => set({ room }),
  setPage: (page) => set({ currentPage: page }),
  setNickname: (name) => set({ nickname: name }),

  // ... more
}));
```

**Usage in Components:**

```typescript
function HomePage() {
  const { nickname, setNickname, roomCodeInput, setRoomCodeInput } =
    useAppStore();

  return (
    <input
      value={nickname}
      onChange={(e) => setNickname(e.target.value)}
      placeholder="Enter nickname"
    />
  );
}
```

### 3. Socket Connection Setup (useSocketConnection.ts)

**Custom Hook:**

```typescript
import { useEffect } from 'react'
import { socket } from '../lib/socket'
import { useAppStore } from '../state/useAppStore'

export function useSocketConnection() {
  const { setRoom, setPage, mySocketId } = useAppStore()

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    // Listen for room:state updates
    socket.on('room:state', (room: RoomState) => {
      setRoom(room)

      // Auto-navigate based on room state
      if (room.phase === 'lobby') {
        setPage('host' or 'player')
      } else {
        setPage('player')
      }
    })

    // Listen for errors
    socket.on('error:*', (error) => {
      console.error('Error:', error.message)
      // Show error message to user
    })

    // Cleanup
    return () => {
      socket.off('room:state')
      socket.off('error:*')
    }
  }, [])
}
```

### 4. Socket Client Configuration (lib/socket.ts)

```typescript
import { io } from "socket.io-client";

export const socket = io("http://localhost:3001", {
  autoConnect: false, // Manually connect on component mount
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

### 5. Page Components

#### HomePage.tsx

- Displays room code input
- Game selection buttons
- Join/Host options

```typescript
function HomePage() {
  const { setPage, setNickname, roomCodeInput, setRoomCodeInput } =
    useAppStore();

  const handleHost = () => {
    socket.emit("room:host", { gameKey: "infiltration" });
    setPage("host");
  };

  const handleJoin = () => {
    socket.emit("room:join", {
      roomCode: roomCodeInput,
      nickname,
    });
    setPage("player");
  };

  return (
    <div className="home-page">
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Enter your name"
      />

      <input
        value={roomCodeInput}
        onChange={(e) => setRoomCodeInput(e.target.value)}
        placeholder="Room code"
      />

      <button onClick={handleJoin}>Join Game</button>
      <button onClick={handleHost}>Host Game</button>
    </div>
  );
}
```

#### HostPage.tsx

- Game type selector
- Role configuration (Infiltration)
- Player list
- Start game button

```typescript
function HostPage() {
  const { room } = useAppStore();

  const handleStart = () => {
    socket.emit("game:start");
  };

  const handleSetRoles = (roles: string[]) => {
    socket.emit("game:setInfiltrationOptions", { roles });
  };

  return (
    <div className="host-page">
      <h2>Room Code: {room?.roomCode}</h2>

      <div className="players-list">
        {room?.players.map((p) => (
          <div key={p.socketId}>
            {p.nickname} {p.ready ? "✓" : "○"}
          </div>
        ))}
      </div>

      <div className="settings">
        <label>
          Max Players:
          <input
            type="number"
            value={room?.settings.maxPlayers}
            onChange={(e) =>
              socket.emit("game:setMaxPlayers", {
                maxPlayers: parseInt(e.target.value),
              })
            }
          />
        </label>

        <label>
          Require Approval:
          <input
            type="checkbox"
            checked={room?.settings.requiresApproval}
            onChange={(e) =>
              socket.emit("room:setRequireApproval", {
                requiresApproval: e.target.checked,
              })
            }
          />
        </label>
      </div>

      <button onClick={handleStart} disabled={notAllReady()}>
        Start Game
      </button>
    </div>
  );
}
```

#### PlayerPage.tsx

- Displays current game phase
- Conditionally renders phase-specific UI
- Emits player actions (ready, power, vote)

```typescript
function PlayerPage() {
  const { room } = useAppStore();

  return (
    <div className="player-page">
      <h2>{room?.roomCode}</h2>

      {room?.phase === "lobby" && <LobbyPhase />}
      {room?.phase === "reveal" && <RoleReveal />}
      {room?.phase === "mayhem" && <MayhemPhase />}
      {room?.phase === "voting" && <VotingPhase />}
      {room?.phase === "results" && <Results />}
    </div>
  );
}
```

### 6. Feature-Specific UI (features/infiltration/)

**RoleReveal.tsx**

```typescript
export function RoleReveal() {
  const { room, mySocketId } = useAppStore();
  const myPlayer = room?.players.find((p) => p.socketId === mySocketId);

  return (
    <div className="role-reveal">
      <h1>Your Role Is...</h1>
      <div className="role-card">
        <h2>{myPlayer?.role?.toUpperCase()}</h2>
        <p>{getRoleDescription(myPlayer?.role)}</p>
      </div>

      <button onClick={() => socket.emit("game:ackRole", { seen: true })}>
        I've Read My Role
      </button>
    </div>
  );
}
```

**MayhemPhase.tsx**

```typescript
export function MayhemPhase() {
  const { room, mySocketId } = useAppStore();
  const myPlayer = room?.players.find((p) => p.socketId === mySocketId);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  if (!myPlayer?.role || !hasPower(myPlayer.role)) {
    return <div>No power. Waiting for voting...</div>;
  }

  return (
    <div className="mayhem-phase">
      <h2>Use Your Power: {myPlayer.role}</h2>

      <div className="targets">
        {room?.players
          .filter((p) => p.socketId !== mySocketId)
          .map((p) => (
            <button
              key={p.socketId}
              onClick={() => setSelectedTarget(p.socketId)}
              className={selectedTarget === p.socketId ? "selected" : ""}
            >
              {p.nickname}
            </button>
          ))}
      </div>

      <button
        onClick={() => {
          socket.emit("game:usePower", {
            power: myPlayer.role,
            targetSocketId: selectedTarget,
          });
        }}
        disabled={!selectedTarget}
      >
        Use Power on {selectedTarget}
      </button>
    </div>
  );
}
```

**VotingPhase.tsx**

```typescript
export function VotingPhase() {
  const { room, mySocketId } = useAppStore();
  const myPlayer = room?.players.find((p) => p.socketId === mySocketId);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  return (
    <div className="voting-phase">
      <h2>Vote to Eliminate</h2>

      <div className="players">
        {room?.players
          .filter((p) => p.socketId !== mySocketId)
          .map((p) => (
            <button
              key={p.socketId}
              onClick={() => setSelectedVote(p.socketId)}
              className={selectedVote === p.socketId ? "selected" : ""}
            >
              {p.nickname}
            </button>
          ))}
      </div>

      <button
        onClick={() => {
          socket.emit("game:submit", { vote: selectedVote });
        }}
        disabled={!selectedVote || myPlayer?.submission}
      >
        Submit Vote
      </button>
    </div>
  );
}
```

## Component Architecture

The web client follows a feature-based structure. Shared UI primitives live in `components/`, page-level containers in `pages/`, and game-specific feature components in `features/` or `components/<PageName>/`.

### Shared Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `Panel.tsx` | Reusable bordered panel container used throughout game phases |
| `ThemesAdmin.tsx` | Admin UI for managing game themes (create, edit, load) |

### PlayerPage Components (`components/PlayerPage/`)

Components rendered during an active game, organized by game phase:

| Component | Phase | Purpose |
|-----------|-------|---------|
| `LobbyPhasePanel.tsx` | Lobby | Waiting room UI: ready toggle, player list |
| `RevealPhasePanel.tsx` | Reveal | Phase container during role reveal |
| `RoleRevealPanel.tsx` | Reveal | Displays the player's own role card |
| `MayhemPhasePanel.tsx` | Mayhem | Phase container for mayhem actions |
| `MayhemPanel.tsx` | Mayhem | Legacy mayhem UI (role-based powers) |
| `PowerActionPanel.tsx` | Mayhem | Character power submission UI (target selection + submit) |
| `CharacterPowerDisplay.tsx` | Mayhem | Shows character info and accumulated learns |
| `VotingPanel.tsx` | Voting | Vote submission and player targeting UI |
| `ResultsPanel.tsx` | Results | Round outcome display |
| `PlayersPanel.tsx` | All | Sidebar list of all players with status indicators |
| `RoomCodeDisplay.tsx` | All | Displays the current room code |
| `JoinRoom.tsx` | Lobby | Join flow for non-host players |

### HostPage Components (`components/HostPage/`)

Components rendered on the host configuration screen.

---

## Custom Hooks (`hooks/`)

### useSocketConnection

**File:** `hooks/useSocketConnection.ts`

Sets up all server-to-client socket event listeners for the current session. Called once in the app root. Registers handlers for `room:state`, `room:closed`, `error:*`, `power:result`, and other server-emitted events.

```typescript
export function useSocketConnection(): void
```

**Usage:**

```typescript
// In App.tsx or top-level component:
useSocketConnection();
// Socket listeners are registered; cleanup happens automatically on unmount
```

**Internally:**
- Reads `setRoom`, `resetSession`, etc. from `useAppStore`
- Calls `socket.connect()` if not already connected
- Sets up `socket.on(...)` listeners and returns cleanup via `useEffect`

---

### useNow

**File:** `hooks/useNow.ts`

Returns a live `Date.now()` timestamp that updates on an interval. Useful for rendering countdown timers from `phase.endsAt`.

```typescript
export function useNow(intervalMs?: number): number
// intervalMs defaults to 250ms
```

**Usage:**

```typescript
import { useNow } from "../hooks/useNow";

function CountdownTimer({ endsAt }: { endsAt: number }) {
  const now = useNow();                       // updates every 250ms
  const remaining = Math.max(0, endsAt - now);
  return <span>{Math.ceil(remaining / 1000)}s</span>;
}
```

---

### usePlayerSocketHandlers

**File:** `hooks/usePlayerSocketHandlers.ts`

Handles player-specific socket events (e.g., `power:result`). Used within the `PlayerPage` to isolate per-player event logic from general connection setup.

---

## State Management (Zustand)

### useAppStore

**File:** `state/useAppStore.ts`

The single global Zustand store for session state. Keeps track of who the current user is and what room they're in.

```typescript
type AppState = {
  role: "host" | "player" | "admin" | null;
  roomCode: string;
  playerName: string;

  setRole: (role: Role) => void;
  setRoomCode: (roomCode: string) => void;
  setPlayerName: (playerName: string) => void;

  resetSession: () => void;
};
```

**Key fields:**

| Field | Type | Description |
|-------|------|-------------|
| `role` | `"host" \| "player" \| "admin" \| null` | Current user's role in the session |
| `roomCode` | `string` | The room code the user is in |
| `playerName` | `string` | The user's chosen display name |

**Important:** `RoomState` (from the server) is **not** stored in Zustand. It is kept as local component state in `PlayerPage` / `HostPage` and passed as props. This keeps the server's `room:state` updates co-located with the components that use them.

**Usage:**

```typescript
const { role, setRole, roomCode, setRoomCode, playerName, resetSession } = useAppStore();

// Navigate to host screen:
setRole("host");
setRoomCode(receivedCode);

// Clean up on disconnect:
resetSession();
```

---

## Type Definitions (`types/`)

### room.ts — Core Room Types

```typescript
// Game identity
type GameKey = "infiltration" | "odd_one_out";

// Phase states
type InfiltrationGamePhase = "lobby" | "reveal" | "mayhem" | "voting" | "results";
type OddOneOutGamePhase    = "lobby" | "question" | "debate" | "vote" | "results";

// Player object (mirrors server Player type)
type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;
  role?: InfiltrationRole;
  submission?: Submission;
  roleAcknowledged?: boolean;
  mayhemAcknowledged?: boolean;
  usedPower?: boolean;
  powerUsed?: boolean;
  character?: Character;
  learnsThisGame?: LearnRecord[];
  roleRevealed?: boolean;
  protected?: boolean;
  actedThisRound?: boolean;
};

// Complete room snapshot (received via room:state)
type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[];
  locked: boolean;
  pending: PendingJoin[];
  game: GameState;
  settings: RoomSettings;
  updatedAt: number;
};
```

See `apps/web/src/types/room.ts` for the full definitions.

### characterCreation.ts — Character Design Types

Types used only in the admin character creation UI:

```typescript
interface CharacterInCreation {
  name: string;
  description: string;
  team: "villager" | "infiltrator" | null;
  powerSlots: PowerSlot[];
}

interface PowerSlot {
  type: string | null;
  item: string | null;
  where: string | null;
  powerIndex: number | null;
  toggles: Record<string, boolean>;
  amount: string;
  timing: "SAME_PHASE" | "NEXT_PHASE" | null;
}
```

### socket.ts — Socket Event Types

Typed wrappers for Socket.io client/server events. Use these when emitting or listening for events to ensure payload correctness.

---

## Feature Module Patterns

### Adding a New Feature Module

Feature modules should live under `features/<featureName>/` or `components/<PageName>/` for page-scoped components.

**Pattern:**

```
features/newGame/
├── NewGamePhase.tsx     # Phase container component
├── NewGameAction.tsx    # User action component
└── index.ts             # Re-export public surface
```

**Key conventions:**

- Phase components receive `roomState: RoomState` and `mySocketId: string` as props
- Components emit socket events directly via `socket.emit(...)` from `lib/socket.ts`
- Use `useNow()` for live countdown rendering
- Use `useAppStore()` only for session-level state (role, name, roomCode); get game state from props

### Accessing Current Player

```typescript
const myPlayer = roomState.players.find(p => p.socketId === mySocketId);
const isHost = roomState.hostSocketId === mySocketId;
```

### Emitting Power Submission

```typescript
import { socket } from "../../lib/socket";

socket.emit("game:submitPower", {
  roomCode: roomState.roomCode,
  powerName: "Role Peek",
  targetPlayers: ["socket-id-1", "socket-id-2"],
});
```

### Emitting Socket Events

```typescript
// Simple event
socket.emit("game:setReady", { ready: true });

// Event with callback
socket.emit("room:host", { gameKey: "infiltration" }, (response) => {
  console.log("Response:", response);
});
```

### Listening for Socket Events

```typescript
useEffect(() => {
  socket.on("room:state", (room) => {
    setRoom(room);
  });

  return () => {
    socket.off("room:state");
  };
}, []);
```

### Accessing Game State in Components

```typescript
function MyComponent() {
  const { room, mySocketId } = useAppStore();

  const myPlayer = room?.players.find((p) => p.socketId === mySocketId);
  const isHost = room?.hostSocketId === mySocketId;

  return <div>{isHost && <HostControls />}</div>;
}
```

### Conditional Rendering Based on Phase

```typescript
function GameDisplay() {
  const { room } = useAppStore();

  switch (room?.phase) {
    case "reveal":
      return <RoleReveal />;
    case "mayhem":
      return <MayhemPhase />;
    case "voting":
      return <VotingPhase />;
    case "results":
      return <Results />;
    default:
      return <Lobby />;
  }
}
```

## Building & Deployment

### Development Build

```bash
pnpm dev
# Runs Vite dev server with hot reload
```

### Production Build

```bash
pnpm build
# Runs TypeScript check + Vite build
# Output: dist/
```

### Preview Production Build

```bash
pnpm preview
# Runs local preview of production build
```

### Deploy

**To Static Hosting (Vercel, Netlify, etc.):**

1. Build: `pnpm build`
2. Deploy the `dist/` folder
3. Configure environment variable for API URL

**Environment Variables:**

```
VITE_SERVER_URL=http://localhost:3001  # Dev
VITE_SERVER_URL=https://api.example.com # Prod
```

**Update socket.ts:**

```typescript
export const socket = io(
  import.meta.env.VITE_SERVER_URL || "http://localhost:3001",
  {
    // ... config
  },
);
```

## Debugging

### React DevTools

1. Install React DevTools browser extension
2. Inspect components and state
3. Check Zustand store state
4. Profile performance

### Socket Events in Console

```typescript
// Add to lib/socket.ts for debugging:
socket.onAny((event, ...args) => {
  console.log(`[Socket] ${event}`, args);
});
```

### Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. See all socket messages in real-time

## Type Safety

### Defining Socket Events

Create types for each event in [types/socket.ts](./types/socket.ts):

```typescript
// Room events
export interface RoomHostData {
  gameKey: "infiltration" | "odd_one_out";
  settings?: RoomSettings;
}

export interface RoomJoinData {
  roomCode: string;
  nickname: string;
}

// Game events
export interface GameStartData {
  // empty
}

export interface GameSubmitData {
  vote: string | "none";
}
```

### Using Typed Events

```typescript
const handleSubmit = (data: GameSubmitData) => {
  socket.emit("game:submit", data);
};

socket.on("room:state", (state: RoomState) => {
  setRoom(state);
});
```

## Performance Tips

1. **Memoize Components:** Use React.memo for game UI components
2. **Debounce Events:** Limit rapid socket emits
3. **Lazy Load Features:** Code-split game components
4. **Optimize Re-renders:** Use useCallback for event handlers

```typescript
// Example: Memoized vote button
const VoteButton = React.memo(({ player, onClick }) => (
  <button onClick={onClick}>{player.nickname}</button>
));

// Example: Debounced power selection
const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

const handleSelectTarget = useCallback(
  debounce((targetId: string) => {
    setSelectedTarget(targetId);
  }, 100),
  []
);
```

## Testing Checklist

- [ ] Can navigate to home page
- [ ] Can enter nickname
- [ ] Can host a game (see room code)
- [ ] Can join game with room code
- [ ] Can see room settings on host page
- [ ] Can see player list update in real-time
- [ ] Can mark ready
- [ ] Can see role on reveal
- [ ] Can use power in mayhem
- [ ] Can vote in voting phase
- [ ] Can see results
- [ ] Can reset and play again
- [ ] Socket reconnects on disconnect

## Troubleshooting

**Socket won't connect?**

- Verify server running on localhost:3001
- Check browser console for errors
- Check CORS settings in server

**UI doesn't update when state changes?**

- Verify useAppStore being used correctly
- Check socket listeners set up in useSocketConnection
- Verify room:state being emitted from server

**Socket events not firing?**

- Check socket.emit() calls
- Verify event name matches server
- Check payload format matches expectations
- Look at browser Network tab → WS

**Styling issues?**

- Check App.css and component CSS
- Verify CSS imports
- Check responsive breakpoints

---

For socket event details, see [\_API_REFERENCE.md](../_API_REFERENCE.md).

For game rules, see [\_GAME_RULES.md](../_GAME_RULES.md).
