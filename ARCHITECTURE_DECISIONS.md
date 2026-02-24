# Architectural Decisions: Character Powers Integration

## Overview

This document explains the key architectural decisions made during the character powers integration, the rationale behind them, and how they fit into the existing PlayTogether architecture.

## 1. Power Storage & Tracking

### Decision: Powers stored in Character object on Player

**Structure:**

```typescript
Player {
  character: {
    name: string;
    description: string;
    team?: "villager" | "infiltrator";
    powers: PowerSlot[];  // ← Powers live here
  };
  learnsThisGame: LearnRecord[];  // ← Learn records live here
  powerUsed: boolean;  // ← Once-per-game enforcement
}
```

**Rationale:**

- **Character binding**: Powers are part of character definition, not role
- **Isolation**: Each player has their own character instance
- **Flexibility**: Characters can have 0+ powers
- **Persistence**: Learns tracked for entire game in learnsThisGame array
- **Once-per-game**: Single boolean flag prevents second power use

**Alternative Considered:**

- Store powers in Role (rejected: roles are generic, powers should be character-specific)
- Store learns in GameState (rejected: learns are player-specific, not game-wide)

### Decision: LearnRecord tracking includes full context

**LearnRecord fields:**

- `powerName` - What power was used
- `targetPlayer` / `targetPlayerName` - Who/what was targeted
- `targetCenter` - Which center (1, 2, 3) if targeting center
- `learned` - The role that was learned
- `learnedAt` - Timestamp for ordering
- `item` - Type of learn (e.g., "Role")
- `where` - Location of learn (e.g., "Player", "Center")

**Rationale:**

- **Rich history**: Results phase can show full order of the night
- **Audit trail**: Can see exactly what was learned and when
- **Flexible display**: Can show "Alice learned Bob is Hacker at 12:34"
- **Future analytics**: Supports power usage statistics

## 2. Center Role Management

### Decision: Center roles assigned during role reveal, stored in GameState

**Implementation:**

```typescript
// In gamePhaseHandlers.ts, beginRoleReveal()
room.game.centerRoles = [
  shuffledRoles[numPlayers],
  shuffledRoles[numPlayers + 1],
  shuffledRoles[numPlayers + 2],
];
```

**Rationale:**

- **Single assignment**: Center roles determined once at game start
- **Position stability**: Always 3 positions (Center 1, 2, 3)
- **Predictable indexing**: Easy to access: centerRoles[0], [1], [2]
- **Shuffle determinism**: Uses same shuffle pool as player roles
- **Timing**: Assigned when roles are dealt (role reveal phase)

**Alternative Considered:**

- Assign during game start (rejected: role reveal is more logical time)
- Randomize at power-use time (rejected: exploitable, unfair)
- Store as separate array (chosen: already in GameState as cleanest location)

## 3. Power Execution & Privacy

### Decision: Private socket emission only to actor

**Implementation:**

```typescript
io.to(actor.socketId).emit("power:result", {
  powerName,
  learns: [...]
});
// No broadcast to other players
```

**Rationale:**

- **Information hiding**: Other players don't know what actor learned
- **Game balance**: Prevents metagaming ("Alice learned Bob is Hacker")
- **Role fidelity**: In real social deduction, powers are private
- **Socket.IO native**: io.to() is built-in efficient broadcast

**Alternative Considered:**

- Broadcast with redacted info (rejected: too much info leaks)
- No emission (rejected: player needs feedback)
- Emit after voting ends (rejected: hurts UX, player forgets their learn)

### Decision: Separate handler for character powers vs role powers

**Handlers:**

- Old: `player:usePower` → `executePower()` (for Thief/Engineer/Hacker role powers)
- New: `game:submitPower` → `executeCharacterPower()` (for character Learn powers)

**Rationale:**

- **Clean separation**: Character powers are fundamentally different
- **No conflicts**: Both can coexist without mixing logic
- **Easy to extend**: Can add more character power types independently
- **Backward compatible**: Existing role powers unaffected

**Alternative Considered:**

- Single unified handler (rejected: role and character powers have different UI/logic)
- Reuse `player:usePower` (rejected: confusing socket event semantics)

## 4. Target Selection & Validation

### Decision: Validate targets exist before executing

**Validation flow:**

```typescript
// In executeCharacterPower
for (const playerId of targetPlayerIds) {
  const target = room.players.find(p => p.socketId === playerId);
  if (target) {
    // Create learn record
    learns.push({
      targetPlayer: playerId,
      targetPlayerName: target.name,
      learned: target.role,
      ...
    });
  }
  // Silently skip if player not found (disconnected?)
}
```

**Rationale:**

- **Defensive**: Players can disconnect during mayhem
- **No crashes**: Missing targets don't break power execution
- **Partial success**: If 1 of 3 targets disconnected, still learn from 2
- **User-friendly**: No error messages for unavoidable events

**Alternative Considered:**

- Throw error if target not found (rejected: harsh UX for disconnects)
- Check in handler before calling execute (rejected: would duplicate logic)

## 5. Client-Side Power Selection UI

### Decision: Button-based target selection (no dropdowns)

**Rationale (user request):**

- **Faster interaction**: Click directly instead of opening dropdown
- **Visual clarity**: All targets visible at once
- **Mobile friendly**: Larger touch targets than dropdowns
- **Immediate feedback**: Selected state visible instantly

**Implementation:**

```typescript
// For player targets:
roomState.players.map(p => <button key={p.socketId}>{p.name}</button>)

// For center targets:
[1, 2, 3].map(i => <button key={`center-${i}`}>Center {i}</button>)
```

### Decision: Separate UI from old powerPrompt system

**Old system:**

- Server prompts player with power:prompt event
- Client shows dropdown selector
- Used for Thief/Engineer/Hacker powers

**New system:**

- PowerActionPanel component renders during mayhem
- Button-based selection
- Own socket event: game:submitPower
- Coexists with old system (both can show)

**Rationale:**

- **No regression**: Old powers keep working
- **UI consistency**: Similar look/feel to game buttons
- **Independent**: Each system can evolve separately
- **Cleaner**: One component per power type

## 6. Quantity & Selection Limits

### Decision: Pre-decided quantity, enforced at UI level

**Implementation:**

```typescript
// In PowerActionPanel
const quantity = activePower.quantity || 1;
const canSelectMore = selected < quantity;

// Button disabled when max reached (unless already selected)
<button disabled={!isSelected && selected >= quantity}>
```

**Rationale:**

- **Simple logic**: Quantity set once during character creation
- **No calculation**: No dynamic limits or special rules
- **Clear UX**: Shows "X/Y selected" counter
- **Submit ready**: "Ready to submit" message when complete

**Alternative Considered:**

- Server enforces limits (rejected: less responsive UI)
- Dynamic limits based on game state (rejected: adds complexity)
- Slider to choose quantity (rejected: user requested buttons only)

## 7. Random Selection

### Decision: Client-side random selection, server never receives "random" request

**Implementation:**

```typescript
// Client-side Random button
const handleRandom = () => {
  const shuffled = [...targets].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, quantity);
  setSelectedTargets({ players: selected });
};

// Server receives explicit list
socket.emit("game:submitPower", {
  targetPlayers: [pid1, pid2, ...],  // ← Always explicit
  targetCenter: [1, 3]
});
```

**Rationale:**

- **Transparency**: Server never handles randomness
- **Simplicity**: No random seed sharing or verification
- **Instant feedback**: Player sees random selection immediately
- **Disable conditionally**: Only show if host setting allows random

**Alternative Considered:**

- Server-side random (rejected: network round-trip, trust issues)
- Shared seed (rejected: unnecessary complexity)

## 8. Error Handling Strategy

### Decision: Graceful degradation, minimal error messages

**Approach:**

```typescript
// Handler checks each precondition
if (!player) {
  socket.emit(ERROR_EVENTS.BAD_REQUEST, "Player not found");
  return;
}

if (player.powerUsed) {
  socket.emit(ERROR_EVENTS.BAD_REQUEST, "Already used power");
  return;
}

// Execute doesn't crash on missing targets
for (const playerId of targetPlayerIds) {
  const target = room.players.find(...);
  if (target) {
    // Process
  }
  // Continue if not found
}
```

**Rationale:**

- **Early validation**: Catch issues in handler, not executor
- **Silent failures**: Missing players (disconnects) don't error
- **User messaging**: Generic "something went wrong" avoids confusion
- **Server stability**: No unhandled exceptions

## 9. Type Safety Across Boundaries

### Decision: Mirror types on both server and client

**Duplication:**

- PowerSlot, Character, LearnRecord, etc. defined on both sides
- NOT in shared package (to avoid circular dependencies)

**Rationale:**

- **Decoupling**: Server/client can evolve independently
- **No runtime dependency**: No shared module needed at runtime
- **Type safety**: TypeScript catches mismatches at build time
- **Future: shared package**: Can refactor to shared when mature

**Alternative Considered:**

- Shared types package (considered for future)
- Single source of truth via code generation (considered for future)
- Runtime validation (rejected: overkill for internal protocol)

## 10. Integration with Existing Systems

### Decision: Minimal changes to existing code

**Changes made:**

- `types.ts`: Added new types (no removed fields)
- `gamePhaseHandlers.ts`: Added centerRoles assignment (no removed logic)
- `gameHandlers.ts`: Added new handler (no modified handlers)
- `powerLogic.ts`: Added new function (kept old `executePower`)

**Rationale:**

- **Backward compatible**: Existing role powers still work
- **Non-breaking**: Can roll back character powers without affecting game
- **Parallel**: Old and new systems coexist
- **Test isolation**: Can test new code independently

## Future Architectural Considerations

### 1. Power Type System

Currently hardcoded for "Learn" powers with "Role" item. Future:

```typescript
// Extensible power type system
type PowerType = "Learn" | "Protect" | "Swap" | "Eliminate";
type LearnItem = "Role" | "Team" | "Item";

// Would allow:
interface Power {
  type: PowerType;
  item?: LearnItem;
  effect: (game, actor, targets) => void;
}
```

### 2. Character Creation Service

Currently characters are ad-hoc. Future:

- Character repository (database)
- Predefined character sets
- User-created characters
- Character balancing metrics

### 3. Shared Types Package

```
packages/shared/src/
  types/
    power.ts
    character.ts
    room.ts
```

Then import in both server and web.

### 4. Power History & Analytics

```typescript
interface PowerHistory {
  gameId: string;
  roomCode: string;
  actor: Player;
  power: Character.powers[0];
  targets: string[];
  result: any;
  timestamp: number;
}

// Store in optional database for stats
```

## Summary

The character power architecture follows these principles:

1. **Separation of concerns**: Character powers separate from role powers
2. **Type safety**: Full TypeScript coverage with mirrored types
3. **Privacy**: Learns are private to the actor
4. **Extensibility**: Can add more power types without core changes
5. **User experience**: Button-based UI, immediate feedback
6. **Reliability**: Graceful handling of disconnects and edge cases
7. **Maintainability**: Minimal changes to existing systems
8. **Testing**: Clear boundaries make unit testing straightforward
