import { useEffect, useMemo, useState } from "react";
import { loadCharacters } from "../lib/characterPersistence";
import type { RoomState, CharacterConfig } from "../types/room";

interface SavedCharacter {
  id: string | number;
  name: string;
  data?: { description?: string; team?: "innocent" | "infiltrator" | null };
}

/**
 * Manages character loading, conversion, and selection state for Infiltration.
 * Characters are loaded from the API when the selected game is "infiltration".
 * Selection state (enabledCharacterIds) is initialized from the server's room state.
 */
export function useCharacterSelection(
  selectedGameKey: string,
  roomState: RoomState | null,
) {
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  // Convert saved characters to the CharacterConfig shape used by UI components
  const characters = useMemo(
    () =>
      savedCharacters.map((char, idx) => ({
        id: idx,
        key: `character_${char.id}`,
        title: char.name,
        description: char.data?.description || "Custom character",
        team: char.data?.team || undefined,
      })) as (CharacterConfig & { team?: "innocent" | "infiltrator" })[],
    [savedCharacters],
  );

  // Load characters when infiltration is selected, clear otherwise
  useEffect(() => {
    if (selectedGameKey !== "infiltration") {
      setSavedCharacters([]);
      return;
    }

    (async () => {
      try {
        const characters = await loadCharacters();
        setSavedCharacters(characters);
      } catch (error) {
        console.error("Failed to load characters:", error);
      }
    })();
  }, [selectedGameKey]);

  // Which characters are currently toggled on (local UI state)
  const [enabledCharacterIds, setEnabledCharacterIds] = useState<Set<number>>(
    () => new Set(),
  );

  // Initialize selection from the server's room state on first load
  useEffect(() => {
    if (!roomState || roomState.settings.gameKey !== "infiltration") return;

    // Only set on initial load (when enabledCharacterIds is empty)
    if (enabledCharacterIds.size === 0 && characters.length > 0) {
      const opts = roomState.settings.gameOptions?.infiltration;
      const serverChars = opts?.selectedCharacters ?? [];
      const ids = new Set(
        characters
          .filter((c) => serverChars.includes(c.title))
          .map((c) => c.id),
      );
      if (ids.size > 0) setEnabledCharacterIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.roomCode, characters.length]);

  return { characters, enabledCharacterIds, setEnabledCharacterIds };
}
