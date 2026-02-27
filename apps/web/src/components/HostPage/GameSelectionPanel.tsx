import type { FC } from "react";
import type { GameKey } from "../../types/room";
import { COLORS } from "../../constants/colors";
import { GAMES } from "../../constants/games";

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
          border: `1px solid ${COLORS.border}`,
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
            flexWrap: "wrap",
          }}
        >
          {GAMES.map((game) => (
            <button
              key={game.key}
              onClick={() => onSelectGame(game.key)}
              style={{
                padding: "12px 18px",
                minWidth: 160,
                fontSize: 16,
                background: selectedGameKey === game.key ? COLORS.primary : COLORS.backgroundSecondary,
                color: selectedGameKey === game.key ? COLORS.primaryText : COLORS.text,
                border: "none",
                borderRadius: 6,
              }}
              title={game.description}
            >
              {game.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);
