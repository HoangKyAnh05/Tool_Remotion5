import React, { useState, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Music,
  Sliders,
  Clock,
  Layers,
  HelpCircle,
  FolderOpen,
  Upload,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { VideoProject, TimelineSfxItem } from '../types/video';
import { SOUND_EFFECTS_LIST, SoundEffectItem } from '../services/soundEffectsService';
import { convertAudioOrVideoFileToAudio, extractAudioFromVideoData } from '../services/speechToTextService';

interface CustomSfxItem {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  category: 'custom';
  description?: string;
}

interface SfxTimelineManagerProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export const SfxTimelineManager: React.FC<SfxTimelineManagerProps> = ({
  project,
  setProject,
  currentTime = 0,
  onSeek
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [customSfxList, setCustomSfxList] = useState<CustomSfxItem[]>([]);
  const sfxFileInputRef = useRef<HTMLInputElement>(null);

  const totalDuration = Math.max(project.totalDuration || 10, 1);
  const timelineSfxList = project.timelineSfx || [];

  const categories = [
    { id: 'all', name: 'Tất cả' },
    ...(customSfxList.length > 0 ? [{ id: 'custom', name: `📁 Từ PC (${customSfxList.length})` }] : []),
    { id: 'transitions_whoosh', name: '🌪️ Vụt Gió (Whoosh)' },
    { id: 'pops_clicks', name: '✨ Pops & Clicks' },
    { id: 'impacts_boom', name: '💥 Nổ Bùng (Boom)' },
    { id: 'notifications_money', name: '💰 Tiền & Chuông' },
    { id: 'meme_funny', name: '🤪 Meme Hài Hước' },
    { id: 'cinematic', name: '🎬 Bom Tấn' }
  ];

  // Kết hợp thư viện mặc định + các file Sound Effect tải từ máy
  const combinedEffects: Array<SoundEffectItem | CustomSfxItem> = [
    ...customSfxList,
    ...SOUND_EFFECTS_LIST
  ];

  const filteredEffects = combinedEffects.filter((sfx) => {
    const matchCat = selectedCategory === 'all' || sfx.category === selectedCategory;
    const matchQuery =
      searchQuery === '' ||
      sfx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((sfx as any).description && (sfx as any).description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  // Nghe thử âm thanh
  const handlePreviewSfx = (sfx: SoundEffectItem | CustomSfxItem) => {
    setPlayingSfxId(sfx.id);
    try {
      if ('play' in sfx && typeof (sfx as any).play === 'function') {
        (sfx as any).play();
      } else if ('audioUrl' in sfx && (sfx as any).audioUrl) {
        const audio = new Audio((sfx as any).audioUrl);
        audio.play();
      }
    } catch (e) {
      console.warn('Preview SFX error', e);
    }
    setTimeout(() => {
      setPlayingSfxId(null);
    }, (sfx.duration || 0.5) * 1000);
  };

  // Thêm SFX vào timeline tại vị trí con trỏ hiện tại
  const handleAddSfxToTimeline = (sfx: SoundEffectItem | CustomSfxItem, targetTime?: number) => {
    const atTime = typeof targetTime === 'number' ? targetTime : Number(currentTime.toFixed(2));
    const sfxAudioUrl = 'audioUrl' in sfx ? (sfx as any).audioUrl : undefined;

    const newItem: TimelineSfxItem = {
      id: `sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sfxId: sfx.id,
      name: sfx.name,
      timestamp: Math.min(totalDuration, Math.max(0, atTime)),
      duration: sfx.duration || 0.5,
      volume: 0.8,
      category: sfx.category,
      audioUrl: sfxAudioUrl
    };

    setProject((prev) => ({
      ...prev,
      timelineSfx: [...(prev.timelineSfx || []), newItem].sort((a, b) => a.timestamp - b.timestamp)
    }));

    // Tự động phát âm thanh khi thêm
    try {
      if ('play' in sfx && typeof (sfx as any).play === 'function') {
        (sfx as any).play();
      } else if (sfxAudioUrl) {
        const audio = new Audio(sfxAudioUrl);
        audio.play();
      }
    } catch {}
  };

  // Lưu và gắn file SFX từ máy tính lên Timeline
  const saveAndAttachCustomSfx = (name: string, url: string, duration: number) => {
    const cleanName = name.replace(/\.[^/.]+$/, '');
    const customItem: CustomSfxItem = {
      id: `custom-sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `📁 ${cleanName}`,
      audioUrl: url,
      duration: duration || 1.0,
      category: 'custom',
      description: 'File âm thanh Sound Effect tải lên từ máy tính'
    };

    setCustomSfxList((prev) => [customItem, ...prev]);

    // Gắn ngay vào mốc thời gian đang Preview
    const atTime = Number(currentTime.toFixed(2));
    const newTimelineItem: TimelineSfxItem = {
      id: `sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sfxId: customItem.id,
      name: customItem.name,
      timestamp: Math.min(totalDuration, Math.max(0, atTime)),
      duration: customItem.duration,
      volume: 0.8,
      category: 'custom',
      audioUrl: url
    };

    setProject((prev) => ({
      ...prev,
      timelineSfx: [...(prev.timelineSfx || []), newTimelineItem].sort((a, b) => a.timestamp - b.timestamp)
    }));

    // Phát thử âm thanh
    try {
      const audio = new Audio(url);
      audio.play();
    } catch {}
  };

  // Xử lý chọn file từ máy tính
  const handleSelectCustomSfxFromPC = async () => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file âm thanh MP3 hoặc video MP4 từ máy tính (.mp3, .wav, .m4a, .mp4, .mov)',
          filters: [
            { name: 'Audio & Video Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'mp4', 'mov', 'webm', 'mkv'] },
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] },
            { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const fileName = filePath.split(/[\\/]/).pop() || 'Sound Effect';
          const isVideo = /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(filePath);

          if (isVideo) {
            let base64Info = null;
            if (window.electronAPI?.readAudioBase64) {
              base64Info = await window.electronAPI.readAudioBase64(filePath);
            }
            if (base64Info?.dataUrl) {
              const extracted = await extractAudioFromVideoData(base64Info.dataUrl);
              if (extracted) {
                saveAndAttachCustomSfx(fileName, extracted.dataUrl, extracted.duration || 1.0);
                return;
              }
            }
          }

          const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
          const tempAudio = new Audio(fileUrl);
          tempAudio.onloadedmetadata = () => {
            const dur = Number(tempAudio.duration.toFixed(2)) || 1.0;
            saveAndAttachCustomSfx(fileName, fileUrl, dur);
          };
          tempAudio.onerror = () => {
            saveAndAttachCustomSfx(fileName, fileUrl, 1.0);
          };
          return;
        }
      } catch (err) {
        console.warn('Electron SFX select failed, falling back to browser input:', err);
      }
    }

    if (sfxFileInputRef.current) {
      sfxFileInputRef.current.value = '';
      sfxFileInputRef.current.click();
    }
  };

  const handleBrowserFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await convertAudioOrVideoFileToAudio(file);
      saveAndAttachCustomSfx(result.fileName, result.audioUrl, result.duration || 1.0);
    } catch (err) {
      console.warn('SFX file extraction error, fallback to URL:', err);
      const fileUrl = URL.createObjectURL(file);
      saveAndAttachCustomSfx(file.name, fileUrl, 1.0);
    }
  };

  // Xóa SFX khỏi timeline
  const handleDeleteTimelineSfx = (id: string) => {
    setProject((prev) => ({
      ...prev,
      timelineSfx: (prev.timelineSfx || []).filter((item) => item.id !== id)
    }));
  };

  // Điều chỉnh mốc thời gian của SFX
  const handleUpdateTimestamp = (id: string, newTime: number) => {
    const clamped = Math.min(totalDuration, Math.max(0, Number(newTime.toFixed(2))));
    setProject((prev) => ({
      ...prev,
      timelineSfx: (prev.timelineSfx || []).map((item) =>
        item.id === id ? { ...item, timestamp: clamped } : item
      ).sort((a, b) => a.timestamp - b.timestamp)
    }));
  };

  // Cập nhật timestamp của 1 SFX về đúng vị trí Preview hiện tại
  const handleSnapToCurrentTime = (id: string) => {
    handleUpdateTimestamp(id, currentTime);
  };

  // Điều chỉnh âm lượng của SFX
  const handleUpdateVolume = (id: string, newVol: number) => {
    setProject((prev) => ({
      ...prev,
      timelineSfx: (prev.timelineSfx || []).map((item) =>
        item.id === id ? { ...item, volume: Math.max(0, Math.min(1, newVol)) } : item
      )
    }));
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Custom Sound Effect Upload */}
      <input
        type="file"
        ref={sfxFileInputRef}
        onChange={handleBrowserFileInputChange}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        className="hidden"
      />

      {/* 1. Header & Thông tin Sound Effects Timeline */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-950 to-slate-900 border border-violet-500/30 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-md shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Sound Effects Timeline
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                  {timelineSfxList.length} Âm thanh đã gán
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thêm hiệu ứng âm thanh vào đúng số giây trên video. Khi xem video hoặc tua dừng tại đâu, âm thanh sẽ tự động phát tại đó.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 shadow-xs flex items-center gap-1.5">
              <span>⏱️ Vị trí Preview:</span>
              <strong className="text-violet-400 font-mono text-sm">{currentTime.toFixed(2)}s</strong>
              <span className="text-slate-500">/ {totalDuration.toFixed(1)}s</span>
            </span>

            {/* Nút tải âm thanh từ PC */}
            <button
              onClick={handleSelectCustomSfxFromPC}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              title="Tải file âm thanh sound effect từ máy tính (.mp3, .wav, .m4a...)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-yellow-300" />
              <span>Từ PC (Tải SFX)</span>
            </button>
          </div>
        </div>

        {/* 2. Visual Multi-Track SFX Timeline */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-400" /> Trục thời gian SFX toàn video:
            </span>
            <span className="text-[11px] text-violet-300">Click trên thanh để tua video hoặc xem mốc âm thanh</span>
          </div>

          {/* Interactive Timeline Bar */}
          <div
            className="relative h-12 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetTime = Number((ratio * totalDuration).toFixed(2));
              if (onSeek) onSeek(targetTime);
            }}
          >
            {/* Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            >
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-[3px] -mt-1 shadow" />
            </div>

            {/* Time Grid Markers */}
            <div className="absolute inset-0 flex justify-between px-2 text-[9px] text-slate-600 pointer-events-none items-end pb-1 font-mono">
              <span>0.0s</span>
              <span>{(totalDuration * 0.25).toFixed(1)}s</span>
              <span>{(totalDuration * 0.5).toFixed(1)}s</span>
              <span>{(totalDuration * 0.75).toFixed(1)}s</span>
              <span>{totalDuration.toFixed(1)}s</span>
            </div>

            {/* SFX Markers on Timeline */}
            {timelineSfxList.map((item) => {
              const leftPercent = Math.max(0, Math.min(95, (item.timestamp / totalDuration) * 100));
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSeek) onSeek(item.timestamp);
                    const matchedSfx = combinedEffects.find((s) => s.id === item.sfxId);
                    if (matchedSfx) handlePreviewSfx(matchedSfx);
                  }}
                  className="absolute top-1.5 bottom-5 px-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg border border-violet-400/40 hover:scale-105 transition-transform z-10 truncate cursor-pointer"
                  style={{ left: `${leftPercent}%`, maxWidth: '140px' }}
                  title={`${item.name} tại mốc ${item.timestamp}s (Click để tua tới)`}
                >
                  <Sparkles className="w-2.5 h-2.5 shrink-0 text-yellow-300" />
                  <span className="truncate">{item.name.split('(')[0]}</span>
                  <span className="text-[9px] text-violet-200 font-mono">({item.timestamp}s)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Danh Sách SFX Đã Gán Trên Timeline */}
      {timelineSfxList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" /> Danh sách SFX đã gắn trên Timeline ({timelineSfxList.length})
            </h4>
            <button
              onClick={() => setProject((prev) => ({ ...prev, timelineSfx: [] }))}
              className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {timelineSfxList.map((item) => {
              const matchedSfx = combinedEffects.find((s) => s.id === item.sfxId);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => {
                        if (matchedSfx) {
                          handlePreviewSfx(matchedSfx);
                        } else if (item.audioUrl) {
                          new Audio(item.audioUrl).play();
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
                      title="Phát thử âm thanh"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Thời lượng: {item.duration}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Nút đặt nhanh timestamp theo vị trí preview hiện tại */}
                    <button
                      onClick={() => handleSnapToCurrentTime(item.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-950/80 hover:bg-violet-900 border border-violet-600/40 text-violet-300 hover:text-white text-[10.5px] font-medium transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title={`Đổi mốc âm thanh này về đúng vị trí Preview hiện tại (${currentTime.toFixed(2)}s)`}
                    >
                      <MapPin className="w-3 h-3 text-yellow-400" />
                      <span>{currentTime.toFixed(1)}s</span>
                    </button>

                    {/* Timestamp Input */}
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max={totalDuration}
                        step="0.1"
                        value={item.timestamp}
                        onChange={(e) => handleUpdateTimestamp(item.id, parseFloat(e.target.value) || 0)}
                        className="w-12 bg-transparent text-xs font-mono text-violet-300 text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-500">s</span>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                      <Volume2 className="w-3 h-3 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={item.volume}
                        onChange={(e) => handleUpdateVolume(item.id, parseFloat(e.target.value))}
                        className="w-14 h-1 accent-violet-500 cursor-pointer"
                        title={`Âm lượng: ${Math.round(item.volume * 100)}%`}
                      />
                      <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                        {Math.round(item.volume * 100)}%
                      </span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTimelineSfx(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                      title="Xóa âm thanh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Thư Viện Sound Effects & Tải File Từ PC */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Thư viện Sound Effects & File Từ Máy
            </h4>
            <p className="text-[11px] text-slate-400">
              Nhấn Play để nghe thử tức thì, hoặc nhấn nút "+ Gắn (giây)" để tự động thêm âm thanh vào đúng vị trí đang dừng Preview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <input
              type="text"
              placeholder="🔍 Tìm kiếm âm thanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />

            {/* Quick Upload Button */}
            <button
              onClick={handleSelectCustomSfxFromPC}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600 border border-violet-500/40 text-violet-200 hover:text-white text-xs font-semibold transition-all active:scale-95 shrink-0"
              title="Tải thêm âm thanh hiệu ứng từ máy tính"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải từ PC</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* SFX Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredEffects.map((sfx) => {
            const isPlaying = playingSfxId === sfx.id;
            return (
              <div
                key={sfx.id}
                className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => handlePreviewSfx(sfx)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      isPlaying
                        ? 'bg-violet-500 text-white animate-pulse'
                        : 'bg-slate-800 group-hover:bg-violet-600/30 text-slate-300 group-hover:text-violet-300'
                    }`}
                    title="Nghe thử âm thanh"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {sfx.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{(sfx as any).description || 'Sound Effect'}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSfxToTimeline(sfx)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 hover:border-transparent transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                  title={`Gắn âm thanh này vào đúng số giây đang Preview (${currentTime.toFixed(2)}s)`}
                >
                  <Plus className="w-3.5 h-3.5" /> Gắn ({currentTime.toFixed(1)}s)
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
