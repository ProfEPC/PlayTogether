import { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../../utils/shared/roomCodeNormalize";
import type { RoleConfig } from "../../types/room";

interface InfiltrationOptionsPanelProps {
  enabledRoleIds: Set<number>;
  setEnabledRoleIds: (ids: Set<number>) => void;
  roles: (RoleConfig & { team?: "villager" | "infiltrator" })[];
  lobbyLocked: boolean;
  roomCode: string;
  socket: Socket;
}

export function InfiltrationOptionsPanel({
  enabledRoleIds,
  setEnabledRoleIds,
  roles,
  lobbyLocked,
  roomCode,
  socket,
}: InfiltrationOptionsPanelProps) {
  const effectiveRoomCode = normalizeRoomCode(roomCode);

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #ccc",
        borderRadius: 8,
        marginTop: 8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        Infiltration Options
      </div>
      {!roles || roles.length === 0 ? (
        <div style={{ opacity: 0.6 }}>Loading characters...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          {/* Character roles from saved characters */}
          {roles.map((role) => {
            const checked = enabledRoleIds.has(role.id);
            const isInfiltrator = role.team === "infiltrator";

            return (
              <button
                key={role.id}
                disabled={lobbyLocked}
                onClick={() => {
                  const next = new Set(enabledRoleIds);
                  if (checked) next.delete(role.id);
                  else next.add(role.id);

                  setEnabledRoleIds(next);

                  // Map enabled IDs back to role names and calculate infiltrators
                  const selectedRoles = roles.filter((r) => next.has(r.id));
                  const enabledRoles = selectedRoles.map((r) => r.title);
                  const calcNumInfiltrators = selectedRoles.filter(
                    (char) => char.team === "infiltrator",
                  ).length as 0 | 1 | 2;

                  socket.emit("game:setInfiltrationOptions", {
                    roomCode: effectiveRoomCode,
                    numInfiltrators: calcNumInfiltrators,
                    enabledRoleIds: Array.from(next).sort((a, b) => a - b),
                    enabledRoles,
                  });
                }}
                title={role.description ?? ""}
                style={{
                  padding: 12,
                  border: checked ? "3px solid #2196F3" : "1px solid #999",
                  borderRadius: 8,
                  backgroundColor: checked
                    ? isInfiltrator
                      ? "#ffcccc"
                      : "#ccffcc"
                    : isInfiltrator
                      ? "#ffe6e6"
                      : "#e6ffe6",
                  color: "#000",
                  cursor: lobbyLocked ? "not-allowed" : "pointer",
                  fontWeight: checked ? 700 : 400,
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {role.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
