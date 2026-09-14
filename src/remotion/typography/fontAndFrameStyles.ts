// Hệ thống 100 Phong Cách Font & Khung Chữ Nghệ Thuật (Font & Frame Styles)
// Khắc phục hoàn toàn việc bị lặp lại một kiểu khung đen nhàm chán!

export interface WordFrameStyle {
  id: string;
  name: string;
  fontFamily: string;
  renderWrapper: (text: string, color: string, isCurrent: boolean) => React.ReactNode;
}

export const FONT_AND_FRAME_STYLES = [
  // 1. MrBeast 3D Titan (Không Khung - Chữ 3D Cực Lớn Tỏa Sáng)
  {
    id: 'titan_3d_clean',
    name: '1. MrBeast Titan 3D (Chữ Trần Khổng Lồ)',
    fontFamily: "'Montserrat', 'Anton', sans-serif",
    wrapperClass: 'no-box',
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', 'Anton', sans-serif",
      fontWeight: 900,
      color: color,
      WebkitTextStroke: '4px #000000',
      paintOrder: 'stroke fill',
      textShadow: `0 4px 0 #000, 0 8px 0 #000, 0 12px 25px rgba(0,0,0,0.95), 0 0 35px ${color}`,
      letterSpacing: '0.02em'
    }),
    hasBox: false
  },
  // 2. Comic Manga Pop Art
  {
    id: 'comic_manga_pop',
    name: '2. Comic Pop Art (Nổi Bật)',
    fontFamily: "'Montserrat', cursive",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#FACC15',
      WebkitTextStroke: '5px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 6px 0 #000, 0 10px 20px rgba(0,0,0,0.9)',
      letterSpacing: '0.04em'
    }),
    hasBox: false
  },
  // 3. Cyberpunk 2077 Neon
  {
    id: 'cyberpunk_neon',
    name: '3. Cyberpunk Neon (Viền Neon)',
    fontFamily: "'Montserrat', 'Orbitron', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: '#FFFFFF',
      WebkitTextStroke: '3.5px #000000',
      paintOrder: 'stroke fill',
      textShadow: `0 0 15px ${color || '#06B6D4'}, 0 0 35px ${color || '#06B6D4'}, 0 4px 14px rgba(0,0,0,0.95)`,
      letterSpacing: '0.05em'
    }),
    hasBox: false
  },
  // 4. Street Graffiti Brush
  {
    id: 'street_graffiti',
    name: '4. Street Graffiti (Đậm Nét)',
    fontFamily: "'Montserrat', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#F43F5E',
      WebkitTextStroke: '4px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 4px 14px rgba(0,0,0,0.95)',
      letterSpacing: '0.03em'
    }),
    hasBox: false
  },
  // 5. Alex Hormozi Brutal Tag
  {
    id: 'hormozi_brutal_tag',
    name: '5. Hormozi Brutal (Chữ Đậm Nét)',
    fontFamily: "'Montserrat', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#EF4444',
      WebkitTextStroke: '4px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 5px 0 #000000, 0 8px 20px rgba(0,0,0,0.9)',
      letterSpacing: '-0.01em'
    }),
    hasBox: false
  },
  // 6. Luxury Champagne Gold
  {
    id: 'luxury_gold_serif',
    name: '6. Luxury Gold (Vàng Ánh Kim)',
    fontFamily: "'Montserrat', serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', serif",
      fontWeight: 900,
      color: color || '#FDE047',
      WebkitTextStroke: '3.5px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 0 20px rgba(250,204,21,0.8), 0 4px 14px rgba(0,0,0,0.95)',
      letterSpacing: '0.08em'
    }),
    hasBox: false
  },
  // 7. Minimalist Hollywood Cinema
  {
    id: 'hollywood_cinema',
    name: '7. Hollywood Cinema (Điện Ảnh)',
    fontFamily: "'Montserrat', 'Bebas Neue', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#FFFFFF',
      WebkitTextStroke: '3.5px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 4px 16px rgba(0,0,0,0.95), 0 0 25px rgba(255,255,255,0.4)',
      letterSpacing: '0.05em'
    }),
    hasBox: false
  },
  // 8. Frosted Crystal Glass
  {
    id: 'crystal_glass',
    name: '8. Crystal Glow (Phát Sáng Pha Lê)',
    fontFamily: "'Montserrat', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: '#FFFFFF',
      WebkitTextStroke: '3px #000000',
      paintOrder: 'stroke fill',
      textShadow: `0 0 20px ${color || '#38BDF8'}, 0 4px 14px rgba(0,0,0,0.95)`,
      letterSpacing: '0.04em'
    }),
    hasBox: false
  },
  // 9. Heavy Metal Steel
  {
    id: 'heavy_metal_steel',
    name: '9. Heavy Metal (Thép Đúc 3D)',
    fontFamily: "'Montserrat', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#E2E8F0',
      WebkitTextStroke: '4px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 4px 0 #000, 0 8px 18px rgba(0,0,0,0.95)',
      letterSpacing: '0.02em'
    }),
    hasBox: false
  },
  // 10. Vox Highlighter Marker
  {
    id: 'vox_highlighter',
    name: '10. Vox Highlighter (Vàng Nổi Bật)',
    fontFamily: "'Montserrat', sans-serif",
    textStyle: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
      color: color || '#FACC15',
      WebkitTextStroke: '4px #000000',
      paintOrder: 'stroke fill',
      textShadow: '0 4px 14px rgba(0,0,0,0.95)',
      letterSpacing: '-0.02em'
    }),
    hasBox: false
  }
];

export function getStylePresetByIndex(index: number) {
  return FONT_AND_FRAME_STYLES[index % FONT_AND_FRAME_STYLES.length];
}
