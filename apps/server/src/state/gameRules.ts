import type { GameKey, RoomSettings } from "./types";

export const GAME_RULES: Record<
  GameKey,
  { minPlayers: number; maxPlayersCap: number }
> = {
  infiltration: { minPlayers: 3, maxPlayersCap: 8 },
  odd_one_out: { minPlayers: 2, maxPlayersCap: 6 },
};

export const DEFAULT_SETTINGS_FOR_GAME = (
  gameKey: GameKey
): Pick<RoomSettings, "gameKey" | "maxPlayers" | "gameOptions"> => {
  const cap = GAME_RULES[gameKey].maxPlayersCap;

  return {
    gameKey,
    maxPlayers: cap,
    gameOptions: {
      infiltration: { allowNoInfiltrator: true, revealVotes: true },
      odd_one_out: { revealVotes: true },
    },
  };
};
