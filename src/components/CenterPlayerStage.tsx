import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { MainComposition } from '../remotion/Composition';
import { VideoProject, ElementPosition } from '../types/video';
import { InteractiveCanvasOverlay } from './InteractiveCanvasOverlay';
import {
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Tv,
  Move,
  Maximize2,
  Repeat,
  Volume2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CenterPlayerStageProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const CenterPlayerStage: React.FC<CenterPlayerStageProps> = ({ project, setProject }) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [studioMode, setStudioMode] = useState<'preview' | 'interactive_canvas'>('preview');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);

  const fps = project.fps || 30;

  // Tính tổng số frames chính xác từ các scenes
  const totalFrames = useMemo(() => {
    const frames = project.scenes.reduce(
      (acc, s) => acc + Math.max(Math.round((s.audioDuration || 4) * fps), Math.round(2 * fps)),
      0
    );
    return Math.max(frames, 30);
  }, [project.scenes, fps]);

  // Memoize inputProps với tham chiếu ổn định để Player không bị re-mount audio trên mỗi frame tick
  const inputProps = useMemo(() => ({ project }), [project]);

  const compositionWidth = project.aspectRatio === '9:16' ? 1080 : 1920;
  const compositionHeight = project.aspectRatio === '9:16' ? 1920 : 1080;

  // Cập nhật trạng thái play/pause và frame khi Player phát
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('frameupdate', onFrameUpdate);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, [playerRef.current]);

  // Hỗ trợ phím tắt Space để Play/Pause và ArrowRight/ArrowLeft để tua frame
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepFrame(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepFrame(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentFrame, totalFrames]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
    } else {
      window.dispatchEvent(new CustomEvent('remotion-play-started'));
      playerRef.current.play();
    }
  };

  const handleSeek = (frame: number) => {
    const target = Math.max(0, Math.min(frame, totalFrames - 1));
    setCurrentFrame(target);
    playerRef.current?.seekTo(target);
  };

  const handleStepFrame = (delta: number) => {
    handleSeek(currentFrame + delta);
  };

  const formatTimecode = (frame: number) => {
    const totalSeconds = frame / fps;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const dec = Math.floor((totalSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${dec}`;
  };

  const handleUpdatePositions = (sceneId: string, positions: Record<string, ElementPosition>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, elementPositions: positions } : s))
    }));
  };

  const handleUpdateNarration = (sceneId: string, text: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, narration: text } : s))
    }));
  };

  const handleUpdateScene = (sceneId: string, updates: any) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s))
    }));
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-3 sm:p-4 bg-zinc-950/60 border-x border-zinc-850/70 select-none">
      {/* Top Bar của Cột Giữa: Bộ chuyển chế độ & Tỷ lệ nhanh */}
      <div className="w-full flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-850">
        {/* Toggle Mode: Xem Video vs Kéo Thả Chuột */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setStudioMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              studioMode === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>Xem Video</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('interactive_canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              studioMode === 'interactive_canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Kéo di chuyển chữ, logo, sticker tự do trên khung hình"
          >
            <Move className="w-3 h-3 text-indigo-300" />
            <span>Kéo Thả Vị Trí</span>
          </button>
        </div>

        {/* Nút chuyển đổi nhanh tỷ lệ 9:16 / 16:9 */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setProject((prev) => ({ ...prev, aspectRatio: '9:16' }))}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Khung hình dọc 9:16 (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => setProject((prev) => ({ ...prev, aspectRatio: '16:9' }))}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Khung hình ngang 16:9 (YouTube, TV)"
          >
            <Tv className="w-3 h-3" />
            <span>16:9</span>
          </button>
        </div>
      </div>

      {/* KHUNG PREVIEW TRUNG TÂM (Remotion Player Canvas) */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative my-auto">
        {studioMode === 'interactive_canvas' ? (
          /* Chế độ kéo thả tọa độ */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <span className="text-[11px] text-zinc-400 font-medium">Chọn cảnh:</span>
              {project.scenes.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition ${
                    selectedSceneIndex === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  Cảnh {idx + 1}
                </button>
              ))}
            </div>

            {project.scenes[selectedSceneIndex] ? (
              <InteractiveCanvasOverlay
                scene={project.scenes[selectedSceneIndex]}
                aspectRatio={project.aspectRatio}
                onUpdatePositions={handleUpdatePositions}
                onUpdateNarration={handleUpdateNarration}
                onUpdateScene={handleUpdateScene}
              />
            ) : null}
          </div>
        ) : (
          /* Khung Remotion Player trung tâm */
          <div
            className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex items-center justify-center transition-all"
            style={{
              width: project.aspectRatio === '9:16' ? '310px' : '100%',
              maxWidth: '100%',
              aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: 'calc(100vh - 210px)'
            }}
          >
            {project.scenes.length > 0 ? (
              <Player
                ref={playerRef}
                component={MainComposition as any}
                inputProps={inputProps as any}
                durationInFrames={totalFrames}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                fps={fps}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                controls={false}
                autoPlay={false}
                loop={isLooping}
              />
            ) : (
              <div className="text-center p-8 text-zinc-500 text-xs flex flex-col items-center gap-2">
                <span className="text-2xl">🎬</span>
                <p>Chưa có phân cảnh nào trong danh sách.</p>
                <p className="text-[11px] text-zinc-600">Hãy thêm phân cảnh hoặc tạo kịch bản từ cột bên trái!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* THANH ĐIỀU KHIỂN PLAYBACK (Controls, Scrubber, Timecode, Loop) */}
      <div className="w-full bg-zinc-900/90 rounded-2xl p-3 border border-zinc-800 shadow-xl mt-2 flex flex-col gap-2">
        {/* Scrubber / Seekbar Frame Slider */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 w-14 text-right">
            {formatTimecode(currentFrame)}
          </span>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={Math.max(0, totalFrames - 1)}
              value={currentFrame}
              onChange={(e) => handleSeek(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer transition-all"
            />
          </div>

          <span className="text-[11px] font-mono text-zinc-500 w-14">
            {formatTimecode(totalFrames)}
          </span>
        </div>

        {/* Nút Play/Pause & Điều hướng frames */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
              Frame {currentFrame} / {totalFrames}
            </span>
          </div>

          {/* Cụm nút phát chính */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepFrame(-fps)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Lùi 1 giây"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát video (Phím Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleStepFrame(fps)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Tiến 1 giây"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSeek(0)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Về đầu video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cụm nút phụ: Loop & Phím tắt nhắc nhở */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                isLooping ? 'text-indigo-400 bg-indigo-950/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={isLooping ? 'Bật lặp lại video' : 'Tắt lặp lại'}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">Phím Space: Play/Pause</span>
          </div>
        </div>
      </div>
    </div>
  );
};
