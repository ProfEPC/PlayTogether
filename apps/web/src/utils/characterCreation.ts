import type {
  CharacterInCreation,
  FilterContext,
  BlockerMessage,
  PowerSlot,
} from "../types/characterCreation";
import {
  INFILTRATION_POWERS,
  type InfiltrationPower,
} from "../constants/infiltrationPowers";

/**
 * Get all blockers/warnings for the current character state
 * Implements all 8 special filtering rules
 */
export function getBlockers(
  character: CharacterInCreation,
  powers: InfiltrationPower[] = INFILTRATION_POWERS
): BlockerMessage[] {
  const blockers: BlockerMessage[] = [];

  character.powerSlots.forEach((slot, index) => {
    const slotNumber = index + 1;

    // Rule 1: If Slot 1 is "No Action", cannot add more slots
    if (slotNumber > 1) {
      const slot1 = character.powerSlots[0];
      if (slot1.powerIndex !== null) {
        const slot1Power = powers.find((p) => p.index === slot1.powerIndex);
        if (slot1Power?.powerName === "No Action") {
          blockers.push({
            slotNumber,
            field: "power",
            reason:
              "Cannot add more slots when Slot 1 is 'No Action'. Remove or change Slot 1.",
          });
          return;
        }
      }
    }

    // Rule 2: Slots 2 and 3 cannot select "No Action"
    if (slotNumber > 1 && slot.powerIndex !== null) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (power?.powerName === "No Action") {
        blockers.push({
          slotNumber,
          field: "power",
          reason: `Slot ${slotNumber} cannot have 'No Action'. Use only in Slot 1.`,
        });
      }
    }

    // Rule 3: Infected toggle disabled for "Roll Rolecall"
    if (slot.powerIndex !== null && slot.toggles.infected !== undefined) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (power?.powerName === "Roll Rolecall" && slot.toggles.infected) {
        blockers.push({
          slotNumber,
          field: "toggle",
          reason:
            "'Roll Rolecall' cannot use Infected toggle. Uncheck Infected.",
        });
      }
    }

    // Rule 4: Timing selector only for Learn/Reveal types
    if (slot.powerIndex !== null && slot.timing) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (!["Learn", "Reveal"].includes(power?.type || "")) {
        blockers.push({
          slotNumber,
          field: "timing",
          reason:
            "Timing selector only applies to Learn/Reveal powers. Clear timing.",
        });
      }
    }

    // Rule 5: Murderer compatibility with timing
    if (
      slot.powerIndex !== null &&
      slot.timing &&
      character.powerSlots.some(
        (other) =>
          other.powerIndex !== null &&
          powers.find((p) => p.index === other.powerIndex)?.powerName ===
            "Murderer"
      )
    ) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (["Learn", "Reveal"].includes(power?.type || "")) {
        blockers.push({
          slotNumber,
          field: "timing",
          reason:
            "Cannot use timing selector when Murderer is in another slot. Remove Murderer or clear timing.",
        });
      }
    }

    // Rule 6: Predicter compatibility with timing
    if (
      slot.powerIndex !== null &&
      slot.timing &&
      character.powerSlots.some(
        (other) =>
          other.powerIndex !== null &&
          powers.find((p) => p.index === other.powerIndex)?.powerName ===
            "Predicter"
      )
    ) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (["Learn", "Reveal"].includes(power?.type || "")) {
        blockers.push({
          slotNumber,
          field: "timing",
          reason:
            "Cannot use timing selector when Predicter is in another slot. Remove Predicter or clear timing.",
        });
      }
    }

    // Rule 7: LookPostAction toggle only when applicable
    if (slot.powerIndex !== null && slot.toggles.lookPostAction) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (!power?.lookPostAction) {
        blockers.push({
          slotNumber,
          field: "toggle",
          reason:
            "LookPostAction toggle not available for this power. Uncheck it.",
        });
      }
    }

    // Rule 8: DoPower toggle only when applicable
    if (slot.powerIndex !== null && slot.toggles.doPower) {
      const power = powers.find((p) => p.index === slot.powerIndex);
      if (!power?.doPower) {
        blockers.push({
          slotNumber,
          field: "toggle",
          reason: "DoPower toggle not available for this power. Uncheck it.",
        });
      }
    }
  });

  return blockers;
}

/**
 * Get available types given the current state
 */
export function getAvailableTypes(context: FilterContext): string[] {
  const powers = context.powers || INFILTRATION_POWERS;
  const uniqueTypes = new Set(powers.map((p) => p.type));
  return Array.from(uniqueTypes).sort();
}

/**
 * Get available items for a given type
 */
export function getAvailableItems(
  context: FilterContext,
  selectedType: string | null
): string[] {
  if (!selectedType) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  const itemsForType = powers
    .filter((p) => p.type === selectedType)
    .map((p) => p.item);
  const uniqueItems = new Set(itemsForType);
  return Array.from(uniqueItems).sort();
}

/**
 * Get available "where" values for a given type+item combo
 */
export function getAvailableWhere(
  context: FilterContext,
  selectedType: string | null,
  selectedItem: string | null
): string[] {
  if (!selectedType || !selectedItem) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  const whereValues = powers
    .filter((p) => p.type === selectedType && p.item === selectedItem)
    .map((p) => p.where);
  const uniqueWhere = new Set(whereValues);
  return Array.from(uniqueWhere).sort();
}

/**
 * Get available powers for a given type+item+where combo
 */
export function getAvailablePowers(
  context: FilterContext,
  selectedType: string | null,
  selectedItem: string | null,
  selectedWhere: string | null
): InfiltrationPower[] {
  if (!selectedType || !selectedItem || !selectedWhere) return [];
  const powers = context.powers || INFILTRATION_POWERS;
  return powers.filter(
    (p) =>
      p.type === selectedType &&
      p.item === selectedItem &&
      p.where === selectedWhere
  );
}

/**
 * Get the selected power object
 */
export function getSelectedPower(
  slot: PowerSlot,
  powers: InfiltrationPower[] = INFILTRATION_POWERS
): InfiltrationPower | null {
  if (!slot.powerIndex) return null;
  return powers.find((p) => p.index === slot.powerIndex) || null;
}

/**
 * Check if a specific toggle is applicable for a power
 */
export function isToggleApplicable(
  power: InfiltrationPower | null,
  toggleName:
    | "infected"
    | "allowRandom"
    | "lookPostAction"
    | "doPower"
    | "fixedAction"
    | "fixedInitiative"
): boolean {
  if (!power) return false;

  const toggleMap: Record<string, keyof InfiltrationPower> = {
    infected: "infected",
    allowRandom: "allowRandom",
    lookPostAction: "lookPostAction",
    doPower: "doPower",
    fixedAction: "fixedAction",
    fixedInitiative: "fixedInitiative",
  };

  const powerField = toggleMap[toggleName];
  return power[powerField] === true;
}

/**
 * Validate amount value against power's min/max
 */
export function getAmountError(
  power: InfiltrationPower | null,
  amount: string | null
): string | null {
  if (!power || !amount) return null;
  if (amount === "ALL") return null; // Always valid

  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount)) return "Amount must be a valid number or 'ALL'";
  if (numAmount < power.min) return `Minimum amount is ${power.min}`;
  if (numAmount > power.max) return `Maximum amount is ${power.max}`;
  if (numAmount > 5 && power.allowRandom)
    return "Numeric amount capped at 5 (use 'ALL' for more)";

  return null;
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
  powers: InfiltrationPower[] = INFILTRATION_POWERS
): boolean {
  // Can't add if already have 3 slots
  if (character.powerSlots.length >= 3) return false;

  // Can't add if Slot 1 is "No Action"
  const slot1 = character.powerSlots[0];
  if (slot1 && slot1.powerIndex !== null) {
    const slot1Power = powers.find((p) => p.index === slot1.powerIndex);
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
  };
}
/**
 * Get the disambiguation prompt and choices for duplicate powers
 * Returns prompt text and the two powers with their distinguishing info
 */
export function getDisambiguationPrompt(powers: InfiltrationPower[]): {
  prompt: string;
  choices: Array<{ power: InfiltrationPower; label: string }>;
} | null {
  if (powers.length !== 2) return null;

  const [p1, p2] = powers;
  const key = `${p1.type}|${p1.item}|${p1.where}`;

  // Learn, Amount, Role: Player vs Center
  if (key === "Learn|Amount|Role") {
    const playerPower = p1.description.includes("Players") ? p1 : p2;
    const centerPower = p1.description.includes("Center") ? p1 : p2;
    return {
      prompt: "Target for learning roles:",
      choices: [
        { power: playerPower, label: "Players" },
        { power: centerPower, label: "Center" },
      ],
    };
  }

  // Learn, Amount, Association: Player vs Center
  if (key === "Learn|Amount|Association") {
    const playerPower = p1.description.includes("Players") ? p1 : p2;
    const centerPower = p1.description.includes("Center") ? p1 : p2;
    return {
      prompt: "Target for learning teams:",
      choices: [
        { power: playerPower, label: "Players" },
        { power: centerPower, label: "Center" },
      ],
    };
  }

  // Swap, Role, Player: Player vs Self
  if (key === "Swap|Role|Player") {
    const playerPower = p1.description.includes("Two Players") ? p1 : p2;
    const selfPower = p1.description.includes("Own Role") ? p1 : p2;
    return {
      prompt: "Swap roles with:",
      choices: [
        { power: playerPower, label: "Another Player" },
        { power: selfPower, label: "Your Own Role" },
      ],
    };
  }

  // Swap, Team, Self: Player (→) Self vs Self (→) Player
  if (key === "Swap|Team|Self") {
    const playerToSelfPower = p1.description.includes("Another Player")
      ? p1
      : p2;
    const selfToPlayerPower = p1.description.includes("your own") ? p1 : p2;
    return {
      prompt: "Swap team:",
      choices: [
        { power: playerToSelfPower, label: "Your team ↔ Another Player" },
        { power: selfToPlayerPower, label: "Another's team → You" },
      ],
    };
  }

  // Alter, Initiative, Player: Alter vs Set
  if (key === "Alter|Initiative|Player") {
    const alterPower = p1.description.includes("Alter") ? p1 : p2;
    const setPower = p1.description.includes("Set") ? p1 : p2;
    return {
      prompt: "Priority action:",
      choices: [
        { power: alterPower, label: "Alter (Warp)" },
        { power: setPower, label: "Set (Fixed)" },
      ],
    };
  }

  // Alter, Initiative, Role: Alter vs Set
  if (key === "Alter|Initiative|Role") {
    const alterPower = p1.description.includes("Alter") ? p1 : p2;
    const setPower = p1.description.includes("Set") ? p1 : p2;
    return {
      prompt: "Priority action:",
      choices: [
        { power: alterPower, label: "Alter (Rewrite)" },
        { power: setPower, label: "Set (Rule)" },
      ],
    };
  }

  return null;
}
