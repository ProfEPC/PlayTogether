# PlayTogether - Game Rules & Configuration

**TLDR:** Overview of two games (Infiltration social deduction, Odd One Out puzzle). Detailed Infiltration rules: flow, roles, phase durations, win conditions, special power usage and resolution. Configuration options (player counts, durations, role selection). How to modify rules safely (both files must stay in sync). Balancing guidelines by player count. Testing checklist and edge cases to consider.

## Overview

Game rules and configuration are defined in two mirrored files to ensure consistency:

- **Server:** [apps/server/src/state/gameRules.ts](apps/server/src/state/gameRules.ts)
- **Client:** [apps/web/src/constants/gameRules.ts](apps/web/src/constants/gameRules.ts)

**Important:** Keep both files in sync. If you change rules on the server, update the client copy too.

## Supported Games

### 1. Infiltration (Social Deduction)

A hidden role game inspired by Mafia/Werewolf. Players have secret roles and must deduce who the infiltrator is through discussion and voting.

#### Game Flow

1. **Setup Phase:** Host selects roles to include in the game
2. **Role Assignment:** Roles randomly distributed to players
3. **Reveal Phase:** All players see their own role (hidden from others)
4. **Mayhem Phase:** Special roles can use powers on other players
5. **Voting Phase:** All players vote on who to eliminate
6. **Results:** Show votes and determine winner

#### Roles

**Standard Roles:**

| Role            | Team        | Ability                         | Objective                               |
| --------------- | ----------- | ------------------------------- | --------------------------------------- |
| **Civilian**    | Civilians   | None                            | Find and vote out the Infiltrator       |
| **Infiltrator** | Infiltrator | Observe votes                   | Survive until civilians are outnumbered |
| **Spy**         | Civilians   | See other player                | Help identify Infiltrator               |
| **Engineer**    | Civilians   | Protect player from elimination | Keep team members safe                  |
| **Hacker**      | Civilians   | Disable player power            | Sabotage special roles                  |
| **Thief**       | Civilians   | Steal a role ability            | Gain temporary power                    |

**Role Configuration:**

```typescript
// Example: Host selects these roles for a 6-player game
const selectedRoles = [
  "civilian", // 2x
  "infiltrator", // 1x
  "spy", // 1x
  "engineer", // 1x
  "hacker", // 1x
];
```

#### Phase Durations

| Phase  | Default Duration | Configurable          |
| ------ | ---------------- | --------------------- |
| Reveal | 3 seconds        | No (hardcoded)        |
| Mayhem | 30 seconds       | Yes (host can change) |
| Voting | 60 seconds       | Yes (host can change) |

#### Win Conditions

- **Civilians Win:** Successfully eliminate the infiltrator
- **Infiltrator Wins:** Civilians don't identify them before round ends
- **Draw:** Extreme edge cases (all eliminated simultaneously)

#### Power Usage Rules

Each special role can use their power **once per round** on any player:

- **Spy:** See one player's role
- **Engineer:** Protect one player from elimination this vote
- **Hacker:** Disable one player's power (if they try to use it)
- **Thief:** Steal and use one ability (next phase)

Powers are resolved simultaneously during mayhem phase.

### 2. Odd One Out (Puzzle)

A pattern-matching game where players identify which item doesn't fit the pattern.

#### Game Flow

1. **Setup:** Host selects number of rounds
2. **Item Display:** 4-5 items shown to all players
3. **Voting:** Players vote on which item is "odd"
4. **Scoring:** Points awarded for correct identification
5. **Next Round:** Repeat until all rounds complete

#### Scoring

- Correct identification: +10 points
- Incorrect identification: 0 points
- Tie-breaker: First to submit correct answer gets bonus

#### Configuration

```typescript
const oddOneOutConfig = {
  maxRounds: 5, // Can play 1-10 rounds
  itemsPerRound: 5, // Always 5 items per round
  votingTime: 30, // seconds
  reviewTime: 5, // seconds to show answer
};
```

## Game Rules Constants

### Infiltration Configuration

**File Location:** [apps/server/src/state/gameRules.ts](apps/server/src/state/gameRules.ts)

```typescript
export const GAME_RULES = {
  infiltration: {
    minPlayers: 2,
    maxPlayers: 12,
    defaultMaxPlayers: 6,

    availableRoles: [
      "civilian",
      "infiltrator",
      "spy",
      "engineer",
      "hacker",
      "thief",
    ],

    defaultRoles: ["civilian", "infiltrator", "spy"],

    phaseDurations: {
      reveal: 3000, // 3 seconds (fixed)
      mayhem: 30000, // 30 seconds (configurable)
      voting: 60000, // 60 seconds (configurable)
    },

    rolesPerGame: {
      infiltrator: 1,
      civilian: "remainder",
      // Special roles distributed as selected
    },
  },

  odd_one_out: {
    minPlayers: 2,
    maxPlayers: 10,
    defaultMaxPlayers: 4,

    roundsMin: 1,
    roundsMax: 10,
    defaultRounds: 5,

    itemsPerRound: 5,
    votingTime: 30000, // 30 seconds
    reviewTime: 5000, // 5 seconds show answer
  },
};
```

### Default Room Settings

```typescript
export const DEFAULT_ROOM_SETTINGS = {
  gameKey: "infiltration",
  requiresApproval: false,
  isLocked: false,
  maxPlayers: 6,
  phaseDuration: 60, // seconds (customizable per phase)

  infiltrationOptions: {
    roles: ["civilian", "infiltrator", "spy"],
  },
};
```

### Game Constants

```typescript
export const GAME_WINNERS = {
  CIVILIANS: "civilians",
  INFILTRATOR: "infiltrator",
  NONE: "none",
};

export const GAME_PHASES = {
  LOBBY: "lobby",
  REVEAL: "reveal",
  MAYHEM: "mayhem",
  VOTING: "voting",
  RESULTS: "results",
};

export const POWERS = {
  SPY: "spy",
  ENGINEER: "engineer",
  HACKER: "hacker",
  THIEF: "thief",
};

export const ROLES = {
  CIVILIAN: "civilian",
  INFILTRATOR: "infiltrator",
  SPY: "spy",
  ENGINEER: "engineer",
  HACKER: "hacker",
  THIEF: "thief",
};
```

## Infiltration Strategy Notes

### For Civilians

- **Day Phase:** Discuss and ask questions to identify infiltrator
- **Voting Phase:** Vote together on suspected infiltrator
- **Use Powers:**
  - Spy: Investigate suspicious players
  - Engineer: Protect trusted teammates
  - Hacker: Block suspicious power usage

### For Infiltrator

- **Observe:** Watch who votes and how they discuss
- **Blend:** Act like a civilian to avoid suspicion
- **Survive:** Make it look like someone else is suspicious
- **Win Condition:** Stay hidden until civilians can't win

## Power Resolution

During mayhem phase, all powers are submitted simultaneously:

1. **Spy sees:** Learns target's actual role
2. **Engineer protects:** Target can't be eliminated this vote
3. **Hacker disables:** If target tries to use a power, it fails
4. **Thief steals:** Gains ability for next phase (if not hacked)

**Example Scenario:**

```
Thief targets Engineer to steal protection
Engineer targets Player X to protect
Hacker targets Thief to disable theft

Result:
- Thief's theft is blocked (Hacker won)
- Engineer's protection works
- Player X is safe
- Thief learns about the Hacker
```

## Validation Rules

### Room Creation

- Game type must be valid (infiltration or odd_one_out)
- Max players between MIN and MAX for that game

### Player Join

- Room code must be 4-6 uppercase letters
- Nickname must be 1-50 characters, no special chars
- Can't exceed max players

### Game Start

- All players must be ready
- Minimum players for selected game type

### Role Selection (Host)

- Can only select available roles
- Infiltration: Must include at least 1 civilian, 1 infiltrator
- Total roles must match or exceed number of players

### Vote Submission

- Player in voting phase
- Can only vote for another player or "none"
- Can only submit once per vote

### Power Usage

- Player has the role with that power
- Target is a valid player
- Power hasn't been used this round yet

## Game Balancing

### Player Count Impact

| Players | Recommended Roles      | Difficulty                        |
| ------- | ---------------------- | --------------------------------- |
| 2       | Civilian, Infiltrator  | Extreme (very short game)         |
| 3-4     | + 1 Spy                | Easy (civilians advantage)        |
| 5-6     | + 2 Special roles      | Balanced                          |
| 7-8     | + Mix of special roles | Moderate (infiltrator needs luck) |
| 9+      | 2+ Infiltrators?       | Very hard (not standard)          |

### Duration Tuning

- **Fast Game (2 min/round):** Mayhem 15s, Voting 30s
- **Standard (3-4 min/round):** Mayhem 30s, Voting 60s
- **Long Form (5+ min/round):** Mayhem 45s, Voting 90s

### Role Frequency

- **Civilian:** Always majority (wins by numbers)
- **Infiltrator:** 1 per game (lone wolf challenge)
- **Special Roles:** 1-3 per game (adds complexity)

## Modifying Game Rules

### To Add a New Role

1. **Define the role** in `ROLES` constant
2. **Add power logic** in [apps/server/src/socket/powerLogic.ts](apps/server/src/socket/powerLogic.ts)
3. **Add to availableRoles** in `GAME_RULES.infiltration`
4. **Update client** constants and UI
5. **Add tests** for power resolution

Example:

```typescript
// In gameRules.ts
export const ROLES = {
  // ... existing
  MEDIC: "medic"  // new role
};

export const POWERS = {
  // ... existing
  MEDIC_HEAL: "medic_heal"  // new power
};

// In gameRules.ts game config
availableRoles: [
  "civilian",
  "infiltrator",
  "spy",
  "engineer",
  "hacker",
  "thief",
  "medic"  // add here
]

// In powerLogic.ts
case "medic":
  return executeMedicHeal(room, sourcePlayer, targetPlayer);
```

### To Change Phase Durations

```typescript
// In gameRules.ts
infiltration: {
  phaseDurations: {
    reveal: 3000,      // Can't change (hardcoded)
    mayhem: 45000,     // Changed to 45s
    voting: 120000,    // Changed to 2 min
  }
}
```

### To Adjust Min/Max Players

```typescript
// In gameRules.ts
infiltration: {
  minPlayers: 3,     // Was 2
  maxPlayers: 15,    // Was 12
  defaultMaxPlayers: 8
}
```

**Remember:** Update both server and client copies!

## Testing Game Rules

### Manual Test Checklist

- [ ] Create game with each role combination
- [ ] Verify role distribution is correct
- [ ] Test each power in mayhem phase
- [ ] Test vote counting and elimination
- [ ] Test winner determination
- [ ] Test phase timers advance correctly
- [ ] Test with different player counts

### Edge Cases to Consider

- 2 players (minimum, very short)
- All same role somehow (shouldn't happen)
- Player disconnect during vote
- Simultaneous power on same target
- Hacker blocks non-existent power
- Thief steals from eliminated player

---

For socket event details on game control, see [\_API_REFERENCE.md](_API_REFERENCE.md).
