import React, { useState } from 'react';
import { VideoProject, VIETNAMESE_VOICES } from '../types/video';
import { buildMotionScenesFromScript, splitScriptIntoSentences } from '../services/scriptToMotionEngine';
import {
  Mic,
  CheckCircle2,
  Loader2,
  FileText,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { WorkflowMode } from './SparkleBadge';

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
  onOpenVideoSplitter?: () => void;
  workflowMode: WorkflowMode;
}

const DEFAULT_SCRIPT = '';

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  project,
  setProject,
  isGenerating,
  setIsGenerating,
  statusText,
  setStatusText,
  onOpenBatchVocab,
  onOpenVideoSplitter,
  workflowMode
}) => {
  const [userScript, setUserScript] = useState(DEFAULT_SCRIPT);
  const detectedScenesCount = splitScriptIntoSentences(userScript).length;
  const currentVoice = project.voice?.name || 'vi-VN-NamMinhNeural';

  const handleVoiceChange = (newVoice: string) => {
    setProject((prev) => ({
      ...prev,
      voice: {
        ...prev.voice,
        name: newVoice
      }
    }));
  };

  const handleGenerateFromUserScript = async () => {
    if (!userScript.trim()) return;

    setIsGenerating(true);
    setStatusText('Đang phân tích kịch bản & tự động nhận diện phân cảnh...');

    try {
      const { scenes, totalDuration } = await buildMotionScenesFromScript(userScript, {
        voiceName: currentVoice,
        voiceRate: project.voice.rate,
        voicePitch: project.voice.pitch,
        aspectRatio: project.aspectRatio,
        onProgress: (text, current, total) => {
          setStatusText(`[${current}/${total}] ${text}`);
        }
      });

      const firstSentence = scenes[0]?.narration || 'Video Giới Thiệu Homestay';
      const cleanTitle = firstSentence.slice(0, 45) + (firstSentence.length > 45 ? '...' : '');

      setProject((prev) => ({
        ...prev,
        title: cleanTitle,
        topic: cleanTitle,
        voice: {
          ...prev.voice,
          name: currentVoice
        },
        scenes,
        totalDuration
      }));

      setStatusText(`Hoàn tất! Đã tạo ${scenes.length} phân cảnh thành công.`);
    } catch (err: any) {
      console.error('Script-to-Motion error:', err);
      setStatusText(`Có lỗi xảy ra: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusText(''), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
      {/* Header with Title & Voice Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
          <h3 className="text-xs font-bold text-slate-900 tracking-wide">
            Kịch Bản & Lồng Tiếng AI
          </h3>
        </div>

        {/* Voice Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>Giọng đọc:</span>
          </label>
          <select
            value={currentVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer max-w-[210px] sm:max-w-[270px] truncate"
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
        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Nội dung kịch bản:</span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {detectedScenesCount} câu phân cảnh
          </span>
        </div>

        {/* Script Textarea */}
        <textarea
          value={userScript}
          onChange={(e) => setUserScript(e.target.value)}
          rows={4}
          className="w-full bg-slate-50/70 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-sans leading-relaxed resize-y"
          placeholder="Nhập hoặc dán nội dung kịch bản video tại đây..."
        />
      </div>

      {/* Helper description */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
        <span>Tự động phân đoạn video, ghép giọng đọc AI chuẩn và tạo phụ đề chuyển động.</span>
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span className="font-medium text-slate-700">{statusText}</span>
            </>
          ) : statusText ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">{statusText}</span>
            </>
          ) : (
            <span className="text-slate-400 text-[11px]">Sẵn sàng tạo video</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenVideoSplitter && (
            <button
              type="button"
              onClick={onOpenVideoSplitter}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Quét thư mục Google Drive chứa video homestay & tự động tải chia đoạn"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>Quét Drive / Cắt Video</span>
            </button>
          )}

          {/* Clean Primary Generate Button */}
          <button
            onClick={handleGenerateFromUserScript}
            disabled={isGenerating || !userScript.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tạo Video Từ Kịch Bản</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
