// The factory worker: takes one approved script from the Olexweb admin and turns it into a finished Short.
//   job → capture (film the real site) → voice (Kokoro) → music (synthesised) → render (Remotion) → upload (4 MiB pieces)
// Story Shorts (kind 'story', the sketch style): voice = voice print + Chatterbox acting + mix (worker/story), render =
// worker/story/render.mjs (frames drawn in a browser); music and effects come from the mix. A story also gets Facebook's
// version (its question ending instead of the loop), sent back alongside as a second set of pieces (numbered from 500).
// The long story (kind 'saga'): his whole day in chapters, 1280×720, one site filmed per chapter, same voice and drawing.
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
function run(cmd, args, onLine) {                                          // a child process; its output is shown, a failure is an error
  return new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let err = '', buf = ''
    p.stdout.on('data', (d) => { process.stdout.write(d); if (onLine) { buf += d; const ls = buf.split('\n'); buf = ls.pop(); for (const l of ls) Promise.resolve(onLine(l)).catch(() => {}) } }); p.stderr.on('data', (d) => { err += d; process.stderr.write(d) })
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${path.basename(cmd)} failed: ${err.trim().split('\n').slice(-2).join(' ').slice(0, 200)}`)))) })
}
const STORYLIKE = (k) => k === 'story' || k === 'saga'
// The explainer formats (worker/formats): 'versus' (Poor vs Rich) and 'build' (You build it). One narrator, drawn frames.
const EXPLAIN = () => { try { return job().mode === 'explain' } catch { return false } }
const probe = (f, what) => execFileSync('ffprobe', ['-v', 'error', ...what, '-of', 'csv=p=0', f]).toString().trim()

async function film(url, clipPath, shotPath, label, n, of) {
    const test = (process.env.FACTORY_TEST_HOSTS || '').split(',').filter(Boolean)
    const u = new URL(url); if (u.protocol !== 'https:' && !test.includes(u.host)) throw new Error('only https sites are filmed')
    await report(ID, { stage: 'capture', total: 4 * of, done: 4 * n, note: (label ? label + ': ' : '') + 'opening ' + u.host })
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] })
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: 'work/rec' + n, size: { width: 1280, height: 800 } }, locale: 'en-GB' })
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
    await report(ID, { done: 4 * n + 1, note: (label ? label + ': ' : '') + 'loaded, taking a screenshot' })
    const startAt = (Date.now() - t0) / 1000
    await page.screenshot({ path: shotPath })
    await report(ID, { done: 4 * n + 2, note: (label ? label + ': ' : '') + 'scrolling through the site' })
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
    await report(ID, { done: 4 * n + 3, note: (label ? label + ': ' : '') + 'preparing the recording' })
    await run('ffmpeg', ['-v', 'error', '-y', '-ss', String(startAt), '-i', raw, '-vf', 'fps=30,scale=1280:800', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', clipPath])
    const secs = Number(probe(clipPath, ['-show_entries', 'format=duration']))
    await report(ID, { done: 4 * n + 4, bytes: fs.statSync(clipPath).size })
    log(`capture: ${secs.toFixed(1)}s of ${u.host}, scrolled ${far}px`)
    return Math.round(secs * 10) / 10
}

const STEPS = {
  async job() {
    const j = await call(`/api/factory/job?id=${ID}`, {})
    fs.writeFileSync('work/job.json', JSON.stringify(j, null, 1))
    if (j.mode === 'explain') { log(`job: explainer Short (${j.format}${j.world ? ', ' + j.world : ''}), ${(j.beats || []).length || 'its world’s'} lines: ${j.title}`); return }
    log(`job: ${j.kind === 'long' ? 'long video vol. ' + j.volume : j.kind === 'saga' ? (j.mode === 'tale' ? 'a real story, ' : 'long story, ') + (j.chapters || []).length + ' chapters' : j.kind === 'story' ? 'story Short' + (j.fb ? ' (+ Facebook version)' : '') : 'part ' + j.part}, ${STORYLIKE(j.kind) ? j.story.beats.length + ' beats' : j.scenes.length + ' scenes'}, ${j.mode === 'tale' ? (j.genre || 'story') + ', ' + (j.cast || []).length + ' characters' : j.site.url.replace(/^https?:\/\//, '').split('/')[0]}`)   // a real story has no website (Install 22)
  },

  // Film the real site(s): load, clear pop-ups, screenshot, scroll through with the mouse wheel. A long video films each chapter's site.
  async capture() {
    const j = job()
    if (j.kind === 'long') {
      const sites = (j.chapters || []).filter((c) => c.site), secs = {}
      for (const [i, c] of sites.entries()) secs[c.seg] = await film(c.site.url, `public/clip_${c.seg}.mp4`, `public/shot_${c.seg}.png`, `site ${i + 1} of ${sites.length}`, i, sites.length)
      fs.writeFileSync('work/capture.json', JSON.stringify({ clipSeconds: secs }))
    } else if (j.mode === 'explain') {                                     // an explainer is drawn, nothing to film
      log('capture: an explainer, nothing to film')
    } else if (j.kind === 'saga' && j.mode === 'tale') {                   // a real story films no websites (Install 22)
      log('capture: a story, nothing to film')
    } else if (j.kind === 'saga') {                                        // only the screenshot is used; a site that won't load leaves its frame blank, not the video
      const ch = j.chapters || []
      for (const [k, c] of ch.entries()) {
        try { await film(c.site.url, `work/clip_${k}.mp4`, `public/shot_${k}.png`, `site ${k + 1} of ${ch.length}`, k, ch.length) }
        catch (e) { log(`capture: ${e.message} (chapter ${k + 1} shows no screenshot)`) }
      }
    } else fs.writeFileSync('work/capture.json', JSON.stringify({ clipSeconds: await film(j.site.url, 'public/clip.mp4', 'public/shot.png', '', 0, 1) }))
  },

  async voice() {
    if (!fs.existsSync('models/kokoro-v1.0.onnx')) throw new Error('the Kokoro voice model is missing (the workflow downloads it into models/)')
    if (EXPLAIN()) {                                                       // one narrator, no gaps, music and a whoosh on each step
      const j = job()
      if (j.format === 'build') { const { WORLDS } = await import('./formats/build.mjs'); if (!WORLDS[j.world]) throw new Error(`the factory has no drawing for "${j.world}" yet`); j.beats = WORLDS[j.world] }
      fs.writeFileSync('work/fmt_job.json', JSON.stringify({ format: j.format, voice: j.voice || 'am_michael', speed: j.speed || 1.16, title: j.titleLines, biz: j.biz, beats: j.beats }))
      await report(ID, { stage: 'voice', note: `the narrator reads ${j.beats.length} lines` })
      await run('python3', ['worker/formats/voice.py'])
      log(`voice: ${JSON.parse(fs.readFileSync('work/fmt.json', 'utf8')).secs.toFixed(1)}s`)
      return
    }
    if (STORYLIKE(job().kind)) {                                           // his voice: print → acting (Chatterbox) → mix with effects and music
      const j = job(), lines = [...j.story.beats, ...(j.fb && j.fb.ask ? [j.fb.ask] : [])].filter((b) => (b.text || '').trim()).length
      await report(ID, { stage: 'voice', note: `his voice print and ${lines} backup lines` })
      await run('python3', ['worker/story/voiceprint.py'])
      const cbox = fs.existsSync('.cbox/bin/python') ? '.cbox/bin/python' : null
      if (cbox) {                                                          // every acted line is reported, so a long story never looks stuck
        await report(ID, { stage: 'voice', total: lines, done: 0, note: `acting ${lines} lines (about ${Math.ceil(lines * 0.6)} min)` })
        if (j.kind === 'saga') process.env.ACT_BUDGET = process.env.ACT_BUDGET || '6600'      // 110 minutes at most; the calm lines fall back first
        await run(cbox, ['worker/story/act.py'], (l) => { const m = /^acted (\d+)\/(\d+)/.exec(l); return m ? report(ID, { done: Number(m[1]), note: `acted ${m[1]} of ${m[2]} lines` }) : null })
      } else log('voice: Chatterbox isn’t installed here; the backup voice is used')
      await report(ID, { stage: 'music', note: 'mixing voice, sound effects and music' })
      await run('python3', ['worker/story/mix.py'])
      if (j.kind === 'story' && j.fb && j.fb.ask) await run('python3', ['worker/story/mix.py', 'fb']).catch((e) => log('voice: Facebook’s version couldn’t be mixed (' + e.message + '); Facebook gets the main video'))
      const s = JSON.parse(fs.readFileSync('work/story.json', 'utf8'))
      log(`voice: ${s.secs.toFixed(1)}s, ${s.voice.acted} acted, ${s.voice.backup} backup`)
      return
    }
    await report(ID, { stage: 'voice', note: 'Kokoro is reading ' + job().scenes.length + ' scenes' })
    await run('python3', ['worker/voice.py'])
    const tl = JSON.parse(fs.readFileSync('src/timeline.json', 'utf8')), cap = fs.existsSync('work/capture.json') ? JSON.parse(fs.readFileSync('work/capture.json', 'utf8')) : { clipSeconds: 8 }
    tl.clipSeconds = cap.clipSeconds; fs.writeFileSync('src/timeline.json', JSON.stringify(tl, null, 1))
    log(`voice: ${tl.duration}s`)
  },

  async music() {
    if (STORYLIKE(job().kind) || EXPLAIN()) return                                      // the story mix already has its music and effects
    await report(ID, { stage: 'music', note: 'music bed and sound effects' })
    await run('python3', ['worker/sound.py'])
  },

  async render() {
    if (EXPLAIN()) {
      await report(ID, { stage: 'render', note: 'drawing the frames' })
      const { render: drawFmt } = await import('./formats/render.mjs')
      const r = await drawFmt({ onProgress: (f, n) => report(ID, { total: n, done: f, note: Math.round(100 * f / n) + '%' }) })
      fs.copyFileSync('out/fmt.mp4', 'out/raw.mp4'); log(`render: ${r.frames} frames drawn`)
    } else if (STORYLIKE(job().kind)) {
      await report(ID, { stage: 'render', note: 'drawing the frames' })
      const { render: drawStory } = await import('./story/render.mjs')
      const r = await drawStory({ variant: null, onProgress: (f, n) => report(ID, { total: n, done: f, note: Math.round(100 * f / n) + '%' }) })
      log(`render: ${r.frames} frames drawn, ${r.width}×${r.height}`)
      if (job().kind === 'story' && fs.existsSync('work/story_fb.json')) {     // Facebook's version: a failure here never costs the main video
        try {
          await report(ID, { stage: 'render', note: 'Facebook’s version' })
          const f = await drawStory({ variant: 'fb', onProgress: (d, n) => report(ID, { total: n, done: d, note: 'Facebook’s version ' + Math.round(100 * d / n) + '%' }) })
          await run('ffmpeg', ['-v', 'error', '-y', '-i', 'out/raw_fb.mp4', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', 'out/video_fb.mp4'])
          log(`render: Facebook’s version, ${f.frames} frames`)
        } catch (e) { fs.rmSync('out/video_fb.mp4', { force: true }); log('render: Facebook’s version failed (' + e.message + '); Facebook gets the main video') }
      }
    } else {
    const { bundle } = await import('@remotion/bundler'), { selectComposition, renderMedia } = await import('@remotion/renderer')
    await report(ID, { stage: 'render', note: 'preparing' })
    const serve = await bundle({ entryPoint: path.resolve('src/index.jsx') })
    const comp = await selectComposition({ serveUrl: serve, id: job().kind === 'long' ? 'Long' : 'Short' })
    const range = arg('frames') ? arg('frames').split('-').map(Number) : null           // local testing only
    log(`render: ${comp.durationInFrames} frames at ${comp.fps} fps, ${comp.width}×${comp.height}, ${os.cpus().length} cores`)
    await report(ID, { total: comp.durationInFrames, done: 0, note: `${comp.durationInFrames} frames` })
    let lastLog = 0
    await renderMedia({ composition: comp, serveUrl: serve, codec: 'h264', crf: 20, outputLocation: 'out/raw.mp4', concurrency: os.cpus().length, ...(range ? { frameRange: range } : {}),
      onProgress: ({ renderedFrames, progress }) => { report(ID, { done: renderedFrames, note: Math.round(progress * 100) + '%' }); if (Date.now() - lastLog > 10000) { lastLog = Date.now(); log(`  ${Math.round(progress * 100)}%`) } } })
    }
    // YouTube plays everything at about -14 LUFS: match it, and put the index at the front so it plays while loading
    await run('ffmpeg', ['-v', 'error', '-y', '-i', 'out/raw.mp4', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', 'out/video.mp4'])
    log(`render: done, ${(fs.statSync('out/video.mp4').size / 1048576).toFixed(1)} MB`)
  },

  async upload() {
    const j = job(), file = 'out/video.mp4', buf = fs.readFileSync(file), size = j.piece || 4 * 1024 * 1024, n = Math.ceil(buf.length / size)
    if (n > 400) throw new Error(`the video is too big to send back (${(buf.length / 1048576).toFixed(0)} MB)`)
    const seconds = Number(probe(file, ['-show_entries', 'format=duration'])), [width, height] = probe(file, ['-select_streams', 'v:0', '-show_entries', 'stream=width,height']).split(',').map(Number)
    await report(ID, { stage: 'upload', total: n, done: 0, note: `${(buf.length / 1048576).toFixed(1)} MB in ${n} piece${n === 1 ? '' : 's'}` })
    for (let i = 0; i < n; i++) {
      await call(`/api/factory/upload?id=${ID}&n=${i}`, buf.subarray(i * size, (i + 1) * size), { raw: true, tries: 8,      // about 2 minutes of patience per piece
        onRetry: (k, wait, why) => { log(`  piece ${i + 1}: the admin answered ${why}, trying again in ${wait / 1000}s`); return report(ID, { stage: 'upload', note: `piece ${i + 1} of ${n}: retrying (${k} of 7)` }) } })
      await report(ID, { done: i + 1 })
    }
    // Facebook's version (story Shorts): its own pieces, numbered from 500. If any of it fails, Facebook simply gets the main video.
    let fb = null
    if (fs.existsSync('out/video_fb.mp4')) {
      try {
        const fbuf = fs.readFileSync('out/video_fb.mp4'), m = Math.ceil(fbuf.length / size)
        if (m > 400) throw new Error('too big')
        for (let i = 0; i < m; i++) { await call(`/api/factory/upload?id=${ID}&n=${500 + i}`, fbuf.subarray(i * size, (i + 1) * size), { raw: true, tries: 8 }); await report(ID, { note: `Facebook’s version: piece ${i + 1} of ${m}` }) }
        fb = { pieces: m, bytes: fbuf.length, seconds: Math.round(Number(probe('out/video_fb.mp4', ['-show_entries', 'format=duration'])) * 10) / 10 }
      } catch (e) { log('upload: Facebook’s version wasn’t sent (' + e.message + ')') }
    }
    const tl = fs.existsSync('src/timeline.json') ? JSON.parse(fs.readFileSync('src/timeline.json', 'utf8')) : {}
    let chapters = j.kind === 'long' ? (j.chapters || []).map((c) => { const sc = (tl.scenes || []).find((x) => x.seg === c.seg); return sc ? { title: c.title, start: Math.round(sc.start * 10) / 10 } : null }).filter(Boolean) : undefined
    if (j.kind === 'saga') {                                               // YouTube chapters from the voice timing: Intro, each chapter card, the goodbye
      const tm = JSON.parse(fs.readFileSync('work/story.json', 'utf8')), at = (i) => Math.round(tm.beats[i].start * 10) / 10
      chapters = [{ title: 'Intro', start: 0 }]
      j.story.beats.forEach((b, i) => { if (b.scene === 'chapter' && j.chapters[b.ch]) chapters.push({ title: j.chapters[b.ch].title, start: at(i) }); if (b.scene === 'lesson') chapters.push({ title: j.genre === 'scam' ? 'How to spot it' : 'The lesson', start: at(i) }); if (b.scene === 'outro' && j.mode !== 'tale') chapters.push({ title: 'Your pick?', start: at(i) }) })
    }
    // the thumbnail (real stories): one small piece, number 999; if it fails, YouTube simply picks a frame
    let thumb = null
    if (fs.existsSync('out/thumb.jpg')) {
      try { const tb = fs.readFileSync('out/thumb.jpg'); if (tb.length > size || tb.length > 2 * 1024 * 1024) throw new Error('too big'); await call(`/api/factory/upload?id=${ID}&n=999`, tb, { raw: true, tries: 6 }); thumb = { bytes: tb.length } }
      catch (e) { log('upload: the thumbnail wasn’t sent (' + e.message + ')') }
    }
    await call(`/api/factory/finish?id=${ID}`, { pieces: n, bytes: buf.length, seconds: Math.round(seconds * 10) / 10, width, height, ...(chapters ? { chapters } : {}), ...(fb ? { fb } : {}), ...(thumb ? { thumb } : {}) }, { tries: 6 })
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
