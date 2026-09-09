import React from 'react';
import { Audio, AbsoluteFill, useVideoConfig, useCurrentFrame, Img, Video } from 'remotion';
import { Scene, SubtitleStyle } from '../../types/video';
import { toSeekableAudioUrl } from '../Composition';
import { SceneMedia } from './SceneMedia';
import { SubtitlesRenderer } from './SubtitlesRenderer';
import { HeaderBadge } from './visuals/HeaderBadge';
import { ChatBubbleScene } from './visuals/ChatBubbleScene';
import { OrbitalGlowScene } from './visuals/OrbitalGlowScene';
import { MathGridScene } from './visuals/MathGridScene';
import { RadarTechScene } from './visuals/RadarTechScene';
import { NightHighwayScene } from './visuals/NightHighwayScene';
import { AirplaneTakeoffScene } from './visuals/AirplaneTakeoffScene';

import {
  StockChartScene,
  GoogleSearchScene,
  BankNotificationScene,
  VsBattleScene,
  CodeTerminalScene
} from './visuals/AdvancedVisuals';
import { ExtendedVisualOverlay } from './visuals/ExtendedVisualOverlay';
import { GreenScreenDepthMotion } from './GreenScreenDepthMotion';
import { getTikTokTemplateById } from '../tiktok/tiktokTemplates';
import { getTikTokTextEffectById } from '../tiktok/tiktokTextEffects';
import { getTikTokStickerById } from '../tiktok/tiktokStickers';
import { getTikTokVideoEffectById } from '../tiktok/tiktokEffects';
import { getTikTokFilterById } from '../tiktok/tiktokFilters';
import { playSoundEffectById } from '../../services/soundEffectsService';

interface SceneItemProps {
  scene: Scene;
  durationInFrames: number;
  subtitleStyle: SubtitleStyle;
  enableCameraShake?: boolean;
  enableDynamicEmojis?: boolean;
}

export const SceneItem: React.FC<SceneItemProps> = ({
  scene,
  durationInFrames,
  subtitleStyle,
  enableCameraShake = true,
  enableDynamicEmojis = true
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const renderVisualContent = () => {
    switch (scene.visualType) {
      case 'chat_bubble':
        return (
          <ChatBubbleScene
            badgeText={scene.headerBadge || '💬 INBOX MỖI NGÀY'}
            messages={scene.chatMessages}
            punchline={scene.narration}
          />
        );
      case 'orbital_glow':
        return (
          <OrbitalGlowScene
            badgeText={scene.headerBadge || '🔑 HÔM NAY BẬT MÍ'}
            title={scene.orbitTitle || scene.searchKeyword || 'ỨNG DỤNG AI'}
            centerIcon={scene.orbitIcon || '🤖'}
          />
        );
      case 'math_grid':
        return (
          <MathGridScene
            badgeText={scene.headerBadge || '👀 XEM NGAY ĐÂY'}
            punchline={scene.narration}
          />
        );
      case 'radar_tech':
        return (
          <RadarTechScene
            badgeText={scene.headerBadge || '📊 PHÂN TÍCH CHỈ SỐ'}
            punchline={scene.narration}
          />
        );
      case 'night_highway':
        return (
          <NightHighwayScene
            badgeText={scene.headerBadge || '🏎️ BỨT PHÁ TỐC ĐỘ'}
            punchline={scene.narration}
          />
        );
      case 'airplane_takeoff':
        return (
          <AirplaneTakeoffScene
            badgeText={scene.headerBadge || '✈️ CẤT CÁNH THÀNH CÔNG'}
            punchline={scene.narration}
          />
        );
      case 'stock_chart':
      case 'rolling_counter':
        return (
          <StockChartScene
            badgeText={scene.headerBadge || '📈 BÙNG NỔ LỢI NHUẬN'}
            punchline={scene.narration}
          />
        );
      case 'google_search':
        return (
          <GoogleSearchScene
            badgeText={scene.headerBadge || '🔍 TÌM KIẾM BÍ QUYẾT'}
            query={scene.searchKeyword || scene.narration}
          />
        );
      case 'bank_notification':
        return (
          <BankNotificationScene
            badgeText={scene.headerBadge || '💵 THÔNG BÁO BIẾN ĐỘNG SỐ DƯ'}
            punchline={scene.narration}
          />
        );
      case 'vs_battle':
        return (
          <VsBattleScene
            badgeText={scene.headerBadge || '⚡ SO SÁNH ĐỐI ĐẦU'}
            punchline={scene.narration}
          />
        );
      case 'green_screen_depth':
        return (
          <GreenScreenDepthMotion
            scene={scene}
            durationInFrames={durationInFrames}
            subtitleStyle={subtitleStyle}
          />
        );
      default:
        // Kích hoạt engine xếp chữ Motion Typography khi bật phông xanh HOẶC khi chọn kiểu xếp chữ / chế độ lớp chữ
        if (scene.isGreenScreenMotion || scene.motionTypographyLayout || scene.textLayerMode === 'front' || scene.textLayerMode === 'behind' || scene.textLayerMode === 'both_3d') {
          return (
            <GreenScreenDepthMotion
              scene={scene}
              durationInFrames={durationInFrames}
              subtitleStyle={subtitleStyle}
            />
          );
        }
        return (
          <SceneMedia
            scene={scene}
            durationInFrames={durationInFrames}
            enableCameraShake={enableCameraShake}
          />
        );
    }
  };

  const isSpecialVisual = Boolean(scene.visualType && scene.visualType !== 'media');
  const visualScale = scene.visualScale ?? 1.15;
  const currentFilter = getTikTokFilterById(scene.tiktokFilter);

  // Kích hoạt âm thanh SFX tự động ở đầu phân cảnh hoặc tại mốc nhịp của từng từ được gán SFX
  React.useEffect(() => {
    if (scene.tiktokSfx && frame <= 2) {
      playSoundEffectById(scene.tiktokSfx);
    }

    if (scene.words && scene.words.length > 0) {
      scene.words.forEach((w) => {
        if (w.sfxId) {
          const wordStartFrame = Math.max(0, Math.round(w.start * fps));
          // Khi Remotion phát đúng đến frame của từ có gán SFX (dung sai 1 frame)
          if (frame === wordStartFrame || (frame >= wordStartFrame && frame <= wordStartFrame + 1)) {
            playSoundEffectById(w.sfxId);
          }
        }
      });
    }
  }, [scene.id, scene.tiktokSfx, scene.words, frame, fps]);

  // =========================================================================
  // ENTRANCE & EXIT TRANSITIONS (Chuyển Cảnh Mượt Mà Xuyên Suốt Toàn Phân Cảnh)
  // =========================================================================
  let transOpacity = 1;
  let transTranslateX = 0;
  let transTranslateY = 0;
  let transScale = 1;
  let whiteFlashOpacity = 0;
  let glitchOffsetX = 0;

  // Thời gian chuyển cảnh ở đầu phân cảnh (Entrance) và cuối phân cảnh (Exit)
  const transFrames = Math.min(20, Math.floor(durationInFrames * 0.25)); // 20 frames hoặc 25% độ dài cảnh

  if (scene.transition && scene.transition !== 'none') {
    // 1. Entrance (Đầu cảnh)
    if (frame <= transFrames) {
      const progress = Math.min(1, Math.max(0, frame / transFrames));

      switch (scene.transition) {
        case 'fade':
          transOpacity = progress;
          break;

        case 'slide_left':
          transTranslateX = (1 - progress) * 120; // Trượt từ phải sang trái
          break;

        case 'slide_right':
          transTranslateX = (progress - 1) * 120; // Trượt từ trái sang phải
          break;

        case 'slide_up':
          transTranslateY = (1 - progress) * 120; // Trượt từ dưới lên
          break;

        case 'zoom_in':
          transScale = 0.4 + progress * 0.6; // Phóng to từ nhỏ vào đầy màn hình
          transOpacity = Math.min(1, progress * 1.5);
          break;

        case 'zoom_out':
          transScale = 1.6 - progress * 0.6; // Thu nhỏ từ lớn về chuẩn
          transOpacity = Math.min(1, progress * 1.5);
          break;

        case 'flash_white':
          whiteFlashOpacity = Math.max(0, 1 - progress * 1.8);
          break;

        case 'digital_glitch':
          if (frame % 2 === 0) {
            glitchOffsetX = (Math.random() - 0.5) * 50;
          }
          break;

        case 'cube_flip':
          transScale = 0.6 + progress * 0.4;
          transOpacity = progress;
          break;

        default:
          break;
      }
    }
  }

  return (
    <AbsoluteFill
      className="bg-black overflow-hidden"
      style={{
        filter: currentFilter?.cssFilter && currentFilter.cssFilter !== 'none' ? currentFilter.cssFilter : undefined,
        transform: `scale(${transScale}) translate(${transTranslateX + glitchOffsetX}px, ${transTranslateY}px)`,
        opacity: transOpacity
      }}
    >
      {/* White Flash Transition Overlay */}
      {whiteFlashOpacity > 0 && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-50 transition-opacity"
          style={{ opacity: whiteFlashOpacity }}
        />
      )}

      {/* Cinematic Color Overlay */}
      {currentFilter?.overlayStyle && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={currentFilter.overlayStyle}
        />
      )}

      {/* 1. Cinematic Blurred Image/Video Backdrop for Motion Graphic scenes (Kết hợp Motion Graphics với Ảnh/Video) */}
      {isSpecialVisual && scene.mediaUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30 filter blur-md scale-110">
          {scene.mediaType === 'video' ? (
            <Video
              src={scene.mediaUrl}
              volume={0}
              className="w-full h-full object-cover"
            />
          ) : (
            <Img
              src={scene.mediaUrl}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/75" />
        </div>
      )}

      {/* 2. Visual Canvas (Media or Scalable Motion Graphics) */}
      {isSpecialVisual ? (
        <div
          className="w-full h-full flex items-center justify-center pointer-events-none relative z-10"
          style={{
            transform: `scale(${visualScale})`,
            transformOrigin: 'center center'
          }}
        >
          {renderVisualContent()}
        </div>
      ) : (
        <div className="w-full h-full relative">
          {renderVisualContent()}

          {/* Extended Custom Visual Overlays (Crown, Clocks, Glass, Pills, etc.) */}
          {scene.visualType && (
            <ExtendedVisualOverlay
              visualType={scene.visualType}
              badgeText={scene.headerBadge}
              narration={scene.narration}
            />
          )}

          {/* Dynamic Motion HeaderBadge for Media scenes */}
          {scene.headerBadge && (
            <div className="absolute top-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
              <HeaderBadge text={scene.headerBadge} variant="cyan" />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TIKTOK & CAPCUT CREATIVE OVERLAYS (Stickers, Video Effects, Templates) */}
      {/* ========================================================================= */}
      {/* A. TikTok Video Effect Overlay (Glow, Sparks, Film Grain, Vignette...) */}
      {scene.tiktokVideoEffect && (
        <div className="absolute inset-0 z-35 pointer-events-none overflow-hidden">
          {getTikTokVideoEffectById(scene.tiktokVideoEffect)?.renderOverlay(frame, fps)}
        </div>
      )}



      {/* C. TikTok Stickers Overlay (Meme, Emojis, Icons...) */}
      {scene.tiktokStickers && scene.tiktokStickers.length > 0 && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {scene.tiktokStickers.map((stkId, i) => {
            const stickerItem = getTikTokStickerById(stkId);
            if (!stickerItem) return null;

            const customPos = scene.elementPositions?.[`stk_${stkId}`] || scene.elementPositions?.[stkId];

            const defaultPositions = [
              { x: 80, y: 18 },
              { x: 20, y: 82 },
              { x: 20, y: 35 },
              { x: 80, y: 78 }
            ];
            const def = defaultPositions[i % defaultPositions.length];

            return (
              <div
                key={stkId}
                className="absolute pointer-events-none transition-all"
                style={{
                  left: `${customPos ? customPos.x : def.x}%`,
                  top: `${customPos ? customPos.y : def.y}%`,
                  transform: `translate(-50%, -50%) scale(${customPos?.scale ?? 1}) rotate(${customPos?.rotate ?? 0}deg)`
                }}
              >
                {stickerItem.render()}
              </div>
            );
          })}
        </div>
      )}

      {/* Synchronized Word-Level Subtitles: Chạy phụ đề theo từ với Text Template, Text Effect hoặc Mix Effects */}
      {scene.visualType !== 'chat_bubble' && !scene.isGreenScreenMotion && !scene.hideSubtitles && (
        <SubtitlesRenderer
          words={scene.words}
          subtitleStyle={subtitleStyle}
          fallbackText={scene.narration}
          enableDynamicEmojis={enableDynamicEmojis}
          textTemplate={scene.tiktokTextTemplate}
          textEffect={scene.tiktokTextEffect}
          textEffectsMix={scene.textEffectsMix}
          customPos={
            scene.elementPositions?.['text_template'] ||
            scene.elementPositions?.['text_effect'] ||
            scene.elementPositions?.['subtitles']
          }
        />
      )}

      {/* Custom Scene Transition Sound FX */}
      {scene.transitionAudioUrl && (
        <Audio
          src={toSeekableAudioUrl(scene.transitionAudioUrl)}
          volume={0.75}
          startFrom={0}
        />
      )}

      {/* Voiceover Narration Audio */}
      {scene.audioUrl && (
        <Audio
          src={toSeekableAudioUrl(scene.audioUrl)}
          volume={1.0}
        />
      )}
    </AbsoluteFill>
  );
};
