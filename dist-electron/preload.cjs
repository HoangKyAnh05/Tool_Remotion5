const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  synthesizeTTS: (params) => ipcRenderer.invoke('tts:synthesize', params),
  renderVideo: (params) => ipcRenderer.invoke('render:video', params),
  onRenderProgress: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('render:progress', subscription);
    return () => {
      ipcRenderer.removeListener('render:progress', subscription);
    };
  },
  searchWebImages: (query) => ipcRenderer.invoke('media:search-web', query),
  searchWebVideos: (query, page = 1) => ipcRenderer.invoke('media:search-videos', query, page),
  restartApp: () => ipcRenderer.invoke('app:restart'),
  reloadApp: () => ipcRenderer.invoke('app:reload'),
  openPath: (path) => ipcRenderer.invoke('shell:open-path', path),
  selectFile: (options) => ipcRenderer.invoke('dialog:select-file', options),
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  readAudioBase64: (filePath) => ipcRenderer.invoke('audio:read-file-base64', filePath),
  transcribeAudio: (params) => ipcRenderer.invoke('audio:transcribe', params),
  onProcessMessage: (callback) => {
    ipcRenderer.on('main-process-message', (_event, value) => callback(value));
  }
});
