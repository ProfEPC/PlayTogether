/**
 * Player Phase Handlers
 * Handles player phase actions: SET_READY, ACK_ROLE, ACK_MAYHEM
 */

import type { Server, Socket } from "socket.io";
import { emitRoomState } from "../roomActions";
import { beginMayhem, beginVoting } from "../gamePhaseHandlers";
import { PLAYER_EVENTS, ERROR_EVENTS } from "../../constants/socketEvents";
import {
  validateRoom,
  validatePlayerInRoom,
  validateGamePhase,
} from "../validation";

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

  //* Player acknowledges seeing their role
  socket.on(
    PLAYER_EVENTS.ACK_ROLE,
    ({ roomCode, seen }: { roomCode: string; seen: boolean }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p: any) => p.socketId === socket.id);
      if (!player) return;

      player.roleAcknowledged = !!seen;
      emitRoomState(io, room.roomCode);

      //* If all players have acknowledged, proceed to mayhem
      const allAck =
        room.players.length > 0 &&
        room.players.every((p: any) => !!p.roleAcknowledged);
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
    const allAcked = room.players.every((p: any) => p.mayhemAcknowledged);
    if (allAcked) {
      beginVoting(io, room.roomCode, room);
    } else {
      emitRoomState(io, room.roomCode);
    }
  });
}
