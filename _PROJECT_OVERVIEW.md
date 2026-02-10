# PlayTogether - Project Overview

**TLDR:** What is PlayTogether and why it exists. Tech stack (Node+Express, React+Vite, Socket.io, no database). Two supported games with rules. Key concepts: room state, socket events, player lifecycle. Core design patterns (single-process in-memory, host authority, state emission). Project goals and future enhancements listed.

## What is PlayTogether?

PlayTogether is a multiplayer browser-based game platform that allows players to join hosted rooms and compete in social deduction and puzzle games in real-time using WebSockets.

## Key Features

- **Real-time Multiplayer:** WebSocket-powered instant communication between server and clients
- **Social Deduction Games:** Role-based games like "Infiltration" with hidden roles and special abilities
- **Puzzle Games:** Pattern-finding games like "Odd One Out"
- **Room-based Architecture:** Host creates a room, players join with a code
- **In-Memory State:** Fast, transient game state (no database)
- **Role-Based Gameplay:** Different player roles with unique powers and objectives

## Supported Games

### 1. **Infiltration** (Social Deduction)

A hidden role game where:

- **Civilians** work together to identify the infiltrator
- **Infiltrators** deceive civilians
- **Special Roles:** Thief, Hacker, Engineer with unique powers
- Phases: Lobby → Role Reveal → Mayhem → Voting → Results

### 2. **Odd One Out** (Puzzle)

Players identify which item doesn't belong:

- Voting-based elimination
- Multiple rounds
- Scoring based on correct identification

## Technology Stack

### Server

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Real-time Communication:** Socket.io
- **Port:** 3001 (default)

### Web Client

- **Framework:** React 18+
- **Build Tool:** Vite
- **Styling:** CSS
- **Port:** 5173 (default)

### Package Management

- **Monorepo:** PNPM workspaces
- **Structure:** `/apps` (server, web), `/packages` (shared code)

## Project Structure

```
PlayTogether/
├── apps/
│   ├── server/              # Node.js + Express + Socket.io backend
│   │   └── src/
│   │       ├── index.ts              # Server entry point
│   │       ├── socket/               # Socket event handlers
│   │       ├── state/                # Room and game state management
│   │       └── utils/                # Utilities (time, etc.)
│   │
│   └── web/                 # React + Vite frontend
│       └── src/
│           ├── pages/                # Page components
│           ├── features/             # Feature modules (infiltration, oddOneOut)
│           ├── hooks/                # Custom React hooks
│           ├── lib/                  # Socket client, utilities
│           ├── state/                # Global state (Zustand store)
│           └── constants/            # Game rules, constants
│
├── packages/
│   └── shared/              # Shared types and utilities
│       └── src/
│           └── types.ts              # Shared TypeScript interfaces
│
├── _PROJECT_OVERVIEW.md     # This file
├── _ARCHITECTURE.md         # System design and data flow
├── _DEVELOPER_GUIDE.md      # Getting started and development workflow
├── _GAME_RULES.md          # Game mechanics and rules
├── _API_REFERENCE.md       # Socket events and type definitions
└── README.md               # Original project readme
```

## Core Concepts

### Room State

A room holds all temporary game state for one group of players:

- Room code (unique identifier)
- Players list with roles, ready status, submissions
- Host socket ID
- Game settings (game type, duration, max players)
- Current phase (lobby, reveal, mayhem, voting, results)
- Timer for phase transitions

### Socket Events

Communication happens through named events:

- **Server sends:** `room:state`, `error:*`, phase updates
- **Client sends:** `room:join`, `game:start`, `game:submit`, etc.

### Player Lifecycle

1. **Join:** Player enters room with a nickname
2. **Ready:** Player marks themselves ready
3. **Game Start:** Host starts the game, roles assigned
4. **Play:** Interact based on game phase
5. **Results:** See outcomes
6. **Reset:** Return to lobby

## Quick Links

- **Getting Started:** See [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md)
- **Architecture Deep Dive:** See [\_ARCHITECTURE.md](_ARCHITECTURE.md)
- **Socket API Reference:** See [\_API_REFERENCE.md](_API_REFERENCE.md)
- **Game Rules & Configuration:** See [\_GAME_RULES.md](_GAME_RULES.md)
- **Server Guide:** See [apps/server/\_README.md](apps/server/_README.md)

## Key Files to Explore First

**Server:**

- [apps/server/src/index.ts](apps/server/src/index.ts) — Server initialization
- [apps/server/src/socket/registerHandlers.ts](apps/server/src/socket/registerHandlers.ts) — Socket event orchestration
- [apps/server/src/state/rooms.ts](apps/server/src/state/rooms.ts) — Room state management

**Client:**

- [apps/web/src/main.tsx](apps/web/src/main.tsx) — React app entry
- [apps/web/src/App.tsx](apps/web/src/App.tsx) — Main app component
- [apps/web/src/lib/socket.ts](apps/web/src/lib/socket.ts) — Socket client setup

## Important Design Patterns

### Single-Process In-Memory Architecture

- Rooms stored in a Map: `Map<roomCode, RoomState>`
- No database, no persistence
- Restart = all rooms disappear
- Scaling would require moving state out-of-process

### Host Authority

- Room host controls game settings and state transitions
- Only host can start/reset/close games
- Non-host operations checked with `room.hostSocketId === socket.id`

### State Emission Pattern

- After any room mutation, emit via `emitRoomState(io, code)`
- All clients in room receive updated state
- UI updates reactively based on state changes

### Phase Timers with Round Guards

- Timers use `roundId` to prevent stale callbacks
- Example: reveal timer won't execute if round changed

## Development Philosophy

- **Simplicity:** Easy to understand and modify
- **Type Safety:** TypeScript throughout
- **Modularity:** Handlers organized by domain (room, game, player)
- **Convention Over Configuration:** Clear naming patterns and file organization
- **Transient State:** No persistence concerns, simpler logic

---

For more details, start with [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md) to get the project running locally.
