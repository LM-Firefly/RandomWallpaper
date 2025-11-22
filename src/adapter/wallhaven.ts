import fetch from 'node-fetch'
import * as Settings from '../settings.js'

export async function fetchWallhavenRandom(options: any = {}): Promise<{image: string, source?: string, name?: string}[]> {
  const keywords = options.keywords ?? Settings.getString('wallhaven', 'keywords') ?? 'mountains&nature'
  const query = []
  if (keywords) query.push(`q=${encodeURIComponent(keywords)}`)
  const atleast = options.minimalResolution ?? Settings.getString('wallhaven', 'minimal-resolution') ?? '3440x1440'
  if (atleast) query.push(`atleast=${encodeURIComponent(atleast)}`)

  // Allow optional parameters used by the web search to match results:
  // categories, purity, sorting, order, seed
  // defaults matching requested example link when not set in UI
  const categories = options.categories ?? Settings.getString('wallhaven', 'categories') ?? '110'
  if (categories) query.push(`categories=${encodeURIComponent(categories)}`)
  const purity = options.purity ?? Settings.getString('wallhaven', 'purity') ?? '110'
  if (purity) query.push(`purity=${encodeURIComponent(purity)}`)
  const sorting = options.sorting ?? Settings.getString('wallhaven', 'sorting') ?? 'toplist'
  if (sorting) query.push(`sorting=${encodeURIComponent(sorting)}`)
  const order = options.order ?? Settings.getString('wallhaven', 'order') ?? 'desc'
  if (order) query.push(`order=${encodeURIComponent(order)}`)
  const seed = options.seed ?? Settings.getString('wallhaven', 'seed')
  // additional parameters supported by API and used in example
  const topRange = options.topRange ?? Settings.getString('wallhaven', 'topRange') ?? '3M'
  if (seed) query.push(`seed=${encodeURIComponent(seed)}`)

  // If an API key is configured, include it in the query too (some endpoints use query param).
  const apiKey = options.apiKey ?? Settings.getString('wallhaven', 'api-key')
  if (apiKey) query.push(`apikey=${encodeURIComponent(apiKey)}`)
  // accept a full API URL from options or settings to allow custom query strings
  const directApiUrl = options.apiUrl ?? (Settings.getString('wallhaven', 'api-url') || '')
  // if no direct url, add topRange and atleast into query
  if (topRange) query.push(`topRange=${encodeURIComponent(topRange)}`)
  const url = directApiUrl && directApiUrl.startsWith('https://wallhaven.cc/api/v1/search')
    ? directApiUrl
    : `https://wallhaven.cc/api/v1/search?${query.join('&')}`
  const messageHeaders: any = {}
  if (apiKey) messageHeaders['X-API-Key'] = apiKey

  // Wallhaven sometimes blocks simple API calls; add a Referer and a short retry loop
  const makeRequest = async () => fetch(url, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Referer': 'https://wallhaven.cc/', 'Accept': 'application/json', ...messageHeaders } })
  let resp = await makeRequest()
  // retry a few times on 429/5xx
  let tries = 0
  while ((!resp.ok && (resp.status >= 500 || resp.status === 429)) && tries < 3) {
    tries++
    await new Promise(r => setTimeout(r, 500 * tries))
    resp = await makeRequest()
  }
  if (!resp.ok) {
    // If the API indicates authentication is required, surface a clearer message.
    if (resp.status === 401) {
      const body = await resp.text().catch(() => '')
      throw new Error(`Wallhaven API unauthorized (401). Add a valid API key in settings. Response: ${body}`)
    }
    // Try a fallback: scrape the public random page to find one wallpaper
    try {
      const fallback = await fetchWallhavenRandomFallback(apiKey)
      if (fallback && fallback.length > 0) return fallback
    } catch (e) {
      // include fallback error in thrown message for easier debugging
      const bodyText = await resp.text().catch(() => '')
      throw new Error(`Wallhaven fetch failed: ${resp.status} ${resp.statusText} ${bodyText} | fallbackError: ${String(e)}`)
    }
  }
  const json: any = await resp.json()
  if (!json || !Array.isArray(json.data)) return []
  return json.data.slice(0, options.count ?? 1).map((d: any) => ({ image: d.path, source: d.url, name: d.id }))
}

async function fetchWallhavenRandomFallback(apiKey?: string): Promise<{image: string, source?: string, name?: string}[]> {
  const keywords = Settings.getString('wallhaven', 'keywords') ?? ''
  const url = 'https://wallhaven.cc/random'
  const resp = await fetch(url, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Referer': 'https://wallhaven.cc/' } })
  if (!resp.ok) throw new Error(`Wallhaven fallback failed: ${resp.status} ${resp.statusText}`)
  const html = await resp.text()
  // Find first wallpaper link on the page (support relative and absolute hrefs)
  // Examples: href="/w/3zxrz6" or href="https://wallhaven.cc/w/3zxrz6"
  const linkMatch = html.match(/href=(?:"|')(?:https?:\/\/wallhaven\.cc)?\/(w\/[0-9a-zA-Z_-]+)(?:\?.*?)?(?:"|')/i)
    || html.match(/href=(?:"|')(?:https?:\/\/wallhaven\.cc)?\/w\/([0-9a-zA-Z_-]+)(?:\?.*?)?(?:"|')/i)
  let pageUrl: string | null = null
  if (linkMatch) {
    pageUrl = `https://wallhaven.cc/${linkMatch[1].replace(/^\//, '')}`
  } else {
    // try absolute wallpaper links on thumb images (full /th hosts)
    const m2 = html.match(/href=(?:"|')((?:https?:)?\/\/wallhaven\.cc\/w\/[0-9a-zA-Z_-]+)(?:"|')/i)
    if (m2) pageUrl = m2[1]
    // also check for direct image hosts like w.wallhaven.cc, th.wallhaven.cc
    if (!pageUrl) {
      const m3 = html.match(/https?:\/\/(?:w|th)\.wallhaven\.cc[^"'\s>]+/i)
      if (m3) pageUrl = m3[0]
    }
  }
  if (!pageUrl) throw new Error('Wallhaven fallback: wallpaper link not found')
  // If pageUrl looks like an image, return it; else fetch page and search for full image
  if (pageUrl.match(/https?:\/\/w\.wallhaven\.cc/)) {
    // try to extract id from the pageUrl (e.g. /w/qrz9wl)
    const idMatch = pageUrl.match(/\/w\/(?:.*-)?([0-9a-zA-Z_-]+)/i)
    const name = idMatch ? idMatch[1] : undefined
    return [{ image: pageUrl, name }]
  }
  const pageResp = await fetch(pageUrl, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Referer': 'https://wallhaven.cc/' } })
  if (!pageResp.ok) throw new Error(`Wallhaven fallback page failed: ${pageResp.status} ${pageResp.statusText}`)
  const pageHtml = await pageResp.text()

  // 1) Try meta tags (og:image / twitter:image)
  const metaMatch = pageHtml.match(/<meta[^>]*property=(?:"|')og:image(?:"|')[^>]*content=(?:"|')([^"']+)(?:"|')/i)
    || pageHtml.match(/<meta[^>]*name=(?:"|')twitter:image(?:"|')[^>]*content=(?:"|')([^"']+)(?:"|')/i)
  if (metaMatch && metaMatch[1]) {
    // derive name from pageUrl if possible
    const idMatch = pageUrl?.match(/\/w\/(?:.*-)?([0-9a-zA-Z_-]+)/i)
    const name = idMatch ? idMatch[1] : undefined
    return [{ image: metaMatch[1], source: pageUrl, name }]
  }

  // 2) Look for id="wallpaper" and nearby src/data-src/srcset
  let imgUrl: string | null = null
  const idIndex = pageHtml.search(/id=(?:"|')wallpaper(?:"|')/i)
  if (idIndex !== -1) {
    const areaStart = Math.max(0, idIndex - 1200)
    const areaEnd = Math.min(pageHtml.length, idIndex + 1200)
    const area = pageHtml.slice(areaStart, areaEnd)
    const srcMatch = area.match(/src=(?:"|')([^"']+)(?:"|')/i)
    const dataSrcMatch = area.match(/data-src=(?:"|')([^"']+)(?:"|')/i)
    const srcsetMatch = area.match(/srcset=(?:"|')([^"']+)(?:"|')/i)
    if (srcMatch) imgUrl = srcMatch[1]
    else if (dataSrcMatch) imgUrl = dataSrcMatch[1]
    else if (srcsetMatch) {
      const parts = srcsetMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean)
      const last = parts[parts.length - 1]?.split(' ')[0]
      if (last) imgUrl = last
    }
  }

  // 3) Generic match for wallhaven image hosts if still not found
  if (!imgUrl) {
    const anyImg = pageHtml.match(/https?:\/\/(?:w|th)\.wallhaven\.cc[^"'\s>]+/i)
    if (anyImg) imgUrl = anyImg[0]
  }

  if (imgUrl) {
    const idMatch = pageUrl?.match(/\/w\/(?:.*-)?([0-9a-zA-Z_-]+)/i)
    const name = idMatch ? idMatch[1] : undefined
    return [{ image: imgUrl, source: pageUrl, name }]
  }

  // 4) Last attempt: find wallpaper page id and refetch to get og:image or a full image URL
  const idLink = pageHtml.match(/href=(?:"|')(?:https?:\/\/wallhaven\.cc)?\/(?:w\/)?([0-9a-zA-Z_-]+)(?:\?.*?)?(?:"|')/i)
  if (idLink && idLink[1]) {
    const wallUrl = `https://wallhaven.cc/w/${idLink[1]}`
    const wallResp = await fetch(wallUrl, { headers: { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Referer': 'https://wallhaven.cc/' } })
    if (wallResp.ok) {
      const wallHtml = await wallResp.text()
      const meta2 = wallHtml.match(/<meta[^>]*property=(?:"|')og:image(?:"|')[^>]*content=(?:"|')([^"']+)(?:"|')/i)
      if (meta2 && meta2[1]) return [{ image: meta2[1], source: wallUrl, name: idLink[1] }]
      const img2 = wallHtml.match(/src=(?:"|')([^"']+\/full\/[^"']+)(?:"|')/i) || wallHtml.match(/id=(?:"|')wallpaper(?:"|')[^>]*src=(?:"|')([^"']+)(?:"|')/i)
      if (img2 && img2[1]) return [{ image: img2[1], source: wallUrl, name: idLink[1] }]
    }
  }

  // At this point the wallpaper page didn't contain usable images. Try a wider search page as a last resort.
  // Build a search URL similar to the API call with sorting=random which produces new results.
  // Instead of scraping the search HTML, prefer the API search endpoint which is more stable.
  try {
    // Prefer API search when available. Include apikey in query and header if provided.
    const params: any = { sorting: 'random' }
    if (keywords) params.q = keywords
    if (apiKey) params.apikey = apiKey
    const apiUrl = `https://wallhaven.cc/api/v1/search?${new URLSearchParams(params).toString()}`
    const headers: any = { 'User-Agent': 'RandomWallpaperElectron/1.0', 'Referer': 'https://wallhaven.cc/', 'Accept': 'application/json' }
    if (apiKey) headers['X-API-Key'] = apiKey
    const apiResp = await fetch(apiUrl, { headers })
    if (apiResp.ok) {
      const apiJson: any = await apiResp.json().catch(() => null)
      if (apiJson && Array.isArray(apiJson.data) && apiJson.data.length > 0) {
        // pick a random item from the returned list
        const items = apiJson.data
        const idx = Math.floor(Math.random() * items.length)
        const chosen = items[idx]
        if (chosen && chosen.path) return [{ image: chosen.path, source: chosen.url }]
      }
    }
  } catch (e) {
    // ignore and fall through to final diagnostics
  }

  const snippet = pageHtml.slice(0, 2000).replace(/\s+/g, ' ')
  throw new Error(`Wallhaven fallback: image url not found on ${pageUrl} — snippet: ${snippet}`)
}

