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

export type RoleConfig = {
  id: number;
  key: string;
  title: string;
  description?: string;
};

export type Vote = {
  value: string;
  submittedAt: number;
};

export type PowerSlot = {
  powerIndex: number | null;
  type?: string;
  item?: string;
  where?: string;
  quantity?: number;
  description?: string; // Power description/prompt text from character creation
};

export type Character = {
  name: string;
  description: string;
  team?: "innocent" | "infiltrator";
  powers: PowerSlot[];
};

export type LearnRecord = {
  powerName: string;
  targetPlayer?: string;
  targetPlayerName?: string;
  targetNPC?: number;
  learned: string;
  learnedAt: number;
  item?: string;
  where?: string;
};

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;

  // NPC flag
  isNPC?: boolean; // Is this player representing an NPC?

  // Per-player game state
  team?: InfiltrationTeam; // Player's assigned team
  vote?: Vote; // Player's vote
  characterAcknowledged?: boolean; // Has player acknowledged their character?
  mayhemAcknowledged?: boolean; // Has player acknowledged completing mayhem actions?
  usedPower?: boolean; // Has player used their special power this round?
  powerUsed?: boolean; // Has player used a character power this game?

  // Character and powers
  character?: Character;
  learnsThisGame?: LearnRecord[];

  // Power state and effects (game phase specific)
  characterRevealed?: boolean; // Has this player's character been publicly revealed?
  protected?: boolean; // Is this player currently protected/shielded from actions?
  actedThisRound?: boolean; // Has this player already acted in mayhem phase?
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

export type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt?: string | null;
  endsAt: number | null;
  gameId: string | null;

  // Unused teams from the initial pool
  unusedTeams?: Array<InfiltrationTeam>;

  // Redacted summaries of power usage for display in-room
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

export type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[]; // All players including NPCs during game
  playerCount: number; // Number of players (excludes NPCs)
  locked: boolean;
  pending: PendingJoin[];
  game: GameState;
  settings: RoomSettings;
  updatedAt: number;
};

export type PendingJoin = {
  socketId: string;
  name: string;
  requestedAt: number;
};
