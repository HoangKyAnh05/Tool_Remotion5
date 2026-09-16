import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  synthesizeTTS: (params: { text: string; voice?: string; rate?: string; pitch?: string }) =>
    ipcRenderer.invoke('tts:synthesize', params),
  renderVideo: (params: { project: any; resolution?: '1080p' | '4k' }) =>
    ipcRenderer.invoke('render:video', params),
  onRenderProgress: (callback: (data: { progress: number; stage: string; message: string }) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('render:progress', subscription);
    return () => {
      ipcRenderer.removeListener('render:progress', subscription);
    };
  },
  searchWebImages: (query: string) => ipcRenderer.invoke('media:search-web', query),
  searchWebVideos: (query: string, page: number = 1) => ipcRenderer.invoke('media:search-videos', query, page),
  restartApp: () => ipcRenderer.invoke('app:restart'),
  reloadApp: () => ipcRenderer.invoke('app:reload'),
  openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),
  selectFile: (options: any) => ipcRenderer.invoke('dialog:select-file', options),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  readAudioBase64: (filePath: string) => ipcRenderer.invoke('audio:read-file-base64', filePath),
  transcribeAudio: (params: { audioBase64: string; mimeType?: string; apiKey?: string }) =>
    ipcRenderer.invoke('audio:transcribe', params),
  geminiGenerate: (params: { prompt: string; modelId?: number; thinkMode?: number; cookie?: string; xsrfToken?: string }) =>
    ipcRenderer.invoke('ai:gemini-generate', params),
  trainVoice: (params: { name: string; voiceId: string; fileType: string; fileName: string; fileBase64: string }) =>
    ipcRenderer.invoke('voice:train', params),
  onProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value));
  }
});
