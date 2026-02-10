import type { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../../utils/shared/roomCodeNormalize";
import { selectAndHostGameAction } from "../../utils/host/roomActions";
import type { GameKey } from "../../types/room";

interface GameSelectionScreenProps {
  connected: boolean;
  selectedGameKey: GameKey | "";
  roomCode: string;
  socket: Socket;
  onSelectGame: (gameKey: GameKey) => void;
  onSetup: () => void;
  onStatusUpdate: (status: string) => void;
  onRoomCodeUpdate: (code: string) => void;
}

export function GameSelectionScreen({
  connected,
  selectedGameKey,
  roomCode,
  socket,
  onSelectGame,
  onSetup,
  onStatusUpdate,
  onRoomCodeUpdate,
}: GameSelectionScreenProps) {
  const handleGameSelect = (gameKey: GameKey) => {
    onSelectGame(gameKey);
    onSetup();
    const normalizedCode = normalizeRoomCode(roomCode);
    onRoomCodeUpdate(normalizedCode);
    selectAndHostGameAction(socket, roomCode, gameKey, onStatusUpdate);
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Host</h1>

      <p>
        Socket:{" "}
        <strong>{connected ? "connected ✅" : "disconnected ❌"}</strong>
      </p>

      <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
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
              onClick={() => handleGameSelect("infiltration")}
              style={{
                padding: "12px 18px",
                minWidth: 160,
                fontSize: 16,
                background:
                  selectedGameKey === "infiltration" ? "#036" : "#eee",
                color: selectedGameKey === "infiltration" ? "#fff" : "#000",
                border: "none",
                borderRadius: 6,
              }}
            >
              Infiltration
            </button>

            <button
              onClick={() => handleGameSelect("odd_one_out")}
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

          {/* Continue button removed: selecting a game now immediately hosts */}
        </div>
      </div>
    </div>
  );
}
