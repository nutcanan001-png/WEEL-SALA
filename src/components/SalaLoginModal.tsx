import React, { useState } from 'react';
import { SALA_ACCOUNTS, SalaAccount } from '../types/wheel';
import {
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Tv,
  Radio,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SalaLoginModalProps {
  currentRoomId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLogin: (account: SalaAccount, isDisplayMode?: boolean) => void;
  onLogout: () => void;
  isDisplayMode?: boolean;
  onToggleDisplayMode?: () => void;
}

export const SalaLoginModal: React.FC<SalaLoginModalProps> = ({
  currentRoomId,
  isOpen,
  onClose,
  onLogin,
  onLogout,
  isDisplayMode = false,
  onToggleDisplayMode,
}) => {
  const [selectedUsername, setSelectedUsername] = useState<'sala1' | 'sala2' | 'sala3'>(
    (currentRoomId as 'sala1' | 'sala2' | 'sala3') || 'sala1'
  );
  const [password, setPassword] = useState('pass123456');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayModeSelected, setDisplayModeSelected] = useState(isDisplayMode);

  if (!isOpen) return null;

  const currentAccount = SALA_ACCOUNTS.find((a) => a.username === selectedUsername) || SALA_ACCOUNTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() !== currentAccount.pin) {
      setError(`รหัสผ่านไม่ถูกต้อง (รหัสผ่านคือ ${currentAccount.pin})`);
      return;
    }

    setIsSubmitting(true);
    try {
      onLogin(currentAccount, displayModeSelected);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setPassword('pass123456');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl p-5 sm:p-7 text-slate-100 flex flex-col gap-5 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-slate-800/90 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>เข้าสู่ระบบซิงค์สดทุกจอ</span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Real-Time
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              เชื่อมต่อทุกจอด้วยผู้ใช้เดียวกัน (sala1, sala2, sala3) หมุนและอัปเดตตรงกันทันที
            </p>
          </div>
        </div>

        {/* Active room status if currently connected */}
        {currentRoomId && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-slate-300">ห้องที่กำลังซิงค์อยู่: </span>
                <span className="font-bold text-emerald-300 uppercase">{currentRoomId}</span>
              </div>
            </div>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer font-medium"
            >
              ออกจากห้อง
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. Account / Sala Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>เลือกผู้ใช้งาน (User / ศาลา):</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {SALA_ACCOUNTS.map((acc) => {
                const isSelected = selectedUsername === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => {
                      setSelectedUsername(acc.username);
                      setError(null);
                    }}
                    className={`relative p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col items-center sm:items-start gap-1 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-900/60 to-slate-900 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    <span className="font-bold text-sm text-white">{acc.username}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{acc.displayName.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>รหัสผ่าน (Password):</span>
              </label>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer underline"
              >
                กรอกอัตโนมัติ (pass123456)
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="pass123456"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 3. Display / TV Projector Mode Option */}
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Tv className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-xs font-medium text-slate-200">โหมดจอแสดงผลเวที / โปรเจกเตอร์</div>
                <div className="text-[10px] text-slate-400">ซ่อนแผงตั้งค่า ขยายวงล้อใหญ่เต็มจอ เหมาะสำหรับจอหลัก</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDisplayModeSelected(!displayModeSelected)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                displayModeSelected ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  displayModeSelected ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Real-time Feature Notice */}
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 flex items-start gap-2.5 text-xs text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">ระบบ Real-Time Firebase: </span>
              เมื่ออุปกรณ์อื่น (มือถือ, แท็บเล็ต, คอม) เข้าสู่ระบบด้วย{' '}
              <strong className="text-amber-300">{selectedUsername}</strong> เดียวกัน ทุกการหมุน การเพิ่มชื่อ และผลรางวัลจะแสดงพร้อมกันทุกจอในเสี้ยววินาที!
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer active:scale-95"
            >
              <span>เข้าสู่ห้อง {selectedUsername}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
