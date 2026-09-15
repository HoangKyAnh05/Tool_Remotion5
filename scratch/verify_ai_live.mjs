import { generateTextWithGeminiWeb, extractJsonFromAiResponse } from '../src/services/geminiWebService.ts';

async function testFullGeneration() {
  console.log('=== TEST: GENERATING DANCE SCRIPT WITH GEMINI 3.7 FLASH ===');
  const topic = 'Video nhảy nhạc trend trung quốc';
  const count = 4;

  const prompt = `Bạn là Đạo diễn kiêm Nhà sáng tạo nội dung Video Ngắn Triệu View (TikTok / Reels / Shorts / YouTube) hàng đầu hiện nay.
Chủ đề video: "${topic}"
Số lượng phân cảnh cần chia: ${count} cảnh.

Nhiệm vụ: Hãy phân tích kỹ chủ đề "${topic}" và lên kế hoạch phân chia mốc thời gian, góc máy hình ảnh, âm thanh và lời dẫn xuất sắc, bám sát thực tế.

PHONG CÁCH LỜI DẪN (NARRATION) SIÊU HAY, TỰ NHIÊN & BẮT TREND GIỚI TRẺ:
- Xưng hô gần gũi: Dùng "mình", "anh em", "mọi người", "team mình" (tránh giọng thuyết minh khô khan, sáo rỗng kiểu văn mẫu).
- Dùng từ ngữ sống động, hot trend Gen-Z theo ngữ cảnh: "out trình", "đỉnh nóc kịch trần", "xé gió", "đẳng cấp khác bọt", "bá cháy", "10 điểm không có nhưng", "bật mood", "chill hết nấc", "quá xá đã", "đỉnh chóp", "săn mây triệu view", "chữa lành thực sự", "mê chữ ê kéo dài"...
- Cảnh 1 giật hook mạnh mẽ trong 3 giây đầu; các cảnh giữa mô tả diễn biến kịch tính, chân thực; cảnh kết kêu gọi like/thả tim duyên dáng.

YÊU CẦU CHO MỖI PHÂN CẢNH:
- "order": Thứ tự từ 1 đến ${count}
- "timeRange": Chuỗi mốc thời gian định dạng "MM:SS - MM:SS" (ví dụ: "00:00 - 00:10", "00:10 - 00:25",...)
- "startOffset": Số giây bắt đầu (số nguyên/thực, ví dụ 0)
- "endOffset": Số giây kết thúc (số nguyên/thực, ví dụ 10)
- "title": Tên phân cảnh ngắn gọn, hấp dẫn, đúng ngữ cảnh
- "visualDescription": Mô tả chi tiết góc quay, hình ảnh xuất hiện trong phân cảnh
- "narration": Câu lồng tiếng hoặc lời bình tự nhiên, truyền cảm đậm chất Gen-Z (20 - 45 từ)
- "audioNote": Gợi ý nhạc nền hoặc hiệu ứng âm thanh thực tế
- "searchKeyword": Từ khóa tiếng Anh tìm video B-roll
- "imagePrompt": Prompt tiếng Anh tạo ảnh 8k chất lượng cao

TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON THEO ĐỊNH DẠNG:
{
  "formattedTimestamps": "00:00 - 00:10: Tên phân cảnh 1 (Mô tả góc máy)\\n00:10 - 00:25: Tên phân cảnh 2...",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:10",
      "startOffset": 0,
      "endOffset": 10,
      "title": "...",
      "visualDescription": "...",
      "narration": "...",
      "audioNote": "...",
      "searchKeyword": "...",
      "imagePrompt": "..."
    }
  ]
}`;

  const resText = await generateTextWithGeminiWeb(prompt, { model: 'gemini-3.7-flash' });
  const parsed = extractJsonFromAiResponse(resText);
  console.log('SUCCESSFUL RESULT:');
  console.table(parsed.scenes.map(s => ({
    '⏱️ Thời gian': s.timeRange,
    '🎬 Phân cảnh': s.title,
    '📹 Nội dung hình ảnh & Góc máy': s.visualDescription,
    '🗣️ Lời bình': s.narration
  })));
  return parsed;
}

testFullGeneration().catch(console.error);
