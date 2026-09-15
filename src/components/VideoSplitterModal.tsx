import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Smartphone,
  Tv,
  Square,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Plus,
  Video,
  FileVideo,
  HardDrive,
  Key,
  Bot,
  Sliders,
  ChevronRight,
  FastForward
} from 'lucide-react';
import { VideoProject, VideoSegment, TrimOverflowOption, AspectRatio, TrimSide, Scene } from '../types/video';
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
import { GoogleDriveFolderPicker } from './GoogleDriveFolderPicker';
import {
  generateWithOpenAI,
  autoSynthesizeScenesVoice,
  suggestTimestampsAndStructureWithAI,
  parseSplitPointsToRanges,
  formatSplitRangesToTimestamps,
  parseCustomTimestampsToRanges,
  extractDescriptionsFromMultiLineText,
  extractSplitPointsFromMultiLineText,
  ParsedTimeRange,
  SuggestedSceneStructure,
  DEFAULT_OPENAI_KEY,
  DEFAULT_GEMINI_KEY
} from '../services/aiScriptService';

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
  // Video Splitter State (Bước 2)
  const [loadedVideos, setLoadedVideos] = useState<VideoMetadata[]>([]);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [splitInterval, setSplitInterval] = useState<number>(10);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(project.aspectRatio || '9:16');
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  const [inputSourceTab, setInputSourceTab] = useState<'upload' | 'drive'>('upload');
  const [isDriveAppendOpen, setIsDriveAppendOpen] = useState(false);

  // OpenAI / AI Script & Voice State (Bước 1)
  const [openaiKey, setOpenaiKey] = useState<string>(() => {
    return (
      localStorage.getItem('OPENAI_API_KEY') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      DEFAULT_GEMINI_KEY
    );
  });
  const [aiTopic, setAiTopic] = useState<string>(project.topic || '');
  const [aiAvailableSources, setAiAvailableSources] = useState<string>('');
  const [aiRawScript, setAiRawScript] = useState<string>('');
  const [quickSplitInput, setQuickSplitInput] = useState<string>('5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s');
  const [parsedSplitRanges, setParsedSplitRanges] = useState<ParsedTimeRange[]>(() => {
    return parseSplitPointsToRanges('5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s', { topic: project.topic || '' });
  });
  const [aiSceneCount, setAiSceneCount] = useState<number>(7);

  const handleQuickSplitChange = (val: string) => {
    setQuickSplitInput(val);
    if (!val || !val.trim()) {
      setParsedSplitRanges([]);
      return;
    }
    // Lấy mô tả hiện có từ aiAvailableSources hoặc từ aiCustomTimestamps hiện tại
    const existingDesc = extractDescriptionsFromMultiLineText(aiCustomTimestamps);
    const sourceDesc = aiAvailableSources
      .split('\n')
      .map(s => s.replace(/^\d+[\.\:\-\)]\s*/, '').trim())
      .filter(Boolean);
    const descriptionsToUse = sourceDesc.length > 0 ? sourceDesc : existingDesc;

    const ranges = parseSplitPointsToRanges(val, {
      topic: aiTopic || project.topic || '',
      customSources: descriptionsToUse
    });

    if (ranges.length > 0) {
      setParsedSplitRanges(ranges);
      setAiSceneCount(ranges.length);
      const formatted = formatSplitRangesToTimestamps(ranges, aiTopic || project.topic || '');
      setAiCustomTimestamps(formatted);
    } else {
      setParsedSplitRanges([]);
    }
  };

  const handleCustomTimestampsChange = (val: string) => {
    setAiCustomTimestamps(val);
    if (!val || !val.trim()) {
      setQuickSplitInput('');
      setParsedSplitRanges([]);
      return;
    }
    const { quickString } = extractSplitPointsFromMultiLineText(val);
    if (quickString) {
      setQuickSplitInput(quickString);
    }
    const ranges = parseCustomTimestampsToRanges(val, aiTopic || project.topic || '');
    if (ranges.length > 0) {
      setParsedSplitRanges(ranges);
      setAiSceneCount(ranges.length);
    }
  };

  const [aiCustomTimestamps, setAiCustomTimestamps] = useState<string>(() => {
    const initialRanges = parseSplitPointsToRanges('5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s', { topic: project.topic || '' });
    return formatSplitRangesToTimestamps(initialRanges, project.topic || '');
  });
  const [selectedVoice, setSelectedVoice] = useState<string>(project.voice?.name || 'google-vi-male');
  const [selectedVoiceRate, setSelectedVoiceRate] = useState<string>(project.voice?.rate || '+0%');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSuggestingTimestamps, setIsSuggestingTimestamps] = useState<boolean>(false);
  const [suggestedStructure, setSuggestedStructure] = useState<SuggestedSceneStructure[]>([]);
  const [isAiSectionOpen, setIsAiSectionOpen] = useState<boolean>(true);

  // AI tự động phân tích chủ đề và gợi ý chính xác các mốc thời gian, phân cảnh, góc máy & lời dẫn
  const handleAiSuggestTimestamps = async (targetCount?: number) => {
    if (!aiTopic || !aiTopic.trim()) {
      showNotification('⚠️ Vui lòng nhập Chủ đề / Tên video trước để AI phân tích và gợi ý!');
      return;
    }

    try {
      setIsSuggestingTimestamps(true);
      showNotification(`🤖 AI đang phân tích "${aiTopic}" để gợi ý các mốc thời gian & phân cảnh chi tiết...`);

      const effectiveCount = targetCount || aiSceneCount || 6;
      const res = await suggestTimestampsAndStructureWithAI({
        topic: aiTopic.trim(),
        sceneCount: effectiveCount,
        availableSources: aiAvailableSources,
        apiKey: openaiKey.trim()
      });

      if (res && res.formattedTimestamps) {
        setAiCustomTimestamps(res.formattedTimestamps);
        const { quickString } = extractSplitPointsFromMultiLineText(res.formattedTimestamps);
        if (quickString) {
          setQuickSplitInput(quickString);
        }
        const ranges = parseCustomTimestampsToRanges(res.formattedTimestamps, aiTopic || project.topic || '');
        if (ranges.length > 0) {
          setParsedSplitRanges(ranges);
        }
      }
      if (res && res.scenes && res.scenes.length > 0) {
        setSuggestedStructure(res.scenes);
        setAiSceneCount(res.scenes.length);
      }

      showNotification(`✨ AI đã gợi ý thành công ${res.scenes.length} mốc thời gian & phân cảnh chuẩn cho "${aiTopic}"!`);
    } catch (err: any) {
      console.error('Lỗi khi AI gợi ý mốc thời gian:', err);
      showNotification(`⚠️ Lưu ý: ${err.message || 'Lỗi khi gợi ý mốc thời gian'}`);
    } finally {
      setIsSuggestingTimestamps(false);
    }
  };

  // Tự động phân bổ mốc thời gian chuẩn từ số phân cảnh hoặc danh sách Source
  const handleAutoGenerateTimestamps = (targetCount?: number, customSourcesText?: string) => {
    const rawSources = (typeof customSourcesText === 'string' ? customSourcesText : aiAvailableSources)
      .split('\n')
      .map(s => s.replace(/^\d+[\.\:\-\)]\s*/, '').trim())
      .filter(Boolean);

    const effectiveCount = targetCount || (rawSources.length > 0 ? rawSources.length : aiSceneCount) || 4;
    let currentStart = 0;
    const lines: string[] = [];

    for (let i = 0; i < effectiveCount; i++) {
      const dur = i === 0 ? 10 : 15;
      const startStr = formatTimeDisplay(currentStart);
      const endStr = formatTimeDisplay(currentStart + dur);
      const sourceDesc = rawSources[i] || (
        i === 0 ? 'Giới thiệu tổng quan & Mở đầu' :
        i === 1 ? 'Không gian chi tiết & Góc quay đặc sắc' :
        i === effectiveCount - 1 ? 'Tổng kết & Kêu gọi hành động' :
        `Trải nghiệm & Điểm nhấn phân cảnh ${i + 1}`
      );
      lines.push(`${startStr} - ${endStr}: ${sourceDesc}`);
      currentStart += dur;
    }

    const result = lines.join('\n');
    setAiCustomTimestamps(result);
    setAiSceneCount(effectiveCount);
    const { quickString } = extractSplitPointsFromMultiLineText(result);
    if (quickString) {
      setQuickSplitInput(quickString);
    }
    const ranges = parseCustomTimestampsToRanges(result, aiTopic || project.topic || '');
    if (ranges.length > 0) {
      setParsedSplitRanges(ranges);
    }
    showNotification(`⚡ Đã tự động tạo ${effectiveCount} mốc thời gian phân cảnh chuẩn!`);
    return result;
  };

  // Tham chiếu DOM Master Player duy nhất
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);
  const scrubberInputRef = useRef<HTMLInputElement | null>(null);
  const timeDisplayRef = useRef<HTMLSpanElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.aspectRatio) {
      setSelectedRatio(project.aspectRatio);
    }
  }, [project.aspectRatio]);

  const activeSegment = segments[activeSegmentIndex] || null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Tính toán tổng thời lượng và thông số tổng hợp
  const totalDurationSeconds = Number(
    segments.reduce((sum, s) => sum + s.duration, 0).toFixed(2)
  );
  const totalVideoSizeMb = Number(
    loadedVideos.reduce((sum, v) => sum + v.sizeMb, 0).toFixed(2)
  );

  // 1. Nạp và xử lý mảng file video
  const loadVideoFiles = async (
    files: File[],
    mode: 'replace' | 'append' = 'replace'
  ) => {
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      const newMetas: VideoMetadata[] = [];

      for (const file of files) {
        const meta = await inspectVideoFile(file);
        newMetas.push(meta);
      }

      if (newMetas.length === 0) return;

      if (mode === 'replace') {
        const firstMeta = newMetas[0];
        const autoRatio = firstMeta.aspectRatio || detectVideoAspectRatio(firstMeta.width, firstMeta.height);
        setSelectedRatio(autoRatio);
        setProject((prev) => ({ ...prev, aspectRatio: autoRatio }));

        let initialSegments: VideoSegment[] = [];
        let startOrder = 1;

        for (const meta of newMetas) {
          const segs = splitVideoIntoSegments(meta.url, meta.duration, splitInterval, startOrder, meta.name);
          initialSegments = [...initialSegments, ...segs];
          startOrder += segs.length;
        }

        setLoadedVideos(newMetas);
        setSegments(initialSegments);
        setActiveSegmentIndex(0);

        generateAllSegmentThumbnails(initialSegments).then((thumbs) => {
          setThumbnails(thumbs);
        });

        if (masterVideoRef.current && initialSegments[0]) {
          masterVideoRef.current.src = initialSegments[0].sourceUrl;
          masterVideoRef.current.currentTime = initialSegments[0].startOffset;
        }

        showNotification(
          `✨ Đã nạp ${newMetas.length} video (${autoRatio})! Đã tự động chia thành ${initialSegments.length} clip (${splitInterval}s/clip).`
        );
      } else {
        let appendedSegments: VideoSegment[] = [];
        let startOrder = segments.length + 1;

        for (const meta of newMetas) {
          const segs = splitVideoIntoSegments(meta.url, meta.duration, splitInterval, startOrder, meta.name);
          appendedSegments = [...appendedSegments, ...segs];
          startOrder += segs.length;
        }

        const combinedLoaded = [...loadedVideos, ...newMetas];
        const combinedSegments = [...segments, ...appendedSegments];

        setLoadedVideos(combinedLoaded);
        setSegments(combinedSegments);

        generateAllSegmentThumbnails(appendedSegments).then((newThumbs) => {
          setThumbnails((prev) => ({ ...prev, ...newThumbs }));
        });

        showNotification(
          `➕ Đã nạp thêm ${newMetas.length} video tiếp nối! Thêm ${appendedSegments.length} clip mới.`
        );
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nạp file video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'replace' | 'append' = 'replace'
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    await loadVideoFiles(files, mode);
    e.target.value = '';
  };

  // 2. Tự động sinh Kịch bản & Giọng đọc AI (Bước 1)
  const handleGenerateOpenAiScript = async () => {
    try {
      setIsGeneratingAi(true);
      if (openaiKey.trim()) {
        localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
      }

      const effectiveCount = (parsedSplitRanges && parsedSplitRanges.length > 0)
        ? parsedSplitRanges.length
        : (aiSceneCount || (loadedVideos.length > 0 ? segments.length : 6));
      showNotification(`🤖 Đang phân tích và tạo kịch bản cho đúng ${effectiveCount} phân cảnh...`);

      const generatedScenes = await generateWithOpenAI({
        topic: aiTopic || 'Video clip tổng hợp',
        rawScriptInput: aiRawScript,
        customTimestamps: aiCustomTimestamps,
        sceneCount: effectiveCount,
        apiKey: openaiKey.trim()
      });

      showNotification('🎙️ Đang tự động sinh giọng lồng tiếng AI chất lượng cao...');

      // Map generated scenes into temporary Scene objects
      const fullScenes: Scene[] = generatedScenes.map((s) => ({
        ...s,
        audioDuration: 4.0,
        words: []
      }));

      const synthesizedScenes = await autoSynthesizeScenesVoice(
        fullScenes,
        selectedVoice,
        project.voice?.rate || '+0%',
        project.voice?.pitch || '+0Hz',
        (idx, total) => {
          showNotification(`🎙️ Đang tạo giọng đọc phân cảnh ${idx}/${total}...`);
        }
      );

      // Cập nhật vào danh sách segments với ĐÚNG số lượng phân cảnh đã sinh (synthesizedScenes)
      const primaryVideoUrl = loadedVideos[0]?.url || '';
      const updatedSegments: VideoSegment[] = synthesizedScenes.map((sc, idx) => {
        const sOff = typeof sc.videoStartOffset === 'number' ? sc.videoStartOffset : idx * 10;
        const eOff = typeof sc.videoEndOffset === 'number' ? sc.videoEndOffset : (idx + 1) * 10;
        const dur = Number(Math.max(0.1, eOff - sOff).toFixed(2));
        const existingSeg = segments[idx];
        return {
          id: existingSeg?.id || `seg-ai-${Date.now()}-${idx + 1}`,
          order: idx + 1,
          title: sc.cutAction?.startsWith('Clip #') ? sc.cutAction : `Clip #${idx + 1}: ${sc.cutAction || `Phân cảnh ${idx + 1}`}`,
          sourceUrl: existingSeg?.sourceUrl || primaryVideoUrl,
          startOffset: sOff,
          endOffset: eOff,
          duration: dur,
          narration: sc.narration
        };
      });
      setSegments(updatedSegments);

      // Cập nhật project scenes
      setProject((prev) => ({
        ...prev,
        scenes: synthesizedScenes,
        topic: aiTopic || prev.topic,
        voice: {
          ...prev.voice,
          name: selectedVoice
        }
      }));

      showNotification(`🎉 Thành công! Đã tạo kịch bản & giọng đọc cho đúng ${synthesizedScenes.length} phân cảnh!`);
    } catch (err: any) {
      console.error('AI generation error:', err);
      showNotification(`⚠️ Lưu ý: ${err.message || 'Lỗi khi tạo kịch bản'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 3. Chia lại theo khoảng thời gian mới
  const handleReSplit = (seconds: number) => {
    if (loadedVideos.length === 0) return;
    setSplitInterval(seconds);

    let reSplitSegments: VideoSegment[] = [];
    let startOrder = 1;

    for (const meta of loadedVideos) {
      const segs = splitVideoIntoSegments(meta.url, meta.duration, seconds, startOrder, meta.name);
      reSplitSegments = [...reSplitSegments, ...segs];
      startOrder += segs.length;
    }

    setSegments(reSplitSegments);
    setActiveSegmentIndex(0);

    generateAllSegmentThumbnails(reSplitSegments).then((thumbs) => {
      setThumbnails(thumbs);
    });

    if (masterVideoRef.current && reSplitSegments[0]) {
      masterVideoRef.current.src = reSplitSegments[0].sourceUrl;
      masterVideoRef.current.currentTime = reSplitSegments[0].startOffset;
    }

    showNotification(
      `Đã chia lại ${loadedVideos.length} video thành ${reSplitSegments.length} clip (${seconds}s/clip)`
    );
  };

  // 4. Chuyển sang xem thử phân đoạn clip khác
  const handleSelectSegment = (index: number) => {
    if (index < 0 || index >= segments.length) return;
    setActiveSegmentIndex(index);
    const seg = segments[index];
    const v = masterVideoRef.current;
    if (v && seg) {
      const isDifferentSrc = !v.src.endsWith(seg.sourceUrl) && v.src !== seg.sourceUrl;
      if (isDifferentSrc && seg.sourceUrl) {
        v.src = seg.sourceUrl;
        v.load();
      }
      v.currentTime = seg.startOffset;
      if (scrubberInputRef.current) scrubberInputRef.current.value = String(seg.startOffset);
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = `⏱️ ${formatTimeDisplay(0)} / ${formatTimeDisplay(seg.duration)} (Mốc: ${formatTimeDisplay(seg.startOffset)} - ${formatTimeDisplay(seg.endOffset)})`;
      }
      if (isPlaying) {
        v.play().catch(() => {});
      }
    }
  };

  // 5. Phát / Tạm dừng Master Video Player
  const togglePlayPause = () => {
    const v = masterVideoRef.current;
    if (!v || !activeSegment) return;

    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      const isDifferentSrc = !v.src.endsWith(activeSegment.sourceUrl) && v.src !== activeSegment.sourceUrl;
      if (isDifferentSrc && activeSegment.sourceUrl) {
        v.src = activeSegment.sourceUrl;
        v.load();
      }
      if (v.currentTime >= activeSegment.endOffset || v.currentTime < activeSegment.startOffset) {
        v.currentTime = activeSegment.startOffset;
      }
      v.muted = isMuted;
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // 6. Native Frame Update bằng direct DOM update
  useEffect(() => {
    const v = masterVideoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      if (!activeSegment) return;

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

  // 7. Tua Master Video Player
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

  // 8. Trimmer kéo sang trái / sang phải mốc bắt đầu & kết thúc (Bước 2)
  const handleTrimStartOffset = (index: number, newStart: number) => {
    const seg = segments[index];
    if (!seg) return;
    const clampedStart = Math.max(0, Math.min(seg.endOffset - 0.5, Number(newStart.toFixed(2))));
    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...seg,
      startOffset: clampedStart,
      duration: Number((seg.endOffset - clampedStart).toFixed(2))
    };
    setSegments(updatedSegments);

    if (index === activeSegmentIndex && masterVideoRef.current) {
      masterVideoRef.current.currentTime = clampedStart;
    }
  };

  const handleTrimEndOffset = (index: number, newEnd: number) => {
    const seg = segments[index];
    if (!seg) return;
    const matchedVideo = loadedVideos.find((v) => v.url === seg.sourceUrl);
    const maxVideoDur = matchedVideo ? matchedVideo.duration : 9999;
    const clampedEnd = Math.max(seg.startOffset + 0.5, Math.min(maxVideoDur, Number(newEnd.toFixed(2))));

    const updatedSegments = [...segments];
    updatedSegments[index] = {
      ...seg,
      endOffset: clampedEnd,
      duration: Number((clampedEnd - seg.startOffset).toFixed(2))
    };
    setSegments(updatedSegments);

    if (index === activeSegmentIndex && masterVideoRef.current) {
      masterVideoRef.current.currentTime = clampedEnd;
    }
  };

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

    const updatedTarget = updatedSegments[index];
    if (updatedTarget && index === activeSegmentIndex) {
      const v = masterVideoRef.current;
      const jumpTime = side === 'left' ? updatedTarget.startOffset : updatedTarget.endOffset;
      if (v) v.currentTime = jumpTime;
    }

    showNotification(message);
  };

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

  const handleUpdateNarration = (index: number, text: string) => {
    const copy = [...segments];
    copy[index].narration = text;
    setSegments(copy);
  };

  const handleSelectRatio = (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    setProject((prev) => ({ ...prev, aspectRatio: ratio }));
    showNotification(`Đã chuyển tỉ lệ khung hình sang: ${ratio}`);
  };

  // 10. Chuyển tất cả clip thành Scene trong Remotion Storyboard
  const handleApplyToStoryboard = (mode: 'replace' | 'append' = 'replace') => {
    if (segments.length === 0) {
      alert('Chưa có clip nào được tạo. Vui lòng tải video lên hoặc tạo kịch bản trước.');
      return;
    }

    const newScenes = convertSegmentsToScenes(segments);

    if (mode === 'append') {
      const existingCount = project.scenes.length;
      const renumberedNewScenes = newScenes.map((sc, i) => ({
        ...sc,
        order: existingCount + i + 1,
        id: `scene-split-${Date.now()}-${existingCount + i + 1}`
      }));

      setProject((prev) => ({
        ...prev,
        aspectRatio: selectedRatio,
        voice: {
          ...prev.voice,
          name: selectedVoice,
          rate: selectedVoiceRate,
          pitch: '+0Hz'
        },
        scenes: [...prev.scenes, ...renumberedNewScenes],
        totalDuration: Number((prev.totalDuration + totalDurationSeconds).toFixed(2))
      }));

      alert(
        `🎉 Thành công! Đã NỐI TIẾP thêm ${renumberedNewScenes.length} đoạn video ngắn vào Storyboard!`
      );
    } else {
      setProject((prev) => ({
        ...prev,
        aspectRatio: selectedRatio,
        voice: {
          ...prev.voice,
          name: selectedVoice,
          rate: selectedVoiceRate,
          pitch: '+0Hz'
        },
        scenes: newScenes,
        totalDuration: totalDurationSeconds
      }));

      alert(
        `🎉 Thành công! Đã chuyển ${newScenes.length} phân cảnh (${selectedRatio}) vào Remotion Studio!`
      );
    }

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
                Bước 1 & Bước 2: AI OpenAI Kịch Bản & Cắt Nối Source Video
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  ⚡ 5 Bước Hoàn Chỉnh
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Nhập kịch bản theo mốc giây với OpenAI, tự sinh giọng lồng tiếng và kéo trượt trái/phải video gốc khớp từng phân cảnh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Notification banner */}
        {notification && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ========================================================= */}
          {/* BƯỚC 1: KHU VỰC OPENAI KỊCH BẢN & SINH GIỌNG ĐỌC AI       */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-950 border border-rose-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-pink-400" /> Bước 1: OpenAI Kịch Bản & Giọng Đọc Theo Mốc Giây
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Nhập chủ đề hoặc danh sách mốc giây bạn muốn chia, OpenAI sẽ tự động tạo lời dẫn và sinh giọng đọc AI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiSectionOpen(!isAiSectionOpen)}
                className="text-xs text-rose-300 hover:text-rose-200 font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                {isAiSectionOpen ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </button>
            </div>

            {isAiSectionOpen && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Ô nhập API Key DeepSeek / Groq / Gemini / OpenAI */}
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-yellow-400" /> API Key (DeepSeek / Groq / OpenAI):
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">✨ Tự động lưu & Bảo mật</span>
                    </label>
                    <input
                      type="text"
                      value={openaiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOpenaiKey(val);
                        localStorage.setItem('DEEPSEEK_API_KEY', val.trim());
                        localStorage.setItem('OPENAI_API_KEY', val.trim());
                        localStorage.setItem('GROQ_API_KEY', val.trim());
                        localStorage.setItem('GEMINI_API_KEY', val.trim());
                      }}
                      placeholder="sk-... (DeepSeek / OpenAI) hoặc gsk_... (Groq)"
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Chọn giọng lồng tiếng & Tốc độ */}
                  <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-cyan-400" /> Giọng Lồng Tiếng AI:
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="google-vi-male">🎙️ Giọng Nam Tiếng Việt AI (Nam Trầm Ấm - 100% Free)</option>
                      <option value="google-vi">🌸 Giọng Nữ Tiếng Việt AI (Google Neural - 100% Free)</option>
                      <option value="elevenlabs:pNInz6obpgDQGcFmaJgB">👑 Adam AI (ElevenLabs - Nam Trầm Chuẩn TikTok)</option>
                      <option value="vclip:adam">🎙️ Adam VClip AI (vclip.io)</option>
                      <option value="en-US-GuyNeural">Guy (English US - Male)</option>
                      <option value="en-US-JennyNeural">Jenny (English US - Female)</option>
                    </select>
                  </div>

                  <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <FastForward className="w-3 h-3 text-amber-400" /> Tốc Độ Đọc (Tua Nhanh):
                    </label>
                    <select
                      value={selectedVoiceRate}
                      onChange={(e) => setSelectedVoiceRate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="-15%">🐢 0.85x - Chậm truyền cảm</option>
                      <option value="+0%">⚡ 1.0x - Chuẩn bình thường</option>
                      <option value="+15%">🚀 1.15x - Nhanh vừa TikTok</option>
                      <option value="+25%">🔥 1.25x - Nhanh triệu view</option>
                      <option value="+35%">⏩ 1.35x - Tóm tắt recap siêu tốc</option>
                      <option value="+50%">⚡⚡ 1.5x - Cực nhanh</option>
                      <option value="+75%">💨 1.75x - Siêu tốc</option>
                      <option value="+100%">🏁 2.0x - Tối đa 2x</option>
                    </select>
                  </div>

                  {/* Chủ đề video & Số lượng phân cảnh */}
                  <div className="md:col-span-8 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        <span>🎯 Chủ đề / Tên Video:</span>
                        <span className="text-[10px] text-pink-400 font-normal">(Nhập bất kỳ chủ đề thể thao, review, vlog, du lịch...)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          🧠 DeepSeek AI Engine
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAiSuggestTimestamps(aiSceneCount)}
                          disabled={isSuggestingTimestamps || !aiTopic.trim()}
                          className="text-[11px] font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 px-3 py-1 rounded-lg border border-pink-400/40 shadow-md shadow-pink-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isSuggestingTimestamps ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-white" />
                              <span>AI Đang Phân Tích...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                              <span>AI Gợi Ý Mốc & Phân Cảnh Chuẩn</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Ví dụ: Đánh giao lưu đơn và đôi tại sân trường sĩ quan chính trị..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  {/* Số lượng phân cảnh muốn tạo */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>🔢 Số Phân Cảnh (Clips):</span>
                      <span className="text-[10px] text-cyan-400 font-semibold">{aiSceneCount} cảnh</span>
                    </label>
                    <select
                      value={aiSceneCount}
                      onChange={(e) => setAiSceneCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value={2}>2 Phân cảnh (~25s)</option>
                      <option value={3}>3 Phân cảnh (~40s)</option>
                      <option value={4}>4 Phân cảnh (~55s)</option>
                      <option value={5}>5 Phân cảnh (~70s)</option>
                      <option value={6}>6 Phân cảnh (~85s)</option>
                      <option value={8}>8 Phân cảnh (~115s)</option>
                      <option value={10}>10 Phân cảnh (~145s)</option>
                    </select>
                  </div>

                  {/* BẢNG GỢI Ý MỐC THỜI GIAN VÀ PHÂN CẢNH TỪ AI (NẾU CÓ) */}
                  {suggestedStructure.length > 0 && (
                    <div className="md:col-span-12 space-y-2 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-950 border border-indigo-500/40 rounded-xl p-3.5 animate-in fade-in-50">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            Bảng Gợi Ý Mốc Thời Gian & Kịch Bản AI Cho: <span className="text-pink-300 font-semibold">"{aiTopic}"</span>
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                          {suggestedStructure.length} Phân Cảnh Chuẩn
                        </span>
                      </div>

                      <div className="overflow-x-auto max-h-56 overflow-y-auto pr-1">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-indigo-500/30 text-indigo-300 bg-indigo-950/40">
                              <th className="py-1.5 px-2 font-bold w-28">⏱️ Thời gian</th>
                              <th className="py-1.5 px-2 font-bold w-40">🎬 Phân cảnh</th>
                              <th className="py-1.5 px-2 font-bold">📹 Nội dung hình ảnh & Góc máy</th>
                              <th className="py-1.5 px-2 font-bold">🗣️ Lời bình / Âm thanh gợi ý</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 text-slate-200">
                            {suggestedStructure.map((row) => (
                              <tr key={row.order} className="hover:bg-indigo-950/30 transition-colors">
                                <td className="py-2 px-2 font-mono font-bold text-pink-400 whitespace-nowrap">
                                  {row.timeRange}
                                </td>
                                <td className="py-2 px-2 font-bold text-indigo-200">
                                  {row.title}
                                </td>
                                <td className="py-2 px-2 text-slate-300 leading-relaxed">
                                  {row.visualDescription}
                                </td>
                                <td className="py-2 px-2 text-slate-200 leading-relaxed italic">
                                  "{row.narration}"
                                  {row.audioNote && (
                                    <div className="text-[10px] text-cyan-400 font-sans not-italic mt-0.5">
                                      🎵 {row.audioNote}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Ô ĐIỀN CÁC SOURCE VIDEO ĐANG CÓ */}
                  <div className="md:col-span-12 space-y-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-pink-400" />
                      <span>📹 Danh Sách Các Source Video / Cảnh Quay Bạn Đang Có (Tùy chọn):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={aiAvailableSources}
                      onChange={(e) => setAiAvailableSources(e.target.value)}
                      placeholder="Điền các source / cảnh quay bạn đang có (mỗi dòng 1 cảnh), ví dụ:&#10;1. Cổng Trường Sĩ quan Chính trị, toàn cảnh sân thể thao&#10;2. Cận cảnh cơ sở vật chất sân bãi, khởi động thử vợt&#10;3. Trận đơn: các pha điều cầu smash dọc dây&#10;4. Trận đôi: đập thủ liên tục, phản xạ lưới&#10;5. Điểm quyết định & slow-motion pha kết thúc&#10;6. Bắt tay giao lưu hữu nghị và chụp ảnh"
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans leading-relaxed"
                    />
                  </div>

                  {/* Ô nhập nhanh các mốc giây bắt đầu phân cảnh mới */}
                  <div className="md:col-span-12 p-3 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-cyan-950/30 border border-purple-500/40 rounded-xl space-y-2.5 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">⚡</span>
                        <label className="text-[11px] font-bold text-purple-200 flex items-center gap-1">
                          Nhập Nhanh Danh Sách Giây Bắt Đầu Phân Cảnh Mới (Cắt Chuẩn Từng Giây):
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-medium">Thử mẫu:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickSplitChange('5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s')}
                          className="px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 transition-all font-mono font-semibold"
                        >
                          5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSplitChange('3.5s, 7.0s, 10.5s, 14.0s, 18.0s')}
                          className="px-2 py-0.5 rounded bg-cyan-900/50 hover:bg-cyan-800/80 border border-cyan-500/40 text-cyan-200 transition-all font-mono font-semibold"
                        >
                          3.5s, 7s, 10.5s, 14s, 18s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickSplitChange('')}
                          className="text-slate-400 hover:text-rose-400 px-1"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={quickSplitInput}
                        onChange={(e) => handleQuickSplitChange(e.target.value)}
                        placeholder="VD: 5.4s, 6.2s, 7.3s, 8.4, 10.5s, 11.6s (Cảnh 2 bắt đầu tại 5.4s, Cảnh 3 tại 6.2s...)"
                        className="w-full px-3 py-2 text-xs bg-slate-950/90 border border-purple-500/50 rounded-lg text-yellow-300 font-mono placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-sm"
                      />
                    </div>

                    {/* Danh sách chip preview trực quan các phân cảnh được chia từ mốc giây */}
                    {parsedSplitRanges.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span className="text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            <span>AI Tự Động Chia Thành:</span>
                            <b className="text-white bg-purple-600/50 border border-purple-400/40 px-2 py-0.5 rounded text-[11px] font-bold">
                              {parsedSplitRanges.length} Phân Cảnh Chuẩn
                            </b>
                          </span>
                          <span>
                            Tổng thời lượng video: <b className="text-cyan-300 font-mono font-bold text-[11px]">{parsedSplitRanges[parsedSplitRanges.length - 1]?.end}s</b>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                          {parsedSplitRanges.map((r, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border font-mono shadow-sm transition-all hover:scale-105 ${
                                i === 0
                                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                                  : i === parsedSplitRanges.length - 1
                                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                                  : 'bg-slate-950/80 border-slate-700/80 text-slate-200'
                              }`}
                            >
                              <span className="font-bold text-white">🎬 Cảnh {r.order}:</span>
                              <span className="text-cyan-300 font-bold">{r.start}s</span>
                              <span className="text-slate-400">➔</span>
                              <span className="text-emerald-300 font-bold">{r.end}s</span>
                              <span className="text-slate-400 text-[9px] font-sans">({r.duration}s)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ô chi tiết mốc thời gian kèm mô tả phân cảnh */}
                  <div className="md:col-span-12 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        ⏱️ Chi Tiết Mốc Thời Gian & Tên Từng Phân Đoạn (Tự đồng bộ):
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAiSuggestTimestamps(aiSceneCount)}
                          disabled={isSuggestingTimestamps}
                          className="text-[10px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          AI Gợi Ý Lại Mốc
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoGenerateTimestamps(aiSceneCount)}
                          className="text-[10px] text-cyan-400 hover:underline font-medium"
                        >
                          ⚡ Reset mốc đều ({aiSceneCount} cảnh)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiCustomTimestamps('');
                            setQuickSplitInput('');
                            setParsedSplitRanges([]);
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-400"
                        >
                          Xóa trắng
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={aiCustomTimestamps}
                      onChange={(e) => handleCustomTimestampsChange(e.target.value)}
                      placeholder="0:00 - 0:10: Check-in & Khí thế mở đầu&#10;0:10 - 0:25: Không gian sân & Khởi động tác phong&#10;0:25 - 0:40: Trận đơn: Tốc độ & Kỹ thuật&#10;0:40 - 0:55: Trận đôi: Phối hợp & Bọc lót..."
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateOpenAiScript}
                    disabled={isGeneratingAi}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Đang Tạo Kịch Bản & Giọng Đọc AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        ✨ Tự Động Gen Kịch Bản & Giọng Đọc AI ({aiSceneCount} Phân Cảnh)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách phân cảnh AI đã sinh kịch bản & giọng đọc ngay sau Bước 1 */}
            {segments.length > 0 && (
              <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      🎉 Kịch Bản & Giọng Đọc Đã Tạo ({segments.length} phân cảnh)
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono">
                    ⏱️ Tổng thời lượng: {formatTimeDisplay(totalDurationSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-pink-400 font-semibold">{seg.title}</span>
                        <span className="text-cyan-400 font-mono">
                          {formatTimeDisplay(seg.startOffset)} - {formatTimeDisplay(seg.endOffset)} ({seg.duration}s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                        {seg.narration || 'Chưa có lời dẫn'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* BƯỚC 2: NẠP & KÉO CẮT SOURCE VIDEO CHO TỪNG PHÂN ĐOẠN    */}
          {/* ========================================================= */}
          {loadedVideos.length === 0 ? (
            <div className="space-y-4 my-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-orange-400" /> Bước 2: Nạp Source Video Cho Từng Phân Đoạn
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tải lên file video của bạn để bắt đầu kéo trượt chọn đoạn khớp kịch bản.
                  </p>
                </div>
              </div>

              {/* Tab Selector: Upload vs Drive */}
              <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setInputSourceTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    inputSourceTab === 'upload'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Tải từ máy tính</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputSourceTab('drive')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    inputSourceTab === 'drive'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Quét từ Google Drive</span>
                </button>
              </div>

              {inputSourceTab === 'drive' ? (
                <GoogleDriveFolderPicker
                  onVideoSelected={(file) => loadVideoFiles([file], 'replace')}
                  isProcessing={isProcessing}
                />
              ) : (
                <div
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group my-2"
                >
                  <input
                    ref={replaceFileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'replace')}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-rose-600/20 border border-slate-700 group-hover:border-rose-500 flex items-center justify-center text-slate-400 group-hover:text-rose-400 transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Nhấn để tải lên video từ máy tính
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Hỗ trợ file video dài MP4/MOV/WebM. Hệ thống giữ nguyên độ nét 100% 60 FPS.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Drawer Quét thêm từ Google Drive */}
              {isDriveAppendOpen && (
                <div className="relative bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4" /> Nạp thêm video từ Google Drive:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDriveAppendOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <GoogleDriveFolderPicker
                    onVideoSelected={async (file) => {
                      await loadVideoFiles([file], 'append');
                      setIsDriveAppendOpen(false);
                    }}
                    isProcessing={isProcessing}
                  />
                </div>
              )}

              {/* Thanh Thông Tin Video Đã Nạp */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          Đã nạp {loadedVideos.length} Video ({segments.length} Clips con)
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          Tổng {formatTimeDisplay(totalDurationSeconds)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>• Dung lượng: {totalVideoSizeMb} MB</span>
                        <span>• Tỉ lệ: <strong className="text-cyan-300">{selectedRatio}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Chọn Tỉ Lệ Khung Hình & Nạp Thêm */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tỉ Lệ */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => handleSelectRatio('9:16')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          selectedRatio === '9:16'
                            ? 'bg-rose-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3 h-3 inline mr-1" /> 9:16
                      </button>
                      <button
                        onClick={() => handleSelectRatio('16:9')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          selectedRatio === '16:9'
                            ? 'bg-cyan-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Tv className="w-3 h-3 inline mr-1" /> 16:9
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

                    {/* Chia nhanh */}
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

                    {/* Nạp Thêm */}
                    <button
                      onClick={() => appendFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> + Từ máy
                    </button>
                    <input
                      ref={appendFileInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'append')}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setIsDriveAppendOpen(!isDriveAppendOpen)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md transition-all flex items-center gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5" /> + Từ Drive
                    </button>

                    <button
                      onClick={() => replaceFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Đổi mới
                    </button>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'replace')}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* BỐ CỤC 2 CỘT: PLAYER TRUNG TÂM & DANH SÁCH CLIPS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* CỘT TRÁI: MASTER PLAYER */}
                <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 sticky top-0 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-rose-400" />
                      MASTER PLAYER (60 FPS)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 font-bold">
                      Clip #{activeSegment?.order || 1} / {segments.length}
                    </span>
                  </div>

                  <div
                    className={`relative rounded-xl overflow-hidden bg-black border border-slate-800 mx-auto w-full flex items-center justify-center select-none shadow-2xl ${
                      selectedRatio === '9:16'
                        ? 'aspect-[9/16] max-h-[400px]'
                        : selectedRatio === '1:1'
                        ? 'aspect-square max-h-[350px]'
                        : 'aspect-video'
                    }`}
                  >
                    <video
                      ref={masterVideoRef}
                      src={activeSegment?.sourceUrl || loadedVideos[0]?.url}
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

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-105 border border-white/20 shadow-2xl z-10"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      )}
                    </button>

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
                    >
                      🔁 Lặp lại
                    </button>
                  </div>

                  {/* Thanh Scrubber */}
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

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSeek(activeSegment?.startOffset || 0)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStep(-1)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                        >
                          -1s
                        </button>
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            isPlaying
                              ? 'bg-rose-600 text-white shadow-lg'
                              : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300'
                          }`}
                        >
                          {isPlaying ? 'Tạm Dừng' : 'Phát Clip'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStep(1)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                        >
                          +1s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSeek(activeSegment?.endOffset || 0)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
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

                {/* CỘT PHẢI: DANH SÁCH CLIPS & BỘ KÉO TRÁI/PHẢI */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rose-400" />
                      Bước 2: Cắt Trái / Phải Khớp Kịch Bản ({segments.length} Clips):
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {segments.map((seg, idx) => {
                      const isCurrent = idx === activeSegmentIndex;
                      const thumb = thumbnails[seg.id] || seg.thumbnail;
                      const matchedVideo = loadedVideos.find((v) => v.url === seg.sourceUrl);
                      const maxVideoDuration = matchedVideo ? matchedVideo.duration : 100;

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
                          {/* Header Phân đoạn */}
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
                              <div>
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                  {seg.title}
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30">
                                      Đang Chiếu
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                                {formatTimeDisplay(seg.startOffset)} - {formatTimeDisplay(seg.endOffset)} ({seg.duration}s)
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSegment(seg.id);
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Kéo Trái / Phải Trực Tiếp Trên File Video Đã Đẩy Lên */}
                          <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-850" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                              <span className="flex items-center gap-1 text-amber-400">
                                👈 Kéo Mốc Bắt Đầu (Trái): {formatTimeDisplay(seg.startOffset)}
                              </span>
                              <span className="flex items-center gap-1 text-rose-400">
                                👉 Kéo Mốc Kết Thúc (Phải): {formatTimeDisplay(seg.endOffset)}
                              </span>
                            </div>

                            {/* Dual Scrubber Controls */}
                            <div className="space-y-1.5">
                              {/* Thanh kéo Mốc Bắt Đầu (Trái) */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-300 w-12 shrink-0 font-mono">Bắt đầu:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max={Math.max(0, seg.endOffset - 0.5)}
                                  step="0.1"
                                  value={seg.startOffset}
                                  onChange={(e) => handleTrimStartOffset(idx, parseFloat(e.target.value))}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                                  title="Kéo sang trái/phải để dời mốc bắt đầu của clip"
                                />
                                <span className="text-[10px] text-slate-400 font-mono w-14 text-right">
                                  {seg.startOffset.toFixed(1)}s
                                </span>
                              </div>

                              {/* Thanh kéo Mốc Kết Thúc (Phải) */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-rose-300 w-12 shrink-0 font-mono">Kết thúc:</span>
                                <input
                                  type="range"
                                  min={seg.startOffset + 0.5}
                                  max={maxVideoDuration}
                                  step="0.1"
                                  value={seg.endOffset}
                                  onChange={(e) => handleTrimEndOffset(idx, parseFloat(e.target.value))}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-rose-400"
                                  title="Kéo sang trái/phải để dời mốc kết thúc của clip"
                                />
                                <span className="text-[10px] text-slate-400 font-mono w-14 text-right">
                                  {seg.endOffset.toFixed(1)}s
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Kịch bản lời dẫn phân cảnh */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={seg.narration || ''}
                              onChange={(e) => handleUpdateNarration(idx, e.target.value)}
                              placeholder={`Lời dẫn kịch bản phân cảnh #${seg.order}...`}
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
                💡 Đã có <strong>{segments.length} phân cảnh</strong> ({selectedRatio}).
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={() => handleApplyToStoryboard('replace')}
              disabled={segments.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-900/40 disabled:opacity-50 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Đưa Vào Storyboard Video Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
