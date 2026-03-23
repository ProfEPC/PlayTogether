import { socket } from "../lib/socket";
import type { RoomState } from "../types/room";

export interface SelectedTargets {
  players: string[];
  npcs: number[];
}

/**
 * Toggle a player target in/out of selection
 */
export function togglePlayerTarget(
  socketId: string,
  selectedTargets: SelectedTargets,
  actualQuantity: number,
): SelectedTargets {
  const playerTargets = selectedTargets.players;

  if (playerTargets.includes(socketId)) {
    return {
      ...selectedTargets,
      players: playerTargets.filter((id) => id !== socketId),
    };
  }

  if (playerTargets.length < actualQuantity) {
    return {
      ...selectedTargets,
      players: [...playerTargets, socketId],
    };
  }

  // At capacity, replace oldest with new
  return {
    ...selectedTargets,
    players: [...playerTargets.slice(1), socketId],
  };
}

/**
 * Toggle an NPC target in/out of selection
 */
export function toggleNPCTarget(
  npcNum: number,
  selectedTargets: SelectedTargets,
  actualQuantity: number,
): SelectedTargets {
  const npcTargets = selectedTargets.npcs;

  if (npcTargets.includes(npcNum)) {
    return {
      ...selectedTargets,
      npcs: npcTargets.filter((c) => c !== npcNum),
    };
  }

  if (npcTargets.length < actualQuantity) {
    return {
      ...selectedTargets,
      npcs: [...npcTargets, npcNum],
    };
  }

  // At capacity, replace oldest with new
  return {
    ...selectedTargets,
    npcs: [...npcTargets.slice(1), npcNum],
  };
}

/**
 * Generate random player targets
 */
export function getRandomPlayerTargets(
  roomState: RoomState,
  mySocketId: string | undefined,
  quantity: number,
): string[] {
  const otherPlayers = roomState.players.filter(
    (p) => p.socketId !== mySocketId && !p.isNPC,
  );
  const shuffled = [...otherPlayers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quantity).map((p) => p.socketId);
}

/**
 * Generate random NPC targets
 */
export function getRandomNPCTargets(quantity: number): number[] {
  const availableNPCs = [1, 2, 3];
  return availableNPCs.sort(() => Math.random() - 0.5).slice(0, quantity);
}

/**
 * Submit a power action to the server
 */
export async function submitPowerAction(
  roomCode: string,
  powerName: string,
  powerWhere: string,
  selectedTargets: SelectedTargets,
  targetScope?: string,
): Promise<void> {
  // For "Players and NPC" scope, always send both player and NPC targets
  const sendBoth = targetScope === "Players and NPC";
  const targetPlayers =
    sendBoth || powerWhere === "Player" ? selectedTargets.players : undefined;
  const targetNPCs =
    sendBoth || powerWhere === "NPC" ? selectedTargets.npcs : undefined;

  socket.emit("game:submitPower", {
    roomCode,
    powerName,
    targetPlayers,
    targetNPCs,
  });
}

/**
 * Get total number of selected targets
 */
export function getSelectedCount(selectedTargets: SelectedTargets): number {
  return selectedTargets.players.length + selectedTargets.npcs.length;
}

/**
 * Get description with quantity placeholder replaced
 */
export function getDescriptionWithQuantity(
  description: string | undefined,
  quantity: number,
): string {
  if (!description) return `Select ${quantity} target(s).`;
  return description.replace(/#/g, String(quantity));
}

/**
 * Check if ready to submit (has at least one selection)
 */
export function canSubmit(
  selectedTargets: SelectedTargets,
  isSubmitting: boolean,
): boolean {
  return getSelectedCount(selectedTargets) > 0 && !isSubmitting;
}

/**
 * Check if selection is complete (at desired quantity)
 */
export function isSelectionComplete(
  selectedTargets: SelectedTargets,
  actualQuantity: number,
): boolean {
  return getSelectedCount(selectedTargets) >= actualQuantity;
}
