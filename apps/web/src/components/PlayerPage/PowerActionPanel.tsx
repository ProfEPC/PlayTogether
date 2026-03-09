import type { FC } from "react";
import type { RoomState, Character } from "../../types/room";
import { getVillagerCenterPlayers } from "../../utils/roleTeamHelper";
import {
  getSelectedCount,
  getDescriptionWithQuantity,
  canSubmit,
  isSelectionComplete,
} from "../../utils/powerActionHelpers";
import { validatePowerAction } from "../../utils/powerActionValidation";
import { usePowerTargetSelection } from "../../hooks/usePowerTargetSelection";
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
  const {
    selectedTargets,
    isSubmitting,
    handleSelectPlayer,
    handleSelectCenter,
    handleRandom,
    handleSubmit,
  } = usePowerTargetSelection(0);

  const validation = validatePowerAction(roomState, mySocketId, character);
  if (!validation) return null;

  const { activePower, fullPowerDef, quantity, actualQuantity } = validation;

  const isReady = canSubmit(selectedTargets, isSubmitting);
  const isComplete = isSelectionComplete(selectedTargets, actualQuantity);
  const selected = getSelectedCount(selectedTargets);
  const descriptionWithQuantity = getDescriptionWithQuantity(
    fullPowerDef.description,
    actualQuantity,
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
            {/* Role Spotlight (index 20): Show villager players + villager center roles */}
            {fullPowerDef.index === 20 ? (
              <>
                {validation.roomState.players
                  .filter(
                    (p) =>
                      p.character?.team === "villager" &&
                      p.socketId !== mySocketId,
                  )
                  .map((player) => {
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
                        {player.character?.name || player.name}
                      </button>
                    );
                  })}
                {getVillagerCenterPlayers(validation.roomState.players).map(
                  (player) => {
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
                        {player.character?.name || player.name}
                      </button>
                    );
                  },
                )}
              </>
            ) : (
              /* Other Player-type powers: Show all players */
              validation.roomState.players
                .filter((p) => p.socketId !== mySocketId)
                .map((player) => {
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
                })
            )}
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
          onClick={() =>
            handleRandom(
              validation.roomState,
              mySocketId,
              fullPowerDef.where,
              actualQuantity,
            )
          }
          disabled={isSubmitting}
        >
          Random
        </button>

        <div className="selection-info">
          {selected}/{actualQuantity} selected
        </div>

        <button
          className="submit-button"
          onClick={() =>
            handleSubmit(
              validation.roomState.roomCode,
              `${activePower.item || "Unknown"} Power`,
              activePower.where || "Player",
            )
          }
          disabled={!isReady}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {isComplete && <div className="complete-message">✓ Ready to submit</div>}
    </div>
  );
};
