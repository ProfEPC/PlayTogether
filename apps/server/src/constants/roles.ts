/**
 * Infiltration game role constants.
 * Single source of truth for all role names and indices to prevent typos and ensure consistency.
 */

// Role names as literal strings
export const INFILTRATION_ROLES = {
  INFILTRATOR: "infiltrator",
  CIVILIAN: "civilian",
  THIEF: "thief",
  HACKER: "hacker",
  ENGINEER: "engineer",
} as const;

// Role index mapping (for enabledRoleIds array)
export const SPECIAL_ROLE_INDICES = {
  THIEF: 0,
  HACKER: 1,
  ENGINEER: 2,
} as const;

// Power-enabled roles (non-infiltrators/non-civilians)
export const POWER_ROLES = [
  INFILTRATION_ROLES.THIEF,
  INFILTRATION_ROLES.HACKER,
  INFILTRATION_ROLES.ENGINEER,
] as const;

// Power prompt types
export const POWER_PROMPT_TYPES = {
  VIEW_UNUSED: "viewUnused",
  VIEW_PLAYER_TEAM: "viewPlayerTeam",
  VIEW_PLAYER_ROLE: "viewPlayerRole",
} as const;

// Game outcome winners
export const GAME_WINNERS = {
  CREW: "crew",
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
