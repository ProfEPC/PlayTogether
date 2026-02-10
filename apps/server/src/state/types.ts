export type GameKey = "infiltration" | "odd_one_out";
export type GamePhase = "lobby" | "reveal" | "mayhem" | "voting" | "results";

export type Submission = { value: string; submittedAt: number };

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;
};

export type PendingJoin = {
  socketId: string;
  name: string;
  requestedAt: number;
};

export type GameOptionsByKey = {
  infiltration: {
    allowNoInfiltrator: boolean;
    revealVotes: boolean;
  };
  odd_one_out: {
    revealVotes: boolean;
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
  started: boolean;
  phase: GamePhase;
  prompt: string | null;
  endsAt: number | null;
  roundId: string | null;
  submissions: Record<string, Submission>;

  // Private server-side role assignments (not emitted to clients)
  _roles?: Record<string, "infiltrator" | "civilian">;

  // The roles that were not dealt to players (length = 3)
  unusedRoles?: Array<"infiltrator" | "civilian">;

  // Track which players have acknowledged seeing their role
  rolesAck?: Record<string, boolean>;

  // Winner for the round (infiltration: 'crew' | 'infiltrators' | 'none')
  winner?: "crew" | "infiltrators" | "none";
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
