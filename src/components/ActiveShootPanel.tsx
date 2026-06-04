import React, { useState, useEffect, useRef } from 'react';
import { Gallery, Task, TimeLog, PhaseInfo } from '../types';
import { PHASES_LIST } from '../data';
import { Play, Pause, RotateCcw, Save, Trash2, Calendar, FileText, CheckCircle2, ChevronRight, DollarSign, Clock, LayoutGrid, Plus, Archive, ExternalLink, RefreshCw, Layers } from 'lucide-react';

interface ActiveShootPanelProps {
  gallery: Gallery | null;
  onUpdateGallery: (updated: Gallery) => void;
  onDeleteGallery: (id: string) => void;
  onOpenEditModal: () => void;
  onShowNotification: (msg: string) => void;

  // Hoisted stopwatch controls
  timerRunning: boolean;
  timerSeconds: number;
  timerProjectId: string;
  timerPhaseId: 'import' | 'culling' | 'global' | 'local' | 'export';
  onToggleTimer: (projectId: string, phase: 'import' | 'culling' | 'global' | 'local' | 'export') => void;
  onSaveTimer: (projectId: string, phase: 'import' | 'culling' | 'global' | 'local' | 'export', seconds: number) => void;
  onResetTimer: () => void;
  onSetTimerPhase: (phase: 'import' | 'culling' | 'global' | 'local' | 'export') => void;
}

export default function ActiveShootPanel({
  gallery,
  onUpdateGallery,
  onDeleteGallery,
  onOpenEditModal,
  onShowNotification,
  timerRunning,
  timerSeconds,
  timerProjectId,
  timerPhaseId,
  onToggleTimer,
  onSaveTimer,
  onResetTimer,
  onSetTimerPhase
}: ActiveShootPanelProps) {
  const [activePhaseId, setActivePhaseId] = useState<'import' | 'culling' | 'global' | 'local' | 'export'>('global');
  
  // Quick Adjust states
  const [showQuickAdjust, setShowQuickAdjust] = useState<boolean>(false);

  const handleUpdateQuickMetric = (field: 'photoCount' | 'totalValue' | 'shootDuration', value: number) => {
    if (!gallery) return;
    onUpdateGallery({
      ...gallery,
      [field]: value
    });
  };
  
  // Checklist states
  const [newTaskText, setNewTaskText] = useState('');

  // Manual logging states
  const [manPhase, setManPhase] = useState<'import' | 'culling' | 'global' | 'local' | 'export'>('global');
  const [manMinutes, setManMinutes] = useState<number>(15);
  const [manNote, setManNote] = useState('');

  // Local helper for timer state of current project
  const isProjectBeingTimed = gallery ? (timerProjectId === gallery.id) : false;
  const isPlaying = isProjectBeingTimed && timerRunning;
  const timeElapsed = isProjectBeingTimed ? timerSeconds : 0;

  if (!gallery) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-lrBg text-lrMuted">
        <div className="text-center space-y-3 p-8 border border-lrBorder/50 rounded-xl bg-lrPanel max-w-sm">
          <Layers size={40} className="mx-auto text-lrBorderLight animate-pulse" />
          <h3 className="font-semibold text-white text-xs uppercase tracking-widest font-mono">No Catalog Selected</h3>
          <p className="text-xs text-lrMuted leading-relaxed">
            Choose a photography project from your left repository or ingest a new catalog shoot from Sync Center to start tracking sessions.
          </p>
        </div>
      </div>
    );
  }

  // Format stopwatch clock
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Human descriptive relative duration converter
  const formatDurationText = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}m ${s}s`;
  };

  // Calculations for earnings, values, and logged times
  const totalValue = gallery.totalValue !== undefined ? gallery.totalValue : (gallery.hourlyRate * 10 || 1000);
  const shootDuration = gallery.shootDuration !== undefined ? gallery.shootDuration : 4;

  const totalSecondsLogged = Object.values(gallery.times).reduce((a, b) => a + b, 0);
  const totalHoursLogged = totalSecondsLogged / 3600; // editing duration
  
  // Combine onsite shoot duration + editing duration
  const totalHoursSpent = shootDuration + totalHoursLogged;
  const calculatedHourlyWage = totalHoursSpent > 0 ? (totalValue / totalHoursSpent) : 0;

  // Percentage checklist helpers
  const getPhaseCompletedPercentage = (phase: keyof Gallery['checklists']) => {
    const tasks = gallery.checklists[phase] || [];
    if (tasks.length === 0) return 100;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const categoryGradientsForHeader: Record<string, string> = {
    wedding: 'from-pink-905/70 via-purple-950/60 to-zinc-950',
    portrait: 'from-amber-905/70 via-orange-950/60 to-zinc-950',
    couples: 'from-rose-905/80 via-pink-950/65 to-zinc-950',
    elopement: 'from-sky-905/70 via-indigo-950/60 to-zinc-950',
    family: 'from-teal-905/70 via-emerald-950/60 to-zinc-950',
    engagement: 'from-violet-905/70 via-fuchsia-950/60 to-zinc-950',
    landscape: 'from-emerald-905/70 via-teal-950/60 to-zinc-950',
    other: 'from-blue-905/70 via-slate-950/60 to-zinc-950'
  };

  // Lifecycle events
  const handleTogglePlay = () => {
    if (!gallery) return;
    onToggleTimer(gallery.id, activePhaseId);
  };

  const handleResetTimer = () => {
    onResetTimer();
  };

  const handleSaveTimerSegment = () => {
    if (!gallery) return;
    onSaveTimer(gallery.id, activePhaseId, timeElapsed);
  };

  // Custom Checklist handlers
  const handleToggleChecklistTask = (taskId: string) => {
    const lists = { ...gallery.checklists };
    let found = false;

    for (const phase of PHASES_LIST) {
      const tasks = lists[phase.id] || [];
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          found = true;
          return { ...t, completed: !t.completed };
        }
        return t;
      });
      lists[phase.id] = updatedTasks;
    }

    if (found) {
      onUpdateGallery({ ...gallery, checklists: lists });
    }
  };

  const handleAddNewChecklistTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const listKey = activePhaseId;
    const currentTasks = gallery.checklists[listKey] || [];
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };

    const updatedChecklists = {
      ...gallery.checklists,
      [listKey]: [...currentTasks, newTask]
    };

    onUpdateGallery({ ...gallery, checklists: updatedChecklists });
    setNewTaskText('');
    onShowNotification("Task workflow criteria inserted.");
  };

  const handleDeleteChecklistTask = (taskId: string) => {
    const listKey = activePhaseId;
    const currentTasks = gallery.checklists[listKey] || [];
    const filteredTasks = currentTasks.filter(t => t.id !== taskId);

    const updatedChecklists = {
      ...gallery.checklists,
      [listKey]: filteredTasks
    };

    onUpdateGallery({ ...gallery, checklists: updatedChecklists });
    onShowNotification("Criteria task removed from active phase checklist.");
  };

  const handleResetChecklist = () => {
    if (window.confirm("Restore this phase checklist back to uncompleted bounds?")) {
      const listKey = activePhaseId;
      const currentTasks = gallery.checklists[listKey] || [];
      const resetTasks = currentTasks.map(t => ({ ...t, completed: false }));

      const updatedChecklists = {
        ...gallery.checklists,
        [listKey]: resetTasks
      };

      onUpdateGallery({ ...gallery, checklists: updatedChecklists });
    }
  };

  // Time Log manual insertions
  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (manMinutes <= 0) return;

    const seconds = manMinutes * 60;
    const activePhaseObj = PHASES_LIST.find(p => p.id === manPhase);
    const descriptive = manNote.trim() || `Manual Session allocated to ${activePhaseObj?.name || manPhase}`;

    const newLog: TimeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      phase: manPhase,
      duration: seconds,
      timestamp: new Date().toISOString(),
      note: descriptive
    };

    const updatedGallery: Gallery = {
      ...gallery,
      status: gallery.status === 'Not Started' || gallery.status === 'Upcoming' ? 'In Progress' : gallery.status,
      times: {
        ...gallery.times,
        [manPhase]: (gallery.times[manPhase] || 0) + seconds
      },
      logs: [newLog, ...(gallery.logs || [])]
    };

    onUpdateGallery(updatedGallery);
    setManNote('');
    setManMinutes(15);
    onShowNotification(`Recorded ${manMinutes} min segment manually for ${activePhaseObj?.name}!`);
  };

  const handleDeleteTimeLog = (logId: string) => {
    const targetLog = gallery.logs.find(l => l.id === logId);
    if (!targetLog) return;

    const updatedLogs = gallery.logs.filter(l => l.id !== logId);
    
    // Subtract segment seconds
    const phaseKey = targetLog.phase;
    const leftoverSec = Math.max(0, (gallery.times[phaseKey] || 0) - targetLog.duration);

    const updatedGallery: Gallery = {
      ...gallery,
      times: {
        ...gallery.times,
        [phaseKey]: leftoverSec
      },
      logs: updatedLogs
    };

    onUpdateGallery(updatedGallery);
    onShowNotification("Time segment log was successfully deleted.");
  };

  const handleArchiveToggle = () => {
    const isArchived = gallery.archived || false;
    const msg = isArchived ? "Unarchived and restored shoot catalog!" : "Catalog archived successfully.";
    
    onUpdateGallery({
      ...gallery,
      archived: !isArchived
    });
    
    onShowNotification(msg);
  };

  const handleInquiryUpgrade = () => {
    onShowNotification("Potential client signed! Catalog transitioned to premium workflow pipeline.");
    
    const uid = gallery.id;
    const lists = {
      import: [
        { id: `imp-${uid}-1`, text: 'Ingest RAW images from memory card to RAID', completed: false },
        { id: `imp-${uid}-2`, text: 'Confirm redundant backup storage sync', completed: false },
        { id: `imp-${uid}-3`, text: 'Build smart previews (1:1 zoom checks)', completed: false }
      ],
      culling: [
        { id: `cul-${uid}-1`, text: 'First-pass speed cull (Flag with Pick / Reject)', completed: false },
        { id: `cul-${uid}-2`, text: 'Second-pass star culling (Filter 3+ stars)', completed: false }
      ],
      global: [
        { id: `glo-${uid}-1`, text: 'Apply lens profile calibration & CA correction', completed: false },
        { id: `glo-${uid}-2`, text: 'Establish correct reference white balance', completed: false }
      ],
      local: [
        { id: `loc-${uid}-1`, text: 'Spot heal sensor dust and background distractions', completed: false },
        { id: `loc-${uid}-2`, text: 'Generate AI subject/sky masking to carve focus', completed: false }
      ],
      export: [
        { id: `exp-${uid}-1`, text: 'Apply high-pass output sharpening for selected medium', completed: false },
        { id: `exp-${uid}-2`, text: 'Process sRGB print JPEGs', completed: false }
      ]
    };

    onUpdateGallery({
      ...gallery,
      status: 'Not Started',
      checklists: lists
    });
  };

  return (
    <div id="active-shoot-panel" className="flex-1 overflow-y-auto flex flex-col h-full bg-lrBg">
      
      {/* 1. Header Information Panel */}
      <div 
        className={`p-6 border-b border-lrBorder relative overflow-hidden bg-cover bg-center space-y-4 transition-all duration-300 min-h-[140px] flex flex-col justify-end ${
          !gallery.thumbnailUrl ? `bg-gradient-to-r ${categoryGradientsForHeader[gallery.category] || categoryGradientsForHeader['other']}` : ''
        }`}
        style={gallery.thumbnailUrl ? { backgroundImage: `url("${gallery.thumbnailUrl}")` } : undefined}
      >
        {gallery.thumbnailUrl ? (
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/15 to-transparent z-0"></div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/40 to-transparent z-0"></div>
          </>
        )}
        
        <div className="relative z-10 space-y-4">
          {/* Project metadata */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded ${
                  gallery.category === 'wedding' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                  gallery.category === 'portrait' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  gallery.category === 'couples' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  gallery.category === 'family' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                  gallery.category === 'engagement' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-505/20' :
                  gallery.category === 'landscape' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-slate-500/10 text-slate-400 border border-slate-405/20'
                }`}>
                  {gallery.category}
                </span>
                <span className="text-xs text-lrMuted font-medium flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(gallery.createdAt).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                
                {/* Instant Inline Priority Selector Dropdown */}
                <span className="flex items-center gap-1 bg-[#16181b]/90 px-2 py-0.5 rounded border border-[#2b303a] shadow-sm">
                  <span className="text-[8px] text-lrMuted font-mono uppercase font-bold">Priority:</span>
                  <select
                    value={gallery.priority || 'MID'}
                    onChange={(e) => {
                      onUpdateGallery({
                        ...gallery,
                        priority: e.target.value as any
                      });
                      onShowNotification(`Priority updated to ${e.target.value}`);
                    }}
                    className={`bg-transparent text-[9.5px] font-bold border-0 outline-none cursor-pointer uppercase pr-1 font-mono focus:ring-0 focus:outline-none ${
                      gallery.priority === 'HIGH' ? 'text-rose-450 text-red-400' :
                      gallery.priority === 'MID' ? 'text-amber-400' :
                      gallery.priority === 'LOW' ? 'text-sky-400' :
                      'text-zinc-400'
                    }`}
                  >
                    <option value="HIGH" className="text-red-400 bg-lrPanel">HIGH</option>
                    <option value="MID" className="text-amber-400 bg-lrPanel">MID</option>
                    <option value="LOW" className="text-blue-400 bg-lrPanel">LOW</option>
                    <option value="OTHER" className="text-zinc-400 bg-lrPanel">OTHER</option>
                  </select>
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white font-display uppercase">
                {gallery.name}
              </h2>
              <p className="text-xs text-lrMuted">
                Client Reference: <span className="text-slate-300 font-semibold">{gallery.client}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowQuickAdjust(!showQuickAdjust)}
                title="Toggle fast numerical tuners for RAW image files and project contract value."
                className={`px-3 py-1.5 text-xs border rounded-md transition flex items-center gap-1.5 ${
                  showQuickAdjust
                    ? 'bg-lrBlue/20 text-lrBlue border-lrBlue/40 font-bold'
                    : 'bg-zinc-800 text-slate-205 hover:text-white border-lrBorder hover:bg-zinc-750'
                }`}
              >
                <LayoutGrid size={12} />
                <span>Quick Adjust</span>
              </button>
              <button
                onClick={onOpenEditModal}
                title="Configure client metadata, delivery logs, specific guidelines, categories, dates, or workflow settings."
                className="px-3 py-1.5 text-xs text-slate-200 hover:text-white bg-zinc-800 hover:bg-zinc-755 border border-lrBorder rounded-md transition"
              >
                Modify Details
              </button>
              <button
                onClick={handleArchiveToggle}
                title={gallery.archived ? "Activate catalog index into timeline pipeline." : "Settle catalog index out of active workspace focus."}
                className={`px-3 py-1.5 text-xs border rounded-md transition flex items-center gap-1 ${
                  gallery.archived
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25'
                    : 'bg-zinc-800 text-lrMuted border-lrBorder hover:text-slate-200'
                }`}
              >
                <Archive size={12} />
                {gallery.archived ? 'Activate' : 'Archive'}
              </button>
              <button
                onClick={() => onDeleteGallery(gallery.id)}
                title="Permanently remove this catalog data file and all compiled stopwatch items from localStorage database."
                className="px-3 py-1.5 text-xs text-rose-455 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 rounded-md transition"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Quick Metrics Adjust Panel */}
          {showQuickAdjust && (
            <div className="p-3.5 bg-zinc-950/90 rounded-lg border border-lrBlue/30 shadow-xl flex flex-wrap items-center gap-4 animate-fade-in text-xs text-slate-200">
              <div className="flex items-center gap-1.5 text-lrBlue font-bold font-mono text-[10px] uppercase tracking-wider shrink-0 mr-1">
                <RefreshCw size={12} className="animate-spin text-lrBlue" style={{ animationDuration: '6s' }} />
                <span>Active Tuner</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-lrMuted uppercase">Files:</span>
                <input
                  type="number"
                  min={1}
                  value={gallery.photoCount}
                  onChange={(e) => handleUpdateQuickMetric('photoCount', Math.max(1, Number(e.target.value)))}
                  className="w-18 bg-zinc-900 border border-lrBorder rounded px-1.5 py-1 text-center text-white focus:outline-none focus:border-lrBlue font-mono"
                  title="Modify RAW camera image files in LightRoom catalog directory."
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-lrMuted uppercase">Contract Value:</span>
                <div className="relative">
                  <span className="absolute left-1.5 top-1 px-1.5 p-0.5 text-lrMuted font-mono text-[10px]">$</span>
                  <input
                    type="number"
                    min={0}
                    value={totalValue}
                    onChange={(e) => handleUpdateQuickMetric('totalValue', Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-zinc-900 border border-lrBorder rounded pl-5 pr-1.5 py-1 text-white focus:outline-none focus:border-lrBlue font-mono"
                    title="Modify contract price of the photography package."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-lrMuted uppercase">Shoot Time:</span>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={shootDuration}
                  onChange={(e) => handleUpdateQuickMetric('shootDuration', Math.max(0, Number(e.target.value)))}
                  className="w-16 bg-zinc-900 border border-lrBorder rounded px-1.5 py-1 text-center text-white focus:outline-none focus:border-lrBlue font-mono"
                  title="Modify onsite shooting hours spent capturing photographs."
                />
              </div>
              <p className="text-[10px] text-lrMuted italic xs:block hidden">
                Updates trigger instant recalculated active billing.
              </p>
            </div>
          )}

          {/* Shoot descriptive notes block */}
          {gallery.notes && !gallery.notes.toLowerCase().includes("edit/save") && !gallery.notes.toLowerCase().includes("save changes") && (
            <div className="bg-lrBg/80 backdrop-blur-sm p-3.5 rounded-lg border border-lrBorder/40">
              <p className="text-xs text-slate-300 italic flex items-start gap-2">
                <FileText size={14} className="text-lrMuted shrink-0 mt-0.5" />
                <span>{gallery.notes}</span>
              </p>
            </div>
          )}

          {/* 2. Key Metrics Showcase Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1 font-sans">
            <div className="bg-lrDarkest/40 backdrop-blur-sm rounded-lg border border-lrBorder p-2 px-2.5 flex flex-col justify-between group relative cursor-help">
              <span className="text-[8px] uppercase font-bold text-lrMuted tracking-wider font-mono">Photos Count</span>
              <span className="text-xs font-bold text-slate-202 mt-0.5 font-sans">{gallery.photoCount} RAW</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-slate-300 text-[10px] p-2.5 rounded border border-lrBorder shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 leading-relaxed text-center font-sans">
                Total RAW photo count negatives imported for LightRoom catalog checklist operations.
              </div>
            </div>

            <div className="bg-lrDarkest/40 backdrop-blur-sm rounded-lg border border-lrBorder p-2 px-2.5 flex flex-col justify-between group relative cursor-help">
              <span className="text-[8px] uppercase font-bold text-lrMuted tracking-wider font-mono">Effective Wage</span>
              <span className="text-xs font-bold text-slate-205 mt-0.5 font-sans">${calculatedHourlyWage.toFixed(2)}/hr</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-zinc-950 text-slate-300 text-[10px] p-2.5 rounded border border-lrBorder shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 leading-relaxed font-sans">
                Effective wage of <span className="text-white font-mono font-bold">${calculatedHourlyWage.toFixed(2)}</span> calculated by dividing project value <span className="text-white font-mono">${totalValue}</span> by combined hours <span className="text-white font-mono">({shootDuration}h shoot + {totalHoursLogged.toFixed(1)}h edit)</span>
              </div>
            </div>

            <div className="bg-lrDarkest/40 backdrop-blur-sm rounded-lg border border-lrBorder p-2 px-2.5 flex flex-col justify-between group relative cursor-help">
              <span className="text-[8px] uppercase font-bold text-lrMuted tracking-wider font-mono">Project Price</span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5 font-sans flex items-center gap-0.5">
                <DollarSign size={12} />
                {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-slate-300 text-[10px] p-2.5 rounded border border-lrBorder shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 leading-relaxed text-center font-sans">
                Total fixed-fee package contract or quote value from HoneyBook pipeline. Override via Quick Adjust.
              </div>
            </div>

            <div className="bg-lrDarkest/40 backdrop-blur-sm rounded-lg border border-lrBorder p-2 px-2.5 flex flex-col justify-between group relative cursor-help">
              <span className="text-[8px] uppercase font-bold text-lrMuted tracking-wider font-mono">Combined Times</span>
              <span className="text-[10px] font-bold text-slate-300 mt-0.5 flex flex-col leading-tight">
                <span className="text-sky-450 font-mono">Capture: {shootDuration}h</span>
                <span className="text-purple-405 font-mono">Editing: {totalHoursLogged.toFixed(1)}h</span>
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-zinc-950 text-slate-300 text-[10px] p-2.5 rounded border border-lrBorder shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 leading-relaxed font-sans">
                Total hours spent onsite shooting (<span className="text-sky-400 font-mono">{shootDuration}h</span>) versus recorded LightRoom computer processing hours (<span className="text-purple-400 font-mono">{totalHoursLogged.toFixed(2)}h</span>).
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-lrDarkest/40 backdrop-blur-sm rounded-lg border border-lrBorder p-2 px-2.5 flex flex-col justify-between group relative cursor-help">
              <span className="text-[8px] uppercase font-bold text-lrMuted tracking-wider font-mono">Delivered Link</span>
              {gallery.picTimeUrl ? (
                <a
                  href={gallery.picTimeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition mt-1 truncate hover:underline"
                >
                  <span>Link Live</span>
                  <ExternalLink size={11} className="shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-zinc-600 font-medium italic mt-1">No Link</span>
              )}
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-950 text-slate-300 text-[10px] p-2.5 rounded border border-lrBorder shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 leading-relaxed text-center font-sans">
                Direct client URL path to Pic-Time photo delivery system.
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Upgrade Prompt */}
        {gallery.status === 'Inquiry' && (
          <div className="bg-emerald-900/10 border-2 border-dashed border-emerald-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h5 className="text-xs font-bold text-emerald-400 font-display uppercase tracking-widest">Potential Inquiry Project</h5>
              <p className="text-[11px] text-lrMuted leading-relaxed">
                This project is currently marked as an inquiry. Did the client book and sign? Instantly upgrade to standard Lightroom checkout coordinates!
              </p>
            </div>
            <button
              onClick={handleInquiryUpgrade}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md font-mono text-xs transition"
            >
              Sign Contract & Book Shoot
            </button>
          </div>
        )}
      </div>

      {/* 3. Shoot Phase Strip Selector */}
      <div className="p-6 bg-lrDarkest/45 border-b border-lrBorder">
        <label className="block text-[10px] uppercase font-extrabold text-lrMuted mb-3.5 tracking-widest font-mono">
          Select Lightroom Processing Phase
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {PHASES_LIST.map((phase) => {
            const active = phase.id === activePhaseId;
            const percentage = getPhaseCompletedPercentage(phase.id);
            const loggedSeconds = gallery.times[phase.id] || 0;
            return (
              <div
                key={phase.id}
                onClick={() => setActivePhaseId(phase.id)}
                className={`cursor-pointer rounded-lg border p-3.5 space-y-2 transition duration-150 relative text-left select-none ${
                  active
                    ? 'border-[#31a8ff]/60 bg-[#1d2229] ring-1 ring-[#31a8ff]/20 font-bold'
                    : 'bg-[#1b1d22]/80 border-[#25282d] hover:bg-[#1b1d22]'
                }`}
              >
                {active && (
                  <div
                    className="absolute inset-x-0 top-0 h-1 rounded-t-lg bg-lrBlue"
                  ></div>
                )}
                
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold ${active ? 'text-lrBlue' : 'text-slate-300'}`}>
                    {phase.name}
                  </span>
                  <span className="text-[9px] text-lrMuted mt-1 font-mono">
                    Time: <span className="font-semibold text-slate-300">{formatDurationText(loggedSeconds)}</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-lrBorder/50 space-y-1">
                  <div className="flex justify-between items-center text-[8px] font-mono text-lrMuted">
                    <span>Task List</span>
                    <span className={percentage === 100 ? 'text-emerald-400 font-semibold' : ''}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-lrDarkest/90 rounded-full h-1 overflow-hidden border border-lrBorder/30">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        percentage === 100 ? 'bg-emerald-400' : 'bg-lrBlue'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Workflow Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 flex-1 min-h-0">
        
        {/* Left Column (Checklist Criteria) */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* checklist card */}
          <div className="bg-[#1a1c1f] rounded-xl border border-[#25282d] flex flex-col flex-1 min-h-[300px] overflow-hidden pb-4">
            <div className="flex items-center justify-between bg-[#1d1f25] px-4 py-3 border-b border-[#25282d] shrink-0 mb-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  Phase Checklist Criteria
                </h4>
                <p className="text-[10px] text-lrMuted">
                  Required guidelines for the <span className="font-mono text-slate-355 font-bold">{PHASES_LIST.find(p => p.id === activePhaseId)?.name}</span> step
                </p>
              </div>
              <button
                onClick={handleResetChecklist}
                className="text-[10px] text-lrBlue hover:underline uppercase font-bold tracking-widest"
              >
                Restart Pass
              </button>
            </div>

            {/* List scroll container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[220px] pr-1">
              {(gallery.checklists[activePhaseId] || []).length === 0 ? (
                <div className="p-8 text-center text-lrMuted text-xs font-mono italic">
                  No criteria defined for inquiries. Clear contracts first.
                </div>
              ) : (
                (gallery.checklists[activePhaseId] || []).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-[#111214] p-3 mx-4 rounded-lg border border-transparent hover:border-[#25282d] transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleChecklistTask(task.id)}
                        className="rounded accent-lrBlue bg-lrDarkest border-lrBorder h-4 w-4 shrink-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs truncate ${
                          task.completed ? 'line-through text-lrMuted italic' : 'text-slate-200'
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteChecklistTask(task.id)}
                      className="text-lrMuted hover:text-red-400 p-1 rounded-md transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add checklist item */}
            {(gallery.checklists[activePhaseId] || []).length > 0 && (
              <form onSubmit={handleAddNewChecklistTask} className="flex gap-2 border-t border-lrBorder pt-4 mt-4 shrink-0 mx-4">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Inject core custom criteria item..."
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-md p-2 text-white focus:outline-none focus:border-lrBlue"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-755 border border-lrBorder text-lrBlue hover:text-white font-bold rounded-md transition flex items-center justify-center shrink-0"
                >
                  <Plus size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (Stopwatch + Manual Log Trigger + Timeline Sessions Feed) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* stopwatch container */}
          <div className="bg-[#1d2025] rounded-xl border border-[#2b303a] p-5 flex flex-col items-center relative overflow-hidden shadow-xl" title="Track editing time in real-time. Use the Pinned Toast top bar to track across pages!">
            <span className="absolute top-4 left-4 font-mono text-[9px] text-lrMuted uppercase tracking-widest flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></span>
              Development Stopwatch
            </span>
            <span className="absolute top-4 right-4 text-[10px] text-lrBlue font-bold bg-lrBlue/10 px-2 py-0.5 rounded tracking-wide font-mono uppercase">
              {PHASES_LIST.find(p => p.id === activePhaseId)?.name}
            </span>

            {/* Digital Clock face */}
            <div className="my-8 text-center space-y-1 select-none">
              <h3 className="text-4xl font-mono font-bold tracking-tight text-slate-100 select-all">
                {formatTime(timeElapsed)}
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#52b8ff] font-mono leading-none">
                Seconds elapsed
              </p>
            </div>

            {/* Stopwatch controls */}
            <div className="flex items-center gap-3 pt-1 w-full max-w-sm">
              <button
                id="btnResetTimer"
                onClick={handleResetTimer}
                disabled={timeElapsed === 0}
                className="p-2.5 w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-750 text-lrMuted hover:text-white border border-lrBorder disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                title="Discard currently active stopwatch session and reset to zero"
              >
                <RotateCcw size={15} />
              </button>

              <button
                id="btnPlayPause"
                onClick={handleTogglePlay}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs tracking-wide text-lrDarkest transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-lrBlue hover:bg-lrBlueHover text-slate-150'
                }`}
                title={isPlaying ? "Pause tracking stopwatch segment" : "Resume tracking and increment session timing"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Hold Stopwatch' : 'Launch Session'}</span>
              </button>

              <button
                id="btnSaveTime"
                onClick={handleSaveTimerSegment}
                disabled={timeElapsed === 0}
                className="p-2.5 w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                title="Commit Stopwatch duration to session logs file"
              >
                <Save size={15} />
              </button>
            </div>
          </div>

          {/* manual input duration card */}
          <div className="bg-lrPanel rounded-xl border border-lrBorder p-5 shrink-0 shadow-lg">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display border-b border-lrBorder pb-3.5 mb-4">
              Allocate Manual Session Segment
            </h4>
            
            <form onSubmit={handleCreateManualLog} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-lrMuted mb-1 font-mono">Workflow Phase</label>
                  <select
                    value={manPhase}
                    onChange={(e) => setManPhase(e.target.value as any)}
                    className="w-full text-xs bg-[#16181b] text-slate-100 border border-[#31353f] hover:border-zinc-500 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-lrBlue cursor-pointer transition-colors"
                  >
                    <option value="import">1. Ingest & Setup</option>
                    <option value="culling">2. Culling / Rating</option>
                    <option value="global">3. Global Edits</option>
                    <option value="local">4. Local & Masking</option>
                    <option value="export">5. Exporting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-lrMuted mb-1 font-mono">Minutes</label>
                  <input
                    type="number"
                    min={1}
                    value={manMinutes}
                    onChange={(e) => setManMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs bg-lrDarkest border border-lrBorder rounded p-2 text-white focus:outline-none focus:border-lrBlue font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-lrMuted mb-1 font-mono">Quick Workflow Note</label>
                <input
                  type="text"
                  value={manNote}
                  onChange={(e) => setManNote(e.target.value)}
                  placeholder="e.g. Applied base atmospheric curves across catalog"
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded p-2 text-white focus:outline-none focus:border-lrBlue"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-lrBlue hover:bg-lrBlueHover text-slate-100 font-bold hover:text-slate-950 rounded-md transition shadow text-xs mt-1"
              >
                Log Session Minutes
              </button>
            </form>
          </div>

          {/* Session events list */}
          <div className="bg-[#1a1c1f] rounded-xl border border-[#25282d] p-5 flex flex-col flex-1 min-h-[300px]">
            <div className="border-b border-lrBorder pb-3.5 mb-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Registered Log Timeline
              </h4>
              <p className="text-[10px] text-lrMuted">
                Historical records of session stopwatch commits inside database files
              </p>
            </div>

            {/* Logs List scroll viewport */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[320px] pr-1">
              {!gallery.logs || gallery.logs.length === 0 ? (
                <div className="p-8 text-center text-lrMuted text-xs font-mono italic">
                  No time database cards recorded. Complete tasks or toggle active stopwatch.
                </div>
              ) : (
                gallery.logs.map((log) => {
                  const phaseObj = PHASES_LIST.find(p => p.id === log.phase);
                  return (
                    <div
                      key={log.id}
                      className="bg-[#111214] p-3 rounded-lg border border-transparent hover:border-lrBorder space-y-1.5 transition"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                            log.phase === 'import' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' :
                            log.phase === 'culling' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                            log.phase === 'global' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            log.phase === 'local' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/10' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                          }`}>
                            {phaseObj?.name.replace(/^\d+\.\s*/i, '') || log.phase}
                          </span>
                          <span className="text-[9px] text-lrMuted font-mono">
                            {new Date(log.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-lrBlue">
                            +{formatDurationText(log.duration)}
                          </span>
                          <button
                            onClick={() => handleDeleteTimeLog(log.id)}
                            className="text-lrMuted hover:text-red-400 p-0.5 rounded-md transition"
                            title="Rollback time segment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {log.note && (
                        <p className="text-[11px] text-slate-300 italic leading-relaxed">
                          {log.note}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
