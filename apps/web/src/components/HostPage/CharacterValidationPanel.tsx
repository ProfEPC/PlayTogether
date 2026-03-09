import type { CSSProperties, FC } from "react";
import { COLORS } from "../../constants/colors";
import type { RoleConfig } from "../../types/room";

interface CharacterValidationPanelProps {
  playerCount: number;
  enabledRoleIds: Set<number>;
  roles: (RoleConfig & { team?: "villager" | "infiltrator" })[];
}

/* ── tiny status dot ──────────────────────────────────────────────── */
const dot = (ok: boolean): CSSProperties => ({
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: ok ? COLORS.success : COLORS.actionDanger,
  marginRight: 6,
  flexShrink: 0,
});

/* ── one chip ─────────────────────────────────────────────────────── */
const chipStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 16,
  backgroundColor: COLORS.primary,
  color: COLORS.primaryText,
  border: `1px solid ${COLORS.primaryLight}`,
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: "nowrap",
};

/**
 * Compact status strip showing three validation indicators as inline
 * chips: required count, selected count, and infiltrator team balance.
 */
export const CharacterValidationPanel: FC<CharacterValidationPanelProps> = ({
  playerCount,
  enabledRoleIds,
  roles,
}) => {
  const MIN_PLAYERS = 3; // matches GAME_RULES.infiltration.minPlayers
  const effectivePlayers = Math.max(playerCount, MIN_PLAYERS);
  const requiredCount = effectivePlayers + 3;
  const countValid = enabledRoleIds.size === requiredCount;

  const selectedChars = roles.filter((r) => enabledRoleIds.has(r.id));
  const infiltratorCount = selectedChars.filter(
    (c) => c.team === "infiltrator",
  ).length;
  const teamValid = infiltratorCount > 0 && infiltratorCount < playerCount;

  const infiltratorHint = !teamValid
    ? infiltratorCount === 0
      ? "need ≥1"
      : `need <${playerCount}`
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
      }}
    >
      {/* Selected / required count */}
      <div style={chipStyle}>
        <span style={dot(countValid)} />
        Characters {enabledRoleIds.size}/{requiredCount} ({playerCount}+3)
      </div>

      {/* Infiltrator team balance */}
      <div style={chipStyle}>
        <span style={dot(teamValid)} />
        Infiltrators {infiltratorCount}
        {infiltratorHint && (
          <span style={{ marginLeft: 4, opacity: 0.7 }}>
            ({infiltratorHint})
          </span>
        )}
      </div>
    </div>
  );
};
