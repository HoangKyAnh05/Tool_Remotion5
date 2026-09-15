import fs from 'fs';
import path from 'path';

async function testGradio() {
  const text = 'Xin chào, tôi là Ngọc Huyền. Rất vui được gặp bạn trong dự án video hôm nay!';
  const voice = 'ngoc_huyen';
  const speed = 1.0;
  const crossfade = 50;

  console.log('Sending synthesize request to Kokoro-Vietnamese for voice:', voice);

  try {
    // 1. Post to /gradio_api/call/predict or /call/predict or /api/predict
    const callRes = await fetch('https://dinhthuan-kokoro-vietnamese.hf.space/gradio_api/call/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [text, voice, speed, crossfade]
      })
    });

    console.log('Call endpoint status:', callRes.status);
    if (!callRes.ok) {
      const altRes = await fetch('https://dinhthuan-kokoro-vietnamese.hf.space/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [text, voice, speed, crossfade]
        })
      });
      console.log('Alt endpoint status:', altRes.status);
      const data = await altRes.json();
      console.log('Alt data:', data);
      return;
    }

    const { event_id } = await callRes.json();
    console.log('Event ID:', event_id);

    // 2. Stream event result
    const eventRes = await fetch(`https://dinhthuan-kokoro-vietnamese.hf.space/gradio_api/call/predict/${event_id}`);
    const streamText = await eventRes.text();
    console.log('Stream result length:', streamText.length);
    console.log('Stream sample:', streamText.slice(0, 500));

    // Parse SSE lines
    const lines = streamText.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('Parsed event data:', JSON.stringify(parsed, null, 2));
          if (Array.isArray(parsed) && parsed[0]?.url) {
            const audioUrl = parsed[0].url;
            console.log('Found audio URL:', audioUrl);
            const audioRes = await fetch(audioUrl);
            const arrayBuffer = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync('scratch/test_ngoc_huyen.wav', buffer);
            console.log('Successfully saved scratch/test_ngoc_huyen.wav, size:', buffer.length, 'bytes');
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

testGradio();
