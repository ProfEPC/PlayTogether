import type { FC } from "react";
import type { RoomState, Character } from "../../types/room";
import { getInnocentNPCs } from "../../utils/roleTeamHelper";
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
  // Validate before hook so we can pass the real actualQuantity
  const validation = validatePowerAction(roomState, mySocketId, character);

  const {
    selectedTargets,
    isSubmitting,
    handleSelectPlayer,
    handleSelectNPC,
    handleRandom,
    handleSubmit,
  } = usePowerTargetSelection(validation?.actualQuantity ?? 1);

  if (!validation) return null;

  const { activePower, fullPowerDef, quantity, actualQuantity } = validation;

  // Determine which target grids to show based on targetScope or fallback to where
  const targetScope = activePower.targetScope;
  const showPlayerGrid =
    targetScope === "Players Only" ||
    targetScope === "Players and NPC" ||
    (!targetScope && fullPowerDef.where === "Player");
  const showNPCGrid =
    targetScope === "NPC Only" ||
    targetScope === "Players and NPC" ||
    (!targetScope && fullPowerDef.where === "NPC");

  // Derive effective "where" for submit/random (for powers without targetScope)
  const effectiveWhere = targetScope
    ? targetScope === "NPC Only"
      ? "NPC"
      : "Player"
    : activePower.where || "Player";

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

      {showPlayerGrid && (
        <div className="player-targets">
          <h4>
            Select {fullPowerDef.item ? `${fullPowerDef.item}s` : "Players"}
          </h4>
          <div className="button-grid">
            {/* Role Spotlight (index 20): Show innocent players + innocent NPC roles */}
            {fullPowerDef.index === 20 ? (
              <>
                {validation.roomState.players
                  .filter(
                    (p) =>
                      p.character?.team === "innocent" &&
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
                {getInnocentNPCs(validation.roomState.players).map(
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
              /* Other Player-type powers: Show non-NPC players */
              validation.roomState.players
                .filter((p) => p.socketId !== mySocketId && !p.isNPC)
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

      {showNPCGrid && (
        <div className="npc-targets">
          <h4>
            Select{" "}
            {fullPowerDef.item ? `${fullPowerDef.item}s` : "NPC Roles"}
          </h4>
          <div className="button-grid">
            {[1, 2, 3].map((npcNum) => {
              const isSelected = selectedTargets.npcs.includes(npcNum);
              return (
                <button
                  key={`npc-${npcNum}`}
                  className={`npc-button ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectNPC(npcNum)}
                  disabled={isSubmitting}
                >
                  NPC {npcNum}
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
              effectiveWhere,
              actualQuantity,
              targetScope,
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
              effectiveWhere,
              targetScope,
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
