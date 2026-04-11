# PlayTogether — Infiltration Game & Admin Pages Implementation Prompt

> **Context**: This prompt is for an AI coding agent. The target project already has a working room/lobby system, Odd One Out, and Mindfield games. Infiltration currently exists only as a placeholder in the game registry (`available: false`). This document specifies everything needed to build the full Infiltration game and its companion Admin pages. The project uses the tech stack and patterns described in `COPILOT_PROMPT.md` — Node + Express + Socket.IO server, React + Vite + Tailwind client, Zustand state, in-memory rooms, no database.

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

### 1.2 Characters Tab

A full character creation and management UI. Characters are persisted to a JSON file on the server via a REST API.

#### REST API — Characters

| Method   | Endpoint              | Description                                    |
| -------- | --------------------- | ---------------------------------------------- |
| `GET`    | `/api/characters`     | List all saved characters                      |
| `POST`   | `/api/characters`     | Create a new character (body = character data) |
| `PUT`    | `/api/characters/:id` | Update an existing character                   |
| `DELETE` | `/api/characters/:id` | Delete a character                             |

Server persists to a JSON file (e.g., `data/characters.json`). Each entry has:

- **id** — numeric unique ID (e.g., `Date.now()` at creation)
- **name** — character display name
- **data** — object containing:
  - **name** — same as top-level name
  - **description** — flavor text shown to players
  - **team** — `"innocent"`, `"infiltrator"`, or `"special"`
  - **theme** — theme ID this character belongs to
  - **infectedUponSight** — boolean; if true, learning this character's role can trigger team infection
  - **powerSlots** — array of 1–3 power slot objects (see Section 3.2 for per-type fields)
- **createdAt** / **updatedAt** — ISO timestamp strings

#### Character Creation Form

The form has these fields:

| Field               | Type      | Description                                                        |
| ------------------- | --------- | ------------------------------------------------------------------ |
| Name                | text      | Character name (required, unique per theme)                        |
| Description         | text      | Flavor text shown to players                                       |
| Team                | select    | `innocent`, `infiltrator`, or `special`                            |
| Theme               | select    | Dropdown of available themes (from themes API)                     |
| Infected Upon Sight | checkbox  | If true, learning this character's role can trigger team infection |
| Power Slots         | 1–3 slots | Each slot is a cascading power selector (see below)                |

#### Power Slot Selector (Cascading Dropdowns)

Each power slot uses a series of dependent dropdowns that narrow down to a specific power from the 41-power table:

1. **Type** — `Learn`, `Reveal`, `Swap`, `Condition`, `Alter`, `Tamper`, `Settings`, `None`
2. **Item** — Filters based on Type (e.g., for Learn: `Role`, `Team`, `Players`, `Amount`, `Status`, `Type`)
3. **Where** — Filters based on Type+Item (e.g., for Learn+Role: `Player`, `Self`)
4. **Disambiguation** — If multiple powers match the Type+Item+Where combo, show a dropdown of matching power names
5. **Amount** — Number input clamped to the power's Min/Max range (auto-set and hidden when min === max)
6. **Scope Toggles** — When the power has `targetScopes`, first show a scope dropdown (Players Only / NPC Only / Players and NPC) to set `canTargetPlayers`/`canTargetNPCs` defaults. Then show all four scope booleans that are `true` as toggles — admin can toggle any off.
7. **Modifiers** — Checkboxes: `lookPostAction` (only for Swap powers where the power table default is true), `doPower` (only for Learn/Reveal/Swap powers where the power table default is true)

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

| Method   | Endpoint          | Description        |
| -------- | ----------------- | ------------------ |
| `GET`    | `/api/themes`     | List all themes    |
| `POST`   | `/api/themes`     | Create a new theme |
| `PUT`    | `/api/themes/:id` | Update a theme     |
| `DELETE` | `/api/themes/:id` | Delete a theme     |

Server persists to a JSON file (e.g., `data/themes.json`).

#### Theme Data Structure

A theme object contains:

- **id** — numeric unique ID
- **name** / **description** — display name and description
- **teamTerms** — object with four strings: `infiltratorSingular`, `infiltratorPlural`, `innocentSingular`, `innocentPlural` (e.g., "Spy" / "Spies" / "Employee" / "Employees")
- **phaseText** — object with four strings: `revealPrompt`, `mayhemPrompt`, `votingPrompt`, `noInfiltratorOption` — text shown during each phase
- **phaseNames** — object with three strings: `reveal`, `mayhem`, `voting` — the themed name for each phase (e.g., "Briefing", "Heist", "Accusation")
- **characterTerms** — object with `npcSingular` and `npcPlural` (e.g., "Safe" / "Safes")
- **playerTerms** — object with `playerOuted` (use `{role}` placeholder), `infiltratorWinText`, `innocentsWinText`
- **createdAt** / **updatedAt** — ISO timestamp strings

#### Default Themes to Seed

| ID            | Name             | Infiltrator   | Innocent | NPC      | Phases                               |
| ------------- | ---------------- | ------------- | -------- | -------- | ------------------------------------ |
| `debug`       | Debug Theme      | Infiltrator   | Innocent | NPC      | Reveal / Mayhem / Voting             |
| `coop_office` | Corporate Office | Corporate Spy | Employee | Safe     | Briefing / Infiltration / Accusation |
| `heist`       | Heist Scenario   | Thief         | Guard    | Treasure | Briefing / Heist / Accusation        |

#### Theme Editor Form

- All fields from the `GameTheme` interface as labeled text inputs.
- Grouped into sections: Team Terms, Phase Text, Phase Names, Character Terms, Player Terms.
- Live preview panel showing how each term would appear in-game.

---

## 2. Theme System

Themes are a **cosmetic overlay** for the Infiltration game. They change every player-facing label, prompt, and term without altering any game mechanics. The **host selects a single theme** during lobby setup, which in turn populates the character selection grid with characters from that theme.

### 2.1 How Themes Are Selected

1. In the admin panel, every character is tagged with a `theme` ID (e.g., `"aliens"`, `"noir"`).
2. During lobby setup, the host first **selects a theme** from a theme picker (radio / select list of available themes). This determines which characters appear in the character toggle grid.
3. The character toggle grid is then populated with **all characters belonging to the selected theme**. The host toggles on/off which characters to include.
4. The server loads the matching theme data and injects it into the game state so all clients render themed labels.

### 2.2 Where Themes Apply

Every piece of player-facing text in Infiltration should use theme terms instead of hardcoded strings:

| Hardcoded Default | Theme Field                     | Example (Aliens) |
| ----------------- | ------------------------------- | ---------------- |
| "Infiltrator"     | `teamTerms.infiltratorSingular` | "Alien"          |
| "Infiltrators"    | `teamTerms.infiltratorPlural`   | "Aliens"         |
| "Innocent"        | `teamTerms.innocentSingular`    | "Crew"           |
| "Innocents"       | `teamTerms.innocentPlural`      | "Crew"           |

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

When the game starts, the server resolves the active theme and attaches the full theme object to `GameState.gameData`. The client reads the theme from the room’s game state and passes it to all Infiltration UI components. **No component should hardcode “Infiltrator” / “Innocent” / “Mayhem” etc.** — always read from the theme. The `special` team has no theme overrides; when a special player wins, display their **character name** (e.g., _“The Oracle achieved their win condition!”_).

### 2.4 Theme Utility Helper

Create a shared utility (accessible to both server and client) with helpers for resolving themed text:

- **getTeamLabel(theme, team, plural?)** — Returns the themed label for a team. For `"infiltrator"` and `"innocent"`, look up the singular/plural from `teamTerms`. For `"special"`, return the literal word “Special” (or use the character name at display time).
- **getPhaseName(theme, phase)** — Returns the themed phase name from `phaseNames`.
- **getPhasePrompt(theme, phase)** — Returns the themed prompt text from `phaseText`.
- **getPlayerOutedText(theme, roleName)** — Returns the `playerOuted` template with `{role}` replaced by the actual role name.

### 2.5 Theme Compatibility Rule

- A character's `theme` field must reference a valid theme ID from `themes.json`.
- The admin character creation form should only offer themes that exist.
- During lobby, the host selects a theme first. The character grid only shows characters from the selected theme, preventing mismatched selections.
- The server still validates at game-start that all selected characters belong to the selected theme. If violated, emit `error:invalid` with message `"All characters must belong to the selected theme"`.

---

## 3. Character & Power System

Infiltration uses a **character-based power system** — there are no hardcoded roles like "Spy" or "Seer". Instead, an admin creates characters in the admin panel, each with 1–3 power slots selected from a table of **41 powers**. The host then picks which characters to use for a given game session.

### 3.1 Character Data Model

A **Character** record has the following fields:

- **id** (number) — unique numeric identifier (e.g. timestamp at creation).
- **name** (string) — display name (e.g. "Pilot", "Engineer").
- **data** (object) containing:
  - **name** (string) — same as the top-level name.
  - **description** (string) — flavor text shown to players.
  - **team** — one of "innocent", "infiltrator", or "special".
  - **theme** (string) — the theme ID this character belongs to.
  - **infectedUponSight** (boolean) — whether learning this character can trigger the infiltrator infection mechanic.
  - **powerSlots** — an array of 1–3 PowerSlot objects (see Section 3.2).
- **createdAt** (string) — ISO timestamp.
- **updatedAt** (string) — ISO timestamp.

### 3.2 Power Slot Data Model

Each character has 1–3 **power slots**. A power slot stores the admin's configuration for one power — which power was selected and how the admin configured its variable fields. All other fields (flags, initiative, description, complexity, etc.) are **resolved at runtime** by looking up the power in the 41-power table via `powerIndex`.

Each power type has its own set of fields. Fields marked _(from power table)_ use the power table value as the default; the admin can override. For types that involve targeting, the **scope booleans** (`canTargetPlayers`, `canTargetNPCs`, `canTargetSelf`, `canTargetRole`) replace the raw `where` string from the power table — defaults come from the `where` derivation mapping (Section 3.3). All scope booleans that default to `true` appear as toggles in the character creation UI; the admin can toggle any of them off. The saved values determine what the player can target during mayhem. When a power has `targetScopes`, a scope dropdown (Players Only / NPC Only / Players and NPC) sets the `canTargetPlayers` and `canTargetNPCs` defaults before they appear as toggles.

#### Learn — privately discover information about targets

| Field                | Type                    | Description                                                                                              |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **powerIndex**       | number                  | Index into the power table (Section 4). Identifies the power.                                            |
| **type**             | `"Learn"`               | Power category.                                                                                          |
| **item**             | string                  | What the power learns — `Role`, `Team`, `Players`, `Amount`, `Status`, `Type`.                           |
| **amount**           | number                       | How many targets. Admin picks within power's min–max range.                                              |
| **fixedInitiative**  | boolean _(from power table)_ | Whether this power's initiative is fixed. When true, runs at its defined initiative. When false, the order can be adjusted in theme settings. |
| **canTargetPlayers** | boolean                      | Can target player cards. Default from `where`; overridden by `targetScopes` dropdown when present.       |
| **canTargetNPCs**    | boolean                 | Can target NPC/center cards. Same derivation.                                                            |
| **canTargetSelf**    | boolean                 | Targets self. True for Last Look (index 3).                                                              |
| **canTargetRole**    | boolean                 | Targets by role name. True for Roll Rolecall (6), Role Beacon (7), Role Tally (12).                      |
| **doPower**          | boolean _(from power table)_ | Player can execute the new role's power after learning it.                                          |

#### Reveal — publicly announce information to all players

| Field                | Type                         | Description                                               |
| -------------------- | ---------------------------- | --------------------------------------------------------- |
| **powerIndex**       | number                       | Index into the power table (Section 4).                   |
| **type**             | `"Reveal"`                   | Power category.                                           |
| **item**             | string                       | What is revealed — always `Role` for current Reveal powers.|
| **amount**           | number                       | How many targets.                                                                     |
| **fixedInitiative**  | boolean _(from power table)_ | Whether this power's initiative is fixed. When true, runs at its defined initiative. When false, the order can be adjusted in theme settings. |
| **canTargetPlayers** | boolean                      | Can target player cards. Default from `where`; overridden by `targetScopes` dropdown when present.                                           |
| **canTargetNPCs**    | boolean                      | Can target NPC/center cards.                              |
| **canTargetSelf**    | boolean                      | Targets self. True for Face Reveal (index 19).            |
| **doPower**          | boolean _(from power table)_ | Player can execute the new role's power after the reveal. |

#### Swap — exchange roles and/or teams between targets

| Field                | Type                         | Description                                                                                              |
| -------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **powerIndex**       | number                       | Index into the power table (Section 4).                                                                  |
| **type**             | `"Swap"`                     | Power category.                                                                                          |
| **item**             | string                       | What is swapped — `Role`, `Role Team`, `Team`.                                                           |
| **amount**           | number                       | How many targets (e.g., 2 for Role Swap, 1 for Self Swap).                                               |
| **canTargetPlayers** | boolean                      | Can target player cards.                                                                                 |
| **canTargetNPCs**    | boolean                      | Can target NPC/center cards.                                                                             |
| **canTargetSelf**    | boolean                      | Swap involves self. True for Team Exchange (25), Recruit (26).                                           |
| **lookPostAction**   | boolean _(from power table)_ | Player sees their new role after the swap. Relevant for Self Swap (22), Team Exchange (25).              |
| **doPower**          | boolean _(from power table)_ | Player can execute the new role's power after seeing it. Relevant for Self Swap (22), Team Exchange (25).|

#### Condition — grants an alternate win condition (passive, no targeting)

| Field          | Type          | Description                                                                |
| -------------- | ------------- | -------------------------------------------------------------------------- |
| **powerIndex** | number        | Index into the power table (Section 4).                                    |
| **type**       | `"Condition"` | Power category.                                                            |
| **item**       | string        | What triggers the condition — `Win`.                                       |
| **where**      | string        | Trigger context — `Self` (voted out) or `Vote` (vote target). Kept as-is. |
| **amount**     | number        | Always 0 (min and max are both 0 for conditions). Auto-set, not editable.  |

#### Alter — modify other players' actions (block, protect, change priority)

| Field                | Type      | Description                                                                                                         |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| **powerIndex**       | number    | Index into the power table (Section 4).                                                                             |
| **type**             | `"Alter"` | Power category.                                                                                                     |
| **item**             | string    | What is altered — `Block`, `Shield`, `Priority`, `Action`.                                                          |
| **amount**           | number    | How many targets.                                                                                                   |
| **canTargetPlayers** | boolean   | Can target player cards. Most Alter powers target by Player or Role.                                                |
| **canTargetNPCs**    | boolean   | Can target NPC/center cards. Usually false for Alter.                                                               |
| **canTargetRole**    | boolean   | Targets by role name instead of by player. True for Role Jam (31), Order Rewrite (33), Order Rule (35), Guard (37). |

#### Tamper — modify the voting phase (silence, duplicate, kill votes)

| Field                | Type       | Description                                                                                         |
| -------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| **powerIndex**       | number     | Index into the power table (Section 4).                                                             |
| **type**             | `"Tamper"` | Power category.                                                                                     |
| **item**             | string     | What is tampered — `Silence`, `Duplicate`, `Kill`, `Bonus`.                                         |
| **amount**           | number     | How many targets. Auto-set to 0 for powers where min === max === 0 (e.g., Vote Encore, Double Tap). |
| **canTargetPlayers** | boolean    | Targets by player. True for Mute Vote (38), Vote Encore (40), Death Vote (43), Last Laugh (44).     |
| **canTargetSelf**    | boolean    | Affects self's own vote. True for Double Tap (42).                                                   |
| **canTargetRole**    | boolean    | Targets by role name. True for Vote Jam (39), Vote Echo (41).                                        |

#### Settings — change game settings at runtime (room-wide, no targets)

| Field          | Type         | Description                                              |
| -------------- | ------------ | -------------------------------------------------------- |
| **powerIndex** | number       | Index into the power table (Section 4).                  |
| **type**       | `"Settings"` | Power category.                                          |
| **item**       | string       | Always `Time` (the only Settings power is Time Warp).    |

No targeting fields — the power takes effect automatically based on its definition in the power table.

#### None — no power (placeholder for powerless characters)

| Field          | Type     | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| **powerIndex** | number   | Index into the power table (Section 4).         |
| **type**       | `"None"` | Power category.                                 |
| **item**       | string   | Always `NoAction`.                              |

No targeting fields — the character has no action during mayhem.

#### Fields Resolved at Runtime (NOT stored on the slot)

These come from looking up `powerIndex` in the power table:

- **initiative**, **powerName**, **description** — display and ordering info
- **where** — target type string; used to derive scope booleans (see Section 3.3). Only stored directly on Condition slots; all other types use scope booleans instead.
- **min**, **max** — validation bounds for the amount field
- **fixedAction** — power auto-executes with no target choice
- **infected** — can trigger the infiltrator infection mechanic (Section 6.4)
- **allowRandom** — random target selection is valid
- **vault**, **vaultName** — power can interact with center/NPC cards
- **complexity** — 1–3 complexity rating for informational display
- **targetScopes** — available scope options (admin's choice stored as `canTargetPlayers`/`canTargetNPCs`)
- **murderer**, **predicter**, **twoXVote**, **silencer**, **suicidal** — meshing flags (Section 5)

### 3.3 The InfiltrationPower Type

All 41 powers are fully specified in **Section 4 — Power Table Reference** of this document. That section is the single source of truth. The implementing agent must create these as TypeScript constants grouped by category.

The `InfiltrationPower` type defines each power:

A **TargetScope** is one of three string values: "Players Only", "NPC Only", or "Players and NPC".

An **InfiltrationPower** record has the following fields:

- **index** (number) — unique power ID. Non-contiguous range 1–46 with gaps at 2, 5, 14, 15, 18.
- **initiative** (string) — execution priority, space-separated (e.g. "10 90"). Lower numbers execute earlier.
- **powerName** (string) — display name.
- **description** (string) — human-readable description; the "#" character is a placeholder for the amount.
- **type** (string) — one of: Learn, Reveal, Swap, Condition, Alter, Tamper, Settings, None.
- **item** (string) — what the power acts on (e.g. Role, Team, Block, Win, Silence).
- **where** (string) — target type (e.g. Player, Self, Role, Type, Reversal).
- **min** (number) — minimum targets or amount.
- **max** (number) — maximum targets or amount.
- **fixedAction** (boolean) — power auto-executes with no target choice.
- **fixedInitiative** (boolean) — when the admin creates a character, they pick whether the power runs before or after swaps; when true the power runs at its defined initiative and the order cannot be adjusted in theme settings.
- **infected** (boolean) — can trigger the infiltrator infection mechanic.
- **lookPostAction** (boolean) — player sees their new role after a swap changes it.
- **doPower** (boolean) — player can execute the new role's power after seeing it.
- **allowRandom** (boolean) — random target selection is valid.
- **vault** (boolean) — power can interact with center / NPC cards.
- **vaultName** (string, optional) — display name for the vault.
- **complexity** (number) — 1–3 complexity rating.
- **targetScopes** (array of TargetScope, optional) — when present, the power can target Players, NPCs, or both.

> **Design note — targetScopes consolidation**: Rather than having 46 separate powers with separate entries for "Player" vs "Center/Vault" variants (e.g., Role Peek vs Vault Peek), the power table **consolidates** these into 41 powers by using `targetScopes`. When a power has `targetScopes`, the admin character creation UI should present a dropdown to choose the scope ("Players Only", "NPC Only", or "Players and NPC"). This scope is saved on the `PowerSlot` and determines valid targets at runtime.

#### Deriving Scope Booleans from `where`

The power table stores a `where` string for each power. When building a PowerSlot (except for Condition, which keeps `where` directly), convert `where` into scope booleans using this mapping:

| `where` value   | `canTargetPlayers` | `canTargetNPCs` | `canTargetSelf` | `canTargetRole` | Notes                         |
| --------------- | ------------------ | --------------- | --------------- | --------------- | ----------------------------- |
| `Player`        | true               | false           | false           | false           | Standard player targeting     |
| `Center`        | false              | true            | false           | false           | NPC/center cards only         |
| `Self`          | false              | false           | true            | false           | Targets self only             |
| `Role`          | true               | true            | false           | true            | Targets by role name          |
| `Same Role`     | true               | false           | false           | true            | All players sharing a role    |
| `Same Team`     | true               | false           | false           | false           | All players sharing a team    |
| `Type`          | true               | true            | false           | false           | Targets by power type         |
| `Action`        | true               | false           | false           | false           | Targets by action taken       |
| `Association`   | true               | true            | false           | false           | Targets by team association   |
| `Reversal`      | true               | false           | false           | false           | Reverses previous swaps       |
| `Player Player` | true               | false           | false           | false           | Two-player targeting          |
| `Vote`          | false              | false           | false           | false           | Targets the voter’s own vote  |
| `Room`          | false              | false           | false           | false           | Room-wide effect (no targets) |
| `None`          | false              | false           | false           | false           | No targeting                  |

When a power **does** have `targetScopes`, a scope dropdown (Players Only / NPC Only / Players and NPC) sets the `canTargetPlayers` and `canTargetNPCs` defaults. After all defaults are set, every scope boolean that is `true` appears as a toggle — the admin can turn any of them off. The saved values are what the player can target during mayhem.

Provide helpers for power lookups:

Provide two helper utilities for working with the power list:

1. **getPowerByIndex** — accepts an index number and returns the matching power from the master list, or undefined if not found.
2. **filterPowers** — accepts optional type, item, and where parameters and returns all powers matching every provided criterion (ignore criteria that are not supplied).

### 3.4 Power Categories Summary

| Type          | Count | What It Does                                                   | Examples                                                                 |
| ------------- | ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Learn**     | 12    | Actor privately learns information about targets               | Role Peek, Allegiance Check, Roll Rolecall, Action Trace, Role Tally     |
| **Reveal**    | 3     | Information is revealed publicly to all players                | Expose Role, Face Reveal, Role Spotlight                                 |
| **Swap**      | 7     | Move roles and/or teams between players and/or center cards    | Role Swap, Self Swap, Team Exchange, Recruit, Swap Reversal              |
| **Condition** | 2     | Grants an alternate win condition                              | Deathwish (win if voted out), Oracle (win if vote target is infiltrator) |
| **Alter**     | 8     | Modify other players' actions: block, protect, change priority | Nope!, Shield, Priority Warp, Role Jam                                   |
| **Tamper**    | 7     | Modify the voting phase: silence, duplicate, kill votes        | Mute Vote, Vote Encore, Double Tap, Death Vote                           |
| **Settings**  | 1     | Change game settings at runtime                                | Time Warp (adjust discussion timer)                                      |
| **None**      | 1     | No power (placeholder for powerless characters)                | No Action                                                                |

### 3.5 How Characters Are Used in a Game

1. **Host selects a theme** — During lobby, the host picks a single theme. This populates the character toggle grid with all characters from that theme.
2. **Host selects characters** — The host sees a toggle grid of characters from the selected theme. They toggle on enough characters for all players + 3 NPCs.
3. **Validation** — Server checks: `selectedCharacters.length >= players.length + 3`. At least one character must have `team: "infiltrator"`. All must belong to the selected theme.
4. **Dealing** — When the game starts, server shuffles selected characters and deals them:
   - Each player gets one character (assigned to `player.character`).
   - The remaining 3 become **NPCs** (center cards). NPCs are virtual players with `isNPC: true`.
5. **Team assignment** — Each player's team is set from their character's `team` field (`innocent`, `infiltrator`, or `special`). Teams share a win condition and are used as references during the mayhem phase. This can change during mayhem via Swap powers.
6. **Single round** — The game is always a single round. No re-dealing. After results, host can reset to lobby.

### 3.6 NPC (Center Cards)

NPCs represent undealt characters sitting in the "center" or "vault":

- Created as `Player` objects with `isNPC: true` and a generated name (e.g., "NPC 1", "NPC 2", "NPC 3").
- They have character assignments and teams just like real players.
- Powers that target "Center" interact with NPCs.
- NPCs do not vote, acknowledge, or act — they are passive targets.
- Always exactly **3 NPCs** per game.
- The host can see NPC character names in the host panel during results (not during gameplay).

### 3.7 Character Data File

Characters are stored in a server-side JSON file (e.g., `data/characters.json`) as an array. The server provides a REST API (Section 1.2) and also exports a `getCharacters()` function for the socket handlers to read at game-start time.

### 3.8 Power Table Data Files

The 41 powers are fully specified in **Section 4** of this document. The implementing agent should:

1. Create the `InfiltrationPower` type and all 41 power constants as TypeScript files, grouped by category (Learn, Reveal, Swap, Condition, Alter, Tamper, Settings/None).
2. Create a barrel export (`INFILTRATION_POWERS`) combining all powers into a flat array.
3. Share the power constants between server and client (via a shared package, or by placing them where both can import).
4. Use `getPowerByIndex()` and `filterPowers()` helpers (shown in Section 3.3) for lookups and admin cascading dropdowns.

---

## 4. Power Table Reference

The complete **41-power table**. This is the single source of truth — implement these as TypeScript constants. Columns match the **PowerSlot fields** defined in Section 3.2 for each type, plus **Name** for identification and **Flags** for remaining runtime boolean properties that are `true` for that power. Boolean columns use ✓ for true and — for false. An asterisk (`*`) on a scope boolean means the power has `targetScopes` and the admin can override that value.

> **Note**: Indices are **not contiguous** (gaps at 2, 5, 14, 15, 18). These gaps exist because Player vs Center/NPC variants were consolidated into single powers via `targetScopes`.

### 4.1 Learn Powers (12 powers)

| Idx | Name             | Item    | Min | Max | fixedInit | Players | NPCs | Self | Role | doPower | Flags                 |
| --- | ---------------- | ------- | --- | --- | --------- | ------- | ---- | ---- | ---- | ------- | --------------------- |
| 1   | Role Peek        | Role    | 1   | 3   | —         | ✓\*     | —\*  | —    | —    | —       | infected, allowRandom |
| 3   | Last Look        | Role    | 1   | 1   | ✓         | —       | —    | ✓    | —    | —       | fixedAction, infected |
| 4   | Allegiance Check | Team    | 1   | 3   | —         | ✓\*     | —\*  | —    | —    | —       | infected, allowRandom |
| 6   | Roll Rolecall    | Players | 1   | 99  | —         | ✓       | ✓    | —    | ✓    | —       | —                     |
| 7   | Role Beacon      | Players | 99  | 99  | ✓         | ✓       | —    | —    | ✓    | —       | fixedAction, infected |
| 8   | Team Echo        | Players | 1   | 5   | —         | ✓       | —    | —    | —    | —       | fixedAction, infected |
| 9   | Action Trace     | Players | 1   | 99  | ✓         | ✓       | ✓    | —    | —    | —       | infected              |
| 10  | Action Log       | Players | 1   | 99  | ✓         | ✓       | —    | —    | —    | —       | infected              |
| 11  | Tactic Tell      | Type    | 1   | 3   | —         | ✓       | —    | —    | —    | —       | infected              |
| 12  | Role Tally       | Amount  | 1   | 99  | —         | ✓\*     | ✓\*  | —    | ✓    | —       | infected              |
| 13  | Team Tally       | Amount  | 1   | 3   | —         | ✓\*     | ✓\*  | —    | —    | —       | infected              |
| 16  | Sixth Sense      | Status  | 1   | 99  | —         | ✓       | —    | —    | —    | —       | infected              |

### 4.2 Reveal Powers (3 powers)

| Idx | Name           | Item | Min | Max | fixedInit | Players | NPCs | Self | doPower | Flags                |
| --- | -------------- | ---- | --- | --- | --------- | ------- | ---- | ---- | ------- | -------------------- |
| 17  | Expose Role    | Role | 1   | 3   | —         | ✓\*     | —\*  | —    | ✓       | infected, allowRandom|
| 19  | Face Reveal    | Role | 1   | 1   | —         | —       | —    | ✓    | —       | fixedAction, infected|
| 20  | Role Spotlight | Role | 1   | 5   | —         | ✓\*     | —\*  | —    | ✓       | allowRandom          |

### 4.3 Swap Powers (7 powers)

| Idx | Name           | Item      | Min | Max | Players | NPCs | Self | lookPost | doPower | Flags                |
| --- | -------------- | --------- | --- | --- | ------- | ---- | ---- | -------- | ------- | -------------------- |
| 21  | Role Swap      | Role      | 2   | 2   | ✓\*     | —\*  | —    | —        | —       | allowRandom          |
| 22  | Self Swap      | Role      | 1   | 1   | ✓\*     | —\*  | —    | ✓        | ✓       | allowRandom          |
| 23  | Swap Role Team | Role Team | 2   | 2   | ✓\*     | —\*  | —    | —        | —       | allowRandom          |
| 24  | Swap Reversal  | Role      | 1   | 5   | ✓       | —    | —    | —        | —       | fixedAction          |
| 25  | Team Exchange  | Team      | 1   | 1   | —\*     | —\*  | ✓    | ✓        | ✓       | allowRandom          |
| 26  | Recruit        | Team      | 1   | 1   | —\*     | —\*  | ✓    | —        | —       | allowRandom          |
| 27  | Team Shuffle   | Team      | 2   | 2   | ✓\*     | —\*  | —    | —        | —       | allowRandom          |

### 4.4 Condition Powers (2 powers)

| Idx | Name      | Item | Where | Min | Max |
| --- | --------- | ---- | ----- | --- | --- |
| 28  | Deathwish | Win  | Self  | 0   | 0   |
| 29  | Oracle    | Win  | Vote  | 0   | 0   |

### 4.5 Alter Powers (8 powers)

| Idx | Name          | Item       | Min | Max | Players | NPCs | Role | Flags                |
| --- | ------------- | ---------- | --- | --- | ------- | ---- | ---- | -------------------- |
| 30  | Nope!         | Block      | 1   | 5   | ✓       | —    | —    | allowRandom          |
| 31  | Role Jam      | Block      | 1   | 5   | ✓       | —    | ✓    | —                    |
| 32  | Priority Warp | Initiative | 1   | 5   | ✓       | —    | —    | allowRandom          |
| 33  | Order Rewrite | Initiative | 1   | 5   | ✓       | —    | ✓    | —                    |
| 34  | Hard Priority | Initiative | 1   | 5   | ✓       | —    | —    | allowRandom          |
| 35  | Order Rule    | Initiative | 1   | 5   | ✓       | —    | ✓    | —                    |
| 36  | Shield        | Protect    | 1   | 5   | ✓       | —    | —    | allowRandom          |
| 37  | Guard         | Protect    | 1   | 5   | ✓       | —    | ✓    | —                    |

### 4.6 Tamper Powers (7 powers)

| Idx | Name        | Item      | Min | Max | Players | Self | Role | Flags       |
| --- | ----------- | --------- | --- | --- | ------- | ---- | ---- | ----------- |
| 38  | Mute Vote   | Silence   | 1   | 5   | ✓       | —    | —    | allowRandom |
| 39  | Vote Jam    | Silence   | 1   | 5   | —       | —    | ✓    | —           |
| 40  | Vote Encore | Duplicate | 0   | 0   | ✓       | —    | —    | fixedAction |
| 41  | Vote Echo   | Duplicate | 0   | 0   | —       | —    | ✓    | fixedAction |
| 42  | Double Tap  | Duplicate | 0   | 0   | —       | ✓    | —    | fixedAction |
| 43  | Death Vote  | Kill      | 1   | 1   | ✓       | —    | —    | fixedAction |
| 44  | Last Laugh  | Destruct  | 1   | 1   | ✓       | —    | —    | fixedAction |

### 4.7 Settings & None (2 powers)

| Idx | Name      | Item     | Min | Max | Flags       |
| --- | --------- | -------- | --- | --- | ----------- |
| 45  | Time Warp | Time     | 0   | 300 | fixedAction |
| 46  | No Action | NoAction | 0   | 0   | fixedAction |

### 4.8 Initiative Ordering Rules

Initiative determines when a power executes during the mayhem phase. Lower numbers execute first.

| Initiative | Phase                                   | Powers                                                   |
| ---------- | --------------------------------------- | -------------------------------------------------------- |
| 0          | Voting/passive (not during mayhem)      | Conditions, Tamper, Settings, No Action                  |
| 1          | Earliest mayhem — hard priority setting | Hard Priority, Order Rule                                |
| 2          | Early mayhem — priority alteration      | Priority Warp, Order Rewrite                             |
| 3          | Early-mid mayhem — protection           | Shield, Guard                                            |
| 4          | Mid mayhem — blocking                   | Nope!, Role Jam                                          |
| 5          | Pre-action reveal                       | Expose Role, Face Reveal, Role Spotlight (early timing)  |
| 10         | Pre-swap learn                          | All Learn powers (early timing)                          |
| 50         | Swap phase                              | All Swap powers                                          |
| 60         | Post-swap reversal                      | Swap Reversal                                            |
| 90         | Post-swap learn                         | All Learn powers (late timing), Action Trace, Action Log |
| 95         | Post-action reveal                      | Reveal powers (late timing)                              |

Powers with two initiative values (e.g., `"10 90"`) can execute at either the lower or higher value. Execution order configuration is handled separately from the power slot.

### 4.9 Complexity Ratings

| Rating | Meaning                                             | Examples                                                             |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------- |
| 1      | Simple — no targeting, no lookups                   | No Action, Face Reveal, Deathwish, Double Tap, Vote Encore           |
| 2      | Medium — target selection or mid-level interaction  | Role Peek, Shield, Nope!, Role Swap, Mute Vote, Time Warp            |
| 3      | High — lookup-heavy, mass effects, timing-sensitive | Roll Rolecall, Action Trace, Role Jam, Swap Reversal, Role Spotlight |

---

## 5. Power Compatibility & Meshing Rules

When a character has multiple power slots, not all combinations are valid. The system must validate compatibility both in the admin character creation UI (client-side warnings) and on the server (reject on save).

> **⚠ Implementation note**: The five meshing flags below (`murderer`, `predicter`, `twoXVote`, `silencer`, `suicidal`) are **not included** in the base `InfiltrationPower` type defined in Section 3.3. To implement meshing validation, **extend** the `InfiltrationPower` type with these fields as optional booleans and populate them on the relevant powers, OR compute them from the power's `type`/`item`/`where` fields at validation time. The recommended approach is to add them to the type.

### 5.1 Compatibility Flags

Five boolean flags define meshing constraints. **Add these to the `InfiltrationPower` type (Section 3.3):**

Add five optional boolean flags to the InfiltrationPower type. All default to false when omitted. Their meanings are described in the table below.

| Flag        | Meaning                                            | Game Mechanic                          |
| ----------- | -------------------------------------------------- | -------------------------------------- |
| `murderer`  | Player's vote also eliminates the target           | Secondary elimination on vote          |
| `predicter` | Player wins if their vote target is an infiltrator | Alternate win condition on vote        |
| `twoXVote`  | Player's vote counts as two                        | Double voting weight                   |
| `silencer`  | Player can silence another's vote                  | Silenced vote removed from tally       |
| `suicidal`  | Player wins if they are voted out                  | Alternate win condition on elimination |

### 5.2 Core Meshing Rule: Murderer / Predicter / TwoXVote vs. Post-Swap Learn/Reveal

Powers flagged `murderer`, `predicter`, or `twoXVote` **cannot coexist** with any Learn or Reveal power that has `timing: "after"` (post-swap). The reasoning: these flags affect voting outcomes, and post-swap Learn/Reveal gives information that would make the combination overpowered.

In other words: if one power has any of murderer, predicter, or twoXVote set to true, and the other power is a Learn or Reveal with fixedInitiative false (i.e. post-swap), the pair is **incompatible**.

Same check applies in reverse (power2 has the flag, power1 is post-swap Learn/Reveal).

**Pre-swap Learn/Reveal is fine** — `timing: "before"` does not conflict with these flags.

### 5.3 Silencer Rules

Currently defined as **TBD** — implement the flag check infrastructure but allow all silencer combinations for now. When rules are finalized, the validation function just needs an additional clause.

### 5.4 Suicidal Rules

Currently defined as **TBD** — same approach. Allow all suicidal combinations. The flag exists and is tracked, but no rejection logic yet.

### 5.5 Non-Constraint Flags

These are game mechanic flags defined on `InfiltrationPower` (Section 3.3) — they do **NOT** restrict which powers can coexist:

| Flag              | Purpose                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `infected`        | Triggers infection mechanic when a role is seen (Learn/Reveal). Not a compatibility constraint. |
| `vault`           | Power can target center/NPC cards. Just a behavior toggle.                                      |
| `lookPostAction`  | Player sees their new role after a self-swap. Behavioral.                                       |
| `doPower`         | Player can execute new role's power after seeing it. Behavioral.                                |
| `fixedAction`     | Power auto-executes with no target choice. Behavioral.                                          |
| `fixedInitiative` | Initiative can't be altered by other powers. Behavioral.                                        |
| `allowRandom`     | Random target selection is valid. Behavioral.                                                   |
| `targetScopes`    | When present, power can target Players, NPCs, or both. Behavioral / scope selection.            |

### 5.6 Validation Functions

Implement these utilities (shared or server-side):

Implement three utilities:

1. **canMeshPowers(power1, power2)** — takes two powers and returns an object with a boolean `valid` and an optional `reason` string. Check every pair-wise combination of the meshing rules described in Sections 5.2–5.5 (murderer, predicter, and twoXVote cannot coexist with a post-swap Learn or Reveal). A post-swap Learn/Reveal is one whose fixedInitiative is false. Silencer and suicidal are allowed for now (TBD). The check must be symmetric (test both directions).

2. **isPostSwapLearnReveal(power)** — returns true when the power's type is Learn or Reveal and its fixedInitiative is false.

3. **validateCharacterPowers(slots)** — takes the array of PowerSlot objects from a character, resolves each non-null powerIndex to its power record, then runs canMeshPowers on every distinct pair. Returns an object with a boolean `valid` and an array of `errors` strings (one per incompatible pair found).

### 5.7 Where Validation Runs

| Location              | When                                                    | Action on Failure                                                             |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Admin UI (client)** | On every power slot change                              | Show warning banner with incompatibility reason. Allow save but with warning. |
| **Server REST API**   | On `POST /api/characters` and `PUT /api/characters/:id` | Return `400` with error messages. Reject save.                                |
| **Game start**        | When host starts game with selected characters          | Emit `error:invalid` if any selected character has invalid power combos.      |

### 5.8 Character Complexity Calculation

Implement a **getCharacterComplexity** helper that takes a character's PowerSlot array, filters out null slots, looks up each power's complexity rating, and returns the sum. The maximum theoretical value is 9 (three slots each with complexity 3).

Display in the admin UI next to each character. Max theoretical = 9 (three complexity-3 powers). Use for informational purposes — no hard limit enforced yet.

---

## 6. Infiltration Game — Rules & Flow

Infiltration is a **single-round social deduction game**. Players are secretly assigned characters with teams (innocent, infiltrator, or special) and powers. Teams share a win condition and are used as references during the mayhem phase. The **special** team indicates a player with their own individual win condition, separate from both innocent and infiltrator teams. After a mayhem phase where powers are used, players vote on who they think is the infiltrator. The game is always one round — after results, the host can reset to lobby.

### 6.1 Game Phases

| Phase       | Duration                         | Description                                                  |
| ----------- | -------------------------------- | ------------------------------------------------------------ |
| **lobby**   | Indefinite                       | Host selects characters, players join and ready up           |
| **reveal**  | Until all players acknowledge    | Characters dealt, each player privately sees their character |
| **mayhem**  | Until all players acknowledge    | Players use their character powers on targets                |
| **voting**  | Configurable timer (default 30s) | Players vote for suspected infiltrator or "No Infiltrator"   |
| **results** | View-only, host advances         | Votes tallied, winner announced, all roles shown             |

### 6.2 Phase Details

#### Lobby

- Host has already selected Infiltration from the game selector.
- Host first **selects a theme** from a theme picker. This populates the character toggle grid with characters from the selected theme.
- Host sees a **character toggle grid** — all characters from the selected theme. Host toggles on/off which characters to include.
- Host configures: voting timer duration, max players.
- Players join, pick avatars, ready up.
- Host can start when:
  - All players are ready.
  - `selectedCharacters.length >= players.length + 3` (enough for players + 3 NPCs).
  - At least one selected character has `team: "infiltrator"`.
  - All selected characters belong to the selected theme.

#### Reveal Phase

1. Server shuffles the selected characters.
2. Deals one character to each player → sets `player.character` and `player.team` (`innocent`, `infiltrator`, or `special`).
3. Remaining characters (exactly 3) become NPCs → created as `Player` objects with `isNPC: true`.
4. Server emits `player:character` privately to each player with their assigned character (name, description, team, powers).
5. Each player sees their character card on their device and taps **"Acknowledge"**.
6. Player sends `player:ackCharacter` → server sets `player.characterAcknowledged = true`.
7. Phase advances to mayhem when **all** players have acknowledged (no timer — wait for everyone).
8. Host screen shows which players have acknowledged (checkmarks).

#### Mayhem Phase

1. Server determines which players have actionable powers (type ≠ `None`, type ≠ `Condition`).
2. For each player with an actionable power, server sends `power:prompt` privately with:
   - Power name and description
   - Valid targets (filtered: exclude revealed players, protected players, self where applicable)
   - Target type (Player, Center/NPC, Role, Self)
   - Amount (how many targets to select)
3. Player selects target(s) via button-based UI and submits `power:submit` with `{ targets: string[] }`.
4. Server executes powers in **initiative order** (Section 4.8):
   - Priority setting (1) → Priority alteration (2) → Protection (3) → Blocking (4) → Reveal-before (5) → Learn-before (10) → Swap (50) → Swap Reversal (60) → Learn-after (90) → Reveal-after (95)
5. Players with `fixedAction` powers or `None` powers just tap **"Acknowledge"** (no target selection needed).
6. After acting, player sends `player:ackMayhem` → server sets `player.mayhemAcknowledged = true`.
7. Phase advances to voting when **all** players have acknowledged mayhem.
8. Power results are sent privately via `power:result` to the acting player only. Public reveals go to all via `room:state`.

#### Voting Phase

1. Server starts a timer (configurable, default 30 seconds).
2. Each player sees a list of all other players (not self) plus a **"No Infiltrator"** option (themed label from theme data).
3. Player taps a name to vote → sends `game:submit` with `{ value: targetSocketId | "no_infiltrator" }`.
4. A player can only vote once — second vote attempts are rejected.
5. **Votes not submitted before timer expires are not counted** (they just don't exist).
6. Phase can end early if **all** players have voted before the timer expires.
7. Tamper powers take effect during vote tallying:
   - **Silenced** players' votes are removed from the tally.
   - **Duplicate** powers add extra copies of a vote.
   - **Death Vote**: if the voter's target gets most votes, the Death Vote target is also eliminated.
   - **2x Vote**: voter's vote counts as two.

#### Results Phase

1. Server tallies votes (after applying tamper effects).
2. Determines the most-voted player (ties broken by earliest vote timestamp).
3. Determines winner:
   - **Innocents win** if the most-voted player is on the infiltrator team.
   - **Infiltrators win** if "No Infiltrator" got the most votes, OR the most-voted player is on the innocent team.
   - **Special team**: Players on the `special` team have their own individual win conditions (defined by their Condition powers, e.g., Deathwish, Oracle). They do not win with innocents or infiltrators — they win or lose independently.
   - **No winner** if no votes were cast.
4. Check condition powers (applies to any team, but especially relevant for `special`):
   - **Deathwish**: If the most-voted player has the Deathwish condition, that player wins individually (regardless of team outcome).
   - **Oracle**: If a player with Oracle voted for someone who is actually an infiltrator, that player wins individually.
5. Server reveals all characters and teams to all players.
6. Server emits full results via `room:state` including: vote tallies, winner, all player characters/teams, condition power outcomes.
7. Host sees a results panel. No timer — host manually resets to lobby when ready.

### 6.3 Win Conditions Summary

| Condition                              | Who Wins                 | When                                                       |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------- |
| Most-voted player is infiltrator       | Innocent team            | Normal vote outcome                                        |
| Most-voted player is innocent          | Infiltrator team         | Innocents guessed wrong                                    |
| "No Infiltrator" gets most votes       | Infiltrator team         | Group failed to identify                                   |
| No votes cast                          | No winner                | Stalemate                                                  |
| Special team player meets condition    | That player (individual) | Special team wins/loses independently via Condition powers |
| Deathwish player is most-voted         | That player (individual) | Overrides team outcome for that player                     |
| Oracle player voted for an infiltrator | That player (individual) | Additional individual win alongside team outcome           |

### 6.4 Infection Mechanic

When a Learn or Reveal power causes a player to **see** an infiltrator's role (via Role Peek, Expose Role, etc.), the infection mechanic can trigger:

1. Check if the power has `infected: true` in the power table.
2. Check if the target character has `infectedUponSight: true` in the character data.
3. If **both** are true, the acting player's team flips to `infiltrator` (regardless of whether they were `innocent` or `special`).
4. The player is notified privately that their allegiance has changed.
5. Their win condition now aligns with the infiltrator team (any previous special win condition is lost).

**Exception**: `Roll Rolecall` (index 6) has `infected: false` — it reveals player counts by role, not actual identities, so it cannot trigger infection.

**Timing**: Infection occurs immediately when the power resolves during mayhem, not at end of phase.

### 6.5 Player Limits (Infiltration-Specific)

| Constraint                 | Value                     |
| -------------------------- | ------------------------- |
| Minimum players            | 3                         |
| Maximum players            | 8                         |
| NPCs per game              | Always exactly 3          |
| Min selected characters    | `players + 3`             |
| Min infiltrator characters | At least 1 among selected |

### 6.6 Host Settings (Infiltration)

An **InfiltrationSettings** object has the following fields:

- **selectedTheme** (string) — the single theme ID chosen by the host, which populates the character selection grid.
- **selectedCharacters** (array of numbers) — character IDs the host has toggled on for this game.
- **votingTimerMs** (number) — voting phase duration in milliseconds; default is 30 000.

The host configures these during lobby: first selecting a theme, then toggling characters from that theme, and adjusting the timer slider. Settings are sent to the server via `game:setInfiltrationOptions`.
