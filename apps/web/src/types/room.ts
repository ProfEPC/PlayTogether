export type GameKey = "infiltration" | "odd_one_out";
export type GamePhase = "lobby" | "reveal" | "mayhem" | "voting" | "results";

export type Player = {
  socketId: string;
  name: string;
  ready: boolean;
  connectedAt: number;
  lastSeenAt: number;
};

export type Submission = {
  value: string;
  submittedAt: number;
};

export type GameState = {
  started: boolean;
  phase: GamePhase;
  prompt: string | null;
  endsAt: number | null;

  roundId: string | null;
  submissions: Record<string, Submission>;

  // Roles are only exposed publicly during results
  roles?: Record<string, "infiltrator" | "civilian">;

  // Unused roles from the initial pool (length = 3)
  unusedRoles?: Array<"infiltrator" | "civilian">;

  // Track which players have acknowledged seeing their role
  rolesAck?: Record<string, boolean>;

  // Winner for the round (infiltration: 'crew' | 'infiltrators' | 'none')
  winner?: "crew" | "infiltrators" | "none";
};

export type RoomSettings = {
  roundDurationMs: number;
  gameKey: GameKey;
  maxPlayers: number;
};

export type RoomState = {
  roomCode: string;
  hostSocketId: string | null;
  players: Player[];
  locked: boolean;
  game: GameState;
  settings: RoomSettings;
  updatedAt: number;
};
