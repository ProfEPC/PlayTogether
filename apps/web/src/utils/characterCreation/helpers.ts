import type {
  CharacterInCreation,
  PowerSlot,
} from "../../types/characterCreation";
import {
  INFILTRATION_POWERS,
  type InfiltrationPower,
} from "../../constants/infiltrationPowers";

/**
 * Get a power by its 1-based index.
 * Returns null if index is invalid or out of bounds.
 */
export function getPowerByIndex(
  index: number | null,
  powers: InfiltrationPower[] = INFILTRATION_POWERS,
): InfiltrationPower | null {
  if (index === null) return null;
  return powers.find(p => p.index === index) || null;
}

/**
 * Check if a slot can be removed (not Slot 1)
 */
export function canRemoveSlot(slotNumber: number): boolean {
  return slotNumber > 1;
}

/**
 * Check if a new slot can be added
 */
export function canAddSlot(
  character: CharacterInCreation,
  powers: InfiltrationPower[] = INFILTRATION_POWERS,
): boolean {
  // Can't add if already have 3 slots
  if (character.powerSlots.length >= 3) return false;

  // Can't add if Slot 1 is "No Action" (Rule 1 from validators)
  const slot1 = character.powerSlots[0];
  if (slot1 && slot1.powerIndex !== null) {
    const slot1Power = getPowerByIndex(slot1.powerIndex, powers);
    if (slot1Power?.powerName === "No Action") return false;
  }

  return true;
}

/**
 * Create a new empty power slot
 */
export function createEmptySlot(): PowerSlot {
  return {
    powerIndex: null,
    type: null,
    item: null,
    where: null,
    amount: null,
    toggles: {},
    timing: null,
    targetScope: undefined,
  };
}
