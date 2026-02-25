import type { FC } from "react";
import { socket } from "../../lib/socket";
import type { RoomState } from "../../types/room";

interface RoleRevealPanelProps {
  roomState: RoomState | null;
  myCharacter?: {
    name: string;
    description: string;
    team?: "villager" | "infiltrator";
  } | null;
  mySocketId: string | undefined;
  onAck: () => void;
}

export const RoleRevealPanel: FC<RoleRevealPanelProps> = ({
  roomState,
  myCharacter,
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

  // Determine team color from character's team affiliation
  const roleColor = myCharacter?.team === "infiltrator" ? "#a00" : "#060";

  const handleAckRole = () => {
    if (!roomState || !myCharacter) return;
    socket.emit("player:ackRole", {
      roomCode: roomState.roomCode,
      seen: true,
    });
    onAck();
  };

  const ackedCount =
    roomState?.players.filter((p) => p.roleAcknowledged).length ?? 0;

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      {/* Display the player's assigned character */}
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Character</div>
      <div style={{ marginBottom: 8 }}>
        <strong style={{ color: roleColor }}>
          {myCharacter ? myCharacter.name : "Waiting for character..."}
        </strong>
      </div>

      {/* Acknowledge button - disabled once player has already acknowledged */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={handleAckRole}
          disabled={
            !myCharacter ||
            !!roomState?.players.find((p) => p.socketId === mySocketId)
              ?.roleAcknowledged
          }
        >
          I have seen my character
        </button>
      </div>

      {/* Show acknowledgment progress across all players */}
      <div style={{ opacity: 0.8 }}>
        Acknowledged: {ackedCount}/{roomState?.players.length}
      </div>
    </div>
  );
};
