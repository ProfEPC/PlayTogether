import { useEffect, useMemo, useState } from "react";
import { loadCharacters } from "../lib/characterPersistence";
import type { RoomState, RoleConfig } from "../types/room";

interface SavedCharacter {
  id: string | number;
  name: string;
  data?: { description?: string; team?: "innocent" | "infiltrator" | null };
}

/**
 * Manages character loading, role conversion, and selection state for Infiltration.
 * Characters are loaded from the API when the selected game is "infiltration".
 * Selection state (enabledRoleIds) is initialized from the server's room state.
 */
export function useCharacterRoles(
  selectedGameKey: string,
  roomState: RoomState | null,
) {
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  // Convert saved characters to the RoleConfig shape used by UI components
  const roles = useMemo(
    () =>
      savedCharacters.map((char, idx) => ({
        id: idx,
        key: `character_${char.id}`,
        title: char.name,
        description: char.data?.description || "Custom character",
        team: char.data?.team || undefined,
      })) as (RoleConfig & { team?: "innocent" | "infiltrator" })[],
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
  const [enabledRoleIds, setEnabledRoleIds] = useState<Set<number>>(
    () => new Set(),
  );

  // Initialize selection from the server's room state on first load
  useEffect(() => {
    if (!roomState || roomState.settings.gameKey !== "infiltration") return;

    // Only set on initial load (when enabledRoleIds is empty)
    if (enabledRoleIds.size === 0 && roles.length > 0) {
      const opts = roomState.settings.gameOptions?.infiltration;
      const serverChars = opts?.selectedCharacters ?? [];
      const ids = new Set(
        roles.filter((r) => serverChars.includes(r.title)).map((r) => r.id),
      );
      if (ids.size > 0) setEnabledRoleIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.roomCode, roles.length]);

  return { roles, enabledRoleIds, setEnabledRoleIds };
}
