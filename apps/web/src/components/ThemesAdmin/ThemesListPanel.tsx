import type { FC } from "react";
import type { StoredTheme } from "../../types/themes";

interface ThemesListPanelProps {
  themes: StoredTheme[];
  loading: boolean;
  selectedThemeId: string | undefined;
  onSelect: (theme: StoredTheme) => void;
  onAddNew: () => void;
}

/**
 * Left sidebar – shows available themes and the "+ New Theme" button.
 */
export const ThemesListPanel: FC<ThemesListPanelProps> = ({
  themes,
  loading,
  selectedThemeId,
  onSelect,
  onAddNew,
}) => (
  <div className="themes-list-panel">
    <h3>Themes</h3>

    {loading ? (
      <div className="loading">Loading themes...</div>
    ) : (
      <>
        <div className="themes-list">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-item ${selectedThemeId === theme.id ? "active" : ""}`}
              onClick={() => onSelect(theme)}
            >
              <div className="theme-name">{theme.name}</div>
            </button>
          ))}
        </div>

        <button className="add-button" onClick={onAddNew}>
          + New Theme
        </button>
      </>
    )}
  </div>
);
