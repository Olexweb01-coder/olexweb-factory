// Story Shorts in the sketch style (approved 6 Nov 2026): the scene library. A story is a list of beats; each beat has a
// scene, an emotion, the line he says, and a few props (the words on the phone, the proof cards, the stamp…). Timing comes
// from the voice (work/story.json). frame(t, f) returns one 720×1280 SVG frame.
// Every word that comes from a script goes through esc(): scripts are data, never markup.
import { guy, eyeCloseup, room, roughDefs, laptopBack, phone, desk, PAPER, GLASS, INK, RED } from './sketch.mjs'

export const W = 720, H = 1280
export const SCENES = ['yell', 'timejump', 'desk', 'buzz', 'read', 'panic', 'cry', 'idea', 'reveal', 'proof', 'celebrate', 'again']
export const FACE = { panic: 'panic', shock: 'shocked', cry: 'cry', excited: 'happy', happy: 'happy', calm: 'neutral', curious: 'neutral', smug: 'smug', focus: 'focus' }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const L = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
const fit = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s }

export function makeStory(beats, timing, shot, host) {
  const B = beats.map((b, i) => ({ ...b, ...timing.beats[i] }))
  const amp = timing.amp, FPS = timing.fps
  const idx = Object.fromEntries(B.map((b, i) => [b.scene, i]))
  const beatAt = (t) => { let k = 0; for (let i = 0; i < B.length; i++) if (t >= B[i].start - 0.32) k = i; return k }
  const speaking = (t) => B.findIndex((b) => b.text && t >= b.start && t <= b.end)
  const talkAt = (t, f) => { if (speaking(t) < 0) return 0; const a = ((amp[f] || 0) + (amp[f - 1] || 0) * 0.5) / 1.5; return a > 0.07 ? Math.min(1, a * 1.35) : 0 }
  const face = (b, dflt = 'neutral') => FACE[b && b.emotion] || dflt

  function caption(t) {
    const i = B.findIndex((b, k) => b.text && (k === 0 || t >= b.start - 0.05) && t <= b.end + 0.25); if (i < 0) return ''
    const b = B[i], words = esc(b.text).split(' '), k = clamp((t - b.start) / Math.max(0.1, b.end - b.start)) * words.length
    const rows = []; let row = []; for (const w of words) { if ((row.join(' ') + ' ' + w).length > 20 && row.length) { rows.push(row); row = [] } row.push(w) } rows.push(row)
    let n = 0; const pop = ease((t - b.start + 0.05) / 0.15)
    return `<g transform="translate(${W / 2} 230) scale(${0.9 + 0.1 * pop})">${rows.slice(0, 4).map((r, ri) => `<text x="0" y="${ri * 66}" text-anchor="middle" font-family="H" font-weight="900" font-stretch="85%" font-size="58" stroke="${INK}" stroke-width="12" stroke-linejoin="round" paint-order="stroke" fill="#fff">${r.map((w) => { const j = n++; return `<tspan fill="${j < k && j >= k - 1.4 ? GLASS : '#fff'}">${w}</tspan>` }).join(' ')}</text>`).join('')}</g>`
  }
  const deskScene = (ex, o) => `${room(W, H)}${guy(360, 1020, 1.25, ex, 'type', o)}${desk(60, 930, 600)}${laptopBack(330, 924, 1.15)}`
  const phoneOnDesk = (t, buzzing, lit) => `${phone(560 + (buzzing ? Math.sin(t * 90) * 6 : 0), 900, 0.42, `<rect width="136" height="264" rx="12" fill="${lit ? '#fff' : '#333'}"/>`, 80)}${buzzing ? `<g filter="url(#rough)"><path d="M480 860 q-14 18 0 36 M650 860 q14 18 0 36 M466 846 q-24 32 0 64 M664 846 q24 32 0 64" fill="none" ${L(5)}/></g>` : ''}`
  const yell = (t, tt, shk) => { const sh = Math.sin(t * 55) * 7 * (0.4 + tt.talk) * shk; return `<g transform="translate(${sh} ${Math.cos(t * 47) * 4 * shk})">${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vig)"/>${guy(360, 1880, 2.6, 'panic', 'head', { ...tt, shake: true, blink: false })}</g>` }
  const msg = (m = {}) => { const l = (m.lines || []).slice(0, 2).map((x) => fit(x, 12)); return `<rect width="136" height="264" rx="12" fill="#fff"/>${m.from ? `<text x="68" y="34" text-anchor="middle" font-family="H" font-weight="700" font-size="15" fill="#777">${esc(fit(m.from, 14))}</text>` : ''}${l.map((x, i) => `<text x="68" y="${64 + i * 26}" text-anchor="middle" font-family="H" font-weight="800" font-size="20" fill="${INK}">${esc(x)}</text>`).join('')}<text x="68" y="146" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fit(m.big, 8).length > 6 ? 30 : 38}" fill="${RED}">${esc(fit(m.big, 8))}</text><rect x="18" y="190" width="100" height="40" rx="20" fill="${RED}"/>` }
  const pill = (y, text, s = 1) => `<g transform="translate(${W / 2} ${y}) scale(${s})"><rect x="-230" y="-40" width="460" height="80" rx="40" fill="${GLASS}" ${L(6)} filter="url(#rough)"/><text x="0" y="16" text-anchor="middle" font-family="H" font-weight="900" font-size="${text.length > 18 ? 34 : 44}" fill="${INK}">${esc(text)}</text></g>`

  function frame(t, f) {
    const i = beatAt(t), b = B[i], lt = t - b.start, seed = Math.floor(f / 3) % 7 + 1, talk = talkAt(t, f), tt = { t, talk, blink: (t % 3.1) < 0.12 }
    const nod = talk ? Math.sin(t * 11) * 4 * talk : 0, bob = Math.sin(t * 3) * 4, P = b.props || {}
    const defs = `<defs>${roughDefs(seed, 3.4)}<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="${RED}" stop-opacity="0"/><stop offset="1" stop-color="${RED}" stop-opacity=".55"/></radialGradient><radialGradient id="vigB" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#3a6ea5" stop-opacity="0"/><stop offset="1" stop-color="#3a6ea5" stop-opacity=".45"/></radialGradient></defs>`
    let body = '', noCaption = false
    switch (b.scene) {
      case 'yell': body = yell(t, tt, 1); break
      case 'timejump': {
        const p = ease(lt / 0.25), l = (P.label || ['3 MINUTES', 'EARLIER']).slice(0, 2).map((x) => fit(x, 11)); noCaption = true
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/><g transform="translate(${W / 2} ${H / 2}) rotate(-4) scale(${0.6 + 0.4 * p})" opacity="${p}">${l.map((x, k) => `<text x="0" y="${-20 + k * 116}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${x.length > 9 ? 90 : 110}" fill="${k ? RED : INK}">${esc(x)}</text>`).join('')}</g>`
        break
      }
      case 'desk': case 'buzz': {
        const bz = idx.buzz != null ? B[idx.buzz] : null, buzzing = !!bz && ((t > bz.start - 0.3 && t < bz.start + 0.15) || (t > bz.start + 0.3 && t < bz.start + 0.7))
        const typing = b.scene === 'desk' && t < b.end - 0.2 ? Math.sin(t * 20) * 3 : 0, z = 1 + 0.05 * clamp(lt / 4)
        body = `<g transform="translate(${W / 2} ${H / 2}) scale(${z}) translate(${-W / 2} ${-H / 2})">${deskScene(face(b, b.scene === 'desk' ? 'happy' : 'neutral'), { ...tt, bob: typing, headBob: typing * 0.6 + nod, look: b.scene === 'buzz' ? [0.8, 0.6] : [0, 0] })}${phoneOnDesk(t, buzzing, buzzing || b.scene === 'buzz')}
          ${b.scene === 'desk' && P.note ? `<g transform="translate(470 330) rotate(6)"><rect width="190" height="96" rx="6" fill="#f6e8a6" ${L(4)} filter="url(#rough)"/><text x="95" y="64" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fit(P.note, 9).length > 7 ? 30 : 40}" fill="${INK}">${esc(fit(P.note, 9))}</text></g>` : ''}</g>`
        break
      }
      case 'read': {
        const after = t > b.end - 0.1
        body = after ? eyeCloseup(W, H, { t }) + `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${clamp((t - b.end) / 0.3)}"/>`
          : `${room(W, H)}${guy(300, 1640, 1.9, t > b.end - 0.9 ? face(b, 'shocked') : 'neutral', 'rest', { ...tt, headBob: nod, look: [0.9, 0.2] })}${phone(560, 980 - ease(lt / 0.3) * 40, 0.95, msg(P.message), 10)}`
        break
      }
      case 'panic': {
        const sh = Math.sin(t * 55) * 6
        body = `<g transform="translate(${sh} 0)">${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vig)"/>${guy(360, 1240, 1.45, 'panic', 'head', { ...tt, shake: true, blink: false })}</g>`
        break
      }
      case 'cry': {
        const sob = t > b.end ? Math.abs(Math.sin((t - b.end) * 10)) * 10 : 0
        body = `${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vigB)"/>${guy(360, 1290 + sob, 1.45, 'cry', 'rest', { ...tt, headBob: nod + sob * 0.5, blink: false })}${[0, 1].map((q) => { const y = ((t * 260 + q * 120) % 240); return `<path d="M${300 + q * 120} ${780 + y} q-8 14 0 20 q8 -6 0 -20 Z" fill="#8ec9ff" opacity="${1 - y / 240}"/>` }).join('')}`
        break
      }
      case 'idea': {
        const typing = t > b.end ? Math.sin(t * 20) * 3 : 0, bulb = ease(lt / 0.3)
        body = `${deskScene(t > b.end ? 'focus' : face(b, 'smug'), { ...tt, bob: typing, headBob: typing * 0.6 + nod })}<g transform="translate(560 420) scale(${bulb})" filter="url(#rough)"><circle r="54" fill="#ffe27a" ${L(6)}/><rect x="-22" y="48" width="44" height="34" rx="6" fill="#bbb" ${L(5)}/>${[0, 1, 2, 3, 4].map((q) => { const a = -Math.PI / 2 + (q - 2) * 0.5; return `<path d="M${Math.cos(a) * 72} ${Math.sin(a) * 72} L${Math.cos(a) * 100} ${Math.sin(a) * 100}" ${L(6)}/>` }).join('')}</g>`
        break
      }
      case 'reveal': {                                       // the real website (the factory's own screenshot of it)
        const p = ease(lt / 0.35)
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><g filter="url(#rough)"><rect x="34" y="404" width="652" height="440" rx="26" fill="#2a2d30" ${L(7)}/></g>
          <g transform="translate(${W / 2} ${624}) scale(${0.85 + 0.15 * p}) translate(${-W / 2} ${-624})">${shot ? `<image href="${shot}" x="54" y="424" width="612" height="400" preserveAspectRatio="xMidYMin slice"/>` : `<rect x="54" y="424" width="612" height="400" fill="#f4f1ea"/>`}</g>
          ${pill(930, fit(P.pill || host, 24), ease((lt - 0.2) / 0.3))}${guy(120, 1500, 0.95, face(b, 'happy'), 'rest', { ...tt, headBob: nod, look: [1, -0.6] })}`
        break
      }
      case 'proof': {
        const cards = (P.cards || []).slice(0, 3).map((c) => fit(c, 22)), gap = Math.max(0.6, (b.end - b.start) / Math.max(1, cards.length + 0.5))
        const card = (k, txt) => { const p = ease((lt - 0.2 - k * gap) / 0.3); return p ? `<g transform="translate(450 ${560 + k * 120}) scale(${p})"><rect x="-210" y="-42" width="420" height="84" rx="20" fill="#fff" ${L(6)} filter="url(#rough)"/><text x="0" y="14" text-anchor="middle" font-family="H" font-weight="800" font-size="${txt.length > 17 ? 30 : 36}" fill="${INK}">${esc(txt)} ✓</text></g>` : '' }
        body = `${room(W, H)}${cards.map((c, k) => card(k, c)).join('')}${guy(160, 1360, 1.05, face(b, 'smug'), 'point', { ...tt, bob, headBob: nod })}`
        break
      }
      case 'celebrate': {
        const stamp = ease((lt - 0.5) / 0.2), word = fit(P.stamp || 'DONE', 11).toUpperCase()
        const conf = lt > 0.55 ? [...Array(30)].map((_, q) => { const x = (q * 97) % W, y = ((q * 53) % 300) + (lt - 0.55) * 380 * (1 + (q % 3) * 0.3), c = [GLASS, '#f2c94c', '#6fb8ff', '#ff8fb1'][q % 4]; return `<rect x="${x}" y="${y}" width="16" height="10" rx="2" fill="${c}" transform="rotate(${q * 37 + t * 200} ${x + 8} ${y + 5})"/>` }).join('') : ''
        body = `${room(W, H)}${guy(360, 1300, 1.3, 'happy', lt > 0.45 ? 'cheer' : 'rest', { ...tt, bob: lt > 0.55 ? -Math.abs(Math.sin(t * 8)) * 26 : bob, headBob: nod })}
          ${stamp ? `<g transform="translate(${W / 2} 470) rotate(-12) scale(${2 - stamp})" opacity="${stamp}"><rect x="-260" y="-62" width="520" height="124" rx="16" fill="none" stroke="${RED}" stroke-width="12"/><text x="0" y="26" text-anchor="middle" font-family="H" font-weight="900" font-size="${word.length > 9 ? 64 : 82}" fill="${RED}">${esc(word)}</text></g>` : ''}${conf}
          ${lt > 1.2 ? `<g transform="translate(${W / 2} 1180)"><rect x="-240" y="-36" width="480" height="72" rx="36" fill="${INK}"/><text x="0" y="13" text-anchor="middle" font-family="H" font-weight="800" font-size="32" fill="${GLASS}">${esc(fit(P.pill || host, 26))}</text></g>` : ''}`
        break
      }
      case 'again': {                                       // another buzz… and back into the opening shot: the loop
        const z = ease((t - (b.end - 0.25)) / 0.5), buzzing = t > b.start - 0.7 && t < b.start - 0.2
        body = z > 0 ? yell(t, tt, z) : `${deskScene(t > b.start + 0.4 ? 'shocked' : 'neutral', { ...tt, headBob: nod, look: [0.8, 0.6] })}${phoneOnDesk(t, buzzing, true)}`
        break
      }
      default: body = `${room(W, H)}${guy(360, 1250, 1.3, face(b), 'rest', { ...tt, bob, headBob: nod })}`
    }
    return defs + body + (noCaption ? '' : caption(t))
  }
  return { frame, beats: B, fps: FPS }
}
