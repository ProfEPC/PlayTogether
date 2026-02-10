import { Socket } from "socket.io-client";

interface LobbySettingsPanelProps {
  roundSeconds: number;
  setRoundSeconds: (seconds: number) => void;
  maxPlayers: number;
  setMaxPlayers: (max: number) => void;
  lobbyLocked: boolean;
  roomCode: string;
  socket: Socket;
}

export function LobbySettingsPanel({
  roundSeconds,
  setRoundSeconds,
  maxPlayers,
  setMaxPlayers,
  lobbyLocked,
  roomCode,
  socket,
}: LobbySettingsPanelProps) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Lobby Settings</div>
      {/* Game duration and player limit controls - disabled once lobby is locked */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Set the duration of mayhem and voting phases in seconds */}
        <label>
          Round seconds:
          <input
            type="number"
            min={5}
            max={300}
            value={roundSeconds}
            disabled={lobbyLocked}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              setRoundSeconds(n);
              socket.emit("game:setDuration", {
                roomCode,
                seconds: n,
              });
            }}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>

        {/* Set the maximum number of players that can join the room */}
        <label>
          Max players:
          <input
            type="number"
            min={2}
            max={8}
            value={maxPlayers}
            disabled={lobbyLocked}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              setMaxPlayers(n);
              socket.emit("room:setMaxPlayers", {
                roomCode,
                maxPlayers: n,
              });
            }}
            style={{ width: 90, marginLeft: 8 }}
          />
        </label>
      </div>
    </div>
  );
}
