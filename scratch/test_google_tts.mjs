async function testGoogleTTS() {
  const text = 'Hôm nay mình dẫn các bạn đi ăn món bánh đa cua Hải Phòng cực ngon tại quán Thiên Ban.';
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://translate.google.com/'
    }
  });
  const buf = await res.arrayBuffer();
  console.log('Google TTS status:', res.status, 'Buffer size:', buf.byteLength);
}

testGoogleTTS();
