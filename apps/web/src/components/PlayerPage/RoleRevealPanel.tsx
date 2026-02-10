import type { FC } from "react";
import { socket } from "../../lib/socket";
import type { RoomState, InfiltrationRole } from "../../types/room";

interface RoleRevealPanelProps {
  roomState: RoomState | null;
  myRole: InfiltrationRole | null;
  mySocketId: string | undefined;
  onAck: () => void;
}

export const RoleRevealPanel: FC<RoleRevealPanelProps> = ({
  roomState,
  myRole,
  mySocketId,
  onAck,
}) => {
  if (
    !roomState ||
    !roomState?.game.phase ||
    roomState.game.phase !== "reveal"
  ) {
    return null;
  }

  const handleAckRole = () => {
    if (!roomState || !myRole) return;
    socket.emit("player:ackRole", {
      roomCode: roomState.roomCode,
      seen: true,
    });
    onAck();
  };

  const ackedCount = roomState?.players.filter(
    (p) => p.roleAcknowledged
  ).length ?? 0;

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      {/* Display the player's assigned role */}
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Role</div>
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: myRole === "infiltrator" ? "#a00" : "#060" }}>
          {myRole ? myRole.toUpperCase() : "Waiting for role..."}
        </strong>
      </div>

      {/* Acknowledge button - disabled once player has already acknowledged */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={handleAckRole}
          disabled={!myRole || !!roomState?.players.find((p) => p.socketId === mySocketId)?.roleAcknowledged}
        >
          I have seen my role
        </button>
      </div>

      {/* Show acknowledgment progress across all players */}
      <div style={{ opacity: 0.8 }}>
        Acknowledged: {ackedCount}/{roomState?.players.length}
      </div>
    </div>
  );
};
