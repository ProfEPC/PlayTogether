import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import { useNow } from "../hooks/useNow";

type Player = {
  socketId: string;
  name: string;
};

type GameKey = "infiltration" | "odd_one_out";

type RoomSettings = {
  roundDurationMs: number;
  gameKey: GameKey;
  maxPlayers: number;
};

type GamePhase = "lobby" | "playing" | "results";
type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt: string | null;
  endsAt: number | null;
};

type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[];
  locked: boolean;
  game: GameState;
  settings: RoomSettings;
  updatedAt: number;
};

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid O/0, I/1
  let out = "";
  for (let i = 0; i < 4; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function HostPage() {
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);
  const setRole = useAppStore((s) => s.setRole);

  const [connected, setConnected] = useState(socket.connected);
  const [hosted, setHosted] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState("");

  const timeNow = useNow(250);

  const secondsLeft = roomState?.game.endsAt
    ? Math.max(0, Math.ceil((roomState.game.endsAt - timeNow) / 1000))
    : null;

  const [roundSeconds, setRoundSeconds] = useState(30);

  useEffect(() => {
    setRole("host");
    if (!roomCode) setRoomCode(makeRoomCode());

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setHosted(false);
      setStatus("Disconnected");
    };

    const onHosted = (payload: { roomCode: string; socketId: string }) => {
      setHosted(true);
      setStatus(`Hosting room ${payload.roomCode}`);
    };

    const onState = (state: RoomState) => setRoomState(state);

    const onHostLeft = (payload: { roomCode: string }) => {
      setStatus(`Host left room ${payload.roomCode}`);
    };

    const onClosed = (payload: { roomCode: string; reason: string }) => {
      setHosted(false);
      setRoomState(null);
      setStatus(`Room closed: ${payload.reason}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:hosted", onHosted);
    socket.on("room:state", onState);
    socket.on("room:hostLeft", onHostLeft);
    socket.on("room:closed", onClosed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:hosted", onHosted);
      socket.off("room:state", onState);
      socket.off("room:hostLeft", onHostLeft);
      socket.off("room:closed", onClosed);
      socket.disconnect();
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (roomState?.settings?.roundDurationMs) {
      setRoundSeconds(Math.round(roomState.settings.roundDurationMs / 1000));
    }
  }, [roomState?.settings?.roundDurationMs]);

  function hostRoom() {
    const code = roomCode.trim().toUpperCase();
    setRoomCode(code);
    setStatus("Starting host...");
    socket.emit("room:host", { roomCode: code });
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Page title*/}
      <h1>Host</h1>
      {/* Connection indicator: shows whether this browser is currently connected*/}
      to the Socket.IO server
      <p>
        Socket:{" "}
        <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
      </p>
      {/* Main control panel container */}
      <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        {/*Room code input: host can choose/see the room code players should join*/}
        <label>
          Room Code:
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            style={{ width: "100%", fontSize: 18, letterSpacing: 2 }}
          />
        </label>
        {/*Host/Re-host: claims the room on the server and starts broadcasting*/}
        room state
        <button onClick={hostRoom} disabled={!connected}>
          {hosted ? "Re-host Room" : "Host Room"}
        </button>
        {/*Lock/Unlock room: prevents new joins when locked (or after game
        started, per your server rules)*/}
        <button
          onClick={() =>
            socket.emit("room:setLocked", {
              roomCode: roomState?.roomCode ?? roomCode,
              locked: !(roomState?.locked ?? false),
            })
          }
          disabled={!roomState}
        >
          {roomState?.locked ? "Unlock Room" : "Lock Room"}
        </button>
        {/*Start game: moves room into "playing" and sets prompt + endsAt timer
        on server*/}
        <button
          onClick={() =>
            socket.emit("game:start", {
              roomCode: roomState?.roomCode ?? roomCode,
            })
          }
          disabled={
            !roomState ||
            roomState.players.length === 0 ||
            roomState.game.started
          }
        >
          Start Game
        </button>
        {/*Round settings row: adjust round duration + close room*/}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/*Round duration input (in seconds). This controls the next round
          duration on the server*/}
          <label>
            Round seconds:
            <input
              type="number"
              value={roundSeconds}
              min={5}
              max={300}
              onChange={(e) => setRoundSeconds(Number(e.target.value))}
              style={{ width: 90, marginLeft: 8 }}
            />
          </label>
          {/*Push duration setting to server*/}
          <button
            disabled={!roomState || roomState.game.started}
            onClick={() =>
              socket.emit("game:setDuration", {
                roomCode: roomState?.roomCode ?? roomCode,
                seconds: roundSeconds,
              })
            }
          >
            Set Time
          </button>
          {/*Pick Game*/}
          {roomState && (
            <div
              style={{
                display: "grid",
                gap: 8,
                padding: 12,
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              <div>
                <strong>Lobby Settings</strong>
              </div>
              <label>
                Game:
                <select
                  value={roomState.settings.gameKey}
                  disabled={roomState.game.started}
                  onChange={(e) =>
                    socket.emit("game:select", {
                      roomCode: roomState.roomCode,
                      gameKey: e.target.value as GameKey,
                    })
                  }
                  style={{ marginLeft: 8 }}
                >
                  <option value="infiltration">Infiltration (max 8)</option>
                  <option value="odd_one_out">Odd One Out (max 6)</option>
                </select>
              </label>
              {/*Set Max Number of Players*/}
              <label>
                Max players:
                <input
                  type="number"
                  value={roomState.settings.maxPlayers}
                  min={1}
                  max={8}
                  disabled={roomState.game.started}
                  onChange={(e) =>
                    socket.emit("room:setMaxPlayers", {
                      roomCode: roomState.roomCode,
                      maxPlayers: Number(e.target.value),
                    })
                  }
                  style={{ width: 90, marginLeft: 8 }}
                />
              </label>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                Note: caps and minimums are enforced by the server per game.
              </div>
            </div>
          )}
          {/*Close room: kicks everyone out + deletes room state on server*/}
          <button
            disabled={!roomState}
            onClick={() =>
              socket.emit("room:close", {
                roomCode: roomState?.roomCode ?? roomCode,
              })
            }
          >
            Close Room
          </button>
        </div>
        {/*Reset game: returns to lobby state (clears prompt/timer, unlocks, etc.
        per server implementation)*/}
        <button
          onClick={() =>
            socket.emit("game:reset", {
              roomCode: roomState?.roomCode ?? roomCode,
            })
          }
          disabled={!roomState}
        >
          Reset Game
        </button>
        {/*Current status string: human-readable feedback for host actions*/}
        <div>
          <strong>Status:</strong> {status || "(none)"}
        </div>
        {/*Active round display: shows prompt + countdown when the game is
        started*/}
        {roomState?.game.started && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <div>
              <strong>Prompt:</strong> {roomState.game.prompt ?? "(none)"}
            </div>
            <div>
              <strong>Time left:</strong> {secondsLeft}s
            </div>
          </div>
        )}
        {/*Room State panel: shows who is in the room and gives host moderation
        actions (Kick)*/}
        <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>Room State</h2>
          {/*If we haven't received room state yet, we can't show details*/}
          {!roomState ? (
            <p>(No state yet. Click “Host Room”.)</p>
          ) : (
            <>
              //Basic room info
              <p>
                Room: <strong>{roomState.roomCode}</strong>
              </p>
              <p>
                Players: <strong>{roomState.players.length}</strong>
              </p>
              // Player list + Kick buttons
              <ul style={{ paddingLeft: 18 }}>
                {roomState.players.map((p) => (
                  <li
                    key={p.socketId}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span>
                      {p.name}{" "}
                      <span style={{ opacity: 0.6 }}>
                        ({p.socketId.slice(0, 6)})
                      </span>
                    </span>
                    // Kick player: host-only server action
                    <button
                      onClick={() =>
                        socket.emit("room:kick", {
                          roomCode: roomState.roomCode,
                          targetSocketId: p.socketId,
                        })
                      }
                      style={{ marginLeft: "auto" }}
                    >
                      Kick
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
