import React from 'react';
import { Img, Video, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { Scene } from '../../types/video';

interface SceneMediaProps {
  scene: Scene;
  durationInFrames: number;
  enableCameraShake?: boolean;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80';

export const SceneMedia: React.FC<SceneMediaProps> = ({
  scene,
  durationInFrames,
  enableCameraShake = true
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ==========================================
  // 1. ADVANCED CAMERA EFFECTS (KEN BURNS)
  // ==========================================
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let rotate = 0;
  let blurAmount = 0;

  switch (scene.kenBurns) {
    case 'zoom_in':
      scale = interpolate(frame, [0, durationInFrames], [1.0, 1.25], { extrapolateRight: 'clamp' });
      break;

    case 'zoom_out':
      scale = interpolate(frame, [0, durationInFrames], [1.25, 1.0], { extrapolateRight: 'clamp' });
      break;

    case 'pan_left':
      scale = 1.15;
      translateX = interpolate(frame, [0, durationInFrames], [40, -40], { extrapolateRight: 'clamp' });
      break;

    case 'pan_right':
      scale = 1.15;
      translateX = interpolate(frame, [0, durationInFrames], [-40, 40], { extrapolateRight: 'clamp' });
      break;

    case 'tilt_up':
      scale = 1.18;
      translateY = interpolate(frame, [0, durationInFrames], [50, -50], { extrapolateRight: 'clamp' });
      break;

    case 'tilt_down':
      scale = 1.18;
      translateY = interpolate(frame, [0, durationInFrames], [-50, 50], { extrapolateRight: 'clamp' });
      break;

    case 'crash_zoom':
      // Instant dramatic Tarantino snap-zoom in the first 8 frames
      scale = spring({
        frame,
        fps,
        config: { damping: 9, stiffness: 260, mass: 0.4 },
        from: 1.0,
        to: 1.35
      });
      break;

    case 'dutch_angle':
      scale = 1.22;
      rotate = interpolate(frame, [0, durationInFrames], [-7, 7], { extrapolateRight: 'clamp' });
      break;

    case 'rack_focus':
      scale = 1.1;
      // Blur from 22px down to 0px in first 14 frames
      blurAmount = interpolate(frame, [0, 14], [22, 0], { extrapolateRight: 'clamp' });
      break;

    case 'spiral_zoom':
      scale = interpolate(frame, [0, durationInFrames], [1.05, 1.35], { extrapolateRight: 'clamp' });
      rotate = interpolate(frame, [0, durationInFrames], [0, 35], { extrapolateRight: 'clamp' });
      break;

    case 'handheld':
      scale = 1.12;
      // Natural organic handheld camera wobble
      translateX = Math.sin(frame * 0.14) * 9 + Math.cos(frame * 0.22) * 5;
      translateY = Math.cos(frame * 0.11) * 8 + Math.sin(frame * 0.19) * 4;
      rotate = Math.sin(frame * 0.08) * 1.5;
      break;

    case 'subtle_float':
      scale = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [1.0, 1.12, 1.04], { extrapolateRight: 'clamp' });
      translateY = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, -18, 0], { extrapolateRight: 'clamp' });
      break;

    default:
      scale = 1;
      break;
  }

  // Camera Shake impact (first 15 frames)
  let shakeX = 0;
  let shakeY = 0;
  if (enableCameraShake && frame < 15 && scene.kenBurns !== 'crash_zoom') {
    const decay = interpolate(frame, [0, 14], [1, 0], { extrapolateRight: 'clamp' });
    shakeX = Math.sin(frame * 1.8) * 8 * decay;
    shakeY = Math.cos(frame * 2.2) * 6 * decay;
  }

  const finalTranslateX = translateX + shakeX;
  const finalTranslateY = translateY + shakeY;

  // ==========================================
  // 2. ENTRANCE TRANSITION DYNAMICS
  // ==========================================
  let transOpacity = 1;
  let transTranslateX = 0;
  let transTranslateY = 0;
  let transScale = 1;
  let transRotateY = 0;
  let whiteFlashOpacity = 0;
  let isGlitch = false;

  const transFrames = 12; // Length of transition entrance
  if (frame <= transFrames) {
    const progress = frame / transFrames; // 0 -> 1

    switch (scene.transition) {
      case 'fade':
        transOpacity = progress;
        break;

      case 'slide_left':
        transTranslateX = interpolate(progress, [0, 1], [100, 0]);
        break;

      case 'slide_right':
        transTranslateX = interpolate(progress, [0, 1], [-100, 0]);
        break;

      case 'slide_up':
        transTranslateY = interpolate(progress, [0, 1], [100, 0]);
        break;

      case 'whip_pan':
        transTranslateX = interpolate(progress, [0, 1], [120, 0]);
        blurAmount = Math.max(blurAmount, (1 - progress) * 16);
        break;

      case 'zoom_in':
        transScale = interpolate(progress, [0, 1], [0.4, 1]);
        transOpacity = progress;
        break;

      case 'zoom_out':
        transScale = interpolate(progress, [0, 1], [1.7, 1]);
        transOpacity = progress;
        break;

      case 'flash_white':
        whiteFlashOpacity = interpolate(progress, [0, 0.4, 1], [1, 0.8, 0]);
        break;

      case 'digital_glitch':
        isGlitch = true;
        if (frame % 3 === 0) {
          transTranslateX = (Math.random() - 0.5) * 35;
        }
        break;

      case 'cube_flip':
        transRotateY = interpolate(progress, [0, 1], [90, 0]);
        transOpacity = progress;
        break;

      default:
        break;
    }
  }

  const mediaSource = scene.localMediaPath || scene.mediaUrl || FALLBACK_IMG;

  // =========================================================================
  // 3. BEAUTY & BODY RETOUCH (Làm Mịn Da, Xóa Mụn, Kéo Chân, Thon Mặt, Sáng Da, Tăng Nét)
  // =========================================================================
  const beauty = scene.beautyRetouch || {};
  const smoothVal = beauty.smoothSkin || 0;     // 0 - 100
  const brightenVal = beauty.brightenSkin || 0; // 0 - 100
  const slimFaceVal = beauty.slimFace || 0;     // 0 - 100
  const longLegsVal = beauty.longLegs || 0;     // 0 - 100
  const slimBodyVal = beauty.slimBody || 0;     // 0 - 100
  const sharpnessVal = beauty.sharpness || 0;   // 0 - 100
  const eyeEnlargeVal = beauty.eyeEnlarge || 0; // 0 - 100

  // 1. Bộ lọc sắc thái & Làn da (Skin Brightness, Smoothing & Sharpness)
  const brightnessFilter = 1 + (brightenVal / 100) * 0.35; // Tăng sáng da đến 1.35x
  const contrastFilter = 1 + (sharpnessVal / 100) * 0.25 - (smoothVal / 100) * 0.08; // Căng bóng & Nét
  const saturateFilter = 1 + (brightenVal / 100) * 0.15; // Hồng hào tự nhiên
  const beautyBlur = smoothVal > 0 ? (smoothVal / 100) * 0.8 : 0; // Mịn da mờ mụn tự nhiên

  // 2. Kéo dài chân & Thon gọn Body/Mặt (Aspect ratio & Scale warping)
  const legStretchY = 1 + (longLegsVal / 100) * 0.22; // Kéo dài chiều dọc chân 1.22x
  const bodySlimX = 1 - (slimBodyVal / 100) * 0.12 - (slimFaceVal / 100) * 0.06; // Bóp thon chiều ngang
  const faceZoom = 1 + (eyeEnlargeVal / 100) * 0.05; // Tinh chỉnh cận cảnh mắt

  const finalBlur = Math.max(blurAmount, beautyBlur);

  const mediaStyle: React.CSSProperties = {
    transform: `scale(${scale * transScale * faceZoom}) scaleX(${bodySlimX}) scaleY(${legStretchY}) translate(${finalTranslateX + transTranslateX}px, ${finalTranslateY + transTranslateY}px) rotate(${rotate}deg) rotateY(${transRotateY}deg)`,
    filter: `brightness(${brightnessFilter}) contrast(${contrastFilter}) saturate(${saturateFilter}) ${finalBlur > 0 ? `blur(${finalBlur}px)` : ''}`,
    opacity: transOpacity,
    perspective: '1000px',
    transition: 'filter 0.05s linear, transform 0.05s ease-out'
  };

  const isVideo = scene.mediaType === 'video';

  return (
    <div className="w-full h-full overflow-hidden relative bg-black">
      {isVideo ? (
        <Video
          src={mediaSource}
          className="w-full h-full object-cover"
          style={mediaStyle}
          startFrom={Math.round((scene.videoStartOffset || 0) * fps)}
          volume={0}
        />
      ) : (
        <Img
          src={mediaSource}
          className="w-full h-full object-cover"
          style={mediaStyle}
        />
      )}

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* White Flash Transition Overlay */}
      {whiteFlashOpacity > 0 && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-20"
          style={{ opacity: whiteFlashOpacity }}
        />
      )}

      {/* Digital Glitch Scanlines & RGB Shift Overlay */}
      {isGlitch && (
        <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-75">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-pink-500/20" />
          <div className="absolute top-1/4 left-0 w-full h-10 bg-cyan-400/30" />
          <div className="absolute top-2/3 left-0 w-full h-8 bg-pink-500/30" />
        </div>
      )}
    </div>
  );
};
