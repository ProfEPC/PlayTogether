# PlayTogether - Test Cases Index

Comprehensive test suite organized by functional area.

## Structure

- **[connection/](connection/)** — Socket connection and authentication
- **[room-management/](room-management/)** — Room lifecycle, joining, closing, player management
- **[game-configuration/](game-configuration/)** — Settings, readiness, game type selection
- **[games/](games/)** — Game-specific lifecycles and flows
  - Infiltration game phases and mechanics
  - Odd One Out game phases and mechanics
- **[technical/](technical/)** — Socket events, state, timers, phases
- **[admin/](admin/)** — Admin/debug features and utilities
- **[error-handling/](error-handling/)** — Edge cases, invalid inputs, race conditions
- **[performance/](performance/)** — Scalability, load testing, resource usage
- **[ux/](ux/)** — UI/UX flows, responsiveness, accessibility
- **[validation/](validation/)** — Game rules, role constraints, data recovery

## Quick Links

### Running Tests

Before each release, see **[REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md)** for pre-deployment verification.

### Test Coverage Summary

| Category       | Count    | Focus                  |
| -------------- | -------- | ---------------------- |
| Connection     | 2        | Socket setup/teardown  |
| Room Mgmt      | 17       | Room ops at all phases |
| Game Config    | 3        | Settings validation    |
| Infiltration   | 17       | Full game flow         |
| Odd One Out    | 10       | Full game flow         |
| Socket Events  | 8        | Event validation       |
| State          | 8        | Consistency & sync     |
| Timers         | 10       | Phase timing           |
| Admin          | 6        | Debug utilities        |
| Error Handling | 14       | Edge cases             |
| Performance    | 7        | Scalability            |
| UX             | 7        | UI responsiveness      |
| Game Rules     | 9        | Rule enforcement       |
| Data Persist   | 2        | Recovery scenarios     |
| **Total**      | **~120** | **Comprehensive**      |

## Notes

- All tests assume server on `http://localhost:3001`
- Web client on `http://localhost:5173`
- CORS configured for localhost
- In-memory state; resets on server restart
- Timers process-bound; no persistence
