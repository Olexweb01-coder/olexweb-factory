// Renders a story Short frame by frame (sketch style): work/job.json (beats) + work/story.json (voice timing) +
// work/story.wav (voice, effects, music) + public/shot.png (the real site, optional) → out/raw.mp4
// Usage: node worker/story/render.mjs [--frames 0,40,90]  (frames: test pictures only, no video)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { makeStory, W, H } from './scenes.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null }
const job = JSON.parse(fs.readFileSync('work/job.json', 'utf8')), timing = JSON.parse(fs.readFileSync('work/story.json', 'utf8'))
const shot = fs.existsSync('public/shot.png') ? 'data:image/png;base64,' + fs.readFileSync('public/shot.png').toString('base64') : null
let host = ''; try { host = new URL(job.site.url).host.replace(/^www\./, '') } catch {}
const story = makeStory(job.story.beats, timing, shot, host)
const font = (f) => fs.readFileSync(path.join(here, 'fonts', f)).toString('base64')
const CSS = `@font-face{font-family:H;src:url(data:font/woff2;base64,${font('hubot-sans.woff2')}) format('woff2');font-weight:200 900;font-stretch:75% 125%}
@font-face{font-family:Inter;src:url(data:font/otf;base64,${font('Inter-Black.otf')}) format('opentype');font-weight:900}html,body{margin:0;background:#000}svg{display:block}`

export async function render({ onProgress } = {}) {
  const { chromium } = await import('playwright')
  const only = arg('frames') ? arg('frames').split(',').map(Number) : null
  const dir = 'work/frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: W, height: H } })
  await pg.setContent(`<!doctype html><style>${CSS}</style><svg id="s" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg><div style="position:absolute;opacity:0"><span style="font-family:H">.</span><span style="font-family:Inter;font-weight:900">0</span></div>`)
  await pg.evaluate(() => document.fonts.ready)
  const N = Math.round(timing.secs * timing.fps)
  try {
    for (let f = 0; f < N; f++) {
      if (only && !only.includes(f)) continue
      await pg.evaluate(([h]) => { document.getElementById('s').innerHTML = h }, [story.frame(f / timing.fps, f)])
      await pg.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 })
      if (onProgress && f % 24 === 0) await onProgress(f, N)
    }
  } finally { await b.close() }
  if (only) return { frames: only.length }
  fs.mkdirSync('out', { recursive: true })
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(timing.fps), '-i', `${dir}/%05d.jpg`, '-i', 'work/story.wav', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', 'out/raw.mp4'])
  fs.rmSync(dir, { recursive: true, force: true })
  return { frames: N, seconds: timing.secs }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) render().then((r) => console.log('render:', JSON.stringify(r))).catch((e) => { console.error(e.message); process.exit(1) })
