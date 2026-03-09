import { useEffect, useRef, useState } from "react";
import { socket } from "../lib/socket";
import { useAppStore } from "../state/useAppStore";
import { makeRoomCode } from "../utils/host/roomActions";
import type { RoomState } from "../types/room";

/**
 * Manages the host's socket connection lifecycle, room state, and status messages.
 * Registers handlers for connect, disconnect, room:hosted, room:state, room:closed.
 *
 * @param onRoomClosed — optional callback when the room is closed (e.g. to reset UI flow)
 */
export function useHostSocket(onRoomClosed?: () => void) {
  const setRole = useAppStore((s) => s.setRole);
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);

  const [connected, setConnected] = useState(socket.connected);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState("");

  // Ref so the socket handler always sees the latest callback without re-registering
  const onClosedRef = useRef(onRoomClosed);
  onClosedRef.current = onRoomClosed;

  useEffect(() => {
    setRole("host");
    if (!roomCode) setRoomCode(makeRoomCode());

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setStatus("Disconnected");
    };

    const onHosted = (payload: { roomCode: string }) => {
      setStatus(`Hosting room ${payload.roomCode}`);
    };

    const onState = (state: RoomState) => setRoomState(state);

    const onClosed = (payload: { roomCode: string; reason: string }) => {
      setRoomState(null);
      setStatus(`Room closed: ${payload.reason}`);
      onClosedRef.current?.();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:hosted", onHosted);
    socket.on("room:state", onState);
    socket.on("room:closed", onClosed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:hosted", onHosted);
      socket.off("room:state", onState);
      socket.off("room:closed", onClosed);
      // ! Don't disconnect — socket is persistent and shared across pages
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, roomState, status, setStatus };
}
