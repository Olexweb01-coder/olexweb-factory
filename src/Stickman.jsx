// The channel's host: a stickman drawn in code, so he looks the same in every video.
// Angles are in degrees from straight down (90 = viewer's right, -90 = viewer's left, 180 = up).
import React from 'react'
import { interpolate } from 'remotion'

const UP = 78, FORE = 72, THIGH = 92, SHIN = 90
const P = {
  idle:     { lA: [-18, -6],   rA: [18, 6],     lL: [-12, -4], rL: [12, 4],  tilt: 0 },
  shocked:  { lA: [-145, -175], rA: [145, 175], lL: [-22, -10], rL: [22, 10], tilt: 0, mouth: 'o' },
  pointing: { lA: [-128, -128], rA: [40, -55],  lL: [-12, -4], rL: [14, 6],  tilt: -6 },
  thinking: { lA: [-25, 55],   rA: [28, 200],   lL: [-10, -2], rL: [10, 2],  tilt: 8 },
  dancing:  { lA: [-120, -160], rA: [60, 150],  lL: [-20, -2], rL: [18, 30], tilt: 0 },
  waving:   { lA: [-18, -6],   rA: [125, 175],  lL: [-12, -4], rL: [12, 4],  tilt: -4 },
}
const rad = (d) => (d * Math.PI) / 180
const step = ([x, y], deg, len) => [x + len * Math.sin(rad(deg)), y + len * Math.cos(rad(deg))]
const mix = (a, b, t) => a + (b - a) * t

function blend(a, b, t) {
  const out = {}
  for (const k of ['lA', 'rA', 'lL', 'rL']) out[k] = [mix(a[k][0], b[k][0], t), mix(a[k][1], b[k][1], t)]
  out.tilt = mix(a.tilt, b.tilt, t)
  return out
}

// frame: frame within the whole video; pose / prevPose: names; since: frames since the pose changed; talking: 0..1
export function Stickman({ frame, pose, prevPose, since, talking, scale = 1, color = '#F4F7FB', accent = '#3DDC84' }) {
  const t = Math.min(1, since / 9), ease = 1 - Math.pow(1 - t, 3)
  let p = blend(P[prevPose] || P.idle, P[pose] || P.idle, ease)
  // life: breathing, dancing, waving
  const bob = Math.sin(frame / 7) * 4
  if (pose === 'dancing') {
    const s = Math.sin(frame / 4)
    p = { ...p, lA: [p.lA[0] + s * 25, p.lA[1] + s * 30], rA: [p.rA[0] - s * 25, p.rA[1] - s * 30], lL: [p.lL[0] + s * 8, p.lL[1]], rL: [p.rL[0] + s * 8, p.rL[1] + s * 10], tilt: s * 8 }
  }
  if (pose === 'waving') p = { ...p, rA: [p.rA[0], p.rA[1] + Math.sin(frame / 3) * 22] }
  const hop = pose === 'dancing' ? Math.abs(Math.sin(frame / 4)) * 18 : pose === 'shocked' ? Math.max(0, 1 - since / 6) * 30 : 0

  const hip = [0, 0], neck = [0, -165], head = [0, -222]
  const lE = step(neck, p.lA[0], UP), lH = step(lE, p.lA[1], FORE)
  const rE = step(neck, p.rA[0], UP), rH = step(rE, p.rA[1], FORE)
  const lK = step(hip, p.lL[0], THIGH), lF = step(lK, p.lL[1], SHIN)
  const rK = step(hip, p.rL[0], THIGH), rF = step(rK, p.rL[1], SHIN)
  const blink = frame % 96 < 4
  const mouthOpen = (P[pose] || {}).mouth === 'o' ? 1 : talking * (0.4 + 0.6 * Math.abs(Math.sin(frame / 2.3)))
  const line = (a, b) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />

  return (
    <svg viewBox="-200 -310 400 520" width={400 * scale} height={520 * scale} style={{ overflow: 'visible' }}>
      <ellipse cx="0" cy={186} rx={95 - hop} ry="14" fill="rgba(0,0,0,0.35)" />
      <g transform={`translate(0 ${bob - hop})`} stroke={color} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {line(hip, lK)}{line(lK, lF)}{line(hip, rK)}{line(rK, rF)}
        {line(hip, neck)}
        {line(neck, lE)}{line(lE, lH)}{line(neck, rE)}{line(rE, rH)}
        <g transform={`rotate(${p.tilt} 0 -200)`}>
          <circle cx={head[0]} cy={head[1]} r="52" fill="#121826" />
          {/* the brand detail: green glasses */}
          <g stroke={accent} strokeWidth="6">
            <circle cx="-19" cy="-228" r="15" fill={blink ? accent : '#121826'} />
            <circle cx="21" cy="-228" r="15" fill={blink ? accent : '#121826'} />
            <line x1="-4" y1="-229" x2="6" y2="-229" />
          </g>
          {!blink ? <g stroke="none" fill={color}><circle cx="-17" cy="-227" r="5" /><circle cx="23" cy="-227" r="5" /></g> : null}
          <ellipse cx="2" cy="-196" rx={8 + mouthOpen * 6} ry={2 + mouthOpen * 11} fill="#121826" strokeWidth="5" />
        </g>
      </g>
    </svg>
  )
}
