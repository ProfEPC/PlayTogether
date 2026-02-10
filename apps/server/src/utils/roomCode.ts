/**
 * Normalize a room code by trimming whitespace and converting to uppercase.
 * This ensures consistent room code handling across the application.
 */
export function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}
