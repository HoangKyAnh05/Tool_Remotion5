import React from 'react';
import { 
  Music, 
  FolderOpen, 
  Save, 
  Download, 
  Settings, 
  Upload, 
  Activity, 
  CheckCircle2, 
  Scissors,
  Bookmark,
  X
} from 'lucide-react';
import { EngineStatus, ProgressEvent } from '../../types/beatcut';

interface TopBarProps {
  onImportAudio: () => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onOpenMarkers: () => void;
  onOpenSegments: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onApplyQuickBeats?: () => void;
  onCloseStudio?: () => void;
  engineStatus: EngineStatus | null;
  isAnalyzing: boolean;
  progress: ProgressEvent | null;
  hasAudio: boolean;
  projectName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onImportAudio,
  onOpenProject,
  onSaveProject,
  onOpenMarkers,
  onOpenSegments,
  onOpenExport,
  onOpenSettings,
  onApplyQuickBeats,
  onCloseStudio,
  engineStatus,
  isAnalyzing,
  progress,
  hasAudio,
  projectName,
}) => {
  return (
    <header className="h-14 bg-[#141721] border-b border-[#262c3f] px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-lg">
          <div className="relative flex items-center justify-center w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-sm shadow-blue-500/30">
            <Music className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              BEATCUT<span className="text-cyan-400 font-normal ml-1 text-xs">STUDIO</span>
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#262c3f] mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tệp:</span>
          <span className="text-xs font-semibold text-slate-200 bg-[#1a1e2d] px-2.5 py-1 rounded border border-[#262c3f]/60 max-w-[180px] truncate">
            {projectName || 'Chưa đặt tên'}
          </span>
        </div>
      </div>

      {/* Center Status / Progress Indicator */}
      <div className="flex items-center">
        {isAnalyzing ? (
          <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full animate-pulse">
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-cyan-300 font-medium">
              {progress ? `${progress.message} (${progress.percent}%)` : 'Đang xử lý nhịp...'}
            </span>
          </div>
        ) : hasAudio ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Sẵn sàng dựng nhịp</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Chưa tải file âm thanh</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onImportAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm shadow-blue-600/20 cursor-pointer"
          title="Nhập file âm thanh (MP3, WAV, FLAC, M4A)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Thêm nhạc</span>
        </button>

        <button
          onClick={onOpenProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1e2d] hover:bg-slate-700 text-slate-300 hover:text-white border border-[#262c3f] rounded-lg text-xs font-medium transition cursor-pointer"
          title="Mở dự án đã lưu (.beatcut)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Mở</span>
        </button>

        <button
          onClick={onSaveProject}
          disabled={!hasAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1e2d] hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white border border-[#262c3f] rounded-lg text-xs font-medium transition cursor-pointer"
          title="Lưu dự án hiện tại"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Lưu</span>
        </button>

        {/* Nút Quản lý Marker */}
        <button
          onClick={onOpenMarkers}
          disabled={!hasAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-40 disabled:pointer-events-none text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-medium transition shadow-sm cursor-pointer"
          title="Quản lý danh sách Marker & Tích chọn sinh dãy số ngắt đoạn từ giây đầu"
        >
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quản lý Marker</span>
        </button>

        <button
          onClick={onOpenSegments}
          disabled={!hasAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 disabled:pointer-events-none text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-lg text-xs font-medium transition shadow-sm cursor-pointer"
          title="Xem dãy ngắt đoạn 00-12.85, 12.85-30.01 và danh sách giây từng chấm"
        >
          <Scissors className="w-3.5 h-3.5 text-amber-400" />
          <span>Dãy ngắt đoạn</span>
        </button>

        <button
          onClick={onOpenExport}
          disabled={!hasAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1e2d] hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Xuất dữ liệu timestamp (TXT, CSV, JSON)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất dữ liệu</span>
        </button>

        {onApplyQuickBeats && hasAudio && (
          <button
            onClick={onApplyQuickBeats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 transition active:scale-95 cursor-pointer animate-pulse"
            title="Nạp mốc nhịp bass vào Video Splitter & AI Gen để tự động tạo phân cảnh video khớp beat"
          >
            <Scissors className="w-3.5 h-3.5 text-yellow-300" />
            <span>🚀 Nạp Mốc Beat Sang AI</span>
          </button>
        )}

        <div className="h-4 w-px bg-[#262c3f] mx-1" />

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition relative cursor-pointer"
          title="Cài đặt hệ thống & Audio Engine"
        >
          <Settings className="w-4 h-4" />
          {engineStatus && !engineStatus.ready && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-900" />
          )}
        </button>

        {onCloseStudio && (
          <button
            onClick={onCloseStudio}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-lg transition cursor-pointer ml-1"
            title="Đóng BeatCut Studio"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
};
