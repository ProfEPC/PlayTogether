/**
 * Condition Powers (indices 28-29)
 *
 * Powers that define unique win conditions for individual players.
 * These powers set alternative victory conditions outside standard team play.
 */

import type { InfiltrationPower } from "./types";

export const CONDITION_POWERS: InfiltrationPower[] = [
  {
    index: 28,
    initiative: "0",
    powerName: "Deathwish",
    description: "Wins If Voted Out",
    type: "Condition",
    item: "Win",
    where: "Self",
    min: 0,
    max: 0,
    fixedAction: false,
    fixedInitiative: true,
    infected: false,
    suicidal: false,
    murderer: false,
    predicter: false,
    silencer: false,
    twoXVote: false,
    lookPostAction: false,
    doPower: false,
    selfDestruct: false,
    allowRandom: false,
    vault: false,
    complexity: 1,
  },
  {
    index: 29,
    initiative: "0",
    powerName: "Oracle",
    description: "Wins If Vote Is Infiltrator",
    type: "Condition",
    item: "Win",
    where: "Vote",
    min: 0,
    max: 0,
    fixedAction: false,
    fixedInitiative: true,
    infected: false,
    suicidal: false,
    murderer: false,
    predicter: false,
    silencer: false,
    twoXVote: false,
    lookPostAction: false,
    doPower: false,
    selfDestruct: false,
    allowRandom: false,
    vault: false,
    complexity: 1,
  },
];
