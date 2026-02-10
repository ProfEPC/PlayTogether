import type { Server, Socket } from "socket.io";
import { logger } from "../../utils/logger";
import {
  rooms,
  removePlayerFromRoom,
  findRoomsBySocketId,
} from "../../state/rooms";
import { closeRoom, emitRoomState } from "../roomActions";

/**
 * Register connection lifecycle handlers
 */
export function registerLifecycleHandlers(io: Server, socket: Socket) {
  // Handle socket disconnection
  socket.on("disconnect", () => {
    logger.socketDisconnected(socket.id);

    const affectedRooms = findRoomsBySocketId(socket.id);

    for (const code of affectedRooms) {
      const room = rooms.get(code);
      if (!room) continue;

      // If host left, close room entirely (rooms exist only while hosted)
      if (room.hostSocketId === socket.id) {
        closeRoom(io, room.roomCode, "Host disconnected");
        continue;
      }

      removePlayerFromRoom(room, socket.id);

      const hasAnyone = room.hostSocketId !== null || room.players.length > 0;
      if (!hasAnyone) {
        rooms.delete(room.roomCode);
        logger.roomDeleted(room.roomCode);
        continue;
      }

      emitRoomState(io, room.roomCode);
    }
  });
}
