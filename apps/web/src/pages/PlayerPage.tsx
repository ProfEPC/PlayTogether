import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import { COLORS } from "../constants/colors";
import {
  copyRoomCodeToClipboard,
  pasteRoomCodeFromClipboard,
} from "../utils/shared/roomCodeClipboard";
import {
  joinRoomAction,
  leaveRoomAction,
  togglePlayerReadyAction,
} from "../utils/player/roomActions";
import { submitVoteAction } from "../utils/player/gameActions";
import type { RoomState } from "../types/room";
import { VotingPanel, ResultsPanel } from "../components/PlayerPage";
import { RevealPhasePanel } from "../components/PlayerPage/RevealPhasePanel";
import { MayhemPhasePanel } from "../components/PlayerPage/MayhemPhasePanel";
import { LobbyPhasePanel } from "../components/PlayerPage/LobbyPhasePanel";
import { usePlayerSocketHandlers } from "../hooks/usePlayerSocketHandlers";

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
  const [isJoining, setIsJoining] = useState(false);

  // Derived state from current room - find this player's socket ID, player object, and assigned role
  const mySocketId = socket.id;
  const myPlayer =
    roomState?.players.find((p) => p.socketId === mySocketId) ?? null;

  // Log for debugging
  if (roomState && myPlayer === null && mySocketId) {
    console.log("[PlayerPage] Socket ID:", mySocketId);
    console.log(
      "[PlayerPage] Room has players:",
      roomState.players.map((p) => p.socketId),
    );
    console.log(
      "[PlayerPage] Match found:",
      roomState.players.find((p) => p.socketId === mySocketId),
    );
  }

  // Store the player's assigned character locally since server sends it via private event
  const [myCharacter, setMyCharacter] = useState<{
    name: string;
    description: string;
    team?: "villager" | "infiltrator";
  } | null>(null);

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
    null,
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

  // Set up socket event handlers
  usePlayerSocketHandlers({
    onRoomStateUpdate: (s) => {
      setRoomState(s);
      // Clear character when game returns to lobby or resets
      if (s.game.phase === "lobby") {
        setMyCharacter(null);
      }
      // Update status when player successfully joins
      if (s && s.players.some((p) => p.socketId === socket.id)) {
        setStatus(`Successfully joined room ${s.roomCode}`);
        setIsJoining(false);
      }
    },
    onCharacterAssigned: (character) => setMyCharacter(character.role),
    onPowerResult: (payload) => {
      // Handle character power learns (new format)
      if (payload.learns && payload.learns.length > 0) {
        const learnTexts = payload.learns.map(
          (learn) =>
            `${learn.targetPlayerName || `Center ${learn.targetCenter}`} is ${learn.learned}`,
        );
        setLearnedInfo(learnTexts.join(", "));
      }
      // Handle old-style power results
      else {
        if (typeof payload.learned === "string")
          setLearnedInfo(payload.learned);
        if (typeof payload.note === "string")
          setPowerNotifications(payload.note);
      }
    },
    onPowerPrompt: (p) => setPowerPrompt(p),
    setConnected,
    onJoinDenied: (payload) => {
      setStatus(`❌ Join denied: ${payload.reason}`);
      setIsJoining(false);
    },
  });

  // Timer for voting/mayhem countdown
  useEffect(() => {
    if (!roomState) return;
    if (roomState.game.endsAt) {
      const update = () => {
        const s = Math.max(
          0,
          Math.ceil((roomState.game.endsAt! - Date.now()) / 1000),
        );
        setSecondsLeft(s);
      };
      update();
      const t = setInterval(update, 500);
      return () => clearInterval(t);
    }
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
            background: COLORS.error,
            border: `1px solid ${COLORS.errorBorder}`,
            borderRadius: 8,
            color: COLORS.errorText,
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
              onClick={() => {
                setIsJoining(true);
                joinRoomAction(socket, roomCode, playerName, setStatus);
              }}
              disabled={!canJoin || !connected || isJoining}
            >
              {isJoining ? "Joining..." : "Join Room"}
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
                  background: COLORS.backgroundLight,
                  color: COLORS.textDark,
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

        {myPlayer && !roomState?.game.started && (
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
          <RevealPhasePanel
            roomState={roomState}
            myPlayer={myPlayer}
            myCharacter={myCharacter}
            setStatus={setStatus}
          />
        )}

        {roomState && myPlayer && roomState?.game.phase === "mayhem" && (
          <MayhemPhasePanel
            roomState={roomState}
            myPlayer={myPlayer}
            mySocketId={mySocketId}
            learnedInfo={learnedInfo}
            powerPrompt={powerPrompt}
            powerNotifications={powerNotifications}
            onPowerPromptClose={() => setPowerPrompt(null)}
            onLearnedInfoClose={() => setLearnedInfo(null)}
          />
        )}

        {roomState && myPlayer && roomState?.game.phase === "voting" && (
          <VotingPanel
            roomState={roomState}
            voteOptions={voteOptions}
            selectedVote={selectedVote}
            mySubmission={
              mySubmission
                ? { value: mySubmission.value, submittedAt: 0 }
                : null
            }
            gameId={roomState.game.gameId}
            secondsLeft={secondsLeft}
            onSelectVote={setSelectedVote}
            onSubmit={() =>
              submitVoteAction(
                socket,
                roomState,
                selectedVote,
                setStatus,
                setMySubmission,
              )
            }
          />
        )}

        {roomState && myPlayer && roomState?.game.phase === "results" && (
          <ResultsPanel roomState={roomState} voteGroups={voteGroups} />
        )}

        {roomState && myPlayer && roomState.game.phase === "lobby" && (
          <LobbyPhasePanel roomState={roomState} />
        )}

        <div style={{ marginTop: 16 }}>
          <strong>Status:</strong> {status || "(none)"}
        </div>
      </div>
    </div>
  );
}
