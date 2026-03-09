import { useEffect, useRef } from "react";
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

export function usePlayerSocketHandlers(props: UsePlayerSocketHandlersProps) {
  // Keep a stable ref to the latest callbacks so the effect never re-runs
  // due to new inline function references from the parent component.
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const onConnect = () => {
      console.log("[Socket] Connected, ID:", socket.id);
      propsRef.current.setConnected(true);
    };
    const onDisconnect = () => {
      console.log("[Socket] Disconnected");
      propsRef.current.setConnected(false);
    };

    const onState = (s: RoomState) => {
      console.log("[Client] Received room:state:", s);
      console.log("[Client] My socket ID:", socket.id);
      console.log(
        "[Client] Players in state:",
        s.players.map((p) => ({ id: p.socketId, name: p.name })),
      );
      propsRef.current.onRoomStateUpdate(s);
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
      propsRef.current.onPowerResult(payload);
    };

    const onPowerPrompt = (prompt: PowerPrompt) => {
      propsRef.current.onPowerPrompt(prompt);
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
      propsRef.current.onJoinDenied?.(payload);
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
        propsRef.current.onCharacterAssigned(rolePayload);
      }
    });
    socket.on("power:result", onPower);
    socket.on("power:prompt", onPowerPrompt);
    socket.on("reveal:broadcast", (payload: unknown) => {
      const revealPayload = payload as {
        powerName: string;
        actorName: string;
        learns: Array<{
          powerName: string;
          targetPlayer?: string;
          targetPlayerName?: string;
          targetCenter?: number;
          learned: string;
          learnedAt: number;
          item?: string;
          where?: string;
        }>;
      };
      console.log("[Client] Reveal broadcast received:", revealPayload);
    });

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
      socket.off("reveal:broadcast");
      // ! Don't disconnect - socket is persistent and shared
      // socket.disconnect();
    };
  }, []); // stable — callbacks accessed via propsRef
}
