import { VideoSegment, TrimOverflowOption, Scene, AspectRatio, TrimSide } from '../types/video';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  url: string;
  name: string;
  sizeMb: number;
}

/**
 * Tự động phát hiện tỉ lệ khung hình (9:16, 16:9, 1:1) từ độ phân giải video
 */
export function detectVideoAspectRatio(width: number, height: number): AspectRatio {
  if (!width || !height) return '9:16';
  const ratio = width / height;
  if (ratio <= 0.75) return '9:16'; // Dọc TikTok, Shorts, Reels (ví dụ 1080x1920)
  if (ratio >= 0.85 && ratio <= 1.15) return '1:1'; // Vuông Instagram (ví dụ 1080x1080)
  return '16:9'; // Ngang YouTube, Tivi (ví dụ 1920x1080)
}

/**
 * Trích xuất siêu dữ liệu (thời lượng, kích thước, khung hình, tỉ lệ) từ file video tải lên
 */
export async function inspectVideoFile(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1920;
      const ratio = detectVideoAspectRatio(w, h);

      resolve({
        duration: Number(video.duration.toFixed(2)),
        width: w,
        height: h,
        aspectRatio: ratio,
        url: videoUrl,
        name: file.name,
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(2))
      });
    };

    video.onerror = () => {
      reject(new Error('Không thể đọc file video. Vui lòng kiểm tra định dạng MP4, MOV, WEBM.'));
    };
  });
}

/**
 * Chụp nhanh thumbnail cho toàn bộ các phân đoạn clip bằng 1 video decoder duy nhất
 * Giúp giao diện cực nhẹ, không bao giờ bị nghẽn decoder GPU hay lag máy
 */
export async function generateAllSegmentThumbnails(
  videoUrl: string,
  segments: VideoSegment[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!videoUrl || segments.length === 0) return result;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let currentIndex = 0;
    const canvas = document.createElement('canvas');
    let ctx: CanvasRenderingContext2D | null = null;

    const captureCurrent = () => {
      if (currentIndex >= segments.length) {
        video.src = '';
        resolve(result);
        return;
      }
      const seg = segments[currentIndex];
      video.currentTime = Math.max(0, seg.startOffset + 0.05);
    };

    video.onloadedmetadata = () => {
      canvas.width = Math.min(video.videoWidth || 480, 480);
      const aspect = (video.videoHeight || 854) / (video.videoWidth || 480);
      canvas.height = Math.round(canvas.width * aspect);
      ctx = canvas.getContext('2d');
      captureCurrent();
    };

    video.onseeked = () => {
      if (currentIndex < segments.length && ctx) {
        const seg = segments[currentIndex];
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          result[seg.id] = canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
          // ignore
        }
        currentIndex++;
        captureCurrent();
      }
    };

    video.onerror = () => {
      resolve(result);
    };

    // Timeout an toàn sau 5s
    setTimeout(() => {
      resolve(result);
    }, 5000);
  });
}

/**
 * Tự động chia video dài thành các phân đoạn (Segments) theo mốc giây (ví dụ: 5s, 10s, 15s)
 */
export function splitVideoIntoSegments(
  sourceUrl: string,
  totalDuration: number,
  intervalSeconds: number
): VideoSegment[] {
  const safeInterval = Math.max(1, intervalSeconds);
  const segments: VideoSegment[] = [];
  let currentStart = 0;
  let index = 1;

  while (currentStart < totalDuration) {
    const nextEnd = Math.min(currentStart + safeInterval, totalDuration);
    const duration = Number((nextEnd - currentStart).toFixed(2));

    // Bỏ qua đoạn vụn cực nhỏ dưới 0.4s nếu đã có ít nhất 1 segment (gộp vào đoạn trước)
    if (duration < 0.4 && segments.length > 0) {
      const prev = segments[segments.length - 1];
      prev.endOffset = totalDuration;
      prev.duration = Number((totalDuration - prev.startOffset).toFixed(2));
      break;
    }

    segments.push({
      id: `seg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      order: index,
      title: `Clip #${index} (${duration}s)`,
      sourceUrl,
      startOffset: Number(currentStart.toFixed(2)),
      endOffset: Number(nextEnd.toFixed(2)),
      duration
    });

    currentStart = nextEnd;
    index++;
  }

  return segments;
}

/**
 * Xử lý co ngắn đoạn video theo Hướng:
 * - side = 'left': Co ngắn từ Đầu Trái (tăng startOffset)
 * - side = 'right': Co ngắn từ Đuôi Phải (giảm endOffset)
 * - overflowMode = 'shift_to_next' | 'shift_to_prev' | 'discard'
 */
export function trimSegmentWithOption(
  segments: VideoSegment[],
  targetIndex: number,
  newDuration: number,
  overflowMode: TrimOverflowOption = 'shift_to_next',
  side: TrimSide = 'right'
): {
  updatedSegments: VideoSegment[];
  message: string;
} {
  if (targetIndex < 0 || targetIndex >= segments.length) {
    return { updatedSegments: segments, message: 'Vị trí clip không hợp lệ' };
  }

  const updated = segments.map((seg) => ({ ...seg }));
  const target = updated[targetIndex];
  const oldDuration = target.duration;
  const safeNewDuration = Math.max(0.5, Number(newDuration.toFixed(2)));
  const delta = Number((oldDuration - safeNewDuration).toFixed(2));

  if (delta === 0) {
    return { updatedSegments: updated, message: 'Thời lượng không đổi.' };
  }

  if (side === 'left') {
    // Co từ Đầu Trái (Cắt phần đầu): startOffset dời lên
    const newStartOffset = Number((target.endOffset - safeNewDuration).toFixed(2));
    target.startOffset = newStartOffset;
    target.duration = safeNewDuration;
    target.title = `Clip #${target.order} (${safeNewDuration}s)`;

    if (delta > 0) {
      if (overflowMode === 'shift_to_prev' && targetIndex > 0) {
        const prev = updated[targetIndex - 1];
        prev.endOffset = newStartOffset;
        prev.duration = Number((prev.endOffset - prev.startOffset).toFixed(2));
        prev.title = `Clip #${prev.order} (${prev.duration}s)`;

        return {
          updatedSegments: updated,
          message: `Đã co đầu trái Clip #${target.order} còn ${safeNewDuration}s. Đoạn thừa ${delta}s đã gộp vào Clip #${prev.order}!`
        };
      }
      return {
        updatedSegments: updated,
        message: `Đã co đầu trái Clip #${target.order} còn ${safeNewDuration}s (xóa bỏ ${delta}s đầu).`
      };
    }
  } else {
    // Co từ Đuôi Phải (Cắt phần đuôi): endOffset lùi về
    const newEndOffset = Number((target.startOffset + safeNewDuration).toFixed(2));
    target.endOffset = newEndOffset;
    target.duration = safeNewDuration;
    target.title = `Clip #${target.order} (${safeNewDuration}s)`;

    if (delta > 0) {
      if (overflowMode === 'shift_to_next' && targetIndex + 1 < updated.length) {
        const next = updated[targetIndex + 1];
        next.startOffset = newEndOffset;
        next.duration = Number((next.endOffset - next.startOffset).toFixed(2));
        next.title = `Clip #${next.order} (${next.duration}s)`;

        return {
          updatedSegments: updated,
          message: `Đã co đuôi phải Clip #${target.order} còn ${safeNewDuration}s. Đoạn thừa ${delta}s đã chuyển sang Clip #${next.order}!`
        };
      }
      return {
        updatedSegments: updated,
        message: `Đã co đuôi phải Clip #${target.order} còn ${safeNewDuration}s (xóa bỏ ${delta}s đuôi).`
      };
    }
  }

  return {
    updatedSegments: updated,
    message: `Đã cập nhật Clip #${target.order} thành ${safeNewDuration}s.`
  };
}

/**
 * Co nhanh theo số giây cụ thể từ Đầu Trái hoặc Đuôi Phải
 */
export function trimSegmentDirectional(
  segments: VideoSegment[],
  targetIndex: number,
  trimSeconds: number,
  side: TrimSide,
  overflowMode: TrimOverflowOption
): {
  updatedSegments: VideoSegment[];
  message: string;
} {
  if (targetIndex < 0 || targetIndex >= segments.length) {
    return { updatedSegments: segments, message: 'Vị trí clip không hợp lệ' };
  }
  const currentDur = segments[targetIndex].duration;
  const newDur = Math.max(0.5, currentDur - trimSeconds);
  return trimSegmentWithOption(segments, targetIndex, newDur, overflowMode, side);
}

/**
 * Tách video dài thành các file video con độc lập (Standalone Blobs)
 * Giúp mỗi clip hoạt động như 1 file video riêng biệt 100%, phát mượt 60 FPS không bao giờ bị nghẽn decoder
 */
export async function sliceVideoIntoStandaloneBlobs(
  videoUrl: string,
  segments: VideoSegment[],
  onProgress?: (percent: number, message: string) => void
): Promise<VideoSegment[]> {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return segments;
  }

  const updatedSegments = segments.map((s) => ({ ...s }));
  const total = updatedSegments.length;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let stream: MediaStream | null = null;
    let currentIndex = 0;

    const cleanup = () => {
      video.pause();
      video.src = '';
      resolve(updatedSegments);
    };

    video.onloadedmetadata = async () => {
      try {
        if ((video as any).captureStream) {
          stream = (video as any).captureStream();
        } else if ((video as any).mozCaptureStream) {
          stream = (video as any).mozCaptureStream();
        }
      } catch (e) {
        console.warn('captureStream not available:', e);
      }

      if (!stream) {
        resolve(updatedSegments);
        return;
      }

      processNextSegment();
    };

    video.onerror = () => {
      resolve(updatedSegments);
    };

    const processNextSegment = async () => {
      if (currentIndex >= total) {
        cleanup();
        return;
      }

      const seg = updatedSegments[currentIndex];
      const start = Math.max(0, seg.startOffset);
      const end = Math.min(video.duration, seg.endOffset);
      const dur = Number((end - start).toFixed(2));

      onProgress?.(
        Math.round(((currentIndex + 1) / total) * 100),
        `Đang trích xuất Clip #${currentIndex + 1}/${total} (${formatTimeDisplay(start)} - ${formatTimeDisplay(end)})...`
      );

      video.currentTime = start;
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);

        let chunks: Blob[] = [];
        let recorder: MediaRecorder;
        try {
          const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm';
          recorder = new MediaRecorder(stream!, { mimeType: mime });
        } catch (e) {
          recorder = new MediaRecorder(stream!);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const standaloneUrl = URL.createObjectURL(blob);
          seg.sourceUrl = standaloneUrl;
          seg.isStandalone = true;
          seg.originalStartOffset = seg.startOffset;
          seg.originalEndOffset = seg.endOffset;
          seg.startOffset = 0;
          seg.endOffset = dur;
          seg.duration = dur;

          currentIndex++;
          processNextSegment();
        };

        recorder.start(100);
        video.playbackRate = 2.5; // Tăng tốc độ trích xuất 2.5x
        video.play().catch(() => {});

        const checkEnd = () => {
          if (video.currentTime >= end || video.ended) {
            video.removeEventListener('timeupdate', checkEnd);
            video.pause();
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }
        };
        video.addEventListener('timeupdate', checkEnd);
      };

      video.addEventListener('seeked', onSeeked);
    };

    // Timeout an toàn sau 45s
    setTimeout(() => {
      cleanup();
    }, 45000);
  });
}

/**
 * Chuyển đổi danh sách VideoSegment thành các Scene tương thích hoàn toàn với Remotion Storyboard
 */
export function convertSegmentsToScenes(segments: VideoSegment[]): Scene[] {
  return segments.map((seg, idx) => ({
    id: `scene-split-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    narration: seg.narration || `Phân đoạn ${idx + 1}: Thưởng thức không gian homestay (${seg.duration}s)`,
    searchKeyword: `Phân cảnh video homestay ${idx + 1}`,
    mediaType: 'video',
    mediaUrl: seg.sourceUrl,
    localMediaPath: seg.sourceUrl,
    sourceVideoUrl: seg.sourceUrl,
    videoStartOffset: seg.isStandalone ? 0 : seg.startOffset,
    videoEndOffset: seg.isStandalone ? seg.duration : seg.endOffset,
    audioDuration: seg.duration,
    words: [],
    transition: 'fade',
    kenBurns: 'none',
    headerBadge: `📍 CLIP ${idx + 1} (${seg.duration}s)`
  }));
}

/**
 * Định dạng số giây thành chuỗi hiển thị mm:ss
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}
