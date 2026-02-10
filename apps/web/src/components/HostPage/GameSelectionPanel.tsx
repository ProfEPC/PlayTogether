import type { FC } from "react";
import type { GameKey } from "../../types/room";

interface GameSelectionPanelProps {
  connected: boolean;
  selectedGameKey: GameKey | "";
  onSelectGame: (gameKey: GameKey) => void;
}

export const GameSelectionPanel: FC<GameSelectionPanelProps> = ({
  connected,
  selectedGameKey,
  onSelectGame,
}) => (
  <div style={{ padding: 16 }}>
    <h1>Host</h1>

    {/* Display connection status */}
    <p>
      Socket: <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
    </p>

    <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
      {/* Game selection buttons - choose between Infiltration and Odd One Out */}
      <div
        style={{
          padding: 24,
          border: "1px solid #ccc",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          Select a game to host
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => onSelectGame("infiltration")}
            style={{
              padding: "12px 18px",
              minWidth: 160,
              fontSize: 16,
              background: selectedGameKey === "infiltration" ? "#036" : "#eee",
              color: selectedGameKey === "infiltration" ? "#fff" : "#000",
              border: "none",
              borderRadius: 6,
            }}
          >
            Infiltration
          </button>

          <button
            onClick={() => onSelectGame("odd_one_out")}
            style={{
              padding: "12px 18px",
              minWidth: 160,
              fontSize: 16,
              background: selectedGameKey === "odd_one_out" ? "#036" : "#eee",
              color: selectedGameKey === "odd_one_out" ? "#fff" : "#000",
              border: "none",
              borderRadius: 6,
            }}
          >
            Odd One Out
          </button>
        </div>
      </div>
    </div>
  </div>
);
