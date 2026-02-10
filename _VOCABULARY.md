# PlayTogether - Vocabulary & Terminology Guide

Standardized terminology for the PlayTogether project. Use these terms consistently across code, documentation, tests, and communication.

---

## Game Types

| Term | Definition | Also Known As |
|------|-----------|---------------|
| **Infiltration** | Social deduction game where players try to identify and eliminate the infiltrator before they win | "Infiltrator game", "social deduction game" |
| **Odd One Out** | Party game where players submit answers to a prompt, then vote on which answer is the "odd one out" | "Odd one out game" |

---

## Infiltration Game - Roles

| Term | Definition | Team | Notes |
|------|-----------|------|-------|
| **Infiltrator** | Hidden antagonist. Wins if they reach the end of all rounds without elimination. | Enemy | Singular; max 1 per game |
| **Civilian** | Default role. Wins if infiltrator is eliminated before game ends. | Friendly | Majority role; has no special powers |
| **Thief** | Special civilian role. Can perform heist-related actions during mayhem phase. | Friendly | Optional; subset of civilians |
| **Hacker** | Special civilian role. Can perform tech-related actions during mayhem phase. | Friendly | Optional; subset of civilians |
| **Engineer** | Special civilian role. Can perform engineering-related actions during mayhem phase. | Friendly | Optional; subset of civilians |

---

## Infiltration Game - Phases

| Term | Definition | Duration | Action Type |
|------|-----------|----------|-------------|
| **Lobby** | Pre-game state where players join and host configures settings. | Indefinite | Configuration; readiness toggle |
| **Reveal** | First game phase; players see their own role card. | Configurable (default 10s) | View-only; cannot interact |
| **Mayhem** | Second phase; special roles use their powers on targets. | Configurable (default 10s) | Active power submission |
| **Voting** | Third phase; all players vote to eliminate a suspect. | Configurable (default 10s) | Vote submission (one per player) |
| **Results** | Display round outcome, eliminated player, remaining players, and check win conditions. | Configurable (default 5s) | View-only; preparation for next round |

---

## Odd One Out Game - Phases

| Term | Definition | Duration | Action Type |
|------|-----------|----------|-------------|
| **Lobby** | Pre-game state where players join and host configures settings. | Indefinite | Configuration; readiness toggle |
| **Play** | Players submit answers to a prompt/category. | Configurable (default 30s) | Answer submission (one per player) |
| **Vote** | Players vote on which answer is the "odd one out". | Configurable (default 10s) | Vote submission (one per player) |
| **Results** | Display correct odd one out, answer authors, vote counts, and points awarded. | Configurable (default 5s) | View-only; preparation for next round or end |

---

## Room State & Management

| Term | Definition | Example Values |
|------|-----------|-----------------|
| **Room** | Isolated game container holding players, settings, and game state. | Code: `ABC123` |
| **Room Code** | Unique 6-character alphanumeric identifier for a room (uppercase). | `ABC123`, `XYZ789` |
| **Host** | Player who created the room; has admin permissions. | Socket ID of host |
| **Player** | Any person connected to a room. | Socket ID + player data |
| **Room State** | Complete snapshot of room including players, settings, phase, and game progress. | JSON object broadcasted to all players |
| **Room Full** | Room at max capacity (default 12 players); no new joins allowed. | Boolean; derived from player count |
| **Ready Flag** | Indicates player is prepared to start the game. | Boolean per player |

---

## Game State & Progress

| Term | Definition | Context |
|------|-----------|---------|
| **Round** | Single iteration of a game from reveal to results (Infiltration) or play to results (Odd One Out). | "Round 1 of 3" |
| **Game State** | Current phase, round number, player roles, submissions, and results. | Nested in room state |
| **Phase** | Current stage of a round (e.g., "reveal", "voting", "results"). | Broadcast to all players |
| **Turn** | During mayhem/voting, a player's opportunity to act. | Not actively used in current design; phase-based instead |
| **Win Condition** | Game-ending scenario (infiltrator eliminated, infiltrator survives all rounds, etc.). | Context-dependent per game type |

---

## Powers & Actions

| Term | Definition | Availability | Scope |
|------|-----------|--------------|-------|
| **Power** | Special ability used by special roles during mayhem phase. | Special roles only (Thief, Hacker, Engineer) | Single-use per round or persistent per spec |
| **Power Type** | Category of power (e.g., "view_player_team", "protect", "investigate"). | Varies by role | Determined by role definition |
| **Target** | Player selected as recipient of a power or vote. | Configurable per power | Usually another player; may exclude self/eliminated |
| **Submit** | Send an action (power, vote, answer) to server for processing. | Varies by phase | `game:submit` socket event |

---

## Socket Events & Communication

| Event Name | Direction | Payload | Purpose |
|------------|-----------|---------|---------|
| `room:host` | Client → Server | `{ gameType }` | Player creates new room |
| `room:join` | Client → Server | `{ code }` | Player joins existing room |
| `room:state` | Server → Client | Full room state | Broadcast state after mutations |
| `room:close` | Client → Server | `{}` | Host closes room |
| `room:kick` | Client → Server | `{ targetSocketId }` | Host removes player |
| `room:updateSettings` | Client → Server | `{ settings }` | Host changes game configuration |
| `room:setReady` | Client → Server | `{ ready }` | Player toggles readiness |
| `game:start` | Client → Server | `{}` | Host initiates game |
| `game:submit` | Client → Server | `{ power, target } \| { vote } \| { answer }` | Player submits action |
| `game:reset` | Client → Server | `{}` | Host restarts game from lobby |
| `error:forbidden` | Server → Client | `{ message }` | Authorization failure |

---

## Player Status & Presence

| Term | Definition | Transitions |
|------|-----------|-------------|
| **Connected** | Socket established; player in room. | Connected → Disconnected |
| **Disconnected** | Socket closed; player left or connection lost. | Disconnected → Connected |
| **Eliminated** | Player voted out during round; cannot vote/act in subsequent rounds. | Active → Eliminated → (next round or game end) |
| **Active** | Player currently in game and able to perform actions. | Active → Eliminated or Active → Left |
| **Left** | Player departed voluntarily or was kicked. | Active/Eliminated → Left → (possibly rejoins) |
| **Spectator** | Player eliminated or observing; cannot affect game (not actively used; same as eliminated). | Subset of "eliminated" |

---

## Game Configuration

| Term | Definition | Type | Default | Range |
|------|-----------|------|---------|-------|
| **Rounds** | Number of elimination rounds in a game. | Integer | 3 | 1–10 |
| **Timer** | Countdown duration for a phase. | Integer (seconds) | Varies by phase | 0–300s |
| **Min Players** | Minimum required to start game. | Integer | 3 | 2–12 |
| **Max Players** | Maximum allowed in room. | Integer | 12 | 3–12 |
| **Game Type** | Which game mode to play. | Enum | "infiltration" | "infiltration" \| "odd_one_out" |

---

## Data & Persistence

| Term | Definition | Scope |
|------|-----------|-------|
| **In-Memory** | State stored in server RAM; lost on restart. | All room state, timers, player data |
| **Server Restart** | Stopping and restarting server process; clears all rooms. | Expected behavior; no data recovery |
| **Rejoin** | Player reconnecting mid-game with room code. | State should restore (if room still exists) |
| **Orphaned State** | Leftover room/timer data after unexpected disconnection. | Should be cleaned up automatically |

---

## UI/UX & Display

| Term | Definition | Example |
|------|-----------|---------|
| **Lobby Page** | Pre-game UI; shows room code, player list, settings. | `/host`, `/player` |
| **Host Page** | Lobby variant where host can start/close game. | `/host` |
| **Player Page** | Lobby variant for non-host players. | `/player` |
| **Game Page** | Active game UI showing current phase and actions. | Reveal → Mayhem → Voting → Results |
| **Role Card** | Visual representation of player's role during reveal. | "Infiltrator", "Civilian", etc. |
| **Power UI** | Interface for selecting power and target during mayhem. | Dropdown + target selector |
| **Vote UI** | Interface for selecting suspect during voting. | Player list with vote button |

---

## Error & Status Messages

| Message | Meaning | Resolution |
|---------|---------|-----------|
| "Room not found" | Code doesn't exist or room closed. | Check code; create new room |
| "Room full" | Max players reached. | Join different room or wait for spot |
| "Unauthorized" / "error:forbidden" | Non-host attempted privileged action. | Only host can perform operation |
| "All players must be ready" | Game start blocked; not all players ready. | All players toggle ready |
| "Invalid target" | Power/vote target invalid or eliminated. | Select valid target |
| "Already voted" | Player submitted vote; cannot change. | Wait for next round |

---

## Special Cases & Edge Terms

| Term | Definition |
|------|-----------|
| **Host Disconnect** | Host unexpectedly loses connection; room auto-closes. |
| **Player Rejoin** | Player returns mid-game with same room code; state restored if room exists. |
| **Stale Round ID** | Timer/event from previous round; ignored by server. |
| **Unanimous Decision** | All players submitted same action; phase can advance early. |
| **Tiebreaker** (Odd One Out) | Algorithm to determine winner if multiple answers tied. |

---

## Quick Reference - Common Phrases

- **"Start the game"** = Host initiates from Lobby → Reveal phase begins
- **"Play a round"** = Complete cycle from Reveal → Results (or Play → Results in Odd One Out)
- **"Close the room"** = Host terminates room; all players disconnected
- **"Set ready"** = Player toggles readiness flag
- **"Submit power"** = Special role uses ability on target during Mayhem
- **"Submit vote"** = Player eliminates suspect during Voting phase
- **"Broadcast state"** = Server emits `room:state` to all players
- **"Win condition met"** = Game ends; win/loss determined

---

## Notes

- Always use **lowercase with underscores** for JSON keys: `infiltrator`, `view_player_team`, not `Infiltrator` or `ViewPlayerTeam`
- Always use **UPPERCASE** for room codes in user-facing displays: `ABC123`, not `abc123`
- Use **"phase"** not "turn" or "stage" when referring to game progression
- Use **"round"** for full iteration; use **"phase"** for sub-phases within a round
- Prefer **"eliminate"** over "kill", "remove", or "eject"
- Use **"special role"** as umbrella term for Thief, Hacker, Engineer; contrast with "Civilian"

