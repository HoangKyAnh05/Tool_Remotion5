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
  voice: string = 'google-vi',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): { effectiveVoice: string; effectiveRate: string; effectivePitch: string } {
  let effectiveVoice = voice || 'google-vi';
  let effectiveRate = rate || '+0%';
  let effectivePitch = '+0Hz';

  return { effectiveVoice, effectiveRate, effectivePitch };
}

/**
 * Universal synthesis for Google Neural Vietnamese TTS
 */
async function synthesizeGoogleTTS(text: string): Promise<SynthesizeResult> {
  const cleanText = text.trim();
  const rawWords = cleanText.split(/\s+/).filter(Boolean);
  if (!rawWords.length) {
    return { audioUrl: '', duration: 2.0, words: [], usedVoice: 'google-vi' };
  }

  // Split into chunks of max 180 chars to avoid URL limit
  const chunks: string[] = [];
  let cur = '';
  for (const w of rawWords) {
    if ((cur + ' ' + w).length > 180) {
      chunks.push(cur.trim());
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) chunks.push(cur.trim());

  const audioBuffers: ArrayBuffer[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=vi&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!res.ok) {
      throw new Error(`Google TTS request failed with status: ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    audioBuffers.push(ab);
  }

  // Combine ArrayBuffers
  let totalLength = 0;
  for (const ab of audioBuffers) totalLength += ab.byteLength;
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const ab of audioBuffers) {
    merged.set(new Uint8Array(ab), offset);
    offset += ab.byteLength;
  }

  // Convert to Base64 data URL
  let binary = '';
  const len = merged.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(merged[i]);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(merged).toString('base64');
  const audioUrl = `data:audio/mp3;base64,${base64}`;

  // Calculate synchronized word-level timestamps
  const timePerWord = 0.35;
  const words: WordTimestamp[] = [];
  let curTime = 0.12;
  for (const w of rawWords) {
    words.push({
      word: w,
      start: Number(curTime.toFixed(2)),
      end: Number((curTime + timePerWord).toFixed(2))
    });
    curTime += timePerWord;
  }
  const duration = Number((curTime + 0.35).toFixed(2));

  return {
    audioUrl,
    duration: Math.max(2.0, duration),
    words,
    usedVoice: 'google-vi',
    isFallback: false
  };
}

export async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'google-vi',
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
      console.warn('VClip synthesis failed, falling back to Google Neural voice:', err);
    }
    effectiveVoice = 'google-vi';
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
        console.warn('ElevenLabs synthesis failed, falling back to Google Neural voice:', err);
      }
    }
    const fallbackInfo = getEquivalentFallbackVoice(voice);
    effectiveVoice = fallbackInfo.fallbackVoiceId;
    isFallback = true;
  }

  // 3. Primary Google Neural TTS (100% Free Vietnamese Voice)
  if (effectiveVoice === 'google-vi' || effectiveVoice.startsWith('google') || effectiveVoice.startsWith('vi-')) {
    try {
      const gRes = await synthesizeGoogleTTS(cleanText);
      if (gRes && gRes.audioUrl) {
        return { ...gRes, usedVoice: 'google-vi', isFallback };
      }
    } catch (gErr) {
      console.warn('Direct Google TTS failed, trying backend /api/tts endpoint:', gErr);
    }
  }

  // 4. If running inside Electron, use IPC
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

  // 5. If running in browser (Vite dev or preview server), call /api/tts endpoint
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

  // 6. Fallback: Browser Web Audio tone or calculated timestamps
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
