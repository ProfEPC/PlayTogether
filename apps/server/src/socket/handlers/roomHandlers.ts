import type { Server, Socket } from "socket.io";
import { now } from "../../utils/time";
import { logger } from "../../utils/logger";
import { normalizeRoomCode } from "../../utils/roomCode";
import {
  createRoomHosted,
  rooms,
  removePlayerFromRoom,
} from "../../state/rooms";
import { closeRoom, emitRoomState, kickPlayer } from "../roomActions";
import { ROOM_EVENTS, ERROR_EVENTS } from "../../constants/socketEvents";
import type { GameKey, RoomState } from "../../state/types";
import { validateRoom, validateIsHost } from "../validation";

/**
 * Register room management event handlers
 */
export function registerRoomHandlers(io: Server, socket: Socket) {
  // Host claims a room
  socket.on(
    ROOM_EVENTS.HOST,
    ({ roomCode, gameKey }: { roomCode: string; gameKey: GameKey }) => {
      const code = normalizeRoomCode(roomCode);
      if (!code) return;

      // createRoomHosted will return existing room if present
      const room = createRoomHosted(code, socket.id, gameKey);

      socket.join(room.roomCode);

      socket.emit(ROOM_EVENTS.HOSTED, {
        roomCode: room.roomCode,
        socketId: socket.id,
      });
      emitRoomState(io, room.roomCode);

      logger.roomHosted(socket.id, room.roomCode, gameKey);
    },
  );

  // Host closes the room
  socket.on(ROOM_EVENTS.CLOSE, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;

    closeRoom(io, room.roomCode, "Host ended the session");
  });

  // Player joins a room
  socket.on(
    ROOM_EVENTS.JOIN,
    ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      console.log(
        `[Join] Attempt: ${socket.id} joining ${roomCode} as ${playerName}`,
      );
      const room = validateRoom(roomCode);
      if (!room) {
        console.log(`[Join] Room not found: ${roomCode}`);
        return;
      }

      const name = playerName.trim();
      if (!name) {
        console.log(`[Join] Invalid name`);
        return;
      }

      // Must exist AND be hosted
      if (!room.hostSocketId) {
        console.log(`[Join] Room not hosted: ${roomCode}`);
        socket.emit(ROOM_EVENTS.JOIN_DENIED, {
          roomCode: room.roomCode,
          reason: "Room is not being hosted.",
        });
        return;
      }

      // If room requires approval to join, add to pending list instead of auto-joining
      if (room.settings.requireApprovalToJoin) {
        // Don't add duplicates
        const exists = room.pending.some((p: any) => p.socketId === socket.id);
        if (!exists) {
          room.pending.push({
            socketId: socket.id,
            name,
            requestedAt: now(),
          });
          socket.emit(ROOM_EVENTS.JOIN_PENDING, { roomCode: room.roomCode });
          // Notify host/room of updated state
          emitRoomState(io, room.roomCode);
        }
        return;
      }

      if (room.locked || room.game.started) {
        socket.emit(ROOM_EVENTS.JOIN_DENIED, {
          roomCode: room.roomCode,
          reason: "Room is locked or already started.",
        });
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit(ROOM_EVENTS.JOIN_DENIED, {
          roomCode: room.roomCode,
          reason: "Room is full.",
        });
        return;
      }

      removePlayerFromRoom(room, socket.id);
      const ts = now();
      room.players.push({
        socketId: socket.id,
        name,
        ready: false,
        connectedAt: ts,
        lastSeenAt: ts,
      });

      socket.join(room.roomCode);

      console.log(`[Join] Success: ${socket.id} joined ${roomCode}`);
      console.log(`[Join] Room now has ${room.players.length} players`);
      console.log(`[Join] Emitting room:joined to ${socket.id}`);
      socket.emit(ROOM_EVENTS.JOINED, {
        roomCode: room.roomCode,
        socketId: socket.id,
      });
      socket.to(room.roomCode).emit("room:playerJoined", {
        roomCode: room.roomCode,
        playerName: name,
      });

      console.log(`[Join] Calling emitRoomState for ${room.roomCode}`);
      emitRoomState(io, room.roomCode);
    },
  );

  // Host kicks a player
  socket.on(
    "room:kick",
    ({
      roomCode,
      targetSocketId,
    }: {
      roomCode: string;
      targetSocketId: string;
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      kickPlayer(io, room.roomCode, targetSocketId, "kicked by host");
      socket.to(room.roomCode).emit("room:playerKicked", {
        roomCode: room.roomCode,
        targetSocketId,
      });
    },
  );

  // Host approves a pending join
  socket.on(
    "room:approveJoin",
    ({
      roomCode,
      targetSocketId,
    }: {
      roomCode: string;
      targetSocketId: string;
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      const idx = room.pending.findIndex(
        (p: any) => p.socketId === targetSocketId,
      );
      if (idx === -1) return;

      const pending = room.pending.splice(idx, 1)[0];

      const ts = now();
      room.players.push({
        socketId: pending.socketId,
        name: pending.name,
        ready: false,
        connectedAt: ts,
        lastSeenAt: ts,
      });

      // Attempt to notify the joining socket and join them to the room
      const target = io.sockets.sockets.get(targetSocketId) as
        | Socket
        | undefined;
      if (target) {
        target.join(room.roomCode);
        target.emit("room:joined", {
          roomCode: room.roomCode,
          socketId: targetSocketId,
        });
        socket.to(room.roomCode).emit("room:playerJoined", {
          roomCode: room.roomCode,
          playerName: pending.name,
        });
      }

      emitRoomState(io, room.roomCode);
    },
  );

  // Host toggles requireApprovalToJoin
  socket.on(
    "room:setRequireApproval",
    ({
      roomCode,
      requireApproval,
    }: {
      roomCode: string;
      requireApproval: boolean;
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      room.settings.requireApprovalToJoin = !!requireApproval;
      emitRoomState(io, room.roomCode);
    },
  );

  // Host locks/unlocks room
  socket.on(
    "room:setLocked",
    ({ roomCode, locked }: { roomCode: string; locked: boolean }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      room.locked = locked;
      emitRoomState(io, room.roomCode);
    },
  );

  // Player leaves the room
  socket.on(ROOM_EVENTS.LEAVE, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p: any) => p.socketId === socket.id);
    if (!player) return;

    removePlayerFromRoom(room, socket.id);
    socket.leave(room.roomCode);
    socket.emit(ROOM_EVENTS.LEFT, { roomCode: room.roomCode });

    const hasAnyone = room.hostSocketId !== null || room.players.length > 0;
    if (!hasAnyone) {
      rooms.delete(room.roomCode);
      logger.roomDeleted(room.roomCode);
      return;
    }

    emitRoomState(io, room.roomCode);
  });
}
