import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";

interface PowerDisplayProps {
  selectedPower: InfiltrationPower;
  hasDuplicates: boolean;
  onChangeClick: () => void;
}

export function PowerDisplay({
  selectedPower,
  hasDuplicates,
  onChangeClick,
}: PowerDisplayProps) {
  return (
    <div className="power-display">
      <div className="power-info highlighted">
        <p className="power-name">{selectedPower.powerName}</p>
        <p className="power-description">{selectedPower.description}</p>
        {hasDuplicates && (
          <button className="change-power-button" onClick={onChangeClick}>
            Change
          </button>
        )}
      </div>
    </div>
  );
}
