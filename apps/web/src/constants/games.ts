import type { GameKey } from "../types/room";

export interface GameDefinition {
  key: GameKey;
  title: string;
  description: string;
}

export const GAMES: GameDefinition[] = [
  {
    key: "infiltration",
    title: "Infiltration",
    description: "Social deduction with roles like infiltrator, civilian, and special powers",
  },
  {
    key: "odd_one_out",
    title: "Odd One Out",
    description: "Find the odd one out among the group",
  },
];

/**
 * Get a game definition by key
 */
export function getGameDefinition(key: GameKey | ""): GameDefinition | null {
  if (!key) return null;
  return GAMES.find((g) => g.key === key) || null;
}
