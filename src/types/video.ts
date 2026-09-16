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
  // --- 👑 BỘ SƯU TẬP 9 GIỌNG ĐỌC THẬT TIẾNG VIỆT (100% Piper VITS Neural Model Riêng Biệt, Không Ghép Tạp) ---
  {
    id: 'piper:ngochuyen',
    name: '🌸 Nữ Ngọc Huyền (Nữ Miền Bắc - 100% Model VITS ngochuyen.onnx, Truyền Cảm, Liền Mạch)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng đọc nữ Ngọc Huyền thật 100% qua mô hình Piper VITS, đọc liền mạch mượt mà theo từng câu văn, phát âm chuẩn xác, không bị ngắt quãng đánh vần.'
  },
  {
    id: 'piper:manhdung',
    name: '🎙️ Nam Mạnh Dũng (Nam Miền Bắc - 100% Model VITS manhdung.onnx, Trầm Ấm, Uy Lực)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc nam Mạnh Dũng thật 100% qua mô hình Piper VITS, âm sắc trầm ấm đĩnh đạc, ngữ điệu tự nhiên, luyến láy trôi chảy chuẩn phòng thu.'
  },
  {
    id: 'piper:adam',
    name: '👑 Nam Adam AI Studio (Nam Trầm Khàn - 100% Model VITS adam1.onnx Chuẩn TikTok 100%)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc nam Adam AI nguyên bản qua mô hình Piper VITS adam1, tông nam trầm khàn uy lực đặc trưng triệu view.'
  },
  {
    id: 'piper:banmai',
    name: '✨ Nữ Ban Mai (Nữ Miền Bắc - 100% Model VITS banmai.onnx, Trong Trẻo Ngọt Ngào)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng đọc nữ Ban Mai trong trẻo, tự nhiên, tươi tắn, chuẩn review ẩm thực du lịch và quảng cáo.'
  },
  {
    id: 'piper:tranthanh',
    name: '🌟 Nam Trấn Thành (Nam Miền Nam - 100% Model VITS Clone tranthanh3870.onnx)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Mô hình Neural VITS Voice Clone huấn luyện trực tiếp từ giọng nghệ sĩ Trấn Thành sôi nổi, cuốn hút, bắt trend TikTok và giải trí.'
  },
  {
    id: 'piper:vietthao',
    name: '📖 MC Việt Thảo (Nam Miền Nam - 100% Model VITS Clone vietthao3886.onnx)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Mô hình Neural VITS Voice Clone huấn luyện trực tiếp từ giọng MC Việt Thảo trầm lắng, lôi cuốn, chuyên dụng kể chuyện ma và phóng sự.'
  },
  {
    id: 'piper:ngocngan',
    name: '📚 MC Nguyễn Ngọc Ngạn (Nam Miền Bắc - 100% Model VITS Clone ngocngan3701.onnx)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Mô hình Neural VITS Voice Clone huấn luyện trực tiếp từ giọng MC Nguyễn Ngọc Ngạn trầm ấm, điềm đạm, lắng đọng cho podcast và truyện đêm khuya.'
  },
  {
    id: 'piper:maiphuong',
    name: '🌷 Nữ Mai Phương (Nữ Miền Nam - 100% Model VITS maiphuong.onnx, Dịu Dàng Sâu Lắng)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng đọc nữ Mai Phương miền Nam ngọt ngào, nhẹ nhàng, truyền cảm cho vlog tâm sự và du lịch trải nghiệm.'
  },
  {
    id: 'piper:chieuthanh',
    name: '🎬 Nam Chiêu Thanh (Nam Miền Nam - 100% Model VITS chieuthanh.onnx, Lồng Tiếng TVB)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Mô hình Neural VITS Voice Clone huấn luyện từ giọng diễn viên lồng tiếng Chiêu Thanh trong phim kiếm hiệp Hong Kong kinh điển.'
  },

  // --- 🇺🇸🇬🇧 BỘ SƯU TẬP 5 GIỌNG ĐỌC THẬT TIẾNG ANH (100% Piper VITS US & UK Studio Model Riêng) ---
  {
    id: 'piper:en_ryan',
    name: '🎙️ Ryan (US Male - 100% Model VITS en_ryan.onnx, Tech Reviewer & Gaming)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Mô hình VITS giọng nam Mỹ Ryan hiện đại, trẻ trung, tự tin, chuyên dụng video công nghệ và gaming.'
  },
  {
    id: 'piper:en_amy',
    name: '🌸 Amy (US Female - 100% Model VITS en_amy.onnx, Lifestyle & Vlogs)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Mô hình VITS giọng nữ Mỹ Amy tự nhiên, gần gũi, phát âm chuẩn bản xứ cho video lifestyle và du lịch.'
  },
  {
    id: 'piper:en_lessac',
    name: '📚 Lessac (US Female - 100% Model VITS en_lessac.onnx, AudioBook New York)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Mô hình VITS giọng nữ Catherine Lessac chuẩn phòng thu New York, sâu lắng cho podcast tài liệu và tóm tắt sách.'
  },
  {
    id: 'piper:en_alan',
    name: '👑 Sir Alan (UK British Male - 100% Model VITS en_alan.onnx, Quý Tộc BBC)',
    locale: 'en-GB',
    gender: 'Male',
    description: 'Mô hình VITS giọng nam Anh Quốc Alan trầm hùng, thông thái, quý phái chuẩn phong cách phim tài liệu khoa học và lịch sử.'
  },
  {
    id: 'piper:en_joe',
    name: '⚡ Joe (US Deep Male - 100% Model VITS en_joe.onnx, Motivation & Trailer)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Mô hình VITS giọng nam Mỹ Joe siêu trầm, cuốn hút, video truyền động lực và trailer phim.'
  },

  // --- 🌸 GIỌNG ĐỌC NỮ TIẾNG VIỆT (Edge-TTS 100% Free, Ngọt Ngào & Truyền Cảm) ---
  {
    id: 'vi-VN-HoaiMyNeural:sweet',
    name: '🌸 Nữ Hoài My - Reviewer Ngọt Ngào (Food, Travel, Cafe, Homestay - 100% Free)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ ngọt ngào, tươi tắn, âm sắc trong trẻo tự nhiên, chuẩn tone reviewer ẩm thực, du lịch trải nghiệm.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:live',
    name: '🛍️ Nữ Hoài My - Livestream Bán Hàng (TikTok Shop Năng Động, Chốt Đơn - 100% Free)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ sôi động, nhịp điệu nhanh, cuốn hút khách hàng và kích thích chuyển đổi đơn hàng.'
  },
  {
    id: 'vi-VN-HoaiMyNeural',
    name: '🇻🇳 Nữ Hoài My - Phát Thanh Viên (Truyền Cảm, Chuẩn Giọng Hà Nội - 100% Free)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ chuẩn Hà Nội, mượt mà, sâu lắng, tin tức chính thống, giới thiệu sản phẩm trang trọng.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:genz',
    name: '✨ Nữ Hoài My - GenZ Bắt Trend (Nhí Nhảnh, Hài Hước, Tươi Tắn - 100% Free)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ tươi vui, trẻ trung, phù hợp video giải trí, meme, drama TikTok.'
  },
  {
    id: 'vi-VN-HoaiMyNeural:story',
    name: '📖 Nữ Hoài My - Tâm Sự & Kể Chuyện (Sâu Lắng, Podcast Cảm Xúc - 100% Free)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ trầm lắng, tình cảm, phù hợp podcast tâm sự, chuyện đêm muộn, triết lý cuộc sống.'
  },

  // --- 🎙️ GIỌNG ĐỌC NAM TIẾNG VIỆT (100% Miễn Phí, Trầm Ấm, Uy Lực) ---
  {
    id: 'vi-VN-NamMinhNeural',
    name: '🎙️ Nam Minh - Studio TikTok (Nam Trầm Ấm, Quyền Lực, Review Triệu View - 100% Free)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc Nam tiêu chuẩn Studio, âm sắc trầm ấm, đĩnh đạc, phát âm tròn vành rõ chữ, tự động căn chuẩn nhịp từng từ phụ đề.'
  },
  {
    id: 'vi-VN-NamMinhNeural:fast',
    name: '⚡ Nam Minh - Nam Viral TikTok (Nhanh Cuốn Hút, Review Bán Hàng - 100% Free)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Phong cách đọc nhanh cuốn hút, bắt trend, giật tít kịch tính cho video ngắn TikTok/Reels.'
  },
  {
    id: 'vi-VN-NamMinhNeural:recap',
    name: '🔥 Nam Minh - Tóm Tắt Phim (Recap Siêu Tốc, Anime & Truyện Tranh - 100% Free)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc tóm tắt phim dồn dập, kịch tính, phong cách review truyện tranh triệu view.'
  },

  // --- 👑 GIỌNG ADAM NGUYÊN BẢN (Dành cho ai có Key ElevenLabs / VClip) ---
  {
    id: 'elevenlabs:pNInz6obpgDQGcFmaJgB',
    name: '👑 Adam AI (ElevenLabs - Nam Trầm Khàn Uy Lực Chuẩn TikTok 100%)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc Adam nguyên bản của ElevenLabs (cần nhập API Key ElevenLabs trong Cài đặt).'
  },
  {
    id: 'vclip:adam',
    name: '🎙️ Adam VClip AI (Viral TikTok Studio - vclip.io)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng đọc Adam AI kết nối qua nền tảng VClip.io (cần nhập API Key VClip trong Cài đặt).'
  },

  // --- 🇺🇸 🇬🇧 GIỌNG TIẾNG ANH (100% Free) ---
  {
    id: 'en-US-GuyNeural',
    name: '🔥 Guy (US Nam - Năng Động, Tự Tin, Viral Shorts)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Energetic American male voice for viral TikTok, sports & tech.'
  },
  {
    id: 'en-US-JennyNeural',
    name: '✨ Jenny (US Nữ - Sống Động, Lifestyle & Storytelling)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Natural, lively American female voice for vlogs and storytelling.'
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
