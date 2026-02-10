# UI/UX Flow Tests

## TC12.1: Happy Path - Create & Play Full Game

- **Precondition**: Fresh session
- **Steps**:
  1. Create room
  2. Invite 2 other players (simulator or real)
  3. Select Infiltration game
  4. Start game
  5. Play through all phases
  6. View results
- **Expected**: Seamless flow; all states reflected in UI; no errors or stalls

## TC12.2: Player Sees Live Updates

- **Precondition**: Room active with 2+ players
- **Steps**:
  1. Host changes settings
  2. Observe player 2's UI updates
- **Expected**: Changes visible in real-time (<500ms); no page refresh needed

## TC12.3: Responsive UI on Mobile

- **Precondition**: Web app on mobile device (real or emulated)
- **Steps**:
  1. Create room
  2. Join room
  3. Play game
- **Expected**: UI responsive; touch interactions work; no layout breaking

## TC12.4: Orientation Change During Game

- **Precondition**: Game active on mobile device
- **Steps**:
  1. Rotate device from portrait to landscape
- **Expected**: UI reflows; game state preserved; no disconnection

## TC12.5: Tab Visibility (Pause/Resume)

- **Precondition**: Game active, tab minimized
- **Steps**:
  1. Open different app/tab
  2. Return to game tab after 20 seconds
- **Expected**: Game state updated; no desync; room state consistent

## TC12.6: Dark Mode UI

- **Precondition**: System in dark mode
- **Steps**:
  1. Play full game
- **Expected**: UI readable; colors appropriate for dark background; no contrast issues

## TC12.7: Accessibility - Keyboard Navigation Only

- **Precondition**: Game active, no mouse
- **Steps**:
  1. Use Tab/Enter to navigate all game actions
- **Expected**: All buttons reachable; voting/power selection via keyboard; no mouse-only features
