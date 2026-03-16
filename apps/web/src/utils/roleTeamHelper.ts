import type { Player } from "../types/room";

/**
 * Determine which team a role belongs to
 * Infiltrator = infiltrator team
 * Everything else = innocent team
 */
export function getTeam(role: string): "infiltrator" | "innocent" {
  return role === "infiltrator" ? "infiltrator" : "innocent";
}

/**
 * Check if a role is on the innocent team
 */
export function isInnocent(role: string): boolean {
  return getTeam(role) === "innocent";
}

/**
 * Filter NPC players to only show those with innocent team roles
 */
export function getInnocentNPCs(players: Player[] | undefined): Player[] {
  if (!players) return [];

  return players.filter(
    (player) => player.isNPC && player.team && isInnocent(player.team),
  );
}
