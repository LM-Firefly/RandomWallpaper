import * as Settings from '../settings.js'

export async function fetchUrlSource(options: any = {}): Promise<{image: string, source?: string}[]> {
  // Accept either options.image or options.imageUrl and fall back to stored setting
  const image = (options.imageUrl ?? options.image) ?? Settings.getString('urlSource', 'image-url')
  if (!image) return []

  // Normalize common cases: allow scheme-less host/path by prefixing https if needed
  let finalImage = String(image).trim()
  try {
    // If it's a valid URL already, leave it
    new URL(finalImage)
  } catch (_) {
    // Try to normalize host-only or host+path strings to https URL
    if (/^[^\/]+\.[^\/]+/.test(finalImage)) finalImage = 'https://' + finalImage
  }

  const source = options.domain ?? (Settings.getString('urlSource', 'domain') || '')
  return [{ image: finalImage, source }]
}
