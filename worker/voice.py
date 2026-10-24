# Voice: Kokoro (open source, runs on an ordinary processor) reads each scene. Each scene's start and end come from
# its own audio, so scene timing is exact; within a scene, words are spread by syllables for the captions.
import json, re, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
job = json.load(open('work/job.json'))
k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')   # full precision: the compact int8 model garbles some lines on some processors
SR, GAP, FPS, LEAD = 24000, 0.18, 30, 0.25
def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(0, idx[0] - 600): idx[-1] + 1200] if len(idx) else a
def weight(w): return max(1, len(re.findall(r'[aeiouy]+', w.lower()))) + 0.3
parts, t, scenes = [np.zeros(int(SR * LEAD), dtype=np.float32)], LEAD, []
voices = set(k.get_voices()) if hasattr(k, 'get_voices') else None
voice = job.get('voice') or 'am_michael'
if voices and voice not in voices: voice = 'am_michael'
intro = (job.get('intro') or '').strip()                    # "Secret websites you should know, part 10." said first
for i, sc in enumerate(job['scenes']):
    said = (intro + ' ' + sc['text']).strip() if i == 0 and intro else sc['text']
    for attempt in range(2):                                   # every line is checked: real length for its words, sane volume
        a, sr = k.create(said, voice=voice, speed=1.12, lang='en-us'); a = a.astype(np.float32)
        ok = len(a) > 0 and np.isfinite(a).all() and np.abs(a).max() < 2.0 and len(a) / SR >= 0.12 * len(said.split())
        if ok: break
    if not ok: sys.exit(f'the voice came out broken for scene {i + 1} ("{said[:50]}"), even after a second try')
    a = trim(a)
    d = len(a) / SR; words = said.split(); W = [weight(w) for w in words]; tot = sum(W) or 1; c = t; wt = []
    for w, x in zip(words, W): dur = d * x / tot; wt.append({'w': w, 's': round(c, 3), 'e': round(c + dur, 3)}); c += dur
    scenes.append({**sc, 'start': round(t, 3), 'end': round(t + d, 3), 'words': wt})
    parts += [a, np.zeros(int(SR * GAP), dtype=np.float32)]; t += d + GAP
    print(f'  scene {i + 1}/{len(job["scenes"])}: {d:.1f}s', flush=True)
audio = np.concatenate(parts); sf.write('public/voice.wav', audio, SR)
host = re.sub(r'^https?://(www\.)?', '', job['site']['url']).split('/')[0]
json.dump({'fps': FPS, 'duration': round(t + 0.6, 3), 'scenes': scenes, 'site': {**job['site'], 'host': host}, 'part': job.get('part'), 'series': job['series'], 'kind': job.get('kind', 'short'), 'volume': job.get('volume'), 'chapters': job.get('chapters')},
          open('src/timeline.json', 'w'), indent=1)
print(f'  voice: {t:.1f}s with {voice}', flush=True)
