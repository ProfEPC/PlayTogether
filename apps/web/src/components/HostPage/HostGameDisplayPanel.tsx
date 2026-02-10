import type { RoomState } from "../../types/room";

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
  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      {/* Display current game phase */}
      <div>
        <strong>Phase:</strong> {roomState.game.phase}
      </div>

      {/* Display the current game prompt/question */}
      <div>
        <strong>Prompt:</strong> {roomState.game.prompt ?? "(none)"}
      </div>

      {/* Show countdown timer during mayhem and voting phases */}
      {(roomState.game.phase === "mayhem" ||
        roomState.game.phase === "voting") && (
        <div>
          <strong>Time left:</strong> {secondsLeft}s
        </div>
      )}

      {/* Show vote submission progress during voting phase */}
      {roomState.game.phase === "voting" && (
        <div>
          <strong>Votes:</strong> {submittedCount}/{totalPlayers}
        </div>
      )}

      {/* Show round end message during results phase */}
      {roomState.game.phase === "results" && (
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Round ended. Results below.
        </div>
      )}

      {/* Display unused roles during reveal phase (roles not assigned to any player) */}
      {roomState?.game.phase === "reveal" &&
        roomState?.game.unusedRoles &&
        roomState.game.unusedRoles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Unused roles in this game
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roomState.game.unusedRoles.map((role, i) => (
                <span
                  key={i}
                  style={{
                    padding: "4px 8px",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
