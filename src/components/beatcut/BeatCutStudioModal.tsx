import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './TopBar';
import { Sidebar, SidebarTab } from './Sidebar';
import { EmptyState } from './EmptyState';
import { WaveformTimeline } from './WaveformTimeline';
import { BottomPlayer } from './BottomPlayer';
import { MarkerManagerModal } from './MarkerManagerModal';
import { ExportModal } from './ExportModal';
import { SettingsModal } from './SettingsModal';
import { CutSegmentsModal } from './CutSegmentsModal';
import { useBeatAudioPlayer } from '../../hooks/useBeatAudioPlayer';
import { 
  AudioMetadata, 
  BeatMarker, 
  ProjectData, 
  EngineStatus, 
  ProgressEvent
} from '../../types/beatcut';
import { decodeAudioSource, extractWaveformPeaks, extractQuickBeats } from '../../utils/beatAudioAnalyzer';

interface BeatCutStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToVideoSplitter?: (splitString: string, audioUrl?: string) => void;
  onApplyToStoryboard?: (splitString: string, audioUrl?: string) => void;
}

export const BeatCutStudioModal: React.FC<BeatCutStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyToVideoSplitter,
  onApplyToStoryboard,
}) => {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<SidebarTab>('detection');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isMarkersOpen, setIsMarkersOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSegmentsOpen, setIsSegmentsOpen] = useState<boolean>(false);

  // Audio & Project Data
  const [projectName, setProjectName] = useState<string>('Dự án Beat 1');
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [bpm, setBpm] = useState<number>(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  // Beat Detection & Markers
  const [allDetectedBeats, setAllDetectedBeats] = useState<BeatMarker[]>([]);
  const [manualMarkers, setManualMarkers] = useState<BeatMarker[]>([]);
  const [beatDensity, setBeatDensity] = useState<number>(50); // 0 to 100
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Engine & Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  // Audio Player Hook
  const player = useBeatAudioPlayer();

  // Check Engine on Mount
  useEffect(() => {
    if (window.electronAPI && typeof (window.electronAPI as any).checkEngine === 'function') {
      (window.electronAPI as any).checkEngine().then((status: EngineStatus) => {
        setEngineStatus(status);
      });

      if (typeof (window.electronAPI as any).onAudioProgress === 'function') {
        const unsubscribe = (window.electronAPI as any).onAudioProgress((p: ProgressEvent) => {
          setProgress(p);
        });
        return () => unsubscribe();
      }
    }
  }, []);

  // Filtered Markers based on Beat Density
  const activeMarkers = useMemo(() => {
    let filteredAuto: BeatMarker[] = [];

    if (allDetectedBeats.length > 0) {
      if (beatDensity <= 33) {
        // Chỉ lấy các phách 1 đầu khuôn nhạc (Nhịp mạnh - Bar Downbeats)
        filteredAuto = allDetectedBeats.filter((b) => b.type === 'strong_beat');
      } else if (beatDensity <= 66) {
        // Lấy các phách chính 1/4 nhịp (Quarter notes - Nhịp mạnh & Nhịp chuẩn)
        filteredAuto = allDetectedBeats.filter((b) => b.type === 'strong_beat' || b.type === 'beat');
      } else {
        filteredAuto = allDetectedBeats;
      }

      if (filteredAuto.length === 0) {
        filteredAuto = allDetectedBeats.filter((b) => b.type === 'strong_beat' || b.type === 'beat');
      }
    }

    const combined = [...filteredAuto, ...manualMarkers];
    combined.sort((a, b) => a.time - b.time);
    return combined;
  }, [allDetectedBeats, manualMarkers, beatDensity]);

  // Load Audio File Handler
  const handleLoadFile = useCallback(
    async (filePath: string, fileName: string, fileUrl: string, size?: number, fileBlob?: Blob | File) => {
      const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';
      setMetadata({
        fileName,
        filePath,
        duration: 0,
        size: size || 0,
        format: ext,
      });
      setProjectName(fileName.replace(/\.[^/.]+$/, ''));
      setAudioUrl(fileUrl);
      player.loadAudio(fileUrl);
      setSelectedMarkerId(null);

      // 1. Giải mã và vẽ Waveform + Tính nhịp tức thời trong 50ms qua Web Audio API
      try {
        const sourceToDecode = fileBlob || fileUrl;
        const audioBuffer = await decodeAudioSource(sourceToDecode);
        const duration = audioBuffer.duration;
        const peaks = extractWaveformPeaks(audioBuffer, 1500);
        const quick = extractQuickBeats(audioBuffer);

        setWaveform(peaks);
        setBpm(quick.bpm);
        setAllDetectedBeats(quick.beats);
        setMetadata((prev) => (prev ? { ...prev, duration } : prev));
      } catch (decodeErr: any) {
        console.warn('Web Audio immediate decode warning:', decodeErr);
      }

      // 2. Kích hoạt phân tích AI Librosa Engine chuyên sâu nếu có Electron API
      startAnalysis(filePath, fileName, fileBlob);
    },
    [player]
  );

  // Import Audio via Native Dialog or HTML5 File Picker
  const handleImportAudio = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).openAudioFile === 'function') {
      try {
        const res = await (window.electronAPI as any).openAudioFile();
        if (!res.canceled && res.filePath && res.fileName && res.fileUrl) {
          handleLoadFile(res.filePath, res.fileName, res.fileUrl, res.size);
          return;
        }
        if (res.canceled) return;
      } catch (err: any) {
        console.warn('Native open audio file dialog failed, falling back to input:', err);
      }
    }
    const el = document.getElementById('global-beatcut-audio-input') as HTMLInputElement;
    if (el) {
      el.click();
    }
  };

  // Drag-and-drop file support
  const handleFileDrop = (file: File) => {
    let filePath = '';
    if ((window.electronAPI as any)?.getPathForFile) {
      try {
        filePath = (window.electronAPI as any).getPathForFile(file);
      } catch {
        filePath = (file as any).path || '';
      }
    } else {
      filePath = (file as any).path || '';
    }

    const objectUrl = URL.createObjectURL(file);
    const fileUrl = filePath && (filePath.includes(':\\') || filePath.startsWith('/'))
      ? `file:///${filePath.replace(/\\/g, '/')}`
      : objectUrl;

    handleLoadFile(filePath || file.name, file.name, fileUrl, file.size, file);
  };

  // Start Real Beat Detection via Python Librosa
  const startAnalysis = async (pathOverride?: string, nameOverride?: string, blobOverride?: Blob | File) => {
    const targetPath = pathOverride || metadata?.filePath;
    const targetName = nameOverride || metadata?.fileName || 'audio.mp3';
    
    if (!window.electronAPI || typeof (window.electronAPI as any).analyzeAudio !== 'function') return;

    setIsAnalyzing(true);
    setProgress({ percent: 10, message: 'Đang khởi chạy AI Librosa Engine...' });

    try {
      let result: any = null;

      if (targetPath && (targetPath.includes(':\\') || targetPath.startsWith('/'))) {
        result = await (window.electronAPI as any).analyzeAudio(targetPath);
      } else if (blobOverride && (window.electronAPI as any).analyzeAudioBuffer) {
        const arrayBuf = await blobOverride.arrayBuffer();
        result = await (window.electronAPI as any).analyzeAudioBuffer(targetName, arrayBuf);
      } else if (targetPath) {
        result = await (window.electronAPI as any).analyzeAudio(targetPath);
      }

      if (result && result.success && result.data) {
        setBpm(result.data.bpm);
        if (result.data.waveform && result.data.waveform.length > 0) {
          setWaveform(result.data.waveform);
        }

        const beats: BeatMarker[] = (result.data.beats || []).map((b: any, index: number) => ({
          id: `beat-${index}-${b.time}`,
          time: b.time,
          strength: b.strength,
          type: b.type,
          source: 'auto',
        }));

        setAllDetectedBeats(beats);
        setMetadata((prev) => (prev ? { ...prev, duration: result.data.duration } : prev));
      }
    } catch (err: any) {
      console.warn('AI Librosa analysis note:', err);
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  // Cancel Analysis
  const handleCancelAnalysis = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).cancelAnalysis === 'function') {
      await (window.electronAPI as any).cancelAnalysis();
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  // Add Manual Marker
  const handleAddMarker = (time: number) => {
    const newMarker: BeatMarker = {
      id: `manual-${Date.now()}`,
      time: Number(time.toFixed(3)),
      strength: 0.8,
      type: 'custom',
      source: 'manual',
      label: `Điểm cắt ${manualMarkers.length + 1}`,
    };
    setManualMarkers((prev) => [...prev, newMarker]);
    setSelectedMarkerId(newMarker.id);
  };

  // Delete Marker
  const handleDeleteMarker = (id: string) => {
    setManualMarkers((prev) => prev.filter((m) => m.id !== id));
    setAllDetectedBeats((prev) => prev.filter((m) => m.id !== id));
    if (selectedMarkerId === id) {
      setSelectedMarkerId(null);
    }
  };

  // Clear all markers
  const handleClearAllMarkers = () => {
    setManualMarkers([]);
    setAllDetectedBeats([]);
    setSelectedMarkerId(null);
  };

  // Update Marker Properties
  const handleUpdateMarker = (id: string, updates: Partial<BeatMarker>) => {
    setManualMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    setAllDetectedBeats((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  // Navigation between Markers in Bottom Player
  const handlePrevMarker = () => {
    if (activeMarkers.length === 0) return;
    const pastMarkers = activeMarkers.filter((m) => m.time < player.currentTime - 0.1);
    if (pastMarkers.length > 0) {
      const target = pastMarkers[pastMarkers.length - 1];
      player.seek(target.time);
      setSelectedMarkerId(target.id);
    } else {
      player.seek(0);
    }
  };

  const handleNextMarker = () => {
    if (activeMarkers.length === 0) return;
    const futureMarkers = activeMarkers.filter((m) => m.time > player.currentTime + 0.1);
    if (futureMarkers.length > 0) {
      const target = futureMarkers[0];
      player.seek(target.time);
      setSelectedMarkerId(target.id);
    }
  };

  // Save Project Handler
  const handleSaveProject = async () => {
    const projectData: ProjectData = {
      version: '1.0.0',
      projectName,
      audioFileName: metadata?.fileName || 'audio.mp3',
      audioFilePath: metadata?.filePath || '',
      duration: metadata?.duration || 0,
      bpm,
      beatDensity,
      markers: activeMarkers,
      waveform,
      updatedAt: new Date().toISOString(),
    };

    if (window.electronAPI && typeof (window.electronAPI as any).saveProject === 'function') {
      const res = await (window.electronAPI as any).saveProject(projectData);
      if (res.success) {
        alert('Đã lưu Project thành công!');
      }
    } else {
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}.beatcut`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Open Project Handler
  const handleOpenProject = async () => {
    if (window.electronAPI && typeof (window.electronAPI as any).openProject === 'function') {
      const res = await (window.electronAPI as any).openProject();
      if (res.success && res.data) {
        const p = res.data;
        setProjectName(p.projectName);
        setBpm(p.bpm);
        setBeatDensity(p.beatDensity || 50);
        if (p.waveform) setWaveform(p.waveform);
        setAllDetectedBeats(p.markers.filter((m: BeatMarker) => m.source === 'auto'));
        setManualMarkers(p.markers.filter((m: BeatMarker) => m.source === 'manual'));
      }
    }
  };

  // Export File Handler
  const handleExportFile = async (format: 'json' | 'csv' | 'txt', content: string): Promise<boolean> => {
    if (window.electronAPI && typeof (window.electronAPI as any).exportData === 'function') {
      const res = await (window.electronAPI as any).exportData(format, content, `${projectName}_beats`);
      return res.success;
    } else {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}_beats.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
  };

  // Nạp nhanh toàn bộ mốc nhịp mạnh (hoặc active markers) sang Video Splitter & Clipboard
  const handleApplyQuickBeats = useCallback(() => {
    const strongBeats = activeMarkers.filter((m) => m.type === 'strong_beat');
    const targetMarkers = strongBeats.length > 0 ? strongBeats : activeMarkers;

    if (targetMarkers.length === 0) {
      alert('Chưa có mốc nhịp nào. Vui lòng phân tích âm thanh trước!');
      return;
    }

    const sorted = [...targetMarkers].sort((a, b) => a.time - b.time);
    const segmentsList: string[] = [];
    let prevStr = '00';

    sorted.forEach((m) => {
      const curStr = m.time.toFixed(2);
      segmentsList.push(`${prevStr} -${curStr}`);
      prevStr = curStr;
    });

    const splitString = segmentsList.join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(splitString);
    }

    if (onApplyToVideoSplitter) {
      onApplyToVideoSplitter(splitString, audioUrl);
    }
  }, [activeMarkers, audioUrl, onApplyToVideoSplitter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col overflow-hidden text-slate-100 font-sans animate-in fade-in duration-200">
      {/* Hidden File Input for Web HTML5 Fallback */}
      <input
        id="global-beatcut-audio-input"
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.aac"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileDrop(e.target.files[0]);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Top Bar Header */}
      <TopBar
        onImportAudio={handleImportAudio}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onOpenMarkers={() => setIsMarkersOpen(true)}
        onOpenSegments={() => setIsSegmentsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onApplyQuickBeats={handleApplyQuickBeats}
        onCloseStudio={onClose}
        engineStatus={engineStatus}
        isAnalyzing={isAnalyzing}
        progress={progress}
        hasAudio={Boolean(audioUrl)}
        projectName={projectName}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden bg-[#0c0d12]">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'markers') setIsMarkersOpen(true);
            if (tab === 'segments') setIsSegmentsOpen(true);
            if (tab === 'export') setIsExportOpen(true);
            if (tab === 'settings') setIsSettingsOpen(true);
          }}
          metadata={metadata}
          bpm={bpm}
          markersCount={activeMarkers.length}
          isAnalyzing={isAnalyzing}
          onStartAnalysis={() => startAnalysis()}
          onCancelAnalysis={handleCancelAnalysis}
          onApplyQuickBeats={handleApplyQuickBeats}
          hasAudio={Boolean(audioUrl)}
        />

        {/* Center Workspace Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0c0d12]">
          {!audioUrl ? (
            <EmptyState
              onImportClick={handleImportAudio}
              onFileDrop={handleFileDrop}
            />
          ) : (
            <WaveformTimeline
              waveform={waveform}
              duration={metadata?.duration || player.duration}
              currentTime={player.currentTime}
              markers={activeMarkers}
              selectedMarkerId={selectedMarkerId}
              onSelectMarker={(id) => setSelectedMarkerId(id)}
              onSeek={(time) => player.seek(time)}
              onAddMarker={handleAddMarker}
              onDeleteMarker={handleDeleteMarker}
              beatDensity={beatDensity}
              onChangeDensity={(d) => setBeatDensity(d)}
            />
          )}
        </div>
      </div>

      {/* Bottom Playback Control Bar */}
      <BottomPlayer
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={metadata?.duration || player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        playbackRate={player.playbackRate}
        onTogglePlay={player.togglePlay}
        onStop={player.stop}
        onSeek={player.seek}
        onSetVolume={player.setVolume}
        onToggleMute={player.toggleMute}
        onSetPlaybackRate={player.setPlaybackRate}
        onPrevMarker={handlePrevMarker}
        onNextMarker={handleNextMarker}
        disabled={!audioUrl}
      />

      {/* Modals */}
      <MarkerManagerModal
        isOpen={isMarkersOpen}
        onClose={() => setIsMarkersOpen(false)}
        markers={activeMarkers}
        selectedMarkerId={selectedMarkerId}
        onSelectMarker={(id) => setSelectedMarkerId(id)}
        onDeleteMarker={handleDeleteMarker}
        onClearAllMarkers={handleClearAllMarkers}
        onUpdateMarker={handleUpdateMarker}
        onSeek={(time) => player.seek(time)}
        audioUrl={audioUrl}
        onApplyToVideoSplitter={onApplyToVideoSplitter}
        onApplyToStoryboard={onApplyToStoryboard}
      />

      <CutSegmentsModal
        isOpen={isSegmentsOpen}
        onClose={() => setIsSegmentsOpen(false)}
        markers={activeMarkers}
        totalDuration={metadata?.duration || player.duration}
        onSeekAndPlay={(time) => {
          player.seek(time);
          player.play();
          setIsSegmentsOpen(false);
        }}
        audioUrl={audioUrl}
        onApplyToVideoSplitter={onApplyToVideoSplitter}
        onApplyToStoryboard={onApplyToStoryboard}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={{
          version: '1.0.0',
          projectName,
          audioFileName: metadata?.fileName || 'audio.mp3',
          audioFilePath: metadata?.filePath || '',
          duration: metadata?.duration || 0,
          bpm,
          beatDensity,
          markers: activeMarkers,
          waveform,
          updatedAt: new Date().toISOString(),
        }}
        activeMarkers={activeMarkers}
        onExportFile={handleExportFile}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        engineStatus={engineStatus}
        onRefreshEngine={async () => {
          if (window.electronAPI && typeof (window.electronAPI as any).checkEngine === 'function') {
            const status = await (window.electronAPI as any).checkEngine();
            setEngineStatus(status);
          }
        }}
      />
    </div>
  );
};
