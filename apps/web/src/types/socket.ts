import type { RoomState, GameKey, InfiltrationRole } from "./room";

export type RoomHostedPayload = { roomCode: string; socketId: string };
export type RoomJoinedPayload = { roomCode: string; socketId: string };
export type JoinDeniedPayload = { roomCode: string; reason: string };
export type RoomClosedPayload = { roomCode: string; reason: string };
export type KickedPayload = { roomCode: string; reason: string };
export type PlayerJoinedPayload = { roomCode: string; playerName: string };

export type ClientToServerEvents = {
  "room:host": (p: { roomCode: string; gameKey?: GameKey }) => void;
  "room:join": (p: { roomCode: string; playerName: string }) => void;
  "room:leave": (p: { roomCode: string }) => void;
  "room:setLocked": (p: { roomCode: string; locked: boolean }) => void;
  "room:setRequireApproval": (p: {
    roomCode: string;
    requireApproval: boolean;
  }) => void;
  "room:close": (p: { roomCode: string }) => void;
  "room:kick": (p: { roomCode: string; targetSocketId: string }) => void;
  "room:approveJoin": (p: { roomCode: string; targetSocketId: string }) => void;

  "game:start": (p: { roomCode: string }) => void;
  "game:reset": (p: { roomCode: string }) => void;
  "game:setDuration": (p: { roomCode: string; seconds: number }) => void;
  "game:setInfiltrationOptions": (p: {
    roomCode: string;
    numInfiltrators: 0 | 1 | 2;
    enabledRoleIds: number[];
    enabledRoles?: string[]; // Character names/roles
  }) => void;
  "game:select": (p: { roomCode: string; gameKey: GameKey }) => void;
  "game:submit": (p: {
    roomCode: string;
    gameId: string;
    value: string;
  }) => void;
  "game:nextRound": (p: { roomCode: string }) => void;

  "player:ackMayhem": (p: { roomCode: string }) => void;
  "player:ackRole": (p: { roomCode: string; seen: boolean }) => void;
  "player:setReady": (p: { roomCode: string }) => void;
  "player:usePower": (p: {
    roomCode: string;
    type: string;
    target?: string;
  }) => void;

  "game:submitPower": (p: {
    roomCode: string;
    powerName: string;
    targetPlayers?: string[];
    targetCenter?: number[];
  }) => void;

  "room:setMaxPlayers": (p: { roomCode: string; maxPlayers: number }) => void;
};

export type ServerToClientEvents = {
  "room:hosted": (p: RoomHostedPayload) => void;
  "room:joined": (p: RoomJoinedPayload) => void;
  "room:joinDenied": (p: JoinDeniedPayload) => void;
  "room:closed": (p: RoomClosedPayload) => void;
  "room:kicked": (p: KickedPayload) => void;
  "room:left": (p: { roomCode: string }) => void;
  "room:playerJoined": (p: PlayerJoinedPayload) => void;
  "room:state": (state: RoomState) => void;
  "player:role": (p: { role: InfiltrationRole }) => void;

  "power:result": (p: {
    type: string;
    powerName?: string;
    learns?: Array<{
      powerName: string;
      targetPlayer?: string;
      targetPlayerName?: string;
      targetCenter?: number;
      learned: string;
      learnedAt: number;
      item?: string;
      where?: string;
    }>;
    [key: string]: unknown;
  }) => void;
  // Server prompts a specific player to choose a target for their power
  "power:prompt": (p: {
    type: string;
    prompt: string;
    targets: Array<{ id: string; label: string }>;
  }) => void;
  // Room-wide redacted notification that a power was used
  "power:used": (p: {
    actorSocketId: string;
    actorName: string;
    type: string;
  }) => void;
};
