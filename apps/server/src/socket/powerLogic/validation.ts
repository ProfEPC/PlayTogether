/**
 * Power validation and target filtering logic.
 */

import type { Player, RoomState } from "../../state/types";
import { POWER_PROMPT_TYPES } from "../../constants/roles";

/**
 * Check if a player is currently revealed (their role has been publicly shown).
 */
export function isPlayerRevealed(player: Player): boolean {
  return player.roleRevealed === true;
}

/**
 * Check if a player is currently protected (shielded from actions).
 */
export function isPlayerProtected(player: Player): boolean {
  return player.protected === true;
}

/**
 * Get target list for a specific power type.
 * Filters out revealed/protected players and validates target availability.
 * Returns the list of valid targets based on power and available players.
 */
export function getTargetsForPower(
  powerType: string,
  room: RoomState,
  actorSocketId: string,
) {
  if (powerType === POWER_PROMPT_TYPES.VIEW_UNUSED) {
    // Offer unused role indices as targets
    const unused = room.game.unusedRoles || [];
    return unused.map((_: any, idx: number) => ({
      id: String(idx),
      label: `Unused role #${idx}`,
    }));
  }

  if (
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM ||
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE
  ) {
    // Offer other players as targets
    // RULE: Filter out revealed or protected players from selectable targets
    return room.players
      .filter(
        (q) =>
          q.socketId !== actorSocketId &&
          !isPlayerRevealed(q) &&
          !isPlayerProtected(q),
      )
      .map((q) => ({ id: q.socketId, label: q.name }));
  }

  return [];
}
