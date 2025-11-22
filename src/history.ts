import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import * as Settings from './settings.js'
import { getDataBaseDir } from './settings.js'

interface SourceInfo {
  author?: string | null
  authorUrl?: string | null
  source?: string | null
  sourceUrl?: string | null
  imageDownloadUrl: string
  imageLinkUrl?: string | null
}

class HistoryEntry {
  timestamp: number
  id: string
  name: string | null
  path: string
  source: SourceInfo

  constructor(author: string | null, source: string | null, url: string, savedPath: string) {
    this.timestamp = new Date().getTime()
    this.id = `${this.timestamp}_${path.basename(savedPath)}`
    this.name = path.basename(savedPath)
    this.path = savedPath
    this.source = {
      author,
      authorUrl: null,
      source,
      sourceUrl: null,
      imageDownloadUrl: url,
      imageLinkUrl: null,
    }
  }
}

class HistoryController {
  history: HistoryEntry[] = []
  size = 50
  private _historyFile: string
  private _dir: string

  constructor(dir?: string) {
    const base = dir ?? path.join(getDataBaseDir(), 'wallpapers')
    this._dir = base
    this._historyFile = path.join(getDataBaseDir(), 'history.json')

    try { fs.mkdirSync(this._dir, { recursive: true }) } catch (e) {}

    this.load()
  }

  insert(entries: HistoryEntry[]) {
    for (const e of entries) this.history.unshift(e)
    this._deleteOld()
    this.save()
  }

  getAll(): HistoryEntry[] { return this.history }

  get(id: string): HistoryEntry | null {
    return this.history.find(h => h.id === id) ?? null
  }

  promoteToActive(id: string): boolean {
    const element = this.get(id)
    if (!element) return false
    element.timestamp = Date.now()
    this.history.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    this.save()
    return true
  }

  remove(id: string) {
    const idx = this.history.findIndex(h => h.id === id)
    if (idx !== -1) {
      const [removed] = this.history.splice(idx, 1)
      try { fs.unlinkSync(removed.path) } catch (e) {}
      this.save()
      return true
    }
    return false
  }

  clear() {
    for (const elem of this.history) {
      try { fs.unlinkSync(elem.path) } catch (e) {}
    }
    this.history = []
    this.save()
  }

  save() {
    fs.writeFileSync(this._historyFile, JSON.stringify(this.history, null, 2), 'utf-8')
  }

  load() {
    try {
      if (fs.existsSync(this._historyFile)) {
        const data = fs.readFileSync(this._historyFile, 'utf-8')
        this.history = JSON.parse(data)
        // If user configured Local Folder as temp store, prefer entries that exist in that folder
        const localFolder = Settings.getString('localFolder', 'folder') || ''
        const saveToLocal = (Settings.getString('localFolder', 'use-as-temp') || '') === 'true'
        if (saveToLocal && localFolder) {
          try {
            for (const e of this.history) {
              // if current path missing but file with same basename exists in localFolder, switch to it
              if (e && e.path && !fs.existsSync(e.path)) {
                const base = path.basename(e.path || '')
                const candidate = path.join(localFolder, base)
                if (fs.existsSync(candidate)) e.path = candidate
              }
            }
          } catch (_) {}
        }
      }
    } catch (e) { this.history = [] }
  }

  _deleteOld() {
    while (this.history.length > this.size) {
      const e = this.history.pop()
      if (e) {
        try { fs.unlinkSync(e.path) } catch (ex) {}
      }
    }
  }

  // Save a buffer or copy file to history dir and return the path and entry
  private _ensureUniqueName(name: string) {
    const base = path.basename(name)
    const ext = path.extname(base)
    const baseName = base.replace(ext, '')
    let candidate = base
    let i = 1
    while (fs.existsSync(path.join(this._dir, candidate))) {
      candidate = `${baseName}-${i}${ext}`
      i++
    }
    return candidate
  }

  saveFileFromBuffer(buffer: Buffer, originalName: string, url: string, author: string | null = null, source: string | null = null): HistoryEntry {
    // derive a sensible filename from originalName (may be a URL)
    let suggested = ''
    try {
      if (originalName) {
        // strip query params and anchors
        const clean = originalName.split('?')[0].split('#')[0]
        suggested = path.basename(clean)
      }
    } catch (e) { suggested = '' }
    if (!suggested) suggested = `image-${Date.now()}.jpg`
    // If user configured local folder as the temporary/save target, prefer writing into it
    const localFolder = Settings.getString('localFolder', 'folder') || ''
    const saveToLocal = (Settings.getString('localFolder', 'use-as-temp') || '') === 'true'
    const filename = this._ensureUniqueName(suggested)
    let dest = path.join(this._dir, filename)
    if (saveToLocal && localFolder) {
      try {
        if (fs.existsSync(localFolder) && fs.statSync(localFolder).isDirectory()) {
          // try to write into user's selected folder with the suggested filename (unique)
          const candidate = path.join(localFolder, this._ensureUniqueName(suggested))
          fs.writeFileSync(candidate, buffer)
          dest = candidate
        } else {
          fs.writeFileSync(dest, buffer)
        }
      } catch (e) {
        // fallback to history directory write
        fs.writeFileSync(dest, buffer)
      }
    } else {
      fs.writeFileSync(dest, buffer)
    }
    const entry = new HistoryEntry(author, source, url, dest)
    this.insert([entry])
    return entry
  }

  saveFileFromPath(srcPath: string, url: string | null = null, author: string | null = null, source: string | null = null): HistoryEntry {
    const suggested = path.basename(srcPath)
    // If user chose Local Folder as temp store and srcPath is already in that folder,
    // do not copy — reference the original path instead.
    const localFolder = Settings.getString('localFolder', 'folder') || ''
    const saveToLocal = (Settings.getString('localFolder', 'use-as-temp') || '') === 'true'
    let dest = path.join(this._dir, this._ensureUniqueName(suggested))
    if (saveToLocal && localFolder && srcPath.startsWith(localFolder)) {
      // use srcPath directly
      dest = srcPath
    } else {
      try { fs.copyFileSync(srcPath, dest) } catch (e) { throw e }
    }
    const entry = new HistoryEntry(author, source, url ?? srcPath, dest)
    this.insert([entry])
    return entry
  }
}

export {HistoryController, HistoryEntry}
