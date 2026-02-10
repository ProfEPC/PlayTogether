# Room Management - Edge Cases & Special Scenarios

## TC2.9: Close Room While in Reveal Phase

- **Precondition**: Infiltration game active, in reveal phase, 4 players
- **Steps**:
  1. Host clicks "Close Room"
  2. Verify `room:close` emitted
  3. Check all players' state
- **Expected**: Game interrupted; all players receive `room:closed` event; phase timer cleared; redirected to home; no lingering game state

## TC2.10: Close Room During Mayhem Phase

- **Precondition**: Infiltration game active, in mayhem phase, players using powers
- **Steps**:
  1. Host closes room mid-phase
  2. Verify any pending power submissions are discarded
- **Expected**: Room closes immediately; players disconnected; no power effects applied; clean shutdown

## TC2.11: Close Room During Voting Phase

- **Precondition**: Infiltration game active, voting phase, some votes submitted
- **Steps**:
  1. Host closes room while voting ongoing
  2. Check server cleanup
- **Expected**: Voting halted; no votes tallied; results not processed; room removed; players see `room:closed`

## TC2.12: Close Room During Results Phase

- **Precondition**: Game in results phase showing round outcome
- **Steps**:
  1. Host closes room
  2. Verify game state is destroyed
- **Expected**: Results UI disappears; room closed; next game prevented; clean state

## TC2.13: Player Leaves Room During Lobby (Non-Host)

- **Precondition**: Room in lobby, 3 players, player is not host
- **Steps**:
  1. Non-host player clicks "Leave Room"
  2. Verify `room:leave` emitted
- **Expected**: Player disconnected from room; other players see updated player list; game cannot start if now below minimum

## TC2.14: Player Leaves Room During Game

- **Precondition**: Game in mayhem phase, 4 players
- **Steps**:
  1. Player disconnects or clicks "Leave"
  2. Verify game continues with remaining players
- **Expected**: Player marked as left/abandoned; other players continue; vote count adjusted if voting phase

## TC2.15: Room Becomes Empty

- **Precondition**: Single-player room or last player leaves
- **Steps**:
  1. Only player in room disconnects
  2. Check server state
- **Expected**: Empty room removed from server immediately; no orphaned state

## TC2.16: Max Players Boundary Test

- **Precondition**: Room with max - 1 players (11/12)
- **Steps**:
  1. Player 12 joins successfully
  2. Player 13 attempts to join same room code
- **Expected**: Player 12 joins; player 13 receives error "Room full"

## TC2.17: Duplicate Join Attempt

- **Precondition**: Player already in room
- **Steps**:
  1. Player emits `room:join` again with same room code
- **Expected**: Server rejects or ignores duplicate; player state unchanged; no duplication
