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
