import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  FolderOpen, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Download, 
  BarChart3, 
  Trash2, 
  Edit2, 
  PlusCircle, 
  CheckSquare, 
  Square,
  Sparkles,
  DollarSign,
  Layers,
  FileText,
  TrendingUp,
  X,
  AlertTriangle,
  FileUp,
  Image,
  RefreshCw,
  History
} from 'lucide-react';

// Default mock galleries so the user has beautiful data on load
const INITIAL_GALLERIES = [
  {
    id: 'g-1',
    name: 'Sarah & Mark - Forest Wedding',
    client: 'Sarah & Mark Jenkins',
    photoCount: 420,
    hourlyRate: 75,
    status: 'In Progress',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Soft, golden-hour lighting. Needs warm presets and heavy masking on the forest-canopy wide shots to bring back skies.',
    checklists: {
      import: [
        { id: 'imp-1', text: 'Generate Smart Previews on import', completed: true },
        { id: 'imp-2', text: 'Apply camera profile & lens corrections automatically', completed: true },
        { id: 'imp-3', text: 'Backup raw files to second SSD', completed: true }
      ],
      culling: [
        { id: 'cul-1', text: 'First-pass speed cull (Reject / Keep)', completed: true },
        { id: 'cul-2', text: 'Star-rate (4-star keepers, 5-star portfolio candidates)', completed: false }
      ],
      global: [
        { id: 'glo-1', text: 'Correct White Balance across sequence', completed: true },
        { id: 'glo-2', text: 'Apply custom tone curves', completed: false }
      ],
      local: [
        { id: 'loc-1', text: 'Brush masking for subject pop in key portraits', completed: false },
        { id: 'loc-2', text: 'Heal background distractions & sensor spots', completed: false }
      ],
      export: [
        { id: 'exp-1', text: 'Output sharp print-res JPEG files', completed: false },
        { id: 'exp-2', text: 'Web-optimized backups with watermarks', completed: false }
      ]
    },
    times: {
      import: 1240,    // in seconds
      culling: 3450,
      global: 2100,
      local: 1540,
      export: 0
    },
    logs: [
      { id: 'l-1', phase: 'import', duration: 1240, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: 'Imported and built Smart Previews.' },
      { id: 'l-2', phase: 'culling', duration: 2400, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Initial pass of 800 down to 120.' },
      { id: 'l-3', phase: 'culling', duration: 1050, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Fine tuning picks.' },
      { id: 'l-4', phase: 'global', duration: 2100, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Synced global warmth and profile across prime selections.' },
      { id: 'l-5', phase: 'local', duration: 1540, timestamp: new Date().toISOString(), note: 'Masked ceremony couple close-ups.' }
    ]
  },
  {
    id: 'g-2',
    name: 'Urban Streetwear Shoot - Downtown',
    client: 'Velo Clothing Co.',
    photoCount: 150,
    hourlyRate: 90,
    status: 'Completed',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Edgy, high-contrast urban look. Desaturate greens and blues, pump warm yellows/oranges on streetlights.',
    checklists: {
      import: [
        { id: 'imp-4', text: 'Import to Lightroom Catalog', completed: true }
      ],
      culling: [
        { id: 'cul-3', text: 'Filter down to top 30 key looks', completed: true }
      ],
      global: [
        { id: 'glo-3', text: 'Apply high-contrast cinematic profile', completed: true }
      ],
      local: [
        { id: 'loc-3', text: 'Dodge/burn street textures', completed: true },
        { id: 'loc-4', text: 'Clean up skin blemishes on models', completed: true }
      ],
      export: [
        { id: 'exp-3', text: 'Export high-contrast TIFFs for print campaign', completed: true },
        { id: 'exp-4', text: 'Export custom sRGB crops for Instagram Carousel', completed: true }
      ]
    },
    times: {
      import: 600,
      culling: 1800,
      global: 3200,
      local: 5400,
      export: 1200
    },
    logs: [
      { id: 'l-6', phase: 'import', duration: 600, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: 'Import and folder sorting' },
      { id: 'l-7', phase: 'culling', duration: 1800, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: 'Pick-flagging with clothes designer' },
      { id: 'l-8', phase: 'global', duration: 3200, timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), note: 'Base grading' },
      { id: 'l-9', phase: 'local', duration: 5400, timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), note: 'Detailed brush adjustments and skin clean up' },
      { id: 'l-10', phase: 'export', duration: 1200, timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), note: 'Multi-spec export completed' }
    ]
  }
];

const PHASES = [
  { id: 'import', name: '1. Import & Setup', color: 'from-sky-500 to-indigo-500', bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  { id: 'culling', name: '2. Culling / Rating', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { id: 'global', name: '3. Global Edits', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { id: 'local', name: '4. Local & Masking', color: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  { id: 'export', name: '5. Exporting', color: 'from-rose-500 to-purple-500', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
];

export default function App() {
  const [galleries, setGalleries] = useState(INITIAL_GALLERIES);
  const [activeGalleryId, setActiveGalleryId] = useState(INITIAL_GALLERIES[0].id);
  const [activePhase, setActivePhase] = useState('global');
  
  // Timer State
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef(null);

  // Modals / Forms
  const [isNewGalleryOpen, setIsNewGalleryOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGalleryClient, setNewGalleryClient] = useState('');
  const [newGalleryPhotos, setNewGalleryPhotos] = useState(200);
  const [newGalleryRate, setNewGalleryRate] = useState(50);
  
  // Manual Time Log
  const [isManualLogOpen, setIsManualLogOpen] = useState(false);
  const [manualPhase, setManualPhase] = useState('global');
  const [manualMinutes, setManualMinutes] = useState(15);
  const [manualNote, setManualNote] = useState('');

  // New Checklist Item State
  const [newTodoText, setNewTodoText] = useState('');
  const [todoPhase, setTodoPhase] = useState('global');

  // Editing Gallery Info Modals
  const [isEditingGallery, setIsEditingGallery] = useState(false);
  const [editName, setEditName] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editPhotos, setEditPhotos] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editStatus, setEditStatus] = useState('In Progress');

  const activeGallery = galleries.find(g => g.id === activeGalleryId) || galleries[0];

  // Start & Pause Timer logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Handle phase change
  const handlePhaseChange = (phaseId) => {
    if (isPlaying) {
      // Save progress to current phase first
      saveLoggedTime(activePhase, timeElapsed, "Logged via timer segment");
      setTimeElapsed(0);
    }
    setActivePhase(phaseId);
  };

  // Keep track of active gallery changes to reset timer progress safely
  useEffect(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setTimeElapsed(0);
    }
  }, [activeGalleryId]);

  // Format seconds to string
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatShortTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Add / Save Time to Gallery
  const saveLoggedTime = (phase, seconds, noteText = "Time tracking session") => {
    if (seconds <= 0) return;

    setGalleries(prev => prev.map(g => {
      if (g.id === activeGalleryId) {
        const updatedTimes = { ...g.times };
        updatedTimes[phase] = (updatedTimes[phase] || 0) + seconds;

        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          phase,
          duration: seconds,
          timestamp: new Date().toISOString(),
          note: noteText || 'Standard Tracking'
        };

        return {
          ...g,
          times: updatedTimes,
          logs: [newLog, ...g.logs]
        };
      }
      return g;
    }));
  };

  // Complete and Stop active Session
  const handleStopAndSave = () => {
    if (timeElapsed > 0) {
      saveLoggedTime(activePhase, timeElapsed, `Timer capture for ${PHASES.find(p => p.id === activePhase)?.name}`);
      setTimeElapsed(0);
    }
    setIsPlaying(false);
  };

  const handleResetTimer = () => {
    if (window.confirm("Are you sure you want to discard current running timer?")) {
      setTimeElapsed(0);
      setIsPlaying(false);
    }
  };

  // Add manual log
  const handleAddManualLog = (e) => {
    e.preventDefault();
    const secs = manualMinutes * 60;
    saveLoggedTime(manualPhase, secs, manualNote || `Manually logged ${manualMinutes} min`);
    setManualNote('');
    setIsManualLogOpen(false);
  };

  // Create Gallery
  const handleCreateGallery = (e) => {
    e.preventDefault();
    if (!newGalleryName.trim()) return;

    const newGallery = {
      id: `g-${Date.now()}`,
      name: newGalleryName,
      client: newGalleryClient || 'N/A',
      photoCount: parseInt(newGalleryPhotos) || 0,
      hourlyRate: parseInt(newGalleryRate) || 0,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      notes: '',
      checklists: {
        import: [
          { id: `imp-${Date.now()}-1`, text: 'Ingest raw images from card', completed: false },
          { id: `imp-${Date.now()}-2`, text: 'Apply backup directory', completed: false },
          { id: `imp-${Date.now()}-3`, text: 'Build Smart Previews', completed: false }
        ],
        culling: [
          { id: `cul-${Date.now()}-1`, text: 'First-pass reject/keep cycle', completed: false },
          { id: `cul-${Date.now()}-2`, text: 'Color label premium selections', completed: false }
        ],
        global: [
          { id: `glo-${Date.now()}-1`, text: 'Match white balance and exposures', completed: false },
          { id: `glo-${Date.now()}-2`, text: 'Apply base color/monochrome profile', completed: false }
        ],
        local: [
          { id: `loc-${Date.now()}-1`, text: 'Dodge & Burn key details', completed: false },
          { id: `loc-${Date.now()}-2`, text: 'Blemish and background cloning/healing', completed: false }
        ],
        export: [
          { id: `exp-${Date.now()}-1`, text: 'Confirm final sharpening and export settings', completed: false },
          { id: `exp-${Date.now()}-2`, text: 'Complete web delivery upload', completed: false }
        ]
      },
      times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
      logs: []
    };

    setGalleries(prev => [newGallery, ...prev]);
    setActiveGalleryId(newGallery.id);
    setIsNewGalleryOpen(false);
    setNewGalleryName('');
    setNewGalleryClient('');
  };

  // Edit Gallery Action
  const openEditGalleryModal = () => {
    setEditName(activeGallery.name);
    setEditClient(activeGallery.client);
    setEditPhotos(activeGallery.photoCount);
    setEditRate(activeGallery.hourlyRate);
    setEditStatus(activeGallery.status);
    setIsEditingGallery(true);
  };

  const handleSaveEditGallery = (e) => {
    e.preventDefault();
    setGalleries(prev => prev.map(g => {
      if (g.id === activeGallery.id) {
        return {
          ...g,
          name: editName,
          client: editClient,
          photoCount: parseInt(editPhotos) || 0,
          hourlyRate: parseInt(editRate) || 0,
          status: editStatus
        };
      }
      return g;
    }));
    setIsEditingGallery(false);
  };

  // Delete Gallery Action
  const handleDeleteGallery = (id) => {
    if (window.confirm("Warning: This will permanently delete this entire gallery project and all logged time history. Proceed?")) {
      const remaining = galleries.filter(g => g.id !== id);
      setGalleries(remaining);
      if (activeGalleryId === id && remaining.length > 0) {
        setActiveGalleryId(remaining[0].id);
      }
    }
  };

  // Toggle todo item
  const toggleTodo = (phase, todoId) => {
    setGalleries(prev => prev.map(g => {
      if (g.id === activeGalleryId) {
        const targetPhaseList = g.checklists[phase].map(item => {
          if (item.id === todoId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });

        return {
          ...g,
          checklists: {
            ...g.checklists,
            [phase]: targetPhaseList
          }
        };
      }
      return g;
    }));
  };

  // Add custom checklist item
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    setGalleries(prev => prev.map(g => {
      if (g.id === activeGalleryId) {
        const newItem = {
          id: `todo-${Date.now()}`,
          text: newTodoText,
          completed: false
        };

        return {
          ...g,
          checklists: {
            ...g.checklists,
            [todoPhase]: [...(g.checklists[todoPhase] || []), newItem]
          }
        };
      }
      return g;
    }));

    setNewTodoText('');
  };

  // Delete checklist item
  const deleteTodo = (phase, todoId) => {
    setGalleries(prev => prev.map(g => {
      if (g.id === activeGalleryId) {
        return {
          ...g,
          checklists: {
            ...g.checklists,
            [phase]: g.checklists[phase].filter(item => item.id !== todoId)
          }
        };
      }
      return g;
    }));
  };

  // Delete Individual Log Segment
  const handleDeleteLog = (logId, phase, duration) => {
    if (window.confirm("Delete this log segment and remove the tracked time?")) {
      setGalleries(prev => prev.map(g => {
        if (g.id === activeGalleryId) {
          const updatedTimes = { ...g.times };
          updatedTimes[phase] = Math.max(0, (updatedTimes[phase] || 0) - duration);
          return {
            ...g,
            times: updatedTimes,
            logs: g.logs.filter(l => l.id !== logId)
          };
        }
        return g;
      }));
    }
  };

  // Handle saving notes on blur/change
  const handleUpdateNotes = (text) => {
    setGalleries(prev => prev.map(g => {
      if (g.id === activeGalleryId) {
        return { ...g, notes: text };
      }
      return g;
    }));
  };

  // Global Time Calculations for active Gallery
  const calculateTotalTime = (gallery) => {
    return Object.values(gallery.times).reduce((sum, current) => sum + current, 0);
  };

  const getPhaseProgress = (gallery, phase) => {
    const list = gallery.checklists[phase] || [];
    if (list.length === 0) return 0;
    const completed = list.filter(item => item.completed).length;
    return Math.round((completed / list.length) * 100);
  };

  const totalTimeActive = calculateTotalTime(activeGallery) + timeElapsed;
  const totalCostActive = (totalTimeActive / 3600) * activeGallery.hourlyRate;
  const avgSecondsPerPhoto = activeGallery.photoCount > 0 ? (totalTimeActive / activeGallery.photoCount) : 0;

  // Export current gallery logs as JSON/text file
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeGallery, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeGallery.name.replace(/\s+/g, '_')}_time_logs.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#111214] text-[#d2d5da] font-sans antialiased flex flex-col">
      {/* HEADER BAR */}
      <header className="border-b border-[#25282d] bg-[#1a1c1f] px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-[#31a8ff] text-slate-900 p-2 rounded-lg font-bold flex items-center justify-center">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Lightroom Classic Session Tracker
              <span className="text-xs bg-[#31a8ff]/20 text-[#31a8ff] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">LrC Utility</span>
            </h1>
            <p className="text-xs text-[#8e94a0]">Optimize, log, and audit your darkroom photography editing workflow</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsManualLogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-[#25282d] hover:bg-[#2d3137] border border-[#353a42] text-gray-300 font-medium transition"
          >
            <History className="h-3.5 w-3.5 text-gray-400" />
            Manual Log
          </button>
          
          <button
            onClick={() => setIsNewGalleryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs bg-gradient-to-r from-[#31a8ff] to-[#1d8be0] hover:from-[#47b2ff] hover:to-[#2297f0] text-slate-950 font-bold shadow-lg shadow-[#31a8ff]/10 transition"
          >
            <Plus className="h-4 w-4" />
            New Gallery
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT BAR: Gallery Directory / Selector */}
        <aside className="w-80 border-r border-[#25282d] bg-[#151719] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-[#22252a] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#727a87]">Active Catalog Galleries ({galleries.length})</span>
            <span className="text-xs text-[#31a8ff] font-medium bg-[#31a8ff]/10 px-2 py-0.5 rounded">Real-time</span>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {galleries.map(gallery => {
              const galleryTotalTime = calculateTotalTime(gallery);
              const isActive = gallery.id === activeGalleryId;
              
              return (
                <div 
                  key={gallery.id}
                  onClick={() => setActiveGalleryId(gallery.id)}
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-[#1d2229] border border-[#31a8ff]/40 shadow-inner' 
                      : 'hover:bg-[#1a1c21] border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`text-xs font-bold truncate block ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {gallery.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      gallery.status === 'Completed' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : gallery.status === 'In Progress'
                        ? 'bg-[#31a8ff]/10 text-[#31a8ff]'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {gallery.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#767d8a] flex items-center justify-between mt-1.5">
                    <span className="truncate max-w-[120px]">{gallery.client}</span>
                    <span className="flex items-center gap-1 font-mono text-gray-400">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {formatShortTime(galleryTotalTime)}
                    </span>
                  </div>

                  {/* Micro timeline showing relative time among phases */}
                  <div className="mt-2.5 h-1.5 bg-[#25282d] rounded-full overflow-hidden flex">
                    {PHASES.map(phase => {
                      const value = gallery.times[phase.id] || 0;
                      const pct = galleryTotalTime > 0 ? (value / galleryTotalTime) * 100 : 0;
                      const colorClass = phase.id === 'import' ? 'bg-sky-500' :
                                         phase.id === 'culling' ? 'bg-amber-500' :
                                         phase.id === 'global' ? 'bg-emerald-500' :
                                         phase.id === 'local' ? 'bg-fuchsia-500' : 'bg-rose-500';
                      return (
                        <div 
                          key={phase.id} 
                          style={{ width: `${pct}%` }} 
                          className={`${colorClass} h-full`}
                          title={`${phase.name}: ${formatShortTime(value)}`}
                        />
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 text-[9px] text-[#5e6571]">
                    <span>{gallery.photoCount} photos</span>
                    <span>{gallery.logs.length} logged sessions</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer for App Info */}
          <div className="p-3 bg-[#111214] border-t border-[#22252a] text-center text-[10px] text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-[#22252a] text-[#8e94a0] border border-[#353a42] rounded text-[9px]">Space</kbd> or click Play/Pause to track active work.
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 flex flex-col bg-[#16181b] overflow-y-auto">
          
          {/* GALLERY OVERVIEW CARD */}
          <section className="bg-[#1a1c21] p-6 border-b border-[#25282d] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest font-semibold text-[#8e94a0] uppercase">Selected Gallery Target</span>
                <span className="bg-[#2c323d] text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded">ID: {activeGallery.id}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{activeGallery.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#828a99] pt-1">
                <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5 text-gray-500" /> Client: <strong className="text-gray-300">{activeGallery.client}</strong></span>
                <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5 text-gray-500" /> Batch: <strong className="text-gray-300">{activeGallery.photoCount} Photos</strong></span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-gray-500" /> Rate: <strong className="text-emerald-400">${activeGallery.hourlyRate}/hr</strong></span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-500" /> Created: <strong className="text-gray-300">{new Date(activeGallery.createdAt).toLocaleDateString()}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={openEditGalleryModal}
                className="px-3 py-1.5 text-xs bg-[#25282d] hover:bg-[#2e3239] text-gray-300 border border-[#353a42] rounded transition flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Info
              </button>
              <button 
                onClick={handleExportData}
                className="px-3 py-1.5 text-xs bg-[#25282d] hover:bg-[#2e3239] text-[#31a8ff] border border-[#31a8ff]/20 rounded transition flex items-center gap-1"
                title="Export Logs as JSON"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
              <button 
                onClick={() => handleDeleteGallery(activeGallery.id)}
                className="p-1.5 text-xs bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/15 rounded transition"
                title="Delete Gallery"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* ACTIVE STOPWATCH TIMER MODULE */}
          <section className="p-6 bg-gradient-to-r from-[#171a1f] to-[#121316] border-b border-[#25282d] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#31a8ff]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-5xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Timer Left Panel: Select active Phase */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="animate-pulse w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs uppercase font-bold text-[#8e94a0] tracking-wider">Live Editing Session Tracker</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-400">Choose the phase you are working on in Lightroom:</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {PHASES.map(phase => {
                    const isSelected = activePhase === phase.id;
                    return (
                      <button
                        key={phase.id}
                        onClick={() => handlePhaseChange(phase.id)}
                        className={`p-2.5 rounded-lg text-left border transition relative flex flex-col justify-between ${
                          isSelected 
                            ? `bg-slate-800/80 border-[#31a8ff]/60 text-white shadow-md ring-1 ring-[#31a8ff]/30` 
                            : 'bg-[#1b1d22]/80 border-[#2b2f37] hover:border-slate-600 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold block truncate">{phase.name}</span>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-mono text-[11px] font-semibold text-gray-300">
                            {formatShortTime((activeGallery.times[phase.id] || 0) + (isSelected ? timeElapsed : 0))}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${phase.color}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timer Center Right: Big Counter */}
              <div className="bg-[#1d2025] p-5 rounded-2xl border border-[#2b303a] flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-end min-w-[280px]">
                
                {/* Big digits */}
                <div className="text-center sm:text-right">
                  <div className="text-[10px] text-gray-500 uppercase font-mono tracking-widest mb-1">
                    {PHASES.find(p => p.id === activePhase)?.name.toUpperCase()} TIMER
                  </div>
                  <div className="font-mono text-3xl font-black text-white tracking-widest">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    Cumulative: <span className="font-mono text-[#31a8ff]">{formatShortTime((activeGallery.times[activePhase] || 0) + timeElapsed)}</span>
                  </div>
                </div>

                {/* Control Trigger Buttons */}
                <div className="flex items-center gap-2">
                  {isPlaying ? (
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="p-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95"
                      title="Pause Session"
                    >
                      <Pause className="w-5 h-5 fill-slate-950" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="p-4 rounded-xl bg-[#31a8ff] hover:bg-[#52b8ff] text-slate-950 font-black flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95"
                      title="Start Live Track"
                    >
                      <Play className="w-5 h-5 fill-slate-950" />
                    </button>
                  )}

                  <button
                    onClick={handleStopAndSave}
                    disabled={timeElapsed === 0}
                    className={`p-4 rounded-xl font-bold flex items-center justify-center transition ${
                      timeElapsed > 0 
                        ? 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30' 
                        : 'bg-[#181a1d] text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                    title="Log current duration to phase"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleResetTimer}
                    disabled={timeElapsed === 0}
                    className={`p-2.5 rounded-lg font-bold flex items-center justify-center transition ${
                      timeElapsed > 0 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' 
                        : 'text-zinc-700 cursor-not-allowed'
                    }`}
                    title="Discard current timer session"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </section>

          {/* INSIGHTS & STATS BAR */}
          <section className="px-6 py-4 bg-[#121316] border-b border-[#25282d] grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Total time tracked */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Total Tracked Time</span>
                <span className="font-mono text-base font-bold text-white">{formatShortTime(totalTimeActive)}</span>
              </div>
            </div>

            {/* Total cost tracked */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Hourly Earnings Value</span>
                <span className="font-mono text-base font-bold text-emerald-400">${totalCostActive.toFixed(2)}</span>
              </div>
            </div>

            {/* Average seconds per edit */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Speed Per Photo</span>
                <span className="font-mono text-base font-bold text-white">
                  {avgSecondsPerPhoto > 0 
                    ? `${Math.round(avgSecondsPerPhoto)}s` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Completion rate overall */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block">Checklist Items Done</span>
                <span className="font-mono text-base font-bold text-white">
                  {(() => {
                    const totalChecklists = Object.values(activeGallery.checklists).flat();
                    if (totalChecklists.length === 0) return '0%';
                    const done = totalChecklists.filter(t => t.completed).length;
                    return `${done} / ${totalChecklists.length} (${Math.round((done / totalChecklists.length) * 100)}%)`;
                  })()}
                </span>
              </div>
            </div>

          </section>

          {/* TWO-COLUMN GRID: Left column checklists/phases, Right column history logs/notes */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
            
            {/* COLUMN 1: PHASE ROADMAPS & INTEGRATED CHECKLISTS (8 cols on large screens) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#8e94a0] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Lightroom Step-by-Step Milestones
                </h4>
                <span className="text-xs text-gray-400">Check tasks off as you complete each stage</span>
              </div>

              {PHASES.map((phase) => {
                const phaseTime = activeGallery.times[phase.id] || 0;
                const progressPct = getPhaseProgress(activeGallery, phase.id);
                const isSelected = activePhase === phase.id;

                return (
                  <div 
                    key={phase.id} 
                    className={`rounded-xl border bg-[#1a1c21] overflow-hidden transition ${
                      isSelected 
                        ? 'border-[#31a8ff]/40 shadow-md ring-1 ring-[#31a8ff]/10' 
                        : 'border-[#25282d]'
                    }`}
                  >
                    
                    {/* Phase Card Header */}
                    <div className="px-5 py-4 border-b border-[#22252a] flex flex-wrap items-center justify-between gap-2 bg-[#1d1f25]">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${phase.color}`} />
                        <div>
                          <h5 className="text-xs font-bold text-white">{phase.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400">Tracked:</span>
                            <span className="font-mono text-[11px] font-semibold text-[#31a8ff]">
                              {formatShortTime(phaseTime + (isSelected ? timeElapsed : 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress slider bar indicator */}
                      <div className="flex items-center space-x-3 min-w-[120px]">
                        <div className="w-full bg-[#2a2d34] h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${progressPct}%` }}
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300 w-8 text-right">{progressPct}%</span>
                      </div>
                    </div>

                    {/* Checklists for this phase */}
                    <div className="p-4 space-y-2">
                      {(activeGallery.checklists[phase.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-500 italic p-2">No tasks created for this phase yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeGallery.checklists[phase.id].map(todo => (
                            <div 
                              key={todo.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-[#141518]/60 hover:bg-[#141518] group border border-transparent hover:border-[#22252a] transition"
                            >
                              <div 
                                onClick={() => toggleTodo(phase.id, todo.id)}
                                className="flex items-center space-x-2.5 cursor-pointer flex-1"
                              >
                                {todo.completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-500 hover:text-white shrink-0" />
                                )}
                                <span className={`text-xs ${todo.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                  {todo.text}
                                </span>
                              </div>

                              <button
                                onClick={() => deleteTodo(phase.id, todo.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-rose-400 transition"
                                title="Delete task"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add task inline form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (todoPhase === phase.id) handleAddTodo(e);
                        }}
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-[#22252a]"
                      >
                        <input
                          type="text"
                          placeholder="Add standard/custom checklist task..."
                          value={todoPhase === phase.id ? newTodoText : ''}
                          onChange={(e) => {
                            setTodoPhase(phase.id);
                            setNewTodoText(e.target.value);
                          }}
                          className="flex-1 text-xs bg-[#121316] border border-[#2b2f37] rounded px-3 py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff]/50"
                        />
                        <button
                          type="submit"
                          onClick={() => setTodoPhase(phase.id)}
                          className="p-1.5 rounded bg-[#25282d] hover:bg-[#31a8ff] hover:text-slate-950 text-gray-400 transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </form>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* COLUMN 2: GALLERY NOTES, WORK SUMMARY, & TIMELINE LOGS (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Scratchpad/Notes */}
              <div className="bg-[#1a1c21] p-5 rounded-xl border border-[#25282d] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e94a0] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Gallery Processing Notes
                </h4>
                <textarea
                  placeholder="Record specific presets to use, adjustments needed, crop constraints, or client instructions here..."
                  value={activeGallery.notes}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  className="w-full h-32 text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-y"
                />
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span>Saves automatically in memory</span>
                  <span className="font-mono">{activeGallery.notes.length} characters</span>
                </div>
              </div>

              {/* Time logs history */}
              <div className="bg-[#1a1c21] p-5 rounded-xl border border-[#25282d] flex flex-col h-[400px]">
                <div className="flex items-center justify-between pb-3 border-b border-[#22252a] mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#8e94a0] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" />
                    Tracking & Log History
                  </h4>
                  <span className="text-[10px] text-gray-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {activeGallery.logs.length} segments
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {activeGallery.logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Clock className="w-8 h-8 text-zinc-600 mb-2 stroke-1" />
                      <p className="text-xs text-gray-400 font-semibold">No time intervals logged yet</p>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-[180px]">Start the live timer above or manually log hours to map history.</p>
                    </div>
                  ) : (
                    activeGallery.logs.map(log => {
                      const phaseObj = PHASES.find(p => p.id === log.phase) || PHASES[0];
                      return (
                        <div 
                          key={log.id} 
                          className="bg-[#121316] p-3 rounded-lg border border-[#22252a] flex items-start justify-between gap-2 hover:border-[#2b303a] transition"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${phaseObj.color}`} />
                              <span className="text-[10px] font-bold text-gray-300 uppercase truncate">{phaseObj.name.replace(/^\d+\.\s+/, '')}</span>
                              <span className="text-[9px] text-gray-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {log.note && (
                              <p className="text-xs text-gray-400 font-light truncate" title={log.note}>
                                "{log.note}"
                              </p>
                            )}

                            <div className="text-[10px] text-gray-500">
                              Date: {new Date(log.timestamp).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              +{formatShortTime(log.duration)}
                            </span>
                            <button
                              onClick={() => handleDeleteLog(log.id, log.phase, log.duration)}
                              className="text-gray-600 hover:text-rose-400 p-0.5 rounded transition"
                              title="Delete log"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </main>

      </div>

      {/* MODAL: CREATE NEW GALLERY */}
      {isNewGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c21] rounded-2xl border border-[#2e333d] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#25282d] flex items-center justify-between bg-[#121316]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#31a8ff]" /> Import New Catalog Gallery
              </h3>
              <button 
                onClick={() => setIsNewGalleryOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGallery} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Gallery / Shoot Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smith Family Portraits - Woods"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Client Name / Event Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Smith"
                  value={newGalleryClient}
                  onChange={(e) => setNewGalleryClient(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Approx. Photo Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newGalleryPhotos}
                    onChange={(e) => setNewGalleryPhotos(e.target.value)}
                    className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Hourly Rate ($ / hr)</label>
                  <input
                    type="number"
                    min="0"
                    value={newGalleryRate}
                    onChange={(e) => setNewGalleryRate(e.target.value)}
                    className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#25282d] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewGalleryOpen(false)}
                  className="px-4 py-2 text-xs bg-[#25282d] hover:bg-[#2d3137] text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#31a8ff] hover:bg-[#52b8ff] text-slate-950 font-bold rounded-lg transition"
                >
                  Create Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL TIME LOG ENTRY */}
      {isManualLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c21] rounded-2xl border border-[#2e333d] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#25282d] flex items-center justify-between bg-[#121316]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" /> Log Time Manually
              </h3>
              <button 
                onClick={() => setIsManualLogOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Select Phase</label>
                <select
                  value={manualPhase}
                  onChange={(e) => setManualPhase(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff]"
                >
                  {PHASES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Minutes to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Optional Session Note</label>
                <input
                  type="text"
                  placeholder="e.g. Exported high res batch, color-corrected sunset scene"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#31a8ff]"
                />
              </div>

              <div className="pt-4 border-t border-[#25282d] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualLogOpen(false)}
                  className="px-4 py-2 text-xs bg-[#25282d] hover:bg-[#2d3137] text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#31a8ff] hover:bg-[#52b8ff] text-slate-950 font-bold rounded-lg transition"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ACTIVE GALLERY DETAILS */}
      {isEditingGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c21] rounded-2xl border border-[#2e333d] shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#25282d] flex items-center justify-between bg-[#121316]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" /> Edit Gallery Properties
              </h3>
              <button 
                onClick={() => setIsEditingGallery(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGallery} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Gallery / Shoot Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#31a8ff]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Client Reference</label>
                <input
                  type="text"
                  value={editClient}
                  onChange={(e) => setEditClient(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#31a8ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Photo Count</label>
                  <input
                    type="number"
                    min="1"
                    value={editPhotos}
                    onChange={(e) => setEditPhotos(e.target.value)}
                    className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#31a8ff] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#31a8ff] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-[#8e94a0] mb-1.5">Status Flag</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs bg-[#121316] border border-[#2b2f37] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#31a8ff]"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#25282d] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingGallery(false)}
                  className="px-4 py-2 text-xs bg-[#25282d] hover:bg-[#2d3137] text-gray-300 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#31a8ff] hover:bg-[#52b8ff] text-slate-950 font-bold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}