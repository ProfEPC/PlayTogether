import { useThemes } from "./ThemesAdmin/useThemes";
import { ThemesListPanel } from "./ThemesAdmin/ThemesListPanel";
import { ThemeEditorPanel } from "./ThemesAdmin/ThemeEditorPanel";
import "./ThemesAdmin/styles/index.css";

/**
 * Admin component for managing game themes.
 *
 * Thin orchestrator — delegates state to `useThemes`,
 * list rendering to `ThemesListPanel`, and editing to `ThemeEditorPanel`.
 */
export default function ThemesAdmin() {
  const {
    themes,
    loading,
    selectedTheme,
    setSelectedTheme,
    isEditing,
    message,
    setMessage,
    selectTheme,
    startEditing,
    cancelEditing,
    addNew,
    save,
    remove,
    updateField,
  } = useThemes();

  return (
    <div className="themes-admin">
      <h2>Manage Themes</h2>

      {message && (
        <div className="message">
          {message}
          <button className="close-btn" onClick={() => setMessage(null)}>
            ×
          </button>
        </div>
      )}

      <div className="themes-container">
        <ThemesListPanel
          themes={themes}
          loading={loading}
          selectedThemeId={selectedTheme?.id}
          onSelect={selectTheme}
          onAddNew={addNew}
        />

        {selectedTheme ? (
          <ThemeEditorPanel
            theme={selectedTheme}
            isEditing={isEditing}
            isExisting={themes.some((t) => t.id === selectedTheme.id)}
            onSetTheme={setSelectedTheme}
            onUpdateField={updateField}
            onSave={save}
            onDelete={remove}
            onStartEdit={startEditing}
            onCancelEdit={cancelEditing}
          />
        ) : (
          <div className="theme-editor-panel">
            <div className="no-selection">Select a theme to view details</div>
          </div>
        )}
      </div>
    </div>
  );
}
