import { app as $, BrowserWindow as W, ipcMain as M, shell as q, dialog as I, session as B } from "electron";
import T from "path";
import { spawn as U } from "child_process";
import { fileURLToPath as L } from "url";
import D from "https";
import F from "http";
import E from "fs";
import { Communicate as j } from "edge-tts-universal";
import { bundle as z } from "@remotion/bundler";
import { selectComposition as H, renderMedia as O } from "@remotion/renderer";
const G = L(import.meta.url), C = T.dirname(G);
process.env.DIST = T.join(C, "../dist");
process.env.VITE_PUBLIC = $.isPackaged ? process.env.DIST : T.join(process.env.DIST, "../public");
let c, A = null;
const K = process.env.VITE_DEV_SERVER_URL;
function V() {
  c = new W({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: !0,
    title: "Remotion AI Video Auto-Editor",
    icon: T.join(process.env.VITE_PUBLIC || "", "icon.png"),
    backgroundColor: "#0B0F19",
    webPreferences: {
      preload: E.existsSync(T.join(C, "preload.cjs")) ? T.join(C, "preload.cjs") : T.join(C, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1
      // Allow loading local files and media preview
    }
  }), B.defaultSession.setPermissionRequestHandler((p, b, m) => {
    m(!0);
  }), c.show(), c.focus(), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), K ? c.loadURL(K) : c.loadFile(T.join(process.env.DIST || "", "index.html"));
}
$.on("window-all-closed", () => {
  process.platform !== "darwin" && ($.quit(), c = null);
});
$.on("activate", () => {
  W.getAllWindows().length === 0 && V();
});
$.whenReady().then(() => {
  V(), te();
});
function J(p) {
  return new Promise((b, m) => {
    (p.startsWith("https") ? D : F).get(
      p,
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
        e.on("data", (o) => r.push(Buffer.isBuffer(o) ? o : Buffer.from(o))), e.on("end", () => b(Buffer.concat(r)));
      }
    ).on("error", m);
  });
}
async function Y(p, b) {
  try {
    const t = p.trim().split(/\s+/).filter(Boolean), r = !b.startsWith("en-") ? "vi" : "en", o = [];
    let n = "";
    for (const d of t)
      (n + " " + d).length > 80 ? (o.push(n.trim()), n = d) : n += " " + d;
    n.trim() && o.push(n.trim());
    const g = [];
    for (const d of o) {
      const w = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        d
      )}&tl=${r}&client=tw-ob`, u = await J(w);
      g.push(u);
    }
    const a = Buffer.concat(g), l = `data:audio/mp3;base64,${a.toString("base64")}`, s = Math.max(3, a.length / 3800), h = [], f = (s - 0.4) / Math.max(t.length, 1);
    let v = 0.2;
    for (const d of t) {
      const w = Math.max(0.2, Math.min(0.7, f));
      h.push({
        word: d,
        start: Number(v.toFixed(2)),
        end: Number((v + w).toFixed(2))
      }), v += w;
    }
    return {
      audioUrl: l,
      duration: Number((v + 0.3).toFixed(2)),
      words: h
    };
  } catch {
    const t = p.trim().split(/\s+/).filter(Boolean), e = t.map((r, o) => ({
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
function Q(p = "+0%") {
  if (!p) return "+0%";
  const b = String(p).trim();
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
  const m = parseFloat(b);
  if (!isNaN(m) && m > 0 && m <= 3) {
    const t = Math.round((m - 1) * 100);
    return t >= 0 ? `+${t}%` : `${t}%`;
  }
  return "+0%";
}
function Z(p = "vi-VN-NamMinhNeural", b = "+0%", m = "+0Hz") {
  let t = p || "vi-VN-NamMinhNeural", e = Q(b), r = "+0Hz";
  if (p === "google-vi-male" || p === "vi-male" || p === "adam" || p === "adam-tiktok" || p === "vclip:adam")
    t = "vi-VN-NamMinhNeural";
  else if (p === "google-vi" || p === "vi-female")
    t = "vi-VN-HoaiMyNeural";
  else if (p.includes(":") && !p.startsWith("elevenlabs:")) {
    const [o, n] = p.split(":");
    t = o || "vi-VN-NamMinhNeural", e === "+0%" && (n === "fast" || n === "live" || n === "adam" ? e = "+18%" : n === "recap" ? e = "+28%" : n === "sweet" ? e = "+8%" : n === "genz" ? e = "+20%" : n === "story" ? e = "-8%" : (n === "ngochuyen" || n === "manhdung") && (e = "+0%")), n === "manhdung" && (r = "-1Hz");
  }
  return { effectiveVoice: t, effectiveRate: e, effectivePitch: r };
}
function X(p, b, m = "+0%") {
  return new Promise((t, e) => {
    const r = T.resolve(C, "../scripts/kokoro_tts_engine.py"), o = U("python", [r, "--json"], { windowsHide: !0 });
    let n = "", g = "";
    o.stdout.on("data", (l) => n += l.toString("utf-8")), o.stderr.on("data", (l) => g += l.toString("utf-8")), o.on("close", (l) => {
      if (l !== 0)
        return e(new Error(`Kokoro process exited with code ${l}: ${g}`));
      try {
        const s = JSON.parse(n);
        t(s);
      } catch (s) {
        e(new Error(`Failed to parse Kokoro JSON: ${s.message}`));
      }
    });
    let a = 1;
    if (m.includes("%")) {
      const l = parseInt(m.replace("%", ""));
      isNaN(l) || (a = Math.max(0.5, Math.min(2, 1 + l / 100)));
    }
    const i = b.toLowerCase().replace("kokoro:", "").replace("kokoro-", "").trim() || "ngoc_huyen";
    o.stdin.write(JSON.stringify({ text: p, voice: i, speed: a })), o.stdin.end();
  });
}
function ee(p, b, m = "+0%") {
  return new Promise((t, e) => {
    const r = T.resolve(C, "../scripts/piper_tts_engine.py"), o = U("python", [r, "--json"], { windowsHide: !0 });
    let n = "", g = "";
    o.stdout.on("data", (s) => n += s.toString("utf-8")), o.stderr.on("data", (s) => g += s.toString("utf-8")), o.on("close", (s) => {
      if (s !== 0)
        return e(new Error(`Piper process exited with code ${s}: ${g}`));
      try {
        const h = JSON.parse(n);
        t(h);
      } catch (h) {
        e(new Error(`Failed to parse Piper JSON: ${h.message}`));
      }
    });
    let a = 1;
    if (m.includes("%")) {
      const s = parseInt(m.replace("%", ""));
      isNaN(s) || (a = Math.max(0.5, Math.min(2, 1 + s / 100)));
    }
    const i = b.toLowerCase().replace("piper:", "").trim() || "ngochuyen", l = Buffer.from(JSON.stringify({ text: p, voice: i, speed: a }), "utf-8");
    o.stdin.write(l), o.stdin.end();
  });
}
function te() {
  M.handle(
    "tts:synthesize",
    async (m, { text: t, voice: e = "vi-VN-NamMinhNeural", rate: r = "+0%", pitch: o = "+0Hz" }) => {
      try {
        const n = t.trim();
        if (!n)
          return { audioUrl: "", duration: 1, words: [] };
        if (e.startsWith("piper:") || e === "piper_ngochuyen" || e === "piper_manhdung")
          try {
            const u = await ee(n, e, r);
            if (u && u.audioUrl)
              return u;
          } catch (u) {
            console.warn("Piper VITS TTS failed, falling back to neural voice:", u);
          }
        if (e.startsWith("kokoro:") || e === "ngoc_huyen" || e === "manh_dung")
          try {
            const u = await X(n, e, r);
            if (u && u.audioUrl)
              return u;
          } catch (u) {
            console.warn("Local Kokoro TTS execution failed, falling back to Edge-TTS:", u);
          }
        const { effectiveVoice: g, effectiveRate: a, effectivePitch: i } = Z(e, r, o), l = new j(n, {
          voice: g,
          rate: a,
          pitch: i
        }), s = [], h = [];
        for await (const u of l.stream()) {
          const y = u;
          if (y.type === "audio" && y.data)
            h.push(Buffer.isBuffer(y.data) ? y.data : Buffer.from(y.data));
          else if (y.type === "WordBoundary" && y.text) {
            const x = Number(((y.offset || 0) / 1e7).toFixed(2)), k = Number(((y.duration || 0) / 1e7).toFixed(2));
            s.push({
              word: String(y.text),
              start: x,
              end: Number((x + k).toFixed(2))
            });
          }
        }
        const f = Buffer.concat(h);
        if (f.length === 0)
          throw new Error("Empty audio received from Edge-TTS");
        const d = `data:audio/mp3;base64,${f.toString("base64")}`;
        let w = 3;
        return s.length > 0 ? w = Number((s[s.length - 1].end + 0.3).toFixed(2)) : w = Number(Math.max(2.5, f.length / 5500).toFixed(2)), {
          audioUrl: d,
          duration: w,
          words: s
        };
      } catch (n) {
        return console.warn("Edge-TTS direct synthesis error, falling back:", (n == null ? void 0 : n.message) || n), Y(t, e);
      }
    }
  ), M.handle("render:video", async (m, { project: t, resolution: e = "1080p" }) => {
    try {
      const r = T.resolve("out");
      E.existsSync(r) || E.mkdirSync(r, { recursive: !0 });
      const n = `${(t.title || "Video").replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, "_").slice(0, 40)}_${Date.now()}.mp4`, g = T.join(r, n);
      c == null || c.webContents.send("render:progress", {
        progress: 5,
        stage: "bundle",
        message: "Đang chuẩn bị và đóng gói bundle Remotion..."
      });
      const a = T.resolve("src/remotion/index.ts");
      A = await z({
        entryPoint: a,
        onProgress: (d) => {
          c == null || c.webContents.send("render:progress", {
            progress: Math.min(25, Math.round(5 + d * 20 / 100)),
            stage: "bundle",
            message: `Đang biên dịch mã nguồn Remotion (${d}%)...`
          });
        }
      }), c == null || c.webContents.send("render:progress", {
        progress: 28,
        stage: "composition",
        message: "Đang thiết lập cấu hình video và phân cảnh..."
      });
      const i = t.aspectRatio === "9:16" ? "Shorts916" : "Landscape169", l = await H({
        serveUrl: A,
        id: i,
        inputProps: { project: t }
      }), s = t.fps || 30, h = Math.max(
        (t.scenes || []).reduce(
          (d, w) => d + Math.max(Math.round((w.audioDuration || 4) * s), Math.round(2 * s)),
          0
        ),
        30
      );
      let f = t.aspectRatio === "9:16" ? 1080 : 1920, v = t.aspectRatio === "9:16" ? 1920 : 1080;
      return e === "4k" && (f = t.aspectRatio === "9:16" ? 2160 : 3840, v = t.aspectRatio === "9:16" ? 3840 : 2160), c == null || c.webContents.send("render:progress", {
        progress: 32,
        stage: "rendering",
        message: `Bắt đầu render ${h} khung hình (${f}x${v})...`
      }), await O({
        composition: {
          ...l,
          durationInFrames: h,
          width: f,
          height: v,
          fps: s
        },
        serveUrl: A,
        codec: "h264",
        outputLocation: g,
        inputProps: { project: t },
        onProgress: ({ progress: d }) => {
          const w = Math.min(99, Math.round(32 + d * 66));
          c == null || c.webContents.send("render:progress", {
            progress: w,
            stage: "rendering",
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(d * 100)}%)...`
          });
        }
      }), c == null || c.webContents.send("render:progress", {
        progress: 100,
        stage: "complete",
        message: "Render video MP4 thành công!"
      }), {
        success: !0,
        filePath: g
      };
    } catch (r) {
      throw console.error("Render media error in main process:", r), new Error(r.message || "Render video thất bại");
    }
  }), M.handle("shell:open-path", async (m, t) => q.openPath(t)), M.handle("dialog:select-file", async (m, t) => c ? (await I.showOpenDialog(c, t)).filePaths : null), M.handle("dialog:select-folder", async () => c && (await I.showOpenDialog(c, {
    properties: ["openDirectory"]
  })).filePaths[0] || null), M.handle("audio:read-file-base64", async (m, t) => {
    try {
      if (!t || !E.existsSync(t)) return null;
      const e = await E.promises.readFile(t), r = T.extname(t).toLowerCase().replace(".", "");
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
  const p = process.env.GEMINI_API_KEY || "";
  M.handle("audio:transcribe", async (m, t) => {
    var a, i, l, s, h, f, v;
    const { audioBase64: e, mimeType: r = "audio/mp3" } = t, o = t.apiKey && t.apiKey.trim() ? t.apiKey.trim() : p;
    if (!e) return { error: "Không tìm thấy dữ liệu âm thanh" };
    const n = (r || "audio/mp3").split(";")[0].trim().toLowerCase(), g = n.includes("webm") ? "audio/webm" : n.includes("wav") ? "audio/wav" : n.includes("ogg") ? "audio/ogg" : n.includes("mp4") || n.includes("m4a") || n.includes("aac") ? "audio/mp4" : "audio/mp3";
    if (o && o.trim()) {
      const d = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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
        const y = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${o.trim()}`);
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
          if ((a = x == null ? void 0 : x.error) != null && a.message)
            return { error: `Gemini API Key lỗi: ${x.error.message}` };
        }
      } catch (y) {
        console.warn("Auto-discover Gemini models warning:", y);
      }
      let u = "";
      for (const y of w)
        try {
          const x = `https://generativelanguage.googleapis.com/v1beta/models/${y}:generateContent?key=${o.trim()}`, k = await fetch(x, {
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
                    { text: d }
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
            let S = (f = (h = (s = (l = (i = N == null ? void 0 : N.candidates) == null ? void 0 : i[0]) == null ? void 0 : l.content) == null ? void 0 : s.parts) == null ? void 0 : h[0]) == null ? void 0 : f.text;
            if (S) {
              S = S.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
              const _ = JSON.parse(S);
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
            u = ((v = N == null ? void 0 : N.error) == null ? void 0 : v.message) || `HTTP ${k.status}`;
          }
        } catch (x) {
          u = x.message;
        }
      if (u)
        return { error: `Gemini API: ${u}` };
    }
    return { error: "Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ." };
  }), M.handle("media:search-web", async (m, t) => {
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
          const l = [...(await g.text()).matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)].map((s) => decodeURIComponent(s[1])).filter((s) => s && !s.endsWith(".svg") && !s.includes("favicon"));
          if (l.length > 0)
            return l.slice(0, 20).map((s, h) => ({
              id: `bing-img-${h}-${Date.now()}`,
              type: "image",
              url: s,
              thumbnail: s,
              title: e,
              source: "web"
            }));
        }
      } catch (g) {
        console.warn("Bing search attempt failed, trying DuckDuckGo fallback:", g);
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
        const g = n[1], i = await (await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(e)}&vqd=${g}&f=,,,`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
              Referer: "https://duckduckgo.com/"
            }
          }
        )).json();
        if (i.results && i.results.length > 0)
          return i.results.slice(0, 20).map((l, s) => ({
            id: `ddg-img-${s}-${Date.now()}`,
            type: "image",
            url: l.image,
            thumbnail: l.thumbnail || l.image,
            title: l.title || e,
            source: "web"
          }));
      }
      return [];
    } catch (e) {
      return console.warn("Web image search error:", e), [];
    }
  });
  const b = /* @__PURE__ */ new Map();
  M.handle("media:search-videos", async (m, t, e = 1) => {
    try {
      const r = (t || "").trim();
      if (!r) return [];
      const o = Math.max(1, Number(e) || 1), n = `${r.toLowerCase()}_p${o}`;
      if (b.has(n))
        return b.get(n);
      const g = (h) => h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D"), a = r.toLowerCase();
      let i = [];
      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(a))
        i = ["school", "student", "classroom", "campus", "studying"];
      else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(a))
        i = ["shower", "bath", "swimming pool", "relaxing water"];
      else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(a))
        i = ["galaxy", "space", "nebula", "stars"];
      else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(a))
        i = /cá/i.test(a) ? ["fish cooking", "cooking", "food"] : ["cooking", "delicious food", "kitchen"];
      else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(a))
        i = ["waking up", "morning", "bed", "sunrise"];
      else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(a))
        i = ["shopping", "fashion", "store", "clothes"];
      else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(a))
        i = ["money", "finance", "business", "growth"];
      else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(a))
        i = ["technology", "coding", "artificial intelligence", "programming"];
      else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(a))
        i = ["airplane", "flight", "clouds", "travel"];
      else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(a))
        i = ["highway", "driving", "night drive", "cars"];
      else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(a))
        i = ["travel", "nature", "ocean", "landscape"];
      else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(a))
        i = ["city", "urban", "skyline", "traffic"];
      else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(a))
        i = ["fitness", "workout", "running", "gym"];
      else if (/^[a-zA-Z0-9\s\-',.]+$/.test(r)) {
        const h = r.split(/\s+/).filter(Boolean);
        i = [r, h[0] || "lifestyle", h[h.length - 1] || "cinematic"];
      } else
        i = [g(r).replace(/[^\w\s]/gi, " ").trim(), "lifestyle", "cinematic"];
      const l = (o - 1) % i.length, s = [
        i[l],
        ...i.filter((h, f) => f !== l)
      ];
      for (const h of s)
        if (h)
          try {
            const f = new AbortController(), v = setTimeout(() => f.abort(), 3500), d = Math.floor((o - 1) / i.length) + 1, w = await fetch(
              `https://coverr.co/api/videos?query=${encodeURIComponent(h)}&page=${d}&urls=true`,
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
                  var S, _, P, R;
                  return {
                    id: `coverr-video-${N}-${Date.now()}`,
                    type: "video",
                    url: ((S = k.urls) == null ? void 0 : S.mp4) || ((_ = k.urls) == null ? void 0 : _.mp4_preview),
                    previewUrl: ((P = k.urls) == null ? void 0 : P.mp4_preview) || ((R = k.urls) == null ? void 0 : R.mp4),
                    thumbnail: k.thumbnail || k.poster,
                    title: k.title || r,
                    source: "web",
                    duration: Math.round(Number(k.duration || 8))
                  };
                });
                return b.set(n, x), x;
              }
            }
          } catch (f) {
            console.warn(`Coverr fetch failed for keyword: ${h}`, f);
          }
      return [];
    } catch (r) {
      return console.warn("Video search error in main process:", r), [];
    }
  }), M.handle(
    "ai:gemini-generate",
    async (m, t) => {
      var e, r, o, n, g, a;
      try {
        const { prompt: i, cookie: l, apiKey: s } = t || {}, h = (i || "").trim();
        if (!h)
          throw new Error("Prompt is required");
        const f = (s || l || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || "").trim();
        if (f.startsWith("sk-") || f.length > 20)
          for (const v of ["deepseek-chat", "deepseek-reasoner"])
            try {
              const d = await fetch("https://api.deepseek.com/chat/completions", {
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
              if (d.ok) {
                const w = await d.json(), u = (o = (r = (e = w == null ? void 0 : w.choices) == null ? void 0 : e[0]) == null ? void 0 : r.message) == null ? void 0 : o.content;
                if (u && typeof u == "string")
                  return { text: u.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: u.length };
              }
            } catch (d) {
              console.warn("DeepSeek model failed in Electron main:", v, d);
            }
        if (f.startsWith("gsk_") || f.length > 20)
          for (const v of ["deepseek-r1-distill-llama-70b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"])
            try {
              const d = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              if (d.ok) {
                const w = await d.json(), u = (a = (g = (n = w == null ? void 0 : w.choices) == null ? void 0 : n[0]) == null ? void 0 : g.message) == null ? void 0 : a.content;
                if (u && typeof u == "string")
                  return { text: u.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, "").trim(), rawLength: u.length };
              }
            } catch (d) {
              console.warn("Groq model failed in Electron main:", v, d);
            }
        return { text: "", rawLength: 0 };
      } catch (i) {
        throw console.error("Electron AI Generate error:", i), i;
      }
    }
  ), M.handle("app:restart", () => {
    $.relaunch(), $.exit(0);
  }), M.handle("app:reload", () => {
    c == null || c.webContents.reload();
  });
}
