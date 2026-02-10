import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import type { RoomState } from "../types/room";

const now = () => Date.now();

export default function PlayerPage() {
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);

  const playerName = useAppStore((s) => s.playerName);
  const setPlayerName = useAppStore((s) => s.setPlayerName);

  const [selectedVote, setSelectedVote] = useState<string>("none");

  const [connected, setConnected] = useState(socket.connected);
  const [status, setStatus] = useState<string>("");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [mySocketId, setMySocketId] = useState<string | null>(
    socket.id ?? null
  );

  // Local view of the player's role (private, sent by server via `player:role`)
  const [myRole, setMyRole] = useState<"infiltrator" | "civilian" | null>(null);

  const voteGroups = useMemo(() => {
    if (!roomState) return [];

    const byId = new Map(roomState.players.map((p) => [p.socketId, p.name]));
    const groups = new Map<
      string,
      { targetId: string; label: string; voters: string[] }
    >();

    // buckets: each player + "none"
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

    // fill voters
    for (const [voterId, sub] of Object.entries(
      roomState.game.submissions ?? {}
    )) {
      const voterName = byId.get(voterId);
      if (!voterName) continue;

      const g = groups.get(sub.value);
      if (!g) continue;
      g.voters.push(voterName);
    }

    // sort by most votes, then name
    return Array.from(groups.values()).sort((a, b) => {
      const d = b.voters.length - a.voters.length;
      if (d !== 0) return d;
      return a.label.localeCompare(b.label);
    });
  }, [roomState]);

  const canJoin = useMemo(() => {
    return roomCode.trim().length >= 3 && playerName.trim().length >= 1;
  }, [roomCode, playerName]);

  const [timeNow, setTimeNow] = useState(now());

  const voteOptions = roomState
    ? [
        ...roomState.players.map((p) => ({ id: p.socketId, label: p.name })),
        { id: "none", label: "No Infiltrator" },
      ]
    : [{ id: "none", label: "No Infiltrator" }];

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setConnected(true);
      setMySocketId(socket.id ?? null);
    };

    const onDisconnect = () => setConnected(false);

    const onJoined = (payload: { roomCode: string; socketId: string }) => {
      setStatus(`Joined room ${payload.roomCode} (socket ${payload.socketId})`);
      setMySocketId(payload.socketId);
    };

    const onPlayerJoined = (payload: {
      roomCode: string;
      playerName: string;
    }) => {
      setStatus(`${payload.playerName} joined ${payload.roomCode}`);
    };

    const t = setInterval(() => setTimeNow(now()), 250);

    const onState = (state: RoomState) => setRoomState(state);

    const onPlayerRole = (p: { role: "infiltrator" | "civilian" }) => {
      setMyRole(p.role);
    };

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

    const onLeft = (payload: { roomCode: string }) => {
      setStatus(`Left room ${payload.roomCode}`);
      setRoomState(null);
      setMyRole(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:joined", onJoined);
    socket.on("room:playerJoined", onPlayerJoined);
    socket.on("room:state", onState);
    socket.on("room:kicked", onKicked);
    socket.on("room:joinDenied", onJoinDenied);
    socket.on("room:closed", onClosed);
    socket.on("room:left", onLeft);
    socket.on("player:role", onPlayerRole);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:joined", onJoined);
      socket.off("room:playerJoined", onPlayerJoined);
      socket.off("room:state", onState);
      socket.off("room:kicked", onKicked);
      socket.off("room:joinDenied", onJoinDenied);
      socket.off("room:closed", onClosed);
      socket.off("room:left", onLeft);
      socket.off("player:role", onPlayerRole);
      socket.disconnect();
      clearInterval(t);
    };
  }, []);

  // Clear private role when leaving reveal phase
  useEffect(() => {
    if (roomState?.game.phase !== "reveal") {
      const id = setTimeout(() => setMyRole(null), 0);
      return () => clearTimeout(id);
    }
    return;
  }, [roomState?.game.phase]);

  function joinRoom() {
    setStatus("Joining...");
    socket.emit("room:join", {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
    });
  }

  function leaveRoom() {
    if (!roomState || !myPlayer) return;
    socket.emit("room:leave", { roomCode: roomState.roomCode });
    setStatus(`Left room ${roomState.roomCode}`);
    setRoomState(null);
    setMyRole(null);
  }

  function submitVote() {
    if (!roomState?.game.roundId) return;

    socket.emit("game:submit", {
      roomCode: roomState.roomCode,
      roundId: roomState.game.roundId,
      value: selectedVote,
    });
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

  async function pasteRoomCode() {
    try {
      const text = await navigator.clipboard.readText();
      setRoomCode(text.trim().toUpperCase());
      setStatus("Pasted from clipboard");
      setTimeout(() => setStatus(""), 2500);
    } catch {
      setStatus("Failed to paste from clipboard");
      setTimeout(() => setStatus(""), 2500);
    }
  }

  const secondsLeft = roomState?.game.endsAt
    ? Math.max(0, Math.ceil((roomState.game.endsAt - timeNow) / 1000))
    : null;

  const mySubmission =
    roomState && mySocketId
      ? roomState.game.submissions[mySocketId]
      : undefined;

  const myPlayer =
    roomState && mySocketId
      ? roomState.players.find((p) => p.socketId === mySocketId)
      : undefined;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Player</h1>
        {myPlayer && (
          <button onClick={() => leaveRoom()} style={{ marginLeft: 12 }}>
            Leave Room
          </button>
        )}
      </div>

      <p>
        Socket:{" "}
        <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
      </p>

      {/* Game panel */}
      {roomState?.game.started && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
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

          {roomState.game.phase === "results" && (
            <div style={{ marginTop: 8 }}>
              <strong>Round ended.</strong> Results below 👇
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        {/* Join inputs */}
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
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={{ flex: 1 }}
            />
            <button onClick={pasteRoomCode} style={{ padding: "6px 10px" }}>
              Paste
            </button>
            {myPlayer && (
              <button
                onClick={copyRoomCode}
                disabled={!roomState?.roomCode}
                style={{ padding: "6px 10px" }}
              >
                Copy
              </button>
            )}
          </div>
        </label>

        {!myPlayer && (
          <button onClick={joinRoom} disabled={!canJoin}>
            Join Room
          </button>
        )}

        {/* Ready toggle moved here */}
        {myPlayer && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                if (!roomState || !myPlayer) return;
                socket.emit("player:setReady", {
                  roomCode: roomState.roomCode,
                  ready: !myPlayer.ready,
                });
                setStatus(
                  `${myPlayer.name} is now ${
                    !myPlayer.ready ? "ready" : "not ready"
                  }`
                );
              }}
            >
              {myPlayer.ready ? "Unready" : "Ready"}
            </button>
          </div>
        )}

        <div>
          <strong>Status:</strong> {status || "(none)"}
        </div>

        {/* ROLE REVEAL */}
        {roomState?.game.phase === "reveal" && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Role</div>
            <div style={{ marginBottom: 8 }}>
              <strong
                style={{ color: myRole === "infiltrator" ? "#a00" : "#060" }}
              >
                {myRole ? myRole.toUpperCase() : "Waiting for role..."}
              </strong>
            </div>

            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => {
                  if (!roomState || !myRole) return;
                  socket.emit("player:ackRole", {
                    roomCode: roomState.roomCode,
                    seen: true,
                  });
                  setStatus("Acknowledged role");
                }}
                disabled={
                  !myRole || !!roomState?.game.rolesAck?.[mySocketId ?? ""]
                }
              >
                I have seen my role
              </button>
            </div>

            <div style={{ opacity: 0.8 }}>
              Acknowledged:{" "}
              {
                Object.values(roomState?.game.rolesAck ?? {}).filter(Boolean)
                  .length
              }
              /{roomState?.players.length}
            </div>
          </div>
        )}

        {/* MAYHEM */}
        {roomState?.game.phase === "mayhem" && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <strong>Mayhem Round</strong>
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              Actions are happening... voting starts soon.
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Time left:</strong> {secondsLeft}s
            </div>
          </div>
        )}

        {/* VOTING (multiple choice) */}
        {roomState?.game.phase === "voting" && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong>Vote</strong>
              {mySubmission && (
                <span style={{ marginLeft: 8, opacity: 0.7 }}>
                  submitted ✅
                </span>
              )}
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {voteOptions.map((opt) => (
                <label
                  key={opt.id}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="radio"
                    name="vote"
                    value={opt.id}
                    checked={selectedVote === opt.id}
                    disabled={!!mySubmission}
                    onChange={() => setSelectedVote(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={submitVote}
              disabled={!roomState.game.roundId || !!mySubmission}
              style={{ marginTop: 10 }}
            >
              Submit Vote
            </button>
          </div>
        )}

        {/* RESULTS (tally + breakdown) */}
        {roomState?.game.phase === "results" && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>

            {roomState.game.winner && (
              <div style={{ marginBottom: 8, fontWeight: 700 }}>
                Winner:{" "}
                {roomState.game.winner === "crew"
                  ? "Crew (Players)"
                  : roomState.game.winner === "infiltrators"
                  ? "Infiltrators"
                  : "No winner"}
              </div>
            )}

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
                      <div style={{ opacity: 0.9 }}>{g.voters.join(", ")}</div>
                    </div>
                  ))}
              </div>
            </div>

            {roomState.game.roles && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Roles</div>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {roomState.players.map((p) => (
                    <li key={p.socketId}>
                      {p.name}:{" "}
                      <strong
                        style={{
                          color:
                            roomState.game.roles?.[p.socketId] === "infiltrator"
                              ? "#a00"
                              : "#060",
                        }}
                      >
                        {(
                          roomState.game.roles?.[p.socketId] || "unknown"
                        ).toUpperCase()}
                      </strong>
                    </li>
                  ))}
                </ul>

                {roomState.game.unusedRoles &&
                  roomState.game.unusedRoles.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        Unused roles
                      </div>
                      <div style={{ opacity: 0.9 }}>
                        {roomState.game.unusedRoles.map((r, idx) => (
                          <span key={idx} style={{ marginRight: 8 }}>
                            {r.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Room State */}
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

            <div style={{ marginTop: 6 }}>
              {roomState.game.started ? "Players in game" : "Players"}:{" "}
              <strong>
                {roomState.game.started
                  ? roomState.players.length
                  : `${roomState.players.length} of ${roomState.settings.maxPlayers}`}
              </strong>
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontWeight: 600 }}>Players</div>
              <ul style={{ paddingLeft: 18, margin: 6 }}>
                {roomState.players.map((p) => (
                  <li key={p.socketId} style={{ marginBottom: 4 }}>
                    {p.name}{" "}
                    <span style={{ opacity: 0.75 }}>
                      ({p.ready ? "ready" : "not ready"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
