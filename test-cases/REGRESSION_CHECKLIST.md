# PlayTogether - Regression Test Checklist

**Before each release**, verify the following:

## Core Functionality

- [ ] Create room, join room, close room
- [ ] Close room while game in progress (reveal/mayhem/voting/results)
- [ ] Start Infiltration game with 3 players; play to completion
- [ ] Start Odd One Out game with 4 players; play to completion

## Room Management

- [ ] Host disconnects mid-game; verify cleanup
- [ ] Player leaves during voting; verify game continues
- [ ] Max players (12) + rejection test
- [ ] Duplicate join attempt handled
- [ ] Room codes case-insensitive

## Game Configuration

- [ ] Non-host cannot use host-only operations
- [ ] Settings locked during active game
- [ ] Player rejoin mid-game restores state

## Game Phases

- [ ] Phase transitions occur at correct times
- [ ] All timers clear on room close
- [ ] Powers resolve correctly in order
- [ ] Voting results tallied accurately
- [ ] Role distribution appears random
- [ ] Eliminated players cannot participate

## State & Sync

- [ ] State consistency across all connected clients
- [ ] Rapid socket events; verify no corruption
- [ ] Socket events normalized (room codes uppercase, etc.)

## Technical

- [ ] Admin page loads; inspect room state
- [ ] Admin force-close works
- [ ] Network latency (500ms) handled gracefully

## Performance

- [ ] Memory usage stable over 5-minute session
- [ ] Multiple rooms run independently
- [ ] Performance acceptable with 5 concurrent games

## UI/UX

- [ ] Mobile responsiveness tested
- [ ] Keyboard navigation works
- [ ] No console errors in browser or server logs

## Both Game Types

- [ ] Infiltration: Full flow (lobby → reveal → mayhem → voting → results → end)
- [ ] Odd One Out: Full flow (lobby → play → vote → results → end)
- [ ] Both types function end-to-end without crashes

---

## Sign-Off

- **Tester**: ********\_\_\_********
- **Date**: ********\_\_\_********
- **Version**: ********\_\_\_********
- **All checks passed**: [ ] Yes [ ] No

If any check failed, document issue in issue tracker and retest after fix.
