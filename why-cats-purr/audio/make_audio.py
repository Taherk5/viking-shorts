# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "scipy", "soundfile"]
# ///
"""What if the Sun disappeared?  Narration edit + dark drone bed.

    uv run why-cats-purr/audio/make_audio.py

Reads   audio/vo_lines.json, audio/vo_raw/<id>.wav (Kokoro am_adam, 24 kHz), audio/vo_raw/durations.json
Writes  audio/music.wav, audio/vo.wav, beats.json, assets/vo_timing.json (phrases + word times), film.json duration

Bed: C#-minor drone (sub C#1/C#2/C#3, detuned low pad, airy noise, long reverb) with a very soft 75 bpm pulse
underneath so cuts and sound effects have a real grid. The voice starts each line on a half-beat.
"""
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
SR = 48000
BPM = 75
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def bq(x, kind, f, q=0.7, g=0.0):
    w0 = 2 * np.pi * f / SR
    a = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    if kind == "hp":
        b, aa = [(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + a, -2 * c, 1 - a]
    elif kind == "lp":
        b, aa = [(1 - c) / 2, 1 - c, (1 - c) / 2], [1 + a, -2 * c, 1 - a]
    else:  # peaking
        A = 10 ** (g / 40)
        b, aa = [1 + a * A, -2 * c, 1 - a * A], [1 + a / A, -2 * c, 1 - a / A]
    return signal.lfilter(b, aa, x, axis=-1)


def verb(x, sec=2.8, decay=3.2):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n) * np.exp(-decay * t) for _ in range(2)])
    ir = bq(ir, "lp", 3500)
    return np.stack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)]) / np.sqrt((ir ** 2).sum() / 2)


# ------------------------------------------------------------------ voice-over on the half-beat grid
lines = json.loads((HERE / "vo_lines.json").read_text())
placed, cursor, GAP = [], 0.4, 0.3
half = BEAT / 2
for ln in lines:
    x, sr0 = sf.read(HERE / "vo_raw" / f"{ln['id']}.wav")
    x = signal.resample_poly(x, SR // sr0, 1) if SR % sr0 == 0 else signal.resample(x, int(len(x) * SR / sr0))
    start = math.ceil(cursor / half - 1e-9) * half
    placed.append((ln, x, start))
    cursor = start + len(x) / SR + GAP
last_end = placed[-1][2] + len(placed[-1][1]) / SR
DUR = math.ceil((last_end + 2.4) / BAR) * BAR            # end card holds >= 2.4 s, whole bars
N = int(SR * DUR)
NB = int(round(DUR / BEAT))

vo = np.zeros(N + SR * 2)
syl = lambda w: max(1, len([1 for i, ch in enumerate(w.lower()) if ch in "aeiouy" and (i == 0 or w.lower()[i - 1] not in "aeiouy")]))
timing = []
for ln, x, start in placed:
    a = int(round(start * SR))
    vo[a:a + len(x)] += x
    end = start + len(x) / SR
    # word times: place each word boundary where the *voiced* time (envelope above a floor) has run its
    # share of the line's syllables, so pauses at commas and stops don't smear the words
    env = np.convolve(np.abs(x), np.ones(int(0.012 * SR)) / int(0.012 * SR), mode="same")
    act = env > 0.07 * env.max()
    cum = np.cumsum(act).astype(float)
    cum /= cum[-1]
    words = ln["text"].split()
    wts = np.array([syl(w) + 0.25 * len(w.strip(".,:;?!")) for w in words])
    edge = np.concatenate([[0], np.cumsum(wts) / wts.sum()])
    ends = [float(np.searchsorted(cum, e, side="left")) / SR for e in edge]     # where the voiced share is reached
    begs = [float(np.searchsorted(cum, e, side="right")) / SR for e in edge]    # ...and where speech resumes after a pause
    # snap the boundary nearest each real pause onto it (word ends at the pause, next word starts after it)
    gaps, i0 = [], None
    for i, on in enumerate(act):
        if not on and i0 is None:
            i0 = i
        elif on and i0 is not None:
            if (i - i0) / SR >= 0.12 and i0 > 0:
                gaps.append((i0 / SR, i / SR))
            i0 = None
    for g0, g1 in gaps:                       # trailing silence never enters: the loop only closes gaps followed by speech
        cand = [(abs(ends[k] - g0), k) for k in range(1, len(words)) if g0 - 0.3 <= ends[k] <= g1]
        if cand:
            k = min(cand)[1]
            ends[k], begs[k] = g0, g1
    begs[0], ends[-1] = 0.0, len(x) / SR
    ws = [{"w": w, "s": round(start + begs[i], 3), "e": round(start + ends[i + 1], 3)} for i, w in enumerate(words)]
    timing.append({"id": ln["id"], "text": ln["text"], "start": round(start, 3), "end": round(end, 3),
                   "beat": round(start / BEAT, 2), "words": ws})
    print(f"{ln['id']:4s} beat {start / BEAT:5.1f}  {start:6.2f}-{end:6.2f}s")
(FILM / "assets").mkdir(exist_ok=True)
(FILM / "assets" / "vo_timing.json").write_text(json.dumps(timing, indent=1))
print(f"last line ends {last_end:.2f}s of {DUR:.1f}s (end card holds {DUR - last_end:.1f}s)")

# documentary-voice chain: low cut, warmth, presence, light compression, a little hall
v = vo[:N]
v = bq(v, "hp", 70)
v = bq(v, "peak", 160, 0.8, 2.0)
v = bq(v, "peak", 3200, 0.9, 2.5)
v = bq(v, "peak", 9000, 0.7, 1.5)
env = np.sqrt(signal.lfilter([0.002], [1, -0.998], v ** 2))
v = v * np.minimum(1, (0.1 / (env + 1e-5)) ** 0.45)
st = np.stack([v, v])
st = st + 0.14 * verb(st, 1.6, 4.5)
st = st / np.abs(st).max() * 0.8
sf.write(HERE / "vo.wav", st.T, SR, subtype="PCM_24")

# ------------------------------------------------------------------ bed
t = np.arange(N) / SR
lfo = lambda f, ph=0: 0.5 + 0.5 * np.sin(2 * np.pi * f * t + ph)
sub = (0.55 * np.sin(2 * np.pi * 34.65 * t) * (0.75 + 0.25 * lfo(0.07)) + 0.35 * np.sin(2 * np.pi * 69.3 * t)
       + 0.2 * np.sin(2 * np.pi * 138.6 * t) * lfo(0.05, 1) + 0.25 * np.sin(2 * np.pi * 69.9 * t) * lfo(0.09, 2))
pad = np.zeros((2, N))
for f, pan in [(138.6, 0), (207.7, -.3), (246.9, .3), (329.6, -.5), (370.0, .5), (277.2, 0)]:      # C#m add11
    for det in (-0.35, 0.0, 0.4):
        ff = f * (1 + det / 100)
        x = sum(np.sin(2 * np.pi * h * ff * t + h) / h for h in range(1, 9))
        a = (1 - pan) / 2
        pad[0] += x * np.sqrt(a) * 0.05
        pad[1] += x * np.sqrt(1 - a) * 0.05
sw = 0.45 + 0.55 * lfo(0.055, 3)
for c in range(2):
    lo, hi, k = bq(pad[c], "lp", 420), bq(pad[c], "lp", 1000), lfo(0.04)
    pad[c] = (lo * (1 - k) + hi * k) * sw
air = rng.standard_normal((2, N))
air = bq(bq(air, "hp", 2000), "lp", 9000) * 0.018 * (0.4 + 0.6 * lfo(0.11, 1))
bed = np.stack([sub, sub]) * 0.9 + pad + air
bed = bed + 0.55 * verb(pad * 1.3 + air * 0.5)

# the soft pulse (lub + dub on every beat), kept low so the drone stays the sound of the film
kn = int(0.42 * SR)
kt = np.arange(kn) / SR
fk = 44 + 100 * np.exp(-kt / 0.03) + 18 * np.exp(-kt / 0.12)
lub = np.sin(2 * np.pi * np.cumsum(fk) / SR) * np.exp(-kt / 0.26) * (1 - np.exp(-kt / 0.0015))
lub = bq(lub, "lp", 220)
pulse = np.zeros((2, N + kn))
for b in range(NB):
    for dt, gn in ((0.0, 0.26), (0.32 * BEAT, 0.12)):
        a = int(round((b * BEAT + dt) * SR))
        pulse[:, a:a + kn] += gn * lub
pulse = pulse[:, :N]
bed = bed / np.sqrt((bed ** 2).mean()) * 0.2 + pulse * 0.55
fade = int(1.5 * SR)
bed[:, :int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))
bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
bed *= 10 ** (-3 / 20) / (np.abs(bed).max() + 1e-9)
sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

# ------------------------------------------------------------------ beat grid: measured on the pulse stem
sm = np.convolve(np.abs(pulse.mean(axis=0)), np.ones(int(0.002 * SR)) / int(0.002 * SR), mode="same")
rises = []
for b in range(NB):
    a0, a1 = int(b * BEAT * SR), int((b + 0.6) * BEAT * SR)
    w = sm[a0:a1]
    rises.append((a0 + int(np.argmax(w > 0.5 * w.max()))) / SR - b * BEAT)
offset = float(np.median(rises))
grid = {"bpm": BPM, "period": BEAT, "offset": round(offset, 5), "beats": [round(offset + BEAT * i, 5) for i in range(NB + 1)],
        "downbeats": [round(offset + BEAT * i, 5) for i in range(0, NB + 1, 4)], "designed_bpm": BPM,
        "fit_residual_ms": round(float(np.std(rises)) * 1000, 3), "fit_inliers": NB,
        "sections": [{"name": "hook", "beat": 0}, {"name": "ideas", "beat": 8}, {"name": "end", "beat": NB - 4}],
        "source": "why-cats-purr/audio/make_audio.py: soft pulse stem, attack rise time per beat, median"}
(FILM / "beats.json").write_text(json.dumps(grid, indent=1))
film = json.loads((FILM / "film.json").read_text())
film["duration"] = round(DUR, 3)
film["poster"] = 1.0
(FILM / "film.json").write_text(json.dumps(film, indent=1))
print(f"beats: {BPM} bpm, offset {offset * 1000:.1f} ms (+-{grid['fit_residual_ms']} ms), {NB} beats, duration {DUR:.1f}s")
print("wrote music.wav, vo.wav, beats.json, assets/vo_timing.json, film.json")
