/**
 * Infiltration game role constants.
 * Single source of truth for base role names to prevent typos and ensure consistency.
 * Character-specific powers are defined in the character data, not here.
 */

// Base team names (team assignment)
export const INFILTRATION_TEAMS = {
  INFILTRATOR: "infiltrator",
  INNOCENT: "innocent",
} as const;

// Power prompt types
export const POWER_PROMPT_TYPES = {
  VIEW_UNUSED: "viewUnused",
  VIEW_PLAYER_TEAM: "viewPlayerTeam",
  VIEW_PLAYER_ROLE: "viewPlayerRole",
} as const;

// Game outcome winners
export const GAME_WINNERS = {
  INNOCENTS: "innocents",
  INFILTRATORS: "infiltrators",
  NONE: "none",
} as const;

// Game phases
export const GAME_PHASES = {
  LOBBY: "lobby",
  REVEAL: "reveal",
  MAYHEM: "mayhem",
  VOTING: "voting",
  RESULTS: "results",
} as const;
