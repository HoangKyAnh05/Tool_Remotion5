import fs from 'fs';
import path from 'path';
import { synthesizeKokoro } from '../scripts/kokoroRunner.js';

async function runTests() {
  console.log('========================================================');
  console.log('   KIỂM THỬ TOÀN DIỆN GIỌNG ĐỌC NGỌC HUYỀN & MẠNH DŨNG  ');
  console.log('========================================================\n');

  const testCases = [
    {
      name: 'Test 1: Ngọc Huyền - Tốc độ chuẩn 1.0x (Câu văn ngắn)',
      voice: 'kokoro:ngoc_huyen',
      rate: '+0%',
      text: 'Xin chào mọi người! Hôm nay chúng ta cùng khám phá một địa điểm vô cùng thú vị.'
    },
    {
      name: 'Test 2: Ngọc Huyền - Tốc độ nhanh 1.25x (Đoạn review ẩm thực)',
      voice: 'kokoro:ngoc_huyen',
      rate: '+25%',
      text: 'Quán bún chả này nằm ngay trung tâm phố cổ, nước dùng đậm đà, thịt nướng thơm lừng chuẩn vị Hà Nội.'
    },
    {
      name: 'Test 3: Mạnh Dũng - Tốc độ chuẩn 1.0x (Giọng nam trầm ấm)',
      voice: 'kokoro:manh_dung',
      rate: '+0%',
      text: 'Chào mừng quý khán giả đến với bản tin tổng hợp công nghệ và trí tuệ nhân tạo ngày hôm nay.'
    },
    {
      name: 'Test 4: Mạnh Dũng - Tốc độ nhanh 1.35x (Tóm tắt dồn dập)',
      voice: 'kokoro:manh_dung',
      rate: '+35%',
      text: 'Diễn biến câu chuyện ngày càng kịch tính khi nhân vật chính quyết định đối đầu trực diện với thế lực bí ẩn.'
    }
  ];

  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[${i + 1}/${testCases.length}] ${tc.name}`);
    console.log(`     Văn bản: "${tc.text}"`);
    console.log(`     Giọng: ${tc.voice} | Tốc độ: ${tc.rate}`);

    const start = Date.now();
    try {
      const res = await synthesizeKokoro(tc.text, tc.voice, tc.rate);
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      if (!res.audioUrl || !res.audioUrl.startsWith('data:audio/wav;base64,')) {
        throw new Error('Invalid audioUrl data URI format');
      }
      if (res.duration <= 0) {
        throw new Error('Audio duration must be positive');
      }
      if (!Array.isArray(res.words) || res.words.length === 0) {
        throw new Error('Word boundaries list is empty');
      }

      // Check first and last word
      const firstWord = res.words[0];
      const lastWord = res.words[res.words.length - 1];

      // Save audio to scratch directory for verification
      const b64Data = res.audioUrl.replace(/^data:audio\/wav;base64,/, '');
      const buffer = Buffer.from(b64Data, 'base64');
      const outFileName = `scratch/test_${tc.voice.replace('kokoro:', '')}_case${i + 1}.wav`;
      fs.writeFileSync(outFileName, buffer);

      console.log(`     -> KẾT QUẢ: THÀNH CÔNG!`);
      console.log(`     -> Thời gian render: ${elapsed}s | Thời lượng audio: ${res.duration}s | Kích thước: ${buffer.length} bytes`);
      console.log(`     -> Số từ nhận diện: ${res.words.length} từ (Từ đầu: "${firstWord.word}" @ ${firstWord.start}s, Từ cuối: "${lastWord.word}" @ ${lastWord.end}s)`);
      console.log(`     -> Đã lưu file: ${outFileName}\n`);
      passed++;
    } catch (err) {
      console.error(`     -> THẤT BẠI: ${err.message}\n`);
    }
  }

  console.log('========================================================');
  console.log(`TỔNG KẾT: ${passed}/${testCases.length} BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%`);
  console.log('========================================================');

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests();
