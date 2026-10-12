/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  WheelItem,
  WheelPreset,
  WheelSettings,
  WinnerRecord,
  BackgroundConfig,
} from './types/wheel';
import { DEFAULT_PRESETS } from './utils/colorPalettes';
import { WheelCanvas } from './components/WheelCanvas';
import { CandidateEditor } from './components/CandidateEditor';
import { PresetManager } from './components/PresetManager';
import { WinnerModal } from './components/WinnerModal';
import { WinnerHistoryModal } from './components/WinnerHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import {
  BackgroundCustomizer,
  getBackgroundStyle,
} from './components/BackgroundCustomizer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { exportWheelSnapshot } from './utils/imageExport';
import { playClickSound } from './utils/audio';
import { User } from 'firebase/auth';
import {
  subscribeToAuth,
  syncPresetToFirestore,
  deletePresetFromFirestore,
  fetchUserPresets,
  saveWinnerToFirestore,
  fetchUserHistory,
  clearUserHistoryInFirestore,
  saveSettingsToFirestore,
  fetchUserSettings,
} from './services/firebaseService';
import { AuthButton } from './components/AuthButton';
import {
  Sparkles,
  Settings,
  History,
  Image as ImageIcon,
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  ListFilter,
  Star,
  Gift,
  Disc3,
  ArrowLeft,
  SlidersHorizontal,
  Cloud,
} from 'lucide-react';

const STORAGE_KEYS = {
  PRESETS: 'lucky_wheel_presets_v1',
  ACTIVE_PRESET_ID: 'lucky_wheel_active_preset_id_v1',
  SETTINGS: 'lucky_wheel_settings_v1',
  HISTORY: 'lucky_wheel_history_v1',
  BACKGROUND: 'lucky_wheel_bg_v1',
};

const DEFAULT_SETTINGS: WheelSettings = {
  spinDuration: 6,
  autoRemoveWinner: true, // Default to true as specifically requested!
  soundEnabled: true,
  soundVolume: 0.8,
  confettiEnabled: true,
  showWinnerModal: true,
  wheelTheme: 'gold',
  vibrationEnabled: true,
};

const DEFAULT_BG_CONFIG: BackgroundConfig = {
  type: 'preset',
  presetId: 'nebula',
  blur: 0,
  dimOverlay: 40,
  brightness: 100,
};

export default function App() {
  // 1. State initialization with LocalStorage fallbacks
  const [presets, setPresets] = useState<WheelPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID);
      if (saved) return saved;
    } catch {}
    return DEFAULT_PRESETS[0].id;
  });

  const [items, setItems] = useState<WheelItem[]>(() => {
    const active = presets.find((p) => p.id === activePresetId) || presets[0] || DEFAULT_PRESETS[0];
    return active ? [...active.items] : [];
  });

  const [settings, setSettings] = useState<WheelSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<WinnerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKGROUND);
      if (saved) return { ...DEFAULT_BG_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_BG_CONFIG;
  });

  // UI State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<WinnerRecord | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [lastAutoRemoved, setLastAutoRemoved] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBgCustomizer, setShowBgCustomizer] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'presets'>('items');
  const [mobileView, setMobileView] = useState<'wheel' | 'items' | 'presets'>('wheel');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to Firebase Auth and Sync Firestore data
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const [cloudPresets, cloudHistory, cloudSettings] = await Promise.all([
            fetchUserPresets(user.uid),
            fetchUserHistory(user.uid),
            fetchUserSettings(user.uid),
          ]);

          if (cloudPresets && cloudPresets.length > 0) {
            setPresets((prev) => {
              const map = new Map<string, WheelPreset>();
              cloudPresets.forEach((p) => map.set(p.id, p));
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              return Array.from(map.values());
            });
          } else {
            // Upload current presets to user's Firebase Cloud
            for (const p of presets) {
              await syncPresetToFirestore(user.uid, p);
            }
          }

          if (cloudHistory && cloudHistory.length > 0) {
            setHistory(cloudHistory);
          }

          if (cloudSettings) {
            setSettings(cloudSettings);
          }
        } catch (err) {
          console.error('Failed to sync data with Firebase:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch {}
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, activePresetId);
    } catch {}
  }, [activePresetId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKGROUND, JSON.stringify(bgConfig));
    } catch {}
  }, [bgConfig]);

  // Keyboard shortcut listener (Space to spin, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && !isSpinning && items.some((it) => it.enabled)) {
        e.preventDefault();
        // Click on spin button
        const spinBtn = document.querySelector('button[title*="หมุน"]') as HTMLButtonElement;
        if (spinBtn) spinBtn.click();
      }

      if (e.code === 'Escape') {
        setShowWinnerModal(false);
        setShowSettingsModal(false);
        setShowBgCustomizer(false);
        setShowHistoryModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, items]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Preset switching
  const handleSelectPreset = (preset: WheelPreset) => {
    if (isSpinning) return;
    setActivePresetId(preset.id);
    setItems([...preset.items]);
    if (settings.soundEnabled) playClickSound(settings.soundVolume);
  };

  // Save current wheel as a new preset
  const handleSavePreset = (name: string, savedItems: WheelItem[]) => {
    const newPreset: WheelPreset = {
      id: `preset-${Date.now()}`,
      name,
      items: [...savedItems],
      createdAt: Date.now(),
      isDefault: false,
    };
    const updated = [newPreset, ...presets];
    setPresets(updated);
    setActivePresetId(newPreset.id);

    // Sync to Firebase Firestore if logged in
    if (currentUser) {
      syncPresetToFirestore(currentUser.uid, newPreset).catch((err) =>
        console.error('Failed to sync preset to Firebase:', err)
      );
    }
  };

  // Delete preset
  const handleDeletePreset = (presetId: string) => {
    const filtered = presets.filter((p) => p.id !== presetId);
    setPresets(filtered);
    if (activePresetId === presetId && filtered.length > 0) {
      setActivePresetId(filtered[0].id);
      setItems([...filtered[0].items]);
    }

    // Delete from Firebase Firestore if logged in
    if (currentUser) {
      deletePresetFromFirestore(currentUser.uid, presetId).catch((err) =>
        console.error('Failed to delete preset from Firebase:', err)
      );
    }
  };

  // Import presets
  const handleImportPresets = (imported: WheelPreset[]) => {
    const combined = [...imported, ...presets];
    setPresets(combined);
    if (imported[0]) {
      setActivePresetId(imported[0].id);
      setItems([...imported[0].items]);
    }

    // Sync imported presets to Firebase if logged in
    if (currentUser) {
      imported.forEach((p) => {
        syncPresetToFirestore(currentUser.uid, p).catch(() => {});
      });
    }
  };

  // Handle spin start
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
  }, []);

  // Current active preset object
  const activePreset =
    presets.find((p) => p.id === activePresetId) || presets[0] || DEFAULT_PRESETS[0];

  // Handle spin end & winner selection
  const handleSpinEnd = useCallback(
    (winnerItem: WheelItem) => {
      setIsSpinning(false);
      const roundNumber = history.length + 1;

      const newRecord: WinnerRecord = {
        id: `win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        round: roundNumber,
        timestamp: Date.now(),
        item: { ...winnerItem },
        presetName: activePreset ? activePreset.name : 'วงล้อจับรางวัล',
      };

      // Add to winner history log
      setHistory((prev) => [newRecord, ...prev]);
      setCurrentWinner(newRecord);

      // Save winner record to Firebase Firestore if logged in
      if (currentUser) {
        saveWinnerToFirestore(currentUser.uid, newRecord).catch((err) =>
          console.error('Failed to save winner to Firebase:', err)
        );
      }

      // Auto-remove winner if option enabled!
      let removed = false;
      if (settings.autoRemoveWinner) {
        setItems((prevItems) => prevItems.filter((it) => it.id !== winnerItem.id));
        removed = true;
      }
      setLastAutoRemoved(removed);

      // Show winner popup
      if (settings.showWinnerModal) {
        setShowWinnerModal(true);
      }
    },
    [history.length, activePreset, settings.autoRemoveWinner, settings.showWinnerModal, currentUser]
  );

  // Restore winner to wheel (Undo removal)
  const handleRestoreWinner = (item: WheelItem) => {
    // Check if item already exists
    if (!items.some((it) => it.id === item.id)) {
      setItems((prev) => [...prev, { ...item, enabled: true }]);
    }
  };

  // Manually remove winner from wheel
  const handleRemoveWinnerManually = (item: WheelItem) => {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setLastAutoRemoved(true);
  };

  // Export screenshot of current wheel
  const handleExportWheelImage = () => {
    if (wheelCanvasRef.current) {
      exportWheelSnapshot(wheelCanvasRef.current, activePreset?.name || 'วงล้อนำโชค');
    }
  };

  // Reset current wheel items to default of current preset
  const handleResetCurrentWheel = () => {
    if (confirm('คุณต้องการรีเซ็ตรายชื่อในวงล้อกลับเป็นค่าเริ่มต้นของพรีเซ็ตนี้ใช่หรือไม่?')) {
      if (activePreset) {
        setItems([...activePreset.items]);
      }
    }
  };

  // Quick toggle auto-remove winner mode
  const handleToggleAutoRemove = () => {
    setSettings((prev) => ({
      ...prev,
      autoRemoveWinner: !prev.autoRemoveWinner,
    }));
    if (settings.soundEnabled) playClickSound(settings.soundVolume);
  };

  return (
    <div
      className="relative min-h-screen text-slate-100 flex flex-col transition-colors duration-500 overflow-x-hidden"
      style={getBackgroundStyle(bgConfig)}
    >
      {/* Background Dim & Blur Overlay */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-300"
        style={{
          backgroundColor: `rgba(2, 6, 23, ${bgConfig.dimOverlay / 100})`,
          backdropFilter: bgConfig.blur > 0 ? `blur(${bgConfig.blur}px)` : undefined,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 lg:p-5 pb-24 md:pb-6">
        {/* Top Navigation / App Header */}
        <header className="flex items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 mb-2.5 sm:mb-4 border-b border-white/10 backdrop-blur-md bg-slate-950/40 rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 absolute -top-1 -right-1 text-yellow-200 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>วงล้อจับรางวัล</span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Lucky Wheel
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate flex items-center gap-1">
                <span>{activePreset ? activePreset.name : 'สุ่มผู้โชคดี'} • รอบที่ {history.length + 1}</span>
                <span className="text-[10px] text-amber-300/80">
                  {currentUser ? '• Cloud Synced ☁️' : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Firebase Google Auth & Cloud Sync Button */}
            <AuthButton user={currentUser} isSyncing={isSyncing} />

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Custom Background Button */}
            <button
              onClick={() => setShowBgCustomizer(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition cursor-pointer min-h-[36px]"
              title="เปลี่ยนภาพพื้นหลัง หรืออัปโหลดภาพของคุณเอง"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">เปลี่ยนพื้นหลัง</span>
            </button>

            {/* Export Wheel Snapshot */}
            <button
              onClick={handleExportWheelImage}
              disabled={isSpinning || items.length === 0}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition cursor-pointer disabled:opacity-40 min-h-[36px]"
              title="บันทึกภาพวงล้อเป็นไฟล์ PNG"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">บันทึกภาพ</span>
            </button>

            {/* History Modal Button (Visible on md+ screens or as quick button) */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="relative hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition cursor-pointer min-h-[36px]"
              title="ดูประวัติผู้ชนะทั้งหมด"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>ประวัติ</span>
              {history.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {history.length}
                </span>
              )}
            </button>

            {/* Settings Modal Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer min-h-[36px]"
              title="ตั้งค่าวงล้อและระบบลบผู้ชนะอัตโนมัติ"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer hidden md:flex min-h-[36px]"
              title={isFullscreen ? 'ออกจากโหมดเต็มจอ' : 'แสดงผลเต็มจอ'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* MOBILE VIEWPORT (Phones < 768px): Dedicated Tabbed Mode   */}
        {/* ========================================================= */}
        <div className="block md:hidden flex-1">
          {mobileView === 'wheel' && (
            <div className="wheel-card-container flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md rounded-3xl border border-white/10 p-2 sm:p-4 shadow-2xl relative overflow-hidden w-full">
              {/* Quick status bar */}
              <div className="w-full flex items-center justify-between pb-2 text-xs">
                {/* Clickable auto-remove toggle pill */}
                <button
                  onClick={handleToggleAutoRemove}
                  disabled={isSpinning}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 active:scale-95 transition cursor-pointer"
                  title="แตะเพื่อเปิด/ปิดโหมดลบผู้ชนะอัตโนมัติ"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      settings.autoRemoveWinner ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-200">
                    {settings.autoRemoveWinner ? 'ลบผู้ชนะอัตโนมัติ: เปิด' : 'ลบผู้ชนะอัตโนมัติ: ปิด'}
                  </span>
                </button>

                <button
                  onClick={handleResetCurrentWheel}
                  disabled={isSpinning}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition cursor-pointer p-1"
                  title="รีเซ็ตรายชื่อกลับเป็นค่าเดิมของพรีเซ็ต"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ต</span>
                </button>
              </div>

              {/* Wheel Canvas */}
              <WheelCanvas
                items={items}
                settings={settings}
                isSpinning={isSpinning}
                onSpinStart={handleSpinStart}
                onSpinEnd={handleSpinEnd}
                canvasRefCallback={(c) => {
                  wheelCanvasRef.current = c;
                }}
              />
            </div>
          )}

          {mobileView === 'items' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-2">
                <button
                  onClick={() => setMobileView('wheel')}
                  className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold active:scale-95 transition cursor-pointer py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับไปหน้าวงล้อ</span>
                </button>
                <span className="text-xs text-slate-400">
                  พร้อมใช้งาน {items.filter((it) => it.enabled).length} / {items.length} ช่อง
                </span>
              </div>

              <CandidateEditor
                items={items}
                onItemsChange={setItems}
                disabled={isSpinning}
              />
            </div>
          )}

          {mobileView === 'presets' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-2">
                <button
                  onClick={() => setMobileView('wheel')}
                  className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold active:scale-95 transition cursor-pointer py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับไปหน้าวงล้อ</span>
                </button>
                <span className="text-xs text-slate-400">{presets.length} รายการโปรด</span>
              </div>

              <PresetManager
                presets={presets}
                activePresetId={activePresetId}
                currentItems={items}
                onSelectPreset={(p) => {
                  handleSelectPreset(p);
                  setMobileView('wheel');
                }}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
                onImportPresets={handleImportPresets}
                disabled={isSpinning}
              />
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* TABLET & DESKTOP WORKSPACE (md+: >= 768px): Dual Panes    */}
        {/* ========================================================= */}
        <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-12 gap-5 items-start flex-1">
          {/* LEFT: Grand Wheel Canvas Area (7 Cols on desktop, full width on tablet portrait) */}
          <div className="wheel-card-container lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md rounded-3xl border border-white/10 p-4 lg:p-6 shadow-2xl relative overflow-hidden w-full">
            {/* Auto-remove badge notice & toggle */}
            <div className="w-full flex items-center justify-between px-2 pb-2 text-xs text-slate-400">
              <button
                onClick={handleToggleAutoRemove}
                disabled={isSpinning}
                className="flex items-center gap-2 py-1 px-3 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/50 transition cursor-pointer"
                title="คลิกเพื่อสลับโหมดลบผู้ชนะออกจากวงล้ออัตโนมัติ"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.autoRemoveWinner ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="font-medium text-slate-200">
                  {settings.autoRemoveWinner
                    ? 'โหมด: ลบผู้ชนะออกจากวงล้ออัตโนมัติ (เปิดอยู่)'
                    : 'โหมด: เก็บผู้ชนะไว้ในวงล้อ (ปิดอยู่)'}
                </span>
              </button>

              <button
                onClick={handleResetCurrentWheel}
                disabled={isSpinning}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition cursor-pointer"
                title="รีเซ็ตรายชื่อกลับเป็นค่าเดิมของพรีเซ็ต"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตรายชื่อ</span>
              </button>
            </div>

            {/* Canvas Wheel Component */}
            <WheelCanvas
              items={items}
              settings={settings}
              isSpinning={isSpinning}
              onSpinStart={handleSpinStart}
              onSpinEnd={handleSpinEnd}
              canvasRefCallback={(c) => {
                wheelCanvasRef.current = c;
              }}
            />
          </div>

          {/* RIGHT: Candidate & Preset Panels (5 Cols on desktop, tabbed on tablet) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Tab switch bar */}
            <div className="flex rounded-2xl bg-slate-900/90 border border-slate-800 p-1 backdrop-blur-md shadow-lg">
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                  activeTab === 'items'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>รายชื่อ & ปรับแต่งสี ({items.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer min-h-[44px] ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>รายการโปรด ({presets.length})</span>
              </button>
            </div>

            {/* Active Tab Panel */}
            <div className="flex-1">
              {activeTab === 'items' ? (
                <CandidateEditor
                  items={items}
                  onItemsChange={setItems}
                  disabled={isSpinning}
                />
              ) : (
                <PresetManager
                  presets={presets}
                  activePresetId={activePresetId}
                  currentItems={items}
                  onSelectPreset={handleSelectPreset}
                  onSavePreset={handleSavePreset}
                  onDeletePreset={handleDeletePreset}
                  onImportPresets={handleImportPresets}
                  disabled={isSpinning}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE STICKY BOTTOM NAVIGATION DOCK (Phones < 768px)      */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/92 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around">
        {/* 1. Wheel Tab */}
        <button
          onClick={() => setMobileView('wheel')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition cursor-pointer active:scale-95 min-h-[46px] ${
            mobileView === 'wheel'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Disc3
              className={`w-5 h-5 ${
                mobileView === 'wheel'
                  ? 'text-amber-400 animate-spin [animation-duration:12s]'
                  : 'text-slate-400'
              }`}
            />
          </div>
          <span className="text-[10px] mt-0.5">วงล้อ</span>
        </button>

        {/* 2. Candidate Editor Tab */}
        <button
          onClick={() => setMobileView('items')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition cursor-pointer active:scale-95 min-h-[46px] ${
            mobileView === 'items'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <ListFilter className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-indigo-500 text-white font-bold text-[9px] min-w-[15px]">
              {items.length}
            </span>
          </div>
          <span className="text-[10px] mt-0.5">รายชื่อ</span>
        </button>

        {/* 3. Preset Favorites Tab */}
        <button
          onClick={() => setMobileView('presets')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition cursor-pointer active:scale-95 min-h-[46px] ${
            mobileView === 'presets'
              ? 'text-amber-300 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Star className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] min-w-[15px]">
              {presets.length}
            </span>
          </div>
          <span className="text-[10px] mt-0.5">พรีเซ็ต</span>
        </button>

        {/* 4. History Log Quick Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition cursor-pointer active:scale-95 min-h-[46px] text-slate-400 hover:text-slate-200"
        >
          <div className="relative">
            <History className="w-5 h-5 text-amber-400" />
            {history.length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] min-w-[15px]">
                {history.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">ประวัติ</span>
        </button>

        {/* 5. Settings Quick Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition cursor-pointer active:scale-95 min-h-[46px] text-slate-400 hover:text-slate-200"
        >
          <Settings className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] mt-0.5">ตั้งค่า</span>
        </button>
      </nav>

      {/* Winner Celebration Modal */}
      {showWinnerModal && currentWinner && (
        <WinnerModal
          winner={currentWinner}
          presetName={activePreset?.name || 'วงล้อจับรางวัล'}
          autoRemoved={lastAutoRemoved}
          soundEnabled={settings.soundEnabled}
          soundVolume={settings.soundVolume}
          confettiEnabled={settings.confettiEnabled}
          onClose={() => setShowWinnerModal(false)}
          onRestoreWinner={handleRestoreWinner}
          onRemoveWinnerManually={handleRemoveWinnerManually}
        />
      )}

      {/* Background Customizer Modal */}
      {showBgCustomizer && (
        <BackgroundCustomizer
          config={bgConfig}
          onChange={setBgConfig}
          onClose={() => setShowBgCustomizer(false)}
        />
      )}

      {/* Winner History Log Modal */}
      {showHistoryModal && (
        <WinnerHistoryModal
          history={history}
          onClose={() => setShowHistoryModal(false)}
          onClearHistory={() => {
            setHistory([]);
            if (currentUser) {
              clearUserHistoryInFirestore(currentUser.uid).catch((err) =>
                console.error('Failed to clear history in Firebase:', err)
              );
            }
          }}
          onRestoreWinner={handleRestoreWinner}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdate={(newSettings) => {
            setSettings(newSettings);
            if (currentUser) {
              saveSettingsToFirestore(currentUser.uid, newSettings).catch((err) =>
                console.error('Failed to save settings to Firebase:', err)
              );
            }
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
