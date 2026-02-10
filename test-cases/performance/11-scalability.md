# Performance & Scalability Tests

## TC11.1: Multiple Rooms Simultaneously

- **Precondition**: Server running
- **Steps**:
  1. Create 5 separate rooms with 3 players each
  2. Run games concurrently
  3. Monitor server memory and response time
- **Expected**: All games run independently without interference; acceptable latency (<100ms)

## TC11.2: Max Room Size

- **Precondition**: Room settings allow 12 players
- **Steps**:
  1. Fill room to 12 players
  2. Add one more player
- **Expected**: 12th player joins; 13th is rejected; no performance degradation

## TC11.3: Long Game Session

- **Precondition**: Game with 5 rounds configured
- **Steps**:
  1. Play all 5 rounds to completion
  2. Monitor memory usage
- **Expected**: No memory leaks; timers cleaned up; final results correct

## TC11.4: Server Under Heavy Load (100+ Rooms)

- **Precondition**: Server running
- **Steps**:
  1. Create 100 rooms with 5 players each
  2. Run concurrent games
  3. Monitor latency and memory
- **Expected**: Server remains responsive (<200ms latency); no crashes; graceful degradation if needed

## TC11.5: Broadcast Efficiency (Large Player Count)

- **Precondition**: Room with 12 players
- **Steps**:
  1. Player performs action (vote, power usage)
  2. Measure time from action to all other players' `room:state` receipt
- **Expected**: Broadcast completes in <100ms; no queuing visible to user

## TC11.6: CPU Usage During Game

- **Precondition**: 5 concurrent games running
- **Steps**:
  1. Monitor CPU usage
  2. Compare to idle state
- **Expected**: Reasonable CPU increase; no runaway process; no busy loops

## TC11.7: Network Bandwidth Usage

- **Precondition**: Active room with frequent events
- **Steps**:
  1. Capture network traffic for 1 minute
  2. Calculate bytes per second
- **Expected**: Bandwidth usage reasonable (e.g., <1Mbps per room)
