import React from 'react';
import { VideoProject, AspectRatio } from '../types/video';
import {
  Smartphone,
  Tv,
  Film,
  Download,
  Zap,
  Sparkles,
  Mic,
  Scissors,
  Copy,
  FileJson
} from 'lucide-react';
import { WorkflowMode, SparkleBadge } from './SparkleBadge';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings: () => void;
  onOpenRender: () => void;
  onOpenVideoSplitter?: () => void;
  onOpenAiDirector?: (tab?: 'copy_prompt' | 'paste_json' | 'missing_sources') => void;
  isGenerating: boolean;
  activeView: 'editor' | 'roadmap100';
  setActiveView: (view: 'editor' | 'roadmap100') => void;
  workflowMode: WorkflowMode;
  setWorkflowMode: (mode: WorkflowMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  setProject,
  onOpenRender,
  onOpenVideoSplitter,
  onOpenAiDirector,
  isGenerating,
  activeView,
  setActiveView,
  workflowMode,
  setWorkflowMode
}) => {
  const handleRatioChange = (ratio: AspectRatio) => {
    setProject((prev) => ({
      ...prev,
      aspectRatio: ratio
    }));
  };

  const handleTitleChange = (title: string) => {
    setProject((prev) => ({
      ...prev,
      title
    }));
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between z-30 sticky top-0 gap-3 shadow-sm">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-white shadow-sm">
            <Film className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                Studio Marketing
              </span>
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Lá Đỏ Sa Pa
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Biên tập video ngắn đa nền tảng</p>
          </div>
        </div>

      </div>

      {/* Center: Workflow Mode Selector (Clean Tabs) */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <span className="text-[11px] font-semibold text-slate-500 px-2">Quy trình:</span>

        {/* Combo 1: Fast */}
        <button
          onClick={() => setWorkflowMode('fast')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            workflowMode === 'fast'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Quy trình 3 bước: Dán kịch bản -> Tạo toàn bộ -> Xuất Video"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Siêu Tốc (1-3)</span>
        </button>

        {/* Combo 2: Quality */}
        <button
          onClick={() => setWorkflowMode('quality')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            workflowMode === 'quality'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Quy trình 6 bước: Tạo video -> Tinh chỉnh Video/Ảnh -> Chữ 3D -> Thương hiệu -> Xuất"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kỹ Xảo 3D (1-6)</span>
        </button>

        {/* Combo 3: TikTok / CapCut Studio */}
        <button
          onClick={() => setWorkflowMode('tiktok_capcut')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            workflowMode === 'tiktok_capcut'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Quy trình 5 bước: Kịch bản TikTok -> Hiệu ứng chữ CapCut & Sticker -> Bộ lọc màu Cinematic & SFX -> Xuất 9:16"
        >
          <Film className="w-3.5 h-3.5 text-rose-500" />
          <span>TikTok / CapCut (1-5)</span>
        </button>

        {/* Combo 4: Script & Voice */}
        <button
          onClick={() => setWorkflowMode('script_voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            workflowMode === 'script_voice'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Quy trình 5 bước: Kịch bản -> Chọn giọng đọc -> Ghép giọng AI -> Căn nhịp Karaoke -> Xuất"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          <span>Giọng Đọc (1-5)</span>
        </button>

        {/* Combo 5: Split Long Video */}
        <button
          onClick={() => setWorkflowMode('split_long_video')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            workflowMode === 'split_long_video'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
          title="Quy trình 3 bước: Tải video dài -> Tự động chia 5s/10s/15s -> Lồng tiếng & Xuất"
        >
          <Scissors className="w-3.5 h-3.5 text-rose-500" />
          <span>Cắt Video Dài</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Nút Chia Video Dài */}
        {onOpenVideoSplitter && (
          <button
            type="button"
            onClick={onOpenVideoSplitter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all"
            title="Tải video dài lên & tự động chia đoạn"
          >
            {workflowMode === 'split_long_video' && (
              <SparkleBadge step={1} label="Chia Video Dài" />
            )}
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Chia Video Dài</span>
          </button>
        )}

        {/* Aspect Ratio Switch */}
        <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tỷ lệ 9:16 dọc (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tỷ lệ 16:9 ngang (YouTube, Facebook)"
          >
            <Tv className="w-3 h-3" />
            <span>16:9</span>
          </button>
        </div>

        {/* Nút AI Video Planner: Copy Prompt & Dán JSON */}
        {onOpenAiDirector && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenAiDirector('copy_prompt')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Copy Master Prompt AI để gửi ChatGPT / Gemini tạo kịch bản từ source video của bạn"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copy Prompt AI</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAiDirector('paste_json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Dán mã JSON kịch bản do AI xuất ra để tự động tạo phân cảnh Remotion"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dán JSON</span>
            </button>
          </div>
        )}

        {/* Render Video Button */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {workflowMode === 'fast' && (
            <SparkleBadge step={3} label="Xuất Video" />
          )}
          {workflowMode === 'quality' && (
            <SparkleBadge step={6} label="Xuất Video" />
          )}
          {workflowMode === 'tiktok_capcut' && (
            <SparkleBadge step={5} label="Xuất Video" />
          )}
          {workflowMode === 'script_voice' && (
            <SparkleBadge step={5} label="Xuất Video" />
          )}
          {workflowMode === 'split_long_video' && (
            <SparkleBadge step={3} label="Xuất Video" />
          )}
          <Download className="w-4 h-4" />
          <span>Xuất Video</span>
        </button>
      </div>
    </header>
  );
};
