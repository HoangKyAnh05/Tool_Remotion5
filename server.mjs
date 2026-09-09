import http from 'http';
import fs from 'fs';
import path from 'path';
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

  // Handle Edge-TTS API on Web Service
  if (req.url === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = JSON.parse(body || '{}');
        const cleanText = (text || '').trim();
        if (!cleanText) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ audioUrl: '', duration: 2.0, words: [] }));
          return;
        }

        const comm = new Communicate(cleanText, { voice, rate, pitch });
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
