import { useState, useEffect } from "react";
import type { GameTheme, StoredTheme } from "../types/themes";
import { DEFAULT_THEMES } from "../constants/themes";
import {
  loadThemes,
  saveTheme,
  updateTheme,
  deleteTheme,
} from "../lib/themePersistence";
import "./ThemesAdmin.css";

/**
 * * Admin component for managing game themes
 * ? Allows creation, editing, and deletion of themes with customizable strings
 */
export default function ThemesAdmin() {
  const [themes, setThemes] = useState<StoredTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<GameTheme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  //* Load themes on mount
  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const data = await loadThemes();
      setThemes(data);
    } catch (error) {
      setMessage(`Error loading themes: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = (theme: StoredTheme | GameTheme) => {
    setSelectedTheme(theme);
    setIsEditing(false);
  };

  const handleEditTheme = () => {
    setIsEditing(true);
  };

  const handleSaveTheme = async () => {
    if (!selectedTheme) return;

    try {
      //* Check if theme exists (update) or new (create)
      const existingTheme = themes.find((t) => t.id === selectedTheme.id);

      if (existingTheme) {
        await updateTheme(selectedTheme.id, selectedTheme);
        setMessage("Theme updated successfully!");
      } else {
        await saveTheme(selectedTheme);
        setMessage("Theme created successfully!");
      }

      //* Refresh themes list
      await fetchThemes();
      setIsEditing(false);
    } catch (error) {
      setMessage(`Error saving theme: ${error}`);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this theme?")) {
      return;
    }

    try {
      await deleteTheme(id);
      setMessage("Theme deleted successfully!");
      setSelectedTheme(null);
      await fetchThemes();
    } catch (error) {
      setMessage(`Error deleting theme: ${error}`);
    }
  };

  const handleAddNew = () => {
    setSelectedTheme({
      id: "",
      name: "",
      description: "",
      teamTerms: {
        infiltratorSingular: "Infiltrator",
        infiltratorPlural: "Infiltrators",
        villagerSingular: "Villager",
        villagerPlural: "Villagers",
      },
      phaseText: {
        revealPrompt: "",
        mayhemPrompt: "",
        votingPrompt: "",
        noInfiltratorOption: "No Infiltrator",
      },
      phaseNames: {
        reveal: "Reveal",
        mayhem: "Mayhem",
        voting: "Voting",
      },
      cardTerms: {
        centerCardSingular: "Center Card",
        centerCardPlural: "Center Cards",
        vaultCardSingular: "Vault Card",
        vaultCardPlural: "Vault Cards",
      },
      playerTerms: {
        playerOuted: "Player outed as {role}",
        infiltratorWinText: "Infiltrators win!",
        villagersWinText: "Villagers win!",
      },
    });
    setIsEditing(true);
  };

  //* Update theme field during editing
  const updateThemeField = (path: string, value: string) => {
    if (!selectedTheme) return;

    const keys = path.split(".");
    const newTheme = JSON.parse(JSON.stringify(selectedTheme));
    let obj = newTheme;

    //* Navigate to nested field
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    setSelectedTheme(newTheme);
  };

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
        {/* Themes List */}
        <div className="themes-list-panel">
          <h3>Themes</h3>

          {loading ? (
            <div className="loading">Loading themes...</div>
          ) : (
            <>
              <div className="themes-list">
                {/* ! All themes from server */}
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-item ${selectedTheme?.id === theme.id ? "active" : ""}`}
                    onClick={() => handleSelectTheme(theme)}
                  >
                    <div className="theme-name">{theme.name}</div>
                  </button>
                ))}
              </div>

              <button className="add-button" onClick={handleAddNew}>
                + New Theme
              </button>
            </>
          )}
        </div>

        {/* Theme Editor */}
        <div className="theme-editor-panel">
          {selectedTheme ? (
            <>
              <h3>{isEditing ? "Edit Theme" : "View Theme"}</h3>

              {isEditing ? (
                <div className="form-group">
                  <label>Theme ID:</label>
                  <input
                    type="text"
                    value={selectedTheme.id}
                    onChange={(e) =>
                      setSelectedTheme({
                        ...selectedTheme,
                        id: e.target.value,
                      })
                    }
                    placeholder="e.g., coop_office"
                    disabled={themes.some((t) => t.id === selectedTheme.id)}
                  />
                  <small>Cannot change ID of existing themes</small>
                </div>
              ) : null}

              <div className="form-group">
                <label>Name:</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedTheme.name}
                    onChange={(e) =>
                      setSelectedTheme({
                        ...selectedTheme,
                        name: e.target.value,
                      })
                    }
                    placeholder="Display name"
                  />
                ) : (
                  <div className="view-text">{selectedTheme.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Description:</label>
                {isEditing ? (
                  <textarea
                    value={selectedTheme.description}
                    onChange={(e) =>
                      setSelectedTheme({
                        ...selectedTheme,
                        description: e.target.value,
                      })
                    }
                    placeholder="Theme description"
                    rows={3}
                  />
                ) : (
                  <div className="view-text">{selectedTheme.description}</div>
                )}
              </div>

              {/* Team Terms */}
              <div className="section">
                <h4>Team Terminology</h4>

                <div className="form-group">
                  <label>Infiltrator (Singular):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.teamTerms.infiltratorSingular}
                      onChange={(e) =>
                        updateThemeField(
                          "teamTerms.infiltratorSingular",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.teamTerms.infiltratorSingular}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Infiltrator (Plural):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.teamTerms.infiltratorPlural}
                      onChange={(e) =>
                        updateThemeField(
                          "teamTerms.infiltratorPlural",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.teamTerms.infiltratorPlural}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Villager (Singular):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.teamTerms.villagerSingular}
                      onChange={(e) =>
                        updateThemeField(
                          "teamTerms.villagerSingular",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.teamTerms.villagerSingular}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Villager (Plural):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.teamTerms.villagerPlural}
                      onChange={(e) =>
                        updateThemeField(
                          "teamTerms.villagerPlural",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.teamTerms.villagerPlural}
                    </div>
                  )}
                </div>
              </div>

              {/* ! Phases - Organized by Phase */}
              {/* ! Reveal Phase */}
              <div className="section">
                <h4>{selectedTheme.phaseNames.reveal} Phase</h4>

                <div className="form-group">
                  <label>Phase Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.phaseNames.reveal}
                      onChange={(e) =>
                        updateThemeField("phaseNames.reveal", e.target.value)
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseNames.reveal}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Prompt:</label>
                  {isEditing ? (
                    <textarea
                      value={selectedTheme.phaseText.revealPrompt}
                      onChange={(e) =>
                        updateThemeField(
                          "phaseText.revealPrompt",
                          e.target.value,
                        )
                      }
                      rows={2}
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseText.revealPrompt}
                    </div>
                  )}
                </div>
              </div>

              {/* ! Mayhem Phase */}
              <div className="section">
                <h4>{selectedTheme.phaseNames.mayhem} Phase</h4>

                <div className="form-group">
                  <label>Phase Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.phaseNames.mayhem}
                      onChange={(e) =>
                        updateThemeField("phaseNames.mayhem", e.target.value)
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseNames.mayhem}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Prompt:</label>
                  {isEditing ? (
                    <textarea
                      value={selectedTheme.phaseText.mayhemPrompt}
                      onChange={(e) =>
                        updateThemeField(
                          "phaseText.mayhemPrompt",
                          e.target.value,
                        )
                      }
                      rows={2}
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseText.mayhemPrompt}
                    </div>
                  )}
                </div>
              </div>

              {/* ! Voting Phase */}
              <div className="section">
                <h4>{selectedTheme.phaseNames.voting} Phase</h4>

                <div className="form-group">
                  <label>Phase Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.phaseNames.voting}
                      onChange={(e) =>
                        updateThemeField("phaseNames.voting", e.target.value)
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseNames.voting}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Prompt:</label>
                  {isEditing ? (
                    <textarea
                      value={selectedTheme.phaseText.votingPrompt}
                      onChange={(e) =>
                        updateThemeField(
                          "phaseText.votingPrompt",
                          e.target.value,
                        )
                      }
                      rows={2}
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseText.votingPrompt}
                    </div>
                  )}
                </div>
              </div>

              {/* ! No Infiltrator Option */}
              <div className="section">
                <h4>Special Cases</h4>

                <div className="form-group">
                  <label>
                    No {selectedTheme.teamTerms.infiltratorSingular} Option:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.phaseText.noInfiltratorOption}
                      onChange={(e) =>
                        updateThemeField(
                          "phaseText.noInfiltratorOption",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.phaseText.noInfiltratorOption}
                    </div>
                  )}
                </div>
              </div>

              {/* ! Card Terminology */}
              <div className="section">
                <h4>Card & Vault Terminology</h4>

                <div className="form-group">
                  <label>Center Card (Singular):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.cardTerms.centerCardSingular}
                      onChange={(e) =>
                        updateThemeField(
                          "cardTerms.centerCardSingular",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.cardTerms.centerCardSingular}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Center Card (Plural):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.cardTerms.centerCardPlural}
                      onChange={(e) =>
                        updateThemeField(
                          "cardTerms.centerCardPlural",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.cardTerms.centerCardPlural}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Vault Card (Singular):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.cardTerms.vaultCardSingular}
                      onChange={(e) =>
                        updateThemeField(
                          "cardTerms.vaultCardSingular",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.cardTerms.vaultCardSingular}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Vault Card (Plural):</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.cardTerms.vaultCardPlural}
                      onChange={(e) =>
                        updateThemeField(
                          "cardTerms.vaultCardPlural",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.cardTerms.vaultCardPlural}
                    </div>
                  )}
                </div>
              </div>

              {/* ! Game Outcome Text */}
              <div className="section">
                <h4>Game Outcomes & Results</h4>

                <div className="form-group">
                  <label>Player Outed Text:</label>
                  <small>Use {"{role}"} as a placeholder for role name</small>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.playerTerms.playerOuted}
                      onChange={(e) =>
                        updateThemeField(
                          "playerTerms.playerOuted",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.playerTerms.playerOuted}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Infiltrator Victory Text:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.playerTerms.infiltratorWinText}
                      onChange={(e) =>
                        updateThemeField(
                          "playerTerms.infiltratorWinText",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.playerTerms.infiltratorWinText}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Villagers Victory Text:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedTheme.playerTerms.villagersWinText}
                      onChange={(e) =>
                        updateThemeField(
                          "playerTerms.villagersWinText",
                          e.target.value,
                        )
                      }
                    />
                  ) : (
                    <div className="view-text">
                      {selectedTheme.playerTerms.villagersWinText}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="button-group">
                {isEditing ? (
                  <>
                    <button className="save-button" onClick={handleSaveTheme}>
                      Save Theme
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-button" onClick={handleEditTheme}>
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteTheme(selectedTheme.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">Select a theme to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
