# Game Configuration Tests

## TC3.1: Host Changes Game Settings (Infiltration)

- **Precondition**: Room in lobby, host connected
- **Steps**:
  1. Host selects game: "Infiltration"
  2. Change settings: rounds, roles, timer
  3. Verify `room:updateSettings` emitted
- **Expected**: Settings persist in `room.settings`; all players see updated settings

## TC3.2: Host Toggles Ready Status

- **Precondition**: Room in lobby, 2+ players
- **Steps**:
  1. Host clicks "Ready"
  2. Verify `room:setReady` emitted
- **Expected**: Host marked as ready; other players see ready status

## TC3.3: Non-Host Cannot Change Settings

- **Precondition**: Room in lobby, player (non-host) connected
- **Steps**:
  1. Player attempts to call `room:updateSettings` via socket
- **Expected**: Server rejects with `error:forbidden`
