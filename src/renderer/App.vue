<template>
  <div>
    <el-container>
      <el-header style="padding:12px">
        <el-row type="flex" justify="space-between" align="middle">
          <el-col>
            <h2 style="margin:0">Random Wallpaper — Windows</h2>
          </el-col>
          <el-col>
            <div>API status: <span id="apiStatus">checking...</span></div>
          </el-col>
        </el-row>
      </el-header>

      <el-main style="padding: 16px">
        <el-card>
          <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <el-button id="chooseFolder" type="primary" @click="chooseFolder">Choose Local Folder</el-button>
            <el-button id="randomFromFolder" @click="randomFromFolder">Random From Folder</el-button>
            <el-button id="fetchUnsplash" @click="fetchUnsplash">Fetch Unsplash</el-button>
            <el-button id="fetchReddit" @click="fetchReddit">Fetch Reddit</el-button>
            <el-button id="fetchUrl" @click="fetchUrl">Fetch URL</el-button>
            <el-button id="fetchWallhaven" @click="fetchWallhaven">Fetch Wallhaven</el-button>
          </div>
        </el-card>
        <el-row>
            <h2>Settings</h2>
        </el-row>
        <el-card>
          <el-collapse v-model="activeCollapse" accordion>
            <el-collapse-item title="Sources" name="sources">
              <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
                <el-checkbox id="srcUnsplash" v-model="srcUnsplash">Unsplash</el-checkbox>
                <el-checkbox id="srcReddit" v-model="srcReddit">Reddit</el-checkbox>
                <el-checkbox id="srcWallhaven" v-model="srcWallhaven">Wallhaven</el-checkbox>
                <el-checkbox id="srcLocal" v-model="srcLocal">Local Folder</el-checkbox>
                <el-checkbox id="srcGeneric" v-model="srcGeneric">Generic JSON</el-checkbox>
                <el-checkbox id="srcUrl" v-model="srcUrl">URL Source</el-checkbox>
                <div style="margin-left:auto"><el-button type="primary" @click="randomizeNow">Randomize Now</el-button></div>
              </div>
            </el-collapse-item>

            <el-collapse-item title="Unsplash" name="unsplash">
                <div>
                    Access Key (public / Client ID): <el-input v-model="unsplashAccessKey" placeholder="Access Key" clearable />
                    Query: <el-input v-model="unsplashQuery" placeholder="Search query" clearable />
                </div>
               <el-button type="primary" @click="saveUnsplash" style="margin-top:6px">Save</el-button>
               <el-button @click="testUnsplashKey" style="margin-top:6px">Test Key</el-button>
               <span id="unsplashTestResult" style="margin-left:8px;font-size:smaller"></span>
              <div style="font-size:smaller;margin-top:6px">Note: Only the Access Key (Client ID) is used for public API calls.</div>
            </el-collapse-item>

            <el-collapse-item title="Reddit" name="reddit">
                <div>
                    Subreddits: <el-input v-model="redditSubreddits" clearable/>
                    Allow SFW: <el-switch v-model="redditAllowSfw" />
                </div>
                <div style="margin-top:6px">
                  Min Width: <el-input-number v-model="redditMinWidth" :min="0" />
                  Min Height: <el-input-number v-model="redditMinHeight" :min="0" />
                </div>
                <el-button id="saveReddit" type="primary" @click="saveReddit" style="margin-top:6px">Save</el-button>
            </el-collapse-item>

            <el-collapse-item title="Wallhaven" name="wallhaven">
                <div>
                    Keywords: <el-input v-model="wallhavenKeywords" clearable />
                </div>
              <div style="margin-top:6px">
                Minimal Resolution: <el-input v-model="wallhavenResolution" />
                Sorting: <el-input v-model="wallhavenSorting" placeholder="toplist | random | relevance" />
              </div>
              <div style="margin-top:6px">
                Top Range: <el-input v-model="wallhavenTopRange" placeholder="3M | 1y | 1w" />
                API Key: <el-input v-model="wallhavenApiKey" />
              </div>
              <el-button id="saveWallhaven" type="primary" @click="saveWallhaven" style="margin-top:6px">Save</el-button>
            </el-collapse-item>

            <el-collapse-item title="URL Source" name="urlsource">
                <div>
                    Image URL: <el-input v-model="urlImageUrl" clearable />
                </div>
                <div style="margin-top:6px">
                    Domain: <el-input v-model="urlDomain" placeholder="example.com" clearable />
                </div>
                <el-button id="saveUrlSource" type="primary" @click="saveUrlSource" style="margin-top:6px">Save</el-button>
                <div style="font-size:smaller;margin-top:6px">Use full image URLs (http/https). Domain is saved as the source label.</div>
            </el-collapse-item>

            <el-collapse-item title="Generic JSON" name="genericjson">
                <div>
                    Request URL: <el-input v-model="genericRequestUrl" clearable />
                </div>
                <div style="margin-top:6px">
                    Image Path: <el-input v-model="genericImagePath" placeholder="$.data[0].image" />
                </div>
                <div style="margin-top:6px">
                    Prefix: <el-input v-model="genericImagePrefix" placeholder="https://..." />
                    <el-button id="saveGenericJson" type="primary" @click="saveGenericJson" style="margin-top:6px">Save</el-button>
                    <el-button id="fetchGenericJson" @click="fetchGenericJson" style="margin-top:6px">Fetch Generic JSON</el-button>
                </div>
                <div style="font-size:smaller;margin-top:6px">Request a JSON endpoint and extract an image URL using a JSONPath-like path. Prefix is applied to non-http URLs.</div>
            </el-collapse-item>

            <el-collapse-item title="Auto-change Wallpaper" name="scheduler">
                <div>
                    Interval (minutes): <el-input-number v-model="schedulerMinutes" :min="1" />
                    Enabled: <el-switch v-model="schedulerEnabled" />
                </div>
                <div style="margin-top:6px">
                  <el-button id="schedulerStart" type="primary" @click="schedulerStart">Start</el-button>
                  <el-button id="schedulerStop" @click="schedulerStop">Stop</el-button>
                </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

    <p>
      Selected: <span id="selected">{{ selectedLocalFolder }}</span>
    </p>
    <div>
      <el-checkbox v-model="saveDownloadsToLocal">Save downloads to the selected Local Folder</el-checkbox>
      <div style="font-size:smaller">When enabled, downloaded wallpapers will be written into the chosen Local Folder instead of the system temporary folder.</div>
    </div>
    <div id="images"></div>
    <div style="font-size:smaller;margin-bottom:6px">Debug: <span id="historyDebug">{{ debugSummary }}</span></div>
    <h2>History</h2>
    <p>
      <button id="clearHistory" @click="clearHistory">Clear History</button>
    </p>
    <style>
      /* Grid layout for history thumbnails */
      #historyList { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
      .history-item { background: #fff; border: 1px solid #ddd; padding: 8px; border-radius:6px; display:flex; flex-direction:column; align-items:stretch }
      .thumb-box { width:100%; position:relative; background:#f7f7f7; border-radius:4px; overflow:hidden; padding-top:66% /* 3:2 ratio */ }
      /* img inside fixed-aspect box: stretch to box and contain while preserving aspect */
      .history-thumb { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; display:block; cursor:pointer }
      .history-meta { margin-top:8px; display:flex; justify-content:space-between; align-items:center; gap:8px }
      .history-meta .title { font-size:0.9em; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .history-meta .time { font-size:0.8em }
      .history-actions { margin-top:8px; display:flex; gap:6px }
      .history-actions button { flex:1 }
    </style>
    <el-row :gutter="12" style="margin-top:8px">
      <el-col v-for="(h, idx) in historyItems" :key="h.id" :xs="24" :sm="12" :md="12" :lg="8">
        <el-card style="padding:8px; margin-bottom:12px">
          <div class="thumb-box" @click="showPreview(h.path)">
            <img
              class="history-thumb"
              :src="h.thumb || placeholderThumb"
              :data-file="(h.thumb && /^file:/i.test(h.thumb)) ? h.thumb : ''"
              loading="lazy"
              alt="thumbnail"
              @load="onThumbLoad($event, idx, h.id)"
              @error="onThumbError($event, idx, h.id)"
            />
          </div>
          <div class="history-meta">
            <div class="title">{{ h.name || String(h.path || '').replace(/\\\\/g, '/').split('/').pop() || '' }}</div>
            <div class="time">{{ new Date(h.timestamp).toLocaleString() }}</div>
          </div>
          <div class="history-actions">
            <el-button size="small" type="primary" @click="historyApply(h.id)">Apply</el-button>
            <el-button size="small" type="danger" @click="historyDelete(h.id)">Delete</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div id="previewModal" style="display:none;position:fixed;z-index:99999;inset:0;background:rgba(0,0,0,0.75);align-items:center;justify-content:center;">
      <div style="position:relative;z-index:100000;max-width:96%;max-height:90%;background:white;padding:8px;border-radius:6px;">
        <button id="previewClose" @click="closePreview">Close</button>
        <img id="previewImg" src="" style="max-width:100%;max-height:80vh;display:block;margin-top:8px;" />
      </div>
    </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

export default {
  name: 'App',
  setup() {
    // status
    const apiStatus = ref('checking...')
    const srcUnsplash = ref(false)
    const srcReddit = ref(false)
    const srcWallhaven = ref(false)
    const srcLocal = ref(false)
    const srcGeneric = ref(false)
    const srcUrl = ref(false)
    const unsplashAccessKey = ref('')
    const unsplashQuery = ref('')
    const redditSubreddits = ref('wallpapers')
    const redditAllowSfw = ref(false)
    const redditMinWidth = ref<number | null>(0)
    const redditMinHeight = ref<number | null>(0)
    const wallhavenKeywords = ref('')
    const wallhavenResolution = ref('')
    const wallhavenSorting = ref('toplist')
    const wallhavenTopRange = ref('3M')
    const wallhavenApiKey = ref('')
    const urlImageUrl = ref('')
    const urlDomain = ref('')
    const genericRequestUrl = ref('')
    const genericImagePath = ref('')
    const genericImagePrefix = ref('')
    const schedulerMinutes = ref<number | null>(60)
    const schedulerEnabled = ref(false)
    const saveDownloadsToLocal = ref(false)
    const selectedLocalFolder = ref('(none)')
    const historyItems = ref<any[]>([])
    const debugSummary = ref('')
    const placeholderThumb = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160"><rect width="100%" height="100%" fill="#f2f2f2"/><text x="50%" y="50%" font-size="12" text-anchor="middle" fill="#aaa">missing</text></svg>')}`

      debugSummary.value = '' // Initialize debugSummary
    const activeCollapse = ref<string[]>(['sources'])

    async function getDisplaySrc(pathOrUrl: string) {
      if (!pathOrUrl) return ''
      try {
        if (/^https?:/i.test(pathOrUrl)) return pathOrUrl
        const maybe = String(pathOrUrl).startsWith('file:') ? String(pathOrUrl) : String(pathOrUrl)
        try {
          const data = await window.rw?.readFileAsDataUrl(maybe)
          if (data) return data
        } catch (_) {}
        const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" font-size="16" text-anchor="middle" fill="#888" dy=".3em">file unavailable</text></svg>')}`
        return placeholder
      } catch (_) { return pathOrUrl }
    }

    async function loadSettings() {
      try {
        const unsplash = await window.rw?.settingsGet('unsplash', 'access-key')
        const legacy = await window.rw?.settingsGet('unsplash', 'api-key')
        unsplashAccessKey.value = (unsplash || legacy || '')
        unsplashQuery.value = (await window.rw?.settingsGet('unsplash', 'query')) || ''
        srcUnsplash.value = (await window.rw?.settingsGet('sources', 'unsplash')) === 'true'
        srcReddit.value = (await window.rw?.settingsGet('sources', 'reddit')) === 'true'
        srcWallhaven.value = (await window.rw?.settingsGet('sources', 'wallhaven')) === 'true'
        srcLocal.value = (await window.rw?.settingsGet('sources', 'localFolder')) === 'true'
        srcGeneric.value = (await window.rw?.settingsGet('sources', 'genericJson')) === 'true'
        srcUrl.value = (await window.rw?.settingsGet('sources', 'urlSource')) === 'true'
        redditSubreddits.value = (await window.rw?.settingsGet('reddit', 'subreddits')) || 'wallpapers'
        redditAllowSfw.value = (await window.rw?.settingsGet('reddit', 'allow-sfw')) === 'true'
        redditMinWidth.value = Number((await window.rw?.settingsGet('reddit', 'min-width')) || 0)
        redditMinHeight.value = Number((await window.rw?.settingsGet('reddit', 'min-height')) || 0)
        wallhavenKeywords.value = (await window.rw?.settingsGet('wallhaven', 'keywords')) || ''
        wallhavenResolution.value = (await window.rw?.settingsGet('wallhaven', 'minimal-resolution')) || ''
        wallhavenSorting.value = (await window.rw?.settingsGet('wallhaven', 'sorting')) || 'toplist'
        wallhavenTopRange.value = (await window.rw?.settingsGet('wallhaven', 'topRange')) || '3M'
        wallhavenApiKey.value = (await window.rw?.settingsGet('wallhaven', 'api-key')) || ''
        const savedLocal = await window.rw?.settingsGet('localFolder', 'folder')
        if (savedLocal) selectedLocalFolder.value = savedLocal
        urlImageUrl.value = (await window.rw?.settingsGet('urlSource', 'image-url')) || ''
        urlDomain.value = (await window.rw?.settingsGet('urlSource', 'domain')) || ''
        genericRequestUrl.value = (await window.rw?.settingsGet('genericJson', 'request-url')) || ''
        genericImagePath.value = (await window.rw?.settingsGet('genericJson', 'image-path')) || ''
        genericImagePrefix.value = (await window.rw?.settingsGet('genericJson', 'image-prefix')) || ''
        saveDownloadsToLocal.value = (await window.rw?.settingsGet('localFolder', 'use-as-temp')) === 'true'
      } catch (e) {
        console.error('loadSettings failed', e)
      }
    }

    const THUMBNAIL_SIZE_THRESHOLD = 200 * 1024 // 200KB -> create smaller thumbnail for display
    const THUMBNAIL_MAX_SIDE = 512
    const THUMB_WEBP_QUALITY = 0.9
    const THUMB_JPEG_QUALITY = 0.85

    async function createThumbnailFromDataUrl(dataUrl: string, maxSide = THUMBNAIL_MAX_SIDE) {
      try {
        // convert dataURL -> blob and use createImageBitmap for robust decoding
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        let bitmap: ImageBitmap | null = null
        try {
          bitmap = await (window as any).createImageBitmap(blob)
        } catch (err) {
          // fallback to Image + onload
          bitmap = null
        }

        if (bitmap) {
          const w = bitmap.width
          const h = bitmap.height
          if (!w || !h) return null
          const scale = Math.min(1, maxSide / Math.max(w, h))
          const tw = Math.max(1, Math.round(w * scale))
          const th = Math.max(1, Math.round(h * scale))
          const canvas = document.createElement('canvas')
          canvas.width = tw
          canvas.height = th
          const ctx = canvas.getContext('2d')
          if (!ctx) return null
          ctx.drawImage(bitmap, 0, 0, tw, th)
          // prefer WebP for better visual quality at smaller sizes if supported
          try {
            const webp = canvas.toDataURL('image/webp', THUMB_WEBP_QUALITY)
            if (webp && /^data:image\/webp/i.test(webp)) {
              return webp
            }
          } catch (err) { /* fallback to jpeg quietly */ }
          const jpeg = canvas.toDataURL('image/jpeg', THUMB_JPEG_QUALITY)
          return jpeg
        }

        // fallback path — Image element
        return await new Promise<string | null>((resolve) => {
          try {
            const img = new Image()
            img.onload = () => {
              try {
                const w = img.naturalWidth
                const h = img.naturalHeight
                if (!w || !h) return resolve(null)
                const scale = Math.min(1, maxSide / Math.max(w, h))
                const tw = Math.max(1, Math.round(w * scale))
                const th = Math.max(1, Math.round(h * scale))
                const canvas = document.createElement('canvas')
                canvas.width = tw
                canvas.height = th
                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve(null)
                ctx.drawImage(img, 0, 0, tw, th)
                // prefer webp when available
                try {
                  const webp = canvas.toDataURL('image/webp', THUMB_WEBP_QUALITY)
                  if (webp && /^data:image\/webp/i.test(webp)) {
                    resolve(webp)
                    return
                  }
                } catch (err) { /* ignore and fallback to jpeg */ }
                const thumb = canvas.toDataURL('image/jpeg', THUMB_JPEG_QUALITY)
                resolve(thumb)
                resolve(thumb)
              } catch (err) { console.error('createThumbnailFromDataUrl failed', err); resolve(null) }
            }
            img.onerror = (e) => { console.error('createThumbnailFromDataUrl load error', e); resolve(null) }
            img.src = dataUrl
          } catch (err) { console.error('createThumbnailFromDataUrl outer error', err); resolve(null) }
        })
      } catch (err) {
        console.error('createThumbnailFromDataUrl overall error', err)
        return null
      }
    }

    async function loadHistory() {
      historyItems.value = []
      try {
        const hs = (await window.rw?.historyGet()) || []
        const list: any[] = []
        // limit items to avoid huge memory usage — show most recent 100 by default
        const maxItems = 100
        const slice = hs.slice(0, maxItems)
        for (const h of slice) {
          let thumb: string | null = null
          try {
            const p = String(h.path || '')
            if (/^https?:/i.test(p)) {
              thumb = p
            } else if (/^file:/i.test(p)) {
              thumb = p // keep file: URLs as-is
            } else if (/^[a-zA-Z]:\\/.test(p) || /^\\\\/.test(p)) {
              // Windows absolute path — normalize into file:/// URL
              let pNormalized = p.replace(/\\/g, '/')
              if (!pNormalized.startsWith('/')) pNormalized = '/' + pNormalized
              thumb = `file://${pNormalized}`
            } else {
              // fallback — don't pre-load data into memory
              thumb = null
            }
          } catch (e) {
            thumb = null
          }
          list.push({ ...h, thumb })
        }
        // eagerly load a small number of file thumbnails so the user sees immediate previews
        const eagerCount = Math.min(list.length, 12)
        for (let i = 0; i < eagerCount; i++) {
          try {
            const entry = list[i]
            if (entry?.thumb) {
              if (/^file:/i.test(entry.thumb) || /^[a-zA-Z]:\\/.test(entry.thumb) || /^\\\\/.test(entry.thumb)) {
                const data = await window.rw?.readFileAsDataUrl(entry.thumb)
                if (data) {
                  const origLen = String(data).length
                  // if image is large, create a smaller thumbnail for faster display
                  if (origLen > THUMBNAIL_SIZE_THRESHOLD) {
                    const thumbSmall = await createThumbnailFromDataUrl(data)
                    if (thumbSmall) {
                      list[i].thumb = thumbSmall
                      list[i]._thumb_full_length = origLen
                      list[i]._thumb_small_length = String(thumbSmall).length
                      list[i]._thumb_small_type = thumbSmall.split(':')[0].replace('data', '') || 'data'
                      console.info('history eager created thumbnail', { index: i, id: list[i].id, origLength: origLen, thumbLength: list[i]._thumb_small_length })
                    } else {
                      list[i].thumb = data
                    }
                  } else {
                    list[i].thumb = data
                  }
                }
              }
            }
          } catch (e) { /* ignore individual failures */ }
        }
        historyItems.value = list
        // summary for debugging: id and thumb sizes
        try {
          const summary = list.map(h => ({ id: h.id, thumbLength: h.thumb ? String(h.thumb).length : 0, thumbSmallLength: h._thumb_small_length || null, fullLength: h._thumb_full_length || null }))
          console.debug && console.debug('history summary:', summary)
          try {
            const smallCount = summary.filter(s => s.thumbSmallLength).length
            debugSummary.value = `items=${summary.length} smallThumbs=${smallCount}`
          } catch (_) { debugSummary.value = '' }
        } catch (_) {}
        // force DOM src assignment for any eagerly-loaded data URLs (some cases Vue binding
        // didn't immediately update the rendered <img>)
        try {
          await nextTick()
          const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.history-thumb'))
          for (let i = 0; i < eagerCount && i < imgs.length; i++) {
            const thumb = list[i]?.thumb
              if (thumb && /^data:/i.test(String(thumb))) {
              // if we generated a smaller thumbnail earlier, img.src should already be thumbs[i]
              // but ensure we're inserting the small version if available
              const displaySrc = (list[i]._thumb_small_length ? list[i].thumb : thumb)
              imgs[i].src = displaySrc
              // avoid per-image DOM logs — they're noisy
            }
          }
        } catch (e) { console.error('history eager DOM set failed', e) }
        // after DOM updates, initialize lazy loading for local file thumbnails
        try {
          await nextTick()
          setupHistoryLazyLoader()
        } catch (_) {}
      } catch (err) {
        historyItems.value = []
      }
    }

    function setupHistoryLazyLoader() {
      if (typeof IntersectionObserver === 'undefined') return
      const options = { root: null, rootMargin: '200px', threshold: 0.01 }
      const io = new IntersectionObserver(async (entries) => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue
          const el = ent.target as HTMLImageElement
          const file = el.getAttribute('data-file')
          if (file && /^file:/i.test(file)) {
            try {
              const data = await window.rw?.readFileAsDataUrl(file)
              if (data) {
                const origLen = String(data).length
                if (origLen > THUMBNAIL_SIZE_THRESHOLD) {
                  const thumbSmall = await createThumbnailFromDataUrl(data)
                  if (thumbSmall) {
                    el.src = thumbSmall
                    el.setAttribute('data-full-len', String(origLen))
                    el.setAttribute('data-thumb-len', String(String(thumbSmall).length))
                    el.setAttribute('data-thumb-type', String(thumbSmall).split(':')[0].replace('data', ''))
                    console.info('history lazy set thumb', { file, origLen, thumbLen: String(thumbSmall).length })
                  } else {
                    el.src = data
                  }
                } else {
                  el.src = data
                }
                try { console.log('history lazy loader — img.src startsWith data:', String(el.src).startsWith('data:')) } catch (_) {}
              } else {
                console.log('history lazy loader — read returned null for', file)
              }
            } catch (err) { console.error('history lazy loader read failed', err) }
          }
          io.unobserve(el)
        }
      }, options)

      const thumbs = Array.from(document.querySelectorAll<HTMLElement>('.history-thumb'))
      const fileThumbs = thumbs.map(el => ({ el, file: el.getAttribute('data-file') })).filter(x => x.file && /^file:/i.test(x.file))
      console.log('history lazy loader — found', fileThumbs.length, 'file thumbs')
      fileThumbs.forEach(({ el, file }) => {
        io.observe(el)
        console.log('history lazy loader — observing', file)
      })
    }

    function safeBackgroundUrl(u: string | null | undefined) {
      if (!u) return ''
      // encode URI first to escape spaces and commas, then escape quotes and closing parenthesis
      const encoded = encodeURI(String(u))
      const s = encoded.replace(/"/g, '\\"').replace(/\)/g, '%29')
      return `url("${s}")`
    }

    async function historyApply(id: string) {
      await window.rw?.historyApply(id)
      await loadHistory()
    }

    async function historyDelete(id: string) {
      await window.rw?.historyDelete(id)
      await loadHistory()
    }

    function showStatus(msg: string, isError = false) {
      const statusMessage = document.getElementById('statusMessage') as HTMLElement
      if (!statusMessage) return
      statusMessage.textContent = msg
      statusMessage.style.color = isError ? 'red' : 'black'
    }

    function showPreview(pathOrUrl: string) {
      const previewModal = document.getElementById('previewModal')!
      const previewImg = document.getElementById('previewImg') as HTMLImageElement
      if (/^(https?:)/i.test(pathOrUrl)) {
        previewImg.src = pathOrUrl
      } else {
        let p = String(pathOrUrl).replace(/\\/g, '/')
        if (/^[a-zA-Z]:\//.test(p)) p = '/' + p
        try {
          const maybe = String(pathOrUrl).startsWith('file:') ? String(pathOrUrl) : `file://${p}`
          window.rw?.readFileAsDataUrl(maybe).then(data => { previewImg.src = data || maybe })
        } catch (e) { previewImg.src = `file://${p}` }
      }
      previewModal.style.display = 'flex'
    }

    // Vue handlers (migrate from legacy DOM wiring)
    async function chooseFolder() {
      const folder = await window.rw?.chooseFolder()
      selectedLocalFolder.value = folder || '(none)'
      if (folder) await window.rw?.settingsSet('localFolder', 'folder', folder)
    }

    async function randomFromFolder() {
      const folder = selectedLocalFolder.value || ''
      const result = await window.rw?.randomFromFolder(folder, 1)
      if (!result || result.length === 0) { alert('No images'); return }
      await window.rw?.setWallpaper(result[0])
      await loadHistory()
      const display = await getDisplaySrc(result[0])
      const images = document.getElementById('images')!
      images.innerHTML = `<img src="${display}" style="max-width:100%" />`
    }

    async function fetchUnsplash() {
      try {
        const q = (unsplashQuery.value || '').trim()
        const opts = q ? { query: q } : undefined
        const res = await window.rw?.fetchUnsplash(opts)
        if (!res || res.length === 0) { alert('No images'); return }
        const url = res[0].image
        const images = document.getElementById('images')!
        const display = await getDisplaySrc(url)
        images.innerHTML = `<img src="${display}" style="max-width:100%" />`
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        a.textContent = 'Open in browser'
        const setButton = document.createElement('button')
        setButton.textContent = 'Set as wallpaper'
        setButton.addEventListener('click', async () => { await window.rw?.downloadAndSet(url); alert('Applied'); await loadHistory() })
        images.appendChild(a)
        images.appendChild(setButton)
        const previewBtn = document.createElement('button')
        previewBtn.textContent = 'Preview'
        previewBtn.addEventListener('click', () => showPreview(url))
        images.appendChild(previewBtn)
      } catch (err) { console.error('Fetch Unsplash failed', err); showStatus(`Unsplash error: ${String(err)}`, true) }
    }

    async function fetchReddit() {
      const opts: any = { subreddits: (redditSubreddits.value || '').trim(), allowSfw: !!redditAllowSfw.value, minWidth: Number(redditMinWidth.value) || 0, minHeight: Number(redditMinHeight.value) || 0 }
      const res = await window.rw?.fetchReddit(opts)
      if (!res || res.length === 0) { showStatus('No Reddit images found', true); return }
      const display = await getDisplaySrc(res[0].image)
      const images = document.getElementById('images')!
      images.innerHTML = `<img src="${display}" style="max-width:100%" /> <div><a href="${res[0].source}">Source</a></div>`
      try { await window.rw?.downloadAndSet(res[0].image); await loadHistory(); showStatus('Wallpaper applied from Reddit') } catch (err) { console.error(err); showStatus(String(err), true) }
    }

    async function fetchWallhaven() {
      const opts: any = { keywords: (wallhavenKeywords.value || '').trim(), minimalResolution: (wallhavenResolution.value || '').trim(), sorting: (wallhavenSorting.value || '').trim(), topRange: (wallhavenTopRange.value || '').trim(), apiKey: (wallhavenApiKey.value || '').trim() || undefined }
      const res = await window.rw?.fetchWallhaven(opts)
      if (!res || res.length === 0) { showStatus('No Wallhaven images found', true); return }
      const display = await getDisplaySrc(res[0].image)
      const images = document.getElementById('images')!
      images.innerHTML = `<img src="${display}" style="max-width:100%" /> <div><a href="${res[0].source}">Source</a></div>`
      try { await window.rw?.downloadAndSet(res[0].image); await loadHistory(); showStatus('Wallpaper applied from Wallhaven') } catch (err) { console.error(err); showStatus(String(err), true) }
    }

    async function fetchUrl() {
      try {
        const opts: any = { imageUrl: (urlImageUrl.value || '').trim(), domain: (urlDomain.value || '').trim() || undefined }
        const res = await window.rw?.fetchUrlSource(opts)
        if (!res || res.length === 0) { showStatus('No URL Source image found', true); return }
        const url = res[0].image
        const display = await getDisplaySrc(url)
        const images = document.getElementById('images')!
        images.innerHTML = `<img src="${display}" style="max-width:100%" /> <div><small>source: ${res[0].source || ''}</small></div>`
        const setButton = document.createElement('button')
        setButton.textContent = 'Set as wallpaper'
        setButton.addEventListener('click', async () => { await window.rw?.downloadAndSet(url); alert('Applied'); await loadHistory() })
        images.appendChild(setButton)
        const previewBtn = document.createElement('button')
        previewBtn.textContent = 'Preview'
        previewBtn.addEventListener('click', () => showPreview(url))
        images.appendChild(previewBtn)
      } catch (err) { console.error('Fetch URL Source failed', err); showStatus(`URL Source error: ${String(err)}`, true) }
    }

    async function saveUnsplash() {
      await window.rw?.settingsSet('unsplash', 'access-key', unsplashAccessKey.value)
      await window.rw?.settingsSet('unsplash', 'api-key', unsplashAccessKey.value || '')
      await window.rw?.settingsSet('unsplash', 'query', unsplashQuery.value)
      alert('Saved Unsplash settings')
    }

    async function testUnsplashKey() {
      const access = unsplashAccessKey.value || ''
      const unsplashTestResult = document.getElementById('unsplashTestResult')!
      unsplashTestResult.textContent = 'Testing...'
      try {
        const res = await window.rw?.testUnsplashKey(access)
        if (res?.ok) { unsplashTestResult.style.color = 'green'; unsplashTestResult.textContent = 'Key valid — API reachable' }
        else { unsplashTestResult.style.color = 'red'; unsplashTestResult.textContent = `Invalid: ${res?.error || 'unknown'}` }
      } catch (err) { unsplashTestResult.style.color = 'red'; unsplashTestResult.textContent = `Error: ${String(err)}` }
    }

    async function saveReddit() {
      const redditSub = redditSubreddits.value || ''
      const redditAllow = redditAllowSfw.value
      const redditMinW = String(redditMinWidth.value || '0')
      const redditMinH = String(redditMinHeight.value || '0')
      await window.rw?.settingsSet('reddit', 'subreddits', redditSub)
      await window.rw?.settingsSet('reddit', 'allow-sfw', redditAllow ? 'true' : 'false')
      await window.rw?.settingsSet('reddit', 'min-width', redditMinW)
      await window.rw?.settingsSet('reddit', 'min-height', redditMinH)
      alert('Saved Reddit settings')
    }

    async function saveWallhaven() {
      const keywords = wallhavenKeywords.value
      const minimalResolution = wallhavenResolution.value
      const sorting = wallhavenSorting.value
      const topRange = wallhavenTopRange.value
      const apiKey = wallhavenApiKey.value
      await window.rw?.settingsSet('wallhaven', 'keywords', keywords)
      await window.rw?.settingsSet('wallhaven', 'minimal-resolution', minimalResolution)
      await window.rw?.settingsSet('wallhaven', 'sorting', sorting)
      await window.rw?.settingsSet('wallhaven', 'topRange', topRange)
      await window.rw?.settingsSet('wallhaven', 'api-key', apiKey)
      alert('Saved Wallhaven settings')
    }

    async function saveUrlSource() {
      const urlImage = urlImageUrl.value || ''
      const urlDom = urlDomain.value || ''
      await window.rw?.settingsSet('urlSource', 'image-url', urlImage)
      await window.rw?.settingsSet('urlSource', 'domain', urlDom)
      alert('Saved URL Source settings')
    }

    async function saveGenericJson() {
      const genericRequest = genericRequestUrl.value || ''
      const genericImageP = genericImagePath.value || ''
      const genericPrefix = genericImagePrefix.value || ''
      await window.rw?.settingsSet('genericJson', 'request-url', genericRequest)
      await window.rw?.settingsSet('genericJson', 'image-path', genericImageP)
      await window.rw?.settingsSet('genericJson', 'image-prefix', genericPrefix)
      alert('Saved Generic JSON settings')
    }

    async function fetchGenericJson() {
      try {
        const opts: any = { requestUrl: (genericRequestUrl.value || '').trim(), imagePath: (genericImagePath.value || '').trim(), imagePrefix: ((genericImagePrefix.value || '').trim() || undefined) }
        const res = await window.rw?.fetchGenericJson(opts)
        if (!res || res.length === 0) { showStatus('No Generic JSON images found', true); return }
        const url = res[0].image
        const display = await getDisplaySrc(url)
        const images = document.getElementById('images')!
        images.innerHTML = `<img src="${display}" style="max-width:100%" /> <div><small>source: ${res[0].source || ''}</small></div>`
        const setButton = document.createElement('button')
        setButton.textContent = 'Set as wallpaper'
        setButton.addEventListener('click', async () => { await window.rw?.downloadAndSet(url); alert('Applied'); await loadHistory() })
        images.appendChild(setButton)
        const previewBtn = document.createElement('button')
        previewBtn.textContent = 'Preview'
        previewBtn.addEventListener('click', () => showPreview(url))
        images.appendChild(previewBtn)
      } catch (err) { console.error('Fetch Generic JSON failed', err); showStatus(`Generic JSON error: ${String(err)}`, true) }
    }

    async function randomizeNow() {
      try {
        const result = await window.rw?.randomizeNow()
        if (result) showStatus(`Randomized from ${result.source}. Saved to ${result.path}`)
      } catch (err) { console.error(err); showStatus(String(err), true) }
    }

    async function schedulerStart() {
      const minutes = Math.max(1, Number(schedulerMinutes.value) || 60)
      await window.rw?.schedulerStart(minutes)
      ;(document.getElementById('schedulerEnabled') as HTMLInputElement).checked = true
      showStatus(`Scheduler started (${minutes} min)`)
    }

    async function schedulerStop() {
      await window.rw?.schedulerStop()
      ;(document.getElementById('schedulerEnabled') as HTMLInputElement).checked = false
      showStatus('Scheduler stopped')
    }

    async function clearHistory() {
      await window.rw?.historyClear()
      await loadHistory()
    }

    function closePreview() { (document.getElementById('previewModal') as HTMLElement).style.display = 'none' }

    function onThumbLoad(e: Event, idx: number, id?: string) {
      // intentionally quiet in normal operation to avoid console spam
      // keep handler for future non-invasive metrics if needed
    }

    function onThumbError(e: Event, idx: number, id?: string) {
      try {
        const img = e.target as HTMLImageElement
        console.warn(`history img error id=${id || ''}`)
      } catch (err) { console.error('onThumbError handler error', err) }
    }

    onMounted(async () => {
      const statusMessageEl = document.createElement('div')
      statusMessageEl.id = 'statusMessage'
      statusMessageEl.style.marginTop = '8px'
      statusMessageEl.style.padding = '8px'
      statusMessageEl.style.background = '#f7f7f7'
      statusMessageEl.style.border = '1px solid #ddd'
      const imagesEl = document.getElementById('images')
      try {
        if (imagesEl && imagesEl.parentNode) imagesEl.parentNode.insertBefore(statusMessageEl, imagesEl)
        else document.body.appendChild(statusMessageEl)
      } catch (e) {
        console.error('status message insert failed', e)
        try { document.body.appendChild(statusMessageEl) } catch (err) { console.error('fallback append failed', err) }
      }

      // debug: check preload availability
      console.log('App mounted — preload available:', !!window.rw)
      if (window.rw) console.log('preload keys:', Object.keys(window.rw))

      if (!window.rw) {
        apiStatus.value = 'unavailable'
        showStatus('Preload API not available — open DevTools to debug', true)
        ;['chooseFolder', 'randomFromFolder', 'fetchUnsplash', 'fetchReddit', 'fetchWallhaven', 'saveUnsplash', 'saveReddit', 'saveWallhaven', 'saveUrlSource', 'saveGenericJson', 'saveGenericJson', 'randomizeNow'].forEach(id => {
          const el = document.getElementById(id)
          if (el) el.addEventListener('click', () => alert('App preload API is not available. Open DevTools to see preload errors.'))
        })
        return
      }
      // wrap remaining mount logic to avoid a single DOM error stopping event wiring
      try {
      // smoke-test the preload API by invoking a simple settingsGet
      try {
        const test = await window.rw?.settingsGet('unsplash', 'access-key')
        apiStatus.value = `ready${test ? ' (access-key set)' : ' (no access-key)'}`
      } catch (e) {
        apiStatus.value = 'ready (ipc call failed)'
        console.error('preload ipc test failed', e)
      }

      // wire up simple handlers (mirrors original renderer.ts behaviour)
      // clearHistory handled via Vue handler

      // previewClose handled via Vue handler

      // saveUnsplash handled via Vue handler

      // testUnsplashKey handled via Vue handler

      // saveReddit handled via Vue handler

      // saveWallhaven handled via Vue handler

      // source toggles
      ;['srcUnsplash','srcReddit','srcWallhaven','srcLocal','srcGeneric','srcUrl'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement
        if (el) el.addEventListener('change', async () => { const key = el.id.replace(/^src/, '').toLowerCase(); await window.rw?.settingsSet('sources', key === 'local' ? 'localFolder' : key, el.checked ? 'true' : 'false') })
      })

      // saveGenericJson handled by Vue

      // fetchGenericJson handled by Vue

      // saveUrlSource handled by Vue

      // randomizeNow handled via Vue

      // chooseFolder handled via Vue

      // saveDownloadsToLocal persisted via watch (below)

      // randomFromFolder handled via Vue

      // fetchUnsplash handled via Vue

      // fetchReddit handled via Vue

      // fetchWallhaven handled via Vue

      // fetchUrl handled via Vue

      await loadSettings()
      await loadHistory()
      const sched = await window.rw?.schedulerStatus()
      if (sched) {
        schedulerMinutes.value = Number(sched.minutes) || 60
        schedulerEnabled.value = !!sched.enabled
      }
      } catch (mountErr) {
        console.error('onMounted handler error (non-fatal):', mountErr)
      }
    })

    // persist reactive changes back to settings
    watch(srcUnsplash, async (v) => { await window.rw?.settingsSet('sources', 'unsplash', v ? 'true' : 'false') })
    watch(srcReddit, async (v) => { await window.rw?.settingsSet('sources', 'reddit', v ? 'true' : 'false') })
    watch(srcWallhaven, async (v) => { await window.rw?.settingsSet('sources', 'wallhaven', v ? 'true' : 'false') })
    watch(srcLocal, async (v) => { await window.rw?.settingsSet('sources', 'localFolder', v ? 'true' : 'false') })
    watch(srcGeneric, async (v) => { await window.rw?.settingsSet('sources', 'genericJson', v ? 'true' : 'false') })
    watch(srcUrl, async (v) => { await window.rw?.settingsSet('sources', 'urlSource', v ? 'true' : 'false') })

    watch(saveDownloadsToLocal, async (v) => { await window.rw?.settingsSet('localFolder', 'use-as-temp', v ? 'true' : 'false') })

    watch(schedulerEnabled, async (v) => {
      if (v) {
        await window.rw?.schedulerStart(Number(schedulerMinutes.value) || 60)
      } else {
        await window.rw?.schedulerStop()
      }
    })

    return {
      apiStatus,
      // exposed refs for Element Plus bindings
      srcUnsplash,
      srcReddit,
      srcWallhaven,
      srcLocal,
      srcGeneric,
      srcUrl,
      unsplashAccessKey,
      unsplashQuery,
      redditSubreddits,
      redditAllowSfw,
      redditMinWidth,
      redditMinHeight,
      wallhavenKeywords,
      wallhavenResolution,
      wallhavenSorting,
      wallhavenTopRange,
      wallhavenApiKey,
      urlImageUrl,
      urlDomain,
      genericRequestUrl,
      genericImagePath,
      genericImagePrefix,
      schedulerMinutes,
      schedulerEnabled,
      saveDownloadsToLocal,
      selectedLocalFolder,
      historyItems,
      debugSummary,
      historyApply,
      historyDelete,
      onThumbLoad,
      onThumbError,
      showPreview,
      loadHistory,
      placeholderThumb,
      chooseFolder,
      randomFromFolder,
      fetchUnsplash,
      fetchReddit,
      fetchUrl,
      fetchWallhaven,
      saveUnsplash,
      testUnsplashKey,
      saveReddit,
      saveWallhaven,
      saveUrlSource,
      saveGenericJson,
      fetchGenericJson,
      randomizeNow,
      schedulerStart,
      schedulerStop,
      clearHistory,
      closePreview,
      activeCollapse,
      safeBackgroundUrl,
    }
  }
}
</script>

<style>
  body { font-family: Arial, sans-serif; margin: 16px }
</style>
