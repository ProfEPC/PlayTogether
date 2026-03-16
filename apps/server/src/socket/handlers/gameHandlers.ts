/**
 * Game Handlers Index
 * Central registration point for all game-related event handlers
 */

import type { Server, Socket } from "socket.io";
import { registerGameControlHandlers } from "./gameControlHandlers";
import { registerGameConfigHandlers } from "./gameConfigHandlers";
import { registerPlayerPhaseHandlers } from "./playerPhaseHandlers";
import { registerPlayerPowerHandlers } from "./playerPowerHandlers";

/**
 * Register all game event handlers
 */
export function registerGameHandlers(io: Server, socket: Socket) {
  registerGameControlHandlers(io, socket);
  registerGameConfigHandlers(io, socket);
  // NOTE: playerPhaseHandlers and playerPowerHandlers are registered
  // directly in registerSocketHandlers — do NOT register them here
  // to avoid duplicate listeners on the same socket.
}

/**
 * Register vote handlers — kept for API compatibility.
 * playerPowerHandlers is already registered in registerSocketHandlers,
 * so this is intentionally a no-op to avoid duplicate listeners.
 */
export function registerSubmissionHandlers(_io: Server, _socket: Socket) {
  // no-op — power vote is registered via registerSocketHandlers
}
