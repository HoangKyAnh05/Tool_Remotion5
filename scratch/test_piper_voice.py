import os
import sys
import io
import time
import soundfile as sf
from piper import PiperVoice

sys.stdout.reconfigure(encoding='utf-8')

MODELS_DIR = 'models/piper'
huyen_model = os.path.join(MODELS_DIR, 'ngochuyen.onnx')
huyen_config = os.path.join(MODELS_DIR, 'ngochuyen.onnx.json')

print("Loading Piper voice for Ngoc Huyen...")
voice_huyen = PiperVoice.load(huyen_model, config_path=huyen_config)
print("Loaded Ngoc Huyen successfully!")

text_huyen = "Xin chào các bạn, tôi là Ngọc Huyền. Rất vui được gặp bạn trong dự án video hôm nay!"
print(f"Synthesizing: '{text_huyen}'")
start = time.time()
buf = io.BytesIO()
voice_huyen.synthesize(text_huyen, buf)
elapsed = time.time() - start
wav_bytes = buf.getvalue()

out_path = 'scratch/test_piper_ngochuyen.wav'
with open(out_path, 'wb') as f:
    f.write(wav_bytes)

print(f"Ngoc Huyen synthesized in {elapsed:.2f}s! Saved to {out_path} ({len(wav_bytes)} bytes)")

# Test Manh Dung
dung_model = os.path.join(MODELS_DIR, 'manhdung.onnx')
dung_config = os.path.join(MODELS_DIR, 'manhdung.onnx.json')

if os.path.exists(dung_model) and os.path.exists(dung_config):
    print("\nLoading Piper voice for Manh Dung...")
    voice_dung = PiperVoice.load(dung_model, config_path=dung_config)
    print("Loaded Manh Dung successfully!")
    text_dung = "Xin chào quý khán giả, tôi là Mạnh Dũng. Chúc bạn một ngày làm việc tràn đầy năng lượng!"
    print(f"Synthesizing: '{text_dung}'")
    start = time.time()
    buf_d = io.BytesIO()
    voice_dung.synthesize(text_dung, buf_d)
    elapsed_d = time.time() - start
    wav_bytes_d = buf_d.getvalue()
    out_path_d = 'scratch/test_piper_manhdung.wav'
    with open(out_path_d, 'wb') as f:
        f.write(wav_bytes_d)
    print(f"Manh Dung synthesized in {elapsed_d:.2f}s! Saved to {out_path_d} ({len(wav_bytes_d)} bytes)")
