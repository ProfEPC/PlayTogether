# PlayTogether — Full Project Prompt

## Overview

Build a **party game web platform** called **PlayTogether**. The first fully implemented game is **Odd One Out**. A second game, **Infiltration**, should appear in the game selection screen but either do nothing on click or open a minimal placeholder host page. The architecture must be **expandable** so additional games can be added later without restructuring the core lobby/room system.

The app consists of two roles:
- **Host**: A third-party controller (not a player). Manages room settings, game configuration, and game flow from a separate screen (e.g. a laptop, tablet, or in the future a game console). The host connects and immediately receives a room code, landing on a game selection screen.
- **Player**: Joins a room via a short room code on their personal device (phone, or in the future a native mobile app). Selects an avatar, readies up, and participates in the game.

---

## Long-Term Architecture Considerations

The server is a **pure API/WebSocket backend** with no UI or web-specific assumptions. All game state is communicated through typed Socket.IO event payloads. This enables:
- **Web client** (current): React + Vite SPA
- **Mobile app** (future): React Native connecting to the same Socket.IO server
- **Console host** (future): A dedicated host app connecting to the same server

To support this:
- All shared types, Zod schemas, and constants live in `packages/shared` — a workspace package imported by server, web, and any future client.
- The server never returns HTML or makes assumptions about the rendering layer.
- Socket event payloads are the full contract — any client that implements the event protocol can participate.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | `apps/server`, `apps/web`, `packages/shared` — npm workspaces |
| Server | Node.js + Express + Socket.IO (TypeScript) |
| Client | React + Vite (TypeScript) |
| Styling | Tailwind CSS |
| Client state | Zustand |
| Validation | Zod (in `packages/shared`, imported by both apps) |
| Data | Local JSON files for game prompts (behind an abstraction layer for future DB swap) |

All apps and packages use **TypeScript** with strict mode.

---

## Project Structure

```
packages/
  shared/
    src/
      index.ts                          # Barrel export
      types/
        room.ts                         # RoomState, Player, RoomSettings
        game.ts                         # GameState, GamePhase (shared base)
        socket.ts                       # All socket event payload types
        oddOneOut.ts                    # Odd One Out specific types (settings, prompt, round)
      schemas/
        room.schemas.ts                 # Zod: roomCode, playerName, joinPayload
        game.schemas.ts                 # Zod: game settings, start/reset payloads
        oddOneOut.schemas.ts            # Zod: answer, vote, prompt payloads
      constants/
        events.ts                       # Socket event name constants (prevents typo drift)
        defaults.ts                     # Default settings, player limits, timer ranges
        avatars.ts                      # Available emoji avatar list
    package.json
    tsconfig.json

apps/
  server/
    src/
      index.ts                          # Express + Socket.IO setup (port 3001, CORS for localhost:5173)
      socket/
        registerHandlers.ts             # Registers lobby + game-specific handlers per connection
        lobbyHandlers.ts                # room:host, room:join, room:leave, room:kick, room:close, player:avatar, player:ready
        gameHandlers.ts                 # game:select, game:settings, game:start, game:reset (delegates to active game)
        oddOneOutHandlers.ts            # oddOneOut:answer, oddOneOut:vote
      rooms/
        roomStore.ts                    # In-memory Map<string, RoomState>, CRUD helpers
        roomActions.ts                  # emitRoomState, timer management, cleanup, room lifecycle side-effects
      games/
        gameRegistry.ts                 # Server-side game registry: maps gameId -> handler factory + defaults
        oddOneOut/
          oddOneOutLogic.ts             # Round management: assign prompts, collect answers, tally votes, compute scores
          oddOneOutPrompts.ts           # Data-access layer: load prompts + pairings, select pairs, track used
      validation/
        middleware.ts                   # Socket middleware: validate payloads with Zod before handlers
      utils/
        roomCode.ts                     # Generate 4-char uppercase room codes
        logger.ts                       # Tagged logger: [Room], [Game], [Socket], etc.
        timer.ts                        # Phase timer helpers with stale-timer guard pattern
    data/
      oddOneOut/
        prompts.json                    # Individual prompt definitions
        promptPairings.json             # Curated prompt pair combinations
    package.json
    tsconfig.json

  web/
    src/
      main.tsx
      App.tsx                           # Router: HomePage -> HostPage | PlayerPage
      lib/
        socket.ts                       # Socket.IO client (autoConnect: false, manual connect)
      state/
        useAppStore.ts                  # Zustand: persisted roomCode, playerName, avatar, role
      pages/
        HomePage.tsx                    # Entry: "Host a Game" / "Join a Game"
        HostPage.tsx                    # Game-agnostic shell — lobby + delegates to active game's host component
        PlayerPage.tsx                  # Game-agnostic shell — join + lobby + delegates to active game's player component
      components/
        ui/                             # Shared primitives: Button, Modal, Timer, Card, Badge
        lobby/
          PlayerList.tsx                # Displays players with avatars, ready status, kick button (host)
          RoomCodeDisplay.tsx           # Shows room code prominently for sharing
        player/
          JoinForm.tsx                  # Name + room code input
          AvatarPicker.tsx              # Emoji grid selector
          ReadyToggle.tsx               # Ready/unready button
        host/
          GameSelector.tsx              # Grid of available games (from registry). Odd One Out = playable, Infiltration = placeholder
          GameSettingsPanel.tsx          # Renders active game's settings component from registry
      features/
        oddOneOut/
          host/
            OddOneOutHostPanel.tsx      # Host view during gameplay: current phase, answers, votes, scoreboard
            OddOneOutSettingsPanel.tsx  # Host settings: rounds, timers, scoring toggles
          player/
            OddOneOutPlayerPanel.tsx    # Player view: prompt display, answer input, voting, results
          components/
            AnswerCard.tsx              # Displays a player's answer during discussion
            VoteGrid.tsx                # Grid of players to vote for
            ScoreBoard.tsx              # Round and final scores
            PromptDisplay.tsx           # Shows the prompt to a player during answering phase
        infiltration/
          host/
            InfiltrationHostPanel.tsx   # Placeholder: "Coming Soon" or minimal shell
          player/
            InfiltrationPlayerPanel.tsx # Placeholder
      hooks/
        useSocketConnection.ts          # Connect/disconnect lifecycle, reconnection
        useRoomState.ts                 # Subscribe to room:state, sync to zustand
        useGamePhase.ts                 # Track current phase, time remaining
      constants/
        gameRegistry.ts                 # Client game registry: maps gameId -> name, description, components, settings component, min/max players
      types/                            # Re-exports from @playtogether/shared + any client-only types
    tailwind.config.js
    package.json
    tsconfig.json
```

---

## Room System (Game-Agnostic)

### Room Codes
- 4-character uppercase alphanumeric (e.g. `ZBRS`), generated server-side.
- Always normalized: `roomCode.trim().toUpperCase()`.
- Generated **immediately when the host connects** — the host lands on a game selection screen with the room code already visible and shareable.

### Room Lifecycle
1. **Host connects** -> Server generates room code, creates `RoomState`, host joins Socket.IO room. Host sees the game selection screen with room code displayed.
2. **Host selects a game** -> Game settings panel appears. Players can join at any time (before or after game selection).
3. **Players join** -> Enter name + room code on their phone. Server validates (room exists, not full, name not taken). Player added to room, state broadcast.
4. **Players pick avatar + ready up** -> Avatar selection before readying. Host sees each player appear on their lobby panel with avatar and ready status.
5. **Host starts game** -> All players must be ready. Game-specific phases begin.
6. **Game ends** -> Return to lobby. Scores persist. Host can start another round/game or close room.
7. **Room closes** -> Host closes room or disconnects. All players notified, timers cleared, state cleaned up.

### State Model

```typescript
// packages/shared/src/types/room.ts
interface RoomState {
  roomCode: string;
  hostSocketId: string;
  players: Player[];
  settings: RoomSettings;
  game: GameState;
  createdAt: number;
}

interface Player {
  socketId: string;
  name: string;
  avatar: string;           // Emoji string
  ready: boolean;
  connected: boolean;
  score: number;            // Persists across rounds within a game session
}

interface RoomSettings {
  maxPlayers: number;        // 3-12, default 8
  selectedGame: string | null; // null until host picks a game
  gameSettings: Record<string, unknown>;
}

// packages/shared/src/types/game.ts
interface GameState {
  started: boolean;
  phase: string;            // Game-specific phase string
  roundNumber: number;
  totalRounds: number;
  endsAt: number | null;    // Timer deadline (epoch ms), null when no active timer
  gameData: Record<string, unknown>;
}
```

### Player Limits
- **Minimum**: 3 players
- **Maximum**: 12 players

### Host Permissions
All game-control and room-management actions are **host-only**. Every handler checks:
```typescript
if (room.hostSocketId !== socket.id) {
  socket.emit("error:forbidden", { message: "Only host can do this" });
  return;
}
```

### State Broadcasting
After **every** state mutation, broadcast the full room state:
```typescript
emitRoomState(io, roomCode); // Sends room:state to all sockets in the room
```
Clients are pure renderers of the latest emitted state. No client-side state guessing.

---

## Core Socket Events

### Lobby Events (Game-Agnostic)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `room:host` | C -> S | `{}` | Host creates room. Room code generated, returned via `room:state`. |
| `room:join` | C -> S | `{ roomCode, playerName }` | Player joins room. |
| `room:joined` | S -> C | `RoomState` | Confirm join, send full state. |
| `room:state` | S -> All | `RoomState` | Full state broadcast after every mutation. |
| `room:leave` | C -> S | `{}` | Player leaves room. |
| `room:kick` | C -> S | `{ targetSocketId }` | Host kicks a player. |
| `room:close` | C -> S | `{}` | Host closes the room. |
| `room:closed` | S -> All | `{ reason }` | Room closed notification. |
| `player:avatar` | C -> S | `{ avatar }` | Player selects emoji avatar. |
| `player:ready` | C -> S | `{}` | Player toggles ready state. |
| `game:select` | C -> S | `{ gameId }` | Host selects which game to play. |
| `game:settings` | C -> S | `{ settings }` | Host updates game-specific settings. |
| `game:start` | C -> S | `{}` | Host starts the game (all players must be ready). |
| `game:reset` | C -> S | `{}` | Host returns to lobby. |
| `error:forbidden` | S -> C | `{ message }` | Unauthorized action. |
| `error:invalid` | S -> C | `{ message, details? }` | Validation failure. |

### Odd One Out Events (Game-Specific)

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `oddOneOut:prompt` | S -> C (private) | `{ promptText, answerCategory, roundNumber }` | Player's assigned prompt. Sent individually — odd one out gets different text. |
| `oddOneOut:answer` | C -> S | `{ answer }` | Player submits their typed answer. |
| `oddOneOut:answers` | S -> All | `{ answers: [{ socketId, name, avatar, answer }] }` | All answers revealed for discussion. |
| `oddOneOut:vote` | C -> S | `{ targetSocketId }` | Player votes for suspected odd one out. Cannot vote for self. |
| `oddOneOut:results` | S -> All | `{ votes, oddOneOutSocketId, scores, roundScoreboard }` | Round results. |
| `oddOneOut:final` | S -> All | `{ finalScoreboard }` | Final game results after all rounds. |

---

## Odd One Out — Game Flow

### Phases (per round)

1. **`prompting`** — Server picks a prompt pair (from pairings data or auto-matched by category). Randomly selects one player as the odd one out. Sends the majority prompt to most players and the odd prompt to the odd player, each via private `oddOneOut:prompt` event. The `answerCategory` is included so the player sees context (e.g. "Answer with: a food").

2. **`answering`** — Players see their prompt and type a free-text answer. Configurable timer (`answerTimer`). Phase advances when all answers are in OR timer expires. Missing answers recorded as *"No answer"*.

3. **`discussing`** — All answers broadcast via `oddOneOut:answers`. Displayed with or without player names (host setting: `showNamesWithAnswers`). Players discuss out loud (this is a party game — the discussion happens in the room, not in-app). Configurable timer (`discussionTimer`).

4. **`voting`** — Each player votes for who they think is the odd one out. Cannot vote for themselves. Configurable timer (`votingTimer`). **Votes not submitted before timer expires are not counted.**

5. **`results`** — Server reveals: who received the most votes, who was actually the odd one out, points earned per player this round, and the running scoreboard. Phase lasts until host manually advances (or a short auto-timer).

6. **`finalResults`** — After the last round, show the complete leaderboard with total scores across all rounds. Game over. Host can reset to lobby.

### Scoring Rules (All Toggleable via Host Settings)

| Rule | Key | Description | Points | Default |
|------|-----|-------------|--------|---------|
| Correct Vote | `correctVote` | Player voted for the actual odd one out | +1 | On |
| Fooled Bonus | `fooledBonus` | Odd one out earns +1 per player who did NOT vote for them | +1 each | On |
| Survival Bonus | `survivalBonus` | Odd one out was NOT the most-voted player | +3 | On |
| Speed Bonus | `speedBonus` | First 50% of correct voters get an extra point | +1 | Off |
| Streak Bonus | `streakBonus` | +1 extra per consecutive round with a correct vote (resets on miss) | +1/streak | Off |

### Host Settings

```typescript
// packages/shared/src/types/oddOneOut.ts
interface OddOneOutSettings {
  rounds: number;                // 1-10, default 5
  answerTimer: number;           // seconds, 15-120, default 30
  discussionTimer: number;       // seconds, 15-180, default 45
  votingTimer: number;           // seconds, 10-60, default 20
  showNamesWithAnswers: boolean; // default false
  scoring: {
    correctVote: boolean;        // default true
    fooledBonus: boolean;        // default true
    survivalBonus: boolean;      // default true
    speedBonus: boolean;         // default false
    streakBonus: boolean;        // default false
  };
}
```

---

## Prompt Data Architecture

Prompts use **two separate data files**, designed so the prompt bank can grow independently from the pairing logic, and the data-access layer can be swapped for a database later.

### File 1: `apps/server/data/oddOneOut/prompts.json`

Individual prompt definitions. Each prompt stands alone with an answer category that describes what kind of answer is expected.

```json
[
  {
    "id": "food_01",
    "text": "What is your favorite pizza topping?",
    "answerCategory": "food",
    "tags": ["favorites", "casual"]
  },
  {
    "id": "food_02",
    "text": "What is your favorite ice cream flavor?",
    "answerCategory": "food",
    "tags": ["favorites", "casual"]
  },
  {
    "id": "food_03",
    "text": "What food could you eat every day?",
    "answerCategory": "food",
    "tags": ["hypothetical"]
  },
  {
    "id": "movie_01",
    "text": "What is the best movie you've seen this year?",
    "answerCategory": "movie",
    "tags": ["recent", "opinion"]
  },
  {
    "id": "movie_02",
    "text": "What movie do you think is overrated?",
    "answerCategory": "movie",
    "tags": ["opinion", "controversial"]
  },
  {
    "id": "location_01",
    "text": "What country do you most want to visit?",
    "answerCategory": "location",
    "tags": ["travel", "aspirational"]
  },
  {
    "id": "location_02",
    "text": "What country would you never want to live in?",
    "answerCategory": "location",
    "tags": ["travel", "negative"]
  },
  {
    "id": "number_01",
    "text": "How many hours of sleep do you need?",
    "answerCategory": "number",
    "tags": ["personal", "casual"]
  },
  {
    "id": "number_02",
    "text": "How many pets do you want to own?",
    "answerCategory": "number",
    "tags": ["personal", "hypothetical"]
  },
  {
    "id": "person_01",
    "text": "Who would you most want to have dinner with?",
    "answerCategory": "person",
    "tags": ["hypothetical", "celebrity"]
  }
]
```

**Answer categories**: `food`, `movie`, `location`, `number`, `person`, `animal`, `activity`, `music`, `color`, `object` — extensible, just add new values as needed.

### File 2: `apps/server/data/oddOneOut/promptPairings.json`

Defines which prompts work well together as a majority/odd pair. Two prompts in the same `answerCategory` produce similar-sounding answers, making it harder to spot the odd one out.

```json
[
  {
    "id": "pair_001",
    "majorityPromptId": "food_01",
    "oddPromptId": "food_02",
    "difficulty": "easy"
  },
  {
    "id": "pair_002",
    "majorityPromptId": "food_01",
    "oddPromptId": "food_03",
    "difficulty": "medium"
  },
  {
    "id": "pair_003",
    "majorityPromptId": "movie_01",
    "oddPromptId": "movie_02",
    "difficulty": "hard"
  },
  {
    "id": "pair_004",
    "majorityPromptId": "location_01",
    "oddPromptId": "location_02",
    "difficulty": "medium"
  },
  {
    "id": "pair_005",
    "majorityPromptId": "number_01",
    "oddPromptId": "number_02",
    "difficulty": "easy"
  }
]
```

**Difficulty** affects pairing selection — `easy` pairs have more distinct prompts (easier to blend in), `hard` pairs are very similar (harder for odd one out).

### Data-Access Layer: `apps/server/src/games/oddOneOut/oddOneOutPrompts.ts`

```typescript
// Abstracts data source — currently JSON files, swappable for DB later.
// Public API:
loadPrompts(): void                              // Load JSON files at startup
getRandomPairing(usedPairIds: string[]): Pairing // Pick unused pairing, avoid repeats within a game
getPromptById(id: string): Prompt                // Look up a single prompt
getPromptsByCategory(category: string): Prompt[] // All prompts in a category
getCategories(): string[]                        // List all answer categories
```

The logic layer (`oddOneOutLogic.ts`) calls `getRandomPairing()` each round, passing the list of already-used pair IDs to avoid repeats. If all curated pairings are exhausted, it can fall back to auto-pairing any two prompts in the same category.

---

## UI Design

### Mobile-First Player Pages
- Touch targets minimum **44px**.
- Large, readable text. No horizontal scrolling.
- Single-column layouts. Clear call-to-action buttons.
- Timer always visible during timed phases.
- Phase indicator — players always know what's expected of them.

### Desktop/Tablet Host Pages
- More information density. Multi-column layouts where appropriate.
- Player list with avatars, ready status, and kick buttons.
- Live game state: current phase, who has answered/voted, timer, scoreboard.
- Room code displayed prominently for screen-sharing.

### Player Avatars
- Emoji-based (for now). ~20 options in a grid picker.
- Player selects before readying up. Random default assigned if they skip.
- Displayed next to name everywhere: lobby, answers, voting, results.

### Tailwind CSS
- Utility classes in JSX. Minimal custom CSS.
- Define a color theme in `tailwind.config.js`: primary, secondary, accent, surface, muted.
- Structure for future dark mode (use semantic color names) but don't implement it yet.

---

## Multi-Game Expandability

### Game Registry (Client)

```typescript
// apps/web/src/constants/gameRegistry.ts
interface GameRegistryEntry {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  available: boolean;                              // false = shows as "Coming Soon"
  hostSettingsComponent: React.ComponentType;
  hostGameComponent: React.ComponentType;
  playerGameComponent: React.ComponentType;
  defaultSettings: Record<string, unknown>;
}
```

### Game Registry (Server)

```typescript
// apps/server/src/games/gameRegistry.ts
interface ServerGameEntry {
  id: string;
  registerHandlers: (io, socket, room) => void;    // Attach game-specific socket events
  getDefaultSettings: () => Record<string, unknown>;
  validateSettings: (settings: unknown) => boolean;
}
```

### Adding a New Game
1. **Server**: Create `apps/server/src/games/<gameId>/` with logic + data. Create `apps/server/src/socket/<gameId>Handlers.ts`. Register in server game registry.
2. **Shared**: Add types and schemas in `packages/shared/src/types/<gameId>.ts` and `schemas/<gameId>.schemas.ts`.
3. **Client**: Create `apps/web/src/features/<gameId>/` with host + player panels. Register in client game registry.
4. Set `available: true` when ready.

### Host + Player Page Pattern
`HostPage` and `PlayerPage` are **game-agnostic shells**:
- Handle room connection, lobby UI, player list, avatars, ready states.
- During active gameplay, render the active game's component from the registry.
- Each game owns its own phases and UI — the shell just provides the frame.

### Infiltration (Placeholder)
- Appears in `GameSelector` with `available: false`.
- Shows "Coming Soon" overlay or opens a barebones host panel with no functionality.
- Demonstrates the registry pattern works for multiple games.

---

## Server Patterns

### Authoritative Server
All game logic runs server-side. Clients are renderers. The server:
- Assigns prompts and selects the odd one out.
- Enforces timers and deadlines.
- Tallies votes and computes scores.
- Validates all inputs with Zod before processing.

### Timer Pattern
Timers are per-room with a stale-guard:
```typescript
const phaseId = generateId();
room.game.gameData.currentPhaseId = phaseId;
room.game.endsAt = Date.now() + timerMs;
emitRoomState(io, roomCode);
setTimeout(() => {
  if (room.game.gameData.currentPhaseId !== phaseId) return; // Stale
  advancePhase(io, roomCode);
}, timerMs);
```

### Cleanup
- Clear all timers when a room closes.
- Remove disconnected players after a grace period (30 seconds default).
- Auto-close rooms with no connected sockets after 5 minutes.
- On room close: notify all clients via `room:closed`, clean up from room store.

### Logging
Use `utils/logger.ts` with prefixed tags:
```
[Room] Created ZBRS
[Game] ZBRS starting oddOneOut (5 rounds)
[Socket] Connected: abc123
[OddOneOut] ZBRS round 2: prompting phase
```

---

## CORS

Server Socket.IO and Express CORS configured to allow `http://localhost:5173`.

---

## Out of Scope

- No database — all in-memory, restarts wipe state.
- No authentication — players identified by socket ID + name.
- No persistent accounts.
- No deployment config — local dev only.
- No tests initially.
- No dark mode.
- No in-app chat.
- No spectator mode.
