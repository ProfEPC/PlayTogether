import type { FC } from "react";
import type { RoomState } from "../../types/room";

interface VoteGroup {
  targetId: string;
  label: string;
  voters: string[];
}

interface ResultsPanelProps {
  roomState: RoomState | null;
  voteGroups: VoteGroup[];
}


import { useState } from "react";

export const ResultsPanel: FC<ResultsPanelProps> = ({ roomState, voteGroups }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  if (!roomState || roomState.game.phase !== "results") return null;

  // If a duplicate vote is reported, reset acknowledge state
  // (simulate: if roomState has a "missedDuplicate" or similar flag, reset)
  // For now, always reset on phase change
  // (You may want to add a real missedDuplicate flag in roomState)
  // If you have a real flag, useEffect(() => setAcknowledged(false), [roomState.game.duplicateReported])

  const roleMap: Record<string, string[]> = {};
  roomState.players.forEach((p) => {
    const role = p.team || "unknown";
    if (!roleMap[role]) roleMap[role] = [];
    roleMap[role].push(p.name);
  });
  (roomState.game.unusedTeams || []).forEach((role) => {
    if (!roleMap[role]) roleMap[role] = [];
    roleMap[role].push("unused");
  });

  // Find if a duplicate was reported (simulate with a flag on roomState)
  // Allow for missedDuplicate injected by server for review phase (not in type)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const missedDuplicate = (roomState.game && (roomState.game as any).missedDuplicate) || false;
  // If a duplicate is reported, show a message and re-enable acknowledge
  if (missedDuplicate && acknowledged) {
    setAcknowledged(false);
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>

      {/* Show the winner of the round */}
      {roomState.game.winner && (
        <div style={{ marginBottom: 8, fontWeight: 700 }}>
          Winner: {roomState.game.winner === "innocents"
            ? "Innocents (Players)"
            : roomState.game.winner === "infiltrators"
              ? "Infiltrators"
              : "No winner"}
        </div>
      )}

      {/* Show missed duplicate warning if present */}
      {missedDuplicate && (
        <div style={{ color: "#a00", marginBottom: 8 }}>
          ⚠ Missed duplicate reported! Please review and acknowledge.
        </div>
      )}

      {/* Vote count summary */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Vote totals</div>
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

      {/* Detailed breakdown of who voted for whom */}
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

      {/* Final role assignments including unused roles */}
      {roomState.players.some((p) => p.team) && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            All roles in this game
          </div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {Object.keys(roleMap)
              .sort()
              .map((role) => (
                <li key={role}>
                  <strong
                    style={{
                      color: role === "infiltrator" ? "#a00" : "#060",
                    }}
                  >
                    {role.toUpperCase()}
                  </strong>
                  : {roleMap[role].join(", ")}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Acknowledge button for review phase, reappears if duplicate is reported */}
      {!acknowledged && (
        <button
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => setAcknowledged(true)}
        >
          Acknowledge
        </button>
      )}
    </div>
  );
};
