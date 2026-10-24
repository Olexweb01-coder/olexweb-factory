// The weekly long video, landscape 1920×1080: the real site large on the left, the stickman on the right, a chapter
// card for each site, word-by-word captions. Built from src/timeline.json (scenes carry "seg": -1 intro, 0..n-1 sites).
import React, { useEffect, useState } from 'react'
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, delayRender, continueRender } from 'remotion'
import TL from './timeline.json'
import { Stickman } from './Stickman'

const G = '#3DDC84', BG = '#0B1020', INK = '#F4F7FB', DIM = '#8A94AD', AMBER = '#FFC94D'
const F = (s) => Math.round(s * TL.fps)
const scenes = TL.scenes.map((s) => ({ ...s, from: F(s.start), to: F(s.end) }))
const chapters = (TL.chapters || []).filter((c) => c.site)
const sceneAt = (f) => { let cur = scenes[0]; for (const s of scenes) if (f >= s.from - 3) cur = s; return cur }
const hostOf = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
const pop = (frame, fps, delay = 0) => spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 160, mass: 0.6 } })

function useFonts() {
  const [h] = useState(() => delayRender('fonts'))
  useEffect(() => {
    const faces = [new FontFace('Hubot', `url(${staticFile('hubot-sans.woff2')})`, { weight: '200 900' }), new FontFace('Mona', `url(${staticFile('mona-sans.woff2')})`, { weight: '200 900' })]
    Promise.all(faces.map((f) => f.load().then((x) => document.fonts.add(x)))).finally(() => continueRender(h))
  }, [h])
}
function Browser({ seg, children, frame }) {
  const { fps } = useVideoConfig(), s = pop(frame, fps, 0), ch = chapters.find((c) => c.seg === seg)
  return (<div style={{ position: 'absolute', left: 60, top: 130, width: 1150, transform: `translateY(${(1 - s) * 60}px)`, opacity: Math.min(1, s * 1.5) }}>
    <div style={{ borderRadius: 30, overflow: 'hidden', background: '#1B2236', border: '3px solid rgba(255,255,255,0.16)', boxShadow: '0 30px 80px rgba(0,0,0,0.55)' }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />)}
        <div style={{ marginLeft: 14, flex: 1, height: 38, borderRadius: 19, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 20px', fontFamily: 'Mona', fontSize: 24, color: '#C9D1E4' }}>🔒&nbsp; {hostOf(ch && ch.site.url)}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1280 / 800', overflow: 'hidden', background: '#000' }}>{children}</div>
    </div>
  </div>)
}
const Zoom = ({ frame, from = 1, to = 1.12, len = 150, oy = '35%', children }) => <div style={{ position: 'absolute', inset: 0, transform: `scale(${interpolate(frame, [0, len], [from, to], { extrapolateRight: 'clamp' })})`, transformOrigin: `50% ${oy}` }}>{children}</div>
function Side({ children }) { return <div style={{ position: 'absolute', left: 1250, right: 50, top: 140, display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center', textAlign: 'center' }}>{children}</div> }
function Big({ text, frame, color = INK, size = 76 }) {
  const { fps } = useVideoConfig(), s = pop(frame, fps, 2)
  return <div style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: size, lineHeight: 1.02, color, transform: `scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 2), textShadow: '0 8px 0 rgba(0,0,0,0.35)' }}>{text}</div>
}
function Site({ f, sc }) {                        // demo / url / infographic / talk inside a chapter
  const { fps } = useVideoConfig()
  const own = scenes.filter((x) => x.seg === sc.seg && x.type === 'demo'), k = Math.max(0, own.findIndex((x) => x.id === sc.id))
  const secs = (TL.clipSeconds && TL.clipSeconds[sc.seg]) || 8, start = Math.floor((k / Math.max(1, own.length)) * secs * TL.fps)
  const media = sc.type === 'demo'
    ? <OffthreadVideo src={staticFile(`clip_${sc.seg}.mp4`)} startFrom={start} muted style={{ width: '100%' }} />
    : <Img src={staticFile(`shot_${sc.seg}.png`)} style={{ width: '100%' }} />
  return (<>
    <Browser seg={sc.seg} frame={f}><Zoom frame={f} oy={k % 2 ? '70%' : '25%'}>{media}</Zoom></Browser>
    <Side>
      {sc.type === 'url' ? <div style={{ transform: `scale(${pop(f, fps, 0)})`, padding: '22px 34px', borderRadius: 24, background: INK, color: BG, fontFamily: 'Hubot', fontWeight: 900, fontSize: 46 }}>{sc.big || hostOf((chapters.find((c) => c.seg === sc.seg) || {}).site?.url)}</div> : null}
      {sc.type === 'infographic' ? <>
        {(sc.stats || []).map((t, i) => <div key={i} style={{ transform: `scale(${pop(f, fps, i * 5)})`, width: '100%', padding: '22px 10px', borderRadius: 28, background: 'rgba(255,255,255,0.06)', border: '3px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: 80, color: i ? AMBER : G, lineHeight: 1 }}>{t.value}</div><div style={{ fontFamily: 'Mona', fontWeight: 600, fontSize: 28, color: DIM, marginTop: 8 }}>{t.label}</div></div>)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>{(sc.chips || []).map((c, i) => <div key={c} style={{ transform: `scale(${pop(f, fps, 8 + i * 4)})`, padding: '14px 28px', borderRadius: 999, fontFamily: 'Hubot', fontWeight: 800, fontSize: 34, color: BG, background: [G, AMBER, '#8EC5FF', '#FF9EC7'][i % 4] }}>{c}</div>)}</div>
      </> : null}
      {sc.big && sc.type !== 'url' && sc.type !== 'infographic' ? <Big text={sc.big} frame={f} color={G} size={60} /> : null}
    </Side>
  </>)
}
function Intro({ f, sc }) {
  const n = chapters.length
  return (<>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, padding: '150px 80px 260px', opacity: 0.35 }}>
      {chapters.slice(0, 6).map((c, i) => <Img key={i} src={staticFile(`shot_${c.seg}.png`)} style={{ width: '100%', borderRadius: 18, transform: `scale(${interpolate(f, [0, 200], [1, 1.06], { extrapolateRight: 'clamp' })})` }} />)}
    </div>
    <div style={{ position: 'absolute', left: 0, right: 420, top: 300, textAlign: 'center' }}>
      <Big text={sc.type === 'hook' ? `${n} ${String(TL.series || '').toUpperCase()}` : ''} frame={f} color={G} size={84} />
      {sc.type === 'hook' ? <div style={{ marginTop: 24 }}><Big text={`VOL. ${TL.volume || 1}`} frame={f - 6} color={AMBER} size={110} /></div> : null}
    </div>
  </>)
}
function Outro({ f }) {
  const { fps } = useVideoConfig(), press = f > 40 && f < 48 ? 0.92 : 1
  return (<div style={{ position: 'absolute', left: 0, right: 420, top: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 }}>
    <Big text="WHICH ONE FIRST?" frame={f} color={AMBER} size={110} />
    <Big text="TELL ME IN THE COMMENTS" frame={f - 8} size={60} />
    <div style={{ transform: `scale(${pop(f, fps, 16) * press})`, padding: '24px 60px', borderRadius: 999, background: f > 44 ? '#2A3147' : '#FF3B3B', color: INK, fontFamily: 'Hubot', fontWeight: 900, fontSize: 56 }}>{f > 44 ? '✓ SUBSCRIBED' : 'SUBSCRIBE'}</div>
  </div>)
}
function ChapterCard({ frame }) {                 // "#3 · PaletteForge" for the first 1.6 s of each chapter
  const first = chapters.map((c) => ({ c, s: scenes.find((x) => x.seg === c.seg) })).find(({ s }) => s && frame >= s.from - 3 && frame < s.from + 48)
  if (!first) return null
  const f = frame - first.s.from, { fps } = useVideoConfig(), s = pop(f, fps, 0), out = interpolate(f, [36, 48], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(11,16,32,${0.75 * out})`, opacity: out }}>
    <div style={{ transform: `scale(${0.6 + 0.4 * s})`, textAlign: 'center' }}>
      <div style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: 150, color: AMBER, lineHeight: 1 }}>#{first.c.seg + 1}</div>
      <div style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: 84, color: INK, marginTop: 14 }}>{first.c.title}</div>
    </div>
  </AbsoluteFill>
}
function Captions({ frame, sc }) {
  const t = frame / TL.fps, words = sc.words || []
  if (!words.length) return null
  let i = words.findIndex((w) => t >= w.s && t < w.e); if (i < 0) i = t < words[0].s ? -1 : words.length - 1
  if (i < 0) return null
  const start = Math.floor(i / 4) * 4, chunk = words.slice(start, start + 4)
  return <div style={{ position: 'absolute', left: 60, width: 1150, top: 958, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 18px' }}>
    {chunk.map((w, k) => { const on = start + k === i
      return <span key={k} style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: 64, color: on ? G : INK, WebkitTextStroke: '3px #000', textShadow: '0 6px 0 rgba(0,0,0,0.45)', textTransform: 'uppercase' }}>{w.w.replace(/[.,!?;:]/g, '')}</span> })}
  </div>
}
export const Long = () => {
  useFonts()
  const frame = useCurrentFrame(), { durationInFrames, fps } = useVideoConfig()
  const sc = sceneAt(frame), idx = scenes.indexOf(sc), prev = scenes[idx - 1], f = frame - sc.from, t = frame / fps
  const talking = (sc.words || []).some((w) => t >= w.s && t < w.e) ? 1 : 0
  const inSite = sc.seg >= 0 && sc.seg < chapters.length
  const chap = chapters.findIndex((c) => c.seg === sc.seg)
  return (<AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '80px 80px', backgroundPosition: `0 ${(frame * 1.2) % 80}px` }} />
    {inSite ? <Site f={f} sc={sc} /> : sc.seg < 0 ? <Intro f={f} sc={sc} /> : <Outro f={f} />}
    <div style={{ position: 'absolute', top: 0, left: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: G }} />
    <div style={{ position: 'absolute', top: 40, left: 60, display: 'flex', gap: 14, alignItems: 'center', padding: '12px 26px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.14)', fontFamily: 'Hubot', fontWeight: 800, fontSize: 28, color: INK }}>
      <span style={{ color: G }}>●</span> {String(TL.series || '').toUpperCase()} <span style={{ color: DIM }}>·</span> <span style={{ color: AMBER }}>VOL. {TL.volume || 1}</span></div>
    {chap >= 0 ? <div style={{ position: 'absolute', top: 40, right: 60, padding: '12px 26px', borderRadius: 999, background: AMBER, color: '#1A1300', fontFamily: 'Hubot', fontWeight: 900, fontSize: 30 }}>{chap + 1} / {chapters.length} · {chapters[chap].title}</div> : null}
    {inSite ? <Captions frame={frame} sc={sc} /> : null}
    <div style={{ position: 'absolute', right: 40, bottom: 0 }}><Stickman frame={frame} pose={sc.pose} prevPose={prev ? prev.pose : 'idle'} since={frame - sc.from + 3} talking={talking} scale={1.25} /></div>
    <div style={{ position: 'absolute', left: 60, bottom: 30, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Hubot', fontWeight: 800, fontSize: 28, color: DIM }}><Img src={staticFile('mark.png')} style={{ height: 38 }} /> olexweb</div>
    <ChapterCard frame={frame} />
    <Audio src={staticFile('music.wav')} volume={0.13} />
    <Audio src={staticFile('voice.wav')} volume={1} />
    {scenes.map((s, i) => <Sequence key={s.id} from={Math.max(0, s.from - 4)} durationInFrames={40}><Audio src={staticFile(i === 0 ? 'sfx_pop.wav' : s.type === 'url' ? 'sfx_ding.wav' : 'sfx_whoosh.wav')} volume={0.3} /></Sequence>)}
  </AbsoluteFill>)
}
