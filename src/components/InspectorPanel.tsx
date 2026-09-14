import React, { useState } from 'react';
import { VideoProject, SubtitleStyle, WatermarkConfig, SoundFxConfig, VIETNAMESE_VOICES } from '../types/video';
import { SparkleBadge, WorkflowMode } from './SparkleBadge';
import {
  Type,
  Sparkles,
  Music,
  Tag,
  Sliders,
  FolderOpen,
  Check,
  Volume2,
  Activity,
  Layers,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface InspectorPanelProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  workflowMode?: WorkflowMode;
}

const BGM_OPTIONS = [
  {
    id: 'bgm-lofi-1',
    name: '🎵 Lo-Fi Chill & Nghỉ Dưỡng (Nhẹ nhàng, thư thái)',
    url: '/audio/bgm-lofi.wav'
  },
  {
    id: 'bgm-tech-1',
    name: '⚡ Năng Động & Trải Nghiệm (Upbeat Travel)',
    url: '/audio/bgm-tech.wav'
  },
  {
    id: 'bgm-cinematic-1',
    name: '🏔️ Điện Ảnh Săn Mây Sa Pa (Cinematic Landscape)',
    url: '/audio/bgm-cinematic.wav'
  },
  {
    id: 'bgm-none',
    name: '🔇 Không nhạc nền (Chỉ giọng đọc thuyết minh)',
    url: ''
  }
];

const PRESET_FONTS = [
  { name: 'Montserrat (Đậm nét, Viral)', value: 'Montserrat, sans-serif' },
  { name: 'Be Vietnam Pro (Việt hoá chuẩn)', value: 'Be Vietnam Pro, sans-serif' },
  { name: 'Inter (Hiện đại, Tinh gọn)', value: 'Inter, sans-serif' },
  { name: 'Archivo Black (Dày dặn, Mạnh mẽ)', value: 'Archivo Black, sans-serif' },
  { name: 'Bebas Neue (Điện ảnh, Tiêu đề)', value: 'Bebas Neue, sans-serif' },
  { name: 'Impact (Cổ điển mạng xã hội)', value: 'Impact, sans-serif' }
];

const PRESET_HIGHLIGHT_COLORS = [
  { name: 'Vàng Neon', color: '#FACC15' },
  { name: 'Xanh Lá Neon', color: '#4ADE80' },
  { name: 'Xanh Cyan', color: '#22D3EE' },
  { name: 'Hồng Hot Pink', color: '#F43F5E' },
  { name: 'Trắng Sáng', color: '#FFFFFF' }
];

import { SfxTimelineManager } from './SfxTimelineManager';

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  setProject,
  workflowMode = 'fast'
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'sfx' | 'audio'>('branding');

  const updateSubtitleStyle = (updates: Partial<SubtitleStyle>) => {
    setProject((prev) => ({
      ...prev,
      subtitleStyle: {
        ...prev.subtitleStyle,
        ...updates
      }
    }));
  };

  const updateWatermark = (updates: Partial<WatermarkConfig>) => {
    setProject((prev) => ({
      ...prev,
      watermark: {
        ...prev.watermark,
        ...updates
      }
    }));
  };

  const updateSoundFx = (updates: Partial<SoundFxConfig>) => {
    setProject((prev) => ({
      ...prev,
      soundFx: {
        ...prev.soundFx,
        ...updates
      }
    }));
  };

  const handleSelectBgm = (url: string) => {
    setProject((prev) => ({
      ...prev,
      bgm: {
        ...prev.bgm,
        url
      }
    }));
  };

  const handleSelectCustomBgmFile = async () => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file nhạc MP3/WAV từ máy tính làm nhạc nền',
          filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const audioUrl = `file://${filePath.replace(/\\/g, '/')}`;
          setProject((prev) => ({
            ...prev,
            bgm: {
              ...prev.bgm,
              url: audioUrl,
              localPath: filePath
            }
          }));
        }
      } catch (err) {
        console.error('BGM select error:', err);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-3 sm:p-4 overflow-hidden select-none border-l border-slate-200">
      {workflowMode === 'quality' && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-sm">
          <SparkleBadge step={5} label="Chỉnh Thương hiệu & Nhạc nền" />
          <span className="font-bold text-[11.5px]">Tinh chỉnh Logo, Màu phụ đề & Nhạc nền</span>
        </div>
      )}

      {/* 3 Tabs Điều Hướng Gọn Gàng */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 mb-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'branding'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span className="truncate">Phụ đề</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sfx')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sfx'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold text-violet-600'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span className="truncate">Sound FX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'audio'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span className="truncate">Nhạc nền</span>
        </button>
      </div>

      {/* Nội dung tương ứng theo Tab */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {activeTab === 'sfx' && (
          <div className="animate-in fade-in duration-150">
            <SfxTimelineManager
              project={project}
              setProject={setProject}
              currentTime={0}
            />
          </div>
        )}
        {/* ========================================================================= */}
        {/* TAB 1: THƯƠNG HIỆU & PHỤ ĐỀ */}
        {/* ========================================================================= */}
        {activeTab === 'branding' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Logo / Watermark Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  Logo / Tên thương hiệu góc video
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.watermark?.enabled ?? true}
                    onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {project.watermark?.enabled && (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Tên thương hiệu / Kênh:</label>
                    <input
                      type="text"
                      value={project.watermark.text || ''}
                      onChange={(e) => updateWatermark({ text: e.target.value })}
                      placeholder="Nhập tên thương hiệu / kênh của bạn..."
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Vị trí hiển thị trên video:</label>
                    <select
                      value={project.watermark.position}
                      onChange={(e) => updateWatermark({ position: e.target.value as any })}
                      className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="top-right">Góc trên bên phải (Khuyên dùng)</option>
                      <option value="top-left">Góc trên bên trái</option>
                      <option value="bottom-right">Góc dưới bên phải</option>
                      <option value="bottom-left">Góc dưới bên trái</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Chữ Tiêu Đề / Huy Hiệu Phía Trên (Header Badge) */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Chữ tiêu đề / Huy hiệu phía trên
                </span>
                <button
                  type="button"
                  onClick={() => setProject(prev => ({ ...prev, showHeaderBadge: !prev.showHeaderBadge }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    project.showHeaderBadge
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  title={project.showHeaderBadge ? 'Đang BẬT chữ tiêu đề phía trên video. Bấm để TẮT.' : 'Đang TẮT chữ phía trên. Bấm để BẬT.'}
                >
                  {project.showHeaderBadge ? (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Đang BẬT</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Đã TẮT</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {project.showHeaderBadge
                  ? 'Hiển thị huy hiệu / tiêu đề ngắn gọn nổi bật ở đỉnh khung hình.'
                  : '🟢 Đã tắt chữ ở trên đỉnh — chỉ hiển thị phụ đề karaoke chạy từng chữ một ở dưới.'}
              </p>
            </div>

            {/* Phụ đề Karaoke Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Type className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cài đặt phụ đề (Karaoke)</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSubtitleStyle({ enabled: project.subtitleStyle.enabled === false ? true : false })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    project.subtitleStyle.enabled !== false
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                  }`}
                  title={project.subtitleStyle.enabled !== false ? 'Bấm để TẮT chữ, không hiển thị bất kỳ phụ đề nào trên video' : 'Bấm để BẬT lại hiển thị chữ phụ đề trên video'}
                >
                  {project.subtitleStyle.enabled !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Đang HIỆN chữ</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-700" />
                      <span>Đã TẮT chữ</span>
                    </>
                  )}
                </button>
              </div>

              {project.subtitleStyle.enabled === false ? (
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-center space-y-1 animate-in fade-in duration-150">
                  <p className="text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-rose-600" />
                    <span>Đã tắt hiển thị chữ trên toàn bộ video</span>
                  </p>
                  <p className="text-[11px] text-rose-600">
                    Video khi phát thử và xuất file sẽ hoàn toàn không có phụ đề. Bấm nút <strong>"Đã TẮT chữ"</strong> ở trên để mở lại bất cứ lúc nào!
                  </p>
                </div>
              ) : (
                <>
                  {/* Kiểu hiển thị chữ phụ đề (Cụm từ Karaoke vs Chạy từ trái sang phải vs 1 chữ nhảy) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">Kiểu chạy chữ phụ đề:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateSubtitleStyle({ displayMode: 'single_word', maxWordsPerLine: 4 })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
                          (project.subtitleStyle.displayMode || 'single_word') === 'single_word'
                            ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-300 ring-1 ring-emerald-500/20'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Chữ xuất hiện lần lượt từ trái sang phải theo nhịp nói"
                      >
                        <span className="text-xs">⚡ Chạy Trái ➔ Phải</span>
                        <span className="text-[9.5px] text-slate-500 font-normal">Xuất hiện nối tiếp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSubtitleStyle({ displayMode: 'single_word_spotlight', maxWordsPerLine: 4 })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
                          project.subtitleStyle.displayMode === 'single_word_spotlight'
                            ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-300 ring-1 ring-emerald-500/20'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Chỉ hiện 1 chữ duy nhất tại vị trí chạy từ trái qua phải"
                      >
                        <span className="text-xs">🎯 Nhảy Trái ➔ Phải</span>
                        <span className="text-[9.5px] text-slate-500 font-normal">1 chữ di chuyển</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSubtitleStyle({ displayMode: 'phrase_karaoke', maxWordsPerLine: 4 })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all ${
                          project.subtitleStyle.displayMode === 'phrase_karaoke'
                            ? 'bg-white text-emerald-800 font-bold shadow-xs border border-emerald-300 ring-1 ring-emerald-500/20'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Hiện sẵn cả cụm từ 3-4 chữ, chữ đọc tới đâu phát sáng tới đó"
                      >
                        <span className="text-xs">💬 Cụm Karaoke</span>
                        <span className="text-[9.5px] text-slate-500 font-normal">Hiện đủ, sáng theo từ</span>
                      </button>
                    </div>
                  </div>

                  {/* Font chữ */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">Phông chữ hiển thị:</label>
                    <select
                      value={project.subtitleStyle.fontFamily}
                      onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {PRESET_FONTS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bảng màu Highlight chữ Karaoke */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">Màu chữ phát sáng khi đọc tới:</label>
                    <div className="flex items-center gap-2.5">
                      {PRESET_HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => updateSubtitleStyle({ highlightColor: c.color })}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                            project.subtitleStyle.highlightColor === c.color
                              ? 'border-slate-900 scale-110 shadow-sm'
                              : 'border-slate-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        >
                          {project.subtitleStyle.highlightColor === c.color && (
                            <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders: Kích thước, Trục Y & Trục X */}
                  <div className="space-y-3 pt-1">
                    {/* Kích thước chữ */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>Kích thước chữ:</span>
                        <span className="text-emerald-700 font-mono font-bold">{project.subtitleStyle.fontSize}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ fontSize: Math.max(20, (project.subtitleStyle.fontSize || 40) - 2) })}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                          title="Giảm kích thước chữ"
                        >
                          A-
                        </button>
                        <input
                          type="range"
                          min="20"
                          max="72"
                          value={project.subtitleStyle.fontSize}
                          onChange={(e) => updateSubtitleStyle({ fontSize: parseInt(e.target.value) })}
                          className="flex-1 accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ fontSize: Math.min(80, (project.subtitleStyle.fontSize || 40) + 2) })}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
                          title="Tăng kích thước chữ"
                        >
                          A+
                        </button>
                      </div>
                    </div>

                    {/* Vị trí Lên / Xuống theo trục Y */}
                    <div className="space-y-1.5 p-2 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <span>↕️</span>
                          <span>Vị trí Lên / Xuống (Trục Y):</span>
                        </span>
                        <span className="text-emerald-700 font-mono font-bold">{project.subtitleStyle.positionY}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionY: Math.max(5, (project.subtitleStyle.positionY || 75) - 3) })}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Dịch chữ LÊN TRÊN"
                        >
                          ⬆️ Lên
                        </button>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={project.subtitleStyle.positionY}
                          onChange={(e) => updateSubtitleStyle({ positionY: parseInt(e.target.value) })}
                          className="flex-1 accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionY: Math.min(95, (project.subtitleStyle.positionY || 75) + 3) })}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Dịch chữ XUỐNG DƯỚI"
                        >
                          ⬇️ Xuống
                        </button>
                      </div>
                      {/* Nút đặt nhanh độ cao */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500">Mốc nhanh:</span>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionY: 20 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          🔝 Trên (20%)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionY: 50 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          🎯 Giữa (50%)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionY: 75 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          🔻 Đáy (75%)
                        </button>
                      </div>
                    </div>

                    {/* Vị trí Trái / Phải theo trục X */}
                    <div className="space-y-1.5 p-2 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <span>↔️</span>
                          <span>Vị trí Trái / Phải (Trục X):</span>
                        </span>
                        <span className="text-emerald-700 font-mono font-bold">{project.subtitleStyle.positionX ?? 50}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionX: Math.max(5, (project.subtitleStyle.positionX ?? 50) - 3) })}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Dịch chữ SANG TRÁI"
                        >
                          ⬅️ Trái
                        </button>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={project.subtitleStyle.positionX ?? 50}
                          onChange={(e) => updateSubtitleStyle({ positionX: parseInt(e.target.value) })}
                          className="flex-1 accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionX: Math.min(95, (project.subtitleStyle.positionX ?? 50) + 3) })}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Dịch chữ SANG PHẢI"
                        >
                          ➡️ Phải
                        </button>
                      </div>
                      {/* Nút đặt nhanh trục X */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500">Mốc nhanh:</span>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionX: 25 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          ⬅️ Trái (25%)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionX: 50 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          🎯 Chính Giữa (50%)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ positionX: 75 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          ➡️ Phải (75%)
                        </button>
                      </div>
                    </div>

                    {/* Trục Xoay (Góc nghiêng Rotate) */}
                    <div className="space-y-1.5 p-2 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <span>🔄</span>
                          <span>Trục Xoay / Góc Nghiêng:</span>
                        </span>
                        <span className="text-emerald-700 font-mono font-bold">
                          {project.subtitleStyle.rotation ?? project.subtitleStyle.rotate ?? 0}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = project.subtitleStyle.rotation ?? project.subtitleStyle.rotate ?? 0;
                            updateSubtitleStyle({ rotation: Math.max(-180, cur - 5), rotate: Math.max(-180, cur - 5) });
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Xoay ngược chiều kim đồng hồ"
                        >
                          🔄 -5°
                        </button>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={project.subtitleStyle.rotation ?? project.subtitleStyle.rotate ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            updateSubtitleStyle({ rotation: val, rotate: val });
                          }}
                          className="flex-1 accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = project.subtitleStyle.rotation ?? project.subtitleStyle.rotate ?? 0;
                            updateSubtitleStyle({ rotation: Math.min(180, cur + 5), rotate: Math.min(180, cur + 5) });
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-700 shadow-xs active:scale-95"
                          title="Xoay theo chiều kim đồng hồ"
                        >
                          🔄 +5°
                        </button>
                      </div>
                      {/* Nút đặt nhanh góc xoay */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500">Mốc nhanh:</span>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ rotation: -12, rotate: -12 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          ↖️ Nghiêng trái (-12°)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ rotation: 0, rotate: 0 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          🎯 Thẳng ngang (0°)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSubtitleStyle({ rotation: 12, rotate: 12 })}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                        >
                          ↗️ Nghiêng phải (+12°)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Switch Viết hoa */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[11px] font-medium text-slate-600">Tự động VIẾT HOA toàn bộ:</span>
                    <button
                      type="button"
                      onClick={() => updateSubtitleStyle({ uppercase: !project.subtitleStyle.uppercase })}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        project.subtitleStyle.uppercase ? 'bg-emerald-700' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                          project.subtitleStyle.uppercase ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ÂM THANH & NHẠC NỀN */}
        {/* ========================================================================= */}
        {activeTab === 'audio' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Nhạc nền BGM */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-700" />
                  Nhạc nền (BGM)
                </span>
                <button
                  type="button"
                  onClick={handleSelectCustomBgmFile}
                  className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 py-0.5 px-2 rounded-md bg-emerald-50 border border-emerald-200 transition-colors font-medium"
                  title="Chọn file MP3/WAV từ máy tính của bạn"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Tải file riêng</span>
                </button>
              </div>

              <select
                value={project.bgm?.url || ''}
                onChange={(e) => handleSelectBgm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {BGM_OPTIONS.map((b) => (
                  <option key={b.name} value={b.url}>
                    {b.name}
                  </option>
                ))}
                {project.bgm?.localPath && (
                  <option value={project.bgm.url}>
                    📂 {project.bgm.localPath.split('\\').pop() || 'Nhạc từ máy tính'}
                  </option>
                )}
              </select>

              {/* Audio Ducking & Volume */}
              {project.bgm?.url && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Giảm nhạc khi có giọng nói (Ducking):</span>
                      <span className="text-emerald-700 font-mono font-bold">
                        {Math.round((project.bgm.duckingVolume ?? 0.15) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.4"
                      step="0.05"
                      value={project.bgm.duckingVolume ?? 0.15}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          bgm: { ...prev.bgm, duckingVolume: parseFloat(e.target.value) }
                        }))
                      }
                      className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Nhạc nền tự động giảm âm lượng khi người đọc phát âm thanh thoại.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Giọng đọc mặc định */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                Giọng đọc thuyết minh (Edge-TTS)
              </span>
              <select
                value={project.voice.name}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    voice: { ...prev.voice, name: e.target.value }
                  }))
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {VIETNAMESE_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.gender === 'Female' ? 'Nữ' : 'Nam'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
