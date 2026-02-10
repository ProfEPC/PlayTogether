# Error Handling & Edge Cases Tests

## TC10.1: Network Latency Handling

- **Precondition**: Simulated 500ms latency
- **Steps**:
  1. Submit vote during voting phase
  2. Check server received submission
- **Expected**: Submission processed correctly; no duplicate submissions; timeout prevents hung state

## TC10.2: Rapid Fire Submissions

- **Precondition**: Game in voting phase
- **Steps**:
  1. Emit `game:submit` three times in rapid succession
- **Expected**: First submission recorded; subsequent ignored (already voted) or error returned

## TC10.3: Simultaneous Room Actions

- **Precondition**: 3 players, host and 2 clients connected
- **Steps**:
  1. Host closes room while player joins
  2. Verify race condition handled
- **Expected**: One action wins (typically host close); other player sees room closed

## TC10.4: Invalid Game Configuration

- **Precondition**: Room settings form
- **Steps**:
  1. Set rounds = 0, timer = -1
  2. Attempt to start game
- **Expected**: Validation error; game not started; user prompted to fix settings

## TC10.5: Player Leaves During Setup

- **Precondition**: 3 players in lobby, not all ready
- **Steps**:
  1. One player disconnects
- **Expected**: Player list updated; game cannot start until enough ready; host can still manage room

## TC10.6: Game Start with Only 1 Player Ready

- **Precondition**: 3 players in room, only host ready
- **Steps**:
  1. Host attempts to start game
- **Expected**: Start blocked; error message: "All players must be ready"

## TC10.7: Timeout on Hung Client

- **Precondition**: Player connected but unresponsive (frozen browser)
- **Steps**:
  1. Simulate client freeze (no events sent for 30+ seconds)
  2. Check if server detects and removes unresponsive client
- **Expected**: Server detects after timeout; removes client from room; others see player left

## TC10.8: Rapid Room Creation and Deletion

- **Precondition**: Fresh connection
- **Steps**:
  1. Create room, immediately close it
  2. Create another room
  3. Repeat 10 times
- **Expected**: All operations complete successfully; no orphaned state; clean code generation

## TC10.9: Join Same Room Twice Simultaneously

- **Precondition**: Two socket connections from same device
- **Steps**:
  1. Both sockets emit `room:join` with same code simultaneously
- **Expected**: One succeeds, one is rejected or queued; alternatively, if multi-socket is supported, both added to room

## TC10.10: Concurrent Power Usage on Same Target

- **Precondition**: 2 special roles in mayhem phase, both targeting same player
- **Steps**:
  1. Both emit `game:submit` with power targeting same player
  2. Check resolution order
- **Expected**: Both powers apply, or first-come-first-served; results consistent

## TC10.11: Vote After Phase Ended

- **Precondition**: Voting phase just ended, results phase starting
- **Steps**:
  1. Client latency causes vote to arrive after phase transition
- **Expected**: Vote rejected; error returned; results unaffected

## TC10.12: Settings Change During Game

- **Precondition**: Game active, in mayhem phase
- **Steps**:
  1. Host attempts to change timer or other settings
- **Expected**: Settings change rejected during active game; only allowed in lobby

## TC10.13: Very Slow Client Connection

- **Precondition**: Client with high latency (e.g., 2000ms)
- **Steps**:
  1. Client joins room and plays game
  2. Observe any desyncs or timing issues
- **Expected**: Game continues; state eventually consistent; no race conditions

## TC10.14: Browser Back Button During Game

- **Precondition**: Game in voting phase
- **Steps**:
  1. Player clicks browser back button
- **Expected**: Player navigated away; socket disconnected; room updated; game continues without them
