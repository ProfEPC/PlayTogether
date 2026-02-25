import type { InfiltrationPower } from "../constants/infiltrationPowers";

/**
 * Power slot in a character's power selections
 */
export interface PowerSlot {
  /** Index of the power (1-46), or null if not yet selected */
  powerIndex: number | null;
  /** Cascading dropdown selections */
  type: string | null;
  item: string | null;
  where: string | null;
  /** Amount to select (can be a number or "ALL") */
  amount: string | null;
  /** Toggle states for this power */
  toggles: {
    vault?: boolean;
    infected?: boolean;
    allowRandom?: boolean;
    lookPostAction?: boolean;
    doPower?: boolean;
    fixedAction?: boolean;
    fixedInitiative?: boolean;
  };
  /** Timing selector (only for Learn/Reveal types) */
  timing: "before" | "after" | null;
}

/**
 * Character being built for Infiltration game
 */
export interface CharacterInCreation {
  name: string;
  description: string;
  team: "villager" | "infiltrator" | null; // null if unique win condition
  infectedUponSight: boolean; // Character-level modifier (only available when a power with infected property is chosen)
  powerSlots: PowerSlot[]; // 0-3 slots
  theme?: string; // ? Theme identifier for content organization (e.g., "debug", "coop_office", "heist")
}

/**
 * A blocking issue that prevents a selection
 */
export interface BlockerMessage {
  slotNumber: number; // 1, 2, or 3
  field: "power" | "type" | "item" | "where" | "amount" | "toggle" | "timing";
  reason: string; // User-friendly explanation
}

/**
 * Context for filtering: what's available given current character state
 */
export interface FilterContext {
  character: CharacterInCreation;
  currentSlotNumber: number; // 1, 2, or 3
  powers: InfiltrationPower[];
}
