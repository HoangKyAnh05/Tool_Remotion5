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
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor?: string;
  positionY: number; // percentage from top (e.g. 75)
  animationStyle: 'pop' | 'glow' | 'bounce' | 'karaoke' | 'box';
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
  startOffset: number;       // Giây bắt đầu trong video gốc (vd: 0.0)
  endOffset: number;         // Giây kết thúc trong video gốc (vd: 10.0)
  duration: number;          // Độ dài của clip con (endOffset - startOffset)
  originalStartOffset?: number; // Mốc giây gốc trong video dài ban đầu
  originalEndOffset?: number;
  isStandalone?: boolean;    // Đã được tách thành file video độc lập siêu mượt
  thumbnail?: string;        // Ảnh chụp thumbnail đại diện của đoạn clip
  narration?: string;        // Kịch bản / lời dẫn (nếu có)
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
  showAudioVisualizer?: boolean;
  showCinematicParticles?: boolean;
  showCameraShake?: boolean;
  enableDynamicEmojis?: boolean;
  soundFx: SoundFxConfig;
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
  {
    id: 'vi-VN-HoaiMyNeural',
    name: 'Hoài My (Nữ - Truyền cảm, chuẩn giọng Bắc)',
    locale: 'vi-VN',
    gender: 'Female',
    description: 'Giọng nữ chuẩn Hà Nội, mượt mà, phù hợp tin tức, recap, truyện.'
  },
  {
    id: 'vi-VN-NamMinhNeural',
    name: 'Nam Minh (Nam - Trầm ấm, cuốn hút)',
    locale: 'vi-VN',
    gender: 'Male',
    description: 'Giọng nam ấm, uy lực, phù hợp video kiến thức, tài chính, top bí ẩn.'
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (English US - Natural Female)',
    locale: 'en-US',
    gender: 'Female',
    description: 'Natural American female voice for global content.'
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (English US - Dynamic Male)',
    locale: 'en-US',
    gender: 'Male',
    description: 'Energetic American male voice.'
  }
];

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
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
  enabled: true,
  text: '@LaDoHomestaySaPa',
  position: 'top-right',
  opacity: 0.85
};

export const DEFAULT_SOUND_FX: SoundFxConfig = {
  enableWhoosh: true,
  enablePop: true,
  volume: 0.4
};
