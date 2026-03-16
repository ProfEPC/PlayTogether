/**
 * Player Power Handlers
 * Handles power usage events during mayhem: game:submitPower
 */

import type { Server, Socket } from "socket.io";
import { emitRoomState } from "../roomActions";
import { ERROR_EVENTS } from "../../constants/socketEvents";
import { executeCharacterPower } from "../powerLogic/index";
import {
  validateRoom,
  validateGameStarted,
  validateGamePhase,
} from "../validation";

export function registerPlayerPowerHandlers(io: Server, socket: Socket) {
  //* Player submits power usage during mayhem
  socket.on(
    "game:submitPower",
    ({
      roomCode,
      powerName,
      targetPlayers,
      targetNPCs,
    }: {
      roomCode: string;
      powerName: string;
      targetPlayers?: string[];
      targetNPCs?: string[];
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateGameStarted(socket, room)) return;
      if (!validateGamePhase(socket, room, "mayhem")) return;

      const player = room.players.find((p: any) => p.socketId === socket.id);
      if (!player) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Player not found in room.",
        });
        return;
      }

      //* Check if player has already used a power this game
      if (player.powerUsed) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "You can only use one power per game.",
        });
        return;
      }

      //* Find power in player's character
      if (!player.character) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "You don't have a character assigned.",
        });
        return;
      }

      const powerSlot = player.character.powers.find(
        (slot: any) => slot.powerIndex !== null,
      );

      console.log(`[PowerHandler] Power submission received:`, {
        playerName: player.name,
        powerSlot: JSON.stringify(powerSlot),
        powerSlotWhere: powerSlot?.where,
        powerSlotItem: powerSlot?.item,
      });

      if (!powerSlot || !powerSlot.powerIndex) {
        console.log(
          `[PowerHandler] Power validation FAILED: no powerSlot or no powerIndex`,
        );
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Power not found.",
        });
        return;
      }

      //* Validate that the power slot has required fields
      if (!powerSlot.where || !powerSlot.item) {
        console.log(
          `[PowerHandler] Power validation FAILED: missing where or item`,
          {
            where: powerSlot.where,
            item: powerSlot.item,
          },
        );
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Invalid power configuration.",
        });
        return;
      }

      console.log(`[PowerHandler] Power validation PASSED, executing...`);

      //* Combine player and NPC targets into a single array of player IDs
      const allTargets = [...(targetPlayers || []), ...(targetNPCs || [])];

      //* Execute the power (handles both Learn and Reveal based on powerSlot.type)
      executeCharacterPower(io, room, player, powerName, allTargets, powerSlot);

      //* Mark power as used
      player.powerUsed = true;
      emitRoomState(io, room.roomCode);
    },
  );
}
