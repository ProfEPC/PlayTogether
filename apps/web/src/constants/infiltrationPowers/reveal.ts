/**
 * Reveal Powers (indices 17, 19-20)
 *
 * Powers that publicly reveal role information to all players.
 * These are higher-stakes powers that expose information to the whole game.
 * Powers with targetScopes can target Players, NPCs, or both (selected during character creation).
 */

import type { InfiltrationPower } from "./types";

export const REVEAL_POWERS: InfiltrationPower[] = [
  /** [17] Expose Role - Reveal # Roles | Item: Role, Where: Player, Min: 1, Max: 3, Infected, AllowRandom, Complexity: 3, TargetScopes: Players/NPC/Both */
  {
    index: 17,
    initiative: "5 95",
    powerName: "Expose Role",
    description: "Reveal # Roles",
    type: "Reveal",
    item: "Role",
    where: "Player",
    min: 1,
    max: 3,
    fixedAction: false,
    fixedInitiative: false,
    infected: true,
    lookPostAction: false,
    doPower: true,
    allowRandom: true,
    vault: false,
    complexity: 3,
    targetScopes: ["Players Only", "NPC Only", "Players and NPC"],
  },
  /** [19] Face Reveal - Reveal self | Item: Role, Where: Self, Qty: 1, FixedAction, Infected, Complexity: 1 */
  {
    index: 19,
    initiative: "5 95",
    powerName: "Face Reveal",
    description: "Reveal self",
    type: "Reveal",
    item: "Role",
    where: "Self",
    min: 1,
    max: 1,
    fixedAction: true,
    fixedInitiative: false,
    infected: true,
    lookPostAction: false,
    doPower: false,
    allowRandom: false,
    vault: false,
    complexity: 1,
  },
  /** [20] Role Spotlight - Reveal # innocents | Item: Role, Where: Player, Min: 1, Max: 5, FixedAction, Infected, Complexity: 3, TargetScopes: Players/NPC/Both */
  {
    index: 20,
    initiative: "5 95",
    powerName: "Role Spotlight",
    description: "Reveal # innocents",
    type: "Reveal",
    item: "Role",
    where: "Player",
    min: 1,
    max: 5,
    fixedAction: false,
    fixedInitiative: false,
    infected: false,
    lookPostAction: false,
    doPower: true,
    allowRandom: true,
    vault: false,
    complexity: 3,
    targetScopes: ["Players Only", "NPC Only", "Players and NPC"],
  },
];
