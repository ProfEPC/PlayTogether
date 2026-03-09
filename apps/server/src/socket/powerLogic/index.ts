/**
 * Power logic index: exports all power-related functions from the powerLogic module.
 *
 * This module is organized into:
 * - validation.ts: Target validation and filtering
 * - prompting.ts: Power prompting for special roles
 * - execution.ts: Character power execution (unified dispatcher)
 * - utilities.ts: Utility functions (recording, resetting)
 */

// Validation
export {
  isPlayerRevealed,
  isPlayerProtected,
  getTargetsForPower,
} from "./validation";

// Prompting
export { promptPlayerForPower } from "./prompting";

// Execution (unified system)
export { executeCharacterPower } from "./execution";

// Utilities
export { recordPowerUsage, resetPlayerPowers } from "./utilities";
