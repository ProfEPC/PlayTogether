import { Socket } from "socket.io-client";
import type { RoomState } from "../../types/room";

interface HostPlayersPanelProps {
  roomState: RoomState;
  playersLabel: string;
  playersCollapsed: boolean;
  setPlayersCollapsed: (fn: (prev: boolean) => boolean) => void;
  socket: Socket;
}

export function HostPlayersPanel({
  roomState,
  playersLabel,
  playersCollapsed,
  setPlayersCollapsed,
  socket,
}: HostPlayersPanelProps) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>Players</div>
          {/* Hide controls once game has started */}
          {!roomState.game.started && (
            <>
              {/* Toggle require approval vs auto-join */}
              <button
                title={
                  roomState?.settings.requireApprovalToJoin
                    ? "Require approval: ON"
                    : "Require approval: OFF"
                }
                onClick={() =>
                  socket.emit("room:setRequireApproval", {
                    roomCode: roomState.roomCode,
                    requireApproval: !roomState.settings.requireApprovalToJoin,
                  })
                }
                aria-label={
                  roomState?.settings.requireApprovalToJoin
                    ? "Disable require approval"
                    : "Enable require approval"
                }
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 14,
                  marginRight: 6,
                }}
              >
                {roomState?.settings.requireApprovalToJoin
                  ? "🛑 Require"
                  : "✅ Auto-join"}
              </button>
              {/* Toggle lock room to prevent new joins */}
              <button
                title={roomState?.locked ? "Unlock room" : "Lock room"}
                onClick={() =>
                  socket.emit("room:setLocked", {
                    roomCode: roomState.roomCode,
                    locked: !roomState.locked,
                  })
                }
                aria-label={roomState?.locked ? "Unlock room" : "Lock room"}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {roomState?.locked ? "🔒" : "🔓"}
              </button>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>{playersLabel}</div>
          {/* Toggle player list collapse */}
          <button onClick={() => setPlayersCollapsed((s) => !s)}>
            {playersCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!playersCollapsed && (
        <ul style={{ paddingLeft: 18, margin: "8px 0 0 0" }}>
          {roomState.players
            .filter((p) => !p.isNPC)
            .map((p) => (
              <li
                key={p.socketId}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <span>
                  {p.name}{" "}
                  <span style={{ opacity: 0.6 }}>
                    ({p.socketId.slice(0, 6)})
                  </span>
                  <span style={{ marginLeft: 8, opacity: 0.8 }}>
                    {roomState.game.started ? (
                      p.characterAcknowledged ? (
                        <strong style={{ color: "green" }}>Acknowledged</strong>
                      ) : (
                        <span style={{ color: "#666" }}>Not Acknowledged</span>
                      )
                    ) : p.ready ? (
                      <strong style={{ color: "green" }}>ready</strong>
                    ) : (
                      <span style={{ color: "#666" }}>not ready</span>
                    )}
                  </span>
                </span>

                <button
                  onClick={() =>
                    socket.emit("room:kick", {
                      roomCode: roomState.roomCode,
                      targetSocketId: p.socketId,
                    })
                  }
                  style={{ marginLeft: "auto" }}
                >
                  Kick
                </button>
              </li>
            ))}
        </ul>
      )}
      {/* Pending join requests */}
      {!playersCollapsed &&
        roomState.pending &&
        roomState.pending.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Pending</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {roomState.pending.map((p) => (
                <li
                  key={p.socketId}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 0",
                  }}
                >
                  <span>
                    {p.name}{" "}
                    <span style={{ opacity: 0.6 }}>
                      ({p.socketId.slice(0, 6)})
                    </span>
                  </span>

                  <button
                    onClick={() =>
                      socket.emit("room:approveJoin", {
                        roomCode: roomState.roomCode,
                        targetSocketId: p.socketId,
                      })
                    }
                    style={{ marginLeft: "auto" }}
                  >
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
