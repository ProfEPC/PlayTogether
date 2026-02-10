import { Socket } from "socket.io-client";
import type { RoomState } from "../../types/room";

interface VoteGroup {
  targetId: string;
  label: string;
  voters: string[];
}

interface HostResultsPanelProps {
  roomState: RoomState;
  voteGroups: VoteGroup[];
  socket: Socket;
}

export function HostResultsPanel({
  roomState,
  voteGroups,
  socket,
}: HostResultsPanelProps) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Results</div>

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

      {/* Final role assignments and unused roles */}
      {roomState.players.some((p) => p.role) && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            All roles in this game
          </div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {(() => {
              const roleMap: Record<string, string[]> = {};
              // Add assigned roles
              roomState.players.forEach((p) => {
                const role = p.role || "unknown";
                if (!roleMap[role]) roleMap[role] = [];
                roleMap[role].push(p.name);
              });
              // Add unused roles
              (roomState.game.unusedRoles || []).forEach((role) => {
                if (!roleMap[role]) roleMap[role] = [];
                roleMap[role].push("unused");
              });
              // Sort roles
              const sortedRoles = Object.keys(roleMap).sort();
              return sortedRoles.map((role) => (
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
              ));
            })()}
          </ul>
        </div>
      )}

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
  );
}
