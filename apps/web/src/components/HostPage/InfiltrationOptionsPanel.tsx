import { Socket } from "socket.io-client";
import { normalizeRoomCode } from "../../utils/shared/roomCodeNormalize";
import type { CharacterConfig } from "../../types/room";

interface InfiltrationOptionsPanelProps {
  enabledCharacterIds: Set<number>;
  setEnabledCharacterIds: (ids: Set<number>) => void;
  characters: (CharacterConfig & { team?: "innocent" | "infiltrator" })[];
  lobbyLocked: boolean;
  roomCode: string;
  socket: Socket;
}

export function InfiltrationOptionsPanel({
  enabledCharacterIds,
  setEnabledCharacterIds,
  characters,
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
      {!characters || characters.length === 0 ? (
        <div style={{ opacity: 0.6 }}>Loading characters...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          {/* Saved characters */}
          {characters.map((char) => {
            const checked = enabledCharacterIds.has(char.id);
            const isInfiltrator = char.team === "infiltrator";

            return (
              <button
                key={char.id}
                disabled={lobbyLocked}
                onClick={() => {
                  const next = new Set(enabledCharacterIds);
                  if (checked) next.delete(char.id);
                  else next.add(char.id);

                  setEnabledCharacterIds(next);

                  // Map enabled IDs back to character names
                  const selectedCharacters = characters
                    .filter((c) => next.has(c.id))
                    .map((c) => c.title);

                  socket.emit("game:setInfiltrationOptions", {
                    roomCode: effectiveRoomCode,
                    selectedCharacters,
                  });
                }}
                title={char.description ?? ""}
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
                {char.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
