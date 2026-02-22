/**
 * Infiltration Power Type Definition
 * Represents all properties of a single infiltration power
 */

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
};
