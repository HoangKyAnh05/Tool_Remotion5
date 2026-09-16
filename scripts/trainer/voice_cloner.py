import os
import sys
import json
import numpy as np
import soundfile as sf
import librosa
import scipy.signal as signal
from scipy.interpolate import interp1d

# Locate ffmpeg from imageio_ffmpeg if available
FFMPEG_EXE = None
try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    pass

def convert_audio_to_clean_wav(input_path, output_path, target_sr=22050):
    """
    Converts any audio format (.mp3, .m4a, .ogg, .wav) to clean 22050Hz Mono 16-bit PCM WAV
    """
    import subprocess
    if FFMPEG_EXE and os.path.exists(FFMPEG_EXE):
        cmd = [
            FFMPEG_EXE, '-y',
            '-i', input_path,
            '-ar', str(target_sr),
            '-ac', '1',
            '-c:a', 'pcm_s16le',
            output_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    else:
        # Fallback via librosa / soundfile
        y, sr = librosa.load(input_path, sr=target_sr, mono=True)
        sf.write(output_path, y, target_sr, subtype='PCM_16')
        return True

def extract_speaker_profile(audio_path, target_sr=22050):
    """
    Extracts acoustic voiceprint features: F0 median, spectral envelope, formant shape, MFCC profile.
    """
    y, sr = librosa.load(audio_path, sr=target_sr, mono=True)
    if len(y) < sr * 0.5:
        raise ValueError("Audio sample is too short to extract vocal profile (minimum 0.5s required)")

    # 1. Pitch (F0) Extraction via Yin / Pyin
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=librosa.note_to_hz('C2'), # ~65 Hz
        fmax=librosa.note_to_hz('C7'), # ~2093 Hz
        sr=sr
    )
    voiced_f0 = f0[voiced_flag] if voiced_flag is not None and np.any(voiced_flag) else np.array([])
    median_f0 = float(np.median(voiced_f0)) if len(voiced_f0) > 0 else 130.0 # default male

    # 2. Spectral Centroid & Spectral Envelope (Formant Distribution)
    stft = np.abs(librosa.stft(y, n_fft=1024, hop_length=256))
    mean_spec = np.mean(stft, axis=1) # Shape: (513,)
    spec_smoothed = signal.medfilt(mean_spec, kernel_size=15)
    spec_norm = spec_smoothed / (np.max(spec_smoothed) + 1e-8)
    
    # 3. Spectral Tilt & Brightness
    spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    spectral_bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)))
    
    # 4. Gender / Tonal Class Estimation
    gender = "Male" if median_f0 < 165.0 else "Female"
    
    # 5. Build Compact Acoustic Profile
    profile = {
        "median_f0": round(median_f0, 2),
        "spectral_centroid": round(spectral_centroid, 2),
        "spectral_bandwidth": round(spectral_bandwidth, 2),
        "gender": gender,
        "sample_rate": target_sr,
        "spec_envelope": [round(float(v), 5) for v in spec_norm[:256]] # First 256 frequency bins (0 ~ 5.5kHz)
    }
    return profile

def morph_audio_to_profile(audio_data, sr, profile, intensity=0.92):
    """
    Transforms synthesized speech audio to match the target speaker's acoustic profile (pitch shift + formant filter).
    """
    if profile is None or not isinstance(profile, dict):
        return audio_data

    target_f0 = float(profile.get("median_f0", 130.0))
    target_env = np.array(profile.get("spec_envelope", []), dtype=np.float32)
    
    if len(audio_data) == 0:
        return audio_data

    # Ensure float32 normalized audio
    y = audio_data.astype(np.float32)
    if np.max(np.abs(y)) > 1.0:
        y = y / 32768.0

    # 1. Pitch Shift adjustment to align with target fundamental frequency
    # Estimate base audio pitch
    try:
        f0_base, v_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr
        )
        base_voiced = f0_base[v_flag] if v_flag is not None and np.any(v_flag) else np.array([])
        base_f0 = float(np.median(base_voiced)) if len(base_voiced) > 0 else 170.0
        
        # Calculate semitones shift
        if base_f0 > 40 and target_f0 > 40:
            semitones = 12.0 * np.log2(target_f0 / base_f0) * intensity
            # Bound shift to avoid extreme chipmunk artifacts
            semitones = max(-8.0, min(8.0, semitones))
            if abs(semitones) > 0.4:
                y = librosa.effects.pitch_shift(y, sr=sr, n_steps=semitones)
    except Exception as pitch_err:
        pass

    # 2. Formant Shaping via Spectral Filtering
    if len(target_env) > 30:
        n_fft = 1024
        hop_length = 256
        D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
        mag, phase = np.abs(D), np.angle(D)
        
        # Interpolate target envelope to match n_fft bins (513 bins)
        src_bins = np.linspace(0, 1, len(target_env))
        dst_bins = np.linspace(0, 1, mag.shape[0])
        f_interp = interp1d(src_bins, target_env, kind='linear', fill_value='extrapolate')
        filter_curve = f_interp(dst_bins)
        filter_curve = np.clip(filter_curve, 0.1, 1.0)
        
        # Apply gentle spectral shaping
        filter_2d = filter_curve[:, np.newaxis]
        shaped_mag = mag * (1.0 - intensity + intensity * (filter_2d / (np.mean(filter_2d) + 1e-6)))
        
        # Reconstruct waveform
        D_shaped = shaped_mag * np.exp(1j * phase)
        y_out = librosa.istft(D_shaped, hop_length=hop_length, length=len(y))
        
        # Normalize and restore level
        peak = np.max(np.abs(y_out))
        if peak > 0:
            y_out = y_out * (np.max(np.abs(y)) / peak)
            
        return (y_out * 32767.0).astype(np.int16)
    else:
        return (y * 32767.0).astype(np.int16)
