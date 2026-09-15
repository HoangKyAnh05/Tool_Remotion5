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

/**
 * Chuẩn hóa tham số tốc độ thành chuỗi phần trăm SSML chuẩn (ví dụ: '2.0x' -> '+100%', '1.5x' -> '+50%', '+25%' -> '+25%')
 */
export function normalizeRateToPercent(rate: string = '+0%'): string {
  if (!rate) return '+0%';
  const trimmed = String(rate).trim();
  if (trimmed.includes('%')) {
    const num = parseInt(trimmed.replace('%', ''));
    if (!isNaN(num)) {
      return num >= 0 ? `+${num}%` : `${num}%`;
    }
    return trimmed;
  }
  if (trimmed.toLowerCase().endsWith('x')) {
    const mult = parseFloat(trimmed.replace(/x/i, ''));
    if (!isNaN(mult)) {
      const pct = Math.round((mult - 1) * 100);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    }
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0 && num <= 3) {
    const pct = Math.round((num - 1) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  }
  return '+0%';
}

export function parseVoicePreset(
  voice: string = 'vi-VN-NamMinhNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): { effectiveVoice: string; effectiveRate: string; effectivePitch: string } {
  let effectiveVoice = voice || 'vi-VN-NamMinhNeural';
  let effectiveRate = normalizeRateToPercent(rate);
  let effectivePitch = '+0Hz';

  if (voice.startsWith('piper:') || voice.startsWith('kokoro:') || voice === 'ngoc_huyen' || voice === 'manh_dung') {
    return { effectiveVoice: voice, effectiveRate, effectivePitch };
  }

  if (voice === 'google-vi-male' || voice === 'vi-male' || voice === 'adam' || voice === 'adam-tiktok' || voice === 'vclip:adam') {
    effectiveVoice = 'vi-VN-NamMinhNeural';
  } else if (voice === 'google-vi' || voice === 'vi-female') {
    effectiveVoice = 'vi-VN-HoaiMyNeural';
  } else if (voice.includes(':') && !voice.startsWith('elevenlabs:')) {
    const [baseVoice, modifier] = voice.split(':');
    effectiveVoice = baseVoice || 'vi-VN-NamMinhNeural';
    if (effectiveRate === '+0%') {
      if (modifier === 'fast' || modifier === 'live' || modifier === 'adam') {
        effectiveRate = '+18%';
      } else if (modifier === 'recap') {
        effectiveRate = '+28%';
      } else if (modifier === 'sweet') {
        effectiveRate = '+8%';
      } else if (modifier === 'genz') {
        effectiveRate = '+20%';
      } else if (modifier === 'story') {
        effectiveRate = '-8%';
      } else if (modifier === 'ngochuyen' || modifier === 'manhdung') {
        effectiveRate = '+0%';
      }
    }
    if (modifier === 'manhdung') {
      effectivePitch = '-1Hz';
    }
  }

  return { effectiveVoice, effectiveRate, effectivePitch };
}

export async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'vi-VN-NamMinhNeural',
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

  // 1. If voice is a VClip AI voice (vclip.io)
  if (voice.startsWith('vclip:')) {
    const vclipKey = getSavedVClipApiKey().trim();
    try {
      const res = await synthesizeVClipTTS(cleanText, voice, vclipKey);
      if (res.audioUrl) {
        return { ...res, usedVoice: voice, isFallback: false };
      }
    } catch (err: any) {
      console.warn('VClip synthesis failed, falling back to Studio voice:', err);
    }
    effectiveVoice = 'vi-VN-NamMinhNeural';
    isFallback = true;
  }

  // 2. If voice is an ElevenLabs voice
  if (voice.startsWith('elevenlabs:')) {
    const savedKey = getSavedElevenLabsApiKey().trim();
    if (savedKey) {
      try {
        const res = await synthesizeElevenLabsTTS(cleanText, voice, savedKey);
        return { ...res, usedVoice: voice, isFallback: false };
      } catch (err: any) {
        console.warn('ElevenLabs synthesis failed, falling back to Studio voice:', err);
      }
    }
    const fallbackInfo = getEquivalentFallbackVoice(voice);
    effectiveVoice = fallbackInfo.fallbackVoiceId;
    isFallback = true;
  }

  // 3. If running inside Electron, use IPC
  if (typeof window !== 'undefined' && window.electronAPI?.synthesizeTTS) {
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

  // 4. If running in browser (Vite dev or preview server), call /api/tts endpoint
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
    console.warn('Fetch /api/tts error, fallback to calculated synthesis:', err);
  }

  // 5. Fallback: Browser Web Audio tone or calculated timestamps
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
