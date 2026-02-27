/**
 * Player Room Actions
 * Handles socket emissions for player room operations (join, leave, ready toggle)
 */

import type { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../shared/roomCodeNormalize";
import type { RoomState } from "../../types/room";

interface Player {
  name: string;
  ready: boolean;
  socketId: string;
}

/**
 * Join a room with player name
 * @param socket - Socket.io client instance
 * @param roomCode - The room code to join
 * @param playerName - The player's display name
 * @param onStatusUpdate - Callback to update status message
 */
export function joinRoomAction(
  socket: Socket,
  roomCode: string,
  playerName: string,
  onStatusUpdate: (status: string) => void,
) {
  const code = normalizeRoomCode(roomCode);
  if (!code || !playerName.trim()) return;
  console.log("[Client] Socket connected?", socket.connected);
  console.log("[Client] Socket ID:", socket.id);
  console.log("[Client] Sending room:join:", { roomCode: code, playerName });
  socket.emit("room:join", { roomCode: code, playerName: playerName });
  onStatusUpdate("Requesting to join room...");
}

/**
 * Leave the current room
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 * @param onStatusUpdate - Callback to update status message
 * @param onRoomStateUpdate - Callback to clear room state
 */
export function leaveRoomAction(
  socket: Socket,
  roomState: RoomState | null,
  onStatusUpdate: (status: string) => void,
  onRoomStateUpdate: (state: RoomState | null) => void,
) {
  if (roomState) socket.emit("room:leave", { roomCode: roomState.roomCode });
  onStatusUpdate("Player Left the Room");
  onRoomStateUpdate(null);
}

/**
 * Toggle player ready status
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 * @param myPlayer - Current player
 * @param onStatusUpdate - Callback to update status message
 */
export function togglePlayerReadyAction(
  socket: Socket,
  roomState: RoomState | null,
  myPlayer: Player | null,
  onStatusUpdate: (status: string) => void,
) {
  if (!roomState || !myPlayer) return;
  socket.emit("player:setReady", {
    roomCode: roomState.roomCode,
  });
  onStatusUpdate(
    `${myPlayer.name} is now ${!myPlayer.ready ? "ready" : "not ready"}`,
  );
}
