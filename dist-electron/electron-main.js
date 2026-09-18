import { app as A, BrowserWindow as O, ipcMain as T, shell as V, dialog as R, session as W } from "electron";
import w from "path";
import { spawn as B } from "child_process";
import { fileURLToPath as q } from "url";
import z from "https";
import H from "http";
import S from "fs";
import J from "readline";
import { Communicate as G } from "edge-tts-universal";
import { bundle as Y } from "@remotion/bundler";
import { selectComposition as Z, renderMedia as Q } from "@remotion/renderer";
const X = q(import.meta.url), j = w.dirname(X);
process.env.DIST = w.join(j, "../dist");
process.env.VITE_PUBLIC = A.isPackaged ? process.env.DIST : w.join(process.env.DIST, "../public");
let l, K = null;
const U = process.env.VITE_DEV_SERVER_URL;
function L() {
  l = new O({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: w.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: S.existsSync(w.join(j, "preload.cjs")) ? w.join(j, "preload.cjs") : w.join(j, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), W.defaultSession.setPermissionRequestHandler((b, k, y) => {
    y(!0);
  }), l.show(), l.focus(), l.webContents.on("did-finish-load", () => {
    l == null || l.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), U ? l.loadURL(U) : l.loadFile(w.join(process.env.DIST || "", "index.html"));
}
A.on("window-all-closed", () => {
  process.platform !== "darwin" && (A.quit(), l = null);
});
A.on("activate", () => {
  O.getAllWindows().length === 0 && L();
});
A.whenReady().then(() => {
  L(), ae();
});
function ee(b) {
  return new Promise((k, y) => {
    (b.startsWith("https") ? z : H).get(
      b,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (g) => {
        if (g.statusCode && g.statusCode >= 400)
          return y(new Error(`HTTP error ${g.statusCode}`));
        const _ = [];
        g.on("data", (s) => _.push(Buffer.isBuffer(s) ? s : Buffer.from(s))), g.on("end", () => k(Buffer.concat(_)));
      }
    ).on("error", y);
  });
}
async function te(b, k) {
  try {
    const p = b.trim().split(/\s+/).filter(Boolean), _ = !k.startsWith("en-") ? "vi" : "en", s = [];
    let e = "";
    for (const h of p)
      (e + " " + h).length > 80 ? (s.push(e.trim()), e = h) : e += " " + h;
    e.trim() && s.push(e.trim());
    const n = [];
    for (const h of s) {
      const u = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        h
      )}&tl=${_}&client=tw-ob`, x = await ee(u);
      n.push(x);
    }
    const t = Buffer.concat(n), r = `data:audio/mp3;base64,${t.toString("base64")}`, i = Math.max(3, t.length / 3800), c = [], a = (i - 0.4) / Math.max(p.length, 1);
    let v = 0.2;
    for (const h of p) {
      const u = Math.max(0.2, Math.min(0.7, a));
      c.push({
        word: h,
        start: Number(v.toFixed(2)),
        end: Number((v + u).toFixed(2))
      }), v += u;
    }
    return {
      audioUrl: r,
      duration: Number((v + 0.3).toFixed(2)),
      words: c
    };
  } catch {
    const p = b.trim().split(/\s+/).filter(Boolean), g = p.map((_, s) => ({
      word: _,
      start: Number((s * 0.35 + 0.2).toFixed(2)),
      end: Number(((s + 1) * 0.35 + 0.2).toFixed(2))
    }));
    return {
      audioUrl: "",
      duration: Math.max(3.5, p.length * 0.35 + 0.5),
      words: g
    };
  }
}
function ne(b = "+0%") {
  if (!b) return "+0%";
  const k = String(b).trim();
  if (k.includes("%")) {
    const p = parseInt(k.replace("%", ""));
    return isNaN(p) ? k : p >= 0 ? `+${p}%` : `${p}%`;
  }
  if (k.toLowerCase().endsWith("x")) {
    const p = parseFloat(k.replace(/x/i, ""));
    if (!isNaN(p)) {
      const g = Math.round((p - 1) * 100);
      return g >= 0 ? `+${g}%` : `${g}%`;
    }
  }
  const y = parseFloat(k);
  if (!isNaN(y) && y > 0 && y <= 3) {
    const p = Math.round((y - 1) * 100);
    return p >= 0 ? `+${p}%` : `${p}%`;
  }
  return "+0%";
}
function re(b = "vi-VN-NamMinhNeural", k = "+0%", y = "+0Hz") {
  let p = b || "vi-VN-NamMinhNeural", g = ne(k), _ = "+0Hz";
  if (b === "google-vi-male" || b === "vi-male" || b === "adam" || b === "adam-tiktok" || b === "vclip:adam")
    p = "vi-VN-NamMinhNeural";
  else if (b === "google-vi" || b === "vi-female")
    p = "vi-VN-HoaiMyNeural";
  else if (b.includes(":") && !b.startsWith("elevenlabs:")) {
    const [s, e] = b.split(":");
    p = s || "vi-VN-NamMinhNeural", g === "+0%" && (e === "fast" || e === "live" || e === "adam" ? g = "+18%" : e === "recap" ? g = "+28%" : e === "sweet" ? g = "+8%" : e === "genz" ? g = "+20%" : e === "story" ? g = "-8%" : (e === "ngochuyen" || e === "manhdung") && (g = "+0%")), e === "manhdung" && (_ = "-1Hz");
  }
  return { effectiveVoice: p, effectiveRate: g, effectivePitch: _ };
}
function se(b, k, y = "+0%") {
  return new Promise((p, g) => {
    const _ = w.resolve(j, "../scripts/kokoro_tts_engine.py"), s = B("python", [_, "--json"], { windowsHide: !0 });
    let e = "", n = "";
    s.stdout.on("data", (r) => e += r.toString("utf-8")), s.stderr.on("data", (r) => n += r.toString("utf-8")), s.on("close", (r) => {
      if (r !== 0)
        return g(new Error(`Kokoro process exited with code ${r}: ${n}`));
      try {
        const i = JSON.parse(e);
        p(i);
      } catch (i) {
        g(new Error(`Failed to parse Kokoro JSON: ${i.message}`));
      }
    });
    let t = 1;
    if (y.includes("%")) {
      const r = parseInt(y.replace("%", ""));
      isNaN(r) || (t = Math.max(0.5, Math.min(2, 1 + r / 100)));
    }
    const o = k.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    s.stdin.write(JSON.stringify({ text: b, voice: o, speed: t })), s.stdin.end();
  });
}
function oe(b, k) {
  return new Promise((y, p) => {
    const g = w.resolve(j, "../scripts/trainer/f5_tts_engine.py"), _ = B("python", [g, "--json"], { windowsHide: !0 });
    let s = "", e = "";
    _.stdout.on("data", (t) => s += t.toString("utf-8")), _.stderr.on("data", (t) => e += t.toString("utf-8")), _.on("close", (t) => {
      if (t !== 0)
        return p(new Error(`F5-TTS process exited with code ${t}: ${e}`));
      try {
        const o = JSON.parse(s);
        y(o);
      } catch (o) {
        p(new Error(`Failed to parse F5-TTS JSON: ${o.message}`));
      }
    });
    const n = Buffer.from(JSON.stringify({ text: b, voice: k }), "utf-8");
    _.stdin.write(n), _.stdin.end();
  });
}
function ie(b, k, y = "+0%") {
  return new Promise((p, g) => {
    const _ = w.resolve(j, "../scripts/piper_tts_engine.py"), s = B("python", [_, "--json"], { windowsHide: !0 });
    let e = "", n = "";
    s.stdout.on("data", (i) => e += i.toString("utf-8")), s.stderr.on("data", (i) => n += i.toString("utf-8")), s.on("close", (i) => {
      if (i !== 0)
        return g(new Error(`Piper process exited with code ${i}: ${n}`));
      try {
        const c = JSON.parse(e);
        p(c);
      } catch (c) {
        g(new Error(`Failed to parse Piper JSON: ${c.message}`));
      }
    });
    let t = 1;
    if (y.includes("%")) {
      const i = parseInt(y.replace("%", ""));
      isNaN(i) || (t = Math.max(0.5, Math.min(2, 1 + i / 100)));
    }
    const o = k.toLowerCase().replace("piper:", "").trim() || "ngochuyen", r = Buffer.from(JSON.stringify({ text: b, voice: o, speed: t }), "utf-8");
    s.stdin.write(r), s.stdin.end();
  });
}
function ae() {
  T.handle(
    "tts:synthesize",
    async (s, { text: e, voice: n = "vi-VN-NamMinhNeural", rate: t = "+0%", pitch: o = "+0Hz" }) => {
      try {
        const r = e.trim();
        if (!r)
          return { audioUrl: "", duration: 1, words: [] };
        if (n.startsWith("f5:"))
          try {
            const d = await oe(r, n);
            if (d && d.audioUrl)
              return d;
          } catch (d) {
            console.warn("F5-TTS Zero-Shot failed, falling back to Piper VITS:", d);
          }
        if (n.startsWith("piper:") || n === "piper_ngochuyen" || n === "piper_manhdung")
          try {
            const d = await ie(r, n, t);
            if (d && d.audioUrl)
              return d;
          } catch (d) {
            console.warn("Piper VITS TTS failed, falling back to neural voice:", d);
          }
        if (n.startsWith("kokoro:") || n === "ngoc_huyen" || n === "manh_dung")
          try {
            const d = await se(r, n, t);
            if (d && d.audioUrl)
              return d;
          } catch (d) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", d);
          }
        const { effectiveVoice: i, effectiveRate: c, effectivePitch: a } = re(n, t, o), v = new G(r, {
          voice: i,
          rate: c,
          pitch: a
        }), h = [], u = [];
        for await (const d of v.stream()) {
          const P = d;
          if (P.type === "audio" && P.data)
            u.push(Buffer.isBuffer(P.data) ? P.data : Buffer.from(P.data));
          else if (P.type === "WordBoundary" && P.text) {
            const M = Number(((P.offset || 0) / 1e7).toFixed(2)), $ = Number(((P.duration || 0) / 1e7).toFixed(2));
            h.push({
              word: String(P.text),
              start: M,
              end: Number((M + $).toFixed(2))
            });
          }
        }
        const x = Buffer.concat(u);
        if (x.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const m = `data:audio/mp3;base64,${x.toString("base64")}`;
        let f = 3;
        return h.length > 0 ? f = Number((h[h.length - 1].end + 0.3).toFixed(2)) : f = Number(Math.max(2.5, x.length / 5500).toFixed(2)), {
          audioUrl: m,
          duration: f,
          words: h
        };
      } catch (r) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (r == null ? void 0 : r.message) || r), te(e, n);
      }
    }
  ), T.handle("render:video", async (s, { project: e, resolution: n = "1080p" }) => {
    try {
      const t = w.resolve("out");
      S.existsSync(t) || S.mkdirSync(t, { recursive: !0 });
      const r = `${(e.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, i = w.join(t, r);
      l == null || l.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const c = w.resolve("src/remotion/index.ts");
      K = await Y({
        entryPoint: c,
        onProgress: (m) => {
          l == null || l.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + m * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${m}%)...`
          });
        }
      }), l == null || l.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const a = e.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", v = await Z({
        serveUrl: K,
        id: a,
        inputProps: { project: e }
      }), h = e.fps || 30, u = Math.max(
        (e.scenes || []).reduce(
          (m, f) => m + Math.max(Math.round((f.audioDuration || 4) * h), Math.round(2 * h)),
          0
        ),
        30
      );
      let x = e.aspectRatio === "9:16" ? 1080 : 1920, N = e.aspectRatio === "9:16" ? 1920 : 1080;
      return n === "4k" && (x = e.aspectRatio === "9:16" ? 2160 : 3840, N = e.aspectRatio === "9:16" ? 3840 : 2160), l == null || l.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${u} khung hình (${x}x${N})...`
      }), await Q({
        composition: {
          ...v,
          durationInFrames: u,
          width: x,
          height: N,
          fps: h
        },
        serveUrl: K,
        codec: "h264",
        outputLocation: i,
        inputProps: { project: e },
        onProgress: ({ progress: m }) => {
          const f = Math.min(99, Math.round(32 + m * 66));
          l == null || l.webContents.send("render:progress", {
            progress: f,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(m * 100)}%)...`
          });
        }
      }), l == null || l.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: i
      };
    } catch (t) {
      throw console.error("Render media error in main process:", t), new Error(t.message || "Render video thất bại");
    }
  }), T.handle("shell:open-path", async (s, e) => V.openPath(e)), T.handle("dialog:select-file", async (s, e) => l ? (await R.showOpenDialog(l, e)).filePaths : null), T.handle("dialog:select-folder", async () => l && (await R.showOpenDialog(l, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), T.handle("audio:read-file-base64", async (s, e) => {
    try {
      if (!e || !S.existsSync(e)) return null;
      const n = await S.promises.readFile(e), t = w.extname(e).toLowerCase().replace(".", "");
      let o = "audio/mp3";
      t === "wav" ? o = "audio/wav" : t === "m4a" ? o = "audio/m4a" : t === "aac" ? o = "audio/aac" : t === "ogg" ? o = "audio/ogg" : t === "mp4" ? o = "video/mp4" : t === "mov" ? o = "video/quicktime" : t === "webm" ? o = "video/webm" : t === "mkv" && (o = "video/x-matroska");
      const r = n.toString("base64");
      return {
        dataUrl: `data:${o};base64,${r}`,
        base64: r,
        mimeType: o,
        sizeBytes: n.length
      };
    } catch (n) {
      return console.error("Error reading audio/video file base64:", n), null;
    }
  });
  const b = process.env.GEMINI_API_KEY || "";
  T.handle("audio:transcribe", async (s, e) => {
    var c, a, v, h, u, x, N;
    const { audioBase64: n, mimeType: t = "audio/mp3" } = e, o = e.apiKey && e.apiKey.trim() ? e.apiKey.trim() : b;
    if (!n) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const r = (t || "audio/mp3").split(";")[0].trim().toLowerCase(), i = r.includes("webm") ? "audio/webm" : r.includes("wav") ? "audio/wav" : r.includes("ogg") ? "audio/ogg" : r.includes("mp4") || r.includes("m4a") || r.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (o && o.trim()) {
      const m = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
      let f = [
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
        const P = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${o.trim()}`);
        if (P.ok) {
          const M = await P.json();
          if (Array.isArray(M.models)) {
            const $ = M.models.filter((C) => {
              var E;
              return (E = C.supportedGenerationMethods) == null ? void 0 : E.includes("generateContent");
            }).map((C) => C.name.replace(/^models\//, ""));
            $.length > 0 && (f = $.sort((C, E) => C.includes("2.0-flash") ? -1 : E.includes("2.0-flash") ? 1 : C.includes("flash") ? -1 : E.includes("flash") ? 1 : 0));
          }
        } else {
          const M = await P.json().catch(() => ({}));
          if ((c = M == null ? void 0 : M.error) != null && c.message)
            return { error: `Gemini API Key lỗi: ${M.error.message}` };
        }
      } catch (P) {
        console.warn("Auto-discover Gemini models warning:", P);
      }
      let d = "";
      for (const P of f)
        try {
          const M = `https://generativelanguage.googleapis.com/v1beta/models/${P}:generateContent?key=${o.trim()}`, $ = await fetch(M, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: i,
                        data: n
                      }
                    },
                    { text: m }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
              }
            })
          });
          if ($.ok) {
            const C = await $.json();
            let E = (x = (u = (h = (v = (a = C == null ? void 0 : C.candidates) == null ? void 0 : a[0]) == null ? void 0 : v.content) == null ? void 0 : h.parts) == null ? void 0 : u[0]) == null ? void 0 : x.text;
            if (E) {
              E = E.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const I = JSON.parse(E);
              if (I && I.narration)
                return {
                  narration: String(I.narration).trim(),
                  language: I.language || "vi",
                  audioDuration: Number(I.duration || 4),
                  words: Array.isArray(I.words) ? I.words : []
                };
            }
          } else {
            const C = await $.json().catch(() => ({}));
            d = ((N = C == null ? void 0 : C.error) == null ? void 0 : N.message) || `HTTP ${$.status}`;
          }
        } catch (M) {
          d = M.message;
        }
      if (d)
        return { error: `Gemini API: ${d}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), T.handle("media:search-web", async (s, e) => {
    try {
      const n = (e || "").trim();
      if (!n) return [];
      try {
        const i = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(n)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (i.ok) {
          const v = [...(await i.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((h) => decodeURIComponent(h[1])).filter((h) => h && !h.endsWith(".svg") && !h.includes("favicon"));
          if (v.length > 0)
            return v.slice(0, 20).map((h, u) => ({
              id: `bing-img-${u}-${Date.now()}`,
              type: "image",
              url: h,
              thumbnail: h,
              title: n,
              source: "web"
            }));
        }
      } catch (i) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", i);
      }
      const r = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(n)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (r) {
        const i = r[1], a = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(n)}&vqd=${i}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (a.results && a.results.length > 0)
          return a.results.slice(0, 20).map((v, h) => ({
            id: `ddg-img-${h}-${Date.now()}`,
            type: "image",
            url: v.image,
            thumbnail: v.thumbnail || v.image,
            title: v.title || n,
            source: "web"
          }));
      }
      return [];
    } catch (n) {
      return console.warn("Web image search error:", n), [];
    }
  });
  const k = /* @__PURE__ */ new Map();
  T.handle("media:search-videos", async (s, e, n = 1) => {
    try {
      const t = (e || "").trim();
      if (!t) return [];
      const o = Math.max(1, Number(n) || 1), r = `${t.toLowerCase()}_p${o}`;
      if (k.has(r))
        return k.get(r);
      const i = (u) => u.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), c = t.toLowerCase();
      let a = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(c))
        a = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(c))
        a = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(c))
        a = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(c))
        a = /cá/i.test(c) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(c))
        a = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(c))
        a = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(c))
        a = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(c))
        a = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(c))
        a = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(c))
        a = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(c))
        a = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(c))
        a = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(c))
        a = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(t)) {
        const u = t.split(/\s+/).filter(Boolean);
        a = [t, u[0] || "lifestyle", u[u.length - 1] || "cinematic"];
      } else
        a = [i(t).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const v = (o - 1) % a.length, h = [
        a[v],
        ...a.filter((u, x) => x !== v)
      ];
      for (const u of h)
        if (u)
          try {
            const x = new AbortController(), N = setTimeout(() => x.abort(), 3500), m = Math.floor((o - 1) / a.length) + 1, f = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(u)}&page=${m}&urls=true`,
              {
                signal: x.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(N), f.ok) {
              const P = (await f.json()).hits || [];
              if (P.length > 0) {
                const M = P.slice(0, 12).map(($, C) => {
                  var E, I, D, F;
                  return {
                    id: `coverr-video-${C}-${Date.now()}`,
                    type: "video",
                    url: ((E = $.urls) == null ? void 0 : E.mp4) || ((I = $.urls) == null ? void 0 : I.mp4_preview),
                    previewUrl: ((D = $.urls) == null ? void 0 : D.mp4_preview) || ((F = $.urls) == null ? void 0 : F.mp4),
                    thumbnail: $.thumbnail || $.poster,
                    title: $.title || t,
                    source: "web",
                    duration: Math.round(Number($.duration || 8))
                  };
                });
                return k.set(r, M), M;
              }
            }
          } catch (x) {
            console.warn(`Coverr fetch failed for keyword: ${u}`, x);
          }
      return [];
    } catch (t) {
      return console.warn("Video search error in main process:", t), [];
    }
  }), T.handle(
    "ai:gemini-generate",
    async (s, e) => {
      var n, t, o, r, i, c;
      try {
        const { prompt: a, cookie: v, apiKey: h } = e || {}, u = (a || "").trim();
        if (!u)
          throw new Error("Prompt is required");
        const x = (h || v || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (x.startsWith("sk-") || x.length > 20)
          for (const N of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const m = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${x}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: N,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: u }
                  ],
                  temperature: 0.7
                })
              });
              if (m.ok) {
                const f = await m.json(), d = (o = (t = (n = f == null ? void 0 : f.choices) == null ? void 0 : n[0]) == null ? void 0 : t.message) == null ? void 0 : o.content;
                if (d && typeof d == "string")
                  return { text: d.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: d.length };
              }
            } catch (m) {
              console.warn("DeepSeek model failed in Electron main:", N, m);
            }
        if (x.startsWith("gsk_") || x.length > 20)
          for (const N of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const m = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${x}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: N,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: u }
                  ],
                  temperature: 0.7
                })
              });
              if (m.ok) {
                const f = await m.json(), d = (c = (i = (r = f == null ? void 0 : f.choices) == null ? void 0 : r[0]) == null ? void 0 : i.message) == null ? void 0 : c.content;
                if (d && typeof d == "string")
                  return { text: d.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: d.length };
              }
            } catch (m) {
              console.warn("Groq model failed in Electron main:", N, m);
            }
        return { text: "", rawLength: 0 };
      } catch (a) {
        throw console.error("Electron AI Generate error:", a), a;
      }
    }
  ), T.handle("voice:train", async (s, e) => new Promise((n, t) => {
    try {
      const o = A.getPath("temp"), r = Date.now(), i = w.join(o, `voice_train_${r}.json`), c = w.join(o, `voice_train_res_${r}.json`);
      let a = e.filePath || "";
      if (e.fileBase64) {
        const m = e.fileType === "onnx" ? "onnx" : "mp3", f = w.join(o, `voice_upload_${r}.${m}`);
        S.writeFileSync(f, Buffer.from(e.fileBase64, "base64")), a = f;
      }
      const v = {
        name: e.name || "Custom Voice",
        voiceId: e.voiceId || "custom_voice",
        fileType: e.fileType || "audio",
        filePath: a,
        outputPath: c
      };
      S.writeFileSync(i, JSON.stringify(v, null, 2), "utf-8");
      const h = w.resolve(j, "../scripts/trainer/auto_voice_builder.py"), u = B("python", [h, "--config", i, "--out", c], { windowsHide: !0 });
      let x = "", N = "";
      u.stdout.on("data", (m) => x += m.toString("utf-8")), u.stderr.on("data", (m) => N += m.toString("utf-8")), u.on("close", (m) => {
        try {
          S.existsSync(i) && S.unlinkSync(i);
        } catch {
        }
        if (S.existsSync(c))
          try {
            const f = JSON.parse(S.readFileSync(c, "utf-8"));
            try {
              S.unlinkSync(c);
            } catch {
            }
            return f.error ? t(new Error(f.error)) : n(f);
          } catch (f) {
            console.warn("Failed parsing result file, falling back to stdout:", f);
          }
        if (m !== 0)
          return console.error(`Voice training process failed with code ${m}:`, N), t(new Error(N || `Process exited with code ${m}`));
        try {
          const f = JSON.parse(x.trim());
          n(f);
        } catch (f) {
          t(new Error(`Failed to parse response from voice builder: ${f.message}`));
        }
      });
    } catch (o) {
      console.error("Error preparing voice train payload:", o), t(o);
    }
  }));
  let y = null;
  function p() {
    const s = w.join(process.resourcesPath, "python_runtime", "python.exe");
    if (S.existsSync(s)) return s;
    const e = w.join(w.dirname(A.getPath("exe")), "resources", "python_runtime", "python.exe");
    if (S.existsSync(e)) return e;
    const n = w.join(A.getAppPath(), "python_runtime", "python.exe");
    if (S.existsSync(n)) return n;
    const t = w.resolve(j, "..", "python_runtime", "python.exe");
    return S.existsSync(t) ? t : "python";
  }
  function g() {
    const s = w.join(process.resourcesPath, "python", "beat_detector.py");
    if (S.existsSync(s)) return s;
    const e = w.join(w.dirname(A.getPath("exe")), "resources", "python", "beat_detector.py");
    if (S.existsSync(e)) return e;
    const n = w.resolve(j, "..", "python", "beat_detector.py");
    return S.existsSync(n) ? n : w.join(A.getAppPath(), "python", "beat_detector.py");
  }
  async function _(s) {
    if (!S.existsSync(s))
      return {
        success: !1,
        error: "File âm thanh không tồn tại hoặc đã bị di chuyển."
      };
    if (y) {
      try {
        y.kill();
      } catch {
      }
      y = null;
    }
    const e = p(), n = g();
    return new Promise((t) => {
      try {
        const o = B(e, [n, "analyze", s], { windowsHide: !0 });
        y = o;
        const r = J.createInterface({
          input: o.stdout,
          crlfDelay: 1 / 0
        });
        let i = null, c = null, a = null;
        r.on("line", (h) => {
          try {
            const u = JSON.parse(h.trim());
            u.type === "progress" ? l == null || l.webContents.send("audio:progress", {
              percent: u.percent,
              message: u.message
            }) : u.type === "result" ? i = u.data : u.type === "error" && (c = u.error, a = u.details);
          } catch {
          }
        });
        let v = "";
        o.stderr.on("data", (h) => {
          v += h.toString();
        }), o.on("close", (h) => {
          y = null, t(h === 0 && i ? { success: !0, data: i } : {
            success: !1,
            error: c || "Phân tích âm thanh không thành công.",
            details: a || v
          });
        }), o.on("error", (h) => {
          y = null, t({
            success: !1,
            error: "Không thể khởi chạy tiến trình Python.",
            details: h.message
          });
        });
      } catch (o) {
        y = null, t({
          success: !1,
          error: "Lỗi thực thi quy trình phân tích.",
          details: o.message
        });
      }
    });
  }
  T.handle("dialog:openAudioFile", async () => {
    if (!l) return { canceled: !0 };
    const s = await R.showOpenDialog(l, {
      title: "Chọn file âm thanh",
      properties: ["openFile"],
      filters: [
        { name: "Audio Files (*.mp3, *.wav, *.m4a, *.flac, *.ogg)", extensions: ["mp3", "wav", "m4a", "flac", "ogg"] },
        { name: "Tất cả file", extensions: ["*"] }
      ]
    });
    if (s.canceled || s.filePaths.length === 0)
      return { canceled: !0 };
    const e = s.filePaths[0], n = w.basename(e), t = S.statSync(e), o = `file:///${e.replace(/\\/g, "/")}`;
    return {
      canceled: !1,
      filePath: e,
      fileName: n,
      fileUrl: o,
      size: t.size
    };
  }), T.handle("engine:check", async () => {
    const s = p(), e = g();
    return new Promise((n) => {
      try {
        const t = B(s, [e, "--check-env"], { windowsHide: !0 });
        let o = "";
        t.stdout.on("data", (r) => {
          o += r.toString();
        }), t.on("close", (r) => {
          if (r === 0)
            try {
              const i = o.trim().split(`
`);
              for (const c of i) {
                const a = JSON.parse(c.trim());
                if (a.type === "env_check")
                  return n(a.status);
              }
            } catch {
            }
          n({ ready: !1, error: "Không thể kết nối Audio Engine Python" });
        }), t.on("error", () => {
          n({ ready: !1, error: "Không tìm thấy Python executable" });
        });
      } catch (t) {
        n({ ready: !1, error: t.message });
      }
    });
  }), T.handle("audio:analyze", async (s, e) => _(e)), T.handle("audio:analyzeBuffer", async (s, { fileName: e, buffer: n }) => {
    try {
      const t = A.getPath("temp"), o = e.replace(/[^a-zA-Z0-9._-]/g, "_"), r = w.join(t, `beatcut_${Date.now()}_${o}`);
      return S.writeFileSync(r, Buffer.from(n)), _(r);
    } catch (t) {
      return {
        success: !1,
        error: `Lỗi ghi file tạm để phân tích: ${t.message}`
      };
    }
  }), T.handle("audio:cancelAnalysis", async () => {
    if (y) {
      try {
        y.kill();
      } catch {
      }
      y = null;
    }
    return { canceled: !0 };
  }), T.handle("project:save", async (s, e) => {
    if (!l) return { success: !1, error: "Không tìm thấy cửa sổ ứng dụng." };
    const n = `${e.projectName || "My_Project"}.beatcut`, t = await R.showSaveDialog(l, {
      title: "Lưu Project BEATCUT STUDIO",
      defaultPath: n,
      filters: [
        { name: "BeatCut Project (*.beatcut)", extensions: ["beatcut"] },
        { name: "JSON (*.json)", extensions: ["json"] }
      ]
    });
    if (t.canceled || !t.filePath)
      return { success: !1, error: "Đã hủy thao tác lưu project." };
    try {
      return S.writeFileSync(t.filePath, JSON.stringify(e, null, 2), "utf-8"), { success: !0, filePath: t.filePath };
    } catch (o) {
      return { success: !1, error: `Lỗi khi lưu file: ${o.message}` };
    }
  }), T.handle("project:open", async () => {
    if (!l) return { success: !1, error: "Không tìm thấy cửa sổ ứng dụng." };
    const s = await R.showOpenDialog(l, {
      title: "Mở Project BEATCUT STUDIO",
      properties: ["openFile"],
      filters: [
        { name: "BeatCut Project (*.beatcut, *.json)", extensions: ["beatcut", "json"] }
      ]
    });
    if (s.canceled || s.filePaths.length === 0)
      return { success: !1, error: "Đã hủy chọn file." };
    const e = s.filePaths[0];
    try {
      const n = S.readFileSync(e, "utf-8");
      return { success: !0, data: JSON.parse(n), filePath: e };
    } catch (n) {
      return { success: !1, error: `Không thể đọc dữ liệu project: ${n.message}` };
    }
  }), T.handle("data:export", async (s, { format: e, content: n, defaultName: t }) => {
    if (!l) return { success: !1, error: "Không tìm thấy cửa sổ ứng dụng." };
    const r = { json: "json", csv: "csv", txt: "txt" }[e] || "txt", i = await R.showSaveDialog(l, {
      title: `Xuất dữ liệu (${e.toUpperCase()})`,
      defaultPath: `${t}.${r}`,
      filters: [{ name: `${e.toUpperCase()} Files`, extensions: [r] }]
    });
    if (i.canceled || !i.filePath)
      return { success: !1, error: "Đã hủy thao tác xuất." };
    try {
      return S.writeFileSync(i.filePath, n, "utf-8"), { success: !0, filePath: i.filePath };
    } catch (c) {
      return { success: !1, error: `Lỗi khi ghi file: ${c.message}` };
    }
  }), T.handle("app:restart", () => {
    A.relaunch(), A.exit(0);
  }), T.handle("app:reload", () => {
    l == null || l.webContents.reload();
  });
}
