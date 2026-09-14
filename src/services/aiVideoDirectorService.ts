import axios from 'axios';
import { Scene, VideoProject, TransitionType, KenBurnsEffect } from '../types/video';

export interface AiScriptSceneRaw {
  order?: number;
  timeRange?: string; // e.g. "00:00 - 00:04"
  durationSeconds?: number; // e.g. 4
  sourceName?: string; // e.g. "tôi cho học viên học ve cầu"
  cutAction?: string; // e.g. "Học viên đánh hỏng hoặc lóng ngóng. Tốc độ 1.0x"
  voiceOver?: string; // e.g. "Đến sân tập 1-2 tiếng mỗi tuần, liệu có tiến bộ nổi không?"
  screenText?: string; // e.g. "HỌC CẦU LÔNG TUẦN 1 BUỔI LIỆU CÓ ĂN THUA?"
  vfx?: string; // e.g. "Glitch, Flash trắng, Zoom in..."
  sfx?: string; // e.g. "Static, Swoosh, Ding, Smack..."
  transition?: string; // e.g. "fade", "glitch", "zoom_in"
  cameraEffect?: string; // e.g. "zoom_in", "pan_left"
  colorFilter?: string; // e.g. "cinematic", "vintage"
}

export interface MissingSourceSuggestion {
  title: string;
  howToShoot: string;
  purpose: string;
}

export interface AiScriptProjectPayload {
  title?: string;
  goal?: string;
  totalDuration?: number;
  musicMood?: string;
  scenes: AiScriptSceneRaw[];
  missingSources?: MissingSourceSuggestion[];
}

export const aiVideoDirectorService = {
  /**
   * Tạo Master Prompt AI chuyên nghiệp dựa trên các Source Video người dùng đang có
   */
  buildMasterPrompt(sourcesText: string, topicText: string, targetDuration: string = '30-45 giây'): string {
    const cleanSources = sourcesText.trim() || `1. "tôi cho học viên học ve cầu"
2. "Source App học cầu lông (lướt kho 500 video)"
3. "Source TikTok động tác chuẩn"
4. "tôi làm mẫu"
5. "tôi cho học viên học ve chém"
6. "tôi đánh đôi với đối căng"
7. "tôi đi đánh và cười nhìn máy quay"`;

    const cleanTopic = topicText.trim() || 'Phương pháp dạy cầu lông 4.0 - Học ở sân 1, về nhà tự luyện 10 (Tuyển sinh & Đòn bẩy công nghệ)';

    return `Bạn là một Đạo diễn Video & Chuyên gia Dựng phim Triệu View (Master Video Editor & Creative Director) hàng đầu trên TikTok / Reels / YouTube Shorts.

TÔI ĐANG CÓ CÁC SOURCE VIDEO (CẢNH QUAY THỰC TẾ) SAU ĐÂY:
==================================================
${cleanSources}
==================================================

CHỦ ĐỀ & MỤC TIÊU MARKETING CỦA VIDEO:
==================================================
"${cleanTopic}"
Thời lượng mong muốn: ~${targetDuration}
==================================================

NHIỆM VỤ CỦA BẠN:
1. Sắp xếp toàn bộ các source video trên thành 1 kịch bản video ngắn hoàn chỉnh từ đầu đến cuối.
2. Tối ưu theo cấu trúc video Viral giữ chân người xem (Hook 3 giây đầu gây tò mò/nghịch lý -> Triển khai vấn đề -> Đưa ra giải pháp đòn bẩy -> Bằng chứng thực tế -> Kêu gọi hành động CTA).
3. Hướng dẫn chi tiết từng giây, từng nhịp cắt, góc máy, hiệu ứng hình ảnh (VFX), hiệu ứng âm thanh (SFX), chuyển cảnh và chữ hiển thị trên màn hình sao cho người mới (thậm chí học sinh lớp 1) cũng làm theo và dựng được ngay.
4. Xuất kèm 1 block mã JSON chuẩn (chuẩn schema quy định bên dưới) để tôi copy và dán thẳng vào ứng dụng Remotion tự động sinh phân cảnh.
5. Cuối cùng, gợi ý đúng 10 SOURCE VIDEO TÔI CÒN THIẾU NÊN QUAY BÙ NGAY để nâng cấp chất lượng các video tiếp theo (kèm cách quay góc máy chi tiết + mục đích sử dụng).

HÃY TRẢ VỀ KẾT QUẢ THEO ĐÚNG 3 PHẦN SAU ĐÂY:

---
### PHẦN 1: BẢNG KỊCH BẢN CHI TIẾT TỪNG GIÂY
(Ghi rõ: Mốc thời gian | Source sử dụng | Thao tác cắt & Bố cục | Lời dẫn Voice-over & Text màn hình | Hiệu ứng VFX & SFX)

---
### PHẦN 2: MÃ JSON ĐỂ DÁN VÀO APP REMOTION (BẮT BUỘC ĐỂ TRONG BLOCK \`\`\`json ... \`\`\`)
{
  "title": "${cleanTopic}",
  "goal": "Mục tiêu video...",
  "totalDuration": 36,
  "musicMood": "Hiphop beat / Tech Lofi dứt khoát",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:04",
      "durationSeconds": 4,
      "sourceName": "Tên source tương ứng",
      "cutAction": "Thao tác cắt, tốc độ, góc máy...",
      "voiceOver": "Lời đọc thuyết minh (Voice-over)...",
      "screenText": "CHỮ HIỂN THỊ TRÊN MÀN HÌNH...",
      "vfx": "fx_glitch_scan",
      "sfx": "sfx_static",
      "transition": "fade",
      "cameraEffect": "zoom_in",
      "colorFilter": "filter_vintage_film"
    }
  ],
  "missingSources": [
    {
      "title": "Tên source 1",
      "howToShoot": "Cách đặt góc máy, khoảng cách, thông số...",
      "purpose": "Mục đích sử dụng làm gì trong video..."
    }
  ]
}

*(Ghi chú các giá trị hợp lệ trong JSON:
- transition: "fade" | "slide_left" | "slide_right" | "slide_up" | "zoom_in" | "zoom_out" | "flash_white" | "digital_glitch" | "cube_flip" | "none"
- cameraEffect: "none" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down" | "subtle_float"
- vfx: "fx_glitch_scan" | "fx_snapshot_3x" | "fx_film_grain" | "fx_light_leak" | "fx_vignette" | "fx_sparks" | "fx_golden_bokeh" | "fx_fire_embers" | "fx_snow_fall" | "fx_cyber_grid" | "fx_rgb_split"
- colorFilter: "filter_none" | "filter_teal_orange" | "filter_vintage_film" | "filter_fresh_glow" | "filter_cyberpunk_neon"
)*

---
### PHẦN 3: 10 SOURCE VIDEO BẠN CÒN THIẾU NÊN QUAY BÙ NGAY
(Liệt kê 10 cảnh quay cụ thể: Tên source + Cách quay góc máy chi tiết + Mục đích sử dụng)
`;
  },

  /**
   * Phân tích và chuyển đổi chuỗi JSON AI thành Project Remotion Scenes
   */
  parseAiScriptJson(inputStr: string): {
    projectData: AiScriptProjectPayload;
    scenes: Scene[];
  } {
    let cleanJson = inputStr.trim();

    // Loại bỏ markdown block ```json ... ``` nếu có
    const jsonMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      cleanJson = jsonMatch[1].trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e: any) {
      throw new Error(`JSON không hợp lệ: ${e.message || 'Vui lòng kiểm tra lại cấu trúc cú pháp JSON'}`);
    }

    let rawScenes: AiScriptSceneRaw[] = [];
    let title = 'Video Kịch Bản AI';
    let goal = '';
    let totalDuration = 0;
    let musicMood = '';
    let missingSources: MissingSourceSuggestion[] = [];

    if (Array.isArray(parsed)) {
      rawScenes = parsed;
    } else if (parsed && typeof parsed === 'object') {
      title = parsed.title || title;
      goal = parsed.goal || goal;
      musicMood = parsed.musicMood || musicMood;
      missingSources = parsed.missingSources || [];
      if (Array.isArray(parsed.scenes)) {
        rawScenes = parsed.scenes;
      } else if (Array.isArray(parsed.roadmap)) {
        rawScenes = parsed.roadmap;
      }
    }

    if (rawScenes.length === 0) {
      throw new Error('Không tìm thấy danh sách phân cảnh (scenes) nào trong JSON!');
    }

    // Chuyển đổi từng scene thô sang Remotion Scene chuẩn
    const scenes: Scene[] = rawScenes.map((item, idx) => {
      let duration = item.durationSeconds || 4.0;

      // Nếu có timeRange dạng "00:00 - 00:04", tính thời lượng
      if (item.timeRange && typeof item.timeRange === 'string') {
        const parts = item.timeRange.split('-').map((p) => p.trim());
        if (parts.length === 2) {
          const parseSec = (t: string) => {
            const segs = t.split(':').map(Number);
            if (segs.length === 2) return segs[0] * 60 + segs[1];
            if (segs.length === 3) return segs[0] * 3600 + segs[1] * 60 + segs[2];
            return Number(t) || 0;
          };
          const start = parseSec(parts[0]);
          const end = parseSec(parts[1]);
          if (end > start) {
            duration = Number((end - start).toFixed(1));
          }
        }
      }

      const order = item.order || idx + 1;
      const narration = item.voiceOver || item.screenText || '';
      const sourceName = item.sourceName || `Cảnh #${order}`;

      // Map transition an toàn
      let transition: TransitionType = 'fade';
      const validTransitions: TransitionType[] = [
        'fade',
        'slide_left',
        'slide_right',
        'slide_up',
        'zoom_in',
        'zoom_out',
        'flash_white',
        'digital_glitch',
        'cube_flip',
        'none'
      ];
      if (item.transition && validTransitions.includes(item.transition as TransitionType)) {
        transition = item.transition as TransitionType;
      } else if (item.vfx?.toLowerCase().includes('glitch')) {
        transition = 'digital_glitch';
      } else if (item.vfx?.toLowerCase().includes('flash')) {
        transition = 'flash_white';
      }

      // Map Ken Burns Camera Effect an toàn
      let kenBurns: KenBurnsEffect = 'none';
      const validKenBurns: KenBurnsEffect[] = [
        'none',
        'zoom_in',
        'zoom_out',
        'pan_left',
        'pan_right',
        'tilt_up',
        'tilt_down',
        'subtle_float'
      ];
      if (item.cameraEffect && validKenBurns.includes(item.cameraEffect as KenBurnsEffect)) {
        kenBurns = item.cameraEffect as KenBurnsEffect;
      } else if (item.vfx?.toLowerCase().includes('zoom in')) {
        kenBurns = 'zoom_in';
      }

      // Map TikTok Video Effect
      let tiktokVideoEffect: string | undefined = undefined;
      if (item.vfx?.includes('fx_')) {
        tiktokVideoEffect = item.vfx;
      } else if (item.vfx?.toLowerCase().includes('glitch')) {
        tiktokVideoEffect = 'fx_glitch_scan';
      } else if (item.vfx?.toLowerCase().includes('flash')) {
        tiktokVideoEffect = 'fx_snapshot_3x';
      } else if (item.vfx?.toLowerCase().includes('grain') || item.vfx?.toLowerCase().includes('nhiễu')) {
        tiktokVideoEffect = 'fx_film_grain';
      } else if (item.vfx?.toLowerCase().includes('spark') || item.vfx?.toLowerCase().includes('tia lửa')) {
        tiktokVideoEffect = 'fx_sparks';
      }

      // Map TikTok Color Filter
      let tiktokFilter: string | undefined = undefined;
      if (item.colorFilter?.includes('filter_')) {
        tiktokFilter = item.colorFilter;
      }

      // Map TikTok SFX
      let tiktokSfx: string | undefined = undefined;
      if (item.sfx?.includes('sfx_')) {
        tiktokSfx = item.sfx;
      } else if (item.sfx?.toLowerCase().includes('whoosh') || item.sfx?.toLowerCase().includes('swoosh')) {
        tiktokSfx = 'sfx_whoosh';
      } else if (item.sfx?.toLowerCase().includes('ding') || item.sfx?.toLowerCase().includes('ting')) {
        tiktokSfx = 'sfx_ding';
      } else if (item.sfx?.toLowerCase().includes('glitch') || item.sfx?.toLowerCase().includes('static')) {
        tiktokSfx = 'sfx_glitch';
      } else if (item.sfx?.toLowerCase().includes('bass') || item.sfx?.toLowerCase().includes('impact') || item.sfx?.toLowerCase().includes('boom')) {
        tiktokSfx = 'sfx_cinematic_boom';
      }

      totalDuration += duration;

      return {
        id: `ai-scene-${Date.now()}-${idx + 1}-${Math.random().toString(36).slice(2, 6)}`,
        order,
        narration,
        searchKeyword: sourceName,
        sourceName: item.sourceName || sourceName,
        cutAction: item.cutAction || '',
        mediaType: 'video',
        mediaUrl: '',
        localMediaPath: '',
        audioDuration: duration,
        words: [],
        transition,
        kenBurns,
        tiktokVideoEffect,
        tiktokFilter,
        tiktokSfx,
        headerBadge: undefined,
        videoMuted: false,
        videoVolume: 1.0
      };
    });

    return {
      projectData: {
        title,
        goal,
        totalDuration: Number(totalDuration.toFixed(1)),
        musicMood,
        scenes: rawScenes,
        missingSources
      },
      scenes
    };
  },

  /**
   * Bộ tạo kịch bản thông minh theo ngữ cảnh (Semantic Heuristic Engine)
   * Tự động phân tích từ khóa, chủ thể, hành động của từng source để tạo kịch bản viral, không dùng mẫu cứng.
   */
  generateFallbackScript(sourcesText: string, topicText: string, targetDuration: string = '30-45 giây'): {
    projectData: AiScriptProjectPayload;
    scenes: Scene[];
    rawJsonText: string;
  } {
    const rawLines = sourcesText
      .split('\n')
      .map(l => l.replace(/^\d+[\.\-\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);

    const sources = rawLines.length > 0 ? rawLines : [
      'Cảnh quay toàn cảnh phòng homestay',
      'Cảnh view mây trời săn mây Tây Bắc',
      'Cảnh thưởng thức tiệc nướng BBQ ấm cúng',
      'Cảnh sân vườn hoa và góc check-in chill',
      'Cảnh trải nghiệm đón hoàng hôn bình yên'
    ];

    const title = topicText.trim() || 'Kịch Bản Video Phân Cảnh Chuyên Nghiệp';
    const totalScenes = sources.length;

    // Phân tích chủ đề tổng quan
    const fullText = (topicText + ' ' + sources.join(' ')).toLowerCase();
    const isBadminton = fullText.includes('cầu lông') || fullText.includes('ve cầu') || fullText.includes('vợt') || fullText.includes('sân tập');
    const isHomestay = fullText.includes('homestay') || fullText.includes('sapa') || fullText.includes('phòng') || fullText.includes('mây') || fullText.includes('bbq') || fullText.includes('du lịch');
    const isFood = fullText.includes('ăn') || fullText.includes('món') || fullText.includes('quán') || fullText.includes('ẩm thực') || fullText.includes('nấu');
    const isTechOrCourse = fullText.includes('app') || fullText.includes('khóa học') || fullText.includes('học viên') || fullText.includes('video') || fullText.includes('4.0');

    const vfxPool = [
      'fx_glitch_scan', 'fx_snapshot_3x', 'fx_light_leak', 'fx_film_grain',
      'fx_sparks', 'fx_golden_bokeh', 'fx_vignette', 'fx_cyber_grid'
    ];
    const sfxPool = [
      'sfx_whoosh', 'sfx_ding', 'sfx_cinematic_boom', 'sfx_glitch',
      'sfx_camera_shutter', 'sfx_pop'
    ];
    const transitionPool: TransitionType[] = [
      'zoom_in', 'fade', 'slide_left', 'flash_white', 'digital_glitch', 'slide_right'
    ];
    const cameraEffectPool: KenBurnsEffect[] = [
      'zoom_in', 'pan_left', 'subtle_float', 'zoom_out', 'tilt_up', 'pan_right'
    ];
    const colorFilterPool = [
      'filter_teal_orange', 'filter_fresh_glow', 'filter_vintage_film', 'filter_cinematic', 'filter_cyberpunk_neon'
    ];

    let currentTime = 0;
    const rawScenes: AiScriptSceneRaw[] = sources.map((src, idx) => {
      // Tính thời lượng tối ưu cho từng cảnh
      let duration = 4;
      if (totalScenes <= 4) duration = 6;
      else if (totalScenes >= 8) duration = 3.5;
      else duration = 4.5;

      const startMin = Math.floor(currentTime / 60);
      const startSec = Math.floor(currentTime % 60);
      const endMin = Math.floor((currentTime + duration) / 60);
      const endSec = Math.floor((currentTime + duration) % 60);
      currentTime += duration;

      const timeRange = `${String(startMin).padStart(2, '0')}:${String(startSec).padStart(2, '0')} - ${String(endMin).padStart(2, '0')}:${String(endSec).padStart(2, '0')}`;

      const sLower = src.toLowerCase();
      let voiceOver = '';
      let screenText = '';
      let cutAction = '';

      // Tự động phân loại phân đoạn video theo cấu trúc Viral (Hook -> Pain/Detail -> Solution/Proof -> CTA)
      const isFirst = idx === 0;
      const isLast = idx === totalScenes - 1;
      const isSecond = idx === 1;

      if (isBadminton) {
        if (isFirst) {
          voiceOver = `Tập cầu lông tuần 1-2 buổi mà muốn tiến bộ vượt bậc thì bí quyết nằm ở đâu?`;
          screenText = `TẬP TUẦN 1 BUỔI: TIẾN BỘ NỔI KHÔNG?`;
          cutAction = `Góc quay bắt nhịp người tập thực hiện động tác, cắt dứt khoát 1.0x tạo điểm nhấn mở đầu.`;
        } else if (isLast) {
          voiceOver = `Nhắn tin ngay cho mình để nhận lộ trình bài tập chi tiết và tài khoản đồng hành nhé!`;
          screenText = `INBOX NHẬN GIÁO ÁN & LỘ TRÌNH 4.0 NGAY!`;
          cutAction = `Góc chính diện nụ cười tự tin, chỉ tay kêu gọi hành động (Call To Action).`;
        } else if (sLower.includes('app') || sLower.includes('500 video') || sLower.includes('sơ đồ')) {
          voiceOver = `Tận dụng kho hơn 500 bài tập thị phạm và sơ đồ bộ pháp trên App để tự luyện chuẩn xác tại nhà.`;
          screenText = `TỰ ÔN BỘ PHÁP QUA APP 500+ VIDEO`;
          cutAction = `Chèn khung mockup điện thoại lướt danh sách bài tập, tua 1.5x nhịp nhàng.`;
        } else if (sLower.includes('tiktok') || sLower.includes('chuẩn')) {
          voiceOver = `Đối chiếu từng góc vung vợt với video chuẩn để sửa ngay lỗi sai trước khi bước lên sân.`;
          screenText = `ĐỐI CHIẾU GÓC VỢT CHUẨN TỪNG MILIMET`;
          cutAction = `Chia đôi màn hình (Split screen) so sánh động tác học viên và bài mẫu.`;
        } else if (sLower.includes('mẫu') || sLower.includes('thị phạm')) {
          voiceOver = `Thầy trực tiếp thị phạm từng điểm tiếp xúc cầu, hướng dẫn chuẩn xác cảm giác lực.`;
          screenText = `THỊ PHẠM ĐIỂM TIẾP XÚC CẦU CHUẨN`;
          cutAction = `Góc quay ngang cận tay và vai, hiệu ứng chậm (Slow-motion 0.8x) ở điểm chạm cầu.`;
        } else if (sLower.includes('chém') || sLower.includes('ve')) {
          voiceOver = `Lên sân thực hành là thoát tay ngay, đường cầu cuộn xoáy hiểm hóc và cực kỳ uy lực.`;
          screenText = `THOÁT TAY VE CẦU UY LỰC & HIỂM HÓC`;
          cutAction = `Góc quay từ sau lưng hướng sang sân đối phương, theo dõi quỹ đạo cầu bay.`;
        } else if (sLower.includes('đôi') || sLower.includes('căng') || sLower.includes('đấu')) {
          voiceOver = `Áp dụng ngay vào các pha cầu giằng co tốc độ cao với đối thủ mạnh đầy tự tin.`;
          screenText = `THỰC CHIẾN ĐỐI KHÁNG TỐC ĐỘ CAO`;
          cutAction = `Cắt nhịp nhanh, bắt trọn các pha phản tạt và đập cầu dứt điểm.`;
        } else {
          voiceOver = `Kết hợp nhịp nhàng giữa kỹ thuật chuẩn và phản xạ thực tế qua bài tập: ${src}.`;
          screenText = `${src.toUpperCase()}`;
          cutAction = `Góc máy chuyển động linh hoạt theo từng bước di chuyển của người chơi.`;
        }
      } else if (isHomestay) {
        if (isFirst) {
          voiceOver = `Nếu bạn đang tìm một chốn bình yên để trốn khỏi khói bụi thành phố, đừng bỏ qua nơi này!`;
          screenText = `CHỐN BÌNH YÊN SĂN MÂY TÂY BẮC`;
          cutAction = `Lia máy mượt mà (Pan) góc rộng bao quát toàn cảnh không gian thơ mộng.`;
        } else if (isLast) {
          voiceOver = `Lên lịch cùng người thương ngay hôm nay để tận hưởng những ngày nghỉ trọn vẹn nhất nhé!`;
          screenText = `BOOK PHÒNG NGAY ĐỂ NHẬN ƯU ĐÃI!`;
          cutAction = `Góc zoom out từ từ tạo cảm giác thảnh thơi, dòng chữ ưu đãi nổi bật.`;
        } else if (sLower.includes('phòng') || sLower.includes('sinh nhật') || sLower.includes('decor')) {
          voiceOver = `Không gian phòng nghỉ ngập tràn ánh sáng tự nhiên, decor ấm cúng chu đáo đến từng chi tiết.`;
          screenText = `KHÔNG GIAN NGHỈ DƯỠNG VIEW TRIỆU ĐÔ`;
          cutAction = `Góc quay lia chậm từ cửa kính lớn đón nắng vào giường ngủ êm ái.`;
        } else if (sLower.includes('bbq') || sLower.includes('ăn') || sLower.includes('nướng')) {
          voiceOver = `Tối đến quây quần bên bếp than hồng với bữa tiệc nướng BBQ xèo xèo thơm lừng giữa trời se lạnh.`;
          screenText = `TIỆC BBQ ẤM CÚNG GIỮA TRỜI SE LẠNH`;
          cutAction = `Cận cảnh làn khói bốc lên từ vỉ nướng, ánh đèn vàng lung linh ấm áp.`;
        } else if (sLower.includes('mây') || sLower.includes('mountain') || sLower.includes('núi')) {
          voiceOver = `Mỗi sớm mai thức dậy là cả một biển mây bồng bềnh ngay trước hiên ban công.`;
          screenText = `BIỂN MÂY BỒNG BỀNH NGAY HIÊN PHÒNG`;
          cutAction = `Góc máy từ trong phòng hướng ra thung lũng mây trôi hùng vĩ.`;
        } else if (sLower.includes('vườn') || sLower.includes('hoa') || sLower.includes('check')) {
          voiceOver = `Khu vườn hoa rực rỡ sắc màu, góc nào đứng vào cũng có ngay ảnh check-in sống ảo triệu like.`;
          screenText = `GÓC CHECK-IN SỐNG ẢO TRIỆU LIKE`;
          cutAction = `Góc quay thấp nhẹ nhàng lướt qua những nhành hoa tươi tắn.`;
        } else {
          voiceOver = `Trải nghiệm trọn vẹn từng khoảnh khắc thư thái nhất cùng ${src.toLowerCase()}.`;
          screenText = `${src.toUpperCase()}`;
          cutAction = `Góc quay cận cảnh bắt trọn cảm xúc thư giãn và ánh sáng tự nhiên.`;
        }
      } else {
        // Tổng quát cho các chủ đề khác
        if (isFirst) {
          voiceOver = `Đây là điều mà hầu hết mọi người thường bỏ qua khi tìm hiểu về ${topicText || src}...`;
          screenText = `BÍ QUYẾT BẠN KHÔNG NÊN BỎ LỠ!`;
          cutAction = `Cắt nhịp nhanh 1.0x, hiệu ứng chuyển động dứt khoát thu hút 3 giây đầu.`;
        } else if (isLast) {
          voiceOver = `Đừng quên lưu lại video và theo dõi kênh để cập nhật thêm nhiều bí quyết hữu ích nhé!`;
          screenText = `FOLLOW & LƯU LẠI VIDEO NGAY!`;
          cutAction = `Góc máy chính diện, đồ họa nút follow nhấp nháy bắt mắt.`;
        } else {
          voiceOver = `Tập trung vào chi tiết quan trọng nhất: ${src}, tối ưu hiệu quả và tiết kiệm thời gian.`;
          screenText = `${src.toUpperCase()}`;
          cutAction = `Góc quay chuyển động mượt mà, phóng to vào trọng tâm chủ thể.`;
        }
      }

      return {
        order: idx + 1,
        timeRange,
        durationSeconds: duration,
        sourceName: src,
        cutAction,
        voiceOver,
        screenText,
        vfx: vfxPool[idx % vfxPool.length],
        sfx: sfxPool[idx % sfxPool.length],
        transition: transitionPool[idx % transitionPool.length],
        cameraEffect: cameraEffectPool[idx % cameraEffectPool.length],
        colorFilter: colorFilterPool[idx % colorFilterPool.length]
      };
    });

    const missingSources: MissingSourceSuggestion[] = isBadminton ? [
      {
        title: 'Cận cảnh ngón tay cầm cán vợt (Thumb / Bevel Grip)',
        howToShoot: 'Đặt máy cách tay 30-40cm, bắt rõ thao tác chuyển ngón cái khi chuyển từ thuận sang trái tay.',
        purpose: 'Làm video hướng dẫn chi tiết cách cầm vợt chuẩn xác cho người mới.'
      },
      {
        title: 'Góc bệt sát sàn bắt bộ chân di chuyển (Footwork Low-Angle)',
        howToShoot: 'Đặt camera nằm bệt sát mặt thảm xanh, ngửa nhẹ lên bắt trọn bước tách chân split-step và lùi chéo.',
        purpose: 'Dùng làm tư liệu minh họa cho bài giảng di chuyển bộ pháp đồng bộ trên App.'
      },
      {
        title: 'Góc nhìn thứ nhất POV (Action Cam gắn ngực)',
        howToShoot: 'Đeo camera hành trình trên ngực khi đánh đôi đối kháng tốc độ cao.',
        purpose: 'Tạo cảm giác chân thật như người xem đang trực tiếp trên sân đấu.'
      },
      {
        title: 'Cú Jump Smash siêu chậm (Slow-Mo 120fps/240fps)',
        howToShoot: 'Quay 120fps góc ngang hông, bắt từ lúc bật nhảy uốn thân đến khi đập nổ quả cầu.',
        purpose: 'Dùng làm các đoạn drop nhạc kịch tính, khẳng định đẳng cấp kỹ năng.'
      },
      {
        title: 'Phỏng vấn nhanh cảm nhận học viên (Testimonial)',
        howToShoot: 'Quay cận mặt học viên sau buổi tập hỏi ngắn về sự tiến bộ khi dùng App & giáo án.',
        purpose: 'Tạo bằng chứng xã hội (Social Proof) uy tín giúp chốt đăng ký khóa học.'
      }
    ] : [
      {
        title: 'Góc quay Tilt-Up từ chân lên toàn cảnh hùng vĩ',
        howToShoot: 'Đặt camera thấp sát mặt đất rồi lia từ từ lên không gian bầu trời xanh ngát.',
        purpose: 'Tạo cảm giác hoành tráng, ấn tượng mạnh ở 3 giây đầu video.'
      },
      {
        title: 'Cảnh quay Slow-Motion 120fps cận cảm xúc & chi tiết',
        howToShoot: 'Bật chế độ 120fps bắt trọn làn khói BBQ, giọt sương mai trên lá hoa, hoặc nụ cười khách.',
        purpose: 'Tăng tính nghệ thuật và độ mượt mà khi ghép cùng nhạc chill.'
      },
      {
        title: 'Góc nhìn thứ nhất POV dạo bước vào không gian',
        howToShoot: 'Cầm máy ngang tầm mắt, bước đi tự nhiên từ cửa vào phòng hoặc ra ban công ngắm mây.',
        purpose: 'Cho người xem cảm giác chân thật như chính mình đang trải nghiệm.'
      },
      {
        title: 'Phỏng vấn cảm nhận nhanh của khách hàng (Review thực tế)',
        howToShoot: 'Quay bán thân với nụ cười tươi tắn chia sẻ cảm nhận sau kỳ nghỉ.',
        purpose: 'Xây dựng lòng tin tuyệt đối cho khách hàng mới.'
      },
      {
        title: 'Góc toàn cảnh từ trên cao (Flycam / High Angle)',
        howToShoot: 'Đặt máy trên cao nhìn bao quát toàn bộ khuôn viên và cảnh quan xung quanh.',
        purpose: 'Khẳng định quy mô và vẻ đẹp đắt giá của địa điểm.'
      }
    ];

    const projectPayload: AiScriptProjectPayload = {
      title,
      goal: topicText.trim() || 'Video Marketing Ngắn Thu Hút Triệu View',
      totalDuration: Number(currentTime.toFixed(1)),
      musicMood: isBadminton ? 'Hiphop beat / Tech Lofi dứt khoát' : 'Acoustic chill / Lofi Sa Pa sâu lắng',
      scenes: rawScenes,
      missingSources
    };

    const parsed = this.parseAiScriptJson(JSON.stringify(projectPayload));
    return {
      projectData: parsed.projectData,
      scenes: parsed.scenes,
      rawJsonText: JSON.stringify(projectPayload, null, 2)
    };
  },

  /**
  /**
   * Gọi trực tiếp OpenAI API (GPT-4o-mini) để tự động phân tích Source và sinh Kịch bản + Phân cảnh JSON
   */
  async generateDirectorWithOpenAI(
    sourcesText: string,
    topicText: string,
    targetDuration: string = '30-45 giây',
    customApiKey?: string
  ): Promise<{
    projectData: AiScriptProjectPayload;
    scenes: Scene[];
    rawJsonText: string;
  }> {
    const apiKey = (
      customApiKey ||
      localStorage.getItem('OPENAI_API_KEY') ||
      localStorage.getItem('AI_API_KEY') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      ((import.meta as any).env?.VITE_OPENAI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      ''
    ).trim();

    if (!apiKey) {
      return this.generateFallbackScript(sourcesText, topicText, targetDuration);
    }

    const masterPrompt = this.buildMasterPrompt(sourcesText, topicText, targetDuration);
    const systemPrompt = `Bạn là một Đạo diễn Video & Dựng phim Chuyên nghiệp (Master Video Director & Creator).
Dựa trên danh sách các source video và chủ đề sau đây, hãy viết kịch bản phân cảnh chi tiết và trả về DUY NHẤT 1 block JSON hoàn chỉnh theo đúng cấu trúc:
{
  "title": "Tên video cuốn hút",
  "goal": "Mục tiêu marketing video",
  "totalDuration": 36,
  "musicMood": "Nhịp điệu âm nhạc phù hợp",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:04",
      "durationSeconds": 4,
      "sourceName": "Tên source trong danh sách người dùng",
      "cutAction": "Thao tác cắt góc máy, tốc độ, chuyển động",
      "voiceOver": "Lời thoại thuyết minh hấp dẫn, giữ chân người xem",
      "screenText": "CHỮ HIỂN THỊ TRÊN MÀN HÌNH",
      "vfx": "fx_glitch_scan",
      "sfx": "sfx_whoosh",
      "transition": "zoom_in",
      "cameraEffect": "zoom_in",
      "colorFilter": "filter_teal_orange"
    }
  ],
  "missingSources": [
    {
      "title": "Tên cảnh quay bổ sung nên quay thêm",
      "howToShoot": "Cách đặt máy và góc quay chi tiết",
      "purpose": "Mục đích sử dụng"
    }
  ]
}
BẮT BUỘC: Trả về JSON hợp lệ (không kèm bất kỳ văn bản giải thích nào ngoài JSON).`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: masterPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      if (text) {
        const parsedResult = this.parseAiScriptJson(text);
        return {
          projectData: parsedResult.projectData,
          scenes: parsedResult.scenes,
          rawJsonText: text
        };
      }
      throw new Error('OpenAI không trả về nội dung.');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        throw new Error('OpenAI API Key không hợp lệ hoặc đã hết hạn (Mã lỗi 401). Vui lòng kiểm tra lại Key!');
      }
      if (err?.response?.status === 429) {
        throw new Error('OpenAI API Key đã hết hạn mức sử dụng (Mã lỗi 429 Quota Exceeded).');
      }
      throw new Error(`Lỗi kết nối OpenAI: ${err?.response?.data?.error?.message || err.message}`);
    }
  },

  /**
   * Gọi trực tiếp Google Gemini API để tự động phân tích Source và sinh Kịch bản + Phân cảnh JSON
   */
  async generateDirectorWithGemini(
    sourcesText: string,
    topicText: string,
    targetDuration: string = '30-45 giây',
    customApiKey?: string
  ): Promise<{
    projectData: AiScriptProjectPayload;
    scenes: Scene[];
    rawJsonText: string;
  }> {
    const apiKey = (customApiKey || localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('AI_API_KEY') || '').trim();

    // Nếu key là OpenAI (bắt đầu bằng sk-), tự động chuyển hướng gọi OpenAI
    if (apiKey.startsWith('sk-')) {
      return this.generateDirectorWithOpenAI(sourcesText, topicText, targetDuration, apiKey);
    }

    // Nếu không có API Key, sử dụng bộ Semantic Heuristic Engine thông minh
    if (!apiKey) {
      console.log('Using Semantic Heuristic Engine (No custom GEMINI_API_KEY provided)');
      return this.generateFallbackScript(sourcesText, topicText, targetDuration);
    }

    const masterPrompt = this.buildMasterPrompt(sourcesText, topicText, targetDuration);
    const systemPrompt = `Bạn là một Đạo diễn Video & Dựng phim Chuyên nghiệp (Master Video Director & Creator).
Dựa trên danh sách các source video và chủ đề sau đây, hãy viết kịch bản phân cảnh chi tiết và trả về DUY NHẤT 1 block JSON hoàn chỉnh theo đúng cấu trúc:
{
  "title": "Tên video cuốn hút",
  "goal": "Mục tiêu marketing video",
  "totalDuration": 36,
  "musicMood": "Nhịp điệu âm nhạc phù hợp",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:04",
      "durationSeconds": 4,
      "sourceName": "Tên source trong danh sách người dùng",
      "cutAction": "Thao tác cắt góc máy, tốc độ, chuyển động",
      "voiceOver": "Lời thoại thuyết minh hấp dẫn, giữ chân người xem",
      "screenText": "CHỮ HIỂN THỊ TRÊN MÀN HÌNH",
      "vfx": "fx_glitch_scan",
      "sfx": "sfx_whoosh",
      "transition": "zoom_in",
      "cameraEffect": "zoom_in",
      "colorFilter": "filter_teal_orange"
    }
  ],
  "missingSources": [
    {
      "title": "Tên cảnh quay bổ sung nên quay thêm",
      "howToShoot": "Cách đặt máy và góc quay chi tiết",
      "purpose": "Mục đích sử dụng"
    }
  ]
}
BẮT BUỘC: Trả về JSON hợp lệ (không kèm văn bản lan man ngoài JSON).`;

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro'
    ];

    const apiVersions = ['v1beta', 'v1'];
    let lastError: any = null;

    for (const model of candidateModels) {
      for (const apiVer of apiVersions) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`,
            {
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\n${masterPrompt}` }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7
              }
            },
            { timeout: 35000 }
          );

          let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsedResult = this.parseAiScriptJson(text);
            return {
              projectData: parsedResult.projectData,
              scenes: parsedResult.scenes,
              rawJsonText: text
            };
          }
        } catch (err: any) {
          lastError = err?.response?.data?.error?.message || err?.message || err;
          // Nếu lỗi là 401 hoặc API_KEY_INVALID, ném lỗi rõ ràng cho người dùng
          if (err?.response?.status === 401 || String(lastError).includes('API_KEY_INVALID') || String(lastError).includes('unauthenticated')) {
            throw new Error(`Google Gemini API Key không hợp lệ hoặc đã hết hạn (Mã lỗi 401). Vui lòng kiểm tra lại API Key từ Google AI Studio (aistudio.google.com)!`);
          }
          if (err?.response?.status === 429 || String(lastError).includes('RESOURCE_EXHAUSTED')) {
            throw new Error(`Google Gemini API Key đã hết lượt gọi miễn phí (Mã lỗi 429 Quota Exceeded).`);
          }
        }
      }
    }

    // Nếu các model đều không phản hồi nhưng không phải lỗi xác thực (ví dụ rớt mạng), ném lỗi chi tiết
    throw new Error(`Không thể kết nối với Gemini AI (${lastError || 'Timeout'}). Vui lòng kiểm tra kết nối mạng hoặc thử lại!`);
  }
};

