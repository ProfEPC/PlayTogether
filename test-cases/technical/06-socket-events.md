# Socket Event Validation Tests

## TC6.1: Malformed Socket Event

- **Precondition**: Client connected
- **Steps**:
  1. Emit invalid event: `socket.emit("invalid:event", {})`
- **Expected**: Server ignores event or logs warning; no crash

## TC6.2: Missing Required Payload Field

- **Precondition**: Client connected
- **Steps**:
  1. Emit `game:submit` without `answer` field
- **Expected**: Server validates and rejects with error message

## TC6.3: Stale Round ID in Timer Event

- **Precondition**: Game active with roundId = 5
- **Steps**:
  1. Timer fires for roundId = 3
  2. Verify server ignores old timer
- **Expected**: No state change; new events for current round only processed

## TC6.4: Socket Auth/Validation (Host-Only Operations)

- **Precondition**: Non-host player connected
- **Steps**:
  1. Player emits `room:updateSettings` directly
  2. Player emits `room:close`
  3. Player emits `room:kick` targeting another player
- **Expected**: All operations rejected with `error:forbidden`; server logs unauthorized attempt

## TC6.5: Out-of-Order Event Sequence

- **Precondition**: Game in lobby
- **Steps**:
  1. Emit `game:submit` (vote) before game started
  2. Emit `game:reset` before any game active
- **Expected**: Events ignored or rejected as invalid for current state

## TC6.6: Rapid Event Spam

- **Precondition**: Game in voting phase
- **Steps**:
  1. Emit 100 `game:submit` events in rapid succession
  2. Monitor server memory and response time
- **Expected**: Server handles gracefully; first event processed, rest queued or dropped; no crash; no memory spike

## TC6.7: Very Large Payload

- **Precondition**: Client connected
- **Steps**:
  1. Emit event with 10MB payload
- **Expected**: Request rejected or truncated; no server crash; error logged

## TC6.8: Special Characters in Room Code

- **Precondition**: Attempt to create or join room
- **Steps**:
  1. Try code with special chars: `ABC@#$`, `ABC DEF`, `abc\ndef`
- **Expected**: Invalid codes rejected; only alphanumeric codes accepted (per spec)
