import React from 'react';
import { useCurrentFrame, useVideoConfig, Video, Img, interpolate, spring } from 'remotion';
import { Scene, SubtitleStyle } from '../../types/video';
import { getLayoutPresetById } from '../typography/layoutPresets';
import { getEffectPresetById } from '../typography/motionEffects';
import { getStylePresetByIndex, FONT_AND_FRAME_STYLES } from '../typography/fontAndFrameStyles';
import { getTikTokTextEffectById } from '../tiktok/tiktokTextEffects';
import { getTikTokTemplateById } from '../tiktok/tiktokTemplates';

interface GreenScreenDepthMotionProps {
  scene: Scene;
  durationInFrames: number;
  subtitleStyle?: SubtitleStyle;
}

// Bảng màu tương phản rực rỡ nghệ thuật
const VIBRANT_COLORS = [
  '#facc15', // Vàng Neon chói sáng
  '#06b6d4', // Cyan điện tử
  '#ec4899', // Hồng Neon
  '#a855f7', // Tím Cyberpunk
  '#22c55e', // Xanh Lá Neon
  '#ffffff', // Trắng Tuyết
  '#fb923c'  // Cam Lửa
];

export const GreenScreenDepthMotion: React.FC<GreenScreenDepthMotionProps> = ({
  scene,
  durationInFrames,
  subtitleStyle
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isVideo = scene.mediaType === 'video';
  const mediaSource = scene.localMediaPath || scene.mediaUrl;

  // Lấy Preset Bố Cục và Preset Hiệu Ứng
  const layoutPreset = getLayoutPresetById(scene.motionTypographyLayout);
  const effectPreset = getEffectPresetById(scene.motionTypographyEffect);

  // Chuẩn bị danh sách từ vựng kèm thời gian bắt đầu và kết thúc chuẩn xác
  const hasWordTimestamps = scene.words && scene.words.length > 0;

  const wordTokens = hasWordTimestamps
    ? scene.words.map((w, i, arr) => {
        const startFrame = Math.max(0, Math.round(w.start * fps));
        // Thời gian kết thúc: Khi từ tiếp theo bắt đầu hoặc sau khoảng thời gian w.end
        const nextStart = arr[i + 1] ? Math.round(arr[i + 1].start * fps) : startFrame + Math.round(fps * 0.85);
        const endFrame = Math.max(startFrame + 8, Math.min(Math.round(w.end * fps) + 4, nextStart));
        return {
          text: w.word.replace(/[.,!?;:"'()]/g, ''),
          startFrame,
          endFrame
        };
      })
    : (scene.narration || 'MOTION PHÔNG XANH ĐỈNH CAO')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w, idx, arr) => {
          const step = (durationInFrames * 0.85) / Math.max(1, arr.length);
          const startFrame = Math.round(idx * step);
          const endFrame = Math.round((idx + 1) * step);
          return {
            text: w.replace(/[.,!?;:"'()]/g, ''),
            startFrame,
            endFrame
          };
        });

  // Tọa độ tính toán theo preset bố cục
  const computedPositions = layoutPreset.getPositions(wordTokens.length);

  // Tọa độ tùy chỉnh do người dùng chỉnh trong Inspector / Timeline (nếu có)
  const customPos =
    scene.elementPositions?.['green_screen_text'] ||
    scene.elementPositions?.['text_template'] ||
    scene.elementPositions?.['text_effect'] ||
    scene.elementPositions?.['subtitles'];
  
  // Tính toán vị trí X và Y: Hỗ trợ cả slider subtitleStyle.positionX/positionY lẫn customPos
  const basePositionXOffset = subtitleStyle && subtitleStyle.positionX !== undefined ? subtitleStyle.positionX - 50 : 0;
  const basePositionYOffset = subtitleStyle && subtitleStyle.positionY !== undefined ? subtitleStyle.positionY - 50 : 0;
  const baseRotation = subtitleStyle?.rotation ?? subtitleStyle?.rotate ?? 0;

  const offsetXPercent = customPos ? customPos.x - 50 : basePositionXOffset;
  const offsetYPercent = customPos ? customPos.y - 50 : basePositionYOffset;

  // Tính toán tỷ lệ kích thước: Nếu có slider kích thước chữ fontSize (mặc định 42px)
  const baseFontScale = subtitleStyle ? subtitleStyle.fontSize / 42 : 1.0;
  const customScale = (customPos?.scale ?? subtitleStyle?.scale ?? 1.0) * baseFontScale;
  const customRotate = (customPos?.rotate ?? 0) + baseRotation;

  // Nhịp thở bồng bềnh
  const floatY = Math.sin((frame / fps) * Math.PI * 1.5) * 5;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black select-none">
      {/* SVG Bộ Lọc Chroma-Key Khử Sạch Nền Xanh Lá Của Video */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <filter id="greenScreenFilter">
          <feColorMatrix
            type="matrix"
            values="
              1.0  0.0  0.0  0.0  0.0
              0.0  1.0  0.0  0.0  0.0
              0.0  0.0  1.0  0.0  0.0
              1.6 -2.4  1.6  1.0  0.0
            "
          />
        </filter>
      </svg>

      {/* Background Nền Tối Nghệ Thuật / Cyber Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-black to-slate-950 pointer-events-none" />
      <div
        className="absolute w-[650px] h-[650px] rounded-full blur-3xl opacity-45 mix-blend-screen pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(236,72,153,0.4) 50%, transparent 75%)'
        }}
      />

      {/* ========================================================================= */}
      {/* TẦNG 1: CHỮ SAU LƯNG NGƯỜI (BEHIND LAYER) - BỊ THÂN THỂ NGƯỜI CHE LẤP     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {subtitleStyle?.enabled !== false && wordTokens.map((item, idx) => {
          const pos = computedPositions[idx % computedPositions.length];
          // Nếu chọn "Luôn ở trước video" thì tầng sau lưng không render
          if (scene.textLayerMode === 'front') return null;
          // Nếu chọn "Đan xen 3D" (mặc định) thì chỉ render từ có cờ isBehind
          if ((!scene.textLayerMode || scene.textLayerMode === 'both_3d') && !pos.isBehind) return null;

          // QUY TẮC KHÔNG ĐÈ CHỮ: Chỉ hiển thị trong khoảng thời gian nói của từ!
          // Khi từ tiếp theo bắt đầu, từ cũ sẽ biến mất sau 4 frame fade-out
          if (frame < item.startFrame || frame > item.endFrame + 5) return null;

          const isExiting = frame > item.endFrame;
          const exitOpacity = isExiting ? interpolate(frame, [item.endFrame, item.endFrame + 5], [1, 0]) : 1;

          const baseColor = VIBRANT_COLORS[idx % VIBRANT_COLORS.length];
          const stylePreset = getStylePresetByIndex(idx);

          const fxStyle = effectPreset.computeStyle(
            {
              frame,
              startFrame: item.startFrame,
              fps,
              wordIndex: idx,
              totalWords: wordTokens.length
            },
            baseColor
          );

          return (
            <div
              key={`behind-${idx}`}
              className="absolute pointer-events-none transition-transform"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                right: pos.right,
                transform: `${pos.transform || ''} translate(${offsetXPercent}vw, calc(${offsetYPercent}vh + ${floatY}px)) scale(${customScale}) ${fxStyle.transform} rotate(${pos.rotate + customRotate}deg)`,
                opacity: fxStyle.opacity * exitOpacity,
                filter: fxStyle.filter
              }}
            >
              {(() => {
                // Ưu tiên 1: Text Template CapCut
                if (scene.tiktokTextTemplate) {
                  const tpl = getTikTokTemplateById(scene.tiktokTextTemplate);
                  if (tpl) {
                    if (tpl.renderWord) {
                      return (
                        <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                          {tpl.renderWord(item.text, true)}
                        </div>
                      );
                    }
                    return (
                      <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                        {tpl.render(item.text)}
                      </div>
                    );
                  }
                }

                // Ưu tiên 2: Text Effect ART CapCut
                let customEffectId = scene.tiktokTextEffect;
                if (scene.textEffectsMix && scene.textEffectsMix.length > 0) {
                  customEffectId = scene.textEffectsMix[idx % scene.textEffectsMix.length];
                }
                const customEffect = customEffectId ? getTikTokTextEffectById(customEffectId) : null;

                if (customEffect) {
                  return (
                    <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                      {customEffect.applyStyle(item.text)}
                    </div>
                  );
                }

                return (
                  <span
                    className={`${pos.sizeClass} uppercase block whitespace-nowrap`}
                    style={stylePreset.textStyle(baseColor)}
                  >
                    {item.text}
                  </span>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TẦNG 2: VẬT THỂ / CON NGƯỜI (VIDEO PHÔNG XANH HOẶC VIDEO/ẢNH ĐÃ CHỌN)     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        {isVideo ? (
          <Video
            src={mediaSource || 'video/greenscreen_character.mp4'}
            className="w-full h-full object-cover"
            style={{
              filter: scene.isGreenScreenMotion
                ? 'url(#greenScreenFilter) drop-shadow(0 15px 35px rgba(0,0,0,0.9))'
                : undefined
            }}
            startFrom={0}
            volume={0}
          />
        ) : (
          <Img
            src={mediaSource || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'}
            className="w-full h-full object-cover"
            style={{
              filter: scene.isGreenScreenMotion
                ? 'url(#greenScreenFilter) drop-shadow(0 15px 35px rgba(0,0,0,0.9))'
                : undefined
            }}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* TẦNG 3: CHỮ TRƯỚC MẶT NGƯỜI (IN-FRONT LAYER) - ĐA DẠNG FONT & KHÔNG ĐÈ   */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {subtitleStyle?.enabled !== false && wordTokens.map((item, idx) => {
          const pos = computedPositions[idx % computedPositions.length];
          // Nếu chọn "Chạy ở dưới video" thì tầng trước mặt không render
          if (scene.textLayerMode === 'behind') return null;
          // Nếu chọn "Đan xen 3D" (mặc định) thì chỉ render từ có cờ trước mặt (!pos.isBehind)
          if ((!scene.textLayerMode || scene.textLayerMode === 'both_3d') && pos.isBehind) return null;

          // QUY TẮC KHÔNG ĐÈ CHỮ: Chỉ hiển thị trong khoảng thời gian nói của từ!
          // Khi từ tiếp theo bắt đầu, từ cũ sẽ biến mất sau 4 frame fade-out
          if (frame < item.startFrame || frame > item.endFrame + 5) return null;

          const isExiting = frame > item.endFrame;
          const exitOpacity = isExiting ? interpolate(frame, [item.endFrame, item.endFrame + 5], [1, 0]) : 1;

          const baseColor = VIBRANT_COLORS[(idx + 2) % VIBRANT_COLORS.length];
          const stylePreset = getStylePresetByIndex(idx + 1);

          const fxStyle = effectPreset.computeStyle(
            {
              frame,
              startFrame: item.startFrame,
              fps,
              wordIndex: idx,
              totalWords: wordTokens.length
            },
            baseColor
          );

          return (
            <div
              key={`front-${idx}`}
              className="absolute pointer-events-none transition-transform"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                right: pos.right,
                transform: `${pos.transform || ''} translate(${offsetXPercent}vw, ${offsetYPercent}vh) scale(${customScale}) ${fxStyle.transform} rotate(${pos.rotate + customRotate}deg)`,
                opacity: fxStyle.opacity * exitOpacity,
                filter: fxStyle.filter
              }}
            >
              {(() => {
                // Ưu tiên 1: Text Template CapCut
                if (scene.tiktokTextTemplate) {
                  const tpl = getTikTokTemplateById(scene.tiktokTextTemplate);
                  if (tpl) {
                    if (tpl.renderWord) {
                      return (
                        <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                          {tpl.renderWord(item.text, true)}
                        </div>
                      );
                    }
                    return (
                      <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                        {tpl.render(item.text)}
                      </div>
                    );
                  }
                }

                // Ưu tiên 2: Text Effect ART CapCut
                let customEffectId = scene.tiktokTextEffect;
                if (scene.textEffectsMix && scene.textEffectsMix.length > 0) {
                  customEffectId = scene.textEffectsMix[idx % scene.textEffectsMix.length];
                }
                const customEffect = customEffectId ? getTikTokTextEffectById(customEffectId) : null;

                if (customEffect) {
                  return (
                    <div className={`${pos.sizeClass} inline-block transform origin-center`}>
                      {customEffect.applyStyle(item.text)}
                    </div>
                  );
                }

                return (
                  <span
                    className={`${pos.sizeClass} uppercase block whitespace-nowrap`}
                    style={stylePreset.textStyle(baseColor)}
                  >
                    {item.text}
                  </span>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
