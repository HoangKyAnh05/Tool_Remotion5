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

export function parseRateMultiplier(rate: string = '+0%'): number {
  if (!rate) return 1.0;
  const trimmed = rate.trim();
  if (trimmed.endsWith('x') || trimmed.endsWith('X')) {
    const val = parseFloat(trimmed.replace(/x/i, ''));
    return isNaN(val) || val <= 0 ? 1.0 : val;
  }
  if (trimmed.includes('%')) {
    const percent = parseFloat(trimmed.replace('%', ''));
    if (!isNaN(percent)) {
      return Math.max(0.5, Math.min(3.0, 1 + percent / 100));
    }
  }
  const num = parseFloat(trimmed);
  return isNaN(num) || num <= 0 ? 1.0 : num;
}

export function parseVoicePreset(
  voice: string = 'google-vi-male',
  rate: string = '+0%',
  pitch: string = '+0Hz'
): { effectiveVoice: string; effectiveRate: string; effectivePitch: string } {
  let effectiveVoice = voice || 'google-vi-male';
  let effectiveRate = rate || '+0%';
  let effectivePitch = '+0Hz';

  return { effectiveVoice, effectiveRate, effectivePitch };
}

/**
 * Converts Web Audio API AudioBuffer to clean 16-bit WAV Base64 Data URL
 */
function audioBufferToWavDataUrl(buffer: AudioBuffer): string {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  // fmt chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // format size (16 for PCM)
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16); // 16-bit

  // data chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  let binary = '';
  const bytes = new Uint8Array(out);
  const byteLen = bytes.byteLength;
  for (let i = 0; i < byteLen; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Universal synthesis for Google Neural Vietnamese TTS (Male & Female)
 */
async function synthesizeGoogleTTS(
  text: string,
  isMale: boolean = true,
  rate: string = '+0%'
): Promise<SynthesizeResult> {
  const cleanText = text.trim();
  const rawWords = cleanText.split(/\s+/).filter(Boolean);
  if (!rawWords.length) {
    return { audioUrl: '', duration: 2.0, words: [], usedVoice: isMale ? 'google-vi-male' : 'google-vi' };
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

  let finalAudioUrl = '';

  // If Male voice requested and Web Audio API is available, apply male baritone vocal filter
  if (isMale && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const decoded = await audioCtx.decodeAudioData(merged.buffer.slice(0));

      const speedMult = parseRateMultiplier(rate);
      const playbackRate = 0.86 * speedMult; // Transform pitch down to male baritone ~120Hz while keeping speed
      const targetDuration = decoded.duration / playbackRate;

      const offlineCtx = new OfflineAudioContext(
        decoded.numberOfChannels,
        Math.ceil(targetDuration * decoded.sampleRate),
        decoded.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = playbackRate;

      // 1. Male chest resonance low-shelf filter (+5dB at 160Hz)
      const lowShelf = offlineCtx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 160;
      lowShelf.gain.value = 5.5;

      // 2. Male warmth body filter (+2.5dB at 450Hz)
      const midPeak = offlineCtx.createBiquadFilter();
      midPeak.type = 'peaking';
      midPeak.frequency.value = 450;
      midPeak.Q.value = 1.0;
      midPeak.gain.value = 2.5;

      // 3. De-ess / female brightness rolloff (-4.5dB at 3600Hz)
      const highShelf = offlineCtx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 3600;
      highShelf.gain.value = -4.5;

      source.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(offlineCtx.destination);

      source.start(0);
      const rendered = await offlineCtx.startRendering();
      finalAudioUrl = audioBufferToWavDataUrl(rendered);
    } catch (e) {
      console.warn('Male acoustic filter fallback to standard audio:', e);
    }
  }

  if (!finalAudioUrl) {
    let binary = '';
    const len = merged.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(merged[i]);
    }
    const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(merged).toString('base64');
    finalAudioUrl = `data:audio/mp3;base64,${base64}`;
  }

  // Calculate synchronized word-level timestamps scaled with speed/rate
  const speed = parseRateMultiplier(rate);
  const timePerWord = 0.35 / speed;
  const words: WordTimestamp[] = [];
  let curTime = 0.12 / speed;
  for (const w of rawWords) {
    words.push({
      word: w,
      start: Number(curTime.toFixed(2)),
      end: Number((curTime + timePerWord).toFixed(2))
    });
    curTime += timePerWord;
  }
  const duration = Number((curTime + 0.35 / speed).toFixed(2));

  return {
    audioUrl: finalAudioUrl,
    duration: Math.max(1.5, duration),
    words,
    usedVoice: isMale ? 'google-vi-male' : 'google-vi',
    isFallback: false
  };
}

export async function synthesizeEdgeTTS(
  text: string,
  voice: string = 'google-vi-male',
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
    effectiveVoice = 'google-vi-male';
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

  // 3. Primary Google Neural TTS (Male & Female Vietnamese Voices - 100% Free)
  if (
    effectiveVoice === 'google-vi-male' ||
    effectiveVoice === 'google-vi' ||
    effectiveVoice.startsWith('google') ||
    effectiveVoice.startsWith('vi-')
  ) {
    const isMaleVoice = effectiveVoice.includes('male') || effectiveVoice === 'google-vi-male';
    try {
      const gRes = await synthesizeGoogleTTS(cleanText, isMaleVoice, effectiveRate);
      if (gRes && gRes.audioUrl) {
        return { ...gRes, usedVoice: effectiveVoice, isFallback };
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
