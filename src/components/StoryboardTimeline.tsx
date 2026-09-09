import React, { useState, useRef } from 'react';
import { VideoProject, Scene, TransitionType, KenBurnsEffect } from '../types/video';
import { synthesizeEdgeTTS } from '../services/edgeTtsService';
import { searchPexelsMedia, searchWebMedia, generateAiImageUrl, searchStockVideos, MediaAsset } from '../services/mediaService';
import { transcribeCustomAudio, transcribeAndSplitFullAudio, syncWordsFromNarration, extractAudioBase64, extractAudioFromVideoData } from '../services/speechToTextService';
import { BatchVocabularyModal } from './BatchVocabularyModal';
import { CreateCustomVisualModal } from './CreateCustomVisualModal';
import { MotionTypographyModal } from './MotionTypographyModal';
import { TikTokStudioModal } from './TikTokStudioModal';
import { visualStylesService, CustomVisualItem } from '../services/visualStylesService';
import { SOUND_EFFECTS_LIST, playSoundEffectById } from '../services/soundEffectsService';
import { SparkleBadge, WorkflowMode } from './SparkleBadge';
import {
  Film,
  Image as ImageIcon,
  Volume2,
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
  const [expandedFxSceneId, setExpandedFxSceneId] = useState<string | null>(null);
  const [expandedKaraokeSceneId, setExpandedKaraokeSceneId] = useState<string | null>(null);
  const [ttsToastError, setTtsToastError] = useState<string | null>(null);

  // States for Live Microphone Recording (Ghi âm trực tiếp từ Mic)
  const [recordingSceneId, setRecordingSceneId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    setIsSynthesizingSceneId(scene.id);
    try {
      const res = await synthesizeEdgeTTS(
        scene.narration,
        project.voice.name || 'vi-VN-HoaiMyNeural',
        project.voice.rate,
        project.voice.pitch
      );

      if (res.audioUrl) {
        updateScene(scene.id, {
          audioUrl: res.audioUrl,
          audioDuration: res.duration,
          words: res.words
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
    setIsBatchSynthesizing(true);
    setBatchProgressText('Bắt đầu tạo giọng đọc cho tất cả các cảnh...');

    const updatedScenes = [...project.scenes];
    let totalDuration = 0;

    for (let i = 0; i < updatedScenes.length; i++) {
      const scene = updatedScenes[i];
      setBatchProgressText(`Đang tạo giọng AI cảnh ${i + 1}/${updatedScenes.length}...`);

      if (scene.narration.trim()) {
        try {
          const res = await synthesizeEdgeTTS(
            scene.narration,
            project.voice.name || 'vi-VN-HoaiMyNeural',
            project.voice.rate,
            project.voice.pitch
          );

          if (res.audioUrl) {
            updatedScenes[i] = {
              ...scene,
              audioUrl: res.audioUrl,
              audioDuration: res.duration,
              words: res.words
            };
            totalDuration += res.duration;
          }
        } catch (err) {
          console.warn('Batch TTS error on scene', i, err);
          setTtsToastError('Không thể kết nối máy chủ giọng đọc, vui lòng thử lại');
          setTimeout(() => setTtsToastError(null), 5000);
        }
      }
    }

    setProject((prev) => ({
      ...prev,
      scenes: updatedScenes,
      totalDuration
    }));

    setBatchProgressText('Đã tạo xong toàn bộ giọng đọc!');
    setTimeout(() => {
      setIsBatchSynthesizing(false);
      setBatchProgressText('');
    }, 2500);
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
          project.voice.name || 'vi-VN-HoaiMyNeural',
          project.voice.rate,
          project.voice.pitch
        );
        if (res.audioUrl) {
          targetAudioUrl = res.audioUrl;
          updateScene(scene.id, {
            audioUrl: res.audioUrl,
            audioDuration: res.duration,
            words: res.words
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
    updateScene(activeMediaModalSceneId, {
      mediaUrl: asset.url,
      localMediaPath: undefined,
      mediaType: asset.type,
      searchKeyword: searchQuery
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
        project.voice.name || 'vi-VN-HoaiMyNeural',
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
          updateScene(sceneId, {
            localMediaPath: `file://${filePath.replace(/\\/g, '/')}`,
            mediaUrl: `file://${filePath.replace(/\\/g, '/')}`,
            mediaType: isVideo ? 'video' : 'image'
          });
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

    updateScene(targetLocalMediaSceneId, {
      mediaUrl: objectUrl,
      localMediaPath: objectUrl,
      mediaType: isVideo ? 'video' : 'image'
    });

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

      {/* Header bar: Tối giản, thanh lịch chuẩn Dark Studio */}
      <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800 flex flex-col gap-2.5">
        {ttsToastError && (
          <div
            role="alert"
            className="bg-red-950/80 border border-red-500/50 text-red-200 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-in fade-in"
          >
            <span>⚠️</span>
            <span>{ttsToastError}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Danh Sách Phân Cảnh ({project.scenes.length} Scenes)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Giọng đọc: <span className="text-indigo-400 font-semibold">{project.voice.name || 'Hoài My'}</span>
              </p>
            </div>
          </div>

          {/* 1-Click Batch Voiceover Action */}
          <button
            onClick={handleBatchSynthesizeAll}
            disabled={isBatchSynthesizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all active:scale-95"
            title="Tự động lồng tiếng AI cho toàn bộ phân cảnh trong 1 click"
          >
            {workflowMode === 'script_voice' && (
              <SparkleBadge step={3} label="Ghép giọng đọc AI toàn bộ" />
            )}
            {isBatchSynthesizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{batchProgressText || 'Đang tạo giọng...'}</span>
              </>
            ) : (
              <>
                <Mic2 className="w-3.5 h-3.5" />
                <span>Ghép giọng AI toàn bộ</span>
              </>
            )}
          </button>
        </div>

        {/* Toolbar công cụ: Đồng bộ style tối giản tinh gọn */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-zinc-800/80">
          <div>
            {workflowMode === 'split_long_video' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold">
                <SparkleBadge step={2} label="Chỉnh sửa câu thoại/lồng tiếng cho các đoạn đã cắt" />
                <span className="text-[11px]">Các phân cảnh sau khi chia:</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nút tự động đổi ảnh cho các cảnh đang dùng ảnh mặc định */}
            {project.scenes.some((sc) => !sc.mediaUrl || sc.mediaUrl.includes('photo-1451187580459-43490279c0fa')) && (
              <button
                onClick={handleAutoFixDefaultMedia}
                disabled={isAutoFixingDefaultMedia}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium transition-all active:scale-95"
                title="Tự động vẽ/tìm ảnh mới phù hợp với câu thoại cho các cảnh đang dùng ảnh mặc định"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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
              className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 glass-card hover:border-gray-700/80 transition-all group"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Media Thumbnail & Actions (Col 1-4) */}
                <div className="md:col-span-4 flex flex-col gap-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black/80 border border-gray-800 group/thumb">
                    {scene.visualType === 'chat_bubble' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-3 text-center border border-purple-500/30">
                        <span className="text-2xl mb-1">💬</span>
                        <span className="text-xs font-black text-pink-300">CẢNH CHAT INBOX VIRAL</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{scene.headerBadge || '💬 INBOX MỖI NGÀY'}</span>
                      </div>
                    ) : scene.visualType === 'orbital_glow' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-amber-950/50 to-purple-950 p-3 text-center border border-amber-500/30">
                        <span className="text-2xl mb-1">🪐</span>
                        <span className="text-xs font-black text-amber-300">QUỸ ĐẠO AI PHÁT SÁNG</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{scene.orbitTitle || 'ỨNG DỤNG AI'}</span>
                      </div>
                    ) : scene.visualType === 'math_grid' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950/50 to-gray-950 p-3 text-center border border-cyan-500/30">
                        <span className="text-2xl mb-1">📈</span>
                        <span className="text-xs font-black text-cyan-300">LƯỚI ĐỒ HỌA VECTOR</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">Parabol • Bàn cờ • Hoa toán</span>
                      </div>
                    ) : scene.visualType === 'radar_tech' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-emerald-950/50 to-cyan-950 p-3 text-center border border-emerald-500/30">
                        <span className="text-2xl mb-1">📊</span>
                        <span className="text-xs font-black text-emerald-300">SÓNG DỮ LIỆU & PHÂN TÍCH</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{scene.headerBadge || '📊 PHÂN TÍCH CHỈ SỐ'}</span>
                      </div>
                    ) : scene.visualType === 'night_highway' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-rose-950/50 to-amber-950 p-3 text-center border border-rose-500/30">
                        <span className="text-2xl mb-1">🏎️</span>
                        <span className="text-xs font-black text-rose-300">XE ĐUA CAO TỐC ĐÊM</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{scene.headerBadge || '🏎️ BỨT PHÁ TỐC ĐỘ'}</span>
                      </div>
                    ) : scene.visualType === 'airplane_takeoff' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-sky-950/50 to-indigo-950 p-3 text-center border border-sky-500/30">
                        <span className="text-2xl mb-1">✈️</span>
                        <span className="text-xs font-black text-sky-300">MÁY BAY CẤT CÁNH</span>
                        <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">{scene.headerBadge || '✈️ CẤT CÁNH THÀNH CÔNG'}</span>
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
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Chưa có Media
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                        Cảnh {scene.order}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/80 backdrop-blur-md text-[10px] font-semibold text-white uppercase">
                        {scene.visualType && scene.visualType !== 'media' ? scene.visualType.replace('_', ' ') : scene.mediaType}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-mono text-indigo-300">
                      ⏱ {scene.audioDuration?.toFixed(1) || '4.0'}s
                    </div>
                  </div>

                  {/* Quick Media Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openMediaSearch(scene, 'video')}
                      className="relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-bold transition-all shadow-sm group/vbtn"
                      title="Tìm và chọn video ngắn phù hợp chủ đề kịch bản cảnh này"
                    >
                      {workflowMode === 'quality' && (
                        <SparkleBadge step={3} label="Chọn Video/Ảnh phân cảnh" />
                      )}
                      <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400 group-hover/vbtn:scale-110 transition-transform" />
                      <span>Video</span>
                    </button>

                    <button
                      onClick={() => handleSelectLocalMedia(scene.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gray-800/80 hover:bg-emerald-600/30 text-gray-300 hover:text-white border border-gray-700/50 text-xs font-semibold transition-all"
                      title="Chọn video hoặc ảnh từ máy tính"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Từ PC</span>
                    </button>
                  </div>

                  {/* Thanh Công Cụ Nâng Cao: Chữ 3D & CapCut FX (Thu gọn/Mở rộng để UI cực kỳ gọn gàng) */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setExpandedFxSceneId(expandedFxSceneId === scene.id ? null : scene.id)}
                      className={`w-full py-1.5 px-2.5 rounded-xl flex items-center justify-between text-[11px] font-bold transition-all border shadow-sm cursor-pointer ${
                        expandedFxSceneId === scene.id
                          ? 'bg-purple-900/40 border-purple-500/60 text-purple-200'
                          : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-300 hover:text-white'
                      }`}
                      title="Mở bảng công cụ kỹ xảo: Chữ Motion 3D, Phông xanh, Kho 100 kiểu chữ, CapCut FX"
                    >
                      <span className="flex items-center gap-1.5">
                        {workflowMode === 'quality' && (
                          <SparkleBadge step={4} label="Kỹ xảo Chữ 3D & CapCut FX" />
                        )}
                        <span>⚡</span>
                        <span>Chữ 3D & CapCut FX</span>
                        {(scene.isGreenScreenMotion || scene.tiktokTextTemplate || (scene.tiktokStickers && scene.tiktokStickers.length > 0)) && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {expandedFxSceneId === scene.id ? 'Thu gọn ▲' : 'Tùy chỉnh ▼'}
                      </span>
                    </button>

                    {expandedFxSceneId === scene.id && (
                      <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-gray-950/90 border border-purple-500/30">
                        {/* 1. Nút Bật / Tắt Video Phông Xanh & Chữ Motion 3D */}
                        <button
                          type="button"
                          onClick={() => {
                            updateScene(scene.id, {
                              isGreenScreenMotion: !scene.isGreenScreenMotion
                            });
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-black transition-all border shadow-sm cursor-pointer active:scale-95 ${
                            scene.isGreenScreenMotion
                              ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-green-300 text-white shadow-md'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/50 text-emerald-300 hover:text-white'
                          }`}
                          title="Khử sạch nền xanh lá của video và tự động ghép chữ Motion 3D xếp loạn xạ ở trước và sau người"
                        >
                          <span>{scene.isGreenScreenMotion ? '✓' : '🟩'}</span>
                          <span>
                            {scene.isGreenScreenMotion
                              ? 'Đang Chạy Chữ 3D (Trước/Sau)'
                              : '🟩 Bật Chữ Motion 3D (Phông Xanh)'}
                          </span>
                        </button>

                        {/* 2. Nút Thứ Tự Lớp Chữ: Luôn Ở Trước / Ở Dưới Video / Đan Xen 3D */}
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
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-black transition-all border shadow-sm cursor-pointer active:scale-95 ${
                            scene.textLayerMode === 'front'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-cyan-300 text-white shadow-md'
                              : scene.textLayerMode === 'behind'
                              ? 'bg-gradient-to-r from-purple-700 to-indigo-600 border-indigo-300 text-white shadow-md'
                              : 'bg-gradient-to-r from-amber-600 to-orange-500 border-amber-300 text-white shadow-md'
                          }`}
                        >
                          <span>
                            {scene.textLayerMode === 'front'
                              ? '🔝 Chữ: Luôn Ở TRƯỚC Video'
                              : scene.textLayerMode === 'behind'
                              ? '🔙 Chữ: Chạy Ở DƯỚI Video'
                              : '⚡ Chữ: Đan Xen 3D (Trước & Sau)'}
                          </span>
                        </button>

                        {/* 3. Nút Mở Modal 100 Kiểu Sắp Xếp & 100 Hiệu Ứng Chữ Motion */}
                        <button
                          type="button"
                          onClick={() => setActiveMotionTypographyScene(scene)}
                          className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-extrabold transition-all border border-emerald-500/40 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 hover:from-emerald-600/50 hover:to-cyan-600/50 text-emerald-200 hover:text-white cursor-pointer active:scale-95 shadow-sm"
                        >
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
                          className="w-full py-1 px-2 rounded-lg flex items-center justify-center gap-1 text-[10px] font-black transition-all border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white cursor-pointer active:scale-95 shadow-sm"
                        >
                          <span>✨</span>
                          <span>Áp Dụng Kiểu Chữ Cho Tất Cả Cảnh</span>
                        </button>

                        {/* 5. Nút Mở Kho TikTok & CapCut Studio */}
                        <button
                          type="button"
                          onClick={() => setActiveTikTokStudioScene(scene)}
                          className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-black transition-all border border-rose-500/40 bg-gradient-to-r from-rose-600/30 to-cyan-600/30 hover:from-rose-600/50 hover:to-cyan-600/50 text-rose-200 hover:text-white cursor-pointer active:scale-95 shadow-sm"
                        >
                          <span>🎬</span>
                          <span>TikTok / CapCut Studio</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Narration & Subtitles Editor (Col 5-8) */}
                <div className="md:col-span-5 flex flex-col gap-2.5">
                  {/* Voice Status & Action Bar - Clean 2-Tier Layout */}
                  <div className="flex flex-col gap-2 bg-gray-950/60 p-2.5 rounded-xl border border-gray-800">
                    {/* Top Tier: Status & Listen Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                        {recordingSceneId === scene.id ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Đang ghi âm ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})...</span>
                          </span>
                        ) : isTranscribingSceneId === scene.id ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 flex-shrink-0" />
                            <span className="truncate">{transcribeStatusText || 'Đang nhận diện giọng nói...'}</span>
                          </span>
                        ) : hasAudio ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              Đã có sound ({scene.audioDuration?.toFixed(1)}s)
                              {scene.words && scene.words.length > 0 && ` • ${scene.words.length} từ`}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400/90">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                            <span>Chưa có âm thanh thoại</span>
                          </span>
                        )}
                      </div>

                      {/* Play / Stop Audio Button */}
                      <button
                        type="button"
                        onClick={() => togglePlaySceneAudio(scene)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm flex-shrink-0 ${
                          isPlaying
                            ? 'bg-pink-600 text-white animate-pulse'
                            : 'bg-indigo-600/90 hover:bg-indigo-500 text-white'
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

                    {/* Bottom Tier: 4 Equal Voice Action Buttons (Ghi âm Mic / Đẩy Sound / Auto Text / Giọng AI) */}
                    <div className="grid grid-cols-4 gap-1">
                      {/* Button 1: Live Microphone Recording */}
                      {recordingSceneId === scene.id ? (
                        <button
                          type="button"
                          onClick={stopRecordingSceneAudio}
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold transition-all animate-pulse shadow-md shadow-rose-600/30 border border-rose-400 active:scale-95"
                          title="Bấm để dừng ghi âm và tự động nhận diện chữ chạy video"
                        >
                          <Square className="w-3 h-3 fill-white" />
                          <span>Dừng ({recordingSeconds}s)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRecordingSceneAudio(scene.id)}
                          disabled={Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 hover:text-white border border-rose-500/40 text-[10px] font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                          title="Bấm để bắt đầu thu âm giọng nói trực tiếp qua micro máy tính"
                        >
                          <Mic className="w-3 h-3 text-rose-400" />
                          <span>Ghi âm</span>
                        </button>
                      )}

                      {/* Button 2: Upload Custom Voiceover File (MP3 & Video MP4 auto audio extract) */}
                      <button
                        type="button"
                        onClick={() => handleTriggerCustomAudioUpload(scene.id)}
                        disabled={Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm cursor-pointer"
                        title="Đẩy file sound MP3 hoặc video MP4 (tự động tách lấy sound) - Nhận diện giọng nói Audio to text & chạy chữ Karaoke"
                      >
                        <Upload className="w-3 h-3 text-emerald-400" />
                        <span>Đẩy sound</span>
                      </button>

                      {/* Button 3: AI Audio to Text Button */}
                      <button
                        type="button"
                        onClick={() => handleAutoAudioToText(scene)}
                        disabled={!scene.audioUrl || Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 hover:text-white border border-amber-500/40 text-[10px] font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                        title="AI tự động nghe file âm thanh của phân cảnh này và chuyển thành văn bản + mốc từ chạy chữ karaoke"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Auto Text</span>
                      </button>

                      {/* Button 4: Generate AI Speech */}
                      <button
                        type="button"
                        onClick={() => handleGenerateSceneTTS(scene)}
                        disabled={isSynthesizing || Boolean(recordingSceneId) || isTranscribingSceneId === scene.id}
                        className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/40 text-[10px] font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        title="Tạo lại giọng đọc AI từ văn bản kịch bản"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSynthesizing ? 'animate-spin text-pink-400' : 'text-indigo-400'}`} />
                        <span>{isSynthesizing ? 'Đọc...' : 'Giọng AI'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Narration Textarea */}
                  <div className="relative flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                      <span>Câu thoại lồng tiếng (Chữ chạy video):</span>
                      <span className="text-gray-500">Sửa chữ tại đây tự cập nhật phụ đề</span>
                    </div>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => handleNarrationChange(scene, e.target.value)}
                      rows={3}
                      className="w-full bg-gray-950/90 border border-gray-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none transition-all resize-none font-sans leading-relaxed"
                      placeholder="Nhập câu thoại hoặc bấm 'Ghi âm' / 'Đẩy sound' / 'Auto Text' để tự động nhận diện chữ..."
                    />
                  </div>

                  {/* Interactive Subtitle Words Timing chips & Editor */}
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-gray-950/80 border border-gray-800/80">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setExpandedKaraokeSceneId(expandedKaraokeSceneId === scene.id ? null : scene.id)}
                        className="flex items-center gap-1.5 text-[10.5px] font-bold text-indigo-300 hover:text-indigo-100 transition-all cursor-pointer"
                        title="Bấm để mở/thu gọn chi tiết từng mốc từ và chèn SFX"
                      >
                        {workflowMode === 'script_voice' && (
                          <SparkleBadge step={4} label="Chỉnh nhịp Karaoke & SFX" />
                        )}
                        <span>🔤 Nhịp Karaoke ({scene.words?.length || 0} từ)</span>
                        <span className="text-[9.5px] text-gray-400 font-normal bg-gray-800/80 px-1.5 py-0.5 rounded">
                          {expandedKaraokeSceneId === scene.id ? 'Thu gọn ▲' : 'Sửa mốc từ ▼'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        {scene.audioUrl && (
                          <button
                            type="button"
                            onClick={() => handleAutoAudioToText(scene)}
                            disabled={isTranscribingSceneId === scene.id}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-[10px] text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-all active:scale-95 font-semibold"
                            title="AI tự động nghe âm thanh và bóc tách thành câu chữ + mốc từ karaoke"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>Audio to Text</span>
                          </button>
                        )}

                        {scene.narration?.trim() && (
                          <button
                            type="button"
                            onClick={() => handleRealignWords(scene)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 transition-all active:scale-95"
                            title="Tự động chia đều lại mốc thời gian từng từ theo độ dài âm thanh"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Căn lại</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedKaraokeSceneId === scene.id && (
                      <div className="mt-1 pt-2 border-t border-gray-800/80">
                        {scene.tiktokSfx && (() => {
                          const sfxItem = SOUND_EFFECTS_LIST.find((s) => s.id === scene.tiktokSfx);
                          return (
                            <div
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', scene.tiktokSfx || '');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/80 text-cyan-300 text-[10px] font-mono cursor-grab active:cursor-grabbing hover:bg-cyan-900 transition shadow-sm select-none mb-2"
                              title="KÉO THẢ: Kéo badge âm thanh này vào trước bất kỳ từ nào bên dưới để SFX phát đúng lúc nói từ đó!"
                            >
                              <Volume2 className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                              <span className="font-sans font-black">{sfxItem ? sfxItem.name.split(' ')[0] + ' ' + sfxItem.name.split(' ')[1] : 'SFX'}</span>
                              <span className="text-[8px] bg-cyan-500/20 text-cyan-200 px-1 rounded">Kéo vào từ ⬇️</span>
                            </div>
                          );
                        })()}

                        {scene.words && scene.words.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                            {scene.words.map((w, wIdx) => {
                              const isEditingThis = editingWord?.sceneId === scene.id && editingWord?.wordIdx === wIdx;

                              if (isEditingThis) {
                                return (
                                  <div
                                    key={wIdx}
                                    className="flex items-center gap-1 p-1 rounded-lg bg-indigo-950 border border-indigo-400 shadow-md"
                                  >
                                    <input
                                      type="text"
                                      value={editingWord.word}
                                      onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                                      className="w-16 px-1 py-0.5 bg-gray-900 border border-gray-700 rounded text-[11px] text-white focus:outline-none"
                                      autoFocus
                                    />
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={editingWord.start}
                                      onChange={(e) => setEditingWord({ ...editingWord, start: parseFloat(e.target.value) || 0 })}
                                      className="w-11 px-1 py-0.5 bg-gray-900 border border-gray-700 rounded text-[10px] text-indigo-300 font-mono focus:outline-none"
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

                              const wordSfxItem = w.sfxId ? SOUND_EFFECTS_LIST.find((s) => s.id === w.sfxId) : null;

                              return (
                                <div
                                  key={wIdx}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-950/60');
                                  }}
                                  onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-950/60');
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-950/60');
                                    const sfxId = e.dataTransfer.getData('text/plain') || scene.tiktokSfx;
                                    if (sfxId) {
                                      const nextWords = [...scene.words];
                                      nextWords[wIdx] = { ...nextWords[wIdx], sfxId };
                                      updateScene(scene.id, { words: nextWords });
                                      playSoundEffectById(sfxId);
                                    }
                                  }}
                                  className={`group inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${
                                    w.sfxId
                                      ? 'bg-cyan-950/80 border-cyan-400/80 shadow-md shadow-cyan-500/20'
                                      : 'bg-indigo-500/10 hover:bg-indigo-500/25 border-indigo-500/20'
                                  }`}
                                >
                                  {/* Nút SFX Badge nếu từ này có âm thanh */}
                                  {w.sfxId ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playSoundEffectById(w.sfxId!);
                                      }}
                                      className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-cyan-500 text-black text-[8px] font-black hover:bg-cyan-300 transition cursor-pointer"
                                      title={`Âm thanh ${wordSfxItem ? wordSfxItem.name : w.sfxId} sẽ kêu đúng lúc nói từ này! Bấm để nghe thử.`}
                                    >
                                      <span>🔊</span>
                                      <span>{wordSfxItem ? wordSfxItem.name.split(' ')[0] : 'SFX'}</span>
                                      {/* Gỡ SFX khỏi từ */}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextWords = [...scene.words];
                                          nextWords[wIdx] = { ...nextWords[wIdx], sfxId: undefined };
                                          updateScene(scene.id, { words: nextWords });
                                        }}
                                        className="ml-0.5 hover:text-red-900 font-bold"
                                        title="Gỡ âm thanh này khỏi từ"
                                      >
                                        ✕
                                      </span>
                                    </button>
                                  ) : scene.tiktokSfx ? (
                                    /* Nút 1-Click gán nhanh SFX của cảnh vào từ */
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const nextWords = [...scene.words];
                                        nextWords[wIdx] = { ...nextWords[wIdx], sfxId: scene.tiktokSfx };
                                        updateScene(scene.id, { words: nextWords });
                                        playSoundEffectById(scene.tiktokSfx!);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-[8px] px-1 py-0.2 rounded bg-cyan-900/90 text-cyan-300 hover:bg-cyan-600 hover:text-black border border-cyan-400/50 transition cursor-pointer"
                                      title="Gán âm thanh SFX của cảnh vào từ này"
                                    >
                                      +🔊
                                    </button>
                                  ) : null}

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
                                    className="flex items-center gap-1 text-[10px] text-indigo-300 font-medium cursor-pointer"
                                    title="Bấm để sửa từ này hoặc sửa mốc giây"
                                  >
                                    <span className={w.sfxId ? 'text-cyan-200 font-black' : ''}>{w.word}</span>
                                    <span className="text-[8px] text-gray-500 font-mono group-hover:text-indigo-200">
                                      {w.start.toFixed(1)}s
                                    </span>
                                    <Edit3 className="w-2 h-2 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 italic py-1 flex items-center justify-between">
                            <span>Chưa có mốc từ (Gõ câu thoại hoặc ghi âm để tạo)</span>
                            {scene.narration?.trim() && (
                              <button
                                type="button"
                                onClick={() => handleRealignWords(scene)}
                                className="text-indigo-400 hover:underline font-semibold"
                              >
                                Tạo nhịp chữ ngay
                              </button>
                            )}
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
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>Kiểu Trình Diễn Visual:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreateVisualModalOpen(true)}
                        className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Tự do thêm kiểu trình diễn mới không giới hạn"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Thêm Kiểu Mới</span>
                      </button>
                    </div>

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
                      className="bg-gray-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-indigo-200 focus:outline-none focus:border-indigo-400 font-semibold"
                    >
                      {visualStylesList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.icon} {v.name}
                        </option>
                      ))}
                    </select>

                    {/* Visual Scale Slider (When visualType is not media) */}
                    {scene.visualType && scene.visualType !== 'media' && (
                      <div className="flex flex-col gap-1 bg-gray-950/80 p-2 rounded-xl border border-indigo-500/30 mt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-pink-300 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-pink-400" />
                            <span>Độ to Visual:</span>
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">
                            {Math.round((scene.visualScale ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={scene.visualScale ?? 1.0}
                          onChange={(e) => updateScene(scene.id, { visualScale: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          title="Kéo để phóng to hoặc thu nhỏ kiểu trình diễn"
                        />
                        <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                          <span>50%</span>
                          <button
                            type="button"
                            onClick={() => updateScene(scene.id, { visualScale: 1.0 })}
                            className="hover:text-gray-300 text-gray-400 underline"
                          >
                            Chuẩn 100%
                          </button>
                          <span>250%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ken Burns Effect Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-purple-400" />
                      <span>Hiệu ứng Camera (Cinematic):</span>
                    </label>
                    <select
                      value={scene.kenBurns}
                      onChange={(e) => updateScene(scene.id, { kenBurns: e.target.value as KenBurnsEffect })}
                      className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="zoom_in">🔍 Zoom In (Phóng to dần)</option>
                      <option value="zoom_out">🔎 Zoom Out (Thu nhỏ dần)</option>
                      <option value="pan_left">⬅️ Pan Sang Trái</option>
                      <option value="pan_right">➡️ Pan Sang Phải</option>
                      <option value="tilt_up">⬆️ Tilt Up (Quét từ dưới lên)</option>
                      <option value="tilt_down">⬇️ Tilt Down (Quét từ trên xuống)</option>
                      <option value="crash_zoom">💥 Crash Zoom (Giật bắn vào tâm)</option>
                      <option value="dutch_angle">🔄 Dutch Angle (Nghiêng góc 3D)</option>
                      <option value="rack_focus">👓 Rack Focus (Mờ ➔ Rõ nét)</option>
                      <option value="spiral_zoom">🌀 Spiral Zoom (Xoáy ốc hút tâm)</option>
                      <option value="handheld">🎥 Handheld (Cầm tay run tự nhiên)</option>
                      <option value="subtle_float">🌊 Chuyển động bồng bềnh</option>
                      <option value="none">Tắt hiệu ứng</option>
                    </select>
                  </div>

                  {/* Transition Effect Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <MoveRight className="w-3 h-3 text-pink-400" />
                      <span>Chuyển cảnh (Transition):</span>
                    </label>
                    <select
                      value={scene.transition}
                      onChange={(e) => updateScene(scene.id, { transition: e.target.value as TransitionType })}
                      className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fade">Mờ dần (Fade)</option>
                      <option value="whip_pan">💨 Quét nhanh mờ (Whip Pan)</option>
                      <option value="slide_left">⬅️ Trượt trái (Slide Left)</option>
                      <option value="slide_right">➡️ Trượt phải (Slide Right)</option>
                      <option value="slide_up">⬆️ Trượt hất lên (Slide Up)</option>
                      <option value="zoom_in">🔍 Phóng to (Zoom In)</option>
                      <option value="zoom_out">🔎 Thu nhỏ (Zoom Out)</option>
                      <option value="flash_white">⚡ Chớp sáng lóe (Flash White)</option>
                      <option value="digital_glitch">📺 Nhiễu sóng số (Glitch)</option>
                      <option value="cube_flip">🎲 Lật khối hộp 3D (Cube Flip)</option>
                      <option value="none">Cắt thẳng (Cut)</option>
                    </select>
                  </div>

                  {/* Transition Custom Audio Sound FX */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-cyan-400" />
                        <span>Âm thanh chuyển cảnh:</span>
                      </label>
                      {scene.transitionAudioUrl && (
                        <button
                          type="button"
                          onClick={() => updateScene(scene.id, { transitionAudioUrl: undefined, transitionAudioName: undefined })}
                          className="text-[10px] text-red-400 hover:text-red-300"
                          title="Gỡ âm thanh chuyển cảnh"
                        >
                          ✕ Gỡ
                        </button>
                      )}
                    </div>

                    {scene.transitionAudioUrl ? (
                      <div className="flex items-center justify-between bg-gray-950 px-2 py-1.5 rounded-lg border border-cyan-500/40 text-[11px]">
                        <span className="text-cyan-300 truncate max-w-[130px] font-mono" title={scene.transitionAudioName}>
                          🎵 {scene.transitionAudioName || 'Transition.mp3'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const a = new Audio(scene.transitionAudioUrl);
                            a.play();
                          }}
                          className="p-1 rounded bg-cyan-600/30 text-cyan-200 hover:text-white"
                          title="Nghe thử"
                        >
                          <Play className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTransitionAudio(scene.id)}
                        className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/40 text-[11px] text-gray-400 hover:text-cyan-300 transition-all"
                        title="Tải lên file Whoosh, Boom, Ding, Pop MP3/WAV"
                      >
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Tải âm chuyển cảnh</span>
                      </button>
                    )}
                  </div>

                  {/* Delete button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      disabled={project.scenes.length <= 1}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 text-white shadow-lg shadow-pink-600/20">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">Tìm kiếm & Chèn Video Ngắn / Hình ảnh</h4>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
                        B-Roll & Stock HD
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Tự động gợi ý từ khóa chuẩn theo kịch bản phân cảnh hoặc gõ tìm kiếm tự do
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveMediaModalSceneId(null);
                    setHoveredVideoId(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Script Context & Smart Suggestions Box */}
              {activeScene && (
                <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-950/30 via-purple-950/20 to-gray-950/50 border-b border-gray-800/80 flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[9px] font-bold whitespace-nowrap">
                      Cảnh {activeScene.order}
                    </span>
                    <p className="text-xs text-gray-200 line-clamp-1 italic leading-relaxed">
                      "{activeScene.narration}"
                    </p>
                  </div>

                  {/* Keyword suggestions from script */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-pink-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Gợi ý kịch bản:</span>
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
                        className="px-2 py-0.5 rounded-lg bg-pink-950/40 hover:bg-pink-600/30 text-pink-200 hover:text-white border border-pink-500/30 text-[10px] font-medium transition-all flex items-center gap-1 group/sug"
                      >
                        <span>{kw}</span>
                        <Search className="w-2.5 h-2.5 text-pink-400 opacity-60 group-hover/sug:opacity-100" />
                      </button>
                    ))}
                  </div>

                  {/* Popular B-Roll Topics Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-0.5 border-t border-gray-800/50">
                    <span className="text-[9px] font-semibold text-gray-400 whitespace-nowrap">
                      🔥 Chủ đề hot:
                    </span>
                    {POPULAR_VIDEO_TOPICS.map((topic, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSearchQuery(topic.query);
                          setSearchSource('video');
                          handleSearchMedia(topic.query, 'video');
                        }}
                        className="px-2 py-0.5 rounded-md bg-gray-800/80 hover:bg-indigo-600/30 text-gray-300 hover:text-white border border-gray-700/60 text-[9px] whitespace-nowrap transition-all"
                      >
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Mode Tabs */}
              <div className="px-4 pt-2.5 pb-2.5 flex items-center gap-2 border-b border-gray-800/80 bg-gray-950/40 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setSearchSource('video');
                    handleSearchMedia(searchQuery, 'video');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'video'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30 scale-[1.02]'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>🌐 Tìm ảnh Web / Google</span>
                </button>

                <button
                  onClick={() => {
                    setSearchSource('ai');
                    handleSearchMedia(searchQuery, 'ai');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'ai'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Tạo ảnh AI</span>
                </button>

                <button
                  onClick={() => {
                    setSearchSource('pexels');
                    handleSearchMedia(searchQuery, 'pexels');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    searchSource === 'pexels'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>📸 Stock Pexels</span>
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="p-3 border-b border-gray-800 flex gap-2 bg-gray-900 shrink-0">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMedia(searchQuery, searchSource)}
                    placeholder="Nhập từ khóa chủ đề (ví dụ: vũ trụ, galaxy, nấu ăn, công nghệ, tiền bạc, xe cộ, thiên nhiên)..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3.5 pr-8 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                      title="Xóa ô tìm kiếm"
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
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
                >
                  {isSearchingMedia ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{searchSource === 'video' ? 'Tìm Video' : 'Tìm kiếm'}</span>
                </button>

                {searchSource === 'video' && (
                  <button
                    type="button"
                    onClick={handleNextBatch}
                    disabled={isSearchingMedia || !searchQuery.trim()}
                    className="px-3.5 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap border border-purple-400/40"
                    title="Đổi sang tập video khác cho chủ đề này"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingMedia ? 'animate-spin' : ''}`} />
                    <span>Đổi video khác</span>
                    <span className="px-1.5 py-0.5 bg-black/40 text-purple-200 rounded text-[10px] font-mono">
                      #{mediaPage}
                    </span>
                  </button>
                )}
              </div>

              {/* Direct Paste URL Input Bar */}
              <div className="px-4 py-1.5 bg-gray-950/40 border-b border-gray-800/60 flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-gray-400 flex-shrink-0">Hoặc dán URL:</span>
                <input
                  type="text"
                  value={directImageUrlInput}
                  onChange={(e) => setDirectImageUrlInput(e.target.value)}
                  placeholder="https://example.com/video.mp4 hoặc link ảnh..."
                  className="flex-1 bg-gray-950 border border-gray-800/80 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={() => {
                    if (directImageUrlInput.trim() && activeMediaModalSceneId) {
                      const isVid = directImageUrlInput.includes('.mp4') || directImageUrlInput.includes('.mov');
                      selectMediaForScene({
                        id: `direct-${Date.now()}`,
                        type: isVid ? 'video' : 'image',
                        url: directImageUrlInput.trim(),
                        thumbnail: directImageUrlInput.trim(),
                        source: 'web',
                        title: 'Link dán trực tiếp'
                      });
                      setDirectImageUrlInput('');
                    }
                  }}
                  disabled={!directImageUrlInput.trim()}
                  className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white text-xs font-medium disabled:opacity-40 whitespace-nowrap"
                >
                  Dùng link này
                </button>
              </div>

              {/* Media Results Grid with Hover Video Preview */}
              <div className="p-4 overflow-y-auto flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 auto-rows-max items-start content-start">
                {isSearchingMedia ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-pink-400" />
                    <span className="text-xs font-medium">
                      {searchSource === 'video'
                        ? 'Đang tìm kiếm video ngắn HD phù hợp với chủ đề...'
                        : 'Đang tìm kiếm hình ảnh phù hợp...'}
                    </span>
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
                        className="group relative w-full aspect-video rounded-xl overflow-hidden bg-gray-950 border border-gray-800 hover:border-pink-500 cursor-pointer transition-all hover:scale-[1.02] shadow-lg shrink-0"
                        style={{ minHeight: '110px' }}
                      >
                        {/* If video and hovered, render actual live video preview */}
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

                        {/* Video play icon overlay when not hovered */}
                        {asset.type === 'video' && !isHovered && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-pink-600/80 transition-all">
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}

                        {/* Hover Overlay info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 z-10">
                          <span className="text-[11px] text-white font-semibold truncate leading-tight">
                            {asset.title || asset.source}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            {asset.duration ? (
                              <span className="text-[9px] text-pink-300 font-mono font-bold bg-black/50 px-1.5 py-0.5 rounded">
                                ⏱ {asset.duration}s
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-300 font-mono">HD</span>
                            )}
                            <span className="text-[9px] text-pink-300 uppercase font-extrabold flex items-center gap-0.5">
                              ✓ Chọn cảnh này
                            </span>
                          </div>
                        </div>

                        {/* Top Badge */}
                        <span
                          className={`absolute top-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md backdrop-blur-md text-[9px] font-extrabold border border-white/10 ${
                            asset.type === 'video'
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                              : 'bg-black/75 text-gray-200'
                          }`}
                        >
                          {asset.type === 'video' ? '🎬 VIDEO' : 'IMAGE'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                    <p className="text-xs">
                      Chưa tìm thấy video phù hợp với từ khóa "<span className="text-pink-300 font-medium">{searchQuery}</span>".
                    </p>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <span className="text-[11px] text-gray-500">Thử tìm theo chủ đề:</span>
                      {POPULAR_VIDEO_TOPICS.slice(0, 4).map((t, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(t.query);
                            setSearchSource('video');
                            handleSearchMedia(t.query, 'video');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-pink-600/30 text-gray-300 hover:text-white border border-gray-700 text-xs font-medium"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Switch Video Batch Pagination Bar */}
              {searchSource === 'video' && searchResults.length > 0 && (
                <div className="px-4 py-2.5 bg-gray-950/90 border-t border-gray-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-gray-300 font-medium">Đang hiển thị {searchResults.length} video</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-pink-400 font-bold bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-md">
                      Tập {mediaPage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {mediaPage > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevBatch}
                        disabled={isSearchingMedia}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-all border border-gray-700 disabled:opacity-40"
                      >
                        ◀ Tập trước
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleNextBatch}
                      disabled={isSearchingMedia}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-pink-600/25 active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSearchingMedia ? 'animate-spin' : ''}`} />
                      <span>Đổi sang tập video khác ▶</span>
                    </button>
                  </div>
                </div>
              )}
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
    </div>
  );
};
