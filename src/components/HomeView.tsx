import React, { useState, useEffect, useMemo } from 'react';
import { Gallery, TimeLog } from '../types';
import { PHASES_LIST } from '../data';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Folder, 
  Plus, 
  Zap, 
  Flame, 
  Activity, 
  TrendingUp,
  Inbox
} from 'lucide-react';

interface HomeViewProps {
  galleries: Gallery[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onShowNotification: (msg: string) => void;
}

export default function HomeView({
  galleries,
  onSelectProject,
  onNewProject,
  onShowNotification
}: HomeViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute last logged work session log
  const lastSession = useMemo(() => {
    let latestLog: TimeLog | null = null;
    let assocGallery: Gallery | null = null;

    // Filter out archived ones for the main dashboard display
    const activeGalleries = galleries.filter(g => !g.archived);

    for (const g of activeGalleries) {
      if (g.logs && g.logs.length > 0) {
        for (const log of g.logs) {
          if (!latestLog || new Date(log.timestamp) > new Date(latestLog.timestamp)) {
            latestLog = log;
            assocGallery = g;
          }
        }
      }
    }

    // Fallback to the latest active gallery if no logs recorded yet
    if (!latestLog && activeGalleries.length > 0) {
      const sorted = [...activeGalleries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      assocGallery = sorted[0];
    }

    return { log: latestLog, gallery: assocGallery };
  }, [galleries]);

  // Group active galleries by priorities
  const priorityGroups = useMemo(() => {
    const groups = {
      HIGH: [] as Gallery[],
      MID: [] as Gallery[],
      LOW: [] as Gallery[],
      OTHER: [] as Gallery[]
    };

    const activeGalleries = galleries.filter(g => !g.archived);

    activeGalleries.forEach(g => {
      const prio = g.priority || 'MID';
      if (groups[prio]) {
        groups[prio].push(g);
      } else {
        groups['OTHER'].push(g);
      }
    });

    return groups;
  }, [galleries]);

  // Calculate high-level pipeline stats
  const stats = useMemo(() => {
    const active = galleries.filter(g => !g.archived);
    const inProgress = active.filter(g => g.status === 'In Progress').length;
    const completed = active.filter(g => g.status === 'Completed').length;
    
    let totalSec = 0;
    active.forEach(g => {
      Object.values(g.times).forEach(sec => {
        totalSec += sec;
      });
    });

    const hours = (totalSec / 3600).toFixed(1);

    return {
      totalActive: active.length,
      inProgress,
      completed,
      trackedHours: hours
    };
  }, [galleries]);

  const formatLogDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (remSec === 0) return `${min}m`;
    return `${min}m ${remSec}s`;
  };

  const getPhaseName = (phaseId: string) => {
    const phase = PHASES_LIST.find(p => p.id === phaseId);
    return phase ? phase.name.replace(/^\d+\.\s*/i, '') : phaseId;
  };

  return (
    <div id="home-landing-page" className="flex-1 overflow-y-auto bg-lrBg p-6 space-y-6 md:p-8">
      
      {/* 1. Header with Live Dynamic Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-lrPanel rounded-2xl border border-lrBorder p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-lrBlue/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-lrBlue font-mono text-[10px] font-bold tracking-widest uppercase mb-1">
            <Sparkles size={12} />
            Lightroom Studio Dashboard
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight font-display">
            Welcome back!
          </h2>
          <p className="text-xs text-lrMuted max-w-md">
            Your HoneyBook calendar is actively sync-tracking projects. See priorities and timers below.
          </p>
        </div>

        {/* Dynamic Date & Time Display */}
        <div className="flex items-center gap-4 bg-[#111214] border border-[#25282d] p-3 rounded-xl shrink-0 font-mono relative z-10">
          <div className="p-2 rounded-lg bg-lrBlue/10 text-lrBlue">
            <Clock size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-100 tracking-tight">
              {currentTime.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </div>
            <div className="text-[9px] uppercase tracking-wider font-semibold text-lrMuted">
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Micro Stats Stripe */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Shoots', value: stats.totalActive, icon: Folder, color: 'text-lrBlue bg-lrBlue/10' },
          { label: 'In Production', value: stats.inProgress, icon: Activity, color: 'text-amber-400 bg-amber-400/10' },
          { label: 'Delivered Projects', value: stats.completed, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-400/10' },
          { label: 'Catalog Hours Tracked', value: `${stats.trackedHours}h`, icon: Clock, color: 'text-fuchsia-400 bg-fuchsia-400/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#1a1c1f]/50 border border-lrBorder/40 p-3.5 rounded-xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color} shrink-0`}>
              <stat.icon size={15} />
            </div>
            <div>
              <div className="text-xs text-lrMuted font-medium">{stat.label}</div>
              <div className="text-base font-black text-white font-mono">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Last Logged Work Session (Stylized Card) */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#565f73] flex items-center gap-2">
          <Inbox size={12} />
          Latest Session Update Segment
        </h3>
        
        {lastSession.gallery ? (
          <div className="group relative bg-[#1c1e22] border-2 border-[#2b303a] hover:border-lrBlue/50 hover:shadow-[0_0_20px_rgba(49,168,255,0.06)] rounded-2xl p-5 md:p-6 transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
            
            {/* Background cover watermark */}
            {lastSession.gallery.thumbnailUrl && (
              <div 
                className="absolute right-0 inset-y-0 w-1/3 opacity-20 bg-cover bg-center mix-blend-overlay blur-[1px] pointer-events-none transition group-hover:scale-105 duration-700"
                style={{ backgroundImage: `url("${lastSession.gallery.thumbnailUrl}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#1c1e22] via-transparent to-transparent"></div>
              </div>
            )}

            <div className="space-y-4 max-w-xl relative z-10 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {lastSession.log ? (
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 bg-lrBlue/15 text-lrBlue rounded border border-lrBlue/30">
                    Latest Activity Committed
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">
                    No Timer Saved Yet
                  </span>
                )}
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  lastSession.gallery.category === 'wedding' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                  lastSession.gallery.category === 'portrait' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  lastSession.gallery.category === 'couples' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  lastSession.gallery.category === 'family' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  {lastSession.gallery.category}
                </span>
                {lastSession.gallery.priority && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    lastSession.gallery.priority === 'HIGH' ? 'bg-red-500/15 text-red-400 border border-red-500/10' :
                    lastSession.gallery.priority === 'MID' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' :
                    'bg-slate-500/15 text-slate-300 border border-slate-500/10'
                  }`}>
                    {lastSession.gallery.priority} PRIORITY
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-white tracking-tight hover:text-lrBlue transition cursor-pointer" onClick={() => onSelectProject(lastSession.gallery!.id)}>
                  {lastSession.gallery.name}
                </h4>
                <p className="text-xs text-lrMuted">
                  Client: <span className="font-semibold text-slate-200">{lastSession.gallery.client}</span> &bull; 
                  Images Ingested: <span className="font-mono text-slate-200">{lastSession.gallery.photoCount} RAW</span>
                </p>
              </div>

              {lastSession.log ? (
                <div className="bg-[#111214]/90 rounded-lg p-3 border border-zinc-800/60 font-sans space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Logged Segment: <strong className="text-lrBlue">{getPhaseName(lastSession.log.phase)}</strong></span>
                    <span className="font-mono text-lrBlue font-bold bg-lrBlue/10 px-1.5 py-0.2 rounded">+{formatLogDuration(lastSession.log.duration)}</span>
                  </div>
                  <p className="text-xs text-slate-300 italic truncate">&ldquo;{lastSession.log.note || 'No description provided'}&rdquo;</p>
                  <p className="text-[10px] text-lrMuted font-mono">Recorded: {new Date(lastSession.log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ) : (
                <div className="text-xs text-lrMuted italic bg-[#111214]/50 rounded-lg p-3 border border-zinc-800/40">
                  Ready for production. Jump to the workspace stopwatch to record catalog processing time.
                </div>
              )}
            </div>

            <div className="shrink-0 relative z-10">
              <button
                onClick={() => onSelectProject(lastSession.gallery!.id)}
                className="w-full md:w-auto px-5 py-3 bg-lrBlue hover:bg-lrBlueHover text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 hover:scale-[1.02] duration-200 cursor-pointer shadow-lg shadow-lrBlue/15"
              >
                Access Control Deck
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-[#16181b] rounded-2xl border-2 border-dashed border-lrBorder p-8 text-center space-y-4">
            <p className="text-sm text-lrMuted">No active photography projects tracked. Populate your workflow from HoneyBook or create manual projects.</p>
            <button
              onClick={onNewProject}
              className="px-4 py-2 bg-lrBlue text-slate-950 font-bold text-xs uppercase rounded hover:opacity-90 transition cursor-pointer"
            >
              + Create Project
            </button>
          </div>
        )}
      </div>

      {/* 4. Priority List Matrix */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#565f73] flex items-center gap-2">
          <Flame size={12} className="text-orange-400" />
          Active Pipeline Priority Index
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* HIGH PRIORITY */}
          <div className="bg-[#191a1e] rounded-xl border border-lrBorder/80 overflow-hidden flex flex-col min-h-[380px] shadow-lg">
            <div className="px-4 py-3 bg-red-950/20 border-b border-red-500/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-red-400 tracking-wider font-mono uppercase">HIGH PRIORITY</span>
              <span className="text-[10px] bg-red-500/15 text-red-300 font-mono font-bold px-2 py-0.2 rounded-full">
                {priorityGroups.HIGH.length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
              {priorityGroups.HIGH.length === 0 ? (
                <div className="h-40 border border-dashed border-[#2b303a] rounded-lg flex items-center justify-center text-[11px] text-lrMuted italic p-4 text-center">
                  None assigned. Let's move shoots with critical delivery terms here.
                </div>
              ) : (
                priorityGroups.HIGH.map((p) => (
                  <ProjectCard key={p.id} project={p} onSelect={onSelectProject} />
                ))
              )}
            </div>
          </div>

          {/* MID PRIORITY */}
          <div className="bg-[#191a1e] rounded-xl border border-lrBorder/80 overflow-hidden flex flex-col min-h-[380px] shadow-lg">
            <div className="px-4 py-3 bg-amber-950/20 border-b border-amber-500/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-400 tracking-wider font-mono uppercase">MID PRIORITY</span>
              <span className="text-[10px] bg-amber-500/15 text-amber-300 font-mono font-bold px-2 py-0.2 rounded-full">
                {priorityGroups.MID.length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
              {priorityGroups.MID.length === 0 ? (
                <div className="h-40 border border-dashed border-[#2b303a] rounded-lg flex items-center justify-center text-[11px] text-lrMuted italic p-4 text-center">
                  No mid-priority items.
                </div>
              ) : (
                priorityGroups.MID.map((p) => (
                  <ProjectCard key={p.id} project={p} onSelect={onSelectProject} />
                ))
              )}
            </div>
          </div>

          {/* LOW PRIORITY */}
          <div className="bg-[#191a1e] rounded-xl border border-lrBorder/80 overflow-hidden flex flex-col min-h-[380px] shadow-lg">
            <div className="px-4 py-3 bg-blue-950/20 border-b border-blue-500/20 flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-400 tracking-wider font-mono uppercase">LOW PRIORITY</span>
              <span className="text-[10px] bg-blue-500/15 text-blue-300 font-mono font-bold px-2 py-0.2 rounded-full">
                {priorityGroups.LOW.length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
              {priorityGroups.LOW.length === 0 ? (
                <div className="h-40 border border-dashed border-[#2b303a] rounded-lg flex items-center justify-center text-[11px] text-lrMuted italic p-4 text-center">
                  No low priority items.
                </div>
              ) : (
                priorityGroups.LOW.map((p) => (
                  <ProjectCard key={p.id} project={p} onSelect={onSelectProject} />
                ))
              )}
            </div>
          </div>

          {/* OTHER */}
          <div className="bg-[#191a1e] rounded-xl border border-lrBorder/80 overflow-hidden flex flex-col min-h-[380px] shadow-lg">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-400 tracking-wider font-mono uppercase">OTHER STAGES</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 font-mono font-bold px-2 py-0.2 rounded-full">
                {priorityGroups.OTHER.length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
              {priorityGroups.OTHER.length === 0 ? (
                <div className="h-40 border border-dashed border-[#2b303a] rounded-lg flex items-center justify-center text-[11px] text-lrMuted italic p-4 text-center">
                  No alternative category items.
                </div>
              ) : (
                priorityGroups.OTHER.map((p) => (
                  <ProjectCard key={p.id} project={p} onSelect={onSelectProject} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// Child helper card for a project listed in the columns
function ProjectCard({ project, onSelect }: { project: Gallery; onSelect: (id: string) => void; key?: string | number }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
      case 'In Progress': return 'text-amber-400 bg-amber-500/10 border-[#f59e0b]/10';
      case 'Upcoming': return 'text-sky-400 bg-sky-500/10 border-sky-500/10';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
    }
  };

  const calculateTotalTimeText = () => {
    let sumSec = 0;
    Object.values(project.times).forEach(s => sumSec += s);
    if (sumSec === 0) return '0 hours';
    return `${(sumSec / 3600).toFixed(1)} hrs logged`;
  };

  return (
    <div 
      onClick={() => onSelect(project.id)}
      className="bg-[#121316] hover:bg-[#15171c] p-3 rounded-lg border-2 border-[#20232a] hover:border-lrBlue/30 transition duration-150 cursor-pointer space-y-3 group"
    >
      <div className="flex items-start justify-between gap-1.5">
        <h4 className="text-xs font-bold text-slate-100 group-hover:text-lrBlue transition font-display uppercase break-all line-clamp-2 leading-tight">
          {project.name}
        </h4>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[8.5px] font-mono font-medium uppercase px-1.5 py-0.2 rounded border ${
          project.category === 'wedding' ? 'bg-pink-500/15 text-pink-400 border-pink-500/10' :
          project.category === 'portrait' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' :
          project.category === 'couples' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' :
          project.category === 'family' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/10' :
          project.category === 'engagement' ? 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/10' :
          'bg-slate-500/10 text-slate-400 border-slate-500/10'
        }`}>
          {project.category}
        </span>
        <span className={`text-[8.5px] font-semibold px-1.5 py-0.2 rounded border ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      <div className="pt-2 border-t border-[#1c1e22] flex items-center justify-between text-[9px] text-[#5e6677] font-mono">
        <span>{project.client}</span>
        <span className="text-[#888df2] font-semibold">{calculateTotalTimeText()}</span>
      </div>
    </div>
  );
}
