/**
 * Game Control Handlers
 * Handles game lifecycle events: START, RESET, NEXT_ROUND
 */

import type { Server, Socket } from "socket.io";
import { GAME_RULES } from "../../state/gameRules";
import type { RoomState } from "../../state/types";
import { emitRoomState, endRound, clearPhaseTimer } from "../roomActions";
import { beginRoleReveal, beginMayhem } from "../gamePhaseHandlers";
import { GAME_EVENTS, ERROR_EVENTS } from "../../constants/socketEvents";
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
      const requiredCharacters = room.players.length + 3; // 3 NPCs

      if (selectedCharacters.length !== requiredCharacters) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: `Need exactly ${requiredCharacters} characters selected (${room.players.length} players + 3 NPCs). You have ${selectedCharacters.length}.`,
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

    //* Cancel any running phase timer
    clearPhaseTimer(room.roomCode);

    room.locked = false;

    //* Remove NPC players added during character reveal
    room.players = room.players.filter((p) => !p.isNPC);

    //* Clear all per-player game state
    room.players.forEach((p) => {
      p.vote = undefined;
      p.team = undefined;
      p.characterAcknowledged = undefined;
      p.mayhemAcknowledged = undefined;
      p.character = undefined;
      p.usedPower = undefined;
      p.characterRevealed = undefined;
      p.protected = undefined;
      p.blocked = undefined;
      p.swapped = undefined;
      p.actedThisRound = undefined;
      p.powerUsed = undefined;
      p.learnsThisGame = undefined;
      p.ready = false;
    });

    //* Reset game state back to lobby
    room.game.started = false;
    room.game.phase = "lobby";
    room.game.endsAt = null;
    room.game.gameId = null;
    room.game.winner = undefined;
    room.game.prompt = undefined;
    room.game._teams = undefined;
    room.game.votes = undefined;
    room.game.mayhemAck = undefined;
    room.game.usedPowers = undefined;
    room.game.powerSummary = undefined;
    room.game.unusedTeams = undefined;

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
