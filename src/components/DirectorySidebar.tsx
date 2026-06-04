import React, { useState } from 'react';
import { Gallery, CategoryType, GalleryStatus } from '../types';
import { Search, Grid, List, ChevronRight, Archive, Clock, DollarSign, Image, Calendar, Database, CloudUpload } from 'lucide-react';

interface DirectorySidebarProps {
  galleries: Gallery[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenImportGallery: () => void;
  onOpenSyncCenter: () => void;
  onOpenIntegrations: () => void;
  onShowArchivedToggle: () => void;
  showArchived: boolean;
  onPushToGitHub: () => void;
  hasGithubToken: boolean;
  onBulkArchive: (ids: string[], archiveState: boolean) => void;
  onBulkDelete: (ids: string[]) => void;
}

export default function DirectorySidebar({
  galleries,
  activeId,
  onSelect,
  onOpenImportGallery,
  onOpenSyncCenter,
  onOpenIntegrations,
  onShowArchivedToggle,
  showArchived,
  onPushToGitHub,
  hasGithubToken,
  onBulkArchive,
  onBulkDelete
}: DirectorySidebarProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [zoom, setZoom] = useState<number>(1.0); // 0.75 to 1.3
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastCheckId, setLastCheckId] = useState<string | null>(null);

  // Gradients matching shoot categories
  const categoryGradients: Record<CategoryType, string> = {
    wedding: 'from-pink-500/10 to-purple-600/20 border-pink-500/30',
    portrait: 'from-amber-500/10 to-orange-600/20 border-amber-500/30',
    couples: 'from-rose-500/10 to-red-650/20 border-rose-500/25',
    elopement: 'from-orange-500/10 to-amber-650/20 border-orange-500/25',
    family: 'from-teal-500/10 to-emerald-650/20 border-teal-500/25',
    engagement: 'from-fuchsia-500/10 to-fuchsia-650/20 border-fuchsia-505/25',
    other: 'from-zinc-500/10 to-zinc-700/20 border-zinc-500/30'
  };

  const handleCheckboxChange = (id: string, checked: boolean, shiftKey: boolean) => {
    if (shiftKey && lastCheckId) {
      const lastIndex = sorted.findIndex(g => g.id === lastCheckId);
      const currentIndex = sorted.findIndex(g => g.id === id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = sorted.slice(start, end + 1).map(g => g.id);

        setSelectedIds(prev => {
          if (checked) {
            const newSelection = new Set([...prev, ...rangeIds]);
            return Array.from(newSelection);
          } else {
            return prev.filter(item => !rangeIds.includes(item));
          }
        });
        setLastCheckId(id);
        return;
      }
    }

    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(item => item !== id)
    );
    setLastCheckId(id);
  };

  const handleCardClick = (g: Gallery, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.stopPropagation();
      e.preventDefault();
      const isCurrentlySelected = selectedIds.includes(g.id);
      handleCheckboxChange(g.id, !isCurrentlySelected, true);
    } else {
      onSelect(g.id);
    }
  };

  const getStatusBadgeColor = (status: GalleryStatus) => {
    switch (status) {
      case 'Inquiry': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Upcoming': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'Not Started': return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Completed': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    }
  };

  const filtered = galleries.filter(g => {
    const isArchived = g.archived || false;
    const matchesArchive = isArchived === showArchived;
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.client.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase());
    return matchesArchive && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getCategoryTheme = (g: Gallery) => {
    return categoryGradients[g.category] || categoryGradients['portrait'];
  };

  // Helper to format cumulative time
  const formatTotalHours = (times?: Gallery['times']) => {
    if (!times) return '0h';
    const totalSecs = Object.values(times).reduce((a, b) => a + b, 0);
    const hours = totalSecs / 3600;
    return `${hours.toFixed(1)}h`;
  };

  // Helper to get overall timeline percent
  const getCompletedTaskPercentage = (g: Gallery) => {
    let totals = 0;
    let completed = 0;
    Object.values(g.checklists).forEach(list => {
      list.forEach(task => {
        totals++;
        if (task.completed) completed++;
      });
    });
    if (totals === 0) return 0;
    return Math.round((completed / totals) * 100);
  };

  return (
    <div id="directory-sidebar" className="w-[340px] md:w-[380px] bg-lrSidebar border-r border-lrBorder flex flex-col h-full shrink-0 select-none">
      
      {/* Branding and Actions Area */}
      <div className="p-4 border-b border-lrBorder space-y-3 bg-lrSidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-lrBlue flex items-center justify-center text-slate-950 font-bold text-xs shadow-md shadow-lrBlue/10 font-mono">
              Lr
            </div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-slate-200 font-display">
              Workflow Tracker
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {hasGithubToken && (
              <button
                id="btnGitHubPush"
                onClick={onPushToGitHub}
                title="Backup Database File to GitHub Repository Commit"
                className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition text-[10px] flex items-center gap-1 font-mono uppercase font-bold"
              >
                <CloudUpload size={12} />
                Save DB
              </button>
            )}
            <button
              onClick={onOpenSyncCenter}
              className="px-2.5 py-1 text-[10px] font-semibold text-slate-100 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-lrBorder rounded-md transition"
            >
              Sync Center
            </button>
          </div>
        </div>

        {/* Directory Command buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="open-import-modal-btn"
            onClick={onOpenImportGallery}
            className="py-1.5 text-xs text-slate-950 bg-lrBlue hover:bg-lrBlueHover font-bold rounded-md text-center transition shadow shadow-lrBlue/10"
          >
            + New Project
          </button>
          <button
            onClick={onOpenIntegrations}
            className="py-1.5 text-xs text-purple-300 bg-purple-950/20 hover:bg-purple-950/30 border border-purple-500/20 font-bold rounded-md text-center transition"
          >
            Pic-Time Hub
          </button>
        </div>
      </div>

      {/* Navigation Filter Frame */}
      <div className="px-4 py-3 bg-lrSidebar/80 border-b border-lrBorder space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lrMuted" />
          <input
            id="catalogSearch"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shoots, projects, clients..."
            className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-md pl-9 pr-3 py-1.5 text-white placeholder-zinc-600 focus:outline-none focus:border-lrBlue"
          />
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-lrDarkest border border-lrBlue/30 rounded-lg flex items-center justify-between gap-1.5 animate-in slide-in-from-top-2 duration-150">
            <span className="font-mono text-[9px] text-lrBlue font-bold uppercase tracking-wider shrink-0">
              Selected ({selectedIds.length})
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  onBulkArchive(selectedIds, !showArchived);
                  setSelectedIds([]);
                }}
                className="px-2.5 py-0.5 text-[9px] font-bold uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded transition cursor-pointer"
                title={`Bulk ${showArchived ? 'activate' : 'archive'} selected photoshoot lines`}
              >
                {showArchived ? 'Activate' : 'Archive'}
              </button>
              <button
                onClick={() => {
                  onBulkDelete(selectedIds);
                  setSelectedIds([]);
                }}
                className="px-2.5 py-0.5 text-[9px] font-bold uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded transition cursor-pointer"
                title="Bulk permanently delete active records from index"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-1.5 py-0.5 text-[9px] font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Filters/Sort Bar */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-lrMuted uppercase font-mono font-bold">Sort</span>
            <select
              id="catalogSortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#16181b] text-slate-100 border border-[#31353f] hover:border-zinc-500 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-lrBlue cursor-pointer transition-colors duration-150"
            >
              <option value="date-desc">Newest Session</option>
              <option value="date-asc">Oldest Session</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
              <option value="name-desc">Alphabetical (Z-A)</option>
            </select>
          </div>

          {/* List vs Grid Layout & Zoom slider */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-lrDarkest border border-lrBorder rounded-md p-0.5">
              <button
                id="btnListView"
                onClick={() => setLayout('list')}
                className={`p-1 rounded ${layout === 'list' ? 'bg-zinc-800 text-lrBlue' : 'text-lrMuted hover:text-white'}`}
                title="List layout"
              >
                <List size={11} />
              </button>
              <button
                id="btnGridView"
                onClick={() => setLayout('grid')}
                className={`p-1 rounded ${layout === 'grid' ? 'bg-zinc-800 text-lrBlue' : 'text-lrMuted hover:text-white'}`}
                title="Bento Grid layout"
              >
                <Grid size={11} />
              </button>
            </div>
            
            {/* Zoom slider */}
            <div className="flex items-center gap-1" title="Catalog card zoom scaling">
              <span className="text-[9px] text-lrMuted font-mono">Zoom</span>
              <input
                id="zoomSlider"
                type="range"
                min="0.75"
                max="1.3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-12 h-1 bg-lrDarkest rounded-lg appearance-none cursor-pointer"
              />
              <span id="zoomDisplay" className="text-[9px] text-lrMuted font-mono w-6 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Archive toggle button */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] text-lrMuted font-medium font-sans">
            Showing {sorted.length} {showArchived ? 'archived' : 'active'} of {galleries.length} total
          </span>
          <button
            id="archiveToggleBtn"
            onClick={onShowArchivedToggle}
            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded transition ${
              showArchived
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                : 'text-lrBlue bg-lrBlue/10 border border-lrBlue/20 hover:bg-lrBlue/20'
            }`}
          >
            {showArchived ? 'View Active Catalogs' : 'View Archived Catalogs'}
          </button>
        </div>
      </div>

      {/* Directory Scroll Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-lrBorder">
        {sorted.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <span className="text-lrMuted text-xs block">No catalogs matched query guidelines.</span>
            <button
              onClick={onOpenImportGallery}
              className="text-[10px] text-lrBlue uppercase font-bold tracking-widest hover:underline"
            >
              + Create New Sample
            </button>
          </div>
        ) : layout === 'grid' ? (
          /* Grid variant scaled dynamically based on zoom */
          <div
            className="p-3 grid gap-3 grid-cols-1"
            style={{
              fontSize: `${zoom * 12}px`,
              gap: `${zoom * 12}px`
            }}
          >
            {sorted.map((g) => {
              const active = g.id === activeId;
              const percent = getCompletedTaskPercentage(g);
              const totalSecs = Object.values(g.times).reduce((a, b) => a + b, 0);
              const totalHrs = totalSecs / 3600;
              const shootHrs = g.shootDuration !== undefined ? g.shootDuration : 4;
              const val = g.totalValue !== undefined ? g.totalValue : (g.hourlyRate * 10 || 1000);
              const combineHrs = shootHrs + totalHrs;
              const calcHourlyMetric = combineHrs > 0 ? (val / combineHrs) : 0;
               return (
                <div
                  key={g.id}
                  onClick={(e) => handleCardClick(g, e)}
                  className={`cursor-pointer rounded-lg border p-3.5 space-y-2.5 transition duration-150 bg-gradient-to-br select-none active:scale-[0.98] ${getCategoryTheme(g)} ${
                    active ? 'border-[#31a8ff]/50 bg-[#1d2229] shadow-inner font-bold' : 'border-transparent hover:border-lrBorder p-3.5 hover:bg-lrPanel/30 hover:shadow-lg'
                  }`}
                  style={{
                    padding: `${zoom * 14}px`
                  }}
                  title="Click to load this Lightroom catalog project dataset."
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(g.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const checked = !selectedIds.includes(g.id);
                          handleCheckboxChange(g.id, checked, e.shiftKey);
                        }}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-lrBorder bg-lrDarkest text-lrBlue focus:ring-lrBlue scale-100 transition cursor-pointer shrink-0"
                        title="Select this catalog project to perform bulk archive or deletion actions"
                      />
                      <span className="font-mono text-[9px] uppercase bg-lrDarkest/80 text-lrMuted border border-lrBorder rounded px-1.5 py-0.5">
                        {g.category}
                      </span>
                    </div>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded tracking-wide ${getStatusBadgeColor(g.status)}`}>
                      {g.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 min-w-0">
                    {g.thumbnailUrl && (
                      <div className="w-11 h-11 rounded-md overflow-hidden shrink-0 border border-lrBorder/40 bg-zinc-900 shadow-sm relative">
                        <img 
                          src={g.thumbnailUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="font-bold font-display text-slate-100 hover:text-white transition leading-tight break-all truncate flex items-center gap-1.5">
                        {g.picTimeFaviconUrl && (
                          <img 
                            src={g.picTimeFaviconUrl} 
                            alt="" 
                            className="w-3.5 h-3.5 rounded-sm object-contain bg-transparent shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{g.name}</span>
                      </h4>
                      <p className="text-[11px] text-lrMuted truncate">
                        {g.client}
                      </p>
                    </div>
                  </div>

                  {/* Micro Statistics */}
                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-lrBorder font-mono">
                    <div className="flex flex-col" title="RAW files in this catalog">
                      <span className="text-[8px] text-lrMuted uppercase">Images</span>
                      <span className="text-[10px] font-bold text-slate-200">{g.photoCount}</span>
                    </div>
                    <div className="flex flex-col" title="Calculated effective hourly wage based on project pricing and total work hours">
                      <span className="text-[8px] text-lrMuted uppercase">Est Wage</span>
                      <span className="text-[10px] font-bold text-emerald-400">${calcHourlyMetric.toFixed(1)}/h</span>
                    </div>
                    <div className="flex flex-col" title="Total hours cataloged spent editing">
                      <span className="text-[8px] text-lrMuted uppercase">Logged</span>
                      <span className="text-[10px] font-bold text-lrBlue flex items-center gap-0.5">
                        <Clock size={8} />
                        {formatTotalHours(g.times)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-lrMuted">
                      <span>Workflow Pipeline</span>
                      <span className="text-slate-300 font-semibold">{percent}%</span>
                    </div>
                    <div className="w-full bg-lrDarkest/80 rounded-full h-1 overflow-hidden border border-lrBorder/50">
                      <div
                        className="bg-lrBlue h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List variant scaled dynamically based on zoom */
          <div className="p-1 space-y-1">
            {sorted.map((g) => {
              const active = g.id === activeId;
              const percent = getCompletedTaskPercentage(g);
              const totalSecs = Object.values(g.times).reduce((a, b) => a + b, 0);
              const totalHrs = totalSecs / 3600;
              const shootHrs = g.shootDuration !== undefined ? g.shootDuration : 4;
              const val = g.totalValue !== undefined ? g.totalValue : (g.hourlyRate * 10 || 1000);
              const combineHrs = shootHrs + totalHrs;
              const calcHourlyMetric = combineHrs > 0 ? (val / combineHrs) : 0;
              return (
                <div
                  key={g.id}
                  onClick={(e) => handleCardClick(g, e)}
                  className={`flex items-center justify-between cursor-pointer p-3 transition duration-150 select-none rounded-md active:scale-[0.99] ${
                    active ? 'bg-[#1d2229] border-l-2 border-lrBlue shadow-inner' : 'hover:bg-lrPanel/60'
                  }`}
                  style={{
                    paddingTop: `${zoom * 11}px`,
                    paddingBottom: `${zoom * 11}px`
                  }}
                  title={`Click to load this Lightroom catalog project dataset. Effective wage is currently $${calcHourlyMetric.toFixed(1)}/hr.`}
                >
                  <div className="min-w-0 pr-3 flex-1 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(g.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const checked = !selectedIds.includes(g.id);
                        handleCheckboxChange(g.id, checked, e.shiftKey);
                      }}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded border-lrBorder bg-lrDarkest text-lrBlue focus:ring-lrBlue scale-100 transition cursor-pointer shrink-0"
                      title="Select this catalog project to perform bulk archive or deletion actions"
                    />
                    {g.thumbnailUrl && (
                      <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-lrBorder/40 bg-zinc-900 shadow-sm relative">
                        <img 
                          src={g.thumbnailUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-mono font-medium uppercase px-1.5 py-0.5 rounded tracking-wider ${
                          g.category === 'wedding' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/10' :
                          g.category === 'portrait' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' :
                          g.category === 'couples' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10' :
                          g.category === 'family' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/10' :
                          g.category === 'engagement' ? 'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/10' :
                          'bg-slate-500/15 text-slate-400 border border-slate-500/10'
                        }`}>
                          {g.category}
                        </span>
                        <span className="text-[10px] text-lrMuted font-mono">
                          {new Date(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold font-display text-slate-100 hover:text-white transition truncate flex items-center gap-1.5">
                        {g.picTimeFaviconUrl && (
                          <img 
                            src={g.picTimeFaviconUrl} 
                            alt="" 
                            className="w-3.5 h-3.5 rounded-sm object-contain bg-transparent shrink-0"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{g.name}</span>
                      </h4>
                      <p className="text-[10px] text-lrMuted truncate">
                        {g.client} • <span className="font-mono text-[9px] text-zinc-500">{g.photoCount} raw • ${calcHourlyMetric.toFixed(0)}/hr est</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded ${getStatusBadgeColor(g.status)}`}>
                      {g.status}
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock size={8} /> {formatTotalHours(g.times)}
                    </div>
                    {/* mini progress block */}
                    <div className="w-12 bg-lrDarkest h-1.5 rounded-full overflow-hidden border border-lrBorder">
                      <div
                        className="bg-lrBlue h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
