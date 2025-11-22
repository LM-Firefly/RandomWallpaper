import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const settingsFile = path.join(app.getPath('userData'), 'rw-settings.json')

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
