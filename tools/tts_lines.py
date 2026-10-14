"""Kokoro TTS for a list of lines.  usage: python -I tts_lines.py <model_dir> <lines.json> <out_dir> [voice]
lines.json: [{"id": "l1", "text": "...", "speed": 1.0}, ...]  ->  out_dir/<id>.wav (24 kHz mono) + out_dir/durations.json"""
import sys, json, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

model_dir, lines_path, out_dir = sys.argv[1:4]
voice = sys.argv[4] if len(sys.argv) > 4 else 'af_heart'
os.makedirs(out_dir, exist_ok=True)
src = np.load(os.path.join(model_dir, 'voices-v1.0.bin'), allow_pickle=False)     # plain arrays, no pickle
small = os.path.join(out_dir, 'voice.npz')
np.savez(small, **{voice: src[voice]})
k = Kokoro(os.path.join(model_dir, 'kokoro-v1.0.onnx'), small)
out = {}
for ln in json.load(open(lines_path)):
    audio, sr = k.create(ln['text'], voice=voice, speed=float(ln.get('speed', 1.0)), lang='en-us')
    sf.write(os.path.join(out_dir, ln['id'] + '.wav'), audio, sr)
    out[ln['id']] = round(len(audio) / sr, 3)
    print(f"{ln['id']:4s} {out[ln['id']]:6.2f}s  {ln['text']}")
json.dump(out, open(os.path.join(out_dir, 'durations.json'), 'w'), indent=1)
print('total speech', round(sum(out.values()), 2), 's')
