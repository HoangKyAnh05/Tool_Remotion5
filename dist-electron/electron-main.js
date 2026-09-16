import { app as C, BrowserWindow as B, ipcMain as _, shell as V, dialog as K, session as q } from "electron";
import T from "path";
import { spawn as A } from "child_process";
import { fileURLToPath as L } from "url";
import D from "https";
import F from "http";
import E from "fs";
import { Communicate as j } from "edge-tts-universal";
import { bundle as O } from "@remotion/bundler";
import { selectComposition as H, renderMedia as z } from "@remotion/renderer";
const G = L(import.meta.url), $ = T.dirname(G);
process.env.DIST = T.join($, "../dist");
process.env.VITE_PUBLIC = C.isPackaged ? process.env.DIST : T.join(process.env.DIST, "../public");
let l, P = null;
const W = process.env.VITE_DEV_SERVER_URL;
function U() {
  l = new B({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: T.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: E.existsSync(T.join($, "preload.cjs")) ? T.join($, "preload.cjs") : T.join($, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), q.defaultSession.setPermissionRequestHandler((g, b, p) => {
    p(!0);
  }), l.show(), l.focus(), l.webContents.on("did-finish-load", () => {
    l == null || l.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), W ? l.loadURL(W) : l.loadFile(T.join(process.env.DIST || "", "index.html"));
}
C.on("window-all-closed", () => {
  process.platform !== "darwin" && (C.quit(), l = null);
});
C.on("activate", () => {
  B.getAllWindows().length === 0 && U();
});
C.whenReady().then(() => {
  U(), te();
});
function J(g) {
  return new Promise((b, p) => {
    (g.startsWith("https") ? D : F).get(
      g,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (e) => {
        if (e.statusCode && e.statusCode >= 400)
          return p(new Error(`HTTP error ${e.statusCode}`));
        const o = [];
        e.on("data", (r) => o.push(Buffer.isBuffer(r) ? r : Buffer.from(r))), e.on("end", () => b(Buffer.concat(o)));
      }
    ).on("error", p);
  });
}
async function Y(g, b) {
  try {
    const t = g.trim().split(/\s+/).filter(Boolean), o = !b.startsWith("en-") ? "vi" : "en", r = [];
    let n = "";
    for (const h of t)
      (n + " " + h).length > 80 ? (r.push(n.trim()), n = h) : n += " " + h;
    n.trim() && r.push(n.trim());
    const m = [];
    for (const h of r) {
      const w = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        h
      )}&tl=${o}&client=tw-ob`, u = await J(w);
      m.push(u);
    }
    const c = Buffer.concat(m), a = `data:audio/mp3;base64,${c.toString("base64")}`, s = Math.max(3, c.length / 3800), d = [], f = (s - 0.4) / Math.max(t.length, 1);
    let v = 0.2;
    for (const h of t) {
      const w = Math.max(0.2, Math.min(0.7, f));
      d.push({
        word: h,
        start: Number(v.toFixed(2)),
        end: Number((v + w).toFixed(2))
      }), v += w;
    }
    return {
      audioUrl: a,
      duration: Number((v + 0.3).toFixed(2)),
      words: d
    };
  } catch {
    const t = g.trim().split(/\s+/).filter(Boolean), e = t.map((o, r) => ({
      word: o,
      start: Number((r * 0.35 + 0.2).toFixed(2)),
      end: Number(((r + 1) * 0.35 + 0.2).toFixed(2))
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
  const b = String(g).trim();
  if (b.includes("%")) {
    const t = parseInt(b.replace("%", ""));
    return isNaN(t) ? b : t >= 0 ? `+${t}%` : `${t}%`;
  }
  if (b.toLowerCase().endsWith("x")) {
    const t = parseFloat(b.replace(/x/i, ""));
    if (!isNaN(t)) {
      const e = Math.round((t - 1) * 100);
      return e >= 0 ? `+${e}%` : `${e}%`;
    }
  }
  const p = parseFloat(b);
  if (!isNaN(p) && p > 0 && p <= 3) {
    const t = Math.round((p - 1) * 100);
    return t >= 0 ? `+${t}%` : `${t}%`;
  }
  return "+0%";
}
function Z(g = "vi-VN-NamMinhNeural", b = "+0%", p = "+0Hz") {
  let t = g || "vi-VN-NamMinhNeural", e = Q(b), o = "+0Hz";
  if (g === "google-vi-male" || g === "vi-male" || g === "adam" || g === "adam-tiktok" || g === "vclip:adam")
    t = "vi-VN-NamMinhNeural";
  else if (g === "google-vi" || g === "vi-female")
    t = "vi-VN-HoaiMyNeural";
  else if (g.includes(":") && !g.startsWith("elevenlabs:")) {
    const [r, n] = g.split(":");
    t = r || "vi-VN-NamMinhNeural", e === "+0%" && (n === "fast" || n === "live" || n === "adam" ? e = "+18%" : n === "recap" ? e = "+28%" : n === "sweet" ? e = "+8%" : n === "genz" ? e = "+20%" : n === "story" ? e = "-8%" : (n === "ngochuyen" || n === "manhdung") && (e = "+0%")), n === "manhdung" && (o = "-1Hz");
  }
  return { effectiveVoice: t, effectiveRate: e, effectivePitch: o };
}
function X(g, b, p = "+0%") {
  return new Promise((t, e) => {
    const o = T.resolve($, "../scripts/kokoro_tts_engine.py"), r = A("python", [o, "--json"], { windowsHide: !0 });
    let n = "", m = "";
    r.stdout.on("data", (a) => n += a.toString("utf-8")), r.stderr.on("data", (a) => m += a.toString("utf-8")), r.on("close", (a) => {
      if (a !== 0)
        return e(new Error(`Kokoro process exited with code ${a}: ${m}`));
      try {
        const s = JSON.parse(n);
        t(s);
      } catch (s) {
        e(new Error(`Failed to parse Kokoro JSON: ${s.message}`));
      }
    });
    let c = 1;
    if (p.includes("%")) {
      const a = parseInt(p.replace("%", ""));
      isNaN(a) || (c = Math.max(0.5, Math.min(2, 1 + a / 100)));
    }
    const i = b.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    r.stdin.write(JSON.stringify({ text: g, voice: i, speed: c })), r.stdin.end();
  });
}
function ee(g, b, p = "+0%") {
  return new Promise((t, e) => {
    const o = T.resolve($, "../scripts/piper_tts_engine.py"), r = A("python", [o, "--json"], { windowsHide: !0 });
    let n = "", m = "";
    r.stdout.on("data", (s) => n += s.toString("utf-8")), r.stderr.on("data", (s) => m += s.toString("utf-8")), r.on("close", (s) => {
      if (s !== 0)
        return e(new Error(`Piper process exited with code ${s}: ${m}`));
      try {
        const d = JSON.parse(n);
        t(d);
      } catch (d) {
        e(new Error(`Failed to parse Piper JSON: ${d.message}`));
      }
    });
    let c = 1;
    if (p.includes("%")) {
      const s = parseInt(p.replace("%", ""));
      isNaN(s) || (c = Math.max(0.5, Math.min(2, 1 + s / 100)));
    }
    const i = b.toLowerCase().replace("piper:", "").trim() || "ngochuyen", a = Buffer.from(JSON.stringify({ text: g, voice: i, speed: c }), "utf-8");
    r.stdin.write(a), r.stdin.end();
  });
}
function te() {
  _.handle(
    "tts:synthesize",
    async (p, { text: t, voice: e = "vi-VN-NamMinhNeural", rate: o = "+0%", pitch: r = "+0Hz" }) => {
      try {
        const n = t.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        if (e.startsWith("piper:") || e === "piper_ngochuyen" || e === "piper_manhdung")
          try {
            const u = await ee(n, e, o);
            if (u && u.audioUrl)
              return u;
          } catch (u) {
            console.warn("Piper VITS TTS failed, falling back to neural voice:", u);
          }
        if (e.startsWith("kokoro:") || e === "ngoc_huyen" || e === "manh_dung")
          try {
            const u = await X(n, e, o);
            if (u && u.audioUrl)
              return u;
          } catch (u) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", u);
          }
        const { effectiveVoice: m, effectiveRate: c, effectivePitch: i } = Z(e, o, r), a = new j(n, {
          voice: m,
          rate: c,
          pitch: i
        }), s = [], d = [];
        for await (const u of a.stream()) {
          const y = u;
          if (y.type === "audio" && y.data)
            d.push(Buffer.isBuffer(y.data) ? y.data : Buffer.from(y.data));
          else if (y.type === "WordBoundary" && y.text) {
            const x = Number(((y.offset || 0) / 1e7).toFixed(2)), k = Number(((y.duration || 0) / 1e7).toFixed(2));
            s.push({
              word: String(y.text),
              start: x,
              end: Number((x + k).toFixed(2))
            });
          }
        }
        const f = Buffer.concat(d);
        if (f.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const h = `data:audio/mp3;base64,${f.toString("base64")}`;
        let w = 3;
        return s.length > 0 ? w = Number((s[s.length - 1].end + 0.3).toFixed(2)) : w = Number(Math.max(2.5, f.length / 5500).toFixed(2)), {
          audioUrl: h,
          duration: w,
          words: s
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(t, e);
      }
    }
  ), _.handle("render:video", async (p, { project: t, resolution: e = "1080p" }) => {
    try {
      const o = T.resolve("out");
      E.existsSync(o) || E.mkdirSync(o, { recursive: !0 });
      const n = `${(t.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, m = T.join(o, n);
      l == null || l.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const c = T.resolve("src/remotion/index.ts");
      P = await O({
        entryPoint: c,
        onProgress: (h) => {
          l == null || l.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + h * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${h}%)...`
          });
        }
      }), l == null || l.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const i = t.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", a = await H({
        serveUrl: P,
        id: i,
        inputProps: { project: t }
      }), s = t.fps || 30, d = Math.max(
        (t.scenes || []).reduce(
          (h, w) => h + Math.max(Math.round((w.audioDuration || 4) * s), Math.round(2 * s)),
          0
        ),
        30
      );
      let f = t.aspectRatio === "9:16" ? 1080 : 1920, v = t.aspectRatio === "9:16" ? 1920 : 1080;
      return e === "4k" && (f = t.aspectRatio === "9:16" ? 2160 : 3840, v = t.aspectRatio === "9:16" ? 3840 : 2160), l == null || l.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${d} khung hình (${f}x${v})...`
      }), await z({
        composition: {
          ...a,
          durationInFrames: d,
          width: f,
          height: v,
          fps: s
        },
        serveUrl: P,
        codec: "h264",
        outputLocation: m,
        inputProps: { project: t },
        onProgress: ({ progress: h }) => {
          const w = Math.min(99, Math.round(32 + h * 66));
          l == null || l.webContents.send("render:progress", {
            progress: w,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(h * 100)}%)...`
          });
        }
      }), l == null || l.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: m
      };
    } catch (o) {
      throw console.error("Render media error in main process:", o), new Error(o.message || "Render video thất bại");
    }
  }), _.handle("shell:open-path", async (p, t) => V.openPath(t)), _.handle("dialog:select-file", async (p, t) => l ? (await K.showOpenDialog(l, t)).filePaths : null), _.handle("dialog:select-folder", async () => l && (await K.showOpenDialog(l, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), _.handle("audio:read-file-base64", async (p, t) => {
    try {
      if (!t || !E.existsSync(t)) return null;
      const e = await E.promises.readFile(t), o = T.extname(t).toLowerCase().replace(".", "");
      let r = "audio/mp3";
      o === "wav" ? r = "audio/wav" : o === "m4a" ? r = "audio/m4a" : o === "aac" ? r = "audio/aac" : o === "ogg" ? r = "audio/ogg" : o === "mp4" ? r = "video/mp4" : o === "mov" ? r = "video/quicktime" : o === "webm" ? r = "video/webm" : o === "mkv" && (r = "video/x-matroska");
      const n = e.toString("base64");
      return {
        dataUrl: `data:${r};base64,${n}`,
        base64: n,
        mimeType: r,
        sizeBytes: e.length
      };
    } catch (e) {
      return console.error("Error reading audio/video file base64:", e), null;
    }
  });
  const g = process.env.GEMINI_API_KEY || "";
  _.handle("audio:transcribe", async (p, t) => {
    var c, i, a, s, d, f, v;
    const { audioBase64: e, mimeType: o = "audio/mp3" } = t, r = t.apiKey && t.apiKey.trim() ? t.apiKey.trim() : g;
    if (!e) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (o || "audio/mp3").split(";")[0].trim().toLowerCase(), m = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (r && r.trim()) {
      const h = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
        const y = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${r.trim()}`);
        if (y.ok) {
          const x = await y.json();
          if (Array.isArray(x.models)) {
            const k = x.models.filter((N) => {
              var S;
              return (S = N.supportedGenerationMethods) == null ? void 0 : S.includes("generateContent");
            }).map((N) => N.name.replace(/^models\//, ""));
            k.length > 0 && (w = k.sort((N, S) => N.includes("2.0-flash") ? -1 : S.includes("2.0-flash") ? 1 : N.includes("flash") ? -1 : S.includes("flash") ? 1 : 0));
          }
        } else {
          const x = await y.json().catch(() => ({}));
          if ((c = x == null ? void 0 : x.error) != null && c.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (y) {
        console.warn("Auto-discover Gemini models warning:", y);
      }
      let u = "";
      for (const y of w)
        try {
          const x = `https://generativelanguage.googleapis.com/v1beta/models/${y}:generateContent?key=${r.trim()}`, k = await fetch(x, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: m,
                        data: e
                      }
                    },
                    { text: h }
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
            const N = await k.json();
            let S = (f = (d = (s = (a = (i = N == null ? void 0 : N.candidates) == null ? void 0 : i[0]) == null ? void 0 : a.content) == null ? void 0 : s.parts) == null ? void 0 : d[0]) == null ? void 0 : f.text;
            if (S) {
              S = S.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const M = JSON.parse(S);
              if (M && M.narration)
                return {
                  narration: String(M.narration).trim(),
                  language: M.language || "vi",
                  audioDuration: Number(M.duration || 4),
                  words: Array.isArray(M.words) ? M.words : []
                };
            }
          } else {
            const N = await k.json().catch(() => ({}));
            u = ((v = N == null ? void 0 : N.error) == null ? void 0 : v.message) || `HTTP ${k.status}`;
          }
        } catch (x) {
          u = x.message;
        }
      if (u)
        return { error: `Gemini API: ${u}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), _.handle("media:search-web", async (p, t) => {
    try {
      const e = (t || "").trim();
      if (!e) return [];
      try {
        const m = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(e)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (m.ok) {
          const a = [...(await m.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((s) => decodeURIComponent(s[1])).filter((s) => s && !s.endsWith(".svg") && !s.includes("favicon"));
          if (a.length > 0)
            return a.slice(0, 20).map((s, d) => ({
              id: `bing-img-${d}-${Date.now()}`,
              type: "image",
              url: s,
              thumbnail: s,
              title: e,
              source: "web"
            }));
        }
      } catch (m) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", m);
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
        const m = n[1], i = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(e)}&vqd=${m}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (i.results && i.results.length > 0)
          return i.results.slice(0, 20).map((a, s) => ({
            id: `ddg-img-${s}-${Date.now()}`,
            type: "image",
            url: a.image,
            thumbnail: a.thumbnail || a.image,
            title: a.title || e,
            source: "web"
          }));
      }
      return [];
    } catch (e) {
      return console.warn("Web image search error:", e), [];
    }
  });
  const b = /* @__PURE__ */ new Map();
  _.handle("media:search-videos", async (p, t, e = 1) => {
    try {
      const o = (t || "").trim();
      if (!o) return [];
      const r = Math.max(1, Number(e) || 1), n = `${o.toLowerCase()}_p${r}`;
      if (b.has(n))
        return b.get(n);
      const m = (d) => d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), c = o.toLowerCase();
      let i = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(c))
        i = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(c))
        i = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(c))
        i = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(c))
        i = /cá/i.test(c) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(c))
        i = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(c))
        i = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(c))
        i = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(c))
        i = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(c))
        i = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(c))
        i = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(c))
        i = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(c))
        i = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(c))
        i = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(o)) {
        const d = o.split(/\s+/).filter(Boolean);
        i = [o, d[0] || "lifestyle", d[d.length - 1] || "cinematic"];
      } else
        i = [m(o).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const a = (r - 1) % i.length, s = [
        i[a],
        ...i.filter((d, f) => f !== a)
      ];
      for (const d of s)
        if (d)
          try {
            const f = new AbortController(), v = setTimeout(() => f.abort(), 3500), h = Math.floor((r - 1) / i.length) + 1, w = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(d)}&page=${h}&urls=true`,
              {
                signal: f.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(v), w.ok) {
              const y = (await w.json()).hits || [];
              if (y.length > 0) {
                const x = y.slice(0, 12).map((k, N) => {
                  var S, M, R, I;
                  return {
                    id: `coverr-video-${N}-${Date.now()}`,
                    type: "video",
                    url: ((S = k.urls) == null ? void 0 : S.mp4) || ((M = k.urls) == null ? void 0 : M.mp4_preview),
                    previewUrl: ((R = k.urls) == null ? void 0 : R.mp4_preview) || ((I = k.urls) == null ? void 0 : I.mp4),
                    thumbnail: k.thumbnail || k.poster,
                    title: k.title || o,
                    source: "web",
                    duration: Math.round(Number(k.duration || 8))
                  };
                });
                return b.set(n, x), x;
              }
            }
          } catch (f) {
            console.warn(`Coverr fetch failed for keyword: ${d}`, f);
          }
      return [];
    } catch (o) {
      return console.warn("Video search error in main process:", o), [];
    }
  }), _.handle(
    "ai:gemini-generate",
    async (p, t) => {
      var e, o, r, n, m, c;
      try {
        const { prompt: i, cookie: a, apiKey: s } = t || {}, d = (i || "").trim();
        if (!d)
          throw new Error("Prompt is required");
        const f = (s || a || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (f.startsWith("sk-") || f.length > 20)
          for (const v of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const h = await fetch("https://api.deepseek.com/chat/completions", {
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
                    { role: "user", content: d }
                  ],
                  temperature: 0.7
                })
              });
              if (h.ok) {
                const w = await h.json(), u = (r = (o = (e = w == null ? void 0 : w.choices) == null ? void 0 : e[0]) == null ? void 0 : o.message) == null ? void 0 : r.content;
                if (u && typeof u == "string")
                  return { text: u.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: u.length };
              }
            } catch (h) {
              console.warn("DeepSeek model failed in Electron main:", v, h);
            }
        if (f.startsWith("gsk_") || f.length > 20)
          for (const v of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const h = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
                    { role: "user", content: d }
                  ],
                  temperature: 0.7
                })
              });
              if (h.ok) {
                const w = await h.json(), u = (c = (m = (n = w == null ? void 0 : w.choices) == null ? void 0 : n[0]) == null ? void 0 : m.message) == null ? void 0 : c.content;
                if (u && typeof u == "string")
                  return { text: u.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: u.length };
              }
            } catch (h) {
              console.warn("Groq model failed in Electron main:", v, h);
            }
        return { text: "", rawLength: 0 };
      } catch (i) {
        throw console.error("Electron AI Generate error:", i), i;
      }
    }
  ), _.handle("voice:train", async (p, t) => new Promise((e, o) => {
    const r = T.resolve($, "../scripts/trainer/auto_voice_builder.py"), n = A("python", [r, "--json"], { windowsHide: !0 });
    let m = "", c = "";
    n.stdout.on("data", (a) => m += a.toString("utf-8")), n.stderr.on("data", (a) => c += a.toString("utf-8")), n.on("close", (a) => {
      if (a !== 0)
        return console.error(`Voice training process failed with code ${a}:`, c), o(new Error(c || `Process exited with code ${a}`));
      try {
        const s = JSON.parse(m);
        e(s);
      } catch (s) {
        o(new Error(`Failed to parse response from voice builder: ${s.message}`));
      }
    });
    const i = Buffer.from(JSON.stringify(t), "utf-8");
    n.stdin.write(i), n.stdin.end();
  })), _.handle("app:restart", () => {
    C.relaunch(), C.exit(0);
  }), _.handle("app:reload", () => {
    l == null || l.webContents.reload();
  });
}
