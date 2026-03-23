import type { FC } from "react";
import { INFILTRATION_POWERS } from "../../constants/infiltrationPowers";
import { COLORS } from "../../constants/colors";
import type { Character, PowerSlot } from "../../types/room";

interface CharacterPowerDisplayProps {
  character: Character | undefined;
}

export const CharacterPowerDisplay: FC<CharacterPowerDisplayProps> = ({
  character,
}) => {
  if (!character) return null;

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 8,
        backgroundColor: COLORS.info,
        borderRadius: 4,
        border: `1px solid ${COLORS.infoBorder}`,
        color: COLORS.infoText,
      }}
    >
      <div style={{ fontSize: "0.9em", marginBottom: 4 }}>
        <strong>Character:</strong> {character.name}
      </div>
      {character.powers && character.powers.length > 0 && (
        <div style={{ fontSize: "0.85em" }}>
          <strong>Powers:</strong>
          {character.powers.map((power: PowerSlot, idx: number) => {
            if (power.powerIndex === null) return null;
            const powerDef = INFILTRATION_POWERS.find(p => p.index === power.powerIndex);
            const description = powerDef?.description
              ? powerDef.description.replace(/#/g, String(power.quantity || 1))
              : "";
            return (
              <div key={idx} style={{ marginLeft: 12, marginTop: 6 }}>
                <div style={{ fontWeight: 600 }}>
                  {powerDef?.powerName || "Unknown"}
                </div>
                <div style={{ fontStyle: "italic", opacity: 0.8 }}>
                  {description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
