export type GameKey = "infiltration" | "odd_one_out";

export type InfiltrationGamePhase =
  | "lobby"
  | "reveal"
  | "mayhem"
  | "voting"
  | "results";
export type OddOneOutGamePhase =
  | "lobby"
  | "question"
  | "debate"
  | "vote"
  | "results";

export type GamePhase = InfiltrationGamePhase | OddOneOutGamePhase;

export type InfiltrationTeam = "infiltrator" | "innocent";

export type Vote = { value: string; submittedAt: number };

export type PowerSlot = {
  powerIndex: number | null;
  type?: string;
  item?: string;
  where?: string;
  quantity?: number;
  description?: string; // Power description/prompt text from character creation
};

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;

  // NPC flag
  isNPC?: boolean; // Is this player representing an NPC (extra character not held by a player)?

  // Character assignment
  character?: {
    name: string;
    description: string;
    team?: "innocent" | "infiltrator";
    powers: PowerSlot[];
  };

  // Per-player game state
  team?: InfiltrationTeam; // Player's assigned team (server-side)
  vote?: Vote; // Player's vote
  characterAcknowledged?: boolean; // Has player acknowledged their character?
  mayhemAcknowledged?: boolean; // Has player acknowledged completing mayhem actions?
  usedPower?: boolean; // Has player used their special power this round?

  // Power state and effects (game phase specific)
  characterRevealed?: boolean; // Has this player's character been publicly revealed?
  protected?: boolean; // Is this player currently protected/shielded from actions?
  blocked?: boolean; // Can this player not perform actions (silenced)?
  swapped?: boolean; // Has this player's team been swapped with another?
  actedThisRound?: boolean; // Has this player already acted in mayhem phase?

  // Power usage tracking
  powerUsed?: boolean; // Has this player already used a power once per game?
  learnsThisGame?: Array<{
    powerName: string;
    targetPlayer?: string;
    targetPlayerName?: string;
    targetTeam?: InfiltrationTeam;
    learned: string; // Team or other revealed info
    learnedAt: number;
    item: string;
    where: string;
  }>;
};

export type GameOptionsByKey = {
  infiltration: {
    // Character names selected by the host for this game
    selectedCharacters: string[];
  };
  odd_one_out: {
    numOddOnes: number;
  };
};

export type RoomSettings = {
  roundDurationMs: number;
  resultsDurationMs: number;
  autoAdvance: boolean;
  lockOnStart: boolean;

  requireApprovalToJoin: boolean;
  uniqueNames: boolean;
  allowRenameInLobby: boolean;
  requireAllReady: boolean;

  gameKey: GameKey;
  maxPlayers: number;

  gameOptions: GameOptionsByKey;
};

export type GameState = {
  gameId: string | null; // Unique ID for this game session (generated when game starts, persists until game ends)
  started: boolean;
  phase: GamePhase;
  endsAt: number | null;
  prompt?: string; // Current phase prompt/instruction for players

  // The teams that were not dealt to players
  unusedTeams?: Array<InfiltrationTeam>;

  // Team assignments during game (server-side only)
  _teams?: Record<string, InfiltrationTeam>;

  // Player votes during voting phase
  votes?: Record<string, { value: string; submittedAt: number }>;

  // Mayhem acknowledgments
  mayhemAck?: Record<string, boolean>;

  // Track which players have used powers this round
  usedPowers?: Record<string, boolean>;

  // Redacted summaries of power usage for display in-room (no sensitive details)
  powerSummary?: Array<{
    actorSocketId: string;
    actorName: string;
    type: string;
    target: string;
    at: number;
  }>;

  // Winner for the round (infiltration: 'innocents' | 'infiltrators' | 'none')
  winner?: "innocents" | "infiltrators" | "none";
};

export type PendingJoin = {
  socketId: string;
  name: string;
  requestedAt: number;
};

export type RoomState = {
  roomCode: string;
  hostSocketId: string | null;

  players: Player[];
  pending: PendingJoin[];

  locked: boolean;
  game: GameState;
  settings: RoomSettings;

  updatedAt: number;
};

export type CharacterConfig = {
  id: number;
  key: string;
  title: string;
  description?: string;
};
