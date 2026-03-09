/**
 * Power utility functions: recording usage, resetting powers, etc.
 */

import type { RoomState } from "../../state/types";
import { POWER_PROMPT_TYPES } from "../../constants/roles";

/**
 * Record a power usage in the game's power summary for the room to see.
 */
export function recordPowerUsage(
  room: RoomState,
  actorSocketId: string,
  actorName: string,
  powerType: string,
  target: string,
) {
  if (!room.game.powerSummary) room.game.powerSummary = [];

  room.game.powerSummary.push({
    actorSocketId,
    actorName,
    type: powerType,
    target:
      powerType === POWER_PROMPT_TYPES.VIEW_UNUSED
        ? `unused#${target}`
        : `player:${target}`,
    at: Date.now(),
  });
}

/**
 * Reset all player powers for a new round.
 */
export function resetPlayerPowers(room: RoomState) {
  room.players.forEach((p) => {
    p.usedPower = undefined;
  });
  room.game.powerSummary = [];
}
