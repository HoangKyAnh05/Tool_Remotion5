import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import crypto from 'crypto';
import { Communicate } from 'edge-tts-universal';

function parseVoicePreset(voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz') {
  let effectiveVoice = voice || 'vi-VN-HoaiMyNeural';
  let effectiveRate = rate || '+0%';
  let effectivePitch = '+0Hz';

  if (voice === 'adam' || voice === 'adam-tiktok' || voice === 'vclip:adam') {
    return { effectiveVoice: 'vi-VN-NamMinhNeural', effectiveRate: '+18%', effectivePitch: '+0Hz' };
  }

  if (voice && voice.includes(':') && !voice.startsWith('elevenlabs:')) {
    const [baseVoice, modifier] = voice.split(':');
    effectiveVoice = baseVoice;
    switch (modifier) {
      case 'adam':
      case 'fast':
        effectiveRate = '+18%';
        break;
      case 'recap':
        effectiveRate = '+25%';
        break;
      case 'live':
        effectiveRate = '+18%';
        break;
      case 'sweet':
        effectiveRate = '+8%';
        break;
      case 'genz':
        effectiveRate = '+22%';
        break;
      case 'story':
        effectiveRate = '-8%';
        break;
      case 'deep':
        effectiveRate = '-4%';
        break;
      case 'asmr':
        effectiveRate = '-3%';
        break;
      case 'meme':
        effectiveRate = '+12%';
        break;
      default:
        break;
    }
  }

  return { effectiveVoice, effectiveRate, effectivePitch };
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
          const { text, voice = 'vi-VN-HoaiMyNeural', rate = '+0%', pitch = '+0Hz' } = JSON.parse(body || '{}');
          const cleanText = (text || '').trim();
          if (!cleanText) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ audioUrl: '', duration: 2.0, words: [] }));
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

          const activeKey = (apiKey || cookie || process.env.GROQ_API_KEY || '').trim();

          // Try Groq API
          if (activeKey.startsWith('gsk_') || activeKey.length > 20) {
            for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']) {
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
                      .replace(/```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
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
