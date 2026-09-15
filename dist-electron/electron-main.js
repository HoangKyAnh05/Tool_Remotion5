import { app as S, BrowserWindow as W, ipcMain as M, shell as U, dialog as P, session as B } from "electron";
import C from "path";
import { fileURLToPath as V } from "url";
import D from "https";
import L from "http";
import $ from "fs";
import { Communicate as j } from "edge-tts-universal";
import { bundle as F } from "@remotion/bundler";
import { selectComposition as G, renderMedia as z } from "@remotion/renderer";
const H = V(import.meta.url), A = C.dirname(H);
process.env.DIST = C.join(A, "../dist");
process.env.VITE_PUBLIC = S.isPackaged ? process.env.DIST : C.join(process.env.DIST, "../public");
let s, R = null;
const K = process.env.VITE_DEV_SERVER_URL;
function q() {
  s = new W({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: C.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: $.existsSync(C.join(A, "preload.cjs")) ? C.join(A, "preload.cjs") : C.join(A, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), B.defaultSession.setPermissionRequestHandler((m, k, p) => {
    p(!0);
  }), s.show(), s.focus(), s.webContents.on("did-finish-load", () => {
    s == null || s.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), K ? s.loadURL(K) : s.loadFile(C.join(process.env.DIST || "", "index.html"));
}
S.on("window-all-closed", () => {
  process.platform !== "darwin" && (S.quit(), s = null);
});
S.on("activate", () => {
  W.getAllWindows().length === 0 && q();
});
S.whenReady().then(() => {
  q(), Z();
});
function O(m) {
  return new Promise((k, p) => {
    (m.startsWith("https") ? D : L).get(
      m,
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
        t.on("data", (r) => o.push(Buffer.isBuffer(r) ? r : Buffer.from(r))), t.on("end", () => k(Buffer.concat(o)));
      }
    ).on("error", p);
  });
}
async function Y(m, k) {
  try {
    const e = m.trim().split(/\s+/).filter(Boolean), o = !k.startsWith("en-") ? "vi" : "en", r = [];
    let n = "";
    for (const a of e)
      (n + " " + a).length > 80 ? (r.push(n.trim()), n = a) : n += " " + a;
    n.trim() && r.push(n.trim());
    const f = [];
    for (const a of r) {
      const u = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        a
      )}&tl=${o}&client=tw-ob`, y = await O(u);
      f.push(y);
    }
    const c = Buffer.concat(f), w = `data:audio/mp3;base64,${c.toString("base64")}`, l = Math.max(3, c.length / 3800), h = [], d = (l - 0.4) / Math.max(e.length, 1);
    let b = 0.2;
    for (const a of e) {
      const u = Math.max(0.2, Math.min(0.7, d));
      h.push({
        word: a,
        start: Number(b.toFixed(2)),
        end: Number((b + u).toFixed(2))
      }), b += u;
    }
    return {
      audioUrl: w,
      duration: Number((b + 0.3).toFixed(2)),
      words: h
    };
  } catch {
    const e = m.trim().split(/\s+/).filter(Boolean), t = e.map((o, r) => ({
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
function J(m = "+0%") {
  if (!m) return "+0%";
  const k = String(m).trim();
  if (k.includes("%")) {
    const e = parseInt(k.replace("%", ""));
    return isNaN(e) ? k : e >= 0 ? `+${e}%` : `${e}%`;
  }
  if (k.toLowerCase().endsWith("x")) {
    const e = parseFloat(k.replace(/x/i, ""));
    if (!isNaN(e)) {
      const t = Math.round((e - 1) * 100);
      return t >= 0 ? `+${t}%` : `${t}%`;
    }
  }
  const p = parseFloat(k);
  if (!isNaN(p) && p > 0 && p <= 3) {
    const e = Math.round((p - 1) * 100);
    return e >= 0 ? `+${e}%` : `${e}%`;
  }
  return "+0%";
}
function Q(m = "vi-VN-NamMinhNeural", k = "+0%", p = "+0Hz") {
  let e = m || "vi-VN-NamMinhNeural", t = J(k), o = "+0Hz";
  if (m === "google-vi-male" || m === "vi-male" || m === "adam" || m === "adam-tiktok" || m === "vclip:adam")
    e = "vi-VN-NamMinhNeural";
  else if (m === "google-vi" || m === "vi-female")
    e = "vi-VN-HoaiMyNeural";
  else if (m.includes(":") && !m.startsWith("elevenlabs:")) {
    const [r, n] = m.split(":");
    e = r || "vi-VN-NamMinhNeural", t === "+0%" && (n === "fast" || n === "live" || n === "adam" ? t = "+18%" : n === "recap" ? t = "+28%" : n === "sweet" ? t = "+8%" : n === "genz" ? t = "+20%" : n === "story" && (t = "-8%"));
  }
  return { effectiveVoice: e, effectiveRate: t, effectivePitch: o };
}
function Z() {
  M.handle(
    "tts:synthesize",
    async (p, { text: e, voice: t = "vi-VN-NamMinhNeural", rate: o = "+0%", pitch: r = "+0Hz" }) => {
      try {
        const n = e.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        const { effectiveVoice: f, effectiveRate: c, effectivePitch: i } = Q(t, o, r), w = new j(n, {
          voice: f,
          rate: c,
          pitch: i
        }), l = [], h = [];
        for await (const y of w.stream()) {
          const g = y;
          if (g.type === "audio" && g.data)
            h.push(Buffer.isBuffer(g.data) ? g.data : Buffer.from(g.data));
          else if (g.type === "WordBoundary" && g.text) {
            const x = Number(((g.offset || 0) / 1e7).toFixed(2)), v = Number(((g.duration || 0) / 1e7).toFixed(2));
            l.push({
              word: String(g.text),
              start: x,
              end: Number((x + v).toFixed(2))
            });
          }
        }
        const d = Buffer.concat(h);
        if (d.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const a = `data:audio/mp3;base64,${d.toString("base64")}`;
        let u = 3;
        return l.length > 0 ? u = Number((l[l.length - 1].end + 0.3).toFixed(2)) : u = Number(Math.max(2.5, d.length / 5500).toFixed(2)), {
          audioUrl: a,
          duration: u,
          words: l
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(e, t);
      }
    }
  ), M.handle("render:video", async (p, { project: e, resolution: t = "1080p" }) => {
    try {
      const o = C.resolve("out");
      $.existsSync(o) || $.mkdirSync(o, { recursive: !0 });
      const n = `${(e.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, f = C.join(o, n);
      s == null || s.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const c = C.resolve("src/remotion/index.ts");
      R = await F({
        entryPoint: c,
        onProgress: (a) => {
          s == null || s.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + a * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${a}%)...`
          });
        }
      }), s == null || s.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const i = e.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", w = await G({
        serveUrl: R,
        id: i,
        inputProps: { project: e }
      }), l = e.fps || 30, h = Math.max(
        (e.scenes || []).reduce(
          (a, u) => a + Math.max(Math.round((u.audioDuration || 4) * l), Math.round(2 * l)),
          0
        ),
        30
      );
      let d = e.aspectRatio === "9:16" ? 1080 : 1920, b = e.aspectRatio === "9:16" ? 1920 : 1080;
      return t === "4k" && (d = e.aspectRatio === "9:16" ? 2160 : 3840, b = e.aspectRatio === "9:16" ? 3840 : 2160), s == null || s.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${h} khung hình (${d}x${b})...`
      }), await z({
        composition: {
          ...w,
          durationInFrames: h,
          width: d,
          height: b,
          fps: l
        },
        serveUrl: R,
        codec: "h264",
        outputLocation: f,
        inputProps: { project: e },
        onProgress: ({ progress: a }) => {
          const u = Math.min(99, Math.round(32 + a * 66));
          s == null || s.webContents.send("render:progress", {
            progress: u,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(a * 100)}%)...`
          });
        }
      }), s == null || s.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: f
      };
    } catch (o) {
      throw console.error("Render media error in main process:", o), new Error(o.message || "Render video thất bại");
    }
  }), M.handle("shell:open-path", async (p, e) => U.openPath(e)), M.handle("dialog:select-file", async (p, e) => s ? (await P.showOpenDialog(s, e)).filePaths : null), M.handle("dialog:select-folder", async () => s && (await P.showOpenDialog(s, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), M.handle("audio:read-file-base64", async (p, e) => {
    try {
      if (!e || !$.existsSync(e)) return null;
      const t = await $.promises.readFile(e), o = C.extname(e).toLowerCase().replace(".", "");
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
  const m = process.env.GEMINI_API_KEY || "";
  M.handle("audio:transcribe", async (p, e) => {
    var c, i, w, l, h, d, b;
    const { audioBase64: t, mimeType: o = "audio/mp3" } = e, r = e.apiKey && e.apiKey.trim() ? e.apiKey.trim() : m;
    if (!t) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (o || "audio/mp3").split(";")[0].trim().toLowerCase(), f = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (r && r.trim()) {
      const a = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
      let u = [
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
        const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${r.trim()}`);
        if (g.ok) {
          const x = await g.json();
          if (Array.isArray(x.models)) {
            const v = x.models.filter((N) => {
              var T;
              return (T = N.supportedGenerationMethods) == null ? void 0 : T.includes("generateContent");
            }).map((N) => N.name.replace(/^models\//, ""));
            v.length > 0 && (u = v.sort((N, T) => N.includes("2.0-flash") ? -1 : T.includes("2.0-flash") ? 1 : N.includes("flash") ? -1 : T.includes("flash") ? 1 : 0));
          }
        } else {
          const x = await g.json().catch(() => ({}));
          if ((c = x == null ? void 0 : x.error) != null && c.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (g) {
        console.warn("Auto-discover Gemini models warning:", g);
      }
      let y = "";
      for (const g of u)
        try {
          const x = `https://generativelanguage.googleapis.com/v1beta/models/${g}:generateContent?key=${r.trim()}`, v = await fetch(x, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: f,
                        data: t
                      }
                    },
                    { text: a }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
              }
            })
          });
          if (v.ok) {
            const N = await v.json();
            let T = (d = (h = (l = (w = (i = N == null ? void 0 : N.candidates) == null ? void 0 : i[0]) == null ? void 0 : w.content) == null ? void 0 : l.parts) == null ? void 0 : h[0]) == null ? void 0 : d.text;
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
            const N = await v.json().catch(() => ({}));
            y = ((b = N == null ? void 0 : N.error) == null ? void 0 : b.message) || `HTTP ${v.status}`;
          }
        } catch (x) {
          y = x.message;
        }
      if (y)
        return { error: `Gemini API: ${y}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), M.handle("media:search-web", async (p, e) => {
    try {
      const t = (e || "").trim();
      if (!t) return [];
      try {
        const f = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(t)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (f.ok) {
          const w = [...(await f.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((l) => decodeURIComponent(l[1])).filter((l) => l && !l.endsWith(".svg") && !l.includes("favicon"));
          if (w.length > 0)
            return w.slice(0, 20).map((l, h) => ({
              id: `bing-img-${h}-${Date.now()}`,
              type: "image",
              url: l,
              thumbnail: l,
              title: t,
              source: "web"
            }));
        }
      } catch (f) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", f);
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
        const f = n[1], i = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(t)}&vqd=${f}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (i.results && i.results.length > 0)
          return i.results.slice(0, 20).map((w, l) => ({
            id: `ddg-img-${l}-${Date.now()}`,
            type: "image",
            url: w.image,
            thumbnail: w.thumbnail || w.image,
            title: w.title || t,
            source: "web"
          }));
      }
      return [];
    } catch (t) {
      return console.warn("Web image search error:", t), [];
    }
  });
  const k = /* @__PURE__ */ new Map();
  M.handle("media:search-videos", async (p, e, t = 1) => {
    try {
      const o = (e || "").trim();
      if (!o) return [];
      const r = Math.max(1, Number(t) || 1), n = `${o.toLowerCase()}_p${r}`;
      if (k.has(n))
        return k.get(n);
      const f = (h) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), c = o.toLowerCase();
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
        const h = o.split(/\s+/).filter(Boolean);
        i = [o, h[0] || "lifestyle", h[h.length - 1] || "cinematic"];
      } else
        i = [f(o).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const w = (r - 1) % i.length, l = [
        i[w],
        ...i.filter((h, d) => d !== w)
      ];
      for (const h of l)
        if (h)
          try {
            const d = new AbortController(), b = setTimeout(() => d.abort(), 3500), a = Math.floor((r - 1) / i.length) + 1, u = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(h)}&page=${a}&urls=true`,
              {
                signal: d.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(b), u.ok) {
              const g = (await u.json()).hits || [];
              if (g.length > 0) {
                const x = g.slice(0, 12).map((v, N) => {
                  var T, _, E, I;
                  return {
                    id: `coverr-video-${N}-${Date.now()}`,
                    type: "video",
                    url: ((T = v.urls) == null ? void 0 : T.mp4) || ((_ = v.urls) == null ? void 0 : _.mp4_preview),
                    previewUrl: ((E = v.urls) == null ? void 0 : E.mp4_preview) || ((I = v.urls) == null ? void 0 : I.mp4),
                    thumbnail: v.thumbnail || v.poster,
                    title: v.title || o,
                    source: "web",
                    duration: Math.round(Number(v.duration || 8))
                  };
                });
                return k.set(n, x), x;
              }
            }
          } catch (d) {
            console.warn(`Coverr fetch failed for keyword: ${h}`, d);
          }
      return [];
    } catch (o) {
      return console.warn("Video search error in main process:", o), [];
    }
  }), M.handle(
    "ai:gemini-generate",
    async (p, e) => {
      var t, o, r, n, f, c;
      try {
        const { prompt: i, cookie: w, apiKey: l } = e || {}, h = (i || "").trim();
        if (!h)
          throw new Error("Prompt is required");
        const d = (l || w || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (d.startsWith("sk-") || d.length > 20)
          for (const b of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const a = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${d}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: b,
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
              if (a.ok) {
                const u = await a.json(), y = (r = (o = (t = u == null ? void 0 : u.choices) == null ? void 0 : t[0]) == null ? void 0 : o.message) == null ? void 0 : r.content;
                if (y && typeof y == "string")
                  return { text: y.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: y.length };
              }
            } catch (a) {
              console.warn("DeepSeek model failed in Electron main:", b, a);
            }
        if (d.startsWith("gsk_") || d.length > 20)
          for (const b of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const a = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${d}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: b,
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
              if (a.ok) {
                const u = await a.json(), y = (c = (f = (n = u == null ? void 0 : u.choices) == null ? void 0 : n[0]) == null ? void 0 : f.message) == null ? void 0 : c.content;
                if (y && typeof y == "string")
                  return { text: y.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: y.length };
              }
            } catch (a) {
              console.warn("Groq model failed in Electron main:", b, a);
            }
        return { text: "", rawLength: 0 };
      } catch (i) {
        throw console.error("Electron AI Generate error:", i), i;
      }
    }
  ), M.handle("app:restart", () => {
    S.relaunch(), S.exit(0);
  }), M.handle("app:reload", () => {
    s == null || s.webContents.reload();
  });
}
