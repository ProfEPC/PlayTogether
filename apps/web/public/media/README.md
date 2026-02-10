# PlayTogether Media Assets

This directory contains all media assets (images, audio, music, etc.) organized by game, theme, and context. This structure allows artists and musicians to easily contribute themed and contextual content.

## Directory Structure

- **infiltration/** - Infiltration game assets (organized by theme: alien, fairy-tale, noir)
- **oddOneOut/** - Odd One Out game assets
- **shared/** - Common assets used across all games and pages
- **pages/** - Assets specific to individual pages (character creation, admin, etc.)

## For Asset Contributors

### File Organization Principles

1. **Keep file sizes reasonable** - Compress images (WebP/PNG) and audio (MP3/OGG)
2. **Use descriptive filenames** - Examples: `role_infiltrator_portrait.png`, `phase_reveal_alarm.mp3`
3. **Organize by context** - Group related assets together (roles, phases, UI, etc.)
4. **Follow the README** - Each folder contains a README explaining what assets belong there

### Contributing to Infiltration Themes

Infiltration has three complete themes. Each theme is self-contained:

```
infiltration/themes/[theme-name]/
  ├── images/
  │   ├── roles/        (character artwork)
  │   ├── phases/       (phase backgrounds)
  │   └── ui/           (buttons, icons, UI elements)
  └── audio/
      └── sfx/
          ├── game-start/
          ├── phase-reveal/
          ├── player-vote/
          └── ... (15 action categories total)
```

Navigate to your theme's folder and check the README files for specific guidance.

### Contributing to Odd One Out

Upload images and audio to the appropriate folders:

```
oddOneOut/
  ├── images/
  │   ├── phases/       (lobby, questions, results)
  │   └── ui/           (buttons, answer choices, icons)
  └── audio/
      ├── music/        (background tracks)
      └── sfx/          (sound effects by action)
```

### Contributing Shared Assets

Use the shared folder for common assets used across multiple games:

```
shared/
  ├── images/
  │   ├── ui/           (generic buttons, icons)
  │   └── backgrounds/  (general backgrounds)
  └── audio/
      ├── music/        (ambient, lobby music)
      └── sfx/          (UI interactions, notifications)
```

## Asset Specifications

- **Image formats**: PNG (with transparency), WebP (optimized)
- **Audio formats**: MP3 (compatibility), OGG (quality), WAV (lossless)
- **Recommended compression**: Images <500KB, Audio <5MB per track
- **Color profiles**: Use sRGB for web compatibility

## Questions?

Check the README files in each folder for detailed guidance on:

- What assets are needed
- Specific themes and aesthetics
- Context and usage for different asset types
