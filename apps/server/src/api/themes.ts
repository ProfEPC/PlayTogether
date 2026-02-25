import express, { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

// ! Theme data file path - all themes persisted here
const THEMES_FILE = path.join(__dirname, "../../data/themes.json");

interface GameTheme {
  id: string;
  name: string;
  description: string;
  teamTerms: {
    infiltratorSingular: string;
    infiltratorPlural: string;
    villagerSingular: string;
    villagerPlural: string;
  };
  phaseText: {
    revealPrompt: string;
    mayhemPrompt: string;
    votingPrompt: string;
    noInfiltratorOption: string;
  };
  phaseNames: {
    reveal: string;
    mayhem: string;
    voting: string;
  };
  cardTerms: {
    centerCardSingular: string;
    centerCardPlural: string;
    vaultCardSingular: string;
    vaultCardPlural: string;
  };
  playerTerms: {
    playerOuted: string;
    infiltratorWinText: string;
    villagersWinText: string;
  };
  uiLabels?: Record<string, string>;
  powerTerms?: Record<string, string>;
}

interface StoredTheme extends GameTheme {
  createdAt: string;
  updatedAt: string;
}

// * Load themes from JSON file
const loadThemes = (): StoredTheme[] => {
  try {
    if (fs.existsSync(THEMES_FILE)) {
      const data = fs.readFileSync(THEMES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading themes:", error);
  }
  return [];
};

// * Save themes to JSON file
const saveThemes = (themes: StoredTheme[]): void => {
  try {
    const dir = path.dirname(THEMES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(THEMES_FILE, JSON.stringify(themes, null, 2));
  } catch (error) {
    console.error("Error saving themes:", error);
    throw error;
  }
};

const router = Router();

// ? GET /api/themes - Load all themes
router.get("/", (req: Request, res: Response) => {
  try {
    const themes = loadThemes();
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: "Failed to load themes" });
  }
});

// ? POST /api/themes - Create new theme
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      description,
      teamTerms,
      phaseText,
      phaseNames,
      cardTerms,
      playerTerms,
      uiLabels,
      powerTerms,
    } = req.body;

    // ! Validate required fields
    if (
      !id ||
      !name ||
      !teamTerms ||
      !phaseText ||
      !phaseNames ||
      !cardTerms ||
      !playerTerms
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const themes = loadThemes();

    // ! Check if theme with this ID already exists
    if (themes.some((t) => t.id === id)) {
      return res
        .status(409)
        .json({ error: "Theme with this ID already exists" });
    }

    const newTheme: StoredTheme = {
      id,
      name,
      description,
      teamTerms,
      phaseText,
      phaseNames,
      cardTerms,
      playerTerms,
      uiLabels,
      powerTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    themes.push(newTheme);
    saveThemes(themes);

    res.status(201).json(newTheme);
  } catch (error) {
    res.status(500).json({ error: "Failed to create theme" });
  }
});

// ? PUT /api/themes/:id - Update existing theme
router.put("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, teamTerms, phaseText, uiLabels, powerTerms } =
      req.body;

    const themes = loadThemes();
    const themeIndex = themes.findIndex((t) => t.id === id);

    // ! Check if theme exists
    if (themeIndex === -1) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // * Update theme fields
    themes[themeIndex] = {
      ...themes[themeIndex],
      name: name || themes[themeIndex].name,
      description: description || themes[themeIndex].description,
      teamTerms: teamTerms || themes[themeIndex].teamTerms,
      phaseText: phaseText || themes[themeIndex].phaseText,
      uiLabels: uiLabels || themes[themeIndex].uiLabels,
      powerTerms: powerTerms || themes[themeIndex].powerTerms,
      updatedAt: new Date().toISOString(),
    };

    saveThemes(themes);
    res.json(themes[themeIndex]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update theme" });
  }
});

// ? DELETE /api/themes/:id - Delete theme
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const themes = loadThemes();
    const themeIndex = themes.findIndex((t) => t.id === id);

    // ! Check if theme exists
    if (themeIndex === -1) {
      return res.status(404).json({ error: "Theme not found" });
    }

    // * Remove theme and save
    themes.splice(themeIndex, 1);
    saveThemes(themes);

    res.json({ message: "Theme deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete theme" });
  }
});

export default router;
