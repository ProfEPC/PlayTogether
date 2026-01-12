import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const now = () => Date.now();

// ---- Room State (in-memory for now) ----
type GamePhase = "lobby" | "playing" | "results";

type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt: string | null;
  endsAt: number | null;
};

type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[];

  locked: boolean;
  game: GameState;
  settings: RoomSettings;

  updatedAt: number;
};

type GameKey = "infiltration" | "odd_one_out";

type Player = { socketId: string; name: string };

type RoomSettings = {
  roundDurationMs: number;
  gameKey: GameKey;
  maxPlayers: number;
};

const GAME_RULES: Record<
  GameKey,
  { minPlayers: number; maxPlayersCap: number }
> = {
  infiltration: { minPlayers: 2, maxPlayersCap: 8 }, // TODO: set your real min
  odd_one_out: { minPlayers: 2, maxPlayersCap: 6 }, // TODO: set your real min
};

const rooms = new Map<string, RoomState>();

function createRoom(roomCode: string): RoomState {
  const code = roomCode.trim().toUpperCase();
  const existing = rooms.get(code);
  if (existing) return existing;

  const defaultGame: GameKey = "infiltration";
  const cap = GAME_RULES[defaultGame].maxPlayersCap;

  const room: RoomState = {
    roomCode: code,
    hostSocketId: null,
    players: [],
    locked: false,
    game: { started: false, phase: "lobby", prompt: null, endsAt: null },
    settings: {
      roundDurationMs: 30_000,
      gameKey: defaultGame,
      maxPlayers: cap,
    },
    updatedAt: now(),
  };

  rooms.set(code, room);
  return room;
}

function getRoom(roomCode: string) {
  return rooms.get(roomCode.trim().toUpperCase());
}

function emitRoomState(roomCode: string) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  room.updatedAt = now();
  io.to(code).emit("room:state", room);
}

function removePlayerFromRoom(room: RoomState, socketId: string) {
  room.players = room.players.filter((p) => p.socketId !== socketId);
}

function findRoomsBySocketId(socketId: string): string[] {
  const hits: string[] = [];
  for (const [code, room] of rooms.entries()) {
    if (room.hostSocketId === socketId) hits.push(code);
    if (room.players.some((p) => p.socketId === socketId)) hits.push(code);
  }
  return hits;
}

function kickPlayer(
  io: Server,
  roomCode: string,
  targetSocketId: string,
  reason = "kicked"
) {
  const code = roomCode.trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) return;

  removePlayerFromRoom(room, targetSocketId);

  // Tell the kicked client
  io.to(targetSocketId).emit("room:kicked", { roomCode: code, reason });

  // Force them to leave the Socket.IO room
  const targetSocket = io.sockets.sockets.get(targetSocketId);
  if (targetSocket) targetSocket.leave(code);

  emitRoomState(code);
}

function closeRoom(code: string, reason: string) {
  const room = rooms.get(code);
  if (!room) return;

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

io.on("connection", (socket: Socket) => {
  console.log("socket connected:", socket.id);

  // Host claims a room
  socket.on("room:host", ({ roomCode }: { roomCode: string }) => {
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    const room = createRoom(code);

    room.hostSocketId = socket.id;
    socket.join(code);

    socket.emit("room:hosted", { roomCode: code, socketId: socket.id });
    emitRoomState(code);

    console.log(`${socket.id} is hosting ${code}`);
  });

  // Player joins a room
  socket.on(
    "room:join",
    ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      const code = roomCode.trim().toUpperCase();
      const name = playerName.trim();
      if (!code || !name) return;

      const room = getRoom(code);

      // ✅ Must exist AND be hosted
      if (!room || !room.hostSocketId) {
        socket.emit("room:joinDenied", {
          roomCode: code,
          reason: "Room is not being hosted.",
        });
        return;
      }

      if (room.locked || room.game.started) {
        socket.emit("room:joinDenied", {
          roomCode: code,
          reason: "Room is locked or already started.",
        });
        return;
      }

      // ✅ Enforce max players
      if (room.players.length >= room.settings.maxPlayers) {
        socket.emit("room:joinDenied", {
          roomCode: code,
          reason: "Room is full.",
        });
        return;
      }

      removePlayerFromRoom(room, socket.id);
      room.players.push({ socketId: socket.id, name });

      socket.join(code);

      socket.emit("room:joined", { roomCode: code, socketId: socket.id });
      socket
        .to(code)
        .emit("room:playerJoined", { roomCode: code, playerName: name });

      emitRoomState(code);
    }
  );

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);

    const affectedRooms = findRoomsBySocketId(socket.id);

    for (const code of affectedRooms) {
      const room = rooms.get(code);
      if (!room) continue;

      // If host left, clear host
      if (room.hostSocketId === socket.id) {
        closeRoom(code, "Host disconnected");
        continue; // room is deleted, skip emitRoomState
      }

      removePlayerFromRoom(room, socket.id);

      // If room is totally empty, delete it
      const hasAnyone = room.hostSocketId !== null || room.players.length > 0;
      if (!hasAnyone) {
        rooms.delete(code);
        console.log(`Deleted empty room ${code}`);
        continue;
      }

      emitRoomState(code);
    }
  });

  socket.on(
    "room:kick",
    ({
      roomCode,
      targetSocketId,
    }: {
      roomCode: string;
      targetSocketId: string;
    }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      // Auth: only the host can kick
      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can kick players.",
        });
        return;
      }

      kickPlayer(io, code, targetSocketId, "kicked by host");
      socket
        .to(code)
        .emit("room:playerKicked", { roomCode: code, targetSocketId });
    }
  );

  socket.on(
    "room:setLocked",
    ({ roomCode, locked }: { roomCode: string; locked: boolean }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can lock/unlock.",
        });
        return;
      }

      room.locked = locked;
      emitRoomState(code);
    }
  );

  socket.on("game:start", ({ roomCode }: { roomCode: string }) => {
    const code = roomCode.trim().toUpperCase();
    const room = getRoom(code);
    if (!room) return;

    if (room.hostSocketId !== socket.id) {
      socket.emit("error:forbidden", {
        message: "Only host can start the game.",
      });
      return;
    }

    const rules = GAME_RULES[room.settings.gameKey];

    if (room.players.length < rules.minPlayers) {
      socket.emit("error:badRequest", {
        message: `Need at least ${rules.minPlayers} players to start ${room.settings.gameKey}.`,
      });
      return;
    }

    room.game.started = true;
    room.game.phase = "playing";
    room.game.prompt = "Pick your answer! (placeholder prompt)";
    room.game.endsAt = now() + room.settings.roundDurationMs;

    emitRoomState(code);
  });

  socket.on("game:reset", ({ roomCode }: { roomCode: string }) => {
    const code = roomCode.trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return;

    if (room.hostSocketId !== socket.id) {
      socket.emit("error:forbidden", {
        message: "Only host can reset the game.",
      });
      return;
    }

    room.locked = false;
    room.game.started = false;
    room.game.phase = "lobby";
    room.game.prompt = null;
    room.game.endsAt = null;

    emitRoomState(code);
  });

  socket.on("room:close", ({ roomCode }: { roomCode: string }) => {
    const code = roomCode.trim().toUpperCase();
    const room = getRoom(code);
    if (!room) return;

    if (room.hostSocketId !== socket.id) {
      socket.emit("error:forbidden", {
        message: "Only host can close the room.",
      });
      return;
    }

    closeRoom(code, "Host ended the session");
  });

  socket.on(
    "game:select",
    ({ roomCode, gameKey }: { roomCode: string; gameKey: GameKey }) => {
      const code = roomCode.trim().toUpperCase();
      const room = getRoom(code);
      if (!room) return;

      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can select game.",
        });
        return;
      }

      if (room.game.started) {
        socket.emit("error:badRequest", {
          message: "Cannot change game while running.",
        });
        return;
      }

      room.settings.gameKey = gameKey;

      const { maxPlayersCap } = GAME_RULES[gameKey];
      // clamp current maxPlayers down to the new cap if needed
      room.settings.maxPlayers = Math.min(
        room.settings.maxPlayers,
        maxPlayersCap
      );

      emitRoomState(code);
    }
  );

  socket.on(
    "game:setDuration",
    ({ roomCode, seconds }: { roomCode: string; seconds: number }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can change the duration.",
        });
        return;
      }
      if (room.game.started) {
        socket.emit("error:badRequest", {
          message: "Cannot change duration while game is running.",
        });
        return;
      }

      // Basic validation: 5s to 300s (adjust as you like)
      const s = Math.floor(seconds);
      if (!Number.isFinite(s) || s < 5 || s > 300) {
        socket.emit("error:badRequest", {
          message: "Duration must be between 5 and 300 seconds.",
        });
        return;
      }

      room.settings.roundDurationMs = s * 1000;

      // Decision: apply to next round only (simple + predictable)
      // If you want it to affect the current round too, tell me and I’ll show that variant.
      emitRoomState(code);
    }
  );

  socket.on(
    "room:setMaxPlayers",
    ({ roomCode, maxPlayers }: { roomCode: string; maxPlayers: number }) => {
      const code = roomCode.trim().toUpperCase();
      const room = getRoom(code);
      if (!room) return;

      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can set max players.",
        });
        return;
      }

      if (room.game.started) {
        socket.emit("error:badRequest", {
          message: "Cannot change max players while game is running.",
        });
        return;
      }

      const rules = GAME_RULES[room.settings.gameKey];
      const hardCap = 8;
      const cap = Math.min(hardCap, rules.maxPlayersCap);

      const n = Math.floor(maxPlayers);
      if (!Number.isFinite(n)) return;

      // Minimum can be rules.minPlayers, or allow host to set below min but enforce on start.
      // Here: enforce min immediately.
      const clamped = Math.max(rules.minPlayers, Math.min(n, cap));

      room.settings.maxPlayers = clamped;

      emitRoomState(code);
    }
  );
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
