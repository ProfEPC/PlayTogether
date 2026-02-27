import { useState, useEffect } from "react";
import type { CharacterInCreation } from "../../../../types/characterCreation";
import {
  loadCharacters,
  deleteCharacter,
  type SavedCharacter,
} from "../../../../lib/characterPersistence";
import { loadThemes, type StoredTheme } from "../../../../lib/themePersistence";
import "./LoadCharacterModal.css";

interface LoadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (character: CharacterInCreation) => void;
}

export function LoadCharacterModal({
  isOpen,
  onClose,
  onLoad,
}: LoadCharacterModalProps) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<StoredTheme[]>([]);
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
      fetchThemes();
    }
  }, [isOpen]);

  const fetchThemes = async () => {
    try {
      const availableThemes = await loadThemes();
      setThemes(availableThemes);
    } catch (err) {
      console.error("Failed to load themes:", err);
    }
  };

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadCharacters();
      setCharacters(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load characters",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = (character: SavedCharacter) => {
    onLoad(character.data);
    onClose();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this character?")) {
      return;
    }

    try {
      await deleteCharacter(id);
      setCharacters(characters.filter((c) => c.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete character",
      );
    }
  };

  if (!isOpen) return null;

  // ! Filter characters by selected theme
  const filteredCharacters =
    selectedThemeFilter === "all"
      ? characters
      : characters.filter((c) => c.data.theme === selectedThemeFilter);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load Character</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* ! Theme Filter */}
        {!loading && themes.length > 0 && (
          <div className="modal-filters">
            <label>Filter by Theme:</label>
            <select
              value={selectedThemeFilter}
              onChange={(e) => setSelectedThemeFilter(e.target.value)}
            >
              <option value="all">All Themes</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="modal-loading">Loading characters...</div>
        ) : filteredCharacters.length === 0 ? (
          <div className="modal-empty">No saved characters yet.</div>
        ) : (
          <div className="characters-list">
            {filteredCharacters.map((char) => (
              <div key={char.id} className="character-item">
                <div className="character-info">
                  <div className="character-name">
                    {char.data.name || "Unnamed"}
                  </div>
                  <div className="character-desc">
                    {char.data.description || "No description"}
                  </div>
                  <div className="character-meta">
                    Team: {char.data.team || "None"} • Powers:{" "}
                    {char.data.powerSlots.filter((s) => s.powerIndex).length} •
                    Theme: {char.data.theme || "none"}
                  </div>
                  <div className="character-date">
                    Saved {new Date(char.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="character-actions">
                  <button className="load-btn" onClick={() => handleLoad(char)}>
                    Load
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(char.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
