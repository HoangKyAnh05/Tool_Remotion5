import fs from 'fs';

async function testMoreVoices() {
  const text = 'Chào các bạn, hôm nay chúng ta cùng đi ăn bánh đa cua nhé!';

  // 1. VoiceMaker Free API
  console.log('--- Testing VoiceMaker Free ---');
  try {
    const res = await fetch('https://api.voicemaker.in/v1/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Engine: 'neural',
        VoiceId: 'ai3-vi-VN-1',
        LanguageCode: 'vi-VN',
        Text: text
      })
    });
    console.log('VoiceMaker status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('VoiceMaker data:', data);
  } catch (e) {
    console.error('VoiceMaker err:', e.message);
  }

  // 2. TTSMaker free web API
  console.log('--- Testing TTSMaker Free ---');
  try {
    const res = await fetch('https://api.ttsmaker.com/v1/create-tts-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'ttsmaker_demo_token',
        text: text,
        voice_id: 1001,
        audio_format: 'mp3'
      })
    });
    console.log('TTSMaker status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('TTSMaker data:', data);
  } catch (e) {
    console.error('TTSMaker err:', e.message);
  }
}

testMoreVoices();
