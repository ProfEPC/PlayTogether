/**
 * Centralized logging utility for server operations.
 * Provides structured logging with consistent formatting.
 */

export const logger = {
  /**
   * Log socket connection events
   */
  socketConnected(socketId: string): void {
    console.log(`[Socket] Connected: ${socketId}`);
  },

  /**
   * Log socket disconnection events
   */
  socketDisconnected(socketId: string): void {
    console.log(`[Socket] Disconnected: ${socketId}`);
  },

  /**
   * Log room hosting
   */
  roomHosted(socketId: string, roomCode: string, gameKey: string): void {
    console.log(`[Room] ${socketId} hosting ${roomCode} for ${gameKey}`);
  },

  /**
   * Log room deletion
   */
  roomDeleted(roomCode: string): void {
    console.log(`[Room] Deleted empty room ${roomCode}`);
  },

  /**
   * Log round end
   */
  roundEnded(roomCode: string, reason: string): void {
    console.log(`[Round] Ended for ${roomCode}: ${reason}`);
  },

  /**
   * Log room close
   */
  roomClosed(roomCode: string, reason: string): void {
    console.log(`[Room] Closed ${roomCode} (${reason})`);
  },

  /**
   * Log role assignment
   */
  roleAssignment(
    roomCode: string,
    numPlayers: number,
    enabledRoles: number[]
  ): void {
    console.log(
      `[Game] Role assignment for ${roomCode}: ${numPlayers} players, enabled roles: [${enabledRoles.join(
        ", "
      )}]`
    );
  },

  /**
   * Log role pool before shuffle
   */
  rolePool(pool: string[]): void {
    console.log(`[Game] Role pool before shuffle: [${pool.join(", ")}]`);
  },

  /**
   * Log infiltration options update
   */
  infiltrationOptions(
    roomCode: string,
    numInfiltrators: number,
    enabledRoleIds: number[]
  ): void {
    console.log(
      `[Game] Updated infiltration options for ${roomCode}: ${numInfiltrators} infiltrators, enabled roles: [${enabledRoleIds.join(
        ", "
      )}]`
    );
  },

  /**
   * Log validation errors
   */
  validationError(event: string, roomCode: string, reason: string): void {
    console.log(`[Validation] ${event} - ${roomCode}: ${reason}`);
  },

  /**
   * Log server startup
   */
  serverStarted(port: number): void {
    console.log(`[Server] Listening on http://localhost:${port}`);
  },
};
