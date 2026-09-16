import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { brand } from '../src/data/brand.js'

// Canonical vector artwork; all raster and motion assets derive from these sources.
const website = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(website, basename(website) === 'a706' ? '../..' : '..')
const publicAssets = resolve(website, 'public/assets')
const socialAssets = resolve(workspace, 'twitter')
const output = resolve(workspace, 'output/current')
const c = { paper: '#f5f3ed', white: '#fffefa', ink: '#202522', blue: '#244bd8', muted: '#60675f', line: '#d7dcd5' }
const sans = 'Segoe UI, Arial, sans-serif'
const serif = 'Georgia, Times New Roman, serif'
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const text = (x, y, value, size = 24, fill = c.ink, extra = '') => `<text x="${x}" y="${y}" font-family="${sans}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`
const headline = (x, y, value, size = 88, fill = c.ink, extra = '') => `<text x="${x}" y="${y}" font-family="${serif}" font-size="${size}" fill="${fill}" letter-spacing="-3" ${extra}>${esc(value)}</text>`
const label = (x, y, value, fill = c.muted, extra = '') => text(x, y, value, 15, fill, `letter-spacing="2" ${extra}`)
const rule = (x, y, width, stroke = c.line) => `<path d="M${x} ${y}h${width}" stroke="${stroke}"/>`
const svg = (w, h, body, bg = c.paper, title = brand.name) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${body}</svg>`

// Two offset index pages and a detached focus tile, independent of old letter marks.
const mark = (primary = c.blue, secondary = c.ink) => `<path d="M14 16H51V28H26V70H14Z" fill="${secondary}"/><path d="M38 36H76V84H38Z M50 48V72H64V48Z" fill="${primary}" fill-rule="evenodd"/><rect x="66" y="16" width="18" height="12" fill="${primary}"/>`
const logo = (x, y, size = 1, primary = c.blue, secondary = c.ink) => `<g transform="translate(${x} ${y}) scale(${size})">${mark(primary, secondary)}</g>`
const wordmark = (x, y, size = 1, ink = c.ink, accent = c.blue) => `${logo(x, y, .58 * size, accent, ink)}${text(x + 69 * size, y + 44 * size, brand.name, 35 * size, ink, 'font-weight="600" letter-spacing="-1.3"')}`
const footer = (w, h, note = 'RESEARCH PROTOTYPE / SAMPLE DATA') => `${rule(70, h - 103, w - 140)}${label(70, h - 56, note)}${text(w - 70, h - 55, brand.name, 24, c.ink, 'text-anchor="end" font-weight="600"')}`
const sheet = (x, y, width, height, angle = 0) => `<g transform="translate(${x} ${y}) rotate(${angle})"><rect width="${width}" height="${height}" fill="${c.white}" stroke="${c.ink}" stroke-width="2"/><rect x="22" y="22" width="28" height="12" fill="${c.blue}"/>${Array.from({ length: 5 }, (_, i) => rule(22, 65 + i * 24, width - 44)).join('')}<path d="M22 ${height - 37}H${width - 22}" stroke="${c.blue}" stroke-width="3"/></g>`
const paperArt = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">${sheet(41, 28, 200, 256, -10)}${sheet(76, 12, 200, 256, 8)}<rect x="236" y="207" width="68" height="68" fill="${c.blue}"/><path d="M253 242H287M273 228L287 242L273 256" fill="none" stroke="${c.white}" stroke-width="3"/></g>`

await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true }), mkdir(output, { recursive: true })])
const favicon = svg(100, 100, `<rect width="100" height="100" rx="12" fill="${c.paper}"/>${mark()}`, null, `${brand.name} index mark`)
await Promise.all([
  writeFile(resolve(publicAssets, `${brand.slug}-mark.svg`), svg(100, 100, mark(), null, `${brand.name} index mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-mark-light.svg`), svg(100, 100, mark(c.white, c.white), null, `${brand.name} white mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-favicon.svg`), favicon),
  sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(resolve(publicAssets, `${brand.slug}-favicon-32.png`)),
  sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(resolve(publicAssets, `${brand.slug}-apple-touch-icon.png`)),
])
const avatar = svg(800, 800, logo(86, 86, 6.28, c.white, c.white), c.blue, `${brand.name} avatar`)
// Keep title clear of X's lower-left avatar crop.
const banner = svg(1500, 500, `${wordmark(317, 48)}${rule(332, 143, 1080)}${label(336, 190, 'THE INDEPENDENT RESEARCH DESK')}${headline(330, 288, 'A little context.', 78)}${headline(330, 377, 'A clearer perspective.', 78, c.blue)}${label(338, 448, 'EXPLORE / COMPARE / CONSIDER')}${paperArt(1130, 185, .77)}`, c.paper, `${brand.name} research desk banner`)
const og = svg(1200, 630, `${wordmark(59, 38)}${label(1128, 80, 'AN INDEPENDENT RESEARCH DESK', c.muted, 'text-anchor="end"')}${rule(70, 130, 1060)}${headline(70, 252, 'A little context.', 84)}${headline(70, 356, 'A clearer', 84, c.blue)}${headline(70, 449, 'perspective.', 84, c.blue)}${paperArt(817, 191, .93)}${footer(1200, 630)}`, c.paper, `${brand.name} — ${brand.tagline}`)
const post1 = svg(1200, 1200, `${wordmark(58, 48)}${label(1125, 90, '01 / THE RESEARCH DESK', c.muted, 'text-anchor="end"')}${rule(70, 137, 1060)}${headline(70, 276, 'A little context.', 106)}${headline(70, 397, 'A clearer', 106, c.blue)}${headline(70, 519, 'perspective.', 106, c.blue)}${text(74, 603, brand.positioning, 29, c.muted)}<rect x="70" y="673" width="1060" height="363" fill="${c.blue}"/>${headline(108, 840, 'Make room', 73, c.white)}${headline(108, 927, 'for a better question.', 62, c.white)}${paperArt(770, 700, 1)}${footer(1200, 1200)}`, c.paper, `${brand.name} introduction`)
const post2 = svg(1200, 1200, `${wordmark(58, 48)}${label(1125, 90, '02 / THE METHOD', c.muted, 'text-anchor="end"')}${rule(70, 137, 1060)}${headline(70, 272, 'Read beyond', 105)}${headline(70, 392, 'the number.', 105, c.blue)}${text(74, 479, 'An observation starts the research. Context carries it forward.', 27, c.muted)}${[
  ['01', 'Explore.', 'Find an asset. Notice what you want to understand.'],
  ['02', 'Compare.', 'Put sample trends and asset details side by side.'],
  ['03', 'Consider.', 'Save your research. Form an independent view.'],
].map(([n, title, note], i) => `${rule(70, 572 + i * 155, 1060)}${label(78, 635 + i * 155, n, c.blue)}${headline(151, 644 + i * 155, title, 55)}${text(502, 635 + i * 155, note, 22, c.muted)}`).join('')}${footer(1200, 1200)}`, c.paper, `${brand.name} research method`)
const post3 = svg(1200, 1200, `${wordmark(58, 48)}${label(1125, 90, '03 / YOUR OWN PERSPECTIVE', c.muted, 'text-anchor="end"')}${rule(70, 137, 1060)}${headline(70, 283, 'Your next idea', 101)}${headline(70, 404, 'starts with a view.', 101, c.blue)}${text(74, 492, 'Search. Save. Compare. Take your time.', 30, c.muted)}<rect x="70" y="582" width="580" height="431" fill="${c.white}" stroke="${c.line}"/>${label(101, 637, 'IN THIS PROTOTYPE')}${['Five sample markets', 'A watchlist on your device', 'Two-asset comparisons', 'Downloadable order previews'].map((v, i) => `${rule(101, 678 + i * 77, 518)}${text(111, 726 + i * 77, v, 25)}${text(603, 726 + i * 77, '↗', 26, c.blue, 'text-anchor="end"')}`).join('')}${paperArt(739, 680, 1.05)}${footer(1200, 1200, 'ILLUSTRATIVE DATA / NO TRADES ARE SENT')}`, c.paper, `${brand.name} product preview`)

async function render(directory, name, artwork, format = 'png') {
  await writeFile(resolve(directory, `${name}.svg`), artwork)
  const pipeline = sharp(Buffer.from(artwork))
  await (format === 'jpg' ? pipeline.jpeg({ quality: 94 }) : pipeline.png()).toFile(resolve(directory, `${name}.${format}`))
}
await render(publicAssets, `${brand.slug}-og`, og)
await render(socialAssets, `${brand.slug}-avatar`, avatar)
await render(socialAssets, `${brand.slug}-banner`, banner)
await render(socialAssets, 'post-01-introduction', post1, 'jpg')
await render(socialAssets, 'post-02-method', post2, 'jpg')
await render(socialAssets, 'post-03-workspace', post3, 'jpg')

if (process.argv.includes('--video')) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', resolve(socialAssets, 'post-01-introduction.jpg'), '-vf', "scale=2400:2400,zoompan=z='1+0.0001*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=240:s=1200x1200:fps=30,format=yuv420p", '-t', '8', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', '-an', resolve(output, `${brand.slug}-intro.mp4`)], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`FFmpeg exited with ${result.status}`)
  console.log(`Rendered ${brand.name} introduction: 1200x1200, 8 seconds, 30 fps.`)
}
console.log(`Rendered ${brand.name} website identity, avatar, banner, and three social cards.`)
