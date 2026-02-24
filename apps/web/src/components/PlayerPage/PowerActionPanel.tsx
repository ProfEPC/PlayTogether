import type { FC } from "react";
import { useState } from "react";
import { socket } from "../../lib/socket";
import type { RoomState, Character } from "../../types/room";
import { INFILTRATION_POWERS } from "../../constants/infiltrationPowers";
import "./PowerActionPanel.css";

interface PowerActionPanelProps {
  roomState: RoomState | null;
  mySocketId: string | undefined;
  character?: Character;
}

export const PowerActionPanel: FC<PowerActionPanelProps> = ({
  roomState,
  mySocketId,
  character,
}) => {
  const [selectedTargets, setSelectedTargets] = useState<{
    players: string[];
    centers: number[];
  }>({ players: [], centers: [] });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!roomState || roomState.game.phase !== "mayhem") return null;
  if (!character || character.powers.length === 0) return null;

  const myPlayer = roomState.players.find((p) => p.socketId === mySocketId);
  if (!myPlayer || myPlayer.powerUsed) return null;

  // Find first power with powerIndex not null
  const activePower = character.powers.find((p) => p.powerIndex !== null);
  if (!activePower || activePower.powerIndex === null) return null;

  // Look up full power definition from constants
  const fullPowerDef = INFILTRATION_POWERS[activePower.powerIndex - 1];
  if (!fullPowerDef) return null;

  // Skip powers with no targets
  if (!activePower.where || !fullPowerDef.max || fullPowerDef.max === 0)
    return null;

  const handleSelectPlayer = (socketId: string) => {
    const playerTargets = selectedTargets.players;
    if (playerTargets.includes(socketId)) {
      setSelectedTargets({
        ...selectedTargets,
        players: playerTargets.filter((id) => id !== socketId),
      });
    } else {
      if (playerTargets.length < actualQuantity) {
        setSelectedTargets({
          ...selectedTargets,
          players: [...playerTargets, socketId],
        });
      } else {
        // At capacity, replace the oldest selection with the new one
        setSelectedTargets({
          ...selectedTargets,
          players: [...playerTargets.slice(1), socketId],
        });
      }
    }
  };

  const handleSelectCenter = (centerNum: number) => {
    const centerTargets = selectedTargets.centers;
    if (centerTargets.includes(centerNum)) {
      setSelectedTargets({
        ...selectedTargets,
        centers: centerTargets.filter((c) => c !== centerNum),
      });
    } else {
      if (centerTargets.length < actualQuantity) {
        setSelectedTargets({
          ...selectedTargets,
          centers: [...centerTargets, centerNum],
        });
      } else {
        // At capacity, replace the oldest selection with the new one
        setSelectedTargets({
          ...selectedTargets,
          centers: [...centerTargets.slice(1), centerNum],
        });
      }
    }
  };

  const handleRandom = () => {
    const otherPlayers = roomState.players.filter(
      (p) => p.socketId !== mySocketId,
    );

    if (activePower.where === "Player") {
      const shuffled = [...otherPlayers].sort(() => Math.random() - 0.5);
      const randomPlayers = shuffled
        .slice(0, actualQuantity)
        .map((p) => p.socketId);
      setSelectedTargets({
        ...selectedTargets,
        players: randomPlayers,
      });
    } else if (activePower.where === "Center") {
      const availableCenters = [1, 2, 3];
      const randomCenters = availableCenters
        .sort(() => Math.random() - 0.5)
        .slice(0, actualQuantity);
      setSelectedTargets({
        ...selectedTargets,
        centers: randomCenters,
      });
    }
  };

  const handleSubmit = async () => {
    const targetPlayers =
      activePower.where === "Player" ? selectedTargets.players : undefined;
    const targetCenter =
      activePower.where === "Center" ? selectedTargets.centers : undefined;

    setIsSubmitting(true);

    try {
      socket.emit("game:submitPower", {
        roomCode: roomState.roomCode,
        powerName: `${activePower.item || "Unknown"} Power`,
        targetPlayers,
        targetCenter,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    selectedTargets.players.length + selectedTargets.centers.length > 0 &&
    !isSubmitting;

  const quantity = fullPowerDef.max || 1;
  const selected =
    selectedTargets.players.length + selectedTargets.centers.length;
  const actualQuantity = activePower.quantity || quantity;
  const descriptionWithQuantity = (fullPowerDef.description || "").replace(
    /#/g,
    String(actualQuantity),
  );

  return (
    <div className="power-action-panel">
      {character && (
        <div style={{ marginBottom: 12, fontSize: "0.9em", opacity: 0.8 }}>
          Character: <strong>{character.name}</strong>
        </div>
      )}
      <h3>{fullPowerDef.powerName || "Use Power"}</h3>
      <p>{descriptionWithQuantity || `Select ${quantity} target(s).`}</p>

      {fullPowerDef.where === "Player" && (
        <div className="player-targets">
          <h4>
            Select {fullPowerDef.item ? `${fullPowerDef.item}s` : "Players"}
          </h4>
          <div className="button-grid">
            {roomState.players.map((player) => {
              if (player.socketId === mySocketId) return null;
              const isSelected = selectedTargets.players.includes(
                player.socketId,
              );
              return (
                <button
                  key={player.socketId}
                  className={`player-button ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectPlayer(player.socketId)}
                  disabled={isSubmitting}
                >
                  {player.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fullPowerDef.where === "Center" && (
        <div className="center-targets">
          <h4>
            Select{" "}
            {fullPowerDef.item ? `${fullPowerDef.item}s` : "Center Roles"}
          </h4>
          <div className="button-grid">
            {[1, 2, 3].map((centerNum) => {
              const isSelected = selectedTargets.centers.includes(centerNum);
              return (
                <button
                  key={`center-${centerNum}`}
                  className={`center-button ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectCenter(centerNum)}
                  disabled={isSubmitting}
                >
                  Center {centerNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="power-controls">
        <button
          className="random-button"
          onClick={handleRandom}
          disabled={isSubmitting}
        >
          Random
        </button>

        <div className="selection-info">
          {selected}/{actualQuantity} selected
        </div>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {selected >= actualQuantity && (
        <div className="complete-message">✓ Ready to submit</div>
      )}
    </div>
  );
};
