import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";

type Player = {
  socketId: string;
  name: string;
};

type GamePhase = "lobby" | "playing" | "results";

type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt: string | null;
  endsAt: number | null; // unix ms timestamp
};

type RoomSettings = {
  roundDurationMs: number;
  gameKey: "infiltration" | "odd_one_out";
  maxPlayers: number;
};

type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[];
  locked: boolean;
  game: GameState;
  settings: RoomSettings; // add this
  updatedAt: number;
};

const now = () => Date.now();

export default function PlayerPage() {
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);

  const playerName = useAppStore((s) => s.playerName);
  const setPlayerName = useAppStore((s) => s.setPlayerName);

  const [connected, setConnected] = useState(socket.connected);
  const [status, setStatus] = useState<string>("");
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const canJoin = useMemo(() => {
    return roomCode.trim().length >= 3 && playerName.trim().length >= 1;
  }, [roomCode, playerName]);

  const [timeNow, setTimeNow] = useState(now());

  useEffect(() => {
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onJoined = (payload: { roomCode: string; socketId: string }) => {
      setStatus(`Joined room ${payload.roomCode} (socket ${payload.socketId})`);
    };

    const onPlayerJoined = (payload: {
      roomCode: string;
      playerName: string;
    }) => {
      setStatus(`${payload.playerName} joined ${payload.roomCode}`);
    };

    const t = setInterval(() => setTimeNow(now()), 250);

    const onState = (state: RoomState) => setRoomState(state);

    const onKicked = (payload: { roomCode: string; reason: string }) => {
      setStatus(
        `You were removed from ${payload.roomCode} (${payload.reason})`
      );
      setRoomState(null);
    };

    const onJoinDenied = (payload: { roomCode: string; reason: string }) => {
      setStatus(`Join denied for ${payload.roomCode}: ${payload.reason}`);
    };

    const onClosed = (payload: { roomCode: string; reason: string }) => {
      setStatus(`Room closed: ${payload.reason}`);
      setRoomState(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:joined", onJoined);
    socket.on("room:playerJoined", onPlayerJoined);
    socket.on("room:state", onState);
    socket.on("room:kicked", onKicked);
    socket.on("room:joinDenied", onJoinDenied);
    socket.on("room:closed", onClosed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:joined", onJoined);
      socket.off("room:playerJoined", onPlayerJoined);
      socket.off("room:state", onState);
      socket.off("room:kicked", onKicked);
      socket.off("room:joinDenied", onJoinDenied);
      socket.off("room:closed", onClosed);
      socket.disconnect();
      clearInterval(t);
    };
  }, []);

  function joinRoom() {
    setStatus("Joining...");
    socket.emit("room:join", {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
  }
  const secondsLeft = roomState?.game.endsAt
    ? Math.max(0, Math.ceil((roomState.game.endsAt - timeNow) / 1000))
    : null;
  return (
    <div style={{ padding: 16 }}>
      <h1>Player</h1>

      <p>
        Socket:{" "}
        <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
      </p>
      {roomState?.game.started && (
        <div>
          <div>
            <strong>Phase:</strong> {roomState.game.phase}
          </div>
          <div>
            <strong>Prompt:</strong> {roomState.game.prompt}
          </div>
          <div>
            <strong>Time left:</strong> {secondsLeft}s
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <label>
          Name:
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Room Code:
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            style={{ width: "100%" }}
          />
        </label>

        <button onClick={joinRoom} disabled={!canJoin}>
          Join Room
        </button>

        <div>
          <strong>Status:</strong> {status || "(none)"}
        </div>

        {/* ✅ THIS is the “render it” part */}
        {roomState && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <strong>Room State</strong>
            <div>Room: {roomState.roomCode}</div>
            <div>
              Players ({roomState.players.length}):{" "}
              {roomState.players.map((p) => p.name).join(", ")}
            </div>
            <div>Host present: {roomState.hostSocketId ? "yes" : "no"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
