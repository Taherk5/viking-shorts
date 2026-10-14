# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Why do we dream?  Bespoke score + voice-over edit.

    MOTION_REEL_SKILL=<skill dir> uv run why-we-dream/audio/score.py

Reads   audio/vo_lines.json, audio/vo_raw/<id>.wav (Kokoro, 24 kHz), audio/vo_raw/durations.json
Writes  audio/music.wav, audio/vo.wav, beats.json, assets/vo_timing.json (phrases + word times for captions)

75 BPM, 4/4, 60 beats = 48.0 s. D major, soft pads (Dmaj9 / Bm9 / Gmaj9 / A6sus), a slow 'sleeping' heartbeat
(lub-dub on every beat), sparse pentatonic bells, a breath of air. The voice's phrases land on half-beats.
"""
import json
import math
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal


def _skill_dir():
    if os.environ.get("MOTION_REEL_SKILL"):
        return Path(os.environ["MOTION_REEL_SKILL"])
    found = sorted((Path.home() / ".claude/plugins").glob("**/skills/motion-reel/scripts/dsp.py"))
    if found:
        return found[-1].parent.parent
    sys.exit("set MOTION_REEL_SKILL to the folder that holds the motion-reel SKILL.md")


sys.path.insert(0, str(_skill_dir() / "scripts"))
from dsp import *  # noqa: E402,F403

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM = 75
BEAT = 60 / BPM
DUR = 48.0
N = int(SR * DUR)
NB = int(round(DUR / BEAT))          # 60 beats
seed(20261014)
rng2 = np.random.default_rng(14)

# ------------------------------------------------------------------ music
music, bass, heart, fx, grid_bus = (Bus(DUR, BPM) for _ in range(5))
CH = [(['D3', 'F#3', 'A3', 'C#4', 'E4'], 'D2'), (['B2', 'F#3', 'A3', 'C#4', 'D4'], 'B1'),
      (['G2', 'D3', 'F#3', 'A3', 'B3'], 'G1'), (['A2', 'E3', 'F#3', 'B3', 'C#4'], 'A1')]
for bar in range(NB // 4):
    notes, root = CH[bar % 4]
    last = bar == NB // 4 - 1
    if last:
        notes = ['D3', 'A3', 'C#4', 'E4', 'F#4']
    L = 4 * BEAT + (2.4 if last else 1.2)
    music.add(pad_chord(notes, L, (550, 1500), attack=1.0 if bar == 0 else 0.9, release=1.6 if last else 1.0), bar * 4, 0.30)
    bass.add(bass_note(root, 4 * BEAT * (1.5 if last else 0.95), 240), bar * 4, 0.5)

for b in range(NB):
    vol = 0.8 if b < 4 or b >= 54 else 1.0
    heart.add(kick(soft=True), b, 0.20 * vol)                 # lub
    heart.add(kick(soft=True), b + 0.32, 0.10 * vol)          # dub
    grid_bus.add(kick(soft=True), b, 0.5)

PENT = ['D5', 'F#5', 'A5', 'C#6', 'E6', 'F#6']
for bar in range(1, NB // 4 - 1):
    for pos in rng2.choice([0.5, 1.5, 2, 2.5, 3, 3.5], size=int(rng2.integers(2, 4)), replace=False):
        fx.add(keys([str(rng2.choice(PENT))], 2.4), bar * 4 + float(pos), 0.11, pan=float(rng2.uniform(-0.6, 0.6)))
# a bright 'bell' on every voice section change is added by sfx.mjs from HITS; here only the long resolve
fx.add(keys(['D5', 'A5', 'F#6'], 4.0), NB - 4, 0.14)

t = np.arange(N) / SR
air = rng.standard_normal(N)
air = sweep_filter(air, np.geomspace(300, 2600, N), "bandpass", 0.8)
swell = np.interp(t, [0, 6.4, 19, 38, 44, 48], [0.0, 0.5, 0.7, 0.9, 0.6, 0.0]) * 0.06
air_st = np.stack([air * swell, np.roll(air, 977) * swell])

wet = reverb(music.x * 0.5 + fx.x, 0.55, length=2.6, decay=0.9)
bed = heart.x * 0.9 + bass.x * 0.8 + music.x + wet * 0.7
bed = bed[:, :N] + air_st
bed = np.stack([filt(ch, "highpass", 28) for ch in bed])
fade = int(0.4 * SR)
bed[:, -fade:] *= np.linspace(1, 0, fade) ** 2
bed *= 10 ** (-3 / 20) / (np.abs(bed).max() + 1e-9)
sf.write(HERE / "music.wav", bed.T, SR, subtype="PCM_24")

# ------------------------------------------------------------------ beat grid (measured on the lub stem)
# librosa's tracker lands 424 ms late on a stem that is only soft sub-kicks, so measure the attacks directly:
# in each beat window, the time the lub's smoothed envelope first reaches half its peak.
stem = np.abs(grid_bus.x[:, :N].mean(axis=0))
sm = np.convolve(stem, np.ones(int(0.002 * SR)) / int(0.002 * SR), mode="same")
rises = []
for b in range(NB):
    a0, a1 = int(b * BEAT * SR), int((b + 0.6) * BEAT * SR)
    w = sm[a0:a1]
    rises.append((a0 + int(np.argmax(w > 0.5 * w.max()))) / SR - b * BEAT)
offset = float(np.median(rises))
grid = {"bpm": BPM, "period": BEAT, "offset": round(float(offset), 5),
        "beats": [round(offset + BEAT * i, 5) for i in range(NB + 1)], "fit_residual_ms": round(float(np.std(rises)) * 1000, 2), "fit_inliers": NB}
grid.update({"designed_bpm": BPM, "downbeats": grid["beats"][::4],
             "sections": [{"name": "hook", "beat": 0}, {"name": "theories", "beat": 8}, {"name": "twist", "beat": 45}, {"name": "end", "beat": 53}],
             "source": "why-we-dream/audio/score.py: sleeping-heartbeat stem, attack-flux phase fit at the designed period"})
(FILM / "beats.json").write_text(json.dumps(grid, indent=1))
print(f"beats: {grid['bpm']} bpm, offset {grid['offset'] * 1000:.1f} ms (kick attack ~3-9 ms after the nominal beat)")

# ------------------------------------------------------------------ voice-over on the grid
lines = json.loads((HERE / "vo_lines.json").read_text())
vo = np.zeros(N + SR * 2)
timing, cursor, GAP = [], 0.4, 0.25
half = BEAT / 2
for ln in lines:
    x, sr0 = sf.read(HERE / "vo_raw" / f"{ln['id']}.wav")
    x = signal.resample_poly(x, SR // sr0, 1) if SR % sr0 == 0 else signal.resample(x, int(len(x) * SR / sr0))
    start = math.ceil(cursor / half - 1e-9) * half
    a = int(round(start * SR))
    vo[a:a + len(x)] += x
    end = start + len(x) / SR
    # word times: proportional to letters, with a little extra for commas / stops
    words = ln["text"].split()
    wts = [len(w.strip(".,:;?!")) + (3 if w[-1] in ",:;" else 5 if w[-1] in ".?!" else 0) + 1.5 for w in words]
    tot = sum(wts)
    ws, tt = [], start
    for w, wt in zip(words, wts):
        d = (end - start) * wt / tot
        ws.append({"w": w, "s": round(tt, 3), "e": round(tt + d, 3)})
        tt += d
    timing.append({"id": ln["id"], "text": ln["text"], "start": round(start, 3), "end": round(end, 3), "beat": round(start / BEAT, 2), "words": ws})
    print(f"{ln['id']:4s} beat {start / BEAT:5.1f}  {start:6.2f}-{end:6.2f}s")
    cursor = end + GAP
(FILM / "assets").mkdir(exist_ok=True)
(FILM / "assets" / "vo_timing.json").write_text(json.dumps(timing, indent=1))
print(f"last line ends {timing[-1]['end']:.2f}s of {DUR}s (end card holds {DUR - timing[-1]['end']:.1f}s)")

# gentle voice chain: low cut, presence, light compression, a touch of room
v = vo[:N]
v = filt(v, "highpass", 90)
v = peq(v, 3200, 2.5, 0.9)
v = peq(v, 260, -1.5, 0.8)
env = env_follow(v, 0.005, 0.12)
gain = np.minimum(1.0, (0.12 / (env + 1e-6)) ** 0.5)
v = v * gain
ir = reverb_ir(1.1, 0.25)
w = signal.fftconvolve(v, ir[0])[:N]
v = v + 0.10 * w
v = v / (np.abs(v).max() + 1e-9) * 0.7
sf.write(HERE / "vo.wav", np.stack([v, v]).T, SR, subtype="PCM_24")
print("wrote music.wav, vo.wav, beats.json, assets/vo_timing.json")
