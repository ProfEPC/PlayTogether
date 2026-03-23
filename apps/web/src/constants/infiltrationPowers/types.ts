/**
 * Infiltration Power Type Definition
 * Represents all properties of a single infiltration power
 */

export type TargetScope = "Players Only" | "NPC Only" | "Players and NPC";

export type InfiltrationPower = {
  index: number;
  initiative: string;
  powerName: string;
  description: string;
  type: string;
  item: string;
  where: string;
  min: number;
  max: number;
  fixedAction: boolean;
  fixedInitiative: boolean;
  infected: boolean;
  lookPostAction: boolean;
  doPower: boolean;
  allowRandom: boolean;
  vault: boolean;
  vaultName?: string;
  complexity: number;
  /** Available target scope options — shown during character creation when power can target Players, NPCs, or both */
  targetScopes?: TargetScope[];
};
