// Renders a story frame by frame (sketch style): work/job.json (beats) + work/story.json (voice timing) + work/story.wav
// (voice, effects, music) + the real site's screenshot(s) → out/raw.mp4.
//   kind 'story': a 720×1280 Short (public/shot.png). With variant 'fb': Facebook's version (its question ending), from
//                 work/story_fb.json/.wav → out/raw_fb.mp4.
//   kind 'saga':  the long story, 1280×720, one screenshot per chapter (public/shot_<k>.png).
// Frames are drawn by a few browser pages at once (each takes every n-th frame), which is what keeps a 6-minute video quick.
// Usage: node worker/story/render.mjs [--frames 0,40,90] [--variant fb]   (frames: test pictures only, no video)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { makeStory, W as SW, H as SH } from './scenes.mjs'
import { makeWide, WW, WH } from './wide.mjs'
import { makeTale, thumb, TW, TH } from './tale.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null }
const png = (f) => fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : null
const hostOf = (u) => { try { return new URL(u).host.replace(/^www\./, '') } catch { return '' } }
const font = (f) => fs.readFileSync(path.join(here, 'fonts', f)).toString('base64')
const CSS = () => `@font-face{font-family:H;src:url(data:font/woff2;base64,${font('hubot-sans.woff2')}) format('woff2');font-weight:200 900;font-stretch:75% 125%}
@font-face{font-family:Inter;src:url(data:font/otf;base64,${font('Inter-Black.otf')}) format('opentype');font-weight:900}html,body{margin:0;background:#000}svg{display:block}`

export function storyFor(job, variant) {
  const fb = variant === 'fb'
  const timing = JSON.parse(fs.readFileSync(fb ? 'work/story_fb.json' : 'work/story.json', 'utf8'))
  if (job.kind === 'saga' && job.mode === 'tale') return { story: makeTale(job.story.beats, timing, job), timing, W: TW, H: TH, wav: 'work/story.wav', out: 'out/raw.mp4' }   // a real story (Install 22)
  if (job.kind === 'saga') {
    const n = (job.chapters || []).length
    const shots = Array.from({ length: n }, (_, k) => png(`public/shot_${k}.png`)), hosts = (job.chapters || []).map((c) => hostOf(c.site && c.site.url))
    return { story: makeWide(job.story.beats, timing, shots, hosts, job.chapters), timing, W: WW, H: WH, wav: 'work/story.wav', out: 'out/raw.mp4' }
  }
  const beats = fb ? [...job.story.beats.slice(0, -1), job.fb.ask] : job.story.beats
  return { story: makeStory(beats, timing, png('public/shot.png'), hostOf(job.site && job.site.url)), timing, W: SW, H: SH, wav: fb ? 'work/story_fb.wav' : 'work/story.wav', out: fb ? 'out/raw_fb.mp4' : 'out/raw.mp4' }
}

export async function render({ onProgress, variant = arg('variant') } = {}) {
  const job = JSON.parse(fs.readFileSync('work/job.json', 'utf8'))
  const { story, timing, W, H, wav, out } = storyFor(job, variant)
  const { chromium } = await import('playwright')
  const only = arg('frames') ? arg('frames').split(',').map(Number) : null
  const dir = 'work/frames' + (variant === 'fb' ? '_fb' : ''); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
  const N = Math.round(timing.secs * timing.fps), PAGES = Math.max(1, Math.min(4, os.cpus().length))
  const b = await chromium.launch()
  let done = 0, last = 0
  try {
    const pages = await Promise.all(Array.from({ length: PAGES }, async () => {
      const pg = await b.newPage({ viewport: { width: W, height: H } })
      await pg.setContent(`<!doctype html><style>${CSS()}</style><svg id="s" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg><div style="position:absolute;opacity:0"><span style="font-family:H">.</span><span style="font-family:Inter;font-weight:900">0</span></div>`)
      await pg.evaluate(() => document.fonts.ready)
      return pg
    }))
    await Promise.all(pages.map(async (pg, w) => {
      for (let f = w; f < N; f += PAGES) {
        if (only && !only.includes(f)) continue
        await pg.evaluate(([h]) => { document.getElementById('s').innerHTML = h }, [story.frame(f / timing.fps, f)])
        await pg.screenshot({ path: `${dir}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 })
        done++
        if (onProgress && done - last >= 48) { last = done; await onProgress(done, N) }
      }
    }))
  } finally { await b.close() }
  if (only) return { frames: only.length }
  if (job.mode === 'tale' && !variant) await drawThumb(job)
  fs.mkdirSync('out', { recursive: true })
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(timing.fps), '-i', `${dir}/%05d.jpg`, '-i', wav, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out])
  fs.rmSync(dir, { recursive: true, force: true })
  return { frames: N, seconds: timing.secs, width: W, height: H, out }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) render().then((r) => console.log('render:', JSON.stringify(r))).catch((e) => { console.error(e.message); process.exit(1) })

// the thumbnail for a real story (out/thumb.jpg, 1280×720, under 2 MB as YouTube requires)
export async function drawThumb(job) {
  const { chromium } = await import('playwright'), b = await chromium.launch()
  try {
    const pg = await b.newPage({ viewport: { width: TW, height: TH } })
    await pg.setContent(`<!doctype html><style>${CSS()}</style><svg width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">${thumb(job)}</svg><div style="position:absolute;opacity:0"><span style="font-family:H">.</span><span style="font-family:Inter;font-weight:900">0</span></div>`)
    await pg.evaluate(() => document.fonts.ready)
    fs.mkdirSync('out', { recursive: true }); await pg.screenshot({ path: 'out/thumb.jpg', type: 'jpeg', quality: 88 })
  } finally { await b.close() }
  return 'out/thumb.jpg'
}
