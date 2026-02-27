/**
 * Color theme constants for PlayTogether UI
 * All colors are centralized here for easy theme switching
 */

export const COLORS = {
  // Primary UI colors
  primary: "#036",
  primaryText: "#fff",
  primaryLight: "#0c4e6e",

  // Text colors
  text: "#000",
  textDark: "#000000",
  textLight: "#888",
  textSecondary: "#721c24",
  textMuted: "rgba(0, 0, 0, 0.7)",

  // Background colors
  background: "#fff",
  backgroundLight: "#ffffff",
  backgroundSecondary: "#eee",
  backgroundNeutral: "#f8f9fa",

  // Border colors
  border: "#ccc",
  borderLight: "#b3d9e8",

  // Status colors
  success: "#d4edda",
  warning: "#fff3cd",
  error: "#f8d7da",
  errorBorder: "#f5c6cb",
  errorText: "#721c24",

  // Info/Reveal colors
  info: "#e8f4f8",
  infoBorder: "#b3d9e8",
  infoText: "#0c4e6e",

  // Action colors
  actionDanger: "#ff6b6b",
  actionDangerText: "#fff",

  // Opacity variants
  opacity: (value: number) => `rgba(0, 0, 0, ${value})`,
};

// Re-export as a theme object for easier switching
export const THEME = {
  ...COLORS,
};
