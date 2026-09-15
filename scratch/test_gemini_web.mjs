import fetch from 'node-fetch';
import crypto from 'crypto';

async function generateWithGeminiWeb(prompt) {
  const inner = new Array(102).fill(null);
  inner[0] = [prompt, 0, null, null, null, null, 0];
  inner[1] = ['en'];
  inner[2] = ['', '', '', null, null, null, null, null, null, ''];
  inner[6] = [0];
  inner[7] = 1;
  inner[10] = 1;
  inner[11] = 0;
  inner[17] = [[4]]; // think mode
  inner[18] = 0;
  inner[27] = 1;
  inner[30] = [4];
  inner[41] = [2]; // chat persistence
  inner[53] = 0;
  inner[59] = crypto.randomUUID();
  inner[61] = [];
  inner[68] = 1;
  inner[79] = 1; // 1 = FAST (gemini-3.6-flash/3.7-flash)

  const outer = [null, JSON.stringify(inner)];
  const bodyParams = new URLSearchParams();
  bodyParams.append('f.req', JSON.stringify(outer));

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

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: bodyParams.toString()
  });

  const raw = await resp.text();
  console.log('Status:', resp.status);
  console.log('Raw length:', raw.length);

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
    } catch (e) {
      // ignore
    }
  }

  console.log('Extracted text preview:', lastText.slice(0, 300));
  return lastText;
}

generateWithGeminiWeb('Chào bạn, hãy giới thiệu ngắn gọn 1 câu về bạn.').then(res => {
  console.log('Done test. Result:', res);
}).catch(err => {
  console.error('Test error:', err);
});
