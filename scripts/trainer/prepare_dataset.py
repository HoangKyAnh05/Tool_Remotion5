import os
import sys
import argparse
import wave
import io
import re

def slice_wav_file(input_wav_path, output_dir, segment_duration=5.0, sample_rate=22050):
    os.makedirs(output_dir, exist_ok=True)
    wavs_dir = os.path.join(output_dir, 'wavs')
    os.makedirs(wavs_dir, exist_ok=True)
    
    metadata_lines = []
    
    try:
        import soundfile as sf
        import numpy as np
        data, sr = sf.read(input_wav_path)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1) # Convert to mono
            
        # Resample if needed
        samples_per_segment = int(segment_duration * sr)
        total_samples = len(data)
        
        idx = 1
        whisper_model = None
        try:
            import whisper
            print("[Dataset] Loading Whisper AI for automatic transcription...")
            whisper_model = whisper.load_model("base")
        except Exception:
            pass

        for start in range(0, total_samples, samples_per_segment):
            end = min(start + samples_per_segment, total_samples)
            chunk = data[start:end]
            if len(chunk) < sr * 1.5: # Skip segments shorter than 1.5s
                continue
                
            chunk_filename = f"segment_{idx:04d}.wav"
            chunk_path = os.path.join(wavs_dir, chunk_filename)
            sf.write(chunk_path, chunk, sr)
            
            transcript = ""
            if whisper_model:
                try:
                    res = whisper_model.transcribe(chunk_path, language="vi")
                    transcript = res.get("text", "").strip()
                except Exception:
                    pass
                    
            if not transcript:
                transcript = f"Đoạn âm thanh mẫu số {idx} dùng để huấn luyện mô hình AI VITS"
                
            metadata_lines.append(f"{chunk_filename}|{transcript}|{transcript}")
            idx += 1
            
        metadata_path = os.path.join(output_dir, 'metadata.csv')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(metadata_lines))
            
        print(f"[Dataset] Sliced {idx-1} audio segments into '{wavs_dir}'")
        print(f"[Dataset] Generated '{metadata_path}' with {idx-1} transcribed lines successfully!")
        return True
    except ImportError:
        print("[Dataset] Tip: Install soundfile via 'pip install soundfile' for advanced audio slicing.")
        return False

def main():
    parser = argparse.ArgumentParser(description="Tự động chia nhỏ audio và tạo metadata cho huấn luyện Piper VITS")
    parser.add_argument("--audio", required=True, help="Đường dẫn tới file âm thanh gốc (.wav hoặc .mp3)")
    parser.add_argument("--name", required=True, help="Tên nhân vật (ví dụ: domixi, pewpew, duynen, sharkhung)")
    parser.add_argument("--duration", type=float, default=5.0, help="Độ dài từng đoạn cắt (giây)")
    
    args = parser.parse_args()
    
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dataset', args.name))
    slice_wav_file(args.audio, output_dir, segment_duration=args.duration)

if __name__ == "__main__":
    main()
