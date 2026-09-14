import React, { useState, useEffect } from 'react';
import {
  FolderSearch,
  Key,
  Download,
  Film,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  GoogleDriveVideoItem,
  scanDriveFolderVideos,
  downloadDriveVideoAsFile,
  getSavedDriveApiKey,
  saveDriveApiKey,
  getSavedLastDriveFolder,
  saveLastDriveFolder,
  extractDriveFolderId
} from '../services/googleDriveService';

interface GoogleDriveFolderPickerProps {
  onVideoSelected: (file: File, meta: GoogleDriveVideoItem) => Promise<void> | void;
  isProcessing?: boolean;
}

export const GoogleDriveFolderPicker: React.FC<GoogleDriveFolderPickerProps> = ({
  onVideoSelected,
  isProcessing = false
}) => {
  const [folderInput, setFolderInput] = useState<string>(getSavedLastDriveFolder() || '');
  const [apiKey, setApiKey] = useState<string>(getSavedDriveApiKey() || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(!getSavedDriveApiKey());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [videos, setVideos] = useState<GoogleDriveVideoItem[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Tự động quét nếu đã có link và apiKey
    if (folderInput.trim() && apiKey.trim()) {
      handleScanFolder();
    }
  }, []);

  const handleScanFolder = async () => {
    if (!folderInput.trim()) {
      setErrorMsg('Vui lòng nhập link hoặc ID thư mục Google Drive!');
      return;
    }

    const folderId = extractDriveFolderId(folderInput);
    if (!folderId) {
      setErrorMsg('Định dạng link hoặc ID thư mục Google Drive không hợp lệ!');
      return;
    }

    setErrorMsg(null);
    setIsScanning(true);
    setVideos([]);

    try {
      if (apiKey.trim()) {
        saveDriveApiKey(apiKey);
      }
      saveLastDriveFolder(folderInput);

      const items = await scanDriveFolderVideos(folderInput, apiKey);
      if (items.length === 0) {
        setErrorMsg('Không tìm thấy file video nào (.mp4, .mov, .webm) trong thư mục này.');
      } else {
        setVideos(items);
      }
    } catch (err: any) {
      console.error('Lỗi quét Google Drive:', err);
      setErrorMsg(err.message || 'Không thể quét thư mục Google Drive. Vui lòng kiểm tra lại quyền truy cập hoặc API Key.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectAndDownload = async (item: GoogleDriveVideoItem) => {
    if (downloadingFileId || isProcessing) return;

    setErrorMsg(null);
    setDownloadingFileId(item.id);
    setDownloadProgress(0);

    try {
      const file = await downloadDriveVideoAsFile(item, apiKey, (pct) => {
        setDownloadProgress(pct);
      });

      await onVideoSelected(file, item);
    } catch (err: any) {
      console.error('Lỗi tải video từ Google Drive:', err);
      setErrorMsg(err.message || 'Lỗi khi tải video từ Google Drive về trình duyệt.');
    } finally {
      setDownloadingFileId(null);
      setDownloadProgress(0);
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Quét Thư Mục Google Drive
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Tự động tải & Chia video
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Nhập link thư mục Drive chứa video raw cảnh homestay, phòng ốc để nạp nhanh vào bộ cắt video.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>{showApiKeyInput ? 'Ẩn cấu hình API Key' : 'Cấu hình Google API Key'}</span>
        </button>
      </div>

      {/* API Key Configuration Dropdown */}
      {showApiKeyInput && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Google Drive API Key (Tùy chọn cho thư mục riêng tư / API v3):
            </label>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
            >
              Lấy API Key miễn phí <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => {
                saveDriveApiKey(apiKey);
                setErrorMsg('Đã lưu Google Drive API Key!');
                setTimeout(() => setErrorMsg(null), 2500);
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Lưu Key
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            * Mẹo: Thư mục Google Drive nên được bật quyền <b>"Bất kỳ ai có đường liên kết đều có thể xem"</b> để quét và tải nhanh nhất.
          </p>
        </div>
      )}

      {/* Input Link Thư Mục Drive */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FolderSearch className="w-4 h-4 text-cyan-400" />
          Dán link hoặc ID thư mục Google Drive:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleScanFolder();
            }}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleScanFolder}
            disabled={isScanning || !folderInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang quét...</span>
              </>
            ) : (
              <>
                <FolderSearch className="w-4 h-4" />
                <span>Quét Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông báo Lỗi / Thành công */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tiến trình tải xuống video (Downloading Modal/Bar) */}
      {downloadingFileId && (
        <div className="bg-blue-950/80 border border-blue-500/40 rounded-xl p-4 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-200">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Đang tải video từ Google Drive về máy và nạp vào bộ chia video...
            </span>
            <span className="text-cyan-400 font-bold">{downloadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Danh sách kết quả Video quét được */}
      {videos.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              Đã tìm thấy <b className="text-cyan-400">{videos.length}</b> video trong thư mục:
            </span>
            <button
              type="button"
              onClick={handleScanFolder}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              Làm mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {videos.map((item) => {
              const isSelected = downloadingFileId === item.id;
              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-900/30 border-cyan-400 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  {/* Thumbnail / Placeholder */}
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 mb-2.5 flex items-center justify-center">
                    {item.thumbnailLink ? (
                      <img
                        src={item.thumbnailLink}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Film className="w-8 h-8 text-slate-600" />
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Film className="w-6 h-6 text-white drop-shadow" />
                    </div>

                    {item.sizeMb && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-slate-300">
                        {item.sizeMb} MB
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1 mb-3">
                    <p
                      className="text-xs font-bold text-slate-200 line-clamp-2 title-ellipsis"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.createdTime ? new Date(item.createdTime).toLocaleDateString('vi-VN') : 'Google Drive Video'}
                    </p>
                  </div>

                  {/* Nút Chọn & Tải */}
                  <button
                    type="button"
                    onClick={() => handleSelectAndDownload(item)}
                    disabled={Boolean(downloadingFileId) || isProcessing}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSelected ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang nạp...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Chọn & Chia Video Này</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
