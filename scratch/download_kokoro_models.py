import os
import sys
import urllib.request
import time

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'kokoro')
VOICEPACKS_DIR = os.path.join(MODEL_DIR, 'voicepacks')

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(VOICEPACKS_DIR, exist_ok=True)

FILES = [
    ('config.json', 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/config.json'),
    ('voicepacks/ngoc_huyen.pt', 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/voicepacks/ngoc_huyen.pt'),
    ('voicepacks/manh_dung.pt', 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/voicepacks/manh_dung.pt'),
    ('kokoro_vi.onnx', 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/kokoro_vi.onnx')
]

def download_file(rel_path, url):
    dest_path = os.path.join(MODEL_DIR, rel_path)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"Already exists: {rel_path} ({os.path.getsize(dest_path)} bytes)")
        return dest_path
    
    print(f"Downloading {rel_path} from {url} ...")
    start = time.time()
    
    def reporthook(block_num, block_size, total_size):
        if total_size > 0 and block_num % 500 == 0:
            pct = int(block_num * block_size * 100 / total_size)
            print(f"  {rel_path}: {pct}% ({block_num * block_size // 1024 // 1024}MB / {total_size // 1024 // 1024}MB)")

    urllib.request.urlretrieve(url, dest_path, reporthook=reporthook)
    elapsed = time.time() - start
    print(f"Done downloading {rel_path} in {elapsed:.1f}s ({os.path.getsize(dest_path)} bytes)")
    return dest_path

if __name__ == '__main__':
    for rel_path, url in FILES:
        download_file(rel_path, url)
    print("All required model files are ready in:", MODEL_DIR)
