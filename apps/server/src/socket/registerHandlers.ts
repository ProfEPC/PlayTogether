import type { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { registerRoomHandlers } from "./handlers/roomHandlers";
import {
  registerGameHandlers,
  registerPlayerHandlers,
  registerSubmissionHandlers,
} from "./handlers/gameHandlers";
import { registerLifecycleHandlers } from "./handlers/lifecycleHandlers";

/**
 * Registers all socket event handlers for the PlayTogether game
 *
 * Handlers are organized into logical modules:
 * - roomHandlers: Room creation, joining, leaving, moderation
 * - gameHandlers: Game control (start, reset, settings) and player actions
 * - lifecycleHandlers: Connection/disconnection events
 */
export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    logger.socketConnected(socket.id);

    // Register all handler types
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerPlayerHandlers(io, socket);
    registerSubmissionHandlers(io, socket);
    registerLifecycleHandlers(io, socket);
  });
}
