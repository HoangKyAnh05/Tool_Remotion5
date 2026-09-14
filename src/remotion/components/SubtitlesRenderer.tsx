import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { WordTimestamp, SubtitleStyle } from '../../types/video';
import { getTikTokTextEffectById } from '../tiktok/tiktokTextEffects';
import { getTikTokTemplateById } from '../tiktok/tiktokTemplates';

interface SubtitlesRendererProps {
  words?: WordTimestamp[];
  subtitleStyle: SubtitleStyle;
  fallbackText?: string;
  enableDynamicEmojis?: boolean;
  textEffect?: string;
  textEffectsMix?: string[];
  textTemplate?: string;
  customPos?: { x: number; y: number; scale?: number; rotate?: number };
}

// Dictionary mapping common keywords to expressive emojis
const EMOJI_MAP: Record<string, string> = {
  // Money & Wealth
  tiền: '💰',
  giàu: '💎',
  tài: '📈',
  triệu: '💵',
  tỷ: '🤑',
  money: '💰',
  rich: '💎',
  gold: '🪙',
  vàng: '🪙',

  // Power, Speed & Innovation
  nhanh: '⚡',
  lửa: '🔥',
  cháy: '🔥',
  nóng: '🔥',
  bứt: '🚀',
  phóng: '🚀',
  vũ: '🌌',
  trụ: '🪐',
  sao: '✨',
  rocket: '🚀',
  space: '🌌',
  star: '⭐',

  // Success & Winning
  thành: '🏆',
  nhất: '🥇',
  win: '🏆',
  top: '👑',
  vua: '👑',

  // Food & Delicious
  ăn: '🍜',
  ngon: '🤤',
  bún: '🍲',
  phở: '🍜',
  cá: '🐟',
  thịt: '🥩',
  nước: '🥣',
  food: '🍔',

  // Ideas, Brain & Time
  nghĩ: '💡',
  ý: '💡',
  não: '🧠',
  ai: '🤖',
  thời: '⏱️',
  giờ: '⏰',
  time: '⏳',

  // Emotion & Attention
  yêu: '❤️',
  thích: '💖',
  chú: '⚠️',
  bí: '🤫',
  sốc: '😱',
  wow: '🤩'
};

function getEmojiForWord(word: string): string | null {
  const clean = word.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, '');
  return EMOJI_MAP[clean] || null;
}

export const SubtitlesRenderer: React.FC<SubtitlesRendererProps> = ({
  words,
  subtitleStyle,
  fallbackText,
  enableDynamicEmojis = true,
  textEffect,
  textEffectsMix,
  textTemplate,
  customPos
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Nếu người dùng chọn TẮT chữ (enabled === false) thì không render bất kỳ chữ phụ đề nào
  if (subtitleStyle?.enabled === false) {
    return null;
  }

  // Bù trễ âm thanh 160ms (lead offset) để chữ bật sáng đúng khoảnh khắc giọng đọc phát âm, không bị delay
  const AUDIO_LEAD_OFFSET = 0.16;
  const effectiveTime = currentTime + AUDIO_LEAD_OFFSET;

  const finalTop = customPos ? `${customPos.y}%` : `${subtitleStyle.positionY ?? 75}%`;
  const finalLeft = customPos ? `${customPos.x}%` : `${subtitleStyle.positionX ?? 50}%`;
  const scaleVal = customPos?.scale ?? subtitleStyle?.scale ?? 1;
  const rotateVal = customPos?.rotate ?? subtitleStyle?.rotation ?? subtitleStyle?.rotate ?? 0;
  const finalTransform = `translate(-50%, -50%) scale(${scaleVal}) rotate(${rotateVal}deg)`;

  // Nếu words rỗng nhưng có fallbackText, tự động tạo nhịp thời gian để chữ luôn chạy từng chữ một (karaoke)
  const effectiveWords: WordTimestamp[] = React.useMemo(() => {
    if (words && words.length > 0) return words;
    if (!fallbackText || fallbackText.trim() === '') return [];
    const tokens = fallbackText.trim().split(/\s+/);
    if (tokens.length === 0) return [];
    const wordDuration = 0.35;
    return tokens.map((w, idx) => ({
      word: w,
      start: idx * wordDuration,
      end: (idx + 1) * wordDuration
    }));
  }, [words, fallbackText]);

  if (!effectiveWords || effectiveWords.length === 0) {
    return null;
  }

  const maxWords = subtitleStyle.maxWordsPerLine || 4;

  // Group words into display chunks
  const chunks: Array<{ words: WordTimestamp[]; start: number; end: number }> = [];
  for (let i = 0; i < effectiveWords.length; i += maxWords) {
    const chunkWords = effectiveWords.slice(i, i + maxWords);
    const chunkStart = Math.max(0, chunkWords[0].start - 0.2);
    const chunkEnd = chunkWords[chunkWords.length - 1].end + 0.35;
    chunks.push({
      words: chunkWords,
      start: chunkStart,
      end: chunkEnd
    });
  }

  // Find active chunk using effectiveTime, fallback to first chunk if beginning of scene
  const activeChunk = chunks.find(
    (c) => effectiveTime >= c.start && effectiveTime <= c.end
  ) || (currentTime < 0.6 && chunks.length > 0 ? chunks[0] : null);

  if (!activeChunk) return null;

  return (
    <div
      className="absolute flex justify-center items-center pointer-events-none z-30 transition-transform"
      style={{
        top: finalTop,
        left: finalLeft,
        transform: finalTransform
      }}
    >
      <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 text-center px-4 py-2">
        {activeChunk.words.map((item, index) => {
          const isSpoken = effectiveTime >= item.start && effectiveTime <= item.end + 0.05;
          const hasPassed = effectiveTime > item.end + 0.05;
          const isUpcoming = effectiveTime < item.start;

          // Xử lý các chế độ hiển thị:
          // 1. Chế độ 'single_word' (Mặc định khi chọn Từng chữ): Chữ xuất hiện nối tiếp lần lượt TỪ TRÁI SANG PHẢI!
          // 2. Chế độ 'single_word_spotlight': Chỉ hiện đúng 1 chữ đang nói tại vị trí từ trái sang phải
          if (subtitleStyle.displayMode === 'single_word_spotlight') {
            if (!isSpoken) {
              return (
                <div
                  key={`${item.word}-${index}`}
                  className="relative inline-flex items-center justify-center opacity-0 pointer-events-none"
                  aria-hidden="true"
                >
                  <span className="font-black text-transparent select-none">{item.word}</span>
                </div>
              );
            }
          } else if (subtitleStyle.displayMode === 'single_word') {
            // Chữ chưa đọc tới thì chưa xuất hiện -> Chữ tự động chạy từ trái sang phải theo nhịp nói!
            if (isUpcoming) {
              return null;
            }
          }

          // Physics-based spring bounce animation when word is spoken
          const wordFrameOffset = Math.max(0, Math.round((effectiveTime - item.start) * fps));
          const popScale = isSpoken
            ? spring({
                frame: wordFrameOffset,
                fps,
                config: { damping: 10, stiffness: 220, mass: 0.4 },
                from: 0.88,
                to: 1.2
              })
            : 1.0;

          const textColor = isSpoken
            ? subtitleStyle.highlightColor
            : hasPassed
            ? '#F3F4F6'
            : subtitleStyle.textColor;

          const displayText = subtitleStyle.uppercase ? item.word.toUpperCase() : item.word;
          const emoji = enableDynamicEmojis && isSpoken ? getEmojiForWord(item.word) : null;

          return (
            <div
              key={`${item.word}-${index}`}
              className="relative inline-flex items-center justify-center transition-all duration-75"
              style={{
                transform: `scale(${popScale})`,
                zIndex: isSpoken ? 10 : 1
              }}
            >
              {/* Floating Animated Emoji Pop */}
              {emoji && (
                <span
                  className="absolute -top-10 left-1/2 -translate-x-1/2 text-3xl animate-bounce filter drop-shadow-lg"
                  style={{
                    transform: `translateX(-50%) scale(${spring({
                      frame: wordFrameOffset,
                      fps,
                      config: { damping: 8, stiffness: 240 }
                    })})`
                  }}
                >
                  {emoji}
                </span>
              )}

              {(() => {
                // Ưu tiên 1: Text Template CapCut (Ví dụ: Năng động, Đi nào, Location, OMG...)
                if (textTemplate) {
                  const tpl = getTikTokTemplateById(textTemplate);
                  if (tpl) {
                    if (tpl.renderWord) {
                      return (
                        <div className="inline-block transform origin-center">
                          {tpl.renderWord(displayText, isSpoken)}
                        </div>
                      );
                    }
                    return (
                      <div className={`inline-block transform origin-center ${isSpoken ? 'scale-110' : 'opacity-90'}`}>
                        {tpl.render(displayText)}
                      </div>
                    );
                  }
                }

                // Ưu tiên 2: Text Effect ART CapCut (mix hoặc đơn)
                let effId = textEffect;
                if (textEffectsMix && textEffectsMix.length > 0) {
                  effId = textEffectsMix[index % textEffectsMix.length];
                }
                const effItem = effId ? getTikTokTextEffectById(effId) : null;

                if (effItem) {
                  return (
                    <div className="inline-block transform origin-center">
                      {effItem.applyStyle(displayText)}
                    </div>
                  );
                }

                return (
                  <span
                    className="font-black tracking-wide leading-none"
                    style={{
                      fontFamily: subtitleStyle.fontFamily,
                      fontSize: `${subtitleStyle.fontSize}px`,
                      color: textColor,
                      WebkitTextStroke: `${subtitleStyle.strokeWidth}px ${subtitleStyle.strokeColor}`,
                      paintOrder: 'stroke fill',
                      textShadow: isSpoken
                        ? `0 0 24px ${subtitleStyle.highlightColor}cc, 0 4px 14px rgba(0,0,0,0.95)`
                        : '0 4px 12px rgba(0,0,0,0.9)'
                    }}
                  >
                    {displayText}
                  </span>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
