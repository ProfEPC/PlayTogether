import type { CharacterInCreation } from "../types/characterCreation";
import { sortPowerSlots } from "../utils/powerSorting";

const API_BASE = "http://localhost:3001/api";

export interface SavedCharacter {
  id: string;
  name: string;
  data: CharacterInCreation;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save a character to the server database
 */
export async function saveCharacter(
  character: CharacterInCreation,
): Promise<SavedCharacter> {
  // Auto-sort power slots before saving
  const sortedCharacter = {
    ...character,
    powerSlots: sortPowerSlots(character.powerSlots),
  };

  const response = await fetch(`${API_BASE}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sortedCharacter),
  });

  if (!response.ok) {
    throw new Error(`Failed to save character: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Load all saved characters from the server
 */
export async function loadCharacters(): Promise<SavedCharacter[]> {
  const response = await fetch(`${API_BASE}/characters`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load characters: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a saved character by ID
 */
export async function deleteCharacter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/characters/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete character: ${response.statusText}`);
  }
}

/**
 * Update an existing character
 */
export async function updateCharacter(
  id: string,
  character: CharacterInCreation,
): Promise<SavedCharacter> {
  // Auto-sort power slots before updating
  const sortedCharacter = {
    ...character,
    powerSlots: sortPowerSlots(character.powerSlots),
  };

  const response = await fetch(`${API_BASE}/characters/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sortedCharacter),
  });

  if (!response.ok) {
    throw new Error(`Failed to update character: ${response.statusText}`);
  }

  return response.json();
}
