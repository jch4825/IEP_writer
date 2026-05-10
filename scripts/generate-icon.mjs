import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.resolve(__dirname, '..', 'build')

const svg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" rx="180" ry="180" fill="url(#bg)"/>
  <text
    x="512" y="512"
    font-family="Segoe UI, Arial, sans-serif"
    font-size="380"
    font-weight="800"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="central"
    letter-spacing="-10"
  >IEP</text>
</svg>`

const sizes = [16, 24, 32, 48, 64, 128, 256]

async function main() {
  await fs.mkdir(buildDir, { recursive: true })

  // 1024 PNG (electron-builder also accepts this for fallback)
  const png1024 = await sharp(Buffer.from(svg(1024))).resize(1024, 1024).png().toBuffer()
  await fs.writeFile(path.join(buildDir, 'icon.png'), png1024)

  // Multi-size PNG buffers for ICO
  const pngBuffers = []
  for (const size of sizes) {
    const buf = await sharp(Buffer.from(svg(size))).resize(size, size).png().toBuffer()
    pngBuffers.push(buf)
  }

  const ico = await pngToIco(pngBuffers)
  await fs.writeFile(path.join(buildDir, 'icon.ico'), ico)

  console.log('Generated:')
  console.log('  build/icon.png (1024x1024)')
  console.log(`  build/icon.ico (${sizes.join(', ')})`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
