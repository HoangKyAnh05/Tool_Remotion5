import crypto from 'crypto';

async function generateStructureWithGeminiWeb(topic, sceneCount = 4) {
  const prompt = `Bạn là Đạo diễn kiêm Nhà sáng tạo nội dung Video Ngắn Triệu View (TikTok / Reels / Shorts).
Chủ đề video: "${topic}"
Số lượng phân cảnh cần chia: ${sceneCount} cảnh.

YÊU CẦU: Trả về DUY NHẤT một chuỗi JSON hợp lệ không bọc trong markdown (hoặc có bọc json block), có định dạng:
{
  "formattedTimestamps": "00:00 - 00:10: Cảnh 1\\n00:10 - 00:25: Cảnh 2...",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:10",
      "startOffset": 0,
      "endOffset": 10,
      "title": "Tên phân cảnh",
      "visualDescription": "Mô tả góc quay chi tiết",
      "narration": "Lời bình Gen-Z cuốn hút hấp dẫn",
      "audioNote": "Gợi ý nhạc nền",
      "searchKeyword": "dance trend",
      "imagePrompt": "cinematic dance 8k"
    }
  ]
}`;

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
  inner[79] = 1; // 1 = FAST

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

  // Clean markdown json if any
  let cleanJson = lastText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleanJson);
  return parsed;
}

generateStructureWithGeminiWeb('Video nhảy nhạc trend trung quốc ( có 5 người )', 4).then(res => {
  console.log('SUCCESSFUL STRUCTURED GENERATION:');
  console.log(JSON.stringify(res, null, 2));
}).catch(err => {
  console.error('Error:', err);
});
