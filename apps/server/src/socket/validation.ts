/**
 * Validation utilities for socket handlers.
 * Centralizes common validation patterns to reduce code duplication.
 */

import type { Socket } from "socket.io";
import type { RoomState } from "../state/types";
import { normalizeRoomCode as normalize } from "../utils/roomCode";
import { getRoom } from "../state/rooms";
import { ERROR_EVENTS } from "../constants/socketEvents";

/**
 * Validate and get room code from input.
 * Returns normalized code or null if invalid.
 */
export function validateRoomCode(roomCode: string): string | null {
  const code = normalize(roomCode);
  return code || null;
}

/**
 * Validate and get room from code.
 * Returns room or null if not found.
 */
export function validateRoom(roomCode: string): RoomState | null {
  const code = validateRoomCode(roomCode);
  if (!code) return null;
  return getRoom(code) || null;
}

/**
 * Validate that the requesting socket is the host of the room.
 * Emits error and returns false if validation fails.
 */
export function validateIsHost(socket: Socket, room: RoomState): boolean {
  if (room.hostSocketId !== socket.id) {
    socket.emit(ERROR_EVENTS.FORBIDDEN, {
      message: "Only host can perform this action.",
    });
    return false;
  }
  return true;
}

/**
 * Validate that the game has started.
 * Emits error and returns false if game has not started.
 */
export function validateGameStarted(socket: Socket, room: RoomState): boolean {
  if (!room.game.started) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: "Game has not started yet.",
    });
    return false;
  }
  return true;
}

/**
 * Validate that player is in the room.
 * Returns false if player is not found in room.
 */
export function validatePlayerInRoom(socket: Socket, room: RoomState): boolean {
  return room.players.some((p) => p.socketId === socket.id);
}

/**
 * Validate current game phase.
 * Emits error and returns false if phase doesn't match.
 */
export function validateGamePhase(
  socket: Socket,
  room: RoomState,
  expectedPhase: string,
): boolean {
  if (room.game.phase !== expectedPhase) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: `This action is only allowed during ${expectedPhase} phase.`,
    });
    return false;
  }
  return true;
}
