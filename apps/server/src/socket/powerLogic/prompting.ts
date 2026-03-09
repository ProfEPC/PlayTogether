/**
 * Power prompting logic: sends prompts to players for special role powers.
 * Pulls power descriptions from player character data instead of hardcoding.
 */

import type { Server } from "socket.io";
import type { RoomState, Player } from "../../state/types";
import { INFILTRATION_ROLES, POWER_PROMPT_TYPES } from "../../constants/roles";
import { POWER_EVENTS } from "../../constants/socketEvents";
import { getTargetsForPower } from "./validation";

/**
 * Get power description from player's character data
 */
function getPowerDescription(player: Player): string {
  if (!player.character?.powers || player.character.powers.length === 0) {
    return "Use your power.";
  }

  //* Get first power slot that has configuration
  const activePower = player.character.powers.find(
    (p) => p.powerIndex !== null,
  );
  if (!activePower) {
    return "Use your power.";
  }

  //* Use the description stored in the power slot from character creation
  return activePower.description || "Use your power.";
}

/**
 * Send power prompt to a player based on their role.
 */
export function promptPlayerForPower(
  io: Server,
  playerSocketId: string,
  role: string,
  room: RoomState,
) {
  const player = room.players.find((p) => p.socketId === playerSocketId);
  if (!player) return;

  if (role === INFILTRATION_ROLES.THIEF) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_UNUSED,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_UNUSED,
      prompt: getPowerDescription(player),
      targets,
    });
  } else if (role === INFILTRATION_ROLES.HACKER) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM,
      prompt: getPowerDescription(player),
      targets,
    });
  } else if (role === INFILTRATION_ROLES.ENGINEER) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE,
      prompt: getPowerDescription(player),
      targets,
    });
  }
}
