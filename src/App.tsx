import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptGenerator } from './components/ScriptGenerator';
import { StoryboardTimeline } from './components/StoryboardTimeline';
import { CenterPlayerStage } from './components/CenterPlayerStage';
import { InspectorPanel } from './components/InspectorPanel';
import { RenderModal } from './components/RenderModal';
import { SettingsModal } from './components/SettingsModal';
import { BatchVocabularyModal } from './components/BatchVocabularyModal';
import { VideoSplitterModal } from './components/VideoSplitterModal';
import { AiVideoDirectorModal } from './components/AiVideoDirectorModal';
import { Step5WorkflowStepper, StepNumber } from './components/Step5WorkflowStepper';
import { SfxTimelineManager } from './components/SfxTimelineManager';
import { VideoProject } from './types/video';
import { sampleHomestayProject } from './remotion/sampleHomestayProject';
import { synthesizeEdgeTTS } from './services/edgeTtsService';
import { WorkflowMode } from './components/SparkleBadge';
import { DEFAULT_OPENAI_KEY, DEFAULT_GEMINI_KEY } from './services/aiScriptService';

export const App: React.FC = () => {
  const [project, setProject] = useState<VideoProject>(() => {
    const saved = localStorage.getItem('CURRENT_PROJECT');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bgm && (!parsed.bgm.url || parsed.bgm.url.includes('pixabay.com') || parsed.bgm.url.includes('mixkit.co'))) {
          parsed.bgm.url = '/audio/bgm-lofi.wav';
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved project', e);
      }
    }
    return sampleHomestayProject;
  });

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('fast');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isBatchVocabOpen, setIsBatchVocabOpen] = useState(false);
  const [isVideoSplitterOpen, setIsVideoSplitterOpen] = useState(false);
  const [isAiDirectorOpen, setIsAiDirectorOpen] = useState(false);
  const [aiDirectorInitialTab, setAiDirectorInitialTab] = useState<'copy_prompt' | 'paste_json' | 'missing_sources'>('copy_prompt');
  const [activeView, setActiveView] = useState<'editor' | 'roadmap100'>('editor');
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);

  const handleSeekPlayer = (timeInSeconds: number) => {
    setPreviewCurrentTime(timeInSeconds);
    window.dispatchEvent(new CustomEvent('remotion-seek-to-time', { detail: { time: timeInSeconds } }));
  };

  const [apiKeyGemini, setApiKeyGemini] = useState(
    () => localStorage.getItem('GEMINI_API_KEY') || DEFAULT_GEMINI_KEY
  );
  const [apiKeyOpenai, setApiKeyOpenai] = useState(
    () => localStorage.getItem('OPENAI_API_KEY') || DEFAULT_OPENAI_KEY
  );
  const [apiKeyPexels, setApiKeyPexels] = useState(
    () => localStorage.getItem('PEXELS_API_KEY') || ''
  );
  const [voiceRate, setVoiceRate] = useState(
    () => localStorage.getItem('VOICE_RATE') || '+0%'
  );
  const [voicePitch, setVoicePitch] = useState(
    () => localStorage.getItem('VOICE_PITCH') || '+0Hz'
  );

  // Lưu key Gemini và OpenAI mặc định vào localStorage nếu chưa có
  useEffect(() => {
    if (!localStorage.getItem('GEMINI_API_KEY')) {
      localStorage.setItem('GEMINI_API_KEY', DEFAULT_GEMINI_KEY);
    }
    if (!localStorage.getItem('OPENAI_API_KEY')) {
      localStorage.setItem('OPENAI_API_KEY', DEFAULT_OPENAI_KEY);
    }
  }, []);

  // Auto-synthesize voiceover for any scene missing audioUrl so speech plays immediately on Play
  useEffect(() => {
    let isMounted = true;
    const ensureAudio = async () => {
      const missingAudioScenes = project.scenes.filter((s) => !s.audioUrl);
      if (missingAudioScenes.length === 0) return;

      const updatedScenes = [...project.scenes];
      let hasChange = false;

      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.audioUrl && scene.narration) {
          try {
            const res = await synthesizeEdgeTTS(
              scene.narration,
              project.voice.name || 'google-vi',
              project.voice.rate,
              project.voice.pitch
            );
            if (res.audioUrl && isMounted) {
              updatedScenes[i] = {
                ...scene,
                audioUrl: res.audioUrl,
                audioDuration: res.duration,
                words: res.words.length > 0 ? res.words : scene.words
              };
              hasChange = true;
            }
          } catch (err) {
            console.warn('Initial voice synthesis error for scene', scene.id, err);
          }
        }
      }

      if (hasChange && isMounted) {
        setProject((prev) => ({
          ...prev,
          scenes: updatedScenes
        }));
      }
    };

    ensureAudio();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync project voice rate and pitch when settings change
  useEffect(() => {
    setProject((prev) => ({
      ...prev,
      voice: {
        ...prev.voice,
        rate: voiceRate,
        pitch: voicePitch
      }
    }));
  }, [voiceRate, voicePitch]);

  // Persist project changes safely
  useEffect(() => {
    try {
      localStorage.setItem('CURRENT_PROJECT', JSON.stringify(project));
    } catch (e) {
      console.warn('LocalStorage quota reached, saving lean project structure');
      try {
        const leanProject = {
          ...project,
          scenes: project.scenes.map((s) => ({
            ...s,
            audioUrl: s.audioUrl?.startsWith('data:') ? undefined : s.audioUrl
          }))
        };
        localStorage.setItem('CURRENT_PROJECT', JSON.stringify(leanProject));
      } catch (inner) {
        console.error('Failed to save lean project to localStorage', inner);
      }
    }
  }, [project]);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        project={project}
        setProject={setProject}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRender={() => setIsRenderOpen(true)}
        onOpenVideoSplitter={() => setIsVideoSplitterOpen(true)}
        onOpenAiDirector={(tab) => {
          setAiDirectorInitialTab(tab || 'copy_prompt');
          setIsAiDirectorOpen(true);
        }}
        isGenerating={isGenerating}
        activeView={activeView}
        setActiveView={setActiveView}
        workflowMode={workflowMode}
        setWorkflowMode={setWorkflowMode}
      />

      {/* Main Body (Studio) */}
      <main className="flex-1 overflow-hidden w-full h-[calc(100vh-64px)] flex flex-col xl:flex-row bg-slate-50">
        {/* CỘT TRÁI (28% Width): Phân cảnh & Kịch bản */}
        <div className="w-full xl:w-[28%] h-full overflow-y-auto p-3 sm:p-4 space-y-4 border-r border-slate-200 bg-slate-50/80 shrink-0">
          {/* Kịch bản */}
          <ScriptGenerator
            project={project}
            setProject={setProject}
            apiKeyGemini={apiKeyGemini}
            apiKeyPexels={apiKeyPexels}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            statusText={statusText}
            setStatusText={setStatusText}
            onOpenBatchVocab={() => setIsBatchVocabOpen(true)}
            onOpenVideoSplitter={() => setIsVideoSplitterOpen(true)}
            workflowMode={workflowMode}
          />

          {/* Danh sách phân cảnh Storyboard */}
          <StoryboardTimeline
            project={project}
            setProject={setProject}
            apiKeyGemini={apiKeyGemini}
            apiKeyPexels={apiKeyPexels}
            onOpenBatchVocab={() => setIsBatchVocabOpen(true)}
            onOpenVideoSplitter={() => setIsVideoSplitterOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            workflowMode={workflowMode}
          />
        </div>

        {/* CỘT GIỮA (44% Width): KHUNG PREVIEW TRUNG TÂM */}
        <div className="w-full xl:w-[44%] h-full overflow-hidden shrink-0 flex flex-col bg-slate-100 border-r border-slate-200">
          <CenterPlayerStage
            project={project}
            setProject={setProject}
            currentTime={previewCurrentTime}
            onTimeUpdate={setPreviewCurrentTime}
          />
        </div>

        {/* CỘT PHẢI (28% Width): BẢNG ĐIỀU KHIỂN THUỘC TÍNH & HIỆU ỨNG */}
        <div className="w-full xl:w-[28%] h-full overflow-y-auto shrink-0 bg-white p-2 sm:p-3">
          {currentStep === 4 ? (
            <SfxTimelineManager
              project={project}
              setProject={setProject}
              currentTime={previewCurrentTime}
              onSeek={handleSeekPlayer}
            />
          ) : (
            <InspectorPanel
              project={project}
              setProject={setProject}
              workflowMode={workflowMode}
              currentTime={previewCurrentTime}
              onSeek={handleSeekPlayer}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <AiVideoDirectorModal
        isOpen={isAiDirectorOpen}
        onClose={() => setIsAiDirectorOpen(false)}
        project={project}
        setProject={setProject}
        initialTab={aiDirectorInitialTab}
        onNavigateToStudio={() => setIsAiDirectorOpen(false)}
      />

      <VideoSplitterModal
        isOpen={isVideoSplitterOpen}
        onClose={() => setIsVideoSplitterOpen(false)}
        project={project}
        setProject={setProject}
      />

      <BatchVocabularyModal
        isOpen={isBatchVocabOpen}
        onClose={() => setIsBatchVocabOpen(false)}
        project={project}
        setProject={setProject}
        apiKeyPexels={apiKeyPexels}
      />

      <RenderModal
        project={project}
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeyGemini={apiKeyGemini}
        setApiKeyGemini={setApiKeyGemini}
        apiKeyPexels={apiKeyPexels}
        setApiKeyPexels={setApiKeyPexels}
        voiceRate={voiceRate}
        setVoiceRate={setVoiceRate}
        voicePitch={voicePitch}
        setVoicePitch={setVoicePitch}
      />
    </div>
  );
};
