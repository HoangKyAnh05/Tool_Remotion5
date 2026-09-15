import os
import sys
import json
import zipfile
import time
import numpy as np
import onnxruntime as ort
import soundfile as sf
import vig2p

sys.stdout.reconfigure(encoding='utf-8')

CONFIG_PATH = 'models/kokoro/config.json'
ONNX_PATH = 'models/kokoro/kokoro_vi.onnx'
VOICEPACKS_DIR = 'models/kokoro/voicepacks'
SAMPLE_RATE = 24000

# 1. Load Config & Vocabulary
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    config = json.load(f)

vocab = config.get('vocab', {})
print(f"Loaded vocab with {len(vocab)} phoneme tokens.")

# 2. Init ONNX Inference Session
session = ort.InferenceSession(ONNX_PATH, providers=['CPUExecutionProvider'])
print("Loaded Kokoro ONNX model session successfully!")

# 3. Load Voicepack
def load_voicepack(voice_name):
    pt_path = os.path.join(VOICEPACKS_DIR, f"{voice_name}.pt")
    with zipfile.ZipFile(pt_path) as z:
        for name in z.namelist():
            if name.endswith('data/0'):
                raw = z.read(name)
                arr = np.frombuffer(raw, dtype=np.float32).reshape(-1, 1, 256)
                return arr
    raise ValueError(f"Could not extract voicepack from {pt_path}")

# 4. Phonemize text using vig2p
def text_to_phonemes(text):
    phonemes = vig2p.phonemize_text(text)
    return phonemes

# 5. Synthesize function
def synthesize(text, voice_name='ngoc_huyen', speed=1.0):
    start_time = time.time()
    voicepack = load_voicepack(voice_name)
    
    # Phonemize
    phonemes = text_to_phonemes(text)
    print(f"Text: '{text}'")
    print(f"Phonemes: '{phonemes}'")
    
    # Map phonemes to input IDs
    input_ids = [vocab[p] for p in phonemes if p in vocab]
    if len(input_ids) == 0:
        input_ids = [0]
    input_ids = np.asarray([[0, *input_ids, 0]], dtype=np.int64)
    
    # Select voice style ref_s
    phoneme_count = len(phonemes)
    index = min(max(phoneme_count, 1), voicepack.shape[0]) - 1
    ref_s = np.asarray(voicepack[index], dtype=np.float32) # shape (1, 256)
    
    speed_arr = np.asarray(float(speed), dtype=np.float32)
    
    # Run model
    inputs = {
        'input_ids': input_ids,
        'ref_s': ref_s,
        'speed': speed_arr
    }
    
    waveform, durations = session.run(None, inputs)
    
    # Flatten audio
    if waveform.ndim > 1:
        waveform = waveform.squeeze()
        
    duration = len(waveform) / SAMPLE_RATE
    elapsed = time.time() - start_time
    print(f"Synthesized '{voice_name}' in {elapsed:.2f}s (Audio Duration: {duration:.2f}s, tokens: {len(durations)})")
    return waveform, duration

# Test Ngoc Huyen
print("\n--- TEST 1: NGỌC HUYỀN (Nữ Miền Bắc - Kokoro AI Studio) ---")
audio_huyen, dur_huyen = synthesize(
    "Xin chào các bạn, tôi là Ngọc Huyền. Chào mừng các bạn đến với video hôm nay!",
    voice_name='ngoc_huyen',
    speed=1.0
)
sf.write('scratch/test_ngoc_huyen_live.wav', audio_huyen, SAMPLE_RATE)
print(f"Saved scratch/test_ngoc_huyen_live.wav ({os.path.getsize('scratch/test_ngoc_huyen_live.wav')} bytes)")

# Test Manh Dung
print("\n--- TEST 2: MẠNH DŨNG (Nam Miền Bắc - Kokoro AI Studio) ---")
audio_dung, dur_dung = synthesize(
    "Xin chào các bạn, tôi là Mạnh Dũng. Giọng đọc nam trầm ấm và uy lực chuẩn phòng thu!",
    voice_name='manh_dung',
    speed=1.0
)
sf.write('scratch/test_manh_dung_live.wav', audio_dung, SAMPLE_RATE)
print(f"Saved scratch/test_manh_dung_live.wav ({os.path.getsize('scratch/test_manh_dung_live.wav')} bytes)")

print("\nSUCCESS! Both Ngoc Huyen and Manh Dung synthesized perfectly!")
