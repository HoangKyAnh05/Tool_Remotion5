import { WordTimestamp } from '../types/video';
import { synthesizeElevenLabsTTS, getSavedElevenLabsApiKey, getEquivalentFallbackVoice } from './elevenLabsService';
import { synthesizeVClipTTS, getSavedVClipApiKey } from './vclipTtsService';

export interface SynthesizeResult {
  audioUrl: string;
  duration: number; // seconds
  words: WordTimestamp[];
  usedVoice?: string;
  isFallback?: boolean;
}

export function parseVoicePreset(
  voice: string = 'vi-VN-HoaiMyNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): { effectiveVoice: string; effectiveRate: string; effectivePitch: string } {
  let effectiveVoice = voice || 'vi-VN-HoaiMyNeural';
  let effectiveRate = rate || '+0%';
  let effectivePitch = '+0Hz'; // Microsoft Edge-TTS neural voices work 100% reliably with +0Hz

  if (voice === 'adam' || voice === 'adam-tiktok' || voice === 'vclip:adam') {
    return { effectiveVoice: 'vi-VN-NamMinhNeural', effectiveRate: '+18%', effectivePitch: '+0Hz' };
  }

  if (voice.includes(':') && !voice.startsWith('elevenlabs:')) {
    const [baseVoice, modifier] = voice.split(':');
    effectiveVoice = baseVoice;
    switch (modifier) {
      case 'adam':
      case 'fast':
        effectiveRate = '+18%';
        break;
      case 'recap':
        effectiveRate = '+25%';
        break;
      case 'live':
        effectiveRate = '+18%';
        break;
      case 'sweet':
        effectiveRate = '+8%';
        break;
      case 'genz':
        effectiveRate = '+22%';
        break;
      case 'story':
        effectiveRate = '-8%';
        break;
      case 'deep':
        effectiveRate = '-4%';
        break;
      case 'asmr':
        effectiveRate = '-3%';
        break;
      case 'meme':
        effectiveRate = '+12%';
        break;
      default:
        break;
    }
  }

  return { effectiveVoice, effectiveRate, effectivePitch };
}

export async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'vi-VN-HoaiMyNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): Promise<SynthesizeResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { audioUrl: '', duration: 2.0, words: [], usedVoice: voice };
  }

  const preset = parseVoicePreset(voice, rate, pitch);
  let effectiveVoice = preset.effectiveVoice;
  let effectiveRate = preset.effectiveRate;
  let effectivePitch = preset.effectivePitch;
  let isFallback = false;

  // 0. If voice is a VClip AI voice (vclip.io)
  if (voice.startsWith('vclip:')) {
    const vclipKey = getSavedVClipApiKey().trim();
    try {
      const res = await synthesizeVClipTTS(cleanText, voice, vclipKey);
      if (res.audioUrl) {
        return { ...res, usedVoice: voice, isFallback: false };
      }
    } catch (err: any) {
      console.warn('VClip synthesis failed, falling back to equivalent Studio voice:', err);
    }
    // Fallback sang giọng Nam Minh / Adam nếu VClip chưa có voiceId hợp lệ
    effectiveVoice = 'vi-VN-NamMinhNeural';
    isFallback = true;
  }

  // 0.1 If voice is an ElevenLabs voice
  if (voice.startsWith('elevenlabs:')) {
    const savedKey = getSavedElevenLabsApiKey().trim();
    if (savedKey) {
      try {
        const res = await synthesizeElevenLabsTTS(cleanText, voice, savedKey);
        return { ...res, usedVoice: voice, isFallback: false };
      } catch (err: any) {
        console.warn('ElevenLabs synthesis failed, falling back to equivalent Edge-TTS voice:', err);
      }
    }
    // Không có ElevenLabs API key hoặc gọi lỗi -> tự động map sang giọng Edge-TTS tương đương (Nam/Nữ)
    const fallbackInfo = getEquivalentFallbackVoice(voice);
    effectiveVoice = fallbackInfo.fallbackVoiceId;
    isFallback = true;
  }

  // 1. If running inside Electron, use IPC
  if (window.electronAPI?.synthesizeTTS) {
    try {
      const result = await window.electronAPI.synthesizeTTS({
        text: cleanText,
        voice: effectiveVoice,
        rate: effectiveRate,
        pitch: effectivePitch
      });
      if (result && result.audioUrl) {
        return {
          ...result,
          usedVoice: effectiveVoice,
          isFallback
        };
      }
    } catch (err) {
      console.warn('Electron TTS IPC failed, attempting Vite API endpoint:', err);
    }
  }

  // 2. If running in browser (Vite dev or preview server), call /api/tts endpoint
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        voice: effectiveVoice,
        rate: effectiveRate,
        pitch: effectivePitch
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioUrl) {
        return {
          audioUrl: data.audioUrl,
          duration: data.duration || 4.0,
          words: data.words || [],
          usedVoice: effectiveVoice,
          isFallback
        };
      }
    }
  } catch (err) {
    console.warn('Fetch /api/tts error, fallback to browser synthesis:', err);
  }

  // 3. Fallback: Browser Web Audio tone or calculated timestamps
  const fallbackRes = createBrowserFallbackAudio(cleanText);
  return { ...fallbackRes, usedVoice: effectiveVoice, isFallback: true };
}

// Generate simple audio tone data url + calculated word timestamps as foolproof offline fallback
function createBrowserFallbackAudio(text: string): SynthesizeResult {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  const timePerWord = 0.38;
  const words: WordTimestamp[] = [];

  let curTime = 0.2;
  for (const w of rawWords) {
    words.push({
      word: w,
      start: Number(curTime.toFixed(2)),
      end: Number((curTime + timePerWord).toFixed(2))
    });
    curTime += timePerWord;
  }

  const duration = Number((curTime + 0.4).toFixed(2));

  return {
    audioUrl: '',
    duration: Math.max(3.0, duration),
    words
  };
}
