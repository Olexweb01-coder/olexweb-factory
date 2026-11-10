// Format "versus": "How Poor vs Rich people …" comparisons, the shape of the Shorts that get watched to the end. The title
// stays on screen the whole time (you always know what you're watching), the picture is a 16:9 panel in the middle, the
// words build up under it with the word being said in yellow, every line is a new picture (a cut), and the rich half is a
// numbered list (First… Second… Third…) so people stay for the next one. Same business, different choices.
// Each beat names its picture (scene) and who's in it; this file draws them.
export const W = 720, H = 1280
const PX = 0, PY = 360, PW = 720, PH = 405                      // the picture panel
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const back = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
const out = (x) => 1 - Math.pow(1 - clamp(x), 3)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const INK = '#16171b'

// ---------- people ----------
// kind: poor (flat cap, brown coat), rich (top hat, black suit, red tie, briefcase), guy (plain), kid
function person(x, y, s, o = {}, t = 0) {
  const k = o.kind || 'guy', flip = o.flip ? -1 : 1, mood = o.mood || 'calm', pose = o.pose || 'stand'
  const bob = pose === 'sleep' ? 0 : Math.sin(t * 3 + x) * 2.5, body = k === 'rich' ? '#1d1e22' : k === 'poor' ? '#7a6248' : k === 'kid' ? '#3f8fd6' : '#9aa3ad'
  const legs = pose === 'walk' ? Math.sin(t * 8 + x) * 14 : 0
  let a = ''
  // arms by pose
  const arm = (side, ang) => { const sx = side * 16; const ex = sx + Math.sin(ang) * 46 * side, ey = -98 + Math.cos(ang) * 46; return `<path d="M${sx},-104 L${ex},${ey}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="5.5" fill="#fff" stroke="${INK}" stroke-width="3"/>` }
  const wave = Math.sin(t * 10) * 0.35
  if (pose === 'wave') a = arm(-1, 0.3) + arm(1, Math.PI - 0.6 + wave)
  else if (pose === 'give') a = arm(-1, 0.25) + arm(1, 1.75)
  else if (pose === 'point') a = arm(-1, 0.2) + arm(1, 1.95)
  else if (pose === 'cheer') a = arm(-1, Math.PI - 0.5 + wave) + arm(1, Math.PI - 0.5 - wave)
  else if (pose === 'sad') a = arm(-1, 0.05) + arm(1, 0.05)
  else a = arm(-1, 0.28) + arm(1, 0.28)
  const eyes = { calm: [9, 10], happy: [9, 10], sad: [8, 9], shocked: [12, 13], smug: [9, 5], angry: [9, 9] }[mood] || [9, 10]
  const mouth = { calm: 'M-9,-142 Q0,-136 9,-142', happy: 'M-12,-144 Q0,-130 12,-144', sad: 'M-10,-136 Q0,-146 10,-136', shocked: 'M-7,-140 a7,8 0 1,0 14,0 a7,8 0 1,0 -14,0', smug: 'M-12,-142 Q4,-134 14,-146', angry: 'M-10,-137 L10,-139' }[mood]
  const brows = mood === 'angry' ? `<path d="M-22,-178 L-6,-172 M22,-178 L6,-172" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` : mood === 'sad' ? `<path d="M-22,-172 L-6,-178 M22,-172 L6,-178" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` : ''
  const tear = mood === 'sad' ? `<path d="M-14,-152 q-4,10 0,14 q4,-4 0,-14" fill="#6ec3ff" opacity="${0.6 + 0.4 * Math.sin(t * 4)}"/>` : ''
  let hat = ''
  if (k === 'rich') hat = `<rect x="-24" y="-232" width="48" height="50" rx="4" fill="${INK}"/><rect x="-24" y="-196" width="48" height="10" fill="#d4282f"/><rect x="-36" y="-186" width="72" height="9" rx="4" fill="${INK}"/>`
  if (k === 'poor') hat = `<path d="M-30,-178 Q-26,-206 6,-206 Q30,-204 32,-184 L44,-180 Q46,-174 36,-174 L-30,-174 Z" fill="#6b5640" stroke="${INK}" stroke-width="3"/>`
  if (k === 'kid') hat = `<path d="M-26,-182 Q0,-214 26,-182 Z" fill="#e8463b" stroke="${INK}" stroke-width="3"/>`
  const extra = k === 'rich' ? `<path d="M0,-118 L-5,-102 L0,-62 L5,-102 Z" fill="#d4282f"/>` : k === 'poor' ? `<rect x="-12" y="-96" width="12" height="12" fill="#a08566" stroke="${INK}" stroke-width="2"/>` : ''
  const case_ = k === 'rich' && pose !== 'sleep' && pose !== 'cheer' && pose !== 'wave' ? `<rect x="-58" y="-62" width="34" height="26" rx="4" fill="#6b4a2c" stroke="${INK}" stroke-width="3"/>` : ''
  if (pose === 'sleep') return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="-20" rx="120" ry="34" fill="#e9eef5" stroke="${INK}" stroke-width="4"/><circle cx="-80" cy="-48" r="30" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M-92,-50 q6,4 12,0 M-74,-50 q6,4 12,0" stroke="${INK}" stroke-width="3" fill="none"/>${k === 'rich' ? `<path d="M-108,-70 Q-80,-96 -50,-74 L-48,-60 L-110,-60 Z" fill="#3a5bd6"/>` : ''}<rect x="-60" y="-50" width="170" height="30" rx="14" fill="#8fb4ff" stroke="${INK}" stroke-width="4"/><text x="-40" y="${-90 - (t * 20) % 30}" font-family="Inter" font-size="26" fill="${INK}" opacity=".7">z</text><text x="-20" y="${-110 - (t * 20) % 30}" font-family="Inter" font-size="20" fill="${INK}" opacity=".5">z</text></g>`
  return `<g transform="translate(${x},${y + bob}) scale(${s * flip},${s})">
    <path d="M-6,-62 L${-16 - legs},0 M6,-62 L${16 + legs},0" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M-20,-118 Q0,-124 20,-118 L16,-60 L-16,-60 Z" fill="${body}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${extra}${case_}${a}
    <circle cx="0" cy="-154" r="32" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="-11" cy="-160" rx="6" ry="${eyes[1] / 1.6}" fill="${INK}"/><ellipse cx="11" cy="-160" rx="6" ry="${eyes[1] / 1.6}" fill="${INK}"/>
    <path d="${mouth}" fill="${mood === 'shocked' ? INK : 'none'}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>${brows}${tear}${hat}</g>`
}

const ICONS = {
  scissors: '<circle cx="-10" cy="-8" r="7" fill="none" stroke="C" stroke-width="4"/><circle cx="10" cy="-8" r="7" fill="none" stroke="C" stroke-width="4"/><path d="M-6,-14 L12,-40 M6,-14 L-12,-40" stroke="#16171b" stroke-width="4" stroke-linecap="round"/>',
  tooth: '<path d="M-14,-40 q14,-6 28,0 q6,10 -2,22 q-3,16 -6,18 q-3,-8 -6,-8 q-3,0 -6,8 q-3,-2 -6,-18 q-8,-12 -2,-22 z" fill="#fff" stroke="#16171b" stroke-width="3"/>',
  wrench: '<path d="M-14,-4 L8,-26 a9,9 0 1,1 6,6 L-8,2 Z" fill="C" stroke="#16171b" stroke-width="3"/>',
  dumbbell: '<rect x="-20" y="-24" width="40" height="6" fill="#16171b"/><rect x="-28" y="-34" width="10" height="26" rx="2" fill="C" stroke="#16171b" stroke-width="3"/><rect x="18" y="-34" width="10" height="26" rx="2" fill="C" stroke="#16171b" stroke-width="3"/>',
  plate: '<ellipse cx="0" cy="-10" rx="24" ry="9" fill="#fff" stroke="#16171b" stroke-width="3"/><path d="M-12,-14 q12,-18 24,0 z" fill="C" stroke="#16171b" stroke-width="3"/>',
  flower: '<path d="M0,-4 L0,-22" stroke="#2e9e6b" stroke-width="4"/><circle cx="0" cy="-30" r="6" fill="#ffcf3f" stroke="#16171b" stroke-width="2"/>' + [0, 1, 2, 3, 4].map((k) => `<circle cx="${Math.cos(k * 1.256) * 10}" cy="${-30 + Math.sin(k * 1.256) * 10}" r="6" fill="C" stroke="#16171b" stroke-width="2"/>`).join(''),
  camera: '<rect x="-20" y="-32" width="40" height="28" rx="5" fill="C" stroke="#16171b" stroke-width="3"/><circle cx="0" cy="-18" r="8" fill="#fff" stroke="#16171b" stroke-width="3"/><rect x="-10" y="-38" width="12" height="6" fill="#16171b"/>',
  coffee: '<path d="M-14,-32 L14,-32 L10,-4 L-10,-4 Z" fill="C" stroke="#16171b" stroke-width="3"/><path d="M14,-26 q10,2 2,12" fill="none" stroke="#16171b" stroke-width="3"/>',
  paw: '<ellipse cx="0" cy="-14" rx="10" ry="8" fill="C" stroke="#16171b" stroke-width="2"/>' + [-12, -4, 4, 12].map((x, k) => `<circle cx="${x}" cy="${-28 - (k % 3 ? 4 : 0)}" r="4.5" fill="C" stroke="#16171b" stroke-width="2"/>`).join(''),
  car: '<path d="M-24,-10 L-20,-22 L-10,-30 L10,-30 L20,-22 L24,-10 Z" fill="C" stroke="#16171b" stroke-width="3"/><circle cx="-12" cy="-8" r="5" fill="#16171b"/><circle cx="12" cy="-8" r="5" fill="#16171b"/>',
  book: '<path d="M-20,-36 L0,-30 L20,-36 L20,-6 L0,-2 L-20,-6 Z" fill="C" stroke="#16171b" stroke-width="3"/><path d="M0,-30 L0,-2" stroke="#16171b" stroke-width="2"/>',
  spray: '<rect x="-8" y="-30" width="16" height="28" rx="3" fill="C" stroke="#16171b" stroke-width="3"/><path d="M-4,-30 L-4,-38 L8,-38" fill="none" stroke="#16171b" stroke-width="3"/>',
}
function item(kind, x, y, s, k, nice = true) {
  const c = nice ? ['#ff9ec2', '#ffd36b', '#9ee6a3', '#ffb37a', '#b9a6ff'][k % 5] : '#c9bba0'
  return `<g transform="translate(${x},${y}) scale(${s})">${(ICONS[kind] || ICONS.scissors).replace(/"C"/g, `"${c}"`)}</g>`
}

// ---------- places ----------
function shop(rich, t) {
  const wall = rich ? '#f6efe2' : '#cdbfa6', floor = rich ? '#e6d2b5' : '#a8977c'
  let s = `<rect x="0" y="0" width="${PW}" height="${PH}" fill="${wall}"/><rect x="0" y="${PH - 90}" width="${PW}" height="90" fill="${floor}"/>`
  s += `<rect x="40" y="70" width="190" height="120" rx="6" fill="${rich ? '#bfe3ff' : '#9fb3bf'}" stroke="${INK}" stroke-width="4"/><path d="M135,70 L135,190 M40,130 L230,130" stroke="${INK}" stroke-width="3"/>`
  s += `<rect x="300" y="${PH - 170}" width="380" height="80" fill="${rich ? '#fff' : '#b9a27f'}" stroke="${INK}" stroke-width="4"/><rect x="300" y="${PH - 180}" width="380" height="14" fill="${rich ? '#e8463b' : '#7a6248'}" stroke="${INK}" stroke-width="4"/>`
  for (let k = 0; k < (rich ? 5 : 2); k++) s += cake(340 + k * 70, PH - 186, rich ? 1 : 0.8, k, rich)
  s += `<text x="490" y="62" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${NOUN.length > 12 ? 22 : 30}" fill="${rich ? '#d4282f' : '#6b5640'}">${esc(rich ? NOUN.toUpperCase() : NOUN)}</text>`
  if (!rich) s += `<path d="M560,110 l30,40 M600,96 l-6,52" stroke="#6b5640" stroke-width="3" opacity=".6"/>`
  return s
}
// the business's product: a cake for a bakery, scissors for a barber, a tooth for a dentist… (BIZ.item)
let ITEM = 'cake', NOUN = 'bakery', ORDER = 'order'
function cake(x, y, s, k, nice = true) {
  if (ITEM !== 'cake') return item(ITEM, x, y, s, k, nice)
  const c = ['#ff9ec2', '#ffd36b', '#9ee6a3', '#ffb37a', '#b9a6ff'][k % 5]
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-24" y="-34" width="48" height="34" rx="5" fill="${nice ? c : '#d8c7a6'}" stroke="${INK}" stroke-width="3"/><path d="M-24,-26 q8,8 16,0 q8,8 16,0 q8,8 16,0" fill="none" stroke="#fff" stroke-width="4"/>${nice ? `<circle cx="0" cy="-40" r="6" fill="#e8463b" stroke="${INK}" stroke-width="2"/>` : ''}</g>`
}
function street(t) {
  let s = `<rect width="${PW}" height="${PH}" fill="#bfe1ff"/><rect y="${PH - 110}" width="${PW}" height="110" fill="#9aa3ad"/><rect y="${PH - 116}" width="${PW}" height="10" fill="#d6dce3"/>`
  for (let k = 0; k < 5; k++) s += `<rect x="${k * 150 - 20}" y="${60 + (k % 2) * 30}" width="130" height="${PH - 170 - (k % 2) * 30}" fill="${['#e8c9a0', '#c9d6e8', '#e8b5a0', '#d3e8c9', '#e8dcc9'][k]}" stroke="${INK}" stroke-width="4"/>`
  return s
}
function phone(x, y, s, st, t) {
  // st: 'slow' (spinner + tiny buttons), 'fast' (loaded, 1 SECOND), 'orders' (order pings)
  let i = `<g transform="translate(${x},${y}) scale(${s})"><rect x="-80" y="-150" width="160" height="300" rx="24" fill="${INK}"/><rect x="-70" y="-138" width="140" height="276" rx="16" fill="#fff"/>`
  if (st === 'slow') { const a = (t * 360) % 360; i += `<circle cx="0" cy="-30" r="24" fill="none" stroke="#d6dce3" stroke-width="7"/><path d="M0,-54 A24,24 0 0,1 24,-30" fill="none" stroke="#e8463b" stroke-width="7" transform="rotate(${a} 0 -30)"/><text x="0" y="22" text-anchor="middle" font-family="Inter" font-weight="900" font-size="20" fill="#e8463b">${Math.min(8, 1 + Math.floor((t * 2) % 8))}s…</text>`
    for (let k = 0; k < 6; k++) i += `<rect x="${-50 + (k % 3) * 36}" y="${60 + Math.floor(k / 3) * 18}" width="26" height="9" rx="2" fill="#c9d3de"/>` }
  if (st === 'fast' || st === 'orders') { i += `<rect x="-60" y="-126" width="120" height="86" rx="10" fill="#d4282f"/><text x="-48" y="-92" font-family="Inter" font-weight="900" font-size="18" fill="#fff">${ORDER === 'booking' ? 'Book' : 'Order'}</text><text x="-48" y="-70" font-family="Inter" font-weight="900" font-size="18" fill="#fff">online.</text><rect x="-60" y="-28" width="120" height="34" rx="17" fill="#8ff06a" stroke="${INK}" stroke-width="3"/><text x="0" y="-5" text-anchor="middle" font-family="Inter" font-weight="900" font-size="15" fill="${INK}">${ORDER === 'booking' ? 'BOOK NOW' : 'ORDER NOW'}</text>`
    for (let k = 0; k < 3; k++) i += cake(-40 + k * 40, 70, 0.7, k) }
  if (st === 'blank') i += `<rect x="-70" y="-138" width="140" height="30" fill="#2e9e6b"/><text x="0" y="-117" text-anchor="middle" font-family="Inter" font-weight="900" font-size="14" fill="#fff">Chat with us</text>`
  if (st === 'fast') i += `<g transform="translate(70,-150) scale(${back(clamp(t % 3))})"><circle r="34" fill="#8ff06a" stroke="${INK}" stroke-width="4"/><text y="8" text-anchor="middle" font-family="Inter" font-weight="900" font-size="22" fill="${INK}">1s</text></g>`
  return i + '</g>'
}
const badge = (x, y, txt, c, k) => `<g transform="translate(${x},${y}) scale(${back(k)})"><rect x="${-txt.length * 9 - 18}" y="-24" width="${txt.length * 18 + 36}" height="48" rx="24" fill="${c}" stroke="${INK}" stroke-width="4"/><text y="9" text-anchor="middle" font-family="Inter" font-weight="900" font-size="24" fill="${INK}">${esc(txt)}</text></g>`

// ---------- one picture per beat ----------
function scene(b, p, t) {
  const sc = b.scene
  if (sc === 'split') return `<g>${shop(false, t)}${person(190, 370, 1, { kind: 'poor', mood: 'sad', pose: 'sad' }, t)}</g><g clip-path="url(#half)"><g transform="translate(0,0)">${shop(true, t)}${person(530, 370, 1, { kind: 'rich', mood: 'smug', pose: 'stand' }, t)}</g></g><path d="M360,0 L360,${PH}" stroke="#fff" stroke-width="8"/>${badge(180, 40, 'POOR', '#c9b28f', clamp(p * 4))}${badge(540, 40, 'RICH', '#ffcf3f', clamp(p * 4 - 0.4))}`
  if (sc === 'flyers') { let s = street(t) + person(250, 380, 1.05, { kind: 'poor', mood: 'happy', pose: 'give' }, t) + person(470 - p * 60, 380, 0.95, { kind: 'guy', pose: 'walk', flip: true }, t)
    for (let k = 0; k < 6; k++) s += `<rect x="${60 + (k % 3) * 22}" y="${300 - k * 8}" width="60" height="40" rx="2" fill="#fff8d6" stroke="${INK}" stroke-width="3" transform="rotate(${-8 + k * 3} 90 300)"/>`
    return s + `<g transform="translate(300,150) scale(${back(clamp(p * 3))})"><rect x="-44" y="-30" width="88" height="60" rx="3" fill="#fff8d6" stroke="${INK}" stroke-width="3"/><text y="-2" text-anchor="middle" font-family="Inter" font-weight="900" font-size="14">${esc(NOUN.toUpperCase().slice(0, 10))}!</text><text y="16" text-anchor="middle" font-family="Inter" font-size="11">corner shop</text></g>` }
  if (sc === 'bin') { let s = street(t) + `<path d="M470,${PH - 40} L560,${PH - 40} L550,${PH - 160} L480,${PH - 160} Z" fill="#6b7a86" stroke="${INK}" stroke-width="4"/>`
    for (let k = 0; k < 9; k++) { const q = clamp(p * 1.4 - k * 0.1); s += `<rect x="${486 + (k % 3) * 18}" y="${PH - 172 - k * 6 - (1 - q) * 160}" width="40" height="26" fill="#fff8d6" stroke="${INK}" stroke-width="2" opacity="${q > 0 ? 1 : 0}" transform="rotate(${k * 17} ${506 + (k % 3) * 18} ${PH - 160})"/>` }
    return s + person(250, 380, 1.05, { kind: 'poor', mood: 'sad', pose: 'give' }, t) + person(650 - p * 200, 380, 0.95, { kind: 'guy', pose: 'walk', flip: true }, t) }
  if (sc === 'nephew') return shop(false, t) + `<rect x="300" y="${PH - 236}" width="140" height="62" rx="4" fill="#3a3f4b" stroke="${INK}" stroke-width="4"/><rect x="280" y="${PH - 176}" width="180" height="10" fill="#9aa3ad" stroke="${INK}" stroke-width="3"/>` + person(240, 380, 0.85, { kind: 'kid', mood: 'happy', pose: 'point' }, t) + person(560, 370, 1, { kind: 'poor', mood: 'happy', pose: 'cheer' }, t) + badge(370, 70, 'FREE WEBSITE', '#fff8d6', clamp(p * 3))
  if (sc === 'slow') return `<rect width="${PW}" height="${PH}" fill="#e7ecf2"/>` + phone(360, 200, 1.2, 'slow', t) + person(150, 390, 0.95, { kind: 'guy', mood: 'angry', pose: 'point' }, t) + person(590, 390, 0.95, { kind: 'guy', mood: 'shocked', flip: true }, t) + badge(560, 70, 'TINY BUTTONS', '#ffd0cc', clamp(p * 3 - 1))
  if (sc === 'leave') return shop(false, t) + person(360, 370, 1, { kind: 'poor', mood: 'shocked' }, t) + [0, 1, 2].map((k) => person(500 + k * 70 + p * 220, 380, 0.85, { kind: 'guy', pose: 'walk', mood: 'angry' }, t + k)).join('') + `<rect x="${PW - 30}" y="80" width="30" height="240" fill="#8a5a3c" stroke="${INK}" stroke-width="4"/>`
  if (sc === 'broke') return `<rect width="${PW}" height="${PH}" fill="#8c8478"/>` + shop(false, t).replace(/<text[^>]*>[^<]*<\/text>/, '') + `<rect width="${PW}" height="${PH}" fill="#2a2b31" opacity=".35"/>` + person(360, 380, 1.1, { kind: 'poor', mood: 'sad', pose: 'sad' }, t) + badge(360, 70, 'CLOSED', '#ffd0cc', clamp(p * 3)) + Array.from({ length: 30 }, (_, k) => `<line x1="${(k * 53 + t * 120) % PW}" y1="${(k * 37 + t * 600) % PH}" x2="${(k * 53 + t * 120) % PW - 6}" y2="${(k * 37 + t * 600) % PH + 18}" stroke="#bfe1ff" stroke-width="3" opacity=".6"/>`).join('')
  if (sc === 'rich') return shop(true, t) + person(170, 380, 1.05, { kind: 'rich', mood: 'smug', pose: 'point' }, t) + badge(170, 70, 'DIFFERENT PLAN', '#ffcf3f', clamp(p * 3 - 0.5))
  if (sc === 'fast') return `<rect width="${PW}" height="${PH}" fill="#fff4dc"/>` + phone(360, 205, 1.2, 'fast', t) + person(150, 390, 1, { kind: 'rich', mood: 'smug', pose: 'point' }, t) + person(590, 390, 0.95, { kind: 'guy', mood: 'happy', flip: true }, t) + badge(110, 60, String(b.n || 1), '#ffcf3f', clamp(p * 4))
  if (sc === 'sleep') { let s = `<rect width="${PW}" height="${PH}" fill="#1d2a4a"/><circle cx="600" cy="70" r="34" fill="#fff4c2"/>` + `<g transform="translate(260,330)">${person(0, 0, 1.3, { kind: 'rich', pose: 'sleep' }, t)}</g>`
    for (let k = 0; k < 4; k++) { const q = clamp(p * 4 - k * 0.7); if (q > 0) s += `<g transform="translate(${560},${120 + k * 64}) scale(${back(q)})"><rect x="-110" y="-24" width="220" height="48" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="-84" cy="0" r="12" fill="#8ff06a"/><text x="-62" y="7" font-family="Inter" font-weight="900" font-size="18" fill="${INK}">${ORDER === 'booking' ? 'New booking ' + ['9:30', '11:00', '14:15', '16:45'][k] : 'New order £' + [24, 36, 18, 42][k]}</text></g>` }
    return s + badge(110, 60, String(b.n || 2), '#ffcf3f', clamp(p * 4)) }
  if (sc === 'email') { let s = `<rect width="${PW}" height="${PH}" fill="#dff1ff"/>` + person(120, 390, 1, { kind: 'rich', mood: 'happy', pose: 'point' }, t)
    for (let k = 0; k < 4; k++) s += `<g transform="translate(${300 + k * 110},300)"><rect x="-40" y="-40" width="80" height="60" fill="#f4e3c4" stroke="${INK}" stroke-width="4"/><path d="M-50,-38 L0,-80 L50,-38 Z" fill="#d9543b" stroke="${INK}" stroke-width="4"/></g>`
    for (let k = 0; k < 4; k++) { const q = ((p * 1.6 + k * 0.22) % 1); s += `<g transform="translate(${160 + q * (150 + k * 110)},${200 - Math.sin(q * Math.PI) * 120 + 60 * q})"><rect x="-22" y="-15" width="44" height="30" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M-22,-15 L0,4 L22,-15" fill="none" stroke="${INK}" stroke-width="3"/></g>` }
    return s + badge(590, 60, 'EVERY FRIDAY', '#ffcf3f', clamp(p * 3 - 0.3)) + badge(110, 60, String(b.n || 3), '#ffcf3f', clamp(p * 4)) }
  if (sc === 'reviews') { let s = `<rect width="${PW}" height="${PH}" fill="#fff"/><rect x="250" y="40" width="430" height="44" rx="22" fill="#f1f3f4" stroke="#c9d3de" stroke-width="2"/><text x="280" y="70" font-family="Inter" font-weight="900" font-size="18" fill="#5b6675">${esc(NOUN)} near me</text>`
    const rows = [['His ' + NOUN, 5, '#d4282f'], ['Corner ' + NOUN, 3, '#6b5640'], ['City ' + NOUN, 2, '#5b6675']]
    rows.forEach(([n, st, c], k) => { const q = clamp(p * 3 - k * 0.3); s += `<g transform="translate(250,${120 + k * 90})" opacity="${q}"><rect width="430" height="76" rx="10" fill="${k ? '#fff' : '#fff8e1'}" stroke="${k ? '#e3e7ec' : '#ffcf3f'}" stroke-width="3"/><text x="20" y="32" font-family="Inter" font-weight="900" font-size="20" fill="${c}">${n}</text>${Array.from({ length: 5 }, (_, j) => `<text x="${20 + j * 24}" y="62" font-size="20" fill="${j < st ? '#ffb400' : '#d6dce3'}">★</text>`).join('')}${k ? '' : '<text x="400" y="46" text-anchor="end" font-family="Inter" font-weight="900" font-size="16" fill="#2e9e6b">#1</text>'}</g>` })
    return s + person(120, 390, 1, { kind: 'rich', mood: 'smug', pose: 'point' }, t) + badge(110, 60, String(b.n || 4), '#ffcf3f', clamp(p * 4)) }
  if (sc === 'three') { let s = `<rect width="${PW}" height="${PH}" fill="#bfe1ff"/><rect y="${PH - 80}" width="${PW}" height="80" fill="#9aa3ad"/>`
    for (let k = 0; k < 3; k++) { const q = clamp(p * 3 - k * 0.5); s += `<g transform="translate(${130 + k * 230},${PH - 80}) scale(${back(q)})"><rect x="-90" y="-170" width="180" height="170" fill="#f6efe2" stroke="${INK}" stroke-width="4"/><rect x="-96" y="-196" width="192" height="30" fill="#e8463b" stroke="${INK}" stroke-width="4"/><text y="-174" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${NOUN.length > 9 ? 14 : 18}" fill="#fff">${esc(NOUN.toUpperCase())} ${k + 1}</text><rect x="-60" y="-140" width="120" height="70" fill="#bfe3ff" stroke="${INK}" stroke-width="3"/><rect x="-20" y="-64" width="40" height="64" fill="#8a5a3c" stroke="${INK}" stroke-width="3"/></g>` }
    for (let k = 0; k < 8; k++) s += `<text x="${(k * 97 + t * 40) % PW}" y="${(k * 61 + t * 120) % 200 + 20}" font-family="Inter" font-weight="900" font-size="30" fill="#2e9e6b" opacity=".85">£</text>`
    return s + person(360, PH - 70, 0.75, { kind: 'rich', mood: 'happy', pose: 'cheer' }, t) }
  if (sc === 'chat') { let s = `<rect width="${PW}" height="${PH}" fill="#eaf6ee"/>` + phone(470, 205, 1.2, 'blank', t) + person(160, 390, 1, { kind: 'rich', mood: 'smug', pose: 'point' }, t)
    const msgs = [['Are you open Sunday?', 0], ['Yes, 9 to 4. Want to book?', 1], ['Yes please!', 0]]
    msgs.forEach(([m, me], k) => { const q = clamp(p * 3.2 - k * 0.8); if (q > 0) s += `<g transform="translate(${me ? 488 : 452},${110 + k * 62}) scale(${back(q)})"><rect x="${me ? -10 : -70}" y="-20" width="${m.length * 7.6 + 16}" height="38" rx="14" fill="${me ? '#8ff06a' : '#fff'}" stroke="${INK}" stroke-width="2.5" transform="translate(${me ? -m.length * 7.6 + 70 : 0},0)"/><text x="${me ? -m.length * 7.6 + 68 : -62}" y="5" font-family="Inter" font-weight="900" font-size="13" fill="${INK}">${esc(m)}</text></g>` })
    return s + badge(110, 60, String(b.n || ''), '#ffcf3f', clamp(p * 4)) }
  if (sc === 'end') return `<rect width="${PW}" height="${PH}" fill="#f6efe2"/>` + person(360, 390, 1.25, { kind: 'rich', mood: 'happy', pose: 'wave' }, t)
  return `<rect width="${PW}" height="${PH}" fill="#ddd"/>`
}

export const BAKERY = {
  title: ['How Poor vs Rich People', 'Run the Same Bakery'],
  beats: [
    { text: 'How poor and rich people run the exact same bakery.', scene: 'split', key: 'bakery' },
    { text: 'A poor guy opens a bakery and prints five hundred flyers.', scene: 'flyers', key: 'flyers' },
    { text: 'He hands them out all day. Most end up in the bin.', scene: 'bin', key: 'bin' },
    { text: 'Then his nephew builds him a website for free.', scene: 'nephew', key: 'free' },
    { text: 'It takes eight seconds to load, and on a phone the buttons are tiny.', scene: 'slow', key: 'eight' },
    { text: 'Customers can’t order, can’t find the price, and leave.', scene: 'leave', key: 'leave', sfx: 'bad' },
    { text: 'So he decides the internet doesn’t work for bakeries.', scene: 'broke', key: 'internet' },
    { text: 'The rich guy opens the same bakery, but he has a different plan.', scene: 'rich', key: 'plan' },
    { text: 'First, a fast website that opens in one second on any phone.', scene: 'fast', key: 'fast', sfx: 'pop' },
    { text: 'Second, people order cakes online at midnight, while he sleeps.', scene: 'sleep', key: 'midnight', sfx: 'pop' },
    { text: 'Third, every order joins his email list, and every Friday he sends a new cake.', scene: 'email', key: 'Friday', sfx: 'pop' },
    { text: 'Fourth, he asks happy customers for reviews, so Google shows him first.', scene: 'reviews', key: 'first', sfx: 'pop' },
    { text: 'Now he has three bakeries, all making money.', scene: 'three', key: 'money', sfx: 'win' },
    { text: 'Same bakery. Different website.', scene: 'split', key: 'website' },
    { text: 'Follow for more.', scene: 'end', key: 'more' },
  ],
}

export function makeVersus(beats, timing, job) {
  const T = timing.beats, title = (job && job.title) || BAKERY.title, biz = (job && job.biz) || {}
  ITEM = biz.item || 'cake'; NOUN = biz.noun || 'bakery'; ORDER = biz.order || 'order'
  const at = (t) => { let i = 0; while (i < T.length - 1 && t >= T[i + 1].start) i++; return i }
  // the textured dark background (drawn once)
  let bg = `<defs><radialGradient id="bg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#3a3b3e"/><stop offset="1" stop-color="#0e0e10"/></radialGradient><clipPath id="panel"><rect x="0" y="0" width="${PW}" height="${PH}"/></clipPath><clipPath id="half"><rect x="360" y="0" width="360" height="${PH}"/></clipPath></defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`
  for (let k = 0; k < 420; k++) { const x = (k * 7919) % W, y = (k * 104729) % H; bg += `<rect x="${x}" y="${y}" width="2" height="2" fill="#fff" opacity="${0.03 + (k % 5) * 0.012}"/>` }
  bg += `<g><rect x="70" y="200" width="580" height="112" rx="18" fill="#fff"/><text x="360" y="247" text-anchor="middle" font-family="H" font-weight="800" font-size="36" fill="${INK}">${esc(title[0])}</text><text x="360" y="292" text-anchor="middle" font-family="H" font-weight="800" font-size="36" fill="${INK}">${esc(title[1])}</text></g>`
  return {
    frame(t) {
      const i = at(t), b = beats[i], tb = T[i], p = clamp((t - tb.start) / Math.max(0.3, tb.end - tb.start))
      const zoom = 1 + 0.05 * p                                       // a slow push-in on every picture
      let s = bg + `<g transform="translate(${PX},${PY})"><g clip-path="url(#panel)"><g transform="translate(${PW / 2},${PH / 2}) scale(${zoom}) translate(${-PW / 2},${-PH / 2})">${scene(b, p, t)}</g></g></g>`
      // the words of this line so far, the one being said in yellow
      const said = tb.words.filter((w) => t >= w.s - 0.02), recent = []
      for (let k = said.length - 1, n = 0; k >= 0; k--) { n += said[k].w.length + 1; if (n > 27 && recent.length) break; recent.unshift(said[k]) }   // what fits on one line
      if (recent.length) {
        const cur = recent[recent.length - 1]
        const line = recent.map((w) => `<tspan fill="${w === cur ? '#ffe600' : '#fff'}">${esc(w.w.replace(/[.,!?]$/, '')).toUpperCase()}</tspan>`).join(' ')
        s += `<text x="360" y="${PY + PH + 70}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" stroke="#000" stroke-width="8" stroke-linejoin="round" paint-order="stroke">${line}</text>`
      }
      return s
    },
  }
}
