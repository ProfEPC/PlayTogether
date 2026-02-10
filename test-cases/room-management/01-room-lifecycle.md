# Room Management - Lifecycle Tests

## TC2.1: Host Creates New Room

- **Precondition**: Client connected, on Home page
- **Steps**:
  1. Click "Create Room"
  2. Verify room code displayed
  3. Verify socket receives `room:state` event with self as host
- **Expected**: Host enters Lobby with unique room code (uppercase); host can see player count = 1

## TC2.2: Join Room with Valid Code

- **Precondition**: Room exists with code `ABCD1`, host is connected
- **Steps**:
  1. Client 2 enters room code `ABCD1`
  2. Click "Join"
  3. Verify `room:join` emitted to server
- **Expected**: Client 2 added to room; all players receive updated `room:state`; player count incremented

## TC2.3: Join Room Case-Insensitive

- **Precondition**: Room exists with code `ABCD1`
- **Steps**:
  1. Enter code as `abcd1` or `aBcD1`
- **Expected**: Room joined successfully (codes are normalized to uppercase)

## TC2.4: Join Non-Existent Room

- **Precondition**: No room with code `FAKE1`
- **Steps**:
  1. Enter `FAKE1` and attempt to join
- **Expected**: Error message displayed; join rejected

## TC2.5: Room Full (Max Players Exceeded)

- **Precondition**: Room has max players (e.g., 12)
- **Steps**:
  1. New player tries to join
- **Expected**: Join rejected with error; player not added to room

## TC2.6: Host Closes Room

- **Precondition**: Room active with 3+ players
- **Steps**:
  1. Host clicks "Close Room"
  2. Verify `room:close` emitted
- **Expected**: All players receive `room:closed` event; redirected to home page; room deleted from server

## TC2.7: Host Kicks Player

- **Precondition**: Room active, host and player connected
- **Steps**:
  1. Host clicks "Kick" on a player
  2. Verify `room:kick` emitted with target socket ID
- **Expected**: Kicked player receives `room:kicked` event; player disconnected; others see updated player list

## TC2.8: Room Auto-Close on Host Disconnect

- **Precondition**: Room active with multiple players
- **Steps**:
  1. Host disconnects unexpectedly (close tab)
  2. Check server state after 5 seconds
- **Expected**: Room closed automatically; remaining players disconnected with reason
