# Odd One Out Game Lifecycle Tests

## TC5.1: Start Odd One Out Game

- **Precondition**: 3-5 players in lobby, game = "odd_one_out"
- **Steps**:
  1. Host starts game
  2. Verify `game:start` emitted
- **Expected**: Game enters "play" phase; all players see a prompt/category; answers submit UI visible

## TC5.2: Submit Answer in Odd One Out

- **Precondition**: Odd One Out game in "play" phase
- **Steps**:
  1. Player enters answer (e.g., "Apple")
  2. Click "Submit Answer"
  3. Verify `game:submit` emitted with answer
- **Expected**: Answer recorded; UI shows "submitted" state; player cannot change answer

## TC5.3: Reveal Answers & Vote

- **Precondition**: All players submitted or timer expired
- **Steps**:
  1. Phase changes to "vote"
  2. All answers displayed anonymously
  3. Player selects which answer is "odd one out"
- **Expected**: Vote recorded; voting UI active; cannot vote for own answer (if anonymous mode)

## TC5.4: Results in Odd One Out

- **Precondition**: Odd One Out voting complete
- **Steps**:
  1. Phase changes to "results"
  2. Verify correct odd one out revealed
- **Expected**: Answer authors revealed; vote counts shown; points awarded; next round or game end

## TC5.5: Duplicate Answers in Odd One Out

- **Precondition**: Odd One Out play phase, multiple players
- **Steps**:
  1. Two players submit identical answer
  2. Phase changes to vote
- **Expected**: Both answers displayed (possibly with labels: "2 players"); voting proceeds normally

## TC5.6: Empty Answer Submission (Odd One Out)

- **Precondition**: Odd One Out play phase
- **Steps**:
  1. Player submits empty string or only whitespace
  2. Click submit
- **Expected**: Validation error; submission rejected; player must enter valid answer

## TC5.7: Very Long Answer (Odd One Out)

- **Precondition**: Odd One Out play phase
- **Steps**:
  1. Player enters 500+ character answer
  2. Submit
- **Expected**: Either truncated with warning, rejected with error, or accepted and displayed with text wrapping

## TC5.8: All Players Vote for Same Answer (Odd One Out)

- **Precondition**: Odd One Out voting phase, 4 answers
- **Steps**:
  1. All 4 players vote for same answer as odd one out
- **Expected**: That answer marked as odd one out; all players earn points; results shown

## TC5.9: Odd One Out with Minimum Players

- **Precondition**: 3-player game (minimum)
- **Steps**:
  1. Play full round
- **Expected**: Game functions; voting/results work with 3 answers; no crashes

## TC5.10: Multi-Round Odd One Out

- **Precondition**: Game configured for 3 rounds
- **Steps**:
  1. Complete round 1, 2, 3
  2. Check score accumulation
- **Expected**: Scores accumulated across rounds; final winner determined; leaderboard shows cumulative points
