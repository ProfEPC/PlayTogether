/**
 * Settings & None Powers (indices 45-46)
 *
 * Settings: Powers that modify game parameters like discussion time
 * None: Default placeholder power with no special effects
 */

import type { InfiltrationPower } from "./types";

export const SETTINGS_NONE_POWERS: InfiltrationPower[] = [
  /** [45] Time Warp - Shorten or Lengthen Discussion Times | Item: Time, Where: Room, Min: 0, Max: 300, FixedAction, FixedInit, Complexity: 2 */
  {
    index: 45,
    initiative: "0",
    powerName: "Time Warp",
    description: "Shorten or Lengthen Discussion Times",
    type: "Settings",
    item: "Time",
    where: "Room",
    min: 0,
    max: 300,
    fixedAction: true,
    fixedInitiative: true,
    infected: false,
    lookPostAction: false,
    doPower: false,
    allowRandom: false,
    vault: false,
    complexity: 2,
  },
  /** [46] No Action - Has no power, can be modified | Item: NoAction, Where: None, FixedAction, FixedInit, Complexity: 1 */
  {
    index: 46,
    initiative: "0",
    powerName: "No Action",
    description: "Has no power, can be modified",
    type: "None",
    item: "NoAction",
    where: "None",
    min: 0,
    max: 0,
    fixedAction: true,
    fixedInitiative: true,
    infected: false,
    lookPostAction: false,
    doPower: false,
    allowRandom: false,
    vault: false,
    complexity: 1,
  },
];
