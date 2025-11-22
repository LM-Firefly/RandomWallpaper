import fs from 'fs'
import path from 'path'

export async function getRandomFromLocalFolder(folder: string, count = 1): Promise<string[]> {
  const entries = await fs.promises.readdir(folder, { withFileTypes: true })
  const files = entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(name => ['.jpg', '.jpeg', '.png', '.bmp'].includes(path.extname(name).toLowerCase()))
    .map(name => path.join(folder, name))

  if (files.length === 0) return []
  const shuffled = files.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.max(1, Math.min(count, files.length)))
}
