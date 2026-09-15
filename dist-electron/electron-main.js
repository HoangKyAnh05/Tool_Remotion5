import { app as N, BrowserWindow as U, ipcMain as T, shell as W, dialog as P, session as B } from "electron";
import M from "path";
import { fileURLToPath as V } from "url";
import D from "https";
import L from "http";
import R from "fs";
import { Communicate as F } from "edge-tts-universal";
import { bundle as H } from "@remotion/bundler";
import { selectComposition as j, renderMedia as G } from "@remotion/renderer";
const z = V(import.meta.url), $ = M.dirname(z);
process.env.DIST = M.join($, "../dist");
process.env.VITE_PUBLIC = N.isPackaged ? process.env.DIST : M.join(process.env.DIST, "../public");
let s, S = null;
const K = process.env.VITE_DEV_SERVER_URL;
function q() {
  s = new U({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: M.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: R.existsSync(M.join($, "preload.cjs")) ? M.join($, "preload.cjs") : M.join($, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), B.defaultSession.setPermissionRequestHandler((b, C, y) => {
    y(!0);
  }), s.show(), s.focus(), s.webContents.on("did-finish-load", () => {
    s == null || s.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), K ? s.loadURL(K) : s.loadFile(M.join(process.env.DIST || "", "index.html"));
}
N.on("window-all-closed", () => {
  process.platform !== "darwin" && (N.quit(), s = null);
});
N.on("activate", () => {
  U.getAllWindows().length === 0 && q();
});
N.whenReady().then(() => {
  q(), Q();
});
function O(b) {
  return new Promise((C, y) => {
    (b.startsWith("https") ? D : L).get(
      b,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (e) => {
        if (e.statusCode && e.statusCode >= 400)
          return y(new Error(`HTTP error ${e.statusCode}`));
        const n = [];
        e.on("data", (r) => n.push(Buffer.isBuffer(r) ? r : Buffer.from(r))), e.on("end", () => C(Buffer.concat(n)));
      }
    ).on("error", y);
  });
}
async function Y(b, C) {
  try {
    const t = b.trim().split(/\s+/).filter(Boolean), n = !C.startsWith("en-") ? "vi" : "en", r = [];
    let o = "";
    for (const u of t)
      (o + " " + u).length > 80 ? (r.push(o.trim()), o = u) : o += " " + u;
    o.trim() && r.push(o.trim());
    const g = [];
    for (const u of r) {
      const f = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        u
      )}&tl=${n}&client=tw-ob`, A = await O(f);
      g.push(A);
    }
    const l = Buffer.concat(g), h = `data:audio/mp3;base64,${l.toString("base64")}`, a = Math.max(3, l.length / 3800), c = [], d = (a - 0.4) / Math.max(t.length, 1);
    let p = 0.2;
    for (const u of t) {
      const f = Math.max(0.2, Math.min(0.7, d));
      c.push({
        word: u,
        start: Number(p.toFixed(2)),
        end: Number((p + f).toFixed(2))
      }), p += f;
    }
    return {
      audioUrl: h,
      duration: Number((p + 0.3).toFixed(2)),
      words: c
    };
  } catch {
    const t = b.trim().split(/\s+/).filter(Boolean), e = t.map((n, r) => ({
      word: n,
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
function J(b = "vi-VN-HoaiMyNeural", C = "+0%", y = "+0Hz") {
  let t = b || "vi-VN-HoaiMyNeural", e = C || "+0%", n = "+0Hz";
  if (b === "adam" || b === "adam-tiktok" || b === "vclip:adam")
    return { effectiveVoice: "vi-VN-NamMinhNeural", effectiveRate: "+18%", effectivePitch: "+0Hz" };
  if (b && b.includes(":") && !b.startsWith("elevenlabs:")) {
    const [r, o] = b.split(":");
    switch (t = r, o) {
      case "adam":
      case "fast":
        e = "+18%";
        break;
      case "recap":
        e = "+25%";
        break;
      case "live":
        e = "+18%";
        break;
      case "sweet":
        e = "+8%";
        break;
      case "genz":
        e = "+22%";
        break;
      case "story":
        e = "-8%";
        break;
      case "deep":
        e = "-4%";
        break;
      case "asmr":
        e = "-3%";
        break;
      case "meme":
        e = "+12%";
        break;
    }
  }
  return { effectiveVoice: t, effectiveRate: e, effectivePitch: n };
}
function Q() {
  T.handle(
    "tts:synthesize",
    async (y, { text: t, voice: e = "vi-VN-HoaiMyNeural", rate: n = "+0%", pitch: r = "+0Hz" }) => {
      try {
        const o = t.trim();
        if (!o)
          return { audioUrl: "", duration: 1, words: [] };
        const { effectiveVoice: g, effectiveRate: l, effectivePitch: i } = J(e, n, r), h = new F(o, {
          voice: g,
          rate: l,
          pitch: i
        }), a = [], c = [];
        for await (const A of h.stream()) {
          const m = A;
          if (m.type === "audio" && m.data)
            c.push(Buffer.isBuffer(m.data) ? m.data : Buffer.from(m.data));
          else if (m.type === "WordBoundary" && m.text) {
            const v = Number(((m.offset || 0) / 1e7).toFixed(2)), w = Number(((m.duration || 0) / 1e7).toFixed(2));
            a.push({
              word: String(m.text),
              start: v,
              end: Number((v + w).toFixed(2))
            });
          }
        }
        const d = Buffer.concat(c);
        if (d.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const u = `data:audio/mp3;base64,${d.toString("base64")}`;
        let f = 3;
        return a.length > 0 ? f = Number((a[a.length - 1].end + 0.3).toFixed(2)) : f = Number(Math.max(2.5, d.length / 5500).toFixed(2)), {
          audioUrl: u,
          duration: f,
          words: a
        };
      } catch (o) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (o == null ? void 0 : o.message) || o), Y(t, e);
      }
    }
  ), T.handle("render:video", async (y, { project: t, resolution: e = "1080p" }) => {
    try {
      const n = M.resolve("out");
      R.existsSync(n) || R.mkdirSync(n, { recursive: !0 });
      const o = `${(t.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, g = M.join(n, o);
      s == null || s.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const l = M.resolve("src/remotion/index.ts");
      S = await H({
        entryPoint: l,
        onProgress: (u) => {
          s == null || s.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + u * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${u}%)...`
          });
        }
      }), s == null || s.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const i = t.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", h = await j({
        serveUrl: S,
        id: i,
        inputProps: { project: t }
      }), a = t.fps || 30, c = Math.max(
        (t.scenes || []).reduce(
          (u, f) => u + Math.max(Math.round((f.audioDuration || 4) * a), Math.round(2 * a)),
          0
        ),
        30
      );
      let d = t.aspectRatio === "9:16" ? 1080 : 1920, p = t.aspectRatio === "9:16" ? 1920 : 1080;
      return e === "4k" && (d = t.aspectRatio === "9:16" ? 2160 : 3840, p = t.aspectRatio === "9:16" ? 3840 : 2160), s == null || s.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${c} khung hình (${d}x${p})...`
      }), await G({
        composition: {
          ...h,
          durationInFrames: c,
          width: d,
          height: p,
          fps: a
        },
        serveUrl: S,
        codec: "h264",
        outputLocation: g,
        inputProps: { project: t },
        onProgress: ({ progress: u }) => {
          const f = Math.min(99, Math.round(32 + u * 66));
          s == null || s.webContents.send("render:progress", {
            progress: f,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(u * 100)}%)...`
          });
        }
      }), s == null || s.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: g
      };
    } catch (n) {
      throw console.error("Render media error in main process:", n), new Error(n.message || "Render video thất bại");
    }
  }), T.handle("shell:open-path", async (y, t) => W.openPath(t)), T.handle("dialog:select-file", async (y, t) => s ? (await P.showOpenDialog(s, t)).filePaths : null), T.handle("dialog:select-folder", async () => s && (await P.showOpenDialog(s, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), T.handle("audio:read-file-base64", async (y, t) => {
    try {
      if (!t || !R.existsSync(t)) return null;
      const e = await R.promises.readFile(t), n = M.extname(t).toLowerCase().replace(".", "");
      let r = "audio/mp3";
      n === "wav" ? r = "audio/wav" : n === "m4a" ? r = "audio/m4a" : n === "aac" ? r = "audio/aac" : n === "ogg" ? r = "audio/ogg" : n === "mp4" ? r = "video/mp4" : n === "mov" ? r = "video/quicktime" : n === "webm" ? r = "video/webm" : n === "mkv" && (r = "video/x-matroska");
      const o = e.toString("base64");
      return {
        dataUrl: `data:${r};base64,${o}`,
        base64: o,
        mimeType: r,
        sizeBytes: e.length
      };
    } catch (e) {
      return console.error("Error reading audio/video file base64:", e), null;
    }
  });
  const b = process.env.GEMINI_API_KEY || "";
  T.handle("audio:transcribe", async (y, t) => {
    var l, i, h, a, c, d, p;
    const { audioBase64: e, mimeType: n = "audio/mp3" } = t, r = t.apiKey && t.apiKey.trim() ? t.apiKey.trim() : b;
    if (!e) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const o = (n || "audio/mp3").split(";")[0].trim().toLowerCase(), g = o.includes("webm") ? "audio/webm" : o.includes("wav") ? "audio/wav" : o.includes("ogg") ? "audio/ogg" : o.includes("mp4") || o.includes("m4a") || o.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (r && r.trim()) {
      const u = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
        const m = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${r.trim()}`);
        if (m.ok) {
          const v = await m.json();
          if (Array.isArray(v.models)) {
            const w = v.models.filter((k) => {
              var x;
              return (x = k.supportedGenerationMethods) == null ? void 0 : x.includes("generateContent");
            }).map((k) => k.name.replace(/^models\//, ""));
            w.length > 0 && (f = w.sort((k, x) => k.includes("2.0-flash") ? -1 : x.includes("2.0-flash") ? 1 : k.includes("flash") ? -1 : x.includes("flash") ? 1 : 0));
          }
        } else {
          const v = await m.json().catch(() => ({}));
          if ((l = v == null ? void 0 : v.error) != null && l.message)
            return { error: `Gemini API Key lỗi: ${v.error.message}` };
        }
      } catch (m) {
        console.warn("Auto-discover Gemini models warning:", m);
      }
      let A = "";
      for (const m of f)
        try {
          const v = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${r.trim()}`, w = await fetch(v, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: g,
                        data: e
                      }
                    },
                    { text: u }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1
              }
            })
          });
          if (w.ok) {
            const k = await w.json();
            let x = (d = (c = (a = (h = (i = k == null ? void 0 : k.candidates) == null ? void 0 : i[0]) == null ? void 0 : h.content) == null ? void 0 : a.parts) == null ? void 0 : c[0]) == null ? void 0 : d.text;
            if (x) {
              x = x.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const _ = JSON.parse(x);
              if (_ && _.narration)
                return {
                  narration: String(_.narration).trim(),
                  language: _.language || "vi",
                  audioDuration: Number(_.duration || 4),
                  words: Array.isArray(_.words) ? _.words : []
                };
            }
          } else {
            const k = await w.json().catch(() => ({}));
            A = ((p = k == null ? void 0 : k.error) == null ? void 0 : p.message) || `HTTP ${w.status}`;
          }
        } catch (v) {
          A = v.message;
        }
      if (A)
        return { error: `Gemini API: ${A}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), T.handle("media:search-web", async (y, t) => {
    try {
      const e = (t || "").trim();
      if (!e) return [];
      try {
        const g = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(e)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (g.ok) {
          const h = [...(await g.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((a) => decodeURIComponent(a[1])).filter((a) => a && !a.endsWith(".svg") && !a.includes("favicon"));
          if (h.length > 0)
            return h.slice(0, 20).map((a, c) => ({
              id: `bing-img-${c}-${Date.now()}`,
              type: "image",
              url: a,
              thumbnail: a,
              title: e,
              source: "web"
            }));
        }
      } catch (g) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", g);
      }
      const o = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(e)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (o) {
        const g = o[1], i = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(e)}&vqd=${g}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (i.results && i.results.length > 0)
          return i.results.slice(0, 20).map((h, a) => ({
            id: `ddg-img-${a}-${Date.now()}`,
            type: "image",
            url: h.image,
            thumbnail: h.thumbnail || h.image,
            title: h.title || e,
            source: "web"
          }));
      }
      return [];
    } catch (e) {
      return console.warn("Web image search error:", e), [];
    }
  });
  const C = /* @__PURE__ */ new Map();
  T.handle("media:search-videos", async (y, t, e = 1) => {
    try {
      const n = (t || "").trim();
      if (!n) return [];
      const r = Math.max(1, Number(e) || 1), o = `${n.toLowerCase()}_p${r}`;
      if (C.has(o))
        return C.get(o);
      const g = (c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), l = n.toLowerCase();
      let i = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(l))
        i = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(l))
        i = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(l))
        i = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(l))
        i = /cá/i.test(l) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(l))
        i = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(l))
        i = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(l))
        i = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(l))
        i = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(l))
        i = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(l))
        i = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(l))
        i = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(l))
        i = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(l))
        i = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(n)) {
        const c = n.split(/\s+/).filter(Boolean);
        i = [n, c[0] || "lifestyle", c[c.length - 1] || "cinematic"];
      } else
        i = [g(n).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const h = (r - 1) % i.length, a = [
        i[h],
        ...i.filter((c, d) => d !== h)
      ];
      for (const c of a)
        if (c)
          try {
            const d = new AbortController(), p = setTimeout(() => d.abort(), 3500), u = Math.floor((r - 1) / i.length) + 1, f = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(c)}&page=${u}&urls=true`,
              {
                signal: d.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(p), f.ok) {
              const m = (await f.json()).hits || [];
              if (m.length > 0) {
                const v = m.slice(0, 12).map((w, k) => {
                  var x, _, I, E;
                  return {
                    id: `coverr-video-${k}-${Date.now()}`,
                    type: "video",
                    url: ((x = w.urls) == null ? void 0 : x.mp4) || ((_ = w.urls) == null ? void 0 : _.mp4_preview),
                    previewUrl: ((I = w.urls) == null ? void 0 : I.mp4_preview) || ((E = w.urls) == null ? void 0 : E.mp4),
                    thumbnail: w.thumbnail || w.poster,
                    title: w.title || n,
                    source: "web",
                    duration: Math.round(Number(w.duration || 8))
                  };
                });
                return C.set(o, v), v;
              }
            }
          } catch (d) {
            console.warn(`Coverr fetch failed for keyword: ${c}`, d);
          }
      return [];
    } catch (n) {
      return console.warn("Video search error in main process:", n), [];
    }
  }), T.handle(
    "ai:gemini-generate",
    async (y, t) => {
      var e, n, r;
      try {
        const { prompt: o, cookie: g, apiKey: l } = t || {}, i = (o || "").trim();
        if (!i)
          throw new Error("Prompt is required");
        const h = (l || g || process.env.GROQ_API_KEY || "").trim();
        if (h.startsWith("gsk_") || h.length > 20)
          for (const a of ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const c = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${h}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: a,
                  messages: [
                    {
                      role: "system",
                      content: "You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses."
                    },
                    { role: "user", content: i }
                  ],
                  temperature: 0.7
                })
              });
              if (c.ok) {
                const d = await c.json(), p = (r = (n = (e = d == null ? void 0 : d.choices) == null ? void 0 : e[0]) == null ? void 0 : n.message) == null ? void 0 : r.content;
                if (p && typeof p == "string")
                  return { text: p.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: p.length };
              }
            } catch (c) {
              console.warn("Groq model failed in Electron main:", a, c);
            }
        return { text: "", rawLength: 0 };
      } catch (o) {
        throw console.error("Electron AI Generate error:", o), o;
      }
    }
  ), T.handle("app:restart", () => {
    N.relaunch(), N.exit(0);
  }), T.handle("app:reload", () => {
    s == null || s.webContents.reload();
  });
}
