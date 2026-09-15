import os
import sys
import json
import zipfile
import time
import io
import re
import base64
import numpy as np
import onnxruntime as ort
import soundfile as sf
import vig2p

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CONFIG_PATH = os.path.join(ROOT_DIR, 'models', 'kokoro', 'config.json')
ONNX_PATH = os.path.join(ROOT_DIR, 'models', 'kokoro', 'kokoro_vi.onnx')
VOICEPACKS_DIR = os.path.join(ROOT_DIR, 'models', 'kokoro', 'voicepacks')
SAMPLE_RATE = 24000

# Cache for loaded resources
_session = None
_vocab = None
_voicepack_cache = {}

import urllib.request

def ensure_model_file(dest_path, url):
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        return dest_path
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    print(f"[Kokoro] Downloading {os.path.basename(dest_path)} from Hugging Face ...", file=sys.stderr)
    urllib.request.urlretrieve(url, dest_path)
    print(f"[Kokoro] Downloaded {os.path.basename(dest_path)} successfully.", file=sys.stderr)
    return dest_path

def get_session():
    global _session, _vocab
    if _session is None:
        ensure_model_file(CONFIG_PATH, 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/config.json')
        ensure_model_file(ONNX_PATH, 'https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/kokoro_vi.onnx')
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        _vocab = config.get('vocab', {})
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        _session = ort.InferenceSession(ONNX_PATH, sess_options=opts, providers=['CPUExecutionProvider'])
    return _session, _vocab

def get_voicepack(voice_name):
    v = voice_name.lower().replace('kokoro:', '').replace('kokoro-', '').strip()
    if v not in _voicepack_cache:
        pt_path = os.path.join(VOICEPACKS_DIR, f"{v}.pt")
        if not os.path.exists(pt_path) or os.path.getsize(pt_path) < 1000:
            url = f"https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/voicepacks/{v}.pt"
            try:
                ensure_model_file(pt_path, url)
            except Exception:
                pt_path = os.path.join(VOICEPACKS_DIR, "ngoc_huyen.pt")
                ensure_model_file(pt_path, "https://huggingface.co/contextboxai/Kokoro-Vietnamese/resolve/main/voicepacks/ngoc_huyen.pt")
        
        with zipfile.ZipFile(pt_path) as z:
            for name in z.namelist():
                if name.endswith('data/0'):
                    raw = z.read(name)
                    arr = np.frombuffer(raw, dtype=np.float32).reshape(-1, 1, 256)
                    _voicepack_cache[v] = arr
                    break
        if v not in _voicepack_cache:
            raise ValueError(f"Could not parse voicepack tensor from {pt_path}")
    return _voicepack_cache[v]

def split_into_phrases(text, max_len=140):
    text = text.strip()
    if not text:
        return []
    raw_sentences = re.split(r'([.!?;:\n]+)', text)
    sentences = []
    for i in range(0, len(raw_sentences) - 1, 2):
        s = raw_sentences[i].strip() + raw_sentences[i+1].strip()
        if s:
            sentences.append(s)
    if len(raw_sentences) % 2 == 1 and raw_sentences[-1].strip():
        sentences.append(raw_sentences[-1].strip())
        
    if not sentences:
        sentences = [text]
        
    final_phrases = []
    for s in sentences:
        if len(s) <= max_len:
            final_phrases.append(s)
        else:
            comma_parts = re.split(r'([,]+)', s)
            cur = ""
            for cp in comma_parts:
                if len(cur + cp) > max_len and cur.strip():
                    final_phrases.append(cur.strip())
                    cur = cp
                else:
                    cur += cp
            if cur.strip():
                final_phrases.append(cur.strip())
    return [p.strip() for p in final_phrases if p.strip()]

def synthesize_text(text, voice='ngoc_huyen', speed=1.0):
    session, vocab = get_session()
    voicepack = get_voicepack(voice)
    
    phrases = split_into_phrases(text)
    if not phrases:
        return np.zeros(SAMPLE_RATE, dtype=np.float32), 1.0, []
        
    audio_segments = []
    all_words = []
    current_time_offset = 0.1
    
    for phrase in phrases:
        raw_words = phrase.split()
        if not raw_words:
            continue
            
        phonemes = vig2p.phonemize_text(phrase)
        if not phonemes.strip():
            continue
            
        input_ids = [vocab[p] for p in phonemes if p in vocab]
        if len(input_ids) == 0:
            input_ids = [0]
        input_ids = np.asarray([[0, *input_ids, 0]], dtype=np.int64)
        
        phoneme_count = len(phonemes)
        index = min(max(phoneme_count, 1), voicepack.shape[0]) - 1
        ref_s = np.asarray(voicepack[index], dtype=np.float32)
        speed_arr = np.asarray(float(speed), dtype=np.float32)
        
        waveform, durations = session.run(None, {
            'input_ids': input_ids,
            'ref_s': ref_s,
            'speed': speed_arr
        })
        
        if waveform.ndim > 1:
            waveform = waveform.squeeze()
            
        phrase_duration = len(waveform) / SAMPLE_RATE
        
        clean_words = [w.strip() for w in raw_words if w.strip()]
        total_chars = sum(len(w) for w in clean_words)
        
        word_start = current_time_offset
        for w in clean_words:
            w_fraction = len(w) / max(total_chars, 1)
            w_dur = phrase_duration * w_fraction
            all_words.append({
                'word': w,
                'start': round(word_start, 2),
                'end': round(word_start + w_dur, 2)
            })
            word_start += w_dur
            
        audio_segments.append(waveform)
        current_time_offset = word_start + 0.12
        
        silence_pad = np.zeros(int(SAMPLE_RATE * 0.12), dtype=np.float32)
        audio_segments.append(silence_pad)
        
    if not audio_segments:
        return np.zeros(SAMPLE_RATE, dtype=np.float32), 1.0, []
        
    full_audio = np.concatenate(audio_segments)
    total_duration = len(full_audio) / SAMPLE_RATE
    
    return full_audio, total_duration, all_words

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        try:
            req = json.loads(sys.stdin.read())
            text = req.get('text', '').strip()
            voice = req.get('voice', 'ngoc_huyen')
            speed = float(req.get('speed', 1.0))
            
            if not text:
                out_json = json.dumps({'error': 'Empty text', 'audioBase64': '', 'duration': 0, 'words': []})
                sys.stdout.buffer.write(out_json.encode('utf-8'))
                return
                
            audio, duration, words = synthesize_text(text, voice, speed)
            
            buf = io.BytesIO()
            sf.write(buf, audio, SAMPLE_RATE, format='WAV', subtype='PCM_16')
            wav_bytes = buf.getvalue()
            b64_str = base64.b64encode(wav_bytes).decode('ascii')
            
            response = {
                'audioUrl': f"data:audio/wav;base64,{b64_str}",
                'duration': round(duration, 2),
                'words': words,
                'sampleRate': SAMPLE_RATE,
                'voice': voice
            }
            out_json = json.dumps(response)
            sys.stdout.buffer.write(out_json.encode('utf-8'))
            sys.stdout.buffer.flush()
        except Exception as e:
            import traceback
            err_msg = f"{e}\n{traceback.format_exc()}"
            err_json = json.dumps({'error': err_msg, 'audioBase64': '', 'duration': 0, 'words': []})
            sys.stderr.write(err_json + '\n')
            sys.exit(1)
    else:
        test_text = "Xin chào các bạn, tôi là Ngọc Huyền! Giọng đọc chuẩn truyền cảm từ Kokoro AI."
        print(f"Running Kokoro TTS for text: {test_text}")
        audio, dur, words = synthesize_text(test_text, 'ngoc_huyen', 1.0)
        out_path = os.path.join(ROOT_DIR, 'scratch', 'kokoro_engine_test.wav')
        sf.write(out_path, audio, SAMPLE_RATE)
        print(f"Saved test output to {out_path} (Duration: {dur:.2f}s, words: {len(words)})")
        print("Words timing sample:", words[:5])

if __name__ == '__main__':
    main()
