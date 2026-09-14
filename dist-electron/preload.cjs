var n = (e, o) => () => (o || e((o = { exports: {} }).exports, o), o.exports);
import { contextBridge as a, ipcRenderer as r } from "electron";
var d = n(() => {
  a.exposeInMainWorld("electronAPI", {
    synthesizeTTS: (e) => r.invoke("tts:synthesize", e),
    renderVideo: (e) => r.invoke("render:video", e),
    onRenderProgress: (e) => {
      const o = (s, i) => e(i);
      return r.on("render:progress", o), () => {
        r.removeListener("render:progress", o);
      };
    },
    searchWebImages: (e) => r.invoke("media:search-web", e),
    searchWebVideos: (e, o = 1) => r.invoke("media:search-videos", e, o),
    restartApp: () => r.invoke("app:restart"),
    reloadApp: () => r.invoke("app:reload"),
    openPath: (e) => r.invoke("shell:open-path", e),
    selectFile: (e) => r.invoke("dialog:select-file", e),
    selectFolder: () => r.invoke("dialog:select-folder"),
    readAudioBase64: (e) => r.invoke("audio:read-file-base64", e),
    transcribeAudio: (e) => r.invoke("audio:transcribe", e),
    onProcessMessage: (e) => {
      r.on("main-process-message", (o, s) => e(s));
    }
  });
});
export default d();
