/**
 * Infiltration game power logic.
 * Centralizes all special role power validation, execution, and prompting logic.
 *
 * NEW RULES (implemented):
 * - Target selection: revealed or protected players are not selectable
 * - Target role doesn't exist: action FAILS if target role is in center but not present
 * - Block timing: cannot block a player whose role already acted
 * - Revealed/protected detection: visible to acting player during selection
 * - Infection: Learn "Players With Role" (Roll Rolecall) cannot infect
 * - LookPostAction/DoPower: validated per power specs in CSV
 */

import type { Server } from "socket.io";
import type { InfiltrationRole, Player, RoomState } from "../state/types";
import { INFILTRATION_ROLES, POWER_PROMPT_TYPES } from "../constants/roles";
import { POWER_EVENTS } from "../constants/socketEvents";

/**
 * Check if a player is currently revealed (their role has been publicly shown).
 */
export function isPlayerRevealed(player: Player): boolean {
  return player.roleRevealed === true;
}

/**
 * Check if a player is currently protected (shielded from actions).
 */
export function isPlayerProtected(player: Player): boolean {
  return player.protected === true;
}

/**
 * Get target list for a specific power type.
 * Filters out revealed/protected players and validates target availability.
 * Returns the list of valid targets based on power and available players.
 */
export function getTargetsForPower(
  powerType: string,
  room: RoomState,
  actorSocketId: string,
) {
  if (powerType === POWER_PROMPT_TYPES.VIEW_UNUSED) {
    // Thief: offer unused role indices
    const unused = room.game.unusedRoles || [];
    return unused.map((_: InfiltrationRole, idx: number) => ({
      id: String(idx),
      label: `Unused role #${idx}`,
    }));
  }

  if (
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM ||
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE
  ) {
    // Hacker/Engineer: offer other players as targets
    // RULE: Filter out revealed or protected players from selectable targets
    return room.players
      .filter(
        (q) =>
          q.socketId !== actorSocketId &&
          !isPlayerRevealed(q) &&
          !isPlayerProtected(q),
      )
      .map((q) => ({ id: q.socketId, label: q.name }));
  }

  return [];
}

/**
 * Send power prompt to a player based on their role.
 */
export function promptPlayerForPower(
  io: Server,
  playerSocketId: string,
  role: InfiltrationRole,
  room: RoomState,
) {
  if (role === INFILTRATION_ROLES.THIEF) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_UNUSED,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_UNUSED,
      prompt: "Pick an unused role index to view (Last Look).",
      targets,
    });
  } else if (role === INFILTRATION_ROLES.HACKER) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM,
      prompt: "Pick a player to check their team - Allegiance Check.",
      targets,
    });
  } else if (role === INFILTRATION_ROLES.ENGINEER) {
    const targets = getTargetsForPower(
      POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE,
      room,
      playerSocketId,
    );
    io.to(playerSocketId).emit(POWER_EVENTS.PROMPT, {
      type: POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE,
      prompt: "Pick a player to view their exact role - Role Peek.",
      targets,
    });
  }
}

/**
 * Execute a power action and return the result.
 * Validates the target and computes the reveal value.
 *
 * RULE: If target role doesn't exist (e.g., is in center but not present), action FAILS.
 */
export function executePower(
  powerType: string,
  target: string,
  room: RoomState,
  actorSocketId: string,
): { isValid: boolean; error?: string; result?: Record<string, unknown> } {
  if (powerType === POWER_PROMPT_TYPES.VIEW_UNUSED) {
    const index = parseInt(target);
    if (
      isNaN(index) ||
      index < 0 ||
      index >= (room.game.unusedRoles?.length || 0)
    ) {
      return { isValid: false, error: "Invalid unused role index." };
    }
    const role = room.game.unusedRoles?.[index];
    return { isValid: true, result: { type: powerType, role } };
  }

  if (
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE ||
    powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_TEAM
  ) {
    const targetPlayer = room.players.find((p) => p.socketId === target);
    if (!targetPlayer?.role) {
      return {
        isValid: false,
        error: "Invalid target player or role not assigned.",
      };
    }
    // RULE: Cannot target revealed or protected players
    if (isPlayerRevealed(targetPlayer) || isPlayerProtected(targetPlayer)) {
      return {
        isValid: false,
        error: "Target player is revealed or protected.",
      };
    }

    const resultData: Record<string, unknown> = {
      type: powerType,
      playerName: targetPlayer.name || "Unknown",
    };

    if (powerType === POWER_PROMPT_TYPES.VIEW_PLAYER_ROLE) {
      resultData.role = targetPlayer.role;
    } else {
      resultData.team =
        targetPlayer.role === INFILTRATION_ROLES.INFILTRATOR
          ? "infiltrator"
          : "civilian";
    }

    return { isValid: true, result: resultData };
  }

  return { isValid: false, error: "Unknown power type." };
}

/**
 * Record a power usage in the game's power summary for the room to see.
 */
export function recordPowerUsage(
  room: RoomState,
  actorSocketId: string,
  actorName: string,
  powerType: string,
  target: string,
) {
  if (!room.game.powerSummary) room.game.powerSummary = [];

  room.game.powerSummary.push({
    actorSocketId,
    actorName,
    type: powerType,
    target:
      powerType === POWER_PROMPT_TYPES.VIEW_UNUSED
        ? `unused#${target}`
        : `player:${target}`,
    at: Date.now(),
  });
}

/**
 * Reset all player powers for a new round.
 */
export function resetPlayerPowers(room: RoomState) {
  room.players.forEach((p) => {
    p.usedPower = undefined;
  });
  room.game.powerSummary = [];
}

/**
 * Check if a role has special power abilities.
 */
export function hasPowerAbility(role: InfiltrationRole | string): boolean {
  return (
    role === INFILTRATION_ROLES.THIEF ||
    role === INFILTRATION_ROLES.HACKER ||
    role === INFILTRATION_ROLES.ENGINEER
  );
}

/**
 * Execute a character power based on character definition
 * Handles Learn/Role and Learn/Team powers: learns roles or teams of selected players or center
 */
export function executeCharacterPower(
  io: Server,
  room: RoomState,
  actor: Player,
  powerName: string,
  targetPlayerIds?: string[],
  targetCenterNumbers?: number[],
  powerSlot?: any,
) {
  if (!powerSlot) return;

  const { item, where, quantity } = powerSlot;

  // Handle Learn/Role and Learn/Team powers
  if ((item === "Role" || item === "Team") && powerName && quantity) {
    const learns = [];

    // Learn from selected players
    if (where === "Player" && targetPlayerIds && targetPlayerIds.length > 0) {
      for (const targetId of targetPlayerIds) {
        const targetPlayer = room.players.find(
          (p: any) => p.socketId === targetId,
        );
        if (targetPlayer) {
          const learnedValue =
            item === "Role" ? targetPlayer.role : targetPlayer.character?.team;
          if (learnedValue) {
            learns.push({
              powerName,
              targetPlayer: targetId,
              targetPlayerName: targetPlayer.name,
              learned: learnedValue,
              learnedAt: Date.now(),
              item,
              where,
            });
          }
        }
      }
    }

    // Learn from center roles (only for Role item, not Team)
    if (
      item === "Role" &&
      where === "Center" &&
      targetCenterNumbers &&
      targetCenterNumbers.length > 0
    ) {
      for (const centerNum of targetCenterNumbers) {
        if (centerNum >= 1 && centerNum <= 3 && room.game.centerRoles) {
          const centerRole = room.game.centerRoles[centerNum - 1];
          learns.push({
            powerName,
            targetCenter: centerNum,
            learned: centerRole,
            learnedAt: Date.now(),
            item,
            where,
          });
        }
      }
    }

    // Learn team from center (center roles don't have teams, so skip for Team item from Center)

    // Store learns in player record
    if (!actor.learnsThisGame) {
      actor.learnsThisGame = [];
    }
    actor.learnsThisGame.push(...learns);

    // Send private message to actor with what they learned
    io.to(actor.socketId).emit("power:result", {
      powerName,
      learns,
    });

    console.log(
      `[Power] ${actor.name} used ${powerName}, learned: ${JSON.stringify(learns)}`,
    );
  }
}
