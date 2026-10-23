// The factory worker: takes one approved script from the Olexweb admin and turns it into a finished Short.
//   job → capture (film the real site) → voice (Kokoro) → music (synthesised) → render (Remotion) → upload (4 MiB pieces)
// Every step reports to the admin, so the progress panel there shows exactly where it is. Any failure is reported with
// a plain reason and the run stops. Usage: node worker/run.mjs --id 12 [--step capture]   (OLEX_API, FACTORY_SECRET in env)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { call, report } from './api.mjs'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const ID = Number(arg('id', process.env.JOB_ID)), STEP = arg('step', 'all')
if (!Number.isInteger(ID) || ID < 1) { console.error('Give the script id: --id 12'); process.exit(2) }
for (const d of ['work', 'out', 'public', 'models']) fs.mkdirSync(d, { recursive: true })
const log = (s) => console.log(new Date().toISOString().slice(11, 19) + '  ' + s)
const job = () => JSON.parse(fs.readFileSync('work/job.json', 'utf8'))
function run(cmd, args) {                                                  // a child process; its output is shown, a failure is an error
  return new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let err = ''
    p.stdout.on('data', (d) => process.stdout.write(d)); p.stderr.on('data', (d) => { err += d; process.stderr.write(d) })
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${path.basename(cmd)} failed: ${err.trim().split('\n').slice(-2).join(' ').slice(0, 200)}`)))) })
}
const probe = (f, what) => execFileSync('ffprobe', ['-v', 'error', ...what, '-of', 'csv=p=0', f]).toString().trim()

const STEPS = {
  async job() {
    const j = await call(`/api/factory/job?id=${ID}`, {})
    fs.writeFileSync('work/job.json', JSON.stringify(j, null, 1))
    log(`job: part ${j.part}, ${j.scenes.length} scenes, ${j.site.url.replace(/^https?:\/\//, '').split('/')[0]}`)
  },

  // Film the real site: load it, close a cookie banner if there is one, take a screenshot, then scroll through slowly.
  async capture() {
    const j = job(), url = j.site.url, test = (process.env.FACTORY_TEST_HOSTS || '').split(',').filter(Boolean)
    const u = new URL(url); if (u.protocol !== 'https:' && !test.includes(u.host)) throw new Error('only https sites are filmed')
    await report(ID, { stage: 'capture', total: 4, done: 0, note: 'opening ' + u.host })
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] })
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: 'work/rec', size: { width: 1280, height: 800 } }, locale: 'en-GB' })
    const page = await ctx.newPage(), t0 = Date.now()
    try {
      const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      if (!r || r.status() >= 400) throw new Error(`${u.host} answered ${r ? r.status() : 'nothing'} when filming`)
    } catch (e) { await browser.close(); throw new Error(/answered/.test(e.message) ? e.message : `${u.host} didn’t load for filming (${e.message.split('\n')[0].slice(0, 80)})`) }
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(2000)
    // clear cookie banners and pop-ups (up to three), the way a viewer would
    for (let round = 0; round < 3; round++) {
      let cleared = false
      for (const name of [/^accept( all)?( cookies)?$/i, /^(i )?agree$/i, /^allow all$/i, /^got it!?$/i, /^ok(ay)?$/i, /^continue$/i, /^dismiss$/i, /^close$/i, /^no,? thanks$/i, /^reject( all)?$/i, /^×$/]) {
        const b = page.getByRole('button', { name }).first()
        if (await b.isVisible({ timeout: 250 }).catch(() => false)) { await b.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(500); cleared = true; break }
      }
      if (!cleared) break
    }
    await report(ID, { done: 1, note: 'loaded, taking a screenshot' })
    const startAt = (Date.now() - t0) / 1000
    await page.screenshot({ path: 'public/shot.png' })
    await report(ID, { done: 2, note: 'scrolling through the site' })
    // scroll with the mouse wheel, like a person: it works whether the page scrolls or an inner panel does
    await page.mouse.move(640, 420)
    const y0 = await page.evaluate(() => window.scrollY).catch(() => 0)
    for (let i = 0; i < 80; i++) { await page.mouse.wheel(0, 34); await page.waitForTimeout(95) }
    const moved = await page.evaluate(() => Math.max(window.scrollY, ...[...document.querySelectorAll('*')].filter((e) => e.scrollTop > 0).map((e) => e.scrollTop), 0)).catch(() => 0)
    await page.waitForTimeout(800)
    for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, -60); await page.waitForTimeout(60) }
    const far = Math.round(moved - y0)
    const video = page.video(); await ctx.close(); await browser.close()
    const raw = await video.path()
    await report(ID, { done: 3, note: 'preparing the recording' })
    await run('ffmpeg', ['-v', 'error', '-y', '-ss', String(startAt), '-i', raw, '-vf', 'fps=30,scale=1280:800', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', 'public/clip.mp4'])
    const secs = Number(probe('public/clip.mp4', ['-show_entries', 'format=duration']))
    fs.writeFileSync('work/capture.json', JSON.stringify({ clipSeconds: Math.round(secs * 10) / 10, scrolled: far }))
    await report(ID, { done: 4, bytes: fs.statSync('public/clip.mp4').size })
    log(`capture: ${secs.toFixed(1)}s of ${u.host}, scrolled ${far}px`)
  },

  async voice() {
    if (!fs.existsSync('models/kokoro-v1.0.int8.onnx')) throw new Error('the Kokoro voice model is missing (the workflow downloads it into models/)')
    await report(ID, { stage: 'voice', note: 'Kokoro is reading ' + job().scenes.length + ' scenes' })
    await run('python3', ['worker/voice.py'])
    const tl = JSON.parse(fs.readFileSync('src/timeline.json', 'utf8')), cap = fs.existsSync('work/capture.json') ? JSON.parse(fs.readFileSync('work/capture.json', 'utf8')) : { clipSeconds: 8 }
    tl.clipSeconds = cap.clipSeconds; fs.writeFileSync('src/timeline.json', JSON.stringify(tl, null, 1))
    log(`voice: ${tl.duration}s`)
  },

  async music() {
    await report(ID, { stage: 'music', note: 'music bed and sound effects' })
    await run('python3', ['worker/sound.py'])
  },

  async render() {
    const { bundle } = await import('@remotion/bundler'), { selectComposition, renderMedia } = await import('@remotion/renderer')
    await report(ID, { stage: 'render', note: 'preparing' })
    const serve = await bundle({ entryPoint: path.resolve('src/index.jsx') })
    const comp = await selectComposition({ serveUrl: serve, id: 'Short' })
    const range = arg('frames') ? arg('frames').split('-').map(Number) : null           // local testing only
    log(`render: ${comp.durationInFrames} frames at ${comp.fps} fps, ${comp.width}×${comp.height}, ${os.cpus().length} cores`)
    await report(ID, { total: comp.durationInFrames, done: 0, note: `${comp.durationInFrames} frames` })
    let lastLog = 0
    await renderMedia({ composition: comp, serveUrl: serve, codec: 'h264', crf: 20, outputLocation: 'out/raw.mp4', concurrency: os.cpus().length, ...(range ? { frameRange: range } : {}),
      onProgress: ({ renderedFrames, progress }) => { report(ID, { done: renderedFrames, note: Math.round(progress * 100) + '%' }); if (Date.now() - lastLog > 10000) { lastLog = Date.now(); log(`  ${Math.round(progress * 100)}%`) } } })
    // YouTube plays everything at about -14 LUFS: match it, and put the index at the front so it plays while loading
    await run('ffmpeg', ['-v', 'error', '-y', '-i', 'out/raw.mp4', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', 'out/video.mp4'])
    log(`render: done, ${(fs.statSync('out/video.mp4').size / 1048576).toFixed(1)} MB`)
  },

  async upload() {
    const j = job(), file = 'out/video.mp4', buf = fs.readFileSync(file), size = j.piece || 4 * 1024 * 1024, n = Math.ceil(buf.length / size)
    const seconds = Number(probe(file, ['-show_entries', 'format=duration'])), [width, height] = probe(file, ['-select_streams', 'v:0', '-show_entries', 'stream=width,height']).split(',').map(Number)
    await report(ID, { stage: 'upload', total: n, done: 0, note: `${(buf.length / 1048576).toFixed(1)} MB in ${n} piece${n === 1 ? '' : 's'}` })
    for (let i = 0; i < n; i++) {
      await call(`/api/factory/upload?id=${ID}&n=${i}`, buf.subarray(i * size, (i + 1) * size), { raw: true, tries: 8,      // about 2 minutes of patience per piece
        onRetry: (k, wait, why) => { log(`  piece ${i + 1}: the admin answered ${why}, trying again in ${wait / 1000}s`); return report(ID, { stage: 'upload', note: `piece ${i + 1} of ${n}: retrying (${k} of 7)` }) } })
      await report(ID, { done: i + 1 })
    }
    await call(`/api/factory/finish?id=${ID}`, { pieces: n, bytes: buf.length, seconds: Math.round(seconds * 10) / 10, width, height }, { tries: 6 })
    log(`upload: ${n} piece${n === 1 ? '' : 's'}, ${buf.length} bytes, ${seconds.toFixed(1)}s, done`)
  },
}

const ORDER = ['job', 'capture', 'voice', 'music', 'render', 'upload']
try {
  for (const s of STEP === 'all' ? ORDER : STEP.split(',')) { if (!STEPS[s]) throw new Error('unknown step ' + s); await STEPS[s]() }
} catch (e) {
  log('FAILED: ' + e.message)
  try { await call(`/api/factory/report?id=${ID}`, { error: e.message.slice(0, 260) }, { tries: 3 }) } catch {}
  process.exit(1)
}
