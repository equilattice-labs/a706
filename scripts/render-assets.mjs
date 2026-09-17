import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { brand } from '../src/data/brand.js'

// Original geometry is the source of truth for identity and campaign assets.
const website = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(website, '..')
const publicAssets = resolve(website, 'public/assets')
const socialAssets = resolve(workspace, 'twitter')
const output = resolve(workspace, 'output/rebrand-2026/assets')
const c = { background: '#101014', panel: '#24232b', accent: '#d7f268', white: '#f5f5ef', muted: '#a5a5ae', line: '#3b3944' }
const sans = 'Arial, Helvetica, sans-serif'
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const text = (x, y, value, size = 24, fill = c.white, extra = '') => `<text x="${x}" y="${y}" font-family="${sans}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`
const headline = (x, y, value, size = 88, fill = c.white, extra = '') => text(x, y, value, size, fill, `font-weight="700" ${extra || 'letter-spacing="-4"'}`)
const label = (x, y, value, fill = c.muted, extra = '') => text(x, y, value, 15, fill, `letter-spacing="2.1" ${extra}`)
const rule = (x, y, width, stroke = c.line) => `<path d="M${x} ${y}h${width}" stroke="${stroke}"/>`
const svg = (w, h, body, bg = c.background, title = brand.name) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${body}</svg>`
const polar = (r, degrees) => [50 + r * Math.cos(degrees * Math.PI / 180), 50 + r * Math.sin(degrees * Math.PI / 180)].map(n => n.toFixed(3)).join(' ')
const arc = (r, start, end) => `M${polar(r, start)} A${r} ${r} 0 0 1 ${polar(r, end)}`
const mark = (primary = c.accent, secondary = c.white) => `${[-90, 30, 150].map(angle => `<path d="${arc(36, angle, angle + 80)}" fill="none" stroke="${primary}" stroke-width="9" stroke-linecap="round"/>`).join('')}<circle cx="50" cy="50" r="8" fill="${secondary}"/>`
const logo = (x, y, size = 1, primary = c.accent, secondary = c.white) => `<g transform="translate(${x} ${y}) scale(${size})">${mark(primary, secondary)}</g>`
const wordmark = (x, y, size = 1) => `${logo(x, y, .6 * size)}${text(x + 73 * size, y + 44 * size, brand.name, 39 * size, c.white, 'font-weight="700" letter-spacing="-1.8"')}`
const arrow = (x, y, size = 1, fill = c.accent) => `<g transform="translate(${x} ${y}) scale(${size})"><path d="M0 38L38 0M6 0H38V32" fill="none" stroke="${fill}" stroke-width="4"/></g>`
const footer = (w, h, note = 'RESEARCH PROTOTYPE / SAMPLE DATA') => `${rule(64, h - 103, w - 128)}${label(64, h - 54, note)}${text(w - 64, h - 54, brand.name, 22, c.white, 'text-anchor="end" font-weight="700"')}`

// Abstract signal fields do not imply actual prices or performance.
const orbit = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><circle r="260" fill="none" stroke="${c.line}"/><circle r="190" fill="none" stroke="${c.line}"/><circle r="116" fill="none" stroke="${c.line}"/><path d="M-287 0H287M0-287V287" stroke="${c.line}" stroke-dasharray="3 10"/><path d="M-251-68A260 260 0 0 1 122-230" fill="none" stroke="${c.accent}" stroke-width="3"/><path d="M-159 104A190 190 0 0 0 180 60" fill="none" stroke="${c.white}" stroke-width="2"/><circle cx="122" cy="-230" r="9" fill="${c.accent}"/><circle cx="-159" cy="104" r="7" fill="${c.white}"/><circle cx="101" cy="-56" r="5" fill="${c.accent}"/><circle r="34" fill="${c.accent}"/><circle r="8" fill="${c.background}"/></g>`
const signalChart = (x, y, width = 540, height = 180) => `<g transform="translate(${x} ${y})"><path d="M0 ${height * .25}H${width}M0 ${height * .5}H${width}M0 ${height * .75}H${width}" stroke="${c.line}" stroke-dasharray="2 7"/><polyline points="${[[0,.7],[.08,.73],[.16,.45],[.23,.57],[.34,.36],[.42,.48],[.5,.19],[.57,.31],[.68,.17],[.76,.42],[.87,.27],[1,.13]].map(([px,py]) => `${px * width},${py * height}`).join(' ')}" fill="none" stroke="${c.accent}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${width}" cy="${height * .13}" r="6" fill="${c.accent}"/></g>`

await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true }), mkdir(output, { recursive: true })])
const favicon = svg(100, 100, `<rect width="100" height="100" rx="24" fill="${c.background}"/>${mark()}`, null, `${brand.name} signal mark`)
await Promise.all([
  writeFile(resolve(publicAssets, `${brand.slug}-mark.svg`), svg(100, 100, mark(), null, `${brand.name} signal mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-mark-light.svg`), svg(100, 100, mark(c.white, c.white), null, `${brand.name} monochrome mark`)),
  writeFile(resolve(publicAssets, `${brand.slug}-favicon.svg`), favicon),
  sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(resolve(publicAssets, `${brand.slug}-favicon-32.png`)),
  sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(resolve(publicAssets, `${brand.slug}-apple-touch-icon.png`)),
])
const avatar = svg(800, 800, `<circle cx="400" cy="400" r="310" fill="none" stroke="${c.line}"/>${logo(120, 120, 5.6)}`, c.background, `${brand.name} avatar`)
// The lower-left 300 px remains clear of essential copy for X's avatar overlay.
const banner = svg(1500, 500, `${orbit(1270, 270, .87)}${wordmark(319, 30, .86)}${label(336, 151, 'A NEW PERSPECTIVE ON MARKETS')}${headline(330, 253, 'Less noise.', 85)}${headline(330, 352, 'More perspective.', 85, c.accent)}${label(336, 442, 'SCAN / TRACK / COMPARE')}`, c.background, `${brand.name} market signal banner`)
const og = svg(1200, 630, `${wordmark(53, 36)}${label(1136, 81, 'MARKET OBSERVATORY', c.muted, 'text-anchor="end"')}${rule(64, 125, 1072)}${orbit(1036, 310, .56)}${headline(59, 279, 'Less noise.', 91)}${headline(59, 390, 'More perspective.', 91, c.accent)}${text(64, 459, brand.positioning, 24, c.muted)}${footer(1200, 630)}`, c.background, `${brand.name} — ${brand.tagline}`)
const post1 = svg(1200, 1200, `${wordmark(51, 40)}${label(1136, 84, '01 / FIND YOUR SIGNAL', c.muted, 'text-anchor="end"')}${rule(64, 127, 1072)}${headline(58, 291, 'Less noise.', 120)}${headline(58, 431, 'More perspective.', 120, c.accent)}${arrow(1037, 175, 1.5)}${text(64, 522, brand.positioning, 31, c.muted)}<rect x="64" y="606" width="1072" height="407" rx="24" fill="${c.panel}"/>${label(102, 661, 'A CLEARER FIELD OF VIEW', c.accent)}${headline(99, 749, 'Markets in motion.', 52)}${text(102, 807, 'Context within reach.', 31, c.muted)}${signalChart(103, 844, 537, 115)}${orbit(915, 810, .58)}${footer(1200, 1200)}`, c.background, `${brand.name} introduction`)
const post2 = svg(1200, 1200, `${wordmark(51, 40)}${label(1136, 84, '02 / FOLLOW THE CONTEXT', c.muted, 'text-anchor="end"')}${rule(64, 127, 1072)}${headline(58, 270, 'Noise moves fast.', 104)}${headline(58, 390, 'Context lasts.', 104, c.accent)}${text(64, 464, 'Build a view, one observation at a time.', 30, c.muted)}${[
  ['01', 'Scan the field.', 'Explore five sample markets.'],
  ['02', 'Track a signal.', 'Keep a watchlist on your device.'],
  ['03', 'Compare the view.', 'Bring two assets into focus.'],
].map(([n, title, note], i) => `<rect x="64" y="${550 + i * 159}" width="1072" height="139" rx="18" fill="${c.panel}"/><circle cx="122" cy="${620 + i * 159}" r="27" fill="${c.background}"/>${text(122, 627 + i * 159, n, 19, c.accent, 'text-anchor="middle"')}${headline(180, 610 + i * 159, title, 36, c.white, 'letter-spacing="-1"')}${text(181, 650 + i * 159, note, 23, c.muted)}${arrow(1058, 600 + i * 159, .65)}`).join('')}${footer(1200, 1200)}`, c.background, `${brand.name} research method`)
const post3 = svg(1200, 1200, `${wordmark(51, 40)}${label(1136, 84, '03 / YOUR OBSERVATORY', c.muted, 'text-anchor="end"')}${rule(64, 127, 1072)}${headline(58, 270, 'A sharper view.', 112)}${headline(58, 395, 'Your own pace.', 112, c.accent)}${text(64, 473, 'A workspace for independent market research.', 30, c.muted)}<rect x="64" y="560" width="490" height="460" rx="24" fill="${c.panel}"/>${label(101, 614, 'KEEP WHAT MATTERS', c.accent)}${orbit(308, 804, .61)}${[
  ['01', 'Search the market'],
  ['02', 'Save your watchlist'],
  ['03', 'Compare two assets'],
  ['04', 'Export an order preview'],
].map(([n, value], i) => `${rule(598, 593 + i * 109, 538)}${label(601, 649 + i * 109, n, c.accent)}${text(649, 650 + i * 109, value, 27, c.white, 'letter-spacing="-.5"')}`).join('')}${footer(1200, 1200, 'ILLUSTRATIVE DATA / NO TRADES ARE SENT')}`, c.background, `${brand.name} product preview`)

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

const kit = `# ${brand.name} social kit

**${brand.tagline}**

**Profile name:** ${brand.name}

**Selected handle:** ${brand.handle}

**Selected domain:** ${brand.domain}

**Bio:** ${brand.positioning} Scan sample markets, track your watchlist, and compare perspectives. Research prototype. No trades are sent.

The domain and handle are registration targets; they do not imply ownership or active channels. See the naming evidence in \`output/rebrand-2026\` for dated public checks and their limitations.

## Identity

Write the name as **${brand.name}**. The name joins clarity with weft: distinct clues woven into an independent view. The original mark uses three open orbital arcs around a single signal point. It represents a changing market field brought into focus. Preserve the geometry and clear space of at least one quarter of its width.

| Token | Value |
| --- | --- |
| Background | #101014 |
| Panel | #24232b |
| Signal | #d7f268 |
| Primary text | #f5f5ef |
| Secondary text | #a5a5ae |
| Dividers | #3b3944 |

Use compact bold sans-serif headlines, restrained uppercase labels, circular tracks, and thin signal lines. Promotional geometry is illustrative artwork; charts do not represent actual prices or investment performance.

## Delivery files

| Asset | Format and size | Use |
| --- | --- | --- |
| ${brand.slug}-avatar | SVG + PNG, 800 × 800 | X avatar |
| ${brand.slug}-banner | SVG + PNG, 1500 × 500 | X header; copy clears avatar overlay |
| post-01-introduction | SVG + JPG, 1200 × 1200 | Brand introduction |
| post-02-method | SVG + JPG, 1200 × 1200 | Scan, track, compare |
| post-03-workspace | SVG + JPG, 1200 × 1200 | Product workflow |
| ../website/public/assets/${brand.slug}-og | SVG + PNG, 1200 × 630 | Link preview |
| ../output/rebrand-2026/assets/${brand.slug}-intro.mp4 | MP4, 1200 × 1200, 8 seconds, 30 fps | Silent introduction |

Website marks, a 32 px favicon, and a 180 px Apple touch icon are in \`website/public/assets\`. The canonical renderer \`website/scripts/render-assets.mjs\` reads the shared brand configuration. From \`website\`, run \`npm run assets\`; add \`-- --video\` to create the motion asset with FFmpeg.

## Three post drafts

These are unpublished drafts. Add the product URL after registration and deployment.

1. ${brand.tagline} Meet ${brand.name}, a market signal atlas for an independent perspective. Scan five sample markets, keep a local watchlist, and compare the context. Research prototype. Illustrative data. No trades are sent.
2. Noise moves fast. Context lasts. Scan the field, track a signal, and compare the view with ${brand.name}. A focused workspace for market research, built around your own questions.
3. A sharper view. Your own pace. Search markets, save a watchlist on your device, compare two assets, and export an illustrative order preview with ${brand.name}. Previews do not send trades.

## Alt text

- **Avatar:** Three lime open orbital arcs around a white signal point on a near-black purple square.
- **Banner:** ${brand.name} with “${brand.tagline}” beside thin circular tracks and lime signal points.
- **Post 1:** Oversized white and lime “${brand.tagline}” lettering. A charcoal panel combines an abstract signal chart and circular tracks. Footer identifies research prototype and sample data.
- **Post 2:** “Noise moves fast. Context lasts.” above three numbered cards: Scan the field, Track a signal, Compare the view.
- **Post 3:** “A sharper view. Your own pace.” above a circular signal field and four actions: search, save, compare, and export an order preview. Footer states data is illustrative and no trades are sent.
- **Video:** The introduction card slowly moves closer over eight silent seconds. The last frame retains the prototype disclosure.

## Voice and product boundaries

Use direct, measured English. Keep *markets*, *watchlist*, *research note*, *signal collections*, and *order preview* consistent. Prices and scores are sample data. No project token, partnership, investment result, or live trading capability is asserted. Preserve factual Robinhood Chain references where the product describes its network.
`
await writeFile(resolve(socialAssets, 'brand-kit.md'), kit)

if (process.argv.includes('--video')) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', resolve(socialAssets, 'post-01-introduction.jpg'), '-vf', "scale=2400:2400,zoompan=z='1+0.000075*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=240:s=1200x1200:fps=30,format=yuv420p", '-t', '8', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', '-an', resolve(output, `${brand.slug}-intro.mp4`)], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`FFmpeg exited with ${result.status}`)
  console.log(`Rendered ${brand.name} introduction: 1200x1200, 8 seconds, 30 fps.`)
}
console.log(`Rendered ${brand.name} identity, social kit, and three original signal-field cards.`)
