import { useEffect } from "react";
import { socket } from "../lib/socket";
import type { RoomState } from "../types/room";

type PowerPrompt = {
  type: string;
  prompt: string;
  targets: Array<{ id: string; label: string }>;
};

interface UsePlayerSocketHandlersProps {
  onRoomStateUpdate: (state: RoomState) => void;
  onCharacterAssigned: (character: {
    name: string;
    description: string;
    team?: "villager" | "infiltrator";
  }) => void;
  onPowerResult: (payload: {
    type: string;
    powerName?: string;
    learns?: Array<{
      powerName: string;
      targetPlayer?: string;
      targetPlayerName?: string;
      targetCenter?: number;
      learned: string;
      learnedAt: number;
      item?: string;
      where?: string;
    }>;
    [key: string]: unknown;
  }) => void;
  onPowerPrompt: (prompt: PowerPrompt) => void;
  setConnected: (connected: boolean) => void;
}

export function usePlayerSocketHandlers({
  onRoomStateUpdate,
  onCharacterAssigned,
  onPowerResult,
  onPowerPrompt,
  setConnected,
}: UsePlayerSocketHandlersProps) {
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onState = (s: RoomState) => {
      onRoomStateUpdate(s);
    };

    const onPower = (payload: {
      type: string;
      powerName?: string;
      learns?: Array<{
        powerName: string;
        targetPlayer?: string;
        targetPlayerName?: string;
        targetCenter?: number;
        learned: string;
        learnedAt: number;
        item?: string;
        where?: string;
      }>;
      [key: string]: unknown;
    }) => {
      onPowerResult(payload);
    };

    // Register listeners BEFORE connecting
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("power:result", onPower);
    socket.on("power:prompt", onPowerPrompt);

    // Debug: log all events
    socket.onAny((eventName: string, ...args: unknown[]) => {
      if (!eventName.startsWith("_")) {
        console.log(`Socket event received: ${eventName}`, args);
      }
    });

    // NOW connect
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("power:result", onPower);
      socket.off("power:prompt", onPowerPrompt);
      socket.disconnect();
    };
  }, [
    onRoomStateUpdate,
    onCharacterAssigned,
    onPowerResult,
    onPowerPrompt,
    setConnected,
  ]);
}
