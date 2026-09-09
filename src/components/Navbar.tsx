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
  Scissors
} from 'lucide-react';
import { SparkleBadge, WorkflowMode } from './SparkleBadge';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings: () => void;
  onOpenRender: () => void;
  onOpenVideoSplitter?: () => void;
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

  const finalStepNumber = workflowMode === 'fast' ? 3 : workflowMode === 'quality' ? 6 : workflowMode === 'script_voice' ? 5 : 3;

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-gray-800/80 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-between z-30 sticky top-0 gap-3">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Film className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                Studio Marketing
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Lá Đỏ Sa Pa
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">Biên tập video ngắn đa nền tảng</p>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-800 mx-1 hidden md:block" />

        {/* Project Name editable */}
        <input
          type="text"
          value={project.title}
          title={project.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="bg-gray-800/60 hover:bg-gray-800/90 focus:bg-gray-800 border border-indigo-500/40 focus:border-indigo-400 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-indigo-200 focus:text-white focus:outline-none transition-all w-40 sm:w-56 md:w-64 lg:w-72 max-w-full shadow-inner"
          placeholder="Tên video: VD Săn mây Sa Pa 2N1Đ..."
        />
      </div>

      {/* Center: 4 Workflow Combos with Shiny Badges */}
      <div className="hidden lg:flex items-center gap-1 bg-gray-900/90 p-1 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-950/40">
        <span className="text-[11px] font-bold text-gray-400 px-1.5 flex items-center gap-1">
          <span className="text-amber-400 text-xs">✨</span>
          <span>Combo:</span>
        </span>

        {/* Combo 1: Fast */}
        <button
          onClick={() => setWorkflowMode('fast')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            workflowMode === 'fast'
              ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-md shadow-pink-500/25 scale-105'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Quy trình 3 bước: Dán kịch bản -> 1-Click Tạo Toàn Bộ -> Xuất Video"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ Siêu Tốc (1-3)</span>
        </button>

        {/* Combo 2: Quality */}
        <button
          onClick={() => setWorkflowMode('quality')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            workflowMode === 'quality'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Quy trình 6 bước: Tạo video -> Tinh chỉnh Video/Ảnh -> Chữ 3D/CapCut FX -> Thương hiệu -> Xuất"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>💎 Kỹ Xảo (1-6)</span>
        </button>

        {/* Combo 3: Script & Voice */}
        <button
          onClick={() => setWorkflowMode('script_voice')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            workflowMode === 'script_voice'
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-cyan-500/25 scale-105'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Quy trình 5 bước: Kịch bản -> Chọn giọng đọc -> Ghép giọng AI -> Căn nhịp Karaoke -> Xuất"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-300" />
          <span>🎙️ Giọng Đọc (1-5)</span>
        </button>

        {/* Combo 4: Split Long Video */}
        <button
          onClick={() => setWorkflowMode('split_long_video')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            workflowMode === 'split_long_video'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/25 scale-105'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title="Quy trình 3 bước: Tải video dài -> Tự động chia 5s/10s/15s -> Lồng tiếng & Xuất"
        >
          <Scissors className="w-3.5 h-3.5 text-rose-300" />
          <span>✂️ Cắt Video Dài (1-3)</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Nút Chia Video Dài Thành Video Ngắn (Smart Splitter) */}
        {onOpenVideoSplitter && (
          <button
            type="button"
            onClick={onOpenVideoSplitter}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              workflowMode === 'split_long_video'
                ? 'bg-gradient-to-r from-rose-500/40 to-pink-500/40 text-white border border-rose-400 shadow-md shadow-rose-500/30'
                : 'bg-gray-800/80 hover:bg-gray-800 text-rose-300 hover:text-white border border-rose-500/30'
            }`}
            title="Tải video dài lên & tự động chia 5s, 10s, 15s kèm tính năng co ngắn đoạn thừa"
          >
            {workflowMode === 'split_long_video' && (
              <SparkleBadge step={1} label="Bấm để tải video dài & tự động chia" />
            )}
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Chia Video Dài</span>
          </button>
        )}

        {/* Aspect Ratio Switch */}
        <div className="bg-gray-900/90 p-0.5 sm:p-1 rounded-xl border border-gray-800 flex items-center shadow-inner">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Tỷ lệ 9:16 dọc (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3 h-3" />
            <span>9:16</span>
          </button>
          <button
            onClick={() => handleRatioChange('16:9')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              project.aspectRatio === '16:9'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Tỷ lệ 16:9 ngang (YouTube, Facebook)"
          >
            <Tv className="w-3 h-3" />
            <span>16:9</span>
          </button>
        </div>

        {/* View Switcher */}
        <div className="bg-gray-900/90 p-0.5 sm:p-1 rounded-xl border border-gray-800 flex items-center shadow-inner hidden md:flex">
          <button
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              activeView === 'editor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Giao diện Studio biên tập Video"
          >
            <Film className="w-3 h-3" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveView('roadmap100')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              activeView === 'roadmap100'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Lộ trình sáng tạo nội dung 100 ngày"
          >
            <span>Lộ trình</span>
          </button>
        </div>

        {/* Render Video Button (Final Step Badge) */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          <SparkleBadge step={finalStepNumber} label="Xuất Video Hoàn Chỉnh" />
          <Download className="w-4 h-4" />
          <span>Xuất Video</span>
        </button>
      </div>
    </header>
  );
};
