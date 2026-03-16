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
  ) => void;
  handleSubmit: (
    roomCode: string,
    powerName: string,
    powerWhere: string,
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
    setSelectedTargets(
      togglePlayerTarget(socketId, selectedTargets, actualQuantity),
    );
  };

  const handleSelectNPC = (npcNum: number) => {
    setSelectedTargets(
      toggleNPCTarget(npcNum, selectedTargets, actualQuantity),
    );
  };

  const handleRandom = (
    roomState: RoomState,
    mySocketId: string | undefined,
    powerWhere: string,
    actualQuantity: number,
  ) => {
    if (powerWhere === "Player") {
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
  ) => {
    setIsSubmitting(true);
    try {
      await submitPowerAction(roomCode, powerName, powerWhere, selectedTargets);
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
