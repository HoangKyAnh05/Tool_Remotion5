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

  // 1. Monotonic Sanitization: Đảm bảo toàn bộ mốc thời gian tăng dần liên tục, không bị nhảy ngược hoặc đè nhau
  const effectiveWords: WordTimestamp[] = React.useMemo(() => {
    let sourceWords: WordTimestamp[] = [];
    if (words && words.length > 0) {
      sourceWords = words;
    } else if (fallbackText && fallbackText.trim() !== '') {
      const tokens = fallbackText.trim().split(/\s+/).filter(Boolean);
      const wordDuration = 0.35;
      sourceWords = tokens.map((w, idx) => ({
        word: w,
        start: Number((idx * wordDuration).toFixed(2)),
        end: Number(((idx + 1) * wordDuration).toFixed(2))
      }));
    }

    if (sourceWords.length === 0) return [];

    let currentStart = 0.05;
    return sourceWords.map((item, idx) => {
      let s = typeof item.start === 'number' && !isNaN(item.start) ? item.start : currentStart;
      // Tránh việc timestamp bị thụt lùi
      if (s < currentStart && idx > 0) {
        s = Number((currentStart + 0.08).toFixed(2));
      }
      let e = typeof item.end === 'number' && !isNaN(item.end) && item.end > s
        ? item.end
        : Number((s + 0.3).toFixed(2));

      currentStart = s;
      return {
        word: item.word || '',
        start: s,
        end: e
      };
    });
  }, [words, fallbackText]);

  const maxWords = Math.max(1, subtitleStyle.maxWordsPerLine || 4);

  // 2. Continuous Chunk Boundaries: Kết nối liền mạch các cụm để KHÔNG BAO GIỜ bị mất chữ giữa các nhịp
  const chunks = React.useMemo(() => {
    if (effectiveWords.length === 0) return [];
    const rawChunks: Array<{ words: WordTimestamp[]; start: number; end: number }> = [];

    for (let i = 0; i < effectiveWords.length; i += maxWords) {
      const chunkWords = effectiveWords.slice(i, i + maxWords);
      rawChunks.push({
        words: chunkWords,
        start: chunkWords[0].start,
        end: chunkWords[chunkWords.length - 1].end
      });
    }

    // Kết nối liền mạch các cụm: Cụm trước kéo dài đúng tới khi cụm sau bắt đầu
    for (let i = 0; i < rawChunks.length; i++) {
      if (i === 0) {
        rawChunks[i].start = 0; // Cụm đầu tiên hiển thị ngay từ đầu
      }
      if (i < rawChunks.length - 1) {
        rawChunks[i].end = rawChunks[i + 1].start;
      } else {
        rawChunks[i].end = 999999; // Cụm cuối cùng giữ nguyên cho đến hết cảnh
      }
    }

    return rawChunks;
  }, [effectiveWords, maxWords]);

  // Tìm cụm hiển thị đang hoạt động
  const activeChunk = React.useMemo(() => {
    if (chunks.length === 0) return null;
    const found = chunks.find((c) => effectiveTime >= c.start && effectiveTime < c.end);
    return found || chunks[chunks.length - 1] || chunks[0];
  }, [chunks, effectiveTime]);

  if (!activeChunk || activeChunk.words.length === 0) return null;

  // Tính toán active word index cho chế độ spotlight
  let spotlightActiveIdx = activeChunk.words.findIndex((w, idx) => {
    const next = activeChunk.words[idx + 1];
    const nStart = next ? next.start : w.end + 0.3;
    return effectiveTime >= w.start && effectiveTime < nStart;
  });
  if (spotlightActiveIdx === -1) {
    if (effectiveTime < activeChunk.words[0].start) {
      spotlightActiveIdx = 0;
    } else {
      spotlightActiveIdx = activeChunk.words.length - 1;
    }
  }

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
          const nextWord = activeChunk.words[index + 1];
          const nextWordStart = nextWord ? nextWord.start : item.end + 0.3;

          const isSpoken = effectiveTime >= item.start && effectiveTime < nextWordStart;
          const hasPassed = effectiveTime >= nextWordStart;
          const isUpcoming = effectiveTime < item.start;

          // Xử lý các chế độ hiển thị:
          // 1. Chế độ 'single_word_spotlight' (🎯 Nhảy Trái ➔ Phải / 1 chữ di chuyển):
          if (subtitleStyle.displayMode === 'single_word_spotlight') {
            if (index !== spotlightActiveIdx) {
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
            // 2. Chế độ 'single_word' (⚡ Chạy Trái ➔ Phải / Xuất hiện nối tiếp):
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
                from: 0.92,
                to: 1.18
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
