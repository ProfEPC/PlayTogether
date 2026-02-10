# Data Persistence & Recovery Tests

## TC14.1: Server Restart Clears All Rooms

- **Precondition**: Active rooms and games
- **Steps**:
  1. Stop server
  2. Restart server
  3. Attempt to rejoin by code
- **Expected**: All rooms cleared; rejoin fails; expected behavior (no DB)

## TC14.2: Client Rejoin After Network Hiccup

- **Precondition**: Player playing game, network drops 5 seconds
- **Steps**:
  1. Network reconnects
  2. Client reestablishes socket
  3. Player rejoins room by code
- **Expected**: Player state restored; game continues
