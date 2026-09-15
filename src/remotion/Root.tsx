import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './Composition';
import {
  VideoProject,
  DEFAULT_SUBTITLE_STYLE,
  DEFAULT_WATERMARK,
  DEFAULT_SOUND_FX
} from '../types/video';
import { maxShowcaseProject } from './sampleShowcaseProject';

export const defaultProject: VideoProject = {
  id: 'demo-project-1',
  title: 'Khám Phá Bí Ẩn Vũ Trụ',
  topic: 'Vũ trụ và Thiên văn học',
  aspectRatio: '9:16',
  fps: 30,
  totalDuration: 12,
  voice: {
    name: 'google-vi',
    rate: '+0%',
    pitch: '+0Hz'
  },
  subtitleStyle: DEFAULT_SUBTITLE_STYLE,
  watermark: DEFAULT_WATERMARK,
  showProgressBar: true,
  soundFx: DEFAULT_SOUND_FX,
  bgm: {
    url: '/audio/bgm-lofi.wav',
    volume: 0.5,
    duckingVolume: 0.15
  },
  status: 'idle',
  scenes: [
    {
      id: 'demo-scene-1',
      order: 1,
      narration: 'Bạn có biết vũ trụ của chúng ta đang giãn nở với tốc độ ánh sáng?',
      searchKeyword: 'galaxy nebula space deep cosmos',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.5,
      words: [
        { word: 'Bạn', start: 0.2, end: 0.5 },
        { word: 'có', start: 0.5, end: 0.7 },
        { word: 'biết', start: 0.7, end: 1.0 },
        { word: 'vũ', start: 1.1, end: 1.3 },
        { word: 'trụ', start: 1.3, end: 1.6 },
        { word: 'của', start: 1.6, end: 1.8 },
        { word: 'chúng', start: 1.8, end: 2.1 },
        { word: 'ta', start: 2.1, end: 2.3 },
        { word: 'đang', start: 2.4, end: 2.6 },
        { word: 'giãn', start: 2.6, end: 2.9 },
        { word: 'nở', start: 2.9, end: 3.2 },
        { word: 'với', start: 3.2, end: 3.4 },
        { word: 'tốc', start: 3.4, end: 3.6 },
        { word: 'độ', start: 3.6, end: 3.8 },
        { word: 'ánh', start: 3.8, end: 4.0 },
        { word: 'sáng?', start: 4.0, end: 4.5 }
      ],
      transition: 'fade',
      kenBurns: 'zoom_in'
    },
    {
      id: 'demo-scene-2',
      order: 2,
      narration: 'Ở rìa vũ trụ quan sát được, hàng tỷ thiên hà đang lấp lánh kỳ diệu.',
      searchKeyword: 'universe stars glowing planet orbit',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
      audioDuration: 4.8,
      words: [
        { word: 'Ở', start: 0.2, end: 0.4 },
        { word: 'rìa', start: 0.4, end: 0.7 },
        { word: 'vũ', start: 0.7, end: 1.0 },
        { word: 'trụ', start: 1.0, end: 1.3 },
        { word: 'quan', start: 1.4, end: 1.7 },
        { word: 'sát', start: 1.7, end: 2.0 },
        { word: 'được,', start: 2.0, end: 2.3 },
        { word: 'hàng', start: 2.4, end: 2.7 },
        { word: 'tỷ', start: 2.7, end: 3.0 },
        { word: 'thiên', start: 3.0, end: 3.3 },
        { word: 'hà', start: 3.3, end: 3.6 },
        { word: 'đang', start: 3.6, end: 3.9 },
        { word: 'lấp', start: 3.9, end: 4.2 },
        { word: 'lánh!', start: 4.2, end: 4.8 }
      ],
      transition: 'zoom_in',
      kenBurns: 'pan_left'
    }
  ]
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 9:16 Shorts / TikTok Composition (1080x1920) */}
      <Composition<any, any>
        id="Shorts916"
        component={MainComposition}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          project: maxShowcaseProject
        }}
      />

      {/* 16:9 Landscape Composition (1920x1080) */}
      <Composition<any, any>
        id="Landscape169"
        component={MainComposition}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          project: {
            ...maxShowcaseProject,
            aspectRatio: '16:9'
          }
        }}
      />
    </>
  );
};
