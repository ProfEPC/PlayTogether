import { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../../utils/shared/roomCodeNormalize";
import type { RoleConfig } from "../../types/room";

interface InfiltrationOptionsPanelProps {
  enabledRoleIds: Set<number>;
  setEnabledRoleIds: (ids: Set<number>) => void;
  numInfiltrators: 0 | 1 | 2;
  setNumInfiltrators: (num: 0 | 1 | 2) => void;
  roles: RoleConfig[];
  lobbyLocked: boolean;
  roomCode: string;
  socket: Socket;
}

export function InfiltrationOptionsPanel({
  enabledRoleIds,
  setEnabledRoleIds,
  numInfiltrators,
  setNumInfiltrators,
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
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {/* Infiltrator slots (2 of them) */}
          {([0, 1] as const).map((infiltratorIndex) => {
            const infiltratorId = 100 + infiltratorIndex;
            const selected = enabledRoleIds.has(infiltratorId);

            return (
              <button
                key={`infiltrator-${infiltratorIndex}`}
                disabled={lobbyLocked}
                onClick={() => {
                  const next = new Set(enabledRoleIds);
                  if (selected) next.delete(infiltratorId);
                  else next.add(infiltratorId);

                  setEnabledRoleIds(next);

                  const infiltratorCount = Array.from(next).filter(
                    (id) => id === 100 || id === 101
                  ).length;
                  setNumInfiltrators(infiltratorCount as 0 | 1 | 2);

                  socket.emit("game:setInfiltrationOptions", {
                    roomCode: effectiveRoomCode,
                    numInfiltrators: infiltratorCount as 0 | 1 | 2,
                    enabledRoleIds: Array.from(next).sort((a, b) => a - b),
                  });
                }}
                style={{
                  padding: 12,
                  border: selected ? "3px solid #2196F3" : "1px solid #999",
                  borderRadius: 8,
                  backgroundColor: selected ? "#E3F2FD" : "#f5f5f5",
                  color: "#000",
                  cursor: lobbyLocked ? "not-allowed" : "pointer",
                  fontWeight: selected ? 700 : 400,
                  fontSize: 14,
                  outline: "none",
                }}
              >
                Infiltrator
              </button>
            );
          })}

          {/* Role options */}
          {roles
            .filter((role) => role.id !== -1)
            .map((role) => {
              const checked = enabledRoleIds.has(role.id);

              return (
                <button
                  key={role.id}
                  disabled={lobbyLocked}
                  onClick={() => {
                    const next = new Set(enabledRoleIds);
                    if (checked) next.delete(role.id);
                    else next.add(role.id);

                    setEnabledRoleIds(next);

                    socket.emit("game:setInfiltrationOptions", {
                      roomCode: effectiveRoomCode,
                      numInfiltrators,
                      enabledRoleIds: Array.from(next).sort((a, b) => a - b),
                    });
                  }}
                  title={role.description ?? ""}
                  style={{
                    padding: 12,
                    border: checked ? "3px solid #2196F3" : "1px solid #999",
                    borderRadius: 8,
                    backgroundColor: checked ? "#E3F2FD" : "#f5f5f5",
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
      </div>
    </div>
  );
}
