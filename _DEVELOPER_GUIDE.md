# PlayTogether - Developer Guide

**TLDR:** Step-by-step guide to run the project locally (prerequisites, setup, starting both servers). Common development workflows (adding socket events, modifying game rules, adding games, testing). Debugging tips for both server and client. Build and production instructions. Troubleshooting section with solutions to common issues.

## Getting Started Locally

### Prerequisites

- Node.js 16+ installed
- PNPM package manager (`npm install -g pnpm` or use npm/yarn)
- Basic knowledge of TypeScript, React, Socket.io

### Initial Setup

```bash
# Clone the repository
git clone <repo-url>
cd PlayTogether

# Install dependencies for all workspaces
pnpm install
```

## Running Locally

### Option 1: Terminal Tabs (Recommended)

**Terminal 1 - Start Server:**

```bash
cd apps/server
pnpm dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Start Web Client:**

```bash
cd apps/web
pnpm dev
# UI runs on http://localhost:5173
```

Then open your browser to `http://localhost:5173`

### Option 2: Monorepo Command

From the root:

```bash
pnpm dev
```

This should start both server and web simultaneously (if workspace scripts are configured).

## Common Development Tasks

### Adding a New Socket Event Handler

1. **Define the handler in the appropriate file:**

   - Room operations → `apps/server/src/socket/handlers/roomHandlers.ts`
   - Game operations → `apps/server/src/socket/handlers/gameHandlers.ts`
   - Lifecycle → `apps/server/src/socket/handlers/lifecycleHandlers.ts`

2. **Example:** Add a new room setting event

   ```typescript
   // In roomHandlers.ts
   socket.on("room:setDescription", (description: string) => {
     const room = rooms.get(roomCode);
     if (!room || room.hostSocketId !== socket.id) {
       socket.emit("error:forbidden");
       return;
     }
     room.description = description;
     emitRoomState(io, roomCode);
   });
   ```

3. **Update client to emit the event:**

   ```typescript
   // In a React component
   socket.emit("room:setDescription", "New description");
   ```

4. **Handle the response in the UI** by listening to `room:state` updates

### Making Changes to Game Rules

1. **Update server rules:** [apps/server/src/state/gameRules.ts](apps/server/src/state/gameRules.ts)
2. **Update client rules:** [apps/web/src/constants/gameRules.ts](apps/web/src/constants/gameRules.ts) (mirror copy)
3. **Both must stay in sync** — type them consistently

### Adding a New Game Type

1. **Define game in `GAMES` constant** in both gameRules files
2. **Add infiltration/puzzle logic** in appropriate handlers
3. **Create feature folder:** `apps/web/src/features/newGame/`
4. **Add UI components** for the game
5. **Wire up routing** in main App component

### Testing Locally

**Test Room Creation:**

1. Open `http://localhost:5173` in browser
2. Click "Host Game"
3. Note the room code
4. Open new tab, enter code to join

**Test Multiplayer:**

1. Host: Open in one browser window
2. Players: Open in other windows/tabs, join the room code
3. Host starts game
4. Each window updates in real-time

## Project Structure Deep Dive

### Server Architecture

```
apps/server/src/
├── index.ts                    # HTTP + Socket.io server setup
├── socket/
│   ├── registerHandlers.ts     # Entry point for all handlers
│   ├── handlers/
│   │   ├── roomHandlers.ts     # Room management (8 handlers)
│   │   ├── gameHandlers.ts     # Game control & submissions (14 handlers)
│   │   └── lifecycleHandlers.ts # Connection lifecycle (1 handler)
│   ├── roomActions.ts          # Room mutation + emit utilities
│   ├── gamePhaseHandlers.ts    # Phase logic (reveal, mayhem, voting)
│   └── powerLogic.ts           # Role power execution
├── state/
│   ├── rooms.ts                # Room creation & defaults
│   ├── types.ts                # RoomState, Player, Phase types
│   └── gameRules.ts            # Game configuration constants
└── utils/
    └── time.ts                 # Time utility functions
```

### Client Architecture

```
apps/web/src/
├── pages/
│   ├── HomePage.tsx            # Game selection / room entry
│   ├── HostPage.tsx            # Host game configuration
│   ├── PlayerPage.tsx          # Active game play
│   └── AdminPage.tsx           # Dev admin panel
├── features/
│   ├── infiltration/           # Infiltration game UI
│   └── oddOneOut/              # Odd One Out game UI
├── hooks/
│   ├── useSocketConnection.ts  # Socket setup & auth
│   └── useNow.ts              # Real-time clock hook
├── lib/
│   └── socket.ts              # Socket.io client configuration
├── state/
│   └── useAppStore.ts         # Zustand global state
├── constants/
│   └── gameRules.ts           # Game rules (mirrors server)
└── types/
    ├── room.ts                # Room/Player/Game types
    └── socket.ts              # Socket event type definitions
```

## Key Patterns & Conventions

### Normalizing Room Codes

```typescript
const code = roomCode.trim().toUpperCase();
```

Always normalize when:

- Storing room code
- Looking up rooms
- Sending to client

### Host-Only Permission Check

```typescript
if (room.hostSocketId !== socket.id) {
  socket.emit("error:forbidden", { message: "Only host can do this" });
  return;
}
```

### Emitting Updated State

```typescript
// After ANY room mutation:
import { emitRoomState } from "./roomActions";
emitRoomState(io, roomCode);
```

### Type-Safe Array Operations

```typescript
// Always type the callback parameter
room.players.find((p: any) => p.socketId === socket.id);
room.players.some((p: any) => !p.ready);
room.players.forEach((p: any) => {
  /* ... */
});
```

### Clearing Timers on Room Close

```typescript
// IMPORTANT: Always clear timers when closing room
clearPhaseTimer(roomCode);
rooms.delete(roomCode);
```

## Debugging Tips

### Server-Side Debugging

**Enable detailed logging:**

1. Add `console.log()` statements in handlers
2. Check terminal output where `pnpm dev` is running
3. Look for socket connection/disconnection messages

**Check room state:**

```typescript
console.log(rooms.get(roomCode)); // See full state
```

### Client-Side Debugging

**Open React DevTools:**

- Install React DevTools browser extension
- Inspect component state and props

**Check socket events:**

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. See all socket messages

**React Hook Debugger:**

```typescript
// In component
useEffect(() => {
  console.log("State changed:", state);
}, [state]);
```

## Building for Production

### Server Build

```bash
cd apps/server
pnpm build  # Compiles TypeScript to JS
```

### Web Build

```bash
cd apps/web
pnpm build  # Creates optimized production bundle
```

### Full Production Build

```bash
pnpm build  # Builds all workspaces
```

## Common Issues & Solutions

### Port Already in Use

```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (Windows)
taskkill /PID <pid> /F
```

### Socket Connection Refused

- Ensure server is running on port 3001
- Check browser console for errors
- Verify CORS in `apps/server/src/index.ts` allows your URL

### Hot Reload Not Working

- Restart `pnpm dev` in the affected terminal
- Clear browser cache (Ctrl+Shift+R)
- Check that file changes are being saved

### Type Errors After Changes

```bash
cd apps/server
pnpm tsc -b --clean  # Clean build
pnpm dev
```

## Code Style & Conventions

### Naming

- **Socket events:** kebab-case (room:join, game:start)
- **Functions:** camelCase (handlePlayerJoin, emitRoomState)
- **Types/Interfaces:** PascalCase (RoomState, Player)
- **Constants:** SCREAMING_SNAKE_CASE (GAME_RULES, MAX_PLAYERS)

### File Organization

- Keep handlers focused and under ~450 lines
- Group related logic together
- Export only the necessary functions/types
- Use relative imports within the same module

### Comments

- Explain WHY, not WHAT
- Document non-obvious logic
- Keep comments up-to-date with code

## Next Steps

1. **Understand the architecture:** Read [\_ARCHITECTURE.md](_ARCHITECTURE.md)
2. **Explore socket events:** Check [\_API_REFERENCE.md](_API_REFERENCE.md)
3. **Review game rules:** See [\_GAME_RULES.md](_GAME_RULES.md)
4. **Learn the server structure:** See [apps/server/\_README.md](apps/server/_README.md) for handler organization and patterns
5. **Start modifying:** Try adding a simple feature (new game setting, UI element, etc.)

## Getting Help

- Check [\_API_REFERENCE.md](_API_REFERENCE.md) for socket event details
- Review similar handlers for code patterns
- Look at test scenarios in [apps/web/src/pages/AdminPage.tsx](apps/web/src/pages/AdminPage.tsx)
- Consult the copilot-instructions.md for project-specific context

---

Happy coding! 🎮
