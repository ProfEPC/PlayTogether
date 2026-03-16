/**
 * Character power execution: unified dispatcher for all power types.
 *
 *! RULE: If target team doesn't exist (e.g., is NPC but not present), action FAILS.
 * //* Learn powers: store knowledge in learnsThisGame, silent (only actor sees result)
 * //* Reveal powers: store knowledge + mark player.characterRevealed = true (actor sees during mayhem, everyone sees during voting)
 * //* Protect powers: mark player.protected = true, silent
 * //* Block powers: mark player.blocked = true, silent
 * //* Swap powers: mark player.swapped = true, silent
 */

import type { Server } from "socket.io";
import type { Player, RoomState } from "../../state/types";

/**
 * Execute a character power: unified dispatcher for all power types
 * Uses player state flags (characterRevealed, protected, blocked, swapped) for effect application
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

  //* Handle Learn and Reveal powers (item is Role or Team)
  const isLearnOrReveal = type === "Learn" || type === "Reveal";
  const isInfoItem = item === "Role" || item === "Team";

  if (isLearnOrReveal && isInfoItem && powerName) {
    const isReveal = type === "Reveal";
    const learns: Array<{
      powerName: string;
      targetPlayer: string;
      targetPlayerName: string;
      learned: string;
      learnedAt: number;
      item: string;
      where: string;
    }> = [];

    //* Resolve learn value from a target player
    const resolveLearnValue = (target: Player): string | undefined => {
      if (item === "Team") {
        //* Team uses character.team → display as Infiltrator/Innocent
        const team = target.character?.team;
        return team === "infiltrator"
          ? "Infiltrator"
          : team === "innocent"
            ? "Innocent"
            : undefined;
      }
      //* Role uses player.team → infiltrator/innocent
      return target.team;
    };

    //* Gather information from targets (both players and NPCs)
    if (targetPlayerIds && targetPlayerIds.length > 0) {
      for (const targetId of targetPlayerIds) {
        const target = room.players.find((p) => p.socketId === targetId);
        if (!target) continue;

        const learnedValue = resolveLearnValue(target);
        if (!learnedValue) continue;

        learns.push({
          powerName,
          targetPlayer: targetId,
          targetPlayerName: target.name,
          learned: learnedValue,
          learnedAt: Date.now(),
          item: item as string,
          where: target.isNPC ? "NPC" : "Player",
        });

        //* Reveal powers also mark the target as publicly revealed
        if (isReveal && !target.isNPC) {
          target.characterRevealed = true;
        }
      }
    }

    //* Store what actor learned
    if (!actor.learnsThisGame) {
      actor.learnsThisGame = [];
    }
    actor.learnsThisGame.push(...learns);

    //* Send private result to actor (during mayhem, only the revealer sees it)
    //* For Reveal powers, characterRevealed is already set on targets above —
    //* the VotingPanel will show revealed characters to everyone via room state.
    io.to(actor.socketId).emit("power:result", {
      powerName,
      learns,
    });

    console.log(
      `[Power] ${actor.name} used ${powerName} (${type}), reveals=${isReveal}, result: ${JSON.stringify(learns)}`,
    );
  } else {
    console.log(
      `[Power] Unhandled power type: item=${item}, type=${type}, powerName=${powerName}`,
    );
  }
}
