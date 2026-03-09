/**
 * Socket event names used for communication between client and server.
 * Single source of truth for all event names to prevent typos and ensure consistency.
 */

// Room events
export const ROOM_EVENTS = {
  HOST: "room:host",
  HOSTED: "room:hosted",
  JOIN: "room:join",
  JOINED: "room:joined",
  JOIN_DENIED: "room:joinDenied",
  JOIN_PENDING: "room:joinPending",
  CLOSE: "room:close",
  CLOSED: "room:closed",
  LEAVE: "room:leave",
  LEFT: "room:left",
  KICKED: "room:kicked",
  STATE: "room:state",
} as const;

// Player events
export const PLAYER_EVENTS = {
  SET_READY: "player:setReady",
  ACK_ROLE: "player:ackRole",
  ACK_MAYHEM: "player:ackMayhem",
  ROLE: "player:role",
} as const;

// Game events
export const GAME_EVENTS = {
  START: "game:start",
  RESET: "game:reset",
  SUBMIT: "game:submit",
  NEXT_ROUND: "game:nextRound",
  SET_DURATION: "game:setDuration",
  SET_MAX_PLAYERS: "room:setMaxPlayers",
  SET_INFILTRATION_OPTIONS: "game:setInfiltrationOptions",
  SET_ODD_ONE_OUT_OPTIONS: "game:setOddOneOutOptions",
} as const;

// Power events
export const POWER_EVENTS = {
  PROMPT: "power:prompt",
  SUBMIT: "power:submit",
  RESULT: "power:result",
  USED: "power:used",
} as const;

// Error events
export const ERROR_EVENTS = {
  FORBIDDEN: "error:forbidden",
  BAD_REQUEST: "error:badRequest",
} as const;
