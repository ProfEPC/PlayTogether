import type { FilterContext, PowerSlot } from "../../types/characterCreation";
import {
  INFILTRATION_POWERS,
  type InfiltrationPower,
} from "../../constants/infiltrationPowers";

/**
 * Get available types given the current state
 */
export function getAvailableTypes(context: FilterContext): string[] {
  const powers = context.powers || INFILTRATION_POWERS;
  const uniqueTypes = new Set(powers.map((p) => p.type));
  return Array.from(uniqueTypes);
}

/**
 * Get available items for a given type
 */
export function getAvailableItems(
  context: FilterContext,
  selectedType: string | null,
): string[] {
  if (!selectedType) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  const itemsForType = powers
    .filter((p) => p.type === selectedType)
    .map((p) => p.item);
  const uniqueItems = new Set(itemsForType);
  return Array.from(uniqueItems);
}

/**
 * Get available "where" values for a given type+item combo
 */
export function getAvailableWhere(
  context: FilterContext,
  selectedType: string | null,
  selectedItem: string | null,
): string[] {
  if (!selectedType || !selectedItem) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  const whereValues = powers
    .filter((p) => p.type === selectedType && p.item === selectedItem)
    .map((p) => p.where);
  const uniqueWhere = new Set(whereValues);
  return Array.from(uniqueWhere);
}

/**
 * Get available powers for a given type+item+where combo
 */
export function getAvailablePowers(
  context: FilterContext,
  selectedType: string | null,
  selectedItem: string | null,
  selectedWhere: string | null,
): InfiltrationPower[] {
  if (!selectedType || !selectedItem || !selectedWhere) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  return powers.filter(
    (p) =>
      p.type === selectedType &&
      p.item === selectedItem &&
      p.where === selectedWhere,
  );
}

/**
 * Get the selected power object
 */
export function getSelectedPower(
  slot: PowerSlot,
  powers: InfiltrationPower[] = INFILTRATION_POWERS,
): InfiltrationPower | null {
  if (!slot.powerIndex) return null;
  return powers.find((p) => p.index === slot.powerIndex) || null;
}
