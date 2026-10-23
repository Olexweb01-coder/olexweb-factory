// The first thing a run does: tell the admin a machine has started and the tools are being set up.
import { report } from './api.mjs'
const id = Number(process.argv[2])
await report(id, { stage: 'setup', note: 'installing the tools' })
