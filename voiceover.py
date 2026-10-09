"""Generates the English voice-over lines with Kokoro (ONNX) and writes one wav per line.
usage: python -I voiceover.py <model_dir> <out_dir> [voice]
Each line has a start time and a deadline; speech speed is raised (up to 1.12x) if a line would overrun."""
import sys, json, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR, OUT_DIR = sys.argv[1], sys.argv[2]
VOICE = sys.argv[3] if len(sys.argv) > 3 else 'am_michael'
os.makedirs(OUT_DIR, exist_ok=True)

# (id, start, deadline, text)
LINES = [
    (1, 0.85, 4.5, "The Vikings. Northern warriors who terrified Europe."),
    (2, 4.75, 8.4, "It began on a quiet morning, in seven ninety-three."),
    (3, 8.55, 12.0, "On Lindisfarne, the monks were reading in peace."),
    (4, 12.1, 14.9, "Suddenly, a ship appeared out of the mist."),
    (5, 15.5, 18.5, "They crossed the North Sea, and nobody was ready."),
    (6, 19.3, 22.0, "The monastery stood defenseless."),
    (7, 22.5, 26.8, "It was looted, and set on fire."),
    (8, 27.1, 31.9, "The news shocked all of Europe. The Viking Age had begun."),
    (9, 32.7, 36.5, "But why did they target monasteries?"),
    (10, 36.9, 41.0, "Because they held gold and silver, and had no soldiers."),
    (11, 41.7, 45.5, "And then there's the myth of the horned helmet."),
    (12, 45.55, 48.3, "No horned helmet has ever been found."),
    (13, 48.55, 52.4, "It was made famous by an opera, in eighteen seventy-six."),
    (14, 52.7, 58.6, "The Vikings sailed to England, France, Russia, and all the way to America."),
    (15, 59.3, 63.6, "Next time: Ragnar Lothbrok. Legend, or reality?"),
]

if os.environ.get('SHORT') == '1':        # the Short ends earlier, so the outro line is shorter
    LINES[-1] = (15, 57.5, 59.6, "Next: Ragnar Lothbrok.")

# voices: copy only the voice we need into a fresh npz (no pickle) so nothing else is loaded
src = np.load(os.path.join(MODEL_DIR, 'voices-v1.0.bin'), allow_pickle=False)
small = os.path.join(OUT_DIR, 'voice.npz')
np.savez(small, **{VOICE: src[VOICE]})
kokoro = Kokoro(os.path.join(MODEL_DIR, 'kokoro-v1.0.onnx'), small)

report = []
for lid, start, deadline, text in LINES:
    speed = 1.0
    while True:
        audio, sr = kokoro.create(text, voice=VOICE, speed=speed, lang='en-us')
        dur = len(audio) / sr
        if start + dur <= deadline or speed >= 1.12:
            break
        speed = round(speed + 0.04, 2)
    sf.write(os.path.join(OUT_DIR, f'line{lid:02d}.wav'), audio, sr)
    ok = start + dur <= deadline
    report.append(dict(id=lid, start=start, dur=round(dur, 2), end=round(start + dur, 2), deadline=deadline, speed=speed, ok=ok, text=text))
    print(f"{lid:2d} {start:6.2f} -> {start + dur:6.2f} (deadline {deadline:5.2f}) speed {speed:.2f} {'OK' if ok else 'OVERRUN'}  {text}")
json.dump(report, open(os.path.join(OUT_DIR, 'report.json'), 'w'), indent=1)
