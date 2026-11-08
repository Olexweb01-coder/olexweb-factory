// Olexweb's contact-form sender (Install 21). Started by the admin through the "forms" workflow. It asks the admin for a
// few jobs (signed with FACTORY_SECRET), and for each one opens the business's contact page in a real browser, fills the
// form like a person (name, reply address, subject, message; a consent box for their privacy policy when it's required),
// sends it, checks it went through, and reports back. It never touches a form with a robot check, never guesses a
// required field it doesn't understand, and waits between businesses.
import { call } from './api.mjs'

const test = (process.env.FACTORY_TEST_HOSTS || '').split(',').filter(Boolean)
const PAUSE = Number(process.env.FORMS_PAUSE_MS ?? 25000)                    // between businesses (tests use 0)
const CAPTCHA = 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"], .g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]'
const DONE = /thank(s| you)|message (has been |was )?(sent|received)|we('| wi)ll (be in touch|get back)|received your (message|enquiry|inquiry)|successfully|merci|bien (été )?envoyé|nous vous répondrons/i
const log = (...a) => console.log('  ' + a.join(' '))

// what a field is, from everything a person would read: its label, name, id, placeholder, aria-label and type
async function describe(el) {
  return el.evaluate((e) => {
    const id = e.id, lab = (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || e.closest('label')
    const own = [lab && lab.innerText, e.name, id, e.placeholder, e.getAttribute('aria-label')].filter(Boolean).join(' ')
    // only when the field says nothing about itself: the text just before it (never a whole form's worth of labels)
    const prev = !own && e.previousElementSibling ? e.previousElementSibling.innerText || '' : ''
    return { tag: e.tagName.toLowerCase(), type: (e.getAttribute('type') || '').toLowerCase(), required: e.required || e.getAttribute('aria-required') === 'true',
      text: (own || prev.slice(0, 60)).toLowerCase(), visible: !!(e.offsetWidth || e.offsetHeight) }
  })
}
const pick = (d, J) => {
  const t = d.text
  if (d.tag === 'textarea') return J.message
  if (d.type === 'email' || /e-?mail|courriel/.test(t)) return J.email
  if (d.type === 'tel' || /phone|\btel\b|mobile|téléphone/.test(t)) return null                  // never invented
  if (/first.?name|given|prénom|forename/.test(t)) return J.name.split(' ')[0]
  if (/last.?name|surname|family|nom de famille/.test(t)) return J.name.split(' ').slice(1).join(' ') || 'Adebayo'
  if (/subject|objet|topic|regarding/.test(t)) return J.subject
  if (/company|business|organi[sz]ation|société|entreprise/.test(t)) return J.org
  if (/website|url|site web/.test(t) || d.type === 'url') return J.website
  if (/\bname\b|your name|full.?name|\bnom\b/.test(t)) return J.name
  return undefined                                                                            // something else
}

async function one(browser, J) {
  const u = new URL(J.url)
  if (u.protocol !== 'https:' && !test.includes(u.host)) return { ok: false, why: 'Only https sites are used' }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: J.country === 'FR' ? 'fr-FR' : 'en-GB' })
  const page = await ctx.newPage()
  try {
    const r = await page.goto(J.url, { waitUntil: 'domcontentloaded', timeout: 40000 }).catch((e) => { throw new Error('The page didn’t load (' + e.message.split('\n')[0].slice(0, 60) + ')') })
    if (!r || r.status() >= 400) return { ok: false, why: `The contact page answered ${r ? r.status() : 'nothing'}` }
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    for (const name of [/^accept( all)?( cookies)?$/i, /^(i )?agree$/i, /^allow all$/i, /^got it$/i, /^ok$/i, /^tout accepter$/i, /^accepter$/i]) {
      const b = page.getByRole('button', { name }).first(); if (await b.isVisible({ timeout: 300 }).catch(() => false)) { await b.click().catch(() => {}); break }
    }
    // the form: the visible one with a message box (site builders often put it in a frame on the same site)
    let scope = page
    let box = page.locator('form textarea:visible, textarea:visible').first()
    if (!(await box.count())) for (const f of page.frames()) { const b = f.locator('textarea:visible').first(); if (await b.count()) { scope = f; box = b; break } }
    if (!(await box.count())) return { ok: false, why: 'No contact form with a message box on that page' }
    if (await page.locator(CAPTCHA).count() || (scope !== page && await scope.locator(CAPTCHA).count())) return { ok: false, why: 'The form has a robot check, so it was left alone' }
    const form = box.locator('xpath=ancestor::form[1]')
    const area = (await form.count()) ? form : scope.locator('body')
    let filled = { message: false, email: false }
    for (const el of await area.locator('input, textarea, select').all()) {
      const d = await describe(el); if (!d.visible || ['hidden', 'submit', 'button', 'file', 'password', 'search', 'radio'].includes(d.type)) continue
      if (d.tag === 'select') {
        if (!d.required) continue
        const opts = await el.locator('option').evaluateAll((os) => os.map((o) => ({ v: o.value, t: o.textContent.trim() })))
        const good = opts.find((o) => o.v && /general|enquir|inquir|other|autre|website|web|new (client|project)|information|contact/i.test(o.t))
        if (!good) return { ok: false, why: 'A required choice in the form couldn’t be answered honestly' }
        await el.selectOption(good.v); continue
      }
      if (d.type === 'checkbox') {
        if (/privacy|consent|agree|accept|gdpr|terms|rgpd|confidentialit|j'accepte/.test(d.text) && d.required) await el.check().catch(() => {})
        else if (d.required) return { ok: false, why: 'A required box in the form wasn’t about privacy, so it wasn’t ticked' }
        continue
      }
      const v = pick(d, J)
      if (v === undefined || v === null) { if (d.required && !(await el.inputValue().catch(() => ''))) return { ok: false, why: `A required field couldn’t be filled honestly (${d.text.slice(0, 40) || d.type})` }; continue }
      await el.fill(String(v)); if (v === J.message) filled.message = true; if (v === J.email) filled.email = true
      await page.waitForTimeout(150 + Math.random() * 250)
    }
    if (!filled.message) return { ok: false, why: 'The message box couldn’t be filled' }
    if (!filled.email) return { ok: false, why: 'The form has no email field, so they couldn’t reply' }
    const before = page.url()
    const submit = area.locator('button[type=submit], input[type=submit], button:not([type])').filter({ hasNotText: /search|newsletter|subscribe/i }).first()
    if (!(await submit.count())) return { ok: false, why: 'No send button found' }
    await submit.click({ timeout: 8000 })
    await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const text = await page.locator('body').innerText({ timeout: 4000 }).catch(() => '')
    const gone = !(await box.isVisible().catch(() => false))
    if (DONE.test(text) || (page.url() !== before && !/error|erreur/i.test(page.url()))) return { ok: true, how: DONE.test(text) ? 'The site said thank you' : 'The site moved on after sending' }
    if (gone) return { ok: true, how: 'The form closed after sending' }
    const err = await scope.locator('[class*=error]:visible, [role=alert]:visible, .invalid-feedback:visible').first().innerText().catch(() => '')
    return { ok: false, why: err ? 'The site refused it: ' + err.slice(0, 80) : 'No sign the message was sent' }
  } catch (e) { return { ok: false, why: e.message.slice(0, 160) } }
  finally { await ctx.close().catch(() => {}) }
}

const { jobs = [], why } = await call('/api/factory/forms', { max: Number(process.env.FORMS_MAX) || 6 })
if (!jobs.length) { console.log('No contact forms to send now' + (why ? ': ' + why : '.')); process.exit(0) }
const { chromium } = await import('playwright')
const browser = await chromium.launch()
let n = 0
for (const J of jobs) {
  if (n++) await new Promise((r) => setTimeout(r, PAUSE + Math.random() * PAUSE))
  const res = await one(browser, J)
  log(`${res.ok ? 'sent' : 'not sent'}: ${new URL(J.url).host}${res.ok ? '' : ' (' + res.why + ')'}`)
  await call('/api/factory/form-result', { id: J.id, ...res }).catch((e) => log('report failed: ' + e.message))
}
await browser.close()
