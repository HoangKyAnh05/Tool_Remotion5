async function testTikTokTts() {
  console.log('Testing TikTok TTS APIs...');
  
  // 1. TikTok Web TTS Worker
  try {
    const res = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Xin chào các bạn, đây là giọng đọc Adam TikTok chuẩn không cần API key.',
        voice: 'en_male_narration' // or vi_001, en_us_006, en_male_adam
      })
    });
    console.log('Worker status:', res.status);
    const data = await res.json().catch(() => ({}));
    console.log('Worker resp:', data.success ? 'Success! Audio length: ' + (data.data?.length || 0) : data);
  } catch (e) {
    console.error('Worker error:', e.message);
  }

  // 2. Direct ByteDance TikTok TTS API
  try {
    const text = 'Xin chào các bạn, đây là giọng đọc Adam chuẩn';
    const voice = 'en_us_006'; // Male narrator (Deep voice)
    const url = `https://api16-normal-v6.byteoversea.com/media/api/text/speech/invoke/?text_speaker=${voice}&req_text=${encodeURIComponent(text)}&speaker_map_type=0&aid=1233`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)',
        'Cookie': 'sessionid=90c38a59d8076ea0f0fb0180bc43f10f'
      }
    });
    console.log('ByteDance API status:', res.status);
    const json = await res.json().catch(() => ({}));
    console.log('ByteDance resp code:', json.status_code, 'Msg:', json.status_msg, 'Data length:', json.data?.v_str?.length || 0);
  } catch (e) {
    console.error('ByteDance API error:', e.message);
  }
}

testTikTokTts();
