import type {
  CharacterInCreation,
  BlockerMessage,
} from "../../types/characterCreation";
import {
  INFILTRATION_POWERS,
  type InfiltrationPower,
} from "../../constants/infiltrationPowers";

/**
 * Get all blockers/warnings for the current character state
 * Implements all 8 special filtering rules
 */
export function getBlockers(
  character: CharacterInCreation,
  powers: InfiltrationPower[] = INFILTRATION_POWERS,
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
    | "fixedInitiative",
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
  amount: string | null,
): string | null {
  if (!power || !amount) return null;

  // Extract numeric value from settings power strings (e.g., "UP TO 30", "SHORTEN UP TO 30")
  let numericPart = amount
    .replace("SHORTEN ", "")
    .replace("LENGTHEN ", "")
    .replace("UP TO ", "")
    .trim();

  const numAmount = parseInt(numericPart, 10);
  if (isNaN(numAmount)) return "Amount must be a valid number";
  if (numAmount < power.min) return `Minimum amount is ${power.min}`;
  if (numAmount > power.max) return `Maximum amount is ${power.max}`;

  return null;
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
        { power: playerToSelfPower, label: "Your team ↔ Another team" },
        { power: selfToPlayerPower, label: "Another team → Your team" },
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
