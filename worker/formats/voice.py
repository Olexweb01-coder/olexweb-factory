# The voice for the "explainer" formats (worker/formats/): one narrator, fast and continuous, like the Shorts that work.
# No acting pauses between lines (0.06s), a light music bed under it, and a soft whoosh on every new step so the ear
# notices each change. Writes work/fmt.wav and work/fmt.json (each beat's start/end and every word's timing).
# Usage: python3 worker/formats/voice.py   (reads work/fmt_job.json: {"voice", "speed", "beats": [{"text": ...}]})
import json, re, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
SR, FPS, GAP, LEAD, TAIL = 24000, 30, 0.06, 0.15, 1.2
job = json.load(open('work/fmt_job.json'))
k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')
voice, speed = job.get('voice', 'am_michael'), float(job.get('speed', 1.18))

def trim(a, thr=0.012):
    i = np.where(np.abs(a) > thr)[0]
    return a[max(0, i[0] - 240): i[-1] + 600] if len(i) else a
def weight(w): return max(1, len(re.findall(r'[aeiouy]+', w.lower()))) + 0.35 + (0.6 if re.search(r'[.,!?…]$', w) else 0)

parts, t, beats = [np.zeros(int(SR * LEAD), np.float32)], LEAD, []
for i, b in enumerate(job['beats']):
    for attempt in range(2):
        a, _ = k.create(b['text'], voice=voice, speed=speed, lang='en-us'); a = a.astype(np.float32)
        ok = len(a) and np.isfinite(a).all() and np.abs(a).max() < 2 and len(a) / SR >= 0.11 * len(b['text'].split())
        if ok: break
    if not ok: sys.exit(f'voice broken on beat {i + 1}')
    a = trim(a); d = len(a) / SR
    words = b['text'].split(); W = [weight(w) for w in words]; tot = sum(W); c = t; wt = []
    for w, x in zip(words, W): dd = d * x / tot; wt.append({'w': w, 's': round(c, 3), 'e': round(c + dd, 3)}); c += dd
    beats.append({**b, 'start': round(t, 3), 'end': round(t + d, 3), 'words': wt})
    parts += [a, np.zeros(int(SR * GAP), np.float32)]; t += d + GAP
    print(f'  beat {i + 1}/{len(job["beats"])}: {d:.1f}s', flush=True)
parts.append(np.zeros(int(SR * TAIL), np.float32))
voice_track = np.concatenate(parts); N = len(voice_track); secs = N / SR

# music: a bright plucked loop (I–V–vi–IV) with a soft kick, quiet under the voice
rng = np.random.default_rng(7); bpm = 104; beat = 60 / bpm; music = np.zeros(N, np.float32)
def tone(f, d, decay=6.0, harm=(1, .5, .25)):
    n = int(SR * d); x = np.arange(n) / SR; e = np.exp(-decay * x) * np.minimum(1, x / 0.004)
    return (sum(h * np.sin(2 * np.pi * f * (i + 1) * x) for i, h in enumerate(harm)) * e).astype(np.float32)
def put(sig, at):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: music[i:j] += sig[:j - i]
roots = [60, 67, 69, 65]                                   # C G Am F
for bar in range(int(secs / (4 * beat)) + 1):
    r = roots[bar % 4]; chord = [r, r + (3 if r == 69 else 4), r + 7]
    for s in range(8):                                      # eighth-note arpeggio
        m = chord[[0, 1, 2, 1, 0, 2, 1, 2][s]] + (12 if s in (2, 5) else 0)
        put(tone(440 * 2 ** ((m - 69) / 12), 0.35, 9) * 0.09, bar * 4 * beat + s * beat / 2)
    put(tone(440 * 2 ** ((r - 24 - 69) / 12), 4 * beat, 1.2, (1, .3)) * 0.18, bar * 4 * beat)        # bass
    for s in range(4):                                      # kick
        n = int(SR * 0.18); x = np.arange(n) / SR
        put((np.sin(2 * np.pi * (50 + 90 * np.exp(-30 * x)) * x) * np.exp(-14 * x)).astype(np.float32) * 0.22, bar * 4 * beat + s * beat)
# a whoosh at each new beat (filtered noise swell), so every change is felt
for b in beats[1:]:
    n = int(SR * 0.32); x = np.linspace(0, 1, n); nz = rng.standard_normal(n).astype(np.float32)
    nz = np.convolve(nz, np.ones(18) / 18, 'same'); env = np.sin(np.pi * x) ** 2
    put((nz * env * 0.16).astype(np.float32), max(0, b['start'] - 0.2))
for b in beats:                                              # little pops where a beat asks for one
    if b.get('sfx') == 'pop': put(tone(880, 0.12, 30, (1, .4)) * 0.25, b['start'] + 0.05)
    if b.get('sfx') == 'win':
        for i, m in enumerate([72, 76, 79, 84]): put(tone(440 * 2 ** ((m - 69) / 12), 0.5, 4) * 0.16, b['start'] + i * 0.09)
    if b.get('sfx') == 'bad': put(tone(110, 0.4, 5, (1, .8, .6, .4)) * 0.22, b['start'] + 0.05)

# under the voice: duck the music while someone speaks (gentle sidechain)
envv = np.convolve(np.abs(voice_track), np.ones(2400) / 2400, 'same'); duck = 1 - 0.55 * np.clip(envv / (envv.max() * 0.25 + 1e-9), 0, 1)
mix = voice_track * 1.0 + music * duck * 0.8
mix = mix / max(1e-6, np.abs(mix).max()) * 0.89
sf.write('work/fmt.wav', mix.astype(np.float32), SR)
json.dump({'fps': FPS, 'secs': round(secs, 3), 'beats': beats}, open('work/fmt.json', 'w'), indent=1)
print(f'  audio: {secs:.1f}s with {voice}')
