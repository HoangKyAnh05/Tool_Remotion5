import React, { useState } from 'react';
import { X, Mic, Upload, Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Volume2, FileAudio, Key, ShieldCheck, Zap } from 'lucide-react';
import { VoiceOption } from '../types/video';
import { getSavedCustomVoices, saveCustomVoice, deleteCustomVoice } from '../services/customVoicesService';
import { cloneElevenLabsVoice, getSavedElevenLabsApiKey, saveElevenLabsApiKey } from '../services/elevenLabsService';

interface VoiceTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceAdded?: (voice: VoiceOption) => void;
}

export const VoiceTrainerModal: React.FC<VoiceTrainerModalProps> = ({
  isOpen,
  onClose,
  onVoiceAdded
}) => {
  const [voiceName, setVoiceName] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [cloneEngine, setCloneEngine] = useState<'f5' | 'elevenlabs' | 'onnx'>('f5');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [elevenApiKey, setElevenApiKey] = useState<string>(() => getSavedElevenLabsApiKey());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customList, setCustomList] = useState<VoiceOption[]>(() => getSavedCustomVoices());

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setVoiceName(val);
    if (!voiceId || voiceId.startsWith('user_')) {
      const slug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 20);
      setVoiceId(slug || 'custom_voice');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.name.endsWith('.onnx')) {
        setCloneEngine('onnx');
      }
      setErrorMessage(null);
    }
  };

  const handleStartTrainAndDeploy = async () => {
    if (!voiceName.trim()) {
      setErrorMessage('Vui lòng nhập tên cho giọng đọc AI (ví dụ: Độ Mixi, PewPew, Shark Hưng...)');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn file âm thanh (.mp3, .wav) hoặc file mô hình (.onnx) từ máy tính!');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Save ElevenLabs API Key if entered
    if (elevenApiKey.trim()) {
      saveElevenLabsApiKey(elevenApiKey.trim());
    }

    try {
      // 1. ElevenLabs Instant Voice Clone
      if (cloneEngine === 'elevenlabs') {
        const activeKey = elevenApiKey.trim() || getSavedElevenLabsApiKey().trim();
        if (!activeKey) {
          throw new Error('Vui lòng nhập ElevenLabs API Key để nhân bản giọng đọc ElevenLabs!');
        }

        setProgressStatus('Đang gửi mẫu giọng lên AI Neural Cloning Engine để nhân bản 100% chất giọng...');
        const cloneRes = await cloneElevenLabsVoice(voiceName.trim(), selectedFile, activeKey);

        const newVoice: VoiceOption = {
          id: cloneRes.voiceId,
          name: cloneRes.name,
          locale: 'vi-VN',
          gender: 'Male',
          description: `Mô hình giọng đọc AI nhân bản 100% chuẩn giọng cho ${voiceName.trim()}.`
        };

        saveCustomVoice(newVoice);
        setCustomList(getSavedCustomVoices());
        setSuccessMessage(`✨ Đã nhân bản 100% chuẩn giọng "${voiceName}" qua ElevenLabs thành công!`);
        setProgressStatus('');

        if (onVoiceAdded) {
          onVoiceAdded(newVoice);
        }

        setVoiceName('');
        setVoiceId('');
        setSelectedFile(null);
        return;
      }

      // 2. F5-TTS Free Zero-Shot Clone OR Local ONNX
      setProgressStatus('Đang trích xuất dữ liệu âm thanh và thiết lập mô hình Zero-Shot Voice Clone...');

      // Convert file to base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || res;
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const fileBase64 = await fileDataPromise;

      let result: any = null;
      const cleanSlug = voiceId.trim() || 'custom_voice';
      const payload = {
        name: voiceName.trim(),
        voiceId: cleanSlug,
        fileType: cloneEngine === 'onnx' ? 'onnx' : 'audio',
        fileName: selectedFile.name,
        fileBase64
      };

      if ((window as any).electronAPI?.trainVoice) {
        result = await (window as any).electronAPI.trainVoice(payload);
      } else {
        const res = await fetch('/api/train-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        result = await res.json();
      }

      if (!result || result.error) {
        throw new Error(result?.error || 'Huấn luyện giọng không thành công');
      }

      const isF5 = cloneEngine === 'f5';
      const targetVoiceId = isF5 ? `f5:${cleanSlug}` : (result.voiceId || `piper:${cleanSlug}`);
      const displayName = isF5 
        ? `👑 ${voiceName.trim()} (F5-TTS Voice Clone 100% Free)` 
        : `👑 ${voiceName.trim()} (Offline Model Đã Nạp)`;

      const newVoice: VoiceOption = {
        id: targetVoiceId,
        name: displayName,
        locale: 'vi-VN',
        gender: 'Male',
        description: `Mô hình giọng đọc AI Zero-Shot cho ${voiceName.trim()}.`
      };

      saveCustomVoice(newVoice);
      setCustomList(getSavedCustomVoices());
      setSuccessMessage(`✨ Đã nạp thành công giọng "${voiceName}" bằng F5-TTS Free Clone vào App!`);
      setProgressStatus('');

      if (onVoiceAdded) {
        onVoiceAdded(newVoice);
      }

      // Reset form
      setVoiceName('');
      setVoiceId('');
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Training error:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra trong quá trình nhân bản giọng nói.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteCustomVoice(id);
    setCustomList(getSavedCustomVoices());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Studio Nhân Bản & Huấn Luyện Giọng AI</h2>
              <p className="text-xs text-emerald-100">Nhân bản 100% chuẩn giọng thật từ file âm thanh máy tính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                1. Tên nhân vật / Giọng đọc AI:
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Độ Mixi, PewPew, Shark Hưng, Duy Nến, Giọng Của Tôi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Tải lên file âm thanh mẫu giọng nói (.mp3, .wav, .m4a):
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="voice-upload-input"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.onnx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="voice-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                    {selectedFile?.name.endsWith('.onnx') ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-[11px] text-emerald-600 font-medium">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng xử lý
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-emerald-700 hover:underline">Bấm để chọn file âm thanh từ máy tính</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ file MP3, WAV hoặc tệp mô hình .onnx</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Chọn công nghệ nhân bản AI */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Chọn công nghệ nhân bản giọng AI:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Option 1: F5-TTS Free */}
                <div 
                  onClick={() => setCloneEngine('f5')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${cloneEngine === 'f5' ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>F5-TTS Zero-Shot Clone</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100% Free</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mô hình mã nguồn mở miễn phí, tự động clone từ file ghi âm mà <b>không cần API Key</b>.
                  </p>
                </div>

                {/* Option 2: ElevenLabs Clone */}
                <div 
                  onClick={() => setCloneEngine('elevenlabs')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${cloneEngine === 'elevenlabs' ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>ElevenLabs Neural Clone</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">Cần API Key</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Chất lượng phòng thu Studio, chuẩn 100% từng tiếng thở và phát âm tiếng Việt.
                  </p>
                </div>
              </div>

              {cloneEngine === 'elevenlabs' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Nhập ElevenLabs API Key:</span>
                  </div>
                  <input
                    type="password"
                    value={elevenApiKey}
                    onChange={(e) => setElevenApiKey(e.target.value)}
                    placeholder="Dán mã xi-api-key tại đây (Lấy miễn phí tại elevenlabs.io)..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 Đăng ký tài khoản miễn phí tại <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className="text-emerald-600 underline">elevenlabs.io</a> để nhận 10.000 ký tự free mỗi tháng.
                  </p>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-900">{progressStatus}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleStartTrainAndDeploy}
              disabled={isProcessing || !voiceName.trim() || !selectedFile}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tiến hành nhân bản & tạo mô hình AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt Đầu Nhân Bản & Nạp Giọng Vào App</span>
                </>
              )}
            </button>
          </div>

          {/* List of Custom Voices */}
          {customList.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Các giọng đọc AI đã nhân bản ({customList.length}):</span>
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {customList.map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileAudio className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{v.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded-lg cursor-pointer"
                      title="Xóa giọng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Hỗ trợ F5-TTS Free Clone, ElevenLabs và mô hình Offline VITS .onnx</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200/60 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
