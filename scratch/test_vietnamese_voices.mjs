import fs from 'fs';

async function testFreeVietnameseVoices() {
  const text = 'Chào mừng các bạn đã đến với kênh ẩm thực và du lịch Việt Nam. Hôm nay chúng ta sẽ cùng khám phá một địa điểm vô cùng hấp dẫn.';

  console.log('--- 1. Testing Google Translate Neural Web TTS ---');
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      console.log('Google Translate TTS Success! Bytes:', buf.byteLength);
      fs.writeFileSync('scratch/voice_google_translate.mp3', Buffer.from(buf));
    } else {
      console.log('Google Translate status:', res.status);
    }
  } catch (e) {
    console.error('Google Translate error:', e.message);
  }

  console.log('\n--- 2. Testing VoiceRSS Free Vietnamese TTS ---');
  try {
    const vUrl = `https://api.voicerss.org/?key=demo&hl=vi-vn&src=${encodeURIComponent(text)}&f=44khz_16bit_stereo`;
    const res = await fetch(vUrl);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      console.log('VoiceRSS status:', res.status, 'Bytes:', buf.byteLength);
      if (buf.byteLength > 1000) {
        fs.writeFileSync('scratch/voice_voicerss.mp3', Buffer.from(buf));
      }
    }
  } catch (e) {
    console.error('VoiceRSS error:', e.message);
  }

  console.log('\n--- 3. Testing ResponsiveVoice Vietnamese ---');
  try {
    const rvUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=vi&sv=g1&vn=&pitch=0.5&rate=0.5&vol=1`;
    const res = await fetch(rvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://responsivevoice.org/'
      }
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      console.log('ResponsiveVoice status:', res.status, 'Bytes:', buf.byteLength);
      if (buf.byteLength > 1000) {
        fs.writeFileSync('scratch/voice_responsivevoice.mp3', Buffer.from(buf));
      }
    }
  } catch (e) {
    console.error('ResponsiveVoice error:', e.message);
  }
}

testFreeVietnameseVoices();
