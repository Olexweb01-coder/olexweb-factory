# Step 1 of the story voice (Kokoro, numpy 2): his voice print (voice B, approved 6 Nov 2026) and a backup reading of
# every line, used whenever Chatterbox can't act a line. Writes work/voiceprint.wav and work/kokoro/beat_<i>.wav.
import json, os, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro
VOICE_B = ({'am_michael': .45, 'am_puck': .35, 'am_fenrir': .2}, 1.0)        # mix of Kokoro voices + pitch (semitones)
PRINT = ("Hey! So, this is me. I find free websites that save you money. "
         "Some of them are honestly amazing, and some of them, well... let's just say I learned the hard way.")
SR = 24000
job = json.load(open('work/job.json')); beats = job['story']['beats'] + ([job['fb']['ask']] if (job.get('fb') or {}).get('ask') else [])   # + Facebook's ending line
k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')
mix, semis = VOICE_B
style = sum(k.get_voice_style(v) * w for v, w in mix.items()).astype(np.float32)
def say(text, speed=1.0):
    a, sr = k.create(text, voice=style, speed=speed, lang='en-us'); assert sr == SR
    a = a.astype(np.float32)
    return librosa.effects.pitch_shift(a, sr=SR, n_steps=semis).astype(np.float32) if semis else a
a = say(PRINT); sf.write('work/voiceprint.wav', a / max(1e-6, np.abs(a).max()) * 0.9, SR)
os.makedirs('work/kokoro', exist_ok=True)
SPEED = {'panic': 1.15, 'excited': 1.08, 'cry': 0.98}
for i, b in enumerate(beats):
    if (b.get('text') or '').strip(): sf.write(f'work/kokoro/beat_{i}.wav', say(b['text'], SPEED.get(b.get('emotion'), 1.03)), SR)
print('voice print and backup lines ready')
