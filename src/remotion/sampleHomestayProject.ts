import { VideoProject, DEFAULT_SUBTITLE_STYLE, DEFAULT_SOUND_FX } from '../types/video';

export const sampleHomestayProject: VideoProject = {
  id: 'lado-homestay-sapa-showcase',
  title: '🏔️ LÁ ĐỎ HOMESTAY SA PA - CHỐN NGHỈ DƯỠNG SĂN MÂY',
  topic: 'Giới thiệu không gian phòng nghỉ, săn mây thung lũng Mường Hoa và trải nghiệm chữa lành tại Sa Pa',
  aspectRatio: '9:16',
  fps: 30,
  totalDuration: 18.0,
  voice: {
    name: 'vi-VN-HoaiMyNeural',
    rate: '+0%',
    pitch: '+0Hz'
  },
  subtitleStyle: {
    ...DEFAULT_SUBTITLE_STYLE,
    fontSize: 42,
    highlightColor: '#FACC15',
    textColor: '#FFFFFF',
    strokeWidth: 3,
    strokeColor: '#000000',
    positionY: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  watermark: {
    enabled: true,
    text: '@LaDoHomestaySaPa',
    position: 'top-right',
    opacity: 0.9
  },
  showProgressBar: true,
  soundFx: DEFAULT_SOUND_FX,
  bgm: {
    url: '/audio/bgm-lofi.wav',
    volume: 0.25,
    duckingVolume: 0.08
  },
  status: 'idle',
  scenes: [
    {
      id: 'homestay-scene-1',
      order: 1,
      narration: 'Chào mừng bạn đến với Lá Đỏ Homestay Sa Pa, nơi mây ôm trọn thung lũng Mường Hoa mỗi sớm mai.',
      searchKeyword: 'sapa valley mountains clouds landscape vietnam nature',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.5,
      words: [
        { word: 'Chào', start: 0.1, end: 0.35 },
        { word: 'mừng', start: 0.35, end: 0.65 },
        { word: 'bạn', start: 0.65, end: 0.9 },
        { word: 'đến', start: 0.9, end: 1.15 },
        { word: 'với', start: 1.15, end: 1.35 },
        { word: 'Lá', start: 1.35, end: 1.6 },
        { word: 'Đỏ', start: 1.6, end: 1.85 },
        { word: 'Homestay,', start: 1.85, end: 2.3 },
        { word: 'nơi', start: 2.35, end: 2.6 },
        { word: 'mây', start: 2.6, end: 2.85 },
        { word: 'ôm', start: 2.85, end: 3.1 },
        { word: 'trọn', start: 3.1, end: 3.35 },
        { word: 'thung', start: 3.35, end: 3.6 },
        { word: 'lũng.', start: 3.6, end: 4.5 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_oscar_gold',
      tiktokFilter: 'filter_cinema_warm',
      tiktokSfx: 'sfx_sparkle',
      transition: 'fade',
      kenBurns: 'zoom_in'
    },
    {
      id: 'homestay-scene-2',
      order: 2,
      narration: 'Thưởng thức tách cà phê ấm nóng bên ban công lộng gió và hít hà không khí trong lành của núi rừng.',
      searchKeyword: 'coffee cup wooden balcony mountain view cozy morning',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.5,
      words: [
        { word: 'Thưởng', start: 0.1, end: 0.4 },
        { word: 'thức', start: 0.4, end: 0.7 },
        { word: 'tách', start: 0.7, end: 0.95 },
        { word: 'cà', start: 0.95, end: 1.2 },
        { word: 'phê', start: 1.2, end: 1.45 },
        { word: 'ấm', start: 1.45, end: 1.7 },
        { word: 'nóng', start: 1.7, end: 1.95 },
        { word: 'bên', start: 1.95, end: 2.2 },
        { word: 'ban', start: 2.2, end: 2.45 },
        { word: 'công', start: 2.45, end: 2.7 },
        { word: 'lộng', start: 2.7, end: 2.95 },
        { word: 'gió.', start: 2.95, end: 4.5 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_warm_gold_aura',
      tiktokFilter: 'filter_cinema_warm',
      tiktokSfx: 'sfx_woosh',
      transition: 'slide_left',
      kenBurns: 'pan_right'
    },
    {
      id: 'homestay-scene-3',
      order: 3,
      narration: 'Không gian phòng nghỉ mộc mạc, tiện nghi ấm cúng, mang đến cảm giác an yên như ở chính ngôi nhà của mình.',
      searchKeyword: 'cozy boutique bedroom wooden interior hotel room warm lighting',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.8,
      words: [
        { word: 'Không', start: 0.1, end: 0.35 },
        { word: 'gian', start: 0.35, end: 0.6 },
        { word: 'phòng', start: 0.6, end: 0.85 },
        { word: 'nghỉ', start: 0.85, end: 1.1 },
        { word: 'ấm', start: 1.1, end: 1.35 },
        { word: 'cúng,', start: 1.35, end: 1.65 },
        { word: 'mộc', start: 1.7, end: 1.95 },
        { word: 'mạc', start: 1.95, end: 2.2 },
        { word: 'và', start: 2.2, end: 2.4 },
        { word: 'thư', start: 2.4, end: 2.65 },
        { word: 'giãn.', start: 2.65, end: 4.8 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_clean_white_shadow',
      tiktokFilter: 'filter_cinema_warm',
      tiktokSfx: 'sfx_chime',
      transition: 'zoom_in',
      kenBurns: 'zoom_in'
    },
    {
      id: 'homestay-scene-4',
      order: 4,
      narration: 'Lên lịch cho kỳ nghỉ tại Sa Pa ngay hôm nay và nhận trọn vẹn ưu đãi độc quyền từ Lá Đỏ Homestay!',
      searchKeyword: 'sapa sunset glowing wooden cabin mountain evening travel',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.2,
      words: [
        { word: 'Lên', start: 0.1, end: 0.35 },
        { word: 'lịch', start: 0.35, end: 0.6 },
        { word: 'nghỉ', start: 0.6, end: 0.85 },
        { word: 'dưỡng', start: 0.85, end: 1.15 },
        { word: 'ngay', start: 1.15, end: 1.4 },
        { word: 'hôm', start: 1.4, end: 1.65 },
        { word: 'nay', start: 1.65, end: 1.9 },
        { word: 'cùng', start: 1.9, end: 2.15 },
        { word: 'Lá', start: 2.15, end: 2.4 },
        { word: 'Đỏ', start: 2.4, end: 2.65 },
        { word: 'Homestay!', start: 2.65, end: 4.2 }
      ],
      textLayerMode: 'front',
      tiktokTextEffect: 'tfx_hot_pink_pop',
      tiktokFilter: 'filter_cinema_warm',
      tiktokSfx: 'sfx_success_chime',
      transition: 'fade',
      kenBurns: 'subtle_float'
    }
  ]
};
