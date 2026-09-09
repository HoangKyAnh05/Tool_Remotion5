import React, { useState } from 'react';
import { VideoProject, VIETNAMESE_VOICES } from '../types/video';
import { buildMotionScenesFromScript, splitScriptIntoSentences } from '../services/scriptToMotionEngine';
import {
  Mic,
  CheckCircle2,
  Loader2,
  ListPlus,
  FileText,
  Zap,
  Sparkles
} from 'lucide-react';
import { SparkleBadge, WorkflowMode } from './SparkleBadge';

interface ScriptGeneratorProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  apiKeyGemini?: string;
  apiKeyPexels?: string;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  statusText: string;
  setStatusText: (val: string) => void;
  onOpenBatchVocab?: () => void;
  workflowMode: WorkflowMode;
}

const DEFAULT_SCRIPT = `Chào mừng bạn đến với Lá Đỏ Homestay Sa Pa, nơi mây ôm trọn thung lũng Mường Hoa mỗi sớm mai.
Thưởng thức tách cà phê ấm nóng bên ban công lộng gió và hít hà không khí trong lành của núi rừng.
Không gian phòng nghỉ mộc mạc, tiện nghi ấm cúng, mang đến cảm giác an yên như ở chính ngôi nhà của mình.
Lên lịch cho kỳ nghỉ tại Sa Pa ngay hôm nay và nhận trọn vẹn ưu đãi độc quyền từ Lá Đỏ Homestay!`;

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  project,
  setProject,
  isGenerating,
  setIsGenerating,
  statusText,
  setStatusText,
  onOpenBatchVocab,
  workflowMode
}) => {
  // Script input state
  const [userScript, setUserScript] = useState(DEFAULT_SCRIPT);
  const detectedScenesCount = splitScriptIntoSentences(userScript).length;

  // Voice selector state
  const [selectedVoice, setSelectedVoice] = useState(project.voice.name || 'vi-VN-HoaiMyNeural');

  // =========================================================================
  // 1-CLICK WORKFLOW: PASTE SCRIPT -> AUTO MOTION & IMAGE VIDEO (NO MANUAL SELECTION)
  // =========================================================================
  const handleGenerateFromUserScript = async () => {
    if (!userScript.trim()) return;

    setIsGenerating(true);
    setStatusText('Đang phân tích kịch bản & tự động nhận diện Motion Graphic...');

    try {
      const { scenes, totalDuration } = await buildMotionScenesFromScript(userScript, {
        voiceName: selectedVoice,
        voiceRate: project.voice.rate,
        voicePitch: project.voice.pitch,
        aspectRatio: project.aspectRatio,
        onProgress: (text, current, total) => {
          setStatusText(`[${current}/${total}] ${text}`);
        }
      });

      // Lấy câu đầu tiên làm tiêu đề video tóm tắt
      const firstSentence = scenes[0]?.narration || 'Video Motion Graphic';
      const cleanTitle = firstSentence.slice(0, 45) + (firstSentence.length > 45 ? '...' : '');

      setProject((prev) => ({
        ...prev,
        title: cleanTitle,
        topic: cleanTitle,
        voice: {
          ...prev.voice,
          name: selectedVoice
        },
        scenes,
        totalDuration
      }));

      setStatusText(`Hoàn tất! Đã tạo thành công ${scenes.length} phân cảnh Motion Graphic & Ảnh.`);
    } catch (err: any) {
      console.error('Script-to-Motion error:', err);
      setStatusText(`Có lỗi xảy ra: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusText(''), 4000);
    }
  };

  return (
    <div className="bg-gray-900/70 rounded-2xl p-4 sm:p-5 border border-gray-800 glass-panel flex flex-col gap-3.5 shadow-xl">
      {/* Main Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-gray-800 pb-2.5">
        <div className="flex items-center gap-2">
          <SparkleBadge step={1} label="Chọn kịch bản & Giọng đọc" />
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Kịch Bản Video & Giọng Đọc</span>
            <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-400 text-black uppercase tracking-wider">
              1-Click
            </span>
          </div>
        </div>

        {/* Voice Selector Header Compact */}
        <div className="flex items-center gap-2">
          {workflowMode === 'script_voice' && <SparkleBadge step={2} label="Chọn giọng đọc chuẩn tiếng Việt" />}
          <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Giọng đọc:</span>
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-gray-950 border border-gray-700/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-200 focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            {VIETNAMESE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Script Text Input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kịch bản video:</span>
          </span>
        </div>

        {/* Script Textarea */}
        <div className="relative">
          <textarea
            value={userScript}
            onChange={(e) => setUserScript(e.target.value)}
            rows={4}
            className="w-full bg-gray-950/90 border border-indigo-500/30 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono leading-relaxed resize-y"
            placeholder="Dán kịch bản của bạn vào đây (hỗ trợ văn bản tự do, ngắt câu bằng dấu chấm, xuống dòng, hoặc số thứ tự 1. 2. 3.)..."
          />
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-[10.5px] font-bold">
              {detectedScenesCount} câu phân cảnh
            </span>
          </div>
        </div>
      </div>

      {/* Feature Highlights - Compact & Sleek */}
      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-indigo-200">
        <div className="flex items-center gap-2 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
          <span className="text-gray-300">
            Tự động gán <strong className="text-pink-300">Motion Graphics</strong>, <strong className="text-cyan-300">Ảnh/Video nền</strong> & <strong className="text-amber-300">Giọng đọc Edge-TTS</strong> kèm phụ đề Karaoke.
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
        <div className="text-xs text-indigo-300 flex items-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="font-medium animate-pulse">{statusText}</span>
            </>
          ) : statusText ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">{statusText}</span>
            </>
          ) : (
            <span className="text-gray-400 text-[11.5px]">
              Sẵn sàng tạo toàn bộ video với 1 cú click.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenBatchVocab && (
            <button
              onClick={onOpenBatchVocab}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-all active:scale-95"
              title="Nạp nhiều câu kịch bản hoặc danh sách từ vựng từ tệp hoặc dán JSON"
            >
              <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Nạp file</span>
            </button>
          )}

          {/* GIANT 1-CLICK GENERATE BUTTON */}
          <button
            onClick={handleGenerateFromUserScript}
            disabled={isGenerating || !userScript.trim()}
            className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 glow-primary"
          >
            <SparkleBadge step={2} label="Bấm để tự động tạo toàn bộ video" />
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Tạo Toàn Bộ Video...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>TẠO TOÀN BỘ VIDEO TỰ ĐỘNG (1-CLICK)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
