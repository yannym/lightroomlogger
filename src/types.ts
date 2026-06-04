export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type CategoryType = 'portrait' | 'wedding' | 'couples' | 'elopement' | 'family' | 'engagement' | 'other';

export type GalleryStatus = 'Inquiry' | 'Upcoming' | 'Not Started' | 'In Progress' | 'Completed';

export interface Gallery {
  id: string;
  name: string;
  client: string;
  photoCount: number;
  hourlyRate: number;
  totalValue?: number; // Total contract price/value in USD
  shootDuration?: number; // On-site shoot duration in hours
  thumbnailUrl?: string; // Custom cover image URL or Base64 string
  status: GalleryStatus;
  category: CategoryType;
  picTimeUrl?: string;
  picTimeFaviconUrl?: string;
  createdAt: string;
  notes: string;
  archived: boolean;
  priority?: 'HIGH' | 'MID' | 'LOW' | 'OTHER';
  location?: string; // Shoot location section
  checklists: {
    import: Task[];
    culling: Task[];
    global: Task[];
    local: Task[];
    export: Task[];
  };
  times: {
    import: number; // in seconds
    culling: number;
    global: number;
    local: number;
    export: number;
  };
  logs: TimeLog[];
}

export interface TimeLog {
  id: string;
  phase: 'import' | 'culling' | 'global' | 'local' | 'export';
  duration: number; // in seconds
  timestamp: string;
  note: string;
}

export interface SyncSettings {
  zapierUrl: string;
  autoSyncNew: boolean;
  calendarFeedUrl: string;
  googleCalendarEmbedCode: string;
  honeybookApiKey: string;
}

export interface GitHubSettings {
  token: string;
  owner: string;
  repo: string;
  path: string;
  sha: string;
}

export interface PhaseInfo {
  id: 'import' | 'culling' | 'global' | 'local' | 'export';
  name: string;
  color: string;
  colorText: string;
  bgHex: string;
}
