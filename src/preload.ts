import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('rw', {
  fetchUnsplash: (opts?: any) => ipcRenderer.invoke('fetch-unsplash', opts),
  fetchReddit: (opts?: any) => ipcRenderer.invoke('fetch-reddit', opts),
  fetchWallhaven: (opts?: any) => ipcRenderer.invoke('fetch-wallhaven', opts),
  fetchGenericJson: (opts?: any) => ipcRenderer.invoke('fetch-genericJson', opts),
  fetchUrlSource: (opts?: any) => ipcRenderer.invoke('fetch-urlSource', opts),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  randomFromFolder: (folder: string, count?: number) => ipcRenderer.invoke('random-from-folder', folder, count),
  setWallpaper: (path: string) => ipcRenderer.invoke('set-wallpaper', path),
  downloadAndSet: (imageUrl: string) => ipcRenderer.invoke('download-and-set', imageUrl),
  settingsGet: (ns: string, key: string) => ipcRenderer.invoke('settings-get', ns, key),
  settingsSet: (ns: string, key: string, val: any) => ipcRenderer.invoke('settings-set', ns, key, val),
  themeGet: () => ipcRenderer.invoke('theme-get'),
  themeSet: (theme: string) => ipcRenderer.invoke('theme-set', theme),
  onSystemThemeUpdated: (cb: (theme: string) => void) => {
    const listener = (_e: any, theme: string) => { try { cb(theme) } catch (_) {} }
    ipcRenderer.on('system-theme-updated', listener)
    return () => ipcRenderer.removeListener('system-theme-updated', listener)
  },
  onThemeUpdated: (cb: (theme: string) => void) => {
    const listener = (_e: any, theme: string) => { try { cb(theme) } catch (_) {} }
    ipcRenderer.on('theme-updated', listener)
    return () => ipcRenderer.removeListener('theme-updated', listener)
  },
  systemThemeNow: () => ipcRenderer.invoke('system-theme-now'),
  autoStartGet: () => ipcRenderer.invoke('auto-start-get'),
  autoStartSet: (enabled: boolean) => ipcRenderer.invoke('auto-start-set', enabled),
  autoStartSilentGet: () => ipcRenderer.invoke('auto-start-silent-get'),
  autoStartSilentSet: (enabled: boolean) => ipcRenderer.invoke('auto-start-silent-set', enabled),
  testUnsplashKey: (accessKey: string) => ipcRenderer.invoke('test-unsplash-key', accessKey),
  randomizeNow: () => ipcRenderer.invoke('randomize-now'),
  schedulerStart: (minutes: number) => ipcRenderer.invoke('scheduler-start', minutes),
  schedulerStop: () => ipcRenderer.invoke('scheduler-stop'),
  schedulerStatus: () => ipcRenderer.invoke('scheduler-status'),
  historyGet: () => ipcRenderer.invoke('history-get'),
  historyApply: (id: string) => ipcRenderer.invoke('history-apply', id),
  historyDelete: (id: string) => ipcRenderer.invoke('history-delete', id),
  historyClear: () => ipcRenderer.invoke('history-clear'),
  readFileAsDataUrl: (filePath: string) => ipcRenderer.invoke('read-file-data-url', filePath),
})
