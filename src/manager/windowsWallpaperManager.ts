// `wallpaper` is published as an ESM-only package. Do a dynamic import
// so the module is loaded at runtime and avoids require() ESM errors.
// See: https://nodejs.org/api/esm.html#esm_differences_between_commonjs_and_ecmascript_modules
import path from 'path'

export async function setWallpaperFromFile(filePath: string): Promise<void> {
  if (!filePath) throw new Error('No file');

  // wallpaper package accepts full path. Use a runtime dynamic import via Function
  // so TypeScript does not compile it to require(). This avoids the "ERR_REQUIRE_ESM" error.
  const dynamicImport = new Function('s', 'return import(s)')
  const mod: any = await dynamicImport('wallpaper')
  let setFn: any = mod?.setWallpaper ?? mod?.default?.setWallpaper ?? mod?.set ?? mod?.default?.set
  if (typeof setFn !== 'function') {
    // Last-resort: search for an exported function that looks like a 'set' function
    for (const k of Object.keys(mod)) {
      const v = mod[k]
      if (typeof v === 'function' && /set.*wallpaper|set$/i.test(k)) {
        setFn = v
        break
      }
    }
  }
  if (typeof setFn !== 'function') throw new Error('wallpaper package not available')
  try {
    await setFn(filePath)
    return
  } catch (err) {
    // If wallpaper lib fails, try PowerShell fallback that converts to BMP and sets via registry.
    if (process.platform !== 'win32') throw err
    const child = await import('child_process')
    const bmpPath = path.join(path.dirname(filePath), `${path.basename(filePath)}.bmp`)
    const fp = filePath.replace(/'/g, "''")
    const bp = bmpPath.replace(/'/g, "''")
    // Use execFile with powershell arguments to avoid shell quoting complexities.
    // This will convert to BMP and set via registry, then update system parameters.
    const psArgs = ['-NoProfile', '-NonInteractive', '-Command', `Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('${fp}'); $bmp = New-Object System.Drawing.Bitmap $img; $bmp.Save('${bp}', [System.Drawing.Imaging.ImageFormat]::Bmp); Set-ItemProperty -Path 'HKCU:\\\\Control Panel\\\\Desktop' -Name Wallpaper -Value '${bp}'; RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters`]
    await new Promise<void>((resolve, reject) => {
      child.execFile('powershell', psArgs, (e, _o, stderr) => { if (e) reject(new Error(`PowerShell fallback failed: ${String(stderr || e.message)}`)); else resolve() })
    })
    return
  }
}
