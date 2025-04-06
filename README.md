# Reinvented Tetris Game

A modern, accessible take on the classic Tetris game, featuring enhanced gameplay mechanics, power-ups, accessibility options, and an AI assistant.

## Features

- **Multiple Game Modes**: Classic, Zen (no fail), Challenge (timed rows), and Hardcore
- **Customizable Themes**: Retro, Neon, Nature, and Sci-Fi aesthetics
- **Accessibility Options**: 
  - Color blindness modes
  - High contrast mode
  - Reduced motion settings
  - Screen reader support
  - Customizable controls
- **Enhanced Gameplay**:
  - Power-ups (Slow Time, Clear Row, Swap Piece)
  - Hold piece functionality
  - Next piece preview (3 pieces)
  - Ghost piece for targeting
  - Combo multipliers
  - Wall kick for rotations
- **Claude AI Integration**:
  - Gameplay tips
  - Encouragement messages
  - Post-game feedback
  - Adaptive assistance
- **Mobile Friendly**:
  - Responsive design
  - Touch controls
  - Swipe gestures
- **Leaderboards**:
  - Local high score tracking
  - Separate leaderboards for each difficulty

## How to Play

### Controls

#### Keyboard Controls
- **Arrow Left/Right**: Move piece horizontally
- **Arrow Down**: Soft drop
- **Z**: Rotate counter-clockwise
- **X**: Rotate clockwise
- **Space**: Hard drop
- **C**: Hold piece
- **P**: Pause/Resume
- **R**: Restart
- **M**: Mute/Unmute
- **1/2/3**: Activate power-ups

#### Mobile Controls
- **Tap game area**: On-screen controls appear
- **Swipe left/right**: Move piece horizontally
- **Swipe down**: Soft drop
- **Swipe up/tap**: Rotate
- **Double-tap**: Hard drop

### Power-ups

- **Slow Time**: Reduces the falling speed for 15 seconds
- **Clear Row**: Instantly clears the bottom-most row with blocks
- **Swap Piece**: Exchanges your current piece for a random new one

## Scoring

- **Single line**: 100 × level
- **Double line**: 300 × level
- **Triple line**: 500 × level
- **Tetris (4 lines)**: 800 × level
- **Soft drop**: 1 point per cell dropped
- **Hard drop**: 2 points per cell dropped
- **Combo multiplier**: Increases with consecutive line clears

## Development

This game is built using vanilla HTML, CSS, and JavaScript with no external dependencies, making it easy to run in any modern browser.

### Project Structure

- `index.html`: Main game HTML structure
- `style.css`: Styling and themes
- `script.js`: Game logic and functionality
- `assets/`: Directory containing audio and images

### Deployment

The game can be easily deployed on GitHub Pages or any web server.

## Accessibility

This game was built with accessibility in mind, following WCAG guidelines:

- Keyboard navigable
- Screen reader support with ARIA attributes
- High contrast mode
- Reduced motion options
- Color blindness accommodations
- Customizable audio levels

## License

This project is open source. Feel free to use, modify, and distribute it.

## Credits

- Made with the assistance of Claude 3.7 AI
- Sound effects and placeholder music tracks licensed for free use
- Special thanks to the original Tetris game by Alexey Pajitnov 