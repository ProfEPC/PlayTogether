# Quick Reference Card - Character Powers

## What's New

### 🎮 Feature Overview

Players can now use character-based powers during the mayhem phase to learn the roles of other players or center positions. Each player can use one power per game, and the results are private.

### 📋 What Players See

**During Mayhem Phase:**

1. PowerActionPanel appears with title "Use Power: Learn Role"
2. Grid of buttons for targets:
   - **Player targets**: Click other player names
   - **Center targets**: Click "Center 1", "Center 2", or "Center 3"
3. Action buttons:
   - **Random**: Randomly select N targets
   - **Submit**: Send power selection to server
   - Counter shows: "X/Y selected"
4. Feedback message when ready

**After Submission:**

```
You learned: Alice is Hacker, Bob is Thief
```

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│              Client (Web App)                        │
│                                                      │
│  PowerActionPanel                                   │
│  ├─ Button grid (players or centers)               │
│  ├─ Random button                                   │
│  ├─ Submit button                                   │
│  └─ Selection counter                               │
│                                                      │
│  Sends: game:submitPower                           │
│  Receives: power:result                            │
└──────────────┬──────────────────────────────────────┘
               │ Socket.IO
┌──────────────▼──────────────────────────────────────┐
│              Server (Node + Express)                │
│                                                      │
│  game:submitPower handler                          │
│  ├─ Validates: room, phase, player, power         │
│  └─ Calls executeCharacterPower()                  │
│                                                      │
│  executeCharacterPower()                           │
│  ├─ Loops through targets                          │
│  ├─ Retrieves roles (from players or centerRoles) │
│  ├─ Creates LearnRecord(s)                        │
│  ├─ Stores in player.learnsThisGame               │
│  └─ Emits private power:result                    │
│                                                      │
│  Room State                                         │
│  ├─ player.character.powers: PowerSlot[]          │
│  ├─ player.learnsThisGame: LearnRecord[]          │
│  ├─ player.powerUsed: boolean                      │
│  └─ game.centerRoles: [role1, role2, role3]      │
└─────────────────────────────────────────────────────┘
```

---

## Key Types

### PowerSlot

```typescript
{
  powerIndex: number | null;    // Which power in array
  type?: string;                // "Learn", "Protect", etc.
  item?: string;                // "Role", "Team", etc.
  where?: string;               // "Player" or "Center"
  quantity?: number;            // How many to select (1-3)
}
```

### Character

```typescript
{
  name: string;
  description: string;
  team?: "villager" | "infiltrator";
  powers: PowerSlot[];
}
```

### LearnRecord

```typescript
{
  powerName: string;
  targetPlayer?: string;        // Socket ID if player target
  targetPlayerName?: string;    // Display name
  targetCenter?: number;        // 1, 2, or 3 if center target
  learned: string;              // The role learned
  learnedAt: number;            // Timestamp
  item?: string;                // "Role"
  where?: string;               // "Player" or "Center"
}
```

---

## Socket Events

### Client → Server

**Event:** `game:submitPower`

```typescript
{
  roomCode: string;
  powerName: string;
  targetPlayers?: string[];     // Socket IDs
  targetCenter?: number[];      // [1] or [2] or [3] or [1,2,3]
}
```

### Server → Client (Private)

**Event:** `power:result`

```typescript
{
  powerName: string;
  learns: [
    {
      powerName: string;
      targetPlayer?: string;
      targetPlayerName?: string;
      targetCenter?: number;
      learned: string;
      learnedAt: number;
    }
  ]
}
```

---

## File Structure

```
apps/server/src/
├── state/types.ts                     ← PowerSlot, Character, LearnRecord
├── socket/
│   ├── gamePhaseHandlers.ts          ← centerRoles assignment
│   ├── handlers/gameHandlers.ts      ← game:submitPower handler
│   └── powerLogic.ts                 ← executeCharacterPower()

apps/web/src/
├── types/
│   ├── room.ts                        ← Player, Character, GameState
│   └── socket.ts                      ← Socket events
├── components/PlayerPage/
│   ├── PowerActionPanel.tsx           ← UI component
│   ├── PowerActionPanel.css           ← Styling
│   └── index.ts                       ← Export
└── pages/PlayerPage.tsx               ← Integration
```

---

## Data Flow

```
1. Character loaded → player.character = { name, powers: [...] }
2. Game starts → room.game.centerRoles = [r1, r2, r3]
3. Mayhem begins → PowerActionPanel renders
4. Player selects → setSelectedTargets({ players: [...] })
5. Player submits → socket.emit("game:submitPower", {...})
6. Server executes → executeCharacterPower() processes
7. Learns recorded → player.learnsThisGame.push(...)
8. Result sent → io.to(actor).emit("power:result", {...})
9. Client displays → "Alice is Hacker, Bob is Thief"
```

---

## Testing Checklist

Quick verification before running:

```bash
# Terminal 1: Build & run server
cd apps/server
pnpm install  # if needed
pnpm dev

# Terminal 2: Build & run web
cd apps/web
pnpm install  # if needed
pnpm dev

# Then follow TESTING_GUIDE.md
```

**Success Criteria:**

- [ ] PowerActionPanel shows during mayhem
- [ ] Can click player buttons
- [ ] Can click Center 1/2/3 buttons
- [ ] Random button works
- [ ] Submit sends event
- [ ] Learned info displays
- [ ] Player can't use power twice
- [ ] No console errors

---

## Common Questions

### Q: Why can I only select 1 target?

**A:** It depends on the power's `quantity` field. If `quantity: 3`, you can select up to 3 targets.

### Q: Where does the random selection happen?

**A:** Client-side only. The client shuffles the targets and selects N randomly. Server always receives explicit list.

### Q: Can I see what other players learned?

**A:** No, powers are private. Only the player who used the power sees their learns.

### Q: What happens if someone disconnects?

**A:** If a target disconnects, that learn is skipped. You learn from remaining targets.

### Q: Can I use a power in the reveal phase?

**A:** No, only during mayhem phase. PowerActionPanel only renders then.

### Q: What if I don't use my power?

**A:** That's fine. Power is optional. You just won't learn any roles.

---

## Debugging

### Browser Console

```javascript
// See power results
socket.on("power:result", (data) => console.log("Power result:", data));

// Check if player has used power
const myPlayer = roomState.players.find((p) => p.socketId === socket.id);
console.log("Power used:", myPlayer.powerUsed);
console.log("Learns:", myPlayer.learnsThisGame);

// Check center roles
console.log("Center roles:", roomState.game.centerRoles);
```

### Server Logs

```
[INFO] Executing power: Learn Role
[INFO] Targets: ["pid1", "pid2"]
[INFO] Learns recorded: [
  { targetPlayer: "pid1", learned: "Infiltrator", ... },
  { targetPlayer: "pid2", learned: "Civilian", ... }
]
```

---

## Related Documentation

- **Full details:** `IMPLEMENTATION_SUMMARY.md`
- **How to test:** `TESTING_GUIDE.md`
- **Why it's designed this way:** `ARCHITECTURE_DECISIONS.md`
- **Completion status:** `COMPLETION_REPORT.md`

---

## Version Info

- **Implemented:** Character Power Learning System v1.0
- **Supported Games:** Infiltration (currently)
- **Power Types:** Learn/Role (extensible for others)
- **Target Types:** Players, Center positions
- **Timestamp:** Current session

---
