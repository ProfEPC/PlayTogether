# PlayTogether — Infiltration Game & Admin Pages Implementation Prompt

> **Context**: This prompt is for an AI coding agent. The target project already has a working room/lobby system, Odd One Out, and Codenames games. Infiltration currently exists only as a placeholder in the game registry (`available: false`). This document specifies everything needed to build the full Infiltration game and its companion Admin pages. The project uses the tech stack and patterns described in `COPILOT_PROMPT.md` — Node + Express + Socket.IO server, React + Vite + Tailwind client, Zustand state, in-memory rooms, no database.

---

## Table of Contents

1. [Admin Pages](#1-admin-pages)
2. [Theme System](#2-theme-system)
3. [Character & Power System](#3-character--power-system)
4. [Power Table Reference](#4-power-table-reference)
5. [Power Compatibility & Meshing Rules](#5-power-compatibility--meshing-rules)
6. [Infiltration Game — Rules & Flow](#6-infiltration-game--rules--flow)
7. [Infiltration Socket Events](#7-infiltration-socket-events)
8. [Infiltration State Model](#8-infiltration-state-model)
9. [Power Execution Engine](#9-power-execution-engine)
10. [Infiltration UI — Host](#10-infiltration-ui--host)
11. [Infiltration UI — Player](#11-infiltration-ui--player)
12. [File Structure](#12-file-structure)
13. [Implementation Order](#13-implementation-order)

---

## 1. Admin Pages

The admin section is a separate route (`/admin`) accessible from the navigation bar. It provides tools for **designing game content** (characters, themes) and **monitoring live rooms**. No authentication — it is a local dev / trusted-host tool.

### 1.1 Route & Layout

- Route: `/admin` in the React router.
- Top-level tabbed layout with these tabs:
  - **Characters** — Create, edit, delete characters with power slots.
  - **Themes** — Create, edit, delete cosmetic themes.
  - **Rooms** — Live debug panel for all active rooms.

### 1.2 Characters Tab

A full character creation and management UI. Characters are persisted to a JSON file on the server via a REST API.

#### REST API — Characters

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/characters` | List all saved characters |
| `POST` | `/api/characters` | Create a new character (body = character data) |
| `PUT` | `/api/characters/:id` | Update an existing character |
| `DELETE` | `/api/characters/:id` | Delete a character |

Server persists to `apps/server/data/characters.json`. Each entry:

```json
{
  "id": "1771889203340",
  "name": "Seer",
  "data": {
    "name": "Seer",
    "description": "Sees one player's role",
    "team": "innocent",
    "theme": "debug",
    "infectedUponSight": false,
    "powerSlots": [
      {
        "powerIndex": 1,
        "type": "Learn",
        "item": "Role",
        "where": "Player",
        "amount": "1",
        "toggles": {},
        "timing": "before"
      }
    ]
  },
  "createdAt": "2026-02-23T23:26:43.340Z",
  "updatedAt": "2026-02-23T23:26:43.340Z"
}
```

#### Character Creation Form

The form has these fields:

| Field | Type | Description |
|-------|------|-------------|
| Name | text | Character name (required, unique per theme) |
| Description | text | Flavor text shown to players |
| Team | select | `innocent` or `infiltrator` |
| Theme | select | Dropdown of available themes (from themes API) |
| Infected Upon Sight | checkbox | If true, learning this character's role can trigger team infection |
| Power Slots | 1–3 slots | Each slot is a cascading power selector (see below) |

#### Power Slot Selector (Cascading Dropdowns)

Each power slot uses a series of dependent dropdowns that narrow down to a specific power from the 46-power table:

1. **Type** — `Learn`, `Reveal`, `Swap`, `Condition`, `Alter`, `Tamper`, `Settings`, `None`
2. **Item** — Filters based on Type (e.g., for Learn: `Role`, `Team`, `Players`, `Amount`, `Status`, `Type`)
3. **Where** — Filters based on Type+Item (e.g., for Learn+Role: `Player`, `Center`, `Self`)
4. **Disambiguation** — If multiple powers match the Type+Item+Where combo, show a dropdown of matching power names
5. **Amount** — Number input clamped to the power's Min/Max range
6. **Timing** — `before` or `after` (for Learn/Reveal powers: whether they execute before or after the Swap phase)
7. **Target Scope** — `Players Only`, `NPC Only`, `Players and NPC` (for powers that target players or center/NPC cards)
8. **Modifiers/Toggles** — Checkboxes for applicable flags: `lookPostAction`, `doPower`, etc.

When a slot is fully configured, show the resolved power name and description from the power table.

#### Character List

- Table/card list of all saved characters.
- Filter by theme.
- Each row shows: name, team (color-coded), theme, power summary.
- Edit button → opens the creation form pre-filled.
- Delete button → confirmation dialog, then `DELETE /api/characters/:id`.

#### Validation Panel

When creating/editing a character, show a live validation panel:

- **Power compatibility warnings** — Flag incompatible power combinations (see Section 5).
- **Missing fields** — Highlight required fields not yet filled.
- **Complexity score** — Sum of individual power complexity ratings (1–3 each from the power table).

### 1.3 Themes Tab

Full CRUD for cosmetic themes. Themes change the labels/text used in Infiltration without altering game mechanics.

#### REST API — Themes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/themes` | List all themes |
| `POST` | `/api/themes` | Create a new theme |
| `PUT` | `/api/themes/:id` | Update a theme |
| `DELETE` | `/api/themes/:id` | Delete a theme |

Server persists to `apps/server/data/themes.json`.

#### Theme Data Structure

```typescript
interface GameTheme {
  id: string;
  name: string;
  description: string;
  teamTerms: {
    infiltratorSingular: string;   // e.g. "Spy", "Thief"
    infiltratorPlural: string;
    innocentSingular: string;      // e.g. "Employee", "Guard"
    innocentPlural: string;
  };
  phaseText: {
    revealPrompt: string;          // Shown during reveal phase
    mayhemPrompt: string;          // Shown during mayhem phase
    votingPrompt: string;          // Shown during voting phase
    noInfiltratorOption: string;   // Label for "no infiltrator" vote option
  };
  phaseNames: {
    reveal: string;                // e.g. "Briefing"
    mayhem: string;                // e.g. "Heist"
    voting: string;                // e.g. "Accusation"
  };
  characterTerms: {
    npcSingular: string;           // e.g. "Safe", "Treasure"
    npcPlural: string;
  };
  playerTerms: {
    playerOuted: string;           // e.g. "{role} exposed!" — use {role} placeholder
    infiltratorWinText: string;
    innocentsWinText: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### Default Themes to Seed

| ID | Name | Infiltrator | Innocent | NPC | Phases |
|----|------|-------------|----------|-----|--------|
| `debug` | Debug Theme | Infiltrator | Innocent | NPC | Reveal / Mayhem / Voting |
| `coop_office` | Corporate Office | Corporate Spy | Employee | Safe | Briefing / Infiltration / Accusation |
| `heist` | Heist Scenario | Thief | Guard | Treasure | Briefing / Heist / Accusation |

#### Theme Editor Form

- All fields from the `GameTheme` interface as labeled text inputs.
- Grouped into sections: Team Terms, Phase Text, Phase Names, Character Terms, Player Terms.
- Live preview panel showing how each term would appear in-game.

### 1.4 Rooms Tab (Debug Panel)

A live monitoring view of all active rooms on the server. Communicates via Socket.IO admin events or a REST polling endpoint.

#### Features

| Feature | Description |
|---------|-------------|
| **Room List** | Table of all active rooms: room code, player count, game phase, created at |
| **Room Detail** | Click a room → see full `RoomState` as formatted JSON |
| **Force Close** | Button to forcibly close any room (emits `room:closed` to all players, cleans up state) |
| **Export State** | Download the current `RoomState` as a JSON file |
| **Player List** | Per-room: all players with connection status, team, character, vote |
| **Live Updates** | Room state auto-refreshes (via socket subscription or 2-second polling) |

#### Admin Socket Events or REST

Option A (Socket-based — preferred):

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `admin:listRooms` | C -> S | `{}` | Request list of all rooms |
| `admin:rooms` | S -> C | `RoomState[]` | Full state of all rooms |
| `admin:forceClose` | C -> S | `{ roomCode }` | Force close a room |
| `admin:exportRoom` | C -> S | `{ roomCode }` | Request room state for export |
| `admin:roomExport` | S -> C | `RoomState` | Room state for download |

Option B (REST-based — simpler):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/rooms` | List all rooms (summary) |
| `GET` | `/api/admin/rooms/:code` | Full room state |
| `POST` | `/api/admin/rooms/:code/close` | Force close room |

Guard admin endpoints with a simple check (e.g., query param `?key=admin` or just leave unguarded for local dev).

### 1.5 Character Designer Workflow

The admin's character + theme tabs together form a "game designer" workflow:

1. **Create a theme** — Define the cosmetic labels for a game scenario.
2. **Create characters** — Build characters tagged to that theme, selecting powers from the power table.
3. **Validate** — The validation panel catches incompatible power combos and shows complexity.
4. **Test in-game** — Host a room, select Infiltration, choose characters from that theme, and play.
5. **Iterate** — Return to admin, tweak characters, test again.

Characters are filtered by theme everywhere — in the admin list, in the host's character selection grid during lobby, and in the game itself.

---

## 2. Theme System

Themes are a **cosmetic overlay** for the Infiltration game. They change every player-facing label, prompt, and term without altering any game mechanics. The active theme is determined by the characters selected for a game — all characters in a game session must share the same theme.

### 2.1 How Themes Are Selected

1. In the admin panel, every character is tagged with a `theme` ID (e.g., `"debug"`, `"heist"`).
2. During lobby setup, the host toggles characters on/off from a grid. The grid is **filtered by theme** — the host picks a theme first (or it auto-selects based on the first character toggled).
3. All characters in a single game must belong to the same theme. The UI enforces this by only showing characters from the active theme.
4. The server loads the matching theme data and injects it into the game state so all clients render themed labels.

### 2.2 Where Themes Apply

Every piece of player-facing text in Infiltration should use theme terms instead of hardcoded strings:

| Hardcoded Default | Theme Field | Example (Heist) |
|-------------------|-------------|------------------|
| "Infiltrator" | `teamTerms.infiltratorSingular` | "Thief" |
| "Infiltrators" | `teamTerms.infiltratorPlural` | "Thieves" |
| "Innocent" | `teamTerms.innocentSingular` | "Guard" |
| "Innocents" | `teamTerms.innocentPlural` | "Guards" |
| "NPC" | `characterTerms.npcSingular` | "Treasure" |
| "NPCs" | `characterTerms.npcPlural` | "Treasures" |
| "Reveal" phase name | `phaseNames.reveal` | "Briefing" |
| "Mayhem" phase name | `phaseNames.mayhem` | "Heist" |
| "Voting" phase name | `phaseNames.voting` | "Accusation" |
| Reveal phase prompt | `phaseText.revealPrompt` | "Your position in this heist has been revealed!" |
| Mayhem phase prompt | `phaseText.mayhemPrompt` | "Let the heist begin! Execute your specialized moves." |
| Voting phase prompt | `phaseText.votingPrompt` | "Time to expose the thief! Who do you suspect?" |
| "No Infiltrator" vote option | `phaseText.noInfiltratorOption` | "No thief was recruited for this job!" |
| Win text (infiltrators) | `playerTerms.infiltratorWinText` | "Thieves made off with the goods!" |
| Win text (innocents) | `playerTerms.innocentsWinText` | "Thieves captured!" |
| Player outed text | `playerTerms.playerOuted` | "{role} compromised!" |

### 2.3 Theme in the State Model

When the game starts, the server resolves the active theme and attaches it to the game state so clients can render it:

```typescript
// Inside GameState.gameData for infiltration
{
  theme: GameTheme;  // Full resolved theme object
  // ... other infiltration game data
}
```

The client reads `room.game.gameData.theme` and passes it to all Infiltration UI components. **No component should hardcode "Infiltrator" / "Innocent" / "Mayhem" etc.** — always read from theme.

### 2.4 Theme Utility Helper

Create a shared utility for resolving themed text:

```typescript
// packages/shared/src/utils/themeText.ts (or apps/web/src/utils/themeText.ts)

function getTeamLabel(theme: GameTheme, team: "innocent" | "infiltrator", plural = false): string {
  if (team === "infiltrator") {
    return plural ? theme.teamTerms.infiltratorPlural : theme.teamTerms.infiltratorSingular;
  }
  return plural ? theme.teamTerms.innocentPlural : theme.teamTerms.innocentSingular;
}

function getPhaseName(theme: GameTheme, phase: "reveal" | "mayhem" | "voting"): string {
  return theme.phaseNames[phase];
}

function getPhasePrompt(theme: GameTheme, phase: "reveal" | "mayhem" | "voting"): string {
  const key = `${phase}Prompt` as keyof GameTheme["phaseText"];
  return theme.phaseText[key];
}

function getPlayerOutedText(theme: GameTheme, roleName: string): string {
  return theme.playerTerms.playerOuted.replace("{role}", roleName);
}
```

### 2.5 Theme Compatibility Rule

- A character's `theme` field must reference a valid theme ID from `themes.json`.
- The admin character creation form should only offer themes that exist.
- When the host selects characters for a game, the server validates all selected characters share the same theme.
- If the host tries to start with mixed-theme characters, emit `error:invalid` with message `"All characters must belong to the same theme"`.

---

## 3. Character & Power System

Infiltration uses a **character-based power system** — there are no hardcoded roles like "Spy" or "Seer". Instead, an admin creates characters in the admin panel, each with 1–3 power slots selected from a table of 46 powers. The host then picks which characters to use for a given game session.

### 3.1 Character Data Model

```typescript
interface Character {
  id: string;                    // Unique ID (timestamp-based or UUID)
  name: string;                  // Display name (e.g., "Seer", "Robber")
  data: {
    name: string;                // Same as top-level name
    description: string;         // Flavor text shown to players
    team: "innocent" | "infiltrator";
    theme: string;               // Theme ID this character belongs to
    infectedUponSight: boolean;  // Can learning this character trigger infection?
    powerSlots: PowerSlot[];     // 1–3 power slots
  };
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Power Slot Data Model

Each power slot references a power from the 46-power table by index, plus configuration:

```typescript
interface PowerSlot {
  powerIndex: number | null;     // Index (1–46) into the power table, null = empty slot
  type: string | null;           // Power type: Learn, Reveal, Swap, Condition, Alter, Tamper, Settings, None
  item: string | null;           // What the power acts on: Role, Team, Players, Block, etc.
  where: string | null;          // Target scope: Player, Center, Self, Role, etc.
  amount: string | null;         // How many targets (clamped to power's Min–Max)
  timing: "before" | "after" | null;  // Learn/Reveal timing relative to Swap phase
  targetScope?: "Players Only" | "NPC Only" | "Players and NPC";
  toggles: {                     // Modifier flags
    lookPostAction?: boolean;    // Can see own new role after this power changes it
    doPower?: boolean;           // Can execute new role's power after seeing it
  };
  // Resolved at runtime from the power table:
  // description, initiative, min, max, complexity, and all boolean flags
}
```

### 3.3 The 46-Power Table

Powers are defined in a static CSV/data file. The server loads this at startup. Each power has:

| Column | Type | Description |
|--------|------|-------------|
| `Index` | number | Unique ID (1–46) |
| `Initiative` | string | Execution priority. Space-separated values (e.g., `"10 90"` = can run at priority 10 or 90). Lower = earlier. |
| `Power Name` | string | Display name |
| `Description` | string | Human-readable description with `#` as placeholder for amount |
| `Type` | enum | `Learn`, `Reveal`, `Swap`, `Condition`, `Alter`, `Tamper`, `Settings`, `None` |
| `Item` | string | What the power acts on (e.g., `Role`, `Team`, `Block`, `Win`, `Silence`) |
| `Where` | string | Target type (e.g., `Player`, `Center`, `Self`, `Role`). Space-delimited for multi-target (e.g., `Player Player`) |
| `Min` | number | Minimum targets/amount |
| `Max` | number | Maximum targets/amount |
| `FixedAction` | boolean | Power has no target choice (auto-executes) |
| `FixedInitiative` | boolean | Initiative cannot be altered by other powers |
| `Infected` | boolean | Can trigger infiltrator infection mechanic |
| `Suicidal` | boolean | Win condition: player wins if voted out |
| `Murderer` | boolean | Player's vote also eliminates the target |
| `Predicter` | boolean | Player wins if their vote target is an infiltrator |
| `Silencer` | boolean | Can silence another player's vote |
| `2xVote` | boolean | Vote counts double |
| `LookPostAction` | boolean | Player can see their new role after this power changes it |
| `DoPower` | boolean | Player can execute their new role's power after seeing it |
| `Self-Destruct` | boolean | Power involves swapping own role away |
| `AllowRandom` | boolean | Random target selection is valid |
| `Vault` | boolean | Power can interact with center/NPC cards |
| `Complexity` | 1–3 | Complexity rating |

### 3.4 Power Categories Summary

| Type | Count | What It Does | Examples |
|------|-------|-------------|----------|
| **Learn** | 16 | Actor privately learns information about targets | Role Peek, Vault Peek, Allegiance Check, Roll Rolecall, Action Trace |
| **Reveal** | 4 | Information is revealed publicly to all players | Expose Role, Open Vault, Face Reveal, Role Spotlight |
| **Swap** | 7 | Move roles and/or teams between players and/or center cards | Role Swap, Self Swap, Team Exchange, Recruit, Swap Reversal |
| **Condition** | 2 | Grants an alternate win condition | Deathwish (win if voted out), Oracle (win if vote target is infiltrator) |
| **Alter** | 8 | Modify other players' actions: block, protect, change priority | Nope!, Shield, Priority Warp, Role Jam |
| **Tamper** | 7 | Modify the voting phase: silence, duplicate, kill votes | Mute Vote, Vote Encore, Double Tap, Death Vote |
| **Settings** | 1 | Change game settings at runtime | Time Warp (adjust discussion timer) |
| **None** | 1 | No power (placeholder for powerless characters) | No Action |

### 3.5 How Characters Are Used in a Game

1. **Host selects characters** — During lobby, the host sees a toggle grid of all characters in the active theme. They toggle on enough characters for all players + 3 NPCs.
2. **Validation** — Server checks: `selectedCharacters.length >= players.length + 3`. At least one character must have `team: "infiltrator"`. All must share same theme.
3. **Dealing** — When the game starts, server shuffles selected characters and deals them:
   - Each player gets one character (assigned to `player.character`).
   - The remaining 3 become **NPCs** (center cards). NPCs are virtual players with `isNPC: true`.
4. **Team assignment** — Each player's team is set from their character's `team` field. This can change during mayhem via Swap powers.
5. **Single round** — The game is always a single round. No re-dealing. After results, host can reset to lobby.

### 3.6 NPC (Center Cards)

NPCs represent undealt characters sitting in the "center" or "vault":

- Created as `Player` objects with `isNPC: true` and a generated name (e.g., "NPC 1", "NPC 2", "NPC 3").
- They have character assignments and teams just like real players.
- Powers that target "Center" interact with NPCs.
- NPCs do not vote, acknowledge, or act — they are passive targets.
- Always exactly **3 NPCs** per game.
- The host can see NPC character names in the host panel during results (not during gameplay).

### 3.7 Character Data File

Characters are stored in `apps/server/data/characters.json` as an array. The server provides a REST API (Section 1.2) and also exports a `getCharacters()` function for the socket handlers to read at game-start time.

### 3.8 Power Table Data File

The 46-power table should be stored as a TypeScript constant or JSON file loaded at startup:

```
apps/server/data/powers.csv          // or powers.json
apps/server/src/data/powerTable.ts   // parsed + typed version
```

Provide a `getPowerByIndex(index: number): Power` helper and a `filterPowers(type?, item?, where?): Power[]` helper for the cascading admin dropdowns.
