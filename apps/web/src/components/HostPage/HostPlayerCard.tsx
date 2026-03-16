/**
 * HostPlayerCard — a single character tile shown on the host screen
 * during an active game.
 *
 * Each card represents a character in the game (played by a human or NPC).
 * The character name is shown prominently; the player name (if human) is
 * displayed underneath.
 *
 * Visibility rules (per game phase):
 *   • reveal  — character & team HIDDEN, show acknowledge status
 *   • mayhem  — character & team SHOWN for all, show acted / power status
 *   • voting  — character & team HIDDEN (unless power-revealed or NPC),
 *               show voted status (human players only)
 *   • results — character & team VISIBLE, show vote value
 *
 * NPCs:
 *   - Shown during mayhem and results (they are characters in the game)
 *   - NOT shown during reveal or voting (they don't acknowledge or vote)
 *   - Always show their character info (no reason to hide NPC identity)
 *
 * The `characterRevealed` flag on a player means a power has
 * publicly exposed them — in that case the host sees their info
 * even before the results phase.
 */
import type { FC } from "react";
import type { Player, InfiltrationGamePhase } from "../../types/room";
import "./HostPlayerCard.css";

interface HostPlayerCardProps {
  player: Player;
  phase: InfiltrationGamePhase;
}

export const HostPlayerCard: FC<HostPlayerCardProps> = ({ player, phase }) => {
  const isNPC = !!player.isNPC;

  // ── Should we show this character's identity? ──
  // NPCs always show identity (host needs to see what characters are in play).
  // Humans: visible during mayhem & results, or if power-revealed.
  const showIdentity =
    isNPC ||
    phase === "mayhem" ||
    phase === "results" ||
    !!player.characterRevealed;

  // ── Team border class ──
  const teamClass = showIdentity
    ? player.team === "infiltrator"
      ? "host-player-card--infiltrator"
      : "host-player-card--innocent"
    : "host-player-card--hidden";

  // ── Phase-specific status badge (human players only) ──
  const badge = (() => {
    if (isNPC) return null; // NPCs don't have action states

    switch (phase) {
      case "reveal":
        return player.characterAcknowledged
          ? { label: "Acknowledged", cls: "host-player-card__badge--ack" }
          : { label: "Waiting…", cls: "host-player-card__badge--waiting" };

      case "mayhem":
        if (player.actedThisRound)
          return { label: "Acted", cls: "host-player-card__badge--acted" };
        if (player.mayhemAcknowledged)
          return { label: "Done", cls: "host-player-card__badge--ack" };
        return { label: "Waiting…", cls: "host-player-card__badge--waiting" };

      case "voting":
        return player.vote
          ? { label: "Voted", cls: "host-player-card__badge--voted" }
          : { label: "Voting…", cls: "host-player-card__badge--waiting" };

      case "results":
        return player.vote
          ? {
              label: `Voted: ${player.vote.value}`,
              cls: "host-player-card__badge--voted",
            }
          : { label: "No vote", cls: "host-player-card__badge--waiting" };

      default:
        return null;
    }
  })();

  return (
    <div className={`host-player-card ${teamClass}`}>
      {/* ── Character name (primary) + badge ── */}
      <div className="host-player-card__header">
        <span className="host-player-card__name">
          {showIdentity ? (player.character?.name ?? player.name) : player.name}
        </span>
        {isNPC && (
          <span className="host-player-card__badge host-player-card__badge--npc">
            NPC
          </span>
        )}
        {badge && (
          <span className={`host-player-card__badge ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* ── Player / team info ── */}
      <div className="host-player-card__character">
        {showIdentity ? (
          <>
            {/* Show player name underneath character name for humans */}
            {!isNPC && (
              <span className="host-player-card__player-name">
                {player.name}
              </span>
            )}
            {player.team && (
              <span
                className={`host-player-card__team host-player-card__team--${player.team}`}
              >
                {player.team}
              </span>
            )}
          </>
        ) : (
          <span className="host-player-card__character-hidden">???</span>
        )}
      </div>
    </div>
  );
};
