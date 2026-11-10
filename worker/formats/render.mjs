// Renders a format video (worker/formats/): work/fmt_job.json (format + beats) + work/fmt.json/.wav (voice.py) → out/fmt.mp4
// Usage: node worker/formats/render.mjs [--frames 0,90,300]   (frames: test pictures only, into work/fmt_frames)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { makeBuild, W as BW, H as BH } from './build.mjs'
import { makeVersus, W as VW, H as VH } from './versus.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null }
const font = (f) => fs.readFileSync(path.join(here, '..', 'story', 'fonts', f)).toString('base64')
const CSS = () => `@font-face{font-family:H;src:url(data:font/woff2;base64,${font('hubot-sans.woff2')}) format('woff2');font-weight:200 900;font-stretch:75% 125%}
@font-face{font-family:Inter;src:url(data:font/otf;base64,${font('Inter-Black.otf')}) format('opentype');font-weight:900}html,body{margin:0;background:#000}svg{display:block}`

export async function render({ onProgress } = {}) {
  const job = JSON.parse(fs.readFileSync('work/fmt_job.json', 'utf8')), timing = JSON.parse(fs.readFileSync('work/fmt.json', 'utf8'))
  const [make, W, H] = job.format === 'versus' ? [makeVersus, VW, VH] : [makeBuild, BW, BH]
  const story = make(job.beats, timing, job)
  const { chromium } = await import('playwright')
  const only = arg('frames') ? arg('frames').split(',').map(Number) : null
  const dir = 'work/fmt_frames'; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const N = Math.round(timing.secs * timing.fps), PAGES = Math.max(1, Math.min(4, os.cpus().length))
  const b = await chromium.launch(); let done = 0, last = 0
  try {
    await Promise.all(Array.from({ length: PAGES }, async (_, w) => {
      const pg = await b.newPage({ viewport: { width: W, height: H } })
      await pg.setContent(`<!doctype html><style>${CSS()}</style><svg id="s" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg><div style="position:absolute;opacity:0"><span style="font-family:H">.</span><span style="font-family:Inter">.</span></div>`)
      await pg.evaluate(() => document.fonts.ready)
      for (let f = w; f < N; f += PAGES) {
        if (only && !only.includes(f)) continue
        await pg.evaluate(([h]) => { document.getElementById('s').innerHTML = h }, [story.frame(f / timing.fps, f)])
        await pg.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 })
        done++; if (f % 300 === w) process.stdout.write(`  frame ${f}/${N}\n`)
        if (onProgress && done - last >= 60) { last = done; await onProgress(done, N) }
      }
    }))
  } finally { await b.close() }
  if (only) return { frames: only.length }
  fs.mkdirSync('out', { recursive: true })
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(timing.fps), '-i', `${dir}/%05d.jpg`, '-i', 'work/fmt.wav', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', 'out/fmt.mp4'])
  fs.rmSync(dir, { recursive: true, force: true })
  return { frames: N, seconds: timing.secs, out: 'out/fmt.mp4' }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) render().then((r) => console.log('render:', JSON.stringify(r))).catch((e) => { console.error(e.stack); process.exit(1) })
