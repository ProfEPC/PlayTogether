import type { FC } from "react";
import type { GameTheme } from "../../types/themes";
import { ThemeField } from "./ThemeField";

interface ThemeEditorPanelProps {
  theme: GameTheme;
  isEditing: boolean;
  /** Whether this theme already exists (disables ID editing). */
  isExisting: boolean;
  onSetTheme: (t: GameTheme) => void;
  onUpdateField: (path: string, value: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

/**
 * Right panel – theme detail / editor.
 *
 * Uses `ThemeField` for every form row, collapsing ~400 lines of
 * repetitive edit-or-view JSX into declarative field descriptors.
 */
export const ThemeEditorPanel: FC<ThemeEditorPanelProps> = ({
  theme,
  isEditing,
  isExisting,
  onSetTheme,
  onUpdateField,
  onSave,
  onDelete,
  onStartEdit,
  onCancelEdit,
}) => (
  <div className="theme-editor-panel">
    <h3>{isEditing ? "Edit Theme" : "View Theme"}</h3>

    {/* Theme ID — only shown while editing */}
    {isEditing && (
      <div className="form-group">
        <label>Theme ID:</label>
        <input
          type="text"
          value={theme.id}
          onChange={(e) => onSetTheme({ ...theme, id: e.target.value })}
          placeholder="e.g., coop_office"
          disabled={isExisting}
        />
        <small>Cannot change ID of existing themes</small>
      </div>
    )}

    {/* Name & description — use direct setSelectedTheme for top-level fields */}
    <ThemeField
      label="Name:"
      value={theme.name}
      isEditing={isEditing}
      onChange={(v) => onSetTheme({ ...theme, name: v })}
      placeholder="Display name"
    />
    <ThemeField
      label="Description:"
      value={theme.description}
      isEditing={isEditing}
      onChange={(v) => onSetTheme({ ...theme, description: v })}
      placeholder="Theme description"
      multiline
    />

    {/* ── Team Terminology ── */}
    <div className="section">
      <h4>Team Terminology</h4>
      <ThemeField
        label="Infiltrator (Singular):"
        value={theme.teamTerms.infiltratorSingular}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("teamTerms.infiltratorSingular", v)}
      />
      <ThemeField
        label="Infiltrator (Plural):"
        value={theme.teamTerms.infiltratorPlural}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("teamTerms.infiltratorPlural", v)}
      />
      <ThemeField
        label="Innocent (Singular):"
        value={theme.teamTerms.innocentSingular}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("teamTerms.innocentSingular", v)}
      />
      <ThemeField
        label="Innocent (Plural):"
        value={theme.teamTerms.innocentPlural}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("teamTerms.innocentPlural", v)}
      />
    </div>

    {/* ── Reveal Phase ── */}
    <div className="section">
      <h4>{theme.phaseNames.reveal} Phase</h4>
      <ThemeField
        label="Phase Name:"
        value={theme.phaseNames.reveal}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseNames.reveal", v)}
      />
      <ThemeField
        label="Prompt:"
        value={theme.phaseText.revealPrompt}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseText.revealPrompt", v)}
        multiline
      />
    </div>

    {/* ── Mayhem Phase ── */}
    <div className="section">
      <h4>{theme.phaseNames.mayhem} Phase</h4>
      <ThemeField
        label="Phase Name:"
        value={theme.phaseNames.mayhem}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseNames.mayhem", v)}
      />
      <ThemeField
        label="Prompt:"
        value={theme.phaseText.mayhemPrompt}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseText.mayhemPrompt", v)}
        multiline
      />
    </div>

    {/* ── Voting Phase ── */}
    <div className="section">
      <h4>{theme.phaseNames.voting} Phase</h4>
      <ThemeField
        label="Phase Name:"
        value={theme.phaseNames.voting}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseNames.voting", v)}
      />
      <ThemeField
        label="Prompt:"
        value={theme.phaseText.votingPrompt}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseText.votingPrompt", v)}
        multiline
      />
    </div>

    {/* ── Special Cases ── */}
    <div className="section">
      <h4>Special Cases</h4>
      <ThemeField
        label={`No ${theme.teamTerms.infiltratorSingular} Option:`}
        value={theme.phaseText.noInfiltratorOption}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("phaseText.noInfiltratorOption", v)}
      />
    </div>

    {/* ── NPC Terminology ── */}
    <div className="section">
      <h4>NPC Terminology</h4>
      <ThemeField
        label="NPC (Singular):"
        value={theme.characterTerms.npcSingular}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("characterTerms.npcSingular", v)}
      />
      <ThemeField
        label="NPC (Plural):"
        value={theme.characterTerms.npcPlural}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("characterTerms.npcPlural", v)}
      />
    </div>

    {/* ── Game Outcomes & Results ── */}
    <div className="section">
      <h4>Game Outcomes & Results</h4>
      <ThemeField
        label="Player Outed Text:"
        value={theme.playerTerms.playerOuted}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("playerTerms.playerOuted", v)}
        hint="Use {role} as a placeholder for role name"
      />
      <ThemeField
        label="Infiltrator Victory Text:"
        value={theme.playerTerms.infiltratorWinText}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("playerTerms.infiltratorWinText", v)}
      />
      <ThemeField
        label="Innocents Victory Text:"
        value={theme.playerTerms.innocentsWinText}
        isEditing={isEditing}
        onChange={(v) => onUpdateField("playerTerms.innocentsWinText", v)}
      />
    </div>

    {/* ── Action Buttons ── */}
    <div className="button-group">
      {isEditing ? (
        <>
          <button className="save-button" onClick={onSave}>
            Save Theme
          </button>
          <button className="cancel-button" onClick={onCancelEdit}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button className="edit-button" onClick={onStartEdit}>
            Edit
          </button>
          <button className="delete-button" onClick={() => onDelete(theme.id)}>
            Delete
          </button>
        </>
      )}
    </div>
  </div>
);
