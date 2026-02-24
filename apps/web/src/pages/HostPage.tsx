import { useEffect, useMemo, useState, useRef } from "react";
import { useAppStore } from "../state/useAppStore";
import { socket } from "../lib/socket";
import { useNow } from "../hooks/useNow";
import { makeRoomCode, closeRoomAction } from "../utils/host/roomActions";
import { copyRoomCodeToClipboard } from "../utils/shared/roomCodeClipboard";
import { loadCharacters } from "../lib/characterPersistence";
import type { RoomState, GameKey, RoleConfig } from "../types/room";
import {
  InfiltrationOptionsPanel,
  LobbySettingsPanel,
  HostPlayersPanel,
  GameControlsPanel,
  HostGameDisplayPanel,
  HostResultsPanel,
  GameSelectionScreen,
} from "../components/HostPage";

export default function HostPage() {
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);
  const setRole = useAppStore((s) => s.setRole);

  const [connected, setConnected] = useState(socket.connected);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState("");

  const timeNow = useNow(250);
  useEffect(() => {
    const prev = prevPlayerCountRef.current || 0;
    if (!roomState) {
      prevPlayerCountRef.current = 0;
      return;
    }
    const cur = roomState.players.length;
    if (cur > prev) {
      // previously tracked last joined name here; no longer needed
    }
    prevPlayerCountRef.current = cur;
  }, [roomState]);
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
    ? roomState.players.filter((p) => p.submission !== undefined).length
    : 0;
  const totalPlayers = roomState ? roomState.players.length : 0;

  const [gameKey, setGameKey] = useState<GameKey>("infiltration");
  const [maxPlayers, setMaxPlayers] = useState(8);

  const [selectedGameKey, setSelectedGameKey] = useState<GameKey | "">("");
  // Host flow state: whether we're selecting the game or in setup
  const [hostStep, setHostStep] = useState<"selectGame" | "setup">(() =>
    selectedGameKey === "" ? "selectGame" : "setup",
  );

  const [playersCollapsed, setPlayersCollapsed] = useState(false);
  const prevPlayerCountRef = useRef<number>(
    roomState ? roomState.players.length : 0,
  );

  // Load characters and convert to roles
  interface SavedCharacter {
    id: string | number;
    name: string;
    data?: { description?: string; team?: "villager" | "infiltrator" | null };
  }
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  // Convert saved characters to roles
  const roles = useMemo(() => {
    const converted = savedCharacters.map((char, idx) => ({
      id: idx,
      key: `character_${char.id}`,
      title: char.name,
      description: char.data?.description || "Custom character",
      team: char.data?.team || undefined,
    })) as (RoleConfig & { team?: "villager" | "infiltrator" })[];
    console.log("Roles calculated:", converted);
    return converted;
  }, [savedCharacters]);

  useEffect(() => {
    (async () => {
      try {
        const characters = await loadCharacters();
        console.log("Characters loaded:", characters);
        setSavedCharacters(characters);
      } catch (error) {
        console.error("Failed to load characters:", error);
      }
    })();
  }, []);

  const [enabledRoleIds, setEnabledRoleIds] = useState<Set<number>>(
    () => new Set(), // Start empty, will be populated when roles load
  );

  const voteGroups = useMemo(() => {
    if (!roomState) return [];

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
    for (const voter of roomState?.players || []) {
      if (!voter.submission) continue;

      const targetId = voter.submission.value;
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
      setStatus("Disconnected");
    };

    const onHosted = (payload: { roomCode: string; socketId: string }) => {
      setStatus(`Hosting room ${payload.roomCode}`);
    };

    const onState = (state: RoomState) => setRoomState(state);

    const onClosed = (payload: { roomCode: string; reason: string }) => {
      setRoomState(null);
      setSelectedGameKey("");
      setHostStep("selectGame");
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

    if (roomState.settings.gameKey === "infiltration") {
      // infiltration options are now managed purely by selected characters
    }
  }, [roomState]);

  // Initialize enabledRoleIds from server when first receiving room state (for this game)
  useEffect(() => {
    if (!roomState || roomState.settings.gameKey !== "infiltration") return;

    // Only set on initial load (when enabledRoleIds is empty)
    if (enabledRoleIds.size === 0) {
      const opts = roomState.settings.gameOptions?.infiltration;
      const allIds = opts?.enabledRoleIds ?? [];
      setEnabledRoleIds(new Set(allIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.roomCode]); // Only reinit when switching rooms

  useEffect(() => {
    if (!roomState) return;

    const minPlayers = roomState.settings.gameKey === "infiltration" ? 3 : 3;
    const hasEnoughPlayers = roomState.players.length >= minPlayers;
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
  }, [roomState]);

  const effectiveRoomCode = roomState?.roomCode ?? roomCode;
  const hosted = roomState?.hostSocketId === socket.id;
  const lobbyLocked = !roomState || roomState.game.started; // disable lobby settings after game starts

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

  return (
    <div style={{ padding: 16 }}>
      {/* Header row: spacer (left) + centered title + room code (right) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
        }}
      >
        {/* Left: Close button */}
        {roomState && hosted && (
          <button
            onClick={() =>
              closeRoomAction(socket, effectiveRoomCode, setStatus)
            }
            style={{
              padding: "8px 12px",
              backgroundColor: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Close room"
            aria-label="Close room"
          >
            CLOSE
          </button>
        )}

        {/* Left spacer to keep the title truly centered */}
        <div style={{ width: 60 }} />

        {/* Center title */}
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 900,
            lineHeight: 1.1,
          }}
        >
          {selectedGameKey === "infiltration"
            ? "Infiltration"
            : selectedGameKey === "odd_one_out"
              ? "Odd One Out"
              : gameKey === "infiltration"
                ? "Infiltration"
                : "Odd One Out"}
        </div>

        {/* Right: Room code block (two lines) */}
        <div
          style={{
            width: 160,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <div
            style={{ fontWeight: 700, marginBottom: 6, textAlign: "center" }}
          >
            Room Code
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <div
              title="Room code"
              style={{
                width: 120, // shrink the code display
                fontSize: 20,
                letterSpacing: 5,
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "6px 8px",
                fontWeight: 800,
                textAlign: "center",
                background: "#ffffff",
                color: "#000000",
                userSelect: "text", // lets people highlight it
              }}
            >
              {roomState?.roomCode ?? roomCode ?? "----"}
            </div>

            <button
              onClick={() => {
                copyRoomCodeToClipboard(effectiveRoomCode, () => {
                  setStatus(`Copied ${effectiveRoomCode} to clipboard`);
                  setTimeout(() => setStatus(""), 2500);
                });
              }}
              disabled={!effectiveRoomCode}
              style={{ padding: "6px 10px" }}
              title="Copy room code"
              aria-label="Copy room code"
            >
              COPY
            </button>
          </div>
        </div>
      </div>

      <div>
        {/* Big game title */}
        <div style={{ padding: 12 }}>
          {(selectedGameKey === "infiltration" ||
            roomState?.settings.gameKey === "infiltration") && (
            <InfiltrationOptionsPanel
              enabledRoleIds={enabledRoleIds}
              setEnabledRoleIds={setEnabledRoleIds}
              roles={roles}
              lobbyLocked={lobbyLocked}
              roomCode={effectiveRoomCode}
              socket={socket}
            />
          )}
          {(selectedGameKey === "infiltration" ||
            roomState?.settings.gameKey === "infiltration") &&
            roomState && (
              <div>
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor:
                      enabledRoleIds.size === roomState.players.length + 3
                        ? "#d4edda"
                        : "#fff3cd",
                    border:
                      enabledRoleIds.size === roomState.players.length + 3
                        ? "1px solid #28a745"
                        : "1px solid #ffc107",
                    borderRadius: 4,
                    color:
                      enabledRoleIds.size === roomState.players.length + 3
                        ? "#155724"
                        : "#856404",
                    fontSize: 14,
                  }}
                >
                  <strong>Characters Required:</strong>{" "}
                  {roomState.players.length + 3} ({roomState.players.length}{" "}
                  players + 3 center roles)
                  <br />
                  <strong>Characters Selected:</strong> {enabledRoleIds.size}
                  {enabledRoleIds.size === roomState.players.length + 3
                    ? " ✓"
                    : " ✗"}
                </div>
                {/* Infiltrator team validation */}
                {(() => {
                  const selectedChars = roles.filter((r) =>
                    enabledRoleIds.has(r.id),
                  );
                  const infiltratorCount = selectedChars.filter(
                    (c) => c.team === "infiltrator",
                  ).length;
                  const numPlayers = roomState.players.length;
                  const isValid =
                    infiltratorCount > 0 && infiltratorCount < numPlayers;

                  return (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        backgroundColor: isValid ? "#d4edda" : "#fff3cd",
                        border: isValid
                          ? "1px solid #c3e6cb"
                          : "1px solid #ffc107",
                        borderRadius: 4,
                        color: isValid ? "#155724" : "#856404",
                        fontSize: 14,
                      }}
                    >
                      <strong>Infiltrator Team:</strong>{" "}
                      {isValid ? "✓ Valid" : "✗ Invalid"}
                      {infiltratorCount === 0 && <> (at least one required)</>}
                      {infiltratorCount >= numPlayers && (
                        <> (must be less than {numPlayers} players)</>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
        </div>

        {/* Core controls */}
        {roomState && (
          <GameControlsPanel
            roomState={roomState}
            roomCode={effectiveRoomCode}
            socket={socket}
          />
        )}

        {/* Game panel */}
        {roomState?.game.started && (
          <HostGameDisplayPanel
            roomState={roomState}
            secondsLeft={secondsLeft}
            submittedCount={submittedCount}
            totalPlayers={totalPlayers}
          />
        )}

        {/* Results panel */}
        {roomState?.game.phase === "results" && (
          <HostResultsPanel
            roomState={roomState}
            voteGroups={voteGroups}
            socket={socket}
          />
        )}

        {/* Room State panel */}
        {roomState && (
          <div
            style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}
          >
            {/* Lobby settings now live in room state */}
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

            {/* Infiltration options moved to top-level panel under game title */}
          </div>
        )}
        {/* Players panel (separate and collapsible) */}
        {roomState && (
          <HostPlayersPanel
            roomState={roomState}
            playersLabel={playersLabel}
            playersCollapsed={playersCollapsed}
            setPlayersCollapsed={setPlayersCollapsed}
            socket={socket}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <strong>Status:</strong> {status || "(none)"}
        </div>
      </div>
    </div>
  );
}
