import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";
import { getDisambiguationPrompt } from "../../../../utils/characterCreation";

interface DisambiguationSelectorProps {
  availablePowers: InfiltrationPower[];
  slotItem: string;
  selectedPowerIndex?: number | null;
  onSelect: (powerIndex: number) => void;
}

export function DisambiguationSelector({
  availablePowers,
  slotItem,
  selectedPowerIndex,
  onSelect,
}: DisambiguationSelectorProps) {
  const disambiguation = getDisambiguationPrompt(availablePowers);
  const label = disambiguation?.prompt || `Which "${slotItem}" power?`;

  return (
    <div className="selector disambiguation-selector">
      <label>{label}</label>
      <div className="disambiguation-buttons">
        {availablePowers.map((p, index) => {
          const choiceLabel =
            disambiguation?.choices[index]?.label || p.powerName;
          const isSelected = selectedPowerIndex === p.index;
          return (
            <button
              type="button"
              key={p.index}
              className={`disambiguation-button ${isSelected ? "selected" : ""}`}
              onClick={() => onSelect(p.index)}
            >
              {choiceLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
