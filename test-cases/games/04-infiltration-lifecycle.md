# Infiltration Game Lifecycle Tests

## TC4.1: Start Infiltration Game (All Ready)

- **Precondition**: 3-6 players in lobby, all ready, game = "infiltration"
- **Steps**:
  1. Host clicks "Start Game"
  2. Verify `game:start` emitted
  3. Wait for roles to be assigned
- **Expected**: Game moves to "reveal" phase; roles assigned (infiltrator, civilian, special roles); all players receive `room:state` with `gameState.phase = "reveal"`

## TC4.2: Role Assignment Distribution

- **Precondition**: Game starting with 5 players
- **Steps**:
  1. Start game
  2. Check role counts: 1 infiltrator, rest civilians/special
- **Expected**: 1 infiltrator assigned; special roles (thief/hacker/engineer) optional; civilians fill rest

## TC4.3: View Own Role During Reveal

- **Precondition**: Infiltration game in "reveal" phase
- **Steps**:
  1. Player clicks/opens role card
  2. Verify player sees own role and description
- **Expected**: Only player's role visible; other roles blurred/hidden

## TC4.4: Transition to Mayhem Phase

- **Precondition**: Infiltration game in "reveal" phase
- **Steps**:
  1. Timer expires (default 10s) or host manually advances
  2. Verify `game:state` updates to "mayhem"
- **Expected**: Players see available powers; UI displays power descriptions and targets

## TC4.5: Use Power During Mayhem

- **Precondition**: Infiltration game in "mayhem" phase, player is special role
- **Steps**:
  1. Player selects a power (e.g., "View Player Team")
  2. Click on target player
  3. Verify `game:submit` emitted with power and target
- **Expected**: Power recorded on server; player sees confirmation; timer resets if applicable

## TC4.6: Transition to Voting Phase

- **Precondition**: Infiltration game in "mayhem" phase
- **Steps**:
  1. Timer expires or all players submit
  2. Verify phase changes to "voting"
- **Expected**: Players see vote UI; voting timer starts; powers are resolved before voting opens

## TC4.7: Submit Vote

- **Precondition**: Infiltration game in "voting" phase
- **Steps**:
  1. Player selects a suspect
  2. Submit vote via `game:submit`
- **Expected**: Vote recorded; player cannot change vote; UI confirms submission

## TC4.8: Transition to Results Phase

- **Precondition**: Infiltration game in "voting" phase
- **Steps**:
  1. All players vote or timer expires
  2. Verify phase changes to "results"
- **Expected**: Eliminated player highlighted; roles revealed; round results shown; win condition checked

## TC4.9: Game Concludes (Win Condition)

- **Precondition**: Final round results in infiltration elimination
- **Steps**:
  1. Infiltrator voted out
  2. Check game over condition
- **Expected**: Game ends; "Civilians Win" message displayed; play again option available

## TC4.10: Host Resets Game

- **Precondition**: Game in results phase
- **Steps**:
  1. Host clicks "Play Again"
  2. Verify `game:reset` emitted
- **Expected**: Game returns to lobby; room state reset; ready flags cleared

## TC4.11: Start Game with Insufficient Players

- **Precondition**: Room has 2 players, game requires min 3
- **Steps**:
  1. Host attempts to start game
- **Expected**: Start rejected; error message displayed; min player count shown

## TC4.12: Player Submissions Overwrite Previous

- **Precondition**: Infiltration game, voting phase
- **Steps**:
  1. Player submits vote for player A
  2. Player immediately submits vote for player B before phase ends
- **Expected**: Second submission rejected or ignored; first vote remains; player cannot change vote mid-phase

## TC4.13: Powers with Invalid Targets

- **Precondition**: Infiltration game, mayhem phase, player has "View Player Team" power
- **Steps**:
  1. Player attempts to use power on eliminated player
  2. Player attempts to use power on self
  3. Player attempts to use power on non-existent player ID
- **Expected**: All invalid targets rejected; error returned; power not consumed

## TC4.14: Automatic Phase Transition on Unanimous Submission

- **Precondition**: Voting phase with 3 players, fast transition enabled
- **Steps**:
  1. All 3 players vote
  2. Check phase transitions immediately
- **Expected**: Phase changes to results before timer expires; no unnecessary wait

## TC4.15: Eliminating Last Infiltrator (Civilians Win)

- **Precondition**: Final round, 3 players: 1 infiltrator, 2 civilians
- **Steps**:
  1. Vote out infiltrator
  2. Check win condition
- **Expected**: Game ends immediately; "Civilians Win" message; no additional rounds

## TC4.16: Infiltrator Reaches End (Infiltrators Win)

- **Precondition**: Final round, only infiltrator remains
- **Steps**:
  1. Verify infiltrator is last player standing
  2. Check win condition
- **Expected**: Game ends; "Infiltrator Wins" message; match concludes

## TC4.17: Role Distribution Fairness

- **Precondition**: Run game 10 times with same player count
- **Steps**:
  1. Track which players get infiltrator role
  2. Verify randomness
- **Expected**: No player consistently gets same role; distribution appears random
