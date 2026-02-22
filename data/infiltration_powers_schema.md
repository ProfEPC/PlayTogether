# Infiltration Powers Table - Generation Notes & Change Log

## Schema Assumptions

- **Initiative format**: Stored as string (e.g., `"10, 90"`) to allow comma-separated multiple timings within a single phase.
- **Infected column**: TRUE if power allows seeing roles (Learn/Reveal), which can trigger infiltrator infection; FALSE for action/voting/condition powers. Exception: "Learn Players With Role" (census) is FALSE to prevent force-infection. **NOTE**: This is a game mechanic flag, not a power-to-power meshing constraint. See [power_compatibility_rules.md](power_compatibility_rules.md#non-compatibility-flags).
- **Silencer, Murderer, Predicter, Suicidal, TwoXVote columns**: Compatibility flags for power-to-power meshing rules. See [power_compatibility_rules.md](power_compatibility_rules.md#compatibility-flags) for detailed definitions and coexistence rules.
- **LookPostAction column**: TRUE only if the acting player can change their OWN role as a result of the power (e.g., Swap involving Self). Enables post-action "new role means new actions" logic.
- **DoPower column**: TRUE only if player can execute the role's action after LookPostAction reveals their new role. Typically mirrors LookPostAction.
- **AllowRandom column**: TRUE only if target selection is meaningful and random choice is valid. FALSE for history-based, count-based, role-filter-fixed, and global settings powers.
- **Complexity scale (1–3)**:
  - 1 = Simple: no targeting, no external lookups, low interaction risk
  - 2 = Medium: target selection OR mid-level lookups/interactions
  - 3 = High: lookup-table heavy, mass effects, timing-sensitive, or high interaction risk
- **Where column normalization**: Space-delimited targets (e.g., `Player Player`, `Player Center`, `Self Player`) instead of comma-delimited, for cleaner CSV and easier code parsing.

## Changes Applied

### Normalization

- **Where column**: Converted all comma-separated target pairs to space-delimited:
  - `"Player, Player"` → `Player Player`
  - `"Player, Center"` → `Player Center`
  - `"Player, Self"` → `Player Self`
  - `"Center, Self"` → `Center Self`
  - `"Self, Player"` → `Self Player`
- **LookPostAction & DoPower**: Updated three Swap powers to reflect self-role-change:
  - `Swap Player With Own Role`: LookPostAction=TRUE, DoPower=TRUE (was FALSE, FALSE)
  - `Swap Center With Own Role`: LookPostAction=TRUE, DoPower=TRUE (was FALSE, FALSE)
  - `Swap Self To Player Team`: LookPostAction=TRUE, DoPower=TRUE (was FALSE, FALSE)
- **AllowRandom**: Changed "Learn Final Role" from TRUE → FALSE (learning self has no randomness).

### Deduplication & Completion

- **No duplicates found**: "Block Player Action" and "Block Role Action" are correctly distinct rows; no removal needed.
- **"Swap Player Team" completion**: Row was already complete; no changes beyond Where normalization.
- **Naming collisions resolved**: All four "Learn Amount of..." powers were already uniquely named:
  - "Learn Amount of Role (In Play)"
  - "Learn Amount of Team (In Play)"
  - "Learn Amount of Role (Not In Play)"
  - "Learn Amount of Team (Not In Play)"

### Consistency Checks

- **Infected column**: Verified that "Learn Player With Role" (census) is FALSE; all other Learn/Reveal powers are TRUE.
- **Murderer/Predicter on Learn/Reveal**: Set to TRUE across the board; code will enforce end-of-mayhem restrictions.
- **Silencer & 2xVote columns**: Preserved as-is; no changes needed.
- **Self-Destruct column**: Preserved as-is; verified no conflicts.

## Row Count & Structure

- **Total rows**: 47 powers + 1 header row = 48 lines
- **No rows removed or added** (all cleanups were already applied in source data)
- **Column order**: Exact order maintained as requested

## Files Generated

1. **infiltration_powers.csv**: Main powers table (space-delimited Where, updated modifiers)
2. **infiltration_powers_code_checklist.md**: Code enforcement rules and validation requirements
3. **infiltration_powers_schema.md**: This file (schema assumptions and change log)
