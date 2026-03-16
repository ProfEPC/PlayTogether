import type { FC } from "react";
import { acknowledgeRoleAction } from "../../utils/player/playerGamePhaseActions";
import { socket } from "../../lib/socket";
import type { RoomState, Player } from "../../types/room";
import { CharacterPowerDisplay } from "./CharacterPowerDisplay";

interface RevealPhasePanelProps {
  roomState: RoomState;
  myPlayer: Player;
  myCharacter: {
    name: string;
    description: string;
    team?: "innocent" | "infiltrator";
  } | null;
  setStatus: (status: string) => void;
}

export const RevealPhasePanel: FC<RevealPhasePanelProps> = ({
  roomState,
  myPlayer,
  myCharacter,
  setStatus,
}) => {
  // Use myPlayer.character as source of truth (it comes from roomState)
  const character = myPlayer?.character || myCharacter;

  return (
    <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Character</div>
      <div style={{ marginBottom: 8 }}>
        <strong
          style={{
            color: character?.team === "infiltrator" ? "#a00" : "#060",
          }}
        >
          {character ? character.name : "Waiting for character..."}
        </strong>
      </div>

      <CharacterPowerDisplay character={myPlayer?.character} />

      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() =>
            acknowledgeRoleAction(socket, roomState, null, setStatus)
          }
          disabled={!character || !!myPlayer?.characterAcknowledged}
        >
          I have seen my character
        </button>
      </div>
      <div style={{ opacity: 0.8 }}>
        Acknowledged:{" "}
        {roomState?.players.filter((p) => p.characterAcknowledged).length}/
        {roomState?.playerCount}
      </div>
    </div>
  );
};
