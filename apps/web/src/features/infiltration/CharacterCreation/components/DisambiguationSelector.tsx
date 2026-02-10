import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";
import { getDisambiguationPrompt } from "../../../../utils/characterCreation";

interface DisambiguationSelectorProps {
  availablePowers: InfiltrationPower[];
  slotItem: string;
  onSelect: (powerIndex: number) => void;
}

export function DisambiguationSelector({
  availablePowers,
  slotItem,
  onSelect,
}: DisambiguationSelectorProps) {
  const prompt = getDisambiguationPrompt(availablePowers);
  const label = prompt?.prompt || `Which "${slotItem}" power?`;

  return (
    <div className="selector">
      <label>{label}</label>
      <select
        onChange={(e) => {
          const idx = parseInt(e.target.value);
          if (!isNaN(idx)) {
            onSelect(idx);
          }
        }}
        defaultValue=""
      >
        <option value="">-- Select --</option>
        {availablePowers.map((p) => (
          <option key={p.index} value={p.index}>
            {p.powerName}
          </option>
        ))}
      </select>
    </div>
  );
}
