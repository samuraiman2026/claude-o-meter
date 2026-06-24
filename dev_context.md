# Claude-o-Meter (Claude Usage Vat)

## Project Overview
Claude-o-Meter is an Electron-based desktop widget that tracks and visualizes Anthropic's Claude Code CLI usage limits. It displays a "vat" filling with water, submerging a superhero graphic proportional to the user's current session usage limit. 

## Architecture
The application consists of three main components:

1. **Electron Wrapper (`main.js`)**: 
   - Acts as the entry point for the desktop application.
   - Spawns a frameless, transparent window positioned on the right side of the primary display.
   - Sets up a system tray icon for hiding/showing the widget and quitting the application.
   - Automatically runs the Express API server in the background.

2. **Express API Server (`server.js`)**:
   - Runs locally on port 3000.
   - Exposes a single endpoint: `GET /api/usage`.
   - **How it works**: It executes the shell command `echo "/usage" | claude -p` using `child_process.exec` to get the latest usage stats. It then strips out ANSI escape codes and uses regular expressions to extract key usage metrics: `sessionUsage`, `sessionReset`, `weekUsage`, and `weekReset`. It returns these metrics as a JSON response.

3. **Frontend Widget (`public/`)**:
   - **`index.html`**: The semantic structure of the widget, containing the header (usage text and reset time), the vat (superhero image, dynamic water container, bubbles), and the manual override controls.
   - **`style.css`**: Provides the styling and animations. Notable features include CSS-based wave animations, a transparent glass aesthetic (`backdrop-filter`), and dynamic sizing to ensure the superhero fits appropriately inside the vat.
   - **`script.js`**: The frontend logic. It immediately fetches data from `/api/usage` and polls every 15 minutes. It dynamically adjusts the `.water` element's height based on `sessionUsage` (mapping 0-100% to a visual 10-95% water height). It also handles desktop notifications if usage crosses 50%, 75%, and 90% thresholds. A manual slider allows users to override and test the water level visually.

## Key Files
- `main.js`: Electron app configuration and window management.
- `server.js`: Node.js backend parsing the Claude CLI output.
- `public/index.html`: UI structure.
- `public/style.css`: UI styling, positioning, and CSS animations.
- `public/script.js`: Polling, UI updates, and notifications.

## Recent Updates
- Shifted the primary tracking metric from **Weekly** usage/reset to **Session** usage/reset, as session limits are a more frequent bottleneck.
- Refactored the UI to move text overlays (percentage and reset time) out of the vat and into a clean header, increasing the superhero image's size so water levels map correctly to the character's height.
