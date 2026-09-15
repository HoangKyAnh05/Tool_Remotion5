import { app as A, BrowserWindow as U, ipcMain as S, shell as K, dialog as P, session as q } from "electron";
import C from "path";
import { fileURLToPath as D } from "url";
import V from "https";
import L from "http";
import N from "fs";
import { Communicate as F } from "edge-tts-universal";
import { bundle as j } from "@remotion/bundler";
import { selectComposition as G, renderMedia as z } from "@remotion/renderer";
const H = D(import.meta.url), E = C.dirname(H);
process.env.DIST = C.join(E, "../dist");
process.env.VITE_PUBLIC = A.isPackaged ? process.env.DIST : C.join(process.env.DIST, "../public");
let i, R = null;
const B = process.env.VITE_DEV_SERVER_URL;
function W() {
  i = new U({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: C.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: N.existsSync(C.join(E, "preload.cjs")) ? C.join(E, "preload.cjs") : C.join(E, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), q.defaultSession.setPermissionRequestHandler((y, T, f) => {
    f(!0);
  }), i.show(), i.focus(), i.webContents.on("did-finish-load", () => {
    i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), B ? i.loadURL(B) : i.loadFile(C.join(process.env.DIST || "", "index.html"));
}
A.on("window-all-closed", () => {
  process.platform !== "darwin" && (A.quit(), i = null);
});
A.on("activate", () => {
  U.getAllWindows().length === 0 && W();
});
A.whenReady().then(() => {
  W(), Z();
});
function O(y) {
  return new Promise((T, f) => {
    (y.startsWith("https") ? V : L).get(
      y,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/"
        }
      },
      (t) => {
        if (t.statusCode && t.statusCode >= 400)
          return f(new Error(`HTTP error ${t.statusCode}`));
        const n = [];
        t.on("data", (r) => n.push(Buffer.isBuffer(r) ? r : Buffer.from(r))), t.on("end", () => T(Buffer.concat(n)));
      }
    ).on("error", f);
  });
}
async function Y(y, T) {
  try {
    const e = y.trim().split(/\s+/).filter(Boolean), n = !T.startsWith("en-") ? "vi" : "en", r = [];
    let o = "";
    for (const h of e)
      (o + " " + h).length > 80 ? (r.push(o.trim()), o = h) : o += " " + h;
    o.trim() && r.push(o.trim());
    const g = [];
    for (const h of r) {
      const m = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        h
      )}&tl=${n}&client=tw-ob`, w = await O(m);
      g.push(w);
    }
    const a = Buffer.concat(g), d = `data:audio/mp3;base64,${a.toString("base64")}`, l = Math.max(3, a.length / 3800), c = [], u = (l - 0.4) / Math.max(e.length, 1);
    let b = 0.2;
    for (const h of e) {
      const m = Math.max(0.2, Math.min(0.7, u));
      c.push({
        word: h,
        start: Number(b.toFixed(2)),
        end: Number((b + m).toFixed(2))
      }), b += m;
    }
    return {
      audioUrl: d,
      duration: Number((b + 0.3).toFixed(2)),
      words: c
    };
  } catch {
    const e = y.trim().split(/\s+/).filter(Boolean), t = e.map((n, r) => ({
      word: n,
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
function J(y = "vi-VN-HoaiMyNeural", T = "+0%", f = "+0Hz") {
  let e = y || "vi-VN-HoaiMyNeural", t = T || "+0%", n = "+0Hz";
  if (y === "adam" || y === "adam-tiktok" || y === "vclip:adam")
    return { effectiveVoice: "vi-VN-NamMinhNeural", effectiveRate: "+18%", effectivePitch: "+0Hz" };
  if (y && y.includes(":") && !y.startsWith("elevenlabs:")) {
    const [r, o] = y.split(":");
    switch (e = r, o) {
      case "adam":
      case "fast":
        t = "+18%";
        break;
      case "recap":
        t = "+25%";
        break;
      case "live":
        t = "+18%";
        break;
      case "sweet":
        t = "+8%";
        break;
      case "genz":
        t = "+22%";
        break;
      case "story":
        t = "-8%";
        break;
      case "deep":
        t = "-4%";
        break;
      case "asmr":
        t = "-3%";
        break;
      case "meme":
        t = "+12%";
        break;
    }
  }
  return { effectiveVoice: e, effectiveRate: t, effectivePitch: n };
}
async function Q(y) {
  const T = y.split(/\s+/).filter(Boolean);
  if (!T.length) return { audioUrl: "", duration: 2, words: [] };
  const f = [];
  let e = "";
  for (const d of T)
    (e + " " + d).length > 180 ? (f.push(e.trim()), e = d) : e = e ? e + " " + d : d;
  e && f.push(e.trim());
  const t = [];
  for (const d of f) {
    const l = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(d)}&tl=vi&client=tw-ob`, c = await fetch(l, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    if (!c.ok) throw new Error(`Google TTS request error: ${c.status}`);
    const u = await c.arrayBuffer();
    t.push(Buffer.from(u));
  }
  const r = `data:audio/mp3;base64,${Buffer.concat(t).toString("base64")}`, o = 0.35, g = [];
  let a = 0.12;
  for (const d of T)
    g.push({
      word: d,
      start: Number(a.toFixed(2)),
      end: Number((a + o).toFixed(2))
    }), a += o;
  const s = Number((a + 0.35).toFixed(2));
  return { audioUrl: r, duration: Math.max(2, s), words: g };
}
function Z() {
  S.handle(
    "tts:synthesize",
    async (f, { text: e, voice: t = "google-vi", rate: n = "+0%", pitch: r = "+0Hz" }) => {
      try {
        const o = e.trim();
        if (!o)
          return { audioUrl: "", duration: 1, words: [] };
        if (t === "google-vi" || t.startsWith("google") || t.startsWith("vi-"))
          try {
            return await Q(o);
          } catch (w) {
            console.warn("Google TTS failed in Electron, falling back to edge-tts:", w);
          }
        const { effectiveVoice: g, effectiveRate: a, effectivePitch: s } = J(t, n, r), d = new F(o, {
          voice: g,
          rate: a,
          pitch: s
        }), l = [], c = [];
        for await (const w of d.stream()) {
          const p = w;
          if (p.type === "audio" && p.data)
            c.push(Buffer.isBuffer(p.data) ? p.data : Buffer.from(p.data));
          else if (p.type === "WordBoundary" && p.text) {
            const k = Number(((p.offset || 0) / 1e7).toFixed(2)), v = Number(((p.duration || 0) / 1e7).toFixed(2));
            l.push({
              word: String(p.text),
              start: k,
              end: Number((k + v).toFixed(2))
            });
          }
        }
        const u = Buffer.concat(c);
        if (u.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const h = `data:audio/mp3;base64,${u.toString("base64")}`;
        let m = 3;
        return l.length > 0 ? m = Number((l[l.length - 1].end + 0.3).toFixed(2)) : m = Number(Math.max(2.5, u.length / 5500).toFixed(2)), {
          audioUrl: h,
          duration: m,
          words: l
        };
      } catch (o) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (o == null ? void 0 : o.message) || o), Y(e, t);
      }
    }
  ), S.handle("render:video", async (f, { project: e, resolution: t = "1080p" }) => {
    try {
      const n = C.resolve("out");
      N.existsSync(n) || N.mkdirSync(n, { recursive: !0 });
      const o = `${(e.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, g = C.join(n, o);
      i == null || i.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const a = C.resolve("src/remotion/index.ts");
      R = await j({
        entryPoint: a,
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
      const s = e.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", d = await G({
        serveUrl: R,
        id: s,
        inputProps: { project: e }
      }), l = e.fps || 30, c = Math.max(
        (e.scenes || []).reduce(
          (h, m) => h + Math.max(Math.round((m.audioDuration || 4) * l), Math.round(2 * l)),
          0
        ),
        30
      );
      let u = e.aspectRatio === "9:16" ? 1080 : 1920, b = e.aspectRatio === "9:16" ? 1920 : 1080;
      return t === "4k" && (u = e.aspectRatio === "9:16" ? 2160 : 3840, b = e.aspectRatio === "9:16" ? 3840 : 2160), i == null || i.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${c} khung hình (${u}x${b})...`
      }), await z({
        composition: {
          ...d,
          durationInFrames: c,
          width: u,
          height: b,
          fps: l
        },
        serveUrl: R,
        codec: "h264",
        outputLocation: g,
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
        filePath: g
      };
    } catch (n) {
      throw console.error("Render media error in main process:", n), new Error(n.message || "Render video thất bại");
    }
  }), S.handle("shell:open-path", async (f, e) => K.openPath(e)), S.handle("dialog:select-file", async (f, e) => i ? (await P.showOpenDialog(i, e)).filePaths : null), S.handle("dialog:select-folder", async () => i && (await P.showOpenDialog(i, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), S.handle("audio:read-file-base64", async (f, e) => {
    try {
      if (!e || !N.existsSync(e)) return null;
      const t = await N.promises.readFile(e), n = C.extname(e).toLowerCase().replace(".", "");
      let r = "audio/mp3";
      n === "wav" ? r = "audio/wav" : n === "m4a" ? r = "audio/m4a" : n === "aac" ? r = "audio/aac" : n === "ogg" ? r = "audio/ogg" : n === "mp4" ? r = "video/mp4" : n === "mov" ? r = "video/quicktime" : n === "webm" ? r = "video/webm" : n === "mkv" && (r = "video/x-matroska");
      const o = t.toString("base64");
      return {
        dataUrl: `data:${r};base64,${o}`,
        base64: o,
        mimeType: r,
        sizeBytes: t.length
      };
    } catch (t) {
      return console.error("Error reading audio/video file base64:", t), null;
    }
  });
  const y = process.env.GEMINI_API_KEY || "";
  S.handle("audio:transcribe", async (f, e) => {
    var a, s, d, l, c, u, b;
    const { audioBase64: t, mimeType: n = "audio/mp3" } = e, r = e.apiKey && e.apiKey.trim() ? e.apiKey.trim() : y;
    if (!t) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const o = (n || "audio/mp3").split(";")[0].trim().toLowerCase(), g = o.includes("webm") ? "audio/webm" : o.includes("wav") ? "audio/wav" : o.includes("ogg") ? "audio/ogg" : o.includes("mp4") || o.includes("m4a") || o.includes("aac") ? "audio/mp4" : "audio/mp3";
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
        const p = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${r.trim()}`);
        if (p.ok) {
          const k = await p.json();
          if (Array.isArray(k.models)) {
            const v = k.models.filter((x) => {
              var M;
              return (M = x.supportedGenerationMethods) == null ? void 0 : M.includes("generateContent");
            }).map((x) => x.name.replace(/^models\//, ""));
            v.length > 0 && (m = v.sort((x, M) => x.includes("2.0-flash") ? -1 : M.includes("2.0-flash") ? 1 : x.includes("flash") ? -1 : M.includes("flash") ? 1 : 0));
          }
        } else {
          const k = await p.json().catch(() => ({}));
          if ((a = k == null ? void 0 : k.error) != null && a.message)
            return { error: `Gemini API Key lỗi: ${k.error.message}` };
        }
      } catch (p) {
        console.warn("Auto-discover Gemini models warning:", p);
      }
      let w = "";
      for (const p of m)
        try {
          const k = `https://generativelanguage.googleapis.com/v1beta/models/${p}:generateContent?key=${r.trim()}`, v = await fetch(k, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: g,
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
          if (v.ok) {
            const x = await v.json();
            let M = (u = (c = (l = (d = (s = x == null ? void 0 : x.candidates) == null ? void 0 : s[0]) == null ? void 0 : d.content) == null ? void 0 : l.parts) == null ? void 0 : c[0]) == null ? void 0 : u.text;
            if (M) {
              M = M.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const _ = JSON.parse(M);
              if (_ && _.narration)
                return {
                  narration: String(_.narration).trim(),
                  language: _.language || "vi",
                  audioDuration: Number(_.duration || 4),
                  words: Array.isArray(_.words) ? _.words : []
                };
            }
          } else {
            const x = await v.json().catch(() => ({}));
            w = ((b = x == null ? void 0 : x.error) == null ? void 0 : b.message) || `HTTP ${v.status}`;
          }
        } catch (k) {
          w = k.message;
        }
      if (w)
        return { error: `Gemini API: ${w}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), S.handle("media:search-web", async (f, e) => {
    try {
      const t = (e || "").trim();
      if (!t) return [];
      try {
        const g = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(t)}&count=25&first=0`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
            }
          }
        );
        if (g.ok) {
          const d = [...(await g.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((l) => decodeURIComponent(l[1])).filter((l) => l && !l.endsWith(".svg") && !l.includes("favicon"));
          if (d.length > 0)
            return d.slice(0, 20).map((l, c) => ({
              id: `bing-img-${c}-${Date.now()}`,
              type: "image",
              url: l,
              thumbnail: l,
              title: t,
              source: "web"
            }));
        }
      } catch (g) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", g);
      }
      const o = (await (await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(t)}&iax=images&ia=images`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      )).text()).match(/vqd=([\d-]+)/);
      if (o) {
        const g = o[1], s = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(t)}&vqd=${g}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (s.results && s.results.length > 0)
          return s.results.slice(0, 20).map((d, l) => ({
            id: `ddg-img-${l}-${Date.now()}`,
            type: "image",
            url: d.image,
            thumbnail: d.thumbnail || d.image,
            title: d.title || t,
            source: "web"
          }));
      }
      return [];
    } catch (t) {
      return console.warn("Web image search error:", t), [];
    }
  });
  const T = /* @__PURE__ */ new Map();
  S.handle("media:search-videos", async (f, e, t = 1) => {
    try {
      const n = (e || "").trim();
      if (!n) return [];
      const r = Math.max(1, Number(t) || 1), o = `${n.toLowerCase()}_p${r}`;
      if (T.has(o))
        return T.get(o);
      const g = (c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), a = n.toLowerCase();
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
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(n)) {
        const c = n.split(/\s+/).filter(Boolean);
        s = [n, c[0] || "lifestyle", c[c.length - 1] || "cinematic"];
      } else
        s = [g(n).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const d = (r - 1) % s.length, l = [
        s[d],
        ...s.filter((c, u) => u !== d)
      ];
      for (const c of l)
        if (c)
          try {
            const u = new AbortController(), b = setTimeout(() => u.abort(), 3500), h = Math.floor((r - 1) / s.length) + 1, m = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(c)}&page=${h}&urls=true`,
              {
                signal: u.signal,
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
                }
              }
            );
            if (clearTimeout(b), m.ok) {
              const p = (await m.json()).hits || [];
              if (p.length > 0) {
                const k = p.slice(0, 12).map((v, x) => {
                  var M, _, $, I;
                  return {
                    id: `coverr-video-${x}-${Date.now()}`,
                    type: "video",
                    url: ((M = v.urls) == null ? void 0 : M.mp4) || ((_ = v.urls) == null ? void 0 : _.mp4_preview),
                    previewUrl: (($ = v.urls) == null ? void 0 : $.mp4_preview) || ((I = v.urls) == null ? void 0 : I.mp4),
                    thumbnail: v.thumbnail || v.poster,
                    title: v.title || n,
                    source: "web",
                    duration: Math.round(Number(v.duration || 8))
                  };
                });
                return T.set(o, k), k;
              }
            }
          } catch (u) {
            console.warn(`Coverr fetch failed for keyword: ${c}`, u);
          }
      return [];
    } catch (n) {
      return console.warn("Video search error in main process:", n), [];
    }
  }), S.handle(
    "ai:gemini-generate",
    async (f, e) => {
      var t, n, r, o, g, a;
      try {
        const { prompt: s, cookie: d, apiKey: l } = e || {}, c = (s || "").trim();
        if (!c)
          throw new Error("Prompt is required");
        const u = (l || d || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
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
                    { role: "user", content: c }
                  ],
                  temperature: 0.7
                })
              });
              if (h.ok) {
                const m = await h.json(), w = (r = (n = (t = m == null ? void 0 : m.choices) == null ? void 0 : t[0]) == null ? void 0 : n.message) == null ? void 0 : r.content;
                if (w && typeof w == "string")
                  return { text: w.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: w.length };
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
                    { role: "user", content: c }
                  ],
                  temperature: 0.7
                })
              });
              if (h.ok) {
                const m = await h.json(), w = (a = (g = (o = m == null ? void 0 : m.choices) == null ? void 0 : o[0]) == null ? void 0 : g.message) == null ? void 0 : a.content;
                if (w && typeof w == "string")
                  return { text: w.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: w.length };
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
    A.relaunch(), A.exit(0);
  }), S.handle("app:reload", () => {
    i == null || i.webContents.reload();
  });
}
