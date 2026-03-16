/**
 * Power Compatibility Validation Utilities
 *
 * This module provides functions to validate power-to-power compatibility based on
 * meshing rules defined in data/power_compatibility_rules.md.
 *
 * Main exports:
 * - canMeshPowersWithTiming(power1, power2, timing): Check if two powers can coexist
 * - getPowerCompatibilityError(power1, power2, timing): Get descriptive error message
 */

import type { InfiltrationPower } from "../../constants/infiltrationPowers";

/**
 * Helper: Check if power is Learn or Reveal type
 */
function isLearnOrRevealPower(power: InfiltrationPower): boolean {
  return power.type === "Learn" || power.type === "Reveal";
}

/**
 * Helper: Check if a power belongs to the "Murderer" group (cannot mesh with post-swap Learn/Reveal)
 * Identifies powers by powerName
 */
function isMurdererGroupPower(power: InfiltrationPower): boolean {
  const murdererPowerNames = [
    "Vault Allegiance",
    "Roll Rolecall",
    "Role Beacon",
    "Team Echo",
    "Action Log",
    "Action Trace",
    "Tactic Tell",
    "Role Tally",
    "Team Tally",
    "Who's Missing",
    "Absentee Ballot",
    "Face Reveal",
    "Role Spotlight",
    "Sixth Sense",
    "Expose Role",
  ];
  return murdererPowerNames.includes(power.powerName);
}

/**
 * Helper: Check if a power is "Double Duty" (Predicter equivalent - marked with twoXVote in original)
 */
function isPredicterGroupPower(power: InfiltrationPower): boolean {
  // Predicter powers were marked with predicter flag
  // These are Learn/Reveal powers that can use timing selector
  const predicterPowerNames = [
    "Vault Allegiance",
    "Roll Rolecall",
    "Role Beacon",
    "Team Echo",
    "Action Log",
    "Action Trace",
    "Tactic Tell",
    "Role Tally",
    "Team Tally",
    "Who's Missing",
    "Absentee Ballot",
    "Face Reveal",
    "Role Spotlight",
    "Sixth Sense",
    "Expose Role",
  ];
  return predicterPowerNames.includes(power.powerName);
}

/**
 * Helper: Check if a power is in "Double Vote" group (twoXVote flag powers)
 */
function isTwoXVoteGroupPower(power: InfiltrationPower): boolean {
  // twoXVote was only set to true on a couple Learn powers
  const twoXVotePowerNames = ["Vault Allegiance", "Allegiance Check"];
  return twoXVotePowerNames.includes(power.powerName);
}

/**
 * Check if two powers are compatible and can coexist in the same character,
 * accounting for timing constraints on Learn/Reveal powers.
 *
 * Compatibility rules:
 * - Murderer Group: Cannot mesh with post-swap Learn/Reveal. OK with other murderer powers.
 * - Predicter Group: Cannot mesh with post-swap Learn/Reveal (same rules as murderer). OK with other predicter.
 * - TwoXVote Group: Cannot mesh with post-swap Learn/Reveal (same rules as murderer). OK with other twoXVote.
 * - Infected: NOT a meshing constraint (game mechanic)
 * - Vault: NOT a meshing constraint (toggle modifier)
 *
 * @param power1 - First power to check
 * @param power2 - Second power to check
 * @param power2Timing - Timing of power2 (for Learn/Reveal powers: "BEFORE_SWAP" or "AFTER_SWAP")
 * @returns true if powers can coexist, false if incompatible
 */
export function canMeshPowersWithTiming(
  power1: InfiltrationPower | null | undefined,
  power2: InfiltrationPower | null | undefined,
  power2Timing?: string | null,
): boolean {
  // Null powers always compatible (slot not filled)
  if (!power1 || !power2) return true;

  const isPostSwap = power2Timing === "AFTER_SWAP";

  // Murderer group cannot mesh with post-swap Learn/Reveal
  const p1Murderer = isMurdererGroupPower(power1);
  const p2Murderer = isMurdererGroupPower(power2);

  if (p1Murderer && isLearnOrRevealPower(power2) && isPostSwap) {
    return false; // murderer group + post-swap learn/reveal = incompatible
  }
  if (p2Murderer && isLearnOrRevealPower(power1) && isPostSwap) {
    return false; // murderer group + post-swap learn/reveal = incompatible
  }

  // Predicter group cannot mesh with post-swap Learn/Reveal (same as murderer)
  const p1Predicter = isPredicterGroupPower(power1);
  const p2Predicter = isPredicterGroupPower(power2);

  if (p1Predicter && isLearnOrRevealPower(power2) && isPostSwap) {
    return false; // predicter group + post-swap learn/reveal = incompatible
  }
  if (p2Predicter && isLearnOrRevealPower(power1) && isPostSwap) {
    return false; // predicter group + post-swap learn/reveal = incompatible
  }

  // TwoXVote group cannot mesh with post-swap Learn/Reveal (same as murderer)
  const p1TwoXVote = isTwoXVoteGroupPower(power1);
  const p2TwoXVote = isTwoXVoteGroupPower(power2);

  if (p1TwoXVote && isLearnOrRevealPower(power2) && isPostSwap) {
    return false; // twoXVote group + post-swap learn/reveal = incompatible
  }
  if (p2TwoXVote && isLearnOrRevealPower(power1) && isPostSwap) {
    return false; // twoXVote group + post-swap learn/reveal = incompatible
  }
  // All checks passed
  return true;
}

/**
 * Get a descriptive error message for why two powers are incompatible,
 * accounting for timing constraints.
 *
 * Used for UI error messages to help users understand why a power selection failed.
 *
 * @param power1 - First power (new power being added)
 * @param power2 - Second power (existing power in character)
 * @param power2Timing - Timing of power2 (for Learn/Reveal powers)
 * @returns Descriptive error string, or empty string if compatible
 */
export function getPowerCompatibilityError(
  power1: InfiltrationPower | null | undefined,
  power2: InfiltrationPower | null | undefined,
  power2Timing?: string | null,
): string {
  if (!power1 || !power2) return "";

  if (canMeshPowersWithTiming(power1, power2, power2Timing)) {
    return "";
  }

  const power1Name = power1.powerName || "Unknown Power";
  const power2Name = power2.powerName || "Unknown Power";
  const isPostSwap = power2Timing === "AFTER_SWAP";

  // Murderer group cannot mesh with post-swap Learn/Reveal
  if (
    isMurdererGroupPower(power1) &&
    isLearnOrRevealPower(power2) &&
    isPostSwap
  ) {
    return `"${power1Name}" cannot mesh with "${power2Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }
  if (
    isMurdererGroupPower(power2) &&
    isLearnOrRevealPower(power1) &&
    isPostSwap
  ) {
    return `"${power2Name}" cannot mesh with "${power1Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }

  // Predicter group cannot mesh with post-swap Learn/Reveal
  if (
    isPredicterGroupPower(power1) &&
    isLearnOrRevealPower(power2) &&
    isPostSwap
  ) {
    return `"${power1Name}" cannot mesh with "${power2Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }
  if (
    isPredicterGroupPower(power2) &&
    isLearnOrRevealPower(power1) &&
    isPostSwap
  ) {
    return `"${power2Name}" cannot mesh with "${power1Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }

  // TwoXVote group cannot mesh with post-swap Learn/Reveal
  if (
    isTwoXVoteGroupPower(power1) &&
    isLearnOrRevealPower(power2) &&
    isPostSwap
  ) {
    return `"${power1Name}" cannot mesh with "${power2Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }
  if (
    isTwoXVoteGroupPower(power2) &&
    isLearnOrRevealPower(power1) &&
    isPostSwap
  ) {
    return `"${power2Name}" cannot mesh with "${power1Name}" (post-swap learn/reveal). These powers conflict with information gained after swaps complete.`;
  }

  // Fallback (should not reach here if logic is correct)
  return `"${power1Name}" is incompatible with "${power2Name}". Check the power compatibility rules for details.`;
}
