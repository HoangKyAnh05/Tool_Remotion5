import { app as C, BrowserWindow as W, ipcMain as S, shell as q, dialog as P, session as B } from "electron";
import M from "path";
import { spawn as V } from "child_process";
import { fileURLToPath as D } from "url";
import L from "https";
import j from "http";
import $ from "fs";
import { Communicate as F } from "edge-tts-universal";
import { bundle as z } from "@remotion/bundler";
import { selectComposition as G, renderMedia as H } from "@remotion/renderer";
const O = D(import.meta.url), A = M.dirname(O);
process.env.DIST = M.join(A, "../dist");
process.env.VITE_PUBLIC = C.isPackaged ? process.env.DIST : M.join(process.env.DIST, "../public");
let i, E = null;
const K = process.env.VITE_DEV_SERVER_URL;
function U() {
  i = new W({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: M.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: $.existsSync(M.join(A, "preload.cjs")) ? M.join(A, "preload.cjs") : M.join(A, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), B.defaultSession.setPermissionRequestHandler((g, v, p) => {
    p(!0);
  }), i.show(), i.focus(), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), K ? i.loadURL(K) : i.loadFile(M.join(process.env.DIST || "", "index.html"));
}
C.on("window-all-closed", () => {
  process.platform !== "darwin" && (C.quit(), i = null);
});
C.on("activate", () => {
  W.getAllWindows().length === 0 && U();
});
C.whenReady().then(() => {
  U(), ee();
});
function J(g) {
  return new Promise((v, p) => {
    (g.startsWith("https") ? L : j).get(
      g,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (t) => {
        if (t.statusCode && t.statusCode >= 400)
          return p(new Error(`HTTP error ${t.statusCode}`));
        const o = [];
        t.on("data", (r) => o.push(Buffer.isBuffer(r) ? r : Buffer.from(r))), t.on("end", () => v(Buffer.concat(o)));
      }
    ).on("error", p);
  });
}
async function Y(g, v) {
  try {
    const e = g.trim().split(/\s+/).filter(Boolean), o = !v.startsWith("en-") ? "vi" : "en", r = [];
    let n = "";
    for (const h of e)
      (n + " " + h).length > 80 ? (r.push(n.trim()), n = h) : n += " " + h;
    n.trim() && r.push(n.trim());
    const w = [];
    for (const h of r) {
      const m = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        h
      )}&tl=${o}&client=tw-ob`, f = await J(m);
      w.push(f);
    }
    const c = Buffer.concat(w), l = `data:audio/mp3;base64,${c.toString("base64")}`, a = Math.max(3, c.length / 3800), d = [], u = (a - 0.4) / Math.max(e.length, 1);
    let b = 0.2;
    for (const h of e) {
      const m = Math.max(0.2, Math.min(0.7, u));
      d.push({
        word: h,
        start: Number(b.toFixed(2)),
        end: Number((b + m).toFixed(2))
      }), b += m;
    }
    return {
      audioUrl: l,
      duration: Number((b + 0.3).toFixed(2)),
      words: d
    };
  } catch {
    const e = g.trim().split(/\s+/).filter(Boolean), t = e.map((o, r) => ({
      word: o,
      start: Number((r * 0.35 + 0.2).toFixed(2)),
      end: Number(((r + 1) * 0.35 + 0.2).toFixed(2))
    }));
    return {
      audioUrl: "",
      duration: Math.max(3.5, e.length * 0.35 + 0.5),
      words: t
    };
  }
}
function Q(g = "+0%") {
  if (!g) return "+0%";
  const v = String(g).trim();
  if (v.includes("%")) {
    const e = parseInt(v.replace("%", ""));
    return isNaN(e) ? v : e >= 0 ? `+${e}%` : `${e}%`;
  }
  if (v.toLowerCase().endsWith("x")) {
    const e = parseFloat(v.replace(/x/i, ""));
    if (!isNaN(e)) {
      const t = Math.round((e - 1) * 100);
      return t >= 0 ? `+${t}%` : `${t}%`;
    }
  }
  const p = parseFloat(v);
  if (!isNaN(p) && p > 0 && p <= 3) {
    const e = Math.round((p - 1) * 100);
    return e >= 0 ? `+${e}%` : `${e}%`;
  }
  return "+0%";
}
function Z(g = "vi-VN-NamMinhNeural", v = "+0%", p = "+0Hz") {
  let e = g || "vi-VN-NamMinhNeural", t = Q(v), o = "+0Hz";
  if (g === "google-vi-male" || g === "vi-male" || g === "adam" || g === "adam-tiktok" || g === "vclip:adam")
    e = "vi-VN-NamMinhNeural";
  else if (g === "google-vi" || g === "vi-female")
    e = "vi-VN-HoaiMyNeural";
  else if (g.includes(":") && !g.startsWith("elevenlabs:")) {
    const [r, n] = g.split(":");
    e = r || "vi-VN-NamMinhNeural", t === "+0%" && (n === "fast" || n === "live" || n === "adam" ? t = "+18%" : n === "recap" ? t = "+28%" : n === "sweet" ? t = "+8%" : n === "genz" ? t = "+20%" : n === "story" && (t = "-8%"));
  }
  return { effectiveVoice: e, effectiveRate: t, effectivePitch: o };
}
function X(g, v, p = "+0%") {
  return new Promise((e, t) => {
    const o = M.resolve(A, "../scripts/kokoro_tts_engine.py"), r = V("python", [o, "--json"], { windowsHide: !0 });
    let n = "", w = "";
    r.stdout.on("data", (l) => n += l.toString("utf-8")), r.stderr.on("data", (l) => w += l.toString("utf-8")), r.on("close", (l) => {
      if (l !== 0)
        return t(new Error(`Kokoro process exited with code ${l}: ${w}`));
      try {
        const a = JSON.parse(n);
        e(a);
      } catch (a) {
        t(new Error(`Failed to parse Kokoro JSON: ${a.message}`));
      }
    });
    let c = 1;
    if (p.includes("%")) {
      const l = parseInt(p.replace("%", ""));
      isNaN(l) || (c = Math.max(0.5, Math.min(2, 1 + l / 100)));
    }
    const s = v.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    r.stdin.write(JSON.stringify({ text: g, voice: s, speed: c })), r.stdin.end();
  });
}
function ee() {
  S.handle(
    "tts:synthesize",
    async (p, { text: e, voice: t = "vi-VN-NamMinhNeural", rate: o = "+0%", pitch: r = "+0Hz" }) => {
      try {
        const n = e.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        if (t.startsWith("kokoro:") || t === "ngoc_huyen" || t === "manh_dung")
          try {
            const f = await X(n, t, o);
            if (f && f.audioUrl)
              return f;
          } catch (f) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", f);
          }
        const { effectiveVoice: w, effectiveRate: c, effectivePitch: s } = Z(t, o, r), l = new F(n, {
          voice: w,
          rate: c,
          pitch: s
        }), a = [], d = [];
        for await (const f of l.stream()) {
          const y = f;
          if (y.type === "audio" && y.data)
            d.push(Buffer.isBuffer(y.data) ? y.data : Buffer.from(y.data));
          else if (y.type === "WordBoundary" && y.text) {
            const x = Number(((y.offset || 0) / 1e7).toFixed(2)), k = Number(((y.duration || 0) / 1e7).toFixed(2));
            a.push({
              word: String(y.text),
              start: x,
              end: Number((x + k).toFixed(2))
            });
          }
        }
        const u = Buffer.concat(d);
        if (u.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const h = `data:audio/mp3;base64,${u.toString("base64")}`;
        let m = 3;
        return a.length > 0 ? m = Number((a[a.length - 1].end + 0.3).toFixed(2)) : m = Number(Math.max(2.5, u.length / 5500).toFixed(2)), {
          audioUrl: h,
          duration: m,
          words: a
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(e, t);
      }
    }
  ), S.handle("render:video", async (p, { project: e, resolution: t = "1080p" }) => {
    try {
      const o = M.resolve("out");
      $.existsSync(o) || $.mkdirSync(o, { recursive: !0 });
      const n = `${(e.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, w = M.join(o, n);
      i == null || i.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const c = M.resolve("src/remotion/index.ts");
      E = await z({
        entryPoint: c,
        onProgress: (h) => {
          i == null || i.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + h * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${h}%)...`
          });
        }
      }), i == null || i.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const s = e.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", l = await G({
        serveUrl: E,
        id: s,
        inputProps: { project: e }
      }), a = e.fps || 30, d = Math.max(
        (e.scenes || []).reduce(
          (h, m) => h + Math.max(Math.round((m.audioDuration || 4) * a), Math.round(2 * a)),
          0
        ),
        30
      );
      let u = e.aspectRatio === "9:16" ? 1080 : 1920, b = e.aspectRatio === "9:16" ? 1920 : 1080;
      return t === "4k" && (u = e.aspectRatio === "9:16" ? 2160 : 3840, b = e.aspectRatio === "9:16" ? 3840 : 2160), i == null || i.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${d} khung hình (${u}x${b})...`
      }), await H({
        composition: {
          ...l,
          durationInFrames: d,
          width: u,
          height: b,
          fps: a
        },
        serveUrl: E,
        codec: "h264",
        outputLocation: w,
        inputProps: { project: e },
        onProgress: ({ progress: h }) => {
          const m = Math.min(99, Math.round(32 + h * 66));
          i == null || i.webContents.send("render:progress", {
            progress: m,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(h * 100)}%)...`
          });
        }
      }), i == null || i.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: w
      };
    } catch (o) {
      throw console.error("Render media error in main process:", o), new Error(o.message || "Render video thất bại");
    }
  }), S.handle("shell:open-path", async (p, e) => q.openPath(e)), S.handle("dialog:select-file", async (p, e) => i ? (await P.showOpenDialog(i, e)).filePaths : null), S.handle("dialog:select-folder", async () => i && (await P.showOpenDialog(i, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), S.handle("audio:read-file-base64", async (p, e) => {
    try {
      if (!e || !$.existsSync(e)) return null;
      const t = await $.promises.readFile(e), o = M.extname(e).toLowerCase().replace(".", "");
      let r = "audio/mp3";
      o === "wav" ? r = "audio/wav" : o === "m4a" ? r = "audio/m4a" : o === "aac" ? r = "audio/aac" : o === "ogg" ? r = "audio/ogg" : o === "mp4" ? r = "video/mp4" : o === "mov" ? r = "video/quicktime" : o === "webm" ? r = "video/webm" : o === "mkv" && (r = "video/x-matroska");
      const n = t.toString("base64");
      return {
        dataUrl: `data:${r};base64,${n}`,
        base64: n,
        mimeType: r,
        sizeBytes: t.length
      };
    } catch (t) {
      return console.error("Error reading audio/video file base64:", t), null;
    }
  });
  const g = process.env.GEMINI_API_KEY || "";
  S.handle("audio:transcribe", async (p, e) => {
    var c, s, l, a, d, u, b;
    const { audioBase64: t, mimeType: o = "audio/mp3" } = e, r = e.apiKey && e.apiKey.trim() ? e.apiKey.trim() : g;
    if (!t) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (o || "audio/mp3").split(";")[0].trim().toLowerCase(), w = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
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
      let m = [
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
              var T;
              return (T = N.supportedGenerationMethods) == null ? void 0 : T.includes("generateContent");
            }).map((N) => N.name.replace(/^models\//, ""));
            k.length > 0 && (m = k.sort((N, T) => N.includes("2.0-flash") ? -1 : T.includes("2.0-flash") ? 1 : N.includes("flash") ? -1 : T.includes("flash") ? 1 : 0));
          }
        } else {
          const x = await y.json().catch(() => ({}));
          if ((c = x == null ? void 0 : x.error) != null && c.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (y) {
        console.warn("Auto-discover Gemini models warning:", y);
      }
      let f = "";
      for (const y of m)
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
                        mime_type: w,
                        data: t
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
            let T = (u = (d = (a = (l = (s = N == null ? void 0 : N.candidates) == null ? void 0 : s[0]) == null ? void 0 : l.content) == null ? void 0 : a.parts) == null ? void 0 : d[0]) == null ? void 0 : u.text;
            if (T) {
              T = T.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const _ = JSON.parse(T);
              if (_ && _.narration)
                return {
                  narration: String(_.narration).trim(),
                  language: _.language || "vi",
                  audioDuration: Number(_.duration || 4),
                  words: Array.isArray(_.words) ? _.words : []
                };
            }
          } else {
            const N = await k.json().catch(() => ({}));
            f = ((b = N == null ? void 0 : N.error) == null ? void 0 : b.message) || `HTTP ${k.status}`;
          }
        } catch (x) {
          f = x.message;
        }
      if (f)
        return { error: `Gemini API: ${f}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), S.handle("media:search-web", async (p, e) => {
    try {
      const t = (e || "").trim();
      if (!t) return [];
      try {
        const w = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(t)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (w.ok) {
          const l = [...(await w.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((a) => decodeURIComponent(a[1])).filter((a) => a && !a.endsWith(".svg") && !a.includes("favicon"));
          if (l.length > 0)
            return l.slice(0, 20).map((a, d) => ({
              id: `bing-img-${d}-${Date.now()}`,
              type: "image",
              url: a,
              thumbnail: a,
              title: t,
              source: "web"
            }));
        }
      } catch (w) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", w);
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
        const w = n[1], s = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(t)}&vqd=${w}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (s.results && s.results.length > 0)
          return s.results.slice(0, 20).map((l, a) => ({
            id: `ddg-img-${a}-${Date.now()}`,
            type: "image",
            url: l.image,
            thumbnail: l.thumbnail || l.image,
            title: l.title || t,
            source: "web"
          }));
      }
      return [];
    } catch (t) {
      return console.warn("Web image search error:", t), [];
    }
  });
  const v = /* @__PURE__ */ new Map();
  S.handle("media:search-videos", async (p, e, t = 1) => {
    try {
      const o = (e || "").trim();
      if (!o) return [];
      const r = Math.max(1, Number(t) || 1), n = `${o.toLowerCase()}_p${r}`;
      if (v.has(n))
        return v.get(n);
      const w = (d) => d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), c = o.toLowerCase();
      let s = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(c))
        s = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(c))
        s = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(c))
        s = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(c))
        s = /cá/i.test(c) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(c))
        s = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(c))
        s = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(c))
        s = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(c))
        s = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(c))
        s = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(c))
        s = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(c))
        s = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(c))
        s = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(c))
        s = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(o)) {
        const d = o.split(/\s+/).filter(Boolean);
        s = [o, d[0] || "lifestyle", d[d.length - 1] || "cinematic"];
      } else
        s = [w(o).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const l = (r - 1) % s.length, a = [
        s[l],
        ...s.filter((d, u) => u !== l)
      ];
      for (const d of a)
        if (d)
          try {
            const u = new AbortController(), b = setTimeout(() => u.abort(), 3500), h = Math.floor((r - 1) / s.length) + 1, m = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(d)}&page=${h}&urls=true`,
              {
                signal: u.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(b), m.ok) {
              const y = (await m.json()).hits || [];
              if (y.length > 0) {
                const x = y.slice(0, 12).map((k, N) => {
                  var T, _, R, I;
                  return {
                    id: `coverr-video-${N}-${Date.now()}`,
                    type: "video",
                    url: ((T = k.urls) == null ? void 0 : T.mp4) || ((_ = k.urls) == null ? void 0 : _.mp4_preview),
                    previewUrl: ((R = k.urls) == null ? void 0 : R.mp4_preview) || ((I = k.urls) == null ? void 0 : I.mp4),
                    thumbnail: k.thumbnail || k.poster,
                    title: k.title || o,
                    source: "web",
                    duration: Math.round(Number(k.duration || 8))
                  };
                });
                return v.set(n, x), x;
              }
            }
          } catch (u) {
            console.warn(`Coverr fetch failed for keyword: ${d}`, u);
          }
      return [];
    } catch (o) {
      return console.warn("Video search error in main process:", o), [];
    }
  }), S.handle(
    "ai:gemini-generate",
    async (p, e) => {
      var t, o, r, n, w, c;
      try {
        const { prompt: s, cookie: l, apiKey: a } = e || {}, d = (s || "").trim();
        if (!d)
          throw new Error("Prompt is required");
        const u = (a || l || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (u.startsWith("sk-") || u.length > 20)
          for (const b of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const h = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${u}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: b,
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
                const m = await h.json(), f = (r = (o = (t = m == null ? void 0 : m.choices) == null ? void 0 : t[0]) == null ? void 0 : o.message) == null ? void 0 : r.content;
                if (f && typeof f == "string")
                  return { text: f.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: f.length };
              }
            } catch (h) {
              console.warn("DeepSeek model failed in Electron main:", b, h);
            }
        if (u.startsWith("gsk_") || u.length > 20)
          for (const b of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const h = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${u}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: b,
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
                const m = await h.json(), f = (c = (w = (n = m == null ? void 0 : m.choices) == null ? void 0 : n[0]) == null ? void 0 : w.message) == null ? void 0 : c.content;
                if (f && typeof f == "string")
                  return { text: f.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: f.length };
              }
            } catch (h) {
              console.warn("Groq model failed in Electron main:", b, h);
            }
        return { text: "", rawLength: 0 };
      } catch (s) {
        throw console.error("Electron AI Generate error:", s), s;
      }
    }
  ), S.handle("app:restart", () => {
    C.relaunch(), C.exit(0);
  }), S.handle("app:reload", () => {
    i == null || i.webContents.reload();
  });
}
