import {
  Scene,
  VisualType,
  TransitionType,
  KenBurnsEffect,
  AspectRatio
} from '../types/video';
import { synthesizeEdgeTTS } from './edgeTtsService';
import { searchWebMedia, searchStockVideos, generateAiImageUrl } from './mediaService';

export interface ScriptMotionAnalysis {
  narration: string;
  visualType: VisualType;
  headerBadge?: string;
  orbitTitle?: string;
  orbitIcon?: string;
  chatMessages?: { sender: 'left' | 'right'; text: string }[];
  searchKeyword: string;
  imagePrompt: string;
  transition: TransitionType;
  kenBurns: KenBurnsEffect;
}

const DYNAMIC_TRANSITIONS: TransitionType[] = [
  'zoom_in',
  'fade',
  'slide_left',
  'slide_right',
  'digital_glitch',
  'flash_white'
];

const DYNAMIC_KEN_BURNS: KenBurnsEffect[] = [
  'zoom_in',
  'pan_right',
  'zoom_out',
  'pan_left',
  'crash_zoom'
];

/**
 * Tách kịch bản văn bản thô thành từng câu thoại logic
 */
export function splitScriptIntoSentences(script: string): string[] {
  if (!script || !script.trim()) return [];

  const rawLines = script
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

  const result: string[] = [];

  for (const line of rawLines) {
    const cleaned = line
      .replace(/^(\d+[\.\)\-:]|\-|\*|\+)\s*/, '')
      .replace(/^(cảnh|phân cảnh|scene)\s*\d+[:\-.]?\s*/i, '')
      .trim();

    if (!cleaned) continue;

    const parts = cleaned
      .split(/(?<=[.?!;:])\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    for (const part of parts) {
      if (part.length < 5) continue;

      if (part.length > 150) {
        const subClauses = part.split(/,\s+/).filter((c) => c.trim().length > 0);
        if (subClauses.length > 1) {
          let buffer = '';
          for (const clause of subClauses) {
            if ((buffer + ', ' + clause).length > 110) {
              if (buffer) result.push(buffer.trim());
              buffer = clause;
            } else {
              buffer = buffer ? `${buffer}, ${clause}` : clause;
            }
          }
          if (buffer) result.push(buffer.trim());
          continue;
        }
      }

      result.push(part);
    }
  }

  return result.length > 0 ? result : [script.trim()];
}

/**
 * Trích xuất từ khóa tìm kiếm ảnh & video chuẩn xác từ câu thoại tiếng Việt
 */
function extractSearchKeyword(sentence: string): string {
  const t = sentence.toLowerCase();

  // Nhận diện món ăn & ẩm thực đặc sản
  if (/bún cá/i.test(t)) {
    if (/hải phòng/i.test(t)) return 'bún cá cay Hải Phòng';
    if (/chiên|giòn/i.test(t)) return 'cá rô phi chiên giòn';
    if (/nước dùng|thanh ngọt/i.test(t)) return 'nước dùng bún cá';
    return 'tô bún cá cay';
  }
  if (/cá rô phi|cá rán/i.test(t)) return 'cá rô phi chiên giòn';
  if (/nước dùng|nồi nước/i.test(t)) return 'nước dùng bún cá';
  if (/phở/i.test(t)) return 'tô phở bò việt nam';
  if (/ẩm thực|món ăn|quán ăn/i.test(t)) return 'ẩm thực việt nam';

  const cleaned = sentence
    .toLowerCase()
    .replace(/(hôm nay|chúng ta|các bạn|bạn có biết|thực sự|chính là|đây là|có thể|sẽ|đã|đang|được|những|các|một|của|cho|về|trong|với|tại|thì|mà|là)/gi, ' ')
    .replace(/[^\p{L}\d\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter((w) => w.length > 1);
  if (words.length <= 4) {
    return words.join(' ') || 'cinematic wallpaper 4k';
  }
  return words.slice(0, 4).join(' ');
}

/**
 * Bộ não phân tích ngữ nghĩa (Semantic Analyzer)
 * ƯU TIÊN ẢNH NÉT VÀ VIDEO B-ROLL ĐẸP CHO HẦU HẾT CÁC CẢNH THỰC TẾ
 */
export function analyzeSentenceForMotion(
  sentence: string,
  index: number,
  totalSentences: number
): ScriptMotionAnalysis {
  const textLower = sentence.toLowerCase();
  const transition = DYNAMIC_TRANSITIONS[index % DYNAMIC_TRANSITIONS.length];
  const kenBurns = DYNAMIC_KEN_BURNS[index % DYNAMIC_KEN_BURNS.length];
  const searchKeyword = extractSearchKeyword(sentence);
  const imagePrompt = `cinematic dramatic high quality 8k photorealistic scene of ${searchKeyword}, appetizing, ultra clear, 4k`;

  // 1. TÀI CHÍNH / TĂNG TRƯỞNG / SỐ LIỆU RÕ RÀNG (Stock Candlestick Chart)
  if (
    /\b(300%|200%|100%|50%|\d+%)\b|bùng nổ tăng trưởng|doanh thu tăng|lợi nhuận tăng vọt/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'stock_chart',
      headerBadge: '📈 BÙNG NỔ LỢI NHUẬN',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 2. BIẾN ĐỘNG SỐ DƯ / NGÂN HÀNG (Ting Ting Bank Notification)
  if (
    /ting ting|biến động số dư|chuyển khoản \d+|nhận được \d+ triệu|tài khoản ngân hàng/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'bank_notification',
      headerBadge: '💵 BIẾN ĐỘNG SỐ DƯ',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 3. TÌM KIẾM GOOGLE / CÂU HỎI TRÊN MẠNG (Google Search Bar Animation)
  if (
    /tìm kiếm trên google|tra cứu google|search google|công thức nấu.*google/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'google_search',
      headerBadge: '🔍 TÌM KIẾM BÍ QUYẾT',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 4. LẬP TRÌNH / CODE / PHẦN MỀM THUẦN TÚY (VS Code Terminal)
  if (
    /viết code|dòng code|lập trình viên|mã nguồn|source code|terminal|python script/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'code_terminal',
      headerBadge: '💻 CÔNG NGHỆ & TỰ ĐỘNG HÓA',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 5. SO SÁNH TRỰC DIỆN A VS B (Split Screen VS Battle)
  if (
    /\bso với\b|\bthay vì\b|\bvs\b|đối đầu trực tiếp|truyền thống và hiện đại/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'vs_battle',
      headerBadge: '⚡ SO SÁNH ĐỐI ĐẦU',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 6. TIN NHẮN HỘI THOẠI (Viral Chat Bubbles)
  if (
    /khách hàng nhắn|tin nhắn inbox|nhắn cho tôi|hỏi qua tin nhắn/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'chat_bubble',
      headerBadge: '💬 TIN NHẮN INBOX',
      chatMessages: [
        { sender: 'left', text: 'Bí quyết là gì vậy bạn?' },
        { sender: 'right', text: sentence.slice(0, 48) + (sentence.length > 48 ? '...' : '') }
      ],
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 7. VŨ TRỤ / NGUYÊN TỬ / HỆ SINH THÁI CỐT LÕI (Orbital Glow)
  if (
    /vũ trụ|thiên hà|quỹ đạo|hệ sinh thái công nghệ|năng lượng nguyên tử/i.test(
      textLower
    )
  ) {
    return {
      narration: sentence,
      visualType: 'orbital_glow',
      headerBadge: '🪐 QUỸ ĐẠO CỐT LÕI',
      orbitTitle: searchKeyword.toUpperCase() || 'CỐT LÕI',
      orbitIcon: '✨',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 8. ĐUA XE / TỐC ĐỘ CAO TỐC BAN ĐÊM (Night Highway Racer)
  if (/đua xe|cao tốc ban đêm|lái xe đêm|đèn neon cao tốc/i.test(textLower)) {
    return {
      narration: sentence,
      visualType: 'night_highway',
      headerBadge: '🏎️ BỨT PHÁ TỐC ĐỘ',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 9. MÁY BAY / HÀNG KHÔNG (Airplane Takeoff)
  if (/máy bay|chuyến bay|sân bay|cất cánh lên trời/i.test(textLower)) {
    return {
      narration: sentence,
      visualType: 'airplane_takeoff',
      headerBadge: '✈️ CẤT CÁNH VƯƠN XA',
      searchKeyword,
      imagePrompt,
      transition,
      kenBurns
    };
  }

  // 10. MẶC ĐỊNH: PHÂN CẢNH ẢNH NÉT CAO (Cinematic Media Scene)
  const badges = [
    '✨ ĐẶC SẢN NỨC TIẾNG',
    '🤤 HƯƠNG VỊ ĐẬM ĐÀ',
    '👁️ QUAN SÁT THỰC TẾ',
    '🌟 CHI TIẾT ĐẮC GIÁ',
    '⚡ TRẢI NGHIỆM ĐỈNH CAO'
  ];

  return {
    narration: sentence,
    visualType: 'media',
    headerBadge: undefined,
    searchKeyword,
    imagePrompt,
    transition,
    kenBurns
  };
}

/**
 * Hàm thực thi 1-Click: Chuyển kịch bản thô thành danh sách Scene hoàn chỉnh
 */
export async function buildMotionScenesFromScript(
  rawScript: string,
  options: {
    voiceName: string;
    voiceRate: string;
    voicePitch: string;
    aspectRatio: AspectRatio;
    onProgress?: (text: string, current: number, total: number) => void;
  }
): Promise<{ scenes: Scene[]; totalDuration: number }> {
  const sentences = splitScriptIntoSentences(rawScript);

  if (sentences.length === 0) {
    throw new Error('Kịch bản chưa có nội dung. Vui lòng nhập ít nhất 1 câu hoàn chỉnh!');
  }

  const fullScenes: Scene[] = [];
  let accumulatedDuration = 0;
  const total = sentences.length;

  for (let i = 0; i < total; i++) {
    const sentence = sentences[i];
    const analysis = analyzeSentenceForMotion(sentence, i, total);

    options.onProgress?.(
      `Đang xử lý phân cảnh ${i + 1}/${total}: Tìm ảnh nét & Tổng hợp giọng đọc...`,
      i + 1,
      total
    );

    // 1. Tạo giọng đọc AI Edge-TTS
    let audioUrl = '';
    let audioDuration = 4.0;
    let words: any[] = [];

    try {
      const ttsResult = await synthesizeEdgeTTS(
        sentence,
        options.voiceName,
        options.voiceRate,
        options.voicePitch
      );
      if (ttsResult && ttsResult.audioUrl) {
        audioUrl = ttsResult.audioUrl;
        audioDuration = ttsResult.duration || 4.0;
        words = ttsResult.words || [];
      } else {
        audioDuration = ttsResult?.duration || 4.0;
        words = ttsResult?.words || [];
      }
    } catch (err) {
      console.warn(`TTS error for sentence ${i + 1}:`, err);
    }

    // 2. Tìm Media: Tự động ghép Video ngắn B-roll hoặc Ảnh Full HD theo ngữ cảnh
    let mediaUrl = '';
    let mediaType: 'image' | 'video' = 'image';

    // Ưu tiên lấy video ngắn B-roll cho các phân cảnh mô tả hành động, ẩm thực, nấu nướng, cất cánh
    const isActionOrCooking = /chiên|nấu|xào|chế biến|ăn|sôi|làm|bắt đầu|thực khách|ròn|thơm|chạy|bay/i.test(sentence);
    const shouldTryVideo = analysis.visualType === 'media' && (i % 2 === 1 || isActionOrCooking);

    if (shouldTryVideo) {
      try {
        const videoList = await searchStockVideos(analysis.searchKeyword);
        if (videoList && videoList.length > 0) {
          const pickedVideo = videoList[i % videoList.length];
          mediaUrl = pickedVideo.url;
          mediaType = 'video';
        }
      } catch (videoErr) {
        console.warn(`Video search error on scene ${i + 1}:`, videoErr);
      }
    }

    // Nếu chưa có video thì tìm ảnh Full HD 1080p từ Bing
    if (!mediaUrl) {
      try {
        const mediaList = await searchWebMedia(
          analysis.searchKeyword,
          options.aspectRatio,
          false,
          i
        );

        if (mediaList && mediaList.length > 0) {
          const picked = mediaList[i % mediaList.length];
          mediaUrl = picked.url || picked.thumbnail;
          mediaType = 'image';
        } else {
          mediaUrl = generateAiImageUrl(analysis.searchKeyword, options.aspectRatio);
        }
      } catch (err) {
        mediaUrl = generateAiImageUrl(analysis.searchKeyword, options.aspectRatio);
      }
    }

    accumulatedDuration += audioDuration;

    fullScenes.push({
      id: `motion-scene-${Date.now()}-${i + 1}`,
      order: i + 1,
      narration: sentence,
      searchKeyword: analysis.searchKeyword,
      imagePrompt: analysis.imagePrompt,
      mediaType,
      mediaUrl,
      audioUrl,
      audioDuration,
      words,
      transition: analysis.transition,
      kenBurns: analysis.kenBurns,
      visualType: analysis.visualType,
      visualScale: 1.15,
      headerBadge: analysis.headerBadge,
      orbitTitle: analysis.orbitTitle,
      orbitIcon: analysis.orbitIcon,
      chatMessages: analysis.chatMessages
    });
  }

  return {
    scenes: fullScenes,
    totalDuration: accumulatedDuration
  };
}
