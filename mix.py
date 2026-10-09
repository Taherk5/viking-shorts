"""Mixes the synthesised music/SFX bed with the Kokoro voice-over lines, ducking the music under the voice.
usage: python -I mix.py <music.wav> <vo_dir> <out.wav>"""
import sys, json, os, wave
import numpy as np, soundfile as sf

MUSIC, VO_DIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
SR = 44100

w = wave.open(MUSIC)
music = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, 2).astype(np.float64) / 32768
N = len(music)


def resample(x, sr_in, sr_out):
    m = int(round(len(x) * sr_out / sr_in))
    X = np.fft.rfft(x)
    Y = np.zeros(m // 2 + 1, dtype=complex)
    k = min(len(X), len(Y))
    Y[:k] = X[:k]
    return np.fft.irfft(Y, m) * (m / len(x))


def hp(x, fc, order=2):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = (f / fc) ** (2 * order)
    return np.fft.irfft(F * g / (1 + g), len(x))


rng = np.random.default_rng(5)
n_ir = int(0.5 * SR)
ir = rng.standard_normal(n_ir) * np.exp(-np.arange(n_ir) / (n_ir / 6))
ir[:int(0.004 * SR)] = 0
ir /= np.sqrt(np.sum(ir ** 2))

report = json.load(open(os.path.join(VO_DIR, 'report.json')))
vo = np.zeros(N)
for r in report:
    x, sr = sf.read(os.path.join(VO_DIR, f"line{r['id']:02d}.wav"))
    if x.ndim > 1:
        x = x.mean(axis=1)
    x = resample(x, sr, SR)
    x = hp(x, 80)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.11           # equal loudness per line (about -19 dBFS RMS)
    x[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    x[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR))
    size = 1 << int(np.ceil(np.log2(len(x) + n_ir)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    x = x + 0.07 * wet[:len(x)] * np.sqrt(np.mean(x ** 2)) / (np.sqrt(np.mean(wet ** 2)) + 1e-9)
    i = int(r['start'] * SR)
    seg = x[:N - i]
    vo[i:i + len(seg)] += seg

# duck the music while the voice is speaking
hop = int(0.01 * SR)
nf = N // hop
rms = np.sqrt(np.mean(vo[:nf * hop].reshape(nf, hop) ** 2, axis=1))
target = np.clip(rms / 0.03, 0, 1)
env = np.zeros(nf)
a_att, a_rel = 1 - np.exp(-0.01 / 0.06), 1 - np.exp(-0.01 / 0.45)
cur = 0.0
for i in range(nf):
    cur += (target[i] - cur) * (a_att if target[i] > cur else a_rel)
    env[i] = cur
env_s = np.interp(np.arange(N) / hop, np.arange(nf), env)
duck = 1 - 0.58 * env_s

mix = music * (0.8 * duck)[:, None] + vo[:, None] * 1.9
peak = np.abs(mix).max()
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25)
mix *= 0.89 / np.abs(mix).max()
sf.write(OUT, mix.astype(np.float32), SR, subtype='PCM_16')
spk = np.abs(vo) > 0.01
print('wrote', OUT, 'dur', round(N / SR, 2), 's; peak', round(float(np.abs(mix).max()), 3),
      '; music duck depth max', round(float(1 - duck.min()), 2), '; voice active', round(float(spk.mean() * N / SR), 1), 's')
