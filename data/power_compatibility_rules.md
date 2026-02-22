# Power-to-Power Compatibility & Meshing Rules

This document defines which powers can coexist in the same character and which power combinations are subject to restrictions or special behaviors.

## Overview

When a player creates a character (in character creation mode), they select 1–3 powers to fill their power slots. Not all power combinations are valid. This document specifies:

1. **Compatibility Flags**: Boolean properties that define power-to-power constraints.
2. **Meshing Rules**: Specific rules governing how powers interact when both are present on the same character.
3. **Validation Logic**: Pseudocode for checking validity of a power combination.
4. **Character Complexity**: How complexity is calculated from individual powers and combinations.

---

## Compatibility Flags

Each power has zero or more of the following boolean properties. These define which powers it **can coexist with**.

### silencer ✓

- **Meaning**: Power allows the player to silence one or more target players' votes so their votes do not count toward the overall tally during the voting phase.
- **Game Mechanic**: The silenced player still casts a vote, but it is removed from the tally before winners/losers are determined.
- **Meshing Rule**: TBD. Currently no restrictions; clarification needed on whether silencer powers can coexist with each other and non-silencer powers.
- **Current Implementation**: Flag exists; meshing validation pending.
- **Examples**:
  - "Silence Target Player('s) Vote(s)"
  - "Silence Target Role('s) Vote(s)"

### murderer ✓

- **Meaning**: Power causes the player's vote to eliminate not just the voted target, but also applies a secondary elimination effect.
- **Game Mechanic**: Whoever the murderer player votes for is **also eliminated** (in addition to normal voting elimination).
- **Meshing Rule**: A murderer power **CANNOT mesh with any Learn/Reveal powers that activate AFTER the swap phase**. The reasoning: a murderer votes during voting (end of round), but post-swap Learn/Reveal powers need fresh info that a murderer would invalidate.
  - ✅ Can mesh with: Other murderer powers, pre-swap Learn/Reveal, any non-Learn/Reveal powers
  - ❌ Cannot mesh with: Any Learn/Reveal power with `timing: "AFTER_SWAP"`
- **Current Implementation**: Flag exists; temporal validation rules needed.
- **Examples**:
  - Any power where the player's vote eliminates a second target
  - Planned murderer powers: "Double Elimination", "Vote Kills Target"

### predicter ✓

- **Meaning**: Power grants the player a win condition based on a successful prediction about voting outcome.
- **Game Mechanic**: The predicter wins if the person they voted for is revealed to be an infiltrator.
- **Meshing Rule**: **Same rules as murderer** — cannot mesh with any Learn/Reveal powers that activate AFTER the swap phase.
  - ✅ Can mesh with: Other predicter powers, murderer powers, pre-swap Learn/Reveal, any non-Learn/Reveal powers
  - ❌ Cannot mesh with: Any Learn/Reveal power with `timing: "AFTER_SWAP"`
- **Current Implementation**: Flag exists; temporal validation rules needed (same as murderer).
- **Examples**:
  - Any power that checks if the voted target is infiltrator and grants a win

### suicidal ✓

- **Meaning**: Power grants the player a win condition based on their own elimination.
- **Game Mechanic**: The suicidal player wins if they are voted out (eliminated) by the group.
- **Meshing Rule**: TBD. Currently no restrictions defined; clarification needed on whether suicidal powers can coexist with other suicidal powers or non-suicidal powers.
- **Current Implementation**: Flag exists; meshing rules pending.
- **Examples**:
  - Any power that checks if the player holding it was voted out and grants a win

### twoXVote ✓

- **Meaning**: Power grants the player double voting weight during the voting phase.
- **Game Mechanic**: The player's vote counts as two votes in the tally (e.g., voting for Player A gives Player A +2 votes instead of +1).
- **Meshing Rule**: **Same rules as murderer** — cannot mesh with any Learn/Reveal powers that activate AFTER the swap phase.
  - ✅ Can mesh with: Other twoXVote powers, murderer/predicter powers, pre-swap Learn/Reveal, any non-Learn/Reveal powers
  - ❌ Cannot mesh with: Any Learn/Reveal power with `timing: "AFTER_SWAP"`
- **Current Implementation**: Flag exists; temporal validation rules needed (same as murderer/predicter).
- **Examples**:
  - Any power that multiplies vote count
  - Planned powers: "Double Vote", "Vote Worth Two", etc.

---

## Non-Compatibility Flags

The following properties are **game mechanics**, not meshing constraints, and do not restrict power coexistence:

### infected

- **Meaning**: When this power is learned or revealed, the player may become infected with the infiltrator faction (if an infiltrator role is revealed).
- **NOT a constraint**: Powers with `infected: true` can coexist with any other power.
- **Implementation**: Used during role reveal/learn phase to trigger infection logic (see [infiltration_powers_code_checklist.md](infiltration_powers_code_checklist.md) under "Infection Triggers & Win Condition Flips").
- **Example**: `Learn Player Role` has `infected: true` because learning an infiltrator's role triggers conversion.

### vault (Modifier)

- **Meaning**: Power can be configured to interact with a vault (center pile of role cards) instead of or in addition to player cards.
- **NOT a constraint**: Powers with vault-enabled variants can coexist with any other power.
- **Implementation**: UI toggle allows player to enable/disable vault modifier; changes power description and behavior but doesn't restrict coexistence.

### Other Modifiers

Modifiers like `lookPostAction`, `doPower`, `fixedAction`, `fixedInitiative`, `allowRandom` are purely descriptive or behavioral flags and do not restrict power coexistence.

---

## Meshing Validation Pseudocode

When adding a new power to a character, the system must validate that the new power is compatible with all existing powers in the character.

```pseudo
function canAddPowerToCharacter(newPower, existingPowers) {
  for each existingPower in existingPowers {
    if NOT canMeshPowers(newPower, existingPower) {
      return false  // incompatible combination
    }
  }
  return true
}

function canMeshPowers(power1, power2) {
  // Silencer rule: TBD (currently no restrictions)
  // if (power1.silencer && !power2.silencer) return false
  // if (!power1.silencer && power2.silencer) return false

  // Murderer rule: Cannot mesh with post-swap Learn/Reveal
  if (power1.murderer && isPowerLearnOrReveal(power2) && isPostSwap(power2)) {
    return false  // murderer + post-swap learn/reveal = incompatible
  }
  if (power2.murderer && isPowerLearnOrReveal(power1) && isPostSwap(power1)) {
    return false  // murderer + post-swap learn/reveal = incompatible
  }

  // Predicter rule: Same as murderer
  if (power1.predicter && isPowerLearnOrReveal(power2) && isPostSwap(power2)) {
    return false  // predicter + post-swap learn/reveal = incompatible
  }
  if (power2.predicter && isPowerLearnOrReveal(power1) && isPostSwap(power1)) {
    return false  // predicter + post-swap learn/reveal = incompatible
  }

  // TwoXVote rule: Same as murderer
  if (power1.twoXVote && isPowerLearnOrReveal(power2) && isPostSwap(power2)) {
    return false  // twoXVote + post-swap learn/reveal = incompatible
  }
  if (power2.twoXVote && isPowerLearnOrReveal(power1) && isPostSwap(power1)) {
    return false  // twoXVote + post-swap learn/reveal = incompatible
  }

  // Suicidal rule: TBD (currently no restrictions)
  // if (power1.suicidal && ...) return false

  return true  // all checks passed
}

function isPowerLearnOrReveal(power) {
  return power.type === "Learn" || power.type === "Reveal"
}

function isPostSwap(power) {
  return power.timing === "AFTER_SWAP"
}
```

---

## Character Complexity Calculation

**Planned approach** (not yet implemented):

1. **Individual Power Complexity**: Each power has a complexity rating (1–3) defined in [data/infiltration_powers.csv](infiltration_powers.csv).
   - 1 = Simple (no targeting, low interaction risk)
   - 2 = Medium (target selection or mid-level lookups)
   - 3 = High (lookup-table heavy, mass effects, or high interaction risk)

2. **Combination Modifier**: If two or more powers have certain compatibility flags, add a bonus multiplier to overall character complexity.
   - Example: A character with 3 silencer powers might be more complex than the sum of their individual complexities.

3. **Total Character Complexity**:

   ```
   character_complexity = sum(power_complexity for each power)
                        + combination_modifiers
   ```

4. **Balancing**: Use character complexity to enforce team or roster-level constraints (e.g., "max 2 complexity-3 powers per team", "no character over complexity 8").

**Status**: Awaiting feedback on complexity calculation rules from game design.

---

## Compatibility Matrix

**Quick reference** for current and finalized flags:

| Flag      | Coexistence Rule                                                 | Status | Notes                                      |
| --------- | ---------------------------------------------------------------- | ------ | ------------------------------------------ |
| silencer  | TBD - Vote silencing power (meshing rules pending)               | TBD    | Only examples: Silence Player/Role Votes   |
| murderer  | Cannot mesh with post-swap Learn/Reveal; OK with other murderer  | ✓      | Vote causes secondary elimination          |
| predicter | Cannot mesh with post-swap Learn/Reveal; OK with other predicter | ✓      | Win if voted target is infiltrator         |
| suicidal  | TBD - Win condition if voted out                                 | TBD    | Meshing rules pending                      |
| twoXVote  | Cannot mesh with post-swap Learn/Reveal; OK with other twoXVote  | ✓      | Vote counts as two; same rules as murderer |
| infected  | No constraint (game mechanic)                                    | ✓      | Not a meshing constraint                   |
| vault     | No constraint (modifier)                                         | ✓      | Optional per-power toggle                  |

---

## Implementation Timeline

### Phase 1: Design & Documentation ✓ (This File)

- [x] Define compatibility flags (silencer, murderer, predicter, suicidal, twoXVote)
- [x] Clarify non-constraints (infected, vault, other modifiers)
- [x] Document pseudocode for validation logic
- [x] Create placeholder for complexity calculation rules

## Implementation Timeline

### Phase 1: Design & Documentation ✓ (COMPLETE)

- [x] Define compatibility flags with clarified game mechanics (silencer, murderer, predicter, suicidal, twoXVote)
- [x] Document temporal constraint: murderer/predicter/twoXVote cannot mesh with post-swap Learn/Reveal
- [x] Clarify non-constraints (infected, vault, other modifiers)
- [x] Document pseudocode for validation logic (including temporal checks)
- [x] Update compatibility matrix with finalized rules

### Phase 2: Validation Engine (Pending)

- [ ] Create TypeScript utility: `canMeshPowers(power1, power2): boolean`
  - Check murderer/predicter/twoXVote vs. post-swap Learn/Reveal timing
  - Placeholder for silencer and suicidal rules (TBD)
- [ ] Helper function: `isPowerLearnOrReveal(power)`, `isPostSwap(power)`
- [ ] Integrate into Character Creation UI
- [ ] Show error/warning when invalid combination selected
- [ ] Add test cases for all flag combinations

### Phase 3: Enforcement (Pending)

- [ ] Update power data objects to include flag values and timing info
- [ ] Implement character save validation on backend (reject invalid combos)
- [ ] Add unit tests for character validation
- [ ] Document enforcement rules in [infiltration_powers_code_checklist.md](infiltration_powers_code_checklist.md)
- [ ] Document in [\_DEVELOPER_GUIDE.md](_DEVELOPER_GUIDE.md)

### Phase 4: Balance Tuning & Rules Finalization (Pending)

- [ ] Define silencer coexistence rules (can mix with non-silencer? only with silencer?)
- [ ] Define suicidal coexistence rules
- [ ] Clarify twoXVote stacking (two twoXVote powers in one character?)
- [ ] Implement character complexity calculation
- [ ] Create roster-level constraints if needed
- [ ] Gather feedback from playtesters

---

## Questions for Future Clarification

1. **Silencer Power Meshing**: Can silencer powers coexist with non-silencer powers, or only with each other? (Meshing rule TBD)
2. **Suicidal Power Coexistence**: Should suicidal powers mix with non-suicidal powers, or only with each other? (Meshing rule TBD)
3. **TwoXVote Stacking**: Can a character have two twoXVote powers? Should vote counts stack (e.g., vote = 4)?
4. **Murderer/Predicter/TwoXVote + Pre-Swap Learn/Reveal**: Can they coexist? (Currently only blocked from post-swap)
5. **Complexity Thresholds**: What is the maximum complexity for an individual power? For a character?
6. **Enforcement Location**: Should validation occur on the client (UX), server (security), or both?

---

## Related Documentation

- [infiltration_powers.csv](infiltration_powers.csv) — Power data with complexity ratings
- [infiltration_powers_schema.md](infiltration_powers_schema.md) — Power property definitions
- [infiltration_powers_code_checklist.md](infiltration_powers_code_checklist.md) — Enforcement requirements
- [\_GAME_RULES.md](_GAME_RULES.md) — Game phase and role rules
