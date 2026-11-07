// "Sketch" style (Install 11 concept): hand-drawn, wobbly ink lines that boil, big expressive head, noodle limbs.
// Our own character (not Rico's): round head, green round glasses, one hair tuft, white tee with a green pocket square,
// black sneakers. Everything is SVG; the hand-drawn wobble is an SVG filter whose seed changes every few frames.
export const INK = '#151515', PAPER = '#ddd7c6', SKIN = '#fbf8f1', GLASS = '#7fd35a', RED = '#d9534f'
export const roughDefs = (seed = 1, scale = 3.2) => `<filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/></filter>`
const L = (w = 6) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`

// ---- talking: the mouth opens with the voice (o.talk 0–1 = loudness this frame), shaped by the feeling ----
function talkMouth(ex, a, t) {
  const v = 0.75 + 0.25 * Math.sin(t * 17), w = 26 + 12 * v, h = 8 + 44 * a       // width wobbles like real vowels
  if (ex === 'panic' || ex === 'shocked') {                                     // yelling: wide, teeth, tongue
    const H2 = 18 + 70 * a
    return `<path d="M${-w - 14} 64 Q0 54 ${w + 14} 64 Q${w + 6} ${64 + H2} 0 ${68 + H2} Q${-w - 6} ${64 + H2} ${-w - 14} 64 Z" fill="${INK}"/><path d="M${-w - 6} 66 Q0 60 ${w + 6} 66 L${w} 76 Q0 72 ${-w} 76 Z" fill="#fff"/><ellipse cx="0" cy="${60 + H2}" rx="${w * 0.6}" ry="${6 + H2 * 0.14}" fill="#e2706a"/>`
  }
  if (ex === 'cry') {                                                           // crying: a wobbly, downturned open mouth
    return `<path d="M${-w} ${92 + h * 0.2} Q${-w * 0.5} ${70 - h * 0.1} 0 ${72 + Math.sin(t * 30) * 3} Q${w * 0.5} ${70 - h * 0.1} ${w} ${92 + h * 0.2} Q0 ${92 + h * 0.6} ${-w} ${92 + h * 0.2} Z" fill="${INK}"/>`
  }
  return `<ellipse cx="0" cy="${80 + h * 0.3}" rx="${w}" ry="${Math.max(5, h * 0.55)}" fill="${INK}"/>${h > 22 ? `<ellipse cx="0" cy="${80 + h * 0.62}" rx="${w * 0.55}" ry="${h * 0.16}" fill="#e2706a"/>` : ''}`
}
// ---- the face ----
const EX = {
  neutral: { eye: 'n', brow: [-6, 6], mouth: 'smile' },
  happy: { eye: 'arc', brow: [-10, 10], mouth: 'grin' },
  shocked: { eye: 'huge', brow: [-22, 22], mouth: 'O', sweat: 2, hairUp: true },
  panic: { eye: 'huge', brow: [18, -18], mouth: 'teeth', sweat: 4, hairUp: true },
  smug: { eye: 'lid', brow: [4, -16], mouth: 'smirk' },
  melt: { eye: 'down', brow: [8, -8], mouth: 'wavy' },
  cry: { eye: 'cry', brow: [16, -16], mouth: 'sad' },
  focus: { eye: 'squint', brow: [12, -12], mouth: 'tongue', sweat: 1 },
}
export function head(ex = 'neutral', o = {}) {
  const f = EX[ex] || EX.neutral, look = o.look || [0, 0], shake = o.shake ? Math.sin(o.t * 70) * 3 : 0
  const eye = (cx, side) => {
    const px = cx + look[0] * 10 + shake, py = -8 + look[1] * 8
    if (o.blink && !['arc', 'down', 'lid'].includes(f.eye)) return `<path d="M${cx - 26} -6 Q${cx} 4 ${cx + 26} -6" fill="none" ${L(6)}/>`
    switch (f.eye) {
      case 'arc': return `<path d="M${cx - 24} -2 Q${cx} -30 ${cx + 24} -2" fill="none" ${L(7)}/>`
      case 'down': return `<path d="M${cx - 24} -12 Q${cx} 10 ${cx + 24} -12" fill="none" ${L(7)}/>`
      case 'huge': return `<ellipse cx="${cx}" cy="-16" rx="37" ry="62" fill="#fff" ${L(7)}/><circle cx="${px}" cy="${py - 10}" r="8" fill="${INK}"/>`
      case 'lid': return `<ellipse cx="${cx}" cy="-8" rx="28" ry="34" fill="#fff" ${L(6)}/><circle cx="${px + 6}" cy="${py + 6}" r="12" fill="${INK}"/><path d="M${cx - 30} -14 Q${cx} -20 ${cx + 30} -14 L${cx + 30} -44 L${cx - 30} -44 Z" fill="${SKIN}"/><path d="M${cx - 30} -14 Q${cx} -20 ${cx + 30} -14" fill="none" ${L(6)}/>`
      case 'squint': return `<path d="M${cx - 24} -10 L${cx + 24} -4" ${L(7)}/>`
      case 'cry': return `<ellipse cx="${cx}" cy="-8" rx="28" ry="34" fill="#fff" ${L(6)}/><circle cx="${px}" cy="${py + 4}" r="13" fill="${INK}"/><path d="M${cx - 10} 24 Q${cx - 18} 80 ${cx - 6} 130" fill="none" stroke="#8ec9ff" stroke-width="10" stroke-linecap="round" opacity=".85"/>`
      default: return `<ellipse cx="${cx}" cy="-8" rx="33" ry="42" fill="#fff" ${L(6)}/><ellipse cx="${px}" cy="${py + 2}" rx="15" ry="18" fill="${INK}"/><circle cx="${px + 5}" cy="${py - 5}" r="5" fill="#fff"/>`
    }
  }
  const mouth = {
    smile: `<path d="M-30 78 Q0 96 30 78" fill="none" ${L(6)}/>`,
    grin: `<path d="M-46 66 Q0 74 46 66 Q36 124 0 124 Q-36 124 -46 66 Z" fill="${INK}"/><path d="M-36 70 Q0 76 36 70 L32 84 Q0 88 -32 84 Z" fill="#fff"/><path d="M-20 112 Q0 100 20 112 Q0 122 -20 112 Z" fill="#e2706a"/>`,
    O: `<ellipse cx="0" cy="92" rx="22" ry="32" fill="${INK}"/><ellipse cx="0" cy="108" rx="12" ry="9" fill="#e2706a"/>`,
    teeth: `<rect x="-52" y="62" width="104" height="44" rx="16" fill="#fff" ${L(6)}/><path d="M-52 84 L52 84 M-30 62 L-30 106 M-8 62 L-8 106 M14 62 L14 106 M36 62 L36 106" ${L(4)}/>`,
    smirk: `<path d="M-26 86 Q10 92 36 70" fill="none" ${L(6)}/><path d="M30 64 Q40 70 38 78" fill="none" ${L(4)}/>`,
    wavy: `<path d="M-36 82 Q-24 92 -12 82 Q0 72 12 82 Q24 92 36 82" fill="none" ${L(6)}/>`,
    sad: `<path d="M-30 96 Q0 74 30 96" fill="none" ${L(6)}/>`,
    tongue: `<path d="M-24 82 Q0 88 24 82" fill="none" ${L(6)}/><path d="M10 84 Q22 106 32 86" fill="#e2706a" ${L(4)}/>`,
  }[f.mouth]
  const mo = o.talk > 0.1 ? talkMouth(ex, o.talk, o.t || 0) : mouth
  const sweat = [...Array(f.sweat || 0)].map((_, i) => `<path d="M${-120 + i * 70 + (i > 1 ? 120 : 0)} ${-40 + i * 24} q-9 16 0 22 q9 -6 0 -22 Z" fill="#a8d8ff" ${L(3)}/>`).join('')
  return `<g transform="translate(${shake} 0)">
    <path d="M-104 14 Q-128 22 -118 46 Q-108 58 -96 46" fill="${SKIN}" ${L(6)}/><path d="M104 14 Q128 22 118 46 Q108 58 96 46" fill="${SKIN}" ${L(6)}/>
    <path d="M-100 -20 Q-112 -128 -6 -140 Q108 -142 106 -18 Q110 96 4 134 Q-96 112 -100 -20 Z" fill="${SKIN}" ${L(7)}/>
    ${f.hairUp ? '<path d="M-36 -134 L-50 -176 M-6 -140 L-4 -190 M26 -136 L44 -180 M54 -124 L80 -160" ' + L(5) + '/>' : '<path d="M-14 -140 Q-30 -178 -2 -186 Q-6 -160 18 -150 Q16 -176 40 -176 Q30 -156 26 -138" fill="none" ' + L(6) + '/>'}
    <path d="M${-72} ${-60 + f.brow[0]} L${-30} ${-66 - f.brow[0] * 0.3}" ${L(9)}/><path d="M${30} ${-66 - f.brow[1] * 0.3} L${72} ${-60 + f.brow[1]}" ${L(9)}/>
    ${f.eye === 'huge' ? '' : eye(-40, -1) + eye(40, 1)}
    <circle cx="-40" cy="-8" r="48" fill="none" stroke="${GLASS}" stroke-width="8"/><circle cx="40" cy="-8" r="48" fill="none" stroke="${GLASS}" stroke-width="8"/><path d="M-6 -12 Q0 -18 6 -12" fill="none" stroke="${GLASS}" stroke-width="6"/>
    ${f.eye === 'huge' ? eye(-40, -1) + eye(40, 1) : ''}
    <circle cx="0" cy="36" r="20" fill="${SKIN}" ${L(6)}/><path d="M-8 44 Q-4 48 0 44" fill="none" ${L(4)}/>
    ${mo}${sweat}
  </g>`
}

// ---- the body: noodle limbs on a small tee ----
const ARMS = {
  rest: [[-46, -240, -86, -150, -92, -70], [46, -240, 86, -150, 92, -70]],
  type: [[-46, -240, -96, -170, -40, -150], [46, -240, 96, -170, 40, -150]],
  head: [[-46, -250, -170, -330, -110, -400], [46, -250, 170, -330, 110, -400]],       // hands on head (panic)
  point: [[-46, -240, -86, -150, -92, -70], [46, -250, 150, -300, 230, -330]],
  phone: [[-46, -240, -86, -150, -92, -70], [46, -240, 90, -170, 40, -300]],
  cheer: [[-46, -250, -130, -360, -110, -450], [46, -250, 130, -360, 110, -450]],
  shrug: [[-46, -240, -150, -220, -170, -290], [46, -240, 150, -220, 170, -290]],
  wave: [[-46, -240, -86, -150, -92, -70], [46, -250, 160, -320, 175, -430]],           // one hand up, saying hello or goodbye
}
const hand = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="19" ry="16" fill="${INK}"/><ellipse cx="${x - 14}" cy="${y - 10}" rx="7" ry="10" fill="${INK}" transform="rotate(-30 ${x - 14} ${y - 10})"/>`
export function guy(x, y, s = 1, ex = 'neutral', pose = 'rest', o = {}) {
  const [a, b] = ARMS[pose] || ARMS.rest, bob = o.bob || 0
  const limb = (p) => `<path d="M${p[0]} ${p[1]} Q${p[2]} ${p[3]} ${p[4]} ${p[5]}" fill="none" ${L(9)}/>${hand(p[4], p[5])}`
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#rough)">
    <ellipse cx="0" cy="4" rx="100" ry="12" fill="rgba(0,0,0,.12)"/>
    <path d="M-26 -120 Q-36 -60 -40 -14 M26 -120 Q36 -60 40 -14" fill="none" ${L(9)}/>
    <path d="M-80 -4 Q-80 -32 -42 -30 Q-18 -30 -18 -6 Z M80 -4 Q80 -32 42 -30 Q18 -30 18 -6 Z" fill="${INK}"/><path d="M-82 -4 L-16 -4 M82 -4 L16 -4" stroke="#fff" stroke-width="3"/>
    <g transform="translate(0 ${bob})">
      ${pose === 'head' || pose === 'cheer' ? '' : limb(a)}
      <path d="M-44 -256 Q-60 -246 -56 -200 Q-50 -150 -40 -112 Q0 -104 40 -112 Q50 -150 56 -200 Q60 -246 44 -256 Q0 -266 -44 -256 Z" fill="#fff" ${L(7)}/>
      <path d="M-18 -258 Q0 -244 18 -258" fill="none" ${L(5)}/><rect x="14" y="-222" width="22" height="18" rx="4" fill="${GLASS}" ${L(4)}/>
      ${pose === 'head' || pose === 'cheer' ? '' : limb(b)}
      <g transform="translate(0 ${-392 + (o.headBob || 0)}) rotate(${o.tilt || 0})">${head(ex, o)}</g>
      ${pose === 'head' || pose === 'cheer' ? limb(a) + limb(b) : ''}
    </g>
  </g>`
}
// extreme close-up of one eye (the panic shot)
export function eyeCloseup(w, h, o = {}) {
  const t = o.t || 0, sh = Math.sin(t * 60) * 4
  return `<rect width="${w}" height="${h}" fill="${SKIN}"/><g filter="url(#rough)" transform="translate(${w / 2 + sh} ${h * 0.46})">
    <path d="M-340 -330 Q0 -420 340 -330" fill="none" ${L(14)}/>
    <ellipse cx="0" cy="0" rx="290" ry="320" fill="#fff" ${L(12)}/>
    ${[...Array(11)].map((_, i) => { const a = (i / 11) * Math.PI * 2 + 0.3, c = Math.cos(a), sn = Math.sin(a), pt = (r, wob) => `${(c * r - sn * wob).toFixed(0)} ${(sn * r * 1.1 + c * wob).toFixed(0)}`; return `<path d="M${pt(284, 0)} Q${pt(240, 18)} ${pt(210, -6)} T${pt(150, 10)} M${pt(222, -2)} Q${pt(205, -26)} ${pt(186, -34)}" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>` }).join('')}
    <circle cx="${Math.sin(t * 40) * 6}" cy="10" r="38" fill="${INK}"/><circle cx="10" cy="-4" r="10" fill="#fff"/>
    <circle cx="0" cy="0" r="372" fill="none" stroke="${GLASS}" stroke-width="22"/>
    <path d="M220 -300 q-14 26 0 36 q14 -10 0 -36 Z" fill="#a8d8ff" ${L(5)}/></g>`
}
// props, drawn the same way
export const desk = (x, y, w, h = 330) => `<g filter="url(#rough)" transform="translate(${x} ${y})"><rect x="14" y="20" width="${w - 28}" height="${h}" fill="#b58c66" ${L(6)}/><path d="M40 ${h * 0.45} L${w - 40} ${h * 0.45}" ${L(5)}/><circle cx="${w / 2}" cy="${h * 0.3}" r="8" fill="${INK}"/><rect x="0" y="0" width="${w}" height="28" rx="6" fill="#c9a27c" ${L(6)}/></g>`
export function laptop(x, y, s = 1, screen = '', o = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#rough)"><path d="M-150 0 L150 0 L170 22 L-170 22 Z" fill="#9aa0a6" ${L(6)}/>
    <g transform="rotate(${o.open == null ? 0 : -o.open})"><rect x="-140" y="-200" width="280" height="196" rx="12" fill="#2a2d30" ${L(6)}/><g transform="translate(-128 -188)">${screen}</g></g></g>`
}
export const phone = (x, y, s = 1, screen = '', rot = 0) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(${rot})" filter="url(#rough)"><rect x="-80" y="-150" width="160" height="300" rx="24" fill="#1d1f21" ${L(6)}/><g transform="translate(-68 -132)">${screen}</g></g>`
export const room = (w, h) => `<rect width="${w}" height="${h}" fill="${PAPER}"/><g filter="url(#rough)" opacity=".75"><path d="M0 ${h * 0.62} L${w} ${h * 0.6}" ${L(5)}/><path d="M${w * 0.12} ${h * 0.12} L${w * 0.12} ${h * 0.4} L${w * 0.42} ${h * 0.4} L${w * 0.42} ${h * 0.12} Z M${w * 0.27} ${h * 0.12} L${w * 0.27} ${h * 0.4}" fill="#e9e5d8" ${L(5)}/><path d="M${w * 0.78} ${h * 0.1} q20 40 0 70" fill="none" ${L(4)}/><circle cx="${w * 0.78}" cy="${h * 0.1 + 86}" r="22" fill="#f2d98b" ${L(5)}/></g><rect width="${w}" height="${h}" filter="url(#paper)"/>`
export const laptopBack = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#rough)"><path d="M-150 -6 L150 -6 L160 10 L-160 10 Z" fill="#7d838a" ${L(6)}/><path d="M-140 -6 L-128 -196 L128 -196 L140 -6 Z" fill="#b8bec4" ${L(6)}/><circle cx="0" cy="-104" r="18" fill="${GLASS}" ${L(4)}/></g>`
