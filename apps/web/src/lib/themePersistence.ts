/**
 * ! Theme persistence and API functions
 * * Handles saving, loading, and managing game themes on the server
 */

import type { GameTheme, StoredTheme } from "../types/themes";

export type { StoredTheme };

const API_BASE = "http://localhost:3001/api";

/**
 * * Load all themes from the server
 */
export async function loadThemes(): Promise<StoredTheme[]> {
  const response = await fetch(`${API_BASE}/themes`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load themes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * * Save a new theme to the server
 */
export async function saveTheme(theme: GameTheme): Promise<StoredTheme> {
  if (!theme.id) {
    throw new Error("Theme must have an id");
  }

  const response = await fetch(`${API_BASE}/themes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(theme),
  });

  if (!response.ok) {
    throw new Error(`Failed to save theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * * Update an existing theme
 */
export async function updateTheme(
  id: string,
  theme: GameTheme,
): Promise<StoredTheme> {
  const response = await fetch(`${API_BASE}/themes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(theme),
  });

  if (!response.ok) {
    throw new Error(`Failed to update theme: ${response.statusText}`);
  }

  return response.json();
}

/**
 * * Delete a theme by ID
 */
export async function deleteTheme(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/themes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete theme: ${response.statusText}`);
  }
}
