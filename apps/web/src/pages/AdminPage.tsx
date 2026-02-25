import { useState } from "react";
import CharacterCreation from "./CharacterCreation";
import ThemesAdmin from "../components/ThemesAdmin";
import "./AdminPage.css";

// ! Tab enum for type-safe tab switching
type AdminTab = "characters" | "themes";

export default function AdminPage() {
  // * Active tab state management
  const [activeTab, setActiveTab] = useState<AdminTab>("characters");

  return (
    <div className="admin-page">
      {/* ! Tab navigation bar */}
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "characters" ? "active" : ""}`}
          onClick={() => setActiveTab("characters")}
        >
          Characters
        </button>
        <button
          className={`tab-button ${activeTab === "themes" ? "active" : ""}`}
          onClick={() => setActiveTab("themes")}
        >
          Themes
        </button>
      </div>

      {/* * Tab content */}
      <div className="admin-content">
        {activeTab === "characters" && <CharacterCreation />}
        {activeTab === "themes" && <ThemesAdmin />}
      </div>
    </div>
  );
}
