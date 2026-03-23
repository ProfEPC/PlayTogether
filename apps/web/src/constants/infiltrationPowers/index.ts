/**
 * Infiltration Powers
 *
 * Complete power system for the Infiltration game.
 * Organized by power type for better maintainability.
 *
 * Power Categories:
 * - Learn (12 powers): Information gathering about players and NPCs
 * - Reveal (3 powers): Publicly exposing role information
 * - Swap (7 powers): Modifying role and team assignments
 * - Condition (2 powers): Alternative win conditions
 * - Alter (8 powers): Blocking actions, changing priority, protection
 * - Tamper (7 powers): Interfering with voting mechanics
 * - Settings/None (2 powers): Game parameter modification and placeholder
 *
 * Total: 41 powers
 * Powers with targetScopes can target Players, NPCs, or both (selected during character creation).
 */

export type { InfiltrationPower, TargetScope } from "./types";

import { LEARN_POWERS } from "./learn";
import { REVEAL_POWERS } from "./reveal";
import { SWAP_POWERS } from "./swap";
import { CONDITION_POWERS } from "./condition";
import { ALTER_POWERS } from "./alter";
import { TAMPER_POWERS } from "./tamper";
import { SETTINGS_NONE_POWERS } from "./settingsNone";

export const INFILTRATION_POWERS = [
  ...LEARN_POWERS,
  ...REVEAL_POWERS,
  ...SWAP_POWERS,
  ...CONDITION_POWERS,
  ...ALTER_POWERS,
  ...TAMPER_POWERS,
  ...SETTINGS_NONE_POWERS,
];
