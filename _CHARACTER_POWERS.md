# Character Powers System

**TLDR:** Documentation for the character-based power system in PlayTogether's Infiltration game. Covers the PowerSlot, Character, and LearnRecord data structures, how character powers are created and assigned, how powers execute during the mayhem phase, and how to add new power types.

## Overview

Characters are pre-built game identities with one or more powers. During the mayhem phase, a player with an assigned character can use their character's power to learn information about other players or center positions. Powers are private—only the acting player sees the result.

- **Character creation:** Admin screen (`AdminPage`) where characters are designed with power slots
- **Character assignment:** Server assigns a saved character to each player when the game starts
- **Power execution:** During mayhem phase, the player submits their power via `game:submitPower`
- **Private results:** Server emits `power:result` exclusively to the acting player

---

## Data Structures

### PowerSlot

Represents a single power slot within a character's power configuration.

**Server type (`apps/server/src/state/types.ts`):**

```typescript
type PowerSlot = {
  powerIndex: number | null; // Index into INFILTRATION_POWERS array (null = no power)
  type?: string;             // Power category: "Learn", "Reveal", "Action", etc.
  item?: string;             // Power sub-type: "Role", "Team", "See", etc.
  where?: string;            // Targeting location: "Player" or "Center"
  quantity?: number;         // Number of targets (e.g., 1, 2, 3)
};
```

**Client type (`apps/web/src/types/characterCreation.ts`) — used in character creation UI:**

```typescript
interface PowerSlot {
  type: string | null;                // Power category
  item: string | null;                // Power sub-type
  where: string | null;               // Targeting location
  powerIndex: number | null;          // Index into INFILTRATION_POWERS array
  toggles: Record<string, boolean>;   // Power modifiers (vault, infected, etc.)
  amount: string;                     // Quantity as string ("1", "2", "ALL")
  timing: "SAME_PHASE" | "NEXT_PHASE" | null; // When power resolves
}
```

**Key toggles:**

| Toggle | Description |
|--------|-------------|
| `vault` | Power operates in vault mode |
| `infected` | Power operates in infected mode |
| `lookPostAction` | Player sees vote results before acting |
| `doPower` | Alternative power execution mode |
| `allowRandom` | Player may choose random target during mayhem |
| `fixedAction` | Power action is fixed (not selectable) |
| `fixedInitiative` | Power initiative/timing is fixed |

---

### Character

Represents a complete playable character with a name, description, team alignment, and one or more power slots.

**Server type (`apps/server/src/state/types.ts`):**

```typescript
type Character = {
  name: string;                        // Display name (e.g., "Agent Smith")
  description: string;                 // Flavor text / character background
  team?: "villager" | "infiltrator";   // Team assignment (undefined if determined by power)
  powers: PowerSlot[];                 // Array of power slots (usually 1–3)
};
```

**In `Player`:**

```typescript
type Player = {
  // ...other fields
  character?: Character;   // Assigned at game start; undefined if no character loaded
  powerUsed?: boolean;     // true after player submits a power (once-per-game limit)
  learnsThisGame?: LearnRecord[]; // Accumulated learn results for this player
};
```

---

### LearnRecord

Tracks a single "learn" result—what a player discovered about a target after using a Learn power.

```typescript
type LearnRecord = {
  powerName: string;          // Name of the power that produced this learn (e.g., "Role Peek")
  targetPlayer?: string;      // Socket ID of the targeted player (if targeting a player)
  targetPlayerName?: string;  // Display name of the targeted player
  targetCenter?: number;      // Center position (1, 2, or 3) if targeting center
  learned: string;            // The role that was discovered (e.g., "hacker")
  learnedAt: number;          // Unix timestamp of when the power was used
  item?: string;              // What was learned (e.g., "Role", "Team")
  where?: string;             // Where it was learned from ("Player" or "Center")
};
```

**Access pattern:** `player.learnsThisGame` — an array of all learns accumulated by that player across the game.

---

### CharacterInCreation

Used only in the admin character-creation UI (`AdminPage`). Represents the in-progress state of a character being designed.

```typescript
interface CharacterInCreation {
  name: string;                         // Character display name
  description: string;                  // Character background / flavor text
  team: "villager" | "infiltrator" | null; // null when determined by win condition power
  powerSlots: PowerSlot[];              // Array of power slots being configured
}
```

---

## InfiltrationPower Constants

All available powers are defined in `apps/web/src/constants/infiltrationPowers/` (46 powers total across 7 files). The `powerIndex` field in a `PowerSlot` references one of these.

```typescript
interface InfiltrationPower {
  index: number;          // Unique identifier (0–45)
  type: string;           // Power category (e.g., "Learn", "Reveal", "Swap")
  item: string;           // Power sub-type (e.g., "Role", "Team", "See")
  where: string;          // Targeting location
  min: number;            // Minimum number of targets
  max: number;            // Maximum number of targets
  allowRandom: boolean;   // Whether random targeting is permitted
  description: string;    // Human-readable effect description
  winCondition?: boolean; // If true, this power determines team alignment
  toggle?: {
    vault?: boolean;
    infected?: boolean;
    lookPostAction?: boolean;
    doPower?: boolean;
  };
}
```

**Power categories by file:**

| File | Category | Count |
|------|----------|-------|
| `learn.ts` | Learn | 16 |
| `reveal.ts` | Reveal | 4 |
| `swap.ts` | Swap | 7 |
| `alter.ts` | Alter | 8 |
| `tamper.ts` | Tamper | 7 |
| `condition.ts` | Condition | 2 |
| `settingsNone.ts` | Settings / None | 2 |

---

## Character Creation Workflow

### 1. Design a Character (Admin UI)

Open the Admin page (`/admin`) and use the character creation form:

1. Enter a character name and description
2. Select team alignment (`villager` / `infiltrator`), or leave as `null` if a power determines it
3. Add one or more power slots:
   - Choose a power type (Learn, Reveal, etc.)
   - Choose a power item (Role, Team, etc.)
   - Choose a target location (Player, Center, etc.)
   - Set quantity / amount
   - Enable any toggles the power supports
4. Save the character — it is stored via the API (persisted to `apps/server/data/characters.json`)

### 2. Load Characters for a Game

Characters are loaded by the server at game start from the persisted store. Each player can be assigned a character that matches their team alignment.

### 3. Character Assignment at Game Start

During `beginRoleReveal()` in `apps/server/src/socket/gamePhaseHandlers.ts`:

- Three center roles are drawn from the shuffled role pool and stored in `room.game.centerRoles`
- Each player gets a character assigned: `player.character = { name, description, team, powers }`
- The assigned character is broadcast to all players via `room:state`

---

## Power Execution During Mayhem Phase

### Client Flow

1. `PowerActionPanel` component renders if:
   - Current phase is `"mayhem"`
   - The player has a character (`player.character` exists)
   - The character has at least one power slot
   - The player has not yet used their power (`player.powerUsed !== true`)
   - The power is a Learn/Role type (`powerSlot.item === "Role"`)

2. The player selects targets:
   - **Player targets** (`where === "Player"`): Grid of player name buttons, up to `powerSlot.quantity` selections
   - **Center targets** (`where === "Center"`): Three buttons labeled "Center 1", "Center 2", "Center 3"

3. The player clicks Submit, emitting `game:submitPower`

### Server Flow

The `game:submitPower` handler in `apps/server/src/socket/handlers/gameHandlers.ts`:

1. Validates: room exists, phase is `"mayhem"`, player exists, player hasn't used power
2. Validates: player has a character with at least one power slot
3. Calls `executeCharacterPower()` in `apps/server/src/socket/powerLogic.ts`
4. Sets `player.powerUsed = true` to enforce once-per-game limit
5. Emits updated `room:state` to all players

### `executeCharacterPower()` Logic

```
For each target (player or center):
  1. Retrieve the target's role:
     - Player target: room.players[targetId].role
     - Center target: room.game.centerRoles[targetCenter - 1]
  2. Create a LearnRecord with target info and discovered role
  3. Append to actor.learnsThisGame[]

Emit power:result to actor only (private):
  io.to(actor.socketId).emit("power:result", { powerName, learns })
```

---

## Socket Events

### game:submitPower (Client → Server)

```typescript
socket.emit("game:submitPower", {
  roomCode: "ABCD",
  powerName: "Role Peek",          // Display name of the power used
  targetPlayers?: string[],         // Socket IDs of targeted players (if where === "Player")
  targetCenter?: number[],          // Center positions [1, 2, 3] (if where === "Center")
});
```

**Validation errors:**

```typescript
socket.emit("error:bad_request", { message: "Wrong game phase" });
socket.emit("error:bad_request", { message: "Already used power this game" });
socket.emit("error:bad_request", { message: "No character assigned" });
socket.emit("error:bad_request", { message: "No powers available" });
```

### power:result (Server → Client, private)

Sent **only to the acting player**. Other players do not receive this event.

```typescript
socket.emit("power:result", {
  powerName: "Role Peek",
  learns: [
    {
      powerName: "Role Peek",
      targetPlayer: "socket-id-123",    // present if player target
      targetPlayerName: "Alice",
      learned: "hacker",
      learnedAt: 1699999999000,
      item: "Role",
      where: "Player"
    },
    {
      powerName: "Vault Peek",
      targetCenter: 2,                  // present if center target
      learned: "engineer",
      learnedAt: 1699999999001,
      item: "Role",
      where: "Center"
    }
  ]
});
```

---

## Power Validation Rules

The character creation system enforces 8 validation rules:

| Rule | Description |
|------|-------------|
| No Action Restriction | "No Action" power only allowed in Slot 1 |
| Roll Rolecall Conflict | "Roll Rolecall" cannot coexist with certain powers |
| Timing Compatibility | Learn/Reveal powers require a timing selection |
| Murderer Rules | Murderer role has specific power constraints |
| Predicter Rules | Predicter role has specific power constraints |
| Toggle Applicability | Toggles only shown when the power supports them |
| Amount Validation | Amount must be within the power's min/max range |
| Win Condition Detection | Powers with `winCondition: true` prevent manual team selection |

See `apps/web/src/utils/characterCreation/validators.ts` for full validation logic.

---

## Power Compatibility

Powers within a character are checked for compatibility against each other. The rules are defined in `apps/web/src/utils/characterCreation/powerCompatibility.ts`.

**Key compatibility principles:**

- Some power types are mutually exclusive in the same character
- Certain toggles are only valid on specific power categories
- `winCondition` powers conflict with explicit team assignments

---

## Center Roles

Three roles are set aside as "center roles" when the game starts. They are never assigned to players and are available as targets for Learn/Center powers.

**Structure in `GameState`:**

```typescript
centerRoles?: [InfiltrationRole, InfiltrationRole, InfiltrationRole];
// Example: ["civilian", "spy", "hacker"]
// Position 1 = index 0, Position 2 = index 1, Position 3 = index 2
```

**How they are assigned** (in `beginRoleReveal()`):

```
shuffledRoles = [...playerRoles, ...extraRoles]
centerRoles = [shuffledRoles[N], shuffledRoles[N+1], shuffledRoles[N+2]]
// where N = number of players
```

---

## How to Add a New Power Type

1. **Define the power** in the appropriate file under `apps/web/src/constants/infiltrationPowers/` (or create a new file for a new category).

2. **Assign an index** — increment the last index in the category, or start a new range.

3. **Add execution logic** in `apps/server/src/socket/powerLogic.ts`:

```typescript
// In executeCharacterPower()
if (powerSlot.type === "NewType" && powerSlot.item === "NewItem") {
  return executeNewTypePower(io, room, actor, targets, powerSlot);
}
```

4. **Implement the execution function** returning an array of `LearnRecord` objects (or equivalent result type for non-learn powers).

5. **Update the PowerActionPanel UI** if the new power requires a different target selection mechanism.

6. **Update `_VOCABULARY.md`** if the new power introduces new terminology.

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/server/src/state/types.ts` | Server-side PowerSlot, Character, LearnRecord types |
| `apps/server/src/socket/powerLogic.ts` | Power execution logic (`executeCharacterPower`) |
| `apps/server/src/socket/handlers/gameHandlers.ts` | `game:submitPower` socket handler |
| `apps/server/src/socket/gamePhaseHandlers.ts` | Center role assignment in `beginRoleReveal` |
| `apps/web/src/types/characterCreation.ts` | Client-side character creation types |
| `apps/web/src/types/room.ts` | Client-side PowerSlot, Character, LearnRecord types |
| `apps/web/src/types/socket.ts` | `game:submitPower` and `power:result` event types |
| `apps/web/src/constants/infiltrationPowers/` | All 46 power definitions |
| `apps/web/src/utils/characterCreation/` | Validation, compatibility, filter, helper utilities |
| `apps/web/src/components/PlayerPage/PowerActionPanel.tsx` | Mayhem-phase power submission UI |
| `apps/web/src/lib/characterPersistence.ts` | Character save/load API client |
| `apps/server/src/api/characters.ts` | Character CRUD REST endpoints |
| `apps/server/data/characters.json` | Persisted character definitions |

---

For socket event details, see [\_API_REFERENCE.md](_API_REFERENCE.md).

For game phase rules and role descriptions, see [\_GAME_RULES.md](_GAME_RULES.md).
