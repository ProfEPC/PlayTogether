import type { FC } from "react";
import {
  acknowledgeMayhemAction,
  sendPowerAction,
} from "../../utils/player/playerGamePhaseActions";
import { socket } from "../../lib/socket";
import type { RoomState, Player } from "../../types/room";
import { PowerActionPanel } from "./PowerActionPanel";
import { CharacterPowerDisplay } from "./CharacterPowerDisplay";

interface MayhemPhasePanelProps {
  roomState: RoomState;
  myPlayer: Player | undefined;
  mySocketId: string | undefined;
  learnedInfo: string | null;
  powerPrompt: {
    type: string;
    prompt: string;
    targets: Array<{ id: string; label: string }>;
  } | null;
  powerNotifications: string | null;
  onPowerPromptClose: () => void;
  onLearnedInfoClose: () => void;
}

export const MayhemPhasePanel: FC<MayhemPhasePanelProps> = ({
  roomState,
  myPlayer,
  mySocketId,
  learnedInfo,
  powerPrompt,
  powerNotifications,
  onPowerPromptClose,
}) => {
  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8, boxSizing: "border-box", minWidth: 0, overflow: "hidden", wordBreak: "break-word" }}>
      <strong>Mayhem Round</strong>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Use your special powers if you have them, then acknowledge when ready.
      </div>

      <CharacterPowerDisplay character={myPlayer?.character} />

      {myPlayer?.character ? (
        <>
          {console.log(
            "Player character during mayhem:",
            myPlayer.character,
            "Powers:",
            myPlayer.character.powers,
          )}
          <PowerActionPanel
            roomState={roomState}
            mySocketId={mySocketId}
            character={myPlayer?.character}
          />
        </>
      ) : (
        <div style={{ marginTop: 12, color: "#666" }}>
          No character assigned
        </div>
      )}

      {learnedInfo && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: 6,
            color: "#856404",
          }}
        >
          <strong>Learned:</strong> {learnedInfo}
        </div>
      )}

      {powerPrompt && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: 6,
            color: "#856404",
          }}
        >
          <div style={{ fontWeight: 700 }}>{powerPrompt.prompt}</div>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {powerPrompt.targets.map((t: { id: string; label: string }) => (
              <button
                key={t.id}
                onClick={() => {
                  sendPowerAction(socket, roomState, powerPrompt.type, t.id);
                  onPowerPromptClose();
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!myPlayer?.mayhemAcknowledged && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => acknowledgeMayhemAction(socket, roomState)}
            style={{
              padding: "8px 16px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            I'm Ready for Voting
          </button>
        </div>
      )}

      {myPlayer?.mayhemAcknowledged && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: "#d4edda",
            borderRadius: 4,
            color: "#155724",
          }}
        >
          ✅ Ready for voting - waiting for other players...
        </div>
      )}

      {powerNotifications && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: 6,
            color: "#0c5460",
          }}
        >
          {powerNotifications}
        </div>
      )}
    </div>
  );
};
