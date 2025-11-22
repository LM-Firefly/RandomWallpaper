import {app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, nativeTheme} from 'electron'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import {setWallpaperFromFile} from './manager/windowsWallpaperManager.js'
import {HistoryController} from './history.js'
import * as SettingsStore from './settings.js'
import {fetchUnsplashRandom} from './adapter/unsplash.js'
import {getRandomFromLocalFolder} from './adapter/localFolder.js'

let mainWindow: BrowserWindow | null = null
const historyController = new HistoryController()
let scheduler: NodeJS.Timeout | null = null
let tray: Tray | null = null
let quittingByTray = false
function _schedulerStart(minutes: number) {
  _schedulerStop()
  // schedule task
  scheduler = setInterval(async () => {
    try {
      const res = await trySourcesForScheduler()
      const item = res.item
      const tmp = await exports.randomizeDownloadAndSet(item)
      try { historyController.saveFileFromPath(tmp, _normalizeToAbsolute(item && (item.image || item.path) || ''), null, res.choice || item?.source) } catch (e) {}
    } catch (err) {
      console.error('Scheduler error', err)
    }
  }, Math.max(1, minutes) * 60 * 1000)
}

async function performRandomize() {
  const { choice, item } = await trySourcesForScheduler()
  if (!item || (!(item.image || item.path))) throw new Error('No image returned from sources')
  const tmp = await exports.randomizeDownloadAndSet(item)
  try { historyController.saveFileFromPath(tmp, _normalizeToAbsolute(item && (item.image || item.path) || ''), null, (choice as string) || item?.source) } catch (err) {}
  return { source: choice, path: tmp }
}

function createTrayIfNeeded() {
  if (tray) return
  try {
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png')
    let img = nativeImage.createFromPath(iconPath)
    if (typeof img.isEmpty === 'function' && img.isEmpty() && process.platform === 'win32') img = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icon.png'))
    tray = new Tray(img)
    const menu = Menu.buildFromTemplate([
      { label: 'Show Window', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } } },
      { label: 'Next Wallpaper', click: async () => { try { await performRandomize(); } catch (err) { console.error('Tray -> next failed', err) } } },
      { type: 'separator' },
      { label: 'Exit', click: () => { quittingByTray = true; app.quit() } },
    ])
    tray.setToolTip('Random Wallpaper')
    tray.setContextMenu(menu)
    tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } })
  } catch (e) {
    console.error('createTrayIfNeeded failed', e)
  }
}

app.on('before-quit', () => { quittingByTray = true })

function _schedulerStop() {
  if (scheduler) {
    clearInterval(scheduler)
    scheduler = null
  }
}

function _normalizeToAbsolute(u: string) {
  if (!u) return u
  if (u.startsWith('//')) return 'https:' + u
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/')) return 'https://wallhaven.cc' + u
  if (/^[^\/:]+\.[^\/:]+/.test(u)) return 'https://' + u
  return u
}



// Try enabled sources sequentially (in randomized order) until one returns a usable image.
async function trySourcesForScheduler(): Promise<{choice: string, item: any}> {
  // prioritize network sources first in this fixed order:
  // wallhaven > unsplash > genericJson > urlSource > reddit > localFolder
  const priority = ['wallhaven', 'unsplash', 'genericJson', 'urlSource', 'reddit', 'localFolder'] as string[]
  const sources: string[] = []
  for (const s of priority) {
    if (s === 'unsplash' && SettingsStore.getBoolean('sources', 'unsplash')) sources.push('unsplash')
    if (s === 'reddit' && SettingsStore.getBoolean('sources', 'reddit')) sources.push('reddit')
    if (s === 'wallhaven' && SettingsStore.getBoolean('sources', 'wallhaven')) sources.push('wallhaven')
    if (s === 'localFolder' && SettingsStore.getBoolean('sources', 'localFolder') && SettingsStore.getString('localFolder', 'folder')) sources.push('localFolder')
    if (s === 'genericJson' && SettingsStore.getBoolean('sources', 'genericJson') && SettingsStore.getString('genericJson', 'request-url')) sources.push('genericJson')
    if (s === 'urlSource' && SettingsStore.getBoolean('sources', 'urlSource') && SettingsStore.getString('urlSource', 'image-url')) sources.push('urlSource')
  }

  if (sources.length === 0) throw new Error('No configured sources for scheduler')

  // do not shuffle — we want a predictable prioritized order

  const errors: string[] = []

  for (const choice of sources) {
    try {
      switch (choice) {
      case 'unsplash': {
        const opts = {
          accessKey: SettingsStore.getString('unsplash', 'access-key') || SettingsStore.getString('unsplash', 'api-key'),
          apiKey: SettingsStore.getString('unsplash', 'api-key') || undefined,
          query: SettingsStore.getString('unsplash', 'query') || undefined,
          // allow count/orientation/content_filter/collections if set in settings
          count: SettingsStore.getInt('unsplash', 'count') || 1,
          orientation: SettingsStore.getString('unsplash', 'orientation') || undefined,
          content_filter: SettingsStore.getString('unsplash', 'content_filter') || undefined,
          collections: SettingsStore.getString('unsplash', 'collections') || undefined,
        }
        const res = await fetchUnsplashRandom(opts)
        if (res && res.length > 0 && res[0].image) return {choice, item: res[0]}
        throw new Error('Unsplash returned no image')
      }
      case 'reddit': {
        const { fetchRedditRandom } = await import('./adapter/reddit.js')
        const opts = {
          subreddits: SettingsStore.getString('reddit', 'subreddits'),
          allowSfw: SettingsStore.getBoolean('reddit', 'allow-sfw'),
          minWidth: SettingsStore.getInt('reddit', 'min-width'),
          minHeight: SettingsStore.getInt('reddit', 'min-height'),
        }
        const res = await fetchRedditRandom(opts)
        if (res && res.length > 0 && res[0].image) return {choice, item: res[0]}
        throw new Error('Reddit returned no image')
      }
      case 'wallhaven': {
        const { fetchWallhavenRandom } = await import('./adapter/wallhaven.js')
        const opts = {
          keywords: SettingsStore.getString('wallhaven', 'keywords'),
          minimalResolution: SettingsStore.getString('wallhaven', 'minimal-resolution'),
          apiKey: SettingsStore.getString('wallhaven', 'api-key'),
          categories: SettingsStore.getString('wallhaven', 'categories'),
          purity: SettingsStore.getString('wallhaven', 'purity'),
          sorting: SettingsStore.getString('wallhaven', 'sorting'),
          topRange: SettingsStore.getString('wallhaven', 'topRange') || undefined,
          apiUrl: SettingsStore.getString('wallhaven', 'api-url') || undefined,
          order: SettingsStore.getString('wallhaven', 'order'),
          seed: SettingsStore.getString('wallhaven', 'seed'),
        }
        const res = await fetchWallhavenRandom(opts)
        if (res && res.length > 0 && res[0].image) return {choice, item: res[0]}
        throw new Error('Wallhaven returned no image')
      }
      case 'localFolder': {
        const dir = SettingsStore.getString('localFolder', 'folder')
        if (!dir) throw new Error('No folder for local folder')
        const { getRandomFromLocalFolder } = await import('./adapter/localFolder.js')
        const paths = await getRandomFromLocalFolder(dir, 1)
        if (paths && paths.length > 0) return {choice, item: { image: paths[0], source: dir }}
        throw new Error('Local folder returned no files')
      }
      case 'genericJson': {
        const { fetchGenericJsonRandom } = await import('./adapter/genericJson.js')
        const opts = {
          requestUrl: SettingsStore.getString('genericJson', 'request-url'),
          imagePath: SettingsStore.getString('genericJson', 'image-path'),
          imagePrefix: SettingsStore.getString('genericJson', 'image-prefix'),
        }
        const res = await fetchGenericJsonRandom(opts)
        if (res && res.length > 0 && res[0].image) return {choice, item: res[0]}
        throw new Error('Generic JSON returned no image')
      }
      case 'urlSource': {
        const { fetchUrlSource } = await import('./adapter/urlSource.js')
        const opts = { imageUrl: SettingsStore.getString('urlSource', 'image-url'), domain: SettingsStore.getString('urlSource', 'domain') }
        const res = await fetchUrlSource(opts)
        if (res && res.length > 0 && res[0].image) return {choice, item: res[0]}
        throw new Error('URL Source returned no image')
      }
      default:
        throw new Error('Unknown choice')
      }
    } catch (err: any) {
      console.warn(`Source ${choice} failed:`, err && err.message ? err.message : err)
      errors.push(`${choice}: ${err && err.message ? err.message : String(err)}`)
      // continue to next source
    }
  }

  throw new Error(`All sources failed: ${errors.join(' | ')}`)
}

async function createWindow() {
  // If application was opened by the OS at login OR autoStart setting is enabled,
  // prefer not to show the main window right away and keep the app minimized to tray.
  let hideOnLaunch = false
  try {
    const info = app.getLoginItemSettings && app.getLoginItemSettings({ path: process.execPath })
    // Treat silent-start as a sub-setting of auto-start: only hide on launch if
    // the app was actually opened by the system at login AND the silent flag is enabled.
    if (info && info.wasOpenedAtLogin) {
      const silent = SettingsStore.getString('autoStart', 'silent') === 'true'
      if (silent) hideOnLaunch = true
    }
  } catch (e) { /* ignore */ }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: !hideOnLaunch,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
  })

  // Load the renderer HTML from this Electron project folder.
  // `__dirname` points to the compiled `dist` folder, so go one level up to reach `electron-windows`.
  try {
    // In development with Vite we prefer to load the dev server URL.
    const devUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || 'http://localhost:5173'
    const rendererIndex = path.join(__dirname, 'renderer', 'index.html')
    // If built renderer exists (production), load the file. Otherwise fall back to Vite dev server URL.
    if (fs.existsSync(rendererIndex)) {
      mainWindow.loadFile(rendererIndex)
    } else {
      await mainWindow.loadURL(devUrl)
    }
  } catch (err) {
    console.error('Failed to load index.html', err)
    mainWindow.loadURL('about:blank')
  }
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.on('close', (e) => {
    if (!quittingByTray) {
      e.preventDefault()
      if (mainWindow) mainWindow.hide()
    }
  })
  // Open DevTools when ELECTRON_DEBUG is set for easier debugging
  if (process.env.ELECTRON_DEBUG)
    mainWindow.webContents.openDevTools()
  // Ensure tray exists so user can reopen the window after close
  createTrayIfNeeded()
  // If we started hidden (at login), ensure window stays hidden and log state
  if (hideOnLaunch) {
    try { if (mainWindow) mainWindow.hide() } catch (_) {}
    console.log('App started at login — keeping window hidden and running in tray')
  }
}

app.on('ready', createWindow)
// Set application menu to only include File and View (remove Edit / Window / Help)
app.on('ready', () => {
  try {
    const template: any[] = [
      { label: 'File', submenu: [ { role: 'quit', label: 'Exit' } ] },
      { label: 'View', submenu: [ { role: 'reload' }, { role: 'toggleDevTools', label: 'Toggle Developer Tools' }, { type: 'separator' }, { role: 'togglefullscreen' } ] },
    ]
    const menu = Menu.buildFromTemplate(template as any)
    Menu.setApplicationMenu(menu)
  } catch (e) {
    console.error('Failed to set application menu', e)
  }
})

ipcMain.handle('system-theme-now', async () => {
  try { return nativeTheme.shouldUseDarkColors ? 'dark' : 'light' } catch (e) { return 'light' }
})
app.on('ready', () => {
  const enabled = SettingsStore.getString('scheduler', 'enabled') === 'true'
  const minutes = Number(SettingsStore.getString('scheduler', 'minutes')) || 60
  if (enabled) {
    _schedulerStart(minutes)
    console.log('Scheduler started from saved settings', minutes)
  }
})
// Apply saved auto-start setting at startup
app.on('ready', () => {
  try {
    const autoStart = SettingsStore.getString('autoStart', 'enabled') === 'true'
    if (process.platform === 'win32' || process.platform === 'darwin' || process.platform === 'linux') {
      try {
        app.setLoginItemSettings({ openAtLogin: autoStart, path: process.execPath })
        console.log('Auto-start applied:', autoStart)
      } catch (e) { console.warn('setLoginItemSettings failed', e) }
    }
  } catch (e) { console.error('auto-start apply failed', e) }
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// Notify renderer when OS/system theme changes
try {
  nativeTheme.on('updated', () => {
    try {
      const state = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('system-theme-updated', state)
    } catch (err) { console.error('system theme update notify failed', err) }
  })
} catch (e) { /* ignore non-supported environments */ }

ipcMain.handle('fetch-unsplash', async (_event, opts) => {
  // Merge stored settings with any explicit options passed by renderer.
  const stored = {
    accessKey: SettingsStore.getString('unsplash', 'access-key') || SettingsStore.getString('unsplash', 'api-key'),
    query: SettingsStore.getString('unsplash', 'query'),
  }
  const options = Object.assign({}, stored, opts || {})
  return fetchUnsplashRandom(options)
})

ipcMain.handle('test-unsplash-key', async (_e, accessKey: string) => {
  if (!accessKey) return { ok: false, error: 'No access key provided' }
  try {
    // Use adapter to test a single request; do not persist key here
    const res = await fetchUnsplashRandom({ accessKey, count: 1 })
    if (res && res.length > 0) return { ok: true, message: 'Success' }
    return { ok: false, error: 'No image returned' }
  } catch (err: any) {
    return { ok: false, error: String(err && err.message ? err.message : err) }
  }
})

ipcMain.handle('fetch-reddit', async (_e, opts) => {
  const options = opts ?? {
    subreddits: SettingsStore.getString('reddit', 'subreddits'),
    allowSfw: SettingsStore.getBoolean('reddit', 'allow-sfw'),
    minWidth: SettingsStore.getInt('reddit', 'min-width'),
    minHeight: SettingsStore.getInt('reddit', 'min-height'),
  }
  const { fetchRedditRandom } = await import('./adapter/reddit.js')
  return fetchRedditRandom(options)
})

ipcMain.handle('fetch-wallhaven', async (_e, opts) => {
  const options = opts ?? {
    keywords: SettingsStore.getString('wallhaven', 'keywords'),
    minimalResolution: SettingsStore.getString('wallhaven', 'minimal-resolution'),
    apiKey: SettingsStore.getString('wallhaven', 'api-key'),
    categories: SettingsStore.getString('wallhaven', 'categories'),
    purity: SettingsStore.getString('wallhaven', 'purity'),
    sorting: SettingsStore.getString('wallhaven', 'sorting'),
    order: SettingsStore.getString('wallhaven', 'order'),
    seed: SettingsStore.getString('wallhaven', 'seed'),
  }
  const { fetchWallhavenRandom } = await import('./adapter/wallhaven.js')
  return fetchWallhavenRandom(options)
})

ipcMain.handle('fetch-genericJson', async (_e, opts) => {
  const { fetchGenericJsonRandom } = await import('./adapter/genericJson.js')
  const options = opts ?? {}
  return fetchGenericJsonRandom(options)
})

ipcMain.handle('fetch-urlSource', async (_e, opts) => {
  const { fetchUrlSource } = await import('./adapter/urlSource.js')
  const options = opts ?? {}
  return fetchUrlSource(options)
})

ipcMain.handle('randomize-now', async () => {
  return performRandomize()
})

// helper for randomize to reuse download function
exports.randomizeDownloadAndSet = async function (imageOrItem: any) {
  // Accept either a string URL/path or an adapter item object { image, path, source }
  let imageUrl = ''
  if (!imageOrItem) throw new Error('No image URL or path provided')
  let preferredName: string | undefined
  if (typeof imageOrItem === 'string') imageUrl = imageOrItem
  else if (typeof imageOrItem === 'object') {
    imageUrl = imageOrItem.image || imageOrItem.path || ''
    // adapter-provided name/id (prefer explicit name, fallback to id)
    preferredName = imageOrItem.name || imageOrItem.id || undefined
  }
  if (!imageUrl) throw new Error('No image URL or path provided')

  // If it's an absolute filesystem path (Windows drive or POSIX) use it directly
  if (path.isAbsolute(imageUrl) && fs.existsSync(imageUrl)) {
    await setWallpaperFromFile(imageUrl)
    return imageUrl
  }

  // If it's a file:// URL, use local file path
  try {
    const parsed = new URL(imageUrl)
    if (parsed.protocol === 'file:') {
      let local = parsed.pathname
      if (process.platform === 'win32' && local.startsWith('/')) local = local.slice(1)
      if (!fs.existsSync(local)) throw new Error('Local file not found: ' + local)
      await setWallpaperFromFile(local)
      return local
    }
    // If absolute http/https URL, continue to download flow below
  } catch (_) {
    // Not a parseable URL — maybe an absolute filesystem path or scheme-less host
    // If it's an absolute filesystem path, use it directly
    if (path.isAbsolute(imageUrl) && fs.existsSync(imageUrl)) {
      await setWallpaperFromFile(imageUrl)
      return imageUrl
    }
  }

  // Normalize protocol-relative URLs (//host/path) to https
  if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl

  // Normalize host-only paths like w.wallhaven.cc/... — prefix https:// if no scheme
  if (!imageUrl.match(/^https?:\/\//i) && imageUrl.match(/^[^\/:]+\.[^\/:]+/)) {
    imageUrl = 'https://' + imageUrl
  }

  const tmp = await downloadFileToTemp(imageUrl, preferredName)
  await setWallpaperFromFile(tmp)
  return tmp
}

async function downloadFileToTemp(imageUrl: string, preferredName?: string): Promise<string> {
  const makeTmpName = (name: string | undefined, ext: string) => {
    try {
      if (name) {
        // sanitize: keep letters, digits, -, _ and replace others with '-'
        let safe = String(name).replace(/[^a-zA-Z0-9-_\.]/g, '-')
        // strip any leading '.' or '/' segments
        safe = safe.replace(/^\.+/, '')
        if (safe.length > 150) safe = safe.slice(0, 150)
        // prefer using the id/name as filename; if it exists, append a timestamp
        const candidate = path.join(tempBase, `${safe}${ext}`)
        try { if (!fs.existsSync(candidate)) return candidate } catch (_) {}
        return path.join(tempBase, `${safe}-${Date.now()}${ext}`)
      }
    } catch (_) {}
    return path.join(tempBase, `randomwallpaper-${Date.now()}${ext}`)
  }
  async function tryFetch(url: string, headers?: any) {
    // normalize URL so node-fetch always gets an absolute URL
    const normalize = (u: string) => {
      if (!u) throw new Error('Empty url')
      if (u.startsWith('//')) return 'https:' + u
      if (/^https?:\/\//i.test(u)) return u
      // relative path like /w/abc -> assume wallhaven page
      if (u.startsWith('/')) return 'https://wallhaven.cc' + u
      // host-only or host+path (no scheme), prefix https
      if (/^[^\/:]+\.[^\/:]+/.test(u)) return 'https://' + u
      return u
    }
    const finalUrl = normalize(url)
    // ensure we only call node-fetch with http(s) absolute URLs
    if (!/^https?:\/\//i.test(finalUrl)) {
      throw new Error(`Unsupported URL for fetch: ${String(finalUrl)} (original: ${String(url)})`)
    }
    return fetch(finalUrl, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Accept': 'image/*', ...(headers ?? {}) } })
  }

  // pick base temp directory: if user enabled saving downloads to local folder, prefer that
  const userLocalFolder = SettingsStore.getString('localFolder', 'folder') || ''
  const saveToLocal = (SettingsStore.getString('localFolder', 'use-as-temp') || '') === 'true'
  const ensureTempBase = (pref: string) => {
    try {
      if (pref && fs.existsSync(pref) && fs.statSync(pref).isDirectory()) return pref
    } catch (_) {}
    return app.getPath('temp')
  }
  // If running in portable mode (./data present) prefer a local tmp directory
  const dataBase = (SettingsStore.getDataBaseDir && typeof SettingsStore.getDataBaseDir === 'function') ? SettingsStore.getDataBaseDir() : app.getPath('userData')
  let tempBase = app.getPath('temp')
  if (saveToLocal) tempBase = ensureTempBase(userLocalFolder)
  else {
    try {
      // if data base is not the OS userData then we are portable — use data/tmp
      if (dataBase && dataBase !== app.getPath('userData')) {
        const candidate = path.join(dataBase, 'tmp')
        try { fs.mkdirSync(candidate, { recursive: true }) } catch (e) {}
        tempBase = candidate
      }
    } catch (_) { tempBase = app.getPath('temp') }
  }

  // handle data: URIs (base64 inline images)
  if (imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(',')
    if (parts.length < 2) throw new Error('Invalid data URI')
    const mime = parts[0].split(':')[1].split(';')[0]
    const buf = Buffer.from(parts[1], 'base64')
    const ext = mime && mime.includes('/') ? '.' + mime.split('/')[1] : '.jpg'
    const tmp = makeTmpName(preferredName, ext)
    fs.writeFileSync(tmp, buf)
    return tmp
  }

  // try basic fetch
  let r = await tryFetch(imageUrl)
  if (!r.ok) {
    // trying adding a Referer header; be defensive when imageUrl is not an absolute URL
    let referer = null
    try {
      referer = new URL(imageUrl).origin
    } catch (_) {
      // try to infer referer from normalized url via tryFetch's normalize logic
      try {
        const testNormalized = (() => {
          if (imageUrl.startsWith('//')) return 'https:' + imageUrl
          if (/^https?:\/\//i.test(imageUrl)) return imageUrl
          if (imageUrl.startsWith('/')) return 'https://wallhaven.cc' + imageUrl
          if (/^[^\/:]+\.[^\/:]+/.test(imageUrl)) return 'https://' + imageUrl
          return null
        })()
        if (testNormalized) referer = new URL(testNormalized).origin
      } catch (_) { referer = null }
    }
    if (referer) r = await tryFetch(imageUrl, { Referer: referer })
  }

  // try to derive file extension from the URL path when possible
  let guessedExt = '.jpg'
  try {
    const guessUrl = (() => {
      if (!imageUrl) return ''
      if (imageUrl.startsWith('//')) return 'https:' + imageUrl
      if (/^https?:\/\//i.test(imageUrl)) return imageUrl
      if (imageUrl.startsWith('/')) return 'https://wallhaven.cc' + imageUrl
      if (/^[^\/ :]+\.[^\/ :]+/.test(imageUrl)) return 'https://' + imageUrl
      return ''
    })()
    if (guessUrl) {
      const p = new URL(guessUrl).pathname
      const e = path.extname(p)
      if (e) guessedExt = e
    }
  } catch (_) { guessedExt = '.jpg' }
  const tmp = makeTmpName(preferredName, guessedExt)

  // if fetch succeeded, stream it to tmp
  if (r.ok) {
    const dest = fs.createWriteStream(tmp)
    await new Promise<void>((resolve, reject) => {
      if (!r.body) return reject(new Error('No response body'))
      r.body.pipe(dest)
      r.body.on('error', reject)
      dest.on('finish', resolve)
      dest.on('error', reject)
    })
    return tmp
  }

  // fallback: try native http(s) request with headers
  try {
    await new Promise<void>((resolve, reject) => {
      const proto = imageUrl.startsWith('https') ? require('https') : require('http')
      const req = proto.get(imageUrl, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Accept': 'image/*' } }, (res: any) => {
        if (res.statusCode && res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}`))
        const file = fs.createWriteStream(tmp)
        res.pipe(file)
        res.on('end', () => file.close(() => resolve()))
        res.on('error', reject)
      })
      req.on('error', reject)
    })
    return tmp
  } catch (err) {
    // last resort: on Windows try PowerShell and return path
    if (process.platform === 'win32') {
      const child = await import('child_process')
      // prefer using curl on modern Windows which is more reliable; then fall back to PowerShell
      const tryCurl = () => new Promise<void>((resolve, reject) => {
        child.execFile('curl', ['-L', '-o', tmp, imageUrl], (err, stdout, stderr) => {
          if (err) return reject(new Error(`curl failed: ${String(stderr || err.message)}`))
          resolve()
        })
      })

      try {
        await tryCurl()
      } catch (curlErr) {
        // escape single quotes in URL and path for powershell
        const urlEscaped = imageUrl.replace(/'/g, "''")
        const tmpEscaped = tmp.replace(/'/g, "''")
        const cmd = `powershell -Command "try { Invoke-WebRequest -Uri '${urlEscaped}' -OutFile '${tmpEscaped}' -UseBasicParsing } catch { exit 1 }"`
        await new Promise<void>((resolve, reject) => {
          child.exec(cmd, (e, _stdout, stderr) => { if (e) reject(new Error(`PowerShell download failed: ${String(stderr || e.message)}`)); else resolve() })
        })
      }
      return tmp
    }

    throw new Error(`Download failed: ${String(err)}`)
  }
}

ipcMain.handle('settings-get', (_e, ns: string, key: string) => {
  return SettingsStore.getString(ns, key)
})

ipcMain.handle('settings-set', (_e, ns: string, key: string, val: any) => {
  SettingsStore.setValue(ns, key, val)
  return true
})

// Appearance / theme handlers: persist and optionally influence native themeSource
ipcMain.handle('theme-get', async () => {
  const t = SettingsStore.getString('appearance', 'theme') || 'light'
  return t
})

ipcMain.handle('theme-set', async (_e, theme: string) => {
  try {
    if (!theme) theme = 'light'
    if (!['light', 'dark', 'system'].includes(String(theme))) theme = 'light'
    SettingsStore.setValue('appearance', 'theme', String(theme))
    try {
      // set native themeSource so native UI may follow the preference
      // allowed values: 'system' | 'light' | 'dark'
      ;(nativeTheme as any).themeSource = theme
    } catch (e) { /* ignore if not supported */ }
    // broadcast to renderer(s)
    try { if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('theme-updated', theme) } catch (_) {}
    return true
  } catch (err) { return false }
})

ipcMain.handle('auto-start-get', async () => {
  return SettingsStore.getString('autoStart', 'enabled') === 'true'
})

ipcMain.handle('auto-start-set', async (_e, enabled: boolean) => {
  try {
    SettingsStore.setValue('autoStart', 'enabled', enabled ? 'true' : 'false')
    try {
      app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath })
    } catch (e) { console.warn('setLoginItemSettings failed', e) }
    return true
  } catch (err) { return false }
})

ipcMain.handle('auto-start-silent-get', async () => {
  return SettingsStore.getString('autoStart', 'silent') === 'true'
})

ipcMain.handle('auto-start-silent-set', async (_e, enabled: boolean) => {
  try {
    SettingsStore.setValue('autoStart', 'silent', enabled ? 'true' : 'false')
    return true
  } catch (err) { return false }
})

ipcMain.handle('scheduler-start', async (_e, minutes: number) => {
  SettingsStore.setValue('scheduler', 'enabled', 'true')
  SettingsStore.setValue('scheduler', 'minutes', String(minutes))
  _schedulerStart(minutes)
  return true
})

ipcMain.handle('scheduler-stop', async () => {
  SettingsStore.setValue('scheduler', 'enabled', 'false')
  _schedulerStop()
  return true
})

ipcMain.handle('scheduler-status', async () => {
  return {
    enabled: SettingsStore.getString('scheduler', 'enabled') === 'true',
    minutes: Number(SettingsStore.getString('scheduler', 'minutes')) || 60,
  }
})

ipcMain.handle('choose-folder', async () => {
  const result: any = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('random-from-folder', async (_e, folder, count) => {
  if (!folder) return []
  return getRandomFromLocalFolder(folder, count || 1)
})

ipcMain.handle('set-wallpaper', async (_e, filePath) => {
  // copy to persistent history folder and then set
  try {
    historyController.saveFileFromPath(filePath, filePath, null, 'Local')
  } catch (err) {
    // ignore saving failure and continue
  }
  await setWallpaperFromFile(filePath)
  return true
})

ipcMain.handle('history-get', async (_e) => {
  return historyController.getAll()
})

ipcMain.handle('history-apply', async (_e, id: string) => {
  const entry = historyController.get(id)
  if (!entry) throw new Error('History entry not found')
  await setWallpaperFromFile(entry.path)
  historyController.promoteToActive(id)
  return true
})

ipcMain.handle('history-delete', async (_e, id: string) => {
  return historyController.remove(id)
})

ipcMain.handle('history-clear', async (_e) => {
  historyController.clear()
  return true
})

ipcMain.handle('read-file-data-url', async (_e, filePath: string) => {
  if (!filePath) return null
  // Accept file:// URLs and plain paths
  let local = filePath
  try {
    const u = new URL(filePath)
    if (u.protocol === 'file:') {
      // decode percent-encodings like %20 for spaces
      local = decodeURIComponent(u.pathname)
      if (process.platform === 'win32' && local.startsWith('/')) local = local.slice(1)
    }
  } catch (_) {
    // not a url — leave as-is
  }
  try {
    if (!fs.existsSync(local)) return null
    const buf = fs.readFileSync(local)
    const ext = path.extname(local).toLowerCase().replace('.', '')
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }[ext] || 'application/octet-stream'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch (e) {
    return null
  }
})

ipcMain.handle('download-and-set', async (_e, imageUrl: string) => {
  // download image, write to temp and set wallpaper
  async function tryFetchWithHeaders(url: string) {
    return fetch(url, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Accept': 'image/*' } })
  }

  const tmp = await downloadFileToTemp(imageUrl)
  // save to history and set
  const entry = historyController.saveFileFromPath(tmp, imageUrl, null, 'Downloaded')
  await setWallpaperFromFile(entry.path)
  return entry.path
})
