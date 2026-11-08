// The cast of a real story (Install 22): different people in the same hand-drawn sketch style as the host. Each has a
// look (sex, age, hair, skin, top colour) chosen by the story; the face moves with the voice and shows the feeling.
// The host (green round glasses) stays in sketch.mjs: he narrates; these are the characters in the story.
import { INK } from './sketch.mjs'

export const SKINS = { light: '#f7dfc8', tan: '#e2b083', brown: '#b5764c', dark: '#7b4a2c' }
export const TOPS = { red: '#e0574f', blue: '#4f86d9', green: '#5fb55a', yellow: '#f2c94c', purple: '#9b6bd6', orange: '#f08a3c', grey: '#9aa3ab', black: '#2b2d30' }
const HAIRC = ['#2a1d14', '#4a2c1a', '#1c1c1c', '#6b3f22']
const L = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
// the story's feelings, as faces
export const FACE_OF = { calm: 'neutral', happy: 'happy', excited: 'happy', curious: 'neutral', focus: 'focus', smug: 'smug', worried: 'worried', scared: 'scared', shock: 'shocked', panic: 'panic', angry: 'angry', sad: 'sad', cry: 'cry' }
// brow: how far the inner ends rise (+ worried/sad, − angry/focused); lift: both brows up (surprise)
const EX = {
  neutral: { eye: 'n', brow: 0, mouth: 'smile' }, happy: { eye: 'arc', brow: 2, lift: 6, mouth: 'grin' },
  shocked: { eye: 'huge', brow: 4, lift: 26, mouth: 'O' }, panic: { eye: 'huge', brow: 14, lift: 16, mouth: 'teeth', sweat: 3 },
  smug: { eye: 'lid', brow: -6, mouth: 'smirk' }, focus: { eye: 'squint', brow: -12, mouth: 'flat' },
  worried: { eye: 'n', brow: 14, lift: 4, mouth: 'wavy', sweat: 1 }, scared: { eye: 'huge', brow: 16, lift: 14, mouth: 'wavy', sweat: 2 },
  angry: { eye: 'squint', brow: -20, mouth: 'teethShut', red: true }, sad: { eye: 'down', brow: 14, mouth: 'sad' },
  cry: { eye: 'cry', brow: 18, mouth: 'sad' },
}
function talkMouth(ex, a, t) {
  const v = 0.75 + 0.25 * Math.sin(t * 17), w = 22 + 10 * v, h = 8 + 40 * a
  if (ex === 'shocked' || ex === 'scared' || ex === 'worried') { const h2 = 16 + 46 * a; return `<ellipse cx="0" cy="${80 + h2 * 0.2}" rx="${ex === 'shocked' ? 20 + 6 * v : 16 + 8 * v}" ry="${h2 * 0.6}" fill="${INK}"/>` }   // talking in shock or fear: an open O, never a grin
  if (ex === 'sad' || ex === 'cry') return `<path d="M${-w} ${90 + h * 0.2} Q0 ${68 - h * 0.1} ${w} ${90 + h * 0.2} Q0 ${90 + h * 0.6} ${-w} ${90 + h * 0.2} Z" fill="${INK}"/>`
  if (ex === 'panic' || ex === 'angry') { const H2 = 16 + 60 * a; return `<path d="M${-w - 10} 62 Q0 54 ${w + 10} 62 Q${w + 4} ${62 + H2} 0 ${66 + H2} Q${-w - 4} ${62 + H2} ${-w - 10} 62 Z" fill="${INK}"/><path d="M${-w - 4} 64 Q0 59 ${w + 4} 64 L${w} 72 Q0 69 ${-w} 72 Z" fill="#fff"/>` }
  return `<ellipse cx="0" cy="${78 + h * 0.3}" rx="${w}" ry="${Math.max(5, h * 0.55)}" fill="${INK}"/>${h > 22 ? `<ellipse cx="0" cy="${78 + h * 0.6}" rx="${w * 0.55}" ry="${h * 0.16}" fill="#e2706a"/>` : ''}`
}
function hair(p, back) {
  const c = p.age === 'older' ? '#c9c9c9' : HAIRC[(p.id || 'a').charCodeAt(0) % HAIRC.length]
  const k = p.hair
  if (back) {                                                     // drawn behind the head
    if (k === 'long') return `<path d="M-108 -40 Q-130 80 -112 170 L-60 150 Q-80 40 -70 -60 Z M108 -40 Q130 80 112 170 L60 150 Q80 40 70 -60 Z" fill="${c}" ${L(6)}/>`
    if (k === 'afro') return `<circle cx="0" cy="-70" r="150" fill="${c}" ${L(6)}/>`
    if (k === 'curly') return [...Array(9)].map((_, i) => { const a = Math.PI * (0.95 + i * 0.137); return `<circle cx="${Math.cos(a) * 112}" cy="${Math.sin(a) * 112 - 30}" r="38" fill="${c}" ${L(5)}/>` }).join('')
    if (k === 'bun') return `<circle cx="0" cy="-168" r="44" fill="${c}" ${L(6)}/>`
    return ''
  }
  if (k === 'bald') return `<path d="M-40 -126 Q0 -136 40 -126" fill="none" stroke="#fff" stroke-width="6" opacity=".5"/>`
  if (k === 'afro' || k === 'curly') return ''
  return `<path d="M-104 -30 Q-112 -140 -4 -146 Q106 -146 104 -30 Q90 -96 40 -104 Q-10 -84 -60 -100 Q-92 -88 -104 -30 Z" fill="${c}" ${L(6)}/>`   // short, long, bun: a fringe on top
}
export function face(p, ex = 'neutral', o = {}) {
  const f = EX[ex] || EX.neutral, skin = SKINS[p.skin] || SKINS.tan, look = o.look || [0, 0], shake = o.shake ? Math.sin(o.t * 70) * 3 : 0
  const eye = (cx) => {
    const px = cx + look[0] * 9 + shake, py = -8 + look[1] * 7
    if (o.blink && ['n', 'huge', 'cry'].includes(f.eye)) return `<path d="M${cx - 22} -6 Q${cx} 4 ${cx + 22} -6" fill="none" ${L(6)}/>`
    switch (f.eye) {
      case 'arc': return `<path d="M${cx - 22} -2 Q${cx} -28 ${cx + 22} -2" fill="none" ${L(7)}/>`
      case 'down': return `<path d="M${cx - 22} -10 Q${cx} 8 ${cx + 22} -10" fill="none" ${L(7)}/>`
      case 'huge': return `<ellipse cx="${cx}" cy="-12" rx="30" ry="46" fill="#fff" ${L(6)}/><circle cx="${px}" cy="${py - 6}" r="8" fill="${INK}"/>`
      case 'lid': return `<ellipse cx="${cx}" cy="-6" rx="24" ry="28" fill="#fff" ${L(6)}/><circle cx="${px + 5}" cy="${py + 5}" r="10" fill="${INK}"/><path d="M${cx - 26} -12 L${cx + 26} -12 L${cx + 26} -38 L${cx - 26} -38 Z" fill="${skin}"/><path d="M${cx - 26} -12 L${cx + 26} -12" ${L(6)}/>`
      case 'squint': return `<path d="M${cx - 22} -10 L${cx + 22} -4" ${L(7)}/>`
      case 'cry': return `<ellipse cx="${cx}" cy="-6" rx="24" ry="28" fill="#fff" ${L(6)}/><circle cx="${px}" cy="${py + 4}" r="11" fill="${INK}"/><path d="M${cx - 8} 22 Q${cx - 14} 70 ${cx - 4} 110" fill="none" stroke="#8ec9ff" stroke-width="9" stroke-linecap="round"/>`
      default: return `<ellipse cx="${cx}" cy="-6" rx="26" ry="32" fill="#fff" ${L(6)}/><ellipse cx="${px}" cy="${py + 2}" rx="12" ry="15" fill="${INK}"/><circle cx="${px + 4}" cy="${py - 4}" r="4" fill="#fff"/>`
    }
  }
  const mouth = {
    smile: `<path d="M-26 76 Q0 92 26 76" fill="none" ${L(6)}/>`, flat: `<path d="M-22 82 L22 80" ${L(6)}/>`,
    grin: `<path d="M-40 64 Q0 72 40 64 Q30 116 0 116 Q-30 116 -40 64 Z" fill="${INK}"/><path d="M-30 68 Q0 73 30 68 L27 80 Q0 84 -27 80 Z" fill="#fff"/>`,
    O: `<ellipse cx="0" cy="88" rx="18" ry="26" fill="${INK}"/>`, wavy: `<path d="M-30 84 Q-20 92 -10 84 Q0 76 10 84 Q20 92 30 84" fill="none" ${L(6)}/>`,
    teeth: `<rect x="-44" y="60" width="88" height="38" rx="14" fill="#fff" ${L(6)}/><path d="M-44 79 L44 79" ${L(4)}/>`,
    teethShut: `<rect x="-36" y="70" width="72" height="22" rx="8" fill="#fff" ${L(6)}/><path d="M-12 70 L-12 92 M12 70 L12 92" ${L(3)}/>`,
    smirk: `<path d="M-22 84 Q10 90 32 70" fill="none" ${L(6)}/>`, sad: `<path d="M-26 92 Q0 72 26 92" fill="none" ${L(6)}/>`,
  }[f.mouth]
  const mo = o.talk > 0.1 ? talkMouth(ex, o.talk, o.t || 0) : mouth
  const sweat = [...Array(f.sweat || 0)].map((_, i) => `<path d="M${-104 + i * 190} ${-46 + i * 20} q-8 14 0 20 q8 -6 0 -20 Z" fill="#a8d8ff" ${L(3)}/>`).join('')
  const ear = (s) => `<path d="M${s * 96} 10 Q${s * 118} 18 ${s * 110} 40 Q${s * 100} 52 ${s * 88} 42" fill="${skin}" ${L(6)}/>`
  return `<g transform="translate(${shake} 0)">${hair(p, true)}${ear(-1)}${ear(1)}
    <path d="M-92 -20 Q-102 -120 -4 -132 Q100 -134 96 -18 Q100 88 4 124 Q-88 104 -92 -20 Z" fill="${skin}" ${L(7)}/>
    ${f.red ? `<ellipse cx="0" cy="-60" rx="70" ry="30" fill="${'#e0574f'}" opacity=".18"/>` : ''}${hair(p, false)}
    ${p.sex === 'f' && p.hair !== 'long' ? `<circle cx="-100" cy="52" r="7" fill="#f2c94c" ${L(3)}/><circle cx="100" cy="52" r="7" fill="#f2c94c" ${L(3)}/>` : ''}
    ${[-1, 1].map((s) => `<path d="M${s * 64} ${-54 - (f.lift || 0) + f.brow * 0.35} L${s * 26} ${-60 - (f.lift || 0) - f.brow}" ${L(8)}/>`).join('')}
    ${eye(-38)}${eye(38)}
    ${p.age === 'older' ? `<circle cx="-38" cy="-6" r="36" fill="none" ${L(5)}/><circle cx="38" cy="-6" r="36" fill="none" ${L(5)}/><path d="M-4 -8 Q0 -14 4 -8" fill="none" ${L(4)}/>` : ''}
    <path d="M-4 30 Q-12 50 4 52" fill="none" ${L(5)}/>
    ${p.sex === 'm' && p.age !== 'young' && (p.id || '').charCodeAt(0) % 2 ? `<path d="M-60 70 Q-50 128 0 136 Q50 128 60 70" fill="none" ${L(4)} stroke-dasharray="3 9"/>` : ''}
    ${mo}${sweat}</g>`
}
const ARMS = {
  rest: [[-44, -236, -80, -150, -86, -70], [44, -236, 80, -150, 86, -70]],
  talk: [[-44, -236, -80, -150, -86, -70], [44, -236, 110, -190, 120, -250]],
  head: [[-44, -246, -160, -320, -100, -390], [44, -246, 160, -320, 100, -390]],
  phone: [[-44, -236, -80, -150, -86, -70], [44, -236, 86, -170, 36, -300]],
  point: [[-44, -236, -80, -150, -86, -70], [44, -246, 140, -290, 216, -320]],
  cheer: [[-44, -246, -120, -350, -100, -440], [44, -246, 120, -350, 100, -440]],
  cross: [[-44, -236, 20, -180, 60, -190], [44, -236, -20, -170, -60, -180]],
}
const hand = (x, y, skin) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="15" fill="${skin}" ${L(5)}/>`
// a whole person standing (x, y at the feet), facing the camera; o: { talk, t, blink, look, bob, flip, pose }
export function person(p, x, y, s = 1, emotion = 'calm', o = {}) {
  const ex = FACE_OF[emotion] || 'neutral', skin = SKINS[p.skin] || SKINS.tan, top = TOPS[p.top] || TOPS.blue
  const pose = o.pose || (['panic', 'scared'].includes(emotion) ? 'head' : emotion === 'angry' ? 'cross' : o.talk > 0.1 ? 'talk' : 'rest')
  const [a, b] = ARMS[pose] || ARMS.rest, bob = o.bob || 0, w = p.sex === 'f' ? 0.9 : 1, older = p.age === 'older'
  const limb = (q) => `<path d="M${q[0]} ${q[1]} Q${q[2]} ${q[3]} ${q[4]} ${q[5]}" fill="none" stroke="${top}" stroke-width="16" stroke-linecap="round"/><path d="M${q[0]} ${q[1]} Q${q[2]} ${q[3]} ${q[4]} ${q[5]}" fill="none" ${L(3)} opacity=".6"/>${hand(q[4], q[5], skin)}`
  const legs = p.sex === 'f' && (p.id || '').charCodeAt(0) % 2 ? `<path d="M-46 -118 L-62 -40 L62 -40 L46 -118 Z" fill="${top}" ${L(6)} opacity=".95"/><path d="M-26 -40 L-30 -12 M26 -40 L30 -12" ${L(9)}/>`
    : `<path d="M-26 -118 Q-34 -60 -38 -14 M26 -118 Q34 -60 38 -14" fill="none" stroke="#3b4a63" stroke-width="18" stroke-linecap="round"/>`
  return `<g transform="translate(${x} ${y}) scale(${s * (o.flip ? -1 : 1)} ${s})" filter="url(#rough)">
    <ellipse cx="0" cy="4" rx="96" ry="12" fill="rgba(0,0,0,.12)"/>${legs}
    <path d="M-76 -4 Q-76 -30 -40 -28 Q-16 -28 -16 -6 Z M76 -4 Q76 -30 40 -28 Q16 -28 16 -6 Z" fill="${INK}"/>
    <g transform="translate(0 ${bob + (older ? 6 : 0)})">
      ${pose === 'head' || pose === 'cheer' ? '' : limb(a)}
      <path d="M${-44 * w} -252 Q${-62 * w} -240 ${-56 * w} -196 Q${-50 * w} -150 ${-40 * w} -112 Q0 -104 ${40 * w} -112 Q${50 * w} -150 ${56 * w} -196 Q${62 * w} -240 ${44 * w} -252 Q0 -262 ${-44 * w} -252 Z" fill="${top}" ${L(7)}/>
      <path d="M-16 -254 Q0 -238 16 -254" fill="none" ${L(5)}/>
      ${pose === 'head' || pose === 'cheer' ? '' : limb(b)}
      <g transform="translate(0 ${-382 + (o.headBob || 0)}) rotate(${(o.tilt || 0) * (o.flip ? -1 : 1)}) scale(${o.flip ? -1 : 1} 1)">${face(p, ex, o)}</g>
      ${pose === 'head' || pose === 'cheer' ? limb(a) + limb(b) : ''}
    </g></g>`
}
// head and shoulders, for close-ups and the thumbnail
export function bust(p, x, y, s = 1, emotion = 'calm', o = {}) {
  const ex = FACE_OF[emotion] || 'neutral', top = TOPS[p.top] || TOPS.blue
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#rough)">
    <path d="M-38 90 L-42 150 L42 150 L38 90 Z" fill="${SKINS[p.skin] || SKINS.tan}" ${L(6)}/>
    <path d="M-170 260 Q-160 150 -60 136 L60 136 Q160 150 170 260 Z" fill="${top}" ${L(7)}/><path d="M-30 136 Q0 160 30 136" fill="none" ${L(5)}/>
    <g transform="translate(0 0)">${face(p, ex, o)}</g></g>`
}
