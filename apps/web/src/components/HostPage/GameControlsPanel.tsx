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

  // Show Next Round button if in results phase
  const showNextRound = roomState.game.phase === "results";
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {roomState.game.started && !showNextRound && (
        <button onClick={() => endGameAction(socket, effectiveRoomCode)}>
          End Game
        </button>
      )}
      {canStart && (
        <button onClick={() => startGameAction(socket, effectiveRoomCode)}>
          Start Game
        </button>
      )}
      {showNextRound && (
        <button
          onClick={() =>
            socket.emit("game:nextRound", { roomCode: effectiveRoomCode })
          }
        >
          Next Round
        </button>
      )}
    </div>
  );
}
