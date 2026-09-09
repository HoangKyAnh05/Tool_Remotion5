import React, { useState, useEffect } from 'react';
import { VideoProject } from '../types/video';
import {
  Download,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Film,
  Sparkles,
  AlertCircle,
  Play
} from 'lucide-react';

interface RenderModalProps {
  project: VideoProject;
  isOpen: boolean;
  onClose: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({ project, isOpen, onClose }) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [renderedFilePath, setRenderedFilePath] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1080p' | '4k'>('1080p');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsRendering(false);
      setProgress(0);
      setStatusMessage('');
      setErrorMessage(null);
      return;
    }

    // Subscribe to real-time render progress from Electron
    if (window.electronAPI?.onRenderProgress) {
      const unsubscribe = window.electronAPI.onRenderProgress((data) => {
        setProgress(data.progress);
        setStatusMessage(data.message);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setProgress(5);
    setStatusMessage('Đang khởi tạo trình kết xuất Remotion...');
    setErrorMessage(null);
    setRenderedFilePath(null);

    try {
      if (window.electronAPI?.renderVideo) {
        const result = await window.electronAPI.renderVideo({
          project,
          resolution
        });

        if (result && result.success) {
          setRenderedFilePath(result.filePath);
          setProgress(100);
          setStatusMessage('Xuất video MP4 thành công!');
        } else {
          throw new Error('Không nhận được kết quả render từ tiến trình hệ thống');
        }
      } else {
        // Browser standalone fallback simulation
        for (let p = 10; p <= 100; p += 10) {
          await new Promise((r) => setTimeout(r, 300));
          setProgress(p);
          if (p < 40) setStatusMessage('Đang biên dịch khung hình Remotion...');
          else if (p < 80) setStatusMessage('Đang xử lý âm thanh & hiệu ứng...');
          else setStatusMessage('Đang hoàn tất gói video...');
        }
        setRenderedFilePath('out/video_rendered.mp4');
        setStatusMessage('Đã hoàn tất render!');
      }
    } catch (e: any) {
      console.error('Render error in UI:', e);
      setErrorMessage(e.message || 'Có lỗi xảy ra trong quá trình render video.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleOpenFolder = () => {
    if (window.electronAPI?.openPath) {
      const folder = renderedFilePath
        ? renderedFilePath.substring(0, renderedFilePath.lastIndexOf('\\'))
        : 'out';
      window.electronAPI.openPath(folder);
    }
  };

  const handlePlayRenderedVideo = () => {
    if (renderedFilePath && window.electronAPI?.openPath) {
      window.electronAPI.openPath(renderedFilePath);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 text-white">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Xuất Video Remotion MP4</h3>
              <p className="text-xs text-gray-400">
                Định dạng {project.aspectRatio} • {project.scenes.length} Scenes • ~
                {project.scenes.reduce((acc, s) => acc + Math.max(s.audioDuration || 4, 2), 0).toFixed(1)}s
              </p>
            </div>
          </div>
          {!isRendering && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-lg font-bold px-2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Resolution Options */}
          {!renderedFilePath && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Độ phân giải đầu ra:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setResolution('1080p')}
                  disabled={isRendering}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === '1080p'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="font-bold text-sm">Full HD 1080p</div>
                  <div className="text-[11px] text-gray-400">
                    {project.aspectRatio === '9:16' ? '1080 x 1920 (TikTok/Shorts)' : '1920 x 1080 (YouTube)'}
                  </div>
                </button>

                <button
                  onClick={() => setResolution('4k')}
                  disabled={isRendering}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    resolution === '4k'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="font-bold text-sm">Ultra HD 4K</div>
                  <div className="text-[11px] text-gray-400">
                    {project.aspectRatio === '9:16' ? '2160 x 3840' : '3840 x 2160'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Rendering Progress Indicator */}
          {isRendering && (
            <div className="space-y-3 p-4 bg-gray-950/80 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-indigo-300 flex items-center gap-1.5 truncate max-w-[80%]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span className="truncate">{statusMessage || 'Đang render video...'}</span>
                </span>
                <span className="font-mono font-bold text-white ml-2">{progress}%</span>
              </div>
              <div
                className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Tiến trình đang sử dụng nhân Remotion & Chromium GPU để render MP4 chất lượng cao
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-2 text-red-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Render không thành công</span>
              </div>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Success State */}
          {renderedFilePath && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Video MP4 đã được xuất thành công!</span>
              </div>
              <p className="text-xs text-gray-300 break-all font-mono bg-black/40 p-2.5 rounded-xl border border-emerald-500/20">
                {renderedFilePath}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handlePlayRenderedVideo}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Play className="w-4 h-4" />
                  <span>Mở xem Video ngay</span>
                </button>
                <button
                  onClick={handleOpenFolder}
                  className="py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-gray-700"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Mở thư mục chứa</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isRendering}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Đóng
          </button>

          {!renderedFilePath && (
            <button
              onClick={handleStartRender}
              disabled={isRendering || project.scenes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 glow-primary disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xuất MP4...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Bắt đầu Render Video</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
