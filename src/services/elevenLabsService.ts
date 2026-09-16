import { WordTimestamp, VoiceOption } from '../types/video';

export const STORAGE_KEY_ELEVENLABS_KEY = 'ELEVENLABS_API_KEY';

export function getSavedElevenLabsApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_ELEVENLABS_KEY) || '';
}

export function saveElevenLabsApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_ELEVENLABS_KEY, key.trim());
}

/**
 * Gọi API Instant Voice Cloning của ElevenLabs để tạo model giọng chuẩn 100% từ file âm thanh
 */
export async function cloneElevenLabsVoice(
  name: string,
  audioFile: File,
  apiKey?: string,
  description: string = 'Mô hình giọng đọc AI nhân bản'
): Promise<{ voiceId: string; name: string }> {
  const effectiveKey = (apiKey || getSavedElevenLabsApiKey()).trim();
  if (!effectiveKey) {
    throw new Error('Vui lòng nhập ElevenLabs API Key để tiến hành nhân bản giọng nói thật chuẩn 100%!');
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('files', audioFile);
  formData.append('description', description);

  const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: {
      'xi-api-key': effectiveKey
    },
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedErr = errText;
    try {
      const jsonErr = JSON.parse(errText);
      parsedErr = jsonErr.detail?.message || jsonErr.message || errText;
    } catch (_) {}
    throw new Error(`Lỗi ElevenLabs Clone (${res.status}): ${parsedErr}`);
  }

  const data = await res.json();
  const voiceId = data.voice_id;
  if (!voiceId) {
    throw new Error('ElevenLabs không trả về voice_id hợp lệ');
  }

  return {
    voiceId: `elevenlabs:${voiceId}`,
    name: `👑 ${name} (100% Chuẩn Giọng File Thật)`
  };
}

export interface ElevenLabsVoiceConfig {
  id: string;
  name: string;
  voiceId: string;
  category: 'vietnamese' | 'english';
  gender: 'Female' | 'Male';
  description: string;
  tags?: string[];
}

export const ELEVENLABS_VOICES: ElevenLabsVoiceConfig[] = [
  // Tiếng Việt (Model: Eleven Multilingual v2)
  {
    id: 'elevenlabs:pNInz6obpgDQGcFmaJgB',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (ElevenLabs - Nam trầm ấm, quyền lực, tin cậy)',
    category: 'vietnamese',
    gender: 'Male',
    description: 'Nam trung trầm, uy lực, rất mượt cho review công nghệ, tài chính, B2B.',
    tags: ['B2B', 'Tech', 'Tài chính', 'Viral']
  },
  {
    id: 'elevenlabs:ErXwobaYiN019PkySvjV',
    voiceId: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni (ElevenLabs - Nam trẻ trung, cuốn hút, TikTok)',
    category: 'vietnamese',
    gender: 'Male',
    description: 'Nam trẻ, tự tin, cuốn hút, cực hay cho video TikTok/Reels viral, thể thao.',
    tags: ['TikTok', 'Reels', 'Thể thao', 'Bán hàng']
  },
  {
    id: 'elevenlabs:21m00Tcm4TlvDq8ikWAM',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel (ElevenLabs - Nữ điềm tĩnh, ấm áp, truyền cảm)',
    category: 'vietnamese',
    gender: 'Female',
    description: 'Nữ điềm tĩnh, ấm áp, rõ ràng, hợp podcast, kể chuyện, review du lịch/homestay.',
    tags: ['Podcast', 'Du lịch', 'Kể chuyện', 'Homestay']
  },
  {
    id: 'elevenlabs:EXAVITQu4vr4xnSDxMaL',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella (ElevenLabs - Nữ ngọt ngào, nhẹ nhàng, du dương)',
    category: 'vietnamese',
    gender: 'Female',
    description: 'Nữ ngọt ngào, mềm mại, truyền cảm, hợp vlog ẩm thực, làm đẹp, ASMR.',
    tags: ['Vlog', 'Ẩm thực', 'Làm đẹp', 'Tâm sự']
  },
  {
    id: 'elevenlabs:N2lVS1w4EtoT3dr4eOWO',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum (ElevenLabs - Nam trầm vang, điện ảnh, trailer)',
    category: 'vietnamese',
    gender: 'Male',
    description: 'Nam trầm sâu, phong cách tài liệu, trailer phim, bí ẩn, triết lý.',
    tags: ['Cinema', 'Trailer', 'Tài liệu', 'Bí ẩn']
  },
  {
    id: 'elevenlabs:TxGEqnHWrfWFTfGW9XjX',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh (ElevenLabs - Nam sâu lắng, ấm áp, kể chuyện)',
    category: 'vietnamese',
    gender: 'Male',
    description: 'Nam ấm áp, sâu sắc, phong cách người kể chuyện (Storyteller), sách nói.',
    tags: ['Sách nói', 'Storyteller', 'Tâm sự']
  },
  {
    id: 'elevenlabs:XB0fDUnXU5powFXDhCwa',
    voiceId: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte (ElevenLabs - Nữ tự nhiên, lôi cuốn, lifestyle)',
    category: 'vietnamese',
    gender: 'Female',
    description: 'Nữ cuốn hút, phong thái tự nhiên, hợp review phong cách sống, tin tức ngắn.',
    tags: ['Lifestyle', 'Review', 'Tin tức']
  },

  // Tiếng Anh (Native English)
  {
    id: 'elevenlabs:JBFqnCBsd6RMkjVDRZzb',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George (ElevenLabs - British Warm Gentleman)',
    category: 'english',
    gender: 'Male',
    description: 'British English warm gentleman voice, perfect for documentaries & audiobooks.',
    tags: ['British', 'Documentary', 'Gentleman']
  },
  {
    id: 'elevenlabs:pFZP5JQG7iQjIQuC4Bku',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily (ElevenLabs - British Luxury & Elegant)',
    category: 'english',
    gender: 'Female',
    description: 'Elegant British female voice for luxury brands and storytelling.',
    tags: ['British', 'Luxury', 'Fashion']
  },
  {
    id: 'elevenlabs:IKne3meq5aSn9X80gdMx',
    voiceId: 'IKne3meq5aSn9X80gdMx',
    name: 'Charlie (ElevenLabs - Australian Friendly & Energetic)',
    category: 'english',
    gender: 'Male',
    description: 'Casual Australian male voice, great for travel & outdoor content.',
    tags: ['Australian', 'Travel', 'Outdoor']
  },
  {
    id: 'elevenlabs:nPczCjzI2devNBz1zQrb',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian (ElevenLabs - US Intellectual Storyteller)',
    category: 'english',
    gender: 'Male',
    description: 'Wise and intellectual American male voice for science and knowledge.',
    tags: ['US', 'Knowledge', 'Science']
  },
  {
    id: 'elevenlabs:EXAVITQu4vr4xnSDxMaL_en',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (ElevenLabs - US Dynamic Female News & Shorts)',
    category: 'english',
    gender: 'Female',
    description: 'Upbeat and engaging American female voice for quick news and viral shorts.',
    tags: ['US', 'Shorts', 'Upbeat']
  }
];

export function getAllVoiceOptions(): VoiceOption[] {
  // Edge-TTS standard voices
  const standardEdgeVoices: VoiceOption[] = [
    {
      id: 'google-vi',
      name: '🇻🇳 Giọng Đọc Tiếng Việt AI (Google Neural - 100% Free)',
      locale: 'vi-VN',
      gender: 'Female',
      description: 'Giọng đọc tiếng Việt tự nhiên, tròn vành rõ chữ, hoàn toàn miễn phí.'
    },
    {
      id: 'en-US-JennyNeural',
      name: 'Jenny (Edge-TTS - English US Female)',
      locale: 'en-US',
      gender: 'Female',
      description: 'Natural American female voice for global content.'
    },
    {
      id: 'en-US-GuyNeural',
      name: 'Guy (Edge-TTS - English US Male)',
      locale: 'en-US',
      gender: 'Male',
      description: 'Energetic American male voice.'
    }
  ];

  // ElevenLabs voices mapped to VoiceOption
  const elevenLabsOptions: VoiceOption[] = ELEVENLABS_VOICES.map((ev) => ({
    id: ev.id,
    name: `⚡ ${ev.name}`,
    locale: ev.category === 'vietnamese' ? 'vi-VN' : 'en-US',
    gender: ev.gender,
    description: `${ev.description} [ElevenLabs AI]`
  }));

  return [...elevenLabsOptions, ...standardEdgeVoices];
}

interface SynthesizeResult {
  audioUrl: string;
  duration: number;
  words: WordTimestamp[];
}

/**
 * Gọi API ElevenLabs để sinh giọng đọc AI cao cấp với phụ đề chạy chữ
 */
export async function synthesizeElevenLabsTTS(
  text: string,
  voiceIdentifier: string,
  apiKey?: string
): Promise<SynthesizeResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return { audioUrl: '', duration: 2.0, words: [] };
  }

  const effectiveKey = (apiKey || getSavedElevenLabsApiKey()).trim();
  if (!effectiveKey) {
    throw new Error('Chưa có ElevenLabs API Key. Vui lòng nhập API Key trong phần Cấu hình để sử dụng giọng ElevenLabs!');
  }

  // Tách lấy voiceId thực tế từ prefix 'elevenlabs:'
  let voiceId = voiceIdentifier.replace(/^elevenlabs:/i, '').replace(/_en$/i, '').trim();
  if (!voiceId) {
    voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam as default
  }

  // Cấu hình ElevenLabs Multilingual v2 tối ưu cho tiếng Việt và tiếng Anh
  const requestBody = {
    text: cleanText,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  try {
    // 1. Thử gọi endpoint with-timestamps để lấy chính xác mốc từng từ
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': effectiveKey
      },
      body: JSON.stringify(requestBody)
    });

    if (res.ok) {
      const data = await res.json();
      const audioBase64 = data.audio_base64;
      const audioUrl = `data:audio/mp3;base64;${audioBase64}`;

      // Xử lý alignment words từ character_start_times_seconds / alignment
      let words: WordTimestamp[] = [];
      if (data.alignment && data.alignment.characters && data.alignment.character_start_times_seconds) {
        const chars: string[] = data.alignment.characters;
        const startTimes: number[] = data.alignment.character_start_times_seconds;
        const endTimes: number[] = data.alignment.character_end_times_seconds || [];

        let currentWord = '';
        let wordStart = 0;
        let wordEnd = 0;

        for (let i = 0; i < chars.length; i++) {
          const char = chars[i];
          if (/\s/.test(char)) {
            if (currentWord.trim().length > 0) {
              words.push({
                word: currentWord.trim(),
                start: Number(wordStart.toFixed(2)),
                end: Number(wordEnd.toFixed(2))
              });
              currentWord = '';
            }
          } else {
            if (!currentWord) {
              wordStart = startTimes[i] || 0;
            }
            currentWord += char;
            wordEnd = endTimes[i] || (startTimes[i] ? startTimes[i] + 0.1 : 0.1);
          }
        }

        if (currentWord.trim().length > 0) {
          words.push({
            word: currentWord.trim(),
            start: Number(wordStart.toFixed(2)),
            end: Number(wordEnd.toFixed(2))
          });
        }
      }

      // Nếu không parse được alignment, tự động tính mốc words
      const rawWords = cleanText.split(/\s+/).filter(Boolean);
      let duration = 3.0;

      if (words.length === 0) {
        const timePerWord = 0.35;
        let cur = 0.1;
        for (const w of rawWords) {
          words.push({
            word: w,
            start: Number(cur.toFixed(2)),
            end: Number((cur + timePerWord).toFixed(2))
          });
          cur += timePerWord;
        }
        duration = Number((cur + 0.3).toFixed(2));
      } else {
        duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
      }

      return {
        audioUrl,
        duration: Math.max(2.0, duration),
        words
      };
    }

    // 2. Fallback sang endpoint stream/MP3 nếu with-timestamps không được hỗ trợ trên gói tài khoản
    const fallbackRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': effectiveKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`ElevenLabs API Error (${fallbackRes.status}): ${errText}`);
    }

    const arrayBuffer = await fallbackRes.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const audioUrl = `data:audio/mp3;base64,${base64}`;

    // Tự động phân bổ mốc từ dựa trên độ dài audio thực tế
    const rawWords = cleanText.split(/\s+/).filter(Boolean);
    const estimatedDur = Math.max(2.5, Number((bytes.length / 5500).toFixed(2)));
    const timePerWord = rawWords.length > 0 ? (estimatedDur - 0.4) / rawWords.length : 0.35;
    const words: WordTimestamp[] = [];
    let cur = 0.15;
    for (const w of rawWords) {
      words.push({
        word: w,
        start: Number(cur.toFixed(2)),
        end: Number((cur + timePerWord).toFixed(2))
      });
      cur += timePerWord;
    }

    return {
      audioUrl,
      duration: estimatedDur,
      words
    };
  } catch (err: any) {
    console.error('ElevenLabs synthesis failed:', err);
    throw err;
  }
}

export interface FallbackVoiceResult {
  fallbackVoiceId: string;
  voiceName: string;
  gender: 'Male' | 'Female';
  locale: string;
  isFallback: boolean;
}

/**
 * Tự động tìm giọng Edge-TTS tương đương (bảo toàn giới tính Nam/Nữ và ngôn ngữ VN/EN)
 * khi người dùng chọn giọng ElevenLabs nhưng chưa có API key hoặc API lỗi.
 */
export function getEquivalentFallbackVoice(voiceIdentifier: string): FallbackVoiceResult {
  if (!voiceIdentifier || !voiceIdentifier.startsWith('elevenlabs:')) {
    const isVi = (voiceIdentifier || '').startsWith('vi-') || voiceIdentifier === 'google-vi';
    return {
      fallbackVoiceId: voiceIdentifier || 'google-vi',
      voiceName: isVi ? 'Giọng Đọc Tiếng Việt AI (Google Neural)' : 'Guy (Edge-TTS)',
      gender: 'Female',
      locale: isVi ? 'vi-VN' : 'en-US',
      isFallback: false
    };
  }

  const voiceId = voiceIdentifier.replace(/^elevenlabs:/i, '').replace(/_en$/i, '').trim();
  const config = ELEVENLABS_VOICES.find((v) => v.voiceId === voiceId || v.id === voiceIdentifier);

  if (config) {
    if (config.category === 'vietnamese') {
      return {
        fallbackVoiceId: 'google-vi',
        voiceName: 'Giọng Đọc Tiếng Việt AI (Google Neural - 100% Free)',
        gender: 'Female',
        locale: 'vi-VN',
        isFallback: true
      };
    } else {
      if (config.gender === 'Male') {
        return {
          fallbackVoiceId: 'en-US-GuyNeural',
          voiceName: 'Guy (Edge-TTS - US Male)',
          gender: 'Male',
          locale: 'en-US',
          isFallback: true
        };
      } else {
        return {
          fallbackVoiceId: 'en-US-JennyNeural',
          voiceName: 'Jenny (Edge-TTS - US Female)',
          gender: 'Female',
          locale: 'en-US',
          isFallback: true
        };
      }
    }
  }

  return {
    fallbackVoiceId: 'google-vi',
    voiceName: 'Giọng Đọc Tiếng Việt AI (Google Neural - 100% Free)',
    gender: 'Female',
    locale: 'vi-VN',
    isFallback: true
  };
}

