export type AspectRatio = '9:16' | '16:9' | '1:1';

export type TransitionType =
  | 'fade'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'whip_pan'
  | 'zoom_in'
  | 'zoom_out'
  | 'flash_white'
  | 'digital_glitch'
  | 'cube_flip'
  | 'none';

export type KenBurnsEffect =
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'crash_zoom'
  | 'dutch_angle'
  | 'rack_focus'
  | 'spiral_zoom'
  | 'handheld'
  | 'subtle_float'
  | 'none';

export interface ElementPosition {
  x: number;      // percentage from 0 to 100
  y: number;      // percentage from 0 to 100
  scale?: number; // scale multiplier e.g. 1.0
  rotate?: number;// rotation in degrees
}

export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
  sfxId?: string; // ID âm thanh SFX phát đúng khoảnh khắc nói từ này
}

export interface SubtitleStyle {
  enabled?: boolean; // Bật / Tắt hiển thị toàn bộ chữ phụ đề trên video
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor?: string;
  positionY: number; // percentage from top (e.g. 75)
  positionX?: number; // percentage from left (e.g. 50)
  rotation?: number; // rotation in degrees e.g. 0
  rotate?: number; // alias for rotation
  scale?: number; // scale multiplier e.g. 1.0
  animationStyle: 'pop' | 'glow' | 'bounce' | 'karaoke' | 'box' | 'single_word';
  displayMode?: 'phrase_karaoke' | 'single_word' | 'single_word_spotlight'; // 'phrase_karaoke': Cụm từ | 'single_word': Chạy nối tiếp từ trái qua phải | 'single_word_spotlight': 1 chữ nhảy trái qua phải
  maxWordsPerLine: number;
  uppercase: boolean;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  logoUrl?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
}

export interface SoundFxConfig {
  enableWhoosh: boolean;
  enablePop: boolean;
  volume: number;
}

export type VisualType =
  | 'media'
  | 'chat_bubble'
  | 'orbital_glow'
  | 'math_grid'
  | 'radar_tech'
  | 'night_highway'
  | 'airplane_takeoff'
  | 'stock_chart'
  | 'rolling_counter'
  | 'google_search'
  | 'bank_notification'
  | 'tweet_card'
  | 'code_terminal'
  | 'vs_battle'
  | 'dna_helix'
  | 'green_screen_depth'
  | 'breaking_news';

export interface ChatMessage {
  sender: 'left' | 'right';
  text: string;
}

export interface MotionWordTag {
  text: string;
  size: 'small' | 'medium' | 'large' | 'huge';
  color: string; // hex / rgb / gradient name
  highlight?: boolean;
}

export type MotionPresetStyle =
  | 'mrbeast_tycoon'      // Ảnh 1: Chữ 2 tầng khổng lồ (Trắng & Vàng Cam Gradient), Lưới Grid xanh neon sau lưng, vương miện
  | 'golden_cinematic'     // Ảnh 2: Chữ vàng 3D Bevel ánh kim sang trọng, 2 đồng hồ/props bay 2 bên, rèm ánh sáng
  | 'netflix_glass'        // Ảnh 3: Hộp kính mờ Frosted Glass khổng lồ chuẩn phim tài liệu cao cấp
  | 'callout_pills'        // Ảnh 4: Các viên thuốc Gradient cam Neon (Pill Badges) trôi nổi phát sáng
  | 'custom';

export interface MotionEditConfig {
  enabled: boolean;
  layerOrder: 'behind_person' | 'in_front'; // Chữ nằm sau lưng hay trước mặt người
  gestureMode: 'none' | 'point_spawn' | 'finger_follow' | 'center_depth' | 'floating_sides'; // Chế độ cử chỉ
  fingerAnchor: { x: number; y: number }; // Tọa độ tương đối 0-100% ngón tay chỉ
  backgroundEffect: 'original' | 'blur_depth' | 'darken_glow' | 'cyber_neon' | 'monochrome_bg'; // Hiệu ứng xóa/làm mờ phông
  words: MotionWordTag[];
  customTitle?: string;
  badgeIcon?: string;
  popAnimation: 'spring_bounce' | 'slide_up' | 'elastic_pop' | 'glitch_reveal';
  personCutoutUrl?: string; // Ảnh/video đã bóc tách phông người (nếu có)
  // Các Preset Phong Cách Đỉnh Cao (Theo 4 ảnh mẫu)
  motionStyle?: MotionPresetStyle;
  showCrownProp?: boolean;      // Đội vương miện vàng trên đầu
  showFloatingProps?: boolean;  // 2 đồng hồ 3D bay 2 bên
  showCyberGrid?: boolean;      // Lưới tọa độ Cyber Grid xanh neon
  pillBadges?: { icon: string; text: string }[];
}

export interface BeautyRetouchConfig {
  smoothSkin?: number;      // 0 - 100: Làm mịn da & Xóa mụn tàn nhang
  brightenSkin?: number;    // 0 - 100: Tăng sáng & Trắng da
  slimFace?: number;        // 0 - 100: Gọt cằm V-line & Thon gọn khuôn mặt
  longLegs?: number;        // 0 - 100: Kéo dài chân & Tăng chiều cao Body
  slimBody?: number;        // 0 - 100: Thon gọn vóc dáng Body
  sharpness?: number;       // 0 - 100: Tăng độ nét chi tiết & Căng bóng da
  eyeEnlarge?: number;      // 0 - 100: Làm to mắt & Long lanh
}

export interface Scene {
  id: string;
  order: number;
  narration: string;
  searchKeyword: string;
  sourceName?: string;          // Tên source video cần đưa vào phân cảnh (từ AI JSON)
  cutAction?: string;           // Mô tả thao tác cắt / góc quay / hướng dẫn source (từ AI JSON)
  imagePrompt?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  localMediaPath?: string;
  isGreenScreenMotion?: boolean; // Bật chế độ Video Phông Xanh & Chữ Motion 3D (Trước & Sau Vật Thể)
  textLayerMode?: 'front' | 'behind' | 'both_3d'; // 'front': Luôn ở trước video | 'behind': Chạy ở dưới/sau video | 'both_3d': Đan xen 3D trước & sau
  hideSubtitles?: boolean;       // Tùy chọn ẩn dòng phụ đề ngang mặc định ở dưới
  motionTypographyLayout?: string; // ID preset trong 100 kiểu sắp xếp vị trí
  motionTypographyEffect?: string; // ID preset trong 100 hiệu ứng xuất hiện
  // TikTok & CapCut Creative Pack
  tiktokTextTemplate?: string;     // ID Text Template CapCut
  tiktokTextEffect?: string;       // ID Text Effect ART CapCut
  textEffectsMix?: string[];       // Danh sách Text Effect ART để chạy mix ngẫu nhiên mỗi từ 1 kiểu
  tiktokStickers?: string[];       // Danh sách ID Stickers CapCut
  tiktokVideoEffect?: string;      // ID Video FX CapCut
  tiktokFilter?: string;           // ID Bộ Lọc Màu Điện Ảnh CapCut
  tiktokSfx?: string;              // ID Âm Thanh SFX Editor CapCut
  beautyRetouch?: BeautyRetouchConfig; // Chỉnh sửa khuôn mặt, Body, Kéo chân, Xóa mụn, Tăng nét, Sáng da CapCut
  elementPositions?: Record<string, ElementPosition>; // Vị trí tự do kéo thả chuột (x, y, scale, rotate)
  audioUrl?: string;
  audioDuration: number; // in seconds
  words: WordTimestamp[];
  transition: TransitionType;
  kenBurns: KenBurnsEffect;
  // Transition Custom Audio
  transitionAudioUrl?: string;
  transitionAudioName?: string;
  // Motion Graphics & Visual Layout
  visualType?: VisualType;
  visualScale?: number; // scale multiplier e.g. 1.0, 1.3, 1.6
  headerBadge?: string;
  chatMessages?: ChatMessage[];
  orbitTitle?: string;
  orbitIcon?: string;
  // Video Trimming & Audio Controls
  videoStartOffset?: number; // Giây bắt đầu cắt từ video gốc (dùng cho Remotion startFrom)
  videoEndOffset?: number;   // Giây kết thúc cắt từ video gốc
  sourceVideoUrl?: string;   // URL của video gốc dài
  videoMuted?: boolean;      // Mặc định false (giữ tiếng gốc của video). Nếu true thì tắt tiếng video
  videoVolume?: number;     // Âm lượng video gốc (0.0 đến 1.0)
  // Motion Edit & Gesture Layering
  motionEdit?: MotionEditConfig;
}

export type TrimSide = 'left' | 'right';
export type TrimOverflowOption = 'shift_to_next' | 'shift_to_prev' | 'discard';

export interface VideoSegment {
  id: string;
  order: number;
  title: string;
  sourceUrl: string;
  sourceName?: string;       // Tên file video nguồn (vd: video_homestay_1.mp4)
  startOffset: number;       // Giây bắt đầu trong video gốc (vd: 0.0)
  endOffset: number;         // Giây kết thúc trong video gốc (vd: 10.0)
  duration: number;          // Độ dài của clip con (endOffset - startOffset)
  originalStartOffset?: number; // Mốc giây gốc trong video dài ban đầu
  originalEndOffset?: number;
  isStandalone?: boolean;    // Đã được tách thành file video độc lập siêu mượt
  thumbnail?: string;        // Ảnh chụp thumbnail đại diện của đoạn clip
  narration?: string;        // Kịch bản / lời dẫn (nếu có)
}

export interface TimelineSfxItem {
  id: string;
  sfxId: string;       // ID from SOUND_EFFECTS_LIST
  name: string;
  timestamp: number;   // Second in total video timeline (e.g. 3.5)
  duration: number;    // Duration in seconds (e.g. 0.5)
  volume: number;      // 0.0 to 1.0
  category?: string;
  audioUrl?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  topic: string;
  aspectRatio: AspectRatio;
  fps: number;
  scenes: Scene[];
  totalDuration: number; // in seconds
  voice: {
    name: string;
    rate: string; // e.g. "+0%", "+10%"
    pitch: string; // e.g. "+0Hz"
  };
  subtitleStyle: SubtitleStyle;
  watermark: WatermarkConfig;
  showProgressBar: boolean;
  showHeaderBadge?: boolean; // Bật / Tắt chữ tiêu đề / huy hiệu phía trên video (Mặc định: false)
  showAudioVisualizer?: boolean;
  showCinematicParticles?: boolean;
  showCameraShake?: boolean;
  enableDynamicEmojis?: boolean;
  soundFx: SoundFxConfig;
  timelineSfx?: TimelineSfxItem[]; // Thư viện Sound Effects kéo thả trên timeline
  bgm: {
    url?: string;
    localPath?: string;
    volume: number; // 0 to 1
    duckingVolume: number; // volume during narration (e.g. 0.15)
  };
  status: 'idle' | 'generating' | 'rendering' | 'completed' | 'error';
}

export interface RenderProgress {
  progress: number; // 0 to 100
  status: string;
  outputPath?: string;
  error?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  locale: string;
  gender: 'Female' | 'Male';
  description: string;
}

export const VIETNAMESE_VOICES: VoiceOption[] = [
  // --- 👑 GIỌNG ADAM CHUẨN TIKTOK (ElevenLabs Multilingual v2) ---
  {
    id: 'elevenlabs:pNInz6obpgDQGcFmaJgB',
    name: '👑 Adam AI (ElevenLabs - Nam Trầm Khàn Uy Lực Chuẩn TikTok 100%)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc Adam nguyên bản nổi tiếng thế giới của ElevenLabs. Âm sắc trầm khàn, uy lực, rất cuốn hút, chuẩn 100% phong cách review TikTok triệu view (cần nhập API Key ElevenLabs / VClip trong Cài đặt).'
  },
  {
    id: 'tiktok:en_male_narration',
    name: '🎙️ Adam TikTok Narrator (ByteDance TTS - Giọng Đọc Trầm Viral TikTok)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng nam đọc dẫn truyện truyền thống trên TikTok, âm trầm vang phong cách tài liệu ngắn (100% miễn phí).'
  },
  {
    id: 'vclip:adam',
    name: '🎙️ Adam VClip AI (Viral TikTok Studio - vclip.io)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc Adam AI kết nối qua nền tảng VClip.io.'
  },

  // --- 🇻🇳 GIỌNG TIẾNG VIỆT HOT TIKTOK (100% Miễn phí, Chuẩn Studio Neural) ---
  {
    id: 'vi-VN-NamMinhNeural:fast',
    name: '⚡ Nam Minh Viral TikTok (Reviewer Triệu View, Nhanh Cuốn Hút, Bán Hàng)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng nam đọc tốc độ nhanh (+18%), cuốn hút, giật tít, hoàn hảo cho video ngắn TikTok/Reels triệu view.'
  },
  {
    id: 'vi-VN-NamMinhNeural:recap',
    name: '🔥 Nam Minh Tóm Tắt Phim (Fast Recap TikTok, Review Phim & Truyện Siêu Tốc)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Phong cách tóm tắt phim 1 phút, review anime truyện tranh, nhịp điệu dồn dập kịch tính (+24%).'
  },
  {
    id: 'vi-VN-HoaiMyNeural:live',
    name: '🛍️ Hoài My Livestream Bán Hàng (Viral TikTok, Chốt Đơn Affiliate)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ năng động, tươi tắn, kích thích tương tác và mua hàng trên TikTok Shop, Reels.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:sweet',
    name: '🌸 Hoài My Review Food & Travel (Homestay, Ẩm Thực, Lifestyle Hot)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ ngọt ngào, đáng yêu, chuẩn tone reviewer đồ ăn, quán cafe, du lịch trải nghiệm.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:genz',
    name: '✨ Hoài My Gen Z Cute (Hài Hước, Nhí Nhảnh, Bắt Trend Biến Hình)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ trẻ trung Gen Z, bắt trend TikTok vui nhộn, meme, câu chuyện đời sống viral.'
  },
  {
    id: 'vi-VN-NamMinhNeural',
    name: '🎙️ Nam Minh Trầm Ấm (Quyền Lực, B2B, Công Nghệ & Tài Chính)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng nam ấm áp, đĩnh đạc, uy lực, rất chuẩn cho video phân tích, công nghệ, tài chính, phóng sự.'
  },
  {
    id: 'vi-VN-HoaiMyNeural',
    name: '🇻🇳 Hoài My Phát Thanh Viên (Nữ Truyền Cảm, Nhẹ Nhàng, Tin Tức Recap)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ chuẩn Hà Nội, mượt mà, sâu lắng, phù hợp tin tức chính thống, review homestay, recap.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:story',
    name: '📖 Hoài My Kể Chuyện Đêm (Tâm Sự Sâu Lắng, Sách Nói & Podcast Chữa Lành)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ điềm tĩnh, ấm áp, âm điệu kể chuyện tâm sự đêm muộn, sách nói, podcast du lịch.'
  },
  {
    id: 'vi-VN-NamMinhNeural:deep',
    name: '🎬 Nam Minh Điện Ảnh (Deep Voice, Trailer Phim & Phim Tài Liệu Bom Tấn)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng nam trầm sâu (-8Hz), phong cách điện ảnh Hollywood, trailer phim, bí ẩn, triết lý.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:asmr',
    name: '💅 Hoài My ASMR & Làm Đẹp (Thì Thầm, Dịu Dàng, Skincare Thư Giãn)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng thì thầm êm dịu, mượt mà, phù hợp video mỹ phẩm skincare, ASMR thư giãn ngủ ngon.'
  },
  {
    id: 'vi-VN-NamMinhNeural:meme',
    name: '🤖 Nam Minh AI Robot / Meme (Độc Lạ, Hài Hước, Mẹo Công Nghệ TikTok)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng trầm vang kiểu AI robot thông minh, độc lạ, hợp video thủ thuật mẹo vặt và meme hài.'
  },

  // --- 🇺🇸 🇬🇧 🇦🇺 GIỌNG TIẾNG ANH QUỐC TẾ (English Native Neural - 100% Free) ---
  {
    id: 'en-US-GuyNeural',
    name: '🔥 Guy (US Nam - Năng Động, Tự Tin, Viral Shorts / TikTok)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Energetic American male voice, popular for viral TikTok, tech, and sports.'
  },
  {
    id: 'en-US-JennyNeural',
    name: '✨ Jenny (US Nữ - Sống Động, Lifestyle & Storytelling)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Natural, lively American female voice for global vlogs, travel, and storytelling.'
  },
  {
    id: 'en-US-AriaNeural',
    name: '💎 Aria (US Nữ - Tự Nhiên, Truyền Cảm Hứng, B2B & Ads)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Expressive and highly professional American female voice for luxury & marketing.'
  },
  {
    id: 'en-US-DavisNeural',
    name: '🎥 Davis (US Nam - Trầm Vang, Điện Ảnh & Trailer Phim)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Deep, cinematic American male voice for movie trailers, documentaries, and drama.'
  },
  {
    id: 'en-US-ChristopherNeural',
    name: '📚 Christopher (US Nam - Điềm Đạm, Sách Nói & Chuyên Gia)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Calm, authoritative American male voice for audiobooks, education, and finance.'
  },
  {
    id: 'en-US-EricNeural',
    name: '🚀 Eric (US Nam - Sôi Nổi, Gaming & Hào Hứng)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Fast-paced, upbeat American male voice for gaming, tech reviews, and action shorts.'
  },
  {
    id: 'en-US-MichelleNeural',
    name: '🌿 Michelle (US Nữ - Dịu Dàng, ASMR & Thư Giãn)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Soft, soothing American female voice for wellness, meditation, and beauty.'
  },
  {
    id: 'en-GB-RyanNeural',
    name: '👑 Ryan (British Nam - Quý Ông Nước Anh, Sang Trọng, Sách Nói)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Warm British gentleman voice for luxury brands, audiobooks, and historical docs.'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: '🏰 Sonia (British Nữ - Chuẩn Giọng Hoàng Gia Anh, Quý Phái)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Prestigious British female voice for fashion, luxury hotels, and elegance.'
  },
  {
    id: 'en-AU-WilliamNeural',
    name: '🏄 William (Australian Nam - Úc Phóng Khoáng, Du Lịch & Trải Nghiệm)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Friendly, casual Australian male voice for outdoor adventures and food tours.'
  },
  {
    id: 'en-AU-NatashaNeural',
    name: '🐨 Natasha (Australian Nữ - Úc Tươi Vui, Khám Phá Cuộc Sống)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Bright Australian female voice for lifestyle, travel tips, and youth content.'
  }
];

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  enabled: true,
  fontFamily: 'Montserrat, Inter, sans-serif',
  fontSize: 48,
  textColor: '#FFFFFF',
  highlightColor: '#FACC15', // Vibrant Gold/Yellow
  strokeColor: '#000000',
  strokeWidth: 6,
  positionY: 78,
  animationStyle: 'pop',
  maxWordsPerLine: 4,
  uppercase: true
};

export const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: false,
  text: '',
  position: 'top-right',
  opacity: 0.85
};

export const DEFAULT_SOUND_FX: SoundFxConfig = {
  enableWhoosh: true,
  enablePop: true,
  volume: 0.4
};
