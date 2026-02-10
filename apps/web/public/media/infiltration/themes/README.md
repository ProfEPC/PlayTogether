# Infiltration Themes

Themes completely customize the visual and audio appearance of the Infiltration game, allowing players to experience the same game mechanics with different aesthetics.

## Available Themes

- **Alien** - Sci-fi UFO/extraterrestrial theme with futuristic aesthetics
- **Fairy Tale** - Fantasy, magical, whimsical storybook theme
- **Noir** - Classic film noir, detective mystery, high-contrast black & white theme

## Theme Structure

Each theme is completely self-contained with its own assets:

### Images

- `images/roles/` - Themed character artwork and role visuals
- `images/phases/` - Phase-specific backgrounds and graphics (lobby, reveal, mayhem, voting, results)
- `images/ui/` - Themed UI components (buttons, icons, frames, status displays)

### Audio

- `audio/sfx/` - Sound effects organized by action, all themed to match the game's atmosphere
  - Game lifecycle (start, close)
  - Phase transitions (reveal, mayhem, voting, results)
  - Player actions (vote, power activation, elimination)
  - Role reveals (infiltrator, civilian, special)
  - Error states (invalid action, timeout)

## For Asset Creators

Each theme folder contains README files explaining:

- What assets are needed
- The visual/audio style for that theme
- Specific context for different asset types

Load theme assets dynamically: `media/infiltration/themes/[theme-name]/[asset-type]/...`
