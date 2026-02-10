import { useState } from "react";
import type {
  CharacterInCreation,
} from "../../../types/characterCreation";
import { INFILTRATION_POWERS } from "../../../constants/infiltrationPowers";
import {
  getBlockers,
  canAddSlot,
  createEmptySlot,
} from "../../../utils/characterCreation";
import { PowerSlotEditor } from "./PowerSlot";
import "./CharacterCreation.css";

export default function CharacterCreation() {
  const [character, setCharacter] = useState<CharacterInCreation>({
    name: "",
    description: "",
    powerSlots: [createEmptySlot()], // Start with Slot 1
  });

  const blockers = getBlockers(character, INFILTRATION_POWERS);

  // ============ Handlers ============

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacter({ ...character, name: e.target.value });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCharacter({ ...character, description: e.target.value });
  };

  const handlePowerSlotChange = (
    slotIndex: number,
    updates: Record<string, unknown>
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
    if (slotIndex > 0) {
      setCharacter({
        ...character,
        powerSlots: character.powerSlots.filter((_, i) => i !== slotIndex),
      });
    }
  };

  const slotBlockers = (slotNumber: number) =>
    blockers.filter((b) => b.slotNumber === slotNumber);

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
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={character.description}
              onChange={handleDescriptionChange}
              placeholder="e.g., A shadowy figure who learns secrets..."
              rows={3}
            />
          </div>
        </div>

        {/* Power Slots */}
        <div className="form-section">
          <h2>Powers ({character.powerSlots.length}/3)</h2>

          {character.powerSlots.map((slot, index) => (
            <PowerSlotEditor
              key={index}
              slotNumber={index + 1}
              slot={slot}
              blockers={slotBlockers(index + 1)}
              onChange={(updates: Record<string, unknown>) => handlePowerSlotChange(index, updates)}
              onRemove={() => handleRemoveSlot(index)}
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
    </div>
  );
}
