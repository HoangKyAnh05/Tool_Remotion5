import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Communicate } from 'edge-tts-universal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

process.on('uncaughtException', (err) => {
  console.error('[Remotion Server] Uncaught exception caught safely:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Remotion Server] Unhandled rejection caught safely:', reason);
});

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint for Render
  if (req.url === '/healthz' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

function normalizeRateToPercent(rate = '+0%') {
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

  // Handle TTS API on Web Service
  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { text, voice = 'vi-VN-NamMinhNeural', rate = '+0%', pitch = '+0Hz' } = JSON.parse(body || '{}');
        const cleanText = (text || '').trim();
        if (!cleanText) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ audioUrl: '', duration: 2.0, words: [] }));
          return;
        }

        const { effectiveVoice, effectiveRate, effectivePitch } = parseVoicePreset(voice, rate, pitch);
        const comm = new Communicate(cleanText, { voice: effectiveVoice, rate: effectiveRate, pitch: effectivePitch });
        const words = [];
        const audioChunks = [];

        for await (const rawChunk of comm.stream()) {
          const chunk = rawChunk;
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
        const base64 = fullBuffer.toString('base64');
        const audioUrl = `data:audio/mp3;base64,${base64}`;

        let duration = 3.0;
        if (words.length > 0) {
          duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
        } else {
          duration = Number(Math.max(2.5, fullBuffer.length / 5500).toFixed(2));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ audioUrl, duration, words }));
      } catch (err) {
        console.error('Edge-TTS server error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'TTS synthesis failed' }));
      }
    });
    return;
  }

  // Handle Google Drive Scan API
  if (req.url === '/api/drive/scan' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { folderId, apiKey } = JSON.parse(body || '{}');
        if (!folderId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folder ID is required' }));
          return;
        }

        if (apiKey) {
          const query = encodeURIComponent(`'${folderId}' in parents and (mimeType contains 'video/' or fileExtension = 'mp4' or fileExtension = 'mov' or fileExtension = 'webm' or fileExtension = 'mkv') and trashed = false`);
          const fields = encodeURIComponent('files(id,name,mimeType,size,thumbnailLink,webContentLink,createdTime)');
          const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${apiKey}&pageSize=100`;

          const gRes = await fetch(url);
          if (!gRes.ok) {
            const errData = await gRes.json().catch(() => ({}));
            res.writeHead(gRes.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errData?.error?.message || 'Google Drive API error' }));
            return;
          }

          const gData = await gRes.json();
          const files = (gData.files || []).map((f) => {
            const sizeBytes = Number(f.size) || 0;
            return {
              id: f.id,
              name: f.name || 'Video_Drive',
              mimeType: f.mimeType || 'video/mp4',
              sizeBytes,
              sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(2)),
              thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+$/, '=s400') : undefined,
              downloadUrl: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`,
              createdTime: f.createdTime
            };
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ files }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Google Drive API key is required' }));
      } catch (err) {
        console.error('Drive scan error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Scan failed' }));
      }
    });
    return;
  }

  // Handle Google Drive Download Proxy API
  if (req.url.startsWith('/api/drive/download') && req.method === 'GET') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const fileId = urlObj.searchParams.get('id');
      const apiKey = urlObj.searchParams.get('key');

      if (!fileId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File ID is required' }));
        return;
      }

      let driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      if (apiKey) {
        driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
      }

      const gRes = await fetch(driveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!gRes.ok && apiKey) {
        // Fallback to uc download
        const fallbackRes = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`);
        if (fallbackRes.ok) {
          const contentType = fallbackRes.headers.get('content-type') || 'video/mp4';
          const contentLength = fallbackRes.headers.get('content-length');
          const resHeaders = { 'Content-Type': contentType };
          if (contentLength) resHeaders['Content-Length'] = contentLength;
          res.writeHead(200, resHeaders);
          const reader = fallbackRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
          return;
        }
      }

      const contentType = gRes.headers.get('content-type') || 'video/mp4';
      const contentLength = gRes.headers.get('content-length');
      const resHeaders = { 'Content-Type': contentType };
      if (contentLength) resHeaders['Content-Length'] = contentLength;
      res.writeHead(gRes.status, resHeaders);

      if (gRes.body) {
        const reader = gRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        const buf = await gRes.arrayBuffer();
        res.end(Buffer.from(buf));
      }
      return;
    } catch (err) {
      console.error('Drive download error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err?.message || 'Download failed' }));
      return;
    }
  }

  // Handle Gemini Web2API (Free Zero-Token AI Generation)
  if (req.url === '/api/gemini/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { prompt, modelId = 1, thinkMode = 4, cookie, apiKey, xsrfToken } = JSON.parse(body || '{}');
        const cleanPrompt = (prompt || '').trim();
        if (!cleanPrompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required' }));
          return;
        }

        const activeKey = (apiKey || cookie || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || '').trim();

        // 1. Try DeepSeek API
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
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ text: cleaned, rawLength: content.length }));
                  return;
                }
              }
            } catch (dsErr) {
              console.warn('Server proxy DeepSeek error for model:', dsModel, dsErr);
            }
          }
        }

        // 2. Try Groq API
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
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ text: cleaned, rawLength: content.length }));
                  return;
                }
              }
            } catch (groqErr) {
              console.warn('Server proxy Groq error for model:', model, groqErr);
            }
          }
        }

        const inner = new Array(102).fill(null);
        inner[0] = [cleanPrompt, 0, null, null, null, null, 0];
        inner[1] = ['en'];
        inner[2] = ['', '', '', null, null, null, null, null, null, ''];
        inner[6] = [0];
        inner[7] = 1;
        inner[10] = 1;
        inner[11] = 0;
        inner[17] = [[thinkMode]];
        inner[18] = 0;
        inner[27] = 1;
        inner[30] = [4];
        inner[41] = [2];
        inner[53] = 0;
        inner[59] = crypto.randomUUID();
        inner[61] = [];
        inner[68] = 1;
        inner[79] = Number(modelId) || 1;

        const outer = [null, JSON.stringify(inner)];
        const bodyParams = new URLSearchParams();
        bodyParams.append('f.req', JSON.stringify(outer));
        if (xsrfToken) {
          bodyParams.append('at', xsrfToken);
        }

        const reqid = Math.floor(Date.now() / 1000) % 1000000;
        const bl = 'boq_assistant-bard-web-server_20260716.08_p0';
        const url = `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=${bl}&hl=en&_reqid=${reqid}&rt=c`;

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          'Origin': 'https://gemini.google.com',
          'Referer': 'https://gemini.google.com/app',
          'X-Same-Domain': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        };
        if (cookie) {
          headers['Cookie'] = cookie;
        }

        const gRes = await fetch(url, {
          method: 'POST',
          headers,
          body: bodyParams.toString()
        });

        if (!gRes.ok) {
          res.writeHead(gRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Gemini Web returned HTTP ${gRes.status}` }));
          return;
        }

        const raw = await gRes.text();
        let lastText = '';
        for (const line of raw.split('\n')) {
          if (!line.includes('"wrb.fr"') || line.length < 200) continue;
          try {
            const arr = JSON.parse(line);
            const innerStr = arr?.[0]?.[2];
            if (!innerStr || innerStr.length < 50) continue;
            const parsedInner = JSON.parse(innerStr);
            if (Array.isArray(parsedInner?.[4])) {
              for (const part of parsedInner[4]) {
                if (Array.isArray(part) && Array.isArray(part[1])) {
                  for (const t of part[1]) {
                    if (typeof t === 'string' && t.length > lastText.length) {
                      lastText = t;
                    }
                  }
                }
              }
            }
          } catch {
            // Ignore parse errors on chunks
          }
        }

        const cleaned = lastText
          .replace(/```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
          .replace(/http:\/\/googleusercontent\.com\/card_content\/\d+\n?/g, '')
          .trim();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: cleaned, rawLength: raw.length }));
      } catch (err) {
        console.error('Gemini Web API error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Gemini Web generation failed' }));
      }
    });
    return;
  }

  // Serve static files from dist/
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Security check: ensure filePath is within DIST_DIR
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexData);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running successfully on port ${PORT}`);
});
