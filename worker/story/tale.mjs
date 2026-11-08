// The long video as a real story (Install 22, job.mode 'tale'), 1280×720, in the sketch style. A cast (people.mjs) in
// places (places.mjs); each beat is a shot: wide (everyone in the place), two (a conversation), close (one face fills the
// screen), phone (a message fills it), screen (a laptop). The host (green glasses) opens with the hook, gives the lesson and
// says goodbye. The speaker's mouth moves with the voice; the others listen and keep their last feeling. A cold open,
// a flashback card, chapter cards, a flash on the twist. thumb() draws the thumbnail.
// Every word from the script goes through esc(): scripts are data, never markup.
import { guy, roughDefs, phone, laptop, PAPER, GLASS, INK, RED } from './sketch.mjs'
import { person, bust, TOPS } from './people.mjs'
import { place, NIGHT } from './places.mjs'
import { esc } from './scenes.mjs'

export const TW = 1280, TH = 720
const W = TW, H = TH
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const L = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
const fit = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s }
const wrap = (s, n) => { const rows = []; let row = ''; for (const w of String(s || '').split(/\s+/)) { if ((row + ' ' + w).trim().length > n && row) { rows.push(row); row = w } else row = (row + ' ' + w).trim() } if (row) rows.push(row); return rows }
const SPOTS = { 1: [640], 2: [420, 860], 3: [290, 640, 990] }

export function makeTale(beats, timing, job) {
  const B = beats.map((b, i) => ({ ...b, ...timing.beats[i] }))
  const amp = timing.amp, FPS = timing.fps, cast = Object.fromEntries((job.cast || []).map((c) => [c.id, c])), country = job.country || 'GB'
  const chapters = job.chapters || []
  const beatAt = (t) => { let k = 0; for (let i = 0; i < B.length; i++) if (t >= B[i].start - 0.2) k = i; return k }
  const talkAt = (t, f, b) => { if (!b.text || t < b.start || t > b.end) return 0; const a = ((amp[f] || 0) + (amp[f - 1] || 0) * 0.5) / 1.5; return a > 0.07 ? Math.min(1, a * 1.35) : 0 }
  // each character keeps the last feeling they showed until they speak again
  const feel = B.map(() => ({})); const last = {}
  B.forEach((b, i) => { if (b.scene === 'timejump') for (const k of Object.keys(last)) delete last[k]                // after the flashback card, everyone starts calm again
    if (b.speaker && cast[b.speaker]) last[b.speaker] = b.emotion || 'calm'; feel[i] = { ...last } })
  const lastPlace = (i) => { for (let k = i; k >= 0; k--) if (B[k].place) return B[k].place; return 'home' }

  function caption(b, t) {
    if (!b.text || t > b.end + 0.3) return ''
    const rows = wrap(b.text, 46).slice(0, 2), who = b.speaker && cast[b.speaker], y0 = rows.length > 1 ? 626 : 666
    const name = who ? `<g transform="translate(${W / 2} ${y0 - 58})"><rect x="${-(who.name.length * 10 + 26)}" y="-24" width="${who.name.length * 20 + 52}" height="38" rx="19" fill="${TOPS[who.top] || '#4f86d9'}" ${L(4)}/><text x="0" y="5" text-anchor="middle" font-family="H" font-weight="900" font-size="22" fill="#fff" stroke="${INK}" stroke-width="4" paint-order="stroke">${esc(who.name.toUpperCase())}</text></g>` : ''
    return `<g>${name}${rows.map((r, k) => `<text x="${W / 2}" y="${y0 + k * 50}" text-anchor="middle" font-family="H" font-weight="900" font-stretch="88%" font-size="40" ${!who ? 'font-style="italic"' : ''} stroke="${INK}" stroke-width="10" stroke-linejoin="round" paint-order="stroke" fill="${who ? '#fff' : '#f6e8a6'}">${esc(r)}</text>`).join('')}</g>`
  }
  const people = (b, i, t, f, s = 0.95, spots) => {
    const who = (b.who || []).filter((x) => cast[x]).slice(0, 3), xs = spots || SPOTS[who.length] || SPOTS[1]
    const sp = b.speaker && who.includes(b.speaker) ? xs[who.indexOf(b.speaker)] : null
    return who.map((id, k) => { const me = id === b.speaker, talk = me ? talkAt(t, f, b) : 0
      const look = sp == null || me ? [0, 0] : [clamp((sp - xs[k]) / 300, -1, 1), 0]
      const emo = me ? b.emotion : feel[i][id] || 'calm'
      return person(cast[id], xs[k], 700 + (me ? Math.sin(t * 3) * 2 : 0), s, emo, { t, talk, blink: (t + k) % 3.3 < 0.12, look, headBob: talk ? Math.sin(t * 11) * 4 * talk : 0, shake: ['panic', 'shock'].includes(emo) && me }) }).join('')
  }
  const bg = (name, t, z = 1, cx = W / 2, cy = H / 2) => `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${place(name, W, H, { t, country })}</g>`
  const soft = (o = 0.55) => `<rect width="${W}" height="${H}" fill="${PAPER}" opacity="${o}"/>`
  const vig = (c = RED, o = 0.55) => `<radialGradient id="vg" cx=".5" cy=".5" r=".8"><stop offset=".55" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}" stop-opacity="${o}"/></radialGradient>`
  const host = (x, y, s, emo, pose, t, f, b) => guy(x, y, s, { calm: 'neutral', curious: 'neutral', happy: 'happy', excited: 'happy', worried: 'melt', shock: 'shocked' }[emo] || 'neutral', pose, { t, talk: talkAt(t, f, b), blink: t % 3.1 < 0.12, bob: Math.sin(t * 3) * 4, headBob: talkAt(t, f, b) ? Math.sin(t * 11) * 4 : 0 })

  function shotOf(b, i, t, f) {
    const lt = t - b.start, d = Math.max(0.5, b.end - b.start), pl = b.place || lastPlace(i), night = NIGHT.has(pl)
    const push = 1 + 0.05 * clamp(lt / Math.max(2, d)), who = (b.who || []).filter((x) => cast[x])
    const main = cast[b.speaker] ? b.speaker : who[0]
    switch (b.shot) {
      case 'two': {
        const two = who.slice(0, 2)
        return `${bg(pl, t, 1.3 * push)}${night ? '' : soft(0.15)}${people({ ...b, who: two }, i, t, f, 1.3, two.length > 1 ? [400, 880] : [640])}`
      }
      case 'close': {
        const p = cast[main]; if (!p) return bg(pl, t)
        const emo = main === b.speaker ? b.emotion : feel[i][main] || 'calm', big = ['shock', 'panic', 'scared', 'angry'].includes(emo)
        const sh = big ? Math.sin(t * 50) * 4 : 0, talk = main === b.speaker ? talkAt(t, f, b) : 0
        return `${bg(pl, t, 1.7)}${soft(night ? 0.2 : 0.45)}<g transform="translate(${sh} 0)">${bust(p, 640, 330 + Math.sin(t * 2) * 3, 1.45 * (1 + 0.04 * clamp(lt / 3)), emo, { t, talk, blink: t % 3.3 < 0.12, headBob: talk ? Math.sin(t * 11) * 4 : 0, shake: big && talk > 0 })}</g>${big ? `<rect width="${W}" height="${H}" fill="url(#vg)"/>` : ''}`
      }
      case 'phone': {
        const P = (b.props && b.props.phone) || {}, rows = wrap(P.text, 16).slice(0, 7), shown = Math.ceil(rows.join(' ').length * clamp((lt - 0.2) / 1.4))
        let n = 0; const typed = rows.map((r) => { const k = Math.max(0, Math.min(r.length, shown - n)); n += r.length + 1; return r.slice(0, k) })
        const screen = `<rect width="136" height="264" rx="12" fill="#fff"/><rect width="136" height="40" rx="12" fill="#eef1f4"/><text x="68" y="27" text-anchor="middle" font-family="H" font-weight="900" font-size="14" fill="${INK}">${esc(fit(P.from, 16))}</text>
          <rect x="8" y="54" width="120" height="${22 + rows.length * 18}" rx="12" fill="#e9edf2"/>${typed.map((r, k) => `<text x="15" y="${74 + k * 18}" font-family="H" font-weight="700" font-size="12.5" fill="${INK}">${esc(r)}</text>`).join('')}`
        return `${bg(pl, t, 1.6)}${soft(0.5)}${phone(640, 350 + Math.sin(t * 2) * 6, 1.85, screen, -3)}${main ? `<g transform="translate(150 0)">${person(cast[main], 1020, 760, 0.75, main === b.speaker ? b.emotion : feel[i][main] || 'calm', { t, talk: main === b.speaker ? talkAt(t, f, b) : 0, pose: 'phone', look: [-1, -0.4] })}</g>` : ''}`
      }
      case 'screen': {
        const rows = ((b.props && b.props.screen) || []).slice(0, 3)
        const sc = `<rect width="256" height="172" fill="#f4f6f8"/><rect width="256" height="20" fill="#d6dbe1"/><circle cx="12" cy="10" r="4" fill="${RED}"/><circle cx="26" cy="10" r="4" fill="#f2c94c"/><circle cx="40" cy="10" r="4" fill="${GLASS}"/>${rows.map((r, k) => `<text x="14" y="${52 + k * 38}" font-family="H" font-weight="${k ? 700 : 900}" font-size="${k ? 15 : 18}" fill="${k ? '#3b4a63' : INK}" opacity="${clamp((lt - 0.3 - k * 0.5) / 0.3)}">${esc(fit(r, 30))}</text>`).join('')}`
        return `${bg(pl, t, 1.5)}${soft(0.45)}${laptop(640, 560, 2.3 * push, sc, { open: 0 })}`
      }
      default:                                                                 // wide
        return `${bg(pl, t, push)}${people(b, i, t, f, who.length > 2 ? 0.85 : 0.95)}`
    }
  }

  function frame(t, f) {
    const i = beatAt(t), b = B[i], lt = t - b.start, seed = Math.floor(f / 3) % 7 + 1
    let body = '', noCaption = false
    switch (b.scene) {
      case 'timejump': {
        const p = ease(lt / 0.25), l = ((b.props && b.props.label) || ['3 DAYS', 'EARLIER']).slice(0, 2).map((x) => fit(x, 12)); noCaption = true
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/><g transform="translate(${W / 2} ${H / 2}) rotate(-4) scale(${0.6 + 0.4 * p})" opacity="${p}">${l.map((x, k) => `<text x="0" y="${-30 + k * 110}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${k ? 90 : 110}" fill="${k ? RED : INK}">${esc(x)}</text>`).join('')}</g>`
        break
      }
      case 'intro': {                                                          // the host: the hook, with the main character's picture
        const a = (job.cast || [])[0]
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/>${host(330, 900, 1.0, b.emotion, 'point', t, f, b)}
          ${a ? `<g transform="translate(880 320) rotate(${3 + Math.sin(t) * 1.5})"><rect x="-200" y="-220" width="400" height="460" fill="#fff" ${L(6)} filter="url(#rough)"/><rect x="-170" y="-190" width="340" height="340" fill="#dfe8ee"/><g transform="translate(0 -20)">${bust(a, 0, 0, 0.85, 'calm', { t })}</g><text x="0" y="210" text-anchor="middle" font-family="H" font-weight="900" font-size="40" fill="${INK}">${esc(fit(a.name, 16).toUpperCase())}</text></g>` : ''}`
        break
      }
      case 'chapter': {
        const p = ease(lt / 0.3), c = chapters[b.ch] || {}; noCaption = true
        body = `<rect width="${W}" height="${H}" fill="${INK}"/><g transform="translate(${W / 2} ${H / 2}) scale(${0.85 + 0.15 * p})" opacity="${p}">
          <text x="0" y="-50" text-anchor="middle" font-family="Inter" font-weight="900" font-size="54" fill="${GLASS}" letter-spacing="8">CHAPTER ${Number(b.ch) + 1}</text>
          <text x="0" y="50" text-anchor="middle" font-family="H" font-weight="900" font-stretch="88%" font-size="${fit(c.title, 30).length > 20 ? 72 : 88}" fill="#fff">${esc(fit(c.title, 30))}</text></g>`
        break
      }
      case 'lesson': {
        const tips = ((b.props && b.props.tips) || []).slice(0, 3), gap = Math.max(1.2, (b.end - b.start) / Math.max(1, tips.length + 0.5))
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/>${host(230, 900, 0.95, 'calm', 'point', t, f, b)}
          <text x="800" y="110" text-anchor="middle" font-family="Inter" font-weight="900" font-size="52" fill="${RED}">${job.genre === 'scam' ? 'HOW TO SPOT IT' : 'THE LESSON'}</text>
          ${tips.map((x, k) => { const p = ease((lt - 0.3 - k * gap) / 0.3); const rows = wrap(x, 30).slice(0, 2); return p ? `<g transform="translate(800 ${210 + k * 140}) scale(${p})"><rect x="-330" y="-54" width="660" height="108" rx="20" fill="#fff" ${L(6)} filter="url(#rough)"/><circle cx="-280" cy="0" r="26" fill="${GLASS}" ${L(4)}/><text x="-280" y="10" text-anchor="middle" font-family="Inter" font-weight="900" font-size="28" fill="${INK}">${k + 1}</text>${rows.map((r, j) => `<text x="-235" y="${(rows.length > 1 ? -8 : 12) + j * 34}" font-family="H" font-weight="800" font-size="28" fill="${INK}">${esc(r)}</text>`).join('')}</g>` : '' }).join('')}`
        break
      }
      case 'outro': {
        body = `<rect width="${W}" height="${H}" fill="${PAPER}"/><rect width="${W}" height="${H}" filter="url(#paper)"/>${host(400, 900, 1.0, 'happy', 'wave', t, f, b)}
          <g transform="translate(900 240) rotate(5)"><rect x="-200" y="-90" width="400" height="180" rx="10" fill="#f6e8a6" ${L(5)} filter="url(#rough)"/><text x="0" y="-10" text-anchor="middle" font-family="Inter" font-weight="900" font-size="44" fill="${INK}">NEXT STORY</text><text x="0" y="50" text-anchor="middle" font-family="H" font-weight="800" font-size="32" fill="${RED}">subscribe ↓</text></g>`
        break
      }
      default: {                                                              // cold open and story lines
        const pl = b.place || lastPlace(i), prev = B[i - 1], changed = prev && prev.place && prev.place !== pl && prev.scene === 'line'
        body = shotOf(b, i, t, f)
        if (b.scene === 'cold') body += `<rect width="${W}" height="${H}" fill="url(#vg)"/>`
        if (changed && lt < 0.25) body += `<rect width="${W}" height="${H}" fill="${PAPER}" opacity="${1 - lt / 0.25}"/>`                // a new place: a quick wipe in
        if (b.twist && lt < 0.6) body = `<g transform="translate(${W / 2} ${H / 2}) scale(${1 + 0.12 * (1 - ease(lt / 0.6))}) translate(${-W / 2} ${-H / 2})">${body}</g><rect width="${W}" height="${H}" fill="#fff" opacity="${clamp(1 - lt / 0.2)}"/>`
      }
    }
    const red = ['cold', 'line'].includes(b.scene) && ['shock', 'panic', 'scared', 'angry'].includes(b.emotion)
    return `<defs>${roughDefs(seed, 3.2)}${vig(red ? RED : '#000', red ? 0.5 : 0.35)}</defs>${body}${noCaption ? '' : caption(b, t)}`
  }
  return { frame, beats: B, fps: FPS }
}

// the thumbnail: the most dramatic face, big words, high contrast
export function thumb(job) {
  const T = job.thumb || {}, cast = job.cast || [], p = cast.find((c) => c.id === T.who) || cast[0], words = String(T.text || 'WAIT…').toUpperCase().split(/\s+/).slice(0, 3)
  const first = (job.story && job.story.beats || []).find((b) => b.place) || {}, size = words.some((w) => w.length > 7) ? 118 : 150
  return `<defs>${roughDefs(3, 3.2)}<radialGradient id="tv" cx=".65" cy=".45" r=".8"><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient></defs>
    <g transform="translate(640 360) scale(1.4) translate(-640 -360)">${place(first.place || 'home', TW, TH, { t: 0, country: job.country })}</g><rect width="${TW}" height="${TH}" fill="url(#tv)"/>
    ${p ? bust(p, 900, 330, 2.05, T.emotion || 'shock', { t: 0 }) : ''}
    ${job.genre === 'scam' ? `<g transform="translate(560 470) rotate(-8)">${phone(0, 0, 1.0, `<rect width="136" height="264" rx="12" fill="#fff"/><text x="68" y="150" text-anchor="middle" font-family="Inter" font-weight="900" font-size="90" fill="${RED}">!</text>`)}</g>` : ''}
    ${words.map((w, k) => `<text x="60" y="${170 + k * (size + 6)}" font-family="Inter" font-weight="900" font-size="${size}" fill="${k === words.length - 1 ? '#f2c94c' : '#fff'}" stroke="${INK}" stroke-width="16" stroke-linejoin="round" paint-order="stroke">${esc(w)}</text>`).join('')}`
}
