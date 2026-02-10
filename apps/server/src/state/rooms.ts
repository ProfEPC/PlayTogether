import { now } from "../utils/time";
import { GAME_RULES } from "./gameRules";
import type { GameKey, RoomState } from "./types";

export const rooms = new Map<string, RoomState>();

export function createRoomHosted(
  roomCode: string,
  hostSocketId: string,
  gameKey: GameKey
): RoomState {
  const code = roomCode.trim().toUpperCase();
  const existing = rooms.get(code);
  if (existing) return existing;

  const cap = GAME_RULES[gameKey].maxPlayersCap;

  const room: RoomState = {
    roomCode: code,
    hostSocketId,

    players: [],
    pending: [],

    locked: false,
    game: {
      started: false,
      phase: "lobby",
      prompt: null,
      endsAt: null,
      roundId: null,
      submissions: {},
      _roles: {},
      unusedRoles: [],
      rolesAck: {},
      winner: undefined,
    },

    settings: {
      gameKey,
      maxPlayers: cap,

      roundDurationMs: 30_000,
      resultsDurationMs: 10_000,
      autoAdvance: true,
      lockOnStart: true,

      requireApprovalToJoin: false,
      uniqueNames: true,
      allowRenameInLobby: true,
      requireAllReady: false,

      gameOptions: {
        infiltration: { allowNoInfiltrator: true, revealVotes: true },
        odd_one_out: { revealVotes: true },
      },
    },

    updatedAt: now(),
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(roomCode: string): RoomState | undefined {
  return rooms.get(roomCode.trim().toUpperCase());
}

export function removePlayerFromRoom(room: RoomState, socketId: string) {
  room.players = room.players.filter((p) => p.socketId !== socketId);
}

export function findRoomsBySocketId(socketId: string): string[] {
  const hits: string[] = [];
  for (const [code, room] of rooms.entries()) {
    if (room.hostSocketId === socketId) hits.push(code);
    if (room.players.some((p) => p.socketId === socketId)) hits.push(code);
  }
  return hits;
}
