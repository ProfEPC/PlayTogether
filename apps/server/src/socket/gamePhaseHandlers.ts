import type { Server } from "socket.io";
import type { InfiltrationRole, RoomState } from "../state/types";
import { emitRoomState, endRound, startPhaseTimer } from "./roomActions";
import { logger } from "../utils/logger";
import {
  INFILTRATION_ROLES,
  SPECIAL_ROLE_INDICES,
  GAME_PHASES,
} from "../constants/roles";
import { POWER_EVENTS, PLAYER_EVENTS } from "../constants/socketEvents";
import { promptPlayerForPower, resetPlayerPowers } from "./powerLogic";

function makeRoundId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function beginMayhem(io: Server, code: string, room: RoomState) {
  const MAYHEM_MS = 5_000;
  room.game.started = true;
  room.game.phase = GAME_PHASES.MAYHEM;
  room.game.prompt =
    "MAYHEM ROUND: Take your actions and acknowledge when done.";
  room.game.submissions = {};
  room.game.roundId = makeRoundId();
  room.game.mayhemAck = {};
  // Track which players have used their special powers this round
  room.game.usedPowers = room.game.usedPowers || {};
  // Redacted summaries of power usage to show in the room (no sensitive details)
  room.game.powerSummary = [];

  // Prompt players who have special roles to take their action now
  for (const p of room.players) {
    const role: InfiltrationRole | undefined = room.game._roles?.[p.socketId];
    if (!role) continue;

    // Prompt all power-enabled roles
    if (
      role === INFILTRATION_ROLES.THIEF ||
      role === INFILTRATION_ROLES.HACKER ||
      role === INFILTRATION_ROLES.ENGINEER
    ) {
      promptPlayerForPower(io, p.socketId, role, room);
    }
  }

  // No timer - wait for all acknowledgments

  emitRoomState(io, code);
}

export function beginRoleReveal(io: Server, code: string, room: RoomState) {
  room.game.started = true;
  const ids = room.players.map((p) => p.socketId);
  const numPlayers = ids.length;
  const defaultOptions = {
    numInfiltrators: 2,
    // Default to all special roles enabled
    enabledRoleIds: [
      SPECIAL_ROLE_INDICES.THIEF,
      SPECIAL_ROLE_INDICES.HACKER,
      SPECIAL_ROLE_INDICES.ENGINEER,
    ],
  };
  const options = {
    ...defaultOptions,
    ...room.settings.gameOptions.infiltration,
  };

  logger.roleAssignment(
    room.roomCode,
    numPlayers,
    options.enabledRoleIds || []
  );

  // Build the role pool: infiltrators and special roles first, then civilians fill extra slots to reach numPlayers + 3
  const pool: InfiltrationRole[] = [];

  // Add infiltrators
  for (let i = 0; i < options.numInfiltrators; i++) {
    pool.push(INFILTRATION_ROLES.INFILTRATOR);
  }

  // Determine enabled role IDs (backwards compatible with legacy include* booleans)
  let enabledRoleIds: number[] = [];
  if (Array.isArray(options.enabledRoleIds)) {
    enabledRoleIds = options.enabledRoleIds;
  } else {
    // No legacy include flags supported; default to none
    enabledRoleIds = [];
  }

  // Add special roles if enabled via enabledRoleIds
  if (enabledRoleIds.includes(SPECIAL_ROLE_INDICES.THIEF))
    pool.push(INFILTRATION_ROLES.THIEF);
  if (enabledRoleIds.includes(SPECIAL_ROLE_INDICES.HACKER))
    pool.push(INFILTRATION_ROLES.HACKER);
  if (enabledRoleIds.includes(SPECIAL_ROLE_INDICES.ENGINEER))
    pool.push(INFILTRATION_ROLES.ENGINEER);

  // Fill remaining slots with civilians to reach numPlayers + 3 total roles
  const civiliansToAdd = Math.max(0, numPlayers + 3 - pool.length);
  for (let i = 0; i < civiliansToAdd; i++) {
    pool.push(INFILTRATION_ROLES.CIVILIAN);
  }

  console.log("Role pool before shuffle:", pool);

  // Shuffle the pool
  const shuffledPool = pool.sort(() => Math.random() - 0.5);

  logger.rolePool(shuffledPool);

  // Assign roles to player objects and emit privately
  for (let i = 0; i < numPlayers; i++) {
    const player = room.players[i];
    const role = shuffledPool[i];
    player.role = role;
    io.to(player.socketId).emit(PLAYER_EVENTS.ROLE, { role });
  }

  // The remaining roles are unused
  room.game.unusedRoles = shuffledPool.slice(numPlayers);

  room.game.phase = GAME_PHASES.REVEAL;
  room.game.prompt = "Role reveal: acknowledge when you've seen your role.";

  emitRoomState(io, code);
}

export function beginVoting(io: Server, code: string, room: RoomState) {
  const numInfil = room.settings.gameOptions.infiltration.numInfiltrators;
  room.game.phase = GAME_PHASES.VOTING;
  room.game.prompt =
    numInfil === 1
      ? "VOTE: Who is the infiltrator? (or choose No Infiltrator)"
      : `VOTE: Who is an infiltrator? (${numInfil} total, or choose No Infiltrator)`;
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
