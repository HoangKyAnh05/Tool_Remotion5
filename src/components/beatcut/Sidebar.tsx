import React from 'react';
import { 
  FileAudio, 
  Activity, 
  Bookmark, 
  FileText, 
  Settings2, 
  Sparkles, 
  Clock, 
  Gauge, 
  Sliders, 
  Layers 
} from 'lucide-react';
import { AudioMetadata } from '../../types/beatcut';
import { formatTime, formatFileSize } from '../../utils/beatTime';

export type SidebarTab = 'audio' | 'detection' | 'segments' | 'markers' | 'export' | 'settings';

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  metadata: AudioMetadata | null;
  bpm: number;
  markersCount: number;
  isAnalyzing: boolean;
  onStartAnalysis: () => void;
  onCancelAnalysis: () => void;
  onApplyQuickBeats?: () => void;
  hasAudio: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  metadata,
  bpm,
  markersCount,
  isAnalyzing,
  onStartAnalysis,
  onCancelAnalysis,
  onApplyQuickBeats,
  hasAudio,
}) => {
  const navItems: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'audio', label: 'Âm thanh', icon: <FileAudio className="w-4 h-4" /> },
    { id: 'detection', label: 'Tách nhịp AI', icon: <Activity className="w-4 h-4" /> },
    { id: 'segments', label: 'Đoạn cắt & Giây', icon: <Sliders className="w-4 h-4 text-amber-400" /> },
    { id: 'markers', label: 'Quản lý Markers', icon: <Bookmark className="w-4 h-4 text-cyan-400" /> },
    { id: 'export', label: 'Xuất file', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Cài đặt Engine', icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#141721] border-r border-[#262c3f] flex flex-col justify-between shrink-0 select-none">
      {/* Top Navigation Bar */}
      <div>
        <div className="p-3 border-b border-[#262c3f]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Công cụ làm việc
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-blue-600/15 text-cyan-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1e2d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-cyan-400' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'markers' && markersCount > 0 && (
                    <span className="text-[10px] bg-[#1a1e2d] px-1.5 py-0.5 rounded-full border border-[#262c3f] text-slate-300">
                      {markersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Info Panel */}
        {metadata && (
          <div className="p-4 space-y-3 border-b border-[#262c3f]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Thông số tệp
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {metadata.format.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Thời lượng
                </span>
                <span className="font-mono text-slate-200">{formatTime(metadata.duration)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-500" /> BPM ước tính
                </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {bpm > 0 ? `${bpm} BPM` : 'Chưa phân tích'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Tổng điểm nhịp
                </span>
                <span className="font-mono text-amber-400 font-semibold">{markersCount}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Dung lượng</span>
                <span className="font-mono text-slate-400">{formatFileSize(metadata.size)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: Analyze Beat Button & Apply to AI */}
      <div className="p-3 border-t border-[#262c3f] bg-[#1a1e2d]/40 space-y-2">
        {onApplyQuickBeats && markersCount > 0 && (
          <button
            onClick={onApplyQuickBeats}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs transition shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Nạp toàn bộ mốc nhịp vào Video Splitter để tạo kịch bản/phân cảnh AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>🚀 Nạp Beat Sang AI Splitter</span>
          </button>
        )}

        {isAnalyzing ? (
          <button
            onClick={onCancelAnalysis}
            className="w-full py-2.5 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 animate-spin text-red-400" />
            <span>Hủy phân tích</span>
          </button>
        ) : (
          <button
            onClick={onStartAnalysis}
            disabled={!hasAudio}
            className="w-full py-2.5 px-3 bg-[#1e2436] hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 hover:text-white border border-[#262c3f] font-medium rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Phân tích nhịp lại (AI)</span>
          </button>
        )}
        <p className="text-[10px] text-slate-500 text-center leading-tight">
          AI trích xuất Onset Envelope & Phách 1 chuẩn xác.
        </p>
      </div>
    </aside>
  );
};
