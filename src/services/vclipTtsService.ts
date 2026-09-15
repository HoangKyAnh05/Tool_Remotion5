import { WordTimestamp } from '../types/video';

export const STORAGE_KEY_VCLIP_API_KEY = 'VCLIP_API_KEY';
export const STORAGE_KEY_VCLIP_VOICE_ID = 'VCLIP_VOICE_ID';

export const DEFAULT_VCLIP_API_KEY = '';
export const DEFAULT_VCLIP_VOICE_ID = '8VXsCLxU7Pn55ADXQc6sAb'; // Adam ID on VClip

export function getSavedVClipApiKey(): string {
  if (typeof window === 'undefined') return DEFAULT_VCLIP_API_KEY;
  return localStorage.getItem(STORAGE_KEY_VCLIP_API_KEY) || DEFAULT_VCLIP_API_KEY;
}

export function saveVClipApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VCLIP_API_KEY, key.trim());
}

export function getSavedVClipVoiceId(): string {
  if (typeof window === 'undefined') return DEFAULT_VCLIP_VOICE_ID;
  return localStorage.getItem(STORAGE_KEY_VCLIP_VOICE_ID) || DEFAULT_VCLIP_VOICE_ID;
}

export function saveVClipVoiceId(voiceId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VCLIP_VOICE_ID, voiceId.trim());
}

export interface VClipTtsResult {
  audioUrl: string;
  duration: number;
  words: WordTimestamp[];
}

/**
 * Parses an SRT subtitle string into WordTimestamp array for Remotion karaoke subtitles
 */
function parseSrtToWords(srtText: string, fullText: string): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  const rawWords = fullText.trim().split(/\s+/).filter(Boolean);
  
  try {
    const blocks = srtText.trim().split(/\n\s*\n/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 2) {
        const timeLine = lines[1] || lines[0];
        const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
        if (match) {
          const startSec =
            parseInt(match[1]) * 3600 +
            parseInt(match[2]) * 60 +
            parseInt(match[3]) +
            parseInt(match[4]) / 1000;
          const endSec =
            parseInt(match[5]) * 3600 +
            parseInt(match[6]) * 60 +
            parseInt(match[7]) +
            parseInt(match[8]) / 1000;
          
          const textLine = lines.slice(2).join(' ').trim();
          const blockWords = textLine.split(/\s+/).filter(Boolean);
          if (blockWords.length > 0) {
            const timeSpan = Math.max(0.1, endSec - startSec);
            const perWord = timeSpan / blockWords.length;
            blockWords.forEach((bw, idx) => {
              const wStart = startSec + idx * perWord;
              words.push({
                word: bw,
                start: Number(wStart.toFixed(2)),
                end: Number((wStart + perWord).toFixed(2))
              });
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn('SRT parse warning:', e);
  }

  if (words.length === 0 && rawWords.length > 0) {
    const timePerWord = 0.35;
    let curTime = 0.15;
    for (const w of rawWords) {
      words.push({
        word: w,
        start: Number(curTime.toFixed(2)),
        end: Number((curTime + timePerWord).toFixed(2))
      });
      curTime += timePerWord;
    }
  }

  return words;
}

/**
 * Call VClip JSON-RPC TTS endpoint: https://api-tts.vclip.io/json-rpc
 * Method: ttsLongText -> polls final mp3 file -> returns final mp3Url + subtitle sync
 */
export async function synthesizeVClipTTS(
  text: string,
  userVoiceId?: string,
  apiKey?: string,
  speed: number = 1.0
): Promise<VClipTtsResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { audioUrl: '', duration: 2.0, words: [] };
  }

  const effectiveKey = (apiKey || getSavedVClipApiKey() || DEFAULT_VCLIP_API_KEY).trim();
  let effectiveVoiceId = (
    userVoiceId?.replace(/^vclip:/i, '') ||
    getSavedVClipVoiceId() ||
    DEFAULT_VCLIP_VOICE_ID
  ).trim();

  // If user passes 'adam', map directly to Adam's real voice ID on VClip
  if (effectiveVoiceId.toLowerCase() === 'adam' || !effectiveVoiceId) {
    effectiveVoiceId = DEFAULT_VCLIP_VOICE_ID;
  }

  // 1. Gửi lệnh tạo âm thanh ttsLongText tới VClip
  const response = await fetch('https://api-tts.vclip.io/json-rpc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'ttsLongText',
      input: {
        text: cleanText,
        userVoiceId: effectiveVoiceId,
        speed: speed || 1.0
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`VClip API HTTP error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`VClip API error: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const projectExportId = json.result?.projectExportId;
  if (!projectExportId) {
    throw new Error('VClip API did not return projectExportId');
  }

  // 2. Chờ file MP3 được render xong trên CDN (thường mất 1.5 - 3.5 giây)
  const mp3Url = `https://public.ttsapi.app/files/projects/${projectExportId}/${projectExportId}_final.mp3`;
  const srtUrl = `https://public.ttsapi.app/files/projects/${projectExportId}/${projectExportId}_final.srt`;

  let isAudioReady = false;
  const maxAttempts = 25; // Tối đa 25 lần polling (15 giây)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 650));

    try {
      const checkRes = await fetch(mp3Url, { method: 'HEAD' });
      if (checkRes.status === 200) {
        isAudioReady = true;
        break;
      }
    } catch (headErr) {
      // Tiếp tục chờ
    }
  }

  if (!isAudioReady) {
    throw new Error('VClip audio rendering timed out');
  }

  // 3. Tải phụ đề SRT để căn chỉnh nhịp chữ khớp với âm thanh
  let words: WordTimestamp[] = [];
  try {
    const srtRes = await fetch(srtUrl);
    if (srtRes.ok) {
      const srtText = await srtRes.text();
      words = parseSrtToWords(srtText, cleanText);
    }
  } catch (srtErr) {
    console.warn('Could not fetch VClip SRT:', srtErr);
  }

  if (words.length === 0) {
    words = parseSrtToWords('', cleanText);
  }

  // Tính thời lượng chuẩn xác
  let duration = 3.5;
  if (words.length > 0) {
    duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
  } else {
    duration = Math.max(2.5, Number((cleanText.length * 0.08).toFixed(2)));
  }

  return {
    audioUrl: mp3Url,
    duration: Math.max(2.0, duration),
    words
  };
}
