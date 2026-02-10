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

export type InfiltrationRole =
  | "infiltrator"
  | "civilian"
  | "thief"
  | "hacker"
  | "engineer";

export type RoleConfig = {
  id: number;
  key: string;
  title: string;
  description?: string;
};

export type Submission = {
  value: string;
  submittedAt: number;
};

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;

  // Per-player game state
  role?: InfiltrationRole; // Player's assigned role
  submission?: Submission; // Player's vote submission
  roleAcknowledged?: boolean; // Has player acknowledged their role?
  mayhemAcknowledged?: boolean; // Has player acknowledged completing mayhem actions?
  usedPower?: boolean; // Has player used their special power this round?

  // NEW: Power state and effects (game phase specific)
  roleRevealed?: boolean; // Has this player's role been publicly revealed?
  protected?: boolean; // Is this player currently protected/shielded from actions?
  actedThisRound?: boolean; // Has this player's role already acted in mayhem phase?
};

export type GameOptionsByKey = {
  infiltration: {
    allowNoInfiltrator: boolean;
    revealVotes: boolean;
    numInfiltrators: 0 | 1 | 2;
    enabledRoleIds: number[];
  };
  odd_one_out: {
    revealVotes: boolean;
    numOddOnes: number;
  };
};

export type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt?: string | null;
  endsAt: number | null;
  roundId: string | null;

  // Unused roles from the initial pool
  unusedRoles?: Array<InfiltrationRole>;

  // Redacted summaries of power usage for display in-room
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
  players: Player[];
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
