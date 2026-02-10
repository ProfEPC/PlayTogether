import type { RoomState, GameKey } from "./room";

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
  "room:close": (p: { roomCode: string }) => void;
  "room:kick": (p: { roomCode: string; targetSocketId: string }) => void;

  "game:start": (p: { roomCode: string }) => void;
  "game:reset": (p: { roomCode: string }) => void;
  "game:setDuration": (p: { roomCode: string; seconds: number }) => void;
  "game:select": (p: { roomCode: string; gameKey: GameKey }) => void;
  "game:submit": (p: {
    roomCode: string;
    roundId: string;
    value: string;
  }) => void;
  "game:nextRound": (p: { roomCode: string }) => void;

  // Player actions
  "player:setReady": (p: { roomCode: string; ready: boolean }) => void;
  "player:ackRole": (p: { roomCode: string; seen: boolean }) => void;

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
  "player:role": (p: { role: "infiltrator" | "civilian" }) => void;

  "error:forbidden": (p: { message: string }) => void;
  "error:badRequest": (p: { message: string }) => void;
};
