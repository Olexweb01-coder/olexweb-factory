# Music bed and sound effects, synthesised from scratch (owned outright, so no copyright claim is possible).
# Each part gets its own key and tempo. (The ACE-Step library, Part 4b, will replace the bed; this stays as the fallback.)
import json, numpy as np, soundfile as sf
from scipy.signal import butter, lfilter
SR = 44100; TL = json.load(open("src/timeline.json")); DUR = TL["duration"]; PART = int(TL.get("part") or 1)
rng = np.random.default_rng(PART)   # a different, repeatable bed for each part
def lp(x, f): b, a = butter(2, f/(SR/2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f/(SR/2), 'high'); return lfilter(b, a, x)
def env(n, a=0.01, r=0.3):
    t = np.arange(n)/SR; return np.minimum(1, t/a) * np.exp(-t/r)
def note(m): return 440*2**((m + SHIFT - 69)/12)
BPM = [96, 100, 104, 108, 112][PART % 5]; beat = 60/BPM; SHIFT = [0, 2, -3, 5, -2, 3][PART % 6]; N = int(SR*DUR); mix = np.zeros(N)
def add(sig, t):
    i = int(t*SR); j = min(N, i+len(sig))
    if i < N: mix[i:j] += sig[:j-i]
chords = [[57,60,64],[53,57,60],[48,52,55],[55,59,62]]          # Am F C G
bar = beat*4
for b in range(int(DUR/bar)+1):
    ch = chords[b % 4]; t0 = b*bar
    n = int(bar*SR); t = np.arange(n)/SR
    pad = sum(np.sign(np.sin(2*np.pi*note(m)*t))*0.5 + np.sin(2*np.pi*note(m)*1.003*t) for m in ch)
    add(lp(pad, 900) * np.minimum(1, t/0.4) * np.minimum(1, (bar-t)/0.3) * 0.035, t0)
    bass = np.sin(2*np.pi*note(ch[0]-12)*t[:int(SR*beat*2)])
    for k in (0, 2): add(bass*env(len(bass), 0.005, 0.5)*0.16, t0+k*beat)
    for s in range(8):                                                     # plucky arpeggio
        m = ch[[0,1,2,1,2,0,1,2][s]] + 12; tt = np.arange(int(SR*0.35))/SR
        add(np.sin(2*np.pi*note(m)*tt)*env(len(tt), 0.003, 0.12)*0.06, t0+s*beat/2)
    for k in range(4):                                                     # kick + hats
        kt = np.arange(int(SR*0.25))/SR; add(np.sin(2*np.pi*(50+90*np.exp(-kt*30))*kt)*np.exp(-kt*12)*0.32, t0+k*beat)
        for h in (0, 0.5):
            hh = hp(rng.standard_normal(int(SR*0.05)), 7000)*env(int(SR*0.05), 0.001, 0.015)*0.05
            add(hh, t0+(k+h)*beat)
fade = np.ones(N); f = int(SR*1.2); fade[-f:] = np.linspace(1, 0, f); fade[:int(SR*0.3)] = np.linspace(0, 1, int(SR*0.3))
mix *= fade; mix /= max(1e-9, np.abs(mix).max()); sf.write("public/music.wav", (mix*0.8).astype(np.float32), SR)

def save(name, x): x = x/np.abs(x).max()*0.8; sf.write(f"public/sfx_{name}.wav", x.astype(np.float32), SR)
n = int(SR*0.45); t = np.arange(n)/SR                                       # whoosh: filtered noise sweep
w = rng.standard_normal(n); out = np.zeros(n)
for i in range(0, n, 512): out[i:i+512] = lp(w[i:i+512], 300+5000*np.sin(np.pi*i/n))
save("whoosh", out*np.sin(np.pi*t/t[-1])**2)
n = int(SR*0.12); t = np.arange(n)/SR; save("pop", np.sin(2*np.pi*(900-500*t/t[-1])*t)*np.exp(-t*40))
n = int(SR*0.9); t = np.arange(n)/SR; save("ding", (np.sin(2*np.pi*1320*t)+0.5*np.sin(2*np.pi*1980*t))*np.exp(-t*5))
n = int(SR*0.06); t = np.arange(n)/SR; save("click", rng.standard_normal(n)*np.exp(-t*120))
print(f"  music: {DUR}s at {BPM} bpm, sound effects made", flush=True)
