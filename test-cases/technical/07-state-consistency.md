# State Consistency Tests

## TC7.1: Room State After Each Event

- **Precondition**: Room active with 3 players
- **Steps**:
  1. Perform action (join, start, submit)
  2. Check `room:state` emitted
- **Expected**: All players receive identical `room:state`; no missing fields; consistency maintained

## TC7.2: Reconnect Player Mid-Game

- **Precondition**: Game in progress, player disconnects
- **Steps**:
  1. Player reconnects (same socket or new connection)
  2. Rejoin with room code
- **Expected**: Player rejoins mid-game; current state restored; minimal disruption

## TC7.3: Player Disconnect Does Not Corrupt Game

- **Precondition**: Game in voting phase, 4 players
- **Steps**:
  1. One player disconnects
  2. Verify game continues; votes still processed
- **Expected**: Game state remains valid; missing vote handled (e.g., counted as abstain)

## TC7.4: Broadcast Consistency After State Change

- **Precondition**: Room with 3 players active
- **Steps**:
  1. Host changes any setting
  2. Compare `room:state` received by all 3 players
  3. Check timestamps, player list, settings
- **Expected**: All 3 players receive identical state; no field variations; consistent payload structure

## TC7.5: Ready Flag Persistence Across Updates

- **Precondition**: 3 players, player A marked ready
- **Steps**:
  1. Host changes game settings
  2. Check player A's ready status
- **Expected**: Ready status preserved; only settings changed; other players' ready flags unchanged

## TC7.6: Score/Points Not Lost on Player Rejoin

- **Precondition**: Multi-round game in progress, player leaves after round 1
- **Steps**:
  1. Record player's score after round 1
  2. Player rejoins game
  3. Check score after round 2
- **Expected**: Score from round 1 retained; points accumulate correctly (if tracking is per-player)

## TC7.7: Eliminated Players Cannot Interact

- **Precondition**: Infiltration game results phase, player was voted out
- **Steps**:
  1. Check if eliminated player can vote in next round
  2. Check if eliminated player can use powers
- **Expected**: Eliminated players read-only; cannot submit actions; only observers

## TC7.8: Multiple State Mutations in Quick Succession

- **Precondition**: Game in lobby
- **Steps**:
  1. Host changes rounds setting
  2. Immediately changes game type
  3. Immediately changes timer
  4. Verify final state
- **Expected**: All mutations apply in order; final state contains all changes; no partial updates lost
