import { useState, useEffect, useCallback } from "react";
import type { GameTheme, StoredTheme } from "../../types/themes";
import {
  loadThemes,
  saveTheme,
  updateTheme,
  deleteTheme,
} from "../../lib/themePersistence";
import { EMPTY_THEME } from "./constants";

/**
 * Encapsulates all theme CRUD state and handlers.
 *
 * Returns the data needed by the list panel and editor panel,
 * plus action callbacks the UI can call directly.
 */
export function useThemes() {
  const [themes, setThemes] = useState<StoredTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<GameTheme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadThemes();
      setThemes(data);
    } catch (error) {
      setMessage(`Error loading themes: ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const selectTheme = (theme: StoredTheme | GameTheme) => {
    setSelectedTheme(theme);
    setIsEditing(false);
  };

  const startEditing = () => setIsEditing(true);
  const cancelEditing = () => setIsEditing(false);

  const addNew = () => {
    setSelectedTheme({ ...EMPTY_THEME });
    setIsEditing(true);
  };

  const save = async () => {
    if (!selectedTheme) return;
    try {
      const exists = themes.some((t) => t.id === selectedTheme.id);
      if (exists) {
        await updateTheme(selectedTheme.id, selectedTheme);
        setMessage("Theme updated successfully!");
      } else {
        await saveTheme(selectedTheme);
        setMessage("Theme created successfully!");
      }
      await fetchThemes();
      setIsEditing(false);
    } catch (error) {
      setMessage(`Error saving theme: ${error}`);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this theme?")) return;
    try {
      await deleteTheme(id);
      setMessage("Theme deleted successfully!");
      setSelectedTheme(null);
      await fetchThemes();
    } catch (error) {
      setMessage(`Error deleting theme: ${error}`);
    }
  };

  /** Deep-set a dot-path field on the selected theme. */
  const updateField = (path: string, value: string) => {
    if (!selectedTheme) return;
    const keys = path.split(".");
    const clone = JSON.parse(JSON.stringify(selectedTheme));
    let obj = clone;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setSelectedTheme(clone);
  };

  return {
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
  };
}
