import type { FC } from "react";
import { socket } from "../../lib/socket";
import type { RoomState, InfiltrationRole } from "../../types/room";

type PowerPrompt = {
  type: string;
  prompt: string;
  targets: Array<{ id: string; label: string }>;
};

interface MayhemPanelProps {
  roomState: RoomState | null;
  myRole: InfiltrationRole | null;
  mySocketId: string | undefined;
  learnedInfo: string | null;
  powerPrompt: PowerPrompt | null;
  powerNotifications: string | null;
  setPowerPrompt: (prompt: PowerPrompt | null) => void;
}

export const MayhemPanel: FC<MayhemPanelProps> = ({
  roomState,
  myRole,
  mySocketId,
  learnedInfo,
  powerPrompt,
  powerNotifications,
  setPowerPrompt,
}) => {
  if (!roomState || roomState.game.phase !== "mayhem") return null;

  const handleUsePower = (type: string, target?: string) => {
    socket.emit("player:usePower", {
      roomCode: roomState.roomCode,
      type,
      target,
    });
  };

  const handleAckMayhem = () => {
    socket.emit("player:ackMayhem", {
      roomCode: roomState.roomCode,
    });
  };

  const myPlayer = roomState.players.find((p) => p.socketId === mySocketId);
  const hasUsedPower = myPlayer?.usedPower;
  const hasAcked = myPlayer?.mayhemAcknowledged;

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      <strong>Mayhem Round</strong>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Use your special powers if you have them, then acknowledge when ready.
      </div>

      {/* Special power controls for thief, engineer, or hacker */}
      {myRole &&
        ["thief", "engineer", "hacker"].includes(myRole) &&
        !hasUsedPower && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Special Power ({myRole.toUpperCase()})
            </div>
            {/* Thief: choose an unused role to view */}
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
                    handleUsePower("viewUnused", select.value);
                  }}
                >
                  View Unused Role
                </button>
              </div>
            )}

            {(myRole === "engineer" || myRole === "hacker") && (
              <div>
                {/* Engineer/Hacker: choose a player to investigate */}
                <select id={`${myRole}-target`} style={{ marginRight: 8 }}>
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
                    handleUsePower(
                      myRole === "engineer"
                        ? "viewPlayerRole"
                        : "viewPlayerTeam",
                      select.value
                    );
                  }}
                >
                  {myRole === "engineer"
                    ? "View Player Role"
                    : "View Player Team"}
                </button>
              </div>
            )}
          </div>
        )}

      {/* Display information learned from using a special power */}
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

      {/* Power prompt for multi-step powers (e.g., choosing a player to learn about) */}
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
            {powerPrompt.targets.map((t: { id: string; label: string }) => (
              <button
                key={t.id}
                onClick={() => {
                  handleUsePower(powerPrompt.type, t.id);
                  setPowerPrompt(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasAcked && (
        <div style={{ marginTop: 12 }}>
          {/* Ready button - player confirms they're done with mayhem actions */}
          <button
            onClick={handleAckMayhem}
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

      {hasAcked && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: "#d4edda",
            borderRadius: 4,
            color: "#155724",
          }}
        >
          {/* Confirmation that player is ready for voting phase */}✅ Ready for
          voting - waiting for other players...
        </div>
      )}

      {/* Display server-sent notifications about power results */}
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
  );
};
