import React from 'react';
import { Key, Mic, Sliders, FolderOpen, Save, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeyGemini: string;
  setApiKeyGemini: (key: string) => void;
  apiKeyPexels: string;
  setApiKeyPexels: (key: string) => void;
  voiceRate: string;
  setVoiceRate: (rate: string) => void;
  voicePitch: string;
  setVoicePitch: (pitch: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeyGemini,
  setApiKeyGemini,
  apiKeyPexels,
  setApiKeyPexels,
  voiceRate,
  setVoiceRate,
  voicePitch,
  setVoicePitch
}) => {
  if (!isOpen) return null;

  const [githubPageUrl, setGithubPageUrl] = React.useState(
    () => localStorage.getItem('GITHUB_PAGE_URL') || 'https://hoangkyanh05.github.io/Tool_Report/'
  );
  const [apiKeyElevenLabs, setApiKeyElevenLabs] = React.useState(
    () => localStorage.getItem('ELEVENLABS_API_KEY') || ''
  );
  const [apiKeyVClip, setApiKeyVClip] = React.useState(
    () => localStorage.getItem('VCLIP_API_KEY') || ''
  );
  const [voiceIdVClip, setVoiceIdVClip] = React.useState(
    () => localStorage.getItem('VCLIP_VOICE_ID') || '8VXsCLxU7Pn55ADXQc6sAb'
  );

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKeyGemini);
    localStorage.setItem('PEXELS_API_KEY', apiKeyPexels);
    localStorage.setItem('ELEVENLABS_API_KEY', apiKeyElevenLabs);
    localStorage.setItem('VCLIP_API_KEY', apiKeyVClip);
    localStorage.setItem('VCLIP_VOICE_ID', voiceIdVClip);
    localStorage.setItem('VOICE_RATE', voiceRate);
    localStorage.setItem('VOICE_PITCH', voicePitch);
    localStorage.setItem('GITHUB_PAGE_URL', githubPageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Cấu Hình Dịch Vụ & API Keys</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold px-2">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* GitHub Page URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Đường dẫn GitHub Pages:</span>
              <a
                href={githubPageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Mở thử
              </a>
            </label>
            <input
              type="text"
              value={githubPageUrl}
              onChange={(e) => setGithubPageUrl(e.target.value)}
              placeholder="https://hoangkyanh05.github.io/Tool_Report/"
              className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none font-mono"
            />
          </div>

          {/* Pexels API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span>Pexels API Key (Kho video/ảnh HD miễn phí):</span>
              <a
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Lấy key miễn phí
              </a>
            </label>
            <input
              type="password"
              value={apiKeyPexels}
              onChange={(e) => setApiKeyPexels(e.target.value)}
              placeholder="Nhập Pexels API Key..."
              className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none"
            />
          </div>

          {/* ElevenLabs API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span>⚡</span>
                <span>ElevenLabs API Key (Giọng đọc AI siêu chân thực):</span>
              </span>
              <a
                href="https://elevenlabs.io/app/speech-synthesis"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Lấy ElevenLabs Key
              </a>
            </label>
            <input
              type="password"
              value={apiKeyElevenLabs}
              onChange={(e) => setApiKeyElevenLabs(e.target.value)}
              placeholder="Nhập xi-api-key từ ElevenLabs..."
              className="w-full bg-gray-950 border border-amber-500/40 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-amber-200 focus:outline-none font-mono"
            />
          </div>

          {/* VClip API (vclip.io) - Giọng Adam AI TikTok */}
          <div className="space-y-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>VClip API (vclip.io - Giọng Adam AI TikTok)</span>
              </label>
              <a
                href="https://vclip.io"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-400 hover:underline font-semibold"
              >
                Mở VClip.io
              </a>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300">VClip API Key:</label>
              <input
                type="password"
                value={apiKeyVClip}
                onChange={(e) => setApiKeyVClip(e.target.value)}
                placeholder="sk_live_..."
                className="w-full bg-gray-950 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-3 py-1.5 text-xs text-emerald-200 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300">VClip User Voice ID (Mã giọng Adam hoặc clone trong thư viện):</label>
              <input
                type="text"
                value={voiceIdVClip}
                onChange={(e) => setVoiceIdVClip(e.target.value)}
                placeholder="Nhập userVoiceId (ví dụ: adam)..."
                className="w-full bg-gray-950 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-3 py-1.5 text-xs text-emerald-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Groq / AI Engine API Key */}
          {/* DeepSeek & AI Script Engine */}
          <div className="space-y-1.5 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/30 border border-indigo-500/40 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>DeepSeek AI Engine (DeepSeek V3 / R1)</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DeepSeek R1 / V3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nhập <strong>DeepSeek API Key</strong> (bắt đầu bằng <code>sk-...</code>) hoặc Groq API Key (<code>gsk_...</code>) để AI tự động viết kịch bản phân cảnh siêu thông minh:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="password"
                value={apiKeyGemini}
                onChange={(e) => {
                  const val = e.target.value;
                  setApiKeyGemini(val);
                  localStorage.setItem('DEEPSEEK_API_KEY', val.trim());
                  localStorage.setItem('OPENAI_API_KEY', val.trim());
                  localStorage.setItem('GROQ_API_KEY', val.trim());
                  localStorage.setItem('GEMINI_API_KEY', val.trim());
                }}
                placeholder="Nhập DeepSeek API Key (sk-...) hoặc Groq Key (gsk_...)"
                className="w-full bg-gray-950 border border-indigo-500/40 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-indigo-100 focus:outline-none placeholder:text-slate-500 font-mono"
              />
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-300 hover:text-cyan-100 bg-cyan-900/40 border border-cyan-500/40 px-2.5 py-2 rounded-xl shrink-0 whitespace-nowrap font-medium"
              >
                Lấy DeepSeek Key
              </a>
            </div>
          </div>

          {/* Voice Speech Rate & Pitch */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Mic className="w-3 h-3 text-indigo-400" />
                <span>Tốc độ đọc (Rate):</span>
              </label>
              <select
                value={voiceRate}
                onChange={(e) => setVoiceRate(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="-20%">Chậm (-20%)</option>
                <option value="-10%">Hơi chậm (-10%)</option>
                <option value="+0%">Bình thường (Chuẩn 1.0x)</option>
                <option value="+10%">Nhanh nhẹ (+10%)</option>
                <option value="+20%">Nhanh TikTok (+20%)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Cao độ giọng (Pitch):</span>
              </label>
              <select
                value={voicePitch}
                onChange={(e) => setVoicePitch(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
              >
                <option value="-10Hz">Trầm hơn (-10Hz)</option>
                <option value="+0Hz">Mặc định (+0Hz)</option>
                <option value="+10Hz">Thanh hơn (+10Hz)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 bg-gray-950/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('🔄 Khởi động lại ứng dụng ngay?')) {
                if (window.electronAPI?.restartApp) {
                  await window.electronAPI.restartApp();
                } else if (window.electronAPI?.reloadApp) {
                  await window.electronAPI.reloadApp();
                } else {
                  window.location.reload();
                }
              }
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 transition-all flex items-center gap-1.5"
          >
            <span>🔄 Khởi Động Lại App</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
