/**
 * Groq / AI Engine Service (High-Speed & Zero-Token AI Engine)
 * Powered by Groq Llama 3.3 70B & DeepSeek R1
 */

export const DEFAULT_GROQ_KEY = '';

export interface GeminiWebGenerateOptions {
  model?: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'deepseek-r1-distill-llama-70b' | 'gemma2-9b-it' | 'gemini-3.7-flash' | string;
  thinkMode?: number;
  timeoutMs?: number;
  cookie?: string;
  apiKey?: string;
  xsrfToken?: string;
}

export const GEMINI_WEB_MODELS: Record<string, { mode: number; think: number; desc: string }> = {
  'llama-3.3-70b-versatile': { mode: 1, think: 0, desc: 'Llama 3.3 70B Versatile (Cực thông minh & Nhanh)' },
  'llama-3.1-8b-instant': { mode: 2, think: 0, desc: 'Llama 3.1 8B Instant (Siêu tốc độ)' },
  'deepseek-r1-distill-llama-70b': { mode: 3, think: 0, desc: 'DeepSeek R1 70B (Suy luận logic sâu)' },
  'gemini-3.7-flash': { mode: 1, think: 4, desc: 'Gemini 3.7 Flash Engine' }
};

/**
 * Trích xuất text từ response thô của AI
 */
export function extractGeminiWebResponseText(rawText: string): string {
  if (!rawText) return '';

  // Clean think blocks like <think>...</think>
  let text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Clean code references or card content markers
  return text
    .replace(/```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
    .replace(/http:\/\/googleusercontent\.com\/card_content\/\d+\n?/g, '')
    .trim();
}

/**
 * Gửi prompt tới API endpoint Groq hoặc fallback
 */
export async function generateTextWithGeminiWeb(
  prompt: string,
  options: GeminiWebGenerateOptions = {}
): Promise<string> {
  const customKey =
    options.apiKey ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('GROQ_API_KEY') ||
        localStorage.getItem('GEMINI_API_KEY') ||
        localStorage.getItem('AI_API_KEY') ||
        localStorage.getItem('OPENAI_API_KEY')
      : undefined);

  const activeKey = (customKey && customKey.trim().length > 10) ? customKey.trim() : DEFAULT_GROQ_KEY;
  let modelName = options.model || 'llama-3.3-70b-versatile';
  if (modelName.startsWith('gemini')) {
    modelName = 'llama-3.3-70b-versatile';
  }

  // 0. Thử gọi trực tiếp qua Electron IPC Bridge
  if (typeof window !== 'undefined' && (window as any).electronAPI?.geminiGenerate) {
    try {
      const electronRes = await (window as any).electronAPI.geminiGenerate({
        prompt,
        modelId: 1,
        apiKey: activeKey,
        cookie: activeKey
      });
      if (electronRes && electronRes.text) {
        return extractGeminiWebResponseText(electronRes.text);
      }
    } catch (e) {
      console.warn('Electron IPC geminiGenerate error, falling back to direct API/proxy:', e);
    }
  }

  // 1. Thử gọi trực tiếp Groq API (OpenAI Compatible)
  if (activeKey.startsWith('gsk_') || activeKey.length > 20) {
    const modelsToTry = [modelName, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
    for (const m of modelsToTry) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: m,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert AI video scriptwriter, director, and creative content producer. Always return high quality, clear, and well-structured JSON or text responses.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7
          })
        });

        if (groqRes.ok) {
          const resData = await groqRes.json();
          const content = resData?.choices?.[0]?.message?.content;
          if (content && typeof content === 'string') {
            return extractGeminiWebResponseText(content);
          }
        }
      } catch (err) {
        console.warn(`Direct Groq API fetch error for model ${m}:`, err);
      }
    }
  }

  // 2. Thử gọi qua backend proxy cục bộ (/api/gemini/generate)
  const candidateEndpoints = [
    '/api/gemini/generate',
    'http://127.0.0.1:5173/api/gemini/generate',
    'http://localhost:5173/api/gemini/generate',
    'http://127.0.0.1:3000/api/gemini/generate',
    'http://localhost:3000/api/gemini/generate'
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          apiKey: activeKey,
          cookie: activeKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.text) {
          return extractGeminiWebResponseText(data.text);
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  throw new Error('AI Generation Engine không thể tạo nội dung. Vui lòng kiểm tra lại API Key hoặc kết nối mạng!');
}

/**
 * Trích xuất và parse JSON an toàn từ kết quả sinh của AI
 */
export function extractJsonFromAiResponse<T = any>(text: string): T | null {
  if (!text) return null;
  const clean = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```$/, '')
    .trim();

  // 1. Thử parse trực tiếp
  try {
    return JSON.parse(clean) as T;
  } catch {
    // 2. Tìm block {...} hoặc [...] đầu tiên
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sub = clean.slice(firstBrace, lastBrace + 1);
        return JSON.parse(sub) as T;
      } catch {
        // Ignore
      }
    }

    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        const sub = clean.slice(firstBracket, lastBracket + 1);
        return JSON.parse(sub) as T;
      } catch {
        // Ignore
      }
    }
  }

  return null;
}
