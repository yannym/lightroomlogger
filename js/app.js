const PHASES = [
  { id: 'import', name: '1. Import & Setup', color: 'from-sky-500 to-indigo-500', colorText: 'text-sky-400' },
  { id: 'culling', name: '2. Culling / Rating', color: 'from-amber-500 to-orange-500', colorText: 'text-amber-400' },
  { id: 'global', name: '3. Global Edits', color: 'from-emerald-500 to-teal-500', colorText: 'text-emerald-400' },
  { id: 'local', name: '4. Local & Masking', color: 'from-fuchsia-500 to-pink-500', colorText: 'text-fuchsia-400' },
  { id: 'export', name: '5. Exporting', color: 'from-rose-500 to-purple-500', colorText: 'text-rose-400' }
];

const GRADIENTS = {
  portrait: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #1c1917 100%)',
  wedding: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #312e81 100%)',
  urban: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 50%, #0f172a 100%)',
  landscape: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #1e1b4b 100%)',
  corporate: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #0f172a 100%)'
};

const AppState = {
  galleries: [],
  activeGalleryId: 'g-1',
  activePhaseId: 'global',
  isPlaying: false,
  timeElapsed: 0,
  timerInterval: null,
  directoryLayout: 'list',
  directoryZoom: 1.0,
  directorySortBy: 'date-desc',
  showArchived: false,
  confirmCallback: null,
  integrationSettings: {
    zapierUrl: '',
    autoSyncNew: true,
    calendarFeedUrl: '',
    googleCalendarEmbedCode: '',
    honeybookApiKey: 'a1aac4ff-7097-43d1-a179-1cb7ba7e9608'
  },
  github: {
    token: '',
    owner: '',
    repo: '',
    path: 'data.json',
    sha: ''
  }
};

const DEFAULT_DATA = [
  {
    id: 'g-1',
    name: 'Sarah & Mark - Forest Wedding',
    client: 'Sarah & Mark Jenkins',
    photoCount: 420,
    hourlyRate: 75,
    status: 'In Progress',
    category: 'wedding',
    thumbnailUrl: '', 
    picTimeUrl: 'https://sarahandmark.pic-time.com/-wedding',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Soft, golden-hour lighting. Needs warm presets and heavy masking.',
    archived: false,
    checklists: {
      import: [
        { id: 'imp-1', text: 'Generate Smart Previews on import', completed: true },
        { id: 'imp-2', text: 'Apply camera profile & lens corrections', completed: true },
        { id: 'imp-3', text: 'Backup raw files to second SSD', completed: true }
      ],
      culling: [
        { id: 'cul-1', text: 'First-pass speed cull', completed: true },
        { id: 'cul-2', text: 'Star-rate (4-star keepers)', completed: false }
      ],
      global: [
        { id: 'glo-1', text: 'Correct White Balance across sequence', completed: true },
        { id: 'glo-2', text: 'Apply custom tone curves', completed: false }
      ],
      local: [
        { id: 'loc-1', text: 'Brush masking for subject pop', completed: false },
        { id: 'loc-2', text: 'Heal background distractions', completed: false }
      ],
      export: [
        { id: 'exp-1', text: 'Output sharp print-res JPEG files', completed: false },
        { id: 'exp-2', text: 'Web-optimized backups', completed: false }
      ]
    },
    times: { import: 1240, culling: 3450, global: 2100, local: 1540, export: 0 },
    logs: [
      { id: 'l-1', phase: 'import', duration: 1240, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: 'Imported' },
      { id: 'l-2', phase: 'culling', duration: 2400, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Initial Pass' }
    ]
  }
];

const toggleModal = (modalId, show) => {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.toggle('hidden', !show);
};

function showNotification(message) {
  const toast = document.getElementById('customToast');
  const text = document.getElementById('toastMessage');
  if (!toast || !text) return;
  text.innerText = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3500);
}

function triggerCustomConfirm(message, callback) {
  const modal = document.getElementById('customConfirmModal');
  const text = document.getElementById('confirmMessage');
  const confirmActionBtn = document.getElementById('confirmBtnAction');
  if (!modal || !text || !confirmActionBtn) return;
  text.innerText = message;
  modal.classList.remove('hidden');
  confirmActionBtn.onclick = function() {
    modal.classList.add('hidden');
    if (callback) callback();
  };
}

function closeConfirmDialog(isConfirmed) {
  toggleModal('customConfirmModal', false);
}

// GITHUB REMOTE DATABASE CONNECTORS
async function fetchFromGitHub() {
  const { token, owner, repo, path } = AppState.github;
  if (!token || !owner || !repo) return;

  try {
    showNotification("Fetching database from GitHub...");
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (res.ok) {
      const data = await res.json();
      AppState.github.sha = data.sha;
      const content = atob(data.content.replace(/\s/g, ''));
      const parsedGalleries = JSON.parse(content);
      if (Array.isArray(parsedGalleries)) {
        AppState.galleries = parsedGalleries;
        saveStorage(); 
        renderDirectory();
        renderActiveGallery();
        showNotification("Database synchronized from GitHub!");
      }
    } else if (res.status === 404) {
      showNotification("Remote file not found. Click 'Save DB to GitHub' to initialize data.json.");
    } else {
      showNotification("GitHub download rejected. Check config token permission.");
    }
  } catch (err) {
    console.error(err);
    showNotification("GitHub connection error.");
  }
}

async function saveToGitHub() {
  const { token, owner, repo, path, sha } = AppState.github;
  if (!token || !owner || !repo) {
    showNotification("Set up your GitHub token first under Sync Center > GitHub DB.");
    return;
  }

  try {
    showNotification("Pushing database updates to GitHub...");
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const contentString = JSON.stringify(AppState.galleries, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(contentString)));

    const body = {
      message: "Lightroom Session Tracker data save",
      content: base64Content
    };
    if (sha) body.sha = sha;

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
      AppState.github.sha = data.content.sha;
      showNotification("Successfully committed to GitHub!");
    } else {
      const errData = await res.json();
      console.error(errData);
      showNotification("GitHub push failed. Verify write permissions.");
    }
  } catch (err) {
    console.error(err);
    showNotification("GitHub connection upload error.");
  }
}

function saveGitHubSettings() {
  AppState.github.owner = document.getElementById('ghUsername').value.trim();
  AppState.github.repo = document.getElementById('ghRepo').value.trim();
  AppState.github.path = document.getElementById('ghPath').value.trim();
  AppState.github.token = document.getElementById('ghToken').value.trim();

  localStorage.setItem('LrWorkflowTracker_GitHub', JSON.stringify(AppState.github));
  showNotification("GitHub remote configuration cached!");
  
  const pushBtn = document.getElementById('btnGitHubPush');
  if (pushBtn) pushBtn.classList.remove('hidden');

  fetchFromGitHub();
}

// STANDARD LOCAL STORAGE HANDLERS
function loadStorage() {
  const stored = localStorage.getItem('LrWorkflowTracker_DB');
  if (stored) {
    try { AppState.galleries = JSON.parse(stored); } catch (e) { AppState.galleries = [...DEFAULT_DATA]; }
  } else {
    AppState.galleries = [...DEFAULT_DATA];
    saveStorage();
  }

  const storedIntegrations = localStorage.getItem('LrWorkflowTracker_Integrations');
  if (storedIntegrations) {
    try { AppState.integrationSettings = { ...AppState.integrationSettings, ...JSON.parse(storedIntegrations) }; } catch (e) {}
  }

  const storedGitHub = localStorage.getItem('LrWorkflowTracker_GitHub');
  if (storedGitHub) {
    try { 
      AppState.github = JSON.parse(storedGitHub); 
      const pushBtn = document.getElementById('btnGitHubPush');
      if (pushBtn && AppState.github.token) pushBtn.classList.remove('hidden');
    } catch (e) {}
  }
  
  const storedLayout = localStorage.getItem('LrWorkflowTracker_Layout');
  if (storedLayout) AppState.directoryLayout = storedLayout;
  
  const storedZoom = localStorage.getItem('LrWorkflowTracker_Zoom');
  if (storedZoom) {
    AppState.directoryZoom = parseFloat(storedZoom);
    document.getElementById('zoomSlider').value = AppState.directoryZoom;
    document.getElementById('zoomDisplay').innerText = `${Math.round(AppState.directoryZoom * 100)}%`;
  }

  const storedSort = localStorage.getItem('LrWorkflowTracker_SortBy');
  if (storedSort) {
    AppState.directorySortBy = storedSort;
    document.getElementById('catalogSortBy').value = AppState.directorySortBy;
  }
  
  const storedActive = localStorage.getItem('LrWorkflowTracker_ActiveID');
  if (storedActive && AppState.galleries.some(g => g.id === storedActive)) {
    AppState.activeGalleryId = storedActive;
  } else if (AppState.galleries.length > 0) {
    AppState.activeGalleryId = AppState.galleries[0].id;
  }
}

function saveStorage() {
  localStorage.setItem('LrWorkflowTracker_DB', JSON.stringify(AppState.galleries));
  localStorage.setItem('LrWorkflowTracker_ActiveID', AppState.activeGalleryId);
}

function saveIntegrationSettingsLocal() {
  localStorage.setItem('LrWorkflowTracker_Integrations', JSON.stringify(AppState.integrationSettings));
}

function generateDefaultChecklists(uid) {
  return {
    import: [
      { id: `imp-${uid}-1`, text: 'Ingest raw images from card', completed: false },
      { id: `imp-${uid}-2`, text: 'Confirm redundant backup storage sync', completed: false },
      { id: `imp-${uid}-3`, text: 'Build smart previews (1:1 checks)', completed: false }
    ],
    culling: [
      { id: `cul-${uid}-1`, text: 'Perform primary star cull pass', completed: false },
      { id: `cul-${uid}-2`, text: 'Color label portfolio candidate selections', completed: false }
    ],
    global: [
      { id: `glo-${uid}-1`, text: 'Apply lens profile calibration & CA correction', completed: false },
      { id: `glo-${uid}-2`, text: 'Establish correct reference white balance', completed: false }
    ],
    local: [
      { id: `loc-${uid}-1`, text: 'Heal background spots and sensor dust', completed: false },
      { id: `loc-${uid}-2`, text: 'Generate brush masks to isolate subjects', completed: false }
    ],
    export: [
      { id: `exp-${uid}-1`, text: 'Apply high-pass output sharpening', completed: false },
      { id: `exp-${uid}-2`, text: 'Process batch print sRGB JPEGs', completed: false }
    ]
  };
}

function handleSortChange(sortVal) {
  AppState.directorySortBy = sortVal;
  localStorage.setItem('LrWorkflowTracker_SortBy', sortVal);
  renderDirectory();
}

function handleZoomChange(zoomVal) {
  AppState.directoryZoom = parseFloat(zoomVal);
  document.getElementById('zoomDisplay').innerText = `${Math.round(AppState.directoryZoom * 100)}%`;
  localStorage.setItem('LrWorkflowTracker_Zoom', zoomVal);
  renderDirectory();
}

function setDirectoryLayout(layoutType) {
  AppState.directoryLayout = layoutType;
  localStorage.setItem('LrWorkflowTracker_Layout', layoutType);
  
  const listBtn = document.getElementById('btnListView');
  const gridBtn = document.getElementById('btnGridView');
  if (!listBtn || !gridBtn) return;
  
  if (layoutType === 'grid') {
    gridBtn.classList.add('bg-slate-800', 'text-lrBlue');
    gridBtn.classList.remove('text-gray-500');
    listBtn.classList.remove('bg-slate-800', 'text-lrBlue');
    listBtn.classList.add('text-gray-500');
  } else {
    listBtn.classList.add('bg-slate-800', 'text-lrBlue');
    listBtn.classList.remove('text-gray-500');
    gridBtn.classList.remove('bg-slate-800', 'text-lrBlue');
    gridBtn.classList.add('text-gray-500');
  }
  renderDirectory();
}

function getSortedGalleries() {
  const filtered = AppState.galleries.filter(g => {
    const isArchived = g.hasOwnProperty('archived') ? g.archived : false;
    return isArchived === AppState.showArchived;
  });
  const key = AppState.directorySortBy;
  return filtered.sort((a, b) => {
    if (key === 'name-asc') return a.name.localeCompare(b.name);
    if (key === 'name-desc') return b.name.localeCompare(a.name);
    if (key === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function toggleArchivedView() {
  AppState.showArchived = !AppState.showArchived;
  const btn = document.getElementById('archiveToggleBtn');
  if (!btn) return;
  if (AppState.showArchived) {
    btn.innerText = "Show Archived";
    btn.className = "text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded hover:bg-amber-500/20 transition";
  } else {
    btn.innerText = "Show Active";
    btn.className = "text-[10px] text-lrBlue font-semibold bg-lrBlue/10 px-2 py-0.5 rounded hover:bg-lrBlue/20 transition";
  }
  const visible = getSortedGalleries();
  if (visible.length > 0) AppState.activeGalleryId = visible[0].id;
  renderDirectory();
  renderActiveGallery();
}

function formatShootDateTime(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function parseICS(icsText) {
  const events = [];
  const lines = icsText.split(/\r?\n/);
  let currentEvent = null;

  for (let line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentEvent && currentEvent._lastField) currentEvent[currentEvent._lastField] += line.trim();
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
      if (currentEvent) { events.push(currentEvent); currentEvent = null; }
      continue;
    }
    if (currentEvent) {
      currentEvent[key] = value.trim();
      currentEvent._lastField = key;
    }
  }

  return events.map(ev => {
    const rawSummary = ev.SUMMARY || 'Untitled Session';
    const rawDate = ev.DTSTART || '';
    let parsedDate = new Date();
    if (rawDate.length >= 8) {
      const y = rawDate.substr(0, 4);
      const m = parseInt(rawDate.substr(4, 2)) - 1;
      const d = rawDate.substr(6, 2);
      parsedDate = new Date(y, m, d);
    }

    const isPotentialInquiry = rawSummary.toLowerCase().startsWith('inquiry:');
    const displaySummary = isPotentialInquiry ? rawSummary.replace(/^inquiry:\s*/i, '') : rawSummary;
    let client = 'N/A';
    if (displaySummary.includes('-')) client = displaySummary.split('-')[0].trim();
    else if (displaySummary.includes('&')) client = displaySummary;

    let category = 'portrait';
    const lowSummary = displaySummary.toLowerCase();
    if (lowSummary.includes('wedding') || lowSummary.includes('bride')) category = 'wedding';
    else if (lowSummary.includes('urban') || lowSummary.includes('street')) category = 'urban';

    const gal = createGalleryObject(displaySummary, client, 200, 75, category, parsedDate.toISOString(), ev.DESCRIPTION || '');
    if (isPotentialInquiry) {
      gal.status = 'Inquiry';
      gal.checklists = {
        import: [{ id: `imp-${gal.id}-inq`, text: 'Awaiting client contract signing', completed: false }],
        culling: [], global: [], local: [], export: []
      };
    }
    return gal;
  });
}

async function fetchCalendarWithProxyFallback(url) {
  const proxies = [
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.org/?url=${encodeURIComponent(u)}`
  ];
  for (const getProxyUrl of proxies) {
    try {
      const res = await fetch(getProxyUrl(url));
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('BEGIN:VCALENDAR')) return text;
      }
    } catch (err) { console.warn("Proxy path shift..."); }
  }
  throw new Error("Proxy connection routes failed.");
}

async function syncGoogleCalendarEmbed() {
  const code = document.getElementById('googleCalendarEmbedCode').value.trim();
  if (!code) { showNotification("Please paste your Google Calendar embed iframe block."); return; }
  const srcMatch = code.match(/src=["']([^"']+)["']/i);
  const urlString = srcMatch ? srcMatch[1] : code;

  try {
    const url = new URL(urlString);
    const searchParams = new URLSearchParams(url.search);
    const srcList = searchParams.getAll('src');
    if (srcList.length === 0) {
      const singleSrc = searchParams.get('src');
      if (singleSrc) srcList.push(singleSrc);
    }
    if (srcList.length === 0) { showNotification("We couldn't extract any Google Calendar IDs."); return; }

    AppState.integrationSettings.googleCalendarEmbedCode = code;
    saveIntegrationSettingsLocal();
    showNotification("Querying calendar streams...");

    let totalImported = 0;
    const failedCalendars = [];

    for (const calendarId of srcList) {
      const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
      try {
        const icsText = await fetchCalendarWithProxyFallback(icalUrl);
        const imported = parseICS(icsText);
        if (imported.length > 0) {
          const existingNames = AppState.galleries.map(g => g.name.toLowerCase());
          const uniqueImports = imported.filter(item => !existingNames.includes(item.name.toLowerCase()));
          if (uniqueImports.length > 0) {
            AppState.galleries = [...uniqueImports, ...AppState.galleries];
            AppState.activeGalleryId = uniqueImports[0].id;
            totalImported += uniqueImports.length;
          }
        }
      } catch (fetchErr) { failedCalendars.push({ id: calendarId, url: icalUrl }); }
    }

    if (totalImported > 0) {
      saveStorage();
      saveToGitHub(); 
      renderDirectory();
      renderActiveGallery();
      closeSyncCenterModal();
      showNotification(`Successfully imported ${totalImported} new shoots!`);
    }
  } catch (err) { showNotification("Calendar sync failure."); }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const parsedGalleries = [];

  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
  const clientIdx = headers.findIndex(h => h.toLowerCase().includes('client'));
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const row = matches.map(cell => cell.replace(/"/g, '').trim());
    if (row.length === 0 || !row[nameIdx === -1 ? 0 : nameIdx]) continue;

    const summary = row[nameIdx === -1 ? 0 : nameIdx] || 'Imported Shoot';
    const client = clientIdx !== -1 ? (row[clientIdx] || 'N/A') : 'N/A';
    const rawDate = dateIdx !== -1 ? (row[dateIdx] || '') : '';
    const dateStr = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

    parsedGalleries.push(createGalleryObject(summary, client, 200, 75, 'portrait', dateStr, ''));
  }
  return parsedGalleries;
}

function createGalleryObject(name, client, photos, rate, category, dateString, notes) {
  const uid = `g-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  return {
    id: uid,
    name: name,
    client: client,
    photoCount: photos,
    hourlyRate: rate,
    category: category,
    thumbnailUrl: '',
    status: new Date(dateString) > new Date() ? 'Upcoming' : 'Not Started',
    createdAt: dateString || new Date().toISOString(),
    notes: notes || '',
    archived: false,
    checklists: generateDefaultChecklists(uid),
    times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
    logs: []
  };
}

function toggleTimer() {
  const btn = document.getElementById('btnPlayPause');
  const icon = document.getElementById('playPauseIcon');
  const saveBtn = document.getElementById('btnSaveTime');
  const resetBtn = document.getElementById('btnResetTimer');
  const dot = document.getElementById('pulsingDot');
  if (!btn || !icon || !saveBtn || !resetBtn || !dot) return;

  if (!AppState.isPlaying) {
    AppState.isPlaying = true;
    btn.className = "p-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transition active:scale-95";
    icon.innerHTML = `<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"></rect><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"></rect>`;
    dot.className = "w-2 h-2 rounded-full animate-pulse bg-red-500";
    saveBtn.disabled = false;
    saveBtn.classList.remove('opacity-40', 'cursor-not-allowed');
    resetBtn.disabled = false;
    resetBtn.className = "p-2.5 rounded-lg text-zinc-400 hover:text-white transition";

    AppState.timerInterval = setInterval(() => {
      AppState.timeElapsed++;
      document.getElementById('timerDisplay').innerText = formatTime(AppState.timeElapsed);
    }, 1000);
  } else {
    AppState.isPlaying = false;
    btn.className = "p-3.5 rounded-lg bg-lrBlue hover:bg-lrBlueHover text-slate-950 flex items-center justify-center shadow-lg transition active:scale-95";
    icon.innerHTML = `<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"></polygon>`;
    dot.className = "w-2 h-2 rounded-full bg-zinc-600";
    clearInterval(AppState.timerInterval);
  }
}

function resetTimer() {
  triggerCustomConfirm("Discard current stopwatch duration?", function() {
    stopTimerEngine();
    AppState.timeElapsed = 0;
    document.getElementById('timerDisplay').innerText = formatTime(0);
    renderActiveGallery();
  });
}

function stopTimerEngine() {
  if (AppState.isPlaying) toggleTimer();
  const saveBtn = document.getElementById('btnSaveTime');
  const resetBtn = document.getElementById('btnResetTimer');
  if (saveBtn && resetBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.add('opacity-40', 'cursor-not-allowed');
    resetBtn.disabled = true;
    resetBtn.className = "p-2.5 rounded-lg text-zinc-700 cursor-not-allowed transition";
  }
}

function saveActiveTimerSegment() {
  if (AppState.timeElapsed <= 0) return;
  const activePhaseObj = PHASES.find(p => p.id === AppState.activePhaseId);
  logTime(AppState.activePhaseId, AppState.timeElapsed, `Timer capture for ${activePhaseObj.name}`);
  AppState.timeElapsed = 0;
  document.getElementById('timerDisplay').innerText = formatTime(0);
  stopTimerEngine();
  renderActiveGallery();
}

function logTime(phaseId, seconds, noteText) {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  activeGal.times[phaseId] = (activeGal.times[phaseId] || 0) + seconds;
  activeGal.logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    phase: phaseId,
    duration: seconds,
    timestamp: new Date().toISOString(),
    note: noteText || 'Segment Log'
  });
  if (['Not Started', 'Upcoming', 'Inquiry'].includes(activeGal.status)) activeGal.status = 'In Progress';
  saveStorage();
  saveToGitHub(); 
  renderActiveGallery();
  renderDirectory();
}

function handleConvertInquiry() {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (activeGal && activeGal.status === 'Inquiry') {
    activeGal.status = 'Not Started';
    activeGal.checklists = generateDefaultChecklists(activeGal.id);
    saveStorage();
    saveToGitHub();
    renderDirectory();
    renderActiveGallery();
    showNotification(`Converted to active Project!`);
  }
}

function changePhase(phaseId) {
  if (AppState.isPlaying) {
    logTime(AppState.activePhaseId, AppState.timeElapsed, "Timer auto-saved on phase swap");
    AppState.timeElapsed = 0;
    document.getElementById('timerDisplay').innerText = formatTime(0);
    stopTimerEngine();
  }
  AppState.activePhaseId = phaseId;
  document.getElementById('timerPhaseTitle').innerText = `${PHASES.find(p => p.id === phaseId).name.toUpperCase()} TIMER`;
  renderActiveGallery();
}

function updateNotes(text) {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  activeGal.notes = text;
  document.getElementById('notesCount').innerText = `${text.length} characters`;
  saveStorage();
}

function toggleChecklistItem(phaseId, taskId) {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  const targetItem = activeGal.checklists[phaseId].find(item => item.id === taskId);
  if (targetItem) targetItem.completed = !targetItem.completed;
  saveStorage();
  saveToGitHub();
  renderActiveGallery();
}

function deleteChecklistItem(phaseId, taskId) {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  activeGal.checklists[phaseId] = activeGal.checklists[phaseId].filter(item => item.id !== taskId);
  saveStorage();
  saveToGitHub();
  renderActiveGallery();
}

function handleAddChecklistItem(event, phaseId) {
  event.preventDefault();
  const input = document.getElementById(`input-add-${phaseId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  activeGal.checklists[phaseId].push({ id: `todo-${Date.now()}`, text: text, completed: false });
  input.value = '';
  saveStorage();
  saveToGitHub();
  renderActiveGallery();
}

function deleteTimelineLog(logId, phaseId, duration) {
  triggerCustomConfirm("Delete this log segment?", function() {
    const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
    if (!activeGal) return;
    activeGal.times[phaseId] = Math.max(0, (activeGal.times[phaseId] || 0) - duration);
    activeGal.logs = activeGal.logs.filter(l => l.id !== logId);
    saveStorage();
    saveToGitHub();
    renderActiveGallery();
    renderDirectory();
  });
}

function triggerZapierWebhook(event, galleryObj) {
  if (!AppState.integrationSettings.zapierUrl) return;
  const payload = { event, galleryId: galleryObj.id, name: galleryObj.name, client: galleryObj.client, timestamp: new Date().toISOString() };
  fetch(AppState.integrationSettings.zapierUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  .catch(err => console.error('Zapier trigger failure:', err));
}

const openNewGalleryModal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('newGalDate').value = now.toISOString().slice(0, 16);
  toggleModal('newGalleryOpenModal', true);
};
const closeNewGalleryModal = () => toggleModal('newGalleryOpenModal', false);
const openManualLogModal = () => toggleModal('manualLogModal', true);
const closeManualLogModal = () => toggleModal('manualLogModal', false);

const openIntegrationsModal = () => {
  document.getElementById('zapierUrlInput').value = AppState.integrationSettings.zapierUrl || '';
  document.getElementById('autoSyncNew').checked = AppState.integrationSettings.autoSyncNew;
  toggleModal('integrationsModal', true);
};
const closeIntegrationsModal = () => toggleModal('integrationsModal', false);

const openSyncCenterModal = () => {
  document.getElementById('honeybookApiKey').value = AppState.integrationSettings.honeybookApiKey || '';
  document.getElementById('calendarFeedUrl').value = AppState.integrationSettings.calendarFeedUrl || '';
  document.getElementById('googleCalendarEmbedCode').value = AppState.integrationSettings.googleCalendarEmbedCode || '';
  document.getElementById('ghUsername').value = AppState.github.owner || '';
  document.getElementById('ghRepo').value = AppState.github.repo || '';
  document.getElementById('ghPath').value = AppState.github.path || 'data.json';
  document.getElementById('ghToken').value = AppState.github.token || '';
  toggleModal('syncCenterModal', true);
};
const closeSyncCenterModal = () => toggleModal('syncCenterModal', false);

function switchSyncTab(tabId) {
  const tabs = ['google_embed', 'honeybook', 'csv', 'github'];
  const buttons = {
    google_embed: document.getElementById('tabBtnGoogleCalendar'),
    honeybook: document.getElementById('tabBtnHoneyBook'),
    csv: document.getElementById('tabBtnCSV'),
    github: document.getElementById('tabBtnGitHub')
  };
  const displays = {
    google_embed: document.getElementById('tabContentGoogleCalendar'),
    honeybook: document.getElementById('tabContentHoneyBook'),
    csv: document.getElementById('tabContentCSV'),
    github: document.getElementById('tabContentGitHub')
  };

  tabs.forEach(t => {
    if (buttons[t]) buttons[t].className = "flex-1 py-3 px-1 text-center border-b-2 border-transparent text-gray-400 font-semibold hover:text-white transition";
    if (displays[t]) displays[t].classList.add('hidden');
  });

  if (buttons[tabId]) buttons[tabId].className = "flex-1 py-3 px-1 text-center border-b-2 border-emerald-500 font-bold text-emerald-400 transition";
  if (displays[tabId]) displays[tabId].classList.remove('hidden');
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    let imported = [];
    if (file.name.endsWith('.ics')) imported = parseICS(text);
    else if (file.name.endsWith('.csv')) imported = parseCSV(text);

    if (imported.length > 0) {
      AppState.galleries = [...imported, ...AppState.galleries];
      AppState.activeGalleryId = imported[0].id;
      saveStorage();
      saveToGitHub();
      renderDirectory();
      renderActiveGallery();
      closeSyncCenterModal();
      showNotification(`Imported ${imported.length} shoots.`);
    }
  };
  reader.readAsText(file);
}

async function syncCalendarFeed() {
  const key = document.getElementById('honeybookApiKey').value.trim();
  const url = document.getElementById('calendarFeedUrl').value.trim();
  AppState.integrationSettings.honeybookApiKey = key;
  AppState.integrationSettings.calendarFeedUrl = url;
  saveIntegrationSettingsLocal();

  if (url) {
    try {
      const text = await fetchCalendarWithProxyFallback(url);
      const imported = parseICS(text);
      if (imported.length > 0) {
        AppState.galleries = [...imported, ...AppState.galleries];
        AppState.activeGalleryId = imported[0].id;
        saveStorage();
        saveToGitHub();
        renderDirectory();
        renderActiveGallery();
      }
      closeSyncCenterModal();
    } catch (err) { showNotification("Feed sync failure."); }
  }
}

const triggerThumbnailUpload = () => {
  const input = document.getElementById('coverImageInput');
  if (input) input.click();
};

function handleThumbnailFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const maxW = 500;
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
      if (activeGal) {
        activeGal.thumbnailUrl = compressedDataUrl;
        saveStorage();
        saveToGitHub();
        renderActiveGallery();
        renderDirectory();
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveIntegrationSettings() {
  AppState.integrationSettings.zapierUrl = document.getElementById('zapierUrlInput').value.trim();
  AppState.integrationSettings.autoSyncNew = document.getElementById('autoSyncNew').checked;
  saveIntegrationSettingsLocal();
  closeIntegrationsModal();
  showNotification("Integrations updated!");
}

function testWebhook() {
  const url = document.getElementById('zapierUrlInput').value.trim();
  if (!url) return;
  fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: "Test connection" }) })
  .then(() => showNotification("Test payload fired!"))
  .catch(() => showNotification("Failed connection."));
}

function openEditGalleryModal() {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  document.getElementById('editName').value = activeGal.name;
  document.getElementById('editClient').value = activeGal.client;
  document.getElementById('editPhotos').value = activeGal.photoCount;
  document.getElementById('editRate').value = activeGal.hourlyRate;
  document.getElementById('editCategory').value = activeGal.category || 'portrait';
  document.getElementById('editPicTime').value = activeGal.picTimeUrl || '';
  document.getElementById('editStatus').value = activeGal.status;
  const dateVal = activeGal.createdAt ? new Date(activeGal.createdAt) : new Date();
  dateVal.setMinutes(dateVal.getMinutes() - dateVal.getTimezoneOffset());
  document.getElementById('editDate').value = dateVal.toISOString().slice(0, 16);
  toggleModal('editGalleryModal', true);
}
const closeEditGalleryModal = () => toggleModal('editGalleryModal', false);

function handleCreateGallery(event) {
  event.preventDefault();
  const name = document.getElementById('newGalName').value.trim();
  const client = document.getElementById('newGalClient').value.trim() || 'N/A';
  const photos = parseInt(document.getElementById('newGalPhotos').value) || 200;
  const rate = parseInt(document.getElementById('newGalRate').value) || 50;
  const picTimeUrl = document.getElementById('newGalPicTime').value.trim();
  const category = document.getElementById('newGalCategory').value;
  const dateVal = document.getElementById('newGalDate').value;
  if (!name) return;

  const dateStr = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
  const newGal = createGalleryObject(name, client, photos, rate, category, dateStr, '');
  newGal.picTimeUrl = picTimeUrl;

  AppState.galleries.unshift(newGal);
  AppState.activeGalleryId = newGal.id;
  saveStorage();
  saveToGitHub();
  closeNewGalleryModal();
  if (AppState.integrationSettings.autoSyncNew) triggerZapierWebhook('create_gallery', newGal);
  renderDirectory();
  renderActiveGallery();
}

function handleCreateManualLog(event) {
  event.preventDefault();
  const phase = document.getElementById('manPhase').value;
  const minutes = parseInt(document.getElementById('manMinutes').value) || 15;
  const note = document.getElementById('manNote').value.trim();
  logTime(phase, minutes * 60, note || `Logged ${minutes}m segment`);
  closeManualLogModal();
  document.getElementById('manNote').value = '';
}

function handleSaveEditGallery(event) {
  event.preventDefault();
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;

  activeGal.name = document.getElementById('editName').value.trim();
  activeGal.client = document.getElementById('editClient').value.trim() || 'N/A';
  activeGal.photoCount = parseInt(document.getElementById('editPhotos').value) || 1;
  activeGal.hourlyRate = parseInt(document.getElementById('editRate').value) || 0;
  activeGal.picTimeUrl = document.getElementById('editPicTime').value.trim();
  activeGal.category = document.getElementById('editCategory').value;
  const editDateVal = document.getElementById('editDate').value;
  activeGal.createdAt = editDateVal ? new Date(editDateVal).toISOString() : new Date().toISOString();
  
  const prev = activeGal.status;
  activeGal.status = document.getElementById('editStatus').value;
  if (activeGal.status === 'Completed' && prev !== 'Completed') triggerZapierWebhook('complete_gallery', activeGal);

  saveStorage();
  saveToGitHub();
  closeEditGalleryModal();
  renderActiveGallery();
  renderDirectory();
}

function archiveGallery() {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  const isCurrentlyArchived = activeGal.archived || false;
  const word = isCurrentlyArchived ? "activate" : "archive";

  triggerCustomConfirm(`Are you sure you want to ${word} "${activeGal.name}"?`, function() {
    activeGal.archived = !isCurrentlyArchived;
    saveStorage();
    saveToGitHub();
    const visible = getSortedGalleries();
    AppState.activeGalleryId = visible.length > 0 ? visible[0].id : (AppState.galleries.length > 0 ? AppState.galleries[0].id : '');
    renderDirectory();
    renderActiveGallery();
  });
}

function deleteActiveGallery() {
  triggerCustomConfirm("Permanently delete this catalog gallery?", function() {
    AppState.galleries = AppState.galleries.filter(g => g.id !== AppState.activeGalleryId);
    AppState.activeGalleryId = AppState.galleries.length > 0 ? AppState.galleries[0].id : '';
    stopTimerEngine();
    AppState.timeElapsed = 0;
    document.getElementById('timerDisplay').innerText = formatTime(0);
    saveStorage();
    saveToGitHub();
    renderDirectory();
    renderActiveGallery();
  });
}

function exportData() {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeGal, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `${activeGal.name.replace(/\s+/g, '_')}_time_logs.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

function changeActiveGallery(id) {
  if (id === AppState.activeGalleryId) return;
  stopTimerEngine();
  AppState.timeElapsed = 0;
  document.getElementById('timerDisplay').innerText = formatTime(0);
  AppState.activeGalleryId = id;
  saveStorage();
  renderDirectory();
  renderActiveGallery();
}

function renderDirectory() {
  const directory = document.getElementById('galleryDirectory');
  if (!directory) return;
  directory.innerHTML = '';
  if (AppState.directoryLayout === 'grid') directory.className = "flex-1 p-2 grid grid-cols-2 gap-2 content-start";
  else directory.className = "flex-1 p-2 space-y-1.5";

  const sortedGalleries = getSortedGalleries();
  if (sortedGalleries.length === 0) {
    directory.innerHTML = `<div class="p-6 text-center text-xs text-[#727a87]">No projects found.</div>`;
    return;
  }

  sortedGalleries.forEach(g => {
    const totalTime = Object.values(g.times).reduce((a, b) => a + b, 0);
    const isActive = g.id === AppState.activeGalleryId;
    let statusBadgeClass = "bg-zinc-800 text-zinc-400 border border-transparent";
    if (g.status === 'Completed') statusBadgeClass = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10";
    if (g.status === 'In Progress') statusBadgeClass = "bg-lrBlue/15 text-lrBlue border border-lrBlue/10";
    if (g.status === 'Upcoming') statusBadgeClass = "bg-purple-500/15 text-purple-400 border border-purple-500/10";
    if (g.status === 'Inquiry') statusBadgeClass = "bg-amber-500/15 text-amber-400 border border-amber-500/20";

    let timelineHTML = '';
    PHASES.forEach(p => {
      const value = g.times[p.id] || 0;
      const pct = totalTime > 0 ? (value / totalTime) * 100 : 0;
      let segmentColor = "bg-sky-500";
      if (p.id === 'culling') segmentColor = "bg-amber-500";
      if (p.id === 'global') segmentColor = "bg-emerald-500";
      if (p.id === 'local') segmentColor = "bg-fuchsia-500";
      if (p.id === 'export') segmentColor = "bg-rose-500";
      timelineHTML += `<div style="width: ${pct}%" class="${segmentColor} h-full" title="${p.name}"></div>`;
    });

    const card = document.createElement('div');
    const isLead = g.status === 'Inquiry';
    const cardBorderClass = isActive ? 'border-lrBlue/50 shadow-inner bg-[#1d2229]' : (isLead ? 'border-amber-500/25 border-dashed bg-amber-500/5' : 'border-transparent hover:bg-lrPanel/40');
    const thumbStyle = g.thumbnailUrl ? `background-image: url(${g.thumbnailUrl}); background-size: cover; background-position: center;` : `background: ${GRADIENTS[g.category || 'portrait']};`;
    const picTimeIndicator = g.picTimeUrl ? `<span class="w-1.5 h-1.5 rounded-full bg-pictimePurple absolute top-0.5 right-0.5"></span>` : '';

    const scalarTitle = Math.max(9, Math.round(11 * AppState.directoryZoom));
    const scalarDesc = Math.max(8, Math.round(9.5 * AppState.directoryZoom));
    const scalarMeta = Math.max(7.5, Math.round(8.5 * AppState.directoryZoom));
    const scalarThumbSize = Math.max(28, Math.round(44 * AppState.directoryZoom));

    if (AppState.directoryLayout === 'grid') {
      card.className = `w-full text-left p-2 rounded-lg cursor-pointer border flex flex-col justify-between ${cardBorderClass}`;
      card.setAttribute('onclick', `changeActiveGallery('${g.id}')`);
      card.style.minHeight = `${Math.round(110 * AppState.directoryZoom)}px`;
      card.innerHTML = `
        <div>
          <div class="flex items-center gap-1.5 mb-1 justify-between">
            <span style="font-size: ${scalarMeta}px" class="text-lrMuted font-semibold truncate block">${new Date(g.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
            <span style="font-size: ${scalarMeta - 1}px" class="font-bold px-1 py-0.2 rounded font-mono uppercase ${statusBadgeClass}">${g.status === 'Inquiry' ? 'Inq' : g.status}</span>
          </div>
          <div class="flex gap-2 items-center mb-1.5">
            <div style="${thumbStyle} width: ${scalarThumbSize / 1.3}px; height: ${scalarThumbSize / 1.3}px;" class="rounded shrink-0 relative border border-white/5 overflow-hidden flex items-center justify-center">
              ${picTimeIndicator}
            </div>
            <span style="font-size: ${scalarTitle}px; line-height: 1.15;" class="font-bold truncate flex-1 block ${isActive ? 'text-white' : 'text-gray-300'}">${g.name}</span>
          </div>
        </div>
        <div>
          <div style="font-size: ${scalarDesc}px" class="text-gray-500 truncate mt-1">${g.client}</div>
          <div class="mt-2 h-1 bg-lrBorder rounded-full overflow-hidden flex">${timelineHTML}</div>
        </div>
      `;
    } else {
      card.className = `w-full text-left p-2.5 rounded-lg cursor-pointer border flex items-center gap-3 ${cardBorderClass}`;
      card.setAttribute('onclick', `changeActiveGallery('${g.id}')`);
      card.innerHTML = `
        <div style="${thumbStyle} width: ${scalarThumbSize}px; height: ${scalarThumbSize}px;" class="rounded-md shrink-0 relative border border-white/5 overflow-hidden flex items-center justify-center">
          ${picTimeIndicator}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <span style="font-size: ${scalarMeta}px" class="font-bold text-lrBlue uppercase font-mono">${formatShootDateTime(g.createdAt)}</span>
            <span style="font-size: ${scalarMeta}px" class="font-semibold px-1.5 py-0.2 rounded-full font-mono ${statusBadgeClass}">${g.status}</span>
          </div>
          <div class="flex items-start justify-between gap-1 mb-0.5">
            <span style="font-size: ${scalarTitle}px" class="font-bold truncate block ${isActive ? 'text-white' : 'text-gray-300'}">${g.name}</span>
          </div>
          <div style="font-size: ${scalarDesc}px" class="text-[#767d8a] flex items-center justify-between">
            <span class="truncate max-w-[120px]">${g.client}</span>
            <span>${g.photoCount} photos</span>
          </div>
          <div class="mt-2 h-1 bg-lrBorder rounded-full overflow-hidden flex">${timelineHTML}</div>
        </div>
      `;
    }
    directory.appendChild(card);
  });
}

function renderActiveGallery() {
  const activeGal = AppState.galleries.find(g => g.id === AppState.activeGalleryId);
  if (!activeGal) return;

  document.getElementById('activeGalleryIdTag').innerText = `ID: ${activeGal.id}`;
  document.getElementById('activeGalleryName').innerText = activeGal.name;
  document.getElementById('activeGalleryClient').innerText = activeGal.client;
  document.getElementById('activeGalleryPhotos').innerText = `${activeGal.photoCount} Photos`;
  document.getElementById('activeGalleryRate').innerText = `$${activeGal.hourlyRate}/hr`;
  document.getElementById('activeGalleryProminentDate').innerText = formatShootDateTime(activeGal.createdAt);

  const inquiryBanner = document.getElementById('inquiryBanner');
  if (inquiryBanner) inquiryBanner.classList.toggle('hidden', activeGal.status !== 'Inquiry');

  const heroBg = document.getElementById('heroImageBg');
  const heroBlurBg = document.getElementById('heroBlurBg');
  if (heroBg && heroBlurBg) {
    if (activeGal.thumbnailUrl) {
      heroBg.style.backgroundImage = `url(${activeGal.thumbnailUrl})`;
      heroBlurBg.style.backgroundImage = `url(${activeGal.thumbnailUrl})`;
    } else {
      heroBg.style.backgroundImage = '';
      heroBg.style.background = GRADIENTS[activeGal.category || 'portrait'];
    }
  }

  const statusTag = document.getElementById('activeGalleryStatusTag');
  if (statusTag) {
    statusTag.innerText = activeGal.status;
    statusTag.className = "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ";
    if (activeGal.status === 'Completed') statusTag.className += "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10";
    else if (activeGal.status === 'In Progress') statusTag.className += "bg-lrBlue/15 text-lrBlue border border-lrBlue/10";
    else if (activeGal.status === 'Upcoming') statusTag.className += "bg-purple-500/15 text-purple-400 border border-purple-500/10";
    else if (activeGal.status === 'Inquiry') statusTag.className += "bg-amber-500/15 text-amber-400 border border-amber-500/20";
    else statusTag.className += "bg-zinc-800 text-zinc-400";
  }

  const isArchived = activeGal.archived || false;
  const archiveBtn = document.getElementById('archiveBtn');
  if (archiveBtn) {
    archiveBtn.innerHTML = isArchived 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Unarchive` 
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><line x1="1" y1="3" x2="23" y2="3"></line><path d="M10 12v5"></path><path d="M14 12v5"></path></svg> Archive`;
  }
  
  const picTimeButton = document.getElementById('btnPicTimeLink');
  if (picTimeButton) {
    if (activeGal.picTimeUrl) { picTimeButton.href = activeGal.picTimeUrl; picTimeButton.classList.remove('hidden'); }
    else picTimeButton.classList.add('hidden');
  }

  const notesArea = document.getElementById('notesArea');
  if (notesArea) {
    notesArea.value = activeGal.notes || '';
    document.getElementById('notesCount').innerText = `${(activeGal.notes || '').length} characters`;
  }

  const phasesGrid = document.getElementById('phasesGrid');
  if (phasesGrid) {
    phasesGrid.innerHTML = '';
    PHASES.forEach(p => {
      const isSelected = AppState.activePhaseId === p.id;
      const totalDurationForThisPhase = (activeGal.times[p.id] || 0) + (isSelected ? AppState.timeElapsed : 0);
      phasesGrid.innerHTML += `
        <button onclick="changePhase('${p.id}')" class="p-2.5 rounded-lg text-left border transition relative flex flex-col justify-between ${isSelected ? 'bg-slate-800/85 border-lrBlue/60 text-white shadow-md ring-1 ring-lrBlue/30' : 'bg-[#1b1d22]/80 border-lrBorder hover:border-slate-600 text-gray-400'}">
          <span class="text-[9px] font-bold block truncate">${p.name}</span>
          <div class="flex items-center justify-between mt-2.5">
            <span class="font-mono text-[10px] font-bold text-gray-300">${formatShortTime(totalDurationForThisPhase)}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${p.color}"></span>
          </div>
        </button>
      `;
    });
  }

  const segmentTotalDisplay = document.getElementById('segmentTotalDisplay');
  if (segmentTotalDisplay) segmentTotalDisplay.innerText = formatShortTime((activeGal.times[AppState.activePhaseId] || 0) + AppState.timeElapsed);

  const totalTime = Object.values(activeGal.times).reduce((a, b
