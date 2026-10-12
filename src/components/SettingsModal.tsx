import React from 'react';
import { WheelSettings } from '../types/wheel';
import { playTickSound, playWinFanfare } from '../utils/audio';
import {
  Settings,
  Clock,
  UserX,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  settings: WheelSettings;
  onUpdate: (settings: WheelSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">การตั้งค่าวงล้อ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Spin Duration Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>ระยะเวลาหมุนวงล้อ</span>
            </span>
            <span className="font-bold text-amber-400">
              {settings.spinDuration} วินาที
            </span>
          </div>
          <p className="text-xs text-slate-400">
            ปรับความเร็วและความลุ้นระทึกก่อนวงล้อจะหยุดนิ่ง
          </p>
          <input
            type="range"
            min="3"
            max="15"
            step="1"
            value={settings.spinDuration}
            onChange={(e) =>
              onUpdate({ ...settings, spinDuration: Number(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>3 วิ (เร็ว)</span>
            <span>8 วิ (มาตรฐาน)</span>
            <span>15 วิ (ลุ้นระทึก)</span>
          </div>
        </div>

        {/* 2. Auto-Remove Winner Toggle (KEY USER REQUIREMENT!) */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <UserX className="w-4 h-4 text-rose-400" />
              <span>ลบผู้ชนะออกจากวงล้ออัตโนมัติ</span>
            </div>
            <p className="text-xs text-slate-400">
              เมื่อหมุนเสร็จ จะตัดรายชื่อผู้ชนะออกจากช่องทันที เพื่อไม่ให้สุ่มซ้ำ
              (สามารถคืนสิทธิ์ได้ในแท็บประวัติ)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={settings.autoRemoveWinner}
              onChange={(e) =>
                onUpdate({ ...settings, autoRemoveWinner: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* 3. Sound Effects Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span>เสียงประกอบ (ทำงานแบบออฟไลน์ 100%)</span>
            </span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) =>
                onUpdate({ ...settings, soundEnabled: e.target.checked })
              }
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {settings.soundEnabled && (
            <div className="pl-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>ระดับเสียง: {Math.round(settings.soundVolume * 100)}%</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => playTickSound(settings.soundVolume)}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    ทดสอบเสียงคลิก
                  </button>
                  <button
                    onClick={() => playWinFanfare(settings.soundVolume)}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    ทดสอบเสียงชนะ
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.soundVolume}
                onChange={(e) =>
                  onUpdate({ ...settings, soundVolume: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* 4. Confetti Celebrations */}
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>เอฟเฟกต์พลุกระดาษฉลองชัย (Confetti)</span>
          </span>
          <input
            type="checkbox"
            checked={settings.confettiEnabled}
            onChange={(e) =>
              onUpdate({ ...settings, confettiEnabled: e.target.checked })
            }
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* 5. Mobile & Tablet Haptic Vibration */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              <span className="text-base">📳</span>
              <span>ระบบสั่นตอบสนอง (Haptic Feedback)</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              สั่นเตือนจังหวะหมุนและเมื่อได้รับรางวัลบนมือถือและแท็บเล็ต
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.vibrationEnabled ?? true}
            onChange={(e) =>
              onUpdate({ ...settings, vibrationEnabled: e.target.checked })
            }
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm transition cursor-pointer min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>เสร็จสิ้น</span>
          </button>
        </div>
      </div>
    </div>
  );
};
