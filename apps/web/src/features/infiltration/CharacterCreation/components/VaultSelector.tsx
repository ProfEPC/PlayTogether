/**
 * VaultSelector Component
 *
 * Allows the user to select the number of vault deliberations for a power.
 * Displayed as a deliberation input field with +/- buttons.
 */

interface VaultSelectorProps {
  // Current vault value (0 means vault not used)
  vault: number;
  // Callback when vault value changes
  onVaultChange: (vault: number) => void;
}

export function VaultSelector({ vault, onVaultChange }: VaultSelectorProps) {
  const minVault = 0;
  const maxVault = 5;

  const handleDecrement = () => {
    const newValue = vault <= minVault ? maxVault : vault - 1;
    onVaultChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = vault >= maxVault ? minVault : vault + 1;
    onVaultChange(newValue);
  };

  return (
    <div className="vault-section">
      <label>Vault Deliberations</label>
      <div className="amount-controls">
        {/* Minus button */}
        <button
          type="button"
          className="amount-button minus-button"
          onClick={handleDecrement}
          title="Decrease"
        >
          −
        </button>

        {/* Number input */}
        <input
          type="number"
          min={minVault}
          max={maxVault}
          value={vault}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= minVault && val <= maxVault) {
              onVaultChange(val);
            }
          }}
          placeholder={`${minVault}`}
        />

        {/* Plus button */}
        <button
          type="button"
          className="amount-button plus-button"
          onClick={handleIncrement}
          title="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
}
