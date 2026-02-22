# Infiltration Powers Table - Code Enforcement Checklist

This document describes behaviors and validations that **must be enforced in code** since they are not captured purely by boolean flags in the CSV.

## Power-to-Power Compatibility

- [ ] **Validate on character creation**: When a player adds a power to their character, check compatibility with all existing powers using the rules defined in [power_compatibility_rules.md](power_compatibility_rules.md).
- [ ] **Meshing validation on save**: When a character is saved, verify that all power combinations in the character's power slots conform to compatibility flags (silencer, murderer, predicter, suicidal, twoXVote).
- [ ] **Client-side UX feedback**: Show an error or warning in the Character Creation UI when the user attempts to select an incompatible power.
- [ ] **Server-side enforcement**: On character save and load, reject any character that violates power compatibility rules (defense against client-side bypass).
- [ ] **Error message clarity**: When rejecting an incompatible power combination, explain which existing power is incompatible and why (e.g., "You already selected a non-silencer power; silencer powers can only mix with other silencer powers").

## Target Selection & Visibility Rules

- [ ] **Cannot select revealed targets**: If a target player's role card has been revealed to ALL players, the acting player cannot select them as a target for any power.
- [ ] **Cannot select protected targets**: If a target player is currently protected (via "Protect Player From Actions" or similar), the acting player cannot select them and should see the protection state.
- [ ] **Role target doesn't exist**: If a power targets a role (e.g., "Reveal Role") and that role doesn't exist in play (e.g., it's in the center/middle and not dealt), the action **FAILS with no retarget attempt**. Return an error; do not allow target selection to continue.
- [ ] **Display target availability**: Show players which targets are unavailable (revealed, protected, or don't-exist) at the time of selection, with reason.

## Action Collision & Ordering

- [ ] **Protect shields matching actions**: A player protected from "Learn" actions cannot be targeted by Learn powers. Protect scope is configurable per power.
- [ ] **Block timing constraint**: Block cannot prevent a player whose role action has already been executed during the current mayhem phase. If Block arrives late, it has no effect and the blocker does NOT get notification (silent no-op).
- [ ] **Learn/Reveal timing configurable**: When a role with both Learn and Swap is created, the host can choose whether Learn/Reveal occurs BEFORE the Swap phase or AFTER the Swap phase.
- [ ] **Swap first, then Learn/Reveal**: If configured to occur before swap, Learn/Reveal resolves using original cards. If configured after, use post-swap cards.

## Cannot-Be-Touched Scope

- [ ] **Cannot-be-touched definition**: A role/card marked as "cannot be touched" blocks THREE operations:
  - Cannot be swapped (not a target for Swap powers)
  - Cannot be revealed (not a target for Reveal powers)
  - Cannot be learned (not a target for Learn powers)
  - **Note**: Voting effects can still apply unless explicitly prevented elsewhere.
- [ ] **Silent skip in UI**: If a power targets a cannot-be-touched card, the action fails silently (no error, just no-op).

## Infection Triggers & Win Condition Flips

- [ ] **Infection on learn/reveal**: Whenever a power causes a player to SEE a role (Learn or Reveal), check for infiltrator infection:
  - If the infiltrator is revealed or learned, flip that player's team/faction to infiltrator
  - The player's win condition flips **immediately** upon infection (TODO: verify if this happens during phase resolution or at end of mayhem)
- [ ] **Learn Players With Role exception**: The census power "Learn Players With Role" **CANNOT trigger infection**, even if an infiltrator is in the queried role list. This prevents force-infection via role-visibility whitelist.
- [ ] **Infection detection logic**: Implement as: "If player has been revealed/learned as infiltrator (or has infiltrator role post-swap), trigger infection."
- [ ] **Timing TODO**: Document whether infection occurs:
  - Immediately when the action resolves, OR
  - At end of mayhem phase after all actions complete
  - Current implementation assumption: infection is possible/immediate. Update when decided.

## Center Card Reveal

- [ ] **Center reveal is global**: When a Center card is revealed via "Reveal Center Card" or similar, ALL players see the revealed card(s).
- [ ] **Center card becomes locked**: Once revealed, that center card is locked and cannot be further modified (e.g., cannot swap it post-reveal, cannot learn a different center card).
- [ ] **Persistence across rounds**: Center reveal state persists for the remainder of the game (or explicitly cleared on reset).

## Learners/Revealers + Murderer/Predicter Interaction

- [ ] **General coexistence allowed**: Learn/Reveal powers MAY have Murderer=TRUE or Predicter=TRUE in the data (CSV allows both).
- [ ] **End-of-mayhem restriction**: However, if a Learn/Reveal power is configured to occur at the END of the mayhem phase (post-actions, late info), code **MUST prevent** simultaneous Murderer=TRUE or Predicter=TRUE.
  - Check: `if (learnRevealTiming === "AFTER_SWAP" AND (murderer === TRUE OR predicter === TRUE)) { throw error or disable modifier }`
- [ ] **OP warning**: In code comments and UI, flag combinations of Learn/Reveal + Murderer/Predicter at end-of-mayhem as potentially overpowered; warn admins when creating such roles.
- [ ] **Enforcement location**: This is a CODE rule, not a CSV rule. The CSV may show TRUE, but code prevents the combo at runtime.

## Voting Ordering Consistency

- [ ] **Consistent voting order**: Enforce a deterministic order for vote tally (e.g., alphabetical by player name, by socket ID, or by join order). Document the chosen order.
- [ ] **Vote precedence**: If multiple "Duplicate" or "Silence" modifiers apply, apply them in a consistent order (e.g., Duplicate first, then Silence, then tally).

## Power Timing & Initiative

- [ ] **Initiative phases**:
  - 0 initiative: Occurs during voting or post-voting discussion (not during mayhem)
  - 10–90: Occurs during mayhem phase; higher numbers later in phase
  - Order for combined powers: Swap → Learn → Reveal (others TBD)
- [ ] **Fixed initiative**: If FixedInitiative=TRUE, that power's initiative cannot be altered by Alter/Set Initiative powers.
- [ ] **Configurable timing**: Learn/Reveal timing (before/after swap) is chosen at role creation time and locked for that role instance.

## Special Power Behaviors

- [ ] **Swap Previous Swap**: Track all swap operations in the current round. When this power executes, reverse the most recent swap. Rollback must be consistent (if card A swapped to player B, swap it back to player A).
- [ ] **Block Role Action**: If multiple players have the same role, Block applies to all of them.
- [ ] **Protect Role From Actions**: Protecting a role protects all players currently holding that role.
- [ ] **Learn Same Role / Learn Same Team**: Include only players who have NOT been eliminated.

## Error Handling & Edge Cases

- [ ] **No valid targets**: If all potential targets are revealed/protected/don't-exist, return an error instead of allowing action to fail silently.
- [ ] **Partial action success**: If a power targets multiple cards and only some are valid, implement as "all-or-nothing" (fail if any target is invalid) unless the power explicitly allows partial success.
- [ ] **Stale data**: Validate that the selected target still exists and is a valid role/team at the moment of action execution (players may disconnect).

## Logging & Audit

- [ ] **Log all infections**: Record when a player's faction flips due to infection (useful for replay/debugging).
- [ ] **Log late blocks**: Record when a Block action arrives too late and has no effect (for transparency).
- [ ] **Log target failures**: Record when a power targets a non-existent or unavailable role/player.

---

## Summary Checklist

- [ ] Selection blocking (revealed/protected/non-existent)
- [ ] Block-too-late no-effect behavior
- [ ] Learn/Reveal timing configuration (before/after swap)
- [ ] Cannot-be-touched scope enforcement
- [ ] Infection triggers (see = learn/reveal; census exception; immediate win flip)
- [ ] Center reveal is global and locked
- [ ] Learner/Revealer + Murderer/Predicter end-of-mayhem restriction + warning
- [ ] Initiative phases and order
- [ ] Voting order consistency
- [ ] Swap Previous Swap rollback
- [ ] Block/Protect role-wide scope
- [ ] Error handling for invalid targets
- [ ] Audit logging for infections and blocks
