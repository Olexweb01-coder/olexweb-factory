// One Short, built from src/timeline.json (the script plus the voice's timing). Everything is drawn by code, except the
// real recording and screenshot of the site.
import React, { useEffect, useState } from 'react'
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, delayRender, continueRender } from 'remotion'
import TL from './timeline.json'
import { Stickman } from './Stickman'

const G = '#3DDC84', BG = '#0B1020', INK = '#F4F7FB', DIM = '#8A94AD', AMBER = '#FFC94D'
const F = (s) => Math.round(s * TL.fps)
const scenes = TL.scenes.map((s) => ({ ...s, from: F(s.start), to: F(s.end) }))
const demos = scenes.filter((s) => s.type === 'demo')
const sceneAt = (f) => { let cur = scenes[0]; for (const s of scenes) if (f >= s.from - 3) cur = s; return cur }
const HOST = (TL.site && TL.site.host) || ''

function useFonts() {
  const [h] = useState(() => delayRender('fonts'))
  useEffect(() => {
    const faces = [new FontFace('Hubot', `url(${staticFile('hubot-sans.woff2')})`, { weight: '200 900' }), new FontFace('Mona', `url(${staticFile('mona-sans.woff2')})`, { weight: '200 900' })]
    Promise.all(faces.map((f) => f.load().then((x) => document.fonts.add(x)))).finally(() => continueRender(h))
  }, [h])
}
const pop = (frame, fps, delay = 0) => spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 170, mass: 0.6 } })
const fit = (text, max, min, room) => Math.max(min, Math.min(max, Math.floor(room / Math.max(1, String(text).length) * 1.9)))   // bigger for short words

function Backdrop({ frame }) {
  return (<AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.045) 2px, transparent 2px)', backgroundSize: '80px 80px', backgroundPosition: `0 ${(frame * 1.2) % 80}px` }} />
    <div style={{ position: 'absolute', width: 1100, height: 1100, left: -300 + Math.sin(frame / 60) * 80, top: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,220,132,0.20), transparent 65%)' }} />
  </AbsoluteFill>)
}
function Header({ frame, total }) {
  const series = String(TL.series || '').toUpperCase(), small = series.length > 22
  return (<>
    <div style={{ position: 'absolute', top: 0, left: 0, height: 10, width: `${(frame / total) * 100}%`, background: G }} />
    <div style={{ position: 'absolute', top: 70, left: 30, right: 30, display: 'flex', justifyContent: 'center'}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 30px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.14)', fontFamily: 'Hubot', fontWeight: 800, fontSize: small ? 30 : 38, color: INK, letterSpacing: 1, whiteSpace: 'nowrap' }}>
        <span style={{ color: G }}>●</span> {series} <span style={{ color: DIM }}>·</span> <span style={{ color: AMBER }}>PART {TL.part}</span>
      </div>
    </div>
    <PartStamp frame={frame} />
  </>)
}
// The first second and a half: a big "PART 10" stamp, so returning viewers know the series at a glance.
function PartStamp({ frame }) {
  const { fps } = useVideoConfig(), s = pop(frame, fps, 0), out = interpolate(frame, [40, 52], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  if (frame > 52 || !TL.part) return null
  return <div style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: out, zIndex: 5 }}>
    <div style={{ transform: `scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -8 - 3}deg)`, padding: '18px 54px', borderRadius: 28, background: AMBER, color: '#1A1300', fontFamily: 'Hubot', fontWeight: 900, fontSize: 120, lineHeight: 1, boxShadow: '0 18px 0 rgba(0,0,0,0.35)' }}>PART {TL.part}</div>
  </div>
}
function Browser({ children, frame, tilt = 0 }) {
  const { fps } = useVideoConfig(), s = pop(frame, fps, 0)
  return (<div style={{ position: 'absolute', left: 60, right: 60, top: 230, transform: `translateY(${(1 - s) * 120}px) scale(${0.9 + 0.1 * s}) rotate(${tilt}deg)`, opacity: Math.min(1, s * 1.5) }}>
    <div style={{ borderRadius: 34, overflow: 'hidden', background: '#1B2236', border: '3px solid rgba(255,255,255,0.16)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }}>
      <div style={{ height: 74, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}
        <div style={{ marginLeft: 18, flex: 1, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 22px', fontFamily: 'Mona', fontSize: 28, color: '#C9D1E4', overflow: 'hidden', whiteSpace: 'nowrap' }}>🔒&nbsp; {HOST}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1280 / 800', overflow: 'hidden', background: '#000' }}>{children}</div>
    </div>
  </div>)
}
const Zoom = ({ frame, from = 1, to = 1.15, len = 90, ox = '50%', oy = '40%', children }) => (
  <div style={{ position: 'absolute', inset: 0, transform: `scale(${interpolate(frame, [0, len], [from, to], { extrapolateRight: 'clamp' })})`, transformOrigin: `${ox} ${oy}` }}>{children}</div>)
function Big({ text, frame, color = INK, top = 1000, size = 110 }) {
  const { fps } = useVideoConfig(), s = pop(frame, fps, 2)
  return <div style={{ position: 'absolute', top, left: 40, right: 40, textAlign: 'center', fontFamily: 'Hubot', fontWeight: 900, fontSize: size, lineHeight: 1.02, color, transform: `scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * -6}deg)`, opacity: Math.min(1, s * 2), textShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>{text}</div>
}
function Tag({ f, text }) {
  const { fps } = useVideoConfig(), s = pop(f, fps, 4)
  return <div style={{ position: 'absolute', top: 960, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
    <div style={{ transform: `translateX(${(1 - s) * -600}px)`, padding: '18px 40px', borderRadius: 22, background: AMBER, color: '#1A1300', fontFamily: 'Hubot', fontWeight: 900, fontSize: 56, maxWidth: 940, textAlign: 'center' }}>{text}</div>
  </div>
}

// ---------- scene types ----------
function Hook({ f, sc }) {
  const text = sc.big || sc.text
  return (<>
    <Browser frame={f} tilt={-3}><Zoom frame={f} from={1.25} to={1} len={50} oy="0%"><Img src={staticFile('shot.png')} style={{ width: '100%' }} /></Zoom></Browser>
    <Big text={text} frame={f} color={G} top={sc.big ? 980 : 960} size={fit(text, 120, 70, 900)} />
  </>)
}
function Demo({ f, sc }) {
  const k = Math.max(0, demos.findIndex((d) => d.id === sc.id)), n = Math.max(1, demos.length)
  const start = Math.floor((k / n) * (TL.clipSeconds || 8) * TL.fps)            // each demo shows the next part of the recording
  return (<>
    <Browser frame={f}><Zoom frame={f} from={1.0} to={1.16} len={110} oy={k % 2 ? '70%' : '30%'}>
      <OffthreadVideo src={staticFile('clip.mp4')} startFrom={start} muted style={{ width: '100%' }} />
    </Zoom></Browser>
    <Tag f={f} text={sc.big || ['① TAKE A LOOK', '② SEE IT WORK', '③ THAT’S IT'][Math.min(2, k)]} />
  </>)
}
function Stats({ f, sc }) {
  const { fps } = useVideoConfig(), stats = sc.stats || [], chips = sc.chips || []
  return (<div style={{ position: 'absolute', top: 280, left: 60, right: 60 }}>
    {sc.big ? <div style={{ textAlign: 'center', fontFamily: 'Hubot', fontWeight: 900, fontSize: 84, color: INK, marginBottom: 40, transform: `scale(${pop(f, fps, 0)})` }}>{sc.big}</div> : null}
    {stats.length ? <div style={{ display: 'flex', gap: 30 }}>
      {stats.map((st, i) => {
        const s = pop(f, fps, i * 6), num = /^\d[\d,.]*$/.test(String(st.value)) ? Number(String(st.value).replace(/,/g, '')) : null
        const shown = num === null ? st.value : Math.round(interpolate(f, [i * 6, i * 6 + 28], [0, num], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })).toLocaleString('en-GB')
        return <div key={i} style={{ flex: 1, padding: '44px 20px', borderRadius: 36, background: 'rgba(255,255,255,0.06)', border: '3px solid rgba(255,255,255,0.12)', textAlign: 'center', transform: `scale(${s})` }}>
          <div style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: String(shown).length > 6 ? 90 : 140, color: i ? AMBER : G, lineHeight: 1 }}>{shown}</div>
          <div style={{ fontFamily: 'Mona', fontWeight: 600, fontSize: 40, color: DIM, marginTop: 14 }}>{st.label}</div></div> })}
    </div> : null}
    <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginTop: stats.length || sc.big ? 46 : 260 }}>
      {chips.map((c, i) => { const s = pop(f, fps, (stats.length ? 10 : 2) + i * 4), big = !stats.length && !sc.big
        return <div key={c} style={{ transform: `scale(${s})`, padding: big ? '30px 60px' : '20px 44px', borderRadius: 999, fontFamily: 'Hubot', fontWeight: 900, fontSize: big ? 76 : 52, color: BG, background: [G, AMBER, '#8EC5FF', '#FF9EC7'][i % 4] }}>{c}</div> })}
    </div>
  </div>)
}
function Talk({ f, sc }) {
  const { fps } = useVideoConfig()
  return (<>
    <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
      {[0, 1, 2, 3, 4].map((i) => { const s = pop(f, fps, i * 4); return <div key={i} style={{ transform: `translateY(${(1 - s) * 200}px)`, opacity: s }}>
        <Stickman frame={f + i * 9} pose={i % 2 ? 'dancing' : 'idle'} prevPose="idle" since={20} talking={0} scale={0.42} color={i === 2 ? G : INK} /></div> })}
    </div>
    {sc.big ? <Big text={sc.big} frame={f} color={G} top={640} size={fit(sc.big, 130, 70, 900)} /> : null}
  </>)
}
function Url({ f, sc }) {
  const { fps } = useVideoConfig(), text = sc.big || HOST, len = Math.max(10, (sc.to - sc.from) * 0.5)          // typed out within the first half of the scene, however short
  const n = Math.round(interpolate(f, [2, 2 + Math.min(24, len)], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  return (<>
    <Browser frame={f}><Zoom frame={f} from={1.05} to={1.2} len={90} oy="0%"><Img src={staticFile('shot.png')} style={{ width: '100%' }} /></Zoom></Browser>
    <div style={{ position: 'absolute', top: 960, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${pop(f, fps, 0)})`, padding: '28px 50px', borderRadius: 30, background: INK, color: BG, fontFamily: 'Hubot', fontWeight: 900, fontSize: fit(text, 84, 46, 860), maxWidth: 960, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {text.slice(0, n)}<span style={{ opacity: f % 16 < 8 ? 1 : 0, color: G }}>|</span></div>
    </div>
  </>)
}
function Cta({ f, sc }) {
  const { fps } = useVideoConfig(), press = f > 24 && f < 32 ? 0.92 : 1
  return (<>
    <Big text={sc.big || 'FOLLOW'} frame={f} color={AMBER} top={430} size={fit(sc.big || 'FOLLOW', 170, 80, 900)} />
    <Big text="FOR MORE FINDS" frame={f - 6} top={640} size={96} />
    <div style={{ position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${pop(f, fps, 12) * press})`, padding: '26px 64px', borderRadius: 999, background: f > 28 ? '#2A3147' : '#FF3B3B', color: INK, fontFamily: 'Hubot', fontWeight: 900, fontSize: 64 }}>{f > 28 ? '✓ SUBSCRIBED' : 'SUBSCRIBE'}</div>
    </div>
  </>)
}
function Captions({ frame, sc }) {
  const t = frame / TL.fps, words = sc.words || []
  if (!words.length) return null
  let i = words.findIndex((w) => t >= w.s && t < w.e); if (i < 0) i = t < words[0].s ? -1 : words.length - 1
  if (i < 0) return null
  const start = Math.floor(i / 3) * 3, chunk = words.slice(start, start + 3)
  return <div style={{ position: 'absolute', top: 1100, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px' }}>
    {chunk.map((w, k) => { const on = start + k === i, s = on ? interpolate(t - w.s, [0, 0.08], [1.25, 1.08], { extrapolateRight: 'clamp' }) : 1
      return <span key={k} style={{ fontFamily: 'Hubot', fontWeight: 900, fontSize: 88, color: on ? G : INK, transform: `scale(${s})`, display: 'inline-block', WebkitTextStroke: '3px #000', textShadow: '0 8px 0 rgba(0,0,0,0.45)', textTransform: 'uppercase' }}>{w.w.replace(/[.,!?;:]/g, '')}</span> })}
  </div>
}

export const Short = () => {
  useFonts()
  const frame = useCurrentFrame(), { durationInFrames, fps } = useVideoConfig()
  const sc = sceneAt(frame), idx = scenes.indexOf(sc), prev = scenes[idx - 1], f = frame - sc.from, t = frame / fps
  const talking = (sc.words || []).some((w) => t >= w.s && t < w.e) ? 1 : 0
  const Body = { hook: Hook, demo: Demo, infographic: Stats, talk: Talk, url: Url, cta: Cta }[sc.type] || Talk
  const flash = interpolate(f, [-3, 0, 4], [0, 0.35, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (<AbsoluteFill>
    <Backdrop frame={frame} />
    <Body f={f} sc={sc} />
    <Header frame={frame} total={durationInFrames} />
    {sc.type !== 'hook' ? <Captions frame={frame} sc={sc} /> : null}
    <div style={{ position: 'absolute', right: 0, bottom: 30 }}><Stickman frame={frame} pose={sc.pose} prevPose={prev ? prev.pose : 'idle'} since={frame - sc.from + 3} talking={talking} scale={0.95} /></div>
    <div style={{ position: 'absolute', left: 50, bottom: 90, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Hubot', fontWeight: 800, fontSize: 34, color: DIM }}><Img src={staticFile('mark.png')} style={{ height: 46 }} /> olexweb</div>
    <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
    <Audio src={staticFile('music.wav')} volume={0.16} />
    <Audio src={staticFile('voice.wav')} volume={1} />
    {scenes.map((s, i) => <Sequence key={s.id} from={Math.max(0, s.from - 4)} durationInFrames={40}><Audio src={staticFile(i === 0 ? 'sfx_pop.wav' : s.type === 'url' ? 'sfx_ding.wav' : 'sfx_whoosh.wav')} volume={i === 0 ? 0.5 : 0.35} /></Sequence>)}
    {scenes.some((s) => s.type === 'cta') ? <Sequence from={scenes.find((s) => s.type === 'cta').from + 26} durationInFrames={20}><Audio src={staticFile('sfx_click.wav')} volume={0.6} /></Sequence> : null}
  </AbsoluteFill>)
}
