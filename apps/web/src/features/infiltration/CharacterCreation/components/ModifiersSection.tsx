import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";
import { isToggleApplicable } from "../../../../utils/characterCreation";
import { ToggleRow } from "./ToggleRow";

interface ModifiersSectionProps {
  selectedPower: InfiltrationPower;
  toggles: Record<string, boolean>;
  onToggleChange: (toggleName: string, checked: boolean) => void;
}

export function ModifiersSection({
  selectedPower,
  toggles,
  onToggleChange,
}: ModifiersSectionProps) {
  return (
    <div className="toggles-section">
      <h4>Modifiers</h4>
      {selectedPower.vault && (
        <ToggleRow
          name="Vault"
          checked={toggles.vault || false}
          applicable={true}
          onChange={(checked) => onToggleChange("vault", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "infected") && (
        <ToggleRow
          name="Infected"
          checked={toggles.infected || false}
          applicable={true}
          onChange={(checked) => onToggleChange("infected", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "allowRandom") && (
        <ToggleRow
          name="AllowRandom"
          checked={toggles.allowRandom || false}
          applicable={true}
          onChange={(checked) => onToggleChange("allowRandom", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "lookPostAction") && (
        <ToggleRow
          name="LookPostAction"
          checked={toggles.lookPostAction || false}
          applicable={true}
          onChange={(checked) => onToggleChange("lookPostAction", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "doPower") && (
        <ToggleRow
          name="DoPower"
          checked={toggles.doPower || false}
          applicable={true}
          onChange={(checked) => onToggleChange("doPower", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "fixedAction") && (
        <ToggleRow
          name="FixedAction"
          checked={toggles.fixedAction || false}
          applicable={true}
          onChange={(checked) => onToggleChange("fixedAction", checked)}
        />
      )}
      {isToggleApplicable(selectedPower, "fixedInitiative") && (
        <ToggleRow
          name="FixedInitiative"
          checked={toggles.fixedInitiative || false}
          applicable={true}
          onChange={(checked) => onToggleChange("fixedInitiative", checked)}
        />
      )}
    </div>
  );
}
