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
  onCharacterAssigned: (payload: {
    role: {
      name: string;
      description: string;
      team?: "villager" | "infiltrator";
    };
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
  onJoinDenied?: (payload: { roomCode: string; reason: string }) => void;
}

export function usePlayerSocketHandlers({
  onRoomStateUpdate,
  onCharacterAssigned,
  onPowerResult,
  onPowerPrompt,
  setConnected,
  onJoinDenied,
}: UsePlayerSocketHandlersProps) {
  useEffect(() => {
    const onConnect = () => {
      console.log("[Socket] Connected, ID:", socket.id);
      setConnected(true);
    };
    const onDisconnect = () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    };

    const onState = (s: RoomState) => {
      console.log("[Client] Received room:state:", s);
      console.log("[Client] My socket ID:", socket.id);
      console.log(
        "[Client] Players in state:",
        s.players.map((p) => ({ id: p.socketId, name: p.name })),
      );
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

    // ! Register listeners BEFORE connecting
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("room:joined", () => {
      // Join confirmed - room:state will follow immediately
      console.log("Join confirmed by server");
    });
    socket.on("room:joinDenied", (payload) => {
      if (onJoinDenied) onJoinDenied(payload);
    });
    socket.on("player:role", (payload: unknown) => {
      const rolePayload = payload as {
        role: {
          name: string;
          description: string;
          team?: "villager" | "infiltrator";
        };
      };
      if (rolePayload.role) {
        console.log("[Client] Character assigned:", rolePayload.role);
        onCharacterAssigned(rolePayload);
      }
    });
    socket.on("power:result", onPower);
    socket.on("power:prompt", onPowerPrompt);

    // * Debug: log all events
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
      socket.off("room:joinDenied");
      socket.off("player:role");
      socket.off("power:result", onPower);
      socket.off("power:prompt", onPowerPrompt);
      // ! Don't disconnect - socket is persistent and shared
      // socket.disconnect();
    };
  }, [
    onRoomStateUpdate,
    onCharacterAssigned,
    onPowerResult,
    onPowerPrompt,
    setConnected,
    onJoinDenied,
  ]);
}
