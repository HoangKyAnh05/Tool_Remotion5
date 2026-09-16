import os
import urllib.request
import time

PIPER_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'piper')
os.makedirs(PIPER_DIR, exist_ok=True)

FILES = [
    ('config.json', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/config.json'),
    ('ngochuyen.onnx', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/ngochuyen.onnx'),
    ('ngochuyen.onnx.json', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/config.json'),
    ('manhdung.onnx', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/manhdung.onnx'),
    ('manhdung.onnx.json', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/config.json'),
    ('adam1.onnx', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/adam1.onnx'),
    ('adam1.onnx.json', 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts/config.json'),
]

for filename, url in FILES:
    dest = os.path.join(PIPER_DIR, filename)
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"Already downloaded: {filename} ({os.path.getsize(dest)} bytes)")
        continue
    print(f"Downloading {filename} from {url} ...")
    start = time.time()
    urllib.request.urlretrieve(url, dest)
    print(f"Downloaded {filename} in {time.time() - start:.1f}s ({os.path.getsize(dest)} bytes)")

print("All Piper voices ready in:", PIPER_DIR)
