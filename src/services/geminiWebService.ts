/**
 * DeepSeek & Multi-Provider AI Engine Service
 * Powered by DeepSeek-V3, DeepSeek-R1, Groq & Open AI Models
 */

export const DEFAULT_DEEPSEEK_KEY = '';
export const DEFAULT_GROQ_KEY = '';

export interface GeminiWebGenerateOptions {
  model?: 'deepseek-chat' | 'deepseek-reasoner' | 'deepseek-r1-distill-llama-70b' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | string;
  thinkMode?: number;
  timeoutMs?: number;
  cookie?: string;
  apiKey?: string;
  xsrfToken?: string;
}

export const DEEPSEEK_MODELS: Record<string, { desc: string }> = {
  'deepseek-chat': { desc: 'DeepSeek V3 (Thông minh vượt trội, Chuẩn xác tiếng Việt)' },
  'deepseek-reasoner': { desc: 'DeepSeek R1 (Suy luận chuyên sâu, Kịch bản đỉnh cao)' },
  'deepseek-r1-distill-llama-70b': { desc: 'DeepSeek R1 Distill 70B (Siêu tốc độ trên Groq)' },
  'llama-3.3-70b-versatile': { desc: 'Llama 3.3 70B Versatile' }
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
    .replace(/```(?:python|javascript|text|json)\?code_(?:reference|stdout)&code_event_index=\d+\n[\s\S]*?```\n?/g, '')
    .replace(/http:\/\/googleusercontent\.com\/card_content\/\d+\n?/g, '')
    .trim();
}

/**
 * Gửi prompt tới DeepSeek API, Groq hoặc AI Web Engine
 */
export async function generateTextWithGeminiWeb(
  prompt: string,
  options: GeminiWebGenerateOptions = {}
): Promise<string> {
  const customKey =
    options.apiKey ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('DEEPSEEK_API_KEY') ||
        localStorage.getItem('OPENAI_API_KEY') ||
        localStorage.getItem('GROQ_API_KEY') ||
        localStorage.getItem('GEMINI_API_KEY') ||
        localStorage.getItem('AI_API_KEY')
      : undefined);

  const activeKey = (customKey && customKey.trim().length > 5) ? customKey.trim() : (DEFAULT_DEEPSEEK_KEY || DEFAULT_GROQ_KEY);
  let modelName = options.model || 'deepseek-chat';

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
      console.warn('Electron IPC AI generate error, falling back to direct API/proxy:', e);
    }
  }

  // 1. Thử gọi DeepSeek API (https://api.deepseek.com/chat/completions)
  if (activeKey.startsWith('sk-') || activeKey.length > 20) {
    for (const dModel of ['deepseek-chat', 'deepseek-reasoner']) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: dModel,
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

        if (dsRes.ok) {
          const resData = await dsRes.json();
          const content = resData?.choices?.[0]?.message?.content;
          if (content && typeof content === 'string') {
            return extractGeminiWebResponseText(content);
          }
        }
      } catch (err) {
        console.warn(`Direct DeepSeek API fetch error for model ${dModel}:`, err);
      }
    }
  }

  // 2. Thử gọi Groq API (OpenAI Compatible)
  if (activeKey.startsWith('gsk_') || activeKey.length > 20) {
    const modelsToTry = ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
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

  // 3. Thử gọi qua backend proxy cục bộ (/api/gemini/generate)
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
