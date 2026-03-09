import type { FC } from "react";
import { COLORS } from "../../constants/colors";

interface HostHeaderProps {
  showClose: boolean;
  gameTitle: string;
  roomCode: string;
  onClose: () => void;
  onCopy: () => void;
}

/**
 * Header bar for the host setup/game screen.
 * Shows: close button (left), game title (center), room code + copy (right).
 */
export const HostHeader: FC<HostHeaderProps> = ({
  showClose,
  gameTitle,
  roomCode,
  onClose,
  onCopy,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 12,
    }}
  >
    {/* Left: Close button */}
    {showClose && (
      <button
        onClick={onClose}
        style={{
          padding: "8px 12px",
          backgroundColor: COLORS.actionDanger,
          color: COLORS.actionDangerText,
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
      {gameTitle}
    </div>

    {/* Right: Room code block */}
    <div
      style={{
        width: 160,
        padding: 10,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, textAlign: "center" }}>
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
            width: 120,
            fontSize: 20,
            letterSpacing: 5,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: "6px 8px",
            fontWeight: 800,
            textAlign: "center",
            background: COLORS.backgroundLight,
            color: COLORS.textDark,
            userSelect: "text",
          }}
        >
          {roomCode}
        </div>

        <button
          onClick={onCopy}
          disabled={!roomCode || roomCode === "----"}
          style={{ padding: "6px 10px" }}
          title="Copy room code"
          aria-label="Copy room code"
        >
          COPY
        </button>
      </div>
    </div>
  </div>
);
