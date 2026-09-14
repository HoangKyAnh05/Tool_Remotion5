import React from 'react';
import {
  Sparkles,
  Scissors,
  Type,
  Music,
  Download,
  ChevronRight,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export type StepNumber = 1 | 2 | 3 | 4 | 5;

interface Step5WorkflowStepperProps {
  currentStep: StepNumber;
  onSelectStep: (step: StepNumber) => void;
  onOpenVideoSplitter: () => void;
  onOpenRender: () => void;
  onOpenAiDirector?: () => void;
  sceneCount: number;
  totalDuration: number;
  sfxCount: number;
}

export const Step5WorkflowStepper: React.FC<Step5WorkflowStepperProps> = ({
  currentStep,
  onSelectStep,
  onOpenVideoSplitter,
  onOpenRender,
  sceneCount,
  totalDuration,
  sfxCount
}) => {
  const steps = [
    {
      number: 1 as StepNumber,
      title: 'Bước 1: 🤖 AI OpenAI Kịch Bản & Giọng Đọc',
      shortTitle: 'Bước 1: AI Kịch Bản',
      desc: 'OpenAI chia theo mốc giây & sinh giọng lồng tiếng',
      icon: Sparkles,
      color: 'from-pink-500 to-rose-500',
      badge: `${sceneCount} phân cảnh`
    },
    {
      number: 2 as StepNumber,
      title: 'Bước 2: 🎬 Nạp & Kéo Cắt Source Video',
      shortTitle: 'Bước 2: Nạp Source Video',
      desc: 'Kéo trái/phải video gốc khớp phân đoạn',
      icon: Scissors,
      color: 'from-rose-500 to-orange-500',
      badge: `${totalDuration.toFixed(1)}s`
    },
    {
      number: 3 as StepNumber,
      title: 'Bước 3: 🎨 Phụ Đề & Hiệu Ứng Visual',
      shortTitle: 'Bước 3: Phụ Đề & Visual',
      desc: 'Karaoke từng từ, màu sắc & bố cục 3D',
      icon: Type,
      color: 'from-amber-500 to-yellow-500',
      badge: 'Karaoke'
    },
    {
      number: 4 as StepNumber,
      title: 'Bước 4: 🎵 Nhạc Nền & SFX Timeline',
      shortTitle: 'Bước 4: Nhạc & Sound FX',
      desc: 'BGM + Kéo thả 50+ Sound Effects theo giây',
      icon: Music,
      color: 'from-violet-500 to-indigo-500',
      badge: `${sfxCount} SFX`
    },
    {
      number: 5 as StepNumber,
      title: 'Bước 5: 🚀 Xuất Video Hoàn Chỉnh',
      shortTitle: 'Bước 5: Xuất Video',
      desc: 'Render MP4 60 FPS Full HD / 4K',
      icon: Download,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Render MP4'
    }
  ];

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.number}>
                <button
                  onClick={() => {
                    onSelectStep(step.number);
                    if (step.number === 1 || step.number === 2) {
                      // Nếu bấm bước 1 hoặc bước 2 thì có thể mở modal chia video nếu muốn
                    } else if (step.number === 5) {
                      onOpenRender();
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all border ${
                    isActive
                      ? `bg-gradient-to-r ${step.color} text-white border-white/20 shadow-lg scale-100 font-bold`
                      : isCompleted
                      ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      : 'bg-slate-950/60 text-slate-400 border-transparent hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs truncate font-semibold">
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.shortTitle}</span>
                    </div>
                  </div>

                  {step.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium hidden md:inline shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {step.badge}
                    </span>
                  )}
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0 hidden lg:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
