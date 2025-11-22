import fetch from 'node-fetch'
import * as Settings from '../settings.js'

export async function fetchRedditRandom(options: any = {}): Promise<{image: string, source?: string}[]> {
  const subs = options.subreddits ?? Settings.getString('reddit', 'subreddits') ?? 'wallpapers'
  const requireSfw = options.allowSfw ?? (Settings.getBoolean('reddit', 'allow-sfw') ?? true)

  // request more items to increase chance of finding a suitable image
  const url = `https://www.reddit.com/r/${encodeURIComponent(subs)}/hot.json?limit=100`
  const headers = { 'User-Agent': 'RandomWallpaperElectron/1.0 (https://github.com/ifl0w/RandomWallpaper)', 'Accept': 'application/json' }

  // try a few times on transient failures, and fall back to old.reddit.com if main domain fails
  let resp = await fetch(url, { headers })
  let tries = 0
  while ((!resp.ok && (resp.status >= 500 || resp.status === 429)) && tries < 3) {
    tries++
    await new Promise(r => setTimeout(r, 300 * tries))
    resp = await fetch(url, { headers })
  }
  if (!resp.ok) {
    // fallback: try old.reddit.com which often serves cleaner JSON responses
    const oldUrl = `https://old.reddit.com/r/${encodeURIComponent(subs)}/hot.json?limit=100`
    resp = await fetch(oldUrl, { headers })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Reddit fetch failed: ${resp.status} ${resp.statusText} ${text}`)
    }
  }
  const json: any = await resp.json()
  if (!json || !json.data || !Array.isArray(json.data.children)) return []

  const items = json.data.children.map((c: any) => c.data).filter((d: any) => {
    // Accept posts that either have explicit preview images or direct image links
    if (d.post_hint === 'image') return true
    const url = d.url || d.url_overridden_by_dest || ''
    return typeof url === 'string' && /\.(jpe?g|png|bmp|webp)$/i.test(url)
  })
  if (!items || items.length === 0) return []

  // apply filters from settings
  const minW = Number(options.minWidth ?? Settings.getInt('reddit', 'min-width') ?? 0)
  const minH = Number(options.minHeight ?? Settings.getInt('reddit', 'min-height') ?? 0)

  const filtered = items.filter((d: any) => {
    const width = d.preview?.images?.[0]?.source?.width ?? 0
    const height = d.preview?.images?.[0]?.source?.height ?? 0
    if (minW && width < minW) return false
    if (minH && height < minH) return false
    if (requireSfw && d.over_18) return false
    return true
  })

  if (!filtered || filtered.length === 0) return []

  return filtered.slice(0, options.count ?? 1).map((d: any) => {
    // prefer the preview image when available, otherwise use the destination URL
    const preview = d.preview?.images?.[0]?.source?.url
    const urlImage = preview || d.url || d.url_overridden_by_dest || ''
    return { image: urlImage, source: `https://www.reddit.com${d.permalink}` }
  })
}
