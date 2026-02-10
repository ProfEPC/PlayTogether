# Connection & Authentication Tests

## TC1.1: Client Socket Connection

- **Precondition**: Client app is loaded, socket not auto-connecting
- **Steps**:
  1. Call `socket.connect()` manually
  2. Verify socket connects to `http://localhost:3001`
- **Expected**: Socket `connected` event fires, connection ID assigned

## TC1.2: Client Disconnect Handling

- **Precondition**: Client is connected
- **Steps**:
  1. Disconnect socket (e.g., close browser tab or call `socket.disconnect()`)
  2. Verify server removes socket from room
- **Expected**: Server cleans up room state; other players see updated room state
