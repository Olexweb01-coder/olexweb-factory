// The long story (kind 'saga', Install 13): his whole day in chapters, drawn for the wide screen (1280×720), in the same
// sketch style as the story Shorts. Each chapter is a disaster and the website that saved him; a "My day" note in the
// corner ticks off each one. Scenes: the story scenes (yell, timejump, desk, buzz, read, panic, cry, idea, reveal, proof,
// celebrate, again) laid out for 16:9, plus intro, chapter (a silent title card) and outro.
// Every beat carries "ch": its chapter (-1 the intro, n the outro). Words from the script always go through esc().
import { guy, eyeCloseup, room, roughDefs, laptopBack, phone, desk, PAPER, GLASS, INK, RED } from './sketch.mjs'
import { FACE, esc } from './scenes.mjs'

export const WW = 1280, WH = 720
const W = WW, H = WH
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const L = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
const fit = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s }

export function makeWide(beats, timing, shots, hosts, chapters) {
  const B = beats.map((b, i) => ({ ...b, ...timing.beats[i] }))
  const amp = timing.amp, FPS = timing.fps, CH = chapters || []
  const beatAt = (t) => { let k = 0; for (let i = 0; i < B.length; i++) if (t >= B[i].start - 0.32) k = i; return k }
  const speaking = (t) => B.findIndex((b) => b.text && t >= b.start && t <= b.end)
  const talkAt = (t, f) => { if (speaking(t) < 0) return 0; const a = ((amp[f] || 0) + (amp[f - 1] || 0) * 0.5) / 1.5; return a > 0.07 ? Math.min(1, a * 1.35) : 0 }
  const face = (b, dflt = 'neutral') => FACE[b && b.emotion] || dflt
  const doneAt = CH.map((_, k) => { const c = B.find((b) => b.ch === k && b.scene === 'celebrate'); return c ? c.start + 0.5 : Infinity })
  const nextOf = (i, scene) => { for (let k = i; k < B.length; k++) if (B[k].scene === scene && B[k].ch === B[i].ch) return B[k]; return null }

  // subtitles at the bottom (long videos are watched with sound, but every word is still on screen)
  function caption(t) {
    const i = B.findIndex((b, k) => b.text && (k === 0 || t >= b.start - 0.05) && t <= b.end + 0.25); if (i < 0) return ''
    const b = B[i], words = esc(b.text).split(' '), k = clamp((t - b.start) / Math.max(0.1, b.end - b.start)) * words.length
    const rows = []; let row = []; for (const w of words) { if ((row.join(' ') + ' ' + w).length > 42 && row.length) { rows.push(row); row = [] } row.push(w) } rows.push(row)
    const shown = rows.slice(0, 2), y0 = shown.length > 1 ? 628 : 668; let n = 0
    return `<g>${shown.map((r, ri) => `<text x="${W / 2}" y="${y0 + ri * 50}" text-anchor="middle" font-family="H" font-weight="900" font-stretch="88%" font-size="42" stroke="${INK}" stroke-width="10" stroke-linejoin="round" paint-order="stroke" fill="#fff">${r.map((w) => { const j = n++; return `<tspan fill="${j < k && j >= k - 1.4 ? GLASS : '#fff'}">${w}</tspan>` }).join(' ')}</text>`).join('')}</g>`
  }
  // the day so far: a sticky note, each chapter ticked once its site has saved him
  function dayList(t, x, y, s = 1, cur = -2) {
    if (!CH.length) return ''
    const rows = CH.slice(0, 7).map((c, k) => { const done = t >= doneAt[k], here = k === cur
      return `<text x="22" y="${70 + k * 34}" font-family="H" font-weight="${here ? 900 : 700}" font-size="22" fill="${here ? RED : INK}" opacity="${done || here ? 1 : 0.55}">${done ? '✓' : '○'} ${esc(fit(c.title, 18))}</text>` }).join('')
    return `<g transform="translate(${x} ${y}) rotate(4) scale(${s})"><rect width="270" height="${86 + Math.min(7, CH.length) * 34}" rx="8" fill="#f6e8a6" ${L(4)} filter="url(#rough)"/><text x="22" y="40" font-family="H" font-weight="900" font-size="24" fill="${INK}">MY DAY</text>${rows}</g>`
  }
  const clock = (b) => { const c = CH[b.ch]; return c && c.time ? `<g transform="translate(40 34)"><rect width="${40 + esc(c.time).length * 15}" height="50" rx="12" fill="${INK}"/><text x="20" y="34" font-family="Inter" font-weight="900" font-size="26" fill="#fff">${esc(fit(c.time, 9))}</text></g>` : '' }
  const deskScene = (ex, o, t, b) => `${room(W, H)}${guy(430, 880, 1.1, ex, 'type', o)}${desk(150, 640, 760, 120)}${laptopBack(430, 650, 0.9)}${dayList(t, 975, 200, 1, b.ch)}${clock(b)}`
  const phoneOnDesk = (t, buzzing, lit) => `${phone(790 + (buzzing ? Math.sin(t * 90) * 5 : 0), 600, 0.36, `<rect width="136" height="264" rx="12" fill="${lit ? '#fff' : '#333'}"/>`, 80)}${buzzing ? `<g filter="url(#rough)"><path d="M722 566 q-12 16 0 32 M868 566 q12 16 0 32 M708 552 q-20 28 0 56 M882 552 q20 28 0 56" fill="none" ${L(5)}/></g>` : ''}`
  const yell = (t, tt, shk) => { const sh = Math.sin(t * 55) * 8 * (0.4 + tt.talk) * shk; return `<g transform="translate(${sh} ${Math.cos(t * 47) * 4 * shk})">${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vig)"/>${guy(640, 1060, 1.6, 'panic', 'head', { ...tt, shake: true, blink: false })}</g>` }
  const msg = (m = {}) => { const l = (m.lines || []).slice(0, 2).map((x) => fit(x, 12)); return `<rect width="136" height="264" rx="12" fill="#fff"/>${m.from ? `<text x="68" y="34" text-anchor="middle" font-family="H" font-weight="700" font-size="15" fill="#777">${esc(fit(m.from, 14))}</text>` : ''}${l.map((x, i) => `<text x="68" y="${64 + i * 26}" text-anchor="middle" font-family="H" font-weight="800" font-size="20" fill="${INK}">${esc(x)}</text>`).join('')}${m.big ? `<text x="68" y="${l.length ? 150 : 110}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fit(m.big, 8).length > 6 ? 26 : 32}" fill="${RED}">${esc(fit(m.big, 8))}</text>` : ''}` }
  const pill = (x, y, text, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-230" y="-34" width="460" height="68" rx="34" fill="${GLASS}" ${L(6)} filter="url(#rough)"/><text x="0" y="13" text-anchor="middle" font-family="H" font-weight="900" font-size="${text.length > 18 ? 30 : 38}" fill="${INK}">${esc(text)}</text></g>`

  function frame(t, f) {
    const i = beatAt(t), b = B[i], lt = t - b.start, seed = Math.floor(f / 3) % 7 + 1, talk = talkAt(t, f), tt = { t, talk, blink: (t % 3.1) < 0.12 }
    const nod = talk ? Math.sin(t * 11) * 4 * talk : 0, bob = Math.sin(t * 3) * 4, P = b.props || {}
    const shot = shots[b.ch] || null, host = hosts[b.ch] || ''
    const defs = `<defs>${roughDefs(seed, 3.4)}<radialGradient id="vig" cx=".5" cy=".5" r=".8"><stop offset=".55" stop-color="${RED}" stop-opacity="0"/><stop offset="1" stop-color="${RED}" stop-opacity=".55"/></radialGradient><radialGradient id="vigB" cx=".5" cy=".5" r=".8"><stop offset=".5" stop-color="#3a6ea5" stop-opacity="0"/><stop offset="1" stop-color="#3a6ea5" stop-opacity=".45"/></radialGradient></defs>`
    let body = '', noCaption = false
    switch (b.scene) {
      case 'intro': {                                         // hello, and the day ahead (the list still empty)
        body = `${room(W, H)}${guy(470, 860, 1.05, face(b, 'happy'), lt < 1.6 ? 'wave' : 'rest', { ...tt, bob, headBob: nod })}${dayList(t, 820, 170, 1.15, -2)}`
        break
      }
      case 'chapter': {                                       // a silent title card: CHAPTER 2 · 9:14 AM · the title
        const p = ease(lt / 0.3), c = CH[b.ch] || {}; noCaption = true
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/>
          <g transform="translate(${W / 2 - 150} ${H / 2}) rotate(-3) scale(${0.7 + 0.3 * p})" opacity="${p}">
            <text x="0" y="-70" text-anchor="middle" font-family="Inter" font-weight="900" font-size="92" fill="${INK}">CHAPTER ${Number(b.ch) + 1}</text>
            <text x="0" y="20" text-anchor="middle" font-family="H" font-weight="900" font-stretch="90%" font-size="${fit(c.title, 26).length > 20 ? 50 : 60}" fill="${INK}">${esc(fit(c.title, 26))}</text>
            ${c.time ? `<g transform="translate(-90 60)"><rect width="180" height="58" rx="14" fill="${RED}"/><text x="90" y="41" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#fff">${esc(fit(c.time, 9))}</text></g>` : ''}</g>
          ${dayList(t, 900, 150, 1, b.ch)}`
        break
      }
      case 'yell': body = yell(t, tt, 1); break
      case 'timejump': {
        const p = ease(lt / 0.25), l = (P.label || ['3 MINUTES', 'EARLIER']).slice(0, 2).map((x) => fit(x, 11)); noCaption = true
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/><g transform="translate(${W / 2} ${H / 2}) rotate(-4) scale(${0.6 + 0.4 * p})" opacity="${p}">${l.map((x, k) => `<text x="0" y="${-30 + k * 120}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="112" fill="${k ? RED : INK}">${esc(x)}</text>`).join('')}</g>`
        break
      }
      case 'desk': case 'buzz': case 'again': {
        const bz = b.scene === 'desk' ? nextOf(i, 'buzz') : b, buzzing = !!bz && ((t > bz.start - 0.3 && t < bz.start + 0.15) || (t > bz.start + 0.3 && t < bz.start + 0.7))
        const typing = b.scene === 'desk' && t < b.end - 0.2 ? Math.sin(t * 20) * 3 : 0, z = 1 + 0.04 * clamp(lt / 4)
        const ex = b.scene === 'again' ? (t > b.start + 0.4 ? 'shocked' : 'neutral') : face(b, b.scene === 'desk' ? 'happy' : 'neutral')
        body = `<g transform="translate(${W / 2} ${H / 2}) scale(${z}) translate(${-W / 2} ${-H / 2})">${deskScene(ex, { ...tt, bob: typing, headBob: typing * 0.6 + nod, look: b.scene === 'desk' ? [0, 0] : [0.8, 0.6] }, t, b)}${phoneOnDesk(t, buzzing, buzzing || b.scene !== 'desk')}
          ${b.scene === 'desk' && P.note ? `<g transform="translate(600 120) rotate(6)"><rect width="190" height="96" rx="6" fill="#f6e8a6" ${L(4)} filter="url(#rough)"/><text x="95" y="64" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fit(P.note, 9).length > 7 ? 30 : 40}" fill="${INK}">${esc(fit(P.note, 9))}</text></g>` : ''}</g>`
        break
      }
      case 'read': {
        const after = t > b.end - 0.1
        body = after ? eyeCloseup(W, H, { t }) + `<rect width="${W}" height="${H}" fill="url(#vig)" opacity="${clamp((t - b.end) / 0.3)}"/>`
          : `${room(W, H)}${guy(400, 1120, 1.5, t > b.end - 0.9 ? face(b, 'shocked') : 'neutral', 'rest', { ...tt, headBob: nod, look: [0.9, 0.2] })}${phone(880, 360 - ease(lt / 0.3) * 24, 1.0, msg(P.message), 8)}`
        break
      }
      case 'panic': {
        const sh = Math.sin(t * 55) * 6
        body = `<g transform="translate(${sh} 0)">${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vig)"/>${guy(640, 1000, 1.3, 'panic', 'head', { ...tt, shake: true, blink: false })}</g>`
        break
      }
      case 'cry': {
        const sob = t > b.end ? Math.abs(Math.sin((t - b.end) * 10)) * 8 : 0
        body = `${room(W, H)}<rect width="${W}" height="${H}" fill="url(#vigB)"/>${guy(640, 1040 + sob, 1.3, 'cry', 'rest', { ...tt, headBob: nod + sob * 0.5, blink: false })}${[0, 1].map((q) => { const y = ((t * 220 + q * 110) % 200); return `<path d="M${592 + q * 96} ${560 + y} q-8 14 0 20 q8 -6 0 -20 Z" fill="#8ec9ff" opacity="${1 - y / 200}"/>` }).join('')}`
        break
      }
      case 'idea': {
        const typing = t > b.end ? Math.sin(t * 20) * 3 : 0, bulb = ease(lt / 0.3)
        body = `${deskScene(t > b.end ? 'focus' : face(b, 'smug'), { ...tt, bob: typing, headBob: typing * 0.6 + nod }, t, b)}<g transform="translate(640 150) scale(${bulb})" filter="url(#rough)"><circle r="54" fill="#ffe27a" ${L(6)}/><rect x="-22" y="48" width="44" height="34" rx="6" fill="#bbb" ${L(5)}/>${[0, 1, 2, 3, 4].map((q) => { const a = -Math.PI / 2 + (q - 2) * 0.5; return `<path d="M${Math.cos(a) * 72} ${Math.sin(a) * 72} L${Math.cos(a) * 100} ${Math.sin(a) * 100}" ${L(6)}/>` }).join('')}</g>`
        break
      }
      case 'reveal': {                                       // the real website (the factory's own screenshot of it)
        const p = ease(lt / 0.35)
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><g filter="url(#rough)"><rect x="372" y="26" width="816" height="514" rx="22" fill="#2a2d30" ${L(7)}/></g>
          <g transform="translate(780 283) scale(${0.88 + 0.12 * p}) translate(-780 -283)">${shot ? `<image href="${shot}" x="390" y="44" width="780" height="478" preserveAspectRatio="xMidYMin slice"/>` : `<rect x="390" y="44" width="780" height="478" fill="#f4f1ea"/>`}</g>
          ${pill(780, 572, fit(P.pill || host, 24), ease((lt - 0.2) / 0.3))}${guy(170, 920, 0.95, face(b, 'happy'), 'point', { ...tt, headBob: nod, look: [1, -0.6] })}`
        break
      }
      case 'proof': {
        const cards = (P.cards || []).slice(0, 3).map((c) => fit(c, 22)), gap = Math.max(0.6, (b.end - b.start) / Math.max(1, cards.length + 0.5))
        const card = (k, txt) => { const p = ease((lt - 0.2 - k * gap) / 0.3); return p ? `<g transform="translate(850 ${150 + k * 130}) scale(${p})"><rect x="-260" y="-46" width="520" height="92" rx="20" fill="#fff" ${L(6)} filter="url(#rough)"/><text x="0" y="14" text-anchor="middle" font-family="H" font-weight="800" font-size="${txt.length > 17 ? 32 : 38}" fill="${INK}">${esc(txt)} ✓</text></g>` : '' }
        body = `${room(W, H)}${cards.map((c, k) => card(k, c)).join('')}${guy(280, 900, 1.05, face(b, 'smug'), 'point', { ...tt, bob, headBob: nod })}`
        break
      }
      case 'celebrate': {
        const stamp = ease((lt - 0.5) / 0.2), word = fit(P.stamp || 'DONE', 11).toUpperCase()
        const conf = lt > 0.55 ? [...Array(40)].map((_, q) => { const x = (q * 97) % W, y = ((q * 53) % 260) - 40 + (lt - 0.55) * 300 * (1 + (q % 3) * 0.3), c = [GLASS, '#f2c94c', '#6fb8ff', '#ff8fb1'][q % 4]; return `<rect x="${x}" y="${y}" width="16" height="10" rx="2" fill="${c}" transform="rotate(${q * 37 + t * 200} ${x + 8} ${y + 5})"/>` }).join('') : ''
        body = `${room(W, H)}${guy(420, 1000, 1.15, 'happy', lt > 0.45 ? 'cheer' : 'rest', { ...tt, bob: lt > 0.55 ? -Math.abs(Math.sin(t * 8)) * 22 : bob, headBob: nod })}
          ${stamp ? `<g transform="translate(860 230) rotate(-12) scale(${2 - stamp})" opacity="${stamp}"><rect x="-250" y="-60" width="500" height="120" rx="16" fill="none" stroke="${RED}" stroke-width="12"/><text x="0" y="26" text-anchor="middle" font-family="H" font-weight="900" font-size="${word.length > 9 ? 62 : 80}" fill="${RED}">${esc(word)}</text></g>` : ''}${conf}
          ${lt > 1.0 ? `<g transform="translate(860 410)"><rect x="-230" y="-34" width="460" height="68" rx="34" fill="${INK}"/><text x="0" y="12" text-anchor="middle" font-family="H" font-weight="800" font-size="30" fill="${GLASS}">${esc(fit(P.pill || host, 26))}</text></g>` : ''}`
        break
      }
      case 'outro': {                                        // the whole day, ticked: goodbye, and what to do next
        body = `${room(W, H)}${guy(430, 880, 1.05, face(b, 'happy'), 'wave', { ...tt, bob, headBob: nod, tilt: Math.sin(t * 4) * 3 })}${dayList(t, 800, 120, 1.2, -2)}`
        break
      }
      default: body = `${room(W, H)}${guy(640, 960, 1.1, face(b), 'rest', { ...tt, bob, headBob: nod })}`
    }
    return defs + body + (noCaption ? '' : caption(t))
  }
  return { frame, beats: B, fps: FPS }
}
