import React, { useState, useRef } from 'react';
import { VideoProject, Scene, TransitionType, KenBurnsEffect, VIETNAMESE_VOICES } from '../types/video';
import { synthesizeEdgeTTS } from '../services/edgeTtsService';
import { getSavedElevenLabsApiKey, getEquivalentFallbackVoice } from '../services/elevenLabsService';
import { searchPexelsMedia, searchWebMedia, generateAiImageUrl, searchStockVideos, MediaAsset } from '../services/mediaService';
import { transcribeCustomAudio, transcribeAndSplitFullAudio, syncWordsFromNarration, extractAudioBase64, extractAudioFromVideoData } from '../services/speechToTextService';
import { BatchVocabularyModal } from './BatchVocabularyModal';
import { CreateCustomVisualModal } from './CreateCustomVisualModal';
import { MotionTypographyModal } from './MotionTypographyModal';
import { TikTokStudioModal } from './TikTokStudioModal';
import { SceneVideoTrimmerModal } from './SceneVideoTrimmerModal';
import { visualStylesService, CustomVisualItem } from '../services/visualStylesService';
import { SOUND_EFFECTS_LIST, playSoundEffectById } from '../services/soundEffectsService';
import { TIKTOK_VIDEO_EFFECTS } from '../remotion/tiktok/tiktokEffects';
import { TIKTOK_FILTERS } from '../remotion/tiktok/tiktokFilters';
import { getTikTokStickerById } from '../remotion/tiktok/tiktokStickers';
import { SparkleBadge, WorkflowMode } from './SparkleBadge';
import {
  Film,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  MoveRight,
  Sliders,
  FolderOpen,
  Check,
  X,
  Edit3,
  RotateCcw,
  Eye,
  Camera,
  Play,
  Pause,
  Upload,
  Mic,
  Mic2,
  Square,
  CheckCircle2,
  Activity,
  Music,
  FastForward,
  ListPlus,
  Scissors
} from 'lucide-react';

interface StoryboardTimelineProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  apiKeyGemini?: string;
  apiKeyPexels?: string;
  onOpenBatchVocab?: () => void;
  onOpenVideoSplitter?: () => void;
  onOpenSettings?: () => void;
  workflowMode?: WorkflowMode;
}

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80';

// Các chủ đề video ngắn B-Roll thịnh hành
const POPULAR_VIDEO_TOPICS = [
  { label: '🌌 Vũ trụ / Galaxy', query: 'galaxy nebula space deep cosmos' },
  { label: '🍳 Ẩm thực / Món ăn', query: 'cooking delicious food kitchen pan' },
  { label: '💻 Công nghệ & AI', query: 'technology coding artificial intelligence' },
  { label: '💰 Tiền & Tài chính', query: 'money finance business growth' },
  { label: '✈️ Du lịch / Máy bay', query: 'airplane flight clouds travel adventure' },
  { label: '🏎️ Cao tốc / Xe hơi', query: 'night highway car driving neon' },
  { label: '🌆 Thành phố / Đô thị', query: 'modern city skyline urban traffic' },
  { label: '🌿 Thiên nhiên / Thư giãn', query: 'calm nature forest river sunset' },
  { label: '🏃 Thể thao / Gym', query: 'fitness workout running athlete' },
];

// Trích xuất từ khóa gợi ý thông minh từ kịch bản phân cảnh
function getScriptSuggestions(scene?: Scene | null): string[] {
  if (!scene) return ['galaxy space', 'công nghệ', 'ẩm thực', 'tài chính', 'du lịch'];
  const list: string[] = [];
  if (scene.searchKeyword && scene.searchKeyword.trim()) {
    list.push(scene.searchKeyword.trim());
  }

  const text = (scene.narration || '').toLowerCase();
  if (/vũ trụ|thiên hà|ngân hà|không gian|sao|hành tinh|tiểu hành tinh|black hole/i.test(text)) {
    list.push('galaxy nebula space');
    list.push('vũ trụ thiên hà');
  } else if (/bún|cá|phở|món|ẩm thực|nấu|chiên|xào|nướng|nhà hàng|thực khách|hương vị|tô|bát/i.test(text)) {
    list.push('cooking delicious food');
    list.push('ẩm thực món ngon');
  } else if (/tiền|tài chính|chứng khoán|cổ phiếu|lợi nhuận|doanh thu|ngân hàng|giàu|đầu tư/i.test(text)) {
    list.push('money finance business');
    list.push('tài chính đầu tư');
  } else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|robot/i.test(text)) {
    list.push('technology futuristic coding');
    list.push('công nghệ trí tuệ nhân tạo');
  } else if (/máy bay|chuyến bay|sân bay|cất cánh/i.test(text)) {
    list.push('airplane flight takeoff');
  } else if (/đua xe|cao tốc|lái xe|đèn neon|đường phố|xe hơi/i.test(text)) {
    list.push('night highway driving');
  } else if (/du lịch|biển|núi|khám phá|bình minh|hoàng hôn/i.test(text)) {
    list.push('travel landscape sunset');
  } else if (/thành phố|đô thị|tòa nhà/i.test(text)) {
    list.push('city skyline urban');
  }

  // Tách 2-3 từ ngắn từ câu thoại
  const words = (scene.narration || '')
    .replace(/[^\p{L}\d\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(hôm|nay|chúng|tôi|bạn|các|những|một|cho|về|với|tại|trong|khi|được|sẽ|đã|đang|là|thì|mà|rất|quá|lại)$/i.test(w));
  if (words.length >= 2) {
    list.push(words.slice(0, 3).join(' '));
  }

  return Array.from(new Set(list)).filter(Boolean).slice(0, 5);
}

export const StoryboardTimeline: React.FC<StoryboardTimelineProps> = ({
  project,
  setProject,
  apiKeyGemini,
  apiKeyPexels,
  onOpenBatchVocab,
  onOpenVideoSplitter,
  onOpenSettings,
  workflowMode = 'fast'
}) => {
  const [activeMediaModalSceneId, setActiveMediaModalSceneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaAsset[]>([]);
  const [isSearchingMedia, setIsSearchingMedia] = useState(false);
  const [mediaPage, setMediaPage] = useState<number>(1);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const [isSynthesizingSceneId, setIsSynthesizingSceneId] = useState<string | null>(null);
  const [isBatchSynthesizing, setIsBatchSynthesizing] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');
  const [playingAudioSceneId, setPlayingAudioSceneId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // States for Voiceover Speech-To-Text (Nhận diện lời thoại & chạy chữ từ audio của tôi)
  const [isTranscribingSceneId, setIsTranscribingSceneId] = useState<string | null>(null);
  const [transcribeStatusText, setTranscribeStatusText] = useState<string>('');
  const [isTranscribingFullAudio, setIsTranscribingFullAudio] = useState(false);
  const [fullAudioStatusText, setFullAudioStatusText] = useState('');
  const [isAutoFixingDefaultMedia, setIsAutoFixingDefaultMedia] = useState(false);
  const [visualStylesList, setVisualStylesList] = useState<CustomVisualItem[]>(() => visualStylesService.getAll());
  const [isCreateVisualModalOpen, setIsCreateVisualModalOpen] = useState(false);
  const [activeMotionTypographyScene, setActiveMotionTypographyScene] = useState<Scene | null>(null);
  const [activeTikTokStudioScene, setActiveTikTokStudioScene] = useState<Scene | null>(null);
  const [trimmerScene, setTrimmerScene] = useState<Scene | null>(null);
  const [isTrimmerOpen, setIsTrimmerOpen] = useState<boolean>(false);
  const [expandedFxSceneId, setExpandedFxSceneId] = useState<string | null>(null);
  const [expandedKaraokeSceneId, setExpandedKaraokeSceneId] = useState<string | null>(null);
  const [ttsToastError, setTtsToastError] = useState<string | null>(null);

  // States for Live Microphone Recording (Ghi âm trực tiếp từ Mic)
  const [recordingSceneId, setRecordingSceneId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const liveTranscribedTextRef = useRef<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetAudioUploadSceneId, setTargetAudioUploadSceneId] = useState<string | null>(null);
  const fullAudioInputRef = useRef<HTMLInputElement | null>(null);

  const transitionAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [targetTransitionAudioSceneId, setTargetTransitionAudioSceneId] = useState<string | null>(null);

  // Thêm file input ref cho tải ảnh/video từ máy tính (hỗ trợ cả Web Browser lẫn Electron)
  const localMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [targetLocalMediaSceneId, setTargetLocalMediaSceneId] = useState<string | null>(null);

  // Khi Remotion Player bắt đầu phát -> Tự động dừng âm thanh nghe thử ở ngoài để không bị vọng hoặc lặp tiếng
  React.useEffect(() => {
    const handleStopExternalAudio = () => {
      if (audioElement) {
        audioElement.pause();
        setPlayingAudioSceneId(null);
      }
    };
    window.addEventListener('remotion-play-started', handleStopExternalAudio);
    return () => window.removeEventListener('remotion-play-started', handleStopExternalAudio);
  }, [audioElement]);

  const handleSelectTransitionAudio = async (sceneId: string) => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file âm thanh chuyển cảnh (Whoosh, Boom, Ding, Pop...)',
          filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const fileName = filePath.split('\\').pop() || 'transition-sfx.mp3';
          updateScene(sceneId, {
            transitionAudioUrl: `file://${filePath.replace(/\\/g, '/')}`,
            transitionAudioName: fileName
          });
        }
      } catch (err) {
        console.error('Transition audio select error', err);
      }
    } else {
      setTargetTransitionAudioSceneId(sceneId);
      transitionAudioInputRef.current?.click();
    }
  };

  const handleBrowserTransitionAudioFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && targetTransitionAudioSceneId) {
      const url = URL.createObjectURL(file);
      updateScene(targetTransitionAudioSceneId, {
        transitionAudioUrl: url,
        transitionAudioName: file.name
      });
    }
    e.target.value = '';
  };

  // Update scene field
  const updateScene = (id: string, updates: Partial<Scene>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s))
    }));
  };

  // State for inline word editing
  const [editingWord, setEditingWord] = useState<{
    sceneId: string;
    wordIdx: number;
    word: string;
    start: number;
    end: number;
  } | null>(null);

  // Khi người dùng sửa câu thoại trong ô Textarea -> Tự động đồng bộ lại nhịp từ words
  const handleNarrationChange = (scene: Scene, newText: string) => {
    const duration = scene.audioDuration || 4.0;
    const syncedWords = syncWordsFromNarration(newText, duration, scene.words);
    updateScene(scene.id, {
      narration: newText,
      words: syncedWords
    });
  };

  // Cập nhật 1 từ đơn lẻ trong chip từ
  const handleSaveWordEdit = (sceneId: string, wordIdx: number, newWord: string, newStart: number, newEnd: number) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene || !scene.words) return;

    const updatedWords = [...scene.words];
    updatedWords[wordIdx] = {
      word: newWord.trim(),
      start: Number(Number(newStart).toFixed(2)),
      end: Number(Number(newEnd).toFixed(2))
    };

    const reconstructedNarration = updatedWords.map((w) => w.word).join(' ');
    updateScene(sceneId, {
      narration: reconstructedNarration,
      words: updatedWords
    });
    setEditingWord(null);
  };

  // Xóa 1 từ khỏi danh sách words
  const handleDeleteWord = (sceneId: string, wordIdx: number) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene || !scene.words) return;

    const updatedWords = scene.words.filter((_, idx) => idx !== wordIdx);
    const reconstructedNarration = updatedWords.map((w) => w.word).join(' ');
    updateScene(sceneId, {
      narration: reconstructedNarration,
      words: updatedWords
    });
    setEditingWord(null);
  };

  // 1-Click căn lại toàn bộ mốc nhịp từ theo câu thoại hiện tại
  const handleRealignWords = (scene: Scene) => {
    const duration = scene.audioDuration || 4.0;
    const syncedWords = syncWordsFromNarration(scene.narration, duration);
    updateScene(scene.id, {
      words: syncedWords
    });
  };

  // Nút chuyên dụng 1-Click: AI Audio to Text (Nghe âm thanh & tự động tạo chữ chạy video)
  const handleAutoAudioToText = async (scene: Scene) => {
    if (!scene.audioUrl) {
      alert('Phân cảnh này chưa có âm thanh. Vui lòng bấm "Ghi âm" hoặc "Đẩy sound" trước!');
      return;
    }

    let activeGeminiKey = (apiKeyGemini || localStorage.getItem('GEMINI_API_KEY') || '').trim();
    if (!activeGeminiKey) {
      const inputKey = prompt(
        '✨ Tính năng AI Audio-to-Text (Chuyển giọng nói thành chữ như Google Dịch & ChatGPT):\n\nVui lòng dán Google Gemini API Key của bạn vào đây (Lấy miễn phí tại https://aistudio.google.com/app/apikey):'
      );
      if (inputKey && inputKey.trim()) {
        activeGeminiKey = inputKey.trim();
        localStorage.setItem('GEMINI_API_KEY', activeGeminiKey);
      } else {
        return;
      }
    }

    setIsTranscribingSceneId(scene.id);
    setTranscribeStatusText('AI đang nghe âm thanh & tự động bóc tách chữ chạy video...');

    try {
      const audioInfo = await extractAudioBase64(scene.audioUrl);
      if (!audioInfo.base64) {
        throw new Error('Không thể đọc dữ liệu âm thanh từ phân cảnh này.');
      }

      let transcribedData: any = null;

      // 1. Thử qua Electron Main Process IPC
      if (window.electronAPI?.transcribeAudio) {
        const ipcRes = await window.electronAPI.transcribeAudio({
          audioBase64: audioInfo.base64,
          mimeType: audioInfo.mimeType || 'audio/mp3',
          apiKey: activeGeminiKey
        });

        if (ipcRes?.error) {
          throw new Error(ipcRes.error);
        }

        if (ipcRes?.narration) {
          transcribedData = ipcRes;
        }
      }

      // 2. Fallback qua transcribeCustomAudio trong Renderer
      if (!transcribedData) {
        const res = await transcribeCustomAudio({
          audioDataUrl: audioInfo.dataUrl || scene.audioUrl,
          audioBase64: audioInfo.base64,
          mimeType: audioInfo.mimeType || 'audio/mp3',
          apiKeyGemini: activeGeminiKey,
          existingNarration: scene.narration
        });

        if (res && res.narration) {
          transcribedData = res;
        }
      }

      if (transcribedData && transcribedData.narration) {
        const finalDuration = transcribedData.audioDuration || scene.audioDuration || 4.0;
        let finalWords = transcribedData.words;
        if (!finalWords || finalWords.length === 0) {
          finalWords = syncWordsFromNarration(transcribedData.narration, finalDuration);
        }

        updateScene(scene.id, {
          narration: transcribedData.narration,
          audioDuration: finalDuration,
          words: finalWords
        });
      } else {
        throw new Error('AI không nhận diện được lời nói trong file âm thanh này.');
      }

      setIsTranscribingSceneId(null);
      setTranscribeStatusText('');
    } catch (err: any) {
      console.error('Auto Audio to text error:', err);
      const errMsg = err?.response?.data?.error?.message || err?.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc API key Gemini.';
      alert('Lỗi nhận diện âm thanh AI:\n' + errMsg);
      setIsTranscribingSceneId(null);
      setTranscribeStatusText('');
    }
  };

  // 1-Click Generate Voice for a Single Scene
  const handleGenerateSceneTTS = async (scene: Scene) => {
    if (!scene.narration.trim()) return;

    // Tạm dừng nghe thử nếu đang phát âm thanh cũ của cảnh này
    if (playingAudioSceneId === scene.id) {
      audioElement?.pause();
      setPlayingAudioSceneId(null);
    }

    setIsSynthesizingSceneId(scene.id);
    try {
      const targetVoice = project.voice?.name || 'google-vi';
      const res = await synthesizeEdgeTTS(
        scene.narration,
        targetVoice,
        project.voice?.rate,
        project.voice?.pitch
      );

      if (res.audioUrl) {
        const isVideo = scene.mediaType === 'video';
        const startOff = scene.videoStartOffset || 0;
        updateScene(scene.id, {
          audioUrl: res.audioUrl,
          audioDuration: res.duration,
          words: res.words,
          videoMuted: isVideo ? true : scene.videoMuted,
          videoEndOffset: isVideo ? startOff + res.duration : scene.videoEndOffset
        });
      }
    } catch (e) {
      console.error('Failed to synthesize scene TTS', e);
      setTtsToastError('Không thể kết nối máy chủ giọng đọc, vui lòng thử lại');
      setTimeout(() => setTtsToastError(null), 5000);
    } finally {
      setIsSynthesizingSceneId(null);
    }
  };

  // 1-Click Batch Synthesize All Scenes
  const handleBatchSynthesizeAll = async () => {
    if (project.scenes.length === 0 || isBatchSynthesizing) return;

    // Dừng âm thanh đang nghe thử để không bị phát tiếng cũ
    if (audioElement) {
      audioElement.pause();
      setPlayingAudioSceneId(null);
    }

    setIsBatchSynthesizing(true);
    const targetVoiceId = project.voice?.name || 'google-vi';
    const voiceObj = VIETNAMESE_VOICES.find((v) => v.id === targetVoiceId);
    const voiceDisplayName = voiceObj?.name ? voiceObj.name.replace(/^[⚡🎙️🌸🔥📖🎬🍰🛍️💅✨🤖👑💎🚀🌿🏄🏰\s]+/, '') : targetVoiceId;

    const elevenKey = getSavedElevenLabsApiKey().trim();
    const isElevenVoice = targetVoiceId.startsWith('elevenlabs:');
    let hasFallbackUsed = false;

    setBatchProgressText(`Bắt đầu ghép giọng: ${voiceDisplayName}...`);

    const updatedScenes = [...project.scenes];
    let totalDuration = 0;

    for (let i = 0; i < updatedScenes.length; i++) {
      const scene = updatedScenes[i];
      setBatchProgressText(`Đang ghép giọng [${voiceDisplayName}] cảnh ${i + 1}/${updatedScenes.length}...`);

      if (scene.narration && scene.narration.trim()) {
        try {
          const res = await synthesizeEdgeTTS(
            scene.narration,
            targetVoiceId,
            project.voice?.rate,
            project.voice?.pitch
          );

          if (res.audioUrl) {
            if (res.isFallback) {
              hasFallbackUsed = true;
            }
            const isVideo = scene.mediaType === 'video';
            const startOff = scene.videoStartOffset || 0;
            const sceneAudioUpdated = {
              ...scene,
              audioUrl: res.audioUrl,
              audioDuration: res.duration,
              words: res.words,
              // Tự động tắt tiếng video gốc khi ghép giọng AI để giọng đọc rõ ràng không bị đè tiếng ồn
              videoMuted: isVideo ? true : scene.videoMuted,
              videoEndOffset: isVideo ? startOff + res.duration : scene.videoEndOffset
            };
            updatedScenes[i] = sceneAudioUpdated;
            totalDuration += res.duration;

            // Cập nhật ngay tức thì từng phân cảnh vào project state
            setProject((prev) => {
              const nextScenes = [...prev.scenes];
              nextScenes[i] = sceneAudioUpdated;
              return {
                ...prev,
                scenes: nextScenes
              };
            });
          } else {
            totalDuration += (scene.audioDuration || 4.0);
          }
        } catch (err) {
          console.warn('Batch TTS error on scene', i, err);
          totalDuration += (scene.audioDuration || 4.0);
          setTtsToastError('Không thể kết nối máy chủ giọng đọc, vui lòng thử lại');
          setTimeout(() => setTtsToastError(null), 5000);
        }
      } else {
        totalDuration += (scene.audioDuration || 4.0);
      }
    }

    setProject((prev) => ({
      ...prev,
      scenes: updatedScenes,
      totalDuration: totalDuration > 0 ? Number(totalDuration.toFixed(2)) : prev.totalDuration
    }));

    setBatchProgressText(`✅ Đã ghép xong toàn bộ ${updatedScenes.length} cảnh bằng giọng: ${voiceDisplayName}!`);

    setTimeout(() => {
      setIsBatchSynthesizing(false);
      setBatchProgressText('');
    }, 3500);
  };

  // Play / Pause scene audio preview
  const togglePlaySceneAudio = async (scene: Scene) => {
    if (playingAudioSceneId === scene.id) {
      audioElement?.pause();
      setPlayingAudioSceneId(null);
      return;
    }

    audioElement?.pause();

    let targetAudioUrl = scene.audioUrl;
    if (!targetAudioUrl) {
      setIsSynthesizingSceneId(scene.id);
      try {
        const res = await synthesizeEdgeTTS(
          scene.narration,
          project.voice?.name || 'google-vi',
          project.voice?.rate,
          project.voice?.pitch
        );
        if (res.audioUrl) {
          targetAudioUrl = res.audioUrl;
          const isVideo = scene.mediaType === 'video';
          const startOff = scene.videoStartOffset || 0;
          updateScene(scene.id, {
            audioUrl: res.audioUrl,
            audioDuration: res.duration,
            words: res.words,
            videoMuted: isVideo ? true : scene.videoMuted,
            videoEndOffset: isVideo ? startOff + res.duration : scene.videoEndOffset
          });
        }
      } catch (e) {
        console.error('Failed to auto-synthesize scene audio', e);
        setTtsToastError('Không thể kết nối máy chủ giọng đọc, vui lòng thử lại');
        setTimeout(() => setTtsToastError(null), 5000);
      } finally {
        setIsSynthesizingSceneId(null);
      }
    }

    if (targetAudioUrl) {
      try {
        const audio = new Audio(targetAudioUrl);
        audio.onended = () => setPlayingAudioSceneId(null);
        audio.onerror = (e) => {
          console.warn('Audio playback error', e);
          setPlayingAudioSceneId(null);
        };
        await audio.play();
        setAudioElement(audio);
        setPlayingAudioSceneId(scene.id);
      } catch (playErr) {
        console.warn('Audio play error:', playErr);
        setPlayingAudioSceneId(null);
      }
    }
  };

  // Xóa toàn bộ nhãn CLIP và câu thoại mặc định trên toàn bộ phân cảnh
  const handleClearAllDefaultBadgesAndSubtitles = () => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => ({
        ...s,
        headerBadge: undefined,
        narration: '',
        words: []
      }))
    }));
  };

  // Tự động dọn dẹp mọi nhãn CLIP mặc định hoặc câu thoại mẫu khi mở dự án
  React.useEffect(() => {
    setProject((prev) => {
      let changed = false;
      const cleanedScenes = prev.scenes.map((s) => {
        const isClipBadge = s.headerBadge && (s.headerBadge.toUpperCase().includes('CLIP') || s.headerBadge.startsWith('📍'));
        const isDefaultNarration = s.narration && (s.narration.startsWith('Phân đoạn ') || /^\(?\d+s\)?$/i.test(s.narration.trim()));
        if (isClipBadge || isDefaultNarration) {
          changed = true;
          return {
            ...s,
            headerBadge: isClipBadge ? undefined : s.headerBadge,
            narration: isDefaultNarration ? '' : s.narration,
            words: isDefaultNarration ? [] : s.words
          };
        }
        return s;
      });
      if (changed) {
        return { ...prev, scenes: cleanedScenes };
      }
      return prev;
    });
  }, []);

  // Live Microphone Recording for a scene with Auto Speech-To-Text
  const startRecordingSceneAudio = async (sceneId: string) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      liveTranscribedTextRef.current = '';

      // Khởi động Web SpeechRecognition nếu trình duyệt hỗ trợ
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'vi-VN';
          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript.trim()) {
              liveTranscribedTextRef.current = transcript.trim();
            }
          };
          recognition.onerror = () => {};
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (recInitErr) {
          console.warn('Live SpeechRecognition not supported or blocked:', recInitErr);
        }
      }

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch (e) {}
          speechRecognitionRef.current = null;
        }

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size === 0) {
          setRecordingSceneId(null);
          setRecordingSeconds(0);
          return;
        }

        setRecordingSceneId(null);
        setRecordingSeconds(0);
        setIsTranscribingSceneId(sceneId);
        setTranscribeStatusText('Đang nhận diện giọng nói & tạo phụ đề karaoke chạy vào video...');

        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
            const activeGeminiKey = apiKeyGemini || localStorage.getItem('GEMINI_API_KEY') || undefined;
            const scene = project.scenes.find((s) => s.id === sceneId);
            const liveRecognizedText = liveTranscribedTextRef.current.trim();

            const result = await transcribeCustomAudio({
              audioDataUrl: dataUrl,
              audioBase64: base64,
              mimeType: recorder.mimeType || 'audio/webm',
              apiKeyGemini: activeGeminiKey,
              existingNarration: liveRecognizedText || scene?.narration
            });

            updateScene(sceneId, {
              audioUrl: dataUrl,
              audioDuration: result.audioDuration,
              narration: result.narration || liveRecognizedText || scene?.narration || '',
              words: result.words
            });

            setIsTranscribingSceneId(null);
            setTranscribeStatusText('');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(100);
      setRecordingSceneId(sceneId);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      alert('Không thể mở micro: ' + (err.message || 'Vui lòng kiểm tra kết nối micro trên máy tính.'));
      setRecordingSceneId(null);
      setRecordingSeconds(0);
    }
  };

  const stopRecordingSceneAudio = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Custom Audio/Video Upload & AI Speech-To-Text for a single scene
  const handleTriggerCustomAudioUpload = async (sceneId: string) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file sound hoặc video MP4/MOV để tách lấy âm thanh',
          filters: [
            { name: 'Sound & Video Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'mov', 'webm', 'mkv'] },
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg'] },
            { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const isVideoFile = /\.(mp4|mov|webm|mkv)$/i.test(filePath);
          setIsTranscribingSceneId(sceneId);
          setTranscribeStatusText(isVideoFile ? 'Đang nhận diện video MP4 & tự động tách lấy âm thanh (Sound)...' : 'Đang đọc và phân tích file âm thanh...');

          let base64Info = null;
          if (window.electronAPI?.readAudioBase64) {
            base64Info = await window.electronAPI.readAudioBase64(filePath);
          }

          let effectiveDataUrl = base64Info?.dataUrl || `file://${filePath.replace(/\\/g, '/')}`;
          let effectiveBase64 = base64Info?.base64;
          let effectiveMime = base64Info?.mimeType || (isVideoFile ? 'video/mp4' : 'audio/mp3');

          // Nếu là video MP4/MOV, dùng Web Audio API để tách triệt để âm thanh thành WAV Data URL
          if (isVideoFile && base64Info?.dataUrl) {
            setTranscribeStatusText('Đang giải mã và trích xuất sound track từ video MP4...');
            const extracted = await extractAudioFromVideoData(base64Info.dataUrl);
            if (extracted) {
              effectiveDataUrl = extracted.dataUrl;
              effectiveBase64 = extracted.base64;
              effectiveMime = extracted.mimeType;
            }
          }

          setTranscribeStatusText('Đang nhận diện giọng nói (Audio to text) & căn chỉnh nhịp chữ...');

          const activeGeminiKey = apiKeyGemini || localStorage.getItem('GEMINI_API_KEY') || undefined;
          const result = await transcribeCustomAudio({
            audioDataUrl: effectiveDataUrl,
            audioBase64: effectiveBase64,
            mimeType: effectiveMime,
            apiKeyGemini: activeGeminiKey,
            existingNarration: scene.narration
          });

          const fps = project.fps || 30;

          updateScene(sceneId, {
            audioUrl: effectiveDataUrl,
            audioDuration: result.audioDuration,
            narration: result.narration || scene.narration,
            words: result.words
          });

          setIsTranscribingSceneId(null);
          setTranscribeStatusText('');
        }
      } catch (err: any) {
        console.error('File select / STT error', err);
        setIsTranscribingSceneId(null);
        setTranscribeStatusText('');
      }
    } else {
      // Browser fallback via file input
      setTargetAudioUploadSceneId(sceneId);
      fileInputRef.current?.click();
    }
  };

  const handleBrowserAudioFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAudioUploadSceneId) return;

    const sceneId = targetAudioUploadSceneId;
    const scene = project.scenes.find((s) => s.id === sceneId);
    const isVideoFile = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name);
    setIsTranscribingSceneId(sceneId);
    setTranscribeStatusText(isVideoFile ? 'Đang nhận diện video & trích xuất sound...' : 'Đang đọc file âm thanh...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          let dataUrl = rawDataUrl;
          let base64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : '';
          let mimeType = file.type || 'audio/mp3';

          if (isVideoFile) {
            setTranscribeStatusText('Đang giải mã và tách lấy sound từ video MP4...');
            const extracted = await extractAudioFromVideoData(rawDataUrl);
            if (extracted) {
              dataUrl = extracted.dataUrl;
              base64 = extracted.base64;
              mimeType = extracted.mimeType;
            }
          }

          setTranscribeStatusText('Đang nhận diện giọng nói (Audio to text) & khớp chữ...');
          const activeGeminiKey = apiKeyGemini || localStorage.getItem('GEMINI_API_KEY') || undefined;

          const result = await transcribeCustomAudio({
            audioDataUrl: dataUrl,
            audioBase64: base64,
            mimeType,
            apiKeyGemini: activeGeminiKey,
            existingNarration: scene?.narration
          });

          updateScene(sceneId, {
            audioUrl: dataUrl,
            audioDuration: result.audioDuration,
            narration: result.narration || scene?.narration || '',
            words: result.words
          });

          setIsTranscribingSceneId(null);
          setTargetAudioUploadSceneId(null);
          setTranscribeStatusText('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Browser audio STT error:', err);
      setIsTranscribingSceneId(null);
      setTargetAudioUploadSceneId(null);
      setTranscribeStatusText('');
    }
    e.target.value = '';
  };

  // Upload Full Audio Voiceover & Split/Transcribe All Scenes
  const handleFullAudioVoiceoverUpload = async () => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file thu âm hoặc video MP4 toàn bộ bài để tách lấy âm thanh',
          filters: [
            { name: 'Sound & Video Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'mov', 'webm', 'mkv'] },
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg'] },
            { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv'] }
          ]
        });

        if (files && files.length > 0) {
          const filePath = files[0];
          const isVideoFile = /\.(mp4|mov|webm|mkv)$/i.test(filePath);
          setIsTranscribingFullAudio(true);
          setFullAudioStatusText(isVideoFile ? 'Đang nhận diện video MP4 & tự động trích xuất sound...' : 'Đang đọc file âm thanh toàn bài...');

          let base64Info = null;
          if (window.electronAPI?.readAudioBase64) {
            base64Info = await window.electronAPI.readAudioBase64(filePath);
          }

          let effectiveDataUrl = base64Info?.dataUrl || `file://${filePath.replace(/\\/g, '/')}`;
          let effectiveBase64 = base64Info?.base64;
          let effectiveMime = base64Info?.mimeType || (isVideoFile ? 'video/mp4' : 'audio/mp3');

          // Nếu là video MP4/MOV, tách lấy track âm thanh
          if (isVideoFile && base64Info?.dataUrl) {
            setFullAudioStatusText('Đang giải mã và bóc tách sound track từ video MP4...');
            const extracted = await extractAudioFromVideoData(base64Info.dataUrl);
            if (extracted) {
              effectiveDataUrl = extracted.dataUrl;
              effectiveBase64 = extracted.base64;
              effectiveMime = extracted.mimeType;
            }
          }

          const activeGeminiKey = apiKeyGemini || localStorage.getItem('GEMINI_API_KEY');

          if (activeGeminiKey && effectiveBase64) {
            setFullAudioStatusText('AI đang nghe toàn bộ audio, tự chia cảnh & bóc tách lời thoại...');
            const splitScenes = await transcribeAndSplitFullAudio(
              effectiveBase64,
              effectiveMime,
              activeGeminiKey
            );

            if (splitScenes && splitScenes.length > 0) {
              const newScenes: Scene[] = splitScenes.map((sc, idx) => ({
                id: `scene-stt-${idx}-${Date.now()}`,
                order: idx + 1,
                narration: sc.narration,
                audioUrl: effectiveDataUrl,
                audioDuration: sc.audioDuration,
                searchKeyword: sc.searchKeyword || sc.narration.slice(0, 30),
                mediaType: 'image',
                mediaUrl: generateAiImageUrl(sc.searchKeyword || sc.narration, project.aspectRatio),
                transition: 'fade',
                kenBurns: 'zoom_in',
                words: sc.words
              }));

              setProject((prev) => ({
                ...prev,
                scenes: newScenes
              }));

              setIsTranscribingFullAudio(false);
              setFullAudioStatusText('');
              return;
            }
          }

          // Fallback: gán audio vào scene hiện tại
          if (project.scenes.length > 0) {
            setFullAudioStatusText('Đang nhận diện lời thoại phân cảnh đầu...');
            const firstScene = project.scenes[0];
            const result = await transcribeCustomAudio({
              audioDataUrl: effectiveDataUrl,
              audioBase64: effectiveBase64,
              mimeType: effectiveMime,
              apiKeyGemini: activeGeminiKey || undefined,
              existingNarration: firstScene.narration
            });

            updateScene(firstScene.id, {
              audioUrl: effectiveDataUrl,
              audioDuration: result.audioDuration,
              narration: result.narration || firstScene.narration,
              words: result.words
            });
          }

          setIsTranscribingFullAudio(false);
          setFullAudioStatusText('');
        }
      } catch (err) {
        console.error('Full audio upload error:', err);
        setIsTranscribingFullAudio(false);
        setFullAudioStatusText('');
      }
    } else {
      fullAudioInputRef.current?.click();
    }
  };

  const handleBrowserFullAudioFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideoFile = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name);
    setIsTranscribingFullAudio(true);
    setFullAudioStatusText(isVideoFile ? 'Đang nhận diện video MP4 & tự động tách lấy sound...' : 'Đang đọc file âm thanh toàn bài...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          let dataUrl = rawDataUrl;
          let base64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : '';
          let mimeType = file.type || 'audio/mp3';

          if (isVideoFile) {
            setFullAudioStatusText('Đang giải mã và trích xuất sound track từ video MP4...');
            const extracted = await extractAudioFromVideoData(rawDataUrl);
            if (extracted) {
              dataUrl = extracted.dataUrl;
              base64 = extracted.base64;
              mimeType = extracted.mimeType;
            }
          }

          const activeGeminiKey = apiKeyGemini || localStorage.getItem('GEMINI_API_KEY');

          if (activeGeminiKey && base64) {
            setFullAudioStatusText('AI đang nghe toàn bộ audio, tự chia cảnh & bóc tách lời thoại...');
            const splitScenes = await transcribeAndSplitFullAudio(base64, mimeType, activeGeminiKey);
            if (splitScenes && splitScenes.length > 0) {
              const newScenes: Scene[] = splitScenes.map((sc, idx) => ({
                id: `scene-stt-${idx}-${Date.now()}`,
                order: idx + 1,
                narration: sc.narration,
                audioUrl: dataUrl,
                audioDuration: sc.audioDuration,
                searchKeyword: sc.searchKeyword || sc.narration.slice(0, 30),
                mediaType: 'image',
                mediaUrl: generateAiImageUrl(sc.searchKeyword || sc.narration, project.aspectRatio),
                transition: 'fade',
                kenBurns: 'zoom_in',
                words: sc.words
              }));

              setProject((prev) => ({
                ...prev,
                scenes: newScenes
              }));

              setIsTranscribingFullAudio(false);
              setFullAudioStatusText('');
              return;
            }
          }

          if (project.scenes.length > 0) {
            const firstScene = project.scenes[0];
            const result = await transcribeCustomAudio({
              audioDataUrl: dataUrl,
              audioBase64: base64,
              mimeType: file.type || 'audio/mp3',
              apiKeyGemini: activeGeminiKey || undefined,
              existingNarration: firstScene.narration
            });

            updateScene(firstScene.id, {
              audioUrl: dataUrl,
              audioDuration: result.audioDuration,
              narration: result.narration || firstScene.narration,
              words: result.words
            });
          }

          setIsTranscribingFullAudio(false);
          setFullAudioStatusText('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Browser full audio error:', err);
      setIsTranscribingFullAudio(false);
      setFullAudioStatusText('');
    }
    e.target.value = '';
  };

  const [searchSource, setSearchSource] = useState<'video' | 'web' | 'pexels' | 'ai'>('video');
  const [directImageUrlInput, setDirectImageUrlInput] = useState('');

  // Open Media Search Modal for Scene
  const openMediaSearch = (scene: Scene, defaultSource?: 'video' | 'web' | 'pexels' | 'ai') => {
    setActiveMediaModalSceneId(scene.id);
    const initialQuery = scene.searchKeyword || scene.narration.slice(0, 35).trim();
    setSearchQuery(initialQuery);
    const sourceToUse = defaultSource || (scene.mediaType === 'video' ? 'video' : 'video');
    setSearchSource(sourceToUse);
    setMediaPage(1);
    handleSearchMedia(initialQuery, sourceToUse, 1);
  };

  const handleSearchMedia = async (
    query: string,
    source: 'video' | 'web' | 'pexels' | 'ai' = searchSource,
    page: number = 1
  ) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setIsSearchingMedia(true);
    setMediaPage(page);
    try {
      if (source === 'ai') {
        const aiUrl = generateAiImageUrl(cleanQuery, project.aspectRatio);
        setSearchResults([
          {
            id: `ai-img-${Date.now()}`,
            type: 'image',
            url: aiUrl,
            thumbnail: aiUrl,
            source: 'ai',
            title: `Ảnh AI: ${cleanQuery}`
          }
        ]);
      } else if (source === 'video') {
        // Search short videos from Coverr / Electron / Pexels with pagination page
        let videoResults = await searchStockVideos(cleanQuery, page);
        if (videoResults.length === 0 && apiKeyPexels) {
          videoResults = await searchPexelsMedia(cleanQuery, project.aspectRatio, apiKeyPexels, 'video');
        }
        setSearchResults(videoResults);
      } else if (source === 'pexels' && apiKeyPexels) {
        const results = await searchPexelsMedia(cleanQuery, project.aspectRatio, apiKeyPexels, 'all');
        setSearchResults(results);
      } else {
        // Default Google/Web image search (exact results for Vietnamese & English terms)
        const results = await searchWebMedia(cleanQuery, project.aspectRatio);
        setSearchResults(results);
      }
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearchingMedia(false);
    }
  };

  const handleNextBatch = () => {
    const nextPage = mediaPage + 1;
    setMediaPage(nextPage);
    handleSearchMedia(searchQuery, searchSource, nextPage);
  };

  const handlePrevBatch = () => {
    const prevPage = Math.max(1, mediaPage - 1);
    setMediaPage(prevPage);
    handleSearchMedia(searchQuery, searchSource, prevPage);
  };

  const selectMediaForScene = (asset: MediaAsset) => {
    if (!activeMediaModalSceneId) return;
    const targetSc = project.scenes.find((s) => s.id === activeMediaModalSceneId);
    const dur = targetSc?.audioDuration || 4.0;
    updateScene(activeMediaModalSceneId, {
      mediaUrl: asset.url,
      localMediaPath: undefined,
      mediaType: asset.type,
      searchKeyword: searchQuery,
      videoStartOffset: asset.type === 'video' ? 0 : undefined,
      videoEndOffset: asset.type === 'video' ? dur : undefined
    });
    setActiveMediaModalSceneId(null);
  };

  const generateAiImageForScene = (scene: Scene) => {
    const prompt = scene.imagePrompt || scene.searchKeyword || scene.narration;
    const url = generateAiImageUrl(prompt, project.aspectRatio);
    updateScene(scene.id, {
      mediaUrl: url,
      localMediaPath: undefined,
      mediaType: 'image'
    });
  };

  // Add new scene
  // Tự động tìm / vẽ lại ảnh AI cho tất cả cảnh đang dùng ảnh mặc định photo-1451187580459-43490279c0fa hoặc chưa có ảnh
  const handleAutoFixDefaultMedia = async () => {
    setIsAutoFixingDefaultMedia(true);
    try {
      const updatedScenes = await Promise.all(
        project.scenes.map(async (sc) => {
          const isDefault = !sc.mediaUrl || sc.mediaUrl.includes('photo-1451187580459-43490279c0fa');
          if (isDefault) {
            const kw = sc.searchKeyword || sc.narration.slice(0, 40);
            try {
              const webRes = await searchWebMedia(kw, project.aspectRatio);
              if (webRes && webRes.length > 0 && webRes[0].url) {
                return {
                  ...sc,
                  mediaUrl: webRes[0].url,
                  localMediaPath: undefined,
                  mediaType: webRes[0].type || 'image'
                };
              }
            } catch {}
            return {
              ...sc,
              mediaUrl: generateAiImageUrl(kw, project.aspectRatio),
              localMediaPath: undefined,
              mediaType: 'image' as const
            };
          }
          return sc;
        })
      );

      setProject((prev) => ({
        ...prev,
        scenes: updatedScenes
      }));
    } finally {
      setIsAutoFixingDefaultMedia(false);
    }
  };


  const handleAddScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Khám phá những điều tuyệt vời tiếp theo trong hành trình này...';

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'abstract galaxy landscape 4k',
      mediaType: 'image',
      mediaUrl: generateAiImageUrl('cinematic glowing atmospheric space scene 8k', project.aspectRatio),
      audioDuration: 4.5,
      words: [
        { word: 'Khám', start: 0.2, end: 0.5 },
        { word: 'phá', start: 0.5, end: 0.8 },
        { word: 'những', start: 0.8, end: 1.1 },
        { word: 'điều', start: 1.1, end: 1.4 },
        { word: 'tuyệt', start: 1.4, end: 1.7 },
        { word: 'vời...', start: 1.7, end: 2.2 }
      ],
      transition: 'fade',
      kenBurns: 'zoom_in'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS on add scene error', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  // Add Special Viral Motion Graphic Scenes
  const handleAddChatScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Đồ họa trực quan cuốn hút giữ chân người xem từng giây!';

    const newScene: Scene = {
      id: `scene-chat-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'viral chat conversation',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'fade',
      kenBurns: 'none',
      visualType: 'chat_bubble',
      headerBadge: '💬 INBOX MỖI NGÀY',
      chatMessages: [
        { sender: 'left', text: 'Làm video kiểu gì mà đẹp thế ạ? 😍' },
        { sender: 'right', text: 'Đồ họa trực quan quá!' },
        { sender: 'left', text: 'Cuốn hút thật sự luôn 🔥' }
      ]
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on chat scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  const handleAddOrbitScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Khám phá bí quyết ứng dụng trí tuệ nhân tạo đột phá!';

    const newScene: Scene = {
      id: `scene-orbit-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'ai orbit technology',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'zoom_in',
      kenBurns: 'none',
      visualType: 'orbital_glow',
      headerBadge: '🔑 HÔM NAY BẬT MÍ',
      orbitTitle: 'ỨNG DỤNG AI',
      orbitIcon: '🤖'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on orbit scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  const handleAddMathScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Cùng chiêm ngưỡng những hiệu ứng trực quan toán học cực đỉnh!';

    const newScene: Scene = {
      id: `scene-math-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'math visual graph',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'fade',
      kenBurns: 'none',
      visualType: 'math_grid',
      headerBadge: '👀 XEM NGAY ĐÂY'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on math scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  const handleAddRadarScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Phân tích dữ liệu, chỉ số và biểu đồ sóng âm trực quan!';

    const newScene: Scene = {
      id: `scene-radar-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'radar tech data',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'fade',
      kenBurns: 'none',
      visualType: 'radar_tech',
      headerBadge: '📊 PHÂN TÍCH CHỈ SỐ'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on radar scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  const handleAddCarScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Tăng tốc siêu tốc trên xa lộ đêm hướng thẳng về đích!';

    const newScene: Scene = {
      id: `scene-car-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'sports car night highway',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'slide_left',
      kenBurns: 'none',
      visualType: 'night_highway',
      headerBadge: '🏎️ BỨT PHÁ TỐC ĐỘ'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on car scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  const handleAddPlaneScene = async () => {
    const newOrder = project.scenes.length + 1;
    const narrationText = 'Cất cánh vươn cao, vượt qua mọi tầng mây chạm đỉnh thành công!';

    const newScene: Scene = {
      id: `scene-plane-${Date.now()}`,
      order: newOrder,
      narration: narrationText,
      searchKeyword: 'airplane flight clouds',
      mediaType: 'image',
      mediaUrl: '',
      audioDuration: 4.5,
      words: [],
      transition: 'zoom_in',
      kenBurns: 'none',
      visualType: 'airplane_takeoff',
      headerBadge: '✈️ CẤT CÁNH THÀNH CÔNG'
    };

    try {
      const tts = await synthesizeEdgeTTS(
        narrationText,
        project.voice.name || 'google-vi',
        project.voice.rate,
        project.voice.pitch
      );
      if (tts.audioUrl) {
        newScene.audioUrl = tts.audioUrl;
        newScene.audioDuration = tts.duration;
        newScene.words = tts.words;
      }
    } catch (e) {
      console.warn('TTS error on plane scene', e);
    }

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene]
    }));
  };

  // Delete scene
  const handleDeleteScene = (id: string) => {
    if (project.scenes.length <= 1) return;
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 }))
    }));
  };

  // Local File Selector for Media (Hỗ trợ cả Electron Desktop và Trình duyệt Web)
  const handleSelectLocalMedia = async (sceneId: string) => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file ảnh hoặc video từ máy tính',
          filters: [
            { name: 'Media Files', extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'webp'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const isVideo = filePath.endsWith('.mp4') || filePath.endsWith('.mov');
          const targetSc = project.scenes.find((s) => s.id === sceneId);
          const dur = targetSc?.audioDuration || 4.0;
          const fullPath = `file://${filePath.replace(/\\/g, '/')}`;

          updateScene(sceneId, {
            localMediaPath: fullPath,
            mediaUrl: fullPath,
            mediaType: isVideo ? 'video' : 'image',
            videoStartOffset: isVideo ? 0 : undefined,
            videoEndOffset: isVideo ? dur : undefined,
            beautyRetouch: {
              brightenSkin: 15,
              sharpness: 20,
              smoothSkin: 0,
              slimFace: 0,
              longLegs: 0,
              slimBody: 0,
              eyeEnlarge: 0,
            }
          });

          if (isVideo && targetSc) {
            setTrimmerScene({
              ...targetSc,
              mediaUrl: fullPath,
              localMediaPath: fullPath,
              mediaType: 'video',
              videoStartOffset: 0,
              videoEndOffset: dur
            });
            setIsTrimmerOpen(true);
          }
          return;
        }
      } catch (err) {
        console.error('File select error', err);
      }
    }

    // Web Browser Fallback: Mở hộp thoại chọn file trên trình duyệt
    setTargetLocalMediaSceneId(sceneId);
    if (localMediaInputRef.current) {
      localMediaInputRef.current.value = '';
      localMediaInputRef.current.click();
    }
  };

  const handleBrowserLocalMediaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetLocalMediaSceneId) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv)$/i.test(file.name);
    const objectUrl = URL.createObjectURL(file);
    const targetSc = project.scenes.find((s) => s.id === targetLocalMediaSceneId);
    const dur = targetSc?.audioDuration || 4.0;

    updateScene(targetLocalMediaSceneId, {
      mediaUrl: objectUrl,
      localMediaPath: objectUrl,
      mediaType: isVideo ? 'video' : 'image',
      videoStartOffset: isVideo ? 0 : undefined,
      videoEndOffset: isVideo ? dur : undefined,
      beautyRetouch: {
        brightenSkin: 15,
        sharpness: 20,
        smoothSkin: 0,
        slimFace: 0,
        longLegs: 0,
        slimBody: 0,
        eyeEnlarge: 0,
      }
    });

    if (isVideo && targetSc) {
      setTrimmerScene({
        ...targetSc,
        mediaUrl: objectUrl,
        localMediaPath: objectUrl,
        mediaType: 'video',
        videoStartOffset: 0,
        videoEndOffset: dur
      });
      setIsTrimmerOpen(true);
    }

    setTargetLocalMediaSceneId(null);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input for browser media upload from PC */}
      <input
        type="file"
        ref={localMediaInputRef}
        onChange={handleBrowserLocalMediaInput}
        accept="video/*,image/*,.mp4,.mov,.webm,.mkv,.png,.jpg,.jpeg,.webp"
        className="hidden"
      />
      {/* Hidden file input for browser audio/video uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBrowserAudioFileInput}
        accept="audio/*,video/*,.mp4,.mov,.webm,.mkv,.mp3,.wav,.m4a,.aac,.ogg"
        className="hidden"
      />
      {/* Hidden file input for transition audio uploads */}
      <input
        type="file"
        ref={transitionAudioInputRef}
        onChange={handleBrowserTransitionAudioFileInput}
        accept="audio/*"
        className="hidden"
      />
      {/* Hidden file input for full audio voiceover uploads */}
      <input
        type="file"
        ref={fullAudioInputRef}
        onChange={handleBrowserFullAudioFileInput}
        accept="audio/*,video/*,.mp4,.mov,.webm,.mkv,.mp3,.wav,.m4a,.aac,.ogg"
        className="hidden"
      />

      {/* Header bar: Nền trắng tối giản, thanh lịch */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col gap-2.5 shadow-sm">
        {ttsToastError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-in fade-in"
          >
            <span>⚠️</span>
            <span>{ttsToastError}</span>
          </div>
        )}
        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 space-y-2.5">
          {/* Header row: Title & Scene Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-xs">
                <Film className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Danh Sách Phân Cảnh ({project.scenes.length} Scenes)
              </h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {project.scenes.length} cảnh
            </span>
          </div>

          {/* Voice selector & Speed rate row */}
          <div className="flex flex-col gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-700 shrink-0 flex items-center gap-1 min-w-[70px]">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giọng đọc:</span>
              </label>
              <select
                value={project.voice?.name || 'vi-VN-HoaiMyNeural:sweet'}
                onChange={(e) => {
                  const newVoice = e.target.value;
                  setProject((prev) => ({
                    ...prev,
                    voice: {
                      ...prev.voice,
                      name: newVoice
                    }
                  }));
                }}
                className="w-full bg-white hover:bg-emerald-50/40 border border-slate-300 hover:border-emerald-500 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors shadow-2xs truncate"
                title="Chọn giọng đọc AI cho toàn bộ video"
              >
                <optgroup label="🌸 GIỌNG NỮ TIẾNG VIỆT (100% Free - Ngọt Ngào, Truyền Cảm)">
                  {VIETNAMESE_VOICES.filter((v) => v.gender === 'Female' && v.locale.startsWith('vi')).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🎙️ GIỌNG NAM TIẾNG VIỆT (100% Free - Trầm Ấm, Uy Lực)">
                  {VIETNAMESE_VOICES.filter((v) => v.gender === 'Male' && v.locale.startsWith('vi') && !v.id.startsWith('elevenlabs:') && !v.id.startsWith('vclip:')).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="👑 GIỌNG ADAM STUDIO (Cần API Key)">
                  {VIETNAMESE_VOICES.filter((v) => v.id.startsWith('elevenlabs:') || v.id.startsWith('vclip:')).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇺🇸 GIỌNG QUỐC TẾ (Tiếng Anh - 100% Free)">
                  {VIETNAMESE_VOICES.filter((v) => v.locale.startsWith('en')).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Tốc độ đọc (Tua nhanh giọng đọc) */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-700 shrink-0 flex items-center gap-1 min-w-[70px]">
                <FastForward className="w-3.5 h-3.5 text-amber-600" />
                <span>Tốc độ:</span>
              </label>
              <select
                value={project.voice?.rate || '+0%'}
                onChange={(e) => {
                  const newRate = e.target.value;
                  setProject((prev) => ({
                    ...prev,
                    voice: {
                      ...prev.voice,
                      rate: newRate
                    }
                  }));
                }}
                className="w-full bg-white hover:bg-amber-50/40 border border-slate-300 hover:border-amber-500 text-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors shadow-2xs"
                title="Tua nhanh hoặc làm chậm tốc độ đọc"
              >
                <option value="-15%">🐢 0.85x - Chậm truyền cảm, sâu lắng</option>
                <option value="+0%">⚡ 1.0x - Tốc độ chuẩn bình thường</option>
                <option value="+15%">🚀 1.15x - Nhanh vừa, review TikTok cuốn hút</option>
                <option value="+25%">🔥 1.25x - Nhanh triệu view, giật tít kịch tính</option>
                <option value="+35%">⏩ 1.35x - Tóm tắt phim, recap siêu tốc</option>
                <option value="+50%">⚡⚡ 1.5x - Cực nhanh, dồn dập</option>
                <option value="+75%">💨 1.75x - Siêu tốc độ</option>
                <option value="+100%">🏁 2.0x - Tối đa 2x</option>
              </select>
            </div>

            {/* Chú ý khi chọn giọng ElevenLabs mà chưa có API Key */}
            {project.voice?.name?.startsWith('elevenlabs:') && !getSavedElevenLabsApiKey() && (
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 animate-in fade-in">
                <span className="truncate">
                  ⚡ <strong>Chưa có ElevenLabs Key:</strong> Sẽ tạm dùng giọng {getEquivalentFallbackVoice(project.voice.name).voiceName}
                </span>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="shrink-0 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    Nhập Key
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 1-Click Batch Voiceover Action Button - Cực kỳ nổi bật, rộng rãi, không bao giờ bị đè */}
          <button
            onClick={handleBatchSynthesizeAll}
            disabled={isBatchSynthesizing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
            title="Tự động lồng tiếng AI cho toàn bộ phân cảnh trong 1 click"
          >
            {(workflowMode === 'quality' || workflowMode === 'script_voice') && (
              <SparkleBadge step={2} label="Ghép giọng đọc AI toàn bộ" />
            )}
            {isBatchSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span className="font-semibold">{batchProgressText || 'Đang tạo giọng đọc...'}</span>
              </>
            ) : (
              <>
                <Mic2 className="w-4 h-4 text-emerald-200" />
                <span>Ghép Giọng AI Toàn Bộ ({project.scenes.length} Cảnh)</span>
              </>
            )}
          </button>
        </div>

        {/* Toolbar công cụ: Đồng bộ style tối giản tinh gọn */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-200">
          <div>
            {workflowMode === 'split_long_video' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold">
                <SparkleBadge step={2} label="Chỉnh sửa câu thoại/lồng tiếng cho các đoạn đã cắt" />
                <span className="text-[11px]">Các phân cảnh sau khi chia:</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nút xóa nhanh toàn bộ chữ/nhãn mặc định (CLIP / Phụ đề mẫu) */}
            <button
              onClick={handleClearAllDefaultBadgesAndSubtitles}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-medium transition-all active:scale-95 shadow-sm"
              title="Xóa toàn bộ nhãn CLIP và câu thoại mẫu mặc định trên toàn bộ phân cảnh"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Xóa chữ mặc định</span>
            </button>

            {/* Nút tự động đổi ảnh cho các cảnh đang dùng ảnh mặc định */}
            {project.scenes.some((sc) => !sc.mediaUrl || sc.mediaUrl.includes('photo-1451187580459-43490279c0fa')) && (
              <button
                onClick={handleAutoFixDefaultMedia}
                disabled={isAutoFixingDefaultMedia}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium transition-all active:scale-95"
                title="Tự động vẽ/tìm ảnh mới phù hợp với câu thoại cho các cảnh đang dùng ảnh mặc định"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isAutoFixingDefaultMedia
                    ? 'Đang đổi ảnh AI...'
                    : `Đổi ảnh AI (${project.scenes.filter((sc) => !sc.mediaUrl || sc.mediaUrl.includes('photo-1451187580459-43490279c0fa')).length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scene list cards */}
      <div className="space-y-4">
        {project.scenes.map((scene) => {
          const hasAudio = Boolean(scene.audioUrl);
          const isPlaying = playingAudioSceneId === scene.id;
          const isSynthesizing = isSynthesizingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Media Thumbnail & Actions (Col 1-4) */}
                <div className="md:col-span-4 flex flex-col gap-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group/thumb">
                    {scene.visualType === 'chat_bubble' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">💬</span>
                        <span className="text-xs font-bold text-white">CẢNH CHAT INBOX</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">{scene.headerBadge || '💬 INBOX MỖI NGÀY'}</span>
                      </div>
                    ) : scene.visualType === 'orbital_glow' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">🪐</span>
                        <span className="text-xs font-bold text-white">QUỸ ĐẠO PHÁT SÁNG</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">{scene.orbitTitle || 'ỨNG DỤNG AI'}</span>
                      </div>
                    ) : scene.visualType === 'math_grid' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">📈</span>
                        <span className="text-xs font-bold text-white">LƯỚI ĐỒ HỌA VECTOR</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">Parabol • Bàn cờ • Hoa toán</span>
                      </div>
                    ) : scene.visualType === 'radar_tech' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">📊</span>
                        <span className="text-xs font-bold text-white">SÓNG DỮ LIỆU & PHÂN TÍCH</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">{scene.headerBadge || '📊 PHÂN TÍCH CHỈ SỐ'}</span>
                      </div>
                    ) : scene.visualType === 'night_highway' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">🏎️</span>
                        <span className="text-xs font-bold text-white">XE ĐUA CAO TỐC ĐÊM</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">{scene.headerBadge || '🏎️ BỨT PHÁ TỐC ĐỘ'}</span>
                      </div>
                    ) : scene.visualType === 'airplane_takeoff' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-3 text-center border border-slate-700">
                        <span className="text-2xl mb-1">✈️</span>
                        <span className="text-xs font-bold text-white">MÁY BAY CẤT CÁNH</span>
                        <span className="text-[10px] text-slate-300 mt-1 line-clamp-1">{scene.headerBadge || '✈️ CẤT CÁNH THÀNH CÔNG'}</span>
                      </div>
                    ) : scene.mediaUrl ? (
                      scene.mediaType === 'video' ? (
                        <video
                          src={scene.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                        />
                      ) : (
                        <img
                          src={scene.mediaUrl}
                          alt="Scene thumbnail"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_THUMBNAIL;
                          }}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Chưa có Media
                      </div>
                    )}

                    {/* Badges Top Left */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                        Cảnh {scene.order}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-700/90 backdrop-blur-md text-[10px] font-semibold text-white uppercase">
                        {scene.visualType && scene.visualType !== 'media' ? scene.visualType.replace('_', ' ') : scene.mediaType}
                      </span>
                    </div>

                    {/* Quick Trim Button Top Right on Video Thumbnail */}
                    {scene.mediaType === 'video' && scene.mediaUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrimmerScene(scene);
                          setIsTrimmerOpen(true);
                        }}
                        className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white backdrop-blur-md text-[10px] font-bold border border-emerald-400/40 shadow-sm flex items-center gap-1 active:scale-90 transition-all cursor-pointer"
                        title="Kéo cắt chọn đúng đoạn giây cần lấy trong video gốc"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Cắt đoạn</span>
                      </button>
                    )}

                    {/* Speaker Icon in Bottom Left Corner (Biểu tượng loa ở góc dưới bên trái) */}
                    {scene.mediaType === 'video' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isMuted = scene.videoMuted === true;
                          updateScene(scene.id, {
                            videoMuted: !isMuted,
                            videoVolume: !isMuted ? 0 : 1.0
                          });
                        }}
                        className={`absolute bottom-2 left-2 z-10 p-1.5 rounded-lg backdrop-blur-md transition-all border shadow-sm cursor-pointer active:scale-90 ${
                          scene.videoMuted
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/50'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/40'
                        }`}
                        title={scene.videoMuted ? 'Đang TẮT tiếng video gốc. Nhấp để BẬT lại tiếng.' : 'Đang GIỮ tiếng video gốc. Nhấp để TẮT tiếng.'}
                      >
                        {scene.videoMuted ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    {/* Duration Badge Bottom Right */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[11px] font-mono text-emerald-300 border border-white/10">
                      ⏱ {scene.audioDuration?.toFixed(1) || '4.0'}s
                    </div>
                  </div>

                  {/* Quick Media Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openMediaSearch(scene, 'video')}
                      className="relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all shadow-sm group/vbtn"
                      title="Tìm và chọn video ngắn phù hợp chủ đề kịch bản cảnh này"
                    >
                      {workflowMode === 'quality' && (
                        <SparkleBadge step={3} label="Chọn Video/Ảnh phân cảnh" />
                      )}
                      <Play className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700 group-hover/vbtn:scale-110 transition-transform" />
                      <span>Video</span>
                    </button>

                    <button
                      onClick={() => handleSelectLocalMedia(scene.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-sm"
                      title="Chọn video hoặc ảnh từ máy tính"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>Từ PC</span>
                    </button>
                  </div>

                  {/* Video Trimmer Quick Bar (Kéo cắt đoạn video source đúng số giây kịch bản) */}
                  {scene.mediaType === 'video' && scene.mediaUrl && (
                    <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                          <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kéo cắt video source:</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                          {(scene.videoStartOffset || 0).toFixed(1)}s ➔ {((scene.videoStartOffset || 0) + (scene.audioDuration || 4.0)).toFixed(1)}s
                        </span>
                      </div>

                      {/* Range Scrubber Slider */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">Bắt đầu:</span>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(60, (scene.videoStartOffset || 0) + 30)}
                          step={0.5}
                          value={scene.videoStartOffset || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateScene(scene.id, {
                              videoStartOffset: val,
                              videoEndOffset: val + (scene.audioDuration || 4.0)
                            });
                          }}
                          className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                          {(scene.videoStartOffset || 0).toFixed(1)}s
                        </span>
                      </div>

                      {/* Fast Nudge & Open Full Trimmer Modal */}
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const newStart = Math.max(0, (scene.videoStartOffset || 0) - 2);
                            updateScene(scene.id, {
                              videoStartOffset: newStart,
                              videoEndOffset: newStart + (scene.audioDuration || 4.0)
                            });
                          }}
                          className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-medium transition-all text-center cursor-pointer"
                          title="Lùi 2 giây"
                        >
                          -2s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newStart = (scene.videoStartOffset || 0) + 2;
                            updateScene(scene.id, {
                              videoStartOffset: newStart,
                              videoEndOffset: newStart + (scene.audioDuration || 4.0)
                            });
                          }}
                          className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-medium transition-all text-center cursor-pointer"
                          title="Tiến 2 giây"
                        >
                          +2s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateScene(scene.id, {
                              videoStartOffset: 0,
                              videoEndOffset: scene.audioDuration || 4.0
                            });
                          }}
                          className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-medium transition-all text-center cursor-pointer"
                          title="Về đầu video (0s)"
                        >
                          0s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTrimmerScene(scene);
                            setIsTrimmerOpen(true);
                          }}
                          className="py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                          title="Mở bảng kéo cắt trực quan & xem trước lặp lại"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>Kéo cắt</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thanh Công Cụ Nâng Cao: Chữ 3D & CapCut FX (Đầy đủ tất cả các tính năng Motion 3D, Layering, 100 Kiểu Chữ & TikTok/CapCut Studio) */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setExpandedFxSceneId(expandedFxSceneId === scene.id ? null : scene.id)}
                      className={`w-full py-1.5 px-2.5 rounded-xl flex items-center justify-between text-[11px] font-semibold transition-all border shadow-sm cursor-pointer ${
                        expandedFxSceneId === scene.id
                          ? 'bg-slate-200 border-slate-300 text-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title="Mở bảng công cụ kỹ xảo: Chữ 3D, Kho kiểu chữ & TikTok CapCut Studio"
                    >
                      <span className="flex items-center gap-1.5">
                        {workflowMode === 'quality' && (
                          <SparkleBadge step={4} label="Kỹ xảo Chữ 3D" />
                        )}
                        {workflowMode === 'tiktok_capcut' && (
                          <SparkleBadge step={2} label="Kỹ xảo CapCut" />
                        )}
                        <span>⚡</span>
                        <span>Chữ 3D & CapCut FX</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {expandedFxSceneId === scene.id ? 'Thu gọn ▲' : 'Tùy chỉnh ▼'}
                      </span>
                    </button>

                    {expandedFxSceneId === scene.id && (
                      <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        {/* 1. Nút Bật / Tắt Video Phông Xanh & Chữ Motion 3D */}
                        <button
                          type="button"
                          onClick={() => {
                            updateScene(scene.id, {
                              isGreenScreenMotion: !scene.isGreenScreenMotion
                            });
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all border shadow-sm cursor-pointer active:scale-95 ${
                            scene.isGreenScreenMotion
                              ? 'bg-emerald-700 border-emerald-800 text-white shadow-sm'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {workflowMode === 'tiktok_capcut' && (
                            <SparkleBadge step={4} label="Chữ Motion 3D" />
                          )}
                          <span>{scene.isGreenScreenMotion ? '✓' : '🟩'}</span>
                          <span>
                            {scene.isGreenScreenMotion
                              ? 'Đang Bật Chữ Motion 3D (Phông Xanh)'
                              : 'Bật Chữ Motion 3D (Phông Xanh)'}
                          </span>
                        </button>

                        {/* 2. Nút Đổi Thứ Tự Lớp Chữ: Nổi Trước / Ẩn Sau / Đan Xen 3D */}
                        <button
                          type="button"
                          onClick={() => {
                            const current = scene.textLayerMode || (scene.isGreenScreenMotion ? 'both_3d' : 'front');
                            const next =
                              current === 'front'
                                ? 'behind'
                                : current === 'behind'
                                ? 'both_3d'
                                : 'front';
                            updateScene(scene.id, { textLayerMode: next });
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all border shadow-sm cursor-pointer active:scale-95 ${
                            scene.textLayerMode === 'behind'
                              ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800'
                              : scene.textLayerMode === 'both_3d'
                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-800'
                          }`}
                          title="Đổi thứ tự hiển thị: Chữ nổi phía trước / Ẩn phía sau / Đan xen 3D (Trước & Sau)"
                        >
                          <span>⚡</span>
                          <span>
                            {scene.textLayerMode === 'behind'
                              ? 'Chữ: Ẩn Phía Sau'
                              : scene.textLayerMode === 'both_3d'
                              ? 'Chữ: Đan Xen 3D (Trước & Sau)'
                              : 'Chữ: Nổi Phía Trước'}
                          </span>
                        </button>

                        {/* 3. Nút Mở Modal 100 Kiểu Sắp Xếp & Hiệu Ứng Chữ Motion */}
                        <button
                          type="button"
                          onClick={() => setActiveMotionTypographyScene(scene)}
                          className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 cursor-pointer active:scale-95 shadow-sm"
                        >
                          {workflowMode === 'tiktok_capcut' && (
                            <SparkleBadge step={3} label="100 Kiểu Xếp Chữ" />
                          )}
                          <span>🔤</span>
                          <span>100 Kiểu Xếp Chữ & Hiệu Ứng FX</span>
                        </button>

                        {/* 4. Nút Áp Dụng Kiểu Chữ Cảnh Này Cho Tất Cả Cảnh */}
                        <button
                          type="button"
                          onClick={() => {
                            project.scenes.forEach((sc) => {
                              updateScene(sc.id, {
                                motionTypographyLayout: scene.motionTypographyLayout,
                                motionTypographyEffect: scene.motionTypographyEffect,
                                textLayerMode: scene.textLayerMode || 'front',
                                tiktokTextEffect: scene.tiktokTextEffect,
                                tiktokTextTemplate: scene.tiktokTextTemplate,
                                textEffectsMix: scene.textEffectsMix
                              });
                            });
                          }}
                          className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer active:scale-95 shadow-sm"
                        >
                          <span>✨</span>
                          <span>Áp Dụng Kiểu Chữ Cho Tất Cả Cảnh</span>
                        </button>

                        {/* 5. Nút Mở TikTok / CapCut Studio */}
                        <button
                          type="button"
                          onClick={() => setActiveTikTokStudioScene(scene)}
                          className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 cursor-pointer active:scale-95 shadow-sm"
                        >
                          {workflowMode === 'tiktok_capcut' && (
                            <SparkleBadge step={2} label="TikTok/CapCut Studio" />
                          )}
                          <span>🎬</span>
                          <span>TikTok / CapCut Studio</span>
                        </button>

                        {/* 6. ĐIỀU CHỈNH VỊ TRÍ X, Y & KÍCH THƯỚC TRỰC TIẾP (Không cần mở tab khác) */}
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                            <span className="flex items-center gap-1">
                              <span>🕹️</span>
                              <span>Vị Trí Chữ & Icon Phân Cảnh (Trục X, Y):</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                updateScene(scene.id, {
                                  elementPositions: {}
                                });
                              }}
                              className="text-[10px] text-slate-500 hover:text-slate-800 underline font-normal"
                              title="Đặt lại vị trí mặc định"
                            >
                              Đặt lại
                            </button>
                          </div>

                          {/* A. Điều chỉnh vị trí Chữ / Mẫu chữ / Phụ đề */}
                          {(() => {
                            const textKey = scene.tiktokTextTemplate
                              ? 'text_template'
                              : scene.tiktokTextEffect || (scene.textEffectsMix && scene.textEffectsMix.length > 0)
                              ? 'text_effect'
                              : 'subtitles';
                            const textPos = scene.elementPositions?.[textKey] || {
                              x: 50,
                              y: scene.tiktokTextTemplate ? 25 : project.subtitleStyle.positionY || 75,
                              scale: 1
                            };

                            const updateTextPos = (partial: Partial<import('../types/video').ElementPosition>) => {
                              const newPos = { ...textPos, ...partial };
                              updateScene(scene.id, {
                                elementPositions: {
                                  ...(scene.elementPositions || {}),
                                  [textKey]: newPos
                                }
                              });
                            };

                            return (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                                <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                                  <span>📝 Chữ chính ({textKey === 'text_template' ? 'Mẫu Chữ' : textKey === 'text_effect' ? 'Chữ FX' : 'Phụ đề'}):</span>
                                  <span className="font-mono text-emerald-700 font-bold">X:{textPos.x}% | Y:{textPos.y}%</span>
                                </div>

                                {/* Điều khiển Trục Y (Lên / Xuống) */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-12 shrink-0">Trục Y:</span>
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ y: Math.max(5, textPos.y - 4) })}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Dịch chữ LÊN TRÊN"
                                  >
                                    ⬆️ Lên
                                  </button>
                                  <input
                                    type="range"
                                    min="5"
                                    max="95"
                                    value={textPos.y}
                                    onChange={(e) => updateTextPos({ y: parseInt(e.target.value) })}
                                    className="flex-1 accent-emerald-700 h-1 bg-slate-200 rounded cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ y: Math.min(95, textPos.y + 4) })}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Dịch chữ XUỐNG DƯỚI"
                                  >
                                    ⬇️ Xuống
                                  </button>
                                </div>

                                {/* Điều khiển Trục X (Trái / Phải) */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-12 shrink-0">Trục X:</span>
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ x: Math.max(5, textPos.x - 4) })}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Dịch chữ SANG TRÁI"
                                  >
                                    ⬅️ Trái
                                  </button>
                                  <input
                                    type="range"
                                    min="5"
                                    max="95"
                                    value={textPos.x}
                                    onChange={(e) => updateTextPos({ x: parseInt(e.target.value) })}
                                    className="flex-1 accent-emerald-700 h-1 bg-slate-200 rounded cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ x: Math.min(95, textPos.x + 4) })}
                                    className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Dịch chữ SANG PHẢI"
                                  >
                                    ➡️ Phải
                                  </button>
                                </div>

                                {/* Điều khiển Trục Xoay (Góc nghiêng Rotate) */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-12 shrink-0">Góc xoay:</span>
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ rotate: Math.max(-180, (textPos.rotate ?? 0) - 5) })}
                                    className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Xoay ngược chiều kim đồng hồ"
                                  >
                                    🔄 -5°
                                  </button>
                                  <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={textPos.rotate ?? 0}
                                    onChange={(e) => updateTextPos({ rotate: parseInt(e.target.value) })}
                                    className="flex-1 accent-emerald-700 h-1 bg-slate-200 rounded cursor-pointer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ rotate: Math.min(180, (textPos.rotate ?? 0) + 5) })}
                                    className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 shadow-2xs active:scale-95"
                                    title="Xoay theo chiều kim đồng hồ"
                                  >
                                    🔄 +5°
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateTextPos({ rotate: 0 })}
                                    className="px-1.5 py-0.5 rounded text-[9.5px] bg-slate-200 hover:bg-slate-300 text-slate-700"
                                    title="Đặt góc xoay thẳng 0 độ"
                                  >
                                    0°
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* B. Điều chỉnh vị trí Huy hiệu Tiêu đề (Header Badge) nếu có */}
                          {scene.headerBadge && (
                            (() => {
                              const badgePos = scene.elementPositions?.['header_badge'] || { x: 50, y: 10, scale: 1 };
                              const updateBadgePos = (partial: Partial<import('../types/video').ElementPosition>) => {
                                updateScene(scene.id, {
                                  elementPositions: {
                                    ...(scene.elementPositions || {}),
                                    header_badge: { ...badgePos, ...partial }
                                  }
                                });
                              };

                              return (
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                                  <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                                    <span>🏷️ Tiêu đề ({scene.headerBadge}):</span>
                                    <span className="font-mono text-cyan-700 font-bold">X:{badgePos.x}% | Y:{badgePos.y}%</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-500 w-12 shrink-0">Trục Y:</span>
                                    <button
                                      type="button"
                                      onClick={() => updateBadgePos({ y: Math.max(2, badgePos.y - 3) })}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700"
                                    >
                                      ⬆️
                                    </button>
                                    <input
                                      type="range"
                                      min="2"
                                      max="80"
                                      value={badgePos.y}
                                      onChange={(e) => updateBadgePos({ y: parseInt(e.target.value) })}
                                      className="flex-1 accent-cyan-600 h-1 bg-slate-200 rounded cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateBadgePos({ y: Math.min(80, badgePos.y + 3) })}
                                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700"
                                    >
                                      ⬇️
                                    </button>
                                  </div>
                                </div>
                              );
                            })()
                          )}

                          {/* C. Điều chỉnh vị trí từng Sticker / Icon */}
                          {scene.tiktokStickers && scene.tiktokStickers.length > 0 && (
                            <div className="space-y-1.5">
                              {scene.tiktokStickers.map((stkId, i) => {
                                const stk = getTikTokStickerById(stkId);
                                const stkKey = `stk_${stkId}`;
                                const defaultPositions = [
                                  { x: 80, y: 18 },
                                  { x: 20, y: 82 },
                                  { x: 20, y: 35 },
                                  { x: 80, y: 78 }
                                ];
                                const def = defaultPositions[i % defaultPositions.length];
                                const currentPos = scene.elementPositions?.[stkKey] || scene.elementPositions?.[stkId] || { ...def, scale: 1 };

                                const updateStkPos = (partial: Partial<import('../types/video').ElementPosition>) => {
                                  updateScene(scene.id, {
                                    elementPositions: {
                                      ...(scene.elementPositions || {}),
                                      [stkKey]: { ...currentPos, ...partial }
                                    }
                                  });
                                };

                                return (
                                  <div key={stkId} className="p-2 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                                    <div className="flex justify-between items-center text-[10.5px] font-bold text-amber-900">
                                      <span className="flex items-center gap-1">
                                        <span>🎭</span>
                                        <span>{stk ? stk.name : `Sticker ${stkId}`}</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateScene(scene.id, {
                                            tiktokStickers: scene.tiktokStickers?.filter((id) => id !== stkId)
                                          });
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                        title="Xóa icon này"
                                      >
                                        ✕ Xóa
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 w-12 shrink-0">Trục Y:</span>
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ y: Math.max(5, currentPos.y - 4) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        ⬆️
                                      </button>
                                      <input
                                        type="range"
                                        min="5"
                                        max="95"
                                        value={currentPos.y}
                                        onChange={(e) => updateStkPos({ y: parseInt(e.target.value) })}
                                        className="flex-1 accent-amber-600 h-1 bg-amber-200 rounded cursor-pointer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ y: Math.min(95, currentPos.y + 4) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        ⬇️
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 w-12 shrink-0">Trục X:</span>
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ x: Math.max(5, currentPos.x - 4) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        ⬅️
                                      </button>
                                      <input
                                        type="range"
                                        min="5"
                                        max="95"
                                        value={currentPos.x}
                                        onChange={(e) => updateStkPos({ x: parseInt(e.target.value) })}
                                        className="flex-1 accent-amber-600 h-1 bg-amber-200 rounded cursor-pointer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ x: Math.min(95, currentPos.x + 4) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        ➡️
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 w-12 shrink-0">Xoay:</span>
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ rotate: Math.max(-180, (currentPos.rotate ?? 0) - 10) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        🔄 -10°
                                      </button>
                                      <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={currentPos.rotate ?? 0}
                                        onChange={(e) => updateStkPos({ rotate: parseInt(e.target.value) })}
                                        className="flex-1 accent-amber-600 h-1 bg-amber-200 rounded cursor-pointer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ rotate: Math.min(180, (currentPos.rotate ?? 0) + 10) })}
                                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900"
                                      >
                                        🔄 +10°
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateStkPos({ rotate: 0 })}
                                        className="px-1 py-0.5 rounded text-[9.5px] bg-amber-200 hover:bg-amber-300 text-amber-900"
                                      >
                                        0°
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ô Mô Tả Source Video Cần Đưa Vào Phân Cảnh (Có popup hiện trọn vẹn toàn bộ chữ khi rê/giữ chuột) */}
                  <div 
                    className="relative group/guidebox mt-1 p-3 rounded-xl bg-slate-100/90 hover:bg-slate-50 border border-slate-300 hover:border-emerald-500 shadow-xs space-y-2 transition-all"
                    title={`🎬 SOURCE VIDEO:\n${scene.sourceName || scene.searchKeyword || '(Chưa có tên source)'}\n\n✂️ CÁCH CẮT & GÓC MÁY:\n${scene.cutAction || '(Chưa có hướng dẫn góc máy)'}`}
                  >
                    {/* Tooltip Popup nổi bật - Hiện toàn bộ chữ 100% khi hold/hover chuột */}
                    {(Boolean(scene.sourceName || scene.searchKeyword) || Boolean(scene.cutAction)) && (
                      <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] z-50 hidden group-hover/guidebox:block bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                        <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>📋</span>
                            <span>Chi tiết Kịch Bản Phân Cảnh {scene.order}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal lowercase">(rê chuột để xem hết)</span>
                        </div>
                        {Boolean(scene.sourceName || scene.searchKeyword) && (
                          <div className="mb-2.5">
                            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">🎬 Source Video:</div>
                            <div className="text-xs font-bold text-white mt-0.5 leading-relaxed break-words whitespace-pre-wrap">
                              {scene.sourceName || scene.searchKeyword}
                            </div>
                          </div>
                        )}
                        {Boolean(scene.cutAction) && (
                          <div className="pt-2 border-t border-slate-700/80">
                            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">✂️ Cách cắt & Góc máy:</div>
                            <div className="text-xs font-normal text-slate-100 mt-0.5 leading-relaxed break-words whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {scene.cutAction}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tên source video (Màu đen đậm sắc nét, tương phản cao, siêu dễ đọc) */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-xs">🎬</span>
                        <span>Source Video:</span>
                      </div>
                      <textarea
                        value={scene.sourceName || scene.searchKeyword || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateScene(scene.id, {
                            sourceName: val,
                            searchKeyword: val
                          });
                        }}
                        rows={2}
                        placeholder="Nhập tên source video..."
                        className="w-full bg-transparent border-0 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 leading-snug p-0 resize-none"
                        title={scene.sourceName || scene.searchKeyword || "Tên cảnh quay thực tế (lấy từ JSON AI)"}
                      />
                    </div>

                    {/* Cách cắt / Góc máy (lấy từ trường cutAction trong JSON AI) */}
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <span>✂️</span>
                        <span>Cách cắt & Góc máy:</span>
                      </div>
                      <textarea
                        value={scene.cutAction || ''}
                        onChange={(e) => updateScene(scene.id, { cutAction: e.target.value })}
                        rows={2}
                        placeholder="Mô tả góc máy, thao tác cắt, tốc độ..."
                        className="w-full bg-transparent border-0 text-[11px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 leading-relaxed p-0 resize-none"
                        title={scene.cutAction || "Góc máy và thao tác cắt cảnh (lấy từ JSON AI)"}
                      />
                    </div>
                  </div>
                </div>

                {/* Narration & Subtitles Editor (Col 5-8) */}
                <div className="md:col-span-5 flex flex-col gap-2.5">
                  {/* Voice Status & Action Bar */}
                  <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {/* Top Tier: Status & Listen Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                        {recordingSceneId === scene.id ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Đang ghi âm ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})...</span>
                          </span>
                        ) : isTranscribingSceneId === scene.id ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 flex-shrink-0" />
                            <span className="truncate">{transcribeStatusText || 'Đang nhận diện giọng nói...'}</span>
                          </span>
                        ) : hasAudio ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                              Đã có âm thanh ({scene.audioDuration?.toFixed(1)}s)
                              {scene.words && scene.words.length > 0 && ` • ${scene.words.length} từ`}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                            <span>Chưa có âm thanh thoại</span>
                          </span>
                        )}
                      </div>

                      {/* Play / Stop Audio Button */}
                      <button
                        type="button"
                        onClick={() => togglePlaySceneAudio(scene)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shadow-sm flex-shrink-0 ${
                          isPlaying
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        }`}
                        title="Nghe thử giọng đọc phân cảnh này"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Dừng</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Nghe thử</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Bottom Tier: 4 Equal Voice Action Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {/* Button 1: Live Microphone Recording */}
                      {recordingSceneId === scene.id ? (
                        <button
                          type="button"
                          onClick={stopRecordingSceneAudio}
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold transition-all animate-pulse shadow-sm border border-rose-500 active:scale-95"
                          title="Bấm để dừng ghi âm"
                        >
                          <Square className="w-3 h-3 fill-white" />
                          <span>Dừng ({recordingSeconds}s)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRecordingSceneAudio(scene.id)}
                          disabled={Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-semibold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                          title="Bấm để thu âm qua micro"
                        >
                          <Mic className="w-3 h-3 text-rose-600" />
                          <span>Ghi âm</span>
                        </button>
                      )}

                      {/* Button 2: Upload Custom Voiceover File */}
                      <button
                        type="button"
                        onClick={() => handleTriggerCustomAudioUpload(scene.id)}
                        disabled={Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold transition-all disabled:opacity-50 active:scale-95 shadow-sm cursor-pointer"
                        title="Tải lên file âm thanh MP3/WAV hoặc video MP4"
                      >
                        <Upload className="w-3 h-3 text-emerald-700" />
                        <span>Đẩy file</span>
                      </button>

                      {/* Button 3: AI Audio to Text Button */}
                      <button
                        type="button"
                        onClick={() => handleAutoAudioToText(scene)}
                        disabled={!scene.audioUrl || Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                        title="Tự động nhận diện chữ từ âm thanh"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Auto Text</span>
                      </button>

                      {/* Button 4: Generate AI Speech */}
                      <button
                        type="button"
                        onClick={() => handleGenerateSceneTTS(scene)}
                        disabled={isSynthesizing || Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-semibold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        title="Tạo lại giọng đọc từ văn bản kịch bản"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSynthesizing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
                        <span>{isSynthesizing ? 'Đang tạo...' : 'Giọng đọc'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Narration Textarea */}
                  <div className="relative flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                      <span>Câu thoại lồng tiếng (Chữ chạy video):</span>
                      <span className="text-slate-400">Sửa chữ tại đây tự cập nhật phụ đề</span>
                    </div>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => handleNarrationChange(scene, e.target.value)}
                      rows={3}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all resize-none font-sans leading-relaxed"
                      placeholder="Nhập câu thoại hoặc bấm 'Ghi âm' / 'Đẩy file'..."
                    />
                  </div>

                  {/* Interactive Subtitle Words Timing chips & Editor */}
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setExpandedKaraokeSceneId(expandedKaraokeSceneId === scene.id ? null : scene.id)}
                        className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                        title="Bấm để mở/thu gọn chi tiết từng mốc từ"
                      >
                        {workflowMode === 'script_voice' && (
                          <SparkleBadge step={4} label="Chỉnh nhịp Karaoke" />
                        )}
                        <span>🔤 Nhịp Karaoke ({scene.words?.length || 0} từ)</span>
                        <span className="text-[9.5px] text-slate-500 font-normal bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {expandedKaraokeSceneId === scene.id ? 'Thu gọn ▲' : 'Sửa mốc từ ▼'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        {scene.narration?.trim() && (
                          <button
                            type="button"
                            onClick={() => handleRealignWords(scene)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 text-[10px] text-slate-600 border border-slate-300 transition-all active:scale-95"
                            title="Tự động chia đều lại mốc thời gian từng từ"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Căn lại</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedKaraokeSceneId === scene.id && (
                      <div className="mt-1 pt-2 border-t border-slate-200">
                        {scene.words && scene.words.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                            {scene.words.map((w, wIdx) => {
                              const isEditingThis = editingWord?.sceneId === scene.id && editingWord?.wordIdx === wIdx;

                              if (isEditingThis) {
                                return (
                                  <div
                                    key={wIdx}
                                    className="flex items-center gap-1 p-1 rounded-lg bg-white border border-emerald-500 shadow-sm"
                                  >
                                    <input
                                      type="text"
                                      value={editingWord.word}
                                      onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                                      className="w-16 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-900 focus:outline-none"
                                      autoFocus
                                    />
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={editingWord.start}
                                      onChange={(e) => setEditingWord({ ...editingWord, start: parseFloat(e.target.value) || 0 })}
                                      className="w-11 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-700 font-mono focus:outline-none"
                                      title="Giây bắt đầu"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveWordEdit(scene.id, wIdx, editingWord.word, editingWord.start, editingWord.end)}
                                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                                      title="Lưu"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWord(scene.id, wIdx)}
                                      className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                                      title="Xóa từ này"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={wIdx}
                                  className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingWord({
                                        sceneId: scene.id,
                                        wordIdx: wIdx,
                                        word: w.word,
                                        start: w.start,
                                        end: w.end
                                      })
                                    }
                                    className="flex items-center gap-1 text-[10px] text-slate-700 font-medium cursor-pointer"
                                    title="Bấm để sửa từ này hoặc sửa mốc giây"
                                  >
                                    <span>{w.word}</span>
                                    <span className="text-[8px] text-slate-400 font-mono group-hover:text-slate-600">
                                      {w.start.toFixed(1)}s
                                    </span>
                                    <Edit3 className="w-2 h-2 opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic py-1 flex items-center justify-between">
                            <span>Chưa có mốc từ (Gõ câu thoại hoặc ghi âm để tạo)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Effects & Controls (Col 9-12) */}
                <div className="md:col-span-3 flex flex-col gap-2.5">
                  {/* Visual Style Layout Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-700" />
                      <span>Kiểu Trình Diễn Visual:</span>
                    </label>

                    <select
                      value={scene.visualType || 'media'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = visualStylesList.find((v) => v.id === val);
                        updateScene(scene.id, {
                          visualType: val as any,
                          headerBadge: matched?.badgeText || scene.headerBadge
                        });
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
                    >
                      {visualStylesList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.icon} {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ken Burns Camera Movement Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-slate-500" />
                      <span>Hiệu ứng Camera:</span>
                    </label>
                    <select
                      value={scene.kenBurns || 'none'}
                      onChange={(e) => updateScene(scene.id, { kenBurns: e.target.value as KenBurnsEffect })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="none">Tắt hiệu ứng Camera</option>
                      <option value="zoom_in">🔍 Phóng to dần (Zoom In)</option>
                      <option value="zoom_out">🔎 Thu nhỏ dần (Zoom Out)</option>
                      <option value="pan_left">⬅️ Quét sang trái (Pan Left)</option>
                      <option value="pan_right">➡️ Quét sang phải (Pan Right)</option>
                      <option value="tilt_up">⬆️ Quét từ dưới lên (Tilt Up)</option>
                      <option value="tilt_down">⬇️ Quét từ trên xuống (Tilt Down)</option>
                      <option value="subtle_float">🌊 Chuyển động nhẹ tự nhiên</option>
                    </select>
                  </div>

                  {/* Video FX & Overlay Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Kỹ xảo Video FX:</span>
                    </label>
                    <select
                      value={scene.tiktokVideoEffect || ''}
                      onChange={(e) => updateScene(scene.id, { tiktokVideoEffect: e.target.value || undefined })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">Không dùng kỹ xảo (Gốc)</option>
                      {TIKTOK_VIDEO_EFFECTS.map((fx) => (
                        <option key={fx.id} value={fx.id}>
                          {fx.previewIcon} {fx.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color Filter Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-emerald-600" />
                      <span>Bộ lọc màu (Filter):</span>
                    </label>
                    <select
                      value={scene.tiktokFilter || 'filter_none'}
                      onChange={(e) => updateScene(scene.id, { tiktokFilter: e.target.value === 'filter_none' ? undefined : e.target.value })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {TIKTOK_FILTERS.map((ft) => (
                        <option key={ft.id} value={ft.id}>
                          🎨 {ft.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transition Effect Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <MoveRight className="w-3 h-3 text-slate-500" />
                      <span>Chuyển cảnh (Transition):</span>
                    </label>
                    <select
                      value={scene.transition}
                      onChange={(e) => updateScene(scene.id, { transition: e.target.value as TransitionType })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="fade">Mờ dần (Fade)</option>
                      <option value="slide_left">⬅️ Trượt trái (Slide Left)</option>
                      <option value="slide_right">➡️ Trượt phải (Slide Right)</option>
                      <option value="slide_up">⬆️ Trượt lên (Slide Up)</option>
                      <option value="zoom_in">🔍 Phóng to (Zoom In)</option>
                      <option value="zoom_out">🔎 Thu nhỏ (Zoom Out)</option>
                      <option value="flash_white">⚡ Chớp trắng (Flash White)</option>
                      <option value="digital_glitch">👾 Nhiễu sóng (Glitch)</option>
                      <option value="cube_flip">🎲 Xoay 3D (Cube Flip)</option>
                      <option value="none">Cắt thẳng (Cut)</option>
                    </select>
                  </div>

                  {/* Delete button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      disabled={project.scenes.length <= 1}
                      className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa phân cảnh</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Search Modal */}
      {activeMediaModalSceneId && (() => {
        const activeScene = project.scenes.find((s) => s.id === activeMediaModalSceneId);
        const scriptSuggestions = getScriptSuggestions(activeScene);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-sm">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Tìm kiếm & Chèn Video Ngắn / Hình ảnh</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                        B-Roll & Stock HD
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Tự động gợi ý từ khóa chuẩn theo kịch bản phân cảnh hoặc gõ tìm kiếm tự do
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveMediaModalSceneId(null);
                    setHoveredVideoId(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Script Context & Smart Suggestions Box */}
              {activeScene && (
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold whitespace-nowrap">
                      Cảnh {activeScene.order}
                    </span>
                    <p className="text-xs text-slate-700 line-clamp-1 italic leading-relaxed">
                      "{activeScene.narration}"
                    </p>
                  </div>

                  {/* Keyword suggestions from script */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Gợi ý:</span>
                    </span>
                    {scriptSuggestions.map((kw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(kw);
                          setSearchSource('video');
                          handleSearchMedia(kw, 'video');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>{kw}</span>
                        <Search className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Mode Tabs */}
              <div className="px-4 pt-2.5 pb-2.5 flex items-center gap-2 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setSearchSource('video');
                    handleSearchMedia(searchQuery, 'video');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'video'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>🎬 Video ngắn (Stock B-Roll)</span>
                </button>

                <button
                  onClick={() => {
                    setSearchSource('web');
                    handleSearchMedia(searchQuery, 'web');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'web'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🌐 Tìm ảnh Web</span>
                </button>

                <button
                  onClick={() => {
                    setSearchSource('pexels');
                    handleSearchMedia(searchQuery, 'pexels');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'pexels'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>📸 Pexels</span>
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="p-3 border-b border-slate-200 flex gap-2 bg-white shrink-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMedia(searchQuery, searchSource)}
                    placeholder="Nhập từ khóa tìm kiếm..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMediaPage(1);
                    handleSearchMedia(searchQuery, searchSource, 1);
                  }}
                  disabled={isSearchingMedia || !searchQuery.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  {isSearchingMedia ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{searchSource === 'video' ? 'Tìm Video' : 'Tìm kiếm'}</span>
                </button>
              </div>

              {/* Media Results Grid with Hover Video Preview */}
              <div className="p-4 overflow-y-auto flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 auto-rows-max items-start content-start">
                {isSearchingMedia ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-700" />
                    <span className="text-xs font-medium">Đang tìm kiếm...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((asset) => {
                    const isHovered = hoveredVideoId === asset.id;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => selectMediaForScene(asset)}
                        onMouseEnter={() => setHoveredVideoId(asset.id)}
                        onMouseLeave={() => setHoveredVideoId(null)}
                        className="group relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-emerald-600 cursor-pointer transition-all hover:scale-[1.02] shadow-sm shrink-0"
                        style={{ minHeight: '110px' }}
                      >
                        {asset.type === 'video' && isHovered ? (
                          <video
                            src={asset.previewUrl || asset.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="absolute inset-0 w-full h-full object-cover block"
                          />
                        ) : (
                          <img
                            src={asset.thumbnail || asset.url}
                            alt={asset.title || 'asset'}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_THUMBNAIL;
                            }}
                            className="absolute inset-0 w-full h-full object-cover block"
                          />
                        )}

                        {asset.type === 'video' && !isHovered && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-emerald-700/80 transition-all">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 z-10">
                          <span className="text-[11px] text-white font-semibold truncate leading-tight">
                            {asset.title || asset.source}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            {asset.duration ? (
                              <span className="text-[9px] text-emerald-300 font-mono font-bold bg-black/50 px-1.5 py-0.5 rounded">
                                ⏱ {asset.duration}s
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-300 font-mono">HD</span>
                            )}
                            <span className="text-[9px] text-emerald-300 uppercase font-bold">
                              ✓ Chọn
                            </span>
                          </div>
                        </div>

                        <span
                          className={`absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md backdrop-blur-md text-[9px] font-bold border border-white/10 ${
                            asset.type === 'video'
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'bg-black/75 text-white'
                          }`}
                        >
                          {asset.type === 'video' ? '🎬 VIDEO' : 'IMAGE'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                    <p className="text-xs">
                      Chưa tìm thấy video phù hợp với từ khóa "<span className="text-slate-800 font-semibold">{searchQuery}</span>".
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Thêm Kiểu Trình Diễn Mới Không Giới Hạn */}
      <CreateCustomVisualModal
        isOpen={isCreateVisualModalOpen}
        onClose={() => setIsCreateVisualModalOpen(false)}
        onCreated={(newVisual) => {
          const updated = visualStylesService.getAll();
          setVisualStylesList(updated);
        }}
      />

      {/* Modal 100 Kiểu Sắp Xếp & 100 Hiệu Ứng Chữ Motion 3D */}
      <MotionTypographyModal
        isOpen={Boolean(activeMotionTypographyScene)}
        onClose={() => setActiveMotionTypographyScene(null)}
        scene={activeMotionTypographyScene}
        onApply={(sceneId, layoutId, effectId) => {
          const currentSc = project.scenes.find((s) => s.id === sceneId);
          updateScene(sceneId, {
            motionTypographyLayout: layoutId,
            motionTypographyEffect: effectId,
            textLayerMode: currentSc?.textLayerMode || 'front'
          });
        }}
        onApplyAll={(layoutId, effectId) => {
          project.scenes.forEach((sc) => {
            updateScene(sc.id, {
              motionTypographyLayout: layoutId,
              motionTypographyEffect: effectId,
              textLayerMode: sc.textLayerMode || 'front'
            });
          });
        }}
      />

      {/* Modal TikTok & CapCut Studio (Text Templates, Stickers, Effects, Transitions, Filters, SFX) */}
      {activeTikTokStudioScene && (() => {
        const currentScene = project.scenes.find((s) => s.id === activeTikTokStudioScene.id) || activeTikTokStudioScene;
        return (
          <TikTokStudioModal
            isOpen={Boolean(activeTikTokStudioScene)}
            onClose={() => setActiveTikTokStudioScene(null)}
            scene={currentScene}
            onApply={(sceneId, updates) => {
              updateScene(sceneId, updates);
            }}
            onApplyAll={(updates) => {
              project.scenes.forEach((sc) => {
                updateScene(sc.id, updates);
              });
            }}
          />
        );
      })()}

      {/* Modal Kéo Cắt Video Source Trực Quan */}
      {trimmerScene && (() => {
        const currentScene = project.scenes.find((s) => s.id === trimmerScene.id) || trimmerScene;
        return (
          <SceneVideoTrimmerModal
            isOpen={isTrimmerOpen}
            onClose={() => {
              setIsTrimmerOpen(false);
              setTrimmerScene(null);
            }}
            scene={currentScene}
            onSave={(sceneId, updates) => {
              updateScene(sceneId, updates);
            }}
          />
        );
      })()}
    </div>
  );
};
