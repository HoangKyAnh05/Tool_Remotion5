import { app as M, BrowserWindow as V, ipcMain as _, shell as F, dialog as K, session as U } from "electron";
import k from "path";
import { spawn as C } from "child_process";
import { fileURLToPath as q } from "url";
import D from "https";
import L from "http";
import $ from "fs";
import { Communicate as O } from "edge-tts-universal";
import { bundle as j } from "@remotion/bundler";
import { selectComposition as H, renderMedia as z } from "@remotion/renderer";
const J = q(import.meta.url), E = k.dirname(J);
process.env.DIST = k.join(E, "../dist");
process.env.VITE_PUBLIC = M.isPackaged ? process.env.DIST : k.join(process.env.DIST, "../public");
let m, A = null;
const B = process.env.VITE_DEV_SERVER_URL;
function W() {
  m = new V({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: k.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: $.existsSync(k.join(E, "preload.cjs")) ? k.join(E, "preload.cjs") : k.join(E, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), U.defaultSession.setPermissionRequestHandler((f, b, g) => {
    g(!0);
  }), m.show(), m.focus(), m.webContents.on("did-finish-load", () => {
    m == null || m.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), B ? m.loadURL(B) : m.loadFile(k.join(process.env.DIST || "", "index.html"));
}
M.on("window-all-closed", () => {
  process.platform !== "darwin" && (M.quit(), m = null);
});
M.on("activate", () => {
  V.getAllWindows().length === 0 && W();
});
M.whenReady().then(() => {
  W(), ne();
});
function G(f) {
  return new Promise((b, g) => {
    (f.startsWith("https") ? D : L).get(
      f,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (t) => {
        if (t.statusCode && t.statusCode >= 400)
          return g(new Error(`HTTP error ${t.statusCode}`));
        const r = [];
        t.on("data", (o) => r.push(Buffer.isBuffer(o) ? o : Buffer.from(o))), t.on("end", () => b(Buffer.concat(r)));
      }
    ).on("error", g);
  });
}
async function Y(f, b) {
  try {
    const e = f.trim().split(/\s+/).filter(Boolean), r = !b.startsWith("en-") ? "vi" : "en", o = [];
    let n = "";
    for (const c of e)
      (n + " " + c).length > 80 ? (o.push(n.trim()), n = c) : n += " " + c;
    n.trim() && o.push(n.trim());
    const p = [];
    for (const c of o) {
      const l = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        c
      )}&tl=${r}&client=tw-ob`, h = await G(l);
      p.push(h);
    }
    const i = Buffer.concat(p), u = `data:audio/mp3;base64,${i.toString("base64")}`, a = Math.max(3, i.length / 3800), d = [], w = (a - 0.4) / Math.max(e.length, 1);
    let y = 0.2;
    for (const c of e) {
      const l = Math.max(0.2, Math.min(0.7, w));
      d.push({
        word: c,
        start: Number(y.toFixed(2)),
        end: Number((y + l).toFixed(2))
      }), y += l;
    }
    return {
      audioUrl: u,
      duration: Number((y + 0.3).toFixed(2)),
      words: d
    };
  } catch {
    const e = f.trim().split(/\s+/).filter(Boolean), t = e.map((r, o) => ({
      word: r,
      start: Number((o * 0.35 + 0.2).toFixed(2)),
      end: Number(((o + 1) * 0.35 + 0.2).toFixed(2))
    }));
    return {
      audioUrl: "",
      duration: Math.max(3.5, e.length * 0.35 + 0.5),
      words: t
    };
  }
}
function Q(f = "+0%") {
  if (!f) return "+0%";
  const b = String(f).trim();
  if (b.includes("%")) {
    const e = parseInt(b.replace("%", ""));
    return isNaN(e) ? b : e >= 0 ? `+${e}%` : `${e}%`;
  }
  if (b.toLowerCase().endsWith("x")) {
    const e = parseFloat(b.replace(/x/i, ""));
    if (!isNaN(e)) {
      const t = Math.round((e - 1) * 100);
      return t >= 0 ? `+${t}%` : `${t}%`;
    }
  }
  const g = parseFloat(b);
  if (!isNaN(g) && g > 0 && g <= 3) {
    const e = Math.round((g - 1) * 100);
    return e >= 0 ? `+${e}%` : `${e}%`;
  }
  return "+0%";
}
function Z(f = "vi-VN-NamMinhNeural", b = "+0%", g = "+0Hz") {
  let e = f || "vi-VN-NamMinhNeural", t = Q(b), r = "+0Hz";
  if (f === "google-vi-male" || f === "vi-male" || f === "adam" || f === "adam-tiktok" || f === "vclip:adam")
    e = "vi-VN-NamMinhNeural";
  else if (f === "google-vi" || f === "vi-female")
    e = "vi-VN-HoaiMyNeural";
  else if (f.includes(":") && !f.startsWith("elevenlabs:")) {
    const [o, n] = f.split(":");
    e = o || "vi-VN-NamMinhNeural", t === "+0%" && (n === "fast" || n === "live" || n === "adam" ? t = "+18%" : n === "recap" ? t = "+28%" : n === "sweet" ? t = "+8%" : n === "genz" ? t = "+20%" : n === "story" ? t = "-8%" : (n === "ngochuyen" || n === "manhdung") && (t = "+0%")), n === "manhdung" && (r = "-1Hz");
  }
  return { effectiveVoice: e, effectiveRate: t, effectivePitch: r };
}
function X(f, b, g = "+0%") {
  return new Promise((e, t) => {
    const r = k.resolve(E, "../scripts/kokoro_tts_engine.py"), o = C("python", [r, "--json"], { windowsHide: !0 });
    let n = "", p = "";
    o.stdout.on("data", (u) => n += u.toString("utf-8")), o.stderr.on("data", (u) => p += u.toString("utf-8")), o.on("close", (u) => {
      if (u !== 0)
        return t(new Error(`Kokoro process exited with code ${u}: ${p}`));
      try {
        const a = JSON.parse(n);
        e(a);
      } catch (a) {
        t(new Error(`Failed to parse Kokoro JSON: ${a.message}`));
      }
    });
    let i = 1;
    if (g.includes("%")) {
      const u = parseInt(g.replace("%", ""));
      isNaN(u) || (i = Math.max(0.5, Math.min(2, 1 + u / 100)));
    }
    const s = b.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    o.stdin.write(JSON.stringify({ text: f, voice: s, speed: i })), o.stdin.end();
  });
}
function ee(f, b) {
  return new Promise((g, e) => {
    const t = k.resolve(E, "../scripts/trainer/f5_tts_engine.py"), r = C("python", [t, "--json"], { windowsHide: !0 });
    let o = "", n = "";
    r.stdout.on("data", (i) => o += i.toString("utf-8")), r.stderr.on("data", (i) => n += i.toString("utf-8")), r.on("close", (i) => {
      if (i !== 0)
        return e(new Error(`F5-TTS process exited with code ${i}: ${n}`));
      try {
        const s = JSON.parse(o);
        g(s);
      } catch (s) {
        e(new Error(`Failed to parse F5-TTS JSON: ${s.message}`));
      }
    });
    const p = Buffer.from(JSON.stringify({ text: f, voice: b }), "utf-8");
    r.stdin.write(p), r.stdin.end();
  });
}
function te(f, b, g = "+0%") {
  return new Promise((e, t) => {
    const r = k.resolve(E, "../scripts/piper_tts_engine.py"), o = C("python", [r, "--json"], { windowsHide: !0 });
    let n = "", p = "";
    o.stdout.on("data", (a) => n += a.toString("utf-8")), o.stderr.on("data", (a) => p += a.toString("utf-8")), o.on("close", (a) => {
      if (a !== 0)
        return t(new Error(`Piper process exited with code ${a}: ${p}`));
      try {
        const d = JSON.parse(n);
        e(d);
      } catch (d) {
        t(new Error(`Failed to parse Piper JSON: ${d.message}`));
      }
    });
    let i = 1;
    if (g.includes("%")) {
      const a = parseInt(g.replace("%", ""));
      isNaN(a) || (i = Math.max(0.5, Math.min(2, 1 + a / 100)));
    }
    const s = b.toLowerCase().replace("piper:", "").trim() || "ngochuyen", u = Buffer.from(JSON.stringify({ text: f, voice: s, speed: i }), "utf-8");
    o.stdin.write(u), o.stdin.end();
  });
}
function ne() {
  _.handle(
    "tts:synthesize",
    async (g, { text: e, voice: t = "vi-VN-NamMinhNeural", rate: r = "+0%", pitch: o = "+0Hz" }) => {
      try {
        const n = e.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        if (t.startsWith("f5:"))
          try {
            const h = await ee(n, t);
            if (h && h.audioUrl)
              return h;
          } catch (h) {
            console.warn("F5-TTS Zero-Shot failed, falling back to Piper VITS:", h);
          }
        if (t.startsWith("piper:") || t === "piper_ngochuyen" || t === "piper_manhdung")
          try {
            const h = await te(n, t, r);
            if (h && h.audioUrl)
              return h;
          } catch (h) {
            console.warn("Piper VITS TTS failed, falling back to neural voice:", h);
          }
        if (t.startsWith("kokoro:") || t === "ngoc_huyen" || t === "manh_dung")
          try {
            const h = await X(n, t, r);
            if (h && h.audioUrl)
              return h;
          } catch (h) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", h);
          }
        const { effectiveVoice: p, effectiveRate: i, effectivePitch: s } = Z(t, r, o), u = new O(n, {
          voice: p,
          rate: i,
          pitch: s
        }), a = [], d = [];
        for await (const h of u.stream()) {
          const v = h;
          if (v.type === "audio" && v.data)
            d.push(Buffer.isBuffer(v.data) ? v.data : Buffer.from(v.data));
          else if (v.type === "WordBoundary" && v.text) {
            const x = Number(((v.offset || 0) / 1e7).toFixed(2)), S = Number(((v.duration || 0) / 1e7).toFixed(2));
            a.push({
              word: String(v.text),
              start: x,
              end: Number((x + S).toFixed(2))
            });
          }
        }
        const w = Buffer.concat(d);
        if (w.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const c = `data:audio/mp3;base64,${w.toString("base64")}`;
        let l = 3;
        return a.length > 0 ? l = Number((a[a.length - 1].end + 0.3).toFixed(2)) : l = Number(Math.max(2.5, w.length / 5500).toFixed(2)), {
          audioUrl: c,
          duration: l,
          words: a
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(e, t);
      }
    }
  ), _.handle("render:video", async (g, { project: e, resolution: t = "1080p" }) => {
    try {
      const r = k.resolve("out");
      $.existsSync(r) || $.mkdirSync(r, { recursive: !0 });
      const n = `${(e.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, p = k.join(r, n);
      m == null || m.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const i = k.resolve("src/remotion/index.ts");
      A = await j({
        entryPoint: i,
        onProgress: (c) => {
          m == null || m.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + c * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${c}%)...`
          });
        }
      }), m == null || m.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const s = e.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", u = await H({
        serveUrl: A,
        id: s,
        inputProps: { project: e }
      }), a = e.fps || 30, d = Math.max(
        (e.scenes || []).reduce(
          (c, l) => c + Math.max(Math.round((l.audioDuration || 4) * a), Math.round(2 * a)),
          0
        ),
        30
      );
      let w = e.aspectRatio === "9:16" ? 1080 : 1920, y = e.aspectRatio === "9:16" ? 1920 : 1080;
      return t === "4k" && (w = e.aspectRatio === "9:16" ? 2160 : 3840, y = e.aspectRatio === "9:16" ? 3840 : 2160), m == null || m.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${d} khung hình (${w}x${y})...`
      }), await z({
        composition: {
          ...u,
          durationInFrames: d,
          width: w,
          height: y,
          fps: a
        },
        serveUrl: A,
        codec: "h264",
        outputLocation: p,
        inputProps: { project: e },
        onProgress: ({ progress: c }) => {
          const l = Math.min(99, Math.round(32 + c * 66));
          m == null || m.webContents.send("render:progress", {
            progress: l,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(c * 100)}%)...`
          });
        }
      }), m == null || m.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: p
      };
    } catch (r) {
      throw console.error("Render media error in main process:", r), new Error(r.message || "Render video thất bại");
    }
  }), _.handle("shell:open-path", async (g, e) => F.openPath(e)), _.handle("dialog:select-file", async (g, e) => m ? (await K.showOpenDialog(m, e)).filePaths : null), _.handle("dialog:select-folder", async () => m && (await K.showOpenDialog(m, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), _.handle("audio:read-file-base64", async (g, e) => {
    try {
      if (!e || !$.existsSync(e)) return null;
      const t = await $.promises.readFile(e), r = k.extname(e).toLowerCase().replace(".", "");
      let o = "audio/mp3";
      r === "wav" ? o = "audio/wav" : r === "m4a" ? o = "audio/m4a" : r === "aac" ? o = "audio/aac" : r === "ogg" ? o = "audio/ogg" : r === "mp4" ? o = "video/mp4" : r === "mov" ? o = "video/quicktime" : r === "webm" ? o = "video/webm" : r === "mkv" && (o = "video/x-matroska");
      const n = t.toString("base64");
      return {
        dataUrl: `data:${o};base64,${n}`,
        base64: n,
        mimeType: o,
        sizeBytes: t.length
      };
    } catch (t) {
      return console.error("Error reading audio/video file base64:", t), null;
    }
  });
  const f = process.env.GEMINI_API_KEY || "";
  _.handle("audio:transcribe", async (g, e) => {
    var i, s, u, a, d, w, y;
    const { audioBase64: t, mimeType: r = "audio/mp3" } = e, o = e.apiKey && e.apiKey.trim() ? e.apiKey.trim() : f;
    if (!t) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (r || "audio/mp3").split(";")[0].trim().toLowerCase(), p = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (o && o.trim()) {
      const c = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
Nhiệm vụ: Nghe kỹ file âm thanh đính kèm và nhận diện chính xác toàn bộ câu từ được phát âm (tiếng Việt hoặc tiếng Anh).

Yêu cầu BẮT BUỘC:
1. "narration": Văn bản toàn bộ câu thoại nghe được trong audio (không thêm thắt nội dung ngoài âm thanh).
2. "duration": Thời lượng file âm thanh tính bằng giây (số thực, ví dụ 3.5).
3. "language": "vi" hoặc "en".
4. "words": Mảng từng từ được phát âm cùng mốc thời gian bắt đầu ("start") và kết thúc ("end") tính bằng giây (bắt đầu từ 0.0s).

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON (KHÔNG KÈM KÝ TỰ MARKDOWN):
{
  "narration": "câu thoại bạn nghe được",
  "language": "vi",
  "duration": 3.5,
  "words": [
    { "word": "Từ", "start": 0.1, "end": 0.4 },
    { "word": "thứ", "start": 0.45, "end": 0.7 }
  ]
}`;
      let l = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-1.5-pro"
      ];
      try {
        const v = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${o.trim()}`);
        if (v.ok) {
          const x = await v.json();
          if (Array.isArray(x.models)) {
            const S = x.models.filter((T) => {
              var N;
              return (N = T.supportedGenerationMethods) == null ? void 0 : N.includes("generateContent");
            }).map((T) => T.name.replace(/^models\//, ""));
            S.length > 0 && (l = S.sort((T, N) => T.includes("2.0-flash") ? -1 : N.includes("2.0-flash") ? 1 : T.includes("flash") ? -1 : N.includes("flash") ? 1 : 0));
          }
        } else {
          const x = await v.json().catch(() => ({}));
          if ((i = x == null ? void 0 : x.error) != null && i.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (v) {
        console.warn("Auto-discover Gemini models warning:", v);
      }
      let h = "";
      for (const v of l)
        try {
          const x = `https://generativelanguage.googleapis.com/v1beta/models/${v}:generateContent?key=${o.trim()}`, S = await fetch(x, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: p,
                        data: t
                      }
                    },
                    { text: c }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
              }
            })
          });
          if (S.ok) {
            const T = await S.json();
            let N = (w = (d = (a = (u = (s = T == null ? void 0 : T.candidates) == null ? void 0 : s[0]) == null ? void 0 : u.content) == null ? void 0 : a.parts) == null ? void 0 : d[0]) == null ? void 0 : w.text;
            if (N) {
              N = N.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const P = JSON.parse(N);
              if (P && P.narration)
                return {
                  narration: String(P.narration).trim(),
                  language: P.language || "vi",
                  audioDuration: Number(P.duration || 4),
                  words: Array.isArray(P.words) ? P.words : []
                };
            }
          } else {
            const T = await S.json().catch(() => ({}));
            h = ((y = T == null ? void 0 : T.error) == null ? void 0 : y.message) || `HTTP ${S.status}`;
          }
        } catch (x) {
          h = x.message;
        }
      if (h)
        return { error: `Gemini API: ${h}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), _.handle("media:search-web", async (g, e) => {
    try {
      const t = (e || "").trim();
      if (!t) return [];
      try {
        const p = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(t)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (p.ok) {
          const u = [...(await p.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((a) => decodeURIComponent(a[1])).filter((a) => a && !a.endsWith(".svg") && !a.includes("favicon"));
          if (u.length > 0)
            return u.slice(0, 20).map((a, d) => ({
              id: `bing-img-${d}-${Date.now()}`,
              type: "image",
              url: a,
              thumbnail: a,
              title: t,
              source: "web"
            }));
        }
      } catch (p) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", p);
      }
      const n = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(t)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (n) {
        const p = n[1], s = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(t)}&vqd=${p}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (s.results && s.results.length > 0)
          return s.results.slice(0, 20).map((u, a) => ({
            id: `ddg-img-${a}-${Date.now()}`,
            type: "image",
            url: u.image,
            thumbnail: u.thumbnail || u.image,
            title: u.title || t,
            source: "web"
          }));
      }
      return [];
    } catch (t) {
      return console.warn("Web image search error:", t), [];
    }
  });
  const b = /* @__PURE__ */ new Map();
  _.handle("media:search-videos", async (g, e, t = 1) => {
    try {
      const r = (e || "").trim();
      if (!r) return [];
      const o = Math.max(1, Number(t) || 1), n = `${r.toLowerCase()}_p${o}`;
      if (b.has(n))
        return b.get(n);
      const p = (d) => d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), i = r.toLowerCase();
      let s = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(i))
        s = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(i))
        s = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(i))
        s = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(i))
        s = /cá/i.test(i) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(i))
        s = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(i))
        s = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(i))
        s = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(i))
        s = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(i))
        s = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(i))
        s = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(i))
        s = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(i))
        s = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(i))
        s = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(r)) {
        const d = r.split(/\s+/).filter(Boolean);
        s = [r, d[0] || "lifestyle", d[d.length - 1] || "cinematic"];
      } else
        s = [p(r).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const u = (o - 1) % s.length, a = [
        s[u],
        ...s.filter((d, w) => w !== u)
      ];
      for (const d of a)
        if (d)
          try {
            const w = new AbortController(), y = setTimeout(() => w.abort(), 3500), c = Math.floor((o - 1) / s.length) + 1, l = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(d)}&page=${c}&urls=true`,
              {
                signal: w.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(y), l.ok) {
              const v = (await l.json()).hits || [];
              if (v.length > 0) {
                const x = v.slice(0, 12).map((S, T) => {
                  var N, P, I, R;
                  return {
                    id: `coverr-video-${T}-${Date.now()}`,
                    type: "video",
                    url: ((N = S.urls) == null ? void 0 : N.mp4) || ((P = S.urls) == null ? void 0 : P.mp4_preview),
                    previewUrl: ((I = S.urls) == null ? void 0 : I.mp4_preview) || ((R = S.urls) == null ? void 0 : R.mp4),
                    thumbnail: S.thumbnail || S.poster,
                    title: S.title || r,
                    source: "web",
                    duration: Math.round(Number(S.duration || 8))
                  };
                });
                return b.set(n, x), x;
              }
            }
          } catch (w) {
            console.warn(`Coverr fetch failed for keyword: ${d}`, w);
          }
      return [];
    } catch (r) {
      return console.warn("Video search error in main process:", r), [];
    }
  }), _.handle(
    "ai:gemini-generate",
    async (g, e) => {
      var t, r, o, n, p, i;
      try {
        const { prompt: s, cookie: u, apiKey: a } = e || {}, d = (s || "").trim();
        if (!d)
          throw new Error("Prompt is required");
        const w = (a || u || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (w.startsWith("sk-") || w.length > 20)
          for (const y of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const c = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${w}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: y,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: d }
                  ],
                  temperature: 0.7
                })
              });
              if (c.ok) {
                const l = await c.json(), h = (o = (r = (t = l == null ? void 0 : l.choices) == null ? void 0 : t[0]) == null ? void 0 : r.message) == null ? void 0 : o.content;
                if (h && typeof h == "string")
                  return { text: h.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: h.length };
              }
            } catch (c) {
              console.warn("DeepSeek model failed in Electron main:", y, c);
            }
        if (w.startsWith("gsk_") || w.length > 20)
          for (const y of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const c = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${w}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: y,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: d }
                  ],
                  temperature: 0.7
                })
              });
              if (c.ok) {
                const l = await c.json(), h = (i = (p = (n = l == null ? void 0 : l.choices) == null ? void 0 : n[0]) == null ? void 0 : p.message) == null ? void 0 : i.content;
                if (h && typeof h == "string")
                  return { text: h.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: h.length };
              }
            } catch (c) {
              console.warn("Groq model failed in Electron main:", y, c);
            }
        return { text: "", rawLength: 0 };
      } catch (s) {
        throw console.error("Electron AI Generate error:", s), s;
      }
    }
  ), _.handle("voice:train", async (g, e) => new Promise((t, r) => {
    try {
      const o = M.getPath("temp"), n = Date.now(), p = k.join(o, `voice_train_${n}.json`), i = k.join(o, `voice_train_res_${n}.json`);
      let s = e.filePath || "";
      if (e.fileBase64) {
        const c = e.fileType === "onnx" ? "onnx" : "mp3", l = k.join(o, `voice_upload_${n}.${c}`);
        $.writeFileSync(l, Buffer.from(e.fileBase64, "base64")), s = l;
      }
      const u = {
        name: e.name || "Custom Voice",
        voiceId: e.voiceId || "custom_voice",
        fileType: e.fileType || "audio",
        filePath: s,
        outputPath: i
      };
      $.writeFileSync(p, JSON.stringify(u, null, 2), "utf-8");
      const a = k.resolve(E, "../scripts/trainer/auto_voice_builder.py"), d = C("python", [a, "--config", p, "--out", i], { windowsHide: !0 });
      let w = "", y = "";
      d.stdout.on("data", (c) => w += c.toString("utf-8")), d.stderr.on("data", (c) => y += c.toString("utf-8")), d.on("close", (c) => {
        try {
          $.existsSync(p) && $.unlinkSync(p);
        } catch {
        }
        if ($.existsSync(i))
          try {
            const l = JSON.parse($.readFileSync(i, "utf-8"));
            try {
              $.unlinkSync(i);
            } catch {
            }
            return l.error ? r(new Error(l.error)) : t(l);
          } catch (l) {
            console.warn("Failed parsing result file, falling back to stdout:", l);
          }
        if (c !== 0)
          return console.error(`Voice training process failed with code ${c}:`, y), r(new Error(y || `Process exited with code ${c}`));
        try {
          const l = JSON.parse(w.trim());
          t(l);
        } catch (l) {
          r(new Error(`Failed to parse response from voice builder: ${l.message}`));
        }
      });
    } catch (o) {
      console.error("Error preparing voice train payload:", o), r(o);
    }
  })), _.handle("app:restart", () => {
    M.relaunch(), M.exit(0);
  }), _.handle("app:reload", () => {
    m == null || m.webContents.reload();
  });
}
