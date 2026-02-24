# Quick Start: Testing Character Powers

## Running the Application

### Terminal 1 - Server

```bash
cd apps/server
pnpm dev
# Starts on http://localhost:3001
```

### Terminal 2 - Web

```bash
cd apps/web
pnpm dev
# Starts on http://localhost:5173
```

## Manual Testing Flow

### 1. Create a Character with Learn Power

1. Open http://localhost:5173
2. Navigate to character creation
3. Create a character with a "Learn Role" power
4. Set quantity to 1-3 (how many roles to learn)
5. Save character

### 2. Host a Game

1. Click "Host Room"
2. Select "Infiltration" game
3. Set game options (number of infiltrators, etc.)
4. Share room code

### 3. Join as Multiple Players

1. In new browser tabs/windows:
   - Enter player name (Alice, Bob, Carol, etc.)
   - Enter the room code
   - Join room

### 4. Start Game & Test Power

1. All players click "Ready"
2. Host clicks "Start Game"
3. Wait for role reveal phase
4. Acknowledge roles
5. Game enters **mayhem** phase
6. Player with Learn power should see **PowerActionPanel**

### 5. Select Targets & Submit

**If targeting players:**

- Click player buttons (e.g., "Alice", "Bob")
- Select up to the quantity limit
- Can click "Random" to auto-select

**If targeting center:**

- Click "Center 1", "Center 2", or "Center 3"
- Select up to the quantity limit
- Can click "Random" to auto-select

**Submit:**

- Click "Submit" button
- Should see: "You learned: Alice is Hacker, Bob is Thief"

### 6. Verify Server-Side

Check server logs in Terminal 1:

- Should see power execution logged
- player.learnsThisGame array should be populated
- No errors in console

## API Debugging

### Check Power Result Event (Browser Console)

```javascript
// In browser DevTools console
socket.on("power:result", (data) => {
  console.log("Power result:", data);
});
```

### Check Room State (Browser Console)

```javascript
socket.on("room:state", (state) => {
  const myPlayer = state.players.find((p) => p.socketId === socket.id);
  console.log("My learns:", myPlayer.learnsThisGame);
  console.log("My powerUsed:", myPlayer.powerUsed);
});
```

### Check Center Roles (Server Console)

```typescript
// After role reveal, check in gamePhaseHandlers.ts
console.log("Center roles:", room.game.centerRoles);
// Should output: ["infiltrator", "civilian", "thief"], etc.
```

## Known Issues & Workarounds

### Issue: PowerActionPanel Not Showing

**Check:**

1. Game in mayhem phase? (not reveal, voting, or results)
2. Player has character? (`player.character !== undefined`)
3. Character has powers? (`character.powers.length > 0`)
4. Power has powerIndex? (`powerSlot.powerIndex !== null`)
5. Power item is "Role"? (`powerSlot.item === "Role"`)
6. Player hasn't used power yet? (`player.powerUsed !== true`)

**Debug:**

```javascript
// In browser console
const myPlayer = roomState.players.find((p) => p.socketId === socket.id);
console.log({
  hasCharacter: !!myPlayer?.character,
  hasPowers: myPlayer?.character?.powers.length,
  powerUsed: myPlayer?.powerUsed,
  phase: roomState.game.phase,
});
```

### Issue: Learns Not Recorded

**Check:**

1. Server received game:submitPower event
2. executeCharacterPower was called
3. Target players/center positions exist in room state
4. Power result event was emitted

**Debug on server:**

```typescript
// In powerLogic.ts, add:
console.log("Executing power for:", actor.name);
console.log("Targets:", targetPlayerIds, targetCenterNumbers);
console.log("Learns recorded:", actor.learnsThisGame);
```

### Issue: Can't Select Multiple Targets

**Check:**

- `powerSlot.quantity` value (should be >= 2)
- Selected count < quantity (button should be enabled)

**Debug:**

```javascript
const activePower = myPlayer.character.powers[0];
console.log("Quantity:", activePower.quantity);
```

## Files to Review

### Understanding the Flow

1. [powerLogic.ts](apps/server/src/socket/powerLogic.ts) - Core execution
2. [gamePhaseHandlers.ts](apps/server/src/socket/gamePhaseHandlers.ts) - Center role assignment
3. [PowerActionPanel.tsx](apps/web/src/components/PlayerPage/PowerActionPanel.tsx) - UI component

### Type Definitions

1. [Server types.ts](apps/server/src/state/types.ts) - PowerSlot, Character, LearnRecord
2. [Web room.ts](apps/web/src/types/room.ts) - Client-side mirrors

## Next Steps (Post-Testing)

### 1. Results Phase Integration

- Display "Order of the Night" including learns
- Show each learn with timestamp and target

### 2. Character Selection UI

- Show available characters with powers
- Allow host to assign characters to players
- Or auto-assign random characters

### 3. Other Power Types

- Item learns (learn what item center has)
- Team learns (learn if player is villager or infiltrator)
- Protect, Swap, and other action powers

### 4. UI Polish

- Animations when power is submitted
- Toast notifications instead of inline text
- Modal dialog for power selection

### 5. Testing

- Unit tests for executeCharacterPower
- Integration tests for game:submitPower flow
- E2E tests with multiple players

## Useful Commands

### Run both apps in parallel (needs 2 terminals)

```bash
# Terminal 1
cd apps/server && pnpm dev

# Terminal 2
cd apps/web && pnpm dev
```

### Build for production

```bash
# Server
cd apps/server && pnpm build

# Web
cd apps/web && pnpm build
```

### Type checking

```bash
# From workspace root
cd apps/server && tsc -b
cd apps/web && tsc -b
```

### View Socket Events

Add to useAppStore or create a debug panel to log all events:

```typescript
socket.onAny((event, ...args) => {
  console.log("Socket event:", event, args);
});
```

## Success Criteria

✅ Player selects character with Learn power
✅ Game starts with centerRoles assigned
✅ PowerActionPanel renders during mayhem
✅ Player can click targets (players or center)
✅ Submit button sends game:submitPower event
✅ Server processes and executes power
✅ Player receives private power:result
✅ LearnedInfo displays: "X is Y"
✅ player.learnsThisGame array populated
✅ player.powerUsed prevents second use
✅ No server errors in logs
