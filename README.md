# RandomWallpaper — Windows (Electron)

This is an experimental Electron adaptation of the GNOME RandomWallpaper extension for Windows.

How to run (development):

1. Install dependencies: `npm install`
2. Start dev mode (Vite renderer + tsc watcher + Electron):

```bash
npm run dev
```

Production build:

```bash
npm run build      # builds renderer (vite) and main (tsc)
npm run start
```

Notes:
- This copies selected functionality (Unsplash fetch and local-folder random pick) and uses the `wallpaper` npm library for setting the Windows wallpaper.
 - This copies selected functionality (Unsplash, Reddit, Wallhaven, and local-folder random pick) and uses the `wallpaper` npm library for setting the Windows wallpaper.
 - Each source has a minimal settings panel in the UI where you can store keys/parameters.
 - Each source has a minimal settings panel in the UI where you can store keys/parameters.
 - Use the 'Enabled Sources' toggles to pick which sources `Randomize Now` can use.
 - The `Randomize Now` button chooses a random enabled source, downloads one image and sets it as Windows wallpaper.
- The UI now includes a **History** view where you can preview, re-apply or delete previous wallpapers.
 - You can enable **Auto-change Wallpaper**: set an interval in minutes and click Start. Scheduler persists after restart.
- Do not modify the original GNOME extension in this repository; this folder is independent and intended to be exported to a separate repository.
