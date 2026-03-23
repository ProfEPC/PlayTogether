import type { PowerSlot } from "../types/characterCreation";
import { INFILTRATION_POWERS } from "../constants/infiltrationPowers";

/**
 * Type priority for sorting (lower = earlier execution)
 */
const TYPE_PRIORITY: Record<string, number> = {
  Alter: 0,
  Learn: 1,
  Swap: 2,
  Reveal: 3,
};

/**
 * Timing priority (lower = earlier execution)
 */
const TIMING_PRIORITY: Record<string, number> = {
  before: 0,
  after: 1,
  null: 0, // Powers without timing treated as "before"
};

/**
 * Sort power slots in execution order:
 * 1. By type priority (Alter → Learn → Swap → Reveal)
 * 2. By timing within type (before → after)
 *
 * Returns indices showing the desired execution order
 */
export function getSortedPowerIndices(powerSlots: PowerSlot[]): number[] {
  // Map each slot to its sort key
  const slotsWithKeys = powerSlots
    .map((slot, index) => {
      if (!slot.powerIndex) {
        // Empty slots stay at the end
        return { index, typePriority: 999, timingPriority: 0 };
      }

      const power = INFILTRATION_POWERS.find(p => p.index === slot.powerIndex);
      if (!power) {
        return { index, typePriority: 999, timingPriority: 0 };
      }

      const typePriority = TYPE_PRIORITY[power.type] ?? 999;
      const timingPriority = TIMING_PRIORITY[slot.timing ?? "null"] ?? 0;

      return { index, typePriority, timingPriority };
    })
    .sort((a, b) => {
      // Sort by type priority first
      if (a.typePriority !== b.typePriority) {
        return a.typePriority - b.typePriority;
      }
      // Then by timing within same type
      return a.timingPriority - b.timingPriority;
    });

  return slotsWithKeys.map((item) => item.index);
}

/**
 * Reorder power slots based on sorting logic
 */
export function sortPowerSlots(powerSlots: PowerSlot[]): PowerSlot[] {
  const indices = getSortedPowerIndices(powerSlots);
  return indices.map((i) => powerSlots[i]);
}
