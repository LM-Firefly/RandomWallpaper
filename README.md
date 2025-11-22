# RandomWallpaper — Windows (Electron)

 Windows-specific wallpaper manager and scheduler

Portable usage
---------------

Place a directory named `data` next to the application executable (or in the project root during development). When a `data` folder exists the app will treat it as the persistent data base for settings, history, wallpapers and a local `tmp` folder for downloads — enabling a portable, self-contained install.

Build a Windows portable ZIP
---------------------------

Run these commands on Windows (after installing dependencies) to produce a portable package in `dist_electron`:

```bash
npm install
npm run package:portable
```

The `package:portable` script uses electron-builder and will create a single portable EXE/zip under `dist_electron` which contains the application binary. If you place a `data` folder next to the executable (or inside the zip before extracting), the app will use it as the persistent storage root.

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
