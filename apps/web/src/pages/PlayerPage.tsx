import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import {
  copyRoomCodeToClipboard,
  pasteRoomCodeFromClipboard,
} from "../utils/shared/roomCodeClipboard";
import {
  joinRoomAction,
  leaveRoomAction,
  togglePlayerReadyAction,
} from "../utils/player/roomActions";
import {
  submitVoteAction,
  acknowledgeRoleAction,
  acknowledgeMayhemAction,
  sendPowerAction,
} from "../utils/player/gameActions";
import type { RoomState } from "../types/room";
import { VotingPanel, ResultsPanel } from "../components/PlayerPage";

// PlayerPage: UI for players to join a room and participate in rounds.
//
// High-level responsibilities:
// - Connect the client socket and subscribe to room/player events
// - Allow entering a name and room code before joining
// - After joining, show a condensed view with name and room code + copy
// - Display game panels depending on `roomState.game.phase` (reveal, mayhem, voting, results)

export default function PlayerPage() {
  // Retrieve persisted player data from local store
  const storedRoomCode = useAppStore((s) => s.roomCode);
  const storedPlayerName = useAppStore((s) => s.playerName);

  // Connection and room state management
  const [connected, setConnected] = useState(socket.connected);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerName, setPlayerName] = useState<string>(storedPlayerName || "");
  const [roomCode, setRoomCode] = useState<string>(storedRoomCode || "");
  const [status, setStatus] = useState<string>("");

  // Derived state from current room - find this player's socket ID, player object, and assigned role
  const mySocketId = socket.id;
  const myPlayer =
    roomState?.players.find((p) => p.socketId === mySocketId) ?? null;
  const myRole = myPlayer?.role ?? null;

  // Game timer countdown - updates every 500ms during mayhem/voting phases
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Special power UI feedback
  const [learnedInfo, setLearnedInfo] = useState<string | null>(null);
  type PowerPrompt = {
    type: string;
    prompt: string;
    targets: Array<{ id: string; label: string }>;
  };
  const [powerPrompt, setPowerPrompt] = useState<PowerPrompt | null>(null);
  const [powerNotifications, setPowerNotifications] = useState<string | null>(
    null
  );

  // Voting phase state - voteOptions includes all players plus "No Infiltrator" option
  const voteOptions = useMemo(() => {
    if (!roomState) return [] as { id: string; label: string }[];
    const playerOptions = roomState.players.map((p) => ({
      id: p.socketId,
      label: p.name,
    }));
    return [...playerOptions, { id: "none", label: "No Infiltrator" }];
  }, [roomState]);

  // Vote grouping for results display - shows who voted for each player/option
  const voteGroups = useMemo(() => {
    if (!roomState)
      return [] as { targetId: string; label: string; voters: string[] }[];
    const groups = roomState.players.map((p) => ({
      targetId: p.socketId,
      label: p.name,
      voters: [] as string[],
    }));
    groups.push({ targetId: "none", label: "No Infiltrator", voters: [] });
    return groups;
  }, [roomState]);

  // Player's vote selection and submission state
  type Submission = { value: string };
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);

  // UI state for copy button feedback
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  // Determine if join button should be enabled (both name and room code required)
  const canJoin = playerName.trim().length > 0 && roomCode.trim().length > 0;

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onState = (s: RoomState) => {
      setRoomState(s);
      // Update status when player successfully joins
      if (s && s.players.some((p) => p.socketId === socket.id)) {
        setStatus(`Successfully joined room ${s.roomCode}`);
      }
    };
    const onPowerResult = (payload: {
      type: string;
      [key: string]: unknown;
    }) => {
      // server-side power results may include learned info or notes
      if (typeof payload.learned === "string") setLearnedInfo(payload.learned);
      if (typeof payload.note === "string") setPowerNotifications(payload.note);
    };

    const onPowerPrompt = (p: PowerPrompt) => setPowerPrompt(p);

    socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onState);
    socket.on("power:result", onPowerResult);
    socket.on("power:prompt", onPowerPrompt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onState);
      socket.off("power:result", onPowerResult);
      socket.off("power:prompt", onPowerPrompt);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!roomState) return;
    if (roomState.game.endsAt) {
      const update = () => {
        const s = Math.max(
          0,
          Math.ceil((roomState.game.endsAt! - Date.now()) / 1000)
        );
        setSecondsLeft(s);
      };
      update();
      const t = setInterval(update, 500);
      return () => clearInterval(t);
    }
    return;
  }, [roomState]);

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>{roomState?.game.started ? myPlayer?.name : "Player"}</h1>
        {myPlayer && (
          <button
            onClick={() =>
              leaveRoomAction(socket, roomState, setStatus, setRoomState)
            }
            style={{ marginLeft: 12 }}
          >
            Leave Room
          </button>
        )}
      </div>

      {!connected && (
        <div
          style={{
            padding: 12,
            background: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: 8,
            color: "#721c24",
            marginBottom: 12,
          }}
        >
          ⚠️ Disconnected from server
        </div>
      )}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        {!myPlayer && !roomState?.game.started ? (
          <>
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
                <button
                  onClick={() =>
                    pasteRoomCodeFromClipboard((code) => setRoomCode(code))
                  }
                  style={{ padding: "6px 10px" }}
                >
                  Paste
                </button>
              </div>
            </label>

            <button
              onClick={() =>
                joinRoomAction(socket, roomCode, playerName, setStatus)
              }
              disabled={!canJoin}
            >
              Join Room
            </button>
          </>
        ) : myPlayer && !roomState?.game.started ? (
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Name</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              {myPlayer?.name}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                style={{
                  background: "#fff",
                  color: "#000",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 18,
                  letterSpacing: 4,
                  fontWeight: 700,
                }}
              >
                {(roomState?.roomCode ?? roomCode).toUpperCase()}
              </div>
              <button
                onClick={() => {
                  const code = (roomState?.roomCode ?? roomCode)
                    .trim()
                    .toUpperCase();
                  copyRoomCodeToClipboard(code, () => {
                    setCopiedRoomCode(true);
                    setTimeout(() => setCopiedRoomCode(false), 2000);
                  });
                }}
                disabled={!(roomState?.roomCode || roomCode)}
                style={{ padding: "6px 10px" }}
              >
                {copiedRoomCode ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}

        {myPlayer && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => {
                if (!roomState || !myPlayer) return;
                togglePlayerReadyAction(socket, roomState, myPlayer, setStatus);
              }}
            >
              {myPlayer.ready ? "Unready" : "Ready"}
            </button>
          </div>
        )}

        {roomState && myPlayer && roomState?.game.phase === "reveal" && (
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
                onClick={() =>
                  acknowledgeRoleAction(socket, roomState, myRole, setStatus)
                }
                disabled={!myRole || !!myPlayer?.roleAcknowledged}
              >
                I have seen my role
              </button>
            </div>
            <div style={{ opacity: 0.8 }}>
              Acknowledged:{" "}
              {roomState?.players.filter((p) => p.roleAcknowledged).length}/
              {roomState?.players.length}
            </div>
          </div>
        )}

        {roomState && myPlayer && roomState?.game.phase === "mayhem" && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            <strong>Mayhem Round</strong>
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              Use your special powers if you have them, then acknowledge when
              ready.
            </div>

            {myRole &&
              ["thief", "engineer", "hacker"].includes(myRole) &&
              !myPlayer?.usedPower && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Special Power ({myRole.toUpperCase()})
                  </div>
                  {myRole === "thief" && roomState.game.unusedRoles && (
                    <div>
                      <select id="thief-target" style={{ marginRight: 8 }}>
                        {roomState.game.unusedRoles.map((_, idx) => (
                          <option key={idx} value={idx.toString()}>
                            Unused Role {idx + 1}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById(
                            "thief-target"
                          ) as HTMLSelectElement;
                          sendPowerAction(
                            socket,
                            roomState,
                            "viewUnused",
                            select.value
                          );
                        }}
                      >
                        Last Look
                      </button>
                    </div>
                  )}

                  {(myRole === "engineer" || myRole === "hacker") && (
                    <div>
                      <select
                        id={`${myRole}-target`}
                        style={{ marginRight: 8 }}
                      >
                        {roomState.players
                          .filter((p) => p.socketId !== mySocketId)
                          .map((p) => (
                            <option key={p.socketId} value={p.socketId}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => {
                          const select = document.getElementById(
                            `${myRole}-target`
                          ) as HTMLSelectElement;
                          sendPowerAction(
                            socket,
                            roomState,
                            myRole === "engineer"
                              ? "viewPlayerRole"
                              : "viewPlayerTeam",
                            select.value
                          );
                        }}
                      >
                        {myRole === "engineer"
                          ? "Role Peek"
                          : "Allegiance Check"}
                      </button>
                    </div>
                  )}
                </div>
              )}

            {learnedInfo && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: 6,
                  color: "#856404",
                }}
              >
                <strong>Learned:</strong> {learnedInfo}
              </div>
            )}

            {powerPrompt && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: 6,
                  color: "#856404",
                }}
              >
                <div style={{ fontWeight: 700 }}>{powerPrompt.prompt}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {powerPrompt.targets.map(
                    (t: { id: string; label: string }) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          sendPowerAction(
                            socket,
                            roomState,
                            powerPrompt.type,
                            t.id
                          );
                          setPowerPrompt(null);
                        }}
                      >
                        {t.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {!myPlayer?.mayhemAcknowledged && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => acknowledgeMayhemAction(socket, roomState)}
                  style={{
                    padding: "8px 16px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  I'm Ready for Voting
                </button>
              </div>
            )}

            {myPlayer?.mayhemAcknowledged && (
              <div
                style={{
                  marginTop: 12,
                  padding: 8,
                  background: "#d4edda",
                  borderRadius: 4,
                  color: "#155724",
                }}
              >
                ✅ Ready for voting - waiting for other players...
              </div>
            )}

            {powerNotifications && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: "#d1ecf1",
                  border: "1px solid #bee5eb",
                  borderRadius: 6,
                  color: "#0c5460",
                }}
              >
                {powerNotifications}
              </div>
            )}
          </div>
        )}

        {roomState && myPlayer && roomState?.game.phase === "voting" && (
          <VotingPanel
            voteOptions={voteOptions}
            selectedVote={selectedVote}
            mySubmission={
              mySubmission
                ? { value: mySubmission.value, submittedAt: 0 }
                : null
            }
            roundId={roomState.game.roundId}
            secondsLeft={secondsLeft}
            onSelectVote={setSelectedVote}
            onSubmit={() =>
              submitVoteAction(
                socket,
                roomState,
                selectedVote,
                setStatus,
                setMySubmission
              )
            }
          />
        )}

        {roomState && myPlayer && roomState?.game.phase === "results" && (
          <ResultsPanel roomState={roomState} voteGroups={voteGroups} />
        )}

        {roomState && myPlayer && roomState.game.phase === "lobby" && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Players ({roomState.players.length} of{" "}
              {roomState.settings.maxPlayers})
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {roomState.players.map((p) => (
                <li key={p.socketId} style={{ marginBottom: 4 }}>
                  {p.name}{" "}
                  <span style={{ opacity: 0.75 }}>
                    ({p.ready ? "ready" : "not ready"})
                  </span>
                </li>
              ))}
            </ul>
            {roomState.game.powerSummary &&
              roomState.game.powerSummary.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600 }}>Recent actions</div>
                  <ul style={{ paddingLeft: 18, margin: 6 }}>
                    {roomState.game.powerSummary.slice(-5).map((s, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        {new Date(s.at).toLocaleTimeString()}: {s.actorName}{" "}
                        used {s.type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <strong>Status:</strong> {status || "(none)"}
        </div>
      </div>
    </div>
  );
}
