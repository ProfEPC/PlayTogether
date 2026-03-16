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
    innocentSingular: "Innocent",
    innocentPlural: "Innocents",
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
  characterTerms: {
    npcSingular: "NPC",
    npcPlural: "NPCs",
  },
  playerTerms: {
    playerOuted: "Player outed as {role}",
    infiltratorWinText: "Infiltrators win!",
    innocentsWinText: "Innocents win!",
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
    innocentSingular: "Employee",
    innocentPlural: "Employees",
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
  characterTerms: {
    npcSingular: "Safe",
    npcPlural: "Safes",
  },
  playerTerms: {
    playerOuted: "{role} exposed!",
    infiltratorWinText: "Spies escaped with the data!",
    innocentsWinText: "Spies caught!",
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
    innocentSingular: "Guard",
    innocentPlural: "Guards",
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
  characterTerms: {
    npcSingular: "Treasure",
    npcPlural: "Treasures",
  },
  playerTerms: {
    playerOuted: "{role} compromised!",
    infiltratorWinText: "Thieves made off with the goods!",
    innocentsWinText: "Thieves captured!",
  },
};

//* All default themes
export const DEFAULT_THEMES: GameTheme[] = [
  DEBUG_THEME,
  COOP_OFFICE_THEME,
  HEIST_THEME,
];
