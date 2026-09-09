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
  HelpCircle
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

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  setProject,
  workflowMode = 'fast'
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'effects' | 'audio'>('branding');

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
    <div className="h-full flex flex-col bg-zinc-950 p-3 sm:p-4 overflow-hidden select-none">
      {workflowMode === 'quality' && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs shadow-md">
          <SparkleBadge step={5} label="Chỉnh Thương hiệu & Nhạc nền" />
          <span className="font-bold text-[11.5px]">Tinh chỉnh Logo, Màu phụ đề & Nhạc nền</span>
        </div>
      )}

      {/* 3 Tabs Điều Hướng Gọn Gàng */}
      <div className="flex items-center p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-4 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span className="truncate">Thương hiệu & Phụ đề</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('effects')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'effects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="truncate">Hiệu ứng & Chuyển động</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'audio'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span className="truncate">Âm thanh & Nhạc nền</span>
        </button>
      </div>

      {/* Nội dung tương ứng theo Tab */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* ========================================================================= */}
        {/* TAB 1: THƯƠNG HIỆU & PHỤ ĐỀ */}
        {/* ========================================================================= */}
        {activeTab === 'branding' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Logo / Watermark Card */}
            <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Logo / Tên thương hiệu góc video
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.watermark?.enabled ?? true}
                    onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {project.watermark?.enabled && (
                <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                  <div>
                    <label className="text-[11px] text-zinc-400">Tên thương hiệu / Kênh:</label>
                    <input
                      type="text"
                      value={project.watermark.text || ''}
                      onChange={(e) => updateWatermark({ text: e.target.value })}
                      placeholder="@LaDoHomestaySaPa"
                      className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400">Vị trí hiển thị trên video:</label>
                    <select
                      value={project.watermark.position}
                      onChange={(e) => updateWatermark({ position: e.target.value as any })}
                      className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
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

            {/* Phụ đề Karaoke Card */}
            <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 pb-2 border-b border-zinc-800">
                <Type className="w-3.5 h-3.5 text-indigo-400" />
                Cài đặt phụ đề nhảy chữ (Karaoke)
              </div>

              {/* Font chữ */}
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">Phông chữ hiển thị:</label>
                <select
                  value={project.subtitleStyle.fontFamily}
                  onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
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
                <label className="text-[11px] text-zinc-400">Màu chữ phát sáng khi đọc tới:</label>
                <div className="flex items-center gap-2.5">
                  {PRESET_HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => updateSubtitleStyle({ highlightColor: c.color })}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                        project.subtitleStyle.highlightColor === c.color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
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

              {/* Sliders: Kích thước & Trục Y */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Kích thước chữ:</span>
                    <span className="text-indigo-400 font-mono font-bold">{project.subtitleStyle.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="72"
                    value={project.subtitleStyle.fontSize}
                    onChange={(e) => updateSubtitleStyle({ fontSize: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Vị trí độ cao phụ đề (Trục Y):</span>
                    <span className="text-indigo-400 font-mono font-bold">{project.subtitleStyle.positionY}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={project.subtitleStyle.positionY}
                    onChange={(e) => updateSubtitleStyle({ positionY: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HIỆU ỨNG & CHUYỂN ĐỘNG */}
        {/* ========================================================================= */}
        {activeTab === 'effects' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="text-[11px] text-zinc-400 font-medium px-1">
              Bật/tắt các lớp hoạt họa & chuyển động điện ảnh tự động:
            </div>

            <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-3 divide-y divide-zinc-800/60">
              {/* Sóng âm Visualizer */}
              <div className="flex items-center justify-between pt-1 first:pt-0">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">🎵 Sóng âm Visualizer</h5>
                  <p className="text-[10px] text-zinc-500">Thanh sóng âm nhảy theo nhịp điệu</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.showAudioVisualizer ?? true}
                  onChange={(e) => setProject((prev) => ({ ...prev, showAudioVisualizer: e.target.checked }))}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Hạt bụi điện ảnh */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">✨ Hạt bụi điện ảnh</h5>
                  <p className="text-[10px] text-zinc-500">Hiệu ứng Cinematic Light Leak lơ lửng</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.showCinematicParticles ?? true}
                  onChange={(e) => setProject((prev) => ({ ...prev, showCinematicParticles: e.target.checked }))}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Rung lắc camera */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">📳 Rung lắc camera</h5>
                  <p className="text-[10px] text-zinc-500">Cảm giác chân thật tự nhiên (Handheld cam)</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.showCameraShake ?? true}
                  onChange={(e) => setProject((prev) => ({ ...prev, showCameraShake: e.target.checked }))}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Emoji động minh họa */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">🔥 Emoji động minh họa</h5>
                  <p className="text-[10px] text-zinc-500">Tự động chèn biểu tượng cảm xúc theo câu</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.enableDynamicEmojis ?? true}
                  onChange={(e) => setProject((prev) => ({ ...prev, enableDynamicEmojis: e.target.checked }))}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Thanh Progress Bar đáy */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">📊 Thanh tiến trình đáy</h5>
                  <p className="text-[10px] text-zinc-500">Giúp giữ chân người xem video tới giây cuối</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.showProgressBar ?? true}
                  onChange={(e) => setProject((prev) => ({ ...prev, showProgressBar: e.target.checked }))}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Âm thanh lướt chuyển cảnh */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-200">💨 Tự động chèn âm thanh SFX</h5>
                  <p className="text-[10px] text-zinc-500">Hiệu ứng lướt (Whoosh) khi chuyển phân cảnh</p>
                </div>
                <input
                  type="checkbox"
                  checked={project.soundFx?.enableWhoosh ?? true}
                  onChange={(e) => updateSoundFx({ enableWhoosh: e.target.checked })}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ÂM THANH & NHẠC NỀN */}
        {/* ========================================================================= */}
        {activeTab === 'audio' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Nhạc nền BGM */}
            <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  Nhạc nền nghỉ dưỡng (BGM)
                </span>
                <button
                  type="button"
                  onClick={handleSelectCustomBgmFile}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 py-0.5 px-2 rounded-md bg-indigo-950/60 border border-indigo-500/30 transition-colors"
                  title="Chọn file MP3/WAV từ máy tính của bạn"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Tải MP3 riêng</span>
                </button>
              </div>

              <select
                value={project.bgm?.url || ''}
                onChange={(e) => handleSelectBgm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
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
                <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Tỷ lệ hạ nhạc khi có giọng nói (Audio Ducking):</span>
                      <span className="text-indigo-400 font-mono font-bold">
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
                      className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <p className="text-[10px] text-zinc-500">
                      Nhạc nền sẽ tự động giảm nhỏ xuống mức này khi người đọc cất tiếng nói.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Giọng đọc mặc định */}
            <div className="bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                Giọng đọc thuyết minh AI (Edge-TTS)
              </span>
              <select
                value={project.voice.name}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    voice: { ...prev.voice, name: e.target.value }
                  }))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
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
