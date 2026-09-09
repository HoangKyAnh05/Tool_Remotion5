import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptGenerator } from './components/ScriptGenerator';
import { StoryboardTimeline } from './components/StoryboardTimeline';
import { CenterPlayerStage } from './components/CenterPlayerStage';
import { InspectorPanel } from './components/InspectorPanel';
import { RenderModal } from './components/RenderModal';
import { SettingsModal } from './components/SettingsModal';
import { BatchVocabularyModal } from './components/BatchVocabularyModal';
import { Roadmap100Canvas } from './components/Roadmap100Canvas';
import { VideoSplitterModal } from './components/VideoSplitterModal';
import { VideoProject } from './types/video';
import { defaultProject } from './remotion/Root';
import { maxShowcaseProject } from './remotion/sampleShowcaseProject';
import { sampleHomestayProject } from './remotion/sampleHomestayProject';
import { synthesizeEdgeTTS } from './services/edgeTtsService';
import { WorkflowMode } from './components/SparkleBadge';

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

  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('fast');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isBatchVocabOpen, setIsBatchVocabOpen] = useState(false);
  const [isVideoSplitterOpen, setIsVideoSplitterOpen] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'roadmap100'>('editor');

  const [apiKeyGemini, setApiKeyGemini] = useState(
    () => localStorage.getItem('GEMINI_API_KEY') || ''
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
              project.voice.name || 'vi-VN-HoaiMyNeural',
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

  // Persist project changes safely (handles 5MB localStorage quota limit gracefully)
  useEffect(() => {
    try {
      localStorage.setItem('CURRENT_PROJECT', JSON.stringify(project));
    } catch (e) {
      console.warn('LocalStorage quota reached, saving lean project structure without large base64 buffers');
      try {
        const leanProject = {
          ...project,
          scenes: project.scenes.map((s) => ({
            ...s,
            // Keep local file URLs or remote URLs, omit huge base64 strings to prevent quota crash
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
    <div className="h-screen max-h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar with Workflow Mode Selector */}
      <Navbar
        project={project}
        setProject={setProject}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRender={() => setIsRenderOpen(true)}
        onOpenVideoSplitter={() => setIsVideoSplitterOpen(true)}
        isGenerating={isGenerating}
        activeView={activeView}
        setActiveView={setActiveView}
        workflowMode={workflowMode}
        setWorkflowMode={setWorkflowMode}
      />

      {/* Main Body: Either Roadmap 100 Days or Studio Video Editor */}
      {activeView === 'roadmap100' ? (
        <main className="flex-1 overflow-hidden">
          <Roadmap100Canvas
            project={project}
            setProject={setProject}
            onSwitchToStudio={() => setActiveView('editor')}
          />
        </main>
      ) : (
        <main className="flex-1 overflow-hidden w-full h-[calc(100vh-64px)] flex flex-col xl:flex-row">
          {/* CỘT TRÁI (28% Width): Phân cảnh & Kịch bản - Cuộn dọc độc lập */}
          <div className="w-full xl:w-[28%] h-full overflow-y-auto p-3 sm:p-4 space-y-4 border-r border-zinc-850/80 shrink-0">
            {/* Kịch bản AI / Soạn kịch bản */}
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
              workflowMode={workflowMode}
            />
          </div>

          {/* CỘT GIỮA (44% Width): KHUNG PREVIEW TRUNG TÂM (Remotion Player Canvas + Controls) */}
          <div className="w-full xl:w-[44%] h-full overflow-hidden shrink-0 flex flex-col">
            <CenterPlayerStage
              project={project}
              setProject={setProject}
            />
          </div>

          {/* CỘT PHẢI (28% Width): BẢNG ĐIỀU KHIỂN THUỘC TÍNH & HIỆU ỨNG (Inspector 3 Tabs) */}
          <div className="w-full xl:w-[28%] h-full overflow-y-auto shrink-0 border-l border-zinc-850/80">
            <InspectorPanel
              project={project}
              setProject={setProject}
              workflowMode={workflowMode}
            />
          </div>
        </main>
      )}

      {/* Video Splitter & Trimmer Modal */}
      <VideoSplitterModal
        isOpen={isVideoSplitterOpen}
        onClose={() => setIsVideoSplitterOpen(false)}
        project={project}
        setProject={setProject}
      />

      {/* Batch Vocabulary & Script Modal (Root Level to prevent Stacking Context clipping) */}
      <BatchVocabularyModal
        isOpen={isBatchVocabOpen}
        onClose={() => setIsBatchVocabOpen(false)}
        project={project}
        setProject={setProject}
        apiKeyPexels={apiKeyPexels}
      />

      {/* Render Modal */}
      <RenderModal
        project={project}
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
      />

      {/* Settings Modal */}
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
