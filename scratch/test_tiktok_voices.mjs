import fs from 'fs';

async function testVoices() {
  const testText = 'Hôm nay mình sẽ dẫn các bạn đi ăn món bánh đa cua siêu ngon tại quán Thiên Ban.';
  const voices = [
    'en_male_narration', // Male Narrator (Deep viral voice)
    'en_us_006',        // Joey / Deep male
    'en_male_cody',     // Energetic male
    'en_us_001',        // Female
    'vi_001'            // Vietnamese
  ];

  for (const v of voices) {
    try {
      console.log(`Testing voice: ${v}...`);
      const res = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, voice: v })
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data) {
        console.log(`Voice ${v} OK! Base64 length: ${data.data.length}`);
        fs.writeFileSync(`scratch/sample_${v}.mp3`, Buffer.from(data.data, 'base64'));
      } else {
        console.log(`Voice ${v} error:`, data.error || data);
      }
    } catch (e) {
      console.error(`Voice ${v} failed:`, e.message);
    }
  }
}

testVoices();
