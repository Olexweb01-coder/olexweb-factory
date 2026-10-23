// Talking to the Olexweb admin. Every request is signed with FACTORY_SECRET (an HMAC over the time, method, path and
// a SHA-256 of the body). The secret comes from the repo's encrypted GitHub secrets and is never printed.
import { createHmac, createHash } from 'node:crypto'

const API = () => (process.env.OLEX_API || '').replace(/\/$/, '')
const SECRET = () => { const s = process.env.FACTORY_SECRET || ''; if (s.length < 32) throw new Error('FACTORY_SECRET is missing or too short (add it in the repo: Settings → Secrets and variables → Actions)'); return s }

export async function call(path, body, { raw = false, tries = 4, onRetry } = {}) {
  const buf = raw ? body : Buffer.from(body === undefined ? '' : JSON.stringify(body))
  for (let attempt = 1; ; attempt++) {
    const ts = String(Math.floor(Date.now() / 1000)), hash = createHash('sha256').update(buf).digest('hex')
    const sig = createHmac('sha256', SECRET()).update(`${ts}\nPOST\n${path}\n${hash}`).digest('hex')
    let r
    try { r = await fetch(API() + path, { method: 'POST', headers: { 'x-factory-sig': ts + '.' + sig, 'Content-Type': raw ? 'application/octet-stream' : 'application/json' }, body: buf }) }
    catch (e) { r = null; if (attempt >= tries) throw new Error('the admin could not be reached: ' + e.message) }
    if (r && r.ok) return r.json()
    if (r && [400, 401, 404, 409, 413].includes(r.status)) { const j = await r.json().catch(() => ({})); throw new Error(`the admin refused ${path.split('?')[0]} (${r.status}${j.error ? ': ' + j.error : ''})`) }
    if (attempt >= tries) throw new Error(`the admin kept failing on ${path.split('?')[0]} (${r ? r.status : 'no answer'})`)
    const wait = Math.min(30000, 2000 * 2 ** (attempt - 1))                // 2, 4, 8, 16, 30, 30… seconds: patient with a slow or busy admin
    if (onRetry) await onRetry(attempt, wait, r ? r.status : 'no answer')
    await new Promise((res) => setTimeout(res, wait * (Number(process.env.FACTORY_RETRY_SCALE) || 1)))   // the scale exists only for tests
  }
}
// Progress reports never stop the render: if one fails it's skipped. Frequent ones are spaced out.
let last = 0
export async function report(id, r) {
  const now = Date.now()
  if (!r.stage && now - last < 2500) return
  last = now
  try { await call(`/api/factory/report?id=${id}`, r, { tries: 2 }) } catch (e) { console.log('  (progress report skipped: ' + e.message + ')') }
}
