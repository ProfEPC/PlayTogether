/**
 * Host Room Actions
 * Handles socket emissions for host room operations (select/host, close) and room code generation
 */

import type { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../shared/roomCodeNormalize";

/**
 * Generate a random 4-character room code
 * Uses alphanumeric characters excluding O/0 and I/1 to avoid confusion
 * @returns A random 4-character room code in uppercase
 */
export function makeRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid O/0, I/1
  let out = "";
  for (let i = 0; i < 4; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Select a game type and host a room
 * @param socket - Socket.io client instance
 * @param roomCode - The room code to use
 * @param gameKey - The game type to host ("infiltration" or "odd_one_out")
 * @param onStatusUpdate - Callback to update status message
 */
export function selectAndHostGameAction(
  socket: Socket,
  roomCode: string,
  gameKey: "infiltration" | "odd_one_out",
  onStatusUpdate: (status: string) => void
) {
  const code = normalizeRoomCode(roomCode);
  onStatusUpdate("Starting host...");
  socket.emit("room:host", { roomCode: code, gameKey: gameKey });
}

/**
 * Close the hosted room
 * @param socket - Socket.io client instance
 * @param roomCode - The room code to close
 * @param onStatusUpdate - Callback to update status message
 */
export function closeRoomAction(
  socket: Socket,
  roomCode: string,
  onStatusUpdate: (status: string) => void
) {
  const code = normalizeRoomCode(roomCode);
  socket.emit("room:close", { roomCode: code });
  onStatusUpdate("Closing room...");
}
