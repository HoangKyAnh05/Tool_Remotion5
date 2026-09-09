import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Upload,
  Play,
  Pause,
  Clock,
  Sparkles,
  X,
  Film,
  Layers,
  ArrowRight,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Smartphone,
  Tv,
  Square,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { VideoProject, VideoSegment, TrimOverflowOption, AspectRatio, TrimSide } from '../types/video';
import {
  inspectVideoFile,
  splitVideoIntoSegments,
  trimSegmentWithOption,
  trimSegmentDirectional,
  convertSegmentsToScenes,
  formatTimeDisplay,
  detectVideoAspectRatio,
  generateAllSegmentThumbnails,
  VideoMetadata
} from '../services/videoSplitterService';

interface VideoSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const VideoSplitterModal: React.FC<VideoSplitterModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject
}) => {
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [splitInterval, setSplitInterval] = useState<number>(10);
  const [customInterval, setCustomInterval] = useState<string>('10');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(project.aspectRatio || '9:16');
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // Tham chiếu DOM Master Player duy nhất
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);
  const scrubberInputRef = useRef<HTMLInputElement | null>(null);
  const timeDisplayRef = useRef<HTMLSpanElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.aspectRatio) {
      setSelectedRatio(project.aspectRatio);
    }
  }, [project.aspectRatio]);

  const activeSegment = segments[activeSegmentIndex] || null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Tải lên video dài & Tự động phát hiện tỉ lệ 9:16 / 16:9 / 1:1
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const meta = await inspectVideoFile(file);
      setVideoMeta(meta);

      const autoRatio = meta.aspectRatio || detectVideoAspectRatio(meta.width, meta.height);
      setSelectedRatio(autoRatio);

      setProject((prev) => ({
        ...prev,
        aspectRatio: autoRatio
      }));

      const initialSegments = splitVideoIntoSegments(meta.url, meta.duration, splitInterval);
      setSegments(initialSegments);
      setActiveSegmentIndex(0);

      // Tạo thumbnails chạy ngầm
      generateAllSegmentThumbnails(meta.url, initialSegments).then((thumbs) => {
        setThumbnails(thumbs);
      });

      const ratioLabel =
        autoRatio === '9:16'
          ? '9:16 (Dọc TikTok/Shorts/Reels)'
          : autoRatio === '1:1'
          ? '1:1 (Vuông Instagram)'
          : '16:9 (Ngang YouTube)';
      showNotification(
        `✨ Đã nhận diện tỉ lệ ${ratioLabel} & độ nét ${meta.width}x${meta.height}! Đã chia thành ${initialSegments.length} clip (${splitInterval}s/clip).`
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đọc file video');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Chia lại theo khoảng thời gian mới
  const handleReSplit = (seconds: number) => {
    if (!videoMeta) return;
    setSplitInterval(seconds);
    const newSegments = splitVideoIntoSegments(videoMeta.url, videoMeta.duration, seconds);
    setSegments(newSegments);
    setActiveSegmentIndex(0);

    generateAllSegmentThumbnails(videoMeta.url, newSegments).then((thumbs) => {
      setThumbnails(thumbs);
    });

    showNotification(`Đã chia lại video thành ${newSegments.length} clip (mỗi clip ${seconds} giây)`);
  };

  // 3. Chuyển sang xem thử phân đoạn clip khác
  const handleSelectSegment = (index: number) => {
    if (index < 0 || index >= segments.length) return;
    setActiveSegmentIndex(index);
    const seg = segments[index];
    const v = masterVideoRef.current;
    if (v && seg) {
      v.currentTime = seg.startOffset;
      if (scrubberInputRef.current) scrubberInputRef.current.value = String(seg.startOffset);
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = `${formatTimeDisplay(seg.startOffset)} / ${formatTimeDisplay(seg.endOffset)}`;
      }
    }
  };

  // 4. Phát / Tạm dừng Master Video Player
  const togglePlayPause = () => {
    const v = masterVideoRef.current;
    if (!v || !activeSegment) return;

    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      if (v.currentTime >= activeSegment.endOffset || v.currentTime < activeSegment.startOffset) {
        v.currentTime = activeSegment.startOffset;
      }
      v.muted = isMuted;
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // 5. Native Frame Update bằng direct DOM update (0% React re-render lag)
  useEffect(() => {
    const v = masterVideoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!activeSegment) return;

      // Xử lý auto-looping mượt mà trong dải [startOffset, endOffset]
      if (v.currentTime >= activeSegment.endOffset) {
        if (isLooping) {
          v.currentTime = activeSegment.startOffset;
          v.play().catch(() => {});
        } else {
          v.pause();
          v.currentTime = activeSegment.startOffset;
          setIsPlaying(false);
        }
      } else if (v.currentTime < activeSegment.startOffset) {
        v.currentTime = activeSegment.startOffset;
      }

      // Cập nhật thanh tua & nhãn thời gian trực tiếp qua DOM (Cực nhanh, 0ms overhead)
      if (scrubberInputRef.current) {
        scrubberInputRef.current.value = String(v.currentTime);
      }
      if (timeDisplayRef.current) {
        const currentWithin = Math.max(0, v.currentTime - activeSegment.startOffset);
        timeDisplayRef.current.innerText = `⏱️ ${formatTimeDisplay(currentWithin)} / ${formatTimeDisplay(activeSegment.duration)} (Mốc: ${formatTimeDisplay(activeSegment.startOffset)} - ${formatTimeDisplay(activeSegment.endOffset)})`;
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [activeSegment, isLooping]);

  // 6. Tua Master Video Player tức thì
  const handleSeek = (newTime: number) => {
    if (!activeSegment) return;
    const clamped = Math.max(activeSegment.startOffset, Math.min(activeSegment.endOffset, Number(newTime.toFixed(2))));
    const v = masterVideoRef.current;
    if (v) {
      if (typeof (v as any).fastSeek === 'function') {
        (v as any).fastSeek(clamped);
      } else {
        v.currentTime = clamped;
      }
    }
  };

  const handleStep = (deltaSeconds: number) => {
    const v = masterVideoRef.current;
    if (v && activeSegment) {
      handleSeek(v.currentTime + deltaSeconds);
    }
  };

  // 7. Kéo co ngắn thời lượng (Đầu Trái / Đuôi Phải)
  const handleDurationChange = (
    index: number,
    newDur: number,
    side: TrimSide,
    specificMode?: TrimOverflowOption
  ) => {
    const seg = segments[index];
    if (!seg) return;

    let mode = specificMode;
    if (!mode) {
      mode = side === 'left' ? 'shift_to_prev' : 'shift_to_next';
    }

    const { updatedSegments, message } = trimSegmentWithOption(segments, index, newDur, mode, side);
    setSegments(updatedSegments);

    // Cập nhật Master Player nhảy ngay đến mốc vừa co
    const updatedTarget = updatedSegments[index];
    if (updatedTarget && index === activeSegmentIndex) {
      const v = masterVideoRef.current;
      const jumpTime = side === 'left' ? updatedTarget.startOffset : updatedTarget.endOffset;
      if (v) v.currentTime = jumpTime;
    }

    showNotification(message);
  };

  // 8. Co nhanh (1s, 2s) từ Đầu Trái hoặc Đuôi Phải
  const handleQuickTrim = (
    index: number,
    seconds: number,
    side: TrimSide,
    mode: TrimOverflowOption
  ) => {
    const seg = segments[index];
    if (!seg) return;

    const { updatedSegments, message } = trimSegmentDirectional(segments, index, seconds, side, mode);
    setSegments(updatedSegments);

    const updatedTarget = updatedSegments[index];
    if (updatedTarget && index === activeSegmentIndex) {
      const v = masterVideoRef.current;
      const jumpTime = side === 'left' ? updatedTarget.startOffset : updatedTarget.endOffset;
      if (v) v.currentTime = jumpTime;
    }

    showNotification(message);
  };

  // 9. Xóa 1 segment
  const handleDeleteSegment = (id: string) => {
    const filtered = segments
      .filter((s) => s.id !== id)
      .map((s, idx) => ({
        ...s,
        order: idx + 1,
        title: `Clip #${idx + 1} (${s.duration}s)`
      }));
    setSegments(filtered);
    if (activeSegmentIndex >= filtered.length) {
      setActiveSegmentIndex(Math.max(0, filtered.length - 1));
    }
    showNotification('Đã xóa 1 clip khỏi danh sách.');
  };

  // 10. Cập nhật kịch bản / ghi chú cho từng clip
  const handleUpdateNarration = (index: number, text: string) => {
    const copy = [...segments];
    copy[index].narration = text;
    setSegments(copy);
  };

  // 11. Thay đổi tỉ lệ khung hình thủ công
  const handleSelectRatio = (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    setProject((prev) => ({ ...prev, aspectRatio: ratio }));
    const label =
      ratio === '9:16'
        ? '9:16 (Dọc TikTok/Reels)'
        : ratio === '1:1'
        ? '1:1 (Vuông)'
        : '16:9 (Ngang YouTube)';
    showNotification(`Đã chuyển tỉ lệ khung hình sang: ${label}`);
  };

  // 12. Hoàn tất: Chuyển tất cả clip thành Scene trong Remotion Storyboard
  const handleApplyToStoryboard = () => {
    if (segments.length === 0) {
      alert('Chưa có clip nào được tạo. Vui lòng tải video lên trước.');
      return;
    }

    const newScenes = convertSegmentsToScenes(segments);
    const totalDuration = Number(segments.reduce((sum, s) => sum + s.duration, 0).toFixed(2));

    setProject((prev) => ({
      ...prev,
      aspectRatio: selectedRatio,
      scenes: newScenes,
      totalDuration
    }));

    alert(
      `🎉 Thành công! Đã chuyển ${newScenes.length} đoạn video ngắn (${selectedRatio}) vào Storyboard phân cảnh của Remotion Studio! Bạn có thể thêm phụ đề, lồng tiếng AI hoặc xuất video ngay.`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Bộ Chia Video Dài & Co Ngắn Hai Đầu
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  ⚡ Master Studio 60 FPS Siêu Mượt
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1 Master Player giải mã phần cứng 100% không giật lag, tua frame tức thì, co ngắn đầu trái / đuôi phải chuyên nghiệp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Bật/Tắt Âm Thanh Preview */}
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (masterVideoRef.current) masterVideoRef.current.muted = nextMuted;
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}
              title={isMuted ? 'Bật âm thanh video' : 'Tắt tiếng video'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isMuted ? 'Đang tắt tiếng' : 'Đang bật tiếng'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo nổi (Notification banner) */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Khu vực Upload Video nếu chưa có */}
          {!videoMeta ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group my-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-slate-800 group-hover:bg-rose-600/20 border border-slate-700 group-hover:border-rose-500 flex items-center justify-center text-slate-400 group-hover:text-rose-400 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Nhấn để tải lên hoặc kéo thả video dài vào đây
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Hệ thống tự động nhận diện khung hình dọc (9:16 TikTok/Reels) hoặc ngang (16:9 YouTube) và giữ nguyên độ nét 100% không bị mờ hay bóp méo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thanh Thông Tin Video Gốc & Tỉ Lệ */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-sm">
                      {videoMeta.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 text-rose-300 font-medium">
                        <Clock className="w-3 h-3" />
                        Tổng: {formatTimeDisplay(videoMeta.duration)} ({videoMeta.duration}s)
                      </span>
                      <span className="text-slate-300 font-mono">
                        • {videoMeta.width}x{videoMeta.height} px
                      </span>
                      <span>• {videoMeta.sizeMb} MB</span>
                    </div>
                  </div>
                </div>

                {/* Chọn Tỉ Lệ Khung Hình & Chia Giây Nhanh */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-400" /> Tỉ lệ:
                    </span>
                    <button
                      onClick={() => handleSelectRatio('9:16')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        selectedRatio === '9:16'
                          ? 'bg-rose-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3 h-3 inline mr-1" /> 9:16 Dọc
                    </button>
                    <button
                      onClick={() => handleSelectRatio('16:9')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        selectedRatio === '16:9'
                          ? 'bg-cyan-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tv className="w-3 h-3 inline mr-1" /> 16:9 Ngang
                    </button>
                    <button
                      onClick={() => handleSelectRatio('1:1')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        selectedRatio === '1:1'
                          ? 'bg-amber-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Square className="w-3 h-3 inline mr-1" /> 1:1
                    </button>
                  </div>

                  {/* Nút Chia Lại */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    {[5, 10, 15].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleReSplit(sec)}
                        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                          splitInterval === sec
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚡ {sec}s
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Đổi video
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* BỐ CỤC MASTER STUDIO (2 CỘT: PLAYER TRUNG TÂM & DANH SÁCH PHÂN ĐOẠN) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* CỘT TRÁI (MASTER PLAYER NATIVE 60 FPS) */}
                <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 sticky top-0 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-rose-400" />
                      MASTER PLAYER (60 FPS MƯỢT TUYỆT ĐỐI)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 font-bold">
                      Clip #{activeSegment?.order || 1} / {segments.length}
                    </span>
                  </div>

                  {/* Khung Chiếu Video Master (1 Thẻ Duy Nhất) */}
                  <div
                    className={`relative rounded-xl overflow-hidden bg-black border border-slate-800 mx-auto w-full flex items-center justify-center select-none shadow-2xl ${
                      selectedRatio === '9:16'
                        ? 'aspect-[9/16] max-h-[420px]'
                        : selectedRatio === '1:1'
                        ? 'aspect-square max-h-[360px]'
                        : 'aspect-video'
                    }`}
                  >
                    <video
                      ref={masterVideoRef}
                      src={videoMeta.url}
                      className="w-full h-full object-contain bg-black"
                      playsInline
                      preload="auto"
                      muted={isMuted}
                      onLoadedMetadata={() => {
                        if (masterVideoRef.current && activeSegment) {
                          masterVideoRef.current.currentTime = activeSegment.startOffset;
                        }
                      }}
                    />

                    {/* Nút Play/Pause To Ở Giữa Video */}
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-105 border border-white/20 shadow-2xl z-10"
                      title={isPlaying ? 'Tạm dừng (Space)' : 'Phát mượt 60 FPS (Space)'}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      )}
                    </button>

                    {/* Badge Tỉ lệ & Trạng Thái Lặp */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono border border-white/10 z-10">
                      {selectedRatio}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsLooping(!isLooping)}
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md backdrop-blur-sm text-[10px] font-mono border z-10 transition-all ${
                        isLooping
                          ? 'bg-rose-500/80 text-white border-rose-400'
                          : 'bg-black/60 text-slate-400 border-white/10'
                      }`}
                      title={isLooping ? 'Đang bật lặp lại clip' : 'Tắt lặp lại clip'}
                    >
                      🔁 Lặp lại
                    </button>
                  </div>

                  {/* Thanh Scrubber Tua Master Video Player (Native DOM Performance) */}
                  <div className="space-y-1.5 bg-slate-900/95 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Tua vị trí clip đang xem:</span>
                      <span ref={timeDisplayRef} className="text-rose-400 font-mono font-bold">
                        ⏱️ 00:00.0 / {activeSegment?.duration || 0}s
                      </span>
                    </div>

                    <input
                      ref={scrubberInputRef}
                      type="range"
                      min={activeSegment?.startOffset || 0}
                      max={activeSegment?.endOffset || 10}
                      step="0.05"
                      defaultValue={activeSegment?.startOffset || 0}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer hover:accent-pink-400 transition-all"
                    />

                    {/* Các Nút Điều Khiển Master Player */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSeek(activeSegment?.startOffset || 0)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Về đầu clip"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStep(-1)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                          title="Tua lùi 1 giây"
                        >
                          -1s
                        </button>
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            isPlaying
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                              : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300'
                          }`}
                        >
                          {isPlaying ? 'Tạm Dừng' : 'Phát Clip'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStep(1)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                          title="Tua tiến 1 giây"
                        >
                          +1s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSeek(activeSegment?.endOffset || 0)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Đến cuối clip"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={activeSegmentIndex <= 0}
                          onClick={() => handleSelectSegment(activeSegmentIndex - 1)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs transition-colors"
                        >
                          ⏮ Clip trước
                        </button>
                        <button
                          type="button"
                          disabled={activeSegmentIndex >= segments.length - 1}
                          onClick={() => handleSelectSegment(activeSegmentIndex + 1)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs transition-colors"
                        >
                          Clip sau ⏭
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI (DANH SÁCH CÁC CLIP CON & CÔNG CỤ CO 2 ĐẦU) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rose-400" />
                      Danh Sách Phân Đoạn ({segments.length} Clips):
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      💡 Nhấn vào clip để Master Player chiếu và phát ngay lập tức
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {segments.map((seg, idx) => {
                      const isCurrent = idx === activeSegmentIndex;
                      const isFirst = idx === 0;
                      const isLast = idx === segments.length - 1;
                      const thumb = thumbnails[seg.id] || seg.thumbnail;

                      return (
                        <div
                          key={seg.id}
                          onClick={() => handleSelectSegment(idx)}
                          className={`bg-slate-950/80 border rounded-xl p-3.5 space-y-3 transition-all cursor-pointer ${
                            isCurrent
                              ? 'border-rose-500/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40 bg-slate-950'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Tiêu đề & Thông tin mốc */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                  isCurrent
                                    ? 'bg-rose-500 text-white shadow'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {seg.order}
                              </span>
                              <span className="text-sm font-bold text-white flex items-center gap-2">
                                {seg.title}
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                                    Đang Chiếu Trên Player
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                                {formatTimeDisplay(seg.startOffset)} - {formatTimeDisplay(seg.endOffset)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSegment(seg.id);
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Xóa clip này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Thân thẻ: Thumbnail nhỏ + Bộ công cụ Co Ngắn 2 Đầu */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            {/* Thumbnail Snapshot Sắc Nét */}
                            <div className="sm:col-span-3 aspect-[9/16] max-h-[110px] rounded-lg overflow-hidden bg-black border border-slate-800 mx-auto sm:mx-0 relative flex items-center justify-center">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={seg.title}
                                  className="w-full h-full object-contain bg-black"
                                />
                              ) : (
                                <Film className="w-6 h-6 text-slate-600" />
                              )}
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-mono text-white">
                                {seg.duration}s
                              </div>
                            </div>

                            {/* Bộ Công Cụ Co Ngắn Đầu Trái & Đuôi Phải */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="sm:col-span-9 space-y-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-850"
                            >
                              {/* Thanh Kéo Co Thời Lượng */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">
                                  Kéo co ngắn thời lượng:
                                </span>
                                <span className="text-cyan-300 font-bold font-mono">
                                  {seg.duration} giây
                                </span>
                              </div>

                              <input
                                type="range"
                                min="0.5"
                                max={Math.max(1, Math.min(60, Number((videoMeta.duration || 60).toFixed(1))))}
                                step="0.5"
                                value={seg.duration}
                                onChange={(e) =>
                                  handleDurationChange(idx, parseFloat(e.target.value), 'right')
                                }
                                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                              />

                              {/* Các Nút Thao Tác Co Đầu Trái / Đuôi Phải Trực Tiếp */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
                                {/* Cụm Co Đầu Trái */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickTrim(idx, 1, 'left', 'discard')}
                                    disabled={seg.duration <= 1}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-900/40 text-amber-300 border border-slate-750 text-[10px] font-semibold transition-colors disabled:opacity-40"
                                    title="Co 1s ở đầu trái (Xóa bỏ)"
                                  >
                                    ⬅️ Co 1s Đầu (Xóa)
                                  </button>
                                  {!isFirst && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickTrim(idx, 2, 'left', 'shift_to_prev')}
                                      disabled={seg.duration <= 2}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-900/40 text-amber-300 border border-slate-750 text-[10px] font-semibold transition-colors disabled:opacity-40"
                                      title={`Co 2s ở đầu và đẩy sang đuôi Clip #${idx}`}
                                    >
                                      🔄 Co 2s (Đẩy về #{idx})
                                    </button>
                                  )}
                                </div>

                                {/* Cụm Co Đuôi Phải */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickTrim(idx, 1, 'right', 'discard')}
                                    disabled={seg.duration <= 1}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-750 text-[10px] font-semibold transition-colors disabled:opacity-40"
                                    title="Co 1s ở đuôi phải (Xóa bỏ)"
                                  >
                                    Co 1s Đuôi (Xóa) ➡️
                                  </button>
                                  {!isLast && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickTrim(idx, 2, 'right', 'shift_to_next')}
                                      disabled={seg.duration <= 2}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/40 text-cyan-300 border border-slate-750 text-[10px] font-semibold transition-colors disabled:opacity-40"
                                      title={`Co 2s ở đuôi và đẩy sang đầu Clip #${idx + 2}`}
                                    >
                                      🔄 Co 2s (Đẩy sang #{idx + 2})
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Ghi chú / Lời thuyết minh phân cảnh */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={seg.narration || ''}
                              onChange={(e) => handleUpdateNarration(idx, e.target.value)}
                              placeholder={`Ghi chú kịch bản clip #${seg.order} (vd: Giới thiệu phòng ngủ, view săn mây...)`}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {segments.length > 0 && (
              <span>
                💡 Khi bấm <strong>"Đưa Vào Storyboard Phân Cảnh"</strong>, Remotion sẽ tự động cấu hình khung hình <strong>{selectedRatio}</strong> và video gốc theo từng mốc thời gian đã co ngắn.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={handleApplyToStoryboard}
              disabled={segments.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Đưa Vào Storyboard Phân Cảnh ({segments.length} Clips - {selectedRatio})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
