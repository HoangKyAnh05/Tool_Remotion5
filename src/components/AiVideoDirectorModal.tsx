import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  FileJson,
  Sparkles,
  Clipboard,
  Film,
  Camera,
  Play,
  Lightbulb,
  ArrowRight,
  Layers,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  FolderPlus,
  Folder,
  FolderCheck,
  CopyCheck,
  ChevronDown,
  Key,
  Settings,
  ExternalLink,
  Zap
} from 'lucide-react';
import { VideoProject, Scene } from '../types/video';
import { aiVideoDirectorService, MissingSourceSuggestion } from '../services/aiVideoDirectorService';

export interface SourceProjectBundle {
  id: string;
  name: string;
  topic: string;
  duration: string;
  sources: string[];
  createdAt: number;
}

interface AiVideoDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  initialTab?: 'copy_prompt' | 'paste_json' | 'missing_sources';
  onNavigateToStudio?: () => void;
}

const DEFAULT_SOURCE_PROJECTS: SourceProjectBundle[] = [
  {
    id: 'homestay_sapa',
    name: 'Homestay Sa Pa Trải Nghiệm',
    topic: 'Video Giới Thiệu Homestay & Trải Nghiệm Khách Hàng Sapa',
    duration: '30-45 giây',
    sources: [
      'Cảnh quay ăn BBQ',
      'Cảnh quay phòng',
      'Mountain view',
      'Sapa',
      'Vườn hoa',
      'Phòng homestay (có tổ chức sinh nhật cho khách)'
    ],
    createdAt: 1710000000000
  },
  {
    id: 'badminton_40',
    name: 'Khóa Học Dạy Cầu Lông 4.0',
    topic: 'Phương pháp dạy cầu lông 4.0 - Học ở sân 1, về nhà tự luyện 10 (Tuyển sinh & Đòn bẩy công nghệ)',
    duration: '36 giây',
    sources: [
      'tôi cho học viên học ve cầu',
      'Source App học cầu lông (lướt kho 500 video & sơ đồ chân)',
      'Source TikTok động tác chuẩn',
      'tôi làm mẫu',
      'tôi cho học viên học ve chém',
      'tôi đánh đôi với đối căng',
      'tôi đi đánh và cười nhìn máy quay'
    ],
    createdAt: 1710000001000
  }
];

const SAMPLE_BADMINTON_TOPIC = 'Phương pháp dạy 4.0 - Học ở sân 1, về nhà tự luyện 10 (Tuyển sinh & Đòn bẩy công nghệ)';

const SAMPLE_BADMINTON_JSON = `{
  "title": "Phương pháp dạy 4.0 - Học ở sân 1, về nhà tự luyện 10",
  "goal": "Tuyển sinh lớp cầu lông, nhấn mạnh App tự luyện 500 video độc quyền",
  "totalDuration": 36,
  "musicMood": "Hiphop beat / Tech Lofi dứt khoát",
  "scenes": [
    {
      "order": 1,
      "timeRange": "00:00 - 00:04",
      "durationSeconds": 4,
      "sourceName": "tôi cho học viên học ve cầu",
      "cutAction": "Học viên đánh hỏng hoặc lóng ngóng. Tốc độ 1.0x",
      "voiceOver": "Đến sân tập 1-2 tiếng mỗi tuần, liệu có tiến bộ nổi không?",
      "screenText": "HỌC CẦU LÔNG TUẦN 1 BUỔI LIỆU CÓ ĂN THUA?",
      "vfx": "fx_glitch_scan",
      "sfx": "sfx_glitch",
      "transition": "digital_glitch",
      "cameraEffect": "zoom_in",
      "colorFilter": "filter_vintage_film"
    },
    {
      "order": 2,
      "timeRange": "00:04 - 00:10",
      "durationSeconds": 6,
      "sourceName": "Source App học cầu lông",
      "cutAction": "Chèn video màn hình App vào khung hình Mockup điện thoại iPhone đặt ở giữa thảm sân",
      "voiceOver": "Bí quyết là học viên của mình được cấp tài khoản app: tự ôn lý thuyết và bài tập bộ chân ở nhà.",
      "screenText": "Học lý thuyết & Bộ pháp qua App 4.0",
      "vfx": "fx_sparks",
      "sfx": "sfx_whoosh",
      "transition": "zoom_in",
      "cameraEffect": "zoom_in",
      "colorFilter": "filter_teal_orange"
    },
    {
      "order": 3,
      "timeRange": "00:10 - 00:18",
      "durationSeconds": 8,
      "sourceName": "Source App (lướt kho 500 video) + TikTok chuẩn",
      "cutAction": "Chia đôi màn hình: Trái lướt kho 500 bài tập trên app, Phải là TikTok động tác chuẩn. Tua 1.5x",
      "voiceOver": "Hơn 500 video từ cơ bản đến nâng cao, chuẩn từng góc vung vợt, xem đi xem lại không lo quên bài.",
      "screenText": "Kho 500+ bài tập chuẩn hóa",
      "vfx": "fx_light_leak",
      "sfx": "sfx_ding",
      "transition": "slide_left",
      "cameraEffect": "pan_left",
      "colorFilter": "filter_fresh_glow"
    },
    {
      "order": 4,
      "timeRange": "00:18 - 00:26",
      "durationSeconds": 8,
      "sourceName": "tôi làm mẫu + học viên ve chém",
      "cutAction": "Bạn thị phạm 1 nhịp, học viên thực hành ve chém thoát tay, cầu cuộn qua lưới",
      "voiceOver": "Lên sân, thầy chỉ cần nắn lại điểm tiếp xúc là đánh thoát tay ngay, không mất thời gian dạy lại từ đầu.",
      "screenText": "Lên sân thực hành: Vào phom cực nhanh!",
      "vfx": "fx_snapshot_3x",
      "sfx": "sfx_whoosh",
      "transition": "flash_white",
      "cameraEffect": "subtle_float",
      "colorFilter": "filter_teal_orange"
    },
    {
      "order": 5,
      "timeRange": "00:26 - 00:32",
      "durationSeconds": 6,
      "sourceName": "tôi đánh đôi với đối căng",
      "cutAction": "Pha phối hợp giằng co nhanh giữa bạn và đồng đội",
      "voiceOver": "Học đúng phương pháp thì tiến bộ nhanh gấp 3 lần. Đừng tập mò nữa!",
      "screenText": "Tiến bộ nhanh gấp 3 lần!",
      "vfx": "fx_glitch_scan",
      "sfx": "sfx_cinematic_boom",
      "transition": "digital_glitch",
      "cameraEffect": "zoom_out",
      "colorFilter": "filter_cyberpunk_neon"
    },
    {
      "order": 6,
      "timeRange": "00:32 - 00:36",
      "durationSeconds": 4,
      "sourceName": "tôi đi đánh và cười nhìn máy quay",
      "cutAction": "Bạn nhìn máy quay cười tươi, chỉ tay xuống góc dưới kêu gọi hành động",
      "voiceOver": "Nhắn cho mình để nhận lộ trình tập luyện bài bản nhé!",
      "screenText": "Đăng ký nhận lộ trình ngay!",
      "vfx": "fx_sparks",
      "sfx": "sfx_ding",
      "transition": "fade",
      "cameraEffect": "none",
      "colorFilter": "filter_teal_orange"
    }
  ],
  "missingSources": [
    {
      "title": "Cận cảnh ngón tay cầm cán vợt (Micro Grip)",
      "howToShoot": "Đặt máy cách tay 30-40cm. Quay thao tác ngón cái tì lên cạnh vát của cán khi chuyển từ cán thuận sang cán trái tay (backhand bevel/thumb grip).",
      "purpose": "Làm clip hướng dẫn chi tiết cách cầm vợt chuẩn xác, chèn phóng to vào các bài sửa kỹ thuật."
    },
    {
      "title": "Góc đặt máy bệt sát mặt thảm bắt bộ chân (Footwork Low-Angle)",
      "howToShoot": "Đặt camera nằm bệt sát mặt sàn thảm xanh, ngửa nhẹ góc máy lên. Bắt trọn bước bật tách chân (split-step), bước lùi chéo và bước đè lưới.",
      "purpose": "Dùng làm tư liệu minh họa cho các bài giảng về di chuyển bộ pháp, đồng bộ với sơ đồ trên App."
    },
    {
      "title": "Góc nhìn thứ nhất (POV - Action Cam trên ngực/trán)",
      "howToShoot": "Đeo máy quay hành trình trước ngực khi bạn trực tiếp đánh đơn hoặc đánh đôi với đối mạnh.",
      "purpose": "Tạo cảm giác chân thật như chính người xem đang đứng đối đầu với các đường cầu 300 km/h, giữ chân người xem cực tốt."
    },
    {
      "title": "Cảnh chỉnh sửa uốn nắn 1-1 (Intimate Coaching)",
      "howToShoot": "Góc ngang bán thân. Bạn đứng sau lưng học viên, trực tiếp cầm tay học viên bẻ góc cổ tay và mở góc vung vai.",
      "purpose": "Minh chứng trực quan cho sự tận tụy, nhiệt tình và phương pháp kèm cặp sát sao của bạn."
    },
    {
      "title": "Cú đập nhảy siêu chậm (Jump Smash Super Slow-Motion 120fps/240fps)",
      "howToShoot": "Bật chế độ quay 120fps/240fps góc ngang hông. Bắt trọn từ lúc dậm nhảy hai chân, thân người uốn cong hình cánh cung đến khi vung vợt đập nổ quả cầu.",
      "purpose": "Dùng làm các đoạn chuyển cảnh đắt giá, khớp đúng nhịp drop nhạc để flex kỹ năng."
    },
    {
      "title": "Quy trình chuẩn bị chuyên nghiệp trước giờ đấu (Pre-match Routine)",
      "howToShoot": "Quay cận các thao tác: Bóc băng dính quấn cốt vợt mới, thắt chặt dây giày thi đấu, xịt lạnh khớp cơ, pha nước điện giải.",
      "purpose": "Dùng làm 3 giây mở đầu (Intro Hook) cho các video Vlog, tạo phong thái vận động viên chỉn chu."
    },
    {
      "title": "Cảnh nhặt cầu & kết thúc buổi tập (Cooldown & Culture)",
      "howToShoot": "Đặt góc rộng bao quát toàn sân. Bạn cùng học viên cầm ống thu cầu đi gom cầu, dùng vợt múc cầu lên tay điệu nghệ và cười nói tự nhiên.",
      "purpose": "Thể hiện văn hóa lớp học vui vẻ, gắn kết, dùng làm đoạn kết (Outro) ấm áp cho video."
    },
    {
      "title": "Phỏng vấn nhanh học viên sau buổi tập (Student Testimonial)",
      "howToShoot": "Quay cận mặt học viên mồ hôi còn ướt áo, hỏi ngắn 1 câu: 'Sau buổi nay ve cầu thấy sao em?' - Trả lời: 'Thầy chỉnh ngón cái xong em ve thoát tay bay tận cuối sân luôn thầy ạ!'.",
      "purpose": "Tạo bằng chứng xã hội (Social Proof) xác thực nhất, đánh tan nghi ngại của học viên mới muốn đăng ký."
    },
    {
      "title": "Cảnh đánh hỏng hài hước / Hậu trường (Bloopers & Outtakes)",
      "howToShoot": "Bật máy quay liên tục để bắt các pha đập hụt cầu gió, vấp chân trượt ngã nhẹ, hoặc đập cầu bay trúng lưng đồng đội.",
      "purpose": "Làm đoạn mồi (Hook) gây cười ở 2 giây đầu video hoặc chèn âm thanh meme để tạo tính giải trí, viral."
    },
    {
      "title": "Góc quay toàn cảnh từ trên cao (High-Angle / Drone / Khán đài)",
      "howToShoot": "Đặt máy trên khán đài cao hoặc gắn chân máy dài ở góc tường nhìn chéo xuống toàn bộ nửa sân.",
      "purpose": "Phân tích chiến thuật chạy chỗ, cách luân chuyển vị trí khi tấn công/phòng thủ trong đánh đôi một cách bài bản."
    }
  ]
}`;

export const AiVideoDirectorModal: React.FC<AiVideoDirectorModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
  initialTab = 'copy_prompt',
  onNavigateToStudio
}) => {
  const [activeTab, setActiveTab] = useState<'copy_prompt' | 'paste_json' | 'missing_sources'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Quản lý danh sách các Dự án / Gói Source Video từ localStorage
  const [projectsList, setProjectsList] = useState<SourceProjectBundle[]>(() => {
    const saved = localStorage.getItem('AI_DIRECTOR_PROJECT_BUNDLES_V2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Migration từ lưu đơn lẻ cũ
    const oldSavedSources = localStorage.getItem('AI_DIRECTOR_USER_SAVED_SOURCES');
    if (oldSavedSources) {
      try {
        const parsedOld = JSON.parse(oldSavedSources);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          const oldTopic = localStorage.getItem('AI_DIRECTOR_SAVED_TOPIC') || DEFAULT_SOURCE_PROJECTS[0].topic;
          const oldDuration = localStorage.getItem('AI_DIRECTOR_SAVED_DURATION') || DEFAULT_SOURCE_PROJECTS[0].duration;
          return [
            {
              id: 'my_saved_project',
              name: 'Gói Source Của Tôi',
              topic: oldTopic,
              duration: oldDuration,
              sources: parsedOld,
              createdAt: Date.now()
            },
            ...DEFAULT_SOURCE_PROJECTS
          ];
        }
      } catch (e) {}
    }
    return DEFAULT_SOURCE_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('AI_DIRECTOR_ACTIVE_PROJECT_ID_V2') || 'homestay_sapa';
  });

  // Dự án / Gói Source hiện tại
  const currentProject = projectsList.find(p => p.id === activeProjectId) || projectsList[0] || DEFAULT_SOURCE_PROJECTS[0];

  // Lưu danh sách dự án vào localStorage mỗi khi thay đổi
  React.useEffect(() => {
    localStorage.setItem('AI_DIRECTOR_PROJECT_BUNDLES_V2', JSON.stringify(projectsList));
  }, [projectsList]);

  React.useEffect(() => {
    localStorage.setItem('AI_DIRECTOR_ACTIVE_PROJECT_ID_V2', activeProjectId);
  }, [activeProjectId]);

  // Cập nhật thông tin của dự án hiện tại
  const updateCurrentProject = (patch: Partial<SourceProjectBundle>) => {
    setProjectsList(prev => prev.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, ...patch };
      }
      return p;
    }));
  };

  // Trạng thái tạo dự án mới
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTopic, setNewProjectTopic] = useState('');
  const [isCopySourcesFromCurrent, setIsCopySourcesFromCurrent] = useState(false);

  // Trạng thái đổi tên dự án hiện tại
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Xử lý tạo dự án mới
  const handleCreateNewProject = () => {
    const pName = newProjectName.trim() || `Dự Án Mới #${projectsList.length + 1}`;
    const pTopic = newProjectTopic.trim() || `Video Giới Thiệu ${pName}`;
    const newProj: SourceProjectBundle = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: pName,
      topic: pTopic,
      duration: '30-45 giây',
      sources: isCopySourcesFromCurrent ? [...currentProject.sources] : [],
      createdAt: Date.now()
    };
    setProjectsList(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setIsCreatingProject(false);
    setNewProjectName('');
    setNewProjectTopic('');
    setIsCopySourcesFromCurrent(false);
  };

  // Nhân bản dự án hiện tại
  const handleDuplicateCurrentProject = () => {
    const clone: SourceProjectBundle = {
      ...currentProject,
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${currentProject.name} (Bản sao)`,
      createdAt: Date.now()
    };
    setProjectsList(prev => [clone, ...prev]);
    setActiveProjectId(clone.id);
  };

  // Đổi tên dự án
  const handleSaveRename = () => {
    if (renameInput.trim()) {
      updateCurrentProject({ name: renameInput.trim() });
    }
    setIsRenamingProject(false);
    setRenameInput('');
  };

  // Xóa dự án
  const handleDeleteCurrentProject = () => {
    if (projectsList.length <= 1) {
      alert('Bạn phải giữ ít nhất 1 dự án / gói source!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ dự án "${currentProject.name}"?`)) {
      const remaining = projectsList.filter(p => p.id !== currentProject.id);
      setProjectsList(remaining);
      setActiveProjectId(remaining[0].id);
    }
  };

  // Thêm source mới vào dự án đang chọn
  const [newSourceText, setNewSourceText] = useState('');
  const [isRawTextMode, setIsRawTextMode] = useState(false);
  const [rawTextInput, setRawTextInput] = useState('');
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);

  const handleAddSource = (text?: string) => {
    const content = (text ?? newSourceText).trim();
    if (!content) return;
    
    // Nếu dán nhiều dòng cùng lúc
    const lines = content.split('\n').map(l => l.replace(/^\d+[\.\-\)]\s*/, '').trim()).filter(Boolean);
    const updated = lines.length > 1
      ? [...currentProject.sources, ...lines]
      : [...currentProject.sources, lines[0]];
    
    updateCurrentProject({ sources: updated });
    setNewSourceText('');
  };

  // Xóa 1 source tại vị trí index
  const handleDeleteSource = (index: number) => {
    const updated = currentProject.sources.filter((_, i) => i !== index);
    updateCurrentProject({ sources: updated });
  };

  // Xóa sạch toàn bộ danh sách source của dự án hiện tại
  const handleClearAllSources = () => {
    if (confirm(`Bạn có chắc muốn xóa tất cả source trong gói "${currentProject.name}"?`)) {
      updateCurrentProject({ sources: [] });
    }
  };

  // Tạo chuỗi text định dạng cho prompt
  const getFormattedSourcesText = () => {
    return currentProject.sources.map((src, idx) => `${idx + 1}. "${src}"`).join('\n');
  };

  // Chuyển sang chỉnh sửa Raw text
  const handleToggleRawTextMode = () => {
    if (!isRawTextMode) {
      setRawTextInput(getFormattedSourcesText());
      setIsRawTextMode(true);
    } else {
      const parsed = rawTextInput
        .split('\n')
        .map(l => l.replace(/^\d+[\.\-\)]\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
      updateCurrentProject({ sources: parsed });
      setIsRawTextMode(false);
    }
  };

  // State cho Tab 2: Paste JSON
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedProjectData, setParsedProjectData] = useState<any | null>(null);
  const [parsedScenes, setParsedScenes] = useState<Scene[]>([]);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);

  // State cho Tab 3: Missing Sources
  const [missingSourcesList, setMissingSourcesList] = useState<MissingSourceSuggestion[]>([]);

  // Quản lý AI API Key (Hỗ trợ cả OpenAI sk-... và Gemini AIza...)
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('AI_API_KEY') ||
      localStorage.getItem('OPENAI_API_KEY') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      ((import.meta as any).env?.VITE_OPENAI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      ''
    );
  });
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [isKeySavedToast, setIsKeySavedToast] = useState(false);

  const handleSaveApiKey = () => {
    const trimmed = geminiApiKey.trim();
    localStorage.setItem('AI_API_KEY', trimmed);
    localStorage.setItem('OPENAI_API_KEY', trimmed);
    localStorage.setItem('GEMINI_API_KEY', trimmed);
    setIsKeySavedToast(true);
    setTimeout(() => setIsKeySavedToast(false), 2500);
  };

  // State tạo tự động bằng AI
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);

  // Xử lý tạo và sao chép Prompt
  const handleCopyPrompt = async () => {
    const prompt = aiVideoDirectorService.buildMasterPrompt(
      getFormattedSourcesText(),
      currentProject.topic,
      currentProject.duration
    );
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopiedPrompt(true);
      setTimeout(() => setIsCopiedPrompt(false), 3000);
    } catch (e) {
      alert('Không thể sao chép tự động. Vui lòng thử lại!');
    }
  };

  // Dán từ clipboard
  const handlePasteJsonFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      handleValidateJson(text);
    } catch (e) {
      setParseError('Không thể tự động đọc clipboard. Hãy nhấn Ctrl + V vào ô bên dưới!');
    }
  };

  // Nạp JSON mẫu
  const handleLoadSampleJson = () => {
    setJsonInput(SAMPLE_BADMINTON_JSON);
    handleValidateJson(SAMPLE_BADMINTON_JSON);
  };

  // Phân tích và kiểm tra JSON
  const handleValidateJson = (text: string) => {
    setParseError(null);
    setParsedProjectData(null);
    setParsedScenes([]);
    if (!text.trim()) return;

    try {
      const result = aiVideoDirectorService.parseAiScriptJson(text);
      setParsedProjectData(result.projectData);
      setParsedScenes(result.scenes);
      if (result.projectData.missingSources && result.projectData.missingSources.length > 0) {
        setMissingSourcesList(result.projectData.missingSources);
      }
    } catch (err: any) {
      setParseError(err.message || 'Cấu trúc JSON chưa đúng!');
    }
  };

  const handleGenerateWithAi = async (forceSemantic = false) => {
    setIsGeneratingWithAi(true);
    setAiGenError(null);
    try {
      let result;
      if (forceSemantic || !geminiApiKey.trim()) {
        result = aiVideoDirectorService.generateFallbackScript(
          getFormattedSourcesText(),
          currentProject.topic,
          currentProject.duration
        );
      } else if (geminiApiKey.trim().startsWith('sk-')) {
        result = await aiVideoDirectorService.generateDirectorWithOpenAI(
          getFormattedSourcesText(),
          currentProject.topic,
          currentProject.duration,
          geminiApiKey.trim()
        );
      } else {
        result = await aiVideoDirectorService.generateDirectorWithGemini(
          getFormattedSourcesText(),
          currentProject.topic,
          currentProject.duration,
          geminiApiKey.trim()
        );
      }
      setParsedProjectData(result.projectData);
      setParsedScenes(result.scenes);
      setJsonInput(result.rawJsonText);
      if (result.projectData.missingSources && result.projectData.missingSources.length > 0) {
        setMissingSourcesList(result.projectData.missingSources);
      }
      setActiveTab('paste_json');
    } catch (err: any) {
      setAiGenError(err.message || 'Lỗi khi gọi AI. Vui lòng kiểm tra lại API Key hoặc thử bộ sinh thông minh!');
    } finally {
      setIsGeneratingWithAi(false);
    }
  };

  // Áp dụng JSON vào Remotion Studio
  const handleApplyToStudio = () => {
    if (parsedScenes.length === 0) {
      try {
        const { projectData, scenes } = aiVideoDirectorService.parseAiScriptJson(jsonInput);
        setParsedProjectData(projectData);
        setParsedScenes(scenes);
        applyScenesToProject(projectData, scenes);
      } catch (err: any) {
        setParseError(err.message || 'Vui lòng kiểm tra lại JSON!');
        return;
      }
    } else {
      applyScenesToProject(parsedProjectData, parsedScenes);
    }
  };

  const applyScenesToProject = (projectData: any, scenes: Scene[]) => {
    setProject((prev) => ({
      ...prev,
      title: projectData.title || prev.title,
      topic: projectData.goal || projectData.title || prev.topic,
      totalDuration: projectData.totalDuration || scenes.reduce((acc, s) => acc + (s.audioDuration || 4), 0),
      scenes: scenes.map((s, idx) => ({
        ...s,
        order: idx + 1
      }))
    }));

    setIsAppliedSuccess(true);
    setTimeout(() => {
      setIsAppliedSuccess(false);
      onClose();
      if (onNavigateToStudio) onNavigateToStudio();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Video Director Planner</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Quản Lý Gói Source & Dựng Video
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Lưu trữ các gói source video theo từng dự án → Copy prompt AI → Dán JSON tự động sinh phân cảnh Remotion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                geminiApiKey.trim()
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="Cấu hình OpenAI (sk-...) hoặc Google Gemini API Key để sinh kịch bản tự động bằng AI Cloud"
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {geminiApiKey.trim().startsWith('sk-')
                  ? '🟢 OpenAI (GPT-4o)'
                  : geminiApiKey.trim().startsWith('AIza')
                  ? '🟢 Gemini AI Cloud'
                  : geminiApiKey.trim()
                  ? '🟢 AI Cloud Active'
                  : '⚡ AI Ngữ Cảnh Tự Động'}
              </span>
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thanh Cấu Hình AI API Key (Khi mở) */}
        {showApiKeyConfig && (
          <div className="bg-slate-900 text-white px-6 py-3.5 border-b border-slate-800 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100">
                  Cấu hình OpenAI API Key (sk-...) hoặc Google Gemini API Key (AI Cloud Đạo Diễn):
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                  {geminiApiKey.trim().startsWith('sk-') ? '✓ OpenAI GPT-4o-mini' : geminiApiKey.trim().startsWith('AIza') ? '✓ Google Gemini Flash' : '⚡ Tự động nhận diện'}
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>OpenAI Keys</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Dán OpenAI Key (sk-...) hoặc Gemini Key (AIza...) vào đây..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Key</span>
              </button>
              {geminiApiKey.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setGeminiApiKey('');
                    localStorage.removeItem('AI_API_KEY');
                    localStorage.removeItem('OPENAI_API_KEY');
                    localStorage.removeItem('GEMINI_API_KEY');
                    setIsKeySavedToast(true);
                    setTimeout(() => setIsKeySavedToast(false), 2500);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  title="Xóa Key để chuyển về AI Ngữ Cảnh Thông Minh Tích Hợp"
                >
                  Xóa Key
                </button>
              )}
            </div>

            {isKeySavedToast && (
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã lưu cấu hình AI Key thành công! Hệ thống sẵn sàng sinh kịch bản.</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('copy_prompt')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'copy_prompt'
                ? 'bg-white text-emerald-800 border-slate-200 shadow-sm -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Copy className="w-4 h-4 text-emerald-600" />
            <span>1. 📋 Gói Source & Copy Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste_json')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'paste_json'
                ? 'bg-white text-indigo-800 border-slate-200 shadow-sm -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileJson className="w-4 h-4 text-indigo-600" />
            <span>2. 📥 Dán JSON (Paste JSON)</span>
            {parsedScenes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missing_sources')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'missing_sources'
                ? 'bg-white text-amber-800 border-slate-200 shadow-sm -mb-px'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>3. 💡 10 Source Cần Quay Bù</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          
          {/* ========================================================================= */}
          {/* TAB 1: COPY PROMPT AI (QUẢN LÝ DỰ ÁN & GÓI SOURCE) */}
          {/* ========================================================================= */}
          {activeTab === 'copy_prompt' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* THANH QUẢN LÝ DỰ ÁN & GÓI SOURCE VIDEO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Gói Dự Án / Nhóm Source Video:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingProject(!isCreatingProject);
                        setIsRenamingProject(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                      title="Tạo thêm 1 gói dự án mới với danh sách source video riêng biệt"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo Dự Án Mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDuplicateCurrentProject}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs transition-colors"
                      title="Nhân bản dự án này và toàn bộ danh sách source hiện có"
                    >
                      <CopyCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Nhân Bản</span>
                    </button>

                    {projectsList.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentProject}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                        title="Xóa dự án hiện tại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Dự Án</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Tạo Dự Án Mới (Khi nhấn nút Tạo Dự Án Mới) */}
                {isCreatingProject && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-emerald-700" />
                      <span>Tạo Dự Án Mới / Gói Source Riêng Biệt:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Tên dự án (vd: Homestay Đà Lạt, Tour Sa Pa, Bất Động Sản...)"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                      />
                      <input
                        type="text"
                        value={newProjectTopic}
                        onChange={(e) => setNewProjectTopic(e.target.value)}
                        placeholder="Chủ đề mặc định (vd: Giới thiệu căn hộ view đồi thông...)"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-emerald-900 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCopySourcesFromCurrent}
                          onChange={(e) => setIsCopySourcesFromCurrent(e.target.checked)}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span>Sao chép danh sách source từ dự án hiện tại</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsCreatingProject(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateNewProject}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          Lưu & Bắt Đầu Dự Án
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách các tab dự án / Chọn nhanh dự án */}
                <div className="flex flex-wrap items-center gap-2">
                  {projectsList.map((proj) => {
                    const isActive = proj.id === currentProject.id;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          setIsRenamingProject(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isActive
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                      >
                        <FolderCheck className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                        <span>{proj.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {proj.sources.length} src
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Đổi tên dự án hiện tại */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-xs">
                  {isRenamingProject ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        placeholder="Nhập tên mới cho dự án..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveRename}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRenamingProject(false)}
                        className="px-2 py-1 text-slate-500"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>Đang chọn: <strong className="text-slate-900">{currentProject.name}</strong> ({currentProject.sources.length} source video)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRenameInput(currentProject.name);
                          setIsRenamingProject(true);
                        }}
                        className="text-[11px] text-emerald-700 hover:underline flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Đổi tên</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chủ đề video */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>1. Chủ đề & Mục tiêu video:</span>
                  </label>
                  <input
                    type="text"
                    value={currentProject.topic}
                    onChange={(e) => updateCurrentProject({ topic: e.target.value })}
                    placeholder="Ví dụ: Giới thiệu phòng nghỉ & Trải nghiệm săn mây Homestay Sa Pa..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium shadow-sm"
                  />
                </div>

                {/* Thời lượng mong muốn */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    2. Thời lượng mong muốn:
                  </label>
                  <input
                    type="text"
                    value={currentProject.duration}
                    onChange={(e) => updateCurrentProject({ duration: e.target.value })}
                    placeholder="30-45 giây (hoặc 1 phút)..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* Danh sách các source video đang có (Tự nhớ & Xóa từng source trong gói dự án) */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3. Danh sách các Source Video trong dự án "{currentProject.name}":</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {currentProject.sources.length} source đã lưu
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleRawTextMode}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isRawTextMode ? 'Xem dạng Thẻ' : 'Sửa dạng Text'}</span>
                    </button>

                    {currentProject.sources.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSources}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="Xóa tất cả source video trong dự án này"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa tất cả</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ô Thêm nhanh Source Video */}
                {!isRawTextMode && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSourceText}
                      onChange={(e) => setNewSourceText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSource();
                        }
                      }}
                      placeholder="Nhập tên source video mới... (ví dụ: Cảnh quay ăn BBQ, Phòng homestay...) rồi nhấn Enter"
                      className="flex-1 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSource()}
                      disabled={!newSourceText.trim()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Source</span>
                    </button>
                  </div>
                )}

                {/* Danh sách hiển thị */}
                {isRawTextMode ? (
                  <textarea
                    value={rawTextInput}
                    onChange={(e) => setRawTextInput(e.target.value)}
                    rows={6}
                    placeholder={`1. "Cảnh quay ăn BBQ"\n2. "Cảnh quay phòng"\n3. "Mountain view"...`}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono leading-relaxed"
                  />
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-1.5">
                    {currentProject.sources.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Chưa có source video nào trong gói này. Hãy nhập tên cảnh quay ở ô trên rồi bấm <strong>"Thêm Source"</strong>!
                      </div>
                    ) : (
                      currentProject.sources.map((src, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2.5 bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-xl shadow-xs group transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {src}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSource(index)}
                            className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
                            title={`Xóa "${src}" khỏi danh sách`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* AI Generation Error Message */}
              {aiGenError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{aiGenError}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/80">
                    <button
                      type="button"
                      onClick={() => handleGenerateWithAi(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Sinh Kịch Bản Bằng AI Ngữ Cảnh (Tích Hợp Sẵn)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyConfig(true)}
                      className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5 text-rose-700" />
                      <span>⚙️ Cập nhật Gemini API Key</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: 1-Click AI Gen + Manual Copy Prompt */}
              <div className="pt-2 space-y-2.5">
                {/* 1-Click AI Generator Button */}
                <button
                  type="button"
                  onClick={() => handleGenerateWithAi(false)}
                  disabled={isGeneratingWithAi || currentProject.sources.length === 0}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-700 hover:from-emerald-800 hover:via-teal-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-200/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingWithAi ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      <span>🤖 GEMINI AI ĐANG PHÂN TÍCH SOURCE & TỰ ĐỘNG TẠO PHÂN CẢNH...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ DÙNG AI TỰ ĐỘNG SINH KỊCH BẢN & PHÂN CẢNH NGAY (1-CLICK)</span>
                    </>
                  )}
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`flex-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                      isCopiedPrompt
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {isCopiedPrompt ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ĐÃ SAO CHÉP MASTER PROMPT!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-700" />
                        <span>📋 Sao Chép Prompt (Gửi ChatGPT/Claude)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('paste_json')}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Đã có JSON? Sang Dán</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DÁN JSON (PASTE JSON) */}
          {/* ========================================================================= */}
          {activeTab === 'paste_json' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="text-xs text-slate-600">
                  Dán đoạn mã JSON do AI tạo ra để ứng dụng tự động dựng phân cảnh:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAi(false)}
                    disabled={isGeneratingWithAi}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    title="Gọi Gemini AI sinh lại JSON tự động theo source hiện tại"
                  >
                    {isGeneratingWithAi ? (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>⚡ AI Sinh Lại JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePasteJsonFromClipboard}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Dán từ Clipboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleJson}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
                  >
                    <span>⚡ Mẫu Cầu Lông</span>
                  </button>
                </div>
              </div>

              {/* AI Generation Error on Tab 2 */}
              {aiGenError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{aiGenError}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/80">
                    <button
                      type="button"
                      onClick={() => handleGenerateWithAi(true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Sinh Bằng AI Ngữ Cảnh Tích Hợp (Không cần Key)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyConfig(true)}
                      className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5 text-rose-700" />
                      <span>⚙️ Cập nhật Gemini API Key</span>
                    </button>
                  </div>
                </div>
              )}

              {/* JSON Textarea */}
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    handleValidateJson(e.target.value);
                  }}
                  rows={9}
                  placeholder={`Dán block JSON vào đây...\n{\n  "title": "...",\n  "scenes": [\n    {\n      "order": 1,\n      "timeRange": "00:00 - 00:04",\n      "sourceName": "...",\n      "voiceOver": "...",\n      "screenText": "..."\n    }\n  ]\n}`}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-emerald-400 placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Error Alert */}
              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Success Preview Box */}
              {parsedScenes.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {parsedProjectData?.title || 'Kịch bản Video AI'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {parsedScenes.length} Phân Cảnh
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                        ⏱ {parsedProjectData?.totalDuration || '36.0'}s
                      </span>
                    </div>
                  </div>

                  {/* Scene Preview Grid */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {parsedScenes.map((sc, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                            #{sc.order}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              🎬 {sc.searchKeyword || `Cảnh #${sc.order}`}
                            </p>
                            <p className="text-slate-500 line-clamp-1 text-[11px]">
                              "{sc.narration}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {sc.audioDuration}s
                          </span>
                          {sc.tiktokVideoEffect && (
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                              ✨ FX
                            </span>
                          )}
                          {sc.transition && sc.transition !== 'none' && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              ➡️ {sc.transition}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Apply to Remotion Studio */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleApplyToStudio}
                  disabled={!jsonInput.trim()}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
                    isAppliedSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isAppliedSuccess ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>ĐÃ CHUYỂN TOÀN BỘ PHÂN CẢNH VÀO REMOTION STUDIO!</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-5 h-5" />
                      <span>🚀 CHUYỂN ĐỔI SANG PHÂN CẢNH REMOTION STUDIO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: 10 SOURCE CẦN QUAY BÙ */}
          {/* ========================================================================= */}
          {activeTab === 'missing_sources' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">🎬</span>
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">10 Cảnh Quay Đắt Giá Nên Quay Bổ Sung Ngay:</p>
                  <p>
                    Đây là 10 góc máy tư liệu vàng giúp bạn thỏa sức dựng hàng chục video ngắn đa dạng phong cách, chuyên nghiệp và có chiều sâu:
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {(missingSourcesList.length > 0
                  ? missingSourcesList
                  : JSON.parse(SAMPLE_BADMINTON_JSON).missingSources
                ).map((item: MissingSourceSuggestion, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-sm hover:shadow transition-all space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">
                        {item.title}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                        <span className="font-bold text-slate-700 block mb-0.5">🎥 Cách quay & góc máy:</span>
                        <p className="text-slate-600 leading-relaxed text-[11.5px]">{item.howToShoot}</p>
                      </div>
                      <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-200/60">
                        <span className="font-bold text-emerald-800 block mb-0.5">🎯 Mục đích sử dụng:</span>
                        <p className="text-emerald-900 leading-relaxed text-[11.5px]">{item.purpose}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
