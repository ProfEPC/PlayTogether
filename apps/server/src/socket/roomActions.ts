import type { Server } from "socket.io";
import { now } from "../utils/time";
import { rooms, removePlayerFromRoom } from "../state/rooms";

const phaseTimers = new Map<string, NodeJS.Timeout>();

function clearPhaseTimer(roomCode: string) {
  const t = phaseTimers.get(roomCode);
  if (t) clearTimeout(t);
  phaseTimers.delete(roomCode);
}

export function emitRoomState(io: Server, roomCode: string) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  room.updatedAt = now();

  // Prepare public room state; expose roles only during results phase
  const publicRoom = JSON.parse(JSON.stringify(room));
  if (publicRoom.game) {
    if (publicRoom.game.phase === "results") {
      // expose the private roles map and unused roles for disclosure in results
      publicRoom.game.roles = room.game._roles || {};
      publicRoom.game.unusedRoles = room.game.unusedRoles || [];
    }
    delete publicRoom.game._roles;
  }
  io.to(code).emit("room:state", publicRoom);
}

export function kickPlayer(
  io: Server,
  roomCode: string,
  targetSocketId: string,
  reason = "kicked"
) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  removePlayerFromRoom(room, targetSocketId);

  io.to(targetSocketId).emit("room:kicked", { roomCode: code, reason });

  const targetSocket = io.sockets.sockets.get(targetSocketId);
  if (targetSocket) targetSocket.leave(code);

  emitRoomState(io, code);
}

export function startPhaseTimer(
  io: Server,
  roomCode: string,
  roundId: string,
  durationMs: number,
  onExpire: (roomCode: string) => void
) {
  const code = roomCode.trim().toUpperCase();
  clearPhaseTimer(code);

  const t = setTimeout(() => {
    const room = rooms.get(code);
    if (!room) return;
    if (room.game.roundId !== roundId) return; // ignore stale timers
    onExpire(code);
  }, durationMs);

  phaseTimers.set(code, t);
}

export function endRound(io: Server, roomCode: string, reason: string) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  clearPhaseTimer(code);

  // Determine winner for infiltration
  if (room.settings.gameKey === "infiltration") {
    const counts: Record<string, number> = {};
    for (const sub of Object.values(room.game.submissions ?? {})) {
      counts[sub.value] = (counts[sub.value] || 0) + 1;
    }

    // find top-voted option
    let topId: string | null = null;
    let topCount = -1;
    for (const [id, c] of Object.entries(counts)) {
      if (c > topCount) {
        topCount = c;
        topId = id;
      }
    }

    if (!topId) {
      room.game.winner = "none";
    } else if (topId === "none") {
      // crew failed to identify an infiltrator
      room.game.winner = "infiltrators";
    } else {
      const isInfil = room.game._roles?.[topId] === "infiltrator";
      room.game.winner = isInfil ? "crew" : "infiltrators";
    }
  }

  room.game.phase = "results";
  room.game.endsAt = null;

  console.log(`Round ended for ${code}: ${reason}`);
  emitRoomState(io, code);
}

export function closeRoom(io: Server, roomCode: string, reason: string) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  // ✅ IMPORTANT: clear any pending timers
  clearPhaseTimer(code);

  const memberIds = Array.from(io.sockets.adapter.rooms.get(code) ?? []);

  for (const sid of memberIds) {
    io.to(sid).emit("room:closed", { roomCode: code, reason });
  }

  for (const sid of memberIds) {
    const s = io.sockets.sockets.get(sid);
    if (s) s.leave(code);
  }

  rooms.delete(code);
  console.log(`Closed room ${code} (${reason})`);
}
