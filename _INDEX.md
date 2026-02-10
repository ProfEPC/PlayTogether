# PlayTogether Documentation Index

**TLDR:** Navigation guide with 8 markdown files. Reading paths by role (new dev, backend, frontend, game dev). Quick links section, file descriptions, getting help, development checklist, and future enhancements. Use "Quick Links" to jump to specific topics or follow your role's path.

Welcome to the PlayTogether documentation! This is your guide to understanding and developing the multiplayer game platform.

## 📚 Documentation Files

### Getting Started

- **[\_PROJECT_OVERVIEW.md](_PROJECT_OVERVIEW.md)** - What is PlayTogether? High-level overview
- **[\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md)** - How to run locally and common development tasks

### Deep Dives

- **[\_ARCHITECTURE.md](_ARCHITECTURE.md)** - System design, data flow, and state management
- **[\_API_REFERENCE.md](_API_REFERENCE.md)** - Complete socket events reference and type definitions
- **[\_GAME_RULES.md](_GAME_RULES.md)** - Game mechanics, rules, and configuration

### App-Specific Documentation

- **[apps/server/\_README.md](apps/server/_README.md)** - Server architecture, handlers, and patterns
- **[apps/web/\_README.md](apps/web/_README.md)** - Client architecture, components, and state management

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd PlayTogether
pnpm install
```

### 2. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd apps/server
pnpm dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**

```bash
cd apps/web
pnpm dev
# Runs on http://localhost:5173
```

### 3. Open in Browser

Navigate to `http://localhost:5173` and start playing!

## 📖 Reading Guide by Role

### I'm a New Developer

1. Start with [\_PROJECT_OVERVIEW.md](_PROJECT_OVERVIEW.md)
2. Read [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md)
3. Review [\_ARCHITECTURE.md](_ARCHITECTURE.md)
4. Explore [apps/server/\_README.md](apps/server/_README.md) or [apps/web/\_README.md](apps/web/_README.md) depending on focus

### I'm a Backend Developer

1. [apps/server/\_README.md](apps/server/_README.md) - Server overview and handler organization
2. [\_API_REFERENCE.md](_API_REFERENCE.md) - Socket events reference
3. [\_GAME_RULES.md](_GAME_RULES.md) - Game configuration

### I'm a Frontend Developer

1. [apps/web/\_README.md](apps/web/_README.md) - Client overview
2. [\_API_REFERENCE.md](_API_REFERENCE.md) - Socket events
3. [\_ARCHITECTURE.md](_ARCHITECTURE.md) - Data flow
4. [\_GAME_RULES.md](_GAME_RULES.md) - Game logic

### I Want to Add a Game

1. [\_GAME_RULES.md](_GAME_RULES.md) - Understand current games
2. [\_ARCHITECTURE.md](_ARCHITECTURE.md) - See state structure
3. [apps/server/\_README.md](apps/server/_README.md) - Implement server logic
4. [apps/web/\_README.md](apps/web/_README.md) - Build client UI

## 🎮 How the Game Works

### Room Flow

```
1. Host creates room → gets room code
2. Players join using code
3. Host configures game settings
4. All players mark "ready"
5. Host starts game
6. Game progresses through phases:
   - Reveal: Show roles
   - Mayhem: Use powers
   - Voting: Submit votes
   - Results: Show winners
7. Host resets to play again
```

### Multiplayer Magic

- **WebSocket (Socket.io):** Real-time bidirectional communication
- **Server State:** Single source of truth
- **Auto Broadcasting:** State changes sent to all players
- **Offline Resilience:** Reconnection on disconnect

## 📁 File Organization

```
PlayTogether/
├── _PROJECT_OVERVIEW.md      ← Start here
├── _DEVELOPER_GUIDE.md       ← Run locally
├── _ARCHITECTURE.md          ← System design
├── _API_REFERENCE.md         ← Socket events
├── _GAME_RULES.md           ← Game mechanics
│
├── apps/server/
│   ├── _README.md           ← Backend guide
│   ├── package.json
│   └── src/
│       ├── index.ts         ← Entry point
│       ├── socket/
│       │   ├── registerHandlers.ts
│       │   ├── handlers/
│       │   │   ├── roomHandlers.ts
│       │   │   ├── gameHandlers.ts
│       │   │   └── lifecycleHandlers.ts
│       │   ├── roomActions.ts
│       │   ├── gamePhaseHandlers.ts
│       │   └── powerLogic.ts
│       └── state/
│           ├── rooms.ts
│           ├── types.ts
│           └── gameRules.ts
│
├── apps/web/
│   ├── _README.md           ← Frontend guide
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── pages/
│       ├── features/
│       ├── hooks/
│       ├── state/
│       ├── lib/
│       └── types/
│
└── packages/shared/
    └── src/types.ts         ← Shared types (mirrors apps)
```

## 🔑 Key Concepts

### Socket Events

Named events for client-server communication:

- `room:*` - Room management (create, join, close, kick)
- `game:*` - Game control (start, reset, submit votes, use powers)
- `error:*` - Server error responses
- `room:state` - Server broadcasts updated state (most common)

### Game Phases

Sequential phases during active game:

1. **lobby** - Waiting for players to ready
2. **reveal** - Show roles to players
3. **mayhem** - Special powers can be used
4. **voting** - Players submit votes
5. **results** - Show who was eliminated

### Room State

In-memory data structure holding:

- Players list (with roles, submissions, powers)
- Game settings (game type, duration, max players)
- Current phase and round
- Timers for phase transitions

### Authorization

- **Host:** Controls room settings, starts game
- **Player:** Can ready, use powers, vote
- **Spectator:** No special access (not implemented yet)

## 🛠️ Common Development Tasks

### Adding a Room Setting

See [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md) → "Adding a New Socket Event Handler"

### Modifying Game Rules

See [\_GAME_RULES.md](_GAME_RULES.md) → "Modifying Game Rules"

### Debugging Socket Events

See [apps/web/\_README.md](apps/web/_README.md) → "Debugging" or [apps/server/\_README.md](apps/server/_README.md) → "Debugging"

### Building for Production

See [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md) → "Building for Production"

## 🐛 Troubleshooting

**Cannot connect to server?**
→ See [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md) → "Common Issues"

**Socket events not working?**
→ Check [\_API_REFERENCE.md](_API_REFERENCE.md) for event names and payloads

**State not updating?**
→ See [\_ARCHITECTURE.md](_ARCHITECTURE.md) → "State Management"

**Compilation errors?**
→ Run `pnpm build` in the affected app directory

## 📋 Development Checklist

- [ ] Installed Node.js 16+
- [ ] Ran `pnpm install` at root
- [ ] Started server with `pnpm dev` in apps/server
- [ ] Started client with `pnpm dev` in apps/web
- [ ] Opened http://localhost:5173
- [ ] Can host a game
- [ ] Can join a game
- [ ] Can start a game
- [ ] Can see role on reveal
- [ ] Can vote in voting phase

## 🤝 Contributing

### Code Style

- TypeScript for type safety
- Named socket events with kebab-case (room:join, game:start)
- Exported functions for testability
- Comments for non-obvious logic

### Before Committing

- [ ] TypeScript compiles (`pnpm tsc -b`)
- [ ] No console errors
- [ ] Tested manually (host and player)
- [ ] Socket events working
- [ ] State updates broadcast correctly

### Testing Workflow

1. Open 2+ browser windows
2. One hosts, others join
3. Test room features (kick, approve, lock)
4. Test game features (ready, powers, voting)
5. Test edge cases (disconnect, rejoin)

## 📞 Need Help?

1. **API Questions?** → [\_API_REFERENCE.md](_API_REFERENCE.md)
2. **Architecture Questions?** → [\_ARCHITECTURE.md](_ARCHITECTURE.md)
3. **Getting Started?** → [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md)
4. **Game Rules?** → [\_GAME_RULES.md](_GAME_RULES.md)
5. **Server Code?** → [apps/server/\_README.md](apps/server/_README.md)
6. **Client Code?** → [apps/web/\_README.md](apps/web/_README.md)

## 🎯 Project Goals

✅ Real-time multiplayer games in browser
✅ Social deduction gameplay (Infiltration)
✅ Easy to understand and modify
✅ No database dependency
✅ Type-safe with TypeScript
✅ Organized and documented

## 📈 Future Enhancements

- User authentication & persistence
- More game types
- In-game chat
- Spectator mode
- Replay system
- Mobile app
- Custom game rules editor

---

**Happy coding!** 🚀

Start with [\_PROJECT_OVERVIEW.md](_PROJECT_OVERVIEW.md) or jump to the role-specific guides above.
