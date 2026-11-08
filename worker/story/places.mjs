// Where a story happens (Install 22): eleven places drawn in the same hand-drawn style, 1280×720. Each has its own colours
// so a cut to a new place reads at a glance. The street has a touch of the country (a red bus in the UK, a yellow cab in
// the US). The bedroom is at night. Every line goes through the "rough" filter, so the ink boils like the characters.
import { INK } from './sketch.mjs'
const L = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${L()} ${extra}/>`
export const NIGHT = new Set(['bedroom'])
const sky = (W, H, c = '#bcd7e6') => `<rect width="${W}" height="${H}" fill="${c}"/>`
const windows = (x, y, cols, rows, lit = '#f6e8a6') => [...Array(cols * rows)].map((_, i) => R(x + (i % cols) * 46, y + Math.floor(i / cols) * 58, 28, 36, (i * 7) % 5 ? '#d9e4ec' : lit, 'stroke-width="3"')).join('')

export function place(name, W = 1280, H = 720, o = {}) {
  const t = o.t || 0, country = o.country || 'GB'
  const g = (s) => `<g filter="url(#rough)">${s}</g>`
  switch (name) {
    case 'kitchen': return `<rect width="${W}" height="${H}" fill="#e7efe6"/>${g(`${[...Array(12)].map((_, i) => `<path d="M${i * 110} 140 L${i * 110} 430" ${L(2)} opacity=".25"/>`).join('')}<path d="M0 285 L${W} 285" ${L(2)} opacity=".25"/>
      ${R(0, 470, W, 30, '#c9b08f')}${R(0, 500, W, H - 500, '#9fb7a3')}${R(980, 160, 200, 340, '#f4f6f7')}<path d="M980 300 L1180 300 M1000 220 L1000 270 M1000 330 L1000 400" ${L(5)}/>
      <path d="M200 470 L200 420 Q230 380 270 420 L270 470 Z" fill="#d9534f" ${L(5)}/>${R(420, 120, 260, 160, '#bfe0f2')}<path d="M550 120 L550 280" ${L(4)}/>`)}`
    case 'bedroom': return `<rect width="${W}" height="${H}" fill="#2e3552"/>${g(`${R(860, 90, 260, 220, '#1b2038')}<circle cx="1040" cy="160" r="34" fill="#f6e8a6" ${L(4)}/><path d="M990 90 L990 310 M860 200 L1120 200" ${L(4)}/>
      ${R(80, 430, 640, 140, '#4b5a8a')}${R(80, 360, 120, 120, '#6c7bb0')}<path d="M200 470 Q420 420 720 470" fill="none" ${L(4)}/>${R(760, 450, 110, 120, '#5b4636')}
      <circle cx="815" cy="430" r="40" fill="#f6e8a6" opacity=".35"/><path d="M800 450 L830 450 L825 410 L805 410 Z" fill="#f2c94c" ${L(4)}/>`)}<rect width="${W}" height="${H}" fill="#0b1030" opacity=".18"/>`
    case 'office': return `<rect width="${W}" height="${H}" fill="#d6dde4"/>${g(`${[...Array(5)].map((_, i) => R(80 + i * 240, 70, 180, 200, '#eef3f7')).join('')}${[...Array(5)].map((_, i) => `<path d="M${80 + i * 240} ${110 + (i % 2) * 20} L${260 + i * 240} ${110 + (i % 2) * 20} M${80 + i * 240} 150 L${260 + i * 240} 150 M${80 + i * 240} 190 L${260 + i * 240} 190" ${L(2)} opacity=".4"/>`).join('')}
      ${R(0, 470, W, 250, '#a7b1bb')}${R(120, 420, 300, 60, '#8a6a4f')}${R(200, 330, 140, 92, '#2a2d30')}${R(860, 420, 300, 60, '#8a6a4f')}${R(940, 330, 140, 92, '#2a2d30')}
      <path d="M620 470 Q600 380 640 330 Q680 380 660 470 Z" fill="#5fb55a" ${L(4)}/>${R(610, 470, 60, 40, '#b5764c')}`)}`
    case 'cafe': return `<rect width="${W}" height="${H}" fill="#ecd6b8"/>${g(`${R(80, 60, 360, 200, '#2d3a2e')}<text x="260" y="130" text-anchor="middle" font-family="H" font-weight="900" font-size="40" fill="#f6efe2">MENU</text><path d="M120 170 L400 170 M120 210 L360 210" stroke="#f6efe2" stroke-width="4" stroke-dasharray="10 12"/>
      ${[0, 1, 2].map((i) => `<path d="M${640 + i * 200} 0 L${640 + i * 200} 90" ${L(3)}/><path d="M${610 + i * 200} 90 L${670 + i * 200} 90 L${655 + i * 200} 120 L${625 + i * 200} 120 Z" fill="#f2c94c" ${L(4)}/>`).join('')}
      ${R(0, 480, W, 240, '#8a5a3c')}${R(0, 460, W, 30, '#5b3b28')}<path d="M300 460 L300 420 L350 420 L350 460" fill="#fff" ${L(4)}/><path d="M900 460 L900 410 L950 410 L950 460" fill="#fff" ${L(4)}/>`)}`
    case 'street': return `${sky(W, H)}${g(`${R(40, 120, 300, 380, '#c98f6e')}${windows(70, 150, 6, 5)}${R(380, 60, 260, 440, '#9fa9b5')}${windows(400, 90, 5, 6)}${R(700, 160, 240, 340, '#d8b46a')}${windows(720, 190, 5, 4)}${R(980, 90, 280, 410, '#8d9fb8')}${windows(1000, 120, 6, 5)}
      ${R(0, 500, W, 60, '#b9b9b9')}${R(0, 560, W, 160, '#55595e')}<path d="M0 640 L${W} 640" stroke="#f2f2f2" stroke-width="8" stroke-dasharray="60 50"/>
      <path d="M660 500 L660 250 Q660 230 690 230 L720 230" fill="none" ${L(7)}/><ellipse cx="724" cy="236" rx="22" ry="12" fill="#f6e8a6" ${L(4)}/>
      ${country === 'US' ? `<g transform="translate(${(t * 120) % (W + 400) - 300} 0)"><path d="M0 610 L40 560 L230 560 L270 610 L290 640 L-10 640 Z" fill="#f2c94c" ${L(5)}/><circle cx="50" cy="645" r="22" fill="${INK}"/><circle cx="230" cy="645" r="22" fill="${INK}"/>${R(110, 538, 60, 20, '#fff', 'stroke-width="3"')}</g>`
        : `<g transform="translate(${(t * 90) % (W + 500) - 420} 0)">${R(0, 420, 380, 210, '#d9534f')}<path d="M0 520 L380 520" ${L(4)}/>${windows(20, 440, 8, 1, '#d9e4ec')}${windows(20, 540, 8, 1, '#d9e4ec')}<circle cx="70" cy="640" r="24" fill="${INK}"/><circle cx="310" cy="640" r="24" fill="${INK}"/></g>`}`)}`
    case 'bus': return `<rect width="${W}" height="${H}" fill="#d9dfe6"/>${g(`${[0, 1, 2, 3].map((i) => `${R(40 + i * 310, 70, 260, 200, '#bcd7e6')}<g transform="translate(${-((t * 160) % 300)} 0)">${[...Array(3)].map((_, k) => R(60 + i * 310 + k * 120, 170, 70, 100, '#9fa9b5', 'stroke-width="3"')).join('')}</g>`).join('')}
      ${R(0, 270, W, 20, '#f2c94c')}<path d="M200 0 L200 700 M1080 0 L1080 700" stroke="#f2c94c" stroke-width="14"/>${[0, 1, 2].map((i) => `${R(90 + i * 400, 400, 220, 170, '#4f86d9')}${R(90 + i * 400, 360, 220, 60, '#3b6fc0')}`).join('')}${R(0, 600, W, 120, '#6b7480')}`)}`
    case 'car': return `${sky(W, H, '#9ec5de')}${g(`<g transform="translate(0 ${Math.sin(t * 9) * 2})"><path d="M0 330 L${W} 330 L${W} 720 L0 720 Z" fill="#7d8790"/><path d="M640 330 L560 720 M640 330 L720 720" stroke="#f2f2f2" stroke-width="6" stroke-dasharray="30 30" stroke-dashoffset="${-t * 200}"/>
      <path d="M0 0 L${W} 0 L${W} 120 Q640 60 0 120 Z" fill="#2b2d30" ${L(5)}/><path d="M0 480 Q640 420 ${W} 480 L${W} 720 L0 720 Z" fill="#3a3d42" ${L(6)}/>
      <circle cx="380" cy="560" r="110" fill="none" stroke="${INK}" stroke-width="22"/><path d="M380 560 L300 600 M380 560 L460 600 M380 560 L380 470" ${L(10)}/>${R(760, 520, 260, 90, '#24262a')}<text x="890" y="578" text-anchor="middle" font-family="Inter" font-weight="900" font-size="34" fill="#7fd35a">${'12:4' + (Math.floor(t / 20) % 10)}</text></g>`)}`
    case 'shop': return `<rect width="${W}" height="${H}" fill="#f1e6cf"/>${g(`${[0, 1, 2].map((r) => `${R(60, 90 + r * 130, 520, 16, '#8a6a4f')}${[...Array(6)].map((_, k) => R(70 + k * 84, 30 + r * 130, 64, 60, ['#e0574f', '#4f86d9', '#f2c94c', '#5fb55a', '#9b6bd6', '#f08a3c'][(k + r) % 6], 'stroke-width="3"')).join('')}`).join('')}
      ${R(700, 380, 520, 120, '#8a6a4f')}${R(980, 290, 140, 90, '#2a2d30')}${R(0, 500, W, 220, '#cbb894')}${R(760, 90, 280, 110, '#fff')}<text x="900" y="162" text-anchor="middle" font-family="H" font-weight="900" font-size="54" fill="#d9534f">OPEN</text>`)}`
    case 'bank': return `<rect width="${W}" height="${H}" fill="#e3e6ea"/>${g(`${[0, 1, 2, 3, 4].map((i) => R(120 + i * 230, 40, 40, 400, '#f4f5f7')).join('')}${R(80, 400, 1120, 110, '#b9a27f')}${R(80, 300, 1120, 100, 'rgba(190,220,240,.35)')}
      ${[0, 1, 2].map((i) => `<path d="M${300 + i * 330} 300 L${300 + i * 330} 400" ${L(4)}/>`).join('')}${R(0, 510, W, 210, '#c7ccd2')}<path d="M100 560 Q300 600 500 560" fill="none" stroke="#d9534f" stroke-width="10"/>${R(90, 520, 20, 90, '#c9b46a')}${R(490, 520, 20, 90, '#c9b46a')}`)}`
    case 'park': return `${sky(W, H, '#c5e3f0')}${g(`<circle cx="1120" cy="110" r="56" fill="#f6e8a6" ${L(4)}/>${R(0, 440, W, 280, '#8cc67a')}
      ${[150, 480, 1000].map((x, i) => `${R(x - 18, 260, 36, 200, '#8a5a3c')}<circle cx="${x}" cy="230" r="${110 - i * 10}" fill="#5fb55a" ${L(5)}/>`).join('')}${R(640, 470, 280, 24, '#8a5a3c')}<path d="M660 494 L660 540 M900 494 L900 540" ${L(8)}/>${R(640, 420, 280, 18, '#8a5a3c')}`)}`
    default: return `<rect width="${W}" height="${H}" fill="#eadfc9"/>${g(`${R(780, 90, 300, 220, '#bfe0f2')}<path d="M930 90 L930 310 M780 200 L1080 200" ${L(4)}/><path d="M760 80 Q800 200 760 330 M1100 80 Q1060 200 1100 330" fill="none" stroke="#d9534f" stroke-width="12"/>
      ${R(0, 480, W, 240, '#c8a97f')}${R(120, 360, 460, 140, '#4f86d9')}${R(120, 300, 460, 90, '#3b6fc0')}${R(100, 360, 50, 130, '#3b6fc0')}${R(550, 360, 50, 130, '#3b6fc0')}
      ${R(380, 120, 160, 120, '#fff')}<path d="M400 220 L440 170 L470 200 L490 180 L520 220 Z" fill="#5fb55a"/><path d="M1180 480 L1180 300 M1140 300 L1220 300 L1200 250 L1160 250 Z" fill="#f2c94c" ${L(5)}/>`)}`   // home: the living room
  }
}
