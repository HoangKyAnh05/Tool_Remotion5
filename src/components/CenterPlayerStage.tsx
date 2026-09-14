import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { MainComposition } from '../remotion/Composition';
import { VideoProject, ElementPosition, Scene } from '../types/video';
import {
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Tv,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Expand,
  Video
} from 'lucide-react';

interface CenterPlayerStageProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const CenterPlayerStage: React.FC<CenterPlayerStageProps> = ({ project, setProject }) => {
  const playerRef = useRef<PlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const fullscreenHideTimerRef = useRef<any>(null);

  const fps = project.fps || 30;

  // Lắng nghe sự kiện Fullscreen của trình duyệt
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      setShowFullscreenControls(true);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMouseMoveInPlayer = () => {
    setShowFullscreenControls(true);
    if (fullscreenHideTimerRef.current) {
      clearTimeout(fullscreenHideTimerRef.current);
    }
    if (isFullscreen) {
      fullscreenHideTimerRef.current = setTimeout(() => {
        if (playerRef.current?.isPlaying()) {
          setShowFullscreenControls(false);
        }
      }, 3000);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const target = playerContainerRef.current || document.documentElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

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
    if (!playerRef.current) return;
    playerRef.current.seekTo(frame);
    setCurrentFrame(frame);
  };

  const handleStepFrame = (delta: number) => {
    if (!playerRef.current) return;
    const target = Math.max(0, Math.min(totalFrames - 1, currentFrame + delta));
    playerRef.current.seekTo(target);
    setCurrentFrame(target);
  };

  const formatTimecode = (frame: number) => {
    const totalSeconds = frame / fps;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const millis = Math.floor((totalSeconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis}`;
  };

  // Cập nhật vị trí tọa độ các layer khi kéo thả
  const handleUpdatePositions = (sceneId: string, positions: Record<string, ElementPosition>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          ...positions
        };
      })
    }));
  };

  // Cập nhật câu thoại từ Canvas
  const handleUpdateNarration = (sceneId: string, newNarration: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          narration: newNarration
        };
      })
    }));
  };

  // Cập nhật toàn bộ scene từ Canvas
  const handleUpdateScene = (sceneId: string, updated: Partial<Scene>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        return {
          ...s,
          ...updated
        };
      })
    }));
  };

  return (
    <div className="h-full flex flex-col items-center justify-between p-3 sm:p-4 bg-slate-100 select-none">
      {/* Top Bar: Preview Mode & Quick Ratio */}
      <div className="w-full flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
        {/* Title Indicator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <Video className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Khung Phát Video Trực Tiếp</span>
          <span className="text-[10px] text-slate-400 font-mono">({project.scenes.length} Scenes)</span>
        </div>

        {/* Aspect Ratio Switch & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm text-xs">
            <button
              onClick={() => setProject((prev) => ({ ...prev, aspectRatio: '9:16' }))}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                project.aspectRatio === '9:16'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Khung hình dọc 9:16 (TikTok, Reels, Shorts)"
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16</span>
            </button>
            <button
              onClick={() => setProject((prev) => ({ ...prev, aspectRatio: '16:9' }))}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                project.aspectRatio === '16:9'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Khung hình ngang 16:9 (YouTube, Facebook)"
            >
              <Tv className="w-3 h-3" />
              <span>16:9</span>
            </button>
          </div>

          {/* Nút Phóng To Toàn Màn Hình */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isFullscreen
                ? 'bg-indigo-600 text-white shadow-indigo-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:text-indigo-600'
            }`}
            title={isFullscreen ? 'Thu nhỏ (Thoát toàn màn hình)' : 'Phóng to xem toàn màn hình (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* KHUNG PREVIEW TRUNG TÂM (Remotion Player Canvas) */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative my-auto">
        <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMoveInPlayer}
            onMouseEnter={() => setShowFullscreenControls(true)}
            className={`group relative bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-300 flex items-center justify-center transition-all select-none ${
              isFullscreen ? 'w-full h-full max-h-screen bg-black border-none rounded-none' : ''
            }`}
            style={{
              width: isFullscreen ? '100%' : project.aspectRatio === '9:16' ? '310px' : '100%',
              maxWidth: '100%',
              aspectRatio: isFullscreen ? undefined : project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 210px)'
            }}
          >
            {/* Thanh Header nổi khi ở chế độ Toàn màn hình */}
            {isFullscreen && (
              <div
                className={`absolute top-0 inset-x-0 z-40 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between text-white transition-opacity duration-300 ${
                  showFullscreenControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm sm:text-base tracking-wide text-white drop-shadow">
                    Studio Remotion Player
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 border border-white/20 text-cyan-300 font-semibold font-mono">
                    {project.aspectRatio}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Thu nhỏ (Phím Esc)</span>
                </button>
              </div>
            )}

            {/* Nút Phóng To nổi trên góc video khi hover (khi chưa fullscreen) */}
            {!isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-xl active:scale-95"
                title="Phóng to xem toàn màn hình"
              >
                <Maximize2 className="w-4 h-4 text-cyan-300" />
              </button>
            )}

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
                  width: isFullscreen && project.aspectRatio === '9:16' ? 'auto' : '100%',
                  height: isFullscreen && project.aspectRatio === '9:16' ? '100vh' : '100%',
                  aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
                  maxWidth: '100%',
                  maxHeight: '100vh'
                }}
                controls={false}
                autoPlay={false}
                loop={isLooping}
              />
            ) : (
              <div className="text-center p-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="text-2xl">🎬</span>
                <p>Chưa có phân cảnh nào trong danh sách.</p>
                <p className="text-[11px] text-slate-500">Hãy thêm phân cảnh hoặc tạo kịch bản từ cột bên trái!</p>
              </div>
            )}

            {/* THANH ĐIỀU KHIỂN & TUA VIDEO NỔI KHI TOÀN MÀN HÌNH (FULLSCREEN FLOATING CONTROLS) */}
            {isFullscreen && (
              <div
                className={`absolute bottom-0 inset-x-0 z-40 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2.5 transition-opacity duration-300 ${
                  showFullscreenControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Thanh Tua Thời Gian (Scrubber Slider) */}
                <div className="w-full flex items-center gap-3">
                  <span className="text-xs font-mono text-cyan-300 font-bold w-16 text-right drop-shadow">
                    {formatTimecode(currentFrame)}
                  </span>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, totalFrames - 1)}
                      value={currentFrame}
                      onChange={(e) => handleSeek(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 h-2 bg-white/30 rounded-lg cursor-pointer transition-all hover:h-2.5 shadow-md"
                    />
                  </div>

                  <span className="text-xs font-mono text-slate-300 w-16 drop-shadow">
                    {formatTimecode(totalFrames)}
                  </span>
                </div>

                {/* Hàng các nút điều khiển: Play, Tua, Frame, Loop, Thoát */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-cyan-300 font-bold drop-shadow">
                      Frame {currentFrame} / {totalFrames}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Phím Space: Play/Pause</span>
                  </div>

                  {/* Cụm nút Play/Pause chính giữa */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleStepFrame(-fps)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                      title="Lùi 1 giây"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="w-12 h-12 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-lg transition-all active:scale-95"
                      title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát video (Phím Space)'}
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStepFrame(fps)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                      title="Tiến 1 giây"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSeek(0)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                      title="Về đầu video"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cụm nút phụ bên phải */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLooping(!isLooping)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isLooping
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                      title={isLooping ? 'Bật lặp lại video' : 'Tắt lặp lại'}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Lặp lại</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Thu nhỏ (Thoát toàn màn hình)"
                    >
                      <Minimize2 className="w-4 h-4 text-cyan-300" />
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN PLAYBACK (Controls, Scrubber, Timecode, Loop) */}
      <div className="w-full bg-white rounded-xl p-3 border border-slate-200 shadow-sm mt-2 flex flex-col gap-2">
        {/* Scrubber / Seekbar Frame Slider */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-600 w-14 text-right">
            {formatTimecode(currentFrame)}
          </span>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={Math.max(0, totalFrames - 1)}
              value={currentFrame}
              onChange={(e) => handleSeek(parseInt(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer transition-all"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 w-14">
            {formatTimecode(totalFrames)}
          </span>
        </div>

        {/* Nút Play/Pause & Điều hướng frames */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600 text-xs">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              Frame {currentFrame} / {totalFrames}
            </span>
          </div>

          {/* Cụm nút phát chính */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepFrame(-fps)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Lùi 1 giây"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
              title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát video (Phím Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleStepFrame(fps)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Tiến 1 giây"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSeek(0)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Về đầu video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cụm nút phụ: Loop & Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                isLooping ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isLooping ? 'Bật lặp lại video' : 'Tắt lặp lại'}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">Lặp lại</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={isFullscreen ? 'Thu nhỏ (Thoát toàn màn hình)' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
