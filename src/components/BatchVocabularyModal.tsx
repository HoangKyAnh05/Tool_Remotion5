import React, { useState } from 'react';
import { VideoProject, Scene } from '../types/video';
import { searchWebMedia, generateAiImageUrl } from '../services/mediaService';
import { synthesizeEdgeTTS } from '../services/edgeTtsService';
import { analyzeSentenceForMotion } from '../services/scriptToMotionEngine';
import {
  ListPlus,
  Sparkles,
  Loader2,
  CheckCircle2,
  Layers,
  Mic,
  Search,
  Tag,
  BookOpen,
  ArrowRight,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Code2,
  Wand2
} from 'lucide-react';

interface BatchVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  apiKeyPexels?: string;
}

export const BatchVocabularyModal: React.FC<BatchVocabularyModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
  apiKeyPexels
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'vocab'>('script');
  const [topicPrompt, setTopicPrompt] = useState(project.topic || 'Review Quán Bún Cá Cay Hải Phòng');
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);

  // Input for Script Segments (Separated by dot . or newlines or JSON)
  const [scriptInputText, setScriptInputText] = useState(
    'Bún cá cay Hải Phòng là món ăn đặc sản nức tiếng đậm đà khó quên. Từng miếng cá rô phi được chiên vàng ươm giòn rụm trong miệng. Nước dùng thanh ngọt nấu từ xương cá và cà chua tươi ngon. Thưởng thức kèm chả cá thơm lừng cùng rau dọc mùng giòn sần sật.'
  );

  // Input for Image Search Keywords (Separated by dot . or newlines or JSON)
  const [keywordInputText, setKeywordInputText] = useState(
    'bún cá Hải Phòng. cá chiên giòn. nước dùng bún cá. tô bún cá nóng'
  );

  // Input for Simple Vocab List
  const [vocabInputText, setVocabInputText] = useState(
    'Huấn hoa hồng. Bác Hồ. xe VinFast. bãi biển Đà Nẵng. Vịnh Hạ Long'
  );
  const [sentenceTemplate, setSentenceTemplate] = useState<string>('{word}');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  if (!isOpen) return null;

  // Smart Parser: Handles JSON automatically OR splits by PERIOD (.) and NEWLINES (\n)
  const parseScriptAndKeywords = (): { narrations: string[]; keywords: string[] } => {
    const rawScript = scriptInputText.trim();
    const rawKeyword = keywordInputText.trim();

    // 1. Check if rawScript is JSON
    if (rawScript.startsWith('{') || rawScript.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawScript);
        if (Array.isArray(parsed)) {
          return {
            narrations: parsed.map((item: any) =>
              typeof item === 'string' ? item : item.narration || item.text || item.content || ''
            ),
            keywords: parsed.map((item: any) =>
              typeof item === 'string' ? '' : item.keyword || item.searchKeyword || item.search || ''
            )
          };
        } else if (parsed.scenes && Array.isArray(parsed.scenes)) {
          return {
            narrations: parsed.scenes.map((s: any) => s.narration || s.text || ''),
            keywords: parsed.scenes.map((s: any) => s.keyword || s.searchKeyword || s.search || '')
          };
        } else if (parsed.narrations && Array.isArray(parsed.narrations)) {
          return {
            narrations: parsed.narrations,
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
          };
        }
      } catch (err) {
        // Continue to text parsing
      }
    }

    // 2. Parse Keywords if JSON
    let parsedKeywords: string[] = [];
    if (rawKeyword.startsWith('[') || rawKeyword.startsWith('{')) {
      try {
        const parsedK = JSON.parse(rawKeyword);
        if (Array.isArray(parsedK)) {
          parsedKeywords = parsedK.map((item: any) =>
            typeof item === 'string' ? item : item.keyword || item.search || ''
          );
        }
      } catch (err) {}
    }

    // 3. Text split by PERIOD (.) or EXCLAMATION (!) or QUESTION (?) or NEWLINES (\n)
    // Does NOT split on commas (,) so speech commas remain intact!
    const narrations: string[] = rawScript
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim().replace(/^["'\-•\d\.\s]+/, ''))
      .filter((s) => s.length > 1);

    const keywords: string[] =
      parsedKeywords.length > 0
        ? parsedKeywords
        : rawKeyword
            .split(/[.\n;]+/)
            .map((k) => k.trim())
            .filter((k) => k.length > 0);

    return { narrations, keywords };
  };

  // Vocab list parser (Separated by dot . or comma , or newlines)
  const parseVocabList = () =>
    vocabInputText
      .split(/[.\n,;]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

  const { narrations: scriptList, keywords: keywordList } = parseScriptAndKeywords();
  const vocabList = parseVocabList();
  const totalCount = activeTab === 'script' ? scriptList.length : vocabList.length;

  // Copy Prompt for ChatGPT / Gemini
  const handleCopyAiPrompt = () => {
    const topic = topicPrompt.trim() || project.topic || 'Chủ đề video';
    const promptText = `Bạn là chuyên gia biên kịch video ngắn triệu view (TikTok/Shorts/Reels).
Hãy viết kịch bản phân cảnh chi tiết, nhịp độ nhanh cuốn hút cho chủ đề: "${topic}".

Yêu cầu:
1. Tạo khoảng 15 đến 25 phân cảnh (khoảng 20 cảnh) liền mạch, hấp dẫn, giữ chân người xem từ đầu đến cuối.
2. Mỗi phân cảnh gồm:
   - "narration": Câu thoại lồng tiếng ngắn gọn, súc tích (1 câu kết thúc bằng dấu chấm).
   - "keyword": Từ khóa ngắn gọn (tiếng Việt hoặc tiếng Anh) để tìm kiếm hình ảnh thực tế chuẩn xác trên Google.

Trả về DUY NHẤT một khối mã JSON chuẩn cú pháp (không kèm lời chào hay giải thích thừa):
{
  "scenes": [
    {
      "narration": "Bún cá cay Hải Phòng là món ăn đặc sản đậm đà nức tiếng đất Cảng.",
      "keyword": "bún cá cay Hải Phòng"
    },
    {
      "narration": "Từng miếng cá rô phi được chiên vàng ươm giòn rụm trong miệng.",
      "keyword": "cá rô phi chiên giòn"
    },
    {
      "narration": "Nước dùng thanh ngọt nấu từ xương cá và cà chua tươi ngon.",
      "keyword": "nước dùng bún cá"
    },
    {
      "narration": "Thưởng thức kèm chả cá thơm lừng cùng rau dọc mùng giòn sần sật.",
      "keyword": "tô bún cá topping đầy đặn"
    }
  ]
}`;

    navigator.clipboard.writeText(promptText);
    setIsCopiedPrompt(true);
    setTimeout(() => setIsCopiedPrompt(false), 2500);
  };

  // Process Batch Import
  const handleProcessBatchImport = async () => {
    if (totalCount === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setProgressText(`Chuẩn bị nạp ${totalCount} phân cảnh...`);

    const newScenes: Scene[] = [];
    const baseOrder = importMode === 'append' ? project.scenes.length : 0;
    const transitionTypes = ['fade', 'zoom_in', 'slide_left'] as const;
    const kenBurnsTypes = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right'] as const;

    let totalAudioDuration = importMode === 'append' ? project.totalDuration : 0;

    for (let i = 0; i < totalCount; i++) {
      let narrationText = '';
      let searchKeyword = '';

      if (activeTab === 'script') {
        narrationText = scriptList[i];
        if (keywordList.length > 0 && i < keywordList.length && keywordList[i]) {
          searchKeyword = keywordList[i];
        } else {
          searchKeyword = narrationText.slice(0, 35);
        }
      } else {
        const word = vocabList[i];
        searchKeyword = word;
        narrationText = sentenceTemplate.replace(/\{word\}/g, word);
      }

      const percent = Math.round(((i + 1) / totalCount) * 100);
      setProgressPercent(percent);
      setProgressText(`Đang xử lý cảnh ${i + 1}/${totalCount}: "${searchKeyword}" (Tìm ảnh & Tạo giọng)...`);

      // A. Edge-TTS Synthesis
      let audioUrl = '';
      let audioDuration = 3.5;
      let wordsTimestamps: Array<{ word: string; start: number; end: number }> = [];

      try {
        const tts = await synthesizeEdgeTTS(
          narrationText,
          project.voice.name || 'google-vi',
          project.voice.rate,
          project.voice.pitch
        );
        if (tts.audioUrl) {
          audioUrl = tts.audioUrl;
          audioDuration = tts.duration;
          wordsTimestamps = tts.words;
        }
      } catch (err) {
        console.warn('TTS error on scene:', narrationText, err);
      }

      // B. Web/Google Image Search
      let mediaUrl = '';
      let mediaType: 'image' | 'video' = 'image';

      try {
        const searchResults = await searchWebMedia(searchKeyword, project.aspectRatio);
        if (searchResults && searchResults.length > 0) {
          mediaUrl = searchResults[0].url || searchResults[0].thumbnail;
          mediaType = searchResults[0].type || 'image';
        } else {
          mediaUrl = generateAiImageUrl(searchKeyword, project.aspectRatio);
        }
      } catch (err) {
        mediaUrl = generateAiImageUrl(searchKeyword, project.aspectRatio);
      }

      totalAudioDuration += audioDuration;

      const motionAnalysis = analyzeSentenceForMotion(narrationText, i, totalCount);

      newScenes.push({
        id: `batch-scene-${Date.now()}-${i}`,
        order: baseOrder + i + 1,
        narration: narrationText,
        searchKeyword,
        mediaType,
        mediaUrl,
        audioUrl,
        audioDuration,
        words: wordsTimestamps,
        transition: motionAnalysis.transition || transitionTypes[i % transitionTypes.length],
        kenBurns: motionAnalysis.kenBurns || kenBurnsTypes[i % kenBurnsTypes.length],
        visualType: motionAnalysis.visualType,
        visualScale: 1.0,
        headerBadge: motionAnalysis.headerBadge,
        orbitTitle: motionAnalysis.orbitTitle,
        orbitIcon: motionAnalysis.orbitIcon,
        chatMessages: motionAnalysis.chatMessages
      });
    }

    // Apply to project
    setProject((prev) => ({
      ...prev,
      scenes: importMode === 'replace' ? newScenes : [...prev.scenes, ...newScenes],
      totalDuration: totalAudioDuration
    }));

    setProgressText(`Đã tạo thành công ${totalCount} phân cảnh kịch bản!`);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
    }, 1200);
  };

  const scriptPresets = [
    {
      title: '🍜 Kịch bản Review Ẩm Thực',
      scripts:
        'Bún cá cay Hải Phòng là món ăn đặc sản nức tiếng đậm đà khó quên. Từng miếng cá rô phi được chiên vàng ươm giòn rụm trong miệng. Nước dùng thanh ngọt nấu từ xương cá và cà chua tươi ngon. Thưởng thức kèm chả cá thơm lừng cùng rau dọc mùng giòn sần sật.',
      keywords: 'bún cá Hải Phòng. cá chiên giòn. nước dùng bún cá. tô bún cá ngon'
    },
    {
      title: '⚡ Kịch bản Tin Tức Công Nghệ',
      scripts:
        'Trí tuệ nhân tạo đang làm thay đổi hoàn toàn cách thế giới vận hành. Các mô hình ngôn ngữ lớn giúp tự động hóa hàng triệu tác vụ phức tạp. Tương lai của loài người sẽ gắn liền với robot thông minh và siêu máy tính lượng tử.',
      keywords: 'artificial intelligence. generative AI technology. future robot computer'
    }
  ];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header - Fixed top */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-600/30">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Nạp Kịch Bản & Phân Cảnh Hàng Loạt</h3>
              <p className="text-xs text-gray-400">
                Phân tách câu thoại bằng dấu chấm (<span className="text-indigo-400 font-mono font-bold">.</span>) hoặc dán trực tiếp mã <span className="text-pink-400 font-mono font-bold">JSON</span>
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-lg font-bold px-2 py-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* AI Prompt Generator Banner - Fixed */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-gray-950 border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="Nhập chủ đề video (ví dụ: Review Quán Bún Cá Cay Hải Phòng)..."
              className="bg-gray-950/80 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-400 flex-1"
            />
          </div>

          <button
            onClick={handleCopyAiPrompt}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-pink-500/20 active:scale-95 transition-all flex-shrink-0"
            title="Copy prompt mẫu chuẩn JSON để dán vào ChatGPT / Gemini"
          >
            {isCopiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Đã Copy Prompt AI!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt cho ChatGPT/Gemini</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Selection - Fixed */}
        <div className="px-5 pt-2 flex items-center gap-2 border-b border-gray-800 bg-gray-950/40 flex-shrink-0">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'script'
                ? 'text-indigo-400 border-indigo-500 bg-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Nạp Kịch Bản Lời Thoại (Ngăn cách bằng dấu chấm . hoặc dán JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'vocab'
                ? 'text-purple-400 border-purple-500 bg-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>2. Nạp Từ Vựng / Flashcard ({vocabList.length} từ)</span>
          </button>
        </div>

        {/* Body Content - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'script' ? (
            /* TAB 1: SCRIPT IMPORT */
            <div className="space-y-4">
              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400">Chọn mẫu kịch bản mẫu nhanh:</label>
                <div className="flex flex-wrap gap-2">
                  {scriptPresets.map((preset) => (
                    <button
                      key={preset.title}
                      onClick={() => {
                        setScriptInputText(preset.scripts);
                        setKeywordInputText(preset.keywords);
                      }}
                      disabled={isProcessing}
                      className="text-xs px-3 py-1.5 rounded-xl bg-gray-800/80 hover:bg-indigo-600/30 text-gray-300 hover:text-white border border-gray-700/60 transition-all"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOX 1: Script Segments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Ô 1: Danh sách câu thoại (ngăn cách bằng dấu chấm . hoặc dán trực tiếp JSON):</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {scriptList.length} phân cảnh chuẩn
                  </span>
                </div>

                <textarea
                  value={scriptInputText}
                  onChange={(e) => setScriptInputText(e.target.value)}
                  disabled={isProcessing}
                  rows={4}
                  placeholder="Dán câu thoại ngăn cách bằng dấu chấm (Câu 1. Câu 2. Câu 3.) hoặc dán thẳng toàn bộ mã JSON từ ChatGPT..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed"
                />
              </div>

              {/* BOX 2: Corresponding Image Keywords */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-pink-400" />
                    <span>Ô 2: Từ khóa tìm ảnh tương ứng cho từng cảnh (ngăn cách bằng dấu chấm .):</span>
                  </label>
                  <span className="text-[11px] text-gray-500">Tự động nhận diện nếu dán JSON ở Ô 1</span>
                </div>

                <textarea
                  value={keywordInputText}
                  onChange={(e) => setKeywordInputText(e.target.value)}
                  disabled={isProcessing}
                  rows={2}
                  placeholder="bún cá Hải Phòng. cá chiên giòn. nước dùng bún cá. tô bún cá ngon..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-sans"
                />
              </div>

              {/* Pair Preview Grid */}
              {scriptList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-gray-400">
                    Xem trước kết quả phân cảnh ({scriptList.length} cảnh):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl bg-gray-950/70 border border-gray-800">
                    {scriptList.map((sc, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-gray-900 border border-gray-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-mono text-[10px] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-gray-200 line-clamp-2">🗣️ {sc}</span>
                        </div>
                        <span className="text-[11px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 flex-shrink-0">
                          🔍 {keywordList[idx] || sc.slice(0, 25)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: VOCABULARY IMPORT */
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Danh sách từ vựng (ngăn cách bằng dấu chấm . hoặc dấu phẩy ,):</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {vocabList.length} từ vựng
                  </span>
                </div>

                <textarea
                  value={vocabInputText}
                  onChange={(e) => setVocabInputText(e.target.value)}
                  disabled={isProcessing}
                  rows={4}
                  placeholder="Huấn hoa hồng. Bác Hồ. xe VinFast. bãi biển Đà Nẵng..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-3.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed"
                />
              </div>

              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                  <span>Mẫu câu đọc thoại:</span>
                </label>
                <select
                  value={sentenceTemplate}
                  onChange={(e) => setSentenceTemplate(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="{word}">Chỉ đọc từ vựng (Ví dụ: "Huấn hoa hồng")</option>
                  <option value="Từ vựng tiếp theo là: {word}">Mẫu học từ: Từ vựng tiếp theo là: [từ vựng]</option>
                  <option value="Khám phá: {word}">Mẫu khám phá: Khám phá: [từ vựng]</option>
                  <option value="Bạn có biết về {word}?">Mẫu câu hỏi: Bạn có biết về [từ vựng]?</option>
                </select>
              </div>
            </div>
          )}

          {/* Import Mode: Replace vs Append */}
          <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Chế độ nạp phân cảnh:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                disabled={isProcessing}
                className={`py-1.5 px-3 rounded-xl border text-center text-xs font-medium transition-all ${
                  importMode === 'replace'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Thay thế toàn bộ
              </button>
              <button
                type="button"
                onClick={() => setImportMode('append')}
                disabled={isProcessing}
                className={`py-1.5 px-3 rounded-xl border text-center text-xs font-medium transition-all ${
                  importMode === 'append'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Nối tiếp thêm vào
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-4 bg-gray-950 rounded-2xl border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{progressText}</span>
                </span>
                <span className="font-mono font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Hủy
          </button>

          <button
            onClick={handleProcessBatchImport}
            disabled={isProcessing || totalCount === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 transition-all glow-primary"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Tự Động Tạo {totalCount} Cảnh...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo {totalCount} Phân Cảnh Tự Động</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
