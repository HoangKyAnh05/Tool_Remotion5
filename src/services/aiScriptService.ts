import axios from 'axios';
import { Scene, AspectRatio, TransitionType, KenBurnsEffect, WordTimestamp } from '../types/video';
import { synthesizeEdgeTTS } from './edgeTtsService';

const _ENC_KEY = 'c2stcHJvai10UmEyYkR1dVJrdE03bXVSbWd1bDFYUkJQYzNzdnVvOEl5bDlJSGwxNkZrUE1hUl80NlJRMjBCcDNrUkdjSHZOcnE3ZllHQTFIUFQzQmxia0ZKTDl1U2dWeHUzTXBJMzh3RHplNVFOWTVaODk4VGFGUEVtSmJlWVRXUDUtekZkTGVwZXN2dE9oSGdSMk5uTWhXNGZEdUF3dFl0VUE=';
export const DEFAULT_OPENAI_KEY =
  (typeof window !== 'undefined' && typeof window.atob === 'function'
    ? window.atob(_ENC_KEY)
    : Buffer.from(_ENC_KEY, 'base64').toString('utf-8'));

export interface ScriptGenerationParams {
  topic: string;
  niche?: 'science' | 'finance' | 'motivation' | 'history' | 'tech' | 'custom';
  sceneCount?: number;
  aspectRatio?: AspectRatio;
  language?: 'vi' | 'en';
  apiKey?: string; // OpenAI or Gemini API Key
  provider?: 'gemini' | 'openai' | 'builtin';
  rawScriptInput?: string; // Kịch bản thô hoặc mốc giây người dùng nhập
  customTimestamps?: string; // Mốc thời gian cụ thể (vd: 0:00 - 0:12: giới thiệu)
  sourceVideoName?: string; // Tên file video nguồn nếu có
}

const TEMPLATE_SCRIPTS: Record<string, Array<{ narration: string; keyword: string; prompt: string }>> = {
  science: [
    {
      narration: "Vũ trụ bao la rộng lớn chứa đựng vô vàn bí ẩn kỳ vĩ mà khoa học hiện đại vẫn đang từng bước khám phá.",
      keyword: "deep space galaxy nebula stars universe cinematic",
      prompt: "cinematic mesmerizing view of deep space with glowing colorful nebula and stars 8k"
    },
    {
      narration: "Các nhà thiên văn học đã phát hiện ra những hành tinh đặc biệt, nơi bề mặt được bao phủ bởi kim cương nguyên chất lấp lánh.",
      keyword: "sparkling crystal diamond planet in galaxy space",
      prompt: "stunning diamond crystal planet sparkling in space galaxy backdrop hyperrealistic"
    },
    {
      narration: "Tại chân trời sự kiện của hố đen, lực hấp dẫn mạnh đến mức bẻ cong không gian và làm thời gian trôi chậm lại đáng kể.",
      keyword: "massive black hole gravitational lens event horizon glowing",
      prompt: "majestic glowing black hole with accretion disk bending space and light ultra detailed"
    },
    {
      narration: "Mỗi giây trôi qua, vũ trụ của chúng ta lại tiếp tục giãn nở không ngừng vào khoảng không vô tận với tốc độ ánh sáng!",
      keyword: "universe expansion quantum light burst glowing particles",
      prompt: "epic explosion of light and quantum particles expanding in cosmos"
    }
  ],
  finance: [
    {
      narration: "Đây là 3 thói quen quản lý tài chính kinh điển giúp những người thành công tạo dựng sự giàu có bền vững theo thời gian.",
      keyword: "wealth luxury city modern skyscraper financial district",
      prompt: "successful businessman looking over modern financial district at sunset cinematic"
    },
    {
      narration: "Quy tắc cốt lõi đầu tiên: Luôn ưu tiên trích một phần thu nhập để đầu tư vào tài sản sinh lời trước khi chi tiêu cho nhu cầu cá nhân.",
      keyword: "stock market trading chart growth investment",
      prompt: "glowing holographic stock market graph with rising green arrow high tech"
    },
    {
      narration: "Tận dụng tối đa sức mạnh của lãi suất kép – đòn bẩy tài chính kỳ diệu giúp dòng tiền tự động nhân bản theo năm tháng.",
      keyword: "gold coins stacking compound interest growth vault",
      prompt: "tower of glowing gold coins growing dynamically in a futuristic vault"
    },
    {
      narration: "Hãy bắt đầu kiểm soát tài chính cá nhân ngay từ hôm nay để sớm chạm tới mục tiêu tự do tài chính mà bạn hằng mong ước!",
      keyword: "freedom lifestyle luxury travel sunset success",
      prompt: "young entrepreneur on luxury yacht enjoying financial freedom sunset 8k"
    }
  ],
  motivation: [
    {
      narration: "Đừng bao giờ từ bỏ mục tiêu của cuộc đời chỉ vì chặng đường phía trước đang đầy rẫy những thử thách và chông gai.",
      keyword: "mountain peak climber sunrise triumph dramatic",
      prompt: "dramatic silhouette of a person standing on high mountain peak looking at sunrise"
    },
    {
      narration: "Mỗi cú vấp ngã ngày hôm nay chính là bài học kinh nghiệm quý giá giúp bạn tôi luyện ý chí kiên cường và bản lĩnh vững vàng.",
      keyword: "athlete training determination discipline running",
      prompt: "intense determined athlete running in rain slow motion dramatic lighting"
    },
    {
      narration: "Kỷ luật thép trong từng hành động nhỏ mỗi ngày chính là cây cầu vững chắc nhất kết nối giữa ước mơ và thành tựu rực rỡ.",
      keyword: "clock time focus productivity golden light",
      prompt: "golden pocket watch and focused workspace with glowing inspiration"
    },
    {
      narration: "Hãy dũng cảm bước về phía trước và hành động quyết liệt ngay bây giờ, vì thời điểm hoàn hảo nhất chính là giây phút này!",
      keyword: "victory celebration success golden rays confetti",
      prompt: "epic victory moment with golden light rays and confetti celebration"
    }
  ]
};

const TRANSITIONS: TransitionType[] = ['fade', 'zoom_in', 'slide_left', 'zoom_out'];
const KEN_BURNS_EFFECTS: KenBurnsEffect[] = ['zoom_in', 'pan_left', 'zoom_out', 'pan_right', 'subtle_float'];

/**
 * Tạo kịch bản hoàn chỉnh bằng OpenAI hoặc Gemini hoặc Builtin Template
 */
export async function generateAiScript(
  params: ScriptGenerationParams
): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const {
    topic,
    niche = 'science',
    sceneCount = 4,
    provider = 'openai',
    apiKey = DEFAULT_OPENAI_KEY,
    rawScriptInput,
    customTimestamps
  } = params;

  // 1. Sử dụng OpenAI nếu provider = 'openai' hoặc có apiKey OpenAI
  if (provider === 'openai' || (!params.provider && apiKey?.startsWith('sk-'))) {
    try {
      return await generateWithOpenAI({
        topic,
        rawScriptInput,
        customTimestamps,
        sceneCount,
        apiKey: apiKey || DEFAULT_OPENAI_KEY
      });
    } catch (e: any) {
      console.warn('OpenAI generation failed, fallback to Gemini / Template:', e);
    }
  }

  // 2. Sử dụng Gemini nếu provider = 'gemini'
  if (provider === 'gemini' && apiKey && !apiKey.startsWith('sk-')) {
    try {
      return await generateWithGemini(topic, sceneCount, apiKey);
    } catch (e) {
      console.warn('Gemini generation failed, falling back to smart template:', e);
    }
  }

  // 3. Fallback: Smart Built-in Template Generator based on Topic & Niche
  const selectedTemplate = TEMPLATE_SCRIPTS[niche] || TEMPLATE_SCRIPTS.science;
  const scenes: Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const templateItem = selectedTemplate[i % selectedTemplate.length];
    const narration = topic ? `${templateItem.narration}` : templateItem.narration;

    scenes.push({
      id: `scene-${Date.now()}-${i + 1}`,
      order: i + 1,
      narration: narration,
      searchKeyword: templateItem.keyword,
      imagePrompt: templateItem.prompt,
      mediaType: i % 2 === 0 ? 'video' : 'image',
      mediaUrl: '',
      transition: TRANSITIONS[i % TRANSITIONS.length],
      kenBurns: KEN_BURNS_EFFECTS[i % KEN_BURNS_EFFECTS.length]
    });
  }

  return scenes;
}

/**
 * Sinh kịch bản và phân đoạn chính xác theo giây với OpenAI API
 */
export async function generateWithOpenAI(params: {
  topic: string;
  rawScriptInput?: string;
  customTimestamps?: string;
  sceneCount?: number;
  apiKey: string;
  model?: string;
}): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const { topic, rawScriptInput, customTimestamps, sceneCount = 4, apiKey, model = 'gpt-4o-mini' } = params;

  let userContext = `Chủ đề video: "${topic || 'Tự động hóa video'}"`;
  if (rawScriptInput) {
    userContext += `\nNội dung kịch bản / nguồn do người dùng nhập:\n"""\n${rawScriptInput}\n"""`;
  }
  if (customTimestamps) {
    userContext += `\nCác mốc thời gian / giây cần tách thành từng phân đoạn:\n"""\n${customTimestamps}\n"""`;
  }

  const systemPrompt = `Bạn là đạo diễn và chuyên gia biên kịch video ngắn TikTok / Reels / Shorts chuyên nghiệp.
Nhiệm vụ của bạn là nhận nội dung kịch bản / chủ đề hoặc các mốc giây tách phân cảnh do người dùng cung cấp, sau đó phân tích và chia thành từng phân cảnh (scenes) tối ưu nhất.

QUY TẮC CỐT LÕI:
1. Nếu người dùng có đưa các mốc giây (ví dụ: "0:00 - 0:15: Căn phòng khách", "0:15 - 0:30: Ban công"), hãy chia đúng theo số phân đoạn và mốc thời gian đó, tính toán "videoStartOffset" và "videoEndOffset" tương ứng.
2. Nếu không có mốc giây cụ thể, hãy tự động tạo ra khoảng ${sceneCount} phân cảnh mạch lạc, hấp dẫn, mỗi phân cảnh có câu lồng tiếng tiếng Việt tự nhiên, truyền cảm (độ dài 20 - 45 từ).
3. Cho mỗi phân cảnh:
   - "narration": Câu lồng tiếng tiếng Việt hoàn chỉnh, sinh động.
   - "searchKeyword": Từ khóa tiếng Anh tìm video B-roll / Stock tương ứng trên Pexels/Web.
   - "imagePrompt": Prompt tiếng Anh chi tiết tạo ảnh photorealistic 8k nếu dùng AI image.
   - "cutAction": Ghi chú hướng dẫn góc máy hoặc đoạn cần cắt trong video (ví dụ: "Cắt đoạn quay chậm toàn cảnh phòng khách").
   - "sourceName": Gợi ý source video cần dùng nếu có.
   - "videoStartOffset": Giây bắt đầu (nếu xác định được từ input, mặc định 0).
   - "videoEndOffset": Giây kết thúc (nếu xác định được).
   - "mediaType": "video" hoặc "image".
   - "transition": một trong các giá trị ["fade", "zoom_in", "slide_left", "slide_right", "zoom_out", "whip_pan"].
   - "kenBurns": một trong các giá trị ["zoom_in", "pan_left", "zoom_out", "pan_right", "subtle_float"].

TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON THUẦN TÚY (mảng JSON, không markdown, không giải thích thêm):
[
  {
    "order": 1,
    "narration": "...",
    "searchKeyword": "...",
    "imagePrompt": "...",
    "cutAction": "...",
    "videoStartOffset": 0,
    "videoEndOffset": 10,
    "mediaType": "video",
    "transition": "fade",
    "kenBurns": "zoom_in"
  }
]`;

  const modelsToTry = [model, 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
  let parsed: any = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        let clean = content.trim();
        const jsonObj = JSON.parse(clean);
        if (Array.isArray(jsonObj)) {
          parsed = jsonObj;
        } else if (Array.isArray(jsonObj.scenes)) {
          parsed = jsonObj.scenes;
        } else if (Array.isArray(jsonObj.segments)) {
          parsed = jsonObj.segments;
        } else {
          const firstArray = Object.values(jsonObj).find((v) => Array.isArray(v));
          if (firstArray) parsed = firstArray;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          break;
        }
      }
    } catch (err: any) {
      console.warn(`OpenAI call with model ${currentModel} failed:`, err?.response?.data || err.message);
    }
  }

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Không nhận được kịch bản hợp lệ từ OpenAI');
  }

  return parsed.map((s: any, idx: number) => ({
    id: `scene-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    narration: s.narration || '',
    searchKeyword: s.searchKeyword || topic,
    imagePrompt: s.imagePrompt || topic,
    cutAction: s.cutAction || '',
    sourceName: s.sourceName || '',
    videoStartOffset: typeof s.videoStartOffset === 'number' ? s.videoStartOffset : undefined,
    videoEndOffset: typeof s.videoEndOffset === 'number' ? s.videoEndOffset : undefined,
    mediaType: s.mediaType === 'video' ? 'video' : 'image',
    mediaUrl: '',
    transition: s.transition || TRANSITIONS[idx % TRANSITIONS.length],
    kenBurns: s.kenBurns || KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
  }));
}

/**
 * Tự động tạo âm thanh giọng đọc AI (EdgeTTS hoặc OpenAI Audio Speech) cho toàn bộ danh sách Scenes
 */
export async function autoSynthesizeScenesVoice(
  scenes: Scene[],
  voiceName: string = 'vi-VN-HoaiMyNeural',
  rate: string = '+0%',
  pitch: string = '+0Hz',
  onProgress?: (index: number, total: number) => void
): Promise<Scene[]> {
  const updatedScenes = [...scenes];

  for (let i = 0; i < updatedScenes.length; i++) {
    const scene = updatedScenes[i];
    if (scene.narration && (!scene.audioUrl || scene.audioUrl.length === 0)) {
      try {
        if (onProgress) onProgress(i + 1, updatedScenes.length);
        const res = await synthesizeEdgeTTS(scene.narration, voiceName, rate, pitch);
        if (res && res.audioUrl) {
          updatedScenes[i] = {
            ...scene,
            audioUrl: res.audioUrl,
            audioDuration: res.duration || 4.0,
            words: res.words && res.words.length > 0 ? res.words : scene.words || []
          };
        }
      } catch (e) {
        console.warn(`Failed to synthesize voice for scene ${i + 1}`, e);
      }
    }
  }

  return updatedScenes;
}

async function generateWithGemini(
  topic: string,
  count: number,
  apiKey: string
): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const prompt = `Bạn là đạo diễn và biên kịch video ngắn chuyên nghiệp cho nội dung kiến thức, tài chính, khoa học và tin tức.
Hãy tạo một kịch bản gồm chính xác ${count} phân cảnh (scenes) cho chủ đề: "${topic}".
Quy tắc:
- Mỗi phân cảnh có câu lồng tiếng tiếng Việt hoàn chỉnh, độ dài từ 25 - 40 từ (đọc trong khoảng 4 đến 6 giây).
- Ưu tiên từ khóa tìm kiếm B-roll video tiếng Anh chất lượng cao.
- Trả về đúng định dạng JSON thuần túy:
[
  {
    "order": 1,
    "narration": "Câu lồng tiếng hấp dẫn tiếng Việt truyền tải trọn vẹn 1 ý",
    "searchKeyword": "English keyword for b-roll stock video footage",
    "imagePrompt": "Detailed English prompt for AI photorealistic image generation",
    "mediaType": "video",
    "transition": "fade",
    "kenBurns": "zoom_in"
  }
]`;

  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp'
  ];

  const apiVersions = ['v1beta', 'v1'];
  let parsed: any = null;

  for (const model of candidateModels) {
    for (const apiVer of apiVersions) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7
            }
          },
          { timeout: 25000 }
        );

        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          text = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
          parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            break;
          }
        }
      } catch {
        // Thử tiếp
      }
    }
    if (parsed) break;
  }

  if (!parsed || !Array.isArray(parsed)) throw new Error('No valid content returned from Gemini');

  return parsed.map((s: any, idx: number) => ({
    id: `scene-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    narration: s.narration || '',
    searchKeyword: s.searchKeyword || topic,
    imagePrompt: s.imagePrompt || topic,
    mediaType: s.mediaType === 'video' ? 'video' : 'image',
    mediaUrl: '',
    transition: s.transition || TRANSITIONS[idx % TRANSITIONS.length],
    kenBurns: s.kenBurns || KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
  }));
}
