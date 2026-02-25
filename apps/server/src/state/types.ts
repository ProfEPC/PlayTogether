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

//TO DO: Change the structure of this to
export type InfiltrationRole =
  | "infiltrator"
  | "civilian"
  | "thief"
  | "hacker"
  | "engineer";

export type Submission = { value: string; submittedAt: number };

export type PowerSlot = {
  powerIndex: number | null;
  type?: string;
  item?: string;
  where?: string;
  quantity?: number;
};

export type CharacterPowers = {
  slots: PowerSlot[];
};

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;

  // Character assignment
  character?: {
    name: string;
    description: string;
    team?: "villager" | "infiltrator";
    powers: PowerSlot[];
  };

  // Per-player game state
  role?: InfiltrationRole; // Player's assigned role (server-side)
  submission?: Submission; // Player's vote submission
  roleAcknowledged?: boolean; // Has player acknowledged their role?
  mayhemAcknowledged?: boolean; // Has player acknowledged completing mayhem actions?
  usedPower?: boolean; // Has player used their special power this round?

  // NEW: Power state and effects (game phase specific)
  roleRevealed?: boolean; // Has this player's role been publicly revealed?
  protected?: boolean; // Is this player currently protected/shielded from actions?
  actedThisRound?: boolean; // Has this player's role already acted in mayhem phase?

  // NEW: Power usage tracking
  powerUsed?: boolean; // Has this player already used a power once per game?
  learnsThisGame?: Array<{
    powerName: string;
    targetPlayer?: string;
    targetPlayerName?: string;
    targetCenter?: number; // 1, 2, or 3
    targetRole?: InfiltrationRole;
    learned: string; // Role or other revealed info
    learnedAt: number;
    item: string;
    where: string;
  }>;
};

export type GameOptionsByKey = {
  infiltration: {
    allowNoInfiltrator: boolean;
    revealVotes: boolean;
    numInfiltrators: 0 | 1 | 2;
    // IDs for enabled special roles. Role IDs map to the UI config
    // e.g. 0 = thief, 1 = hacker, 2 = engineer
    enabledRoleIds: number[];
    // Character/role names for the enabled roles
    enabledRoles?: string[];
  };
  odd_one_out: {
    revealVotes: boolean;
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

  // The roles that were not dealt to players
  unusedRoles?: Array<InfiltrationRole>;

  // Center roles assigned at game start
  centerRoles?: [InfiltrationRole, InfiltrationRole, InfiltrationRole]; // Center 1, 2, 3

  // Role assignments during game (server-side only)
  _roles?: Record<string, InfiltrationRole>;

  // Player submissions during voting phase
  submissions?: Record<string, { value: string; submittedAt: number }>;

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

  // Winner for the round (infiltration: 'crew' | 'infiltrators' | 'none')
  winner?: "crew" | "infiltrators" | "none";
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

export type RoleConfig = {
  id: number;
  key: string;
  title: string;
  description?: string;
};
