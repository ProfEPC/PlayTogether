/**
 * Player Phase Handlers
 * Handles player phase actions: SET_READY, ACK_CHARACTER, ACK_MAYHEM, vote submission
 */

import type { Server, Socket } from "socket.io";
import { emitRoomState, endRound } from "../roomActions";
import { beginMayhem, beginVoting } from "../gamePhaseHandlers";
import {
  PLAYER_EVENTS,
  GAME_EVENTS,
  ERROR_EVENTS,
} from "../../constants/socketEvents";
import { validateRoom, validateGamePhase } from "../validation";

export function registerPlayerPhaseHandlers(io: Server, socket: Socket) {
  //* Player sets ready state
  socket.on(PLAYER_EVENTS.SET_READY, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p: any) => p.socketId === socket.id);
    if (!player) return;

    player.ready = !player.ready;
    player.lastSeenAt = Date.now();

    emitRoomState(io, room.roomCode);
  });

  //* Player acknowledges seeing their character
  socket.on(
    PLAYER_EVENTS.ACK_CHARACTER,
    ({ roomCode, seen }: { roomCode: string; seen: boolean }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p: any) => p.socketId === socket.id);
      if (!player) return;

      player.characterAcknowledged = !!seen;
      emitRoomState(io, room.roomCode);

      //* If all players have acknowledged, proceed to mayhem
      const humans = room.players.filter((p) => !p.isNPC);
      const allAck =
        humans.length > 0 && humans.every((p) => !!p.characterAcknowledged);
      if (allAck) {
        beginMayhem(io, room.roomCode, room);
      }
    },
  );

  //* Player acknowledges completing mayhem actions
  socket.on(PLAYER_EVENTS.ACK_MAYHEM, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    if (!validateGamePhase(socket, room, "mayhem")) return;

    player.mayhemAcknowledged = true;

    //* Check if all players have acknowledged
    const allAcked = room.players
      .filter((p) => !p.isNPC)
      .every((p) => p.mayhemAcknowledged);
    if (allAcked) {
      beginVoting(io, room.roomCode, room);
    } else {
      emitRoomState(io, room.roomCode);
    }
  });

  //* Player submits a vote during voting phase
  socket.on(
    GAME_EVENTS.SUBMIT,
    ({
      roomCode,
      gameId,
      value,
    }: {
      roomCode: string;
      gameId: string;
      value: string;
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;

      if (!validateGamePhase(socket, room, "voting")) return;

      // Ignore stale submissions from a previous round
      if (room.game.gameId !== gameId) return;

      // Don't allow double voting
      if (player.vote) return;

      player.vote = { value, submittedAt: Date.now() };

      // Check if all human players have voted → end round early
      const humans = room.players.filter((p) => !p.isNPC);
      const allVoted = humans.every((p) => !!p.vote);

      if (allVoted) {
        endRound(io, room.roomCode, "all-voted");
      } else {
        emitRoomState(io, room.roomCode);
      }
    },
  );
}
