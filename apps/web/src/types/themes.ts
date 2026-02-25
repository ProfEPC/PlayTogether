/**
 * ! Theme system types for organizing game content by theme
 * * Themes can customize: characters, powers, UI strings, phase text, team terminology
 */

/**
 * * Theme definition - encompasses all customizable strings and settings for a game theme
 */
export interface GameTheme {
  id: string; //* Unique theme identifier (e.g., "debug", "coop_office", "heist")
  name: string; //* Display name (e.g., "Debug Theme", "Corporate Espionage")
  description: string;

  //* Team terminology customization
  teamTerms: {
    infiltratorSingular: string; //* "Infiltrator", "Spy", "Hacker"
    infiltratorPlural: string;
    villagerSingular: string; //* "Villager", "Employee", "Security"
    villagerPlural: string;
  };

  //* Phase prompts and UI text
  phaseText: {
    revealPrompt: string; //* "Role reveal: acknowledge when you've seen your role."
    mayhemPrompt: string; //* "MAYHEM ROUND: Take your actions and acknowledge when done."
    votingPrompt: string; //* "VOTE: Who is the infiltrator?"
    noInfiltratorOption: string; //* "No Infiltrator"
  };

  //* Phase naming customization
  phaseNames: {
    reveal: string; //* "Reveal" or "Briefing"
    mayhem: string; //* "Mayhem" or "Actions"
    voting: string; //* "Voting" or "Accusation"
  };

  //* Card terminology customization
  cardTerms: {
    centerCardSingular: string; //* "Center Card", "Vault", "Safe"
    centerCardPlural: string;
    vaultCardSingular: string; //* "Vault Card" (used in center as well)
    vaultCardPlural: string;
  };

  //* Player reference and outcomes
  playerTerms: {
    playerOuted: string; //* "Player outed as {role}" or "Agent exposed"
    infiltratorWinText: string; //* "Infiltrators win!"
    villagersWinText: string; //* "Villagers win!"
  };

  //* Power terminology (if powers need theme-specific names)
  powerTerms?: Record<string, string>; //* Maps power index to theme-specific name

  //* UI label customizations
  uiLabels?: {
    selectTeam?: string;
    characterName?: string;
    characterDescription?: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

/**
 * * Stored theme with metadata
 */
export interface StoredTheme extends GameTheme {
  id: string;
  createdAt: string;
  updatedAt: string;
}
