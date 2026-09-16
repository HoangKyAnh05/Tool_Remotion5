import os
import sys
import json
import io
import wave
import time
import base64
import re
import urllib.request
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

# Add trainer to path for voice cloner
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'trainer'))
try:
    from voice_cloner import morph_audio_to_profile
except Exception:
    morph_audio_to_profile = None

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PIPER_DIR = os.path.join(ROOT_DIR, 'models', 'piper')
BASE_HF_URL = 'https://huggingface.co/doof-ferb/nghitts-copy/resolve/main/piper-tts'

HF_ENGLISH_MAP = {
    'en_amy': 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium',
    'en_ryan': 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium',
    'en_lessac': 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium',
    'en_alan': 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium',
    'en_joe': 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium',
}

VOICE_MAP = {
    # --- 100% AUTHENTIC VIETNAMESE VITS NEURAL MODELS ---
    'ngochuyen': 'ngochuyen.onnx',
    'ngoc_huyen': 'ngochuyen.onnx',
    'piper:ngochuyen': 'ngochuyen.onnx',
    'piper:ngoc_huyen': 'ngochuyen.onnx',

    'manhdung': 'manhdung.onnx',
    'manh_dung': 'manhdung.onnx',
    'piper:manhdung': 'manhdung.onnx',
    'piper:manh_dung': 'manhdung.onnx',

    'adam': 'adam1.onnx',
    'adam1': 'adam1.onnx',
    'piper:adam': 'adam1.onnx',

    'banmai': 'banmai.onnx',
    'piper:banmai': 'banmai.onnx',

    'tranthanh': 'tranthanh3870.onnx',
    'tranthanh3870': 'tranthanh3870.onnx',
    'piper:tranthanh': 'tranthanh3870.onnx',

    'vietthao': 'vietthao3886.onnx',
    'vietthao3886': 'vietthao3886.onnx',
    'piper:vietthao': 'vietthao3886.onnx',

    'ngocngan': 'ngocngan3701.onnx',
    'ngocngan3701': 'ngocngan3701.onnx',
    'piper:ngocngan': 'ngocngan3701.onnx',

    'maiphuong': 'maiphuong.onnx',
    'piper:maiphuong': 'maiphuong.onnx',

    'chieuthanh': 'chieuthanh.onnx',
    'piper:chieuthanh': 'chieuthanh.onnx',

    # --- 100% AUTHENTIC ENGLISH VITS NEURAL MODELS ---
    'en_amy': 'en_amy.onnx',
    'piper:en_amy': 'en_amy.onnx',
    'amy': 'en_amy.onnx',

    'en_ryan': 'en_ryan.onnx',
    'piper:en_ryan': 'en_ryan.onnx',
    'ryan': 'en_ryan.onnx',

    'en_lessac': 'en_lessac.onnx',
    'piper:en_lessac': 'en_lessac.onnx',
    'lessac': 'en_lessac.onnx',

    'en_alan': 'en_alan.onnx',
    'piper:en_alan': 'en_alan.onnx',
    'alan': 'en_alan.onnx',

    'en_joe': 'en_joe.onnx',
    'piper:en_joe': 'en_joe.onnx',
    'joe': 'en_joe.onnx',
}

_loaded_voices = {}

def ensure_model(model_filename):
    os.makedirs(PIPER_DIR, exist_ok=True)
    model_path = os.path.join(PIPER_DIR, model_filename)
    json_path = os.path.join(PIPER_DIR, f"{model_filename}.json")
    
    base_stem = model_filename.replace('.onnx', '')
    
    # If English model
    if base_stem in HF_ENGLISH_MAP:
        remote_base = HF_ENGLISH_MAP[base_stem]
        if not os.path.exists(json_path) or os.path.getsize(json_path) < 100:
            urllib.request.urlretrieve(f"{remote_base}.onnx.json", json_path)
        if not os.path.exists(model_path) or os.path.getsize(model_path) < 10000:
            print(f"[Piper] Downloading English model {model_filename} ...", file=sys.stderr)
            urllib.request.urlretrieve(f"{remote_base}.onnx", model_path)
    else:
        # Vietnamese models
        if not os.path.exists(json_path) or os.path.getsize(json_path) < 100:
            global_config = os.path.join(PIPER_DIR, 'config.json')
            if os.path.exists(global_config) and os.path.getsize(global_config) > 500:
                with open(global_config, 'rb') as f_in, open(json_path, 'wb') as f_out:
                    f_out.write(f_in.read())
            else:
                urllib.request.urlretrieve(f"{BASE_HF_URL}/config.json", json_path)
                
        if not os.path.exists(model_path) or os.path.getsize(model_path) < 10000:
            print(f"[Piper] Downloading Vietnamese model {model_filename} ...", file=sys.stderr)
            urllib.request.urlretrieve(f"{BASE_HF_URL}/{model_filename}", model_path)
        
    return model_path, json_path

def get_voice(voice_name):
    norm_name = voice_name.lower().strip()
    clean_name = norm_name.replace('piper:', '').strip()
    
    # Check if a custom-trained or downloaded model file directly exists in models/piper/
    direct_candidates = [
        f"{clean_name}.onnx",
        clean_name if clean_name.endswith('.onnx') else None,
        f"{clean_name}1.onnx",
    ]
    
    found_file = None
    for cand in direct_candidates:
        if cand and os.path.exists(os.path.join(PIPER_DIR, cand)):
            found_file = cand
            break
            
    if not found_file:
        found_file = VOICE_MAP.get(norm_name, VOICE_MAP.get(clean_name, 'ngochuyen.onnx'))
        
    model_filename = found_file
    
    if model_filename not in _loaded_voices:
        model_path, config_path = ensure_model(model_filename)
        _loaded_voices[model_filename] = PiperVoice.load(model_path, config_path=config_path)
        
    return _loaded_voices[model_filename], model_filename

def split_text_to_sentences(text, max_chars=180):
    text = re.sub(r'\s+', ' ', text.strip())
    if not text:
        return []
    raw = re.split(r'([.!?;:\n]+)', text)
    sentences = []
    for i in range(0, len(raw) - 1, 2):
        s = raw[i].strip() + raw[i+1].strip()
        if s:
            sentences.append(s)
    if len(raw) % 2 == 1 and raw[-1].strip():
        sentences.append(raw[-1].strip())
    if not sentences:
        sentences = [text]
    return sentences

def get_voice_profile(voice_name):
    norm = voice_name.lower().strip().replace('piper:', '')
    candidates = [
        f"{norm}.profile.json",
        f"{norm.replace('_', '')}.profile.json",
        f"{norm.replace('-', '_')}.profile.json",
        f"{norm.split(':')[0]}.profile.json"
    ]
    for c in candidates:
        p_path = os.path.join(PIPER_DIR, c)
        if os.path.exists(p_path):
            try:
                with open(p_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
    return None

def synthesize_piper_audio(text, voice_name='ngochuyen', speed=1.0):
    voice, model_file = get_voice(voice_name)
    sentences = split_text_to_sentences(text)
    if not sentences:
        return b'', 1.0, []
        
    speed_float = max(0.5, min(2.0, float(speed)))
    syn_config = SynthesisConfig(length_scale=1.0 / speed_float)
    
    audio_buffers = []
    all_words = []
    time_offset = 0.1
    sample_rate = voice.config.sample_rate or 22050
    channels = 1
    sampwidth = 2
    
    for sentence in sentences:
        raw_words = [w.strip() for w in sentence.split() if w.strip()]
        if not raw_words:
            continue
            
        mem_file = io.BytesIO()
        with wave.open(mem_file, 'wb') as wf:
            voice.synthesize_wav(sentence, wf, syn_config=syn_config)
            
        wav_data = mem_file.getvalue()
        if len(wav_data) < 44:
            continue
            
        # Extract raw PCM data (skip 44 bytes WAV header)
        pcm_data = wav_data[44:]
        num_frames = len(pcm_data) // (channels * sampwidth)
        chunk_duration = num_frames / float(sample_rate)
        
        # Word timestamps proportional to character length
        total_chars = sum(len(w) for w in raw_words)
        cur_word_time = time_offset
        for w in raw_words:
            w_fraction = len(w) / max(total_chars, 1)
            w_dur = chunk_duration * w_fraction
            all_words.append({
                'word': w,
                'start': round(cur_word_time, 2),
                'end': round(cur_word_time + w_dur, 2)
            })
            cur_word_time += w_dur
            
        audio_buffers.append(pcm_data)
        time_offset = cur_word_time + 0.12
        
        # Add 120ms silence pause between sentences
        silence_frames = int(sample_rate * 0.12)
        audio_buffers.append(b'\x00\x00' * silence_frames)
        
    if not audio_buffers:
        return b'', 1.0, []
        
    full_pcm = b''.join(audio_buffers)
    
    # Check if this voice has an acoustic voiceprint / timbre profile (from user upload)
    profile = get_voice_profile(voice_name)
    if profile and morph_audio_to_profile:
        try:
            pcm_array = np.frombuffer(full_pcm, dtype=np.int16)
            morphed_array = morph_audio_to_profile(pcm_array, sample_rate, profile, intensity=0.92)
            full_pcm = morphed_array.tobytes()
        except Exception as morph_err:
            print(f"[Piper] Timbre morphing note: {morph_err}", file=sys.stderr)
            
    total_frames = len(full_pcm) // (channels * sampwidth)
    total_duration = total_frames / float(sample_rate)
    
    # Build complete final WAV buffer
    out_mem = io.BytesIO()
    with wave.open(out_mem, 'wb') as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(full_pcm)
        
    final_wav_bytes = out_mem.getvalue()
    return final_wav_bytes, total_duration, all_words

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        try:
            raw_input = sys.stdin.buffer.read().decode('utf-8')
            req = json.loads(raw_input)
            text = req.get('text', '').strip()
            voice = req.get('voice', 'ngochuyen')
            speed = float(req.get('speed', 1.0))
            
            if not text:
                out_json = json.dumps({'error': 'Empty text', 'audioUrl': '', 'duration': 0, 'words': []})
                sys.stdout.buffer.write(out_json.encode('utf-8'))
                return
                
            wav_bytes, duration, words = synthesize_piper_audio(text, voice, speed)
            b64_str = base64.b64encode(wav_bytes).decode('ascii')
            
            res = {
                'audioUrl': f"data:audio/wav;base64,{b64_str}",
                'duration': round(duration, 2),
                'words': words,
                'voice': voice
            }
            out_json = json.dumps(res)
            sys.stdout.buffer.write(out_json.encode('utf-8'))
            sys.stdout.buffer.flush()
        except Exception as e:
            import traceback
            err = f"{e}\n{traceback.format_exc()}"
            err_json = json.dumps({'error': err, 'audioUrl': '', 'duration': 0, 'words': []})
            sys.stderr.write(err_json + '\n')
            sys.exit(1)
    else:
        test_text = "Xin chào các bạn, tôi là Ngọc Huyền. Đây là giọng đọc thật 100% qua mô hình Piper VITS."
        print(f"Testing Piper TTS: '{test_text}'")
        wav_bytes, dur, words = synthesize_piper_audio(test_text, 'ngochuyen', 1.0)
        out_f = os.path.join(ROOT_DIR, 'scratch', 'test_piper_engine_run.wav')
        with open(out_f, 'wb') as f:
            f.write(wav_bytes)
        print(f"Saved to {out_f} (duration: {dur:.2f}s, words count: {len(words)})")

if __name__ == '__main__':
    main()
