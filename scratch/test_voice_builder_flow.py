import os
import sys
import base64
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)

from scripts.trainer.auto_voice_builder import build_voice_from_payload
from scripts.piper_tts_engine import synthesize_piper_audio

def main():
    test_wav = os.path.join(ROOT, 'scratch', 'test_voice.wav')
    with open(test_wav, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')

    print("Building custom voice 'test_custom'...")
    res = build_voice_from_payload({
        'name': 'Độ Mixi Test',
        'voiceId': 'domixi_test',
        'fileType': 'audio',
        'fileName': 'test_voice.wav',
        'fileBase64': b64
    })
    print("Build result:", json.dumps(res, ensure_ascii=False, indent=2))

    print("\nSynthesizing speech using 'piper:domixi_test'...")
    wav_bytes, dur, words = synthesize_piper_audio("Hôm nay chúng ta cùng test giọng nói tự động clone.", "piper:domixi_test")
    print(f"Success! Generated {len(wav_bytes)} bytes WAV (Duration: {dur:.2f}s, Words: {len(words)})")

if __name__ == '__main__':
    main()
