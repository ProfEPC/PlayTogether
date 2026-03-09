/**
 * Power prompting logic: sends prompts to players for character powers.
 * Power types and descriptions come from the character data, not hardcoded roles.
 */

import type { Server } from "socket.io";
import type { RoomState, Player } from "../../state/types";
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
 * Get the power type from the player's character data.
 * Returns the type string from the first active power slot.
 */
function getPowerType(player: Player): string | null {
  if (!player.character?.powers) return null;
  const activePower = player.character.powers.find(
    (p) => p.powerIndex !== null,
  );
  return activePower?.type || null;
}

/**
 * Send power prompt to a player based on their character's power type.
 */
export function promptPlayerForPower(
  io: Server,
  playerSocketId: string,
  _role: string,
  room: RoomState,
) {
  const player = room.players.find((p) => p.socketId === playerSocketId);
  if (!player) return;

  const powerType = getPowerType(player);
  if (!powerType) return;

  const targets = getTargetsForPower(powerType, room, playerSocketId);

  io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
    type: powerType,
    prompt: getPowerDescription(player),
    targets,
  });
}
