import type { FC } from "react";

interface ThemeFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  /** Use a textarea instead of a single-line input. */
  multiline?: boolean;
  /** Small hint text below the label. */
  hint?: string;
  /** Disable the input even when editing (e.g. existing ID). */
  disabled?: boolean;
  /** Placeholder text shown inside the input. */
  placeholder?: string;
}

/**
 * A single label + input/view-text pair.
 *
 * Eliminates the repeated isEditing ? <input> : <div className="view-text">
 * pattern that was duplicated ~20 times in the old monolith.
 */
export const ThemeField: FC<ThemeFieldProps> = ({
  label,
  value,
  isEditing,
  onChange,
  multiline = false,
  hint,
  disabled = false,
  placeholder,
}) => (
  <div className="form-group">
    <label>{label}</label>
    {hint && <small>{hint}</small>}
    {isEditing ? (
      multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
      )
    ) : (
      <div className="view-text">{value}</div>
    )}
  </div>
);
