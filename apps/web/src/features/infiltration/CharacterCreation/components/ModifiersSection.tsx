import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";
import { isToggleApplicable } from "../../../../utils/characterCreation";
import { ToggleRow } from "./ToggleRow";

interface ModifiersSectionProps {
  selectedPower: InfiltrationPower;
  toggles: Record<string, boolean>;
  onToggleChange: (toggleName: string, checked: boolean) => void;
}

function hasApplicableModifiers(power: InfiltrationPower): boolean {
  return !!(
    power.vault ||
    isToggleApplicable(power, "lookPostAction") ||
    isToggleApplicable(power, "doPower")
  );
}

/**
 * Determine if doPower should be visible and enabled
 * DoPower is available only if:
 * 1. The power has doPower capability AND
 * 2. Either:
 *    a) LookPostAction is applicable AND selected, OR
 *    b) This is a Learn Player power
 */
function isDoPowerSelectable(
  power: InfiltrationPower,
  lookPostActionChecked: boolean,
): boolean {
  if (!isToggleApplicable(power, "doPower")) return false;

  // Check if this is a Learn Player power
  const isLearnPlayer = power.type === "Learn" && power.where === "Player";

  // DoPower is selectable if:
  // - It's a Learn Player power, OR
  // - LookPostAction is applicable and checked
  return (
    isLearnPlayer ||
    (isToggleApplicable(power, "lookPostAction") && lookPostActionChecked)
  );
}

export function ModifiersSection({
  selectedPower,
  toggles,
  onToggleChange,
}: ModifiersSectionProps) {
  if (!hasApplicableModifiers(selectedPower)) {
    return null;
  }

  const lookPostActionApplicable = isToggleApplicable(
    selectedPower,
    "lookPostAction",
  );
  const lookPostActionChecked = toggles.lookPostAction || false;
  const doPowerSelectable = isDoPowerSelectable(
    selectedPower,
    lookPostActionChecked,
  );
  const doPowerApplicable = isToggleApplicable(selectedPower, "doPower");

  return (
    <div className="toggles-section">
      <h4>Modifiers</h4>
      {selectedPower.vault && (
        <ToggleRow
          name="Swap with Vault?"
          checked={toggles.vault || false}
          applicable={true}
          onChange={(checked) => onToggleChange("vault", checked)}
        />
      )}
      {lookPostActionApplicable && (
        <ToggleRow
          name="Learn Self After Swap?"
          checked={toggles.lookPostAction || false}
          applicable={true}
          onChange={(checked) => {
            onToggleChange("lookPostAction", checked);
            // If unchecking lookPostAction, also uncheck doPower
            if (!checked && toggles.doPower) {
              onToggleChange("doPower", false);
            }
          }}
        />
      )}
      {doPowerApplicable && (
        <ToggleRow
          name="Use Power After Learning?"
          checked={toggles.doPower || false}
          applicable={doPowerSelectable}
          onChange={(checked) => onToggleChange("doPower", checked)}
        />
      )}
    </div>
  );
}
