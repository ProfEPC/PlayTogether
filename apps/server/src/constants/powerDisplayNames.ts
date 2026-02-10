/**
 * Power display names mapping.
 * Maps internal power type strings to user-facing display names.
 */

export const POWER_DISPLAY_NAMES: Record<string, string> = {
  // Learn powers (internal names to display names)
  viewPlayerRole: "Role Peek",
  viewCenterRole: "Vault Peek",
  viewFinalRole: "Last Look",
  viewPlayerTeam: "Allegiance Check",
  viewCenterTeam: "Vault Allegiance",
  viewPlayersWithRole: "Roll Rolecall",
  viewSameRole: "Role Beacon",
  viewSameTeam: "Team Echo",
  viewWhoActioned: "Action Trace",
  viewVictims: "Action Log",
  viewActionType: "Tactic Tell",
  viewRoleTally: "Role Tally",
  viewTeamTally: "Team Tally",
  viewCenterRoleTally: "Who's Missing",
  viewCenterTeamTally: "Absentee Ballot",
  viewIfPlayerChanged: "Sixth Sense",

  // Reveal powers
  revealPlayerRole: "Expose Role",
  revealCenterRole: "Open Vault",
  revealOwnRole: "Face Reveal",
  revealRoleType: "Role Spotlight",

  // Swap powers
  swapTwoPlayerRoles: "Role Swap",
  swapPlayerWithCenterRole: "Vault Swap",
  swapPlayerWithOwnRole: "Self Swap",
  swapCenterWithOwnRole: "Vault Trade-In",
  swapPreviousSwap: "Swap Reversal",
  swapSelfToPlayerTeam: "Team Exchange",
  swapPlayerToOwnTeam: "Recruit",
  swapPlayerToTeam: "Team Shuffle",

  // Condition powers
  suicidal: "Deathwish",
  predicter: "Oracle",

  // Block/Protect powers
  blockPlayerAction: "Nope!",
  blockRoleAction: "Role Jam",
  protectPlayerFromActions: "Shield",
  protectRoleFromActions: "Guard",

  // Initiative powers
  alterPlayerInitiative: "Priority Warp",
  alterRoleInitiative: "Order Rewrite",
  setPlayerInitiative: "Hard Priority",
  setRoleInitiative: "Order Rule",

  // Voting/Silence powers
  silencePlayerFromVoting: "Mute Vote",
  silenceRoleFromVoting: "Vote Jam",

  // Duplicate/Vote powers
  duplicatePlayerVote: "Vote Encore",
  duplicateRoleVote: "Vote Echo",
  duplicateSelfVote: "Double Tap",

  // Tamper powers
  killVotedPlayer: "Death Vote",
  ifKilledKillVotedPlayer: "Last Laugh",

  // Settings powers
  modifyDiscussionTime: "Time Warp",

  // No-op power
  noAction: "No Action",
};
