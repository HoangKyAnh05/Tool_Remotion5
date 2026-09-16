import os
import urllib.request
import time

PIPER_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'piper')
os.makedirs(PIPER_DIR, exist_ok=True)

VOICES = [
    'ngochuyen',
    'manhdung',
    'adam1',
    'banmai',
    'tranthanh3870',
    'vietthao3886',
    'ngocngan3701',
    'maiphuong',
    'chieuthanh'
]

BASE_URL = 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts'

# Download config.json once
config_dest = os.path.join(PIPER_DIR, 'config.json')
if not os.path.exists(config_dest) or os.path.getsize(config_dest) < 1000:
    print("Downloading global config.json ...")
    urllib.request.urlretrieve(f"{BASE_URL}/config.json", config_dest)

for voice in VOICES:
    onnx_file = f"{voice}.onnx"
    json_file = f"{voice}.onnx.json"
    
    dest_onnx = os.path.join(PIPER_DIR, onnx_file)
    dest_json = os.path.join(PIPER_DIR, json_file)
    
    # Copy or download json
    if not os.path.exists(dest_json) or os.path.getsize(dest_json) < 1000:
        with open(config_dest, 'rb') as src, open(dest_json, 'wb') as dst:
            dst.write(src.read())
            
    if os.path.exists(dest_onnx) and os.path.getsize(dest_onnx) > 10000:
        print(f"Already downloaded: {onnx_file} ({os.path.getsize(dest_onnx)} bytes)")
        continue
        
    print(f"Downloading {onnx_file} ...")
    start = time.time()
    urllib.request.urlretrieve(f"{BASE_URL}/{onnx_file}", dest_onnx)
    print(f"Downloaded {onnx_file} in {time.time() - start:.1f}s ({os.path.getsize(dest_onnx)} bytes)")

print("\nAll Piper authentic voice models are ready!")
