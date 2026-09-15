import fs from 'fs';

// Let's test pitch shifting MP3 / PCM in node
async function testMaleAcoustic() {
  const text = 'Chào các bạn, hôm nay chúng ta sẽ cùng khám phá quán ăn gia truyền cực ngon tại trung tâm thành phố.';
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=vi&client=tw-ob';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('Original Google TTS size:', buf.length);
}
testMaleAcoustic();
