import { socket } from "../lib/socket";
import type { RoomState } from "../types/room";

export interface SelectedTargets {
  players: string[];
  centers: number[];
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
 * Toggle a center target in/out of selection
 */
export function toggleCenterTarget(
  centerNum: number,
  selectedTargets: SelectedTargets,
  actualQuantity: number,
): SelectedTargets {
  const centerTargets = selectedTargets.centers;

  if (centerTargets.includes(centerNum)) {
    return {
      ...selectedTargets,
      centers: centerTargets.filter((c) => c !== centerNum),
    };
  }

  if (centerTargets.length < actualQuantity) {
    return {
      ...selectedTargets,
      centers: [...centerTargets, centerNum],
    };
  }

  // At capacity, replace oldest with new
  return {
    ...selectedTargets,
    centers: [...centerTargets.slice(1), centerNum],
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
    (p) => p.socketId !== mySocketId,
  );
  const shuffled = [...otherPlayers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quantity).map((p) => p.socketId);
}

/**
 * Generate random center targets
 */
export function getRandomCenterTargets(quantity: number): number[] {
  const availableCenters = [1, 2, 3];
  return availableCenters.sort(() => Math.random() - 0.5).slice(0, quantity);
}

/**
 * Submit a power action to the server
 */
export async function submitPowerAction(
  roomCode: string,
  powerName: string,
  powerWhere: string,
  selectedTargets: SelectedTargets,
): Promise<void> {
  const targetPlayers =
    powerWhere === "Player" ? selectedTargets.players : undefined;
  const targetCenter =
    powerWhere === "Center" ? selectedTargets.centers : undefined;

  socket.emit("game:submitPower", {
    roomCode,
    powerName,
    targetPlayers,
    targetCenter,
  });
}

/**
 * Get total number of selected targets
 */
export function getSelectedCount(selectedTargets: SelectedTargets): number {
  return selectedTargets.players.length + selectedTargets.centers.length;
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
