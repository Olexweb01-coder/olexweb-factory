# Step 2 of the story voice (Chatterbox, numpy 1): he acts each line from his voice print. The emotion label sets how big
# the acting is. A line that fails is simply left out here; the mixer then uses the backup reading for it.
import json, os, sys, time, numpy as np, soundfile as sf
LEVEL = {'panic': (1.6, 0.25), 'shock': (1.0, 0.35), 'cry': (1.0, 0.35), 'excited': (1.0, 0.35)}   # exaggeration, cfg_weight
DEFAULT = (0.5, 0.5)
job = json.load(open('work/job.json')); beats = job['story']['beats'] + ([job['fb']['ask']] if (job.get('fb') or {}).get('ask') else [])   # + Facebook's ending line
BUDGET = float(os.environ.get('ACT_BUDGET') or 0)            # seconds; a long story stops acting when it runs out (the rest use the backup reading)
N = sum(1 for b in beats if (b.get('text') or '').strip()); t0 = time.time(); k = 0
os.makedirs('work/cbox', exist_ok=True)
try:
    import torch
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(os.cpu_count() or 4)
    model = ChatterboxTTS.from_pretrained(device='cpu')
except Exception as e:
    print('Chatterbox unavailable, the backup voice will be used:', str(e)[:200]); sys.exit(0)
# the big feelings first: if a long story runs out of time, it's the calm lines that fall back to the backup reading
for i, b in sorted(enumerate(beats), key=lambda x: 0 if x[1].get('emotion') in LEVEL else 1):
    text = (b.get('text') or '').strip()
    if not text: continue
    k += 1
    if BUDGET and time.time() - t0 > BUDGET:
        print(f'acting budget used up after {k - 1} of {N} lines: the rest use the backup reading', flush=True); break
    ex, cfg = LEVEL.get(b.get('emotion'), DEFAULT); s = time.time()
    try:
        w = model.generate(text, audio_prompt_path='work/voiceprint.wav', exaggeration=ex, cfg_weight=cfg)
        y = w.squeeze(0).cpu().numpy().astype(np.float32)
        sf.write(f'work/cbox/beat_{i}.wav', y, model.sr)
        print(f'acted {k}/{N}: beat {i} [{b.get("emotion")}] {len(y) / model.sr:.1f}s in {time.time() - s:.0f}s', flush=True)
    except Exception as e:
        print(f'beat {i} failed, backup will be used: {str(e)[:120]}', flush=True)
