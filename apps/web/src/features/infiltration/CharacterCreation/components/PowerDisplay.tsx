import type { InfiltrationPower } from "../../../../constants/infiltrationPowers";

interface PowerDisplayProps {
  selectedPower: InfiltrationPower;
  hasDuplicates: boolean;
  amount?: string | null;
  timing?: string | null;
  toggles?: Record<string, boolean>;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export function PowerDisplay({
  selectedPower,
  amount,
  timing,
  toggles = {},
  isExpanded,
  onExpandToggle,
}: PowerDisplayProps) {
  // Extract modifier and value from amount string (for Settings powers)
  let modifier = "both";
  let amountValue = amount ? String(amount) : "1";
  let isUpTo = false;

  if (amount) {
    if (amount.includes("SHORTEN")) {
      modifier = "shorten";
      amountValue = amount.replace("SHORTEN ", "").replace("UP TO ", "");
      isUpTo = amount.includes("UP TO");
    } else if (amount.includes("LENGTHEN")) {
      modifier = "lengthen";
      amountValue = amount.replace("LENGTHEN ", "").replace("UP TO ", "");
      isUpTo = amount.includes("UP TO");
    } else if (amount.includes("UP TO")) {
      amountValue = amount.replace("UP TO ", "");
      isUpTo = true;
    }
  }

  // For Settings powers, show two-line display
  let displayDescription = selectedPower.description;
  let secondLine = "";

  if (selectedPower.type === "Settings" && selectedPower.item === "Time") {
    const modifierText =
      modifier === "both"
        ? "Shorten or Lengthen"
        : modifier.charAt(0).toUpperCase() + modifier.slice(1);
    displayDescription = `${modifierText} discussion time`;
    secondLine = `${isUpTo ? "Up to " : ""}${amountValue} seconds`;
  } else {
    // For other powers, replace # with amount and handle modifiers
    displayDescription = amount
      ? selectedPower.description.replace(/#/g, amount)
      : selectedPower.description.replace(/#/g, "1");

    // For Swap powers, reorder descriptions and handle vault variant
    if (selectedPower.type === "Swap") {
      // First reorder: Own Role first, then other role
      displayDescription = displayDescription.replace(
        /Swap One Players Role With Own Role/gi,
        "Swap Own Role With One Players Role",
      );

      // If vault is selected, replace with vault variants
      if (selectedPower.vault && toggles.vault) {
        displayDescription = displayDescription
          .replace(
            /Swap Two Players Roles/gi,
            "Swap One Players Role With One Vault Role",
          )
          .replace(
            /Swap Own Role With One Players Role/gi,
            "Swap Own Role With One Vault Role",
          )
          .replace(
            /Swap Own Team With Another Player/gi,
            "Swap Own Team With One Vault Role",
          )
          .replace(
            /Swap Two Players Teams/gi,
            "Swap One Players Team With One Vault Role",
          );
      }
    }

    // Add vault notation if applicable and selected
    if (selectedPower.vault && toggles.vault) {
      displayDescription = displayDescription.replace(
        /\(can use Vault\)/gi,
        "(use vault)",
      );
    }

    // Update description based on modifiers for Swap powers
    if (selectedPower.type === "Swap") {
      if (toggles.lookPostAction) {
        // Keep original description on first line, add behavior on second line
        secondLine = "Learn Self After Swap";

        if (toggles.doPower) {
          secondLine += " And Perform Actions";
        }
      } else if (toggles.doPower) {
        // DoPower without lookPostAction (other Swap variant)
        secondLine = "Perform Actions";
      }
    }
  }

  return (
    <div className="power-display">
      <div className="power-info highlighted">
        <div className="power-name-header">
          <p className="power-name">
            {selectedPower.vault && toggles.vault && selectedPower.vaultName
              ? selectedPower.vaultName
              : selectedPower.powerName}
          </p>
          {onExpandToggle && (
            <button
              className="collapse-toggle"
              onClick={onExpandToggle}
              aria-label={
                isExpanded ? "Collapse power details" : "Expand power details"
              }
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}
        </div>
        <p className="power-description">{displayDescription}</p>
        {secondLine && (
          <p className="power-description-secondary">{secondLine}</p>
        )}
        {timing && (
          <p className="power-timing">
            {timing === "before" ? "Before Swap" : "After Swap"}
          </p>
        )}
      </div>
    </div>
  );
}
