"""Synthesises the soundtrack (music bed + sound effects) for the Viking video.
No samples are used: everything is generated with numpy. Output: audio.wav (stereo, 44.1 kHz).
Timings are in seconds and match the scene timeline in scenes.js."""
import numpy as np, wave, sys, os

SR = 44100
SHORT = os.environ.get('SHORT') == '1'
DUR = 59.8 if SHORT else 64.5
END = 57.6 if SHORT else 59.0          # start of the end card
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)

D2, A2 = 73.42, 110.0
NOTE = dict(D2=73.42, F2=87.31, G2=98.0, A2=110.0, Bb2=116.54, C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196.0, A3=220.0,
            Bb3=233.08, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.0, A4=440.0, Bb4=466.16, C5=523.25, D5=587.33,
            E5=659.25, F5=698.46, G5=783.99, A5=880.0)


def tv(d):
    return np.arange(int(d * SR)) / SR


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    s = sig[:N - i]
    a = (pan + 1) * np.pi / 4
    L[i:i + len(s)] += s * gain * np.cos(a)
    R[i:i + len(s)] += s * gain * np.sin(a)


def lp(x, fc, order=4):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(F / (1 + (f / fc) ** order), len(x))


def hp(x, fc, order=4):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = (f / fc) ** order
    return np.fft.irfft(F * g / (1 + g), len(x))


def bp(x, f0, q=2.0):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(F / (1 + ((f - f0) / (f0 / q)) ** 4), len(x))


def noise(d):
    return rng.standard_normal(int(d * SR))


# ------------------------------------------------------------------ instruments
def pluck(f, d=1.6, bright=1.0):
    t = tv(d); s = np.zeros_like(t)
    for k in range(1, 10):
        s += (1 / k ** 1.15) * np.sin(2 * np.pi * f * k * t * (1 + 0.0003 * k * k)) * np.exp(-t * (2.0 + 1.5 * k / bright))
    return s * np.minimum(1, t / 0.003) * 0.55


def flute(f, d, vib=5.0, amp=0.5):
    t = tv(d)
    ph = 2 * np.pi * f * t + 0.012 * f / 100 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.4)
    s = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    br = bp(noise(d), f * 2, 3) * 0.05
    env = np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.18)
    return (s + br) * env * amp


def brass(f, d, amp=0.5, bright=0.6):
    t = tv(d); s = np.zeros_like(t)
    ph = 2 * np.pi * f * t + 0.004 * np.sin(2 * np.pi * 5.2 * t)
    for k in range(1, 12):
        s += np.sin(k * ph) / k ** (1.0 + (1 - bright))
    env = np.minimum(1, t / 0.12) * np.minimum(1, (d - t) / 0.25)
    return lp(s, 1800) * env * amp


def strings(f, d, amp=0.3, trem=0.0):
    t = tv(d); s = np.zeros_like(t)
    for det in (-0.004, 0.0, 0.004):
        ph = 2 * np.pi * f * (1 + det) * t + 0.4 * np.sin(2 * np.pi * 0.3 * t + det * 90)
        for k in range(1, 8):
            s += np.sin(k * ph) / k ** 1.3
    env = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.6)
    if trem:
        env = env * (0.65 + 0.35 * np.sin(2 * np.pi * trem * t))
    return lp(s, 2600) * env * amp / 3


def taiko(vol=1.0, f0=118, f1=46, d=1.1):
    t = tv(d)
    ph = 2 * np.pi * (f1 * t + (f0 - f1) * (1 - np.exp(-t * 20)) / 20)
    s = np.sin(ph) * np.exp(-t * 4.5) + 0.35 * np.sin(ph * 1.5) * np.exp(-t * 9)
    s += lp(noise(d), 700) * np.exp(-t * 60) * 0.6
    return s * vol


def vocal(f, d, amp=0.45, vowel='a', vib=5.6, vdepth=0.012):
    F = {'a': [(800, 90), (1200, 110), (2600, 160)], 'o': [(450, 80), (800, 90), (2500, 150)], 'e': [(500, 70), (1800, 110), (2600, 150)]}[vowel]
    t = tv(d)
    fr = f * (1 + vdepth * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.5))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.zeros_like(t)
    for k in range(1, 40):
        fk = f * k
        w = sum(np.exp(-0.5 * ((fk - c) / bw) ** 2) * g for (c, bw), g in zip(F, (1.0, 0.7, 0.35)))
        if w > 0.01:
            s += w * np.sin(k * ph)
    env = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.12)
    return s * env * amp / 4


def roar(d=1.2, f=95, amp=0.5, gruff=0.5):
    t = tv(d)
    fr = f * (1 + 0.15 * np.sin(2 * np.pi * 6 * t) * 0.1) * (1 - 0.15 * t / d)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.zeros_like(t)
    for k in range(1, 30):
        fk = f * k
        w = np.exp(-0.5 * ((fk - 750) / 140) ** 2) + 0.7 * np.exp(-0.5 * ((fk - 1250) / 200) ** 2) + 0.3 * np.exp(-0.5 * ((fk - 2400) / 300) ** 2)
        s += w * np.sin(k * ph + rng.random() * gruff * 6)
    s = s / 6 + gruff * 0.25 * bp(noise(d), 1100, 1.2)
    env = np.minimum(1, t / 0.05) * np.exp(-t * 1.0) * np.minimum(1, (d - t) / 0.2)
    return s * env * amp


def scream(d=1.0, f=640, amp=0.35):
    t = tv(d)
    fr = f * (1 + 0.08 * np.sin(2 * np.pi * 7 * t)) * (1 + 0.25 * t / d)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.zeros_like(t)
    for k in range(1, 14):
        fk = f * k
        w = np.exp(-0.5 * ((fk - 900) / 250) ** 2) + 0.6 * np.exp(-0.5 * ((fk - 2200) / 400) ** 2)
        s += w * np.sin(k * ph)
    env = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.15)
    return (s / 5 + 0.1 * bp(noise(d), 2000, 1.5)) * env * amp


def whoosh(d=0.6, f0=300, f1=4000, amp=0.4):
    x = noise(d)
    t = tv(d); k = t / d
    out = np.zeros_like(x)
    # sweeping band: crossfade of 3 bands
    for fc in np.geomspace(f0, f1, 5):
        c = (fc - f0) / (f1 - f0)
        centre = np.clip(np.log(fc / f0) / np.log(f1 / f0), 0, 1)
        w = np.exp(-0.5 * ((k - centre) / 0.2) ** 2)
        out += bp(x, fc, 1.5) * w
    return out * np.sin(np.pi * k) ** 1.5 * amp


def thud(vol=1.0, d=0.5, f=60):
    t = tv(d)
    return (np.sin(2 * np.pi * (f + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 9) + lp(noise(d), 500) * np.exp(-t * 40) * 0.8) * vol


def clang(f=520, d=1.4, amp=0.3):
    t = tv(d); s = np.zeros_like(t)
    for r, a, dec in [(1, 1, 3.0), (2.32, 0.8, 4.2), (3.9, 0.6, 5.5), (5.43, 0.4, 7.0), (7.1, 0.3, 9.0)]:
        s += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dec)
    s += hp(noise(d), 3000) * np.exp(-t * 40) * 0.5
    return s * amp


def clink(f=2400, amp=0.25):
    t = tv(0.5)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 14) + 0.6 * np.sin(2 * np.pi * f * 1.51 * t) * np.exp(-t * 20) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 30)
    return s * amp


def pop(f0=900, f1=180, d=0.14, amp=0.4):
    t = tv(d)
    return np.sin(2 * np.pi * (f1 + (f0 - f1) * np.exp(-t * 40)) * t) * np.exp(-t * 22) * amp


def boing(d=0.5, f=260, amp=0.3):
    t = tv(d)
    fr = f * (1 + 0.5 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 4)) * (1 + 0.6 * np.exp(-t * 5))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * np.exp(-t * 6) * amp


def chime(f, d=1.8, amp=0.22):
    t = tv(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 2) + 0.25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 4)) * np.exp(-t * 2.2) * np.minimum(1, t / 0.004) * amp


def drone(f, d, amp=0.3):
    t = tv(d); s = np.zeros_like(t)
    for det, a in ((-0.003, 0.7), (0.0, 1.0), (0.004, 0.7)):
        ph = 2 * np.pi * f * (1 + det) * t
        for k in range(1, 7):
            s += a * np.sin(k * ph + det * 40) / k ** 1.4
    s *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t)
    env = np.minimum(1, t / 2.0) * np.minimum(1, (d - t) / 2.0)
    return lp(s, 900) * env * amp / 3


def waves(d, amp=0.25, seed_ph=0.0):
    x = lp(noise(d), 900, 2) + 0.4 * lp(noise(d), 250, 2) * 3
    t = tv(d)
    sw = 0.35 + 0.65 * np.sin(2 * np.pi * 0.11 * t + seed_ph) ** 2
    return x * sw * amp * 0.5


def crackle(d, amp=0.5, density=45):
    s = np.zeros(int(d * SR))
    n = int(d * density)
    for _ in range(n):
        i = rng.integers(0, len(s) - 800)
        ln = int(rng.uniform(0.002, 0.02) * SR)
        burst = rng.standard_normal(ln) * np.exp(-np.arange(ln) / (ln / 4)) * rng.uniform(0.3, 1.0)
        s[i:i + ln] += burst
    s = hp(s, 1500, 2)
    roar_ = lp(noise(d), 380, 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * tv(d)))
    return (s * 1.2 + roar_ * 1.4) * amp


def riser(d, f0=200, f1=6000, amp=0.3):
    x = noise(d); t = tv(d); k = t / d
    out = np.zeros_like(x)
    for fc in np.geomspace(f0, f1, 7):
        centre = np.log(fc / f0) / np.log(f1 / f0)
        out += bp(x, fc, 2.0) * np.exp(-0.5 * ((k - centre) / 0.25) ** 2)
    return out * k ** 2 * amp


def bass_pluck(f, d=0.5, amp=0.5):
    t = tv(d)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 10) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 14)
    return s * np.exp(-t * 7) * np.minimum(1, t / 0.003) * amp


def woodblock(amp=0.25):
    t = tv(0.12)
    return (np.sin(2 * np.pi * 900 * t) + 0.5 * np.sin(2 * np.pi * 1450 * t)) * np.exp(-t * 55) * amp


# ------------------------------------------------------------------ arrangement
def at(sec_bpm, beat):
    return 60.0 / sec_bpm * beat


# --- Section 1: sea (0 - 8), D dorian, 72 bpm ----------------------------------
add(drone(D2, 9.5, 0.9), 0.0, 1.0)
add(drone(A2, 9.0, 0.5), 0.0, 0.8, 0.2)
add(brass(D2 * 2, 3.5, 0.5, 0.3), 0.35, 0.55)            # title stamp hit
add(taiko(0.9), 0.4)
add(waves(22, 0.55), 0.0, 1.0)
b = at(72, 1)
motif = [('D4', 1), ('F4', 1), ('A4', 1), ('G4', 1), ('F4', 1), ('E4', 1), ('D4', 2)]
t0 = 1.0
for rep in range(2):
    for nme, ln in motif:
        add(pluck(NOTE[nme], 2.0), t0, 0.5, -0.2 if rep % 2 == 0 else 0.2)
        t0 += ln * b
for i in range(8):                                        # soft pulse
    add(taiko(0.35, 90, 44), 1.6 + i * b * 2)
for t_ in (3.5, 5.0, 6.5):
    add(brass(NOTE['A2'], 1.6, 0.25, 0.3), t_, 0.35)
add(whoosh(0.9, 200, 2500, 0.3), 4.8)                     # title slides away
add(pop(), 5.65, 0.6)                                     # location card

# --- Section 2: the monk (8 - 15), calm then shock ------------------------------
add(whoosh(0.5, 300, 3000, 0.35), 7.75)
b = at(60, 1)
mel = [('A4', 2), ('G4', 1), ('F4', 1), ('E4', 2), ('D4', 2), ('F4', 1), ('G4', 1), ('A4', 2)]
t0 = 8.4
for nme, ln in mel:
    if t0 + ln * b > 11.0:
        break
    add(flute(NOTE[nme], ln * b * 0.95, 5, 0.35), t0, 0.7, -0.15)
    t0 += ln * b
add(drone(D2, 3.2, 0.5), 8.0, 0.5)
add(pluck(NOTE['D3'], 2.2), 8.4, 0.35, 0.3)
add(pluck(NOTE['A3'], 2.2), 9.4, 0.3, 0.3)
add(pluck(NOTE['F3'], 2.2), 10.4, 0.3, 0.3)
# shock at 11.05
add(taiko(1.2, 130, 40), 11.05)
add(thud(1.0), 11.05)
add(scream(0.6, 1050, 0.3), 11.05, 0.5)                   # string screech
t_ = tv(0.7)
add(np.sin(2 * np.pi * np.cumsum(500 + 1500 * (t_ / 0.7) ** 2) / SR) * np.exp(-t_ * 3) * 0.25, 11.05, 0.6)
add(whoosh(0.35, 800, 6000, 0.4), 10.9)
for i, f in enumerate((NOTE['A4'], NOTE['Bb4'])):
    add(strings(f, 4.0, 0.5, trem=11), 11.2, 0.55, -0.4 + i * 0.8)
add(drone(D2, 6.5, 0.9), 11.2, 0.8)
for i in range(8):                                        # heartbeat, rising
    add(taiko(0.35 + i * 0.07, 100, 42, 0.7), 11.7 + i * 0.75)
add(pop(1200, 400, 0.2, 0.5), 11.95)                      # book thud
add(scream(1.0, 700, 0.3), 13.2, 0.55)                    # monk screams
add(whoosh(0.5, 300, 5000, 0.4), 14.8)

# --- Section 3: landing (15 - 22), 100 bpm ---------------------------------------
add(whoosh(0.4, 400, 3500, 0.4), 14.85)
b = at(100, 1)
for i in range(int(7 / b)):
    t_ = 15.0 + i * b
    add(taiko(0.4 + 0.5 * i / (7 / b), 105, 44), t_)
    if i % 2 == 1:
        add(taiko(0.25, 150, 70, 0.4), t_ + b / 2)
bassline = ['D3', 'D3', 'F3', 'D3', 'A2', 'D3', 'G2', 'A2']
for i in range(int(7 / (b / 2))):
    add(bass_pluck(NOTE[bassline[i % 8]], 0.4, 0.5), 15.0 + i * b / 2, 0.7)
add(drone(D2, 7.5, 0.8), 15.0, 0.9)
add(waves(2.5, 0.55), 15.0, 0.9)
add(brass(NOTE['D3'], 1.6, 0.4), 15.1, 0.4)
# ship hits the sand 17.4
add(thud(1.4, 0.7, 50), 17.4)
add(noise(0.4) * np.exp(-tv(0.4) * 18) * 0.4, 17.4, 0.4)
add(boing(0.4, 180, 0.2), 17.45, 0.35)
# jumpers land
add(thud(0.8, 0.4, 70), 17.8)
add(thud(0.8, 0.4, 70), 18.2)
add(roar(1.4, 95, 0.55, 0.6), 18.55, 0.8)                  # AAARGH
add(brass(NOTE['D3'], 1.8, 0.45, 0.7), 18.6, 0.6, -0.2)    # war horn
add(brass(NOTE['A3'], 1.8, 0.35, 0.7), 18.6, 0.5, 0.2)
add(scream(0.7, 760, 0.28), 19.9, 0.4)
add(scream(0.7, 860, 0.28), 20.7, 0.4)
add(riser(1.6, 200, 7000, 0.4), 20.4)

# --- Section 4: raid (22 - 32), 140 bpm ------------------------------------------
add(whoosh(0.4, 300, 5000, 0.5), 21.85)
add(thud(1.5, 0.8, 45), 22.0)
b = at(140, 1)
pattern = [1.0, 0.0, 0.6, 0.0, 1.0, 0.0, 0.5, 0.7]       # eighth-note taiko pattern
for i in range(int(10 / (b / 2))):
    v = pattern[i % 8]
    if v > 0:
        add(taiko(0.55 * v + 0.2, 112, 44, 0.6), 22.0 + i * b / 2)
bl = ['D3', 'D3', 'D3', 'F3', 'D3', 'D3', 'G3', 'A3']
for i in range(int(10 / (b / 2))):
    add(bass_pluck(NOTE[bl[i % 8]], 0.3, 0.5), 22.0 + i * b / 2, 0.55)
mel = [('D4', 1), ('F4', 1), ('A4', 2), ('G4', 1), ('F4', 1), ('E4', 1), ('D4', 1), ('D5', 2), ('C5', 1), ('A4', 1), ('F4', 2)]
t0 = 22.3
for _ in range(2):
    for nme, ln in mel:
        if t0 > 31.2:
            break
        add(brass(NOTE[nme], ln * b * 0.9, 0.3, 0.55), t0, 0.5, 0.0)
        t0 += ln * b
add(drone(D2, 10.5, 0.9), 22.0, 0.9)
add(crackle(10.2, 0.55), 22.0, 0.9)
for tc, fq in ((24.0, 520), (25.3, 610), (26.9, 480), (28.4, 560), (29.7, 650)):
    add(clang(fq, 1.2, 0.35), tc, 0.5, np.random.default_rng(int(tc * 10)).uniform(-0.6, 0.6))
for tp in (22.8, 25.6, 27.2):
    add(pop(1000, 220, 0.14, 0.5), tp)
add(scream(0.9, 780, 0.3), 25.7, 0.45)
add(riser(1.2, 300, 8000, 0.45), 30.8)
add(whoosh(0.4, 300, 4000, 0.4), 31.8)

# --- Section 5: "why?" (32 - 41), 66 bpm -----------------------------------------
b = at(66, 1)
add(thud(1.2, 0.8, 42), 32.0)
add(drone(D2 / 2 * 2, 9.5, 0.8), 32.0, 0.6)
add(crackle(9, 0.25, 25), 32.0, 0.8)
mel = [('D3', 2), ('F3', 2), ('E3', 2), ('A2', 2), ('D3', 2), ('G2', 1), ('A2', 1), ('D3', 2)]
t0 = 32.4
for nme, ln in mel:
    add(pluck(NOTE[nme], 2.2), t0, 0.5, -0.25)
    t0 += ln * b
for tq in (33.3, 34.4, 35.6):                              # thinking blips
    add(pop(500, 300, 0.12, 0.3), tq)
    add(woodblock(0.2), tq + 0.22)
add(flute(NOTE['A4'], 1.2, 5, 0.25), 34.5, 0.4, 0.3)
add(flute(NOTE['G4'], 1.4, 5, 0.25), 35.8, 0.4, 0.3)
# coins
add(pop(900, 300, 0.2, 0.5), 36.5)
add(chime(NOTE['D5'] * 2, 1.4, 0.18), 36.5, 0.6)
add(pop(800, 220, 0.2, 0.45), 37.6)
add(boing(0.5, 150, 0.22), 37.65, 0.6)
rc = np.random.default_rng(3)
for i in range(26):
    tt = 36.4 + i * 0.12 + rc.uniform(0.05, 0.9)
    add(clink(rc.choice([2200, 2640, 3100, 3520]), rc.uniform(0.1, 0.22)), tt, 1.0, rc.uniform(-0.8, 0.8))
add(strings(NOTE['D3'], 4.5, 0.4), 37.5, 0.35)
add(strings(NOTE['A3'], 4.5, 0.4), 37.5, 0.3)
add(riser(1.0, 400, 5000, 0.3), 40.2)

# --- Section 6: myth / fact (41 - 52), 112 bpm ------------------------------------
b = at(112, 1)
add(whoosh(0.4, 300, 4000, 0.4), 40.85)
add(taiko(1.0, 120, 50), 41.5); add(thud(0.9), 41.5)         # MYTE stamp
add(brass(NOTE['D3'], 0.7, 0.5, 0.8), 41.5, 0.5)
walk = ['D3', 'F3', 'A3', 'F3', 'D3', 'G3', 'A3', 'C4']
for i in range(int(6 / (b / 1))):                            # comedic pizzicato walk
    add(bass_pluck(NOTE[walk[i % 8]], 0.3, 0.5), 42.0 + i * b / 2 * 1.0, 0.7)
    if i % 2 == 0:
        add(woodblock(0.18), 42.0 + i * b / 2 + b / 4)
add(whoosh(0.3, 600, 6000, 0.4), 43.9); add(thud(1.0, 0.4, 70), 44.05)  # red X
add(pop(1200, 300, 0.12, 0.6), 44.55)                        # horns pop
add(boing(0.6, 240, 0.28), 44.6, 0.7, -0.5); add(boing(0.6, 300, 0.28), 44.65, 0.7, 0.5)
add(taiko(1.0, 120, 50), 45.2); add(thud(0.9), 45.2)         # FAKTA stamp
add(chime(NOTE['A5'], 1.6, 0.22), 45.25); add(chime(NOTE['D5'], 1.6, 0.22), 45.35)
add(flute(NOTE['D4'], 1.4, 5, 0.25), 45.6, 0.4, 0.3)
add(flute(NOTE['A4'], 1.0, 5, 0.25), 46.9, 0.4, 0.3)
# opera 47.4 - 52
add(whoosh(0.6, 200, 3000, 0.3), 47.0)
add(strings(NOTE['D3'], 5.0, 0.5), 47.4, 0.5, -0.3)
add(strings(NOTE['A3'], 5.0, 0.5), 47.4, 0.4, 0.3)
add(strings(NOTE['F4'], 5.0, 0.4), 47.4, 0.3, 0.0)
for i in range(7):
    add(taiko(0.25 + i * 0.05, 100, 48, 0.5), 47.8 + i * 0.5)
opera = [('D4', 0.55), ('F4', 0.55), ('A4', 0.55), ('D5', 1.4), ('C5', 0.4), ('A4', 0.4), ('F4', 0.4), ('D5', 0.9)]
t0 = 47.5
vows = ['a', 'a', 'o', 'a', 'e', 'a', 'o', 'a']
for (nme, ln), vw in zip(opera, vows):
    add(vocal(NOTE[nme], ln, 0.55, vw), t0, 0.7, 0.0)
    t0 += ln
add(chime(NOTE['D5'], 2.0, 0.16), 51.7)

# --- Section 7: fleet + end card (52 - 62), 90 bpm --------------------------------
b = at(90, 1)
add(whoosh(0.5, 300, 4000, 0.4), 51.8)
add(thud(1.1, 0.8, 45), 52.0)
add(drone(D2, 13.0, 0.9), 52.0, 0.9)
add(waves(12.5, 0.5, 1.3), 52.0, 0.8)
for i in range(int(7 / b)):
    add(taiko(0.35 + 0.35 * i / (7 / b), 100, 44), 52.4 + i * b)
motif = [('D4', 1), ('F4', 1), ('A4', 1), ('G4', 1), ('F4', 1), ('E4', 1), ('D4', 2)]
t0 = 52.6
for rep in range(2):
    for nme, ln in motif:
        add(pluck(NOTE[nme], 2.0), t0, 0.5, 0.15)
        add(brass(NOTE[nme] / 2, ln * b * 0.9, 0.18, 0.4), t0, 0.5, -0.2)
        t0 += ln * b
        if t0 > END + 0.2:
            break
for tp in ((53.8, 54.5, 55.2, 56.6) if SHORT else (53.0, 54.5, 56.0, 57.5)):   # flags
    add(pop(1100, 400, 0.15, 0.5), tp)
    add(whoosh(0.35, 600, 5000, 0.2), tp - 0.1)
    add(chime(NOTE['A5'], 1.0, 0.1), tp + 0.05)
add(brass(D2 * 2, 5.4, 0.5, 0.4), END, 0.7)                  # end card
add(brass(A2 * 2, 5.4, 0.4, 0.4), END, 0.5)
add(taiko(1.0, 120, 48), END)
add(pop(1000, 300, 0.12, 0.5), END + 0.2)
add(riser(0.9, 500, 6000, 0.25), END + 0.5 if SHORT else END + 0.9)
add(chime(NOTE['D5'], 1.5, 0.2), END + (1.0 if SHORT else 1.4)); add(chime(NOTE['A5'], 1.5, 0.2), END + (1.1 if SHORT else 1.5))  # subscribe
add(strings(NOTE['D3'], 5.4, 0.5), END, 0.5); add(strings(NOTE['A3'], 5.4, 0.4), END, 0.4); add(strings(NOTE['F4'], 5.4, 0.4), END, 0.3)

# --- scene-cut whooshes ------------------------------------------------------------
for tc in (8.0, 15.0, 32.0, 41.0, 52.0):
    add(whoosh(0.28, 500, 6000, 0.25), tc - 0.1)

# ------------------------------------------------------------------ master
def reverb(x, wet=0.18, rt=1.9):
    n = int(rt * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (n / 5.5))
    ir = lp(ir, 5000, 2)
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x * (1 - wet) + y * wet / np.sqrt(np.sum(ir ** 2)) * 6


L2 = reverb(L); R2 = reverb(R)
for ch in (L2, R2):
    ch[:] = hp(ch, 28, 2)
mx = max(np.abs(L2).max(), np.abs(R2).max())
L2 = np.tanh(L2 / mx * 1.6) / np.tanh(1.6)
R2 = np.tanh(R2 / mx * 1.6) / np.tanh(1.6)
fade = np.minimum(1, np.arange(N) / (0.6 * SR)) * np.minimum(1, (N - np.arange(N)) / (1.6 * SR))
L2 *= fade; R2 *= fade
peak = max(np.abs(L2).max(), np.abs(R2).max())
g = 0.72 / peak
out = np.stack([L2 * g, R2 * g], axis=1)
pcm = (out * 32767).astype('<i2')
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
rms = np.sqrt(np.mean(out ** 2))
print('wrote audio; peak', round(float(np.abs(out).max()), 3), 'rms dBFS', round(20 * np.log10(rms), 1))
