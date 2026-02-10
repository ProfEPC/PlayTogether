# Timer & Phase Management Tests

## TC8.1: Phase Timer Starts and Expires

- **Precondition**: Game in reveal phase, timer = 10s
- **Steps**:
  1. Observe timer countdown
  2. Wait 10+ seconds
- **Expected**: Phase automatically transitions; server emits phase change event

## TC8.2: Clear Timer on Room Close

- **Precondition**: Room active with phase timer running
- **Steps**:
  1. Host closes room
  2. Verify timer cleared
- **Expected**: No dangling timers; no phase transitions after room closed

## TC8.3: Manual Phase Advance (Host Only)

- **Precondition**: Game in reveal phase
- **Steps**:
  1. Host clicks "Skip Reveal" or similar
  2. Verify phase advances immediately
- **Expected**: Phase changes; remaining timer cleared; next phase starts

## TC8.4: Non-Host Cannot Manually Advance Phase

- **Precondition**: Game in reveal phase, non-host player connected
- **Steps**:
  1. Non-host attempts to advance phase
- **Expected**: Request rejected with `error:forbidden`; phase unchanged

## TC8.5: Timer Countdown Accuracy

- **Precondition**: Phase with 10-second timer
- **Steps**:
  1. Record server start time and client receive time
  2. Wait 10s and observe phase transition
  3. Compare actual time elapsed to configured timer
- **Expected**: Transition occurs within ±1s of configured time; no early/late transitions

## TC8.6: Multiple Timers in Parallel Rooms

- **Precondition**: 3 separate rooms, each with different phase timers
- **Steps**:
  1. Start games in all 3 rooms with different timer lengths (5s, 10s, 15s)
  2. Observe transitions
- **Expected**: Each room transitions independently at correct time; no cross-contamination

## TC8.7: Timer Clear and Restart

- **Precondition**: Game in reveal phase
- **Steps**:
  1. Wait 5 seconds
  2. Host advances to next phase manually
  3. Verify old timer stopped; new timer started for next phase
- **Expected**: No overlapping timers; clean transition; old timer events ignored

## TC8.8: Zero-Length Timer

- **Precondition**: Game configured with 0s phase timer
- **Steps**:
  1. Start game
  2. Observe phase transitions
- **Expected**: Phases transition immediately or with minimal delay; no hang

## TC8.9: Very Long Timer (e.g., 5 minutes)

- **Precondition**: Reveal phase with 300s timer
- **Steps**:
  1. Start game
  2. Wait 30s
  3. Check elapsed time displayed to user
- **Expected**: Timer displayed accurately; counting down correctly; no drift over extended period

## TC8.10: Timer Pause/Resume (if supported)

- **Precondition**: Game active with running timer
- **Steps**:
  1. Host clicks "Pause Game"
  2. Verify timer halts
  3. Host clicks "Resume"
  4. Verify timer continues from where it paused
- **Expected**: Timer paused and resumed correctly; remaining time preserved
