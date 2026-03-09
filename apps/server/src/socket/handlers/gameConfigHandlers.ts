/**
 * Game Config Handlers
 * Handles game configuration events: game:select, SET_DURATION, SET_MAX_PLAYERS, SET_INFILTRATION_OPTIONS
 */

import type { Server, Socket } from "socket.io";
import { GAME_RULES } from "../../state/gameRules";
import type { GameKey } from "../../state/types";
import { logger } from "../../utils/logger";
import { emitRoomState } from "../roomActions";
import { GAME_EVENTS, ERROR_EVENTS } from "../../constants/socketEvents";
import { validateRoom, validateIsHost } from "../validation";

export function registerGameConfigHandlers(io: Server, socket: Socket) {
  //* Host selects the game type
  socket.on(
    "game:select",
    ({ roomCode, gameKey }: { roomCode: string; gameKey: GameKey }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change game while running.",
        });
        return;
      }

      room.settings.gameKey = gameKey;

      const { maxPlayersCap } = GAME_RULES[gameKey];
      room.settings.maxPlayers = Math.min(
        room.settings.maxPlayers,
        maxPlayersCap,
      );

      emitRoomState(io, room.roomCode);
    },
  );

  //* Host sets round duration
  socket.on(
    GAME_EVENTS.SET_DURATION,
    ({ roomCode, seconds }: { roomCode: string; seconds: number }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change duration while game is running.",
        });
        return;
      }

      const s = Math.floor(seconds);
      if (!Number.isFinite(s) || s < 5 || s > 300) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Duration must be between 5 and 300 seconds.",
        });
        return;
      }

      room.settings.roundDurationMs = s * 1000;
      emitRoomState(io, room.roomCode);
    },
  );

  //* Host sets max players
  socket.on(
    GAME_EVENTS.SET_MAX_PLAYERS,
    ({ roomCode, maxPlayers }: { roomCode: string; maxPlayers: number }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change max players while game is running.",
        });
        return;
      }

      const rules =
        GAME_RULES[room.settings.gameKey as keyof typeof GAME_RULES];
      const hardCap = 8;
      const cap = Math.min(hardCap, rules.maxPlayersCap);

      const n = Math.floor(maxPlayers);
      if (!Number.isFinite(n)) return;

      const clamped = Math.max(rules.minPlayers, Math.min(n, cap));
      room.settings.maxPlayers = clamped;

      emitRoomState(io, room.roomCode);
    },
  );

  //* Host sets infiltration game options
  socket.on(
    GAME_EVENTS.SET_INFILTRATION_OPTIONS,
    ({
      roomCode,
      selectedCharacters,
    }: {
      roomCode: string;
      selectedCharacters: string[];
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      //* Update host socket id in case of reconnect
      room.hostSocketId = socket.id;

      //* Store selected character names
      room.settings.gameOptions.infiltration = {
        ...room.settings.gameOptions.infiltration,
        selectedCharacters: Array.isArray(selectedCharacters)
          ? selectedCharacters
          : [],
      };

      logger.infiltrationOptions(room.roomCode, selectedCharacters);
      emitRoomState(io, room.roomCode);
    },
  );
}
