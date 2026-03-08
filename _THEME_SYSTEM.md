# Theme System

**TLDR:** Documentation for PlayTogether's theme system. Themes let you customize all game terminology, phase names, UI labels, and power names without changing game logic. Covers the `GameTheme` and `StoredTheme` interfaces, every customizable field, how to create a theme, and how themes are loaded and applied.

## Overview

A **theme** is a named set of text strings that replaces the default game terminology throughout the UI. For example, a "Corporate Espionage" theme could rename "Infiltrator" to "Corporate Spy" and "Villagers" to "Security Team", giving the game a completely different narrative feel without changing any rules.

Themes are defined in `apps/web/src/types/themes.ts` and stored via the server API.

---

## GameTheme Interface

The full interface for a theme definition:

```typescript
interface GameTheme {
  id: string;           // Unique theme identifier (e.g., "debug", "coop_office", "heist")
  name: string;         // Display name shown in the UI (e.g., "Corporate Espionage")
  description: string;  // Short description of the theme's narrative

  teamTerms: TeamTerms;
  phaseText: PhaseText;
  phaseNames: PhaseNames;
  cardTerms: CardTerms;
  playerTerms: PlayerTerms;

  powerTerms?: Record<string, string>;  // Optional: maps power index to theme-specific name
  uiLabels?: UILabels;                  // Optional: additional UI label overrides

  createdAt?: string;   // ISO timestamp (set by server on creation)
  updatedAt?: string;   // ISO timestamp (set by server on update)
}
```

---

## Field Reference

### teamTerms — Team Terminology

Customizes how the two teams are referred to throughout the game.

```typescript
teamTerms: {
  infiltratorSingular: string;  // Default: "Infiltrator" — one member of the enemy team
  infiltratorPlural: string;    // Default: "Infiltrators" — the enemy team as a group
  villagerSingular: string;     // Default: "Villager" — one member of the friendly team
  villagerPlural: string;       // Default: "Villagers" — the friendly team as a group
}
```

**Examples:**

| Theme | infiltratorSingular | villagerSingular |
|-------|---------------------|-----------------|
| Default | "Infiltrator" | "Villager" |
| Corporate | "Corporate Spy" | "Employee" |
| Heist | "Thief" | "Security Guard" |
| Sci-Fi | "Android" | "Human" |

---

### phaseText — Phase Prompts

Customizes the instructional text shown to players during each game phase.

```typescript
phaseText: {
  revealPrompt: string;          // Shown during reveal phase
                                 // Default: "Role reveal: acknowledge when you've seen your role."
  mayhemPrompt: string;          // Shown during mayhem phase
                                 // Default: "MAYHEM ROUND: Take your actions and acknowledge when done."
  votingPrompt: string;          // Shown during voting phase
                                 // Default: "VOTE: Who is the infiltrator?"
  noInfiltratorOption: string;   // Label for the "nobody is the infiltrator" vote option
                                 // Default: "No Infiltrator"
}
```

---

### phaseNames — Phase Display Names

Customizes the names of game phases shown in the UI.

```typescript
phaseNames: {
  reveal: string;   // Default: "Reveal" — could be "Briefing", "Assignment", etc.
  mayhem: string;   // Default: "Mayhem" — could be "Actions", "Operations", etc.
  voting: string;   // Default: "Voting" — could be "Accusation", "Tribunal", etc.
}
```

---

### cardTerms — Card Terminology

Customizes how card positions are referred to (used primarily in power targeting UI).

```typescript
cardTerms: {
  centerCardSingular: string;  // Default: "Center Card" — one face-down card in the center
  centerCardPlural: string;    // Default: "Center Cards"
  vaultCardSingular: string;   // Default: "Vault Card" — a card in the vault/center
  vaultCardPlural: string;     // Default: "Vault Cards"
}
```

---

### playerTerms — Player Outcome Text

Customizes text shown when players are outed or when the game ends.

```typescript
playerTerms: {
  playerOuted: string;         // Default: "Player outed as {role}" — shown when player is eliminated
  infiltratorWinText: string;  // Default: "Infiltrators win!" — shown when infiltrators win
  villagersWinText: string;    // Default: "Villagers win!" — shown when villagers win
}
```

---

### powerTerms — Power Name Overrides (Optional)

Maps a power's numeric index to a theme-specific display name. Use this when a theme's narrative calls for unique power names.

```typescript
powerTerms?: Record<string, string>;
// Key: power index as a string (matches powerIndex in PowerSlot)
// Value: theme-specific display name

// Example:
powerTerms: {
  "0": "Intel Gathering",  // Replaces the default name of power 0
  "5": "Surveillance",     // Replaces the default name of power 5
}
```

See `apps/web/src/constants/infiltrationPowers/` for the full list of powers and their indices.

---

### uiLabels — UI Label Customization (Optional)

Additional overrides for UI labels in the character creation and game screens.

```typescript
uiLabels?: {
  selectTeam?: string;          // Label for the team selection dropdown
  characterName?: string;       // Label for the character name input field
  characterDescription?: string; // Label for the character description field
}
```

---

## StoredTheme Interface

`StoredTheme` extends `GameTheme` with required metadata fields. Themes returned from the API are always `StoredTheme` objects.

```typescript
interface StoredTheme extends GameTheme {
  id: string;           // Always present (required, not optional)
  createdAt: string;    // ISO timestamp — required, set by server on creation
  updatedAt: string;    // ISO timestamp — required, updated on every save
}
```

**When to use each:**

- Use `GameTheme` for defining new themes in code or passing them to creation functions
- Use `StoredTheme` when reading themes from the API or persisted storage

---

## How Themes Are Created and Loaded

### Creating a Theme

Themes are managed through the server API. From the client, use the character persistence utilities or direct API calls:

```typescript
// POST /api/themes
const newTheme: GameTheme = {
  id: "heist",
  name: "The Heist",
  description: "A high-stakes bank robbery theme.",
  teamTerms: {
    infiltratorSingular: "Thief",
    infiltratorPlural: "Thieves",
    villagerSingular: "Security Guard",
    villagerPlural: "Security Team",
  },
  phaseText: {
    revealPrompt: "Check your assignment carefully.",
    mayhemPrompt: "Execute your plan.",
    votingPrompt: "Who is the inside man?",
    noInfiltratorOption: "No inside man",
  },
  phaseNames: {
    reveal: "Briefing",
    mayhem: "Heist",
    voting: "Interrogation",
  },
  cardTerms: {
    centerCardSingular: "Safe",
    centerCardPlural: "Safes",
    vaultCardSingular: "Vault",
    vaultCardPlural: "Vaults",
  },
  playerTerms: {
    playerOuted: "Agent exposed as {role}",
    infiltratorWinText: "The Thieves escape!",
    villagersWinText: "Security stops the heist!",
  },
};
```

### Loading a Theme

Themes are persisted by the server. The client loads available themes from the API and applies them to the game UI.

**Theme files location:** Themes are stored alongside characters in the server's data directory (`apps/server/data/`).

### Applying a Theme

Once loaded, the theme object is used throughout the UI to replace default text:

```typescript
// Instead of hardcoded text:
<h2>Infiltrators win!</h2>

// Use theme text:
<h2>{theme.playerTerms.infiltratorWinText}</h2>
```

---

## Complete Example Theme

```typescript
const debugTheme: GameTheme = {
  id: "debug",
  name: "Debug Theme",
  description: "Development/testing theme with explicit labels.",
  teamTerms: {
    infiltratorSingular: "Infiltrator",
    infiltratorPlural: "Infiltrators",
    villagerSingular: "Villager",
    villagerPlural: "Villagers",
  },
  phaseText: {
    revealPrompt: "Role reveal: acknowledge when you've seen your role.",
    mayhemPrompt: "MAYHEM ROUND: Take your actions and acknowledge when done.",
    votingPrompt: "VOTE: Who is the infiltrator?",
    noInfiltratorOption: "No Infiltrator",
  },
  phaseNames: {
    reveal: "Reveal",
    mayhem: "Mayhem",
    voting: "Voting",
  },
  cardTerms: {
    centerCardSingular: "Center Card",
    centerCardPlural: "Center Cards",
    vaultCardSingular: "Vault Card",
    vaultCardPlural: "Vault Cards",
  },
  playerTerms: {
    playerOuted: "Player outed as {role}",
    infiltratorWinText: "Infiltrators win!",
    villagersWinText: "Villagers win!",
  },
};
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/web/src/types/themes.ts` | `GameTheme` and `StoredTheme` TypeScript interfaces |
| `apps/server/data/` | Server data directory where themes are persisted |

---

For character power terminology customization, see [\_CHARACTER_POWERS.md](_CHARACTER_POWERS.md) → `powerTerms`.

For the full game vocabulary, see [\_VOCABULARY.md](_VOCABULARY.md).
