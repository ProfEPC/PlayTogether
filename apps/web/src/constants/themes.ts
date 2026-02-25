/**
 * ! Default themes for the game
 * * These themes provide starter configurations for different game contexts
 */

import type { GameTheme } from "../types/themes";

//* Default "debug" theme - used for testing and development
export const DEBUG_THEME: GameTheme = {
  id: "debug",
  name: "Debug Theme",
  description: "Testing and development theme",
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

//* Corporate espionage theme
export const COOP_OFFICE_THEME: GameTheme = {
  id: "coop_office",
  name: "Corporate Espionage",
  description: "Office-based corporate espionage game",
  teamTerms: {
    infiltratorSingular: "Corporate Spy",
    infiltratorPlural: "Corporate Spies",
    villagerSingular: "Employee",
    villagerPlural: "Employees",
  },
  phaseText: {
    revealPrompt:
      "Briefing complete: acknowledge when you've reviewed your role.",
    mayhemPrompt:
      "INFILTRATION PHASE: Execute your corporate actions and acknowledge completion.",
    votingPrompt: "VOTE: Who is the corporate spy?",
    noInfiltratorOption: "No Spy Detected",
  },
  phaseNames: {
    reveal: "Briefing",
    mayhem: "Infiltration",
    voting: "Accusation",
  },
  cardTerms: {
    centerCardSingular: "Safe",
    centerCardPlural: "Safes",
    vaultCardSingular: "Vault File",
    vaultCardPlural: "Vault Files",
  },
  playerTerms: {
    playerOuted: "{role} exposed!",
    infiltratorWinText: "Spies escaped with the data!",
    villagersWinText: "Spies caught!",
  },
};

//* Heist theme
export const HEIST_THEME: GameTheme = {
  id: "heist",
  name: "The Great Heist",
  description: "High-stakes heist game",
  teamTerms: {
    infiltratorSingular: "Thief",
    infiltratorPlural: "Thieves",
    villagerSingular: "Guard",
    villagerPlural: "Guards",
  },
  phaseText: {
    revealPrompt:
      "Role assignment: acknowledge when you've received your briefing.",
    mayhemPrompt: "HEIST TIME: Execute your moves and acknowledge when ready.",
    votingPrompt: "VOTE: Who is the thief?",
    noInfiltratorOption: "No Thief",
  },
  phaseNames: {
    reveal: "Briefing",
    mayhem: "Heist",
    voting: "Accusation",
  },
  cardTerms: {
    centerCardSingular: "Treasure",
    centerCardPlural: "Treasures",
    vaultCardSingular: "Loot",
    vaultCardPlural: "Loot",
  },
  playerTerms: {
    playerOuted: "{role} compromised!",
    infiltratorWinText: "Thieves made off with the goods!",
    villagersWinText: "Thieves captured!",
  },
};

//* All default themes
export const DEFAULT_THEMES: GameTheme[] = [
  DEBUG_THEME,
  COOP_OFFICE_THEME,
  HEIST_THEME,
];
