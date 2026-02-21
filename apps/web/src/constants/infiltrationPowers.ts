/**
 * Infiltration Powers - Re-export from modular structure
 *
 * This file maintains backward compatibility with existing imports.
 * The actual power data is organized in the infiltrationPowers/ directory:
 * - types.ts: Type definitions
 * - learn.ts: Learn powers (16 powers)
 * - reveal.ts: Reveal powers (4 powers)
 * - swap.ts: Swap powers (7 powers)
 * - condition.ts: Condition powers (2 powers)
 * - alter.ts: Alter powers (8 powers)
 * - tamper.ts: Tamper powers (7 powers)
 * - settingsNone.ts: Settings & None powers (2 powers)
 * - index.ts: Main export file that combines all powers
 */

export type { InfiltrationPower } from "./infiltrationPowers/types";
export { INFILTRATION_POWERS } from "./infiltrationPowers/index";
