# Step 3 of the story voice: put it together. For each line, the acted take (Chatterbox) if it passes its checks, else
# the backup reading (Kokoro, with a light shout/cry treatment). Then the sound effects each scene calls for, and music
# (quiet under the voice, silent at the tense moments). Writes work/story.wav and work/story.json (timing for the frames).
# Usage: python3 mix.py [fb]   fb = Facebook's version: the last beat (the loop) is swapped for his question to the viewers,
# and it writes work/story_fb.wav and work/story_fb.json instead.
import json, os, re, sys, numpy as np, soundfile as sf
SR, FPS = 24000, 24
job = json.load(open('work/job.json')); main = job['story']['beats']
FB = len(sys.argv) > 1 and sys.argv[1] == 'fb'
if FB:
    ask = (job.get('fb') or {}).get('ask')
    if not ask: raise SystemExit('no Facebook ending in this job')
    beats, audio = main[:-1] + [ask], list(range(len(main) - 1)) + [len(main)]    # the ask line was voiced as line len(main)
else: beats, audio = main, list(range(len(main)))
OUT = 'work/story_fb' if FB else 'work/story'
PAUSE = {'yell': 0.15, 'read': 0.55, 'cry': 1.05, 'idea': 0.6, 'celebrate': 1.1}
HUSH = {'yell', 'read', 'panic', 'cry'}

def load(p):
    a, sr = sf.read(p, dtype='float32')
    if a.ndim > 1: a = a.mean(axis=1)
    if sr != SR:
        import librosa; a = librosa.resample(a, orig_sr=sr, target_sr=SR).astype(np.float32)
    return a
def trim(a, thr=0.012):
    i = np.where(np.abs(a) > thr)[0]
    return a[max(0, i[0] - 480): i[-1] + 1200] if len(i) else a
def sane(a, text):                                           # right length for its words, not silent, no glitches
    words = max(1, len(re.findall(r"[A-Za-z0-9']+", text))); d = len(a) / SR
    return np.isfinite(a).all() and 0.12 * words <= d <= 1.1 * words + 1.2 and np.sqrt((a ** 2).mean()) > 0.01
def treat(a, emo):                                           # only for backup lines: a hint of the feeling
    x = np.arange(len(a)) / SR
    if emo == 'panic': a = np.tanh(a * 3.2) * .55; e = np.zeros_like(a); d = int(.11 * SR); e[d:] = a[:-d] * .32; a = a + e
    if emo == 'cry': a = a * (1 - .45 * (.5 + .5 * np.sin(2 * np.pi * 6.5 * x))) * 1.15
    return a

def sfx(kind, d):
    x = np.arange(int(d * SR)) / SR; r = np.random.default_rng(sum(map(ord, kind)))
    if kind == 'buzz': return (np.sign(np.sin(2 * np.pi * 150 * x)) * 0.25 * (np.sin(2 * np.pi * 9 * x) > 0)).astype(np.float32)
    if kind == 'sting': env = np.exp(-x * 2.2); return ((np.sin(2 * np.pi * 110 * x) + np.sin(2 * np.pi * 116.5 * x) + np.sin(2 * np.pi * 164.8 * x) * .6 + r.normal(0, .25, len(x)) * np.exp(-x * 9)) * env * 0.32).astype(np.float32)
    if kind == 'whoosh': n0 = r.normal(0, 1, len(x)); return (np.convolve(n0, np.ones(30) / 30, 'same') * np.sin(np.pi * x / d) ** 2 * 0.5).astype(np.float32)
    if kind == 'pop': return (np.sin(2 * np.pi * (600 + 900 * x / d) * x) * np.exp(-x * 30) * 0.35).astype(np.float32)
    if kind == 'type':
        out = np.zeros(len(x), dtype=np.float32)
        for k in range(int(d * 11)):
            p = int((k / 11 + r.uniform(0, .03)) * SR); q = min(len(x), p + 600)
            if p < len(x): out[p:q] += (r.normal(0, 1, q - p) * np.exp(-np.arange(q - p) / 90) * 0.12).astype(np.float32)
        return out
    if kind == 'ding': return ((np.sin(2 * np.pi * 1318 * x) + .5 * np.sin(2 * np.pi * 1976 * x)) * np.exp(-x * 5) * 0.25).astype(np.float32)
    if kind == 'scratch': f = 900 * np.exp(-x * 5) + 200 * np.sin(2 * np.pi * 7 * x); return ((np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + r.normal(0, 1, len(x)) * 0.35) * np.exp(-x * 4) * 0.45).astype(np.float32)
    if kind == 'gasp': n0 = np.convolve(r.normal(0, 1, len(x)), np.hanning(9) / 4, 'same'); return (n0 * np.minimum(1, x / 0.05) * np.exp(-x * 7) * (0.5 + 0.5 * np.sin(2 * np.pi * 900 * x)) * 0.5).astype(np.float32)
    if kind == 'sob':
        out = np.zeros(len(x), dtype=np.float32)
        for st, f0 in [(0, 330), (0.32, 300), (0.62, 360)]:
            p = int(st * SR); q = min(len(x), p + int(0.26 * SR)); u = np.arange(q - p) / SR
            if p < len(x): out[p:q] += ((np.sin(2 * np.pi * (f0 - 160 * u) * u) * 0.6 + r.normal(0, .35, len(u))) * np.sin(np.pi * u / 0.26) ** 2 * 0.3).astype(np.float32)
        return out
    if kind == 'cheer':
        n0 = np.convolve(r.normal(0, 1, len(x)), np.ones(14) / 14, 'same'); env = np.minimum(1, x / 0.3) * np.exp(-np.maximum(0, x - 0.6) * 2.4)
        return ((n0 * 0.9 + np.sin(2 * np.pi * (1800 + 600 * np.sin(2 * np.pi * 2 * x)) * x) * 0.12 * (x > 0.25)) * env * 0.35).astype(np.float32)
    if kind == 'thud': return (np.sin(2 * np.pi * 70 * x * np.exp(-x * 6)) * np.exp(-x * 14) * 0.8 + r.normal(0, .3, len(x)) * np.exp(-x * 40)).astype(np.float32)
    if kind == 'boing': return (np.sin(2 * np.pi * (220 + 260 * np.sin(2 * np.pi * 9 * x) * np.exp(-x * 4)) * x) * np.exp(-x * 3) * 0.3).astype(np.float32)
    return np.zeros(len(x), dtype=np.float32)

# 1. lines and timing
parts, t, timing, used = [np.zeros(int(0.12 * SR), np.float32)], 0.12, [], {'acted': 0, 'backup': 0}
for i, b in enumerate(beats):
    text = (b.get('text') or '').strip()
    if not text:                                             # a beat with no words (the time jump)
        d = float((b.get('props') or {}).get('secs', 1.2)); timing.append({'start': t, 'end': t + d})
        parts.append(np.zeros(int(d * SR), np.float32)); t += d; continue
    a, src = None, 'backup'
    j = audio[i]
    if os.path.exists(f'work/cbox/beat_{j}.wav'):
        c = trim(load(f'work/cbox/beat_{j}.wav'))
        if sane(c, text): a, src = c, 'acted'
    if a is None:
        if not os.path.exists(f'work/kokoro/beat_{j}.wav'): raise SystemExit(f'no voice for line {i + 1}')
        a = treat(trim(load(f'work/kokoro/beat_{j}.wav')), b.get('emotion'))
    a = a / max(1e-6, np.abs(a).max()) * (0.95 if b.get('emotion') == 'panic' else 0.8)
    used[src] += 1; g = PAUSE.get(b.get('scene'), 0.32)
    timing.append({'start': t, 'end': t + len(a) / SR, 'voice': src}); parts += [a, np.zeros(int(g * SR), np.float32)]; t += len(a) / SR + g
parts.append(np.zeros(int(0.35 * SR), np.float32))
voice = np.concatenate(parts); n = len(voice); secs = n / SR; tt = np.arange(n) / SR

# 2. sound effects, from each beat's scene
def at(sec, kind, d):
    w = sfx(kind, d); p0 = int(max(0, sec) * SR); p1 = min(n, p0 + len(w))
    if p0 < n: fx[p0:p1] += w[:p1 - p0]
fx = np.zeros(n, np.float32)
for b, T in zip(beats, timing):
    s, e, sc = T['start'], T['end'], b.get('scene')
    if sc == 'yell': at(s - 0.1, 'sting', 1.4)
    elif sc == 'timejump': at(s, 'scratch', 0.55)
    elif sc == 'desk': at(s, 'type', min(2.3, e - s))
    elif sc == 'buzz': at(s - 0.3, 'buzz', 0.45); at(s + 0.3, 'buzz', 0.4)
    elif sc == 'read': at(e - 0.85, 'gasp', 0.35); at(e - 0.1, 'sting', 1.2)
    elif sc == 'panic': at(s - 0.25, 'whoosh', 0.35)
    elif sc == 'cry': at(e, 'sob', 0.95)
    elif sc == 'idea': at(s, 'boing', 0.5); at(e, 'type', 0.6)
    elif sc == 'reveal': at(s - 0.15, 'ding', 1.0)
    elif sc == 'proof':
        k = len((b.get('props') or {}).get('cards') or [])
        for j in range(min(3, k)): at(s + 0.2 + j * max(0.6, (e - s) / max(1, k + 0.5)), 'pop', 0.25)
    elif sc == 'celebrate': at(s + 0.5, 'thud', 0.4); at(s + 0.55, 'cheer', 1.6)
    elif sc == 'again': at(s - 0.7, 'buzz', 0.4); at(e - 0.3, 'gasp', 0.3)
    elif sc == 'chapter': at(s, 'whoosh', 0.45); at(s + 0.35, 'ding', 1.0)
    elif sc == 'ask': at(s, 'pop', 0.25)
    elif sc == 'outro': at(e - 0.2, 'cheer', 1.4)

# 3. music: four warm chords and a soft beat, quiet; silent at the tense moments
music = np.zeros(n, np.float32); bar = 2.4
for i, ch in enumerate([[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 311.1]] * int(secs / 9.6 + 2)):
    s0 = int(i * bar * SR)
    if s0 >= n: break
    s1 = min(n, int((i + 1) * bar * SR) + int(0.4 * SR)); seg = tt[s0:s1] - tt[s0]; env = np.minimum(1, seg / 0.5) * np.exp(-seg * 0.35)
    for f in ch: music[s0:s1] += (np.sin(2 * np.pi * f * seg) * 0.5 + np.sin(2 * np.pi * f * 2 * seg) * 0.12) * env * 0.035
    for k in range(4):
        p = s0 + int(k * bar / 4 * SR); q = min(n, p + int(0.12 * SR))
        if p < n: u = tt[p:q] - tt[p]; music[p:q] += np.sin(2 * np.pi * 60 * u * np.exp(-u * 18)) * np.exp(-u * 30) * 0.06
level = np.minimum(1, np.minimum(tt / 0.5, (secs - tt) / 0.6)).astype(np.float32)
for b, T in zip(beats, timing):
    if b.get('scene') in HUSH: level[int(max(0, T['start'] - 0.15) * SR): int((T['end'] + 0.2) * SR)] *= 0.12

mixed = voice * 0.95 + music * level + fx
mixed = (mixed / max(1e-6, np.abs(mixed).max()) * 0.92).astype(np.float32)
sf.write(OUT + '.wav', mixed, SR)
hop = SR // FPS; amp = [float(np.sqrt(np.mean(voice[i:i + hop] ** 2))) for i in range(0, n, hop)]; peak = max(amp) or 1
json.dump({'fps': FPS, 'secs': secs, 'beats': timing, 'amp': [round(a / peak, 3) for a in amp], 'voice': used}, open(OUT + '.json', 'w'))
print(f'{"Facebook " if FB else ""}story audio: {secs:.1f}s, {used["acted"]} acted line(s), {used["backup"]} backup line(s)')
