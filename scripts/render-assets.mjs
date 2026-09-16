import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { brand } from '../src/data/brand.js'

// Loometric master artwork. Raster exports and the video derive from these SVGs.
const website = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// The nested local checkout shares the workspace's social and output folders.
const workspace = resolve(website, basename(website) === 'a706' ? '../..' : '..')
const publicAssets = resolve(website, 'public/assets')
const socialAssets = resolve(workspace, 'twitter')
const output = resolve(workspace, 'output')
const color = { midnight: '#0d141b', panel: '#141e27', lime: '#d9f879', white: '#edf2ed', muted: '#93a3ac', border: '#2b3944' }
const font = 'Segoe UI, Arial, sans-serif'
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

// Two interlocking L-shaped light paths connect a frame to its focus.
const mark = (primary = color.lime, secondary = color.white) => `<path d="M18 16H34V66H84V82H18Z" fill="${primary}"/><path d="M46 16H62V38H84V54H46Z" fill="${secondary}"/>`
const logo = (x, y, scale = 1, primary = color.lime, secondary = color.white) => `<g transform="translate(${x} ${y}) scale(${scale})">${mark(primary, secondary)}</g>`
const text = (x, y, value, size = 24, fill = color.white, extra = '') => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`
const heading = (x, y, value, size = 92, fill = color.white, extra = '') => text(x, y, value, size, fill, `font-weight="700" letter-spacing="-4" ${extra}`)
const label = (x, y, value, fill = color.muted, extra = '') => text(x, y, value, 15, fill, `letter-spacing="2" ${extra}`)
const line = (x1, y, x2, stroke = color.border) => `<path d="M${x1} ${y}H${x2}" stroke="${stroke}" fill="none"/>`
const svg = (width, height, body, background = color.midnight, title = brand.name) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}"><title>${escape(title)}</title>${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${body}</svg>`
const wordmark = (x, y, scale = 1) => `${logo(x, y, .56 * scale)}${text(x + 65 * scale, y + 43 * scale, brand.name, 38 * scale, color.white, 'font-weight="600" letter-spacing="-1.5"')}`
const footer = (width, height, left = 'RESEARCH PROTOTYPE / DEMO DATA') => `${line(80, height - 116, width - 80)}${label(80, height - 62, left)}${text(width - 80, height - 62, brand.name, 26, color.white, 'font-weight="600" text-anchor="end" letter-spacing="-1"')}`
// Abstract connected paths. This identity artwork does not depict performance data.
const weave = (x, y, scale = 1, scaleY = scale) => `<g transform="translate(${x} ${y}) scale(${scale} ${scaleY})" fill="none" stroke="${color.border}" stroke-width="2">${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${i * 58}H${120 + i * 58}V348H560"/>`).join('')}<path d="M0 116H236V232H560" stroke="${color.lime}" stroke-width="4"/><path d="M0 290H120V58H560" stroke="${color.white}" stroke-width="2"/><rect x="228" y="108" width="16" height="16" fill="${color.lime}" stroke="${color.midnight}" stroke-width="4"/><rect x="112" y="282" width="16" height="16" fill="${color.white}" stroke="${color.midnight}" stroke-width="4"/></g>`

await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true })])
const favicon = svg(100, 100, `<rect width="100" height="100" rx="18" fill="${color.midnight}"/>${mark()}`, null, `${brand.name} favicon`)
await Promise.all([
  writeFile(resolve(publicAssets, `${brand.slug}-mark.svg`), svg(100, 100, mark(), null, `${brand.name} connected L mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-mark-light.svg`), svg(100, 100, mark(color.white, color.white), null, `${brand.name} white connected L mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-favicon.svg`), favicon),
  sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(resolve(publicAssets, `${brand.slug}-favicon-32.png`)),
  sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(resolve(publicAssets, `${brand.slug}-apple-touch-icon.png`)),
])
const avatar = svg(800, 800, `<rect x="112" y="112" width="576" height="576" rx="50" fill="${color.panel}"/>${logo(75, 75, 6.5)}`, color.midnight, `${brand.name} avatar`)
const banner = svg(1500, 500, `${weave(1020, 54, 1.15)}${wordmark(310, 54, 1.05)}${heading(322, 229, 'Find clarity in', 68)}${heading(322, 309, 'the connected market.', 65, color.lime)}${text(326, 389, brand.positioning, 26, color.muted)}`, color.midnight, `${brand.name} — ${brand.tagline}`)
const og = svg(1200, 630, `${wordmark(69, 42)}${label(1120, 83, 'INDEPENDENT MARKET OBSERVATORY', color.muted, 'text-anchor="end"')}${heading(80, 234, 'Find clarity in', 76)}${heading(80, 319, 'the connected', 76, color.lime)}${heading(80, 404, 'market.', 76, color.lime)}${text(84, 473, brand.positioning, 23, color.muted)}<rect x="851" y="173" width="270" height="270" rx="20" fill="${color.panel}"/>${logo(874, 196, 2.24)}${footer(1200, 630)}`, color.midnight, `${brand.name} — ${brand.tagline}`)

const firstPost = svg(1200, 1200, `${wordmark(72, 62)}${label(1120, 105, '01 / CONNECT THE CONTEXT', color.muted, 'text-anchor="end"')}${heading(80, 280, 'Find clarity in', 94)}${heading(80, 388, 'the connected', 94, color.lime)}${heading(80, 496, 'market.', 94, color.lime)}${text(84, 574, brand.positioning, 29, color.muted)}${line(80, 635, 1120)}${label(84, 683, 'PUBLIC CONVERSATION')}${label(1120, 683, 'A MORE INFORMED VIEW', color.lime, 'text-anchor="end"')}${weave(80, 731, 1.86, .75)}${footer(1200, 1200)}`, color.midnight, `${brand.name} — ${brand.tagline}`)
const steps = [
  { name: 'Observe', note: 'Notice the conversation.', art: '<path d="M137 791H278M208 720V861"/><rect x="164" y="748" width="86" height="86"/><rect x="192" y="776" width="31" height="31" fill="currentColor" stroke="none"/>' },
  { name: 'Connect', note: 'Bring the context together.', art: '<path d="M487 750H545V820H630V750H669"/><rect x="478" y="741" width="18" height="18" fill="currentColor" stroke="none"/><rect x="660" y="741" width="18" height="18" fill="currentColor" stroke="none"/>' },
  { name: 'Consider', note: 'Build an independent view.', art: '<path d="M847 735H1009V845H924L882 874V845H847Z"/><path d="M877 770H979M877 805H949"/>' },
]
const secondPost = svg(1200, 1200, `${wordmark(72, 62)}${label(1120, 105, '02 / LOOK BEYOND THE SIGNAL', color.muted, 'text-anchor="end"')}${heading(80, 285, 'Context makes', 93)}${heading(80, 392, 'the difference.', 93, color.lime)}${text(84, 484, 'A market observation is a starting point.', 29, color.muted)}${text(84, 531, 'Look at what connects it to the bigger picture.', 29, color.muted)}${steps.map((step, i) => `<rect x="${80 + i * 354}" y="626" width="330" height="368" rx="12" fill="${color.panel}" stroke="${color.border}"/>${label(104 + i * 354, 677, `0${i + 1}`, color.lime)}<g fill="none" stroke="${color.lime}" color="${color.lime}" stroke-width="3" stroke-linejoin="miter">${step.art}</g>${text(104 + i * 354, 926, step.name, 33, color.white, 'font-weight="600" letter-spacing="-1"')}${text(104 + i * 354, 965, step.note, 18, color.muted)}`).join('')}${footer(1200, 1200)}`, color.midnight, `${brand.name} — Context makes the difference.`)
const thirdPost = svg(1200, 1200, `${wordmark(72, 62)}${label(1120, 105, '03 / YOUR RESEARCH, IN FOCUS', color.muted, 'text-anchor="end"')}${heading(80, 285, 'A clearer view.', 94)}${heading(80, 392, 'One step closer.', 91, color.lime)}${text(84, 484, 'Explore. Save. Compare the context.', 29, color.muted)}${['Discover a market.', 'Save your observations.', 'Inspect the details.'].map((value, i) => `${line(80, 602 + i * 113, 714)}${label(84, 666 + i * 113, `0${i + 1}`, color.lime)}${text(145, 668 + i * 113, value, 30)}`).join('')}<rect x="782" y="632" width="336" height="336" rx="22" fill="${color.panel}"/>${logo(798, 648, 3.04)}${label(84, 1008, 'ILLUSTRATIVE DATA. NO TRADES ARE SENT.')}${footer(1200, 1200)}`, color.midnight, `${brand.name} — A clearer view. One step closer.`)

async function renderSet(directory, name, artwork, includeJpeg = true) {
  await writeFile(resolve(directory, `${name}.svg`), artwork)
  await sharp(Buffer.from(artwork)).png().toFile(resolve(directory, `${name}.png`))
  if (includeJpeg) await sharp(Buffer.from(artwork)).jpeg({ quality: 95 }).toFile(resolve(directory, `${name}.jpg`))
}
await renderSet(publicAssets, `${brand.slug}-og`, og, false)
await renderSet(socialAssets, `${brand.slug}-avatar`, avatar)
await renderSet(socialAssets, `${brand.slug}-banner`, banner)
await renderSet(socialAssets, 'post-01-signal', firstPost)
await renderSet(socialAssets, 'post-02-verify', secondPost)
await renderSet(socialAssets, 'post-03-open', thirdPost)

// Optional reproducible introduction: FFmpeg required, no audio track.
if (process.argv.includes('--video')) {
  await mkdir(output, { recursive: true })
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', resolve(socialAssets, 'post-01-signal.png'), '-vf', "scale=2400:2400,zoompan=z='1+0.0001*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=240:s=1200x1200:fps=30,format=yuv420p", '-t', '8', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', '-an', resolve(output, `${brand.slug}-intro.mp4`)], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`)
  console.log(`Rendered ${brand.name} introduction: 1200x1200, 8 seconds, 30 fps.`)
}
console.log(`Rendered ${brand.name} marks, favicon, OG card, avatar, banner, and three social cards.`)
