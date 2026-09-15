import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import crypto from 'crypto';
import { Communicate } from 'edge-tts-universal';

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
      } else if (modifier === 'ngochuyen' || modifier === 'manhdung') {
        effectiveRate = '+0%';
      }
    }
    if (modifier === 'manhdung') {
      effectivePitch = '-1Hz';
    }
  }

  return { effectiveVoice, effectiveRate, effectivePitch };
}

import { spawn } from 'child_process';

function synthesizeKokoroVite(text: string, voice: string, rate: string = '+0%'): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'scripts/kokoro_tts_engine.py');
    const proc = spawn('python', [scriptPath, '--json'], { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString('utf-8')));
    proc.stderr.on('data', (d) => (stderr += d.toString('utf-8')));

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Kokoro process exited with code ${code}: ${stderr}`));
      }
      try {
        const res = JSON.parse(stdout);
        resolve(res);
      } catch (e: any) {
        reject(new Error(`Failed to parse Kokoro JSON: ${e.message}`));
      }
    });

    let speed = 1.0;
    if (rate.includes('%')) {
      const num = parseInt(rate.replace('%', ''));
      if (!isNaN(num)) speed = Math.max(0.5, Math.min(2.0, 1.0 + num / 100));
    }

    const cleanVoice = voice.toLowerCase().replace('kokoro:', '').replace('kokoro-', '').trim() || 'ngoc_huyen';
    proc.stdin.write(JSON.stringify({ text, voice: cleanVoice, speed }));
    proc.stdin.end();
  });
}

function synthesizePiperVite(text: string, voice: string, rate: string = '+0%'): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'scripts/piper_tts_engine.py');
    const proc = spawn('python', [scriptPath, '--json'], { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d: any) => (stdout += d.toString('utf-8')));
    proc.stderr.on('data', (d: any) => (stderr += d.toString('utf-8')));

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Piper process exited with code ${code}: ${stderr}`));
      }
      try {
        const res = JSON.parse(stdout);
        resolve(res);
      } catch (e: any) {
        reject(new Error(`Failed to parse Piper JSON: ${e.message}`));
      }
    });

    let speed = 1.0;
    if (rate.includes('%')) {
      const num = parseInt(rate.replace('%', ''));
      if (!isNaN(num)) speed = Math.max(0.5, Math.min(2.0, 1.0 + num / 100));
    }

    const cleanVoice = voice.toLowerCase().replace('piper:', '').trim() || 'ngochuyen';
    const payload = Buffer.from(JSON.stringify({ text, voice: cleanVoice, speed }), 'utf-8');
    proc.stdin.write(payload);
    proc.stdin.end();
  });
}

function ttsAndMediaApiPlugin(): Plugin {
  const handleTtsRequest = async (req: any, res: any) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { text, voice = 'vi-VN-NamMinhNeural', rate = '+0%', pitch = '+0Hz' } = JSON.parse(body || '{}');
          const cleanText = (text || '').trim();
          if (!cleanText) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ audioUrl: '', duration: 2.0, words: [] }));
          }

          // 1. If Piper VITS voice (Ngoc Huyen, Manh Dung, Adam, Ban Mai, Tran Thanh, etc.)
          if (voice.startsWith('piper:') || voice === 'piper_ngochuyen' || voice === 'piper_manhdung') {
            try {
              const piperResult = await synthesizePiperVite(cleanText, voice, rate);
              if (piperResult && piperResult.audioUrl) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(piperResult));
              }
            } catch (piperErr) {
              console.warn('Vite Piper TTS failed, fallback to Edge-TTS:', piperErr);
            }
          }
          if (voice.startsWith('kokoro:') || voice === 'ngoc_huyen' || voice === 'manh_dung') {
            try {
              const kokoroResult = await synthesizeKokoroVite(cleanText, voice, rate);
              if (kokoroResult && kokoroResult.audioUrl) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(kokoroResult));
              }
            } catch (kokoroErr) {
              console.warn('Vite Kokoro TTS failed, fallback to Edge-TTS:', kokoroErr);
            }
          }

          const { effectiveVoice, effectiveRate, effectivePitch } = parseVoicePreset(voice, rate, pitch);
          const comm = new Communicate(cleanText, { voice: effectiveVoice, rate: effectiveRate, pitch: effectivePitch });
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
          const base64 = fullBuffer.toString('base64');
          const audioUrl = `data:audio/mp3;base64,${base64}`;

          let duration = 3.0;
          if (words.length > 0) {
            duration = Number((words[words.length - 1].end + 0.3).toFixed(2));
          } else {
            duration = Number(Math.max(2.5, fullBuffer.length / 5500).toFixed(2));
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ audioUrl, duration, words }));
        } catch (err: any) {
          console.error('Vite TTS plugin error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end();
    }
  };

  const handleMediaSearchRequest = async (req: any, res: any) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const query = urlObj.searchParams.get('q') || '';
      const cleanQuery = query.trim();

      if (!cleanQuery) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }

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
      if (!vqdMatch) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ results: [] }));
      }

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
      const results = (json.results || []).slice(0, 24).map((r: any, idx: number) => ({
        id: `web-img-${idx}-${Date.now()}`,
        type: 'image',
        url: r.image,
        thumbnail: r.thumbnail || r.image,
        title: r.title || cleanQuery,
        source: 'web'
      }));

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results }));
    } catch (err: any) {
      console.error('Media search plugin error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results: [] }));
    }
  };

  const handleGeminiGenerateRequest = async (req: any, res: any) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { prompt, cookie, apiKey } = JSON.parse(body || '{}');
          const cleanPrompt = (prompt || '').trim();
          if (!cleanPrompt) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Prompt is required' }));
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
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ text: cleaned, rawLength: content.length }));
                  }
                }
              } catch (dsErr) {
                console.warn('Vite proxy DeepSeek error for model:', dsModel, dsErr);
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
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ text: cleaned, rawLength: content.length }));
                  }
                }
              } catch (groqErr) {
                console.warn('Vite proxy Groq error for model:', model, groqErr);
              }
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ text: '', rawLength: 0 }));
        } catch (err: any) {
          console.error('Vite AI plugin error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'AI generation failed' }));
        }
      });
    } else {
      res.statusCode = 405;
      res.end();
    }
  };

  return {
    name: 'vite-tts-media-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
      server.middlewares.use('/api/search-media', handleMediaSearchRequest);
      server.middlewares.use('/api/gemini/generate', handleGeminiGenerateRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', handleTtsRequest);
      server.middlewares.use('/api/search-media', handleMediaSearchRequest);
      server.middlewares.use('/api/gemini/generate', handleGeminiGenerateRequest);
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    ttsAndMediaApiPlugin(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'ws',
                'edge-tts-universal',
                '@remotion/bundler',
                '@remotion/renderer'
              ]
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
