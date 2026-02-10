import type { Server, Socket } from "socket.io";
import { GAME_RULES } from "../state/gameRules";
import type { GameKey } from "../state/types";
import { now } from "../utils/time";
import {
  createRoomHosted,
  getRoom,
  rooms,
  removePlayerFromRoom,
  findRoomsBySocketId,
} from "../state/rooms";
import {
  closeRoom,
  emitRoomState,
  kickPlayer,
  endRound,
  startPhaseTimer,
} from "./roomActions";

function makeRoundId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("socket connected:", socket.id);

    const MAYHEM_MS = 5_000;

    function beginMayhem(io: Server, code: string, room: any) {
      room.game.started = true;
      room.game.phase = "mayhem";
      room.game.prompt = "MAYHEM ROUND: actions happening... (placeholder)";
      room.game.submissions = {};
      room.game.roundId = makeRoundId();
      room.game.endsAt = Date.now() + MAYHEM_MS;

      startPhaseTimer(io, code, room.game.roundId, MAYHEM_MS, (roomCode) => {
        const r = getRoom(roomCode);
        if (!r) return;
        beginVoting(io, roomCode, r);
      });

      emitRoomState(io, code);
    }

    function beginRoleReveal(io: Server, code: string, room: any) {
      // Assign roles for infiltration: pick 2 random infiltrators, rest are civilians
      const ids = room.players.map((p: any) => p.socketId);
      const shuffled = ids.slice().sort(() => Math.random() - 0.5);
      const infiltrators = shuffled.slice(0, 2);
      const roles: Record<string, "infiltrator" | "civilian"> = {};
      for (const id of ids) roles[id] = "civilian";
      for (const id of infiltrators) roles[id] = "infiltrator";
      room.game._roles = roles;
      room.game.rolesAck = {};

      // Send the player their role privately
      for (const p of room.players) {
        const role = roles[p.socketId];
        io.to(p.socketId).emit("player:role", { role });
      }

      room.game.phase = "reveal";
      room.game.prompt = "Role reveal: acknowledge when you've seen your role.";

      emitRoomState(io, code);
    }

    function beginVoting(io: Server, code: string, room: any) {
      room.game.phase = "voting";
      room.game.prompt =
        "VOTE: Who is the infiltrator? (or choose No Infiltrator)";
      room.game.submissions = {};
      room.game.roundId = makeRoundId();
      room.game.endsAt = Date.now() + room.settings.roundDurationMs;

      // clear previous results/winner for the upcoming round
      room.game.winner = undefined;

      startPhaseTimer(
        io,
        code,
        room.game.roundId,
        room.settings.roundDurationMs,
        (roomCode) => {
          endRound(io, roomCode, "timer");
        }
      );

      emitRoomState(io, code);
    }

    // Host claims a room
    socket.on("room:host", ({ roomCode }: { roomCode: string }) => {
      const code = roomCode.trim().toUpperCase();
      if (!code) return;

      // createRoomHosted will return existing room if present
      const room = createRoomHosted(code, socket.id, "infiltration");

      socket.join(code);

      socket.emit("room:hosted", { roomCode: code, socketId: socket.id });
      emitRoomState(io, code);

      console.log(`${socket.id} is hosting ${code}`);
    });

    // New: player acknowledges they've seen their role
    socket.on(
      "player:ackRole",
      ({ roomCode, seen }: { roomCode: string; seen: boolean }) => {
        const code = roomCode.trim().toUpperCase();
        const room = getRoom(code);
        if (!room) return;

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) return;

        room.game.rolesAck = room.game.rolesAck || {};
        room.game.rolesAck[socket.id] = !!seen;
        emitRoomState(io, code);

        // If all players have acknowledged, proceed to mayhem
        const allAck =
          room.players.length > 0 &&
          room.players.every((p) => !!room.game.rolesAck?.[p.socketId]);
        if (allAck) {
          beginMayhem(io, code, room);
        }
      }
    );

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

      closeRoom(io, code, "Host ended the session");
    });

    // Player joins a room
    socket.on(
      "room:join",
      ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
        const code = roomCode.trim().toUpperCase();
        const name = playerName.trim();
        if (!code || !name) return;

        const room = getRoom(code);

        // Must exist AND be hosted
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

        if (room.players.length >= room.settings.maxPlayers) {
          socket.emit("room:joinDenied", {
            roomCode: code,
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

        socket.join(code);

        socket.emit("room:joined", { roomCode: code, socketId: socket.id });
        socket
          .to(code)
          .emit("room:playerJoined", { roomCode: code, playerName: name });

        emitRoomState(io, code);
      }
    );

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
      "room:leave",
      ({ roomCode }: { roomCode: string }) => {
        const code = roomCode.trim().toUpperCase();
        const room = getRoom(code);
        if (!room) return;

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) return;

        removePlayerFromRoom(room, socket.id);
        socket.leave(code);
        socket.emit("room:left", { roomCode: code });

        const hasAnyone = room.hostSocketId !== null || room.players.length > 0;
        if (!hasAnyone) {
          rooms.delete(code);
          console.log(`Deleted empty room ${code}`);
          return;
        }

        emitRoomState(io, code);
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
        emitRoomState(io, code);
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

      // Disallow starting if any joined player is not ready
      if (room.players.some((p) => !p.ready)) {
        socket.emit("error:badRequest", {
          message: "Not all players are ready.",
        });
        return;
      }

      // For infiltration, start with a role reveal phase that requires ack from all players
      if (room.settings.gameKey === "infiltration") {
        // Build a pool of roles: exactly 2 infiltrators and (players + 1) civilians
        const ids = room.players.map((p: any) => p.socketId);
        const pool: Array<"infiltrator" | "civilian"> = [];
        pool.push("infiltrator");
        pool.push("infiltrator");
        for (let i = 0; i < ids.length + 1; i++) pool.push("civilian"); // total pool size = players + 3

        // Shuffle pool and player ids then deal roles
        const shuffledPool = pool.slice().sort(() => Math.random() - 0.5);
        const shuffledPlayers = ids.slice().sort(() => Math.random() - 0.5);

        const roles: Record<string, "infiltrator" | "civilian"> = {};
        for (let i = 0; i < shuffledPlayers.length; i++) {
          roles[shuffledPlayers[i]] = shuffledPool[i];
        }

        // remaining roles (should be exactly 3)
        const remaining = shuffledPool.slice(shuffledPlayers.length);

        room.game._roles = roles; // private server-side
        room.game.unusedRoles = remaining;
        room.game.rolesAck = {};

        // send each player their own role privately
        for (const p of room.players) {
          const role = roles[p.socketId];
          io.to(p.socketId).emit("player:role", { role });
        }

        room.game.phase = "reveal";
        room.game.prompt =
          "Role reveal: acknowledge when you've seen your role.";
        emitRoomState(io, code);
        return;
      }

      beginMayhem(io, code, room);
    });

    // Player sets their ready state
    socket.on(
      "player:setReady",
      ({ roomCode, ready }: { roomCode: string; ready: boolean }) => {
        const code = roomCode.trim().toUpperCase();
        const room = getRoom(code);
        if (!room) return;

        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) return;

        player.ready = !!ready;
        player.lastSeenAt = Date.now();

        emitRoomState(io, code);
      }
    );

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
      room.game.roundId = null;
      room.game.submissions = {};
      room.game._roles = {};
      room.game.unusedRoles = [];
      room.game.rolesAck = {};
      room.game.winner = undefined;

      emitRoomState(io, code);
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
        room.settings.maxPlayers = Math.min(
          room.settings.maxPlayers,
          maxPlayersCap
        );

        emitRoomState(io, code);
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

        const s = Math.floor(seconds);
        if (!Number.isFinite(s) || s < 5 || s > 300) {
          socket.emit("error:badRequest", {
            message: "Duration must be between 5 and 300 seconds.",
          });
          return;
        }

        room.settings.roundDurationMs = s * 1000;
        emitRoomState(io, code);
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

        const clamped = Math.max(rules.minPlayers, Math.min(n, cap));
        room.settings.maxPlayers = clamped;

        emitRoomState(io, code);
      }
    );

    socket.on(
      "game:submit",
      ({
        roomCode,
        roundId,
        value,
      }: {
        roomCode: string;
        roundId: string;
        value: string;
      }) => {
        const code = roomCode.trim().toUpperCase();
        const room = getRoom(code);
        if (!room) return;

        // Must be a player in this room
        const isPlayer = room.players.some((p) => p.socketId === socket.id);
        if (!isPlayer) {
          socket.emit("error:forbidden", {
            message: "Only players in the room can submit.",
          });
          return;
        }

        if (!room.game.started || room.game.phase !== "voting") {
          socket.emit("error:badRequest", {
            message: "Not accepting votes right now.",
          });
          return;
        }

        if (!room.game.roundId || room.game.roundId !== roundId) {
          socket.emit("error:badRequest", { message: "Round ID mismatch." });
          return;
        }

        if (room.game.endsAt && Date.now() > room.game.endsAt) {
          socket.emit("error:badRequest", { message: "Round already ended." });
          return;
        }

        const cleaned = (value ?? "").trim();
        if (!cleaned) {
          socket.emit("error:badRequest", {
            message: "Submission cannot be empty.",
          });
          return;
        }
        const isValidVote =
          cleaned === "none" ||
          room.players.some((p) => p.socketId === cleaned);

        if (!isValidVote) {
          socket.emit("error:badRequest", { message: "Invalid vote option." });
          return;
        }

        // store / overwrite
        room.game.submissions[socket.id] = {
          value: cleaned,
          submittedAt: Date.now(),
        };
        emitRoomState(io, code);

        // If everyone has submitted, end early
        const submittedCount = Object.keys(room.game.submissions).length;
        const playerCount = room.players.length;

        if (playerCount > 0 && submittedCount >= playerCount) {
          endRound(io, code, "all submitted");
        }
      }
    );

    socket.on("game:nextRound", ({ roomCode }: { roomCode: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = getRoom(code);
      if (!room) return;

      if (room.hostSocketId !== socket.id) {
        socket.emit("error:forbidden", {
          message: "Only host can start the next round.",
        });
        return;
      }

      if (!room.game.started) {
        socket.emit("error:badRequest", {
          message: "Game has not started yet.",
        });
        return;
      }

      if (room.game.phase !== "results") {
        socket.emit("error:badRequest", {
          message: "Next round is only allowed from results.",
        });
        return;
      }

      // start another playing phase
      beginMayhem(io, code, room);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected:", socket.id);

      const affectedRooms = findRoomsBySocketId(socket.id);

      for (const code of affectedRooms) {
        const room = rooms.get(code);
        if (!room) continue;

        // If host left, close room entirely (rooms exist only while hosted)
        if (room.hostSocketId === socket.id) {
          closeRoom(io, code, "Host disconnected");
          continue;
        }

        removePlayerFromRoom(room, socket.id);

        const hasAnyone = room.hostSocketId !== null || room.players.length > 0;
        if (!hasAnyone) {
          rooms.delete(code);
          console.log(`Deleted empty room ${code}`);
          continue;
        }

        emitRoomState(io, code);
      }
    });
  });
}
