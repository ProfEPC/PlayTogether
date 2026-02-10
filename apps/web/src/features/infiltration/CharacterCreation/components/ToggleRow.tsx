interface ToggleRowProps {
  name: string;
  checked: boolean;
  applicable: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  name,
  checked,
  applicable,
  onChange,
}: ToggleRowProps) {
  return (
    <label className={`toggle-row ${!applicable ? "disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={!applicable}
      />
      <span>{name}</span>
    </label>
  );
}
