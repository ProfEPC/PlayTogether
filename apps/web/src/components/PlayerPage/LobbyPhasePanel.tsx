import type { FC } from "react";
import type { RoomState } from "../../types/room";

interface LobbyPhasePanelProps {
  roomState: RoomState;
}

export const LobbyPhasePanel: FC<LobbyPhasePanelProps> = ({ roomState }) => {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Players ({roomState.players.length} of {roomState.settings.maxPlayers})
      </div>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {roomState.players.map((p) => (
          <li key={p.socketId} style={{ marginBottom: 4 }}>
            {p.name}{" "}
            <span style={{ opacity: 0.75 }}>
              ({p.ready ? "ready" : "not ready"})
            </span>
          </li>
        ))}
      </ul>
      {roomState.game.powerSummary &&
        roomState.game.powerSummary.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>Recent actions</div>
            <ul style={{ paddingLeft: 18, margin: 6 }}>
              {roomState.game.powerSummary.slice(-5).map((s, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {new Date(s.at).toLocaleTimeString()}: {s.actorName} used{" "}
                  {s.type}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
};
