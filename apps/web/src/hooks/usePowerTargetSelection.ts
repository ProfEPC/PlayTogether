import { useState } from "react";
import type { RoomState } from "../types/room";
import {
  togglePlayerTarget,
  toggleNPCTarget,
  getRandomPlayerTargets,
  getRandomNPCTargets,
  submitPowerAction,
  type SelectedTargets,
} from "../utils/powerActionHelpers";

export interface UsePowerTargetSelectionReturn {
  selectedTargets: SelectedTargets;
  isSubmitting: boolean;
  selected: number;
  handleSelectPlayer: (socketId: string) => void;
  handleSelectNPC: (npcNum: number) => void;
  handleRandom: (
    roomState: RoomState,
    mySocketId: string | undefined,
    powerWhere: string,
    actualQuantity: number,
    targetScope?: string,
  ) => void;
  handleSubmit: (
    roomCode: string,
    powerName: string,
    powerWhere: string,
    targetScope?: string,
  ) => Promise<void>;
}

/**
 * Custom hook to manage power target selection state and handlers
 */
export function usePowerTargetSelection(
  actualQuantity: number,
): UsePowerTargetSelectionReturn {
  const [selectedTargets, setSelectedTargets] = useState<SelectedTargets>({
    players: [],
    npcs: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPlayer = (socketId: string) => {
    setSelectedTargets((prev) =>
      togglePlayerTarget(socketId, prev, actualQuantity),
    );
  };

  const handleSelectNPC = (npcNum: number) => {
    setSelectedTargets((prev) =>
      toggleNPCTarget(npcNum, prev, actualQuantity),
    );
  };

  const handleRandom = (
    roomState: RoomState,
    mySocketId: string | undefined,
    powerWhere: string,
    actualQuantity: number,
    targetScope?: string,
  ) => {
    if (targetScope === "Players and NPC") {
      // Split quantity between random players and NPCs
      const npcCount = Math.min(Math.floor(actualQuantity / 2), 3);
      const playerCount = actualQuantity - npcCount;
      const randomPlayers = getRandomPlayerTargets(
        roomState,
        mySocketId,
        playerCount,
      );
      const randomNPCs = getRandomNPCTargets(npcCount);
      setSelectedTargets({ players: randomPlayers, npcs: randomNPCs });
    } else if (powerWhere === "Player") {
      const randomPlayers = getRandomPlayerTargets(
        roomState,
        mySocketId,
        actualQuantity,
      );
      setSelectedTargets({
        ...selectedTargets,
        players: randomPlayers,
      });
    } else if (powerWhere === "NPC") {
      const randomNPCs = getRandomNPCTargets(actualQuantity);
      setSelectedTargets({
        ...selectedTargets,
        npcs: randomNPCs,
      });
    }
  };

  const handleSubmit = async (
    roomCode: string,
    powerName: string,
    powerWhere: string,
    targetScope?: string,
  ) => {
    setIsSubmitting(true);
    try {
      await submitPowerAction(roomCode, powerName, powerWhere, selectedTargets, targetScope);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedTargets,
    isSubmitting,
    selected: selectedTargets.players.length + selectedTargets.npcs.length,
    handleSelectPlayer,
    handleSelectNPC,
    handleRandom,
    handleSubmit,
  };
}
