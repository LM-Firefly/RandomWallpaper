import fetch from 'node-fetch'
import * as JSONPath from '../jsonPath.js'
import * as Settings from '../settings.js'

export async function fetchGenericJsonRandom(options: any = {}): Promise<{image: string, source?: string}[]> {
  const requestUrl = options.requestUrl ?? Settings.getString('genericJson', 'request-url')
  if (!requestUrl) return []

  const res = await fetch(requestUrl)
  if (!res.ok) throw new Error('Generic JSON fetch failed')
  const body = await res.json()

  const imagePath = options.imagePath ?? Settings.getString('genericJson', 'image-path')
  const imagePrefix = (options.imagePrefix ?? Settings.getString('genericJson', 'image-prefix')) || ''
  const [returnObject] = JSONPath.getTarget(body, imagePath)
  if (!returnObject) return []

  const imageURL = String(returnObject)
  const final = imageURL.startsWith('http') ? imageURL : (imagePrefix + imageURL)
  return [{ image: final, source: requestUrl }]
}
