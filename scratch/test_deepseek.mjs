async function testApis() {
  console.log('--- 1. Testing Pollinations openai-fast ---');
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an AI video scriptwriter. Return valid JSON only: { "scenes": [ { "order": 1, "narration": "...", "searchKeyword": "..." } ] }' },
          { role: 'user', content: 'Viết kịch bản video TikTok 4 cảnh giới thiệu quán Bánh đa cua Thiên Ban Quán' }
        ],
        model: 'openai-fast'
      })
    });
    console.log('Pollinations status:', res.status);
    const text = await res.text();
    console.log('Pollinations response:', text.slice(0, 500));
  } catch (e) {
    console.error('Pollinations error:', e);
  }

  console.log('\n--- 2. Testing DuckDuckGo AI (DeepSeek / Claude / GPT) ---');
  try {
    const vqdRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
      headers: { 'x-vqd-accept': '1', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const vqd = vqdRes.headers.get('x-vqd-4');
    console.log('DuckDuckGo VQD token:', vqd);
    if (vqd) {
      const ddgRes = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vqd-4': vqd,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify({
          model: 'o3-mini',
          messages: [
            { role: 'user', content: 'Tạo kịch bản JSON 3 cảnh về quán bánh đa cua: { "scenes": [{ "order": 1, "narration": "...", "searchKeyword": "..." }] }' }
          ]
        })
      });
      console.log('DDG status:', ddgRes.status);
      const ddgText = await ddgRes.text();
      console.log('DDG text snippet:', ddgText.slice(0, 500));
    }
  } catch (e) {
    console.error('DDG error:', e);
  }
}

testApis();
