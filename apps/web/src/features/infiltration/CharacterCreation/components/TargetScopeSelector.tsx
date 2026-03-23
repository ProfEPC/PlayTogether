import type { TargetScope } from "../../../../constants/infiltrationPowers/types";

interface TargetScopeSelectorProps {
  targetScopes: TargetScope[];
  selectedScope: TargetScope | undefined;
  onScopeChange: (scope: TargetScope) => void;
}

/**
 * Selector for target scope: Players Only, NPC Only, or Players and NPC.
 * Shown during character creation when a power supports multiple target scopes.
 */
export function TargetScopeSelector({
  targetScopes,
  selectedScope,
  onScopeChange,
}: TargetScopeSelectorProps) {
  return (
    <div className="selector target-scope-selector">
      <label>Target:</label>
      <div className="target-scope-buttons-row">
        {targetScopes.map((scope) => (
          <button
            type="button"
            key={scope}
            className={`target-scope-button ${selectedScope === scope ? "selected" : ""}`}
            onClick={() => onScopeChange(scope)}
          >
            {scope}
          </button>
        ))}
      </div>
    </div>
  );
}
