interface RWApi {
  fetchUnsplash(opts?: any): Promise<any[]>
  fetchReddit(opts?: any): Promise<any[]>
  fetchWallhaven(opts?: any): Promise<any[]>
  fetchGenericJson(opts?: any): Promise<any[]>
  fetchUrlSource(opts?: any): Promise<any[]>
  chooseFolder(): Promise<string | null>
  randomFromFolder(folder: string, count?: number): Promise<string[]>
  setWallpaper(path: string): Promise<boolean>
  downloadAndSet(imageUrl: string): Promise<string>
  settingsGet(ns: string, key: string): Promise<string | null>
  settingsSet(ns: string, key: string, val: any): Promise<boolean>
  autoStartGet(): Promise<boolean>
  autoStartSet(enabled: boolean): Promise<boolean>
  autoStartSilentGet(): Promise<boolean>
  autoStartSilentSet(enabled: boolean): Promise<boolean>
  testUnsplashKey(accessKey: string): Promise<any>
  randomizeNow(): Promise<any>
  schedulerStart(minutes: number): Promise<any>
  schedulerStop(): Promise<any>
  schedulerStatus(): Promise<{ enabled: boolean, minutes: number }>
  historyGet(): Promise<any[]>
  historyApply(id: string): Promise<boolean>
  historyDelete(id: string): Promise<boolean>
  historyClear(): Promise<boolean>
  readFileAsDataUrl(path: string): Promise<string | null>
  themeGet(): Promise<'light' | 'dark' | 'system'>
  themeSet(theme: 'light' | 'dark' | 'system'): Promise<boolean>
  onSystemThemeUpdated(cb: (theme: 'light' | 'dark') => void): () => void
  onThemeUpdated(cb: (theme: 'light' | 'dark' | 'system') => void): () => void
  systemThemeNow(): Promise<'light' | 'dark'>
  autoStartGet(): Promise<boolean>
  autoStartSet(enabled: boolean): Promise<boolean>
  autoStartSilentGet(): Promise<boolean>
  autoStartSilentSet(enabled: boolean): Promise<boolean>
}

declare global {
  interface Window { rw?: RWApi }
}

export {}
