# Game Rules & Validation Tests

## TC13.1: Infiltrator Cannot Use Civilian Powers

- **Precondition**: Infiltration game, player is infiltrator, mayhem phase
- **Steps**:
  1. Attempt to use civilian-only power
- **Expected**: Power unavailable/disabled; error message

## TC13.2: Civilian Cannot Vote for Self

- **Precondition**: Infiltration game, voting phase
- **Steps**:
  1. Player attempts to vote for own name
- **Expected**: Vote rejected; prompt to select another player

## TC13.3: Special Role Constraints

- **Precondition**: Player is "Thief" or "Hacker"
- **Steps**:
  1. Check available powers during mayhem
  2. Attempt invalid action (e.g., use power twice)
- **Expected**: Only allowed powers enabled; constraints enforced

## TC13.4: Role Reveals at End of Round

- **Precondition**: Results phase
- **Steps**:
  1. Check that eliminated player's role is revealed
  2. Check that special roles visible to all
- **Expected**: Roles displayed clearly; no hidden information; results conclusive

## TC13.5: Infiltrator Knows Their Own Role

- **Precondition**: Infiltration game, reveal phase
- **Steps**:
  1. Player with infiltrator role views their role
- **Expected**: "Infiltrator" clearly displayed; description shown; objectives visible

## TC13.6: Civilian Cannot Determine Other Roles

- **Precondition**: Civilians in reveal phase
- **Steps**:
  1. Civilian views other players' role indicators
- **Expected**: Other roles blurred/hidden/unknown; only own role visible

## TC13.7: Power Descriptions Accurate

- **Precondition**: Mayhem phase, special role player
- **Steps**:
  1. Check power UI descriptions match server behavior
  2. Use power and verify result matches description
- **Expected**: Descriptions match behavior; no misleading text; outcomes as described

## TC13.8: Voting Rules Enforced

- **Precondition**: Infiltration voting phase
- **Steps**:
  1. Player cannot vote for self
  2. Player cannot vote for already-eliminated player
  3. Player cannot change vote once submitted
- **Expected**: All rules enforced; UI prevents violations; server rejects attempts

## TC13.9: Odd One Out: Correct Determination

- **Precondition**: Odd One Out results phase
- **Steps**:
  1. Verify algorithm correctly identifies odd one out answer
  2. Test edge case: if two answers receive most votes, verify tiebreaker
- **Expected**: Correct answer marked; consistent logic; documented tiebreaker applied
