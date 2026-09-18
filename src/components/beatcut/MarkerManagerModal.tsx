import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Play, 
  Tag, 
  Search, 
  Filter, 
  AlertCircle,
  CheckSquare,
  Square,
  Copy,
  Check,
  Sparkles,
  Scissors,
  CheckCheck
} from 'lucide-react';
import { BeatMarker, MarkerType } from '../../types/beatcut';
import { formatTime } from '../../utils/beatTime';

interface MarkerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  markers: BeatMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string) => void;
  onDeleteMarker: (id: string) => void;
  onClearAllMarkers: () => void;
  onUpdateMarker: (id: string, updates: Partial<BeatMarker>) => void;
  onSeek: (time: number) => void;
  audioUrl?: string;
  onApplyToVideoSplitter?: (splitString: string, audioUrl?: string) => void;
  onApplyToStoryboard?: (splitString: string, audioUrl?: string) => void;
}

export const MarkerManagerModal: React.FC<MarkerManagerModalProps> = ({
  isOpen,
  onClose,
  markers,
  selectedMarkerId,
  onSelectMarker,
  onDeleteMarker,
  onClearAllMarkers,
  onUpdateMarker,
  onSeek,
  audioUrl,
  onApplyToVideoSplitter,
  onApplyToStoryboard,
}) => {
  // Mặc định filter là 'strong_beat' theo nhu cầu người dùng ưu tiên nhịp mạnh
  const [filterType, setFilterType] = useState<string>('strong_beat');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Lọc danh sách marker
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      const matchesType = filterType === 'all' || m.type === filterType;
      const matchesSearch =
        !searchQuery ||
        (m.label && m.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
        formatTime(m.time).includes(searchQuery) ||
        m.time.toString().includes(searchQuery);
      return matchesType && matchesSearch;
    });
  }, [markers, filterType, searchQuery]);

  // Tạo dãy số tách đoạn từ 00 theo các marker đã tích chọn
  // Ví dụ: tích 12.85 và 30.01 -> "00 -12.85, 12.85-30.01"
  const generatedSplitSequence = useMemo(() => {
    if (selectedMarkerIds.size === 0) return '';

    // Lấy các marker được tích và sắp xếp theo thời gian tăng dần
    const checkedMarkers = markers
      .filter((m) => selectedMarkerIds.has(m.id))
      .sort((a, b) => a.time - b.time);

    if (checkedMarkers.length === 0) return '';

    const segments: string[] = [];
    let prevPointStr = '00';

    checkedMarkers.forEach((marker) => {
      const curPointStr = marker.time.toFixed(2);
      segments.push(`${prevPointStr} -${curPointStr}`);
      prevPointStr = curPointStr;
    });

    return segments.join(', ');
  }, [markers, selectedMarkerIds]);

  // Tự động copy vào clipboard khi dãy số sinh ra thay đổi (nếu có lựa chọn)
  const handleToggleMarkerCheck = (id: string, time: number) => {
    const nextSet = new Set(selectedMarkerIds);
    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }
    setSelectedMarkerIds(nextSet);

    // Tính toán tức thì chuỗi sinh ra và ghi vào Clipboard
    const checkedMarkers = markers
      .filter((m) => nextSet.has(m.id))
      .sort((a, b) => a.time - b.time);

    if (checkedMarkers.length > 0) {
      const segments: string[] = [];
      let prevPointStr = '00';
      checkedMarkers.forEach((m) => {
        const curPointStr = m.time.toFixed(2);
        segments.push(`${prevPointStr} -${curPointStr}`);
        prevPointStr = curPointStr;
      });
      const resultText = segments.join(', ');

      if (navigator.clipboard) {
        navigator.clipboard.writeText(resultText);
        setCopiedNotification(resultText);
        setTimeout(() => setCopiedNotification(null), 3000);
      }
    } else {
      setCopiedNotification(null);
    }
  };

  // Tích chọn toàn bộ Nhịp mạnh (strong_beat)
  const handleSelectAllStrongBeats = () => {
    const strongBeats = markers.filter((m) => m.type === 'strong_beat');
    const newSet = new Set(strongBeats.map((m) => m.id));
    setSelectedMarkerIds(newSet);

    if (strongBeats.length > 0) {
      const segments: string[] = [];
      let prevPointStr = '00';
      strongBeats.sort((a, b) => a.time - b.time).forEach((m) => {
        const curPointStr = m.time.toFixed(2);
        segments.push(`${prevPointStr} -${curPointStr}`);
        prevPointStr = curPointStr;
      });
      const resultText = segments.join(', ');
      navigator.clipboard.writeText(resultText);
      setCopiedNotification(resultText);
      setTimeout(() => setCopiedNotification(null), 3500);
    }
  };

  // Tích chọn tất cả các marker đang hiển thị
  const handleSelectAllFiltered = () => {
    const newSet = new Set(selectedMarkerIds);
    filteredMarkers.forEach((m) => newSet.add(m.id));
    setSelectedMarkerIds(newSet);

    const checkedMarkers = markers
      .filter((m) => newSet.has(m.id))
      .sort((a, b) => a.time - b.time);

    if (checkedMarkers.length > 0) {
      const segments: string[] = [];
      let prevPointStr = '00';
      checkedMarkers.forEach((m) => {
        const curPointStr = m.time.toFixed(2);
        segments.push(`${prevPointStr} -${curPointStr}`);
        prevPointStr = curPointStr;
      });
      const resultText = segments.join(', ');
      navigator.clipboard.writeText(resultText);
      setCopiedNotification(resultText);
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  // Bỏ chọn toàn bộ
  const handleClearSelection = () => {
    setSelectedMarkerIds(new Set());
    setCopiedNotification(null);
  };

  // Thủ công bấm Copy
  const handleManualCopy = () => {
    if (!generatedSplitSequence) return;
    navigator.clipboard.writeText(generatedSplitSequence);
    setCopiedNotification(generatedSplitSequence);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141721] border border-[#262c3f] rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#262c3f] flex items-center justify-between bg-[#1a1e2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-cyan-400 rounded-lg border border-blue-500/30">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                <span>Quản lý danh sách Marker ({markers.length})</span>
                {selectedMarkerIds.size > 0 && (
                  <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Đã tích {selectedMarkerIds.size} mốc
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Tích chọn các đoạn phách để tự sinh dãy số ngắt đoạn từ giây đầu (00 -12.85, 12.85-30.01) vào Clipboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh Banner Tự Động Sinh Dãy Số Tách Đoạn & Clipboard */}
        <div className="p-3 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-b border-[#262c3f] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Dãy số tách đoạn tự động từ giây đầu (00):</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {generatedSplitSequence && (
                <button
                  onClick={handleManualCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                  title="Sao chép dãy số vào Clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sao chép</span>
                </button>
              )}

              {onApplyToStoryboard && generatedSplitSequence && (
                <button
                  onClick={() => {
                    onApplyToStoryboard(generatedSplitSequence, audioUrl);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
                  title="Tạo trực tiếp các phân cảnh Storyboard trong Studio theo các mốc giây này"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>🎵 Nạp Vào Storyboard</span>
                </button>
              )}

              {onApplyToVideoSplitter && generatedSplitSequence && (
                <button
                  onClick={() => {
                    onApplyToVideoSplitter(generatedSplitSequence, audioUrl);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
                  title="Nạp dãy số vào các mốc thời gian Video Splitter & AI Gen để tự động tạo kịch bản/phân cảnh khớp beat"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>🚀 Nạp Vào Mốc Thời Gian & Tạo Phân Cảnh AI</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-[#0c0d12]/90 rounded-xl border border-cyan-500/30 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-2 min-h-[38px]">
            <span className={generatedSplitSequence ? 'text-cyan-300 font-bold' : 'text-slate-500 italic font-sans'}>
              {generatedSplitSequence || 'Hãy tích chọn ít nhất 1 mốc marker bên dưới để tự sinh dãy số ngắt đoạn (ví dụ: 00 -12.85, 12.85-30.01)...'}
            </span>
            {generatedSplitSequence && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                Đã sẵn sàng Clipboard
              </span>
            )}
          </div>

          {copiedNotification && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40 animate-in fade-in">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">
                Đã tự động sao chép dãy số vào Clipboard: <strong className="font-mono text-white">{copiedNotification}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-[#1a1e2d]/60 border-b border-[#262c3f] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm marker hoặc giây..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#141721] border border-[#262c3f] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-[#141721] border border-[#262c3f] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="strong_beat">🔴 Chỉ Nhịp mạnh ({markers.filter(m => m.type === 'strong_beat').length})</option>
                <option value="all">Tất cả loại ({markers.length})</option>
                <option value="beat">🟡 Nhịp chuẩn ({markers.filter(m => m.type === 'beat').length})</option>
                <option value="custom">🟣 Thủ công ({markers.filter(m => m.type === 'custom').length})</option>
                <option value="transition">🔵 Chuyển đoạn ({markers.filter(m => m.type === 'transition').length})</option>
              </select>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSelectAllStrongBeats}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg transition font-medium text-xs active:scale-95"
              title="Tích chọn tự động toàn bộ phách 1 nhịp mạnh của bài hát"
            >
              <CheckCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Tích toàn bộ Nhịp mạnh</span>
            </button>

            <button
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 rounded-lg transition font-medium text-xs active:scale-95"
              title="Tích chọn toàn bộ marker đang hiển thị trong danh sách"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chọn tất cả</span>
            </button>

            {selectedMarkerIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition font-medium text-xs active:scale-95"
                title="Bỏ chọn toàn bộ marker"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Bỏ chọn ({selectedMarkerIds.size})</span>
              </button>
            )}

            {markers.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ markers không?')) {
                    onClearAllMarkers();
                    setSelectedMarkerIds(new Set());
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition text-xs"
                title="Xóa toàn bộ marker"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {/* Marker List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-[#262c3f]/40 max-h-[50vh]">
          {filteredMarkers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <AlertCircle className="w-6 h-6 text-slate-600" />
              <span>Không tìm thấy marker nào phù hợp với bộ lọc</span>
            </div>
          ) : (
            filteredMarkers.map((marker, idx) => {
              const isSelected = selectedMarkerId === marker.id;
              const isChecked = selectedMarkerIds.has(marker.id);

              return (
                <div
                  key={marker.id}
                  className={`pt-1.5 first:pt-0 flex items-center justify-between gap-2.5 p-2 rounded-xl transition ${
                    isChecked
                      ? 'bg-blue-900/25 border border-cyan-500/40 shadow-sm'
                      : isSelected
                      ? 'bg-slate-800/80 border border-slate-700'
                      : 'hover:bg-[#1a1e2d]/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox Tích Chọn Marker */}
                    <button
                      type="button"
                      onClick={() => handleToggleMarkerCheck(marker.id, marker.time)}
                      className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                        isChecked
                          ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-500/60'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-[#262c3f]'
                      }`}
                      title={isChecked ? 'Bỏ tích marker này' : 'Tích chọn marker này để sinh dãy số tách đoạn'}
                    >
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    <span className="text-[11px] font-mono text-slate-500 w-6 text-right">
                      #{idx + 1}
                    </span>

                    {/* Button Play & Seek */}
                    <button
                      onClick={() => {
                        onSelectMarker(marker.id);
                        onSeek(marker.time);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1e2d] hover:bg-blue-600 hover:text-white rounded-lg border border-[#262c3f] text-xs font-mono text-cyan-300 transition cursor-pointer"
                      title="Nhảy tới vị trí giây này để nghe thử"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{formatTime(marker.time)}</span>
                      <span className="text-[10px] text-slate-400">({marker.time.toFixed(2)}s)</span>
                    </button>

                    {/* Marker Type Selector */}
                    <select
                      value={marker.type}
                      onChange={(e) => onUpdateMarker(marker.id, { type: e.target.value as MarkerType })}
                      className="bg-[#141721] border border-[#262c3f] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="strong_beat">🔴 Nhịp mạnh</option>
                      <option value="beat">🟡 Nhịp chuẩn</option>
                      <option value="transition">🔵 Chuyển đoạn</option>
                      <option value="custom">🟣 Thủ công</option>
                    </select>

                    {/* Marker Label Input */}
                    <input
                      type="text"
                      placeholder="Ghi chú / Nhãn..."
                      value={marker.label || ''}
                      onChange={(e) => onUpdateMarker(marker.id, { label: e.target.value })}
                      className="bg-[#141721] border border-[#262c3f] rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 w-32 sm:w-40 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      Độ mạnh: {Math.round(marker.strength * 100)}%
                    </span>

                    <span className="text-[10px] text-slate-400 uppercase font-semibold px-2 py-0.5 bg-[#141721] border border-[#262c3f] rounded-md">
                      {marker.source === 'auto' ? 'AI' : 'Tay'}
                    </span>

                    <button
                      onClick={() => onDeleteMarker(marker.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Xóa marker này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1a1e2d] border-t border-[#262c3f] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Đang hiển thị: <strong className="text-slate-200">{filteredMarkers.length}</strong> / {markers.length} markers</span>
            {selectedMarkerIds.size > 0 && (
              <span className="text-cyan-300 font-semibold">• Đã tích {selectedMarkerIds.size} mốc</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {generatedSplitSequence && (
              <button
                onClick={handleManualCopy}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép Dãy số ({selectedMarkerIds.size} mốc)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition border border-slate-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
