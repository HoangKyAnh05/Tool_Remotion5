import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import path from 'path';
// @ts-ignore
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { Communicate } from 'edge-tts-universal';
// @ts-ignore
import { bundle } from '@remotion/bundler';
// @ts-ignore
import { renderMedia, selectComposition } from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
let cachedBundleLocation: string | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    title: 'Remotion AI Video Auto-Editor',
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
    backgroundColor: '#0B0F19',
    webPreferences: {
      preload: fs.existsSync(path.join(__dirname, 'preload.cjs'))
        ? path.join(__dirname, 'preload.cjs')
        : path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading local files and media preview
    }
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  win.show();
  win.focus();

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

function fetchHttpBuffer(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = urlStr.startsWith('https') ? https : http;
    client
      .get(
        urlStr,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/'
          }
        },
        (res: any) => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP error ${res.statusCode}`));
          }
          const chunks: Buffer[] = [];
          res.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      )
      .on('error', reject);
  });
}

async function fallbackTTS(text: string, voice: string) {
  try {
    const cleanText = text.trim();
    const rawWords = cleanText.split(/\s+/).filter(Boolean);
    const isVietnamese = !voice.startsWith('en-');
    const lang = isVietnamese ? 'vi' : 'en';

    const chunks: string[] = [];
    let cur = '';
    for (const w of rawWords) {
      if ((cur + ' ' + w).length > 80) {
        chunks.push(cur.trim());
        cur = w;
      } else {
        cur += ' ' + w;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${lang}&client=tw-ob`;
      const buf = await fetchHttpBuffer(url);
      audioBuffers.push(buf);
    }

    const fullBuffer = Buffer.concat(audioBuffers);
    const base64 = fullBuffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64}`;

    const estimatedDuration = Math.max(3.0, fullBuffer.length / 3800);
    const words: Array<{ word: string; start: number; end: number }> = [];
    const timePerWord = (estimatedDuration - 0.4) / Math.max(rawWords.length, 1);

    let curTime = 0.2;
    for (const w of rawWords) {
      const wDuration = Math.max(0.2, Math.min(0.7, timePerWord));
      words.push({
        word: w,
        start: Number(curTime.toFixed(2)),
        end: Number((curTime + wDuration).toFixed(2))
      });
      curTime += wDuration;
    }

    return {
      audioUrl,
      duration: Number((curTime + 0.3).toFixed(2)),
      words
    };
  } catch (err) {
    const rawWords = text.trim().split(/\s+/).filter(Boolean);
    const words = rawWords.map((w: string, idx: number) => ({
      word: w,
      start: Number((idx * 0.35 + 0.2).toFixed(2)),
      end: Number(((idx + 1) * 0.35 + 0.2).toFixed(2))
    }));
    return {
      audioUrl: '',
      duration: Math.max(3.5, rawWords.length * 0.35 + 0.5),
      words
    };
  }
}

function normalizeRateToPercent(rate: string = '+0%'): string {
  if (!rate) return '+0%';
  const trimmed = String(rate).trim();
  if (trimmed.includes('%')) {
    const num = parseInt(trimmed.replace('%', ''));
    if (!isNaN(num)) return num >= 0 ? `+${num}%` : `${num}%`;
    return trimmed;
  }
  if (trimmed.toLowerCase().endsWith('x')) {
    const mult = parseFloat(trimmed.replace(/x/i, ''));
    if (!isNaN(mult)) {
      const pct = Math.round((mult - 1) * 100);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    }
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0 && num <= 3) {
    const pct = Math.round((num - 1) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  }
  return '+0%';
}

function parseVoicePreset(voice = 'vi-VN-NamMinhNeural', rate = '+0%', pitch = '+0Hz') {
  let effectiveVoice = voice || 'vi-VN-NamMinhNeural';
  let effectiveRate = normalizeRateToPercent(rate);
  let effectivePitch = '+0Hz';

  if (voice === 'google-vi-male' || voice === 'vi-male' || voice === 'adam' || voice === 'adam-tiktok' || voice === 'vclip:adam') {
    effectiveVoice = 'vi-VN-NamMinhNeural';
  } else if (voice === 'google-vi' || voice === 'vi-female') {
    effectiveVoice = 'vi-VN-HoaiMyNeural';
  } else if (voice.includes(':') && !voice.startsWith('elevenlabs:')) {
    const [baseVoice, modifier] = voice.split(':');
    effectiveVoice = baseVoice || 'vi-VN-NamMinhNeural';
    if (effectiveRate === '+0%') {
      if (modifier === 'fast' || modifier === 'live' || modifier === 'adam') {
        effectiveRate = '+18%';
      } else if (modifier === 'recap') {
        effectiveRate = '+28%';
      } else if (modifier === 'sweet') {
        effectiveRate = '+8%';
      } else if (modifier === 'genz') {
        effectiveRate = '+20%';
      } else if (modifier === 'story') {
        effectiveRate = '-8%';
      }
    }
  }

  return { effectiveVoice, effectiveRate, effectivePitch };
}

function setupIpcHandlers() {
  // TTS Handler: Synthesizes high quality natural speech with accurate word timing using Edge-TTS
  ipcMain.handle(
    'tts:synthesize',
    async (_, { text, voice = 'vi-VN-NamMinhNeural', rate = '+0%', pitch = '+0Hz' }) => {
      try {
        const cleanText = text.trim();
        if (!cleanText) {
          return { audioUrl: '', duration: 1.0, words: [] };
        }

        const { effectiveVoice, effectiveRate, effectivePitch } = parseVoicePreset(voice, rate, pitch);

        const comm = new Communicate(cleanText, {
          voice: effectiveVoice,
          rate: effectiveRate,
          pitch: effectivePitch
        });

        const words: Array<{ word: string; start: number; end: number }> = [];
        const audioChunks: Buffer[] = [];

        for await (const rawChunk of comm.stream()) {
          const chunk = rawChunk as any;
          if (chunk.type === 'audio' && chunk.data) {
            audioChunks.push(Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data));
          } else if (chunk.type === 'WordBoundary' && chunk.text) {
            const start = Number(((chunk.offset || 0) / 10000000).toFixed(2));
            const dur = Number(((chunk.duration || 0) / 10000000).toFixed(2));
            words.push({
              word: String(chunk.text),
              start,
              end: Number((start + dur).toFixed(2))
            });
          }
        }

        const fullBuffer = Buffer.concat(audioChunks);
        if (fullBuffer.length === 0) {
          throw new Error('Empty audio received from Edge-TTS');
        }

        const base64 = fullBuffer.toString('base64');
        const audioUrl = `data:audio/mp3;base64,${base64}`;

        let duration = 3.0;
        if (words.length > 0) {
          duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
        } else {
          duration = Number(Math.max(2.5, fullBuffer.length / 5500).toFixed(2));
        }

        return {
          audioUrl,
          duration,
          words
        };
      } catch (err: any) {
        console.warn('Edge-TTS direct synthesis error, falling back:', err?.message || err);
        return fallbackTTS(text, voice);
      }
    }
  );

  // Real Remotion Video Rendering Handler
  ipcMain.handle('render:video', async (_, { project, resolution = '1080p' }) => {
    try {
      const outDir = path.resolve('out');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      const safeTitle = (project.title || 'Video')
        .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
        .slice(0, 40);
      const outFilename = `${safeTitle}_${Date.now()}.mp4`;
      const outputLocation = path.join(outDir, outFilename);

      win?.webContents.send('render:progress', {
        progress: 5,
        stage: 'bundle',
        message: 'Đang chuẩn bị và đóng gói bundle Remotion...'
      });

      const entryPoint = path.resolve('src/remotion/index.ts');
      cachedBundleLocation = await bundle({
        entryPoint,
        onProgress: (p) => {
          win?.webContents.send('render:progress', {
            progress: Math.min(25, Math.round(5 + (p * 20) / 100)),
            stage: 'bundle',
            message: `Đang biên dịch mã nguồn Remotion (${p}%)...`
          });
        }
      });

      win?.webContents.send('render:progress', {
        progress: 28,
        stage: 'composition',
        message: 'Đang thiết lập cấu hình video và phân cảnh...'
      });

      const compositionId = project.aspectRatio === '9:16' ? 'Shorts916' : 'Landscape169';

      const composition = await selectComposition({
        serveUrl: cachedBundleLocation,
        id: compositionId,
        inputProps: { project }
      });

      // Calculate exact total frames matching Series.Sequence
      const fps = project.fps || 30;
      const durationInFrames = Math.max(
        (project.scenes || []).reduce(
          (acc: number, s: any) =>
            acc + Math.max(Math.round((s.audioDuration || 4) * fps), Math.round(2 * fps)),
          0
        ),
        30
      );

      // Width and Height according to aspect ratio and resolution
      let width = project.aspectRatio === '9:16' ? 1080 : 1920;
      let height = project.aspectRatio === '9:16' ? 1920 : 1080;

      if (resolution === '4k') {
        width = project.aspectRatio === '9:16' ? 2160 : 3840;
        height = project.aspectRatio === '9:16' ? 3840 : 2160;
      }

      win?.webContents.send('render:progress', {
        progress: 32,
        stage: 'rendering',
        message: `Bắt đầu render ${durationInFrames} khung hình (${width}x${height})...`
      });

      await renderMedia({
        composition: {
          ...composition,
          durationInFrames,
          width,
          height,
          fps
        },
        serveUrl: cachedBundleLocation,
        codec: 'h264',
        outputLocation,
        inputProps: { project },
        onProgress: ({ progress }: { progress: number }) => {
          const overallProgress = Math.min(99, Math.round(32 + progress * 66));
          win?.webContents.send('render:progress', {
            progress: overallProgress,
            stage: 'rendering',
            message: `Đang xử lý hình ảnh, phụ đề & âm thanh (${Math.round(progress * 100)}%)...`
          });
        }
      });

      win?.webContents.send('render:progress', {
        progress: 100,
        stage: 'complete',
        message: 'Render video MP4 thành công!'
      });

      return {
        success: true,
        filePath: outputLocation
      };
    } catch (renderError: any) {
      console.error('Render media error in main process:', renderError);
      throw new Error(renderError.message || 'Render video thất bại');
    }
  });

  // Open file or directory in explorer
  ipcMain.handle('shell:open-path', async (_, targetPath: string) => {
    return shell.openPath(targetPath);
  });

  // Dialog file selector
  ipcMain.handle('dialog:select-file', async (_, options) => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, options);
    return res.filePaths;
  });

  // Select output folder
  ipcMain.handle('dialog:select-folder', async () => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    return res.filePaths[0] || null;
  });

  // Read audio/video file to base64 Data URL for Speech-To-Text processing
  ipcMain.handle('audio:read-file-base64', async (_, filePath: string) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;
      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      let mimeType = 'audio/mp3';
      if (ext === 'wav') mimeType = 'audio/wav';
      else if (ext === 'm4a') mimeType = 'audio/m4a';
      else if (ext === 'aac') mimeType = 'audio/aac';
      else if (ext === 'ogg') mimeType = 'audio/ogg';
      else if (ext === 'mp4') mimeType = 'video/mp4';
      else if (ext === 'mov') mimeType = 'video/quicktime';
      else if (ext === 'webm') mimeType = 'video/webm';
      else if (ext === 'mkv') mimeType = 'video/x-matroska';

      const base64 = buffer.toString('base64');
      return {
        dataUrl: `data:${mimeType};base64,${base64}`,
        base64,
        mimeType,
        sizeBytes: buffer.length
      };
    } catch (err: any) {
      console.error('Error reading audio/video file base64:', err);
      return null;
    }
  });

  const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';

  // High-performance AI Audio-To-Text (Speech-to-Text)
  ipcMain.handle('audio:transcribe', async (_, params: { audioBase64: string; mimeType?: string; apiKey?: string }) => {
    const { audioBase64, mimeType = 'audio/mp3' } = params;
    const apiKey = (params.apiKey && params.apiKey.trim()) ? params.apiKey.trim() : DEFAULT_GEMINI_KEY;
    if (!audioBase64) return { error: 'Không tìm thấy dữ liệu âm thanh' };

    const cleanMime = (mimeType || 'audio/mp3').split(';')[0].trim().toLowerCase();
    const effectiveMime = cleanMime.includes('webm')
      ? 'audio/webm'
      : cleanMime.includes('wav')
      ? 'audio/wav'
      : cleanMime.includes('ogg')
      ? 'audio/ogg'
      : cleanMime.includes('mp4') || cleanMime.includes('m4a') || cleanMime.includes('aac')
      ? 'audio/mp4'
      : 'audio/mp3';

    if (apiKey && apiKey.trim()) {
      const prompt = `Bạn là hệ thống chuyển âm thanh thành văn bản (Speech-to-Text) và đồng bộ phụ đề Karaoke.
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

      // 1. Tự động khám phá danh sách model hợp lệ từ chính API Key của người dùng
      let targetModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-8b',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro'
      ];

      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          if (Array.isArray(listData.models)) {
            const activeServerModels = listData.models
              .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
              .map((m: any) => m.name.replace(/^models\//, ''));

            if (activeServerModels.length > 0) {
              targetModels = activeServerModels.sort((a: string, b: string) => {
                if (a.includes('2.0-flash')) return -1;
                if (b.includes('2.0-flash')) return 1;
                if (a.includes('flash')) return -1;
                if (b.includes('flash')) return 1;
                return 0;
              });
            }
          }
        } else {
          const errBody = await listRes.json().catch(() => ({}));
          if (errBody?.error?.message) {
            return { error: `Gemini API Key lỗi: ${errBody.error.message}` };
          }
        }
      } catch (listErr) {
        console.warn('Auto-discover Gemini models warning:', listErr);
      }

      let lastErrorMessage = '';

      for (const model of targetModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inline_data: {
                        mime_type: effectiveMime,
                        data: audioBase64
                      }
                    },
                    { text: prompt }
                  ]
                }
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
              const parsed = JSON.parse(rawText);
              if (parsed && parsed.narration) {
                return {
                  narration: String(parsed.narration).trim(),
                  language: parsed.language || 'vi',
                  audioDuration: Number(parsed.duration || 4.0),
                  words: Array.isArray(parsed.words) ? parsed.words : []
                };
              }
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            lastErrorMessage = errData?.error?.message || `HTTP ${res.status}`;
          }
        } catch (fetchErr: any) {
          lastErrorMessage = fetchErr.message;
        }
      }

      if (lastErrorMessage) {
        return { error: `Gemini API: ${lastErrorMessage}` };
      }
    }

    return { error: 'Chưa có Gemini API Key. Vui lòng nhập API Key trong Cài đặt (Settings) trên thanh menu để AI tự động nghe và chuyển thành chữ.' };
  });

  // Web Image Search (Bing Async Image Search cho ảnh Full HD 1080p tiếng Việt + DuckDuckGo fallback)
  ipcMain.handle('media:search-web', async (_, query: string) => {
    try {
      const cleanQuery = (query || '').trim();
      if (!cleanQuery) return [];

      // 1. Dùng Bing Async Image Search: Cực kỳ ổn định, không chặn IP, trả về ảnh 1080p Full HD siêu nét
      try {
        const bingRes = await fetch(
          `https://www.bing.com/images/async?q=${encodeURIComponent(cleanQuery)}&count=25&first=0`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
            }
          }
        );

        if (bingRes.ok) {
          const html = await bingRes.text();
          const matches = [...html.matchAll(/murl&quot;:&quot;(http[^&]+)&quot;/g)];
          const imageUrls = matches
            .map((m) => decodeURIComponent(m[1]))
            .filter((u) => u && !u.endsWith('.svg') && !u.includes('favicon'));

          if (imageUrls.length > 0) {
            return imageUrls.slice(0, 20).map((url, idx) => ({
              id: `bing-img-${idx}-${Date.now()}`,
              type: 'image',
              url,
              thumbnail: url,
              title: cleanQuery,
              source: 'web'
            }));
          }
        }
      } catch (bingErr) {
        console.warn('Bing search attempt failed, trying DuckDuckGo fallback:', bingErr);
      }

      // 2. DuckDuckGo Fallback
      const vqdRes = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&iax=images&ia=images`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
          }
        }
      );
      const html = await vqdRes.text();
      const vqdMatch = html.match(/vqd=([\d-]+)/);
      if (vqdMatch) {
        const vqd = vqdMatch[1];
        const imgRes = await fetch(
          `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(cleanQuery)}&vqd=${vqd}&f=,,,`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
              Referer: 'https://duckduckgo.com/'
            }
          }
        );
        const json = await imgRes.json();
        if (json.results && json.results.length > 0) {
          return json.results.slice(0, 20).map((r: any, idx: number) => ({
            id: `ddg-img-${idx}-${Date.now()}`,
            type: 'image',
            url: r.image,
            thumbnail: r.thumbnail || r.image,
            title: r.title || cleanQuery,
            source: 'web'
          }));
        }
      }

      return [];
    } catch (err) {
      console.warn('Web image search error:', err);
      return [];
    }
  });

  // In-memory cache cho Electron video search
  const electronVideoCache = new Map<string, any[]>();

  // Web Video Search (Coverr Free HD Video API - 100% playable 200 OK MP4)
  ipcMain.handle('media:search-videos', async (_, query: string, page: number = 1) => {
    try {
      const cleanQuery = (query || '').trim();
      if (!cleanQuery) return [];

      const currentPage = Math.max(1, Number(page) || 1);
      const cacheKey = `${cleanQuery.toLowerCase()}_p${currentPage}`;
      if (electronVideoCache.has(cacheKey)) {
        return electronVideoCache.get(cacheKey)!;
      }

      const removeAccents = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

      const qLower = cleanQuery.toLowerCase();

      // Xác định từ khóa tìm kiếm video tiếng Anh
      let englishKeywords: string[] = [];

      if (/đi học|trường học|lớp học|học sinh|sinh viên|school|student|classroom/i.test(qLower)) {
        englishKeywords = ['school', 'student', 'classroom', 'campus', 'studying'];
      } else if (/tắm|đi tắm|gội đầu|ngâm mình|bơi|hồ bơi|bãi biển|nước mát/i.test(qLower)) {
        englishKeywords = ['shower', 'bath', 'swimming pool', 'relaxing water'];
      } else if (/vũ trụ|thiên hà|ngân hà|galaxy|không gian|hành tinh|sao|cosmos|nebula|space/i.test(qLower)) {
        englishKeywords = ['galaxy', 'space', 'nebula', 'stars'];
      } else if (/bún|cá|phở|món|ẩm thực|nước dùng|ăn|nấu|chiên|nướng|nhà hàng|quán|chế biến|tô|bát|thực khách|food|uống|cafe|cà phê|trà/i.test(qLower)) {
        englishKeywords = /cá/i.test(qLower) ? ['fish cooking', 'cooking', 'food'] : ['cooking', 'delicious food', 'kitchen'];
      } else if (/ngủ|thức dậy|buổi sáng|bình minh|giường|phòng ngủ/i.test(qLower)) {
        englishKeywords = ['waking up', 'morning', 'bed', 'sunrise'];
      } else if (/mua sắm|shopping|siêu thị|thời trang|quần áo|váy|cửa hàng/i.test(qLower)) {
        englishKeywords = ['shopping', 'fashion', 'store', 'clothes'];
      } else if (/tiền|tài chính|chứng khoán|cổ phiếu|doanh thu|lợi nhuận|ngân hàng|giàu|đầu tư|tỷ đồng|triệu|money|finance/i.test(qLower)) {
        englishKeywords = ['money', 'finance', 'business', 'growth'];
      } else if (/code|lập trình|ai|trí tuệ nhân tạo|phần mềm|công nghệ|máy tính|developer|robot|thuật toán|tech/i.test(qLower)) {
        englishKeywords = ['technology', 'coding', 'artificial intelligence', 'programming'];
      } else if (/máy bay|chuyến bay|sân bay|cất cánh|hàng không|airplane|flight/i.test(qLower)) {
        englishKeywords = ['airplane', 'flight', 'clouds', 'travel'];
      } else if (/đua xe|cao tốc|lái xe|xe hơi|ô tô|đường cao tốc|highway|driving/i.test(qLower)) {
        englishKeywords = ['highway', 'driving', 'night drive', 'cars'];
      } else if (/du lịch|biển|núi|khám phá|bãi biển|travel|nature|phong cảnh/i.test(qLower)) {
        englishKeywords = ['travel', 'nature', 'ocean', 'landscape'];
      } else if (/thành phố|đô thị|tòa nhà|đường phố|city|urban/i.test(qLower)) {
        englishKeywords = ['city', 'urban', 'skyline', 'traffic'];
      } else if (/thể thao|gym|chạy bộ|sức khỏe|fitness|workout|yoga/i.test(qLower)) {
        englishKeywords = ['fitness', 'workout', 'running', 'gym'];
      } else if (/^[a-zA-Z0-9\s\-',.]+$/.test(cleanQuery)) {
        const words = cleanQuery.split(/\s+/).filter(Boolean);
        englishKeywords = [cleanQuery, words[0] || 'lifestyle', words[words.length - 1] || 'cinematic'];
      } else {
        const noAccent = removeAccents(cleanQuery).replace(/[^\w\s]/gi, ' ').trim();
        englishKeywords = [noAccent, 'lifestyle', 'cinematic'];
      }

      // Chọn từ khóa tương ứng với page nếu query gốc ít kết quả
      const targetKwIndex = (currentPage - 1) % englishKeywords.length;
      const orderedKws = [
        englishKeywords[targetKwIndex],
        ...englishKeywords.filter((_, idx) => idx !== targetKwIndex)
      ];

      for (const kw of orderedKws) {
        if (!kw) continue;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const coverrPage = Math.floor((currentPage - 1) / englishKeywords.length) + 1;
          const res = await fetch(
            `https://coverr.co/api/videos?query=${encodeURIComponent(kw)}&page=${coverrPage}&urls=true`,
            {
              signal: controller.signal,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
              }
            }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const json = await res.json();
            const hits = json.hits || [];
            if (hits.length > 0) {
              const mapped = hits.slice(0, 12).map((h: any, idx: number) => ({
                id: `coverr-video-${idx}-${Date.now()}`,
                type: 'video',
                url: h.urls?.mp4 || h.urls?.mp4_preview,
                previewUrl: h.urls?.mp4_preview || h.urls?.mp4,
                thumbnail: h.thumbnail || h.poster,
                title: h.title || cleanQuery,
                source: 'web',
                duration: Math.round(Number(h.duration || 8))
              }));

              electronVideoCache.set(cacheKey, mapped);
              return mapped;
            }
          }
        } catch (e) {
          console.warn(`Coverr fetch failed for keyword: ${kw}`, e);
        }
      }

      return [];
    } catch (err) {
      console.warn('Video search error in main process:', err);
      return [];
    }
  });

  // AI: Groq & AI Engine Generation
  ipcMain.handle(
    'ai:gemini-generate',
    async (_, params: { prompt: string; modelId?: number; thinkMode?: number; cookie?: string; apiKey?: string; xsrfToken?: string }) => {
      try {
        const { prompt, cookie, apiKey } = params || {};
        const cleanPrompt = (prompt || '').trim();
        if (!cleanPrompt) {
          throw new Error('Prompt is required');
        }

        const activeKey = (apiKey || cookie || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || '').trim();

        // 1. Thử gọi DeepSeek API (https://api.deepseek.com/chat/completions)
        if (activeKey.startsWith('sk-') || activeKey.length > 20) {
          for (const dsModel of ['deepseek-chat', 'deepseek-reasoner']) {
            try {
              const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: dsModel,
                  messages: [
                    {
                      role: 'system',
                      content:
                        'You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses.'
                    },
                    { role: 'user', content: cleanPrompt }
                  ],
                  temperature: 0.7
                })
              });

              if (dsRes.ok) {
                const data = await dsRes.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content && typeof content === 'string') {
                  const cleaned = content
                    .replace(/<think>[\s\S]*?<\/think>/gi, '')
                    .replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
                    .trim();
                  return { text: cleaned, rawLength: content.length };
                }
              }
            } catch (dsErr) {
              console.warn('DeepSeek model failed in Electron main:', dsModel, dsErr);
            }
          }
        }

        // 2. Thử gọi Groq API (deepseek-r1, llama-3.3)
        if (activeKey.startsWith('gsk_') || activeKey.length > 20) {
          for (const model of ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']) {
            try {
              const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${activeKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model,
                  messages: [
                    {
                      role: 'system',
                      content:
                        'You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses.'
                    },
                    { role: 'user', content: cleanPrompt }
                  ],
                  temperature: 0.7
                })
              });

              if (gRes.ok) {
                const data = await gRes.json();
                const content = data?.choices?.[0]?.message?.content;
                if (content && typeof content === 'string') {
                  const cleaned = content
                    .replace(/<think>[\s\S]*?<\/think>/gi, '')
                    .replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
                    .trim();
                  return { text: cleaned, rawLength: content.length };
                }
              }
            } catch (groqErr) {
              console.warn('Groq model failed in Electron main:', model, groqErr);
            }
          }
        }

        return { text: '', rawLength: 0 };
      } catch (err: any) {
        console.error('Electron AI Generate error:', err);
        throw err;
      }
    }
  );

  // App Lifecycle: Restart & Reload
  ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.handle('app:reload', () => {
    win?.webContents.reload();
  });
}

