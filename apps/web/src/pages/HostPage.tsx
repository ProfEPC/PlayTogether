import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import { useNow } from "../hooks/useNow";
import type { RoomState, GameKey } from "../types/room";

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
  const playersLabel = roomState
    ? roomState.game.started
      ? `${roomState.players.length}`
      : `${roomState.players.length} of ${roomState.settings.maxPlayers}`
    : "";

  const secondsLeft = roomState?.game.endsAt
    ? Math.max(0, Math.ceil((roomState.game.endsAt - timeNow) / 1000))
    : null;

  const [roundSeconds, setRoundSeconds] = useState(30);
  const submittedCount = roomState
    ? Object.keys(roomState.game.submissions).length
    : 0;
  const totalPlayers = roomState ? roomState.players.length : 0;

  const [gameKey, setGameKey] = useState<GameKey>("infiltration");
  const [maxPlayers, setMaxPlayers] = useState(8);

  const [selectedGameKey, setSelectedGameKey] = useState<GameKey | "">("");
  // Host flow state: whether we're selecting the game or in setup
  const [hostStep, setHostStep] = useState<"selectGame" | "setup">(() =>
    selectedGameKey === "" ? "selectGame" : "setup"
  );

  const voteGroups = useMemo(() => {
    if (!roomState) return [];

    const byId = new Map(roomState.players.map((p) => [p.socketId, p]));
    const groups = new Map<
      string,
      { targetId: string; label: string; voters: string[] }
    >();

    // Initialize buckets: each player + "none"
    for (const p of roomState.players) {
      groups.set(p.socketId, {
        targetId: p.socketId,
        label: p.name,
        voters: [],
      });
    }
    groups.set("none", {
      targetId: "none",
      label: "No Infiltrator",
      voters: [],
    });

    // Fill voters
    for (const [voterId, sub] of Object.entries(
      roomState.game.submissions ?? {}
    )) {
      const voter = byId.get(voterId);
      if (!voter) continue;

      const targetId = sub.value;
      const g = groups.get(targetId);
      if (!g) continue; // should not happen if server validates
      g.voters.push(voter.name);
    }

    // Sort by most votes desc, then label
    return Array.from(groups.values()).sort((a, b) => {
      const d = b.voters.length - a.voters.length;
      if (d !== 0) return d;
      return a.label.localeCompare(b.label);
    });
  }, [roomState]);

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

    const onClosed = (payload: { roomCode: string; reason: string }) => {
      setHosted(false);
      setRoomState(null);
      setStatus(`Room closed: ${payload.reason}`);
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
      socket.disconnect();
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roomState) return;
    setGameKey(roomState.settings.gameKey);
    setRoundSeconds(Math.round(roomState.settings.roundDurationMs / 1000));
    setMaxPlayers(roomState.settings.maxPlayers);
  }, [roomState]);

  function hostRoom() {
    const code = roomCode.trim().toUpperCase();
    setRoomCode(code);
    setStatus("Starting host...");
    const gameToHost = (selectedGameKey || gameKey) as GameKey;
    socket.emit("room:host", { roomCode: code, gameKey: gameToHost });
  }

  function copyRoomCode() {
    const code = (roomState?.roomCode ?? roomCode).trim().toUpperCase();
    if (!code) return;

    const done = () => {
      setStatus(`Copied ${code} to clipboard`);
      setTimeout(() => setStatus(""), 2500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(done)
        .catch(() => {
          const el = document.createElement("textarea");
          el.value = code;
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
          done();
        });
    } else {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      done();
    }
  }
  const effectiveRoomCode = roomState?.roomCode ?? roomCode;
  const lobbyLocked = !roomState || roomState.game.started; // disable lobby settings after game starts

  // When selecting a game we only show a minimal selection UI (no other setup controls).
  if (hostStep === "selectGame" || selectedGameKey === "") {
    return (
      <div style={{ padding: 16 }}>
        <h1>Host</h1>

        <p>
          Socket:{" "}
          <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
        </p>

        <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
          <div
            style={{
              padding: 24,
              border: "1px solid #ccc",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
              Select a game to host
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <button
                onClick={() => setSelectedGameKey("infiltration")}
                style={{
                  padding: "12px 18px",
                  minWidth: 160,
                  fontSize: 16,
                  background:
                    selectedGameKey === "infiltration" ? "#036" : "#eee",
                  color: selectedGameKey === "infiltration" ? "#fff" : "#000",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Infiltration
              </button>

              <button
                onClick={() => setSelectedGameKey("odd_one_out")}
                style={{
                  padding: "12px 18px",
                  minWidth: 160,
                  fontSize: 16,
                  background:
                    selectedGameKey === "odd_one_out" ? "#036" : "#eee",
                  color: selectedGameKey === "odd_one_out" ? "#fff" : "#000",
                  border: "none",
                  borderRadius: 6,
                }}
              >
                Odd One Out
              </button>
            </div>

            <button
              onClick={() => setHostStep("setup")}
              disabled={selectedGameKey === ""}
              style={{ width: "100%", padding: 10, fontWeight: 700 }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Host</h1>

      <p>
        Socket:{" "}
        <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
      </p>

      <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
        {/* Room Code + Host button */}
        <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Room Code:
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                style={{ flex: 1, fontSize: 18, letterSpacing: 2 }}
              />
              <button
                onClick={copyRoomCode}
                disabled={!(roomState?.roomCode ?? roomCode)}
                style={{ padding: "6px 10px" }}
              >
                Copy
              </button>
            </div>
          </label>

          <button
            onClick={hostRoom}
            disabled={!connected || hosted}
            title={hosted ? "Room is already hosted. Use Close Room to end hosting." : undefined}
            style={{ width: "100%" }}
          >
            Host Room
          </button>
        </div>

        {/* Game (read-only since hostStep is setup) */}
        <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Game</div>

          <div style={{ marginBottom: 8 }}>
            Game:{" "}
            <strong>
              {selectedGameKey === "infiltration"
                ? "Infiltration"
                : selectedGameKey === "odd_one_out"
                ? "Odd One Out"
                : gameKey === "infiltration"
                ? "Infiltration"
                : "Odd One Out"}
            </strong>
            <button
              onClick={() => {
                setHostStep("selectGame");
                setSelectedGameKey("");
                setRoomState(null);
                setHosted(false);
              }}
              style={{ marginLeft: 12 }}
            >
              Change Game
            </button>
          </div>

          {!roomState && (
            <div style={{ marginTop: 8, opacity: 0.7 }}>
              Host a room to enable game settings.
            </div>
          )}
        </div>

        {/* Core controls */}
        {roomState ? (
          <div style={{ display: "grid", gap: 8 }}>
            <button
              onClick={() =>
                socket.emit("room:setLocked", {
                  roomCode: effectiveRoomCode,
                  locked: !(roomState?.locked ?? false),
                })
              }
            >
              {roomState?.locked ? "Unlock Room" : "Lock Room"}
            </button>

            <button
              onClick={() =>
                socket.emit("game:start", { roomCode: effectiveRoomCode })
              }
              disabled={
                !roomState ||
                roomState.players.length === 0 ||
                roomState.game.started
              }
            >
              Start Game
            </button>

            <button
              onClick={() =>
                socket.emit("game:reset", { roomCode: effectiveRoomCode })
              }
            >
              Reset Game (Back to Lobby)
            </button>

            <button
              onClick={() =>
                socket.emit("room:close", { roomCode: effectiveRoomCode })
              }
            >
              Close Room
            </button>
          </div>
        ) : null}

        {/* Status */}
        <div>
          <strong>Status:</strong> {status || "(none)"}
        </div>

        {/* Game panel */}
        {roomState?.game.started && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <div>
              <strong>Phase:</strong> {roomState.game.phase}
            </div>
            <div>
              <strong>Prompt:</strong> {roomState.game.prompt ?? "(none)"}
            </div>

            {(roomState.game.phase === "mayhem" ||
              roomState.game.phase === "voting") && (
              <div>
                <strong>Time left:</strong> {secondsLeft}s
              </div>
            )}

            {roomState.game.phase === "voting" && (
              <div>
                <strong>Votes:</strong> {submittedCount}/{totalPlayers}
              </div>
            )}

            {roomState.game.phase === "results" && (
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Round ended. Results below.
              </div>
            )}

            {/* Results block (tally + breakdown) */}
            {roomState.game.phase === "results" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>

                {/* Totals */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Vote totals
                  </div>
                  <ol style={{ paddingLeft: 18, margin: 0 }}>
                    {voteGroups
                      .filter((g) => g.voters.length > 0)
                      .map((g) => (
                        <li key={g.targetId}>
                          {g.label}: <strong>{g.voters.length}</strong>
                        </li>
                      ))}
                  </ol>
                </div>

                {/* Grouped breakdown */}
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Who voted for who
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {voteGroups
                      .filter((g) => g.voters.length > 0)
                      .map((g) => (
                        <div
                          key={g.targetId}
                          style={{
                            padding: 10,
                            border: "1px solid #eee",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {g.label} ({g.voters.length})
                          </div>
                          <div style={{ opacity: 0.9 }}>
                            {g.voters.join(", ")}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() =>
                    socket.emit("game:nextRound", {
                      roomCode: roomState.roomCode,
                    })
                  }
                  style={{ marginTop: 12, width: "100%" }}
                >
                  Next Round
                </button>
              </div>
            )}
          </div>
        )}

        {/* Room State panel */}
        {roomState && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <h2 style={{ marginTop: 0 }}>Room State</h2>

            <div>
              Room: <strong>{roomState.roomCode}</strong>
            </div>
            {/* Displays Number of Players in Game */}
            <div>
              {roomState.game.started ? "Players in game" : "Players"}:{" "}
              <strong>{playersLabel}</strong>
            </div>
            {/* Lobby settings now live in room state */}
            {!roomState.game.started && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Lobby Settings
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <label>
                    Round seconds:
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={roundSeconds}
                      disabled={lobbyLocked}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        setRoundSeconds(n);
                        socket.emit("game:setDuration", {
                          roomCode: roomState.roomCode,
                          seconds: n,
                        });
                      }}
                      style={{ width: 120, marginLeft: 8 }}
                    />
                  </label>

                  <label>
                    Max players:
                    <input
                      type="number"
                      min={2}
                      max={8}
                      value={maxPlayers}
                      disabled={lobbyLocked}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        setMaxPlayers(n);
                        socket.emit("room:setMaxPlayers", {
                          roomCode: roomState.roomCode,
                          maxPlayers: n,
                        });
                      }}
                      style={{ width: 90, marginLeft: 8 }}
                    />
                  </label>
                </div>
              </div>
            )}
            <div style={{ marginTop: 10, fontWeight: 600 }}>Players</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
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
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>
                      {p.ready ? (
                        <strong style={{ color: "green" }}>ready</strong>
                      ) : (
                        <span style={{ color: "#666" }}>not ready</span>
                      )}
                    </span>
                  </span>

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
          </div>
        )}
      </div>
    </div>
  );
}
