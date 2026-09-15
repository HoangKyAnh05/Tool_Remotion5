async function testTikTokVoices() {
  const voices = [
    'vi_male_1',
    'vi_001',
    'vi_female_1',
    'vn_male',
    'vn_female',
    'vi_vn_001'
  ];
  for (const v of voices) {
    try {
      const res = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Xin chào', voice: v })
      });
      const data = await res.json();
      console.log('TikTok voice:', v, 'Result:', data.success ? 'SUCCESS' : data.error);
    } catch (e) {
      console.log('TikTok voice:', v, 'Error:', e.message);
    }
  }
}
testTikTokVoices();
