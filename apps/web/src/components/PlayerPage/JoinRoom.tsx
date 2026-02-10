import type { FC } from "react";

interface JoinRoomProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  canJoin: boolean;
  onJoin: () => void;
  onPaste: () => void;
}

export const JoinRoom: FC<JoinRoomProps> = ({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  canJoin,
  onJoin,
  onPaste,
}) => (
  <>
    {/* Player name input */}
    <label>
      Name:
      <input
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={{ width: "100%" }}
      />
    </label>

    {/* Room code input with paste button */}
    <label>
      Room Code:
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          style={{ flex: 1 }}
        />
        <button onClick={onPaste} style={{ padding: "6px 10px" }}>
          Paste
        </button>
      </div>
    </label>

    {/* Join button - enabled only when both name and room code are valid */}
    <button onClick={onJoin} disabled={!canJoin}>
      Join Room
    </button>
  </>
);
