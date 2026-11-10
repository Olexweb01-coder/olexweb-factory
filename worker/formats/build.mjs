// Format "build": "You build X" explainers, the shape of the Shorts that get watched to the end. The viewer is the one
// building ("You lay a cable…"), every line is a step you can SEE happen, each step causes a problem ("But…") that the
// next step fixes ("So…"), the camera never stops moving, one big word on screen at a time, and it ends on the finished
// thing working ("Congratulations!"). This file is the first world: the undersea internet cable, as a cut-through view
// (sky, sea, sea floor) 720×1280. A new topic is a new world drawn with the same pieces: beats + what each one shows.
export const W = 720, H = 1280
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const out = (x) => 1 - Math.pow(1 - clamp(x), 3)
const back = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
const lerp = (a, b, k) => a + (b - a) * k
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ---------- the world: x from -900 (home port) to 4900 (your street); sea level y = 420 ----------
const SEA = 420, SHORE_L = 520, SHORE_R = 3650
export function bed(x) {
  if (x < SHORE_L) return 392
  if (x < 980) return lerp(430, 830, ease((x - SHORE_L) / (980 - SHORE_L)))
  if (x < 3150) return 830 + 34 * Math.sin(x / 230) + 18 * Math.sin(x / 71)
  if (x < SHORE_R) return lerp(830 + 34 * Math.sin(3150 / 230) + 18 * Math.sin(3150 / 71), 430, ease((x - 3150) / (SHORE_R - 3150)))
  return 392
}
const bedPath = (a, b, dy = 0, step = 12) => { let d = ''; for (let x = a; x <= b; x += step) d += `${x === a ? 'M' : 'L'}${x.toFixed(1)},${(bed(x) + dy).toFixed(1)}`; return d }

// the cable: orange with a dark edge, so it stands out from the sea floor's outline
const rope = (d, extra = '') => `<path d="${d}" fill="none" stroke="#1c1d22" stroke-width="12" stroke-linecap="round" ${extra}/><path d="${d}" fill="none" stroke="#ff8a1f" stroke-width="6" stroke-linecap="round" ${extra}/>`
// cable laid so far (from the left shore to xEnd), buried near the shore once ploughed
function cable(xEnd, buried, lit, t, repeaters) {
  if (xEnd <= SHORE_L + 40) return ''
  const end = Math.min(xEnd, SHORE_R + 60)
  let s = ''
  const shoreIn = `M${SHORE_L + 60},${SEA - 4}`
  // shallow part: on the sand, or (after the plough) under it
  const shallowEnd = Math.min(end, 980)
  s += rope(`${shoreIn} ${bedPath(SHORE_L + 70, shallowEnd, buried > 0 ? lerp(-9, 26, buried) : -9).replace('M', 'L')}`, buried > 0.98 ? 'stroke-dasharray="14 9" opacity=".8"' : '')
  if (end > 980) s += rope(bedPath(980, end, -9))
  if (xEnd > SHORE_R) s += rope(`M${SHORE_R},${bed(SHORE_R) + 20} L${SHORE_R + 150},${bed(SHORE_R) + 26}`, 'stroke-dasharray="14 9" opacity=".8"')
  // light inside: pulses moving left to right; dim in the middle until the repeaters are in
  if (lit > 0) for (let k = 0; k < 14; k++) {
    const x = SHORE_L + ((t * 520 + k * 260) % (end - SHORE_L))
    const fade = repeaters > 0 ? lerp(Math.max(0.12, 1 - (x - SHORE_L) / 2400), 1, repeaters) : Math.max(0.12, 1 - (x - SHORE_L) / 2400)
    s += `<circle cx="${x}" cy="${bed(x) - 9}" r="${12 * lit}" fill="#bffcff" opacity="${(lit * fade).toFixed(2)}" filter="url(#glow)"/>`
  }
  for (let k = 0; k < repeaters * 9; k++) {
    const x = 1150 + k * 250; if (x > end) break
    const s1 = back(clamp(repeaters * 9 - k))
    s += `<g transform="translate(${x},${bed(x) - 9}) scale(${s1})"><rect x="-22" y="-11" width="44" height="22" rx="11" fill="#ffcf3f" stroke="#1c1d22" stroke-width="4"/><circle cx="0" cy="0" r="4" fill="#fff"/></g>`
  }
  return s
}
function ship(x, spool, t) {
  const bob = Math.sin(t * 2.4) * 3, tilt = Math.sin(t * 1.7) * 1.2
  return `<g transform="translate(${x},${SEA - 6 + bob}) rotate(${tilt})">
    <path d="M-150,-10 L150,-10 L118,46 L-128,46 Z" fill="#e8463b" stroke="#1c1d22" stroke-width="5" stroke-linejoin="round"/>
    <rect x="-150" y="-10" width="300" height="12" fill="#f4f1ea" stroke="#1c1d22" stroke-width="5"/>
    <rect x="40" y="-86" width="78" height="76" rx="6" fill="#f4f1ea" stroke="#1c1d22" stroke-width="5"/>
    <rect x="52" y="-74" width="22" height="16" rx="3" fill="#7cc6ff" stroke="#1c1d22" stroke-width="3"/><rect x="84" y="-74" width="22" height="16" rx="3" fill="#7cc6ff" stroke="#1c1d22" stroke-width="3"/>
    <rect x="70" y="-112" width="14" height="28" fill="#1c1d22"/>
    <g transform="translate(-70,-40)"><circle r="${30 + 18 * spool}" fill="#2a2b31" stroke="#1c1d22" stroke-width="5"/><circle r="${24 + 18 * spool}" fill="none" stroke="#45474f" stroke-width="3" stroke-dasharray="6 5"/><circle r="10" fill="#ffcf3f" stroke="#1c1d22" stroke-width="4"/></g>
    <path d="M-150,2 Q-190,40 -200,90" fill="none" stroke="#1c1d22" stroke-width="6"/>
  </g>`
}
function building(x, kind, grow, t) {
  if (grow <= 0) return ''
  const g = back(grow), y = 392
  if (kind === 'station') return `<g transform="translate(${x},${y}) scale(1,${g})"><rect x="-70" y="-96" width="140" height="96" fill="#dfe6ee" stroke="#1c1d22" stroke-width="5"/><path d="M-80,-96 L80,-96 L60,-122 L-60,-122 Z" fill="#8b98a8" stroke="#1c1d22" stroke-width="5"/><rect x="-18" y="-50" width="36" height="50" fill="#5b6675" stroke="#1c1d22" stroke-width="4"/><text x="0" y="-66" font-family="Inter" font-weight="900" font-size="15" text-anchor="middle" fill="#1c1d22">LANDING</text></g>`
  if (kind === 'data') {
    let r = ''; for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) r += `<rect x="${-96 + i * 50}" y="${-160 + j * 24}" width="40" height="18" rx="3" fill="#20232b"/><circle cx="${-88 + i * 50}" cy="${-151 + j * 24}" r="3.5" fill="${(Math.floor(t * 6) + i * 3 + j) % 4 ? '#8ff06a' : '#2f6b28'}"/><circle cx="${-77 + i * 50}" cy="${-151 + j * 24}" r="3.5" fill="${(Math.floor(t * 5) + i + j * 2) % 3 ? '#62d6ff' : '#245a6b'}"/>`
    return `<g transform="translate(${x},${y}) scale(1,${g})"><rect x="-110" y="-180" width="220" height="180" fill="#c9d3de" stroke="#1c1d22" stroke-width="5"/><rect x="-102" y="-170" width="204" height="158" fill="#3a3f4b"/>${r}<rect x="-110" y="-196" width="220" height="16" fill="#8b98a8" stroke="#1c1d22" stroke-width="5"/></g>`
  }
  if (kind === 'tower') {
    let w = ''; for (let k = 0; k < 3; k++) { const p = (t * 0.9 + k / 3) % 1; w += `<path d="M${-40 - 90 * p},${-300 - 30 * p} Q0,${-360 - 70 * p} ${40 + 90 * p},${-300 - 30 * p}" fill="none" stroke="#8ff06a" stroke-width="6" opacity="${(1 - p) * clamp(grow * 2 - 1)}" stroke-linecap="round"/>` }
    return `<g transform="translate(${x},${y})"><g transform="scale(1,${g})"><path d="M-40,0 L0,-300 L40,0 M-30,-70 L30,-70 M-20,-150 L20,-150 M-12,-225 L12,-225 M-30,-70 L20,-150 M-20,-150 L12,-225" fill="none" stroke="#1c1d22" stroke-width="6" stroke-linejoin="round"/><circle cx="0" cy="-306" r="10" fill="#e8463b" stroke="#1c1d22" stroke-width="4"/></g>${w}</g>`
  }
  if (kind === 'house') return `<g transform="translate(${x},${y}) scale(${g})"><rect x="-60" y="-80" width="120" height="80" fill="#f4e3c4" stroke="#1c1d22" stroke-width="5"/><path d="M-76,-78 L0,-140 L76,-78 Z" fill="#d9543b" stroke="#1c1d22" stroke-width="5" stroke-linejoin="round"/><rect x="-14" y="-44" width="28" height="44" fill="#8a5a3c" stroke="#1c1d22" stroke-width="4"/><rect x="-48" y="-62" width="24" height="22" fill="#ffe27a" stroke="#1c1d22" stroke-width="4"/><rect x="24" y="-62" width="24" height="22" fill="#ffe27a" stroke="#1c1d22" stroke-width="4"/></g>`
  return ''
}
function shark(x, y, flip, bite) {
  const jaw = bite > 0 ? Math.abs(Math.sin(bite * 18)) * 14 : 4
  return `<g transform="translate(${x},${y}) scale(${flip ? -1 : 1},1)"><path d="M-120,0 Q-40,-46 70,-14 Q100,-6 112,6 Q90,${12 + jaw} 64,${16 + jaw} Q-20,40 -120,0 Z" fill="#7d8fa3" stroke="#1c1d22" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-20,-30 L0,-74 L20,-24" fill="#7d8fa3" stroke="#1c1d22" stroke-width="5" stroke-linejoin="round"/><path d="M-120,0 L-170,-40 L-150,0 L-172,36 Z" fill="#7d8fa3" stroke="#1c1d22" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30,14 Q-10,30 -60,14" fill="#dfe6ee" opacity=".8"/><circle cx="74" cy="-6" r="5" fill="#1c1d22"/><path d="M84,${10 + jaw / 2} l6,6 l6,-6 l6,6" fill="none" stroke="#fff" stroke-width="3"/></g>`
}
function fish(t, x0, y0, n, dir = 1) {
  let s = ''; for (let i = 0; i < n; i++) { const x = x0 + dir * ((t * 60 + i * 37) % 400) + (i % 3) * 14, y = y0 + Math.sin(t * 2 + i) * 8 + (i % 4) * 16
    s += `<path transform="translate(${x},${y}) scale(${dir},1)" d="M0,0 q10,-8 22,0 q-12,8 -22,0 l-8,-6 l0,12 z" fill="#ffcf3f" stroke="#1c1d22" stroke-width="2.5"/>` } return s
}

// ---------- the beats of this world (what each line shows) ----------
// each beat: camera target {x, y, z} and its own drawing (by its progress p)
export const CABLE_BEATS = [
  { text: 'You fill a ship with thousands of kilometres of internet cable, and sail it out to sea.', cam: { x: 720, y: 470, z: 1.6 } },
  { text: 'The cable unrolls behind you and sinks to the sea floor.', cam: { follow: 'ship', y: 640, z: 1.0 } },
  { text: 'But near the coast, a fishing anchor would snap it in seconds.', cam: { x: 760, y: 640, z: 1.35 }, sfx: 'bad' },
  { text: 'So you bury it under the sand with an underwater plough.', cam: { x: 790, y: 740, z: 1.55 } },
  { text: 'Out in the deep, sharks like to bite it.', cam: { x: 1900, y: 790, z: 1.55 }, sfx: 'bad' },
  { text: 'So you wrap it in plastic, then copper, then steel armour.', overlay: 'section', cam: { x: 1900, y: 790, z: 1.7 }, sfx: 'pop' },
  { text: 'In the middle are strands of glass thinner than a hair, carrying light.', overlay: 'section', cam: { x: 1900, y: 790, z: 1.7 } },
  { text: 'But light fades as it travels thousands of kilometres.', cam: { x: 2200, y: 720, z: 1.4 } },
  { text: 'So every few dozen kilometres, you add a repeater that makes it bright again.', cam: { x: 2550, y: 720, z: 1.15 }, sfx: 'pop' },
  { text: 'On the other side, the cable comes up the beach into a landing station.', cam: { x: 3720, y: 520, z: 1.3 } },
  { text: 'From there it runs to a data centre, full of servers.', cam: { x: 3990, y: 480, z: 1.3 } },
  { text: 'That is where websites actually live.', cam: { x: 4010, y: 330, z: 2.4 } },
  { text: 'Then the signal goes to a phone tower near your house.', cam: { x: 4330, y: 360, z: 1.15 } },
  { text: 'You tap a link, and the page loads in under a second.', overlay: 'phone', cam: { x: 4520, y: 380, z: 1.25 } },
  { text: 'Congratulations! You just used a cable that crosses an entire ocean.', cam: { x: 1900, y: 640, z: 0.205 }, sfx: 'win' },
  { text: 'Follow for more.', cam: { x: 1900, y: 640, z: 0.205 } },
]

export function makeBuild(beats, timing) {
  const T = timing.beats
  const at = (t) => { let i = 0; while (i < T.length - 1 && t >= T[i + 1].start) i++; return i }
  const P = (i, t) => clamp((t - T[i].start) / Math.max(0.3, T[i].end - T[i].start))
  const go = T[0].start + (T[1].start - T[0].start) * 0.55            // the spool fills first, then the ship leaves the dock
  const shipX = (t) => { if (t < go) return 790; if (t < T[1].start) return lerp(790, 1000, ease((t - go) / (T[1].start - go))); return lerp(1000, 2600, ease(clamp((t - T[1].start) / (T[3].end - T[1].start)))) + Math.max(0, t - T[3].end) * 120 }
  const camAt = (i, t) => { const c = beats[i].cam; return c.follow === 'ship' ? { x: shipX(t) + 60, y: c.y, z: c.z } : c }
  function camera(t) {
    const i = at(t), cur = camAt(i, t), prev = i ? camAt(i - 1, t) : cur, k = ease(clamp((t - T[i].start) / 0.9)), drift = (t - T[i].start) * 14
    const z = Math.exp(lerp(Math.log(prev.z), Math.log(cur.z), k))
    return { x: lerp(prev.x, cur.x, k) + (beats[i].cam.follow ? 0 : drift), y: lerp(prev.y, cur.y, k), z: z * (1 + 0.02 * Math.sin(t * 0.7)) }
  }
  const word = (t) => { const b = T[at(t)]; let w = null; for (const x of b.words) if (t >= x.s - 0.02) w = x; return w }
  return {
    frame(t) {
      const i = at(t), cam = camera(t)
      const has = (k) => i >= k, p = (k) => (i === k ? P(k, t) : i > k ? 1 : 0)
      const layEnd = t > go ? Math.min(shipX(t) - 200, SHORE_R + 10) : -999
      const cableEnd = i >= 9 ? SHORE_R + 200 : layEnd
      let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4ff"/><stop offset="1" stop-color="#cfeaff"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fa6d6"/><stop offset=".55" stop-color="#11618f"/><stop offset="1" stop-color="#0a3556"/></linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d39a"/><stop offset="1" stop-color="#b98b52"/></linearGradient>
        <filter id="glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="5"/></filter>
        <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>`
      s += `<g transform="translate(${W / 2},${H / 2}) scale(${cam.z}) translate(${-cam.x},${-cam.y})">`
      s += `<rect x="-9000" y="-9000" width="24000" height="${9000 + SEA}" fill="url(#sky)"/>`
      for (let k = 0; k < 9; k++) { const cx = -800 + k * 700 + ((t * 8) % 700), cy = 120 + (k % 3) * 70; s += `<g fill="#fff" opacity=".9"><ellipse cx="${cx}" cy="${cy}" rx="70" ry="24"/><ellipse cx="${cx + 40}" cy="${cy - 16}" rx="44" ry="26"/><ellipse cx="${cx - 40}" cy="${cy - 8}" rx="36" ry="20"/></g>` }
      s += `<rect x="-9000" y="${SEA}" width="24000" height="900" fill="url(#sea)"/><rect x="-9000" y="${SEA + 899}" width="24000" height="9000" fill="#0a3556"/>`
      for (let k = 0; k < 7; k++) { const x = -200 + k * 700 + Math.sin(t * 0.5 + k) * 40; s += `<path d="M${x},${SEA} L${x + 160},${SEA} L${x + 420},1100 L${x + 180},1100 Z" fill="#fff" opacity=".05"/>` }
      s += `<path d="M-3000,${SEA} ${Array.from({ length: 90 }, (_, k) => `L${-3000 + k * 120},${SEA + Math.sin(t * 2.2 + k) * 4}`).join(' ')} L8000,${SEA}" fill="none" stroke="#bfefff" stroke-width="5" opacity=".8"/>`
      // land and sea floor
      s += `<path d="M-3000,392 L${SHORE_L - 20},392 ${bedPath(SHORE_L - 20, SHORE_R + 20).replace('M', 'L')} L15000,392 L15000,9000 L-9000,9000 L-9000,392 Z" fill="url(#sand)" stroke="#1c1d22" stroke-width="5"/>`
      s += `<path d="M-9000,392 L${SHORE_L - 30},392" stroke="#5fbf4a" stroke-width="18"/><path d="M${SHORE_R + 30},392 L15000,392" stroke="#5fbf4a" stroke-width="18"/>`
      for (let k = 0; k < 60; k++) { const x = 560 + k * 53; s += `<circle cx="${x}" cy="${bed(x) + 30 + (k % 5) * 14}" r="${3 + (k % 3)}" fill="#a87b45" opacity=".6"/>` }
      // home port (left) with your city
      for (let k = 0; k < 6; k++) s += `<rect x="${-860 + k * 120}" y="${392 - 120 - (k % 3) * 60}" width="90" height="${120 + (k % 3) * 60}" fill="#9fb0c4" stroke="#1c1d22" stroke-width="4"/>`
      // the dock, its crane filling the spool, and your ship
      s += `<g><rect x="${SHORE_L - 80}" y="384" width="230" height="22" fill="#8a5a3c" stroke="#1c1d22" stroke-width="4"/>${[0, 1, 2].map((k) => `<rect x="${SHORE_L - 40 + k * 80}" y="404" width="14" height="${bed(SHORE_L - 40 + k * 80) - 404 + 30}" fill="#6b4529" stroke="#1c1d22" stroke-width="3"/>`).join('')}
        <path d="M${SHORE_L - 50},384 L${SHORE_L - 50},170 L${SHORE_L + 190},170" fill="none" stroke="#ffcf3f" stroke-width="14" stroke-linejoin="round"/><path d="M${SHORE_L - 50},384 L${SHORE_L - 50},170 L${SHORE_L + 190},170" fill="none" stroke="#1c1d22" stroke-width="3" stroke-dasharray="10 8"/></g>`
      const fill = t < go ? clamp((t - T[0].start) / (go - T[0].start)) : 1
      if (t < go + 0.3) s += `<path d="M${SHORE_L + 190},170 L${SHORE_L + 190},${300 + Math.sin(t * 6) * 6}" stroke="#1c1d22" stroke-width="5"/>${rope(`M${SHORE_L + 190},${300 + Math.sin(t * 6) * 6} C${SHORE_L + 190},360 ${shipX(t) - 120},330 ${shipX(t) - 70},${SEA - 46}`)}`
      s += ship(shipX(t), fill, t)
      s += fish(t, 1300, 560, 7) + fish(t, 2700, 640, 6, -1) + fish(t, 3050, 520, 5)
      // cable (+ buried, light, repeaters)
      const buried = p(3), lit = has(6) ? 1 : 0, rep = p(8)
      s += cable(cableEnd, buried, lit, t, rep)
      // the cable trailing from the ship to the floor while laying
      if (t > go && i <= 4 && shipX(t) < 2700) { const sx = shipX(t) - 200, ex = Math.max(SHORE_L + 80, sx - 200); s += rope(`M${shipX(t) - 205},${SEA + 82} Q${sx - 60},${(SEA + bed(ex)) / 2} ${ex},${bed(ex) - 9}`) }
      // beat 3: the anchor
      if (i === 2 || i === 3) { const a = i === 2 ? P(2, t) : 1, ay = lerp(SEA + 30, bed(700) - 24, ease(a * 1.4)), hit = i === 2 && a > 0.62
        s += `<g transform="translate(620,${SEA - 18})"><path d="M-60,0 L60,0 L44,24 L-48,24 Z" fill="#8a5a3c" stroke="#1c1d22" stroke-width="4"/><rect x="-6" y="-46" width="8" height="46" fill="#1c1d22"/></g>`
        s += `<line x1="640" y1="${SEA}" x2="700" y2="${ay}" stroke="#1c1d22" stroke-width="3"/><g transform="translate(700,${ay})"><path d="M0,-26 L0,18 M-22,6 Q0,30 22,6 M-10,-18 L10,-18" fill="none" stroke="#3a3f4b" stroke-width="8" stroke-linecap="round"/></g>`
        if (hit && i === 2) s += `<g transform="translate(704,${bed(704) - 6})"><path d="M-30,-30 L30,30 M30,-30 L-30,30" stroke="#ff3b30" stroke-width="12" stroke-linecap="round" opacity="${0.5 + 0.5 * Math.sin(t * 20)}"/></g>` }
      // beat 4: the plough (pulled along the cable near the shore)
      if (i === 3) { const px = lerp(SHORE_L + 20, 980, ease(P(3, t))); s += `<g transform="translate(${px},${bed(px) - 20})"><path d="M-46,10 L40,10 L52,-14 L-30,-30 Z" fill="#ffcf3f" stroke="#1c1d22" stroke-width="5"/><path d="M30,10 L44,34" stroke="#1c1d22" stroke-width="8"/><circle cx="-26" cy="14" r="10" fill="#3a3f4b" stroke="#1c1d22" stroke-width="4"/><circle cx="20" cy="14" r="10" fill="#3a3f4b" stroke="#1c1d22" stroke-width="4"/></g><line x1="${px + 50}" y1="${bed(px) - 30}" x2="${px + 300}" y2="${SEA}" stroke="#1c1d22" stroke-width="3"/>`
        for (let k = 0; k < 6; k++) s += `<circle cx="${px - 30 - k * 18}" cy="${bed(px) - 20 - ((t * 60 + k * 13) % 50)}" r="${6 - k * 0.6}" fill="#e9d2a2" opacity="${0.8 - k * 0.12}"/>` }
      // beat 5: the shark
      if (i === 4 || i === 5) { const a = i === 4 ? P(4, t) : 1, sx = lerp(2300, 1945, out(a * 1.6)), bite = i === 4 && a > 0.55 ? a - 0.55 : 0
        s += shark(sx, bed(1900) - 34 + Math.sin(t * 3) * 4, true, bite)
        if (bite) for (let k = 0; k < 6; k++) { const ang = k * 1.05 + t * 9; s += `<line x1="${1900}" y1="${bed(1900) - 6}" x2="${1900 + Math.cos(ang) * 38}" y2="${bed(1900) - 6 + Math.sin(ang) * 38}" stroke="#ffe27a" stroke-width="5" stroke-linecap="round"/>` } }
      // right side: landing station, data centre, tower, your house
      s += building(3760, 'station', p(9) * 1.4, t) + building(4020, 'data', p(10) * 1.4, t) + building(4330, 'tower', p(12) * 1.3, t) + building(4560, 'house', has(12) ? 1 : p(11) * 0 + (i >= 13 ? 1 : 0), t)
      if (has(10)) { const e = 3760 + 260 * ease(p(10)); s += `<path d="M3760,404 L${e},404" stroke="#7ff6ff" stroke-width="6" filter="url(#glow)"/><path d="M3760,404 L${e},404" stroke="#1c1d22" stroke-width="3" stroke-dasharray="8 6"/>` }
      if (i === 11) for (let k = 0; k < 4; k++) { const q = (t * 0.5 + k / 4) % 1; s += `<g transform="translate(${3960 + k * 40},${230 - q * 120})" opacity="${1 - q}"><rect x="-26" y="-18" width="52" height="36" rx="5" fill="#fff" stroke="#1c1d22" stroke-width="3"/><rect x="-20" y="-12" width="40" height="7" rx="2" fill="#8ff06a"/><rect x="-20" y="0" width="28" height="4" fill="#c9d3de"/><rect x="-20" y="7" width="34" height="4" fill="#c9d3de"/></g>` }
      if (i >= 14) s += `<path d="M${SHORE_L + 60},${SEA} ${bedPath(SHORE_L + 70, SHORE_R, -4).replace('M', 'L')} L4560,400" fill="none" stroke="#7ff6ff" stroke-width="${10 * clamp(P(14, t) * 3 + (i > 14 ? 1 : 0))}" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`
      s += `</g>`
      // overlays (screen space): the cable cut open, and your phone
      if (beats[i].overlay === 'section') s += section(i === 5 ? P(5, t) : 1, i === 6 ? P(6, t) : 0, t, i === 5 && P(5, t) < 0.12 ? P(5, t) / 0.12 : 1)
      if (beats[i].overlay === 'phone') s += phone(P(i, t), t)
      if (i >= 14) s += congrats(P(14, t) + (i > 14 ? 1 : 0), t)
      s += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`
      // one word at a time, big, in the middle
      const w = word(t); if (w) { const k = back(clamp((t - w.s) / 0.12)), txt = esc(w.w.replace(/[“”"]/g, '')).toUpperCase()
        const fs = txt.length > 11 ? 54 : 66
        s += `<g transform="translate(${W / 2},${H * 0.62}) scale(${0.7 + 0.3 * k})"><text text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-weight="900" font-size="${fs}" fill="#fff" stroke="#000" stroke-width="12" stroke-linejoin="round" paint-order="stroke">${txt}</text></g>` }
      return s
    },
  }
}
// the cable cut open: rings appear one by one (plastic, copper, steel), then the glass glows
function section(p, glow, t, open) {
  const cx = W / 2, cy = 520, R = 230 * back(open)
  const ring = (k) => clamp(p * 4 - k)
  let s = `<rect width="${W}" height="${H}" fill="#06121d" opacity="${0.55 * open}"/><g transform="translate(${cx},${cy})">`
  s += `<circle r="${R}" fill="#15171c" stroke="#fff" stroke-width="6"/>`                     // outer plastic
  const steel = ring(1); for (let k = 0; k < 28; k++) { const a = (k / 28) * Math.PI * 2; s += `<circle cx="${Math.cos(a) * R * 0.78}" cy="${Math.sin(a) * R * 0.78}" r="${R * 0.085 * back(steel)}" fill="#b8c2cc" stroke="#1c1d22" stroke-width="3"/>` }
  const cu = ring(2); s += `<circle r="${R * 0.6 * back(cu)}" fill="#d9822b" stroke="#1c1d22" stroke-width="4"/><circle r="${R * 0.5 * back(cu)}" fill="#2a2b31"/>`
  const gl = ring(3); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, r = R * 0.22; const on = glow > 0 ? 0.6 + 0.4 * Math.sin(t * 9 + k) : 0
    s += `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="${R * 0.07 * back(gl)}" fill="${on ? '#bffcff' : '#7fd8e6'}" stroke="#1c1d22" stroke-width="2"/>${on ? `<circle cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" r="${R * 0.12}" fill="#7ff6ff" opacity="${on * 0.6}" filter="url(#glow)"/>` : ''}` }
  s += `</g>`
  const lab = (txt, y, k, c) => k > 0 ? `<g transform="translate(${cx},${y}) scale(${back(k)})"><rect x="-90" y="-24" width="180" height="48" rx="24" fill="${c}" stroke="#1c1d22" stroke-width="4"/><text text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-weight="900" font-size="24" fill="#1c1d22">${txt}</text></g>` : ''
  const now = glow ? ['GLASS', '#bffcff', clamp(glow * 5)] : p * 4 >= 2.2 ? ['COPPER', '#f2a65a', ring(2.2)] : p * 4 >= 1.2 ? ['STEEL', '#dfe6ee', ring(1.2)] : ['PLASTIC', '#fff', ring(0.2)]
  s += lab(now[0], cy - R - 60, now[2], now[1])
  return s
}
function phone(p, t) {
  const k = back(clamp(p * 3)), load = clamp((p - 0.38) * 3)
  let s = `<g transform="translate(${W / 2},${H * 0.4}) scale(${k})"><rect x="-150" y="-280" width="300" height="560" rx="42" fill="#15171c" stroke="#000" stroke-width="6"/><rect x="-134" y="-262" width="268" height="524" rx="30" fill="#fff"/>`
  s += `<rect x="-118" y="-238" width="236" height="34" rx="17" fill="#eef1f4"/><text x="0" y="-216" text-anchor="middle" font-family="Inter" font-weight="900" font-size="16" fill="#5b6675">olexweb.com</text>`
  s += `<rect x="-118" y="-196" width="${236 * clamp(load * 1.4)}" height="5" rx="2" fill="#2f9fd8"/>`
  if (load > 0.55) { const o = clamp((load - 0.55) * 3)
    s += `<g opacity="${o}"><rect x="-118" y="-176" width="236" height="150" rx="14" fill="#0c0e0c"/><text x="-100" y="-130" font-family="Inter" font-weight="900" font-size="26" fill="#fff">Websites</text><text x="-100" y="-100" font-family="Inter" font-weight="900" font-size="26" fill="#8ff06a">that move.</text><rect x="-100" y="-74" width="110" height="30" rx="15" fill="#8ff06a"/>
      <rect x="-118" y="-8" width="112" height="90" rx="12" fill="#eef1f4"/><rect x="6" y="-8" width="112" height="90" rx="12" fill="#eef1f4"/><rect x="-118" y="94" width="236" height="14" rx="7" fill="#e3e7ec"/><rect x="-118" y="118" width="180" height="14" rx="7" fill="#e3e7ec"/></g>` }
  if (p > 0.22 && p < 0.42) { const q = (p - 0.22) / 0.2; s += `<circle cx="20" cy="40" r="${24 + q * 40}" fill="#2f9fd8" opacity="${0.5 * (1 - q)}"/><circle cx="20" cy="40" r="20" fill="#2f9fd8" opacity=".45"/>` }
  return s + `</g>`
}
function congrats(p, t) {
  let s = ''; for (let k = 0; k < 46; k++) { const x = (k * 97) % W, y = ((t * 220 + k * 131) % (H + 200)) - 100, c = ['#8ff06a', '#ffcf3f', '#e8463b', '#2f9fd8', '#fff'][k % 5]
    s += `<rect x="${x}" y="${y}" width="12" height="20" rx="3" fill="${c}" transform="rotate(${(t * 200 + k * 40) % 360} ${x + 6} ${y + 10})" opacity="${clamp(p * 4)}"/>` }
  return s
}

// the worlds that exist (the admin's lib/site/explain.js WORLDS lists the same keys)
export const WORLDS = { cable: CABLE_BEATS }
