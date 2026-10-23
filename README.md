# olexweb-factory

Video factory for the Olexweb YouTube channel. The Olexweb admin (olexweb.com/admin → YouTube → Scripts) starts the
`render` workflow for one approved script; this repo turns it into a finished Short and sends it back.

**Steps:** fetch the job → film the real site (Playwright) → voice (Kokoro, open source) → music and sound effects
(synthesised, owned outright) → render (Remotion) → send the MP4 back in 4 MiB pieces.

**Security.** This repo is public, so the run's inputs (the script number and the admin's address) are not secret.
Every call back to the admin is signed with `FACTORY_SECRET` (repo Settings → Secrets and variables → Actions), the
same value as in Vercel. The workflow refuses any admin address other than https://olexweb.com.

**Files.** `worker/run.mjs` the steps · `worker/api.mjs` signed calls · `worker/voice.py` · `worker/sound.py` ·
`src/Short.jsx` the video · `src/Stickman.jsx` the host · `.github/workflows/render.yml`.

**Local run** (for development): `npm install`, put the two Kokoro model files in `models/`, then
`OLEX_API=https://olexweb.com FACTORY_SECRET=… node worker/run.mjs --id 12`.

Remotion is free for individuals and companies of up to three people (remotion.dev/license).
Fonts: Hubot Sans and Mona Sans by GitHub (SIL Open Font License).
