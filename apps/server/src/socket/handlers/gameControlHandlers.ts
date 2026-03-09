/**
 * Game Control Handlers
 * Handles game lifecycle events: START, RESET, NEXT_ROUND
 */

import type { Server, Socket } from "socket.io";
import { GAME_RULES } from "../../state/gameRules";
import type { RoomState } from "../../state/types";
import { emitRoomState, endRound } from "../roomActions";
import { beginRoleReveal, beginMayhem } from "../gamePhaseHandlers";
import { GAME_EVENTS, ERROR_EVENTS } from "../../constants/socketEvents";
import { resetPlayerPowers } from "../powerLogic/index";
import {
  validateRoom,
  validateIsHost,
  validateGameStarted,
  validateGamePhase,
} from "../validation";

export function registerGameControlHandlers(io: Server, socket: Socket) {
  //* Host starts the game
  socket.on(GAME_EVENTS.START, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;

    const rules = GAME_RULES[room.settings.gameKey];

    if (room.players.length < rules.minPlayers) {
      socket.emit(ERROR_EVENTS.BAD_REQUEST, {
        message: `Need at least ${rules.minPlayers} players to start ${room.settings.gameKey}.`,
      });
      return;
    }

    //* Disallow starting if any joined player is not ready
    if (room.players.some((p: any) => !p.ready)) {
      socket.emit(ERROR_EVENTS.BAD_REQUEST, {
        message: "Not all players are ready.",
      });
      return;
    }

    //* For infiltration, validate character selection
    if (room.settings.gameKey === "infiltration") {
      const selectedCharacters =
        room.settings.gameOptions.infiltration?.selectedCharacters || [];
      const requiredCharacters = room.players.length + 3; // 3 center roles

      if (selectedCharacters.length !== requiredCharacters) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: `Need exactly ${requiredCharacters} characters selected (${room.players.length} players + 3 center). You have ${selectedCharacters.length}.`,
        });
        return;
      }
    }

    //* For infiltration, start with role reveal
    if (room.settings.gameKey === "infiltration") {
      beginRoleReveal(io, room.roomCode, room);
      return;
    }

    beginMayhem(io, room.roomCode, room);
  });

  //* Host resets the game
  socket.on(GAME_EVENTS.RESET, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;

    room.locked = false;
    room.game.started = false;
    room.game.phase = "lobby";
    room.game.endsAt = null;
    room.game.gameId = null;
    room.game.winner = undefined;
    room.players.forEach((p: any) => {
      p.submission = undefined;
      p.role = undefined;
      p.roleAcknowledged = undefined;
      p.mayhemAcknowledged = undefined;
    });

    //* Reset all powers
    resetPlayerPowers(room);

    emitRoomState(io, room.roomCode);
  });

  //* Host starts the next round
  socket.on(GAME_EVENTS.NEXT_ROUND, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;
    if (!validateGameStarted(socket, room)) return;
    if (!validateGamePhase(socket, room, "results")) return;

    //* start another playing phase
    beginMayhem(io, room.roomCode, room);
  });
}
