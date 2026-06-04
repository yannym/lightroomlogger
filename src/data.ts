import { Gallery, Task } from './types';

export const PHASES_LIST = [
  { id: 'import', name: '1. Ingest & Setup', color: 'from-sky-500 to-indigo-500', colorText: 'text-sky-400', bgHex: '#0ea5e9' },
  { id: 'culling', name: '2. Culling / Rating', color: 'from-amber-500 to-orange-500', colorText: 'text-amber-400', bgHex: '#f59e0b' },
  { id: 'global', name: '3. Global Edits', color: 'from-emerald-500 to-teal-500', colorText: 'text-emerald-400', bgHex: '#10b981' },
  { id: 'local', name: '4. Local & Masking', color: 'from-fuchsia-500 to-pink-500', colorText: 'text-fuchsia-400', bgHex: '#d946ef' },
  { id: 'export', name: '5. Exporting', color: 'from-rose-500 to-purple-500', colorText: 'text-rose-400', bgHex: '#f43f5e' }
] as const;

export function generateDefaultChecklists(uid: string) {
  return {
    import: [
      { id: `imp-${uid}-1`, text: 'Ingest RAW images from memory card to RAID', completed: false },
      { id: `imp-${uid}-2`, text: 'Confirm redundant backup storage sync', completed: false },
      { id: `imp-${uid}-3`, text: 'Build smart previews (1:1 zoom checks)', completed: false }
    ],
    culling: [
      { id: `cul-${uid}-1`, text: 'First-pass speed cull (Flag with Pick / Reject)', completed: false },
      { id: `cul-${uid}-2`, text: 'Second-pass star culling (Filter 3+ stars)', completed: false },
      { id: `cul-${uid}-3`, text: 'Color label premium candidate selections', completed: false }
    ],
    global: [
      { id: `glo-${uid}-1`, text: 'Apply lens profile calibration & CA correction', completed: false },
      { id: `glo-${uid}-2`, text: 'Establish correct reference white balance', completed: false },
      { id: `glo-${uid}-3`, text: 'Adjust exposure, tone curves, and HSL matrix', completed: false }
    ],
    local: [
      { id: `loc-${uid}-1`, text: 'Spot heal sensor dust and background distractions', completed: false },
      { id: `loc-${uid}-2`, text: 'Generate AI subject/sky masking to carve focus', completed: false },
      { id: `loc-${uid}-3`, text: 'Brush work for facial exposure corrections', completed: false }
    ],
    export: [
      { id: `exp-${uid}-1`, text: 'Apply high-pass output sharpening for selected medium', completed: false },
      { id: `exp-${uid}-2`, text: 'Process batch print sRGB JPEGs (high-res metadata)', completed: false },
      { id: `exp-${uid}-3`, text: 'Upload ready-to-deliver files to Pic-Time', completed: false }
    ]
  };
}

export const INITIAL_GALLERIES: Gallery[] = [
  {
    id: 'g-1',
    name: 'Sarah & Mark - Forest Wedding',
    client: 'Mark Jenkins Studio',
    photoCount: 420,
    hourlyRate: 75,
    totalValue: 1800,
    shootDuration: 6,
    status: 'In Progress',
    category: 'wedding',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    picTimeUrl: 'https://client.pic-time.com/-sarahandmarkwedding',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Soft, golden-hour outdoor forest lighting. Needs custom warm presets, heavy masking to separate subjects from dense pine tree backgrounds, and soft grain overlay.',
    archived: false,
    priority: 'HIGH',
    location: 'Redwood National Park, CA',
    checklists: {
      import: [
        { id: 'imp-g-1-1', text: 'Ingest RAW images from memory card to RAID', completed: true },
        { id: 'imp-g-1-2', text: 'Confirm redundant backup storage sync', completed: true },
        { id: 'imp-g-1-3', text: 'Build smart previews (1:1 zoom checks)', completed: true }
      ],
      culling: [
        { id: 'cul-g-1-1', text: 'First-pass speed cull (Flag with Pick / Reject)', completed: true },
        { id: 'cul-g-1-2', text: 'Second-pass star culling (Filter 3+ stars)', completed: false },
        { id: 'cul-g-1-3', text: 'Color label premium candidate selections', completed: false }
      ],
      global: [
        { id: 'glo-g-1-1', text: 'Apply lens profile calibration & CA correction', completed: true },
        { id: 'glo-g-1-2', text: 'Establish correct reference white balance', completed: false },
        { id: 'glo-g-1-3', text: 'Adjust exposure, tone curves, and HSL matrix', completed: false }
      ],
      local: [
        { id: 'loc-g-1-1', text: 'Spot heal sensor dust and background distractions', completed: false },
        { id: 'loc-g-1-2', text: 'Generate AI subject/sky masking to carve focus', completed: false },
        { id: 'loc-g-1-3', text: 'Brush work for facial exposure corrections', completed: false }
      ],
      export: [
        { id: 'exp-g-1-1', text: 'Apply high-pass output sharpening for selected medium', completed: false },
        { id: 'exp-g-1-2', text: 'Process batch print sRGB JPEGs (high-res metadata)', completed: false },
        { id: 'exp-g-1-3', text: 'Upload ready-to-deliver files to Pic-Time', completed: false }
      ]
    },
    times: {
      import: 1240,
      culling: 3450,
      global: 2100,
      local: 1540,
      export: 0
    },
    logs: [
      { id: 'log-1', phase: 'import', duration: 1240, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: 'Initial raw copy and smart previews generation on RAID SSD.' },
      { id: 'log-2', phase: 'culling', duration: 1800, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: 'Flagged 120 potential picks from 420 photos.' },
      { id: 'log-3', phase: 'culling', duration: 1650, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Filtered down to 85 four-star keepers.' },
      { id: 'log-4', phase: 'global', duration: 2100, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Warmed skin tones, applied sunset curve to reception series.' },
      { id: 'log-5', phase: 'local', duration: 1540, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), note: 'Radial eye focus on forest portrait shots.' }
    ]
  },
  {
    id: 'g-2',
    name: 'Leo Carter - Urban Headshots',
    client: 'Leo Carter',
    photoCount: 80,
    hourlyRate: 90,
    totalValue: 450,
    shootDuration: 3,
    status: 'In Progress',
    category: 'portrait',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    picTimeUrl: '',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Industrial brick walls, steel structures, and deep moody shadows. High contrast, cool tones, and dramatic linear masking.',
    archived: false,
    priority: 'MID',
    location: 'Downtown Arts District, LA',
    checklists: {
      import: [
        { id: 'imp-g-2-1', text: 'Ingest RAW images from memory card to RAID', completed: true },
        { id: 'imp-g-2-2', text: 'Confirm redundant backup storage sync', completed: true },
        { id: 'imp-g-2-3', text: 'Build smart previews (1:1 zoom checks)', completed: true }
      ],
      culling: [
        { id: 'cul-g-2-1', text: 'First-pass speed cull (Flag with Pick / Reject)', completed: true },
        { id: 'cul-g-2-2', text: 'Second-pass star culling (Filter 3+ stars)', completed: true },
        { id: 'cul-g-2-3', text: 'Color label premium candidate selections', completed: true }
      ],
      global: [
        { id: 'glo-g-2-1', text: 'Apply lens profile calibration & CA correction', completed: true },
        { id: 'glo-g-2-2', text: 'Establish correct reference white balance', completed: true },
        { id: 'glo-g-2-3', text: 'Adjust exposure, tone curves, and HSL matrix', completed: false }
      ],
      local: [
        { id: 'loc-g-2-1', text: 'Spot heal sensor dust and background distractions', completed: false },
        { id: 'loc-g-2-2', text: 'Generate AI subject/sky masking to carve focus', completed: false },
        { id: 'loc-g-2-3', text: 'Brush work for facial exposure corrections', completed: false }
      ],
      export: [
        { id: 'exp-g-2-1', text: 'Apply high-pass output sharpening for selected medium', completed: false },
        { id: 'exp-g-2-2', text: 'Process batch print sRGB JPEGs (high-res metadata)', completed: false },
        { id: 'exp-g-2-3', text: 'Upload ready-to-deliver files to Pic-Time', completed: false }
      ]
    },
    times: {
      import: 480,
      culling: 1200,
      global: 540,
      local: 0,
      export: 0
    },
    logs: [
      { id: 'log-6', phase: 'import', duration: 480, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Ingested raw files.' },
      { id: 'log-7', phase: 'culling', duration: 1200, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Culling completed. Selected 15 core portrait headshots.' },
      { id: 'log-8', phase: 'global', duration: 540, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Neutralized heavy neon green ambient light reflections.' }
    ]
  },
  {
    id: 'g-3',
    name: 'Nexa Tech - Corporate Event',
    client: 'Nexa Group Corp',
    photoCount: 1500,
    hourlyRate: 110,
    totalValue: 2200,
    shootDuration: 8,
    status: 'Upcoming',
    category: 'other',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Indoor keynote slides with glowing projector lights and panel talks. Requires high ISO grain reduction, brand-specific color balancing (Nexa Navy Blues), and wide-group orientation presets.',
    archived: false,
    priority: 'LOW',
    location: 'Nexa Headquarters, Austin, TX',
    checklists: generateDefaultChecklists('g-3'),
    times: { import: 0, culling: 0, global: 0, local: 0, export: 0 },
    logs: []
  },
  {
    id: 'g-4',
    name: 'Glacier peaks - Winter Collection',
    client: 'Self-produced',
    photoCount: 120,
    hourlyRate: 40,
    totalValue: 1200,
    shootDuration: 10,
    status: 'Completed',
    category: 'other',
    thumbnailUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Extremely tricky shadows on pure white glacier slopes. Blue cast reduction, texture enhancements, and graduated nd-filter masking simulations.',
    archived: true,
    priority: 'OTHER',
    location: 'Mt. Hood Wilderness, OR',
    checklists: {
      import: [
        { id: 'imp-g-4-1', text: 'Ingest RAW images from memory card to RAID', completed: true },
        { id: 'imp-g-4-2', text: 'Confirm redundant backup storage sync', completed: true },
        { id: 'imp-g-4-3', text: 'Build smart previews (1:1 zoom checks)', completed: true }
      ],
      culling: [
        { id: 'cul-g-4-1', text: 'First-pass speed cull (Flag with Pick / Reject)', completed: true },
        { id: 'cul-g-4-2', text: 'Second-pass star culling (Filter 3+ stars)', completed: true },
        { id: 'cul-g-4-3', text: 'Color label premium candidate selections', completed: true }
      ],
      global: [
        { id: 'glo-g-4-1', text: 'Apply lens profile calibration & CA correction', completed: true },
        { id: 'glo-g-4-2', text: 'Establish correct reference white balance', completed: true },
        { id: 'glo-g-4-3', text: 'Adjust exposure, tone curves, and HSL matrix', completed: true }
      ],
      local: [
        { id: 'loc-g-4-1', text: 'Spot heal sensor dust and background distractions', completed: true },
        { id: 'loc-g-4-2', text: 'Generate AI subject/sky masking to carve focus', completed: true },
        { id: 'loc-g-4-3', text: 'Brush work for facial exposure corrections', completed: true }
      ],
      export: [
        { id: 'exp-g-4-1', text: 'Apply high-pass output sharpening for selected medium', completed: true },
        { id: 'exp-g-4-2', text: 'Process batch print sRGB JPEGs (high-res metadata)', completed: true },
        { id: 'exp-g-4-3', text: 'Upload ready-to-deliver files to Pic-Time', completed: true }
      ]
    },
    times: {
      import: 300,
      culling: 1800,
      global: 2400,
      local: 3600,
      export: 1200
    },
    logs: [
      { id: 'log-9', phase: 'import', duration: 300, timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), note: 'Imported.' },
      { id: 'log-10', phase: 'culling', duration: 1800, timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), note: 'Filtered out blur and camera shakes.' },
      { id: 'log-11', phase: 'global', duration: 2400, timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), note: 'Corrected neon cyan blue mountain casts.' },
      { id: 'log-12', phase: 'local', duration: 3600, timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), note: 'Dodged glacier highlight ridges.' },
      { id: 'log-13', phase: 'export', duration: 1200, timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: 'Completed 16-bit TIFF export.' }
    ]
  }
];
