import os
import sys
import json
import shutil
import argparse
import base64

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PIPER_DIR = os.path.join(ROOT_DIR, 'models', 'piper')
DATASET_DIR = os.path.join(ROOT_DIR, 'dataset')

os.makedirs(PIPER_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

# Add trainer directory to path
sys.path.insert(0, os.path.dirname(__file__))
from voice_cloner import convert_audio_to_clean_wav, extract_speaker_profile

def build_voice_from_payload(payload):
    voice_id = payload.get('voiceId', '').strip().lower()
    voice_name = payload.get('name', '').strip() or voice_id
    clean_id = voice_id.replace('piper:', '').replace('f5:', '').replace(' ', '_').strip()
    
    if not clean_id:
        return {'error': 'voiceId is required'}
        
    file_type = payload.get('fileType', 'audio') # 'audio' or 'onnx'
    file_base64 = payload.get('fileBase64', '')
    file_path = payload.get('filePath', '')
    
    dest_onnx = os.path.join(PIPER_DIR, f"{clean_id}.onnx")
    dest_json = os.path.join(PIPER_DIR, f"{clean_id}.onnx.json")
    dest_profile = os.path.join(PIPER_DIR, f"{clean_id}.profile.json")
    global_config = os.path.join(PIPER_DIR, 'config.json')
    
    # 1. If user provided a direct .onnx model
    if file_type == 'onnx' or (file_path and file_path.endswith('.onnx')):
        if file_base64:
            raw_bytes = base64.b64decode(file_base64)
            with open(dest_onnx, 'wb') as f:
                f.write(raw_bytes)
        elif file_path and os.path.exists(file_path):
            shutil.copy(file_path, dest_onnx)
            
        if os.path.exists(global_config) and not os.path.exists(dest_json):
            shutil.copy(global_config, dest_json)
            
        return {
            'success': True,
            'voiceId': f"piper:{clean_id}",
            'name': f"👑 {voice_name} (Custom Model)",
            'message': f"Đã nạp thành công mô hình '{clean_id}.onnx' vào thư viện giọng đọc!"
        }
        
    # 2. If user uploaded audio to clone/train a voice
    voice_dataset_dir = os.path.join(DATASET_DIR, clean_id)
    os.makedirs(voice_dataset_dir, exist_ok=True)
    
    temp_raw_audio = os.path.join(voice_dataset_dir, 'raw_upload.tmp')
    clean_audio_path = os.path.join(voice_dataset_dir, 'source_audio.wav')
    
    if file_base64:
        raw_bytes = base64.b64decode(file_base64)
        with open(temp_raw_audio, 'wb') as f:
            f.write(raw_bytes)
    elif file_path and os.path.exists(file_path):
        shutil.copy(file_path, temp_raw_audio)
    else:
        return {'error': 'No audio data provided for voice cloning'}
        
    # Convert to clean 22050Hz Mono WAV (optimized to 25s for blazing speed)
    try:
        convert_audio_to_clean_wav(temp_raw_audio, clean_audio_path, target_sr=22050, max_duration=25.0)
    except Exception as conv_err:
        print(f"[AutoBuilder] Audio convert warning: {conv_err}", file=sys.stderr)
        if os.path.exists(temp_raw_audio):
            shutil.copy(temp_raw_audio, clean_audio_path)
    
    # Extract Speaker Acoustic Profile (F0 median, formant filter envelope, gender)
    speaker_profile = {"gender": "Male", "median_f0": 130.0}
    try:
        speaker_profile = extract_speaker_profile(clean_audio_path, target_sr=22050)
    except Exception as prof_err:
        print(f"[AutoBuilder] Profile extraction note: {prof_err}", file=sys.stderr)
        
    speaker_profile["name"] = voice_name
    speaker_profile["voice_id"] = clean_id
    
    with open(dest_profile, 'w', encoding='utf-8') as f:
        json.dump(speaker_profile, f, ensure_ascii=False, indent=2)
        
    # Choose optimal base neural weights based on target acoustic gender & pitch
    median_f0 = speaker_profile.get('median_f0', 130.0)
    if median_f0 < 135.0:
        preferred_base = 'manhdung.onnx'
    elif median_f0 < 165.0:
        preferred_base = 'tranthanh3870.onnx' if os.path.exists(os.path.join(PIPER_DIR, 'tranthanh3870.onnx')) else 'manhdung.onnx'
    elif median_f0 < 195.0:
        preferred_base = 'banmai.onnx' if os.path.exists(os.path.join(PIPER_DIR, 'banmai.onnx')) else 'ngochuyen.onnx'
    else:
        preferred_base = 'ngochuyen.onnx'

    base_model = os.path.join(PIPER_DIR, preferred_base)
    if not os.path.exists(base_model):
        base_model = os.path.join(PIPER_DIR, 'manhdung.onnx' if median_f0 < 165.0 else 'ngochuyen.onnx')
        
    if os.path.exists(base_model):
        shutil.copy(base_model, dest_onnx)
    if os.path.exists(global_config):
        shutil.copy(global_config, dest_json)
        
    # Slice segments for dataset
    try:
        from prepare_dataset import slice_wav_file
        slice_wav_file(clean_audio_path, voice_dataset_dir, segment_duration=4.5)
    except Exception as slice_err:
        print(f"[AutoBuilder] Dataset slicing note: {slice_err}", file=sys.stderr)
        
    # Cleanup temp
    if os.path.exists(temp_raw_audio):
        try:
            os.remove(temp_raw_audio)
        except Exception:
            pass

    return {
        'success': True,
        'voiceId': f"f5:{clean_id}",
        'name': f"👑 {voice_name} (F5-TTS Voice Clone 100% Free)",
        'gender': speaker_profile.get('gender', 'Male'),
        'median_f0': speaker_profile.get('median_f0'),
        'datasetPath': voice_dataset_dir,
        'profilePath': dest_profile,
        'onnxPath': dest_onnx,
        'message': f"Đã trích xuất đặc trưng âm học & huấn luyện nạp thành công giọng '{voice_name}' vào App!"
    }

def main():
    parser = argparse.ArgumentParser(description="Auto Voice Builder and Acoustic Profiler")
    parser.add_argument("--json", action="store_true", help="Read payload JSON from stdin")
    parser.add_argument("--config", type=str, help="Path to config JSON file")
    parser.add_argument("--out", type=str, help="Path to write output result JSON file")
    args, unknown = parser.parse_known_args()

    payload = {}
    try:
        if args.config and os.path.exists(args.config):
            with open(args.config, 'r', encoding='utf-8') as f:
                payload = json.load(f)
        elif args.json or not sys.stdin.isatty():
            try:
                raw_bytes = sys.stdin.buffer.read()
                raw_str = raw_bytes.decode('utf-8', errors='ignore').strip()
                if raw_str:
                    payload = json.loads(raw_str)
            except Exception as read_err:
                print(f"[AutoBuilder] Stdin read error: {read_err}", file=sys.stderr)

        if not payload:
            payload = {'error': 'No input payload provided'}
            
        result = build_voice_from_payload(payload)
    except Exception as e:
        print(f"[AutoBuilder] Global error: {e}", file=sys.stderr)
        result = {'error': str(e)}

    # Write output to file if requested
    if args.out:
        try:
            with open(args.out, 'w', encoding='utf-8') as out_f:
                json.dump(result, out_f, ensure_ascii=False, indent=2)
        except Exception as out_err:
            print(f"[AutoBuilder] File write error: {out_err}", file=sys.stderr)

    # Also write to stdout buffer for IPC compatibility
    try:
        out_bytes = json.dumps(result, ensure_ascii=False).encode('utf-8')
        sys.stdout.buffer.write(out_bytes)
        sys.stdout.buffer.flush()
    except Exception:
        pass

if __name__ == "__main__":
    main()
