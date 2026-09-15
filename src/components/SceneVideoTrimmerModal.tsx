import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Check,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Film,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Scene } from '../types/video';

interface SceneVideoTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onSave: (sceneId: string, updates: Partial<Scene>) => void;
}

export const SceneVideoTrimmerModal: React.FC<SceneVideoTrimmerModalProps> = ({
  isOpen,
  onClose,
  scene,
  onSave
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoopingPreview, setIsLoopingPreview] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Trimming Offsets
  const targetDuration = scene?.audioDuration || 4.0;
  const [startOffset, setStartOffset] = useState<number>(0);
  const [endOffset, setEndOffset] = useState<number>(targetDuration);
  const [lockDuration, setLockDuration] = useState<boolean>(true);

  // Initialize values when modal opens with a scene
  useEffect(() => {
    if (scene && isOpen) {
      const initialStart = scene.videoStartOffset || 0;
      const initialEnd =
        scene.videoEndOffset && scene.videoEndOffset > initialStart
          ? scene.videoEndOffset
          : initialStart + (scene.audioDuration || 4.0);

      setStartOffset(initialStart);
      setEndOffset(initialEnd);
      setLockDuration(true);
      setCurrentTime(initialStart);
      setIsPlaying(false);
    }
  }, [scene, isOpen]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setVideoDuration(dur);
        const sOff = scene?.videoStartOffset || 0;
        const eOff = Math.min(dur, sOff + (scene?.audioDuration || 4.0));
        setStartOffset(Math.max(0, Math.min(sOff, dur - 0.5)));
        setEndOffset(Math.max(sOff + 0.5, eOff));
        if (videoRef.current) {
          videoRef.current.currentTime = sOff;
        }
      }
    }
  };

  // Keep playback looped within [startOffset, endOffset] when previewing
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    if (isLoopingPreview) {
      if (curr >= endOffset || curr < startOffset - 0.1) {
        videoRef.current.currentTime = startOffset;
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startOffset || videoRef.current.currentTime >= endOffset) {
        videoRef.current.currentTime = startOffset;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Jump to start of segment and play preview
  const handlePlaySegmentPreview = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startOffset;
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  // Seek video directly
  const seekTo = (sec: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(sec, videoDuration || 1000));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  };

  // Update Start Offset
  const updateStartOffset = (newStart: number) => {
    const maxStart = videoDuration > 0 ? Math.max(0, videoDuration - 0.5) : 1000;
    const clampedStart = Math.max(0, Math.min(newStart, maxStart));

    setStartOffset(clampedStart);

    if (lockDuration) {
      const newEnd = clampedStart + targetDuration;
      setEndOffset(videoDuration > 0 ? Math.min(videoDuration, newEnd) : newEnd);
    } else {
      if (clampedStart >= endOffset) {
        setEndOffset(clampedStart + 0.5);
      }
    }

    seekTo(clampedStart);
  };

  // Update End Offset (when unlocked)
  const updateEndOffset = (newEnd: number) => {
    const minEnd = startOffset + 0.2;
    const maxEnd = videoDuration > 0 ? videoDuration : 1000;
    const clampedEnd = Math.max(minEnd, Math.min(newEnd, maxEnd));
    setEndOffset(clampedEnd);
    seekTo(clampedEnd);
  };

  // Quick jump presets
  const applyPreset = (percentage: number) => {
    if (videoDuration <= 0) return;
    const maxPossibleStart = Math.max(0, videoDuration - targetDuration);
    const targetStart = maxPossibleStart * (percentage / 100);
    updateStartOffset(targetStart);
  };

  // Nudge start offset by seconds (e.g. +1s, -1s, +0.5s, -0.5s)
  const nudgeOffset = (seconds: number) => {
    updateStartOffset(startOffset + seconds);
  };

  // Save changes
  const handleSaveAndApply = () => {
    if (!scene) return;
    const newDur = Math.max(0.5, Number((endOffset - startOffset).toFixed(2)));

    // Khi tự do chỉnh độ dài: Tự động co giãn nhịp từ phụ đề (words) tương ứng với thời lượng mới
    let updatedWords = scene.words;
    if (
      Math.abs(newDur - (scene.audioDuration || 4.0)) > 0.05 &&
      scene.words &&
      scene.words.length > 0
    ) {
      const oldDur = Math.max(0.5, scene.audioDuration || 4.0);
      const ratio = newDur / oldDur;
      updatedWords = scene.words.map((w) => ({
        ...w,
        start: Number((w.start * ratio).toFixed(2)),
        end: Number((w.end * ratio).toFixed(2))
      }));
    }

    onSave(scene.id, {
      videoStartOffset: Number(startOffset.toFixed(2)),
      videoEndOffset: Number(endOffset.toFixed(2)),
      audioDuration: newDur,
      words: updatedWords
    });
    onClose();
  };

  // Format seconds to mm:ss.ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  if (!isOpen || !scene) return null;

  const currentDuration = Math.max(0.1, endOffset - startOffset);
  const mediaSrc = scene.mediaUrl || scene.localMediaPath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Kéo Cắt Đoạn Source Cho Phân Cảnh {scene.order}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  Cần lấy: {targetDuration.toFixed(1)}s
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {scene.narration || 'Chọn đoạn video source đẹp nhất khớp với thời lượng kịch bản'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main Video Player */}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner group flex items-center justify-center">
            {mediaSrc ? (
              <video
                ref={videoRef}
                src={mediaSrc}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                muted={isMuted}
                playsInline
              />
            ) : (
              <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                <Film className="w-8 h-8 text-slate-500 animate-pulse" />
                <span>Không tìm thấy video source</span>
              </div>
            )}

            {/* In-video HUD Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-mono border border-white/10">
                ⏱ {formatTime(currentTime)} / {formatTime(videoDuration)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-xs font-mono border border-emerald-500/30 font-semibold">
                ✂️ Đang lấy: {formatTime(startOffset)} ➔ {formatTime(endOffset)} ({currentDuration.toFixed(1)}s)
              </span>
            </div>

            {/* Quick Player Controls Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all active:scale-95"
                  title={isPlaying ? 'Tạm dừng' : 'Phát video'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={handlePlaySegmentPreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition-all"
                  title="Xem lại đoạn đã chọn từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xem đoạn chọn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              {/* Status info */}
              <div className="text-xs text-slate-300 font-medium">
                {lockDuration ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Khóa độ dài chuẩn: {targetDuration.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Độ dài tự do: {currentDuration.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trimming Timeline Scrubber Bar */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Thanh kéo chọn đoạn trong video gốc</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLockDuration(!lockDuration)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    lockDuration
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  }`}
                  title="Khóa thời lượng để khi kéo mốc bắt đầu, đoạn cắt tự động giữ đúng số giây của kịch bản"
                >
                  {lockDuration ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{lockDuration ? `Khóa ${targetDuration.toFixed(1)}s (Khuyên dùng)` : 'Tự do chỉnh'}</span>
                </button>
              </div>
            </div>

            {/* Visual Range Timeline Bar */}
            <div className="relative pt-6 pb-2 select-none">
              {/* Timeline Track Background */}
              <div
                ref={timelineRef}
                onClick={(e) => {
                  if (!timelineRef.current || videoDuration <= 0) return;
                  const rect = timelineRef.current.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = Math.max(0, Math.min(1, clickX / rect.width));
                  const clickSec = percent * videoDuration;
                  updateStartOffset(clickSec);
                }}
                className="relative w-full h-8 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 cursor-pointer shadow-inner"
              >
                {/* Active Selected Zone */}
                {videoDuration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/40 via-emerald-400/50 to-teal-500/40 border-y-2 border-emerald-400 transition-all pointer-events-none"
                    style={{
                      left: `${(startOffset / videoDuration) * 100}%`,
                      width: `${(currentDuration / videoDuration) * 100}%`
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white tracking-wider drop-shadow">
                      {currentDuration.toFixed(1)}s
                    </div>
                  </div>
                )}

                {/* Current Playhead Indicator */}
                {videoDuration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                  />
                )}
              </div>

              {/* Start & End Offset Sliders */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 w-28 font-medium">Bắt đầu ({startOffset.toFixed(1)}s):</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, (videoDuration || 100) - (lockDuration ? targetDuration : 0.5))}
                    step={0.1}
                    value={startOffset}
                    onChange={(e) => updateStartOffset(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-emerald-400 w-16 text-right">
                    {formatTime(startOffset)}
                  </span>
                </div>

                {!lockDuration && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-28 font-medium">Kết thúc ({endOffset.toFixed(1)}s):</span>
                    <input
                      type="range"
                      min={startOffset + 0.5}
                      max={Math.max(startOffset + 1, videoDuration || 100)}
                      step={0.1}
                      value={endOffset}
                      onChange={(e) => updateEndOffset(parseFloat(e.target.value))}
                      className="flex-1 accent-teal-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-teal-400 w-16 text-right">
                      {formatTime(endOffset)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets & Nudge Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Vị trí:</span>
                <button
                  type="button"
                  onClick={() => applyPreset(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all"
                >
                  Đầu (0s)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(25)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(50)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all"
                >
                  Giữa (50%)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(75)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(100)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-all"
                >
                  Cuối
                </button>
              </div>

              {/* Nudge fine tuning */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Dịch:</span>
                <button
                  type="button"
                  onClick={() => nudgeOffset(-2)}
                  className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-mono transition-all"
                >
                  -2s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeOffset(-0.5)}
                  className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-mono transition-all"
                >
                  -0.5s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeOffset(0.5)}
                  className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-mono transition-all"
                >
                  +0.5s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeOffset(2)}
                  className="px-2 py-1 rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-mono transition-all"
                >
                  +2s
                </button>
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300">💡 Cơ chế điều chỉnh thời lượng:</strong> Khi bạn chọn <strong className="text-amber-300">Tự do chỉnh</strong> và kéo dài thêm hoặc rút ngắn phân cảnh này, <strong className="text-white">tổng thời lượng video sẽ tự động tăng/giảm tương ứng</strong> mà <strong className="text-emerald-400">tuyệt đối không bị cắt bớt hay thay đổi thời gian của các phân cảnh sau!</strong>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            Khoảng cắt: <span className="font-mono text-white">{formatTime(startOffset)}</span> ➔ <span className="font-mono text-white">{formatTime(endOffset)}</span> (Độ dài: <span className="text-emerald-400 font-bold">{currentDuration.toFixed(1)}s</span> — <span className="text-slate-300">Tự động điều chỉnh tổng độ dài video</span>)
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>✓ Áp dụng đoạn này cho Cảnh {scene.order}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
