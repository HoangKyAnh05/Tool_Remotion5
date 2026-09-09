import { VideoProject, DEFAULT_SUBTITLE_STYLE, DEFAULT_WATERMARK, DEFAULT_SOUND_FX } from '../types/video';

export const maxShowcaseProject: VideoProject = {
  id: 'max-showcase-storytelling',
  title: '✨ Kịch bản mẫu: Giới thiệu Homestay (Cinematic Showcase)',
  topic: 'Kịch bản giới thiệu homestay phong cách điện ảnh cao cấp, chữ chạy mượt mà, không rối mắt',
  aspectRatio: '9:16',
  fps: 30,
  totalDuration: 22.0,
  voice: {
    name: 'vi-VN-NamMinhNeural',
    rate: '+0%',
    pitch: '+0Hz'
  },
  subtitleStyle: {
    ...DEFAULT_SUBTITLE_STYLE,
    fontSize: 42,
    highlightColor: '#FBBF24',
    textColor: '#FFFFFF',
    strokeWidth: 2,
    strokeColor: '#000000',
    positionY: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  watermark: DEFAULT_WATERMARK,
  showProgressBar: true,
  soundFx: DEFAULT_SOUND_FX,
  bgm: {
    url: '/audio/bgm-lofi.wav',
    volume: 0.28,
    duckingVolume: 0.10
  },
  status: 'idle',
  scenes: [
    // =========================================================================
    // CẢNH 1: CÚ HOOK 3 GIÂY - MỞ ĐẦU ĐIỆN ẢNH ĐĨNH ĐẠC
    // =========================================================================
    {
      id: 'story-scene-1',
      order: 1,
      narration: 'Xin chào, tôi không phải là một chuyên gia nói đạo lý suông.',
      searchKeyword: 'young man working focused desk laptop warm light cinema',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.2,
      words: [
        { word: 'Xin', start: 0.1, end: 0.35 },
        { word: 'chào,', start: 0.35, end: 0.7 },
        { word: 'tôi', start: 0.8, end: 1.05 },
        { word: 'không', start: 1.05, end: 1.35 },
        { word: 'phải', start: 1.35, end: 1.65 },
        { word: 'là', start: 1.65, end: 1.9 },
        { word: 'chuyên', start: 1.9, end: 2.25 },
        { word: 'gia', start: 2.25, end: 2.55 },
        { word: 'nói', start: 2.65, end: 2.95 },
        { word: 'đạo', start: 2.95, end: 3.25 },
        { word: 'lý', start: 3.25, end: 3.55 },
        { word: 'suông.', start: 3.55, end: 4.2 }
      ],
      textLayerMode: 'front',                         // Chữ nổi ở TRƯỚC video rõ nét
      tiktokTextEffect: 'tfx_golden_aura_black',     // Chữ đen tuyền viền hào quang vàng hổ phách dịu
      tiktokFilter: 'filter_cinema_warm',            // Tone màu điện ảnh ấm áp
      tiktokSfx: 'sfx_whoosh_clean_air',             // Gió lướt êm dịu khi mở đầu
      transition: 'fade',
      kenBurns: 'zoom_in'
    },

    // =========================================================================
    // CẢNH 2: XUẤT PHÁT ĐIỂM - HÀNH TRÌNH TỪ CON SỐ 0 TRÒN TRĨNH
    // =========================================================================
    {
      id: 'story-scene-2',
      order: 2,
      narration: 'Tôi từng bắt đầu mọi thứ từ con số không tròn trĩnh.',
      searchKeyword: 'empty desk notebook late night studying work hard',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.0,
      words: [
        { word: 'Tôi', start: 0.1, end: 0.4 },
        { word: 'từng', start: 0.4, end: 0.7 },
        { word: 'bắt', start: 0.7, end: 1.0 },
        { word: 'đầu', start: 1.0, end: 1.3 },
        { word: 'mọi', start: 1.4, end: 1.7 },
        { word: 'thứ', start: 1.7, end: 2.0 },
        { word: 'từ', start: 2.0, end: 2.3 },
        { word: 'con', start: 2.3, end: 2.6 },
        { word: 'số', start: 2.6, end: 2.9 },
        { word: 'không', start: 2.9, end: 3.3 },
        { word: 'tròn', start: 3.3, end: 3.6 },
        { word: 'trĩnh.', start: 3.6, end: 4.0 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_torn_paper_mono',       // Chữ trên dải giấy xé thủ công tối giản kiểu Studio
      tiktokFilter: 'filter_vintage_retro',          // Lọc màu hoài niệm trầm lắng
      tiktokSfx: 'sfx_camera_snap',                  // Tiếng chụp màn trập nhẹ
      transition: 'fade',
      kenBurns: 'pan_right'
    },

    // =========================================================================
    // CẢNH 3: BƯỚC NGOẶT THỨC TỈNH - NĂNG LƯỢNG TÍCH CỰC
    // =========================================================================
    {
      id: 'story-scene-3',
      order: 3,
      narration: 'Cho đến khi tôi nhận ra: Kỷ luật quan trọng hơn cảm hứng!',
      searchKeyword: 'modern city sunrise street walking confidently success',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.5,
      words: [
        { word: 'Cho', start: 0.1, end: 0.35 },
        { word: 'đến', start: 0.35, end: 0.65 },
        { word: 'khi', start: 0.65, end: 0.95 },
        { word: 'tôi', start: 0.95, end: 1.25 },
        { word: 'nhận', start: 1.25, end: 1.55 },
        { word: 'ra:', start: 1.55, end: 1.85 },
        { word: 'Kỷ', start: 2.0, end: 2.35 },
        { word: 'luật', start: 2.35, end: 2.75 },
        { word: 'quan', start: 2.85, end: 3.2 },
        { word: 'trọng', start: 3.2, end: 3.55 },
        { word: 'hơn', start: 3.55, end: 3.85 },
        { word: 'cảm', start: 3.85, end: 4.15 },
        { word: 'hứng!', start: 4.15, end: 4.5 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_fire_inferno',          // Chữ rực lửa viền đen đậm nét, tương phản cực mạnh trên nền sáng
      tiktokFilter: 'filter_fresh_glow',             // Tươi sáng rạng ngời
      tiktokSfx: 'sfx_cinematic_impact',             // Tiếng đệm trầm vang dứt khoát
      transition: 'flash_white',
      kenBurns: 'zoom_in'
    },

    // =========================================================================
    // CẢNH 4: THÀNH QUẢ & GIÁ TRỊ THỰC TẾ
    // =========================================================================
    {
      id: 'story-scene-4',
      order: 4,
      narration: 'Tôi ở đây để giúp bạn rút ngắn con đường đi đến thành công.',
      searchKeyword: 'business meeting collaboration handshake success modern office',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.5,
      words: [
        { word: 'Tôi', start: 0.1, end: 0.35 },
        { word: 'ở', start: 0.35, end: 0.6 },
        { word: 'đây', start: 0.6, end: 0.85 },
        { word: 'để', start: 0.95, end: 1.2 },
        { word: 'giúp', start: 1.2, end: 1.5 },
        { word: 'bạn', start: 1.5, end: 1.8 },
        { word: 'rút', start: 1.9, end: 2.2 },
        { word: 'ngắn', start: 2.2, end: 2.5 },
        { word: 'con', start: 2.5, end: 2.8 },
        { word: 'đường', start: 2.8, end: 3.1 },
        { word: 'đi', start: 3.2, end: 3.5 },
        { word: 'đến', start: 3.5, end: 3.8 },
        { word: 'thành', start: 3.8, end: 4.1 },
        { word: 'công.', start: 4.1, end: 4.5 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_oscar_gold',            // Chữ vàng óng ánh sang trọng chuẩn Hollywood
      tiktokFilter: 'filter_teal_orange',            // Màu điện ảnh Teal & Orange
      tiktokSfx: 'sfx_level_up',                     // Tiếng thăng hạng Level-Up
      transition: 'zoom_in',
      kenBurns: 'pan_left'
    },

    // =========================================================================
    // CẢNH 5: LỜI KÊU GỌI ĐỒNG HÀNH TINH TẾ (OUTRO)
    // =========================================================================
    {
      id: 'story-scene-5',
      order: 5,
      narration: 'Nếu bạn sẵn sàng thay đổi, hãy cùng tôi bắt đầu ngay hôm nay!',
      searchKeyword: 'smiling confident mentor friendly portrait looking at camera',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.8,
      words: [
        { word: 'Nếu', start: 0.1, end: 0.35 },
        { word: 'bạn', start: 0.35, end: 0.65 },
        { word: 'sẵn', start: 0.65, end: 0.95 },
        { word: 'sàng', start: 0.95, end: 1.25 },
        { word: 'thay', start: 1.35, end: 1.65 },
        { word: 'đổi,', start: 1.65, end: 2.0 },
        { word: 'hãy', start: 2.1, end: 2.4 },
        { word: 'cùng', start: 2.4, end: 2.7 },
        { word: 'tôi', start: 2.7, end: 3.0 },
        { word: 'bắt', start: 3.1, end: 3.4 },
        { word: 'đầu', start: 3.4, end: 3.7 },
        { word: 'ngay', start: 3.7, end: 4.1 },
        { word: 'hôm', start: 4.1, end: 4.4 },
        { word: 'nay!', start: 4.4, end: 4.8 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_warm_gold_aura',        // Đỏ Hào Quang Vàng ấm áp, gắn kết
      tiktokFilter: 'filter_cinema_warm',            // Tone màu ấm chân thực
      tiktokSfx: 'sfx_success_chime',                // Chuông ngân kết thúc viên mãn
      transition: 'fade',
      kenBurns: 'zoom_out'
    }
  ]
};
