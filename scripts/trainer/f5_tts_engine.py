import os
import sys
import json
import base64
import wave
import time
import re
from gradio_client import Client, handle_file

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATASET_DIR = os.path.join(ROOT_DIR, 'dataset')
PIPER_DIR = os.path.join(ROOT_DIR, 'models', 'piper')

_f5_client = None

def get_f5_client():
    global _f5_client
    if _f5_client is None:
        try:
            _f5_client = Client("mrfakename/E2-F5-TTS")
        except Exception as e:
            print(f"[F5-TTS] Warning connecting to F5-TTS Space: {e}", file=sys.stderr)
    return _f5_client

def synthesize_f5_voice_clone(text, voice_name):
    clean_id = voice_name.lower().strip().replace('piper:', '').replace('f5:', '').replace('user_', '').replace(' ', '_').strip()
    
    # 1. Look for reference audio in dataset/<clean_id>/source_audio.wav
    candidates = [
        os.path.join(DATASET_DIR, clean_id, 'source_audio.wav'),
        os.path.join(DATASET_DIR, clean_id.replace('_', ''), 'source_audio.wav'),
        os.path.join(DATASET_DIR, clean_id.split('_')[0], 'source_audio.wav'),
    ]
    
    ref_audio_path = None
    for cand in candidates:
        if os.path.exists(cand) and os.path.getsize(cand) > 1000:
            ref_audio_path = cand
            break
            
    if not ref_audio_path and os.path.exists(DATASET_DIR):
        for folder in os.listdir(DATASET_DIR):
            cand = os.path.join(DATASET_DIR, folder, 'source_audio.wav')
            if os.path.exists(cand):
                ref_audio_path = cand
                break

    if not ref_audio_path:
        raise ValueError(f"Không tìm thấy file mẫu âm thanh cho giọng '{voice_name}' trong dataset/")

    client = get_f5_client()
    if not client:
        raise RuntimeError("Không thể kết nối tới máy chủ F5-TTS Zero-Shot")

    # Call F5-TTS
    result_path = client.predict(
        ref_audio=handle_file(ref_audio_path),
        ref_text="",
        gen_text=text.strip(),
        remove_silence=True,
        api_name="/predict"
    )

    if not result_path or not os.path.exists(result_path):
        raise RuntimeError("F5-TTS không trả về file âm thanh hợp lệ")

    with open(result_path, 'rb') as f:
        wav_bytes = f.read()

    # Calculate duration and word timestamps
    raw_words = text.strip().split()
    duration = 4.0
    try:
        with wave.open(result_path, 'rb') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            duration = frames / float(rate)
    except Exception:
        duration = max(2.5, len(raw_words) * 0.35 + 0.5)

    words = []
    total_chars = sum(len(w) for w in raw_words)
    cur_time = 0.15
    for w in raw_words:
        w_dur = (duration - 0.3) * (len(w) / max(total_chars, 1))
        words.append({
            'word': w,
            'start': round(cur_time, 2),
            'end': round(cur_time + w_dur, 2)
        })
        cur_time += w_dur

    b64_str = base64.b64encode(wav_bytes).decode('ascii')
    return {
        'audioUrl': f"data:audio/wav;base64,{b64_str}",
        'duration': round(duration, 2),
        'words': words,
        'voice': voice_name,
        'engine': 'F5-TTS Zero-Shot Voice Clone'
    }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        try:
            raw_input = sys.stdin.read().strip()
            if not raw_input:
                return
            req = json.loads(raw_input)
            text = req.get('text', '').strip()
            voice = req.get('voice', 'custom_voice')
            
            res = synthesize_f5_voice_clone(text, voice)
            sys.stdout.buffer.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            sys.stderr.write(json.dumps({'error': str(e)}, ensure_ascii=False) + '\n')
            sys.exit(1)

if __name__ == '__main__':
    main()
