import express, { Router } from "express";

export interface CharacterInCreation {
  name: string;
  [key: string]: unknown;
}

const router = Router();

// In-memory storage for saved characters (replace with database later)
interface StoredCharacter {
  id: string;
  name: string;
  data: CharacterInCreation;
  createdAt: string;
  updatedAt: string;
}

const characters: Map<string, StoredCharacter> = new Map();

/**
 * POST /api/characters - Save a new character
 */
router.post("/", (req, res) => {
  try {
    const character: CharacterInCreation = req.body;

    if (!character.name) {
      return res.status(400).json({ error: "Character name is required" });
    }

    const id = Date.now().toString();
    const now = new Date().toISOString();

    const storedCharacter: StoredCharacter = {
      id,
      name: character.name,
      data: character,
      createdAt: now,
      updatedAt: now,
    };

    characters.set(id, storedCharacter);

    return res.status(201).json(storedCharacter);
  } catch (error) {
    console.error("Error saving character:", error);
    return res.status(500).json({ error: "Failed to save character" });
  }
});

/**
 * GET /api/characters - Get all saved characters
 */
router.get("/", (_req, res) => {
  try {
    const charactersList = Array.from(characters.values());
    return res.json(charactersList);
  } catch (error) {
    console.error("Error loading characters:", error);
    return res.status(500).json({ error: "Failed to load characters" });
  }
});

/**
 * PUT /api/characters/:id - Update an existing character
 */
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const character: CharacterInCreation = req.body;

    if (!character.name) {
      return res.status(400).json({ error: "Character name is required" });
    }

    const existing = characters.get(id);
    if (!existing) {
      return res.status(404).json({ error: "Character not found" });
    }

    const now = new Date().toISOString();
    const updated: StoredCharacter = {
      ...existing,
      name: character.name,
      data: character,
      updatedAt: now,
    };

    characters.set(id, updated);
    return res.json(updated);
  } catch (error) {
    console.error("Error updating character:", error);
    return res.status(500).json({ error: "Failed to update character" });
  }
});

/**
 * DELETE /api/characters/:id - Delete a character
 */
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    if (!characters.has(id)) {
      return res.status(404).json({ error: "Character not found" });
    }

    characters.delete(id);
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting character:", error);
    return res.status(500).json({ error: "Failed to delete character" });
  }
});

export default router;
