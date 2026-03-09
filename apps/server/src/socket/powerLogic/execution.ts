/**
 * Character power execution: unified dispatcher for all power types.
 *
 *! RULE: If target role doesn't exist (e.g., is in center but not present), action FAILS.
 * //* Learn powers: store knowledge in learnsThisGame, silent (only actor sees result)
 * //* Reveal powers: store knowledge + mark player.roleRevealed = true, broadcast to room
 * //* Protect powers: mark player.protected = true, silent
 * //* Block powers: mark player.blocked = true, silent
 * //* Swap powers: mark player.swapped = true, silent
 */

import type { Server } from "socket.io";
import type { Player, RoomState } from "../../state/types";

/**
 * Execute a character power: unified dispatcher for all power types
 * Uses player state flags (roleRevealed, protected, blocked, swapped) for effect application
 */
export function executeCharacterPower(
  io: Server,
  room: RoomState,
  actor: Player,
  powerName: string,
  targetPlayerIds?: string[],
  powerSlot?: any,
) {
  if (!powerSlot) return;

  const { item, where, quantity, type } = powerSlot;

  //* Log power execution for debugging
  console.log(`[Power] executeCharacterPower called:`, {
    powerName,
    actor: actor.name,
    powerSlot: JSON.stringify(powerSlot),
    item,
    where,
    quantity,
    type,
    targetPlayerIds,
  });

  //* Handle Learn/Role, Learn/Team, and similar information-gathering powers
  console.log(
    `[Power] Checking learn condition: item=${item}, powerName=${powerName}, quantity=${quantity}`,
  );
  console.log(
    `[Power] Condition breakdown: isRoleOrTeam=${
      item === "Role" || item === "Team"
    }, hasPowerName=${!!powerName}, hasQuantity=${!!quantity}`,
  );
  if ((item === "Role" || item === "Team") && powerName && quantity) {
    console.log(`[Power] Learn condition MET! Processing learns...`);
    const learns = [];

    //* Gather information from selected players
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
              targetPlayerName:
                targetPlayer.character?.name || targetPlayer.name,
              learned: learnedValue as string,
              learnedAt: Date.now(),
              item: item as string,
              where: where as string,
            });

            //* Apply state flags based on power type
            if (type === "Reveal") {
              targetPlayer.roleRevealed = true;
            }
            if (item === "Protect") {
              targetPlayer.protected = true;
            }
            if (item === "Block") {
              targetPlayer.blocked = true;
            }
            if (type === "Swap") {
              targetPlayer.swapped = true;
            }
          }
        }
      }
    }

    //* Gather information from center roles (center players are in players array with isCenter flag)
    if (
      (item === "Role" || item === "Team") &&
      where === "Center" &&
      targetPlayerIds &&
      targetPlayerIds.length > 0
    ) {
      for (const targetId of targetPlayerIds) {
        const centerPlayer = room.players.find(
          (p: any) => p.socketId === targetId && p.isCenter,
        );
        if (centerPlayer && centerPlayer.role) {
          const learnedValue =
            item === "Team"
              ? centerPlayer.role === "infiltrator"
                ? "Infiltrator"
                : "Villager"
              : centerPlayer.role;
          learns.push({
            powerName,
            targetPlayer: targetId,
            targetPlayerName: centerPlayer.character?.name || centerPlayer.name,
            learned: learnedValue as string,
            learnedAt: Date.now(),
            item: item as string,
            where: where as string,
          });
        }
      }
    }

    //* Store what actor learned
    if (!actor.learnsThisGame) {
      actor.learnsThisGame = [];
    }
    actor.learnsThisGame.push(...learns);

    //* Broadcast if reveal power
    if (type === "Reveal" && learns.length) {
      io.to(room.roomCode).emit("reveal:broadcast", {
        powerName,
        actorName: actor.name,
        learns,
      });
    }

    //* Send private result to actor
    io.to(actor.socketId).emit("power:result", {
      powerName,
      learns,
    });

    const flagsApplied = [
      type === "Reveal" && "roleRevealed",
      item === "Protect" && "protected",
      item === "Block" && "blocked",
      type === "Swap" && "swapped",
    ]
      .filter(Boolean)
      .join(", ");

    console.log(
      `[Power] ${actor.name} used ${powerName} (${type}), applied flags: [${flagsApplied}], result: ${JSON.stringify(learns)}`,
    );
  } else {
    console.log(
      `[Power] Learn condition FAILED! Not processing as learn power. item=${item}, powerName=${powerName}, quantity=${quantity}, type=${type}`,
    );
  }
}
