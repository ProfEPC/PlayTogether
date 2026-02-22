import express, { Router } from "express";
import * as fs from "fs";
import * as path from "path";

export interface CharacterInCreation {
  name: string;
  [key: string]: unknown;
}

interface StoredCharacter {
  id: string;
  name: string;
  data: CharacterInCreation;
  createdAt: string;
  updatedAt: string;
}

const router = Router();

// File-based storage for saved characters
const DATA_DIR = path.join(process.cwd(), "data");
const CHARACTERS_FILE = path.join(DATA_DIR, "characters.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize characters file if it doesn't exist
if (!fs.existsSync(CHARACTERS_FILE)) {
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify([]), "utf-8");
}

/**
 * Load all characters from file
 */
function loadCharactersFromFile(): StoredCharacter[] {
  try {
    const content = fs.readFileSync(CHARACTERS_FILE, "utf-8");
    return JSON.parse(content) as StoredCharacter[];
  } catch (error) {
    console.error("Error reading characters file:", error);
    return [];
  }
}

/**
 * Save all characters to file
 */
function saveCharactersToFile(characters: StoredCharacter[]): void {
  try {
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(characters, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing characters file:", error);
  }
}

/**
 * POST /api/characters - Save a new character
 */
router.post("/", (req, res) => {
  try {
    const character: CharacterInCreation = req.body;

    if (!character.name) {
      return res.status(400).json({ error: "Character name is required" });
    }

    const characters = loadCharactersFromFile();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const storedCharacter: StoredCharacter = {
      id,
      name: character.name,
      data: character,
      createdAt: now,
      updatedAt: now,
    };

    characters.push(storedCharacter);
    saveCharactersToFile(characters);

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
    const charactersList = loadCharactersFromFile();
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

    const characters = loadCharactersFromFile();
    const existingIndex = characters.findIndex((c) => c.id === id);
    
    if (existingIndex === -1) {
      return res.status(404).json({ error: "Character not found" });
    }

    const now = new Date().toISOString();
    const updated: StoredCharacter = {
      ...characters[existingIndex],
      name: character.name,
      data: character,
      updatedAt: now,
    };

    characters[existingIndex] = updated;
    saveCharactersToFile(characters);
    
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
    const characters = loadCharactersFromFile();
    const index = characters.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Character not found" });
    }

    characters.splice(index, 1);
    saveCharactersToFile(characters);
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting character:", error);
    return res.status(500).json({ error: "Failed to delete character" });
  }
});

export default router;
