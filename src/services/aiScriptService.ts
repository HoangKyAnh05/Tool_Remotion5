import axios from 'axios';
import { Scene, AspectRatio, TransitionType, KenBurnsEffect, WordTimestamp } from '../types/video';
import { synthesizeEdgeTTS } from './edgeTtsService';
import { generateTextWithGeminiWeb, extractJsonFromAiResponse } from './geminiWebService';

export const DEFAULT_GEMINI_KEY = '';
export const DEFAULT_OPENAI_KEY = '';

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

export interface ParsedTimeRange {
  order: number;
  start: number;
  end: number;
  duration: number;
  description?: string;
}

/**
 * Chuyển đổi chuỗi thời gian (vd: "0:15", "1:30", "5.4s", "5.4", "0:05.4") thành giây (số thực)
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace(/s$/i, '').trim();
  if (clean.includes(':')) {
    const parts = clean.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 2) {
      return Number((parts[0] * 60 + parts[1]).toFixed(2));
    } else if (parts.length === 3) {
      return Number((parts[0] * 3600 + parts[1] * 60 + parts[2]).toFixed(2));
    }
  }
  return Number((parseFloat(clean) || 0).toFixed(2));
}

/**
 * Format số giây thành chuỗi thời gian hiển thị gọn gàng và chuẩn xác (ví dụ: 0 -> "00:00", 3.5 -> "00:03.5", 7 -> "00:07", 65.2 -> "01:05.2")
 */
export function formatSecondsToTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Number((seconds % 60).toFixed(2));
  const mStr = m.toString().padStart(2, '0');
  if (s % 1 === 0) {
    return `${mStr}:${Math.floor(s).toString().padStart(2, '0')}`;
  }
  const intPart = Math.floor(s).toString().padStart(2, '0');
  const fracPart = (s % 1).toFixed(1).substring(2);
  return `${mStr}:${intPart}.${fracPart}`;
}

/**
 * Trích xuất danh sách các mô tả phân cảnh từ văn bản nhiều dòng
 */
export function extractDescriptionsFromMultiLineText(text: string): string[] {
  if (!text || !text.trim()) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const descriptions: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[:|-]?\s*(.*)$/);
    if (match && match[3]?.trim()) {
      descriptions.push(match[3].trim());
    } else {
      const cleanLine = line.replace(/^\d+[\.\:\-\)]\s*/, '').trim();
      if (cleanLine) descriptions.push(cleanLine);
    }
  }

  return descriptions;
}

/**
 * Trích xuất danh sách các mốc giây bắt đầu phân cảnh mới từ chuỗi nhiều dòng (để đồng bộ vào ô nhập nhanh)
 */
export function extractSplitPointsFromMultiLineText(text: string): { points: number[]; quickString: string } {
  if (!text || !text.trim()) return { points: [], quickString: '' };
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const points: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)/);
    if (match) {
      const start = parseTimeToSeconds(match[1]);
      const end = parseTimeToSeconds(match[2]);
      if (i > 0 && start > 0) {
        points.push(start);
      } else if (i === 0 && end > 0 && lines.length > 1) {
        points.push(end);
      }
    }
  }

  const sortedPoints = Array.from(new Set(points)).sort((a, b) => a - b);
  const quickString = sortedPoints.map((p) => `${p}s`).join(', ');
  return { points: sortedPoints, quickString };
}

/**
 * Phân tích danh sách các mốc giây bắt đầu phân cảnh mới do người dùng nhập
 * Ví dụ: "5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s" hoặc "3.5s, 7.0s, 10.5s, 14.0s, 18.0s"
 * - Cảnh 1 bắt đầu tại 0s, kết thúc tại 3.5s (thời lượng 3.5s)
 * - Cảnh 2 bắt đầu tại 3.5s, kết thúc tại 7.0s (thời lượng 3.5s)
 * - Cảnh 3 bắt đầu tại 7.0s, kết thúc tại 10.5s (thời lượng 3.5s)
 * - Cảnh 4 bắt đầu tại 10.5s, kết thúc tại 14.0s (thời lượng 3.5s)
 * - Cảnh 5 bắt đầu tại 14.0s, kết thúc tại 18.0s (thời lượng 4.0s)
 * - Cảnh 6 (cuối cùng) bắt đầu tại 18.0s, kết thúc tại 22.5s (thời lượng 4.5s)
 */
export function parseSplitPointsToRanges(
  input: string,
  options?: { lastSceneDuration?: number; topic?: string; customSources?: string[] }
): ParsedTimeRange[] {
  if (!input || !input.trim()) return [];

  // Tách chuỗi theo dấu phẩy, chấm phẩy, khoảng trắng, xuống dòng
  const rawTokens = input
    .replace(/[\[\]]/g, ' ')
    .split(/[,;\n|\s]+/)
    .map((t) => t.trim().replace(/s$/i, '').trim())
    .filter(Boolean);

  const points: number[] = [];
  for (const token of rawTokens) {
    const sec = parseTimeToSeconds(token);
    if (!isNaN(sec) && sec > 0) {
      points.push(sec);
    }
  }

  // Sắp xếp tăng dần và loại bỏ trùng lặp
  const sortedPoints = Array.from(new Set(points)).sort((a, b) => a - b);
  if (sortedPoints.length === 0) return [];

  const ranges: ParsedTimeRange[] = [];
  let prev = 0;
  const sources = options?.customSources || [];

  for (let i = 0; i < sortedPoints.length; i++) {
    const pt = sortedPoints[i];
    if (pt > prev) {
      const order = ranges.length + 1;
      const desc = sources[order - 1] || '';
      ranges.push({
        order,
        start: prev,
        end: pt,
        duration: Number((pt - prev).toFixed(2)),
        description: desc
      });
      prev = pt;
    }
  }

  // Phân cảnh cuối cùng tiếp nối sau mốc cắt cuối
  const lastDur = options?.lastSceneDuration || 4.5;
  const lastEnd = Number((prev + lastDur).toFixed(2));
  const lastOrder = ranges.length + 1;
  const lastDesc = sources[lastOrder - 1] || '';
  ranges.push({
    order: lastOrder,
    start: prev,
    end: lastEnd,
    duration: lastDur,
    description: lastDesc
  });

  return ranges;
}

/**
 * Format danh sách phân đoạn thành chuỗi văn bản mốc thời gian nhiều dòng chuẩn
 */
export function formatSplitRangesToTimestamps(ranges: ParsedTimeRange[], topic?: string): string {
  return ranges
    .map((r, idx) => {
      const sStr = formatSecondsToTime(r.start);
      const eStr = formatSecondsToTime(r.end);
      const title = r.description || getDomainStageTitle(topic || '', idx, ranges.length);
      return `${sStr} - ${eStr}: ${title}`;
    })
    .join('\n');
}

/**
 * Phân tích tổng quát mọi chuỗi mốc thời gian do người dùng nhập (chuỗi số rời rạc hoặc dạng multi-line range)
 */
export function parseCustomTimestampsToRanges(input: string, topic?: string): ParsedTimeRange[] {
  if (!input || !input.trim()) return [];
  const clean = input.trim();

  // 1. Kiểm tra xem có phải định dạng nhiều dòng chứa dấu gạch ngang (0:00 - 0:10: ...) không
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const isMultiLineRange = lines.some((l) => /[-–—]/.test(l));

  if (isMultiLineRange) {
    const ranges: ParsedTimeRange[] = [];
    lines.forEach((line, idx) => {
      const match = line.match(/^(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[:|-]?\s*(.*)$/);
      if (match) {
        const start = parseTimeToSeconds(match[1]);
        const end = parseTimeToSeconds(match[2]);
        const rawDesc = match[3]?.trim() || '';
        ranges.push({
          order: idx + 1,
          start,
          end,
          duration: Number(Math.max(0.1, end - start).toFixed(2)),
          description: rawDesc
        });
      }
    });
    if (ranges.length > 0) return ranges;
  }

  // 2. Nếu là chuỗi đơn các số ngăn cách bằng dấu phẩy / khoảng trắng (ví dụ: 5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s)
  return parseSplitPointsToRanges(clean, { topic });
}

/**
 * Làm sạch mô tả phân đoạn, loại bỏ mốc thời gian thừa (ví dụ: "00:00.0 - 00:10.0: Độ giàu" -> "Độ giàu")
 */
function cleanSegmentDescription(desc: string): string {
  if (!desc) return '';
  return desc
    .replace(/^(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[-–—]\s*(\d+:\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*[:|-]?\s*/i, '')
    .replace(/^[0-9\.\:\-\)\s]+/, '')
    .trim();
}

/**
 * Bóc tách và phân tích ngữ nghĩa sâu cho MỌI chủ đề người dùng nhập (không dùng câu mẫu chung chung)
 */
function buildContextualNarration(
  topic: string,
  desc: string,
  sceneIndex: number,
  totalScenes: number,
  durationSec: number
): { narration: string; searchKeyword: string; imagePrompt: string } {
  const cleanTopic = (topic || 'Khám phá video').trim();
  const rawClean = cleanSegmentDescription(desc);
  const subDesc =
    rawClean ||
    (sceneIndex === 0
      ? 'Giới thiệu & Mở đầu'
      : sceneIndex === totalScenes - 1
      ? 'Tổng kết & Lời kết'
      : `Phân cảnh ${sceneIndex + 1}`);

  const tLower = cleanTopic.toLowerCase();
  const dLower = subDesc.toLowerCase();

  // 1. Phân loại cấu trúc và ý định của tiêu đề (Intent Recognition)
  const isDanceMusicTrend = /nhảy|vũ đạo|dance|nhạc trend|douyin|tiktok|quẩy|trend|âm nhạc|kpop|vpop|remix|nhạc trẻ|vũ điệu|bài hát|dancer/i.test(tLower) || /nhảy|vũ đạo|dance|nhạc|douyin|tiktok/i.test(dLower);
  const isSportsOrBadminton = /cầu lông|badminton|tennis|pickleball|bóng đá|bóng bàn|thể thao|giao lưu|đơn và đôi|đánh đơn|đánh đôi|trận đấu|kèo|sân|sĩ quan|quân đội|smash|đập cầu|vợt/i.test(tLower) || /cầu lông|smash|đập cầu|sân|thể thao/i.test(dLower);
  const isComparison = /so sánh|đối đầu|\bvs\b|versus|khác biệt giữa|cuộc chiến|phân biệt/i.test(tLower);
  const isTopList = /top\s*\d+|\d+\s*(cách|điều|mẹo|bí mật|lý do|sai lầm|bước|nguyên tắc|cuốn sách|thói quen|bài học)/i.test(tLower);
  const isHowTo = /cách|hướng dẫn|làm sao|bí quyết|mẹo|phương pháp|các bước|quy trình|tự làm|học cách|làm bánh|pha chế/i.test(tLower);
  const isReview = /review|đánh giá|trải nghiệm|trên tay|mở hộp|dùng thử|cảm nhận|thực tế|sau \d+/i.test(tLower);
  const isWhy = /tại sao|vì sao|lý do|nguyên nhân|sự thật|bí mật đằng sau|nguồn gốc|giải mã/i.test(tLower);
  const isHistoryOrMystery = /lịch sử|chiến tranh|thời kỳ|bí ẩn|kỳ lạ|thế giới|vũ trụ|người xưa|truyền thuyết|đế chế|khảo cổ|hố đen|thiên văn/i.test(tLower) || isWhy;
  const isFinanceMoney = /tiền|làm giàu|tài chính|thu nhập|kinh doanh|đầu tư|chứng khoán|bất động sản|triệu phú|tỷ phú|tiết kiệm|100 triệu|1 tỷ/i.test(tLower);
  const isFoodCooking = /ẩm thực|món ăn|nấu|cơm|phở|bún|bánh|đồ ăn|quán ăn|nhà hàng|thực khách|hương vị|chế biến|cà phê|trà/i.test(tLower);
  const isTechOrGadgets = /iphone|samsung|điện thoại|laptop|macbook|ai|trí tuệ nhân tạo|phần mềm|công nghệ|gpu|cpu|camera|xe điện|tesla|vinfast/i.test(tLower);
  const isTravelNature = /sapa|đà lạt|tam đảo|du lịch|travel|săn mây|view|homestay|resort|nghỉ dưỡng|check[- ]?in|núi|biển|phú quốc|hà giang/i.test(tLower);
  const isCelebrity = /elon musk|tim cook|bill gates|steve jobs|mark zuckerberg|ronaldo|messi|sơn tùng|jack|ông|bà|chủ tịch|ceo|tỷ phú/i.test(tLower) || (isComparison && /musk|cook|gates|jobs|ronaldo|messi/i.test(tLower));

  // 2. Phân tích vị trí phân cảnh
  const isHook = sceneIndex === 0 || /giới thiệu|mở đầu|hook|overview|bắt đầu|check[- ]?in/i.test(dLower);
  const isEnding = sceneIndex === totalScenes - 1 || /tổng kết|kết luận|kêu gọi|lời kết|kết thúc|tổng quan|kỷ niệm|outro/i.test(dLower);

  // Loại bỏ từ đầu thừa để câu văn mượt mà
  const displayTopic = cleanTopic
    .replace(/^(review|đánh giá|bí quyết|cách|hướng dẫn|top \d+|so sánh)\s+/i, '')
    .trim() || cleanTopic;

  let narration = '';
  let searchKeyword = `${cleanTopic} ${subDesc}`.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  let imagePrompt = `Cinematic photorealistic 8k video shot of ${cleanTopic}, focusing on ${subDesc}`;

  // =========================================================================
  // 0. NHÓM VŨ ĐẠO / NHẢY TREND / TIKTOK / DOUYIN (Viral Dance & Music)
  // =========================================================================
  if (isDanceMusicTrend) {
    if (isHook) {
      narration = `Dừng khoảng chừng là 2 giây! Anh em đã thử đu trend "${cleanTopic}" đang out trình càn quét Douyin và TikTok mấy ngày nay chưa? Quẩy cùng mình ngay nhé!`;
    } else if (isEnding) {
      narration = `Màn vũ đạo quá bá cháy và mãn nhãn đúng không mọi người? Thấy đỉnh nóc kịch trần thì nhớ bấm thả tim và follow để cùng team quẩy tiếp nha!`;
    } else if (sceneIndex === 1 || /bắt beat|vũ đạo|khởi động|vibe/i.test(dLower)) {
      narration = `Vũ đạo vừa dẻo vừa cuốn thế này thì 10 điểm không có nhưng! Team mình tập đu theo mà bật mood chill hết nấc, nhìn phát là nghiện liền!`;
    } else if (sceneIndex === 2 || /điệp khúc|drop|cao trào|xé gió/i.test(dLower)) {
      narration = `Đoạn này phải gọi là đỉnh nóc kịch trần! Từng cú drop chuẩn beat và động tác dứt khoát làm cả khung hình bùng nổ năng lượng, xem cuốn không thể rời mắt!`;
    } else if (sceneIndex === 3 || /biến hình|thần thái|visual/i.test(dLower)) {
      narration = `Thần thái ngút ngàn cùng visual sắc nét tạo nên điểm nhấn đắt giá nhất toàn bộ bài nhảy. Đẳng cấp khác bọt thực sự luôn anh em ơi!`;
    } else {
      narration = `Từng chuyển động nhịp nhàng theo giai điệu tại "${subDesc}": Thần thái cuốn hút và năng lượng tràn trề khiến người xem không thể rời mắt!`;
    }
  }

  // =========================================================================
  // A. NHÓM THỂ THAO / CẦU LÔNG / GIAO LƯU (Sports & Badminton Vlog)
  // =========================================================================
  else if (isSportsOrBadminton) {
    if (isHook) {
      narration = `Hôm nay mình có chuyến ghé thăm ${cleanTopic} để tham gia một buổi giao lưu cầu lông siêu hứa hẹn. Không khí ở đây cực kỳ nghiêm túc nhưng cũng đầy nhiệt huyết và rực lửa!`;
    } else if (isEnding) {
      narration = `Một trải nghiệm giao lưu quá tuyệt vời và đáng nhớ! Mọi người thấy pha cầu nào đỉnh chóp nhất, hãy thả tim và để lại bình luận bên dưới nhé!`;
    } else if (sceneIndex === 1 || /khởi động|không gian|chạm trán|sân bãi/i.test(dLower)) {
      narration = `Ngay vừa bước vào, mình đã có màn chạm trán cực kỳ ấn tượng với các tay vợt đẳng cấp. Nhìn những pha đập cầu xé gió và di chuyển linh hoạt này là biết trình độ out trình thế nào rồi đấy mọi người!`;
    } else if (sceneIndex === 2 || /trận đơn|tốc độ|kỹ thuật|smash/i.test(dLower)) {
      narration = `Bước vào trận đơn với tốc độ chóng mặt: Những cú smash dọc dây hiểm hóc và điều cầu tinh tế khiến đối thủ chỉ biết ngỡ ngàng đứng nhìn!`;
    } else if (sceneIndex === 3 || /trận đôi|phối hợp|bọc lót|lưới/i.test(dLower)) {
      narration = `Màn so tài đỉnh cao tiếp tục với trận đôi nảy lửa: Phối hợp bọc lót ăn ý 10 điểm không có nhưng, phản xạ trên lưới chớp nhoáng tạo nên những màn rượt đuổi tỷ số nghẹt thở!`;
    } else if (/bất ngờ|khoảnh khắc|quyết định|cao trào/i.test(dLower)) {
      narration = `Khoảnh khắc bất ngờ và đắt giá nhất chính là pha cứu cầu không tưởng, làm cả nhà thi đấu phải vỡ òa vì quá mãn nhãn!`;
    } else {
      narration = `Diễn biến trận đấu tại "${subDesc}" ngày càng kịch tính: Từng đường cầu chuẩn xác với khí thế hừng hực khiến người xem không thể rời mắt!`;
    }
  }

  // =========================================================================
  // B. NHÓM 1: TOP DANH SÁCH (Top List / Ranked)
  // =========================================================================
  else if (isTopList) {
    if (isHook) {
      narration = `Điểm danh ngay danh sách đắt giá nhất về "${cleanTopic}" mà bất cứ ai mê trải nghiệm cũng không nên bỏ lỡ! Cùng mình khám phá ngay nhé.`;
    } else if (isEnding) {
      narration = `Đó là trọn bộ danh sách đỉnh chóp về "${cleanTopic}". Anh em ấn tượng nhất với điều nào, hãy chia sẻ ngay bên dưới phần bình luận nhé!`;
    } else {
      narration = `Vị trí tiếp theo trong danh sách: Một điểm nhấn đắt giá mang lại góc nhìn sâu sắc và đẳng cấp khác bọt cho người xem.`;
    }
  }

  // =========================================================================
  // C. NHÓM 2: SO SÁNH / ĐỐI ĐẦU / NGƯỜI NỔI TIẾNG
  // =========================================================================
  else if (isComparison || isCelebrity) {
    if (isHook) {
      narration = `Đặt lên bàn cân đối đầu trực tiếp giữa "${cleanTopic}"! Trận chiến đỉnh cao giữa hai thế lực sừng sỏ xem bên nào sẽ thực sự out trình và chiếm ngôi vương!`;
    } else if (isEnding) {
      narration = `Cuộc so tài bất phân thắng bại! Theo quan điểm của anh em, bên nào đỉnh nóc kịch trần hơn, bình luận ngay để cùng tranh luận nhé!`;
    } else {
      if (/độ giàu|tài sản|tiền|net worth|thu nhập/i.test(dLower)) {
        narration = `Về khối tài sản và tiềm lực tài chính: Sự chênh lệch đáng kinh ngạc giữa các nguồn thu nhập khủng, cổ phiếu tập đoàn và những thương vụ đầu tư bạc tỷ của đôi bên.`;
      } else if (/tuổi|năm sinh|thế hệ|độ tuổi/i.test(dLower)) {
        narration = `Về độ tuổi và phong cách thế hệ: Sự kết hợp giữa bề dày kinh nghiệm thực chiến và tư duy đổi mới bùng nổ định hình nên bản sắc lãnh đạo rất riêng.`;
      } else if (/quê quán|xuất thân|nơi sinh|nguồn gốc|quốc tịch/i.test(dLower)) {
        narration = `Về quê quán và xuất phát điểm ban đầu: Môi trường tôi luyện từ sớm đã định hình nên ý chí kiên định cùng tầm nhìn chiến lược vươn tầm toàn cầu.`;
      } else {
        narration = `Xét riêng về khía cạnh "${subDesc}" trong "${cleanTopic}": Đây chính là yếu tố then chốt tạo nên sự khác biệt hoàn toàn và làm nổi bật phong cách của từng bên.`;
      }
    }
  }

  // =========================================================================
  // D. NHÓM 3: REVIEW / ĐÁNH GIÁ / CÔNG NGHỆ
  // =========================================================================
  else if (isReview || isTechOrGadgets) {
    if (isHook) {
      narration = `Trên tay trải nghiệm thực tế "${cleanTopic}": Liệu siêu phẩm này có thực sự "đỉnh nóc kịch trần" như lời đồn hay chỉ là quảng cáo quá đà? Cùng mình kiểm chứng ngay!`;
    } else if (isEnding) {
      narration = `Tổng kết lại: "${cleanTopic}" thực sự là một món đầu tư quá hời trong phân khúc. Anh em chấm em này mấy điểm trên thang điểm 10?`;
    } else if (sceneIndex === 1 || /thiết kế|ngoại hình|cầm nắm/i.test(dLower)) {
      narration = `Cầm trên tay cảm giác đầu tiên là độ hoàn thiện cực kỳ xuất sắc, từng đường nét cao cấp, đầm tay và toát lên vẻ sang xịn mịn khó cưỡng!`;
    } else if (sceneIndex === 2 || /hiệu năng|tính năng|trải nghiệm/i.test(dLower)) {
      narration = `Những khám phá bất ngờ và các bằng chứng thực nghiệm đã làm thay đổi hoàn toàn cách chúng ta nhìn nhận về vấn đề này.`;
    } else {
      narration = `Lật mở từng chi tiết bí ẩn về "${subDesc}" trong "${cleanTopic}": Bức tranh toàn cảnh vô cùng hấp dẫn và đầy kịch tính.`;
    }
  }

  // =========================================================================
  // F. NHÓM ẨM THỰC / REVIEW QUÁN ĂN / BÁNH ĐA CUA / MÓN NGON
  // =========================================================================
  else if (isFoodCooking) {
    if (isHook) {
      narration = `Thèm một tô đồ ăn nóng hổi bùng nổ vị giác? Cùng mình ghé ngay "${cleanTopic}" để thẩm xem chất lượng có đỉnh chóp như lời đồn không nhé!`;
    } else if (isEnding) {
      narration = `Tổng kết lại: Món ăn tại "${cleanTopic}" thực sự 10 điểm không có nhưng! Anh em lưu ngay địa chỉ để rủ hội bạn thân cùng ghé thưởng thức nhé!`;
    } else if (sceneIndex === 1 || /không gian|quán|bàn ghế|menu|phục vụ/i.test(dLower)) {
      narration = `Không gian quán tấp nập khách ra vào, bàn ghế sạch sẽ tinh tươm cùng quầy nguyên liệu tươi rói nhìn thôi là đã thấy ứa nước miếng rồi!`;
    } else if (sceneIndex === 2 || /nước dùng|bốc khói|sợi|bánh đa|nồi/i.test(dLower)) {
      narration = `Điểm nhấn đắt giá nhất chính là nồi nước dùng sôi sục, bốc khói nghi ngút, thơm lừng vị cua đồng béo ngậy ngọt thanh tự nhiên!`;
    } else if (sceneIndex === 3 || /topping|chả|bề bề|thịt|cua|tôm|bò/i.test(dLower)) {
      narration = `Tô bưng ra đầy ắp topping ú nụ: Sợi bánh mềm dai, gạch cua béo ngậy kết hợp chả lá lốt thơm lừng và tóp mỡ giòn rụm khó cưỡng!`;
    } else if (sceneIndex === 4 || /thưởng thức|ăn|chấm|vị giác|cảm nhận/i.test(dLower)) {
      narration = `Gắp một đũa đầy ắp rồi xì xụp miếng nước dùng: Hương vị chua thanh cay nồng hòa quyện làm bùng nổ mọi giác quan, ăn một lần là nhớ mãi!`;
    } else {
      narration = `Trải nghiệm trọn vẹn từng chi tiết tại "${subDesc}" của "${cleanTopic}": Hương vị tinh túy và sự tỉ mỉ làm say lòng mọi thực khách sành ăn!`;
    }
  }

  // =========================================================================
  // G. NHÓM 7: DU LỊCH / NGHỈ DƯỠNG / HOMESTAY
  // =========================================================================
  else if (isTravelNature) {
    if (isHook) {
      narration = `Hòa mình vào không gian tuyệt mỹ và những trải nghiệm thư thái bất tận cùng "${cleanTopic}" – điểm đến lý tưởng để chữa lành tâm hồn!`;
    } else if (isEnding) {
      narration = `Hãy lên lịch trình ngay hôm nay để cùng người thân tận hưởng kỳ nghỉ đáng nhớ tại "${cleanTopic}". Đừng quên bấm theo dõi để khám phá thêm nhiều tọa độ du lịch hot!`;
    } else if (sceneIndex === 1 || /phòng|không gian|cảnh sắc/i.test(dLower)) {
      narration = `Thức giấc trong căn phòng gỗ ấm cúng, mở toang cánh cửa kính là trọn vẹn thung lũng mây mù huyền ảo ẩn hiện dưới ánh bình minh.`;
    } else if (sceneIndex === 2 || /ẩm thực|check[- ]?in|chill/i.test(dLower)) {
      narration = `Thưởng thức tách trà nóng bên ban công lộng gió, ngắm hoàng hôn buông xuống và quây quần bên bếp than hồng ấm cúng buổi tối.`;
    } else {
      narration = `Khám phá góc nhìn tuyệt đẹp về "${subDesc}" tại "${cleanTopic}": Nơi bạn được tận hưởng trọn vẹn sự bình yên và những khung hình triệu view.`;
    }
  }

  // =========================================================================
  // H. TẤT CẢ MỌI CHỦ ĐỀ KHÁC
  // =========================================================================
  else {
    if (isHook) {
      narration = `Bạn đã thực sự hiểu rõ toàn bộ câu chuyện và những bí mật hấp dẫn đằng sau "${cleanTopic}" chưa? Cùng khám phá ngay nhé!`;
    } else if (isEnding) {
      narration = `Đó là toàn bộ góc nhìn sâu sắc và giá trị nhất xoay quanh "${cleanTopic}". Hãy bấm theo dõi kênh và chia sẻ suy nghĩ của bạn bên dưới phần bình luận!`;
    } else if (sceneIndex === 1) {
      narration = `Khởi đầu với việc phân tích bối cảnh cốt lõi: Đây chính là mảnh ghép đầu tiên làm sáng tỏ toàn bộ ý nghĩa quan trọng của vấn đề.`;
    } else if (sceneIndex === 2) {
      narration = `Đi sâu vào những diễn biến bất ngờ và các chi tiết đắt giá, mang lại trải nghiệm đầy cuốn hút và mới lạ cho người xem.`;
    } else {
      narration = `Phân tích chuyên sâu về "${subDesc}" trong "${cleanTopic}": Điểm nhấn then chốt truyền tải thông điệp cốt lõi một cách trọn vẹn nhất.`;
    }
  }

  return { narration, searchKeyword, imagePrompt };
}

/**
 * Bộ tạo kịch bản thông minh từ mốc thời gian và chủ đề (hoạt động offline/không cần API key)
 */
// Tạo tiêu đề phân đoạn tiến trình thông minh theo từng thể loại
export function getDomainStageTitle(topic: string, idx: number, total: number): string {
  const tLower = (topic || '').toLowerCase();
  if (idx === 0) return 'Giới thiệu & Hook mở đầu';
  if (idx === total - 1) return 'Tổng kết & Kêu gọi hành động';

  if (/nhảy|vũ đạo|dance|nhạc trend|douyin|tiktok|quẩy|trend|âm nhạc|kpop|vpop/i.test(tLower)) {
    if (idx === 0) return 'Hook Mở Đầu & Giật Trend';
    if (idx === 1) return 'Vũ Đạo Cuốn Hút & Bắt Beat';
    if (idx === 2) return 'Điệp Khúc Cao Trào & Drop Nhạc';
    if (idx === 3) return 'Biến Hình & Thần Thái Ngút Ngàn';
    if (idx === total - 1) return 'Pose Kết Bài & Thả Tim';
    return `Vũ đạo bùng nổ phân cảnh ${idx + 1}`;
  }
  if (/so sánh|đối đầu|vs|versus/i.test(tLower)) {
    if (idx === 1) return 'So sánh Ngoại hình & Thông số';
    if (idx === 2) return 'So sánh Trải nghiệm & Hiệu năng thực tế';
    return 'So sánh Giá trị & Độ phù hợp';
  }
  if (/cầu lông|tennis|pickleball|bóng đá|bóng bàn|thể thao|giao lưu|đơn và đôi|đánh đơn|đánh đôi|trận đấu|kèo|sĩ quan|quân đội/i.test(tLower)) {
    if (idx === 0) return 'Check-in & Khí thế mở đầu';
    if (idx === 1) return 'Không gian sân & Khởi động tác phong';
    if (idx === 2) return 'Trận đơn: Tốc độ & Kỹ thuật';
    if (idx === 3) return 'Trận đôi: Phối hợp & Bọc lót';
    if (idx === 4) return 'Điểm quyết định & Tinh thần thể thao';
    if (idx === total - 1) return 'Tổng kết & Giao lưu hậu trận';
    return `Pha bóng kịch tính phân cảnh ${idx + 1}`;
  }
  if (/cách|hướng dẫn|làm sao|bí quyết|mẹo|tự làm/i.test(tLower)) {
    if (idx === 1) return 'Chuẩn bị & Bước nền tảng cốt lõi';
    if (idx === 2) return 'Thực hành & Kỹ thuật tăng tốc';
    return 'Bí quyết tinh chỉnh & Tránh sai lầm';
  }
  if (/review|đánh giá|trải nghiệm|trên tay/i.test(tLower)) {
    if (idx === 1) return 'Thiết kế & Cảm giác cầm nắm thực tế';
    if (idx === 2) return 'Hiệu năng & Trải nghiệm tính năng nổi bật';
    return 'Ưu điểm & Nhược điểm cần cân nhắc';
  }
  if (/tiền|làm giàu|tài chính|kinh doanh|đầu tư/i.test(tLower)) {
    if (idx === 1) return 'Tư duy tạo dòng tiền bền vững';
    if (idx === 2) return 'Chiến lược đòn bẩy & Nhân bản tài sản';
    return 'Quản trị rủi ro & Tối ưu hóa lợi nhuận';
  }
  if (/ẩm thực|món ăn|nấu|cơm|phở|bánh|quán ăn|bánh đa|ăn uống|lẩu|nướng/i.test(tLower)) {
    if (idx === 0) return 'Check-in & Khám phá quán ăn';
    if (idx === 1) return 'Không gian quán & Quầy nguyên liệu';
    if (idx === 2) return 'Cận cảnh nồi nước dùng đậm đà';
    if (idx === 3) return 'Topping đầy ắp & Gạch cua béo ngậy';
    if (idx === 4) return 'Thưởng thức & Bùng nổ vị giác';
    if (idx === total - 1) return 'Đánh giá chất lượng & Lời kết';
    return `Món ngon hấp dẫn phân cảnh ${idx + 1}`;
  }
  if (/sapa|đà lạt|tam đảo|du lịch|travel|homestay/i.test(tLower)) {
    if (idx === 1) return 'Không gian phòng nghỉ & Cảnh sắc thiên nhiên';
    if (idx === 2) return 'Góc check-in triệu view & Trải nghiệm chill';
    return 'Thưởng thức ẩm thực & Tận hưởng kỳ nghỉ';
  }
  if (/lịch sử|chiến tranh|bí ẩn|vũ trụ|khoa học/i.test(tLower)) {
    if (idx === 1) return 'Bối cảnh lịch sử & Nguồn gốc xuất phát';
    if (idx === 2) return 'Diễn biến cao trào & Những bước ngoặt lớn';
    return 'Sự thật bất ngờ ít người biết';
  }

  if (idx === 1) return 'Khám phá chi tiết bối cảnh';
  if (idx === 2) return 'Điểm nhấn ấn tượng & Đột phá';
  return `Phân tích chuyên sâu phân cảnh ${idx + 1}`;
}

/**
 * Bộ tạo kịch bản thông minh từ mốc thời gian và chủ đề (hoạt động offline/không cần API key)
 */
export function generateSmartFallbackFromInput(params: {
  topic: string;
  rawScriptInput?: string;
  customTimestamps?: string;
  sceneCount?: number;
}): Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[] {
  const { topic = 'Video clip tổng hợp', rawScriptInput, customTimestamps, sceneCount = 4 } = params;

  // 1. Phân tích các dòng mốc thời gian / danh sách điểm cắt nếu người dùng có nhập
  if (customTimestamps && customTimestamps.trim()) {
    const parsedRanges = parseCustomTimestampsToRanges(customTimestamps, topic);
    if (parsedRanges.length > 0) {
      const parsedScenes: Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[] = [];
      const totalRanges = parsedRanges.length;

      for (let idx = 0; idx < totalRanges; idx++) {
        const r = parsedRanges[idx];
        const stageFallback = getDomainStageTitle(topic, idx, totalRanges);
        const desc = r.description && r.description !== ':' && !/^phân đoạn \d+$/i.test(r.description) ? r.description : stageFallback;
        const durationSec = Math.max(1, r.duration);

        const { narration, searchKeyword, imagePrompt } = buildContextualNarration(
          topic,
          desc,
          idx,
          totalRanges,
          durationSec
        );

        parsedScenes.push({
          id: `scene-${Date.now()}-${idx + 1}`,
          order: idx + 1,
          narration,
          searchKeyword,
          imagePrompt,
          cutAction: desc ? `Clip #${idx + 1}: ${desc}` : `Cắt đoạn từ ${r.start}s đến ${r.end}s`,
          sourceName: '',
          videoStartOffset: r.start,
          videoEndOffset: r.end,
          mediaType: 'video',
          mediaUrl: '',
          transition: TRANSITIONS[idx % TRANSITIONS.length],
          kenBurns: KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
        });
      }

      if (parsedScenes.length > 0) return parsedScenes;
    }
  }

  const effectiveCount = Math.max(1, sceneCount || 4);

  // 2. Phân tích kịch bản thô (rawScriptInput)
  if (rawScriptInput && rawScriptInput.trim()) {
    const rawSentences = rawScriptInput
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (rawSentences.length > 0) {
      return rawSentences.slice(0, 10).map((sentence, idx) => ({
        id: `scene-${Date.now()}-${idx + 1}`,
        order: idx + 1,
        narration: sentence,
        searchKeyword: `${topic} ${sentence.slice(0, 20)}`.replace(/[^a-zA-Z0-9\s]/g, ' ').trim(),
        imagePrompt: `Cinematic documentary shot for ${topic} portraying "${sentence.slice(0, 30)}", photorealistic 8k`,
        cutAction: `Phân cảnh #${idx + 1}`,
        sourceName: '',
        videoStartOffset: idx * 8,
        videoEndOffset: (idx + 1) * 8,
        mediaType: 'video',
        mediaUrl: '',
        transition: TRANSITIONS[idx % TRANSITIONS.length],
        kenBurns: KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
      }));
    }
  }

  // 3. Fallback mặc định theo sceneCount với lời dẫn ngữ nghĩa sinh động
  const defaultScenes: Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[] = [];

  for (let i = 0; i < effectiveCount; i++) {
    const stageTitle = getDomainStageTitle(topic, i, effectiveCount);

    const { narration, searchKeyword, imagePrompt } = buildContextualNarration(
      topic,
      stageTitle,
      i,
      effectiveCount,
      10
    );

    defaultScenes.push({
      id: `scene-${Date.now()}-${i + 1}`,
      order: i + 1,
      narration,
      searchKeyword,
      imagePrompt,
      cutAction: `Clip #${i + 1}: ${stageTitle}`,
      sourceName: '',
      videoStartOffset: i * 10,
      videoEndOffset: (i + 1) * 10,
      mediaType: 'video',
      mediaUrl: '',
      transition: TRANSITIONS[i % TRANSITIONS.length],
      kenBurns: KEN_BURNS_EFFECTS[i % KEN_BURNS_EFFECTS.length]
    });
  }

  return defaultScenes;
}

/**
 * Sinh kịch bản và phân đoạn chính xác theo giây với OpenAI API (hỗ trợ tự động fallback nếu API lỗi/hết quota)
 */
export async function generateWithOpenAI(params: {
  topic: string;
  rawScriptInput?: string;
  customTimestamps?: string;
  sceneCount?: number;
  apiKey?: string;
  model?: string;
}): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const { topic, rawScriptInput, customTimestamps, sceneCount = 4, apiKey = '', model = 'gpt-4o-mini' } = params;
  const cleanKey = apiKey.trim();

  // 1. Nếu là Google Gemini API Key (hoặc key không phải sk- của OpenAI)
  if (cleanKey.startsWith('AIzaSy') || cleanKey.startsWith('AQ.') || (!cleanKey.startsWith('sk-') && cleanKey.length > 15)) {
    try {
      return await generateWithGemini(topic, sceneCount, cleanKey, rawScriptInput, customTimestamps);
    } catch (e) {
      console.warn('Gemini generation failed:', e);
    }
  }

  // 2. Nếu không có OpenAI API Key hoặc key không hợp lệ, dùng Smart Semantic Fallback
  if (!cleanKey || !cleanKey.startsWith('sk-')) {
    return generateSmartFallbackFromInput({
      topic,
      rawScriptInput,
      customTimestamps,
      sceneCount
    });
  }

  let userContext = `Chủ đề video: "${topic || 'Tự động hóa video'}"`;
  if (rawScriptInput) {
    userContext += `\nNội dung kịch bản / nguồn do người dùng nhập:\n"""\n${rawScriptInput}\n"""`;
  }
  if (customTimestamps) {
    userContext += `\nCác mốc thời gian / giây cần tách thành từng phân đoạn:\n"""\n${customTimestamps}\n"""`;
  }

  const systemPrompt = `Bạn là Đạo diễn kiêm Nhà sáng tạo nội dung Video Ngắn Triệu View (TikTok / Reels / Shorts / YouTube) hàng đầu hiện nay.
Phong cách biên kịch của bạn: Cực kỳ trẻ trung, tràn đầy năng lượng, tự nhiên 100%, lôi cuốn và bắt trend Gen-Z nhạy bén, kể chuyện như một Vlogger / Reviewer thực chiến đang trực tiếp trải nghiệm và review chân thực cho người xem.

QUY TẮC CỐT LÕI ĐỂ LỜI DẪN (NARRATION) SIÊU HAY VÀ CUỐN HÚT:
1. Xưng hô tự nhiên, gần gũi: Dùng "mình", "anh em", "mọi người", "team mình" (Tuyệt đối KHÔNG dùng giọng thuyết minh khô khan, sáo rỗng kiểu bài văn mẫu).
2. Dùng từ ngữ sống động, hot trend giới trẻ theo đúng ngữ cảnh thực tế:
   - Thể thao / Vận động: "out trình", "đỉnh nóc kịch trần", "xé gió", "đẳng cấp khác bọt", "bá cháy", "10 điểm không có nhưng", "kèo căng cực", "nảy lửa", "cháy hết mình"...
   - Du lịch / Trải nghiệm / Homestay: "bật mood", "chill hết nấc", "quá xá đã", "đỉnh chóp", "săn mây triệu view", "chữa lành thực sự", "mê chữ ê kéo dài"...
   - Công nghệ / Review: "độ hoàn thiện sang xịn mịn", "mượt mà out trình", "đáng đồng tiền bát gạo", "trên tay kiểm chứng"...
   - Ẩm thực: "thơm ngon bá cháy", "nức mũi", "phát thèm", "ngon đỉnh chóp"...
3. Cấu trúc câu và nhịp điệu phân cảnh:
   - Cảnh 1 (Hook mở đầu): Phải giật hook cực mạnh trong 3s đầu, tạo cảm giác tò mò, háo hức, lôi cuốn ngay lập tức.
   - Các cảnh giữa (Thân bài): Mô tả hành động cụ thể, góc máy chân thực, nhịp điệu dồn dập, cảm xúc thật bám sát nội dung từng phân đoạn / source có sẵn.
   - Cảnh cuối (Kết bài): Lời kết tự nhiên, hào hứng, kêu gọi like / follow / bình luận một cách duyên dáng.
4. Căn chỉnh độ dài câu khớp với số giây của từng cảnh:
   - Cảnh ngắn (1s - 3s): Câu ngắn gọn, dứt khoát, đanh thép, năng lượng (10 - 20 từ).
   - Cảnh dài (4s - 10s): Câu diễn đạt trọn vẹn, có cao trào và nhịp thở (25 - 45 từ).
5. Cho mỗi phân cảnh:
   - "narration": Câu lồng tiếng tiếng Việt hoàn chỉnh, cực cuốn hút và tự nhiên.
   - "searchKeyword": Từ khóa tiếng Anh tìm video B-roll / Stock tương ứng trên Pexels/Web.
   - "imagePrompt": Prompt tiếng Anh chi tiết tạo ảnh photorealistic 8k nếu dùng AI image.
   - "cutAction": Ghi chú hướng dẫn góc máy hoặc đoạn cần cắt trong video.
   - "sourceName": Gợi ý source video cần dùng nếu có.
   - "videoStartOffset": Giây bắt đầu (nếu xác định được từ input, mặc định 0).
   - "videoEndOffset": Giây kết thúc (nếu xác định được).
   - "mediaType": "video" hoặc "image".
   - "transition": một trong các giá trị ["fade", "zoom_in", "slide_left", "slide_right", "zoom_out", "whip_pan"].
   - "kenBurns": một trong các giá trị ["zoom_in", "pan_left", "zoom_out", "pan_right", "subtle_float"].

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON VỚI TRƯỜNG "scenes":
{
  "scenes": [
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
  ]
}`;

  const modelsToTry = [model, 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
  let parsed: any = null;
  let lastErrorMessage = '';

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
            Authorization: `Bearer ${cleanKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
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
      lastErrorMessage = err?.response?.data?.error?.message || err?.message || 'Lỗi kết nối OpenAI';
      console.warn(`OpenAI call with model ${currentModel} failed:`, lastErrorMessage);
    }
  }

  // Nếu OpenAI trả về kết quả hợp lệ
  if (Array.isArray(parsed) && parsed.length > 0) {
    const parsedRanges = customTimestamps ? parseCustomTimestampsToRanges(customTimestamps, topic) : [];
    return parsed.map((s: any, idx: number) => {
      const matchedRange = parsedRanges[idx];
      const videoStartOffset = matchedRange ? matchedRange.start : (typeof s.videoStartOffset === 'number' ? s.videoStartOffset : idx * 10);
      const videoEndOffset = matchedRange ? matchedRange.end : (typeof s.videoEndOffset === 'number' ? s.videoEndOffset : (idx + 1) * 10);
      return {
        id: `scene-${Date.now()}-${idx + 1}`,
        order: idx + 1,
        narration: s.narration || '',
        searchKeyword: s.searchKeyword || topic,
        imagePrompt: s.imagePrompt || topic,
        cutAction: s.cutAction || (matchedRange ? `Clip #${idx + 1}: ${matchedRange.description || `Đoạn ${videoStartOffset}s - ${videoEndOffset}s`}` : ''),
        sourceName: s.sourceName || '',
        videoStartOffset,
        videoEndOffset,
        mediaType: s.mediaType === 'video' ? 'video' : 'image',
        mediaUrl: '',
        transition: s.transition || TRANSITIONS[idx % TRANSITIONS.length],
        kenBurns: s.kenBurns || KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
      };
    });
  }

  // Nếu OpenAI thất bại (ví dụ: hết quota, key không hợp lệ), tự động dùng Smart Fallback để không làm gián đoạn người dùng
  console.info(`OpenAI không phản hồi (${lastErrorMessage}). Đang tự động chuyển sang Smart Fallback Generator.`);
  return generateSmartFallbackFromInput({
    topic,
    rawScriptInput,
    customTimestamps,
    sceneCount
  });
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
  apiKey: string,
  rawScriptInput?: string,
  customTimestamps?: string
): Promise<Omit<Scene, 'audioUrl' | 'words' | 'audioDuration'>[]> {
  const cleanKey = apiKey.trim() || DEFAULT_GEMINI_KEY;
  const effectiveCount = Math.max(1, count || 4);

  let userContext = `Chủ đề: "${topic}"`;
  if (rawScriptInput) {
    userContext += `\nKịch bản nguồn:\n${rawScriptInput}`;
  }
  if (customTimestamps) {
    userContext += `\nCác mốc thời gian / giây cần chia:\n${customTimestamps}`;
  }

  const prompt = `Bạn là Đạo diễn kiêm Nhà sáng tạo nội dung Video Ngắn Triệu View (TikTok / Reels / Shorts / YouTube) hàng đầu hiện nay.
Phong cách biên kịch của bạn: Cực kỳ trẻ trung, tràn đầy năng lượng, tự nhiên 100%, lôi cuốn và bắt trend Gen-Z nhạy bén, kể chuyện như một Vlogger / Reviewer thực chiến đang trực tiếp trải nghiệm và review chân thực cho người xem.

QUY TẮC CỐT LÕI ĐỂ LỜI DẪN (NARRATION) SIÊU HAY VÀ CUỐN HÚT:
1. Xưng hô tự nhiên, gần gũi: Dùng "mình", "anh em", "mọi người", "team mình" (Tuyệt đối KHÔNG dùng giọng thuyết minh khô khan, sáo rỗng kiểu bài văn mẫu).
2. Dùng từ ngữ sống động, hot trend giới trẻ theo đúng ngữ cảnh thực tế:
   - Thể thao / Vận động: "out trình", "đỉnh nóc kịch trần", "xé gió", "đẳng cấp khác bọt", "bá cháy", "10 điểm không có nhưng", "kèo căng cực", "nảy lửa", "cháy hết mình"...
   - Du lịch / Trải nghiệm / Homestay: "bật mood", "chill hết nấc", "quá xá đã", "đỉnh chóp", "săn mây triệu view", "chữa lành thực sự", "mê chữ ê kéo dài"...
   - Công nghệ / Review: "độ hoàn thiện sang xịn mịn", "mượt mà out trình", "đáng đồng tiền bát gạo", "trên tay kiểm chứng"...
   - Ẩm thực: "thơm ngon bá cháy", "nức mũi", "phát thèm", "ngon đỉnh chóp"...
3. Cấu trúc câu và nhịp điệu phân cảnh:
   - Cảnh 1 (Hook mở đầu): Phải giật hook cực mạnh trong 3s đầu, tạo cảm giác tò mò, háo hức, lôi cuốn ngay lập tức.
   - Các cảnh giữa (Thân bài): Mô tả hành động cụ thể, góc máy chân thực, nhịp điệu dồn dập, cảm xúc thật bám sát nội dung từng phân đoạn / source có sẵn.
   - Cảnh cuối (Kết bài): Lời kết tự nhiên, hào hứng, kêu gọi like / follow / bình luận một cách duyên dáng.
4. Căn chỉnh độ dài câu khớp với số giây của từng cảnh:
   - Cảnh ngắn (1s - 3s): Câu ngắn gọn, dứt khoát, đanh thép, năng lượng (10 - 20 từ).
   - Cảnh dài (4s - 10s): Câu diễn đạt trọn vẹn, có cao trào và nhịp thở (25 - 45 từ).

YÊU CẦU BẮT BUỘC: Bạn PHẢI tạo ĐÚNG CHÍNH XÁC ${effectiveCount} phân cảnh (scenes).
(Nếu thông tin mốc thời gian hoặc kịch bản nguồn có ít hơn hoặc nhiều hơn ${effectiveCount} phân đoạn, hãy tự động mở rộng/chia nhỏ logic để đảm bảo danh sách trả về có ĐÚNG ${effectiveCount} phân cảnh).
${userContext}

Trả về đúng định dạng JSON thuần túy (mảng JSON gồm đúng ${effectiveCount} phần tử):
[
  {
    "order": 1,
    "narration": "Câu lồng tiếng tiếng Việt cực cuốn hút, đậm chất Gen-Z",
    "searchKeyword": "English keyword for stock footage",
    "imagePrompt": "Detailed prompt for AI image",
    "cutAction": "Phân đoạn 1",
    "videoStartOffset": 0,
    "videoEndOffset": 10,
    "mediaType": "video",
    "transition": "fade",
    "kenBurns": "zoom_in"
  }
]`;

  let parsed: any = null;
  let lastError = '';

  // 1. Thử gọi trực tiếp qua DeepSeek API (https://api.deepseek.com/chat/completions)
  if (cleanKey.startsWith('sk-') || cleanKey.length > 20) {
    for (const dModel of ['deepseek-chat', 'deepseek-reasoner']) {
      try {
        const dsRes = await axios.post(
          'https://api.deepseek.com/chat/completions',
          {
            model: dModel,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert AI video scriptwriter and director. Output ONLY a valid JSON array of scene objects, with no markdown code fences or explanatory text.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${cleanKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 25000
          }
        );

        const content = dsRes.data?.choices?.[0]?.message?.content;
        if (content) {
          const jsonVal = extractJsonFromAiResponse(content);
          if (Array.isArray(jsonVal)) {
            parsed = jsonVal;
          } else if (Array.isArray(jsonVal?.scenes)) {
            parsed = jsonVal.scenes;
          } else if (Array.isArray(jsonVal?.segments)) {
            parsed = jsonVal.segments;
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.response?.data?.error?.message || err?.message || '';
      }
    }
  }

  // 1.1 Thử gọi trực tiếp qua Groq API (Ưu tiên số 1 nếu có key gsk_ hoặc gọi qua engine)
  if (!parsed && (cleanKey.startsWith('gsk_') || cleanKey.length > 20)) {
    for (const model of ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert AI video scriptwriter and director. Output ONLY a valid JSON array of scene objects, with no markdown code fences or explanatory text.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${cleanKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );

        const content = groqRes.data?.choices?.[0]?.message?.content;
        if (content) {
          const jsonVal = extractJsonFromAiResponse(content);
          if (Array.isArray(jsonVal)) {
            parsed = jsonVal;
          } else if (Array.isArray(jsonVal?.scenes)) {
            parsed = jsonVal.scenes;
          } else if (Array.isArray(jsonVal?.segments)) {
            parsed = jsonVal.segments;
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            break;
          }
        }
      } catch (err: any) {
        lastError = err?.response?.data?.error?.message || err?.message || '';
      }
    }
  }

  // 2. Thử gọi qua Google Gemini API nếu người dùng có nhập key AIzaSy từ Google AI Studio
  if (!parsed && cleanKey.startsWith('AIzaSy')) {
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ];
    const apiVersions = ['v1beta', 'v1'];

    for (const model of candidateModels) {
      for (const apiVer of apiVersions) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${cleanKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7
              }
            },
            { timeout: 20000 }
          );

          let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const jsonVal = extractJsonFromAiResponse(text);
            if (Array.isArray(jsonVal)) {
              parsed = jsonVal;
            } else if (Array.isArray(jsonVal?.scenes)) {
              parsed = jsonVal.scenes;
            } else if (Array.isArray(jsonVal?.segments)) {
              parsed = jsonVal.segments;
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
              break;
            }
          }
        } catch (err: any) {
          lastError = err?.response?.data?.error?.message || err?.message || '';
        }
      }
      if (parsed) break;
    }
  }

  // 3. Sử dụng AI Web Engine (Groq / Electron IPC / Backend Proxy)
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    try {
      const webText = await generateTextWithGeminiWeb(prompt, { apiKey: cleanKey });
      if (webText) {
        const jsonVal = extractJsonFromAiResponse(webText);
        if (Array.isArray(jsonVal)) {
          parsed = jsonVal;
        } else if (Array.isArray(jsonVal?.scenes)) {
          parsed = jsonVal.scenes;
        } else if (Array.isArray(jsonVal?.segments)) {
          parsed = jsonVal.segments;
        }
      }
    } catch (webErr: any) {
      console.warn('AI Web fallback failed:', webErr);
      if (!lastError) lastError = webErr?.message || '';
    }
  }

  if (Array.isArray(parsed) && parsed.length > 0) {
    let finalScenes = [...parsed];

    // Bổ sung phân cảnh nếu AI sinh thiếu so với effectiveCount
    if (finalScenes.length < effectiveCount) {
      const missingCount = effectiveCount - finalScenes.length;
      for (let m = 0; m < missingCount; m++) {
        const insertIdx = finalScenes.length;
        const stageFallback = getDomainStageTitle(topic, insertIdx, effectiveCount);
        const { narration, searchKeyword, imagePrompt } = buildContextualNarration(
          topic,
          stageFallback,
          insertIdx,
          effectiveCount,
          10
        );
        const prevEnd = finalScenes[insertIdx - 1]?.videoEndOffset || insertIdx * 10;
        finalScenes.push({
          order: insertIdx + 1,
          narration,
          searchKeyword,
          imagePrompt,
          cutAction: `Clip #${insertIdx + 1}: ${stageFallback}`,
          videoStartOffset: prevEnd,
          videoEndOffset: prevEnd + 10,
          mediaType: 'video',
          transition: TRANSITIONS[insertIdx % TRANSITIONS.length],
          kenBurns: KEN_BURNS_EFFECTS[insertIdx % KEN_BURNS_EFFECTS.length]
        });
      }
    } else if (finalScenes.length > effectiveCount) {
      finalScenes = finalScenes.slice(0, effectiveCount);
    }

    const parsedRanges = customTimestamps ? parseCustomTimestampsToRanges(customTimestamps, topic) : [];
    return finalScenes.map((s: any, idx: number) => {
      const matchedRange = parsedRanges[idx];
      const videoStartOffset = matchedRange ? matchedRange.start : (typeof s.videoStartOffset === 'number' ? s.videoStartOffset : idx * 10);
      const videoEndOffset = matchedRange ? matchedRange.end : (typeof s.videoEndOffset === 'number' ? s.videoEndOffset : (idx + 1) * 10);
      return {
        id: `scene-${Date.now()}-${idx + 1}`,
        order: idx + 1,
        narration: s.narration || '',
        searchKeyword: s.searchKeyword || topic,
        imagePrompt: s.imagePrompt || topic,
        cutAction: s.cutAction || (matchedRange ? `Clip #${idx + 1}: ${matchedRange.description || `Đoạn ${videoStartOffset}s - ${videoEndOffset}s`}` : ''),
        sourceName: s.sourceName || '',
        videoStartOffset,
        videoEndOffset,
        mediaType: s.mediaType === 'video' ? 'video' : 'image',
        mediaUrl: '',
        transition: s.transition || TRANSITIONS[idx % TRANSITIONS.length],
        kenBurns: s.kenBurns || KEN_BURNS_EFFECTS[idx % KEN_BURNS_EFFECTS.length]
      };
    });
  }

  console.info(`AI Generation note: ${lastError}. Chuyển sang bộ sinh kịch bản thông minh.`);
  return generateSmartFallbackFromInput({
    topic,
    rawScriptInput,
    customTimestamps,
    sceneCount: effectiveCount
  });
}

export interface SuggestedSceneStructure {
  order: number;
  timeRange: string;
  startOffset: number;
  endOffset: number;
  title: string;
  visualDescription: string;
  narration: string;
  audioNote?: string;
  searchKeyword?: string;
  imagePrompt?: string;
}

export interface SuggestedTimestampsResult {
  formattedTimestamps: string;
  scenes: SuggestedSceneStructure[];
}

/**
 * Helper format giây thành MM:SS
 */
function toMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * AI tự động phân tích tiêu đề video và gợi ý chuẩn xác các mốc thời gian, tên phân cảnh, góc máy và lời bình
 */
export async function suggestTimestampsAndStructureWithAI(params: {
  topic: string;
  sceneCount?: number;
  availableSources?: string;
  apiKey?: string;
}): Promise<SuggestedTimestampsResult> {
  const { topic = 'Video clip tổng hợp', sceneCount = 6, availableSources, apiKey } = params;
  const count = Math.max(2, sceneCount || 6);
  const cleanKey = (apiKey || '').trim() || DEFAULT_GEMINI_KEY;

  let sourcesContext = '';
  if (availableSources && availableSources.trim()) {
    sourcesContext = `\nDanh sách các source/cảnh quay sẵn có:\n"""\n${availableSources.trim()}\n"""\n`;
  }

  const prompt = `Bạn là Đạo diễn kiêm Nhà sáng tạo nội dung Video Ngắn Triệu View (TikTok / Reels / Shorts / YouTube) hàng đầu hiện nay.
Chủ đề video: "${topic}"
Số lượng phân cảnh cần chia: ${count} cảnh.${sourcesContext}

Nhiệm vụ: Hãy phân tích kỹ chủ đề "${topic}" và lên kế hoạch phân chia mốc thời gian, góc máy hình ảnh, âm thanh và lời dẫn xuất sắc, bám sát thực tế.

PHONG CÁCH LỜI DẪN (NARRATION) SIÊU HAY, TỰ NHIÊN & BẮT TREND GIỚI TRẺ:
- Xưng hô gần gũi: Dùng "mình", "anh em", "mọi người", "team mình" (tránh giọng thuyết minh khô khan, sáo rỗng kiểu văn mẫu).
- Dùng từ ngữ sống động, hot trend Gen-Z theo ngữ cảnh: "out trình", "đỉnh nóc kịch trần", "xé gió", "đẳng cấp khác bọt", "bá cháy", "10 điểm không có nhưng", "bật mood", "chill hết nấc", "quá xá đã", "đỉnh chóp", "săn mây triệu view", "chữa lành thực sự", "mê chữ ê kéo dài"...
- Cảnh 1 giật hook mạnh mẽ trong 3 giây đầu; các cảnh giữa mô tả diễn biến kịch tính, chân thực; cảnh kết kêu gọi like/thả tim duyên dáng.

YÊU CẦU CHO MỖI PHÂN CẢNH:
- "order": Thứ tự từ 1 đến ${count}
- "timeRange": Chuỗi mốc thời gian định dạng "MM:SS - MM:SS" (ví dụ: "00:00 - 00:10", "00:10 - 00:25",...)
- "startOffset": Số giây bắt đầu (số nguyên/thực, ví dụ 0)
- "endOffset": Số giây kết thúc (số nguyên/thực, ví dụ 10)
- "title": Tên phân cảnh ngắn gọn, hấp dẫn, đúng ngữ cảnh
- "visualDescription": Mô tả chi tiết góc quay, hình ảnh xuất hiện trong phân cảnh
- "narration": Câu lồng tiếng hoặc lời bình tự nhiên, truyền cảm đậm chất Gen-Z (20 - 45 từ)
- "audioNote": Gợi ý nhạc nền hoặc hiệu ứng âm thanh thực tế
- "searchKeyword": Từ khóa tiếng Anh tìm video B-roll
- "imagePrompt": Prompt tiếng Anh tạo ảnh 8k chất lượng cao

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON THEO ĐỊNH DẠNG:
{
  "formattedTimestamps": "00:00 - 00:10: Tên phân cảnh 1 (Mô tả góc máy)\\n00:10 - 00:25: Tên phân cảnh 2...",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:10",
      "startOffset": 0,
      "endOffset": 10,
      "title": "...",
      "visualDescription": "...",
      "narration": "...",
      "audioNote": "...",
      "searchKeyword": "...",
      "imagePrompt": "..."
    }
  ]
}`;

  // 1. Thử gọi trực tiếp qua Groq API (Ưu tiên số 1 nếu có key gsk_ hoặc gọi qua engine)
  if (cleanKey.startsWith('gsk_') || cleanKey.length > 20) {
    for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b']) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert AI video scriptwriter and director. Output ONLY a valid JSON object with `formattedTimestamps` string and `scenes` array.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${cleanKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );

        const content = groqRes.data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = extractJsonFromAiResponse(content);
          const rawScenes = Array.isArray(parsed) ? parsed : parsed?.scenes || [];
          if (Array.isArray(rawScenes) && rawScenes.length > 0) {
            const scenes: SuggestedSceneStructure[] = rawScenes.map((s: any, idx: number) => {
              const sOff = typeof s.startOffset === 'number' ? s.startOffset : idx * 15;
              const eOff = typeof s.endOffset === 'number' ? s.endOffset : (idx + 1) * 15;
              const tRange = s.timeRange || `${toMMSS(sOff)} - ${toMMSS(eOff)}`;
              return {
                order: idx + 1,
                timeRange: tRange,
                startOffset: sOff,
                endOffset: eOff,
                title: s.title || `Phân cảnh ${idx + 1}`,
                visualDescription: s.visualDescription || s.description || s.title || '',
                narration: s.narration || '',
                audioNote: s.audioNote || '',
                searchKeyword: s.searchKeyword || topic,
                imagePrompt: s.imagePrompt || topic
              };
            });

            const formattedLines = scenes.map((sc) => {
              const briefVisual = sc.visualDescription ? ` (${sc.visualDescription.slice(0, 50)}...)` : '';
              return `${sc.timeRange}: ${sc.title}${briefVisual}`;
            });

            return {
              formattedTimestamps: parsed?.formattedTimestamps || formattedLines.join('\n'),
              scenes
            };
          }
        }
      } catch (e: any) {
        console.warn(`Groq model ${model} in suggestTimestamps error:`, e?.message);
      }
    }
  }

  // 2. Thử gọi qua Gemini API CHỈ KHI người dùng cung cấp API Key AIzaSy hợp lệ từ Google AI Studio
  if (cleanKey.startsWith('AIzaSy')) {
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro'
    ];
    const apiVersions = ['v1beta', 'v1'];

    for (const model of candidateModels) {
      for (const apiVer of apiVersions) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${cleanKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7
              }
            },
            { timeout: 20000 }
          );

          let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = extractJsonFromAiResponse(text);
            const rawScenes = Array.isArray(parsed) ? parsed : parsed?.scenes || [];
            if (Array.isArray(rawScenes) && rawScenes.length > 0) {
              const scenes: SuggestedSceneStructure[] = rawScenes.map((s: any, idx: number) => {
                const sOff = typeof s.startOffset === 'number' ? s.startOffset : idx * 15;
                const eOff = typeof s.endOffset === 'number' ? s.endOffset : (idx + 1) * 15;
                const tRange = s.timeRange || `${toMMSS(sOff)} - ${toMMSS(eOff)}`;
                return {
                  order: idx + 1,
                  timeRange: tRange,
                  startOffset: sOff,
                  endOffset: eOff,
                  title: s.title || `Phân cảnh ${idx + 1}`,
                  visualDescription: s.visualDescription || s.description || s.title || '',
                  narration: s.narration || '',
                  audioNote: s.audioNote || '',
                  searchKeyword: s.searchKeyword || topic,
                  imagePrompt: s.imagePrompt || topic
                };
              });

              const formattedLines = scenes.map((sc) => {
                const briefVisual = sc.visualDescription ? ` (${sc.visualDescription.slice(0, 50)}...)` : '';
                return `${sc.timeRange}: ${sc.title}${briefVisual}`;
              });

              return {
                formattedTimestamps: parsed?.formattedTimestamps || formattedLines.join('\n'),
                scenes
              };
            }
          }
        } catch (e: any) {
          // Continue to next model
        }
      }
    }
  }

  // 3. Sử dụng AI Web Engine (Groq / Electron IPC / Backend Proxy)
  try {
    const webText = await generateTextWithGeminiWeb(prompt, { apiKey: cleanKey });
    if (webText) {
      const parsed = extractJsonFromAiResponse(webText);
      const rawScenes = Array.isArray(parsed) ? parsed : parsed?.scenes || [];
      if (Array.isArray(rawScenes) && rawScenes.length > 0) {
        const scenes: SuggestedSceneStructure[] = rawScenes.map((s: any, idx: number) => {
          const sOff = typeof s.startOffset === 'number' ? s.startOffset : idx * 15;
          const eOff = typeof s.endOffset === 'number' ? s.endOffset : (idx + 1) * 15;
          return {
            order: idx + 1,
            timeRange: s.timeRange || `${toMMSS(sOff)} - ${toMMSS(eOff)}`,
            startOffset: sOff,
            endOffset: eOff,
            title: s.title || `Phân cảnh ${idx + 1}`,
            visualDescription: s.visualDescription || s.description || '',
            narration: s.narration || '',
            audioNote: s.audioNote || '',
            searchKeyword: s.searchKeyword || topic,
            imagePrompt: s.imagePrompt || topic
          };
        });

        const formattedLines = scenes.map((sc) => {
          const briefVisual = sc.visualDescription ? ` (${sc.visualDescription.slice(0, 50)}...)` : '';
          return `${sc.timeRange}: ${sc.title}${briefVisual}`;
        });

        return {
          formattedTimestamps: parsed?.formattedTimestamps || formattedLines.join('\n'),
          scenes
        };
      }
    }
  } catch (webErr) {
    console.warn('AI Web suggestTimestamps error:', webErr);
  }

  // 4. Fallback thông minh theo ngữ cảnh (Semantic Heuristic Engine)
  const fallbackScenes = generateSmartFallbackFromInput({
    topic,
    sceneCount: count
  });

  const scenes: SuggestedSceneStructure[] = fallbackScenes.map((fs, idx) => {
    const sOff = typeof fs.videoStartOffset === 'number' ? fs.videoStartOffset : idx * 15;
    const eOff = typeof fs.videoEndOffset === 'number' ? fs.videoEndOffset : (idx + 1) * 15;
    const cleanTitle = (fs.cutAction || '').replace(/^Clip #\d+:\s*/i, '') || `Phân cảnh ${idx + 1}`;
    return {
      order: idx + 1,
      timeRange: `${toMMSS(sOff)} - ${toMMSS(eOff)}`,
      startOffset: sOff,
      endOffset: eOff,
      title: cleanTitle,
      visualDescription: `Góc máy quay tập trung vào ${cleanTitle.toLowerCase()} của ${topic}`,
      narration: fs.narration,
      audioNote: 'Nhạc nền phù hợp với phong cách video',
      searchKeyword: fs.searchKeyword,
      imagePrompt: fs.imagePrompt
    };
  });

  return {
    formattedTimestamps: scenes.map((s) => `${s.timeRange}: ${s.title}`).join('\n'),
    scenes
  };
}

