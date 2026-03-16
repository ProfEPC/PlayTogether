import type { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { registerRoomHandlers } from "./handlers/roomHandlers";
import { registerGameControlHandlers } from "./handlers/gameControlHandlers";
import { registerGameConfigHandlers } from "./handlers/gameConfigHandlers";
import { registerPlayerPhaseHandlers } from "./handlers/playerPhaseHandlers";
import { registerPlayerPowerHandlers } from "./handlers/playerPowerHandlers";
import { registerLifecycleHandlers } from "./handlers/lifecycleHandlers";

/**
 * Registers all socket event handlers for the PlayTogether game.
 *
 * Each handler module is registered exactly ONCE per socket to prevent
 * duplicate listeners (which would cause toggles to fire twice, etc.).
 *
 * Modules:
 * - roomHandlers:          Room creation, joining, leaving, moderation
 * - gameControlHandlers:   Start, reset, next round
 * - gameConfigHandlers:    Game selection, duration, max players, options
 * - playerPhaseHandlers:   Ready toggle, role ack, mayhem ack
 * - playerPowerHandlers:   Power usage
 * - lifecycleHandlers:     Connect / disconnect
 */
export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.socketConnected(socket.id);

    registerRoomHandlers(io, socket);
    registerGameControlHandlers(io, socket);
    registerGameConfigHandlers(io, socket);
    registerPlayerPhaseHandlers(io, socket);
    registerPlayerPowerHandlers(io, socket);
    registerLifecycleHandlers(io, socket);
  });
}
