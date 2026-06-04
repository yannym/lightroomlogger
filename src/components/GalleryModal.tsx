import React, { useState, useEffect } from 'react';
import { Gallery, CategoryType, GalleryStatus } from '../types';
import { generateDefaultChecklists } from '../data';
import { X, FolderPlus, Edit, Calendar, Sparkles } from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  galleryToEdit?: Gallery | null;
  onClose: () => void;
  onSubmit: (galleryData: Partial<Gallery>) => void;
  onShowNotification: (msg: string) => void;
}

export default function GalleryModal({
  isOpen,
  galleryToEdit,
  onClose,
  onSubmit,
  onShowNotification
}: GalleryModalProps) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState<CategoryType>('portrait');
  const [photoCount, setPhotoCount] = useState<number>(200);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [totalValue, setTotalValue] = useState<number>(1000);
  const [shootDuration, setShootDuration] = useState<number>(4);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [picTimeUrl, setPicTimeUrl] = useState('');
  const [picTimeFaviconUrl, setPicTimeFaviconUrl] = useState('');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const handleFetchMetadata = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl !== undefined ? targetUrl : picTimeUrl).trim();
    if (!urlToFetch) {
      if (targetUrl === undefined) {
        onShowNotification("Please enter a valid URL first.");
      }
      return;
    }
    if (!urlToFetch.toLowerCase().startsWith('http')) {
      if (targetUrl === undefined) {
        onShowNotification("Invalid URL. Make sure it starts with http:// or https://");
      }
      return;
    }

    setFetchingMetadata(true);
    try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(urlToFetch)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.status === 'success' && json.data) {
          const meta = json.data;
          
          // Cover image
          if (meta.image?.url) {
            setThumbnailUrl(meta.image.url);
            onShowNotification("Successfully pulled live gallery cover image!");
          } else {
            onShowNotification("Resolved link metadata. No client cover found, captured favicon.");
          }

          // Favicon logo
          if (meta.logo?.url) {
            setPicTimeFaviconUrl(meta.logo.url);
          } else {
            try {
              const urlObj = new URL(urlToFetch);
              setPicTimeFaviconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`);
            } catch (e) {
              setPicTimeFaviconUrl('');
            }
          }
        } else {
          try {
            const urlObj = new URL(urlToFetch);
            setPicTimeFaviconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`);
          } catch (e) {
            setPicTimeFaviconUrl('');
          }
        }
      } else {
        try {
          const urlObj = new URL(urlToFetch);
          setPicTimeFaviconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`);
        } catch {
          setPicTimeFaviconUrl('');
        }
      }
    } catch (err) {
      console.warn("Favicon lookup service fallback:", err);
      try {
        const urlObj = new URL(urlToFetch);
        setPicTimeFaviconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`);
      } catch {
        setPicTimeFaviconUrl('');
      }
    } finally {
      setFetchingMetadata(false);
    }
  };
  const [notes, setNotes] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [status, setStatus] = useState<GalleryStatus>('Not Started');
  const [priority, setPriority] = useState<'HIGH' | 'MID' | 'LOW' | 'OTHER'>('MID');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (galleryToEdit) {
      setName(galleryToEdit.name);
      setClient(galleryToEdit.client);
      setCategory(galleryToEdit.category);
      setPhotoCount(galleryToEdit.photoCount);
      setHourlyRate(galleryToEdit.hourlyRate);
      setTotalValue(galleryToEdit.totalValue !== undefined ? galleryToEdit.totalValue : (galleryToEdit.hourlyRate * 10 || 1000));
      setShootDuration(galleryToEdit.shootDuration !== undefined ? galleryToEdit.shootDuration : 4);
      setThumbnailUrl(galleryToEdit.thumbnailUrl || '');
      setPicTimeUrl(galleryToEdit.picTimeUrl || '');
      setPicTimeFaviconUrl(galleryToEdit.picTimeFaviconUrl || '');
      setNotes(galleryToEdit.notes || '');
      setStatus(galleryToEdit.status);
      setPriority(galleryToEdit.priority || 'MID');
      setLocation(galleryToEdit.location || '');
      
      // format datetime local
      if (galleryToEdit.createdAt) {
        const date = new Date(galleryToEdit.createdAt);
        const pad = (num: number) => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        setCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        setCreatedAt('');
      }
    } else {
      setName('');
      setClient('');
      setCategory('portrait');
      setPhotoCount(200);
      setHourlyRate(50);
      setTotalValue(1000);
      setShootDuration(4);
      setThumbnailUrl('');
      setPicTimeUrl('');
      setPicTimeFaviconUrl('');
      setNotes('');
      setStatus('Not Started');
      setPriority('MID');
      setLocation('');
      // Set to current date time as default
      const date = new Date();
      const pad = (num: number) => num.toString().padStart(2, '0');
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      setCreatedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [galleryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowNotification("Please provide a name or title for this shoot catalog.");
      return;
    }

    const isoDateString = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();

    const data: Partial<Gallery> = {
      name: name.trim(),
      client: client.trim() || 'N/A',
      photoCount: photoCount || 1,
      hourlyRate: hourlyRate || 0,
      totalValue: totalValue || 0,
      shootDuration: shootDuration || 0,
      thumbnailUrl: thumbnailUrl.trim(),
      category,
      picTimeUrl: picTimeUrl.trim(),
      picTimeFaviconUrl: picTimeFaviconUrl.trim(),
      notes: notes.trim(),
      createdAt: isoDateString,
      priority,
      location: location.trim(),
    };

    if (galleryToEdit) {
      data.id = galleryToEdit.id;
      data.status = status;
      onShowNotification(`Updated catalog: ${name}`);
    } else {
      // Create mode
      data.status = new Date(isoDateString) > new Date() ? 'Upcoming' : 'Not Started';
      onShowNotification(`Created catalog: ${name}`);
    }

    onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-lrPanel rounded-xl border border-lrBorder shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-lrBorder flex items-center justify-between bg-lrDarkest shrink-0">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 font-display">
            {galleryToEdit ? <Edit size={14} className="text-lrBlue" /> : <FolderPlus size={14} className="text-lrBlue" />}
            {galleryToEdit ? 'Modify Project Coordinates' : 'Register New Shoot Project'}
          </h3>
          <button onClick={onClose} className="text-lrMuted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Gallery / Shoot Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jenkins Autumn Wedding Portfolio"
              className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Client Brand / Reference</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Jenkins LLC"
              className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Shoot Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Redwood National Forest, CA"
              className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Shoot Date & Time</label>
              <input
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Shoot Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full text-[11px] bg-[#111214] text-slate-200 border border-lrBorder hover:border-lrBlue/50 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-lrBlue cursor-pointer transition-all duration-150 font-mono"
              >
                <option value="portrait">Portrait</option>
                <option value="wedding">Wedding</option>
                <option value="couples">Couples</option>
                <option value="elopement">Elopement</option>
                <option value="family">Family</option>
                <option value="engagement">Engagement</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono" title="Total RAW photo count ingest checklist baseline">RAW Image Count</label>
              <input
                type="number"
                min={1}
                value={photoCount}
                onChange={(e) => setPhotoCount(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono" title="Total project package contract cost/revenue">Project Value ($)</label>
              <input
                type="number"
                min={0}
                value={totalValue}
                onChange={(e) => setTotalValue(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 1500"
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono" title="Planned or actual hours spent on site shooting">Shoot Time Onsite (hrs)</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={shootDuration}
                onChange={(e) => setShootDuration(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 4"
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono" title="Baseline billing rate per hour if not calculating off package value">Hourly Rate ($/hr)</label>
              <input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white focus:outline-none focus:border-lrBlue font-mono"
              />
            </div>
          </div>

          {/* Custom Cover Image Picker & File Upload */}
          <div className="border border-lrBorder/40 rounded-lg p-3 bg-lrDarkest/50 space-y-3">
            <span className="block text-[10px] uppercase font-extrabold text-lrBlue tracking-wider font-mono">Custom Shoot Cover Photo</span>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] uppercase font-bold text-lrMuted mb-1 font-mono">Paste Photo URL</label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-[10px] bg-lrDarkest border border-lrBorder rounded p-2 text-white focus:outline-none focus:border-lrBlue truncate font-mono"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-[8px] uppercase font-bold text-lrMuted mb-1 font-mono">Or Upload File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setThumbnailUrl(reader.result);
                          onShowNotification("Custom cover image loaded successfully");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-[10px] bg-lrDarkest border border-lrBorder rounded p-1.5 text-lrMuted focus:outline-none file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:bg-lrBlue file:text-black file:font-semibold"
                />
              </div>
            </div>

            {/* Presets suggestions */}
            <div>
              <span className="block text-[8px] uppercase font-bold text-lrMuted mb-1 font-mono">Select Preset Mood Cover</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { name: 'Wedding 🌸', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
                  { name: 'Portrait 📷', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80' },
                  { name: 'Urban 🏙️', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80' },
                  { name: 'Landscape 🏔️', url: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80' },
                  { name: 'Corporate 💼', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setThumbnailUrl(preset.url);
                      onShowNotification(`Applied ${preset.name} cover preset`);
                    }}
                    className={`text-[9.5px] px-2 py-1 rounded border transition ${
                      thumbnailUrl === preset.url
                        ? 'bg-lrBlue text-slate-950 font-bold border-lrBlue shadow-md shadow-lrBlue/10'
                        : 'bg-zinc-800 text-lrMuted border-lrBorder/40 hover:text-slate-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {thumbnailUrl && (
              <div className="relative h-12 rounded overflow-hidden border border-lrBorder mt-1 flex items-center justify-between px-3 bg-zinc-900/60">
                <span className="text-[10px] text-lrMuted font-mono truncate max-w-[200px]">Active Cover: {thumbnailUrl.startsWith('data:') ? 'Base64 Encoded Image' : thumbnailUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl('');
                    onShowNotification("Custom cover image cleared");
                  }}
                  className="text-[9px] font-bold text-red-400 hover:underline"
                >
                  Clear Photo
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Pic-Time Client Link (Optional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={picTimeUrl}
                  onChange={(e) => setPicTimeUrl(e.target.value)}
                  onBlur={() => {
                    // Try auto-fetching on blur if has value and is a valid URL
                    if (picTimeUrl.trim().startsWith('http') && (!thumbnailUrl || galleryToEdit?.picTimeUrl !== picTimeUrl)) {
                      handleFetchMetadata(picTimeUrl);
                    }
                  }}
                  placeholder="https://client.pic-time.com/-galleryurl"
                  className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 pr-8 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue font-mono placeholder:text-zinc-600"
                />
                {picTimeFaviconUrl && (
                  <img 
                    src={picTimeFaviconUrl} 
                    alt="favicon" 
                    className="absolute right-3 top-3 w-4 h-4 rounded bg-transparent object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleFetchMetadata()}
                disabled={fetchingMetadata}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-lrBorder text-xs text-lrBlue hover:text-white rounded-lg transition duration-150 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer font-bold font-mono"
                title="Automatically pull cover image & site favicon via SEO metadata query"
              >
                {fetchingMetadata ? (
                  <span className="w-3 h-3 border-2 border-lrBlue border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Sparkles size={12} className="text-lrBlue" />
                )}
                <span>Resolve</span>
              </button>
            </div>
            <span className="text-[8.5px] text-emerald-400 font-mono block mt-1 tracking-wider leading-relaxed">
              &bull; Auto-resolve extracts live open-graph picture covers & favicons instantly.
            </span>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Specific Shoot Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special preset instructions, editing profiles, contrast choices..."
              className="w-full text-xs bg-lrDarkest border border-lrBorder rounded-lg p-2.5 text-white placeholder-zinc-700 focus:outline-none focus:border-lrBlue resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Project Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-[11px] bg-[#111214] text-slate-200 border border-lrBorder hover:border-lrBlue/50 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-lrBlue cursor-pointer transition-all duration-150 font-mono font-semibold"
              >
                <option value="HIGH" className="text-red-400 font-bold bg-[#111214]">HIGH</option>
                <option value="MID" className="text-amber-400 font-bold bg-[#111214]">MID</option>
                <option value="LOW" className="text-blue-400 font-bold bg-[#111214]">LOW</option>
                <option value="OTHER" className="text-zinc-400 font-bold bg-[#111214]">OTHER</option>
              </select>
            </div>

            {galleryToEdit ? (
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Workflow Status Pipeline</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GalleryStatus)}
                  className="w-full text-[11px] bg-[#111214] text-slate-200 border border-lrBorder hover:border-lrBlue/50 rounded-md py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-lrBlue cursor-pointer transition-all duration-150 font-mono"
                >
                  <option value="Inquiry" className="bg-[#111214]">Potential Inquiry</option>
                  <option value="Upcoming" className="bg-[#111214]">Upcoming</option>
                  <option value="Not Started" className="bg-[#111214]">Not Started</option>
                  <option value="In Progress" className="bg-[#111214]">In Progress</option>
                  <option value="Completed" className="bg-[#111214]">Completed</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-bold text-lrMuted mb-1 font-mono">Pipeline Stage</label>
                <div className="text-xs bg-[#111214] border border-[#23272d] text-lrMuted rounded-lg p-2.5 select-none font-mono">
                  Default: Not Started
                </div>
              </div>
            )}
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-lrBorder flex justify-end gap-2.5 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-lrBorder hover:bg-lrBorderLight text-slate-300 rounded-md transition"
            >
              Cancel
            </button>
            <button
              id="submit-gallery-btn"
              type="submit"
              className="px-4 py-2 bg-lrBlue hover:bg-lrBlueHover text-slate-950 font-bold rounded-md shadow-lg transition duration-150"
            >
              {galleryToEdit ? 'Save Session Changes' : 'Create New Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
