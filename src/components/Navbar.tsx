import React from 'react';
import { VideoProject, AspectRatio } from '../types/video';
import {
  Smartphone,
  Tv,
  Film,
  Download,
  Scissors,
  Copy,
  FileJson,
  RotateCcw,
  Settings,
  Activity
} from 'lucide-react';
import { WorkflowMode } from './SparkleBadge';

interface NavbarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenSettings?: () => void;
  onOpenRender: () => void;
  onOpenVideoSplitter?: () => void;
  onOpenBeatCut?: () => void;
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
  onOpenSettings,
  onOpenRender,
  onOpenVideoSplitter,
  onOpenBeatCut,
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

  const handleRestartApp = async () => {
    if (window.confirm('🔄 Bạn có chắc chắn muốn khởi động lại ứng dụng không?')) {
      try {
        if (window.electronAPI?.restartApp) {
          await window.electronAPI.restartApp();
        } else if (window.electronAPI?.reloadApp) {
          await window.electronAPI.reloadApp();
        } else {
          window.location.reload();
        }
      } catch (err) {
        window.location.reload();
      }
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between z-30 sticky top-0 gap-3 shadow-sm">
      {/* Brand logo & Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                Studio Marketing AI
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Lá Đỏ Sa Pa
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Biên tập video & lồng tiếng thông minh</p>
          </div>
        </div>
      </div>

      {/* Center: Clean Stats Info */}
      <div className="hidden md:flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 shadow-xs">
        <span className="font-semibold text-slate-800">{project.scenes.length} phân cảnh</span>
        <span className="text-slate-300">•</span>
        <span className="font-medium text-slate-600">{project.totalDuration.toFixed(1)}s thời lượng</span>
        {(project.timelineSfx || []).length > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-600 font-semibold">{(project.timelineSfx || []).length} SFX</span>
          </>
        )}
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Aspect Ratio Selector (9:16 vs 16:9) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => handleRatioChange('9:16')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              project.aspectRatio === '9:16'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tỷ lệ 9:16 dọc (TikTok, Reels, Shorts)"
          >
            <Smartphone className="w-3.5 h-3.5" />
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
            <Tv className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>
        </div>

        {/* Nút Tách Beat Nhạc AI (BeatCut Studio) */}
        {onOpenBeatCut && (
          <button
            onClick={onOpenBeatCut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Tách phách nhịp nhạc AI & Tự động sinh dãy số ngắt đoạn từ giây đầu (00 -12.85, 12.85-30.01)"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
            <span>Tách Beat AI</span>
          </button>
        )}

        {/* Nút Cắt Video Dài Thô */}
        {onOpenVideoSplitter && (
          <button
            onClick={onOpenVideoSplitter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Cắt video nguồn dài thành các đoạn nhỏ"
          >
            <Scissors className="w-3.5 h-3.5 text-rose-500" />
            <span>Cắt Source</span>
          </button>
        )}

        {/* Nút AI Video Planner: Copy Prompt & Dán JSON */}
        {onOpenAiDirector && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenAiDirector('copy_prompt')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Copy Master Prompt AI để gửi ChatGPT / Gemini tạo kịch bản từ source video của bạn"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prompt AI</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAiDirector('paste_json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Dán mã JSON kịch bản do AI xuất ra để tự động tạo phân cảnh Remotion"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dán JSON</span>
            </button>
          </div>
        )}

        {/* Nút Khởi Động Lại App (Restart App) */}
        <button
          type="button"
          onClick={handleRestartApp}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Khởi động lại ứng dụng (Restart App)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Restart</span>
        </button>

        {/* Nút Cài đặt (Settings) */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 cursor-pointer"
            title="Cấu hình & API Key"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Render Video Button */}
        <button
          onClick={onOpenRender}
          disabled={isGenerating || project.scenes.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Video</span>
        </button>
      </div>
    </header>
  );
};
