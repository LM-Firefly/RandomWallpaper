import fetch from 'node-fetch'

export async function fetchUnsplashRandom(options: any = {}): Promise<{image: string, author?: string}[]> {
  // Support both 'access-key' and legacy 'api-key' names (access-key is Unsplash's Access Key / Client ID)
  const apiKey = options?.accessKey || options?.apiKey || process.env.UNSPLASH_KEY || ''
  // Build query string per Unsplash documentation
  const qs: string[] = []
  const count = options.count ?? 1
  if (count) qs.push(`count=${encodeURIComponent(String(count))}`)
  if (options?.query) qs.push(`query=${encodeURIComponent(options.query)}`)
  if (options?.orientation) qs.push(`orientation=${encodeURIComponent(options.orientation)}`)
  if (options?.collections) qs.push(`collections=${encodeURIComponent(options.collections)}`)
  if (options?.content_filter) qs.push(`content_filter=${encodeURIComponent(options.content_filter)}`)

  // If caller supplied a `query`, use the Search API so results match the query better.
  // The Random endpoint performs a fuzzy/randomized selection which may not be strict enough for tag-like queries.
  const useSearch = !!options?.query
  const url = useSearch
    ? `https://api.unsplash.com/search/photos?${qs.join('&')}&per_page=${encodeURIComponent(String(Math.max(1, count)))}`
    : `https://api.unsplash.com/photos/random?${qs.join('&')}`

  const headers: any = { 'Accept-Version': 'v1', 'Accept': 'application/json' }
  if (apiKey) headers['Authorization'] = `Client-ID ${apiKey}`
  // secretKey is not used for public client requests; removed from client-side usage

  let res
  try {
    res = await fetch(url, { headers })
  } catch (err) {
    throw new Error(`Unsplash fetch failed: ${String(err)}`)
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    // If we have no API key or 401, fall back to the public source.unsplash.com service
    if (res.status === 401 || !apiKey) {
      try {
        const fallbackUrl = options?.query ? `https://source.unsplash.com/random?${encodeURIComponent(options.query)}` : 'https://source.unsplash.com/random'
        const r2 = await fetch(fallbackUrl, { redirect: 'follow' })
        // node-fetch follows redirects — final URL is in r2.url
        if (r2.ok) return [{ image: r2.url, author: 'Unsplash (no key)' }]
      }
      catch (ex) {
        // ignore fallback errors and raise the original one below
      }
    }
    throw new Error(`Unsplash fetch failed: ${res.status} ${res.statusText} ${text}`)
  }

  const body: any = await res.json()
  // If we used search API, results are inside `results` array
  let data: any
  if (useSearch) {
    const hits = Array.isArray(body.results) ? body.results : []
    if (!hits || hits.length === 0) throw new Error('No image found for query')
    // If count > 1, pick up to `count` random items
    if (count > 1) {
      // shuffle and pick
      const shuffled = hits.sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(count, hits.length)).map((d: any) => ({ image: d.urls?.raw || d.urls?.full || d.urls?.regular, author: d.user?.name || d.user?.username || '' }))
    }
    data = hits[Math.floor(Math.random() * hits.length)]
  } else {
    // API returns an array if count>1, otherwise an object
    data = Array.isArray(body) ? body[0] : body
  }
  const imageURL = data?.urls?.raw || data?.urls?.full || data?.urls?.regular
  const author = data?.user?.name || data?.user?.username || ''

  if (!imageURL) throw new Error('No image found')

  return [{ image: imageURL, author }]
}
