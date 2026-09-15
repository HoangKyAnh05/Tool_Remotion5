import { Communicate } from 'edge-tts-universal';

async function testEdgeSpeed() {
  const text = 'Chào bạn, hôm nay chúng ta sẽ cùng trải nghiệm không gian quán ăn tuyệt vời tại trung tâm.';
  const rates = ['+0%', '+25%', '+50%', '+100%'];

  for (const rate of rates) {
    const comm = new Communicate(text, {
      voice: 'vi-VN-NamMinhNeural',
      rate: rate
    });

    const words = [];
    let audioBytes = 0;
    for await (const chunk of comm.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioBytes += chunk.data.length;
      } else if (chunk.type === 'WordBoundary' && chunk.text) {
        const start = Number(((chunk.offset || 0) / 10000000).toFixed(2));
        const dur = Number(((chunk.duration || 0) / 10000000).toFixed(2));
        words.push({ word: chunk.text, start, end: Number((start + dur).toFixed(2)) });
      }
    }

    const lastWordEnd = words.length ? words[words.length - 1].end : 0;
    console.log(`Rate: ${rate} -> Total audio bytes: ${audioBytes}, Words count: ${words.length}, Total duration: ${lastWordEnd}s`);
    console.log('Sample words:', words.slice(0, 3));
  }
}

testEdgeSpeed();
