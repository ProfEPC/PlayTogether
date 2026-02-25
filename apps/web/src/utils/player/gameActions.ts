/**
 * Player Game Actions
 * Handles socket emissions for player game phase interactions (voting, powers, acknowledgments)
 */

import type { Socket } from "socket.io-client";
import type { RoomState, InfiltrationRole } from "../../types/room";

/**
 * Submit a vote for the voting phase
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 * @param selectedVote - The player or option being voted for
 * @param onStatusUpdate - Callback to update status message
 * @param onSubmissionUpdate - Callback to record that vote was submitted
 */
export function submitVoteAction(
  socket: Socket,
  roomState: RoomState | null,
  selectedVote: string | null,
  onStatusUpdate: (status: string) => void,
  onSubmissionUpdate: (submission: { value: string }) => void,
) {
  if (!roomState || !selectedVote || !roomState.game.gameId) return;
  socket.emit("game:submit", {
    roomCode: roomState.roomCode,
    gameId: roomState.game.gameId,
    value: selectedVote,
  });
  onSubmissionUpdate({ value: selectedVote });
  onStatusUpdate("Vote submitted");
}

/**
 * Acknowledge that the player has seen their assigned role
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 * @param myRole - The player's assigned role
 * @param onStatusUpdate - Callback to update status message
 */
export function acknowledgeRoleAction(
  socket: Socket,
  roomState: RoomState | null,
  myRole: InfiltrationRole | null,
  onStatusUpdate: (status: string) => void,
) {
  if (!roomState || !myRole) return;
  socket.emit("player:ackRole", {
    roomCode: roomState.roomCode,
    seen: true,
  });
  onStatusUpdate("Acknowledged role");
}

/**
 * Acknowledge that the player is ready to move to voting phase
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 */
export function acknowledgeMayhemAction(
  socket: Socket,
  roomState: RoomState | null,
) {
  if (!roomState) return;
  socket.emit("player:ackMayhem", {
    roomCode: roomState.roomCode,
  });
}

/**
 * Use a special power during mayhem phase
 * @param socket - Socket.io client instance
 * @param roomState - Current room state
 * @param powerType - The type of power (viewUnused, viewPlayerRole, viewPlayerTeam)
 * @param target - The target (unused role index or player socket ID)
 */
export function sendPowerAction(
  socket: Socket,
  roomState: RoomState | null,
  powerType: string,
  target: string,
) {
  if (!roomState) return;
  socket.emit("player:usePower", {
    roomCode: roomState.roomCode,
    type: powerType,
    target,
  });
}
