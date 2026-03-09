import type { RoomState, Character, PowerSlot, Player } from "../types/room";
import { INFILTRATION_POWERS } from "../constants/infiltrationPowers";

type PowerDef = (typeof INFILTRATION_POWERS)[number];

export interface PowerActionValidation {
  isValid: false;
}

export interface PowerActionData {
  isValid: true;
  roomState: RoomState;
  character: Character;
  myPlayer: Player;
  activePower: PowerSlot;
  fullPowerDef: PowerDef;
  quantity: number;
  actualQuantity: number;
}

/**
 * Validate all preconditions for power action panel to render
 * Returns null if any validation fails, otherwise returns validated data
 */
export function validatePowerAction(
  roomState: RoomState | null,
  mySocketId: string | undefined,
  character: Character | undefined,
): PowerActionData | null {
  // Must be in mayhem phase
  if (!roomState || roomState.game.phase !== "mayhem") {
    return null;
  }

  // Character must exist and have powers
  if (!character || character.powers.length === 0) {
    return null;
  }

  // Player must be in room
  const myPlayer = roomState.players.find((p) => p.socketId === mySocketId);
  if (!myPlayer) {
    return null;
  }

  // Player must not have already used power this game
  if (myPlayer.powerUsed) {
    return null;
  }

  // Must have an active power
  const activePower = character.powers.find((p) => p.powerIndex !== null);
  if (!activePower || activePower.powerIndex === null) {
    return null;
  }

  // Power must have a valid definition
  const fullPowerDef = INFILTRATION_POWERS[activePower.powerIndex - 1];
  if (!fullPowerDef) {
    return null;
  }

  // Power must have targets
  if (!activePower.where || !fullPowerDef.max || fullPowerDef.max === 0) {
    return null;
  }

  // All validations passed
  const quantity = fullPowerDef.max || 1;
  const actualQuantity = activePower.quantity || quantity;

  return {
    isValid: true,
    roomState,
    character,
    myPlayer,
    activePower,
    fullPowerDef,
    quantity,
    actualQuantity,
  };
}
