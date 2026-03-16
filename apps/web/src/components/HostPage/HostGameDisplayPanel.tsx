import type { RoomState, InfiltrationGamePhase } from "../../types/room";
import { HostPlayerCard } from "./HostPlayerCard";
import "./HostPlayerCard.css";

/** Human-readable phase labels */
const PHASE_LABELS: Record<string, string> = {
  reveal: "🔍 Reveal",
  mayhem: "⚡ Mayhem",
  voting: "🗳️ Voting",
  results: "📊 Results",
};

interface HostGameDisplayPanelProps {
  roomState: RoomState;
  secondsLeft: number | null;
  submittedCount: number;
  totalPlayers: number;
}

export function HostGameDisplayPanel({
  roomState,
  secondsLeft,
  submittedCount,
  totalPlayers,
}: HostGameDisplayPanelProps) {
  const phase = roomState.game.phase as InfiltrationGamePhase;
  const humanPlayers = roomState.players.filter((p) => !p.isNPC);
  const npcPlayers = roomState.players.filter((p) => p.isNPC);

  // Show NPCs alongside humans during mayhem and results;
  // during reveal and voting only human players are relevant.
  const showNPCs = phase === "mayhem" || phase === "results";
  const displayPlayers = showNPCs
    ? [...humanPlayers, ...npcPlayers]
    : humanPlayers;

  // ── Phase-specific progress counts (humans only) ──
  const ackCount = humanPlayers.filter((p) => p.characterAcknowledged).length;
  const actedCount = humanPlayers.filter(
    (p) => p.actedThisRound || p.mayhemAcknowledged,
  ).length;

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      {/* ── Phase header row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.1em" }}>
          {PHASE_LABELS[phase] ?? phase}
        </div>

        {/* Countdown timer during timed phases */}
        {(phase === "mayhem" || phase === "voting") && secondsLeft !== null && (
          <div
            style={{
              fontWeight: 700,
              fontSize: "1.1em",
              color: secondsLeft <= 5 ? "#c0392b" : undefined,
            }}
          >
            {secondsLeft}s
          </div>
        )}
      </div>

      {/* ── Phase-specific status bar ── */}
      {phase === "reveal" && (
        <div style={{ marginBottom: 8, opacity: 0.85, fontSize: "0.9em" }}>
          Acknowledged: {ackCount}/{totalPlayers}
        </div>
      )}

      {phase === "mayhem" && (
        <div style={{ marginBottom: 8, opacity: 0.85, fontSize: "0.9em" }}>
          Acted: {actedCount}/{totalPlayers}
        </div>
      )}

      {phase === "voting" && (
        <div style={{ marginBottom: 8, opacity: 0.85, fontSize: "0.9em" }}>
          Votes: {submittedCount}/{totalPlayers}
        </div>
      )}

      {phase === "results" && roomState.game.winner && (
        <div
          style={{
            marginBottom: 8,
            fontWeight: 700,
            color:
              roomState.game.winner === "infiltrators" ? "#c0392b" : "#27ae60",
          }}
        >
          {roomState.game.winner === "infiltrators"
            ? "🔴 Infiltrators win!"
            : roomState.game.winner === "innocents"
              ? "🟢 Innocents win!"
              : "Draw — no winner"}
        </div>
      )}

      {/* ── Character cards grid ── */}
      <div className="host-player-cards-grid">
        {displayPlayers.map((p) => (
          <HostPlayerCard key={p.socketId} player={p} phase={phase} />
        ))}
      </div>

      {/* ── Unused teams (reveal phase only) ── */}
      {phase === "reveal" &&
        roomState.game.unusedTeams &&
        roomState.game.unusedTeams.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.85em" }}
            >
              Unused teams
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {roomState.game.unusedTeams.map((team, i) => (
                <span
                  key={i}
                  style={{
                    padding: "2px 8px",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    fontSize: "0.8em",
                  }}
                >
                  {team}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
