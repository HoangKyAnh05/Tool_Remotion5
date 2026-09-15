import axios from 'axios';
import { WordTimestamp } from '../types/video';

export interface TranscribeResult {
  narration: string;
  language: 'vi' | 'en' | 'auto';
  audioDuration: number;
  words: WordTimestamp[];
}

export interface FullAudioSplitScene {
  narration: string;
  audioDuration: number;
  words: WordTimestamp[];
  searchKeyword?: string;
}

// Convert dataURL / base64 sang ArrayBuffer cho Web Audio API
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Chuyển đổi AudioBuffer thành định dạng WAV chuẩn (Blob & DataURL) để dùng cho Player và AI STT
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    let index = 0;
    let inputIndex = 0;
    while (index < result.length) {
      result[index++] = left[inputIndex];
      result[index++] = right[inputIndex];
      inputIndex++;
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(8, 'WAVE');
  // format chunk identifier
  writeString(12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Tự động tách âm thanh (sound track) từ video MP4/MOV/WebM/MKV ra file WAV
export async function extractAudioFromVideoData(
  videoData: string | ArrayBuffer
): Promise<{ dataUrl: string; base64: string; mimeType: string; duration: number } | null> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const audioCtx = new AudioContextClass();
    let arrayBuffer: ArrayBuffer;
    if (typeof videoData === 'string') {
      arrayBuffer = dataUrlToArrayBuffer(videoData);
    } else {
      arrayBuffer = videoData;
    }

    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const duration = Number(decoded.duration.toFixed(2));
    const wavBlob = audioBufferToWav(decoded);

    audioCtx.close().catch(() => {});

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        resolve({
          dataUrl,
          base64,
          mimeType: 'audio/wav',
          duration
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(wavBlob);
    });
  } catch (err) {
    console.error('Error extracting audio from video:', err);
    return null;
  }
}

// Phân tích waveform âm thanh bằng Web Audio API để đo độ dài chuẩn xác và phát hiện nhịp tiếng nói
export async function analyzeAudioWaveform(
  audioData: string | ArrayBuffer
): Promise<{ duration: number; speechRanges: Array<{ start: number; end: number }> }> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return { duration: 4.0, speechRanges: [{ start: 0.1, end: 3.9 }] };
    }

    const audioCtx = new AudioContextClass();
    let arrayBuffer: ArrayBuffer;
    if (typeof audioData === 'string') {
      arrayBuffer = dataUrlToArrayBuffer(audioData);
    } else {
      arrayBuffer = audioData;
    }

    const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const duration = Number(decoded.duration.toFixed(2));
    const channelData = decoded.getChannelData(0);
    const sampleRate = decoded.sampleRate;

    // Phân tích năng lượng âm thanh theo từng block 50ms
    const blockSize = Math.floor(sampleRate * 0.05); // 50ms
    const totalBlocks = Math.floor(channelData.length / blockSize);
    const energies: number[] = [];
    let maxEnergy = 0;

    for (let b = 0; b < totalBlocks; b++) {
      let sum = 0;
      const startIdx = b * blockSize;
      for (let i = 0; i < blockSize; i++) {
        const val = channelData[startIdx + i];
        sum += val * val;
      }
      const rms = Math.sqrt(sum / blockSize);
      energies.push(rms);
      if (rms > maxEnergy) maxEnergy = rms;
    }

    const threshold = Math.max(0.015, maxEnergy * 0.15);
    const speechRanges: Array<{ start: number; end: number }> = [];
    let inSpeech = false;
    let rangeStart = 0;

    for (let b = 0; b < totalBlocks; b++) {
      const time = b * 0.05;
      const isAudible = energies[b] >= threshold;

      if (isAudible && !inSpeech) {
        inSpeech = true;
        rangeStart = Math.max(0, time - 0.05);
      } else if (!isAudible && inSpeech) {
        // Kiểm tra xem có phải khoảng ngắt ngắn không (dưới 150ms thì vẫn tính là đang nói)
        const nextAudible = energies.slice(b, b + 3).some((e) => e >= threshold);
        if (!nextAudible) {
          inSpeech = false;
          const rangeEnd = Math.min(duration, time + 0.05);
          if (rangeEnd - rangeStart >= 0.15) {
            speechRanges.push({
              start: Number(rangeStart.toFixed(2)),
              end: Number(rangeEnd.toFixed(2))
            });
          }
        }
      }
    }

    if (inSpeech) {
      speechRanges.push({
        start: Number(rangeStart.toFixed(2)),
        end: duration
      });
    }

    // Nếu không tách được khoảng nói nào, lấy toàn bộ độ dài
    if (speechRanges.length === 0) {
      speechRanges.push({ start: 0.1, end: Math.max(0.5, duration - 0.1) });
    }

    audioCtx.close().catch(() => {});
    return { duration, speechRanges };
  } catch (err) {
    console.warn('Audio waveform analysis fallback:', err);
    return { duration: 4.0, speechRanges: [{ start: 0.1, end: 3.9 }] };
  }
}

export interface AudioExtractionResult {
  audioUrl: string;
  duration: number;
  isVideo: boolean;
  fileName: string;
}

/**
 * Tự động quét file: nếu là file MP3/WAV/Audio thì nạp trực tiếp, nếu là video MP4/MOV/WebM/MKV
 * thì tự động quét và bóc tách âm thanh (extract audio track) sang Audio WAV/MP3 Data URL để nhập vào app.
 */
export async function convertAudioOrVideoFileToAudio(
  file: File
): Promise<AudioExtractionResult> {
  const fileName = file.name;
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v|3gp|flv)$/i.test(fileName);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          throw new Error('Không thể đọc dữ liệu file');
        }

        if (isVideo) {
          const extracted = await extractAudioFromVideoData(rawDataUrl);
          if (extracted && extracted.dataUrl) {
            resolve({
              audioUrl: extracted.dataUrl,
              duration: extracted.duration || 10.0,
              isVideo: true,
              fileName
            });
            return;
          }
        }

        // Nếu là audio thông thường (MP3, WAV, AAC, M4A, OGG, etc.)
        const audio = new Audio(rawDataUrl);
        audio.onloadedmetadata = () => {
          const duration = Number((audio.duration || 10.0).toFixed(2));
          resolve({
            audioUrl: rawDataUrl,
            duration: isFinite(duration) && duration > 0 ? duration : 10.0,
            isVideo: false,
            fileName
          });
        };
        audio.onerror = () => {
          resolve({
            audioUrl: rawDataUrl,
            duration: 10.0,
            isVideo: false,
            fileName
          });
        };
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Căn chỉnh nhịp từng từ (Word Alignment) theo độ dài âm thanh và waveform
export function alignWordsWithWaveform(
  text: string,
  totalDuration: number,
  speechRanges?: Array<{ start: number; end: number }>
): WordTimestamp[] {
  const clean = text.trim();
  if (!clean) return [];

  const rawWords = clean.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const safeDuration = Math.max(1.0, totalDuration);
  const words: WordTimestamp[] = [];

  // Nếu có speechRanges hợp lệ từ Web Audio API
  if (speechRanges && speechRanges.length > 0) {
    const totalActiveTime = speechRanges.reduce((acc, r) => acc + (r.end - r.start), 0);
    let wordIdx = 0;

    for (const range of speechRanges) {
      const rangeDur = range.end - range.start;
      const wordShare = Math.max(1, Math.round((rangeDur / totalActiveTime) * rawWords.length));
      const chunkWords = rawWords.slice(wordIdx, wordIdx + wordShare);
      wordIdx += wordShare;

      if (chunkWords.length > 0) {
        const perWord = rangeDur / chunkWords.length;
        chunkWords.forEach((w, idx) => {
          const wStart = Number((range.start + idx * perWord).toFixed(2));
          const wEnd = Number((range.start + (idx + 1) * perWord).toFixed(2));
          words.push({
            word: w,
            start: wStart,
            end: wEnd
          });
        });
      }
    }

    // Bổ sung những từ còn sót nếu có
    while (wordIdx < rawWords.length) {
      const lastWord = words[words.length - 1];
      const start = lastWord ? lastWord.end : 0.2;
      const end = Number((start + 0.35).toFixed(2));
      words.push({
        word: rawWords[wordIdx],
        start,
        end
      });
      wordIdx++;
    }
  } else {
    // Phân bổ đều tự nhiên theo độ dài file âm thanh
    const leadIn = 0.15;
    const usableTime = Math.max(0.5, safeDuration - 0.3);
    const perWord = usableTime / rawWords.length;

    rawWords.forEach((w, idx) => {
      const start = Number((leadIn + idx * perWord).toFixed(2));
      const end = Number((leadIn + (idx + 1) * perWord).toFixed(2));
      words.push({
        word: w,
        start,
        end
      });
    });
  }

  return words;
}

// Tự động đồng bộ lại danh sách words khi người dùng chỉnh sửa văn bản câu thoại
export function syncWordsFromNarration(
  newNarration: string,
  audioDuration: number,
  existingWords?: WordTimestamp[]
): WordTimestamp[] {
  const clean = newNarration.trim();
  if (!clean) return [];

  const rawWords = clean.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const safeDuration = Math.max(1.0, audioDuration || 4.0);

  // Nếu số lượng từ giống nhau, chỉ cần thay thế từ mới và giữ nguyên timestamp
  if (existingWords && existingWords.length === rawWords.length) {
    return rawWords.map((w, idx) => ({
      word: w,
      start: existingWords[idx].start,
      end: existingWords[idx].end
    }));
  }

  // Nếu có existingWords trước đó nhưng số từ thay đổi (thêm/bớt từ)
  if (existingWords && existingWords.length > 0) {
    const firstStart = existingWords[0]?.start ?? 0.15;
    const lastEnd = existingWords[existingWords.length - 1]?.end ?? Math.max(0.5, safeDuration - 0.2);
    const usableSpan = Math.max(0.5, lastEnd - firstStart);
    const perWord = usableSpan / rawWords.length;

    return rawWords.map((w, idx) => ({
      word: w,
      start: Number((firstStart + idx * perWord).toFixed(2)),
      end: Number((firstStart + (idx + 1) * perWord).toFixed(2))
    }));
  }

  // Phân bổ đều tự nhiên theo độ dài audio
  const leadIn = 0.15;
  const usableTime = Math.max(0.5, safeDuration - 0.3);
  const perWord = usableTime / rawWords.length;

  return rawWords.map((w, idx) => ({
    word: w,
    start: Number((leadIn + idx * perWord).toFixed(2)),
    end: Number((leadIn + (idx + 1) * perWord).toFixed(2))
  }));
}

// Chuyển đổi mọi loại URL âm thanh (data, file, blob, http) thành base64 & MIME type
export async function extractAudioBase64(
  audioUrl: string
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  if (!audioUrl) return { base64: '', mimeType: 'audio/mp3', dataUrl: '' };

  // 1. Data URL
  if (audioUrl.startsWith('data:')) {
    const parts = audioUrl.split(',');
    const base64 = parts[1] || '';
    const mimeMatch = audioUrl.match(/data:([^;]+);/);
    const mimeType = (mimeMatch ? mimeMatch[1] : 'audio/mp3').split(';')[0].trim().toLowerCase();
    return { base64, mimeType, dataUrl: audioUrl };
  }

  // 2. Electron local file
  if (audioUrl.startsWith('file://') && (window as any).electronAPI?.readAudioBase64) {
    const cleanPath = audioUrl.replace(/^file:\/\/\/?/, '');
    const res = await (window as any).electronAPI.readAudioBase64(cleanPath);
    if (res?.base64) {
      return {
        base64: res.base64,
        mimeType: (res.mimeType || 'audio/mp3').split(';')[0].trim().toLowerCase(),
        dataUrl: res.dataUrl || audioUrl
      };
    }
  }

  // 3. Blob or HTTP URL via fetch API
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const rawMime = blob.type ? blob.type.split(';')[0].trim().toLowerCase() : 'audio/webm';
    const mimeType = rawMime || 'audio/webm';

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        resolve({ base64, mimeType, dataUrl });
      };
      reader.onerror = () => resolve({ base64: '', mimeType: 'audio/mp3', dataUrl: audioUrl });
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Extract audio base64 fetch fallback:', err);
    return { base64: '', mimeType: 'audio/mp3', dataUrl: audioUrl };
  }
}

// Nhận diện giọng nói (Speech-to-Text) từ file âm thanh dùng Gemini 1.5 Flash Audio
export async function transcribeAudioWithGemini(
  audioBase64: string,
  mimeType: string,
  apiKey: string,
  fallbackPromptText?: string
): Promise<TranscribeResult | null> {
  try {
    const cleanMime = (mimeType || 'audio/mp3').split(';')[0].trim().toLowerCase();
    const effectiveMime = cleanMime.includes('webm')
      ? 'audio/webm'
      : cleanMime.includes('wav')
      ? 'audio/wav'
      : cleanMime.includes('ogg')
      ? 'audio/ogg'
      : cleanMime.includes('mp4') || cleanMime.includes('m4a') || cleanMime.includes('aac')
      ? 'audio/mp4'
      : 'audio/mp3';

    const prompt = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
Nhiệm vụ: Nghe kỹ file âm thanh đính kèm và nhận diện chính xác toàn bộ câu từ được phát âm (tiếng Việt hoặc tiếng Anh).

Yêu cầu BẮT BUỘC:
1. "narration": Văn bản toàn bộ câu thoại nghe được trong audio (không thêm thắt nội dung ngoài âm thanh).
2. "duration": Thời lượng file âm thanh tính bằng giây (số thực, ví dụ 3.5).
3. "language": "vi" hoặc "en".
4. "words": Mảng từng từ được phát âm cùng mốc thời gian bắt đầu ("start") và kết thúc ("end") tính bằng giây (bắt đầu từ 0.0s).
${fallbackPromptText ? `Văn bản ngữ cảnh tham khảo (nếu có): "${fallbackPromptText}"` : ''}

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (KHÔNG KÈM KÝ TỰ MARKDOWN KHÁC):
{
  "narration": "câu thoại bạn nghe được",
  "language": "vi",
  "duration": 3.5,
  "words": [
    { "word": "Từ", "start": 0.1, "end": 0.4 },
    { "word": "thứ", "start": 0.45, "end": 0.7 }
  ]
}`;

    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro'
    ];

    const apiVersions = ['v1beta', 'v1'];

    for (const model of candidateModels) {
      for (const apiVer of apiVersions) {
        try {
          const res = await axios.post(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: effectiveMime,
                        data: audioBase64
                      }
                    },
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1
              }
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 25000
            }
          );

          let rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(rawText);
            if (parsed && parsed.narration) {
              const rawWords: WordTimestamp[] = Array.isArray(parsed.words)
                ? parsed.words.map((w: any) => ({
                    word: String(w.word || ''),
                    start: Number(Number(w.start || 0).toFixed(2)),
                    end: Number(Number(w.end || 0.3).toFixed(2))
                  }))
                : [];

              return {
                narration: String(parsed.narration).trim(),
                language: parsed.language === 'en' ? 'en' : 'vi',
                audioDuration: Number(parsed.duration || 4.0),
                words: rawWords
              };
            }
          }
        } catch {
          // Thử tiếp model tiếp theo
        }
      }
    }

    return null;
  } catch (err: any) {
    console.warn('Gemini Audio STT error:', err?.response?.data || err?.message || err);
    throw err;
  }
}

// Bóc tách toàn bộ file âm thanh dài (Full Audio) thành nhiều phân cảnh kèm lời thoại & nhịp chạy chữ
export async function transcribeAndSplitFullAudio(
  audioBase64: string,
  mimeType: string,
  apiKey: string
): Promise<FullAudioSplitScene[] | null> {
  try {
    const prompt = `Bạn là đạo diễn video AI chuyên nghiệp.
File âm thanh đính kèm là toàn bộ giọng đọc/lồng tiếng của một video ngắn (Shorts / Reels / TikTok).

Hãy nghe kỹ âm thanh và:
1. Nhận diện toàn bộ lời thoại và chia thành các phân cảnh hợp lý (mỗi phân cảnh tương ứng 1 câu hoặc 1 ý, độ dài từ 2 đến 6 giây).
2. Với mỗi phân cảnh, cung cấp:
   - "narration": Câu thoại của phân cảnh.
   - "audioDuration": Thời lượng của phân cảnh (giây).
   - "searchKeyword": Từ khóa ngắn gọn (tiếng Anh hoặc tiếng Việt) để tìm kiếm video/hình ảnh minh họa phù hợp cho phân cảnh này.
   - "words": Danh sách từng từ cùng mốc thời gian bắt đầu (start) và kết thúc (end) tương đối trong phân cảnh đó (bắt đầu từ 0.0s).

BẮT BUỘC TRẢ VỀ DUY NHẤT MỘT MẢNG JSON HỢP LỆ:
[
  {
    "narration": "Câu thoại cảnh 1...",
    "audioDuration": 3.5,
    "searchKeyword": "galaxy space stars",
    "words": [
      { "word": "Câu", "start": 0.1, "end": 0.4 },
      { "word": "thoại", "start": 0.45, "end": 0.8 }
    ]
  }
]`;

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: audioBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000
      }
    );

    const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any) => ({
      narration: String(item.narration || '').trim(),
      audioDuration: Math.max(1.5, Number(item.audioDuration || 4.0)),
      searchKeyword: String(item.searchKeyword || ''),
      words: Array.isArray(item.words)
        ? item.words.map((w: any) => ({
            word: String(w.word || ''),
            start: Number(Number(w.start || 0).toFixed(2)),
            end: Number(Number(w.end || 0.3).toFixed(2))
          }))
        : []
    }));
  } catch (err) {
    console.warn('Split full audio error:', err);
    return null;
  }
}

// Hàm tổng quát: Nhận diện file âm thanh người dùng đưa vào và trả về Lời thoại + Nhịp chữ chạy karaoke
export async function transcribeCustomAudio(params: {
  audioDataUrl: string;
  audioBase64?: string;
  mimeType?: string;
  apiKeyGemini?: string;
  existingNarration?: string;
}): Promise<TranscribeResult> {
  const { audioDataUrl, audioBase64, mimeType = 'audio/mp3', apiKeyGemini, existingNarration } = params;

  // 1. Phân tích Waveform bằng Web Audio API để lấy thời lượng chính xác tuyệt đối
  const waveformAnalysis = await analyzeAudioWaveform(audioDataUrl);
  const realDuration = waveformAnalysis.duration;

  // 2. Nếu có Gemini API Key, thử nhận diện bằng Gemini 1.5 Flash Audio
  if (apiKeyGemini && apiKeyGemini.trim()) {
    const rawBase64 = audioBase64 || (audioDataUrl.includes(',') ? audioDataUrl.split(',')[1] : '');
    if (rawBase64) {
      const geminiResult = await transcribeAudioWithGemini(
        rawBase64,
        mimeType,
        apiKeyGemini.trim(),
        existingNarration
      );

      if (geminiResult && geminiResult.narration) {
        // Đảm bảo duration khớp với phân tích âm thanh thực tế
        const finalDuration = Math.max(realDuration, geminiResult.audioDuration || 1.0);
        let finalWords = geminiResult.words;

        // Nếu Gemini trả về words thiếu mốc thời gian, tự căn chỉnh lại theo waveform
        if (!finalWords || finalWords.length === 0) {
          finalWords = alignWordsWithWaveform(geminiResult.narration, finalDuration, waveformAnalysis.speechRanges);
        }

        return {
          narration: geminiResult.narration,
          language: geminiResult.language,
          audioDuration: finalDuration,
          words: finalWords
        };
      }
    }
  }

  // 3. Fallback: Nếu không có API Key, dùng câu thoại sẵn có
  const textToUse = (existingNarration || '').trim();
  const alignedWords = textToUse ? alignWordsWithWaveform(textToUse, realDuration, waveformAnalysis.speechRanges) : [];

  return {
    narration: textToUse,
    language: 'vi',
    audioDuration: realDuration,
    words: alignedWords
  };
}
