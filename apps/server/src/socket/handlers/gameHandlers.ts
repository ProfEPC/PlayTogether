import type { Server, Socket } from "socket.io";
import { GAME_RULES } from "../../state/gameRules";
import type { GameKey, RoomState } from "../../state/types";
import { logger } from "../../utils/logger";
import { emitRoomState, endRound } from "../roomActions";
import {
  beginMayhem,
  beginRoleReveal,
  beginVoting,
} from "../gamePhaseHandlers";
import {
  GAME_EVENTS,
  ERROR_EVENTS,
  PLAYER_EVENTS,
  POWER_EVENTS,
} from "../../constants/socketEvents";
import { GAME_WINNERS } from "../../constants/roles";
import { getCharacterByName } from "../../api/characters";
import { executeCharacterPower, resetPlayerPowers } from "../powerLogic/index";
import {
  validateRoom,
  validateIsHost,
  validateGameNotStarted,
  validateGameStarted,
  validateGamePhase,
  validatePlayerInRoom,
  validateGameId,
  validateRoundNotEnded,
} from "../validation";

/**
 * Register game control event handlers
 */
export function registerGameHandlers(io: Server, socket: Socket) {
  // Host starts the game
  socket.on(GAME_EVENTS.START, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;

    const rules = GAME_RULES[room.settings.gameKey];

    if (room.players.length < rules.minPlayers) {
      socket.emit(ERROR_EVENTS.BAD_REQUEST, {
        message: `Need at least ${rules.minPlayers} players to start ${room.settings.gameKey}.`,
      });
      return;
    }

    // Disallow starting if any joined player is not ready
    if (room.players.some((p: any) => !p.ready)) {
      socket.emit(ERROR_EVENTS.BAD_REQUEST, {
        message: "Not all players are ready.",
      });
      return;
    }

    // For infiltration, validate character selection
    if (room.settings.gameKey === "infiltration") {
      const enabledRoles =
        room.settings.gameOptions.infiltration?.enabledRoles || [];
      const numInfiltrators =
        room.settings.gameOptions.infiltration?.numInfiltrators || 0;
      const requiredCharacters = room.players.length + 3; // 3 center roles

      if (enabledRoles.length !== requiredCharacters) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: `Need exactly ${requiredCharacters} characters selected (${room.players.length} players + 3 center). You have ${enabledRoles.length}.`,
        });
        return;
      }

      // Validate that numInfiltrators is valid
      if (numInfiltrators === 0) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message:
            "At least one infiltrator is required. Select at least one infiltrator team character.",
        });
        return;
      }

      if (numInfiltrators >= room.players.length) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: `Number of infiltrators (${numInfiltrators}) must be less than number of players (${room.players.length}).`,
        });
        return;
      }
    }

    // For infiltration, start with role reveal
    if (room.settings.gameKey === "infiltration") {
      beginRoleReveal(io, room.roomCode, room);
      return;
    }

    beginMayhem(io, room.roomCode, room);
  });

  // Host resets the game
  socket.on(GAME_EVENTS.RESET, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;

    room.locked = false;
    room.game.started = false;
    room.game.phase = "lobby";
    room.game.endsAt = null;
    room.game.gameId = null;
    room.game.winner = undefined;
    room.players.forEach((p: any) => {
      p.submission = undefined;
      p.role = undefined;
      p.roleAcknowledged = undefined;
      p.mayhemAcknowledged = undefined;
    });

    // Reset all powers
    resetPlayerPowers(room);

    emitRoomState(io, room.roomCode);
  });

  // Host selects the game type
  socket.on(
    "game:select",
    ({ roomCode, gameKey }: { roomCode: string; gameKey: GameKey }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change game while running.",
        });
        return;
      }

      room.settings.gameKey = gameKey;

      const { maxPlayersCap } = GAME_RULES[gameKey];
      room.settings.maxPlayers = Math.min(
        room.settings.maxPlayers,
        maxPlayersCap,
      );

      emitRoomState(io, room.roomCode);
    },
  );

  // Host sets round duration
  socket.on(
    GAME_EVENTS.SET_DURATION,
    ({ roomCode, seconds }: { roomCode: string; seconds: number }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change duration while game is running.",
        });
        return;
      }

      const s = Math.floor(seconds);
      if (!Number.isFinite(s) || s < 5 || s > 300) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Duration must be between 5 and 300 seconds.",
        });
        return;
      }

      room.settings.roundDurationMs = s * 1000;
      emitRoomState(io, room.roomCode);
    },
  );

  // Host sets max players
  socket.on(
    GAME_EVENTS.SET_MAX_PLAYERS,
    ({ roomCode, maxPlayers }: { roomCode: string; maxPlayers: number }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateIsHost(socket, room)) return;

      if (room.game.started) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Cannot change max players while game is running.",
        });
        return;
      }

      const rules =
        GAME_RULES[room.settings.gameKey as keyof typeof GAME_RULES];
      const hardCap = 8;
      const cap = Math.min(hardCap, rules.maxPlayersCap);

      const n = Math.floor(maxPlayers);
      if (!Number.isFinite(n)) return;

      const clamped = Math.max(rules.minPlayers, Math.min(n, cap));
      room.settings.maxPlayers = clamped;

      emitRoomState(io, room.roomCode);
    },
  );

  // Host sets infiltration game options
  socket.on(
    GAME_EVENTS.SET_INFILTRATION_OPTIONS,
    ({
      roomCode,
      numInfiltrators,
      enabledRoleIds,
      enabledRoles,
    }: {
      roomCode: string;
      numInfiltrators: 0 | 1 | 2;
      enabledRoleIds: number[];
      enabledRoles?: string[];
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      // Update host socket id in case of reconnect
      room.hostSocketId = socket.id;

      // Store enabled role ids and role names
      room.settings.gameOptions.infiltration = {
        ...room.settings.gameOptions.infiltration,
        numInfiltrators,
        enabledRoleIds: Array.isArray(enabledRoleIds) ? enabledRoleIds : [],
        enabledRoles: Array.isArray(enabledRoles) ? enabledRoles : [],
      };

      logger.infiltrationOptions(
        room.roomCode,
        numInfiltrators,
        enabledRoleIds,
      );
      emitRoomState(io, room.roomCode);
    },
  );

  // Host starts the next round
  socket.on(GAME_EVENTS.NEXT_ROUND, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    if (!validateIsHost(socket, room)) return;
    if (!validateGameStarted(socket, room)) return;
    if (!validateGamePhase(socket, room, "results")) return;

    // start another playing phase
    beginMayhem(io, room.roomCode, room);
  });
}

/**
 * Register player action event handlers
 */
export function registerPlayerHandlers(io: Server, socket: Socket) {
  // Player sets ready state
  socket.on(PLAYER_EVENTS.SET_READY, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p: any) => p.socketId === socket.id);
    if (!player) return;

    player.ready = !player.ready;
    player.lastSeenAt = Date.now();

    emitRoomState(io, room.roomCode);
  });

  // Player acknowledges seeing their role
  socket.on(
    PLAYER_EVENTS.ACK_ROLE,
    ({ roomCode, seen }: { roomCode: string; seen: boolean }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      const player = room.players.find((p: any) => p.socketId === socket.id);
      if (!player) return;

      player.roleAcknowledged = !!seen;
      emitRoomState(io, room.roomCode);

      // If all players have acknowledged, proceed to mayhem
      const allAck =
        room.players.length > 0 &&
        room.players.every((p: any) => !!p.roleAcknowledged);
      if (allAck) {
        beginMayhem(io, room.roomCode, room);
      }
    },
  );

  // Player acknowledges completing mayhem actions
  socket.on(PLAYER_EVENTS.ACK_MAYHEM, ({ roomCode }: { roomCode: string }) => {
    const room = validateRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    if (!validateGamePhase(socket, room, "mayhem")) return;

    player.mayhemAcknowledged = true;

    // Check if all players have acknowledged
    const allAcked = room.players.every((p: any) => p.mayhemAcknowledged);
    if (allAcked) {
      beginVoting(io, room.roomCode, room);
    } else {
      emitRoomState(io, room.roomCode);
    }
  });
}

/**
 * Register submission handlers
 */
export function registerSubmissionHandlers(io: Server, socket: Socket) {
  // Player submits a vote
  socket.on(
    GAME_EVENTS.SUBMIT,
    ({
      roomCode,
      gameId,
      value,
    }: {
      roomCode: string;
      gameId: string;
      value: string;
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validatePlayerInRoom(socket, room)) return;

      if (!validateGameStarted(socket, room)) return;
      if (!validateGamePhase(socket, room, "voting")) return;
      if (!validateGameId(socket, room, gameId)) return;
      if (!validateRoundNotEnded(socket, room)) return;

      const cleaned = (value ?? "").trim();
      if (!cleaned) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Submission cannot be empty.",
        });
        return;
      }
      const isValidVote =
        cleaned === GAME_WINNERS.NONE ||
        room.players.some((p: any) => p.socketId === cleaned);

      if (!isValidVote) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Invalid vote option.",
        });
        return;
      }

      // store / overwrite
      const playerToUpdate = room.players.find(
        (p: any) => p.socketId === socket.id,
      );
      if (playerToUpdate) {
        playerToUpdate.submission = {
          value: cleaned,
          submittedAt: Date.now(),
        };
      }
      emitRoomState(io, room.roomCode);

      // If everyone has submitted, end early
      const submittedCount = room.players.filter(
        (p: any) => p.submission !== undefined,
      ).length;
      const playerCount = room.players.length;

      if (playerCount > 0 && submittedCount >= playerCount) {
        endRound(io, room.roomCode, "all submitted");
      }
    },
  );

  // Player submits power usage during mayhem
  socket.on(
    "game:submitPower",
    ({
      roomCode,
      powerName,
      targetPlayers,
      targetCenter,
    }: {
      roomCode: string;
      powerName: string;
      targetPlayers?: string[];
      targetCenter?: string[];
    }) => {
      const room = validateRoom(roomCode);
      if (!room) return;

      if (!validateGameStarted(socket, room)) return;
      if (!validateGamePhase(socket, room, "mayhem")) return;

      const player = room.players.find((p: any) => p.socketId === socket.id);
      if (!player) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Player not found in room.",
        });
        return;
      }

      // Check if player has already used a power this game
      if (player.powerUsed) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "You can only use one power per game.",
        });
        return;
      }

      // Find power in player's character
      if (!player.character) {
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "You don't have a character assigned.",
        });
        return;
      }

      const powerSlot = player.character.powers.find(
        (slot: any) => slot.powerIndex !== null,
      );

      console.log(`[GameHandler] Power submission received:`, {
        playerName: player.name,
        powerSlot: JSON.stringify(powerSlot),
        powerSlotWhere: powerSlot?.where,
        powerSlotItem: powerSlot?.item,
      });

      if (!powerSlot || !powerSlot.powerIndex) {
        console.log(
          `[GameHandler] Power validation FAILED: no powerSlot or no powerIndex`,
        );
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Power not found.",
        });
        return;
      }

      // Validate that the power slot has required fields
      if (!powerSlot.where || !powerSlot.item) {
        console.log(
          `[GameHandler] Power validation FAILED: missing where or item`,
          {
            where: powerSlot.where,
            item: powerSlot.item,
          },
        );
        socket.emit(ERROR_EVENTS.BAD_REQUEST, {
          message: "Invalid power configuration.",
        });
        return;
      }

      console.log(`[GameHandler] Power validation PASSED, executing...`);

      //* Combine player and center targets into a single array of player IDs
      const allTargets = [...(targetPlayers || []), ...(targetCenter || [])];

      // Execute the power (handles both Learn and Reveal based on powerSlot.type)
      executeCharacterPower(io, room, player, powerName, allTargets, powerSlot);

      // Mark power as used
      player.powerUsed = true;
      emitRoomState(io, room.roomCode);
    },
  );
}
