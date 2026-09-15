import fs from 'fs';
import { execSync } from 'child_process';

async function testPitchShift() {
  const text = 'Chào các bạn, hôm nay chúng ta sẽ cùng trải nghiệm không gian quán ăn tuyệt vời tại trung tâm thành phố.';
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=vi&client=tw-ob';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = Buffer.from(await res.arrayBuffer());
  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');
  fs.writeFileSync('scratch/google_orig.mp3', buf);

  // Apply male pitch down (asetrate down + atempo up to keep timing + bass boost for deep male voice)
  execSync('ffmpeg -y -i scratch/google_orig.mp3 -af "asetrate=24000*0.78,aresample=24000,atempo=1.28,bass=g=4:f=160" scratch/google_male.mp3');
  console.log('google_male.mp3 created successfully. Size:', fs.statSync('scratch/google_male.mp3').size);
}
testPitchShift();
