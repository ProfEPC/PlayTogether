import type { GameTheme } from "../../types/themes";

/**
 * Default shape for a brand-new theme before the user fills it in.
 */
export const EMPTY_THEME: GameTheme = {
  id: "",
  name: "",
  description: "",
  teamTerms: {
    infiltratorSingular: "Infiltrator",
    infiltratorPlural: "Infiltrators",
    innocentSingular: "Innocent",
    innocentPlural: "Innocents",
  },
  phaseText: {
    revealPrompt: "",
    mayhemPrompt: "",
    votingPrompt: "",
    noInfiltratorOption: "No Infiltrator",
  },
  phaseNames: {
    reveal: "Reveal",
    mayhem: "Mayhem",
    voting: "Voting",
  },
  characterTerms: {
    npcSingular: "NPC",
    npcPlural: "NPCs",
  },
  playerTerms: {
    playerOuted: "Player outed as {role}",
    infiltratorWinText: "Infiltrators win!",
    innocentsWinText: "Innocents win!",
  },
};
