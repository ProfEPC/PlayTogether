/**
 * HostPage — Orchestrator for the host's view.
 *
 * This page is a thin shell that wires custom hooks to presentational
 * components.  All heavy logic lives in hooks (socket handling, character
 * management, vote tallying) and child panels (game controls, settings, etc.).
 *
 * Flow:
 *   1. "selectGame" step  →  <GameSelectionScreen />   (pick a game & host)
 *   2. "setup" step       →  header + lobby panels     (configure & wait)
 *   3. game started        →  in-game display panels   (timer, submissions)
 *   4. results phase       →  results panel            (vote tallies)
 */
import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import { useNow } from "../hooks/useNow";
import { useHostSocket } from "../hooks/useHostSocket";
import { useCharacterRoles } from "../hooks/useCharacterRoles";
import { useVoteGroups } from "../hooks/useVoteGroups";
import { closeRoomAction } from "../utils/host/roomActions";
import { copyRoomCodeToClipboard } from "../utils/shared/roomCodeClipboard";
import { COLORS } from "../constants/colors";
import type { GameKey } from "../types/room";
import {
  InfiltrationOptionsPanel,
  LobbySettingsPanel,
  HostPlayersPanel,
  GameControlsPanel,
  HostGameDisplayPanel,
  HostResultsPanel,
  GameSelectionScreen,
  HostHeader,
  CharacterValidationPanel,
} from "../components/HostPage";

export default function HostPage() {
  // ── Persisted store ──────────────────────────────────────────────────
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);

  // ── Host flow step ───────────────────────────────────────────────────
  // "selectGame" — choosing which game to host.
  // "setup"      — room is created, waiting for players / configuring.
  const [selectedGameKey, setSelectedGameKey] = useState<GameKey | "">("");
  const [hostStep, setHostStep] = useState<"selectGame" | "setup">(() =>
    selectedGameKey === "" ? "selectGame" : "setup",
  );

  // ── Custom hooks ─────────────────────────────────────────────────────
  // useHostSocket: manages socket connection, room:state, room:hosted,
  //   room:closed events.  The callback resets the UI when a room closes.
  const { connected, roomState, status, setStatus } = useHostSocket(() => {
    setSelectedGameKey("");
    setHostStep("selectGame");
  });

  // useCharacterRoles: loads characters from API when infiltration is
  //   selected, converts them to roles, and manages the toggle selection.
  const { roles, enabledRoleIds, setEnabledRoleIds } = useCharacterRoles(
    selectedGameKey as string,
    roomState,
  );

  // useVoteGroups: computes per-target vote tallies for the results panel.
  const voteGroups = useVoteGroups(roomState);

  // useNow: ticks every 250ms so the countdown timer updates smoothly.
  const timeNow = useNow(250);

  // ── Local settings (mirrors of server state) ────────────────────────
  // These are kept in local state so input fields are responsive while the
  // user drags/types; the actual source-of-truth is the server room state.
  const [gameKey, setGameKey] = useState<GameKey>("infiltration");
  const [roundSeconds, setRoundSeconds] = useState(30);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [playersCollapsed, setPlayersCollapsed] = useState(false);

  // Overwrite local mirrors whenever the server pushes a new room:state.
  // Done during render (not in an effect) to avoid an extra cascading render.
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevRoomState, setPrevRoomState] = useState(roomState);
  if (roomState && roomState !== prevRoomState) {
    setPrevRoomState(roomState);
    setGameKey(roomState.settings.gameKey);
    setRoundSeconds(Math.round(roomState.settings.roundDurationMs / 1000));
    setMaxPlayers(roomState.settings.maxPlayers);
  }

  // ── Status bar text ──────────────────────────────────────────────────
  // Automatically updates the status string whenever room state changes
  // so the host always sees the current lobby/game situation at a glance.
  useEffect(() => {
    if (!roomState) return;
    const hasEnoughPlayers = roomState.players.length >= 3;
    const allReady =
      hasEnoughPlayers && roomState.players.every((p) => p.ready);

    if (roomState.game.started) {
      setStatus("Game in progress");
    } else if (allReady) {
      setStatus("All players ready - start game");
    } else if (hasEnoughPlayers) {
      const readyCount = roomState.players.filter((p) => p.ready).length;
      setStatus(
        `Waiting for players to be ready (${readyCount}/${roomState.players.length})`,
      );
    } else {
      setStatus("Waiting for players");
    }
  }, [roomState, setStatus]);

  // ── Derived / computed values ─────────────────────────────────────────
  // Use server room code when available, fall back to locally generated one.
  const effectiveRoomCode = roomState?.roomCode ?? roomCode;
  // True when this socket is the room's host (guards host-only UI).
  const hosted = roomState?.hostSocketId === socket.id;
  // Disable lobby settings once the game is running.
  const lobbyLocked = !roomState || roomState.game.started;
  // Check both the local selection and server state for infiltration mode.
  const isInfiltration =
    selectedGameKey === "infiltration" ||
    roomState?.settings.gameKey === "infiltration";

  // Player count label: "4 of 8" in lobby, just "4" during a game.
  const playersLabel = roomState
    ? roomState.game.started
      ? `${roomState.players.length}`
      : `${roomState.players.length} of ${roomState.settings.maxPlayers}`
    : "";

  // Countdown timer — null when no active round.
  const secondsLeft = roomState?.game.endsAt
    ? Math.max(0, Math.ceil((roomState.game.endsAt - timeNow) / 1000))
    : null;

  // Voting progress indicators.
  const submittedCount = roomState
    ? roomState.players.filter((p) => p.submission !== undefined).length
    : 0;
  const totalPlayers = roomState ? roomState.players.length : 0;

  // Human-readable game title for the header.
  const gameTitle =
    selectedGameKey === "infiltration"
      ? "Infiltration"
      : selectedGameKey === "odd_one_out"
        ? "Odd One Out"
        : gameKey === "infiltration"
          ? "Infiltration"
          : "Odd One Out";

  // ── Render ────────────────────────────────────────────────────────────
  // Step 1: game picker (early return — nothing else renders).
  if (hostStep === "selectGame" || selectedGameKey === "") {
    return (
      <GameSelectionScreen
        connected={connected}
        selectedGameKey={selectedGameKey}
        roomCode={roomCode}
        socket={socket}
        onSelectGame={setSelectedGameKey}
        onSetup={() => setHostStep("setup")}
        onStatusUpdate={setStatus}
        onRoomCodeUpdate={setRoomCode}
      />
    );
  }

  // Step 2+: setup / in-game / results — rendered top-to-bottom.
  return (
    <div style={{ padding: 16 }}>
      {/* ── Header: close · title · room code ── */}
      <HostHeader
        showClose={!!roomState && hosted}
        gameTitle={gameTitle}
        roomCode={effectiveRoomCode || "----"}
        onClose={() => closeRoomAction(socket, effectiveRoomCode, setStatus)}
        onCopy={() =>
          copyRoomCodeToClipboard(effectiveRoomCode, () => {
            setStatus(`Copied ${effectiveRoomCode} to clipboard`);
            setTimeout(() => setStatus(""), 2500);
          })
        }
      />

      <div>
        {/* ── Infiltration: character toggle grid + validation ── */}
        <div style={{ padding: 12 }}>
          {isInfiltration && (
            <InfiltrationOptionsPanel
              enabledRoleIds={enabledRoleIds}
              setEnabledRoleIds={setEnabledRoleIds}
              roles={roles}
              lobbyLocked={lobbyLocked}
              roomCode={effectiveRoomCode}
              socket={socket}
            />
          )}
          {isInfiltration && roomState && (
            <CharacterValidationPanel
              playerCount={roomState.players.length}
              enabledRoleIds={enabledRoleIds}
              roles={roles}
            />
          )}
        </div>

        {/* ── Core controls: start / reset / next round buttons ── */}
        {roomState && (
          <GameControlsPanel
            roomState={roomState}
            roomCode={effectiveRoomCode}
            socket={socket}
          />
        )}

        {/* ── In-game display: timer, submission progress ── */}
        {roomState?.game.started && (
          <HostGameDisplayPanel
            roomState={roomState}
            secondsLeft={secondsLeft}
            submittedCount={submittedCount}
            totalPlayers={totalPlayers}
          />
        )}

        {/* ── Results: vote tallies per target ── */}
        {roomState?.game.phase === "results" && (
          <HostResultsPanel
            roomState={roomState}
            voteGroups={voteGroups}
            socket={socket}
          />
        )}

        {/* ── Lobby settings: round duration, max players ── */}
        {roomState && (
          <div
            style={{
              padding: 12,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
            }}
          >
            {!roomState.game.started && (
              <LobbySettingsPanel
                roundSeconds={roundSeconds}
                setRoundSeconds={setRoundSeconds}
                maxPlayers={maxPlayers}
                setMaxPlayers={setMaxPlayers}
                lobbyLocked={lobbyLocked}
                roomCode={roomState.roomCode}
                socket={socket}
              />
            )}
          </div>
        )}

        {/* ── Players list (collapsible) ── */}
        {roomState && (
          <HostPlayersPanel
            roomState={roomState}
            playersLabel={playersLabel}
            playersCollapsed={playersCollapsed}
            setPlayersCollapsed={setPlayersCollapsed}
            socket={socket}
          />
        )}

        {/* ── Status bar ── */}
        <div style={{ marginTop: 16 }}>
          <strong>Status:</strong> {status || "(none)"}
        </div>
      </div>
    </div>
  );
}
