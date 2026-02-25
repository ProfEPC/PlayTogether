import { useState } from "react";
import type { CharacterInCreation } from "../../../types/characterCreation";
import { INFILTRATION_POWERS } from "../../../constants/infiltrationPowers";
import {
  getBlockers,
  canAddSlot,
  createEmptySlot,
} from "../../../utils/characterCreation";
import { saveCharacter } from "../../../lib/characterPersistence";
import { PowerSlotEditor } from "./PowerSlot";
import { CharacterModifiers } from "./components/CharacterModifiers";
import { LoadCharacterModal } from "./components/LoadCharacterModal";
import "./CharacterCreation.css";

export default function CharacterCreation() {
  const [character, setCharacter] = useState<CharacterInCreation>({
    name: "",
    description: "",
    team: null,
    infectedUponSight: false,
    powerSlots: [createEmptySlot()], // Start with Slot 1
    theme: "debug", // * Default to "debug" theme
  });

  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const blockers = getBlockers(character, INFILTRATION_POWERS);

  // ============ Helper Functions ============

  /**
   * Get the win condition power details if one exists, null otherwise.
   * Single pass through powerSlots for efficiency.
   */
  const winConditionPower = (() => {
    for (const slot of character.powerSlots) {
      if (slot.powerIndex === null) continue;
      const power = INFILTRATION_POWERS[slot.powerIndex - 1];
      if (power && power.type === "Condition" && power.item === "Win") {
        return power;
      }
    }
    return null;
  })();

  /**
   * Check if any power slot has a unique win condition (Deathwish or Oracle)
   */
  const hasWinCondition = (): boolean => !!winConditionPower;

  /**
   * Get the win condition power if one exists
   */
  const getWinConditionPower = (): {
    powerName: string;
    description: string;
  } | null =>
    winConditionPower
      ? {
          powerName: winConditionPower.powerName,
          description: winConditionPower.description,
        }
      : null;

  // ============ Handlers ============

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter({ ...character, name: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setCharacter({ ...character, description: e.target.value });
  };

  const handleTeamChange = (team: "villager" | "infiltrator") => {
    setCharacter({ ...character, team });
  };

  const handleInfectedUponSightChange = (checked: boolean) => {
    setCharacter({ ...character, infectedUponSight: checked });
  };

  const handlePowerSlotChange = (
    slotIndex: number,
    updates: Record<string, unknown>,
  ): void => {
    const newSlots = [...character.powerSlots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], ...updates };
    setCharacter({ ...character, powerSlots: newSlots });
  };

  const handleAddSlot = () => {
    if (canAddSlot(character, INFILTRATION_POWERS)) {
      setCharacter({
        ...character,
        powerSlots: [...character.powerSlots, createEmptySlot()],
      });
    }
  };

  const handleRemoveSlot = (slotIndex: number) => {
    if (slotIndex === 0) {
      // For slot 1, clear it instead of removing
      setCharacter({
        ...character,
        powerSlots: [createEmptySlot(), ...character.powerSlots.slice(1)],
      });
    } else {
      // For slots 2+, remove them
      setCharacter({
        ...character,
        powerSlots: character.powerSlots.filter((_, i) => i !== slotIndex),
      });
    }
  };

  const handleSaveCharacter = async () => {
    if (!character.name.trim()) {
      setSaveMessage("Please enter a character name before saving.");
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);

    try {
      await saveCharacter(character);
      setSaveMessage("Character saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage(
        err instanceof Error
          ? `Failed to save: ${err.message}`
          : "Failed to save character",
      );
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLoadCharacter = (loadedCharacter: CharacterInCreation) => {
    setCharacter(loadedCharacter);
    setSaveMessage("Character loaded successfully!");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const slotBlockers = (slotNumber: number) =>
    blockers.filter((b) => b.slotNumber === slotNumber);

  /**
   * Check if character modifiers section is visible
   */
  const hasCharacterModifiers = character.powerSlots.some((slot) => {
    if (slot.powerIndex === null) return false;
    const power = INFILTRATION_POWERS[slot.powerIndex - 1];
    return power && power.infected;
  });

  return (
    <div className="character-creation">
      {/* Left Panel: Character Form */}
      <div className="form-panel">
        <h1>Create Infiltration Character</h1>

        {/* Basic Info */}
        <div className="form-section">
          <h2>Character Info</h2>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={character.name}
              onChange={handleNameChange}
              placeholder="e.g., The Spy"
            />
          </div>

          {/* Team Selector */}
          {hasWinCondition() ? (
            <div className="form-group win-condition-info">
              <div className="win-condition-badge">Unique Win Condition</div>
              <p>
                <strong>{getWinConditionPower()?.powerName}</strong>
              </p>
              <p>{getWinConditionPower()?.description}</p>
            </div>
          ) : (
            <div className="form-group team-selector">
              <label>Team:</label>
              <div className="team-buttons">
                <button
                  className={`team-button ${character.team === "villager" ? "active" : ""}`}
                  onClick={() => handleTeamChange("villager")}
                >
                  Villager
                </button>
                <button
                  className={`team-button ${character.team === "infiltrator" ? "active" : ""}`}
                  onClick={() => handleTeamChange("infiltrator")}
                >
                  Infiltrator
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={character.description}
              onChange={handleDescriptionChange}
              placeholder="e.g., A shadowy figure who learns secrets..."
              rows={3}
            />
          </div>

          {/* Theme Selector */}
          <div className="form-group">
            <label>Theme:</label>
            <input
              type="text"
              value={character.theme || "debug"}
              onChange={(e) =>
                setCharacter({ ...character, theme: e.target.value })
              }
              placeholder="e.g., debug, coop_office, heist"
            />
          </div>

          {/* Save/Load Buttons */}
          <div className="save-load-buttons">
            <button
              className="save-button"
              onClick={handleSaveCharacter}
              disabled={saveLoading}
            >
              {saveLoading ? "Saving..." : "Save Character"}
            </button>
            <button
              className="load-button"
              onClick={() => setLoadModalOpen(true)}
            >
              Load Character
            </button>
          </div>

          {saveMessage && (
            <div
              className={`save-message ${saveMessage.includes("Failed") ? "error" : "success"}`}
            >
              {saveMessage}
            </div>
          )}
        </div>

        {/* Character Modifiers (Infected Upon Sight) */}
        {hasCharacterModifiers && (
          <div className="form-section">
            <CharacterModifiers
              character={character}
              onInfectedUponSightChange={handleInfectedUponSightChange}
            />
          </div>
        )}
        {!hasCharacterModifiers && (
          <div>
            <CharacterModifiers
              character={character}
              onInfectedUponSightChange={handleInfectedUponSightChange}
            />
          </div>
        )}

        {/* Power Slots */}
        <div className="form-section">
          <h2>Powers ({character.powerSlots.length}/3)</h2>

          {character.powerSlots.map((slot, index) => (
            <PowerSlotEditor
              key={index}
              slotNumber={index + 1}
              slot={slot}
              blockers={slotBlockers(index + 1)}
              onChange={(updates: Record<string, unknown>) =>
                handlePowerSlotChange(index, updates)
              }
              onRemove={() => handleRemoveSlot(index)}
              hasCharacterModifiers={hasCharacterModifiers}
              otherPowerSlots={character.powerSlots.filter(
                (_, i) => i !== index,
              )}
            />
          ))}

          {/* Add Slot Button */}
          {character.powerSlots.length < 3 && (
            <button
              className="add-slot-button"
              onClick={handleAddSlot}
              disabled={!canAddSlot(character, INFILTRATION_POWERS)}
              title={
                character.powerSlots[0]?.powerIndex
                  ? undefined
                  : "Select Slot 1 power first"
              }
            >
              + Add Power Slot
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="form-section">
          <h2>JSON Preview</h2>
          <pre>{JSON.stringify(character, null, 2)}</pre>
        </div>
      </div>

      {/* Right Panel: Blockers */}
      <div className="blockers-panel">
        <h3>
          {blockers.length === 0
            ? "✓ No issues"
            : `⚠ ${blockers.length} issue${blockers.length !== 1 ? "s" : ""}`}
        </h3>
        {blockers.length > 0 && (
          <div className="blockers-list">
            {blockers.map((blocker, i) => (
              <div key={i} className="blocker-item">
                <strong>Slot {blocker.slotNumber}:</strong> {blocker.reason}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load Character Modal */}
      <LoadCharacterModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onLoad={handleLoadCharacter}
      />
    </div>
  );
}
