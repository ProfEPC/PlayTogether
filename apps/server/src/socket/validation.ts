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
 * Validate that the room game has not started.
 * Emits error and returns false if game has already started.
 */
export function validateGameNotStarted(
  socket: Socket,
  room: RoomState
): boolean {
  if (room.game.started) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: "Cannot perform this action while game is running.",
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
 * Validate that the room is not locked and game hasn't started.
 * Emits error and returns false if validation fails.
 */
export function validateRoomOpen(socket: Socket, room: RoomState): boolean {
  if (room.locked || room.game.started) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: "Room is locked or already started.",
    });
    return false;
  }
  return true;
}

/**
 * Validate minimum player count.
 * Emits error and returns false if validation fails.
 */
export function validateMinPlayers(
  socket: Socket,
  room: RoomState,
  minRequired: number
): boolean {
  if (room.players.length < minRequired) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: `Minimum ${minRequired} players required.`,
    });
    return false;
  }
  return true;
}

/**
 * Validate max player capacity.
 * Emits error and returns false if validation fails.
 */
export function validateMaxPlayers(
  socket: Socket,
  room: RoomState,
  maxCapacity: number
): boolean {
  if (room.players.length >= maxCapacity) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: "Room is full.",
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
  expectedPhase: string
): boolean {
  if (room.game.phase !== expectedPhase) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: `This action is only allowed during ${expectedPhase} phase.`,
    });
    return false;
  }
  return true;
}

/**
 * Validate round ID matches current round.
 * Emits error and returns false if round IDs don't match.
 */
export function validateRoundId(
  socket: Socket,
  room: RoomState,
  roundId: string
): boolean {
  if (!room.game.roundId || room.game.roundId !== roundId) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, { message: "Round ID mismatch." });
    return false;
  }
  return true;
}

/**
 * Validate round hasn't ended (time-based).
 * Emits error and returns false if round has ended.
 */
export function validateRoundNotEnded(
  socket: Socket,
  room: RoomState
): boolean {
  if (room.game.endsAt && Date.now() > room.game.endsAt) {
    socket.emit(ERROR_EVENTS.BAD_REQUEST, {
      message: "Round already ended.",
    });
    return false;
  }
  return true;
}
