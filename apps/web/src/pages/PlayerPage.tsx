import { useAppStore } from "../state/useAppStore";

export default function PlayerPage() {
  const roomCode = useAppStore((s) => s.roomCode);
  const setRoomCode = useAppStore((s) => s.setRoomCode);

  const playerName = useAppStore((s) => s.playerName);
  const setPlayerName = useAppStore((s) => s.setPlayerName);

  return (
    <div style={{ padding: 16 }}>
      <h1>Player</h1>

      <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <label>
          Name:
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          Room Code:
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            style={{ width: "100%" }}
          />
        </label>

        <div>
          <strong>Preview:</strong> {playerName || "(no name)"} in{" "}
          {roomCode || "(no room)"}
        </div>
      </div>
    </div>
  );
}
