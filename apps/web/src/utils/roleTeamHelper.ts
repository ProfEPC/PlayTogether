import type { Player } from "../types/room";

/**
 * Determine which team a role belongs to
 * Infiltrator = infiltrator team
 * Everything else = villager team
 */
export function getRoleTeam(role: string): "infiltrator" | "villager" {
  return role === "infiltrator" ? "infiltrator" : "villager";
}

/**
 * Check if a role is on the villager team
 */
export function isVillagerRole(role: string): boolean {
  return getRoleTeam(role) === "villager";
}

/**
 * Filter center players to only show those with villager team roles
 */
export function getVillagerCenterPlayers(
  players: Player[] | undefined,
): Player[] {
  if (!players) return [];

  return players.filter(
    (player) => player.isCenter && player.role && isVillagerRole(player.role),
  );
}
