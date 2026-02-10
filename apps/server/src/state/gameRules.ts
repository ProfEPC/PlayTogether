import type { GameKey, RoomSettings } from "./types";

export const GAME_RULES: Record<
  GameKey,
  { minPlayers: number; maxPlayersCap: number }
> = {
  infiltration: { minPlayers: 3, maxPlayersCap: 8 },
  odd_one_out: { minPlayers: 3, maxPlayersCap: 10 },
};

export const DEFAULT_SETTINGS_FOR_GAME = (
  gameKey: GameKey
): Pick<RoomSettings, "gameKey" | "maxPlayers" | "gameOptions"> => {
  const cap = GAME_RULES[gameKey].maxPlayersCap;

  return {
    gameKey,
    maxPlayers: cap,
    gameOptions: {
      infiltration: {
        allowNoInfiltrator: false,
        revealVotes: true,
        numInfiltrators: 2,
        // default to enabling all special roles
        enabledRoleIds: [0, 1, 2],
      },
      odd_one_out: { revealVotes: true, numOddOnes: 2 },
    },
  };
};
