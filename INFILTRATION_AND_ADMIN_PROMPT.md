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

### 1.2 Characters Tab

A full character creation and management UI. Characters are persisted to a JSON file on the server via a REST API.

#### REST API — Characters

| Method   | Endpoint              | Description                                    |
| -------- | --------------------- | ---------------------------------------------- |
| `GET`    | `/api/characters`     | List all saved characters                      |
| `POST`   | `/api/characters`     | Create a new character (body = character data) |
| `PUT`    | `/api/characters/:id` | Update an existing character                   |
| `DELETE` | `/api/characters/:id` | Delete a character                             |

Server persists to `apps/server/data/characters.json`. Each entry:

```json
{
  "id": 1771889203340,
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
        "amount": 1,
        "timing": "before",
        "canTargetPlayers": true,
        "canTargetNPCs": false
      }
    ]
  },
  "createdAt": "2026-02-23T23:26:43.340Z",
  "updatedAt": "2026-02-23T23:26:43.340Z"
}
```

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

Each power slot uses a series of dependent dropdowns that narrow down to a specific power from the 46-power table:

1. **Type** — `Learn`, `Reveal`, `Swap`, `Condition`, `Alter`, `Tamper`, `Settings`, `None`
2. **Item** — Filters based on Type (e.g., for Learn: `Role`, `Team`, `Players`, `Amount`, `Status`, `Type`)
3. **Disambiguation** — If multiple powers match the Type+Item combo, show a dropdown of matching power names
4. **Amount** — Number input clamped to the power's Min/Max range (omitted for Settings / None)
5. **Timing** — `before` or `after` (only for Learn / Reveal powers)
6. **Target Scope** — Two toggles: `canTargetPlayers`, `canTargetNPCs` (only for types that have `TargetScopeFields`: Learn, Reveal, Swap, Alter)
7. **Modifiers** — Checkboxes for type-specific flags: `lookPostAction` (Swap), `doPower` (Reveal, Swap)

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

Server persists to `apps/server/data/themes.json`.

#### Theme Data Structure

```typescript
interface GameTheme {
  id: number;
  name: string;
  description: string;
  teamTerms: {
    infiltratorSingular: string; // e.g. "Spy", "Thief"
    infiltratorPlural: string;
    innocentSingular: string; // e.g. "Employee", "Guard"
    innocentPlural: string;
  };
  phaseText: {
    revealPrompt: string; // Shown during reveal phase
    mayhemPrompt: string; // Shown during mayhem phase
    votingPrompt: string; // Shown during voting phase
    noInfiltratorOption: string; // Label for "no infiltrator" vote option
  };
  phaseNames: {
    reveal: string; // e.g. "Briefing"
    mayhem: string; // e.g. "Heist"
    voting: string; // e.g. "Accusation"
  };
  characterTerms: {
    npcSingular: string; // e.g. "Safe", "Treasure"
    npcPlural: string;
  };
  playerTerms: {
    playerOuted: string; // e.g. "{role} exposed!" — use {role} placeholder
    infiltratorWinText: string;
    innocentsWinText: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

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

| Hardcoded Default            | Theme Field                      | Example (Aliens)                                        |
| ---------------------------- | -------------------------------- | ------------------------------------------------------ |
| "Infiltrator"                | `teamTerms.infiltratorSingular`  | "Alien"                                                |
| "Infiltrators"               | `teamTerms.infiltratorPlural`    | "Aliens"                                              |
| "Innocent"                   | `teamTerms.innocentSingular`     | "Crew"                                                |
| "Innocents"                  | `teamTerms.innocentPlural`       | "Crew"                                               |

| "NPC"                        | `characterTerms.npcSingular`     | "Treasure"                                             |
| "NPCs"                       | `characterTerms.npcPlural`       | "Treasures"                                            |
| "Reveal" phase name          | `phaseNames.reveal`              | "Briefing"                                             |
| "Mayhem" phase name          | `phaseNames.mayhem`              | "Heist"                                                |
| "Voting" phase name          | `phaseNames.voting`              | "Accusation"                                           |
| Reveal phase prompt          | `phaseText.revealPrompt`         | "Your position in this heist has been revealed!"       |
| Mayhem phase prompt          | `phaseText.mayhemPrompt`         | "Let the heist begin! Execute your specialized moves." |
| Voting phase prompt          | `phaseText.votingPrompt`         | "Time to expose the thief! Who do you suspect?"        |
| "No Infiltrator" vote option | `phaseText.noInfiltratorOption`  | "No thief was recruited for this job!"                 |
| Win text (infiltrators)      | `playerTerms.infiltratorWinText` | "Thieves made off with the goods!"                     |
| Win text (innocents)         | `playerTerms.innocentsWinText`   | "Thieves captured!"                                    |
| Player outed text            | `playerTerms.playerOuted`        | "{role} compromised!"                                  |

### 2.3 Theme in the State Model

When the game starts, the server resolves the active theme and attaches it to the game state so clients can render it:

```typescript
// Inside GameState.gameData for infiltration
{
  theme: GameTheme; // Full resolved theme object
  // ... other infiltration game data
}
```

The client reads `room.game.gameData.theme` and passes it to all Infiltration UI components. **No component should hardcode "Infiltrator" / "Innocent" / "Mayhem" etc.** — always read from theme. The `special` team has no theme overrides; when a special player wins, display their **character name** (e.g., *"The Oracle achieved their win condition!"*).

### 2.4 Theme Utility Helper

Create a shared utility for resolving themed text:

```typescript
// packages/shared/src/utils/themeText.ts (or apps/web/src/utils/themeText.ts)

function getTeamLabel(
  theme: GameTheme,
  team: "innocent" | "infiltrator" | "special",
  plural = false,
): string {
  if (team === "infiltrator") {
    return plural
      ? theme.teamTerms.infiltratorPlural
      : theme.teamTerms.infiltratorSingular;
  }
  // "special" has no theme override — use the literal word or the character name at display time
  if (team === "special") return plural ? "Specials" : "Special";
  return plural
    ? theme.teamTerms.innocentPlural
    : theme.teamTerms.innocentSingular;
}

function getPhaseName(
  theme: GameTheme,
  phase: "reveal" | "mayhem" | "voting",
): string {
  return theme.phaseNames[phase];
}

function getPhasePrompt(
  theme: GameTheme,
  phase: "reveal" | "mayhem" | "voting",
): string {
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
- During lobby, the host selects a theme first. The character grid only shows characters from the selected theme, preventing mismatched selections.
- The server still validates at game-start that all selected characters belong to the selected theme. If violated, emit `error:invalid` with message `"All characters must belong to the selected theme"`.

---

## 3. Character & Power System

Infiltration uses a **character-based power system** — there are no hardcoded roles like "Spy" or "Seer". Instead, an admin creates characters in the admin panel, each with 1–3 power slots selected from a table of **41 powers**. The host then picks which characters to use for a given game session.

### 3.1 Character Data Model

```typescript
interface Character {
  id: number; // Unique numeric ID (e.g., Date.now() at creation)
  name: string; // Display name (e.g., "Pilot", "Engineer")
  data: {
    name: string; // Same as top-level name
    description: string; // Flavor text shown to players
    team: "innocent" | "infiltrator" | "special";
    theme: string; // Theme ID this character belongs to
    infectedUponSight: boolean; // Can learning this character trigger infection?
    powerSlots: PowerSlot[]; // 1–3 power slots
  };
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Power Slot Data Model

Each power slot references a power from the 41-power table by index, plus configuration. The type is a **discriminated union** keyed on the power `type` field — each variant carries only the fields relevant to that power category.

```typescript
/** Shared base for all power slot variants */
interface PowerSlotBase {
  powerIndex: number; // Index into the power table (see INFILTRATION_POWERS)
  item: string; // What the power acts on: Role, Team, Players, Block, etc.
}

/** Target scope — replaces the old `where` string with explicit booleans */
interface TargetScopeFields {
  canTargetPlayers: boolean; // Power can target player cards
  canTargetNPCs: boolean; // Power can target center/NPC cards
}

/** Learn powers: see a role/team/status before or after swaps */
interface LearnPowerSlot extends PowerSlotBase, TargetScopeFields {
  type: "Learn";
  amount: number; // How many targets (clamped to power's Min–Max)
  timing: "before" | "after"; // Execute before or after the Swap phase
}

/** Reveal powers: publicly announce information */
interface RevealPowerSlot extends PowerSlotBase, TargetScopeFields {
  type: "Reveal";
  amount: number;
  timing: "before" | "after";
  doPower: boolean; // Can execute new role's power after seeing it
}

/** Swap powers: exchange roles between targets */
interface SwapPowerSlot extends PowerSlotBase, TargetScopeFields {
  type: "Swap";
  amount: number;
  lookPostAction: boolean; // Can see own new role after swap
  doPower: boolean; // Can execute new role's power after swap
}

/** Condition powers: apply a conditional effect */
interface ConditionPowerSlot extends PowerSlotBase {
  type: "Condition";
  amount: number;
}

/** Alter powers: modify role, team, or vote properties */
interface AlterPowerSlot extends PowerSlotBase, TargetScopeFields {
  type: "Alter";
  amount: number;
}

/** Tamper powers: interfere with voting */
interface TamperPowerSlot extends PowerSlotBase {
  type: "Tamper";
  amount: number;
}

/** Settings powers: change game settings (room-wide, no targets) */
interface SettingsPowerSlot extends PowerSlotBase {
  type: "Settings";
}

/** None powers: no action (placeholder) */
interface NonePowerSlot extends PowerSlotBase {
  type: "None";
}

type PowerSlot =
  | LearnPowerSlot
  | RevealPowerSlot
  | SwapPowerSlot
  | ConditionPowerSlot
  | AlterPowerSlot
  | TamperPowerSlot
  | SettingsPowerSlot
  | NonePowerSlot;
```

**Why a discriminated union?**

- `Learn` and `Reveal` need `timing`; `Swap` does not.
- `Swap` and `Reveal` need `lookPostAction` / `doPower`; `Alter` does not.
- `Settings` and `None` have no targets, amounts, or scope — no extra fields.
- `Condition` and `Tamper` target players implicitly (no NPC interaction) — no scope fields.
- The admin form switches sub-forms based on `type`, so the union maps cleanly to the UI.

**Mapping `canTargetPlayers` / `canTargetNPCs` from the existing power table:**

| Old `where` value | `canTargetPlayers` | `canTargetNPCs` |
| ------------------ | ------------------ | --------------- |
| `"Player"`         | `true`             | `false`         |
| `"Center"`         | `false`            | `true`          |
| `"Self"`           | `true`             | `false`         |
| `"Role"`           | `true`             | `true`          |
| `"Type"`           | `true`             | `true`          |
| `"Reversal"`       | `true`             | `false`         |

When a power has `targetScopes` in the TS constants (e.g., `["Players Only", "NPC Only", "Players and NPC"]`), the admin form shows a toggle for each scope and the host can pick. The booleans above are the defaults.

### 3.3 The 41-Power Table (Existing TypeScript Constants)

Powers are **already defined** in the codebase as TypeScript constants in:

```
apps/web/src/constants/infiltrationPowers/
  types.ts          ← InfiltrationPower type & TargetScope type
  learn.ts          ← LEARN_POWERS (12 powers, indices 1,3,4,6–13,16)
  reveal.ts         ← REVEAL_POWERS (3 powers, indices 17,19,20)
  swap.ts           ← SWAP_POWERS (7 powers, indices 21–27)
  condition.ts      ← CONDITION_POWERS (2 powers, indices 28–29)
  alter.ts          ← ALTER_POWERS (8 powers, indices 30–37)
  tamper.ts         ← TAMPER_POWERS (7 powers, indices 38–44)
  settingsNone.ts   ← SETTINGS_NONE_POWERS (2 powers, indices 45–46)
  index.ts          ← barrel export: INFILTRATION_POWERS (all 41 combined)
```

The `InfiltrationPower` type (from `types.ts`) defines each power:

```typescript
export type TargetScope = "Players Only" | "NPC Only" | "Players and NPC";

export type InfiltrationPower = {
  index: number; // Unique power ID (non-contiguous: 1–46, with gaps)
  initiative: string; // Execution priority. Space-separated (e.g., "10 90"). Lower = earlier.
  powerName: string; // Display name
  description: string; // Human-readable description, # = placeholder for amount
  type: string; // Learn | Reveal | Swap | Condition | Alter | Tamper | Settings | None
  item: string; // What the power acts on (Role, Team, Block, Win, Silence, etc.)
  where: string; // Target type (Player, Self, Role, Type, Reversal, etc.)
  min: number; // Minimum targets/amount
  max: number; // Maximum targets/amount
  fixedAction: boolean; // Power auto-executes with no target choice
  fixedInitiative: boolean; // Initiative cannot be altered by other powers
  infected: boolean; // Can trigger infiltrator infection mechanic
  lookPostAction: boolean; // Player sees their new role after a swap changes it
  doPower: boolean; // Player can execute new role's power after seeing it
  allowRandom: boolean; // Random target selection is valid
  vault: boolean; // Power can interact with center/NPC cards
  vaultName?: string; // Optional vault display name
  complexity: number; // 1–3 complexity rating
  targetScopes?: TargetScope[]; // When present, power can target Players, NPCs, or both
};
```

> **Design note — targetScopes consolidation**: The original CSV had 46 powers with separate entries for "Player" vs "Center/Vault" variants (e.g., Role Peek vs Vault Peek). The TS constants **consolidated** these into 41 powers by using `targetScopes`. When a power has `targetScopes`, the admin character creation UI should present a dropdown to choose the scope ("Players Only", "NPC Only", or "Players and NPC"). This scope is saved on the `PowerSlot` and determines valid targets at runtime.

Import the power table on the server side by copying or re-exporting from the web constants. Provide helpers:

```typescript
import { INFILTRATION_POWERS } from "./infiltrationPowers";

function getPowerByIndex(index: number): InfiltrationPower | undefined {
  return INFILTRATION_POWERS.find((p) => p.index === index);
}

function filterPowers(
  type?: string,
  item?: string,
  where?: string,
): InfiltrationPower[] {
  return INFILTRATION_POWERS.filter(
    (p) =>
      (!type || p.type === type) &&
      (!item || p.item === item) &&
      (!where || p.where === where),
  );
}
```

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

Characters are stored in `apps/server/data/characters.json` as an array. The server provides a REST API (Section 1.2) and also exports a `getCharacters()` function for the socket handlers to read at game-start time.

### 3.8 Power Table Data Files

The 41 powers **already exist** as TypeScript constants at:

```
apps/web/src/constants/infiltrationPowers/   ← canonical source
```

For the server, either:

- **Re-export** from a shared package (`packages/shared`), or
- **Copy** the constants into `apps/server/src/data/infiltrationPowers/` and keep in sync.

The barrel export `INFILTRATION_POWERS` from `index.ts` gives a flat array of all 41 powers. Use `getPowerByIndex()` and `filterPowers()` helpers (shown in Section 3.3) for lookups and admin cascading dropdowns.

---

## 4. Power Table Reference

The complete **41-power table**, matching the TypeScript constants in `apps/web/src/constants/infiltrationPowers/`. This is the single source of truth. The `#` in descriptions is a placeholder for the configured amount. The **Flags** column lists only fields that are `true` for that power. The **Scopes** column shows `targetScopes` values when present (P = Players Only, N = NPC Only, B = Players and NPC).

> **Note**: Indices are **not contiguous** (gaps at 2, 5, 14, 15, 18). These were vault/center variants in the original CSV that have been consolidated via `targetScopes` on the base power.

### 4.1 Learn Powers (12 powers)

| Idx | Init  | Name             | Description                       | Item    | Where       | Min | Max | Flags (true only)                      | Scopes |
| --- | ----- | ---------------- | --------------------------------- | ------- | ----------- | --- | --- | -------------------------------------- | ------ |
| 1   | 10 90 | Role Peek        | Learn # Player's Roles            | Role    | Player      | 1   | 3   | infected, allowRandom                  | P/N/B  |
| 3   | 10    | Last Look        | Learn Final Role                  | Role    | Self        | 1   | 1   | fixedAction, fixedInitiative, infected | —      |
| 4   | 10 90 | Allegiance Check | Learn # Player's Teams            | Team    | Player      | 1   | 3   | infected, allowRandom                  | P/N/B  |
| 6   | 10 90 | Roll Rolecall    | Learn # Players With Role         | Players | Role        | 1   | 99  | —                                      | —      |
| 7   | 10    | Role Beacon      | Learn All Players With Same Role  | Players | Same Role   | 99  | 99  | fixedAction, fixedInitiative, infected | —      |
| 8   | 10 90 | Team Echo        | Learn # Players With Same Team    | Players | Same Team   | 1   | 5   | fixedAction, infected                  | —      |
| 9   | 90    | Action Trace     | Learn # Players Did Action Type   | Players | Type        | 1   | 99  | fixedInitiative, infected              | —      |
| 10  | 90    | Action Log       | Learn # Players Who Moved/Learned | Players | Action      | 1   | 99  | fixedInitiative, infected              | —      |
| 11  | 10 90 | Tactic Tell      | Learn # Player Action Type        | Type    | Player      | 1   | 3   | infected                               | —      |
| 12  | 10 90 | Role Tally       | Learn up to # of a Role           | Amount  | Role        | 1   | 99  | infected                               | P/N/B  |
| 13  | 10 90 | Team Tally       | Learn up to # of a Team           | Amount  | Association | 1   | 3   | infected                               | P/N/B  |
| 16  | 90    | Sixth Sense      | Learn if # Players Were Moved     | Status  | Player      | 1   | 99  | infected                               | —      |

### 4.2 Reveal Powers (3 powers)

| Idx | Init | Name           | Description        | Item | Where  | Min | Max | Flags (true only)              | Scopes |
| --- | ---- | -------------- | ------------------ | ---- | ------ | --- | --- | ------------------------------ | ------ |
| 17  | 5 95 | Expose Role    | Reveal # Roles     | Role | Player | 1   | 3   | infected, doPower, allowRandom | P/N/B  |
| 19  | 5 95 | Face Reveal    | Reveal self        | Role | Self   | 1   | 1   | fixedAction, infected          | —      |
| 20  | 5 95 | Role Spotlight | Reveal # innocents | Role | Player | 1   | 5   | doPower, allowRandom           | P/N/B  |

### 4.3 Swap Powers (7 powers)

| Idx | Init | Name           | Description                     | Item      | Where         | Min | Max | Flags (true only)                                     | Scopes |
| --- | ---- | -------------- | ------------------------------- | --------- | ------------- | --- | --- | ----------------------------------------------------- | ------ |
| 21  | 50   | Role Swap      | Swap Two Roles                  | Role      | Player        | 2   | 2   | fixedInitiative, allowRandom                          | P/N/B  |
| 22  | 50   | Self Swap      | Swap A Role With Own Role       | Role      | Player        | 1   | 1   | fixedInitiative, lookPostAction, doPower, allowRandom | P/N/B  |
| 23  | 50   | Swap Role Team | Swap A Role and Team            | Role Team | Player        | 2   | 2   | fixedInitiative, allowRandom                          | P/N/B  |
| 24  | 60   | Swap Reversal  | Swap # Swaps of Roles           | Role      | Reversal      | 1   | 5   | fixedAction, fixedInitiative                          | —      |
| 25  | 50   | Team Exchange  | Swap Own Team With Another      | Team      | Self          | 1   | 1   | fixedInitiative, lookPostAction, doPower, allowRandom | P/N/B  |
| 26  | 50   | Recruit        | Swap another's Team to your own | Team      | Self          | 1   | 1   | fixedInitiative, allowRandom                          | P/N/B  |
| 27  | 50   | Team Shuffle   | Swap Two Teams                  | Team      | Player Player | 2   | 2   | fixedInitiative, allowRandom                          | P/N/B  |

### 4.4 Condition Powers (2 powers)

| Idx | Init | Name      | Description                 | Item | Where | Min | Max | Flags (true only) |
| --- | ---- | --------- | --------------------------- | ---- | ----- | --- | --- | ----------------- |
| 28  | 0    | Deathwish | Wins If Voted Out           | Win  | Self  | 0   | 0   | fixedInitiative   |
| 29  | 0    | Oracle    | Wins If Vote Is Infiltrator | Win  | Vote  | 0   | 0   | fixedInitiative   |

### 4.5 Alter Powers (8 powers)

| Idx | Init | Name          | Description                        | Item       | Where  | Min | Max | Flags (true only)            |
| --- | ---- | ------------- | ---------------------------------- | ---------- | ------ | --- | --- | ---------------------------- |
| 30  | 4    | Nope!         | Block # Player From Doing Actions  | Block      | Player | 1   | 5   | fixedInitiative, allowRandom |
| 31  | 4    | Role Jam      | Block # Role From Doing Actions    | Block      | Role   | 1   | 5   | fixedInitiative              |
| 32  | 2    | Priority Warp | Alter # Players Action \* Priority | Initiative | Player | 1   | 5   | fixedInitiative, allowRandom |
| 33  | 2    | Order Rewrite | Alter # Roles Action \* Priority   | Initiative | Role   | 1   | 5   | fixedInitiative              |
| 34  | 1    | Hard Priority | Set # Players Action Priority      | Initiative | Player | 1   | 5   | allowRandom                  |
| 35  | 1    | Order Rule    | Set # Roles Action Priority        | Initiative | Role   | 1   | 5   | —                            |
| 36  | 3    | Shield        | Protect # Player From \* Actions   | Protect    | Player | 1   | 5   | fixedInitiative, allowRandom |
| 37  | 3    | Guard         | Protect # \* Roles From \* Actions | Protect    | Role   | 1   | 5   | fixedInitiative              |

### 4.6 Tamper Powers (7 powers)

| Idx | Init | Name        | Description                                 | Item      | Where  | Min | Max | Flags (true only)            |
| --- | ---- | ----------- | ------------------------------------------- | --------- | ------ | --- | --- | ---------------------------- |
| 38  | 0    | Mute Vote   | Silence # Player From Voting                | Silence   | Player | 1   | 5   | fixedInitiative, allowRandom |
| 39  | 0    | Vote Jam    | Silence # Role From Voting                  | Silence   | Role   | 1   | 5   | fixedInitiative              |
| 40  | 0    | Vote Encore | Duplicate Own Vote                          | Duplicate | Player | 0   | 0   | fixedAction, fixedInitiative |
| 41  | 0    | Vote Echo   | Duplicate Role Votes                        | Duplicate | Role   | 0   | 0   | fixedAction, fixedInitiative |
| 42  | 0    | Double Tap  | Duplicate Own Vote                          | Duplicate | Self   | 0   | 0   | fixedAction, fixedInitiative |
| 43  | 0    | Death Vote  | Players Vote Is Killed                      | Kill      | Player | 1   | 1   | fixedAction, fixedInitiative |
| 44  | 0    | Last Laugh  | Players Vote Is Killed, If Player is Killed | Destruct  | Player | 1   | 1   | fixedAction, fixedInitiative |

### 4.7 Settings & None (2 powers)

| Idx | Init | Name      | Description                          | Item     | Where | Min | Max | Flags (true only)            |
| --- | ---- | --------- | ------------------------------------ | -------- | ----- | --- | --- | ---------------------------- |
| 45  | 0    | Time Warp | Shorten or Lengthen Discussion Times | Time     | Room  | 0   | 300 | fixedAction, fixedInitiative |
| 46  | 0    | No Action | Has no power                         | NoAction | None  | 0   | 0   | fixedAction, fixedInitiative |

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

Powers with two initiative values (e.g., `"10 90"`) can be configured to run at either timing via the `timing` field on the power slot: `"before"` = use the lower value, `"after"` = use the higher value.

### 4.9 Complexity Ratings

| Rating | Meaning                                             | Examples                                                             |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------- |
| 1      | Simple — no targeting, no lookups                   | No Action, Face Reveal, Deathwish, Double Tap, Vote Encore           |
| 2      | Medium — target selection or mid-level interaction  | Role Peek, Shield, Nope!, Role Swap, Mute Vote, Time Warp            |
| 3      | High — lookup-heavy, mass effects, timing-sensitive | Roll Rolecall, Action Trace, Role Jam, Swap Reversal, Role Spotlight |

---

## 5. Power Compatibility & Meshing Rules

When a character has multiple power slots, not all combinations are valid. The system must validate compatibility both in the admin character creation UI (client-side warnings) and on the server (reject on save).

> **⚠ Implementation note**: The five meshing flags below (`murderer`, `predicter`, `twoXVote`, `silencer`, `suicidal`) are **NOT yet in the existing `InfiltrationPower` type** in `apps/web/src/constants/infiltrationPowers/types.ts`. They were part of the original CSV design but were stripped during the TypeScript conversion. To implement meshing validation, you must **extend** the `InfiltrationPower` type with these fields and add them to each power constant, OR compute them from the power's `type`/`item`/`where` fields at validation time. The recommended approach is to add them to the type as optional booleans and populate them on the relevant powers.

### 5.1 Compatibility Flags

Five boolean flags define meshing constraints. **Add these to `InfiltrationPower` in `types.ts`:**

```typescript
// Add to InfiltrationPower type:
murderer?: boolean;   // Player's vote also eliminates the target
predicter?: boolean;  // Player wins if their vote target is an infiltrator
twoXVote?: boolean;   // Player's vote counts as two
silencer?: boolean;   // Player can silence another's vote
suicidal?: boolean;   // Player wins if they are voted out
```

| Flag        | Meaning                                            | Game Mechanic                          |
| ----------- | -------------------------------------------------- | -------------------------------------- |
| `murderer`  | Player's vote also eliminates the target           | Secondary elimination on vote          |
| `predicter` | Player wins if their vote target is an infiltrator | Alternate win condition on vote        |
| `twoXVote`  | Player's vote counts as two                        | Double voting weight                   |
| `silencer`  | Player can silence another's vote                  | Silenced vote removed from tally       |
| `suicidal`  | Player wins if they are voted out                  | Alternate win condition on elimination |

### 5.2 Core Meshing Rule: Murderer / Predicter / TwoXVote vs. Post-Swap Learn/Reveal

Powers flagged `murderer`, `predicter`, or `twoXVote` **cannot coexist** with any Learn or Reveal power that has `timing: "after"` (post-swap). The reasoning: these flags affect voting outcomes, and post-swap Learn/Reveal gives information that would make the combination overpowered.

```
IF power1 has (murderer=true OR predicter=true OR twoXVote=true)
AND power2 is (type=Learn OR type=Reveal) with timing="after"
→ INCOMPATIBLE
```

Same check applies in reverse (power2 has the flag, power1 is post-swap Learn/Reveal).

**Pre-swap Learn/Reveal is fine** — `timing: "before"` does not conflict with these flags.

### 5.3 Silencer Rules

Currently defined as **TBD** — implement the flag check infrastructure but allow all silencer combinations for now. When rules are finalized, the validation function just needs an additional clause.

### 5.4 Suicidal Rules

Currently defined as **TBD** — same approach. Allow all suicidal combinations. The flag exists and is tracked, but no rejection logic yet.

### 5.5 Non-Constraint Flags

These are game mechanic flags that **already exist** in the `InfiltrationPower` type — they do **NOT** restrict which powers can coexist:

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

```typescript
function canMeshPowers(
  power1: Power,
  power2: Power,
): { valid: boolean; reason?: string } {
  // Murderer + post-swap Learn/Reveal
  if (power1.murderer && isPostSwapLearnReveal(power2)) {
    return {
      valid: false,
      reason: "Murderer cannot coexist with post-swap Learn/Reveal",
    };
  }
  if (power2.murderer && isPostSwapLearnReveal(power1)) {
    return {
      valid: false,
      reason: "Murderer cannot coexist with post-swap Learn/Reveal",
    };
  }

  // Predicter + post-swap Learn/Reveal
  if (power1.predicter && isPostSwapLearnReveal(power2)) {
    return {
      valid: false,
      reason: "Predicter cannot coexist with post-swap Learn/Reveal",
    };
  }
  if (power2.predicter && isPostSwapLearnReveal(power1)) {
    return {
      valid: false,
      reason: "Predicter cannot coexist with post-swap Learn/Reveal",
    };
  }

  // TwoXVote + post-swap Learn/Reveal
  if (power1.twoXVote && isPostSwapLearnReveal(power2)) {
    return {
      valid: false,
      reason: "2x Vote cannot coexist with post-swap Learn/Reveal",
    };
  }
  if (power2.twoXVote && isPostSwapLearnReveal(power1)) {
    return {
      valid: false,
      reason: "2x Vote cannot coexist with post-swap Learn/Reveal",
    };
  }

  // Silencer: TBD — allow for now
  // Suicidal: TBD — allow for now

  return { valid: true };
}

function isPostSwapLearnReveal(power: Power): boolean {
  return (
    (power.type === "Learn" || power.type === "Reveal") &&
    power.timing === "after"
  );
}

function validateCharacterPowers(slots: PowerSlot[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const resolvedPowers = slots
    .filter((s) => s.powerIndex !== null)
    .map((s) => getPowerByIndex(s.powerIndex!));

  for (let i = 0; i < resolvedPowers.length; i++) {
    for (let j = i + 1; j < resolvedPowers.length; j++) {
      const result = canMeshPowers(resolvedPowers[i], resolvedPowers[j]);
      if (!result.valid) {
        errors.push(result.reason!);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### 5.7 Where Validation Runs

| Location              | When                                                    | Action on Failure                                                             |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Admin UI (client)** | On every power slot change                              | Show warning banner with incompatibility reason. Allow save but with warning. |
| **Server REST API**   | On `POST /api/characters` and `PUT /api/characters/:id` | Return `400` with error messages. Reject save.                                |
| **Game start**        | When host starts game with selected characters          | Emit `error:invalid` if any selected character has invalid power combos.      |

### 5.8 Character Complexity Calculation

```typescript
function getCharacterComplexity(slots: PowerSlot[]): number {
  return slots
    .filter((s) => s.powerIndex !== null)
    .reduce((sum, s) => sum + getPowerByIndex(s.powerIndex!).complexity, 0);
}
```

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
| Special team player meets condition    | That player (individual) | Special team wins/loses independently via Condition powers  |
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

```typescript
interface InfiltrationSettings {
  selectedTheme: string; // Single theme ID selected by host (populates character grid)
  selectedCharacters: number[]; // Character IDs toggled on by host
  votingTimerMs: number; // Voting phase duration in ms, default 30000
}
```

The host configures these during lobby: first selecting a theme, then toggling characters from that theme, and adjusting the timer slider. Settings are sent to the server via `game:setInfiltrationOptions`.
