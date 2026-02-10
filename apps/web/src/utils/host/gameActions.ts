/**
 * Host Game Actions
 * Handles socket emissions for game lifecycle management (start/end game)
 */

import type { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../shared/roomCodeNormalize";

/**
 * Start a game in the current room
 * @param socket - Socket.io client instance
 * @param roomCode - The room code
 */
export function startGameAction(socket: Socket, roomCode: string) {
  const code = normalizeRoomCode(roomCode);
  if (!code) return;
  socket.emit("game:start", { roomCode: code });
}

/**
 * End the current game and reset to lobby
 * @param socket - Socket.io client instance
 * @param roomCode - The room code
 */
export function endGameAction(socket: Socket, roomCode: string) {
  const code = normalizeRoomCode(roomCode);
  if (!code) return;
  socket.emit("game:reset", { roomCode: code });
}
