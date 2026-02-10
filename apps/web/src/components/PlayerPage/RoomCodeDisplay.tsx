import type { FC } from "react";
import type { RoomState } from "../../types/room";

interface RoomCodeDisplayProps {
  roomState: RoomState | null;
  roomCode: string;
  copiedRoomCode: boolean;
  onCopy: () => void;
}

export const RoomCodeDisplay: FC<RoomCodeDisplayProps> = ({
  roomState,
  roomCode,
  copiedRoomCode,
  onCopy,
}) => (
  <div style={{ padding: 8 }}>
    <div style={{ fontSize: 16, fontWeight: 700 }}>Name</div>
    <div style={{ fontSize: 18, marginBottom: 8 }}>
      {/* name is passed via slot from parent, but we'll show it via context in the parent */}
    </div>

    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div
        style={{
          background: "#fff",
          color: "#000",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 18,
          letterSpacing: 4,
          fontWeight: 700,
        }}
      >
        {(roomState?.roomCode ?? roomCode).toUpperCase()}
      </div>
      <button
        onClick={onCopy}
        disabled={!(roomState?.roomCode || roomCode)}
        style={{ padding: "6px 10px" }}
      >
        {copiedRoomCode ? "Copied" : "Copy"}
      </button>
    </div>
  </div>
);
