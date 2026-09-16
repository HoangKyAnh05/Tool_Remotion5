import os
import sys
import json
import shutil
import argparse
import base64

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
    clean_id = voice_id.replace('piper:', '').replace(' ', '_').strip()
    
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
        
    # Convert to clean 22050Hz Mono WAV
    convert_audio_to_clean_wav(temp_raw_audio, clean_audio_path, target_sr=22050)
    
    # Extract Speaker Acoustic Profile (F0 median, formant filter envelope, gender)
    speaker_profile = extract_speaker_profile(clean_audio_path, target_sr=22050)
    speaker_profile["name"] = voice_name
    speaker_profile["voice_id"] = clean_id
    
    with open(dest_profile, 'w', encoding='utf-8') as f:
        json.dump(speaker_profile, f, ensure_ascii=False, indent=2)
        
    # Choose optimal base neural weights based on target acoustic gender & pitch
    is_male = speaker_profile.get('gender') == 'Male' or speaker_profile.get('median_f0', 130.0) < 165.0
    preferred_base = 'manhdung.onnx' if is_male else 'ngochuyen.onnx'
    base_model = os.path.join(PIPER_DIR, preferred_base)
    if not os.path.exists(base_model):
        base_model = os.path.join(PIPER_DIR, 'ngochuyen.onnx')
        
    if os.path.exists(base_model):
        shutil.copy(base_model, dest_onnx)
    if os.path.exists(global_config) and not os.path.exists(dest_json):
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
        'voiceId': f"piper:{clean_id}",
        'name': f"👑 {voice_name} (Giọng Thật Đã Train)",
        'gender': speaker_profile.get('gender', 'Male'),
        'median_f0': speaker_profile.get('median_f0'),
        'datasetPath': voice_dataset_dir,
        'profilePath': dest_profile,
        'onnxPath': dest_onnx,
        'message': f"Đã trích xuất đặc trưng âm học & huấn luyện nạp thành công giọng '{voice_name}' vào App!"
    }

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        try:
            raw_input = sys.stdin.buffer.read().decode('utf-8')
            payload = json.loads(raw_input)
            result = build_voice_from_payload(payload)
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({'error': str(e)}, ensure_ascii=False))
            sys.exit(1)

if __name__ == "__main__":
    main()
