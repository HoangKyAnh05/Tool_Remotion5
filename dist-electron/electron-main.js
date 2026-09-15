import { app as S, BrowserWindow as q, ipcMain as M, shell as W, dialog as P, session as B } from "electron";
import C from "path";
import { fileURLToPath as D } from "url";
import V from "https";
import L from "http";
import N from "fs";
import { Communicate as j } from "edge-tts-universal";
import { bundle as F } from "@remotion/bundler";
import { selectComposition as H, renderMedia as G } from "@remotion/renderer";
const z = D(import.meta.url), R = C.dirname(z);
process.env.DIST = C.join(R, "../dist");
process.env.VITE_PUBLIC = S.isPackaged ? process.env.DIST : C.join(process.env.DIST, "../public");
let i, E = null;
const K = process.env.VITE_DEV_SERVER_URL;
function U() {
  i = new q({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: C.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: N.existsSync(C.join(R, "preload.cjs")) ? C.join(R, "preload.cjs") : C.join(R, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), B.defaultSession.setPermissionRequestHandler((y, _, v) => {
    v(!0);
  }), i.show(), i.focus(), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), K ? i.loadURL(K) : i.loadFile(C.join(process.env.DIST || "", "index.html"));
}
S.on("window-all-closed", () => {
  process.platform !== "darwin" && (S.quit(), i = null);
});
S.on("activate", () => {
  q.getAllWindows().length === 0 && U();
});
S.whenReady().then(() => {
  U(), Q();
});
function O(y) {
  return new Promise((_, v) => {
    (y.startsWith("https") ? V : L).get(
      y,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (e) => {
        if (e.statusCode && e.statusCode >= 400)
          return v(new Error(`HTTP error ${e.statusCode}`));
        const n = [];
        e.on("data", (o) => n.push(Buffer.isBuffer(o) ? o : Buffer.from(o))), e.on("end", () => _(Buffer.concat(n)));
      }
    ).on("error", v);
  });
}
async function Y(y, _) {
  try {
    const t = y.trim().split(/\s+/).filter(Boolean), n = !_.startsWith("en-") ? "vi" : "en", o = [];
    let r = "";
    for (const a of t)
      (r + " " + a).length > 80 ? (o.push(r.trim()), r = a) : r += " " + a;
    r.trim() && o.push(r.trim());
    const g = [];
    for (const a of o) {
      const u = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        a
      )}&tl=${n}&client=tw-ob`, w = await O(u);
      g.push(w);
    }
    const c = Buffer.concat(g), p = `data:audio/mp3;base64,${c.toString("base64")}`, l = Math.max(3, c.length / 3800), h = [], d = (l - 0.4) / Math.max(t.length, 1);
    let f = 0.2;
    for (const a of t) {
      const u = Math.max(0.2, Math.min(0.7, d));
      h.push({
        word: a,
        start: Number(f.toFixed(2)),
        end: Number((f + u).toFixed(2))
      }), f += u;
    }
    return {
      audioUrl: p,
      duration: Number((f + 0.3).toFixed(2)),
      words: h
    };
  } catch {
    const t = y.trim().split(/\s+/).filter(Boolean), e = t.map((n, o) => ({
      word: n,
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
function J(y = "vi-VN-HoaiMyNeural", _ = "+0%", v = "+0Hz") {
  let t = y || "vi-VN-HoaiMyNeural", e = _ || "+0%", n = "+0Hz";
  if (y === "adam" || y === "adam-tiktok" || y === "vclip:adam")
    return { effectiveVoice: "vi-VN-NamMinhNeural", effectiveRate: "+18%", effectivePitch: "+0Hz" };
  if (y && y.includes(":") && !y.startsWith("elevenlabs:")) {
    const [o, r] = y.split(":");
    switch (t = o, r) {
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
  M.handle(
    "tts:synthesize",
    async (v, { text: t, voice: e = "vi-VN-HoaiMyNeural", rate: n = "+0%", pitch: o = "+0Hz" }) => {
      try {
        const r = t.trim();
        if (!r)
          return { audioUrl: "", duration: 1, words: [] };
        const { effectiveVoice: g, effectiveRate: c, effectivePitch: s } = J(e, n, o), p = new j(r, {
          voice: g,
          rate: c,
          pitch: s
        }), l = [], h = [];
        for await (const w of p.stream()) {
          const m = w;
          if (m.type === "audio" && m.data)
            h.push(Buffer.isBuffer(m.data) ? m.data : Buffer.from(m.data));
          else if (m.type === "WordBoundary" && m.text) {
            const k = Number(((m.offset || 0) / 1e7).toFixed(2)), b = Number(((m.duration || 0) / 1e7).toFixed(2));
            l.push({
              word: String(m.text),
              start: k,
              end: Number((k + b).toFixed(2))
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
      } catch (r) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (r == null ? void 0 : r.message) || r), Y(t, e);
      }
    }
  ), M.handle("render:video", async (v, { project: t, resolution: e = "1080p" }) => {
    try {
      const n = C.resolve("out");
      N.existsSync(n) || N.mkdirSync(n, { recursive: !0 });
      const r = `${(t.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, g = C.join(n, r);
      i == null || i.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const c = C.resolve("src/remotion/index.ts");
      E = await F({
        entryPoint: c,
        onProgress: (a) => {
          i == null || i.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + a * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${a}%)...`
          });
        }
      }), i == null || i.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const s = t.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", p = await H({
        serveUrl: E,
        id: s,
        inputProps: { project: t }
      }), l = t.fps || 30, h = Math.max(
        (t.scenes || []).reduce(
          (a, u) => a + Math.max(Math.round((u.audioDuration || 4) * l), Math.round(2 * l)),
          0
        ),
        30
      );
      let d = t.aspectRatio === "9:16" ? 1080 : 1920, f = t.aspectRatio === "9:16" ? 1920 : 1080;
      return e === "4k" && (d = t.aspectRatio === "9:16" ? 2160 : 3840, f = t.aspectRatio === "9:16" ? 3840 : 2160), i == null || i.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${h} khung hình (${d}x${f})...`
      }), await G({
        composition: {
          ...p,
          durationInFrames: h,
          width: d,
          height: f,
          fps: l
        },
        serveUrl: E,
        codec: "h264",
        outputLocation: g,
        inputProps: { project: t },
        onProgress: ({ progress: a }) => {
          const u = Math.min(99, Math.round(32 + a * 66));
          i == null || i.webContents.send("render:progress", {
            progress: u,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(a * 100)}%)...`
          });
        }
      }), i == null || i.webContents.send("render:progress", {
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
  }), M.handle("shell:open-path", async (v, t) => W.openPath(t)), M.handle("dialog:select-file", async (v, t) => i ? (await P.showOpenDialog(i, t)).filePaths : null), M.handle("dialog:select-folder", async () => i && (await P.showOpenDialog(i, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), M.handle("audio:read-file-base64", async (v, t) => {
    try {
      if (!t || !N.existsSync(t)) return null;
      const e = await N.promises.readFile(t), n = C.extname(t).toLowerCase().replace(".", "");
      let o = "audio/mp3";
      n === "wav" ? o = "audio/wav" : n === "m4a" ? o = "audio/m4a" : n === "aac" ? o = "audio/aac" : n === "ogg" ? o = "audio/ogg" : n === "mp4" ? o = "video/mp4" : n === "mov" ? o = "video/quicktime" : n === "webm" ? o = "video/webm" : n === "mkv" && (o = "video/x-matroska");
      const r = e.toString("base64");
      return {
        dataUrl: `data:${o};base64,${r}`,
        base64: r,
        mimeType: o,
        sizeBytes: e.length
      };
    } catch (e) {
      return console.error("Error reading audio/video file base64:", e), null;
    }
  });
  const y = process.env.GEMINI_API_KEY || "";
  M.handle("audio:transcribe", async (v, t) => {
    var c, s, p, l, h, d, f;
    const { audioBase64: e, mimeType: n = "audio/mp3" } = t, o = t.apiKey && t.apiKey.trim() ? t.apiKey.trim() : y;
    if (!e) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const r = (n || "audio/mp3").split(";")[0].trim().toLowerCase(), g = r.includes("webm") ? "audio/webm" : r.includes("wav") ? "audio/wav" : r.includes("ogg") ? "audio/ogg" : r.includes("mp4") || r.includes("m4a") || r.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (o && o.trim()) {
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
        const m = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${o.trim()}`);
        if (m.ok) {
          const k = await m.json();
          if (Array.isArray(k.models)) {
            const b = k.models.filter((x) => {
              var T;
              return (T = x.supportedGenerationMethods) == null ? void 0 : T.includes("generateContent");
            }).map((x) => x.name.replace(/^models\//, ""));
            b.length > 0 && (u = b.sort((x, T) => x.includes("2.0-flash") ? -1 : T.includes("2.0-flash") ? 1 : x.includes("flash") ? -1 : T.includes("flash") ? 1 : 0));
          }
        } else {
          const k = await m.json().catch(() => ({}));
          if ((c = k == null ? void 0 : k.error) != null && c.message)
            return { error: `Gemini API Key lỗi: ${k.error.message}` };
        }
      } catch (m) {
        console.warn("Auto-discover Gemini models warning:", m);
      }
      let w = "";
      for (const m of u)
        try {
          const k = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${o.trim()}`, b = await fetch(k, {
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
          if (b.ok) {
            const x = await b.json();
            let T = (d = (h = (l = (p = (s = x == null ? void 0 : x.candidates) == null ? void 0 : s[0]) == null ? void 0 : p.content) == null ? void 0 : l.parts) == null ? void 0 : h[0]) == null ? void 0 : d.text;
            if (T) {
              T = T.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const A = JSON.parse(T);
              if (A && A.narration)
                return {
                  narration: String(A.narration).trim(),
                  language: A.language || "vi",
                  audioDuration: Number(A.duration || 4),
                  words: Array.isArray(A.words) ? A.words : []
                };
            }
          } else {
            const x = await b.json().catch(() => ({}));
            w = ((f = x == null ? void 0 : x.error) == null ? void 0 : f.message) || `HTTP ${b.status}`;
          }
        } catch (k) {
          w = k.message;
        }
      if (w)
        return { error: `Gemini API: ${w}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), M.handle("media:search-web", async (v, t) => {
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
          const p = [...(await g.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((l) => decodeURIComponent(l[1])).filter((l) => l && !l.endsWith(".svg") && !l.includes("favicon"));
          if (p.length > 0)
            return p.slice(0, 20).map((l, h) => ({
              id: `bing-img-${h}-${Date.now()}`,
              type: "image",
              url: l,
              thumbnail: l,
              title: e,
              source: "web"
            }));
        }
      } catch (g) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", g);
      }
      const r = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(e)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (r) {
        const g = r[1], s = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(e)}&vqd=${g}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (s.results && s.results.length > 0)
          return s.results.slice(0, 20).map((p, l) => ({
            id: `ddg-img-${l}-${Date.now()}`,
            type: "image",
            url: p.image,
            thumbnail: p.thumbnail || p.image,
            title: p.title || e,
            source: "web"
          }));
      }
      return [];
    } catch (e) {
      return console.warn("Web image search error:", e), [];
    }
  });
  const _ = /* @__PURE__ */ new Map();
  M.handle("media:search-videos", async (v, t, e = 1) => {
    try {
      const n = (t || "").trim();
      if (!n) return [];
      const o = Math.max(1, Number(e) || 1), r = `${n.toLowerCase()}_p${o}`;
      if (_.has(r))
        return _.get(r);
      const g = (h) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), c = n.toLowerCase();
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
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(n)) {
        const h = n.split(/\s+/).filter(Boolean);
        s = [n, h[0] || "lifestyle", h[h.length - 1] || "cinematic"];
      } else
        s = [g(n).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const p = (o - 1) % s.length, l = [
        s[p],
        ...s.filter((h, d) => d !== p)
      ];
      for (const h of l)
        if (h)
          try {
            const d = new AbortController(), f = setTimeout(() => d.abort(), 3500), a = Math.floor((o - 1) / s.length) + 1, u = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(h)}&page=${a}&urls=true`,
              {
                signal: d.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(f), u.ok) {
              const m = (await u.json()).hits || [];
              if (m.length > 0) {
                const k = m.slice(0, 12).map((b, x) => {
                  var T, A, $, I;
                  return {
                    id: `coverr-video-${x}-${Date.now()}`,
                    type: "video",
                    url: ((T = b.urls) == null ? void 0 : T.mp4) || ((A = b.urls) == null ? void 0 : A.mp4_preview),
                    previewUrl: (($ = b.urls) == null ? void 0 : $.mp4_preview) || ((I = b.urls) == null ? void 0 : I.mp4),
                    thumbnail: b.thumbnail || b.poster,
                    title: b.title || n,
                    source: "web",
                    duration: Math.round(Number(b.duration || 8))
                  };
                });
                return _.set(r, k), k;
              }
            }
          } catch (d) {
            console.warn(`Coverr fetch failed for keyword: ${h}`, d);
          }
      return [];
    } catch (n) {
      return console.warn("Video search error in main process:", n), [];
    }
  }), M.handle(
    "ai:gemini-generate",
    async (v, t) => {
      var e, n, o, r, g, c;
      try {
        const { prompt: s, cookie: p, apiKey: l } = t || {}, h = (s || "").trim();
        if (!h)
          throw new Error("Prompt is required");
        const d = (l || p || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (d.startsWith("sk-") || d.length > 20)
          for (const f of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const a = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${d}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: f,
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
                const u = await a.json(), w = (o = (n = (e = u == null ? void 0 : u.choices) == null ? void 0 : e[0]) == null ? void 0 : n.message) == null ? void 0 : o.content;
                if (w && typeof w == "string")
                  return { text: w.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: w.length };
              }
            } catch (a) {
              console.warn("DeepSeek model failed in Electron main:", f, a);
            }
        if (d.startsWith("gsk_") || d.length > 20)
          for (const f of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const a = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${d}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  model: f,
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
                const u = await a.json(), w = (c = (g = (r = u == null ? void 0 : u.choices) == null ? void 0 : r[0]) == null ? void 0 : g.message) == null ? void 0 : c.content;
                if (w && typeof w == "string")
                  return { text: w.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: w.length };
              }
            } catch (a) {
              console.warn("Groq model failed in Electron main:", f, a);
            }
        return { text: "", rawLength: 0 };
      } catch (s) {
        throw console.error("Electron AI Generate error:", s), s;
      }
    }
  ), M.handle("app:restart", () => {
    S.relaunch(), S.exit(0);
  }), M.handle("app:reload", () => {
    i == null || i.webContents.reload();
  });
}
