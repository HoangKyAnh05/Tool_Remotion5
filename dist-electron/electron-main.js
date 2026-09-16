import { app as E, BrowserWindow as B, ipcMain as _, shell as V, dialog as K, session as q } from "electron";
import T from "path";
import { spawn as P } from "child_process";
import { fileURLToPath as F } from "url";
import L from "https";
import D from "http";
import C from "fs";
import { Communicate as O } from "edge-tts-universal";
import { bundle as j } from "@remotion/bundler";
import { selectComposition as H, renderMedia as z } from "@remotion/renderer";
const G = F(import.meta.url), M = T.dirname(G);
process.env.DIST = T.join(M, "../dist");
process.env.VITE_PUBLIC = E.isPackaged ? process.env.DIST : T.join(process.env.DIST, "../public");
let d, A = null;
const W = process.env.VITE_DEV_SERVER_URL;
function U() {
  d = new B({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: T.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: C.existsSync(T.join(M, "preload.cjs")) ? T.join(M, "preload.cjs") : T.join(M, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), q.defaultSession.setPermissionRequestHandler((g, y, m) => {
    m(!0);
  }), d.show(), d.focus(), d.webContents.on("did-finish-load", () => {
    d == null || d.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), W ? d.loadURL(W) : d.loadFile(T.join(process.env.DIST || "", "index.html"));
}
E.on("window-all-closed", () => {
  process.platform !== "darwin" && (E.quit(), d = null);
});
E.on("activate", () => {
  B.getAllWindows().length === 0 && U();
});
E.whenReady().then(() => {
  U(), ne();
});
function J(g) {
  return new Promise((y, m) => {
    (g.startsWith("https") ? L : D).get(
      g,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (e) => {
        if (e.statusCode && e.statusCode >= 400)
          return m(new Error(`HTTP error ${e.statusCode}`));
        const r = [];
        e.on("data", (o) => r.push(Buffer.isBuffer(o) ? o : Buffer.from(o))), e.on("end", () => y(Buffer.concat(r)));
      }
    ).on("error", m);
  });
}
async function Y(g, y) {
  try {
    const t = g.trim().split(/\s+/).filter(Boolean), r = !y.startsWith("en-") ? "vi" : "en", o = [];
    let n = "";
    for (const p of t)
      (n + " " + p).length > 80 ? (o.push(n.trim()), n = p) : n += " " + p;
    n.trim() && o.push(n.trim());
    const u = [];
    for (const p of o) {
      const w = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        p
      )}&tl=${r}&client=tw-ob`, l = await J(w);
      u.push(l);
    }
    const a = Buffer.concat(u), c = `data:audio/mp3;base64,${a.toString("base64")}`, i = Math.max(3, a.length / 3800), h = [], f = (i - 0.4) / Math.max(t.length, 1);
    let v = 0.2;
    for (const p of t) {
      const w = Math.max(0.2, Math.min(0.7, f));
      h.push({
        word: p,
        start: Number(v.toFixed(2)),
        end: Number((v + w).toFixed(2))
      }), v += w;
    }
    return {
      audioUrl: c,
      duration: Number((v + 0.3).toFixed(2)),
      words: h
    };
  } catch {
    const t = g.trim().split(/\s+/).filter(Boolean), e = t.map((r, o) => ({
      word: r,
      start: Number((o * 0.35 + 0.2).toFixed(2)),
      end: Number(((o + 1) * 0.35 + 0.2).toFixed(2))
    }));
    return {
      audioUrl: "",
      duration: Math.max(3.5, t.length * 0.35 + 0.5),
      words: e
    };
  }
}
function Q(g = "+0%") {
  if (!g) return "+0%";
  const y = String(g).trim();
  if (y.includes("%")) {
    const t = parseInt(y.replace("%", ""));
    return isNaN(t) ? y : t >= 0 ? `+${t}%` : `${t}%`;
  }
  if (y.toLowerCase().endsWith("x")) {
    const t = parseFloat(y.replace(/x/i, ""));
    if (!isNaN(t)) {
      const e = Math.round((t - 1) * 100);
      return e >= 0 ? `+${e}%` : `${e}%`;
    }
  }
  const m = parseFloat(y);
  if (!isNaN(m) && m > 0 && m <= 3) {
    const t = Math.round((m - 1) * 100);
    return t >= 0 ? `+${t}%` : `${t}%`;
  }
  return "+0%";
}
function Z(g = "vi-VN-NamMinhNeural", y = "+0%", m = "+0Hz") {
  let t = g || "vi-VN-NamMinhNeural", e = Q(y), r = "+0Hz";
  if (g === "google-vi-male" || g === "vi-male" || g === "adam" || g === "adam-tiktok" || g === "vclip:adam")
    t = "vi-VN-NamMinhNeural";
  else if (g === "google-vi" || g === "vi-female")
    t = "vi-VN-HoaiMyNeural";
  else if (g.includes(":") && !g.startsWith("elevenlabs:")) {
    const [o, n] = g.split(":");
    t = o || "vi-VN-NamMinhNeural", e === "+0%" && (n === "fast" || n === "live" || n === "adam" ? e = "+18%" : n === "recap" ? e = "+28%" : n === "sweet" ? e = "+8%" : n === "genz" ? e = "+20%" : n === "story" ? e = "-8%" : (n === "ngochuyen" || n === "manhdung") && (e = "+0%")), n === "manhdung" && (r = "-1Hz");
  }
  return { effectiveVoice: t, effectiveRate: e, effectivePitch: r };
}
function X(g, y, m = "+0%") {
  return new Promise((t, e) => {
    const r = T.resolve(M, "../scripts/kokoro_tts_engine.py"), o = P("python", [r, "--json"], { windowsHide: !0 });
    let n = "", u = "";
    o.stdout.on("data", (c) => n += c.toString("utf-8")), o.stderr.on("data", (c) => u += c.toString("utf-8")), o.on("close", (c) => {
      if (c !== 0)
        return e(new Error(`Kokoro process exited with code ${c}: ${u}`));
      try {
        const i = JSON.parse(n);
        t(i);
      } catch (i) {
        e(new Error(`Failed to parse Kokoro JSON: ${i.message}`));
      }
    });
    let a = 1;
    if (m.includes("%")) {
      const c = parseInt(m.replace("%", ""));
      isNaN(c) || (a = Math.max(0.5, Math.min(2, 1 + c / 100)));
    }
    const s = y.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    o.stdin.write(JSON.stringify({ text: g, voice: s, speed: a })), o.stdin.end();
  });
}
function ee(g, y) {
  return new Promise((m, t) => {
    const e = T.resolve(M, "../scripts/trainer/f5_tts_engine.py"), r = P("python", [e, "--json"], { windowsHide: !0 });
    let o = "", n = "";
    r.stdout.on("data", (a) => o += a.toString("utf-8")), r.stderr.on("data", (a) => n += a.toString("utf-8")), r.on("close", (a) => {
      if (a !== 0)
        return t(new Error(`F5-TTS process exited with code ${a}: ${n}`));
      try {
        const s = JSON.parse(o);
        m(s);
      } catch (s) {
        t(new Error(`Failed to parse F5-TTS JSON: ${s.message}`));
      }
    });
    const u = Buffer.from(JSON.stringify({ text: g, voice: y }), "utf-8");
    r.stdin.write(u), r.stdin.end();
  });
}
function te(g, y, m = "+0%") {
  return new Promise((t, e) => {
    const r = T.resolve(M, "../scripts/piper_tts_engine.py"), o = P("python", [r, "--json"], { windowsHide: !0 });
    let n = "", u = "";
    o.stdout.on("data", (i) => n += i.toString("utf-8")), o.stderr.on("data", (i) => u += i.toString("utf-8")), o.on("close", (i) => {
      if (i !== 0)
        return e(new Error(`Piper process exited with code ${i}: ${u}`));
      try {
        const h = JSON.parse(n);
        t(h);
      } catch (h) {
        e(new Error(`Failed to parse Piper JSON: ${h.message}`));
      }
    });
    let a = 1;
    if (m.includes("%")) {
      const i = parseInt(m.replace("%", ""));
      isNaN(i) || (a = Math.max(0.5, Math.min(2, 1 + i / 100)));
    }
    const s = y.toLowerCase().replace("piper:", "").trim() || "ngochuyen", c = Buffer.from(JSON.stringify({ text: g, voice: s, speed: a }), "utf-8");
    o.stdin.write(c), o.stdin.end();
  });
}
function ne() {
  _.handle(
    "tts:synthesize",
    async (m, { text: t, voice: e = "vi-VN-NamMinhNeural", rate: r = "+0%", pitch: o = "+0Hz" }) => {
      try {
        const n = t.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        if (e.startsWith("f5:"))
          try {
            const l = await ee(n, e);
            if (l && l.audioUrl)
              return l;
          } catch (l) {
            console.warn("F5-TTS Zero-Shot failed, falling back to Piper VITS:", l);
          }
        if (e.startsWith("piper:") || e === "piper_ngochuyen" || e === "piper_manhdung")
          try {
            const l = await te(n, e, r);
            if (l && l.audioUrl)
              return l;
          } catch (l) {
            console.warn("Piper VITS TTS failed, falling back to neural voice:", l);
          }
        if (e.startsWith("kokoro:") || e === "ngoc_huyen" || e === "manh_dung")
          try {
            const l = await X(n, e, r);
            if (l && l.audioUrl)
              return l;
          } catch (l) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", l);
          }
        const { effectiveVoice: u, effectiveRate: a, effectivePitch: s } = Z(e, r, o), c = new O(n, {
          voice: u,
          rate: a,
          pitch: s
        }), i = [], h = [];
        for await (const l of c.stream()) {
          const b = l;
          if (b.type === "audio" && b.data)
            h.push(Buffer.isBuffer(b.data) ? b.data : Buffer.from(b.data));
          else if (b.type === "WordBoundary" && b.text) {
            const x = Number(((b.offset || 0) / 1e7).toFixed(2)), k = Number(((b.duration || 0) / 1e7).toFixed(2));
            i.push({
              word: String(b.text),
              start: x,
              end: Number((x + k).toFixed(2))
            });
          }
        }
        const f = Buffer.concat(h);
        if (f.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const p = `data:audio/mp3;base64,${f.toString("base64")}`;
        let w = 3;
        return i.length > 0 ? w = Number((i[i.length - 1].end + 0.3).toFixed(2)) : w = Number(Math.max(2.5, f.length / 5500).toFixed(2)), {
          audioUrl: p,
          duration: w,
          words: i
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(t, e);
      }
    }
  ), _.handle("render:video", async (m, { project: t, resolution: e = "1080p" }) => {
    try {
      const r = T.resolve("out");
      C.existsSync(r) || C.mkdirSync(r, { recursive: !0 });
      const n = `${(t.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, u = T.join(r, n);
      d == null || d.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const a = T.resolve("src/remotion/index.ts");
      A = await j({
        entryPoint: a,
        onProgress: (p) => {
          d == null || d.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + p * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${p}%)...`
          });
        }
      }), d == null || d.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const s = t.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", c = await H({
        serveUrl: A,
        id: s,
        inputProps: { project: t }
      }), i = t.fps || 30, h = Math.max(
        (t.scenes || []).reduce(
          (p, w) => p + Math.max(Math.round((w.audioDuration || 4) * i), Math.round(2 * i)),
          0
        ),
        30
      );
      let f = t.aspectRatio === "9:16" ? 1080 : 1920, v = t.aspectRatio === "9:16" ? 1920 : 1080;
      return e === "4k" && (f = t.aspectRatio === "9:16" ? 2160 : 3840, v = t.aspectRatio === "9:16" ? 3840 : 2160), d == null || d.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${h} khung hình (${f}x${v})...`
      }), await z({
        composition: {
          ...c,
          durationInFrames: h,
          width: f,
          height: v,
          fps: i
        },
        serveUrl: A,
        codec: "h264",
        outputLocation: u,
        inputProps: { project: t },
        onProgress: ({ progress: p }) => {
          const w = Math.min(99, Math.round(32 + p * 66));
          d == null || d.webContents.send("render:progress", {
            progress: w,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(p * 100)}%)...`
          });
        }
      }), d == null || d.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: u
      };
    } catch (r) {
      throw console.error("Render media error in main process:", r), new Error(r.message || "Render video thất bại");
    }
  }), _.handle("shell:open-path", async (m, t) => V.openPath(t)), _.handle("dialog:select-file", async (m, t) => d ? (await K.showOpenDialog(d, t)).filePaths : null), _.handle("dialog:select-folder", async () => d && (await K.showOpenDialog(d, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), _.handle("audio:read-file-base64", async (m, t) => {
    try {
      if (!t || !C.existsSync(t)) return null;
      const e = await C.promises.readFile(t), r = T.extname(t).toLowerCase().replace(".", "");
      let o = "audio/mp3";
      r === "wav" ? o = "audio/wav" : r === "m4a" ? o = "audio/m4a" : r === "aac" ? o = "audio/aac" : r === "ogg" ? o = "audio/ogg" : r === "mp4" ? o = "video/mp4" : r === "mov" ? o = "video/quicktime" : r === "webm" ? o = "video/webm" : r === "mkv" && (o = "video/x-matroska");
      const n = e.toString("base64");
      return {
        dataUrl: `data:${o};base64,${n}`,
        base64: n,
        mimeType: o,
        sizeBytes: e.length
      };
    } catch (e) {
      return console.error("Error reading audio/video file base64:", e), null;
    }
  });
  const g = process.env.GEMINI_API_KEY || "";
  _.handle("audio:transcribe", async (m, t) => {
    var a, s, c, i, h, f, v;
    const { audioBase64: e, mimeType: r = "audio/mp3" } = t, o = t.apiKey && t.apiKey.trim() ? t.apiKey.trim() : g;
    if (!e) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (r || "audio/mp3").split(";")[0].trim().toLowerCase(), u = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (o && o.trim()) {
      const p = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
      let w = [
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
        const b = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${o.trim()}`);
        if (b.ok) {
          const x = await b.json();
          if (Array.isArray(x.models)) {
            const k = x.models.filter((S) => {
              var N;
              return (N = S.supportedGenerationMethods) == null ? void 0 : N.includes("generateContent");
            }).map((S) => S.name.replace(/^models\//, ""));
            k.length > 0 && (w = k.sort((S, N) => S.includes("2.0-flash") ? -1 : N.includes("2.0-flash") ? 1 : S.includes("flash") ? -1 : N.includes("flash") ? 1 : 0));
          }
        } else {
          const x = await b.json().catch(() => ({}));
          if ((a = x == null ? void 0 : x.error) != null && a.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (b) {
        console.warn("Auto-discover Gemini models warning:", b);
      }
      let l = "";
      for (const b of w)
        try {
          const x = `https://generativelanguage.googleapis.com/v1beta/models/${b}:generateContent?key=${o.trim()}`, k = await fetch(x, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: u,
                        data: e
                      }
                    },
                    { text: p }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
              }
            })
          });
          if (k.ok) {
            const S = await k.json();
            let N = (f = (h = (i = (c = (s = S == null ? void 0 : S.candidates) == null ? void 0 : s[0]) == null ? void 0 : c.content) == null ? void 0 : i.parts) == null ? void 0 : h[0]) == null ? void 0 : f.text;
            if (N) {
              N = N.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const $ = JSON.parse(N);
              if ($ && $.narration)
                return {
                  narration: String($.narration).trim(),
                  language: $.language || "vi",
                  audioDuration: Number($.duration || 4),
                  words: Array.isArray($.words) ? $.words : []
                };
            }
          } else {
            const S = await k.json().catch(() => ({}));
            l = ((v = S == null ? void 0 : S.error) == null ? void 0 : v.message) || `HTTP ${k.status}`;
          }
        } catch (x) {
          l = x.message;
        }
      if (l)
        return { error: `Gemini API: ${l}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), _.handle("media:search-web", async (m, t) => {
    try {
      const e = (t || "").trim();
      if (!e) return [];
      try {
        const u = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(e)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (u.ok) {
          const c = [...(await u.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((i) => decodeURIComponent(i[1])).filter((i) => i && !i.endsWith(".svg") && !i.includes("favicon"));
          if (c.length > 0)
            return c.slice(0, 20).map((i, h) => ({
              id: `bing-img-${h}-${Date.now()}`,
              type: "image",
              url: i,
              thumbnail: i,
              title: e,
              source: "web"
            }));
        }
      } catch (u) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", u);
      }
      const n = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(e)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (n) {
        const u = n[1], s = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(e)}&vqd=${u}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (s.results && s.results.length > 0)
          return s.results.slice(0, 20).map((c, i) => ({
            id: `ddg-img-${i}-${Date.now()}`,
            type: "image",
            url: c.image,
            thumbnail: c.thumbnail || c.image,
            title: c.title || e,
            source: "web"
          }));
      }
      return [];
    } catch (e) {
      return console.warn("Web image search error:", e), [];
    }
  });
  const y = /* @__PURE__ */ new Map();
  _.handle("media:search-videos", async (m, t, e = 1) => {
    try {
      const r = (t || "").trim();
      if (!r) return [];
      const o = Math.max(1, Number(e) || 1), n = `${r.toLowerCase()}_p${o}`;
      if (y.has(n))
        return y.get(n);
      const u = (h) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), a = r.toLowerCase();
      let s = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(a))
        s = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(a))
        s = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(a))
        s = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(a))
        s = /cá/i.test(a) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(a))
        s = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(a))
        s = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(a))
        s = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(a))
        s = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(a))
        s = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(a))
        s = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(a))
        s = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(a))
        s = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(a))
        s = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(r)) {
        const h = r.split(/\s+/).filter(Boolean);
        s = [r, h[0] || "lifestyle", h[h.length - 1] || "cinematic"];
      } else
        s = [u(r).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const c = (o - 1) % s.length, i = [
        s[c],
        ...s.filter((h, f) => f !== c)
      ];
      for (const h of i)
        if (h)
          try {
            const f = new AbortController(), v = setTimeout(() => f.abort(), 3500), p = Math.floor((o - 1) / s.length) + 1, w = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(h)}&page=${p}&urls=true`,
              {
                signal: f.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(v), w.ok) {
              const b = (await w.json()).hits || [];
              if (b.length > 0) {
                const x = b.slice(0, 12).map((k, S) => {
                  var N, $, R, I;
                  return {
                    id: `coverr-video-${S}-${Date.now()}`,
                    type: "video",
                    url: ((N = k.urls) == null ? void 0 : N.mp4) || (($ = k.urls) == null ? void 0 : $.mp4_preview),
                    previewUrl: ((R = k.urls) == null ? void 0 : R.mp4_preview) || ((I = k.urls) == null ? void 0 : I.mp4),
                    thumbnail: k.thumbnail || k.poster,
                    title: k.title || r,
                    source: "web",
                    duration: Math.round(Number(k.duration || 8))
                  };
                });
                return y.set(n, x), x;
              }
            }
          } catch (f) {
            console.warn(`Coverr fetch failed for keyword: ${h}`, f);
          }
      return [];
    } catch (r) {
      return console.warn("Video search error in main process:", r), [];
    }
  }), _.handle(
    "ai:gemini-generate",
    async (m, t) => {
      var e, r, o, n, u, a;
      try {
        const { prompt: s, cookie: c, apiKey: i } = t || {}, h = (s || "").trim();
        if (!h)
          throw new Error("Prompt is required");
        const f = (i || c || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (f.startsWith("sk-") || f.length > 20)
          for (const v of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const p = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${f}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: v,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: h }
                  ],
                  temperature: 0.7
                })
              });
              if (p.ok) {
                const w = await p.json(), l = (o = (r = (e = w == null ? void 0 : w.choices) == null ? void 0 : e[0]) == null ? void 0 : r.message) == null ? void 0 : o.content;
                if (l && typeof l == "string")
                  return { text: l.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: l.length };
              }
            } catch (p) {
              console.warn("DeepSeek model failed in Electron main:", v, p);
            }
        if (f.startsWith("gsk_") || f.length > 20)
          for (const v of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const p = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${f}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: v,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: h }
                  ],
                  temperature: 0.7
                })
              });
              if (p.ok) {
                const w = await p.json(), l = (a = (u = (n = w == null ? void 0 : w.choices) == null ? void 0 : n[0]) == null ? void 0 : u.message) == null ? void 0 : a.content;
                if (l && typeof l == "string")
                  return { text: l.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: l.length };
              }
            } catch (p) {
              console.warn("Groq model failed in Electron main:", v, p);
            }
        return { text: "", rawLength: 0 };
      } catch (s) {
        throw console.error("Electron AI Generate error:", s), s;
      }
    }
  ), _.handle("voice:train", async (m, t) => new Promise((e, r) => {
    const o = T.resolve(M, "../scripts/trainer/auto_voice_builder.py"), n = P("python", [o, "--json"], { windowsHide: !0 });
    let u = "", a = "";
    n.stdout.on("data", (c) => u += c.toString("utf-8")), n.stderr.on("data", (c) => a += c.toString("utf-8")), n.on("close", (c) => {
      if (c !== 0)
        return console.error(`Voice training process failed with code ${c}:`, a), r(new Error(a || `Process exited with code ${c}`));
      try {
        const i = JSON.parse(u);
        e(i);
      } catch (i) {
        r(new Error(`Failed to parse response from voice builder: ${i.message}`));
      }
    });
    const s = Buffer.from(JSON.stringify(t), "utf-8");
    n.stdin.write(s), n.stdin.end();
  })), _.handle("app:restart", () => {
    E.relaunch(), E.exit(0);
  }), _.handle("app:reload", () => {
    d == null || d.webContents.reload();
  });
}
