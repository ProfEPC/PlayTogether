/**
 * AmountSelector Component
 *
 * Allows the user to select the amount/quantity for a power.
 * Supports:
 * - Numeric range selection (min to max, capped at 5)
 * - "ALL" button for powers that can apply to all targets (e.g., learn role of ALL players)
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
}

/**
 * Renders a number input field with optional "ALL" button.
 * The input is capped at 5 regardless of maxAmount to keep UI manageable.
 * The "ALL" button appears when maxAmount is 99 (indicating power can apply to all targets).
 */
export function AmountSelector({
  minAmount,
  maxAmount,
  amount,
  error,
  onAmountChange,
  onAllClick,
}: AmountSelectorProps) {
  return (
    <div className="amount-section">
      {/* Label shows the valid range and indicates if ALL is available */}
      <label>
        Amount ({minAmount}-{Math.min(maxAmount, 5)}
        {maxAmount === 99 ? " or ALL" : ""}):
      </label>
      <div className="amount-controls">
        {/* Number input: displays empty when "ALL" is selected, otherwise shows the number */}
        <input
          type="number"
          min={minAmount}
          max={Math.min(maxAmount, 5)}
          value={amount?.startsWith("ALL") ? "" : amount || ""}
          onChange={(e) => onAmountChange(e.target.value || null)}
          placeholder={`${minAmount}`}
        />
        {/* "ALL" button: shown when maxAmount is 99, meaning power can apply to all targets */}
        {maxAmount === 99 && (
          <button
            className={`all-button ${amount === "ALL" ? "active" : ""}`}
            onClick={onAllClick}
          >
            ALL
          </button>
        )}
      </div>
      {/* Error message display for validation failures */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
