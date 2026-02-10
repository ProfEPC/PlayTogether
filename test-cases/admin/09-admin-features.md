# Admin & Debug Features Tests

## TC9.1: Admin Page Access

- **Precondition**: App loaded, admin page URL known
- **Steps**:
  1. Navigate to `/admin`
  2. Check if debug UI loads
- **Expected**: Admin panel displays or access denied (based on requirements)

## TC9.2: View Room State (Admin)

- **Precondition**: Room active, admin panel open
- **Steps**:
  1. Select room from list
  2. Inspect serialized state
- **Expected**: Full room state, player list, timers visible for debugging

## TC9.3: Manually Close Room (Admin)

- **Precondition**: Room stuck or problematic
- **Steps**:
  1. Admin clicks "Force Close"
- **Expected**: Room closed; all players disconnected; no error

## TC9.4: Admin Impersonate Player (if supported)

- **Precondition**: Active game with admin panel open
- **Steps**:
  1. Admin selects a player and simulates their action (e.g., vote)
- **Expected**: Action processed as if from that player; audit trail recorded if available

## TC9.5: Admin View Performance Metrics

- **Precondition**: Admin panel open
- **Steps**:
  1. Check memory usage, connected sockets, active rooms
  2. Correlate with actual game count
- **Expected**: Metrics accurate; no leaked resources; memory scales linearly with room count

## TC9.6: Export Room State (Admin)

- **Precondition**: Active room, admin panel
- **Steps**:
  1. Click "Export State" or similar
  2. Inspect exported JSON
- **Expected**: Full room state exported; JSON valid; includes all players, settings, game state, timers
