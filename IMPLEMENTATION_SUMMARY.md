# Character Power Integration - Complete Implementation

## Overview

Successfully integrated Learn/Role character powers into PlayTogether's game logic. Players can now select character powers during character creation and use them during the mayhem phase to learn the roles of other players or center positions.

## Server-Side Implementation

### 1. Type System Extensions (apps/server/src/state/types.ts)

#### New PowerSlot Type

```typescript
type PowerSlot = {
  powerIndex: number | null; // Index into powers array (null = no power)
  type?: string; // Power type (e.g., "Learn", "Protect")
  item?: string; // What you learn (e.g., "Role", "Team")
  where?: string; // Where to target: "Player" or "Center"
  quantity?: number; // How many targets: e.g., 1, 2, 3
};
```

#### New Character Type

```typescript
type Character = {
  name: string;
  description: string;
  team?: "villager" | "infiltrator";
  powers: PowerSlot[]; // Array of power slots for this character
};
```

#### New LearnRecord Type

```typescript
type LearnRecord = {
  powerName: string; // Name of the power used
  targetPlayer?: string; // Socket ID if targeting a player
  targetPlayerName?: string; // Display name of target player
  targetCenter?: number; // Center position (1, 2, or 3)
  learned: string; // The role that was learned
  learnedAt: number; // Timestamp of when power was used
  item?: string; // What was learned (usually "Role")
  where?: string; // Where it was learned from
};
```

#### Player Type Extensions

- `character?: Character` - The character assigned to this player
- `learnsThisGame?: LearnRecord[]` - Array of all learns this player has accumulated
- `powerUsed?: boolean` - Prevents player from using another power this game

#### GameState Type Extensions

- `centerRoles?: InfiltrationRole[]` - The three roles placed in center (Center 1, 2, 3)

### 2. Game Phase Handler Updates (apps/server/src/socket/gamePhaseHandlers.ts)

#### beginRoleReveal() Modification

When roles are revealed at game start:

- Extracts positions [numPlayers+0, numPlayers+1, numPlayers+2] from the shuffled role pool
- Stores these three roles in `room.game.centerRoles`
- These become the Center 1, 2, 3 positions available for Learn power targeting

### 3. Power Submission Handler (apps/server/src/socket/handlers/gameHandlers.ts)

New socket event handler: `game:submitPower`

**Validation Steps:**

1. Room exists
2. Game in "mayhem" phase
3. Player exists in room
4. Player hasn't already used a power this game (`player.powerUsed === false`)
5. Player has a character assigned (`player.character` exists)
6. Player has at least one power available

**Execution:**

- Calls `executeCharacterPower()` to process the power
- Sets `player.powerUsed = true` to enforce once-per-game limit
- Emits updated room state

### 4. Power Execution Logic (apps/server/src/socket/powerLogic.ts)

#### executeCharacterPower() Function

**Input Parameters:**

- `io` - Socket.IO instance for broadcasting
- `room` - Current room state
- `actor` - The player executing the power
- `powerName` - Display name of the power
- `targetPlayerIds` - Array of player socket IDs to target (if where === "Player")
- `targetCenterNumbers` - Array of center positions to target [1, 2, 3] (if where === "Center")
- `powerSlot` - The PowerSlot configuration

**Logic for Learn/Role Powers:**

1. Validates power type is "Role" in the item field
2. **For player targets** (where === "Player"):
   - Loops through each targetPlayerIds
   - Retrieves the target player's role from the room
   - Creates a LearnRecord with targetPlayer and learned role
3. **For center targets** (where === "Center"):
   - Loops through each targetCenter [1, 2, 3]
   - Retrieves role from room.game.centerRoles[target-1]
   - Creates a LearnRecord with targetCenter and learned role
4. **Stores learns** in `actor.learnsThisGame` array
5. **Emits private result**:
   - Sends to `io.to(actor.socketId).emit("power:result", { powerName, learns })`
   - Only the actor receives this event (private/confidential)

**Key Design:**

- Powers are private by design - other players don't know what the player learned
- Learns are persisted in the player object for the results phase
- Can be displayed in "order of the night" in results phase (future enhancement)

## Client-Side Implementation

### 1. Type System Extensions (apps/web/src/types/room.ts)

Added types mirroring server-side:

- `PowerSlot` - Power slot configuration
- `Character` - Character with name, description, team, powers
- `LearnRecord` - Learn record with all tracking fields
- Extended `Player` with `character?`, `learnsThisGame?`, `powerUsed?` fields
- Extended `GameState` with `centerRoles?` field

### 2. Socket Events (apps/web/src/types/socket.ts)

#### New ClientToServerEvents

```typescript
"game:submitPower": (p: {
  roomCode: string;
  powerName: string;
  targetPlayers?: string[];        // Socket IDs if player targets
  targetCenter?: number[];         // [1, 2, 3] if center targets
}) => void;
```

#### Enhanced ServerToClientEvents

Updated `power:result` to support learns format:

```typescript
"power:result": (p: {
  type: string;
  powerName?: string;
  learns?: Array<{
    powerName: string;
    targetPlayer?: string;
    targetPlayerName?: string;
    targetCenter?: number;
    learned: string;               // The role learned
    learnedAt: number;
    item?: string;
    where?: string;
  }>;
  [key: string]: unknown;
}) => void;
```

### 3. PowerActionPanel Component (apps/web/src/components/PlayerPage/PowerActionPanel.tsx)

**Purpose:** UI for players to select power targets and submit

**Props:**

- `roomState` - Current room state
- `mySocketId` - Player's socket ID
- `character` - Player's character (if any)

**Conditional Rendering:**

- Only shows if:
  - Game in "mayhem" phase
  - Player has a character assigned
  - Player has powers
  - Player hasn't used power yet (`powerUsed === false`)
  - Power is a Learn/Role power (`item === "Role"`)

**Target Selection UI:**

For **Player Targets** (`where === "Player"`):

- Displays grid of player buttons
- Each shows player name
- Clickable to select/deselect
- Maximum selections = `powerSlot.quantity`
- Disabled when max selections reached (unless already selected)

For **Center Targets** (`where === "Center"`):

- Displays three buttons: "Center 1", "Center 2", "Center 3"
- Same selection/deselection logic
- Maximum selections = `powerSlot.quantity`

**Control Buttons:**

- **Random Button** - Randomly selects N targets
  - For "Player" targets: randomly picks players
  - For "Center" targets: randomly picks center positions
  - Only shuffles among available positions
- **Selection Info** - Shows "X/Y selected"
- **Submit Button** - Sends power submission to server
  - Only enabled when at least 1 target selected and not submitting
  - Shows "Submitting..." while processing

**Feedback:**

- Green checkmark appears when required selections reached
- Button states update based on selection count

### 4. PowerActionPanel Styling (apps/web/src/components/PlayerPage/PowerActionPanel.css)

Professional, game-themed styling:

- Blue background (#e8f4f8) with matching borders
- Hover effects on buttons
- Selected state highlighting (dark blue)
- Disabled state styling (50% opacity)
- Responsive flex layout with wrapping
- Green submit button, gray random button
- Green success message when ready

### 5. PlayerPage Integration (apps/web/src/pages/PlayerPage.tsx)

**PowerActionPanel Placement:**

- Rendered during mayhem phase
- After old power prompts, before "Ready for Voting" button
- Callback updates UI with learned role information

**power:result Event Handler Enhancement:**

```typescript
const onPowerResult = (payload) => {
  // Handles new Learn power format
  if (payload.learns && payload.learns.length > 0) {
    const learnTexts = payload.learns.map(
      (learn) =>
        `${learn.targetPlayerName || `Center ${learn.targetCenter}`} is ${learn.learned}`,
    );
    setLearnedInfo(learnTexts.join(", "));
  }
  // Still supports old-style power results for backward compatibility
  else {
    if (typeof payload.learned === "string") setLearnedInfo(payload.learned);
    if (typeof payload.note === "string") setPowerNotifications(payload.note);
  }
};
```

## Data Flow Diagram

```
1. Character Created (Client)
   ↓ (with Learn/Role power)

2. Game Starts (Server)
   ↓
   - 3 center roles assigned: room.game.centerRoles
   - Player gets character: player.character = { name, powers: [...] }

3. Mayhem Phase (Client)
   ↓
   - PowerActionPanel renders
   - Shows player buttons (or Center 1/2/3 buttons)
   - Player selects targets

4. Player Submits Power (Client)
   ↓ game:submitPower event

5. Server Validation & Execution (Server)
   ↓
   - Validates: room, phase, player, character, power exists
   - executeCharacterPower():
     * Retrieves target roles
     * Creates LearnRecord(s)
     * Stores in player.learnsThisGame

6. Private Result Sent (Server)
   ↓ power:result event (to actor only)

7. Client Displays Result (Client)
   ↓
   - OnPowerResult handler fires
   - Shows "Alice is Hacker, Bob is Thief"
   - Player learns persisted for results phase

8. Results Phase (Future)
   ↓
   - Order of the night can include learn order
   - "X learned Y is Z at T"
```

## Socket Event Sequence

### Server → Client (Private)

```
Emitted to: io.to(actor.socketId)
Event: "power:result"
Payload: {
  powerName: "Role Peek",
  learns: [
    {
      powerName: "Role Peek",
      targetPlayer: "socket-id-123",
      targetPlayerName: "Alice",
      learned: "Hacker",
      learnedAt: 1699999999,
      item: "Role",
      where: "Player"
    }
  ]
}
```

### Client → Server

```
Event: "game:submitPower"
Payload: {
  roomCode: "ABCD",
  powerName: "Role Peek",
  targetPlayers: ["socket-id-1", "socket-id-2"],
  targetCenter: undefined
}

OR

Payload: {
  roomCode: "ABCD",
  powerName: "Vault Peek",
  targetPlayers: undefined,
  targetCenter: [1, 3]
}
```

## Key Features

✅ **Once Per Game** - Players can only use one power per game
✅ **Private Results** - Only the acting player sees what they learned
✅ **Flexible Targeting** - Can target players or center positions
✅ **Pre-Decided Quantity** - Number of targets set during character creation
✅ **Center Roles** - Three fixed positions with roles available for learning
✅ **No Dropdowns** - Button-based UI for intuitive selection
✅ **Random Option** - Can randomly select targets
✅ **Tracked Learns** - All learns stored with target and learned role info
✅ **Type Safe** - Full TypeScript coverage

## Testing Checklist

- [ ] Load character with Learn/Role power in game
- [ ] Verify centerRoles assigned at game start
- [ ] During mayhem, verify PowerActionPanel renders
- [ ] Select player targets and submit
- [ ] Verify power:result event received (should be private)
- [ ] Check learnedInfo displayed correctly
- [ ] Try selecting center positions instead
- [ ] Test Random button selects correct number
- [ ] Verify powerUsed flag prevents second power submission
- [ ] Verify player.learnsThisGame array populated correctly
- [ ] Check results phase can display learns (when results UI updated)

## Files Modified

### Server

- `apps/server/src/state/types.ts` - Added PowerSlot, Character, LearnRecord types
- `apps/server/src/socket/gamePhaseHandlers.ts` - Updated beginRoleReveal() to assign centerRoles
- `apps/server/src/socket/handlers/gameHandlers.ts` - Added game:submitPower handler
- `apps/server/src/socket/powerLogic.ts` - Added executeCharacterPower() function

### Client

- `apps/web/src/types/room.ts` - Added PowerSlot, Character, LearnRecord types
- `apps/web/src/types/socket.ts` - Added game:submitPower event, updated power:result
- `apps/web/src/components/PlayerPage/PowerActionPanel.tsx` - New UI component
- `apps/web/src/components/PlayerPage/PowerActionPanel.css` - Styling
- `apps/web/src/components/PlayerPage/index.ts` - Added export
- `apps/web/src/pages/PlayerPage.tsx` - Integrated PowerActionPanel, updated power:result handler

## Future Enhancements

1. **Results Phase Display**
   - Show "Order of the Night" including when learns happened
   - Track which player learned what and from whom

2. **Other Power Types**
   - Implement other Learn variants (Team, Item)
   - Add Protect, Swap, Eliminate powers
   - Support conditional powers (e.g., "Infiltrator only")

3. **Visual Enhancements**
   - Animation when power is submitted
   - Toast notifications for learn results
   - Highlight target in results when power is revealed

4. **Advanced Features**
   - Rate limiting/cooldowns
   - Power chaining logic
   - Counter-powers that block reveals
   - Statistics tracking (most-used powers, success rates)
