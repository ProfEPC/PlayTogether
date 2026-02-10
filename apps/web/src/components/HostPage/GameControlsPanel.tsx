import { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../../utils/shared/roomCodeNormalize";
import { startGameAction, endGameAction } from "../../utils/host/gameActions";
import type { RoomState } from "../../types/room";

interface GameControlsPanelProps {
  roomState: RoomState;
  roomCode: string;
  socket: Socket;
}

export function GameControlsPanel({
  roomState,
  roomCode,
  socket,
}: GameControlsPanelProps) {
  const effectiveRoomCode = normalizeRoomCode(roomCode);

  const minPlayers = roomState.settings.gameKey === "infiltration" ? 3 : 3;
  const hasEnoughPlayers = roomState.players.length >= minPlayers;
  const allReady = hasEnoughPlayers && roomState.players.every((p) => p.ready);
  const canStart = allReady && !roomState.game.started;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Show End Game button if game is active, Start Game if conditions are met, or nothing if waiting for players/readiness */}
      {roomState.game.started ? (
        <button onClick={() => endGameAction(socket, effectiveRoomCode)}>
          End Game
        </button>
      ) : canStart ? (
        <button onClick={() => startGameAction(socket, effectiveRoomCode)}>
          Start Game
        </button>
      ) : null}
    </div>
  );
}
