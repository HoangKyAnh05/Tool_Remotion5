import { WordTimestamp } from '../types/video';

export const STORAGE_KEY_VCLIP_KEY = 'VCLIP_API_KEY';
export const STORAGE_KEY_VCLIP_VOICE_ID = 'VCLIP_VOICE_ID';

// Default / fallback voice ID for Adam on VClip
export const DEFAULT_VCLIP_ADAM_VOICE_ID = 'adam';

export function getSavedVClipApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_VCLIP_KEY) || '';
}

export function saveVClipApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VCLIP_KEY, key.trim());
}

export function getSavedVClipVoiceId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_VCLIP_VOICE_ID) || '';
}

export function saveVClipVoiceId(voiceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VCLIP_VOICE_ID, voiceId.trim());
}

export interface VClipVoiceConfig {
  id: string;
  name: string;
  voiceId: string;
  gender: 'Female' | 'Male';
  description: string;
}

export const VCLIP_VOICES: VClipVoiceConfig[] = [
  {
    id: 'vclip:adam',
    name: '🎙️ Adam (VClip AI - Nam Trầm Ấm, Quyền Lực, Hot TikTok)',
    voiceId: 'adam',
    gender: 'Male',
    description: 'Giọng Adam trầm ấm, uy lực, rất mượt và chân thực cho video TikTok, tài chính, review công nghệ.'
  }
];

export interface VClipSynthesizeResult {
  audioUrl: string;
  duration: number;
  words: WordTimestamp[];
}

/**
 * Gọi API VClip (https://api-tts.vclip.io/json-rpc) để tạo giọng đọc AI Adam / Custom Voice
 */
export async function synthesizeVClipTTS(
  text: string,
  voiceIdentifier: string = 'vclip:adam',
  apiKey?: string,
  speed: number = 1.0
): Promise<VClipSynthesizeResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { audioUrl: '', duration: 2.0, words: [] };
  }

  const effectiveKey = (apiKey || getSavedVClipApiKey()).trim();
  if (!effectiveKey) {
    throw new Error('Chưa có VClip API Key. Vui lòng nhập API Key trong phần Cấu hình để sử dụng giọng VClip Adam!');
  }

  // Tách lấy voiceId từ prefix 'vclip:'
  let voiceId = voiceIdentifier.replace(/^vclip:/i, '').trim();
  if (!voiceId || voiceId === 'adam') {
    // Nếu có custom voice id đã lưu trong settings thì ưu tiên dùng
    voiceId = getSavedVClipVoiceId().trim() || 'adam';
  }

  const payload = {
    method: 'ttsLongText',
    input: {
      text: cleanText,
      userVoiceId: voiceId,
      speed: Number(speed || 1.0)
    }
  };

  let audioUrl = '';
  let duration = 0;
  let serverWords: WordTimestamp[] | undefined;

  // 1. Thử gọi qua endpoint proxy /api/vclip/tts nếu chạy Vite dev hoặc Node server để tránh lỗi CORS
  try {
    const proxyRes = await fetch('/api/vclip/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: effectiveKey,
        payload
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.audioUrl) {
        audioUrl = data.audioUrl;
        duration = data.duration || 0;
        serverWords = data.words;
      }
    }
  } catch (proxyErr) {
    console.warn('VClip proxy call failed, trying direct API:', proxyErr);
  }

  // 2. Nếu chưa lấy được từ proxy, gọi trực tiếp API VClip
  if (!audioUrl) {
    const res = await fetch('https://api-tts.vclip.io/json-rpc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`VClip API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`VClip API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    const result = data.result || data.data || data;
    if (typeof result === 'string' && (result.startsWith('http') || result.startsWith('data:audio'))) {
      audioUrl = result;
    } else if (result && typeof result === 'object') {
      audioUrl = result.audioUrl || result.audio_url || result.url || result.file_url || result.data?.url || '';
      duration = Number(result.duration || result.audioDuration || 0);
      if (Array.isArray(result.words)) {
        serverWords = result.words;
      }
    }
  }

  if (!audioUrl) {
    throw new Error('Không nhận được link audio từ máy chủ VClip TTS.');
  }

  // Tạo timestamp từng từ (word-level sync) cho phụ đề karaoke chuẩn từng giây
  const rawWords = cleanText.split(/\s+/).filter(Boolean);
  let words: WordTimestamp[] = [];

  if (serverWords && serverWords.length > 0) {
    words = serverWords;
    if (duration <= 0) {
      duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
    }
  } else {
    // Ước lượng căn chỉnh nhịp chữ khớp với tốc độ đọc speed
    const baseSecondsPerWord = 0.33 / Math.max(0.5, speed);
    let curTime = 0.15;
    for (const w of rawWords) {
      const start = Number(curTime.toFixed(2));
      const end = Number((curTime + baseSecondsPerWord).toFixed(2));
      words.push({ word: w, start, end });
      curTime += baseSecondsPerWord;
    }
    if (duration <= 0) {
      duration = Number((curTime + 0.3).toFixed(2));
    }
  }

  return {
    audioUrl,
    duration: Math.max(2.0, duration),
    words
  };
}
