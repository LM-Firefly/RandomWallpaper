import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// Determine base directory for persistent app data. Prefer a local './data' folder
// (portable mode) when the app is running from a portable location. Fall back
// to the OS userData path when no './data' directory exists.
function getPortableBase(): string | null {
  try {
    // When packaged, process.execPath points to the exe's location — prefer that.
    const execDir = path.dirname(process.execPath || '')
    const candidateExec = path.join(execDir, 'data')
    if (candidateExec && fs.existsSync(candidateExec) && fs.statSync(candidateExec).isDirectory()) return candidateExec

    // When running in dev mode or other contexts, check current working dir
    const cwdCandidate = path.join(process.cwd(), 'data')
    if (cwdCandidate && fs.existsSync(cwdCandidate) && fs.statSync(cwdCandidate).isDirectory()) return cwdCandidate

    // lastly, app.getAppPath() may point inside the app bundle; try its parent
    const appPath = app.getAppPath && String(app.getAppPath())
    if (appPath) {
      const parentCandidate = path.join(path.dirname(appPath), 'data')
      if (fs.existsSync(parentCandidate) && fs.statSync(parentCandidate).isDirectory()) return parentCandidate
    }
  } catch (e) {}
  return null
}

function getDataBaseDir(): string {
  const portable = getPortableBase()
  const base = portable || app.getPath('userData')
  try { fs.mkdirSync(base, { recursive: true }) } catch (e) {}
  return base
}

const settingsFile = path.join(getDataBaseDir(), 'rw-settings.json')

let store: any = {}
try {
  if (fs.existsSync(settingsFile))
    store = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'))
} catch (err) {
  store = {}
}

function getNamespace(ns: string) {
  if (!store[ns]) store[ns] = {}
  return store[ns]
}

export function getString(ns: string, key: string): string {
  const nsObj = getNamespace(ns)
  return nsObj[key] ?? ''
}

export function getBoolean(ns: string, key: string): boolean {
  const nsObj = getNamespace(ns)
  return !!nsObj[key]
}

export function getInt(ns: string, key: string): number {
  const nsObj = getNamespace(ns)
  return parseInt(nsObj[key]) || 0
}

export function setValue(ns: string, key: string, val: any): void {
  const nsObj = getNamespace(ns)
  nsObj[key] = val
  fs.writeFileSync(settingsFile, JSON.stringify(store, null, 2), 'utf-8')
}

export function getAllSettings() {
  return store
}

export { getDataBaseDir }
