export interface WheelItem {
  id: string;
  text: string;
  color: string;
  weight: number;
  enabled: boolean;
}

export interface WheelPreset {
  id: string;
  name: string;
  description?: string;
  items: WheelItem[];
  createdAt: number;
  isDefault?: boolean;
}

export interface WheelSettings {
  spinDuration: number; // in seconds (3 - 15)
  autoRemoveWinner: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
  confettiEnabled: boolean;
  showWinnerModal: boolean;
  wheelTheme: 'gold' | 'neon' | 'silver' | 'modern';
  vibrationEnabled?: boolean; // Haptic feedback on mobile & tablet
}

export interface WinnerRecord {
  id: string;
  round: number;
  timestamp: number;
  item: WheelItem;
  presetName: string;
}

export interface BackgroundConfig {
  type: 'preset' | 'custom';
  presetId: string;
  customDataUrl?: string;
  blur: number; // 0 - 20 px
  dimOverlay: number; // 0 - 90 %
  brightness: number; // 50 - 150 %
}

export interface RoomState {
  roomId: string; // 'sala1' | 'sala2' | 'sala3' | custom
  pin: string;
  name?: string;
  items: WheelItem[];
  activePresetId?: string;
  history?: WinnerRecord[];
  settings?: WheelSettings;
  isSpinning?: boolean;
  spinTrigger?: number; // timestamp trigger to sync spin animation across screens
  targetWinnerId?: string; // winner item id for synchronous landing across devices
  currentWinner?: WinnerRecord | null;
  bgConfig?: BackgroundConfig;
  updatedAt: number;
  updatedBy?: string;
}

export interface SalaAccount {
  username: 'sala1' | 'sala2' | 'sala3';
  displayName: string;
  pin: string;
  description: string;
  color: string;
}

export const SALA_ACCOUNTS: SalaAccount[] = [
  {
    username: 'sala1',
    displayName: 'ศาลา 1 (sala1)',
    pin: 'pass123456',
    description: 'ห้องจับรางวัลศาลา 1 ซิงค์สดทุกจอ',
    color: '#10b981', // emerald
  },
  {
    username: 'sala2',
    displayName: 'ศาลา 2 (sala2)',
    pin: 'pass123456',
    description: 'ห้องจับรางวัลศาลา 2 ซิงค์สดทุกจอ',
    color: '#0ea5e9', // sky
  },
  {
    username: 'sala3',
    displayName: 'ศาลา 3 (sala3)',
    pin: 'pass123456',
    description: 'ห้องจับรางวัลศาลา 3 ซิงค์สดทุกจอ',
    color: '#f59e0b', // amber
  },
];

