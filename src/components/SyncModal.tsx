import React, { useState } from 'react';
import { SyncSettings, GitHubSettings, Gallery } from '../types';
import { generateDefaultChecklists } from '../data';
import { X, Calendar, Link, FileText, Github, AlertTriangle, CloudRain, CheckSquare, UploadCloud } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  githubSettings: GitHubSettings;
  onSaveSettings: (settings: SyncSettings) => void;
  onSaveGitHub: (settings: GitHubSettings) => void;
  onImportGalleries: (imported: Gallery[]) => void;
  onShowNotification: (msg: string) => void;
}

export default function SyncModal({
  isOpen,
  onClose,
  settings,
  githubSettings,
  onSaveSettings,
  onSaveGitHub,
  onImportGalleries,
  onShowNotification
}: SyncModalProps) {
  const [activeTab, setActiveTab] = useState<'google_embed' | 'honeybook' | 'csv' | 'github'>('google_embed');
  const [embedCode, setEmbedCode] = useState(settings.googleCalendarEmbedCode || '');
  
  // HoneyBook fields
  const [hbKey, setHbKey] = useState(settings.honeybookApiKey || '');
  const [hbFeed, setHbFeed] = useState(settings.calendarFeedUrl || '');

  // GitHub fields
  const [ghUser, setGhUser] = useState(githubSettings.owner || '');
  const [ghRepo, setGhRepo] = useState(githubSettings.repo || '');
  const [ghPath, setGhPath] = useState(githubSettings.path || 'data.json');
  const [ghToken, setGhToken] = useState(githubSettings.token || '');

  // CORS warning list helper
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [failedFeeds, setFailedFeeds] = useState<{ id: string; url: string }[]>([]);

  if (!isOpen) return null;

  // ICS Parser helper
  const parseICSData = (icsText: string): Gallery[] => {
    const events: any[] = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent: any = null;

    for (let line of lines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        if (currentEvent && currentEvent._lastField) {
          currentEvent[currentEvent._lastField] += line.trim();
        }
        continue;
      }
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1);
      const key = keyPart.split(';')[0].trim();

      if (key === 'BEGIN' && value.trim() === 'VEVENT') {
        currentEvent = { _lastField: '' };
        continue;
      }
      if (key === 'END' && value.trim() === 'VEVENT') {
        if (currentEvent) {
          events.push(currentEvent);
          currentEvent = null;
        }
        continue;
      }
      if (currentEvent) {
        currentEvent[key] = value.trim();
        currentEvent._lastField = key;
      }
    }

    return events.map((ev, index) => {
      const rawSummary = ev.SUMMARY || 'Untitled Photoshoot';
      const rawDate = ev.DTSTART || '';
      let parsedDate = new Date();
      if (rawDate.length >= 8) {
        const y = rawDate.substr(0, 4);
        const m = parseInt(rawDate.substr(4, 2)) - 1;
        const d = rawDate.substr(6, 2);
        parsedDate = new Date(Number(y), m, Number(d));
      }

      const isPotentialInquiry = rawSummary.toLowerCase().startsWith('inquiry:');
      const displaySummary = isPotentialInquiry ? rawSummary.replace(/^inquiry:\s*/i, '') : rawSummary;
      
      let client = 'N/A';
      if (displaySummary.includes('-')) {
        client = displaySummary.split('-')[0].trim();
      } else if (displaySummary.includes('&')) {
        client = displaySummary;
      }

      let category: any = 'portrait';
      const lowSummary = displaySummary.toLowerCase();
      if (lowSummary.includes('wedding') || lowSummary.includes('bride')) category = 'wedding';
      else if (lowSummary.includes('urban') || lowSummary.includes('street')) category = 'portrait';
      else if (lowSummary.includes('landscape') || lowSummary.includes('nature') || lowSummary.includes('corporate') || lowSummary.includes('company') || lowSummary.includes('brand')) category = 'other';

      const uid = `g-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`;
      const gal: Gallery = {
        id: uid,
        name: displaySummary,
        client: client,
        photoCount: 250,
        hourlyRate: 75,
        category: category,
        status: isPotentialInquiry ? 'Inquiry' : (parsedDate > new Date() ? 'Upcoming' : 'Not Started'),
        createdAt: parsedDate.toISOString(),
        notes: ev.DESCRIPTION || 'Imported via Google Calendar feed.',
        archived: false,
        checklists: isPotentialInquiry ? {
          import: [{ id: `imp-${uid}-inq`, text: 'Awaiting client contract and retainer payment', completed: false }],
          culling: [], global: [], local: [], export: []
        } : generateDefaultChecklists(uid),
        times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
        logs: []
      };
      return gal;
    });
  };

  const fetchCalendarWithProxyFallback = async (url: string) => {
    const proxies = [
      (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.org/?url=${encodeURIComponent(u)}`
    ];
    
    for (const getProxyUrl of proxies) {
      try {
        const res = await fetch(getProxyUrl(url));
        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('BEGIN:VCALENDAR')) return text;
        }
      } catch (err) {
        console.warn("Proxy attempt failed, shifting proxy link...");
      }
    }
    throw new Error("All proxy pathways returned Cors barriers.");
  };

  const handleSyncGCal = async () => {
    if (!embedCode.trim()) {
      onShowNotification("Please provide a valid Google Calendar embed iframe code.");
      return;
    }

    const srcMatch = embedCode.match(/src=["']([^"']+)["']/i);
    const urlString = srcMatch ? srcMatch[1] : embedCode.trim();

    try {
      const url = new URL(urlString);
      const searchParams = new URLSearchParams(url.search);
      const srcList = searchParams.getAll('src');
      
      const singleSrc = searchParams.get('src');
      if (srcList.length === 0 && singleSrc) {
        srcList.push(singleSrc);
      }

      if (srcList.length === 0) {
        onShowNotification("Could not identify stream IDs inside the calendar iframe.");
        return;
      }

      onShowNotification("Scanning calendar feeds via security proxies...");
      let totalImported: Gallery[] = [];
      const failed: { id: string; url: string }[] = [];

      for (const calendarId of srcList) {
        const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
        try {
          const icsText = await fetchCalendarWithProxyFallback(icalUrl);
          const parsed = parseICSData(icsText);
          if (parsed.length > 0) {
            totalImported = [...totalImported, ...parsed];
          }
        } catch (fetchErr) {
          failed.push({ id: calendarId, url: icalUrl });
        }
      }

      setFailedFeeds(failed);
      if (failed.length > 0) {
        setShowTroubleshoot(true);
      } else {
        setShowTroubleshoot(false);
      }

      if (totalImported.length > 0) {
        onImportGalleries(totalImported);
        onSaveSettings({
          ...settings,
          googleCalendarEmbedCode: embedCode
        });
        onShowNotification(`Sync complete! Scraped ${totalImported.length} shoot items from calendar feed.`);
        onClose();
      } else if (failed.length > 0) {
        onShowNotification("Calendar sync blocked by browser safety protocols (CORS). Download feeds manually below.");
      } else {
        onShowNotification("Feeds read successfully, but no valid upcoming VEVENT coordinates were found.");
      }
    } catch (err) {
      console.error(err);
      onShowNotification("Error parsing Google Calendar iframe URL structure.");
    }
  };

  const handleSaveHoneyBook = () => {
    onSaveSettings({
      ...settings,
      honeybookApiKey: hbKey,
      calendarFeedUrl: hbFeed
    });
    onShowNotification("HoneyBook integration details cached locally!");
    onClose();
  };

  const handleSaveGitHubConfig = () => {
    if (!ghToken || !ghUser || !ghRepo) {
      onShowNotification("GitHub Username, Repository, and PAT token are required to configure Remote DB.");
      return;
    }
    onSaveGitHub({
      token: ghToken,
      owner: ghUser,
      repo: ghRepo,
      path: ghPath,
      sha: githubSettings.sha || ''
    });
    onShowNotification("GitHub secure credentials linked and ready!");
    onClose();
  };

  // CSV Drag n Drop / Import
  const handleCSVImport = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) {
      onShowNotification("Empty file or non-readable dataset.");
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const importedList: Gallery[] = [];

    const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name') || h.toLowerCase().includes('title'));
    const clientIdx = headers.findIndex(h => h.toLowerCase().includes('client') || h.toLowerCase().includes('customer'));
    const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('time') || h.toLowerCase().includes('start'));
    const rateIdx = headers.findIndex(h => h.toLowerCase().includes('rate') || h.toLowerCase().includes('price') || h.toLowerCase().includes('fee'));
    const photosIdx = headers.findIndex(h => h.toLowerCase().includes('photo') || h.toLowerCase().includes('count') || h.toLowerCase().includes('quantity'));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // parse safe CSV row considering quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const row = matches.map(cell => cell.replace(/"/g, '').trim());
      
      const name = row[nameIdx === -1 ? 0 : nameIdx] || 'Imported Gallery Shoot';
      const client = clientIdx !== -1 ? (row[clientIdx] || 'N/A') : 'N/A';
      const rawDate = dateIdx !== -1 ? (row[dateIdx] || '') : '';
      const dateStr = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
      const photos = rateIdx !== -1 && !isNaN(Number(row[photosIdx])) ? Number(row[photosIdx]) : 200;
      const rate = rateIdx !== -1 && !isNaN(Number(row[rateIdx])) ? Number(row[rateIdx]) : 75;

      const uid = `g-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      importedList.push({
        id: uid,
        name,
        client,
        photoCount: photos,
        hourlyRate: rate,
        category: 'portrait',
        status: new Date(dateStr) > new Date() ? 'Upcoming' : 'Not Started',
        createdAt: dateStr,
        notes: 'Imported from spreadsheet dataset.',
        archived: false,
        checklists: generateDefaultChecklists(uid),
        times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
        logs: []
      });
    }

    if (importedList.length > 0) {
      onImportGalleries(importedList);
      onShowNotification(`Spreadsheet sync successful! Added ${importedList.length} shoot records to tracker.`);
      onClose();
    } else {
      onShowNotification("Could not parse any columns. Ensure column headers include 'Name', 'Client', and 'Date'.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.ics')) {
        const galleries = parseICSData(content);
        if (galleries.length > 0) {
          onImportGalleries(galleries);
          onShowNotification(`Successfully ingested ${galleries.length} meetings from raw iCal (.ics) catalog!`);
          onClose();
        } else {
          onShowNotification("Could not extract events from the uploaded scheduler file.");
        }
      } else {
        handleCSVImport(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="syncCenterModal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-lrPanel rounded-xl border border-lrBorder shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-lrBorder flex items-center justify-between bg-lrDarkest">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-display">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Studio Sync Center
          </h3>
          <button id="close-sync-modal" onClick={onClose} className="text-lrMuted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Sync Tabs */}
        <div className="flex border-b border-lrBorder bg-lrDarkest text-xs overflow-x-auto">
          <button
            id="tabBtnGoogleCalendar"
            onClick={() => setActiveTab('google_embed')}
            className={`flex-1 py-3 px-2 text-center border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'google_embed'
                ? 'border-lrBlue text-lrBlue font-bold'
                : 'border-transparent text-lrMuted hover:text-white'
            }`}
          >
            Google Calendar
          </button>
          <button
            id="tabBtnHoneyBook"
            onClick={() => setActiveTab('honeybook')}
            className={`flex-1 py-3 px-2 text-center border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'honeybook'
                ? 'border-lrBlue text-lrBlue font-bold'
                : 'border-transparent text-lrMuted hover:text-white'
            }`}
          >
            HoneyBook / Zapier
          </button>
          <button
            id="tabBtnCSV"
            onClick={() => setActiveTab('csv')}
            className={`flex-1 py-3 px-2 text-center border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-lrBlue text-lrBlue font-bold'
                : 'border-transparent text-lrMuted hover:text-white'
            }`}
          >
            CSV / (.ics) File
          </button>
          <button
            id="tabBtnGitHub"
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-3 px-2 text-center border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-lrBlue text-lrBlue font-bold'
                : 'border-transparent text-lrMuted hover:text-white'
            }`}
          >
            GitHub Cloud DB
          </button>
        </div>

        {/* Tab 1: Google Calendar Embed */}
        {activeTab === 'google_embed' && (
          <div className="p-6 space-y-4">
            <div className="bg-sky-950/20 border border-sky-500/20 rounded-lg p-3.5 space-y-1.5">
              <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 font-display">
                <Calendar size={13} />
                Auto-Sync via Google Calendar:
              </h4>
              <p className="text-[11px] leading-relaxed text-lrMuted">
                Paste your Google Calendar iframe code or sharing URL directly. The app will securely parse feed stream IDs, gather public configurations, and ingest your shoots instantly.
              </p>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-2 font-mono">Google Calendar Embed HTML / Link</label>
              <textarea
                id="googleCalendarEmbedCode"
                rows={4}
                value={embedCode}
                onChange={(e) => setEmbedCode(e.target.value)}
                placeholder='<iframe src="https://calendar.google.com/calendar/embed?src=example%40gmail.com&..." ...></iframe>'
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue font-mono resize-none transition"
              />
            </div>

            {showTroubleshoot && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 space-y-2">
                <p className="text-[10px] text-amber-300 leading-relaxed font-sans flex items-center gap-1">
                  <AlertTriangle size={12} />
                  CORS security restriction blocked direct extraction feed.
                </p>
                <span className="text-[9px] text-lrMuted block">
                  Copy and paste these feed URLs in your browser to download the calendar files, then upload them in the "CSV / .ics File" tab:
                </span>
                <div className="flex flex-col gap-1.5 pt-1">
                  {failedFeeds.map((feed, idx) => (
                    <a
                      key={idx}
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-lrBlue hover:underline break-all bg-lrBg/60 p-1.5 rounded border border-lrBorder font-mono inline-block block"
                    >
                      Retrieve Feed {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-lrBorder flex justify-between items-center text-xs">
              <button
                id="btnSyncEmbed"
                onClick={handleSyncGCal}
                className="px-4 py-2 bg-lrBlue hover:bg-lrBlueHover text-lrDarkest font-bold rounded-md transition duration-150 cursor-pointer"
              >
                Sync Custom Feeds
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-lrBorder hover:bg-lrBorderLight text-slate-300 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: HoneyBook API Calendar */}
        {activeTab === 'honeybook' && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3.5 space-y-1.5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-display">
                <Link size={13} />
                HoneyBook Integration Parameters:
              </h4>
              <p className="text-[11px] leading-relaxed text-lrMuted font-sans">
                Store your workflow pipeline properties locally. This aligns metadata coordinates securely so you can trigger inbound client feeds and monitor shoot updates automatically.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1.5 font-mono">HoneyBook API / Zapier Secret Key</label>
                <input
                  id="honeybookApiKey"
                  type="password"
                  value={hbKey}
                  onChange={(e) => setHbKey(e.target.value)}
                  placeholder="Insert secret token key..."
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1.5 font-mono">HoneyBook iCal Calendar Feed URL</label>
                <input
                  id="calendarFeedUrl"
                  type="url"
                  value={hbFeed}
                  onChange={(e) => setHbFeed(e.target.value)}
                  placeholder="https://api.honeybook.com/calendar/v1/feed/..."
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-lrBorder flex justify-between items-center text-xs">
              <button
                onClick={handleSaveHoneyBook}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md transition"
              >
                Save Integration Feed
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-lrBorder hover:bg-lrBorderLight text-slate-300 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: CSV/ICS Drag Drop File upload */}
        {activeTab === 'csv' && (
          <div className="p-6 space-y-4">
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-3.5">
              <p className="text-[11px] leading-relaxed text-lrMuted font-sans">
                Select your calendar export files (<span className="text-purple-300 font-bold">.ics</span>) or client spreadsheets (<span className="text-purple-300 font-bold">.csv</span>) directly below. Row headers mapping portrait, couples, and client coordinates are parsed inside your browser.
              </p>
            </div>

            <div
              onClick={() => document.getElementById('drag-file-uploader')?.click()}
              className="border-2 border-dashed border-lrBorder hover:border-lrBlue hover:bg-lrBlue/5 transition duration-150 rounded-lg p-8 text-center cursor-pointer space-y-2 group"
            >
              <div className="flex justify-center text-lrMuted group-hover:text-lrBlue transition">
                <UploadCloud size={36} className="animate-bounce" />
              </div>
              <span className="text-xs font-semibold text-white block">Ingest Catalog Spreadsheet or Schedule</span>
              <span className="text-[10px] text-lrMuted block">Click to select files (Supports .csv or .ics format)</span>
              <input
                type="file"
                id="drag-file-uploader"
                accept=".csv,.ics"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="pt-4 border-t border-lrBorder flex justify-end text-xs">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-lrBorder hover:bg-lrBorderLight text-slate-300 rounded-md transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: GitHub DB Sync Settings */}
        {activeTab === 'github' && (
          <div className="p-6 space-y-3.5">
            <div className="bg-zinc-900 border border-lrBorder rounded-lg p-3.5 space-y-1">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1 font-display">
                <Github size={13} />
                GitHub Remote Cloud Backup:
              </h4>
              <p className="text-[11px] leading-relaxed text-lrMuted font-sans">
                Keep your Lightroom sessions synced completely free across computers! Commit your database file (<code className="text-xs text-white font-mono bg-lrBg px-1 rounded">data.json</code>) securely to your own repository using a Personal Access Token.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">GitHub Owner/Username</label>
                <input
                  id="ghUsername"
                  type="text"
                  value={ghUser}
                  onChange={(e) => setGhUser(e.target.value)}
                  placeholder="e.g. photog-studio"
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Repository Name</label>
                <input
                  id="ghRepo"
                  type="text"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  placeholder="e.g. workflow-db"
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Database File Path</label>
              <input
                id="ghPath"
                type="text"
                value={ghPath}
                onChange={(e) => setGhPath(e.target.value)}
                placeholder="e.g. data.json"
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Personal Access Token (PAT)</label>
              <input
                id="ghToken"
                type="password"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
              <span className="text-[9px] text-lrMuted block mt-1 leading-normal font-sans">
                Stored purely inside your current browser session. Needs 'repo' scope access.
              </span>
            </div>

            <div className="pt-4 border-t border-lrBorder flex justify-between items-center text-xs">
              <button
                onClick={handleSaveGitHubConfig}
                className="px-4 py-2 bg-lrBlue hover:bg-lrBlueHover text-lrDarkest font-bold rounded-md transition"
              >
                Save Remote Repo
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-lrBorder hover:bg-lrBorderLight text-slate-300 rounded-md transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
