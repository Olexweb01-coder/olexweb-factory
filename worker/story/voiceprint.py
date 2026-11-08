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
SPEED = {'panic': 1.15, 'excited': 1.08, 'cry': 0.98, 'angry': 1.08, 'scared': 1.1, 'shock': 1.05, 'sad': 0.95}
# Install 22, a real story: every character has a voice of their own (British for UK stories, American for US ones; older
# people a little deeper and slower, young ones a little brighter). He narrates; the host's lines use his voice.
VOICES = {('GB', 'f'): ['bf_emma', 'bf_isabella', 'bf_alice', 'bf_lily'], ('GB', 'm'): ['bm_george', 'bm_lewis', 'bm_daniel', 'bm_fable'],
          ('US', 'f'): ['af_heart', 'af_bella', 'af_nicole', 'af_sarah'], ('US', 'm'): ['am_adam', 'am_eric', 'am_liam', 'am_onyx']}
cast_voice = {}
if job.get('mode') == 'tale':
    used, country = {}, job.get('country') if job.get('country') in ('GB', 'US') else 'GB'
    for c in job.get('cast') or []:
        key = (country, c.get('sex') if c.get('sex') in ('f', 'm') else 'm'); nth = used.get(key, 0); used[key] = nth + 1
        name = VOICES[key][nth % 4]
        semis = -1.5 if c.get('age') == 'older' else 0.8 if c.get('age') == 'young' else 0
        cast_voice[c['id']] = (name, semis, 0.94 if c.get('age') == 'older' else 1.0, 'en-gb' if country == 'GB' else 'en-us')
    def say_as(cid, text, speed=1.0):
        name, sm, sp, lang = cast_voice[cid]
        a, sr = k.create(text, voice=name, speed=speed * sp, lang=lang); assert sr == SR
        a = a.astype(np.float32)
        return librosa.effects.pitch_shift(a, sr=SR, n_steps=sm).astype(np.float32) if sm else a
    for cid in cast_voice:                                            # each character's voice print, for the acting
        v = say_as(cid, "Hi. I can't believe this is happening to me. Honestly, I don't know what to do. Okay. Let's think this through, one step at a time.")
        sf.write(f'work/voiceprint_{cid}.wav', v / max(1e-6, np.abs(v).max()) * 0.9, SR)
for i, b in enumerate(beats):
    if (b.get('text') or '').strip():
        sp = SPEED.get(b.get('emotion'), 1.03)
        sf.write(f'work/kokoro/beat_{i}.wav', say_as(b['speaker'], b['text'], sp) if b.get('speaker') in cast_voice else say(b['text'], sp), SR)
print('voice print and backup lines ready')
