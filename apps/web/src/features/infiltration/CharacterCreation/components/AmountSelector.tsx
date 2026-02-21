/**
 * AmountSelector Component
 *
 * Allows the user to select the amount/quantity for a power.
 * Supports:
 * - Numeric range selection (min to max, capped at 5) with +/- buttons
 * - "ALL" button for powers that can apply to all targets (e.g., learn role of ALL players)
 * - Settings powers with +5/-5 and +15/-15 controls and "up to"/"fixed" toggle
 * - Error display for invalid selections
 */

interface AmountSelectorProps {
  // Minimum amount allowed for this power (typically 0 or 1)
  minAmount: number;
  // Maximum amount allowed for this power (99 indicates power can apply to all targets)
  maxAmount: number;
  // Whether this power supports "ALL" / random amount selection
  allowRandom: boolean;
  // Current selected amount (string because "ALL" is a valid value)
  amount: string | null;
  // Validation error message to display, if any
  error: string | null;
  // Callback when numeric amount changes
  onAmountChange: (amount: string | null) => void;
  // Callback when "ALL" button is clicked
  onAllClick: () => void;
  // Whether this is a settings-type power (uses different increment/decrement)
  isSettings?: boolean;
  // Unit label for settings (e.g., "seconds")
  unit?: string;
}

/**
 * Renders a number input field with +/- buttons and optional "ALL" button.
 * For settings powers: shows +5/-5 and +15/-15 controls with "up to"/"fixed" toggle.
 * For regular powers: capped at 5 with standard +/- wrapping.
 */
export function AmountSelector({
  minAmount,
  maxAmount,
  amount,
  error,
  onAmountChange,
  isSettings = false,
  unit = "",
}: AmountSelectorProps) {
  const maxDisplay = isSettings ? maxAmount : Math.min(maxAmount, 5);

  // Extract modifier (shorten/lengthen/both) from amount string
  let modifier = "both"; // default
  if (amount?.includes("SHORTEN")) modifier = "shorten";
  else if (amount?.includes("LENGTHEN")) modifier = "lengthen";

  // Extract the numeric value, ignoring prefixes
  const isUpTo = amount?.includes("UP TO") ?? false;
  const getNumericValue = () => {
    if (!amount || amount === "ALL") return minAmount;
    // Strip all prefixes to get the numeric part
    const numericPart = amount
      .replace("SHORTEN ", "")
      .replace("LENGTHEN ", "")
      .replace("UP TO ", "")
      .trim();
    return parseInt(numericPart, 10) || minAmount;
  };
  const currentValue = getNumericValue();

  const buildAmountString = (newNumericValue: number, newIsUpTo?: boolean) => {
    const upToStatus = newIsUpTo !== undefined ? newIsUpTo : isUpTo;
    let result = String(newNumericValue);
    if (upToStatus) result = `UP TO ${result}`;
    if (modifier === "shorten") result = `SHORTEN ${result}`;
    else if (modifier === "lengthen") result = `LENGTHEN ${result}`;
    return result;
  };

  const handleDecrement = (decrementAmount: number) => {
    const newValue =
      currentValue <= minAmount ? maxDisplay : currentValue - decrementAmount;
    onAmountChange(buildAmountString(newValue));
  };

  const handleIncrement = (incrementAmount: number) => {
    const newValue =
      currentValue >= maxDisplay ? minAmount : currentValue + incrementAmount;
    onAmountChange(buildAmountString(newValue));
  };

  const handleToggleUpTo = () => {
    onAmountChange(buildAmountString(currentValue, !isUpTo));
  };

  const handleModifierChange = (newModifier: string) => {
    const newModifierValue = newModifier === modifier ? "both" : newModifier;
    let prefix = "";
    if (newModifierValue === "shorten") prefix = "SHORTEN ";
    else if (newModifierValue === "lengthen") prefix = "LENGTHEN ";
    const suffix = isUpTo ? `UP TO ${currentValue}` : String(currentValue);
    onAmountChange(`${prefix}${suffix}`);
  };

  return (
    <div className="amount-section">
      {/* Label */}
      <label>
        {isSettings
          ? `Amount (0-${maxDisplay}${unit ? ` ${unit}` : ""})`
          : `Amount (${minAmount}-${maxDisplay})`}
      </label>

      {/* Settings Type Power Controls */}
      {isSettings ? (
        <div className="settings-controls">
          {/* Shorten / Both / Lengthen Toggle */}
          <div className="settings-toggle-buttons">
            <button
              type="button"
              className={`settings-toggle-btn ${modifier === "shorten" ? "active" : ""}`}
              onClick={() => handleModifierChange("shorten")}
            >
              Shorten
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${modifier === "both" ? "active" : ""}`}
              onClick={() => handleModifierChange("both")}
            >
              Both
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${modifier === "lengthen" ? "active" : ""}`}
              onClick={() => handleModifierChange("lengthen")}
            >
              Lengthen
            </button>
          </div>

          {/* Up To / Fixed Toggle */}
          <div className="settings-toggle-buttons">
            <button
              type="button"
              className={`settings-toggle-btn ${isUpTo ? "" : "active"}`}
              onClick={() => onAmountChange(String(currentValue))}
            >
              Fixed
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${isUpTo ? "active" : ""}`}
              onClick={handleToggleUpTo}
            >
              Up To
            </button>
          </div>

          {/* Main Controls: -15, input, +15 */}
          <div className="settings-increment-buttons">
            <button
              type="button"
              className="settings-increment-button"
              onClick={() => handleDecrement(15)}
              title="Decrease by 15"
            >
              −15
            </button>

            <input
              type="number"
              className="settings-amount-input"
              min={minAmount}
              max={maxDisplay}
              value={currentValue}
              onChange={(e) => {
                const val = e.target.value || String(minAmount);
                onAmountChange(
                  buildAmountString(parseInt(val, 10) || minAmount),
                );
              }}
              placeholder={`${minAmount}`}
            />

            <button
              type="button"
              className="settings-increment-button"
              onClick={() => handleIncrement(15)}
              title="Increase by 15"
            >
              +15
            </button>
          </div>
        </div>
      ) : (
        // Regular Power Controls
        <div className="amount-controls">
          {/* Minus button */}
          <button
            type="button"
            className="amount-button minus-button"
            onClick={() => handleDecrement(1)}
            title="Decrease"
          >
            −
          </button>

          {/* Number input */}
          <input
            type="number"
            min={minAmount}
            max={maxDisplay}
            value={currentValue}
            onChange={(e) => onAmountChange(e.target.value || null)}
            placeholder={`${minAmount}`}
          />

          {/* Plus button */}
          <button
            type="button"
            className="amount-button plus-button"
            onClick={() => handleIncrement(1)}
            title="Increase"
          >
            +
          </button>
        </div>
      )}

      {/* Error message display for validation failures */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
