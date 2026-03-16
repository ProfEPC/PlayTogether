import type { Server } from "socket.io";
import type { InfiltrationTeam, RoomState } from "../state/types";
import { NUM_NPCS } from "../state/gameRules";
import { emitRoomState, endRound, startPhaseTimer } from "./roomActions";
import { logger } from "../utils/logger";
import { GAME_PHASES } from "../constants/roles";
import { PLAYER_EVENTS } from "../constants/socketEvents";
import { resetPlayerPowers } from "./powerLogic";
import { getCharacterByName } from "../api/characters";

/**
 * * Generate a unique game session ID to persist across entire game lifecycle
 * - Format: timestamp-randomstring (e.g., "1708873200000-abc123")
 */
function makeGameId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * * Begin the mayhem phase where players can use character powers
 * - Sets game started flag and phase to "mayhem"
 * - Initializes empty votes and acknowledgments
 * - No timer: waits for all players to acknowledge completion
 */
export function beginMayhem(io: Server, code: string, room: RoomState) {
  room.game.started = true;
  room.game.phase = GAME_PHASES.MAYHEM;
  room.game.prompt =
    "MAYHEM ROUND: Take your actions and acknowledge when done.";
  room.game.votes = {};
  room.game.mayhemAck = {};
  //* Track which players have used their special powers this round
  room.game.usedPowers = room.game.usedPowers || {};
  //* Redacted summaries of power usage to show in the room (no sensitive details)
  room.game.powerSummary = [];
  //! No timer - wait for all acknowledgments (critical: don't add timer here)

  emitRoomState(io, code);
}

/**
 * * Begin the role reveal phase - assign characters to players
 *
 * Character Assignment Flow:
 * 1. Get list of selected characters from host options (selectedCharacters)
 * 2. Shuffle the character pool randomly
 * 3. Assign one character to each player in order
 * 4. Fetch character data from database (includes powers, description, team)
 * 5. Send character assignment to each player privately via socket
 * 6. Create NPC players for unused characters
 *
 * ! NOTE: System now uses ONLY character-based assignment (no legacy role abstraction)
 */
export function beginRoleReveal(io: Server, code: string, room: RoomState) {
  room.game.started = true;

  //* Generate gameId once when game starts (persists until game reset)
  if (!room.game.gameId) {
    room.game.gameId = makeGameId();
  }

  const ids = room.players.map((p) => p.socketId);
  const numPlayers = ids.length;

  //* Use actual game options from room settings
  const options = room.settings.gameOptions.infiltration;

  logger.roleAssignment(room.roomCode, numPlayers, options.selectedCharacters);

  //* Build character pool from host's selected characters
  const pool: string[] = [...(options.selectedCharacters || [])];

  console.log("Character pool before shuffle:", pool);

  //* Shuffle the pool randomly
  const shuffledPool = pool.sort(() => Math.random() - 0.5);

  logger.rolePool(shuffledPool);

  //* Assign characters to players in order
  for (let i = 0; i < numPlayers; i++) {
    const player = room.players[i];
    const characterName = shuffledPool[i];

    //* Fetch character metadata from database
    const characterData = getCharacterByName(characterName) as any;
    if (characterData) {
      //* Convert powerSlots database format to client-expected format
      //* Handles special cases like amount="ALL" → quantity=999
      const powers = (characterData.powerSlots || []).map((slot: any) => ({
        powerIndex: slot.powerIndex,
        type: slot.type,
        item: slot.item,
        where: slot.where,
        quantity: slot.amount === "ALL" ? 999 : parseInt(slot.amount) || 1,
      }));

      //* Store on player object for server-side reference
      player.character = {
        name: characterData.name,
        description: characterData.description || "",
        team: characterData.team as "innocent" | "infiltrator" | undefined,
        powers,
      };

      //* Derive infiltration team from character team
      player.team =
        characterData.team === "infiltrator" ? "infiltrator" : "innocent";
      console.log(
        `Assigned character "${characterName}" with ${powers.length} powers to player ${player.name}`,
      );
    } else {
      console.log(`Character "${characterName}" not found in database`);
    }

    //! Send private character assignment to each player
    io.to(player.socketId).emit(PLAYER_EVENTS.CHARACTER, {
      character: player.character,
    });
  }

  //* Create NPC players for unused characters
  const npcCharacterNames = shuffledPool.slice(
    numPlayers,
    numPlayers + NUM_NPCS,
  );
  let npcIndex = 0;
  for (const charName of npcCharacterNames) {
    const charData = getCharacterByName(charName) as any;
    if (charData) {
      //* Create a synthetic player for the NPC
      const npcPlayer: any = {
        socketId: `npc_${npcIndex}`, //* Fake socket ID for NPCs
        name: `NPC ${npcIndex + 1}`,
        isNPC: true,
        ready: true,
        connectedAt: Date.now(),
        lastSeenAt: Date.now(),
        character: {
          name: charData.name,
          description: charData.description || "",
          team: charData.team,
          powers: charData.powers || [],
        },
        //* Derive team from character data
        team: (charData.team === "infiltrator"
          ? "infiltrator"
          : "innocent") as InfiltrationTeam,
      };
      room.players.push(npcPlayer);
      npcIndex++;
    }
  }
  console.log(`Created ${npcIndex} NPC players`);

  //* Transition to reveal phase where players acknowledge character assignments
  room.game.phase = GAME_PHASES.REVEAL;
  room.game.prompt =
    "Character reveal: acknowledge when you've seen your character.";

  emitRoomState(io, code);
}

/**
 * * Begin the voting phase where players vote for suspected infiltrators
 *
 * Voting Logic:
 * - Players vote for a player they suspect OR "No Infiltrator" option
 * - Timer starts for roundDurationMs (default: 30 seconds)
 * - When timer expires or all players vote, round ends and votes are revealed
 * - Players vote for who they suspect
 * - Previous winner/results cleared for fresh round
 */
export function beginVoting(io: Server, code: string, room: RoomState) {
  room.game.phase = GAME_PHASES.VOTING;

  room.game.prompt = "VOTE: Who is the infiltrator? (or choose No Infiltrator)";

  room.game.votes = {}; //* Reset votes
  room.game.endsAt = Date.now() + room.settings.roundDurationMs;

  //* Clear previous results/winner for the upcoming round
  room.game.winner = undefined;

  //! Start countdown timer - calls endRound when time expires
  startPhaseTimer(
    io,
    code,
    room.game.gameId!,
    room.settings.roundDurationMs,
    (roomCode) => {
      endRound(io, roomCode, "timer");
    },
  );

  emitRoomState(io, code);
}
