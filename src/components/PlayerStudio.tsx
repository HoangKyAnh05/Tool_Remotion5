import React, { useMemo, useState, useRef } from 'react';
import { Player } from '@remotion/player';
import { MainComposition } from '../remotion/Composition';
import { VideoProject, SubtitleStyle, WatermarkConfig, SoundFxConfig, ElementPosition } from '../types/video';
import { InteractiveCanvasOverlay } from './InteractiveCanvasOverlay';
import { convertAudioOrVideoFileToAudio, extractAudioFromVideoData } from '../services/speechToTextService';
import {
  Type,
  Palette,
  Music,
  Sliders,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Tag,
  Volume2,
  Activity,
  FolderOpen,
  Move,
  Layers,
  Play,
  RefreshCw
} from 'lucide-react';

interface PlayerStudioProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

const BGM_OPTIONS = [
  {
    id: 'bgm-lofi-1',
    name: '🎵 Lo-Fi Chill & Nghỉ Dưỡng (Nhẹ nhàng, thư thái)',
    url: '/audio/bgm-lofi.wav'
  },
  {
    id: 'bgm-tech-1',
    name: '⚡ Năng động & Trải nghiệm (Upbeat Travel)',
    url: '/audio/bgm-tech.wav'
  },
  {
    id: 'bgm-cinematic-1',
    name: '🏔️ Điện ảnh Săn Mây Sa Pa (Cinematic Landscape)',
    url: '/audio/bgm-cinematic.wav'
  },
  {
    id: 'bgm-none',
    name: '🔇 Không nhạc nền (Chỉ giọng đọc Voiceover)',
    url: ''
  }
];

const PRESET_FONTS = [
  { name: 'Montserrat (Đậm nét, Hiện đại)', value: 'Montserrat, sans-serif' },
  { name: 'Inter (Sạch sẽ, Tinh gọn)', value: 'Inter, sans-serif' },
  { name: 'Be Vietnam Pro (Việt hoá chuẩn)', value: 'Be Vietnam Pro, sans-serif' },
  { name: 'Impact (Mạnh mẽ TikTok)', value: 'Impact, sans-serif' }
];

const PRESET_HIGHLIGHT_COLORS = [
  { name: 'Vàng Neon', color: '#FACC15' },
  { name: 'Xanh Lá Neon', color: '#4ADE80' },
  { name: 'Xanh Cyan', color: '#22D3EE' },
  { name: 'Hồng Hot Pink', color: '#F43F5E' },
  { name: 'Trắng Sáng', color: '#FFFFFF' }
];

export const PlayerStudio: React.FC<PlayerStudioProps> = ({ project, setProject }) => {
  // Calculate total frames exactly matching Series.Sequence
  const totalFrames = useMemo(() => {
    const fps = project.fps || 30;
    const frames = project.scenes.reduce(
      (acc, s) => acc + Math.max(Math.round((s.audioDuration || 4) * fps), Math.round(2 * fps)),
      0
    );
    return Math.max(frames, 30);
  }, [project.scenes, project.fps]);

  const compositionWidth = project.aspectRatio === '9:16' ? 1080 : 1920;
  const compositionHeight = project.aspectRatio === '9:16' ? 1920 : 1080;

  const [studioMode, setStudioMode] = useState<'preview' | 'interactive_canvas'>('preview');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);

  const handleUpdatePositions = (sceneId: string, positions: Record<string, ElementPosition>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, elementPositions: positions } : s))
    }));
  };

  const handleUpdateNarration = (sceneId: string, text: string) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, narration: text } : s))
    }));
  };

  const handleUpdateScene = (sceneId: string, updates: any) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s))
    }));
  };

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

  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExtractingBgm, setIsExtractingBgm] = useState<boolean>(false);
  const [bgmNoticeText, setBgmNoticeText] = useState<string | null>(null);

  const handleBrowserBgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingBgm(true);
    setBgmNoticeText('Đang quét và tự động trích xuất âm thanh MP3/WAV...');

    try {
      const result = await convertAudioOrVideoFileToAudio(file);
      setProject((prev) => ({
        ...prev,
        bgm: {
          ...prev.bgm,
          url: result.audioUrl,
          localPath: result.fileName
        }
      }));

      if (result.isVideo) {
        setBgmNoticeText(`✨ Đã tự động tách nhạc từ video "${result.fileName}" sang MP3/WAV thành công!`);
      } else {
        setBgmNoticeText(`✅ Đã nạp file nhạc "${result.fileName}" thành công!`);
      }

      setTimeout(() => {
        setBgmNoticeText(null);
      }, 4000);
    } catch (err) {
      console.error('BGM upload error:', err);
      setBgmNoticeText('⚠️ Không thể trích xuất âm thanh từ file này, vui lòng thử lại.');
      setTimeout(() => setBgmNoticeText(null), 4000);
    } finally {
      setIsExtractingBgm(false);
      if (bgmFileInputRef.current) {
        bgmFileInputRef.current.value = '';
      }
    }
  };

  const handleSelectCustomBgmFile = async () => {
    if (window.electronAPI?.selectFile) {
      try {
        const files = await window.electronAPI.selectFile({
          title: 'Chọn file nhạc MP3 hoặc video MP4 từ máy tính làm nhạc nền',
          filters: [
            { name: 'Audio & Video Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'mp4', 'mov', 'webm', 'mkv'] },
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a', 'ogg'] },
            { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv'] }
          ]
        });
        if (files && files.length > 0) {
          const filePath = files[0];
          const fileName = filePath.split(/[\\/]/).pop() || 'Nhạc nền';
          const isVideo = /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(filePath);

          if (isVideo) {
            setIsExtractingBgm(true);
            setBgmNoticeText(`Đang quét video "${fileName}" và tự động tách lấy âm thanh...`);
            let base64Info = null;
            if (window.electronAPI?.readAudioBase64) {
              base64Info = await window.electronAPI.readAudioBase64(filePath);
            }
            if (base64Info?.dataUrl) {
              const extracted = await extractAudioFromVideoData(base64Info.dataUrl);
              if (extracted) {
                setProject((prev) => ({
                  ...prev,
                  bgm: {
                    ...prev.bgm,
                    url: extracted.dataUrl,
                    localPath: fileName
                  }
                }));
                setBgmNoticeText(`✨ Đã tự động tách nhạc từ video "${fileName}" thành công!`);
                setTimeout(() => setBgmNoticeText(null), 4000);
                setIsExtractingBgm(false);
                return;
              }
            }
            setIsExtractingBgm(false);
          }

          const audioUrl = `file://${filePath.replace(/\\/g, '/')}`;
          setProject((prev) => ({
            ...prev,
            bgm: {
              ...prev.bgm,
              url: audioUrl,
              localPath: fileName
            }
          }));
          setBgmNoticeText(`✅ Đã nạp nhạc "${fileName}" thành công!`);
          setTimeout(() => setBgmNoticeText(null), 4000);
        }
      } catch (err) {
        console.error('BGM select error:', err);
      }
    } else {
      bgmFileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Player Frame Card */}
      <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800 glass-panel flex flex-col items-center">
        <div className="w-full flex items-center justify-between pb-3 border-b border-gray-800/80 mb-3">
          {/* Mode Switcher: Xem Video vs Kéo Thả Chuột */}
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setStudioMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                studioMode === 'preview'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>🎬 Xem Video</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioMode('interactive_canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                studioMode === 'interactive_canvas'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
              title="Click và kéo di chuyển các ô chữ, icon, sticker tự do bằng chuột"
            >
              <Move className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>✋ Kéo Thả Vị Trí (Chuột)</span>
              <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1 rounded border border-cyan-400/30">MỚI</span>
            </button>
          </div>

          <span className="text-xs text-gray-400 font-mono">
            {totalFrames} Frames • {(totalFrames / (project.fps || 30)).toFixed(1)}s
          </span>
        </div>

        {/* Chế độ 1: Kéo thả vị trí bằng chuột */}
        {studioMode === 'interactive_canvas' ? (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Bộ chọn phân cảnh để kéo thả */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Chọn cảnh xếp:</span>
              {project.scenes.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedSceneIndex === idx
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Cảnh {idx + 1}
                </button>
              ))}
            </div>

            {project.scenes[selectedSceneIndex] ? (
              <InteractiveCanvasOverlay
                scene={project.scenes[selectedSceneIndex]}
                aspectRatio={project.aspectRatio}
                onUpdatePositions={handleUpdatePositions}
                onUpdateNarration={handleUpdateNarration}
                onUpdateScene={handleUpdateScene}
              />
            ) : null}
          </div>
        ) : (
          /* Chế độ 2: Remotion Player Container */
          <div
            className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center"
            style={{
              width: project.aspectRatio === '9:16' ? '280px' : '100%',
              aspectRatio: project.aspectRatio === '9:16' ? '9/16' : '16/9',
              maxHeight: '480px'
            }}
          >
            {project.scenes.length > 0 ? (
              <Player
                component={MainComposition}
                inputProps={{ project }}
                durationInFrames={totalFrames}
                compositionWidth={compositionWidth}
                compositionHeight={compositionHeight}
                fps={project.fps || 30}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                controls
                autoPlay={false}
                loop
              />
            ) : (
              <div className="text-center p-6 text-gray-500 text-xs">
                Chưa có phân cảnh nào. Hãy nhấn tạo kịch bản ở trên!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retention Elements Customizer (Watermark, Progress Bar, Sound FX) */}
      <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800 glass-card space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
          <Activity className="w-4 h-4 text-pink-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Yếu Tố Giữ Chân & Thương Hiệu (Retention)
          </h4>
        </div>

        {/* Watermark Branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Logo / Tên thương hiệu góc video:</span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={project.watermark?.enabled ?? true}
                onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {project.watermark?.enabled && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={project.watermark.text || ''}
                onChange={(e) => updateWatermark({ text: e.target.value })}
                placeholder="Nhập tên thương hiệu / kênh..."
                className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={project.watermark.position}
                onChange={(e) => updateWatermark({ position: e.target.value as any })}
                className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none"
              >
                <option value="top-right">Góc trên bên phải</option>
                <option value="top-left">Góc trên bên trái</option>
                <option value="bottom-right">Góc dưới bên phải</option>
                <option value="bottom-left">Góc dưới bên trái</option>
              </select>
            </div>
          )}
        </div>

        {/* Progress Bar Toggle & Sound FX */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800/80">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={project.showProgressBar ?? true}
              onChange={(e) => setProject((prev) => ({ ...prev, showProgressBar: e.target.checked }))}
              className="rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
            />
            <span>Thanh Progress Bar đáy</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={project.soundFx?.enableWhoosh ?? true}
              onChange={(e) => updateSoundFx({ enableWhoosh: e.target.checked })}
              className="rounded bg-gray-950 border-gray-800 text-indigo-600 focus:ring-0"
            />
            <span>Âm thanh Whoosh chuyển cảnh</span>
          </label>
        </div>
      </div>

      {/* Subtitle & Audio Styling Customizer */}
      <div className="bg-gray-900/80 rounded-2xl p-4 border border-gray-800 glass-card space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
          <Type className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Tùy Chỉnh Phụ Đề Karaoke & Âm Nhạc
          </h4>
        </div>

        {/* Subtitle font & color controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Font Family */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Kiểu Font chữ:</label>
            <select
              value={project.subtitleStyle.fontFamily}
              onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
              className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {PRESET_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Highlight Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Màu chữ Highlight (Karaoke):</label>
            <div className="flex items-center gap-2">
              {PRESET_HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => updateSubtitleStyle({ highlightColor: c.color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    project.subtitleStyle.highlightColor === c.color
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Position Y Slider & Font Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Vị trí Phụ đề (Trục Y):</span>
              <span className="text-indigo-400 font-mono">{project.subtitleStyle.positionY}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={project.subtitleStyle.positionY}
              onChange={(e) => updateSubtitleStyle({ positionY: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Kích thước chữ:</span>
              <span className="text-indigo-400 font-mono">{project.subtitleStyle.fontSize}px</span>
            </div>
            <input
              type="range"
              min="24"
              max="80"
              value={project.subtitleStyle.fontSize}
              onChange={(e) => updateSubtitleStyle({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Remotion Supercharged Effects Toggles */}
        <div className="pt-3 border-t border-gray-800 flex flex-col gap-2">
          <label className="text-[11px] text-gray-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hiệu ứng Video & Chuyển động Remotion Pro:</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {/* Audio Visualizer Toggle */}
            <button
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  showAudioVisualizer: !(prev.showAudioVisualizer ?? true)
                }))
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                project.showAudioVisualizer ?? true
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <span>🎵 Sóng âm Visualizer</span>
              <span className="text-[10px] font-bold">{project.showAudioVisualizer ?? true ? 'ON' : 'OFF'}</span>
            </button>

            {/* Dynamic Emojis Toggle */}
            <button
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  enableDynamicEmojis: !(prev.enableDynamicEmojis ?? true)
                }))
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                project.enableDynamicEmojis ?? true
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <span>🔥 Emoji Động (Hormozi)</span>
              <span className="text-[10px] font-bold">{project.enableDynamicEmojis ?? true ? 'ON' : 'OFF'}</span>
            </button>

            {/* Cinematic Particles Toggle */}
            <button
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  showCinematicParticles: !(prev.showCinematicParticles ?? true)
                }))
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                project.showCinematicParticles ?? true
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <span>✨ Hạt Bụi Điện Ảnh</span>
              <span className="text-[10px] font-bold">{project.showCinematicParticles ?? true ? 'ON' : 'OFF'}</span>
            </button>

            {/* Camera Shake Toggle */}
            <button
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  showCameraShake: !(prev.showCameraShake ?? true)
                }))
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                project.showCameraShake ?? true
                  ? 'bg-pink-950/40 border-pink-500/50 text-pink-200'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <span>📳 Rung Lắc Camera</span>
              <span className="text-[10px] font-bold">{project.showCameraShake ?? true ? 'ON' : 'OFF'}</span>
            </button>

            {/* Header Badge / Top Title Toggle */}
            <button
              onClick={() =>
                setProject((prev) => ({
                  ...prev,
                  showHeaderBadge: !prev.showHeaderBadge
                }))
              }
              className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all col-span-2 ${
                project.showHeaderBadge
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
              title="Bật/Tắt chữ tiêu đề / huy hiệu trên đỉnh video"
            >
              <span>🏷️ Chữ tiêu đề trên đỉnh video (Header Badge)</span>
              <span className="text-[10px] font-bold">{project.showHeaderBadge ? 'ON (Đang hiện)' : 'OFF (Đã tắt)'}</span>
            </button>
          </div>
        </div>

        {/* Background Music Selector & Volume Ducking */}
        <div className="pt-3 border-t border-gray-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-gray-300 font-semibold flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <span>Nhạc nền BGM (Tự động giảm âm khi có giọng đọc):</span>
            </label>
            <button
              onClick={handleSelectCustomBgmFile}
              disabled={isExtractingBgm}
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 py-0.5 px-2 rounded-md bg-indigo-950/50 border border-indigo-500/30 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Chọn file MP3 hoặc video MP4 từ máy tính"
            >
              {isExtractingBgm ? (
                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              ) : (
                <FolderOpen className="w-3 h-3" />
              )}
              <span>{isExtractingBgm ? 'Đang tách nhạc...' : 'Tải file riêng'}</span>
            </button>
          </div>

          {/* Hidden input for browser BGM upload */}
          <input
            type="file"
            ref={bgmFileInputRef}
            onChange={handleBrowserBgmUpload}
            accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.mkv"
            className="hidden"
          />

          {bgmNoticeText && (
            <div className="px-2 py-1 rounded bg-indigo-950/60 border border-indigo-500/40 text-[10px] text-indigo-300">
              {bgmNoticeText}
            </div>
          )}

          <select
            value={project.bgm?.url || ''}
            onChange={(e) => handleSelectBgm(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            {BGM_OPTIONS.map((b) => (
              <option key={b.name} value={b.url}>
                {b.name}
              </option>
            ))}
            {project.bgm?.localPath && (
              <option value={project.bgm.url}>
                📂 {project.bgm.localPath.split(/[\\/]/).pop() || 'Nhạc từ máy tính'}
              </option>
            )}
          </select>

          {/* Ducking Volume Slider */}
          {project.bgm?.url && (
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Âm lượng nhạc nền khi có giọng đọc (Audio Ducking):</span>
                <span className="text-pink-400 font-mono">
                  {Math.round((project.bgm.duckingVolume ?? 0.15) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={project.bgm.duckingVolume ?? 0.15}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    bgm: { ...prev.bgm, duckingVolume: parseFloat(e.target.value) }
                  }))
                }
                className="w-full accent-pink-500 h-1.5 bg-gray-800 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
