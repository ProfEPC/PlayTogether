import type { CharacterInCreation } from "../../../../types/characterCreation";
import { INFILTRATION_POWERS } from "../../../../constants/infiltrationPowers";
import { ToggleRow } from "./ToggleRow";

interface CharacterModifiersProps {
  character: CharacterInCreation;
  onInfectedUponSightChange: (checked: boolean) => void;
}

/**
 * Check if any power has the infected property
 */
function hasAnyInfectedPower(character: CharacterInCreation): boolean {
  return character.powerSlots.some((slot) => {
    if (slot.powerIndex === null) return false;
    const power = INFILTRATION_POWERS[slot.powerIndex - 1];
    return power && power.infected;
  });
}

export function CharacterModifiers({
  character,
  onInfectedUponSightChange,
}: CharacterModifiersProps) {
  const hasInfectedOption = hasAnyInfectedPower(character);

  if (!hasInfectedOption) {
    return null;
  }

  return (
    <div className="character-modifiers-section">
      <h3>Character Modifiers</h3>
      <ToggleRow
        name="Infected Upon Sight"
        checked={character.infectedUponSight}
        applicable={true}
        onChange={(checked) => onInfectedUponSightChange(checked)}
      />
    </div>
  );
}
