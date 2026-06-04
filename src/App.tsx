import React, { useState, useEffect } from 'react';
import { Gallery, SyncSettings, GitHubSettings, CategoryType } from './types';
import { INITIAL_GALLERIES, generateDefaultChecklists } from './data';
import DirectorySidebar from './components/DirectorySidebar';
import ActiveShootPanel from './components/ActiveShootPanel';
import HomeView from './components/HomeView';
import SyncModal from './components/SyncModal';
import GalleryModal from './components/GalleryModal';
import IntegrationsModal from './components/IntegrationsModal';
import { Cloud, AlertCircle, Database, Check, Clock } from 'lucide-react';

const DEFAULTS_SETTINGS: SyncSettings = {
  zapierUrl: '',
  autoSyncNew: true,
  calendarFeedUrl: '',
  googleCalendarEmbedCode: '',
  honeybookApiKey: ''
};

const DEFAULT_GITHUB: GitHubSettings = {
  token: '',
  owner: '',
  repo: '',
  path: 'data.json',
  sha: ''
};

export default function App() {
  // Database States
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activeGalleryId, setActiveGalleryId] = useState<string>('');

  // Settings cached
  const [settings, setSettings] = useState<SyncSettings>(DEFAULTS_SETTINGS);
  const [github, setGithub] = useState<GitHubSettings>(DEFAULT_GITHUB);

  // Filter/Sidebar States
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Home Page vs Workspace active tabs
  const [viewTab, setViewTab] = useState<'home' | 'workspace'>('home');
  const [pinStopwatchToast, setPinStopwatchToast] = useState<boolean>(true);

  // Modals Toggles
  const [syncCenterOpen, setSyncCenterOpen] = useState<boolean>(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState<boolean>(false);
  const [galleryToEdit, setGalleryToEdit] = useState<Gallery | null>(null);
  const [integrationsOpen, setIntegrationsOpen] = useState<boolean>(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  // Global Hoisted Stopwatch States
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerProjectId, setTimerProjectId] = useState<string>('');
  const [timerPhaseId, setTimerPhaseId] = useState<'import' | 'culling' | 'global' | 'local' | 'export'>('global');

  // Trigger ticker for stopwatch
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Support timer phase change
  const handleSetTimerPhase = (phase: 'import' | 'culling' | 'global' | 'local' | 'export') => {
    setTimerPhaseId(phase);
  };

  // Support timer play/pause/start
  const handleToggleTimer = (projectId: string, phase: 'import' | 'culling' | 'global' | 'local' | 'export') => {
    if (!projectId) return;

    if (timerProjectId !== projectId) {
      if (timerRunning && timerSeconds > 0) {
        if (!window.confirm("You are currently logging time for another project. Switching will discard the current unsaved elapsed segment. Continue?")) {
          return;
        }
      }
      setTimerProjectId(projectId);
      setTimerPhaseId(phase);
      setTimerSeconds(0);
      setTimerRunning(true);
      triggerNotification(`Started session timer for "${galleries.find(g => g.id === projectId)?.name}"`);
    } else {
      setTimerRunning(prev => !prev);
    }
  };

  const handleResetTimer = () => {
    if (window.confirm("Are you sure you want to discard your running stopwatch segment?")) {
      setTimerRunning(false);
      setTimerSeconds(0);
    }
  };

  const handleSaveTimerSegment = (projectId: string, phase: 'import' | 'culling' | 'global' | 'local' | 'export', seconds: number) => {
    if (seconds <= 0) return;
    const target = galleries.find(g => g.id === projectId);
    if (!target) return;

    const phaseNames: Record<string, string> = {
      import: 'Ingest & Setup',
      culling: 'Culling / Rating',
      global: 'Global Edits',
      local: 'Local & Masking',
      export: 'Exporting'
    };

    const textDesc = `Stopwatch slice recorded in ${phaseNames[phase] || phase}`;
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      phase,
      duration: seconds,
      timestamp: new Date().toISOString(),
      note: textDesc
    };

    const updatedGallery: Gallery = {
      ...target,
      status: target.status === 'Not Started' || target.status === 'Upcoming' ? 'In Progress' : target.status,
      times: {
        ...target.times,
        [phase]: (target.times[phase] || 0) + seconds
      },
      logs: [newLog, ...(target.logs || [])]
    };

    const nextList = galleries.map(g => g.id === projectId ? updatedGallery : g);
    saveStateToStorage(nextList);

    if (projectId === timerProjectId) {
      setTimerRunning(false);
      setTimerSeconds(0);
    }
    triggerNotification(`Saved session segment (${seconds}s) to database for "${target.name}".`);
  };

  // Bulk Actions
  const handleBulkDelete = (ids: string[]) => {
    if (window.confirm(`Are you sure you want to permanently delete these ${ids.length} selected photoshoot records? This is irreversible.`)) {
      const nextList = galleries.filter(g => !ids.includes(g.id));
      const nextActiveId = nextList.length > 0 ? (ids.includes(activeGalleryId) ? nextList[0].id : activeGalleryId) : '';
      saveStateToStorage(nextList, nextActiveId);
      triggerNotification(`Bulk deleted ${ids.length} project catalogs.`);
    }
  };

  const handleBulkArchive = (ids: string[], archiveState: boolean) => {
    const nextList = galleries.map(g => ids.includes(g.id) ? { ...g, archived: archiveState } : g);
    saveStateToStorage(nextList);
    triggerNotification(`Bulk ${archiveState ? 'archived' : 'activated'} ${ids.length} project catalogs.`);
  };

  // 1. Initial bootloader
  useEffect(() => {
    // Ingest state from localStorage
    const storedDb = localStorage.getItem('LrWorkflowTracker_DB');
    if (storedDb) {
      try {
        const parsed = JSON.parse(storedDb);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGalleries(parsed);
          
          // Seed active focus
          const storedActiveId = localStorage.getItem('LrWorkflowTracker_ActiveID');
          if (storedActiveId && parsed.some(g => g.id === storedActiveId)) {
            setActiveGalleryId(storedActiveId);
          } else {
            setActiveGalleryId(parsed[0].id);
          }
        } else {
          setGalleries(INITIAL_GALLERIES);
          setActiveGalleryId(INITIAL_GALLERIES[0].id);
        }
      } catch (e) {
        setGalleries(INITIAL_GALLERIES);
        setActiveGalleryId(INITIAL_GALLERIES[0].id);
      }
    } else {
      setGalleries(INITIAL_GALLERIES);
      setActiveGalleryId(INITIAL_GALLERIES[0].id);
    }

    // Ingest integration parameters
    const storedIntegration = localStorage.getItem('LrWorkflowTracker_Integrations');
    if (storedIntegration) {
      try {
        setSettings(JSON.parse(storedIntegration));
      } catch (e) {}
    }

    // Ingest GitHub parameters
    const storedGH = localStorage.getItem('LrWorkflowTracker_GitHub');
    if (storedGH) {
      try {
        setGithub(JSON.parse(storedGH));
      } catch (e) {}
    }
  }, []);

  // Sync state back to cache
  const saveStateToStorage = (updatedList: Gallery[], optActiveId?: string) => {
    setGalleries(updatedList);
    localStorage.setItem('LrWorkflowTracker_DB', JSON.stringify(updatedList));
    if (optActiveId !== undefined) {
      setActiveGalleryId(optActiveId);
      localStorage.setItem('LrWorkflowTracker_ActiveID', optActiveId);
    }
  };

  // 2. Custom Toast Alerts
  const triggerNotification = (message: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(message);
    setToastVisible(true);
    
    const id = setTimeout(() => {
      setToastVisible(false);
    }, 3800);
    setToastTimer(id);
  };

  // 3. GitHub Secure Push Backups
  const pushDatabaseToGitHub = async () => {
    const { token, owner, repo, path, sha } = github;
    if (!token || !owner || !repo) {
      triggerNotification("Set up your GitHub token first under Sync Center > GitHub DB.");
      return;
    }

    triggerNotification("Pushing encrypted database file to GitHub repository...");
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      
      // We grab current remote SHA to bypass conflict barriers if present
      const getRes = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });
      
      let remoteSha = sha;
      if (getRes.ok) {
        const remoteData = await getRes.json();
        remoteSha = remoteData.sha;
      }

      const contentString = JSON.stringify(galleries, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(contentString)));

      const body: any = {
        message: "Synchronizing Lightroom Web Workflow Session Tracker dataset",
        content: base64Content
      };
      if (remoteSha) body.sha = remoteSha;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        const nextSha = data.content.sha;
        const nextGithub: GitHubSettings = { ...github, sha: nextSha };
        setGithub(nextGithub);
        localStorage.setItem('LrWorkflowTracker_GitHub', JSON.stringify(nextGithub));
        triggerNotification("Committed securely! Lightroom workspace database backed up on GitHub remote.");
      } else {
        const errorDetails = await res.json();
        console.error("GH Error:", errorDetails);
        triggerNotification(`Push blocked: Checked branch permissions or repository visibility.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Network connection failure writing to GitHub APIs.");
    }
  };

  // GitHub Auto-Fetch pull updates on initialization if PAT token linked
  const fetchDatabaseFromGitHub = async (overrideGithub?: GitHubSettings) => {
    const activeGH = overrideGithub || github;
    const { token, owner, repo, path } = activeGH;
    if (!token || !owner || !repo) return;

    triggerNotification("Pulling database index from remote GitHub repository...");
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (res.ok) {
        const remoteData = await res.json();
        const nextSha = remoteData.sha;
        const base64Clean = remoteData.content.replace(/\s/g, '');
        const contentRaw = atob(base64Clean);
        const parsedList = JSON.parse(contentRaw);

        if (Array.isArray(parsedList)) {
          const updatedGH = { ...activeGH, sha: nextSha };
          setGithub(updatedGH);
          localStorage.setItem('LrWorkflowTracker_GitHub', JSON.stringify(updatedGH));
          
          saveStateToStorage(parsedList, parsedList.length > 0 ? parsedList[0].id : '');
          triggerNotification("Database pulled successfully on repository index branch.");
        }
      } else if (res.status === 404) {
        triggerNotification("No remote JSON file found. Saving database will initialize data.json.");
      } else {
        triggerNotification("GitHub API credentials rejected. Check PAT settings.");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Remote repository connection error.");
    }
  };

  // 4. Modals Action Triggers
  const handleImportCalendars = (imported: Gallery[]) => {
    // Disallow duplicative imports by matching names
    const existingNames = galleries.map(g => g.name.toLowerCase());
    const uniqueIncoming = imported.filter(item => !existingNames.includes(item.name.toLowerCase()));

    if (uniqueIncoming.length === 0) {
      triggerNotification("All imports bypassed (already mapped in database tracker).");
      return;
    }

    const nextList = [...uniqueIncoming, ...galleries];
    saveStateToStorage(nextList, uniqueIncoming[0].id);
    
    // Automatically trigger Pic-Time Outbound webhook if configured & enabled
    if (settings.zapierUrl && settings.autoSyncNew) {
      uniqueIncoming.forEach(newGal => {
        triggerZapierWebhook(newGal);
      });
    }
  };

  const triggerZapierWebhook = async (gal: Gallery) => {
    try {
      await fetch(settings.zapierUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "gallery_ingested",
          gallery_id: gal.id,
          gallery_name: gal.name,
          client: gal.client,
          photo_count: gal.photoCount,
          category: gal.category,
          status: gal.status,
          api_key: settings.honeybookApiKey,
          created_at: gal.createdAt
        })
      });
    } catch (err) {
      console.warn("Outbound webhook logged.", err);
    }
  };

  const handleSaveSettings = (nextSettings: SyncSettings) => {
    setSettings(nextSettings);
    localStorage.setItem('LrWorkflowTracker_Integrations', JSON.stringify(nextSettings));
  };

  const handleSaveGitHubConfig = (nextGH: GitHubSettings) => {
    setGithub(nextGH);
    localStorage.setItem('LrWorkflowTracker_GitHub', JSON.stringify(nextGH));
    
    // Attempt fetch of branch data once configured
    fetchDatabaseFromGitHub(nextGH);
  };

  const handleUpdateGallery = (updated: Gallery) => {
    const nextList = galleries.map(g => g.id === updated.id ? updated : g);
    saveStateToStorage(nextList);
  };

  const handleDeleteGallery = (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this shoot from your Lightroom session database? This action is irreversible.")) {
      const nextList = galleries.filter(g => g.id !== id);
      const nextActiveId = nextList.length > 0 ? nextList[0].id : '';
      saveStateToStorage(nextList, nextActiveId);
      triggerNotification("Shoot catalog deleted.");
    }
  };

  const handleOpenEditModal = () => {
    const current = galleries.find(g => g.id === activeGalleryId);
    if (current) {
      setGalleryToEdit(current);
      setGalleryModalOpen(true);
    }
  };

  const handleGalleryFormSubmit = (data: Partial<Gallery>) => {
    if (galleryToEdit) {
      // EDIT MODE
      const nextList = galleries.map(g => {
        if (g.id === galleryToEdit.id) {
          return {
            ...g,
            ...data
          } as Gallery;
        }
        return g;
      });
      saveStateToStorage(nextList);
      setGalleryToEdit(null);
    } else {
      // CREATE MODE
      const uid = `g-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newGal: Gallery = {
        id: uid,
        name: data.name || '',
        client: data.client || 'N/A',
        photoCount: data.photoCount || 200,
        hourlyRate: data.hourlyRate || 50,
        totalValue: data.totalValue !== undefined ? data.totalValue : (data.hourlyRate ? data.hourlyRate * 10 : 500),
        shootDuration: data.shootDuration !== undefined ? data.shootDuration : 4,
        thumbnailUrl: data.thumbnailUrl || '',
        category: data.category || 'portrait',
        status: data.status || 'Not Started',
        picTimeUrl: data.picTimeUrl || '',
        picTimeFaviconUrl: data.picTimeFaviconUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || '',
        archived: false,
        checklists: generateDefaultChecklists(uid),
        times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
        logs: []
      };

      const nextList = [newGal, ...galleries];
      saveStateToStorage(nextList, uid);

      // Webhook dispatch
      if (settings.zapierUrl && settings.autoSyncNew) {
        triggerZapierWebhook(newGal);
      }
    }
  };

  const activeGallery = galleries.find(g => g.id === activeGalleryId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-lrBg text-slate-300 font-sans antialiased selection:bg-lrBlue/30 selection:text-white">
      
      {/* Elegant Dark Header Bar */}
      <header className="h-16 border-b border-lrBorder bg-lrPanel px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-lrBlue text-lrDarkest p-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                Lightroom Session Tracker <span className="text-[9px] bg-lrBlue/20 text-lrBlue px-1.5 py-0.5 rounded-full uppercase font-mono font-bold tracking-wider">Pro Sync</span>
              </h1>
              <p className="text-[10px] text-lrMuted">Automated catalog analysis and HoneyBook sync active</p>
            </div>
          </div>

          <div className="h-6 w-[1.5px] bg-[#25282d] hidden md:block"></div>

          {/* Navigation selectors */}
          <div className="flex items-center bg-[#111214] border border-[#25282d] rounded-lg p-0.5 gap-0.5 ml-2">
            <button
              onClick={() => setViewTab('home')}
              className={`px-3 py-1 text-[10.5px] font-bold uppercase rounded-md tracking-wider transition cursor-pointer ${
                viewTab === 'home'
                  ? 'bg-lrBlue text-slate-950 font-black shadow-lg shadow-lrBlue/10'
                  : 'text-lrMuted hover:text-white hover:bg-zinc-850'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setViewTab('workspace')}
              className={`px-3 py-1 text-[10.5px] font-bold uppercase rounded-md tracking-wider transition cursor-pointer ${
                viewTab === 'workspace'
                  ? 'bg-lrBlue text-slate-950 font-black shadow-lg shadow-lrBlue/10'
                  : 'text-lrMuted hover:text-white hover:bg-zinc-850'
              }`}
            >
              Shoots Workspace
            </button>
          </div>
          
          {/* Restorer button for Pinned stopwatch */}
          {!pinStopwatchToast && timerSeconds > 0 && timerProjectId && (
            <button
              onClick={() => setPinStopwatchToast(true)}
              className="px-2.5 py-1 text-[9.5px] font-bold uppercase rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/15 transition flex items-center gap-1 cursor-pointer animate-pulse"
              title="Show pinned tracking stopwatch controller"
            >
              <Clock size={11} className="animate-spin" style={{ animationDuration: '4s' }} />
              Watch Rec ({Math.floor(timerSeconds/60)}m)
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Glowing calendar sync indicator */}
          <div className="flex items-center gap-1.5 bg-emerald-950/15 border border-emerald-500/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.08)] select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-[8.5px] font-mono font-black uppercase text-emerald-400 tracking-wider">SYNCED</span>
          </div>

          <button 
            onClick={() => setSyncCenterOpen(true)}
            className="px-3 py-1.5 rounded-md text-[11px] bg-[#1a1c1f] hover:bg-[#252830] text-gray-300 font-medium border border-lrBorder cursor-pointer transition"
          >
            Studio Sync
          </button>
          <button 
            onClick={() => {
              setGalleryToEdit(null);
              setGalleryModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md text-[11px] bg-gradient-to-r from-lrBlue to-lrBlueHover text-slate-950 font-bold shadow-lg cursor-pointer transition hover:opacity-90"
          >
            New Project
          </button>
        </div>
      </header>

      {/* Global Pinned Session Stopwatch Toast */}
      {pinStopwatchToast && (timerRunning || timerSeconds > 0) && timerProjectId && (
        <div className="fixed top-4 left-1/2 -smart-translate-x -translate-x-1/2 z-55 bg-[#141519]/95 border-2 border-lrBlue shadow-[0_4px_30px_rgba(49,168,255,0.3)] px-5 py-2.5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          
          {/* State recording icon */}
          {timerRunning ? (
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-405 bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-650 bg-red-600"></span>
            </span>
          ) : (
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 animate-pulse"></span>
            </span>
          )}

          <div className="text-[10.5px] leading-tight max-w-[150px] md:max-w-[220px] truncate select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-lrMuted uppercase font-mono font-black text-[7.5px] tracking-wider">
                {timerRunning ? 'LIVE LOGGING' : 'LOGGING PAUSED'}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-650 bg-zinc-650"></span>
              <span className="text-[#3b82f6] font-mono text-[9px] uppercase font-extrabold tracking-tight">
                {timerPhaseId}
              </span>
            </div>
            <span className="text-white font-extrabold block truncate mt-0.5" title={galleries.find(g => g.id === timerProjectId)?.name}>
              {galleries.find(g => g.id === timerProjectId)?.name || 'Active Project'}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-zinc-800"></div>

          {/* Time Segment Ticker */}
          <div className="flex items-center gap-2 select-none">
            <span className="font-mono text-base font-black text-white tracking-widest shrink-0 tabular-nums">
              {(() => {
                const h = Math.floor(timerSeconds / 3600);
                const m = Math.floor((timerSeconds % 3600) / 60);
                const s = timerSeconds % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
              })()}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-zinc-800"></div>

          {/* Control Triggers */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => handleSaveTimerSegment(timerProjectId, timerPhaseId, timerSeconds)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-[9.5px] font-black uppercase transition-transform active:scale-95 duration-100 cursor-pointer shadow-sm shadow-emerald-500/10 font-bold"
              title="Save active segment hours log"
            >
              Commit
            </button>
            <button
              onClick={() => setTimerRunning(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-transform active:scale-95 duration-100 cursor-pointer text-slate-950 font-bold ${
                timerRunning 
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-lrBlue hover:bg-lrBlueHover'
              }`}
              title={timerRunning ? 'Pause tracking timer' : 'Resume tracking timer'}
            >
              {timerRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleResetTimer}
              className="p-1.5 px-2 text-[9.5px] bg-[#1a1c1f] hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg border border-zinc-805 border-zinc-800 transition cursor-pointer font-bold"
              title="Discard stopwatch segment"
            >
              Reset
            </button>
            <div className="h-5 w-[1px] bg-zinc-800 mx-0.5"></div>
            <button
              onClick={() => {
                setPinStopwatchToast(false);
                triggerNotification("Stopwatch control minimized. Restore it using the ticker button next to tabs in the dashboard header.");
              }}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-850 rounded transition cursor-pointer"
              title="Hide pinned stopwatch panel"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar repository view */}
        <DirectorySidebar
          galleries={galleries}
          activeId={activeGalleryId}
          onSelect={(id) => {
            setActiveGalleryId(id);
            localStorage.setItem('LrWorkflowTracker_ActiveID', id);
            setViewTab('workspace');
          }}
          onOpenImportGallery={() => {
            setGalleryToEdit(null);
            setGalleryModalOpen(true);
          }}
          onOpenSyncCenter={() => setSyncCenterOpen(true)}
          onOpenIntegrations={() => setIntegrationsOpen(true)}
          onShowArchivedToggle={() => setShowArchived(prev => !prev)}
          showArchived={showArchived}
          onPushToGitHub={pushDatabaseToGitHub}
          hasGithubToken={!!github.token}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
        />

        {/* Main active control deck */}
        <div className="flex-1 overflow-hidden h-full flex flex-col">
          {viewTab === 'home' ? (
            <HomeView
              galleries={galleries}
              onSelectProject={(id) => {
                setActiveGalleryId(id);
                localStorage.setItem('LrWorkflowTracker_ActiveID', id);
                setViewTab('workspace');
              }}
              onNewProject={() => {
                setGalleryToEdit(null);
                setGalleryModalOpen(true);
              }}
              onShowNotification={triggerNotification}
            />
          ) : (
            <ActiveShootPanel
              gallery={activeGallery}
              onUpdateGallery={handleUpdateGallery}
              onDeleteGallery={handleDeleteGallery}
              onOpenEditModal={handleOpenEditModal}
              onShowNotification={triggerNotification}
              timerRunning={timerRunning}
              timerSeconds={timerSeconds}
              timerProjectId={timerProjectId}
              timerPhaseId={timerPhaseId}
              onToggleTimer={handleToggleTimer}
              onSaveTimer={handleSaveTimerSegment}
              onResetTimer={handleResetTimer}
              onSetTimerPhase={handleSetTimerPhase}
            />
          )}
        </div>
      </div>

      {/* 5. Modals Overlay sheets */}
      <SyncModal
        isOpen={syncCenterOpen}
        onClose={() => setSyncCenterOpen(false)}
        settings={settings}
        githubSettings={github}
        onSaveSettings={handleSaveSettings}
        onSaveGitHub={handleSaveGitHubConfig}
        onImportGalleries={handleImportCalendars}
        onShowNotification={triggerNotification}
      />

      <GalleryModal
        isOpen={galleryModalOpen}
        galleryToEdit={galleryToEdit}
        onClose={() => {
          setGalleryModalOpen(false);
          setGalleryToEdit(null);
        }}
        onSubmit={handleGalleryFormSubmit}
        onShowNotification={triggerNotification}
      />

      <IntegrationsModal
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onShowNotification={triggerNotification}
      />

      {/* Master Animated Toast Alert */}
      {toastVisible && (
        <div
          id="customToast"
          className="fixed bottom-6 right-6 z-55 flex items-center gap-2.5 bg-[#1a1c1f] border border-lrBorder px-4 py-3 rounded-lg shadow-2xl animate-in slide-in-from-bottom-5 duration-200 select-none max-w-sm"
        >
          <div className="w-5 h-5 rounded-full bg-lrBlue/15 text-lrBlue flex items-center justify-center shrink-0">
            <Check size={13} className="stroke-[3]" />
          </div>
          <span id="toastMessage" className="text-xs text-slate-100 font-medium leading-normal">
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}
