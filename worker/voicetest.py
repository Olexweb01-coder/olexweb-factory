# Voice test (manual only; it never runs for real videos). For each designed voice:
#  1. make his "voice print": a short neutral clip from the blended Kokoro voice, pitch-shifted (the design).
#  2. Chatterbox copies that voice and acts the test lines at 3 emotion levels.
# Writes out/voicetest/*.mp3 plus report.txt (how long each line took, so we know if it's fast enough).
# Two steps in two separate Python setups, because Kokoro needs numpy 2 and Chatterbox needs numpy 1:
#   python worker/voicetest.py prints <designs>     (Kokoro: the voice prints)
#   python worker/voicetest.py act                  (Chatterbox: the acting)
import json, os, subprocess, sys, time, traceback
import numpy as np, soundfile as sf

OUT = 'out/voicetest'; os.makedirs(OUT, exist_ok=True)
SR = 24000
DESIGNS = {   # the 4 designs sent on 6 Nov 2026: voice mix + pitch in semitones
  'A-bright-cheeky': ({'am_puck': .6, 'am_echo': .25, 'am_liam': .15}, 2.0),
  'B-warm-funny':    ({'am_michael': .45, 'am_puck': .35, 'am_fenrir': .2}, 1.0),
  'C-deep-comic':    ({'am_onyx': .4, 'am_puck': .4, 'am_adam': .2}, 0.0),
  'D-young-nervous': ({'am_liam': .5, 'am_puck': .3, 'am_eric': .2}, 3.0),
}
PRINT_TEXT = ("Hey! So, this is me. I find free websites that save you money. "
              "Some of them are honestly amazing, and some of them, well... let's just say I learned the hard way.")
LINES = [   # (emotion label, text): the label is what the script writer will give every line
  ('panic', 'No! No no no no!'),
  ('shock', 'Your free trial ends... today?!'),
  ('cry', "I can't pay every month, just to edit photos!"),
  ('excited', 'Photopea! It opens Photoshop files, right in my browser. For free!'),
]
# emotion level → Chatterbox settings: exaggeration (how big the acting is) and cfg_weight (lower = freer, more dramatic pacing)
LEVELS = {'1-normal': (0.5, 0.5), '2-strong': (1.0, 0.35), '3-extreme': (1.6, 0.25)}

MODE = sys.argv[1] if len(sys.argv) > 1 else 'prints'
pick = [d.strip() for d in (sys.argv[2] if len(sys.argv) > 2 else 'all').split(',') if d.strip()]
designs = {k: v for k, v in DESIGNS.items() if 'all' in pick or k[0] in [p[0].upper() for p in pick]}
RPT = f'{OUT}/report.txt'
report = open(RPT).read().splitlines() if MODE == 'act' and os.path.exists(RPT) else []
def log(s): print(s, flush=True); report.append(s); open(RPT, 'w').write('\n'.join(report))
def mp3(wav, path): subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-b:a', '160k', path], check=True)

if MODE == 'prints':
  from kokoro_onnx import Kokoro
  import librosa
  k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')
  prints = {}
  for name, (mix, semis) in designs.items():
    style = sum(k.get_voice_style(v) * w for v, w in mix.items()).astype(np.float32)
    a, _ = k.create(PRINT_TEXT, voice=style, speed=1.0, lang='en-us')
    a = librosa.effects.pitch_shift(a.astype(np.float32), sr=SR, n_steps=semis) if semis else a
    a = (a / max(1e-6, np.abs(a).max()) * 0.9).astype(np.float32)
    p = f'{OUT}/{name}-voiceprint.wav'; sf.write(p, a, SR); prints[name] = p
    mp3(p, f'{OUT}/{name}-0-voiceprint.mp3')
    log(f'{name}: voice print {len(a) / SR:.1f}s')
  json.dump(prints, open(f'{OUT}/prints.json', 'w'))
  sys.exit(0)

prints = json.load(open(f'{OUT}/prints.json'))
t0 = time.time()
try:
    import torch, torchaudio as ta
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(os.cpu_count() or 4)
    model = ChatterboxTTS.from_pretrained(device='cpu')
    log(f'Chatterbox loaded in {time.time() - t0:.0f}s on {os.cpu_count()} processors')
except Exception:
    log('Chatterbox could not load:\n' + traceback.format_exc()); sys.exit(1)

total_audio = total_time = 0.0
for name, ref in prints.items():
    for lvl, (ex, cfg) in LEVELS.items():
        parts = []
        for emo, text in LINES:
            s = time.time()
            try:
                w = model.generate(text, audio_prompt_path=ref, exaggeration=ex, cfg_weight=cfg)
                y = w.squeeze(0).cpu().numpy().astype(np.float32); took = time.time() - s
                total_audio += len(y) / model.sr; total_time += took
                log(f'{name} {lvl} [{emo}] {len(y) / model.sr:.1f}s of speech in {took:.0f}s')
                parts += [y, np.zeros(int(0.6 * model.sr), np.float32)]
            except Exception as e:
                log(f'{name} {lvl} [{emo}] FAILED: {e}')
        if parts:
            y = np.concatenate(parts); y = y / max(1e-6, np.abs(y).max()) * 0.9
            p = f'{OUT}/{name}-{lvl}.wav'; sf.write(p, y, model.sr); mp3(p, f'{OUT}/{name}-{lvl}.mp3'); os.remove(p)
for p in list(prints.values()) + [f'{OUT}/prints.json']: os.remove(p)
if total_audio: log(f'SPEED: {total_time / total_audio:.1f} seconds of work per second of speech (a 25 s Short ≈ {25 * total_time / total_audio / 60:.1f} min)')
