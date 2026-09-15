import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// Canonical siftider artwork. All bitmap deliverables are rendered from these SVGs.
const website = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicAssets = resolve(website, 'public/assets')
const socialAssets = resolve(website, '../twitter')
const output = resolve(website, '../output')
const color = {
  paper: '#f4f6f2', ink: '#142e35', teal: '#147d74',
  mint: '#d6eee4', muted: '#647571', line: '#cfdad4',
}
const font = 'Arial, Helvetica, sans-serif'
const tagline = 'Clear signals. Considered moves.'

// A continuous S bends like a tidal channel; the separated short line is its current.
const mark = (stroke = color.ink) => `<g fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M76 20H43C29 20 22 28 22 38S30 53 43 53H57C70 53 78 59 78 68S71 82 57 82H24"/><path d="M44 36h30"/></g>`
const logo = (x, y, scale = 1, stroke = color.ink) => `<g transform="translate(${x} ${y}) scale(${scale})">${mark(stroke)}</g>`
const text = (x, y, value, size = 24, fill = color.ink, extra = '') => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" ${extra}>${value}</text>`
const line = (x1, y, x2, stroke = color.line) => `<path d="M${x1} ${y}H${x2}" stroke="${stroke}" fill="none"/>`
const svg = (width, height, body, background = color.paper, title = 'siftider') => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><title>${title}</title>${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${body}</svg>`
const currents = (x, y, width = 900, height = 300, stroke = color.teal) => `<g transform="translate(${x} ${y}) scale(${width / 900} ${height / 300})" fill="none" stroke="${stroke}" stroke-width="2">${Array.from({ length: 9 }, (_, i) => `<path opacity="${0.14 + i * 0.075}" d="M-40 ${160 + i * 16} C170 ${160 + i * 16} 235 ${48 + i * 12} 445 ${48 + i * 12} S695 ${180 - i * 12} 940 ${-40 + i * 18}"/>`).join('')}</g>`
const footer = (width, height, left = 'ROBINHOOD CHAIN / RESEARCH PREVIEW', dark = false) => `${line(80, height - 124, width - 80, dark ? '#375157' : color.line)}${text(80, height - 72, left, 17, dark ? color.mint : color.muted, 'letter-spacing="2"')}${text(width - 80, height - 72, 'siftider', 28, dark ? color.paper : color.ink, 'font-weight="700" text-anchor="end" letter-spacing="-1"')}`

await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true })])

const markSvg = svg(100, 100, mark(), null, 'siftider mark')
const markLight = svg(100, 100, mark(color.mint), null, 'siftider light mark')
const favicon = svg(100, 100, `<rect width="100" height="100" rx="24" fill="${color.paper}"/>${logo(8, 8, 0.84)}`, null, 'siftider favicon')
await Promise.all([
  writeFile(resolve(publicAssets, 'siftider-mark.svg'), markSvg),
  writeFile(resolve(publicAssets, 'siftider-mark-light.svg'), markLight),
  writeFile(resolve(publicAssets, 'siftider-favicon.svg'), favicon),
  sharp(Buffer.from(favicon)).resize(32, 32).png().toFile(resolve(publicAssets, 'siftider-favicon-32.png')),
  sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(resolve(publicAssets, 'siftider-apple-touch-icon.png')),
])

const avatar = svg(800, 800, `${logo(190, 190, 4.2, color.mint)}`, color.ink, 'siftider avatar')
const banner = svg(1500, 500, `${currents(980, 24, 780, 450)}${logo(266, 128, 0.9)}${text(385, 213, 'siftider', 102, color.ink, 'font-weight="700" letter-spacing="-6"')}${text(391, 275, tagline, 29)}${text(392, 346, 'MARKET RESEARCH, IN PERSPECTIVE.', 14, color.muted, 'letter-spacing="3"')}`, color.paper, 'siftider - Clear signals. Considered moves.')
const og = svg(1200, 630, `${logo(72, 46, 0.57)}${text(146, 88, 'siftider', 43, color.ink, 'font-weight="700" letter-spacing="-2"')}${currents(830, 153, 500, 330)}${text(80, 273, 'Clear signals.', 77, color.ink, 'font-weight="700" letter-spacing="-3"')}${text(80, 367, 'Considered moves.', 77, color.ink, 'font-weight="700" letter-spacing="-3"')}${text(84, 432, 'Market research, in perspective.', 26, color.muted)}${footer(1200, 630)}`, color.paper, 'siftider - Clear signals. Considered moves.')

const firstPost = svg(1200, 1200, `${logo(75, 68, 0.55)}${text(150, 109, 'siftider', 38, color.ink, 'font-weight="700" letter-spacing="-2"')}${text(1120, 108, '01 / PERSPECTIVE', 18, color.muted, 'text-anchor="end" letter-spacing="2"')}${text(80, 286, 'Clear signals.', 94, color.ink, 'font-weight="700" letter-spacing="-4"')}${text(80, 397, 'Considered moves.', 94, color.ink, 'font-weight="700" letter-spacing="-4"')}${text(84, 467, 'Bring market context into focus.', 30, color.muted)}${currents(-10, 580, 1270, 370)}<circle cx="681" cy="705" r="10" fill="${color.teal}"/><circle cx="681" cy="705" r="21" fill="none" stroke="${color.teal}" stroke-opacity=".3"/>${footer(1200, 1200)}`, color.paper, 'siftider - Clear signals. Considered moves.')
const secondPost = svg(1200, 1200, `${logo(75, 68, 0.55)}${text(150, 109, 'siftider', 38, color.ink, 'font-weight="700" letter-spacing="-2"')}${text(1120, 108, '02 / CONTEXT', 18, color.muted, 'text-anchor="end" letter-spacing="2"')}${text(80, 286, 'Consider the', 94, color.ink, 'font-weight="700" letter-spacing="-4"')}${text(80, 397, 'whole picture.', 94, color.ink, 'font-weight="700" letter-spacing="-4"')}${text(84, 467, 'Compare price, activity, and conviction.', 30, color.muted)}<rect x="80" y="596" width="1040" height="362" rx="18" fill="${color.mint}"/>${['OBSERVE', 'COMPARE', 'DECIDE'].map((value, i) => `${text(122 + i * 338, 654, `0${i + 1}`, 18, color.teal)}${text(122 + i * 338, 894, value, 23, color.ink, 'letter-spacing="2"')}`).join('')}<path d="M418 634V917M756 634V917" stroke="${color.teal}" stroke-opacity=".2"/><g fill="none" stroke="${color.teal}" stroke-width="3"><path d="M126 790H195L225 740L255 825L285 766H334"/><path d="M466 809H663M466 775H600M466 741H630"/><path d="m827 780 37 37 93-93"/></g>${footer(1200, 1200)}`, color.paper, 'siftider - Consider the whole picture.')
const thirdPost = svg(1200, 1200, `${logo(75, 68, 0.55, color.mint)}${text(150, 109, 'siftider', 38, color.paper, 'font-weight="700" letter-spacing="-2"')}${text(1120, 108, '03 / INTENTION', 18, color.mint, 'text-anchor="end" letter-spacing="2"')}${text(80, 286, 'Make room', 94, color.paper, 'font-weight="700" letter-spacing="-4"')}${text(80, 397, 'for perspective.', 94, color.paper, 'font-weight="700" letter-spacing="-4"')}${text(84, 467, tagline, 30, color.mint)}${currents(160, 570, 1150, 360, color.mint)}${footer(1200, 1200, 'ROBINHOOD CHAIN / RESEARCH PREVIEW', true)}`, color.ink, 'siftider - Make room for perspective.')

async function renderSet(directory, name, artwork, includeJpeg = true) {
  await writeFile(resolve(directory, `${name}.svg`), artwork)
  await sharp(Buffer.from(artwork)).png().toFile(resolve(directory, `${name}.png`))
  if (includeJpeg) await sharp(Buffer.from(artwork)).jpeg({ quality: 95 }).toFile(resolve(directory, `${name}.jpg`))
}

await renderSet(publicAssets, 'siftider-og', og, false)
await renderSet(socialAssets, 'siftider-avatar', avatar)
await renderSet(socialAssets, 'siftider-banner', banner)
await renderSet(socialAssets, 'post-01-signal', firstPost)
await renderSet(socialAssets, 'post-02-verify', secondPost)
await renderSet(socialAssets, 'post-03-open', thirdPost)

// Optional reproducible launch clip: requires ffmpeg on PATH, no audio track.
if (process.argv.includes('--video')) {
  await mkdir(output, { recursive: true })
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', resolve(socialAssets, 'post-01-signal.png'), '-vf', "scale=2400:2400,zoompan=z='1+0.0001*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=240:s=1200x1200:fps=30,format=yuv420p", '-t', '8', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', '-an', resolve(output, 'post-01-signal.mp4')], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}`)
  console.log('Rendered siftider launch clip: 1200x1200, 8 seconds, 30 fps.')
}
console.log('Rendered siftider marks, favicon, OG card, avatar, banner, and three launch cards.')
